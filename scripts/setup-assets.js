// scripts/setup-assets.js
const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.join(__dirname, '..', 'public', 'assets', 'buildings');

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// 🏛️ 고전 명작 시저 3 / 에이지 오브 엠파이어 스타일 초정밀 디오라마 에셋
const SVGS = {
  // 1. 헤롯 대성전 (3x3 대성소: 3단 기단, 원통형 대리석 열주, 황금 코니스, 청동 문)
  temple: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 252 230" width="252" height="230">
    <defs>
      <linearGradient id="tMarble" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#E2D9C8"/></linearGradient>
      <linearGradient id="tShadow" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#D8C8B0"/><stop offset="100%" stop-color="#A89274"/></linearGradient>
      <linearGradient id="tGold" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#FDE68A"/><stop offset="50%" stop-color="#F59E0B"/><stop offset="100%" stop-color="#B45309"/></linearGradient>
      <linearGradient id="colGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="50%" stop-color="#F5F0E6"/><stop offset="100%" stop-color="#C7B89E"/></linearGradient>
    </defs>
    <!-- 바닥 접촉 그림자 -->
    <ellipse cx="126" cy="215" rx="105" ry="14" fill="#24140B" opacity="0.4"/>
    <!-- 1단 기단 몰딩 -->
    <polygon points="126,170 236,125 126,80 16,125" fill="url(#tMarble)" stroke="#2D1A0E" stroke-width="2.5"/>
    <polygon points="16,125 126,170 126,182 16,137" fill="#D8C8B0" stroke="#2D1A0E" stroke-width="2.5"/>
    <polygon points="126,170 236,125 236,137 126,182" fill="url(#tShadow)" stroke="#2D1A0E" stroke-width="2.5"/>
    <!-- 기단 조적선 -->
    <path d="M 40,131 L 126,166 M 70,143 L 126,166 M 126,170 L 210,135" stroke="#9C886C" stroke-width="1.2" fill="none"/>
    <!-- 2단 열주 안뜰 테라스 -->
    <polygon points="126,140 210,103 126,68 42,103" fill="url(#tMarble)" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="42,103 126,140 126,150 42,113" fill="#D8C8B0" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="126,140 210,103 210,113 126,150" fill="url(#tShadow)" stroke="#2D1A0E" stroke-width="2"/>
    <!-- 대리석 원통 열주 회랑 7개 -->
    ${[58, 80, 102, 126, 150, 172, 194].map(x => `
      <rect x="${x-4}" y="92" width="8" height="38" fill="url(#colGrad)" stroke="#2D1A0E" stroke-width="1.2" rx="2"/>
      <rect x="${x-5}" y="88" width="10" height="5" fill="url(#tGold)" stroke="#2D1A0E" stroke-width="1"/>
      <rect x="${x-5}" y="127" width="10" height="4" fill="#C7B89E" stroke="#2D1A0E" stroke-width="1"/>
    `).join('')}
    <!-- 3단 지성소 헤이칼 본관 -->
    <polygon points="78,118 174,78 174,28 78,68" fill="url(#tShadow)" stroke="#2D1A0E" stroke-width="2.5"/>
    <polygon points="78,118 78,68 126,48 126,98" fill="url(#tMarble)" stroke="#2D1A0E" stroke-width="2.5"/>
    <!-- 지성소 돌출 황금 파사드 & 코니스 -->
    <polygon points="74,68 126,46 178,25 126,12" fill="url(#tGold)" stroke="#2D1A0E" stroke-width="2.5"/>
    <polygon points="74,68 126,46 126,55 74,77" fill="#D97706" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="126,46 178,25 178,34 126,55" fill="#92400E" stroke="#2D1A0E" stroke-width="2"/>
    <!-- 니카노르 청동 대문 & 아치형 돌출 몰딩 -->
    <path d="M 94,110 L 94,82 Q 102,74 110,82 L 110,110 Z" fill="#451A03" stroke="#2D1A0E" stroke-width="2"/>
    <rect x="97" y="85" width="10" height="23" fill="#78350F" stroke="#F59E0B" stroke-width="1"/>
    <circle cx="100" cy="97" r="1.5" fill="#FBBF24"/>
    <circle cx="104" cy="97" r="1.5" fill="#FBBF24"/>
    <!-- 제단과 솟아오르는 불길 -->
    <polygon points="145,130 165,121 155,116 135,125" fill="#78350F" stroke="#2D1A0E" stroke-width="1.5"/>
    <polygon points="135,125 145,130 145,140 135,135" fill="#5C2E0B" stroke="#2D1A0E" stroke-width="1.5"/>
    <polygon points="145,130 165,121 165,131 145,140" fill="#3D1E07" stroke="#2D1A0E" stroke-width="1.5"/>
    <circle cx="150" cy="120" r="5" fill="#EF4444"/>
    <circle cx="150" cy="117" r="3" fill="#FBBF24"/>
  </svg>`,

  // 2. 골고다 언덕 (2x2 거친 층상 암반, 갈색 나무 십자가 3개, 가시관 디테일)
  golgotha: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 160" width="168" height="160">
    <defs>
      <linearGradient id="rockSun" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#78716C"/><stop offset="100%" stop-color="#44403C"/></linearGradient>
      <linearGradient id="rockShade" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#44403C"/><stop offset="100%" stop-color="#1C1917"/></linearGradient>
    </defs>
    <ellipse cx="84" cy="148" rx="74" ry="11" fill="#1C1917" opacity="0.45"/>
    <!-- 거친 암반 1단 -->
    <polygon points="84,138 158,102 142,70 84,86 20,66 8,100" fill="url(#rockSun)" stroke="#1C1917" stroke-width="2.5"/>
    <polygon points="84,138 158,102 152,112 84,146 12,108 8,100" fill="url(#rockShade)" stroke="#1C1917" stroke-width="2"/>
    <!-- 상부 암반 2단 절벽 -->
    <polygon points="84,88 144,60 84,38 24,65" fill="#A8A29E" stroke="#1C1917" stroke-width="2"/>
    <polygon points="24,65 84,88 84,98 24,75" fill="url(#rockSun)" stroke="#1C1917" stroke-width="2"/>
    <polygon points="84,88 144,60 144,70 84,98" fill="url(#rockShade)" stroke="#1C1917" stroke-width="2"/>
    <!-- 암반 크랙 균열선 -->
    <path d="M 50,75 L 68,85 L 75,80 M 105,70 L 122,82 L 135,76" stroke="#1C1917" stroke-width="1.8" fill="none"/>
    <!-- 중앙 그리스도 십자가 -->
    <rect x="81" y="8" width="7" height="60" fill="#451A03" stroke="#1C1917" stroke-width="1.8"/>
    <rect x="65" y="22" width="39" height="7" fill="#451A03" stroke="#1C1917" stroke-width="1.8"/>
    <rect x="79" y="11" width="11" height="6" fill="#FEF3C7" stroke="#1C1917" stroke-width="1.2"/>
    <!-- 좌우 강도 십자가 -->
    <rect x="49" y="32" width="5.5" height="42" fill="#5C2E0B" stroke="#1C1917" stroke-width="1.5"/>
    <rect x="38" y="41" width="28" height="5.5" fill="#5C2E0B" stroke="#1C1917" stroke-width="1.5"/>
    <rect x="113" y="32" width="5.5" height="42" fill="#5C2E0B" stroke="#1C1917" stroke-width="1.5"/>
    <rect x="102" y="41" width="28" height="5.5" fill="#5C2E0B" stroke="#1C1917" stroke-width="1.5"/>
  </svg>`,

  // 3. 주택 1단계: 베두인 유목민 텐트 (직사각형 상자 탈피: 주름진 천막 곡선, 밧줄, 모닥불)
  house_1: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 90" width="84" height="90">
    <ellipse cx="42" cy="80" rx="36" ry="6" fill="#29180C" opacity="0.35"/>
    <!-- 주름진 흑염소 털 천막 -->
    <path d="M 8,72 Q 42,12 76,72 Q 42,84 8,72 Z" fill="#452310" stroke="#24140B" stroke-width="2"/>
    <path d="M 42,14 Q 58,45 76,72 L 42,78 Z" fill="#2E170B" stroke="#24140B" stroke-width="1.5"/>
    <!-- 천막 입구 삼각 개구부 -->
    <polygon points="34,75 42,40 50,75" fill="#170B05"/>
    <!-- 버팀목 밧줄 및 말뚝 -->
    <line x1="42" y1="14" x2="4" y2="76" stroke="#24140B" stroke-width="1.5"/>
    <line x1="42" y1="14" x2="80" y2="76" stroke="#24140B" stroke-width="1.5"/>
    <circle cx="28" cy="78" r="3" fill="#EF4444"/>
    <circle cx="28" cy="76" r="1.5" fill="#FBBF24"/>
  </svg>`,

  // 4. 주택 2단계: 갈릴리 흙벽돌집 (처마 돌출, 목조 차양막, 옹기 항아리)
  house_2: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 100" width="84" height="100">
    <ellipse cx="42" cy="92" rx="36" ry="6" fill="#2D1A0E" opacity="0.35"/>
    <!-- 벽체 베이스 -->
    <polygon points="42,82 76,64 76,28 42,46" fill="#B48256" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="8,64 42,82 42,46 8,28" fill="#DDB288" stroke="#2D1A0E" stroke-width="2"/>
    <!-- 돌출 평지붕 테라스 -->
    <polygon points="42,46 79,27 42,9 5,27" fill="#EAD6BD" stroke="#2D1A0E" stroke-width="2"/>
    <!-- 옥상 목조 그늘막 -->
    <line x1="15" y1="32" x2="15" y2="15" stroke="#5C2E0B" stroke-width="2"/>
    <line x1="30" y1="38" x2="30" y2="21" stroke="#5C2E0B" stroke-width="2"/>
    <polygon points="12,16 33,23 42,17 21,10" fill="#F59E0B" stroke="#2D1A0E" stroke-width="1.5"/>
    <!-- 아치형 목재 문 & 깊이감 -->
    <path d="M 20,74 L 20,58 Q 25,52 30,58 L 30,74 Z" fill="#3D1E07" stroke="#2D1A0E" stroke-width="1.5"/>
    <!-- 벽돌 조적 텍스처 줄눈 -->
    <line x1="12" y1="42" x2="38" y2="56" stroke="#C2966C" stroke-width="1.2"/>
    <line x1="10" y1="52" x2="40" y2="67" stroke="#C2966C" stroke-width="1.2"/>
  </svg>`,

  // 5. 주택 3단계: 석회암 2층 가옥 (외벽 돌계단, 옥상 다락방, 테라스 난간)
  house_3: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 110" width="84" height="110">
    <ellipse cx="42" cy="102" rx="36" ry="6" fill="#2D1A0E" opacity="0.35"/>
    <polygon points="42,90 76,70 76,32 42,50" fill="#CBB697" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="8,70 42,90 42,50 8,32" fill="#F5E8D3" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="42,50 78,31 42,13 6,31" fill="#EADBC5" stroke="#2D1A0E" stroke-width="2"/>
    <!-- 옥상 상층 다락방 -->
    <polygon points="24,38 50,51 50,34 24,21" fill="#FFF9EE" stroke="#2D1A0E" stroke-width="1.8"/>
    <polygon points="50,51 66,42 66,25 50,34" fill="#CBB697" stroke="#2D1A0E" stroke-width="1.8"/>
    <polygon points="50,34 66,25 50,15 24,21" fill="#92400E" stroke="#2D1A0E" stroke-width="1.8"/>
    <!-- 외벽 지그재그 돌계단 -->
    <polygon points="10,72 16,75 16,68 10,65" fill="#FFF8EB" stroke="#2D1A0E" stroke-width="1"/>
    <polygon points="16,68 22,71 22,64 16,61" fill="#FFF8EB" stroke="#2D1A0E" stroke-width="1"/>
    <polygon points="22,64 28,67 28,60 22,57" fill="#FFF8EB" stroke="#2D1A0E" stroke-width="1"/>
  </svg>`,

  // 6. 주택 4단계: 테라코타 주황 기와 저택 (박공 기와지붕, 아치 창문)
  house_4: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 120" width="84" height="120">
    <defs>
      <linearGradient id="tileGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F97316"/><stop offset="100%" stop-color="#C2410C"/></linearGradient>
    </defs>
    <ellipse cx="42" cy="110" rx="36" ry="6" fill="#2D1A0E" opacity="0.35"/>
    <polygon points="42,98 76,78 76,38 42,56" fill="#CBB697" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="8,78 42,98 42,56 8,38" fill="#F5E8D3" stroke="#2D1A0E" stroke-width="2"/>
    <!-- 입체 오렌지 기와지붕 돌출 처마 -->
    <polygon points="4,40 42,62 42,32 8,14" fill="url(#tileGrad)" stroke="#2D1A0E" stroke-width="2.2"/>
    <polygon points="42,62 80,40 50,14 42,32" fill="#9A3412" stroke="#2D1A0E" stroke-width="2.2"/>
    <!-- 지붕 기와 골 줄눈 텍스처 -->
    <line x1="12" y1="21" x2="16" y2="46" stroke="#EA580C" stroke-width="1.5"/>
    <line x1="22" y1="26" x2="26" y2="51" stroke="#EA580C" stroke-width="1.5"/>
    <line x1="32" y1="31" x2="36" y2="56" stroke="#EA580C" stroke-width="1.5"/>
    <!-- 아치 창문 -->
    <rect x="20" y="68" width="8" height="11" fill="#1C1917" rx="3" stroke="#2D1A0E" stroke-width="1.2"/>
    <rect x="22" y="70" width="4" height="4" fill="#FDE68A"/>
  </svg>`,

  // 7. 주택 5단계: 헤롯식 대리석 궁정 (순백 대리석 열주, 황금 박공 지붕)
  house_5: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 130" width="84" height="130">
    <ellipse cx="42" cy="120" rx="38" ry="6" fill="#2D1A0E" opacity="0.35"/>
    <polygon points="42,106 78,86 78,42 42,62" fill="#CBD5E1" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="6,86 42,106 42,62 6,42" fill="#FFFFFF" stroke="#2D1A0E" stroke-width="2"/>
    <!-- 코린트식 대리석 기둥 2개 -->
    <rect x="12" y="65" width="6" height="34" fill="#FFFFFF" stroke="#2D1A0E" stroke-width="1.2" rx="1.5"/>
    <rect x="28" y="74" width="6" height="34" fill="#FFFFFF" stroke="#2D1A0E" stroke-width="1.2" rx="1.5"/>
    <!-- 황금 박공 지붕 & 테라코타 기와 -->
    <polygon points="2,44 42,66 42,32 8,12" fill="#EA580C" stroke="#2D1A0E" stroke-width="2.2"/>
    <polygon points="42,66 82,44 52,12 42,32" fill="#9A3412" stroke="#2D1A0E" stroke-width="2.2"/>
    <polygon points="8,44 42,64 42,54" fill="#FBBF24" stroke="#2D1A0E" stroke-width="1.5"/>
  </svg>`,

  // 8. 생명의 빵 장터 (2x2: 물결무늬 줄무늬 차양막, 빵 화덕, 나무 가판대)
  bread_market: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 150" width="168" height="150">
    <ellipse cx="84" cy="138" rx="68" ry="9" fill="#2D1A0E" opacity="0.35"/>
    <!-- 후면 베이커리 석조 가옥 -->
    <polygon points="32,74 84,100 84,58 32,32" fill="#F5E8D3" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="84,100 136,74 136,32 84,58" fill="#CBB697" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="84,58 136,32 84,10 32,32" fill="#EADBC5" stroke="#2D1A0E" stroke-width="2"/>
    <!-- 전면 목재 가판대 -->
    <polygon points="84,122 148,90 98,66 34,98" fill="#854D0E" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="34,98 84,122 84,132 34,108" fill="#5C2E0B" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="84,122 148,90 148,100 84,132" fill="#3D1E07" stroke="#2D1A0E" stroke-width="2"/>
    <!-- 목재 기둥 -->
    <line x1="44" y1="102" x2="44" y2="65" stroke="#5C2E0B" stroke-width="3"/>
    <line x1="84" y1="122" x2="84" y2="82" stroke="#5C2E0B" stroke-width="3"/>
    <line x1="138" y1="95" x2="138" y2="60" stroke="#5C2E0B" stroke-width="3"/>
    <!-- 주황 & 노랑 줄무늬 물결 차양막 -->
    <polygon points="30,48 84,74 150,42 98,20" fill="#F59E0B" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="42,54 84,74 96,68 54,48" fill="#FDE68A"/>
    <polygon points="106,63 150,42 138,36 94,57" fill="#FDE68A"/>
    <!-- 황금 빵 바구니 & 점토 화덕 -->
    <circle cx="68" cy="106" r="6" fill="#D97706" stroke="#2D1A0E" stroke-width="1.2"/>
    <circle cx="66" cy="104" r="3" fill="#FEF3C7"/>
    <circle cx="71" cy="105" r="3" fill="#FEF3C7"/>
    <ellipse cx="118" cy="90" rx="8" ry="6" fill="#78716C" stroke="#2D1A0E" stroke-width="1.5"/>
    <circle cx="118" cy="88" r="3" fill="#EF4444"/>
  </svg>`,

  // 9. 가버나움 생선전 (2x2: 파란 물결 줄무늬 차양막, 생선 궤짝)
  fish_market: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 150" width="168" height="150">
    <ellipse cx="84" cy="138" rx="68" ry="9" fill="#2D1A0E" opacity="0.35"/>
    <polygon points="32,74 84,100 84,58 32,32" fill="#F5E8D3" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="84,100 136,74 136,32 84,58" fill="#CBB697" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="84,58 136,32 84,10 32,32" fill="#EADBC5" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="84,122 148,90 98,66 34,98" fill="#854D0E" stroke="#2D1A0E" stroke-width="2"/>
    <line x1="44" y1="102" x2="44" y2="65" stroke="#5C2E0B" stroke-width="3"/>
    <line x1="84" y1="122" x2="84" y2="82" stroke="#5C2E0B" stroke-width="3"/>
    <line x1="138" y1="95" x2="138" y2="60" stroke="#5C2E0B" stroke-width="3"/>
    <!-- 푸른색 줄무늬 차양막 -->
    <polygon points="30,48 84,74 150,42 98,20" fill="#0284C7" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="42,54 84,74 96,68 54,48" fill="#7DD3FC"/>
    <polygon points="106,63 150,42 138,36 94,57" fill="#7DD3FC"/>
    <rect x="62" y="100" width="16" height="9" fill="#78350F" stroke="#2D1A0E" stroke-width="1.2"/>
    <ellipse cx="70" cy="102" rx="6" ry="2.5" fill="#38BDF8"/>
  </svg>`,

  // 10. 갈릴리 밀밭 풍차 (2x2: 원형 타워 방앗간, 대각선 풍차 날개 살, 황금 밀 이삭)
  wheat_farm: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 160" width="168" height="160">
    <ellipse cx="84" cy="146" rx="72" ry="11" fill="#2D1A0E" opacity="0.35"/>
    <!-- 황금 밀밭 이삭 고랑 -->
    ${[16, 32, 48, 64, 80].map((y, i) => `
      <path d="M ${20+i*12},${108+i*5} L ${95+i*12},${68+i*5}" stroke="#FBBF24" stroke-width="5" stroke-linecap="round"/>
    `).join('')}
    <!-- 원형 석조 풍차 탑 -->
    <polygon points="76,122 128,96 128,52 76,78" fill="#CBB697" stroke="#2D1A0E" stroke-width="2.2"/>
    <polygon points="24,96 76,122 76,78 24,52" fill="#F5E8D3" stroke="#2D1A0E" stroke-width="2.2"/>
    <!-- 고깔 테라코타 지붕 -->
    <polygon points="24,52 76,78 76,30" fill="#EA580C" stroke="#2D1A0E" stroke-width="2.2"/>
    <polygon points="76,78 128,52 76,30" fill="#9A3412" stroke="#2D1A0E" stroke-width="2.2"/>
    <!-- 풍차 4날개 격자 살 -->
    <circle cx="76" cy="54" r="5" fill="#451A03" stroke="#2D1A0E" stroke-width="1.5"/>
    <line x1="76" y1="54" x2="46" y2="28" stroke="#451A03" stroke-width="3"/>
    <line x1="76" y1="54" x2="106" y2="80" stroke="#451A03" stroke-width="3"/>
    <line x1="76" y1="54" x2="50" y2="82" stroke="#451A03" stroke-width="3"/>
    <line x1="76" y1="54" x2="102" y2="26" stroke="#451A03" stroke-width="3"/>
    <polygon points="46,28 40,38 76,54" fill="#FFFFFF" stroke="#2D1A0E" stroke-width="1"/>
    <polygon points="106,80 112,70 76,54" fill="#FFFFFF" stroke="#2D1A0E" stroke-width="1"/>
    <polygon points="50,82 60,86 76,54" fill="#FFFFFF" stroke="#2D1A0E" stroke-width="1"/>
    <polygon points="102,26 92,22 76,54" fill="#FFFFFF" stroke="#2D1A0E" stroke-width="1"/>
  </svg>`,

  // 11. 실로암 수로교 (1x1: 뚫린 석조 볼트 아치, 흐르는 푸른 물)
  aqueduct: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 96" width="84" height="96">
    <ellipse cx="42" cy="90" rx="36" ry="6" fill="#2D1A0E" opacity="0.35"/>
    <!-- 석조 기둥 2개 -->
    <rect x="8" y="38" width="13" height="48" fill="#F5E8D3" stroke="#2D1A0E" stroke-width="2"/>
    <rect x="63" y="38" width="13" height="48" fill="#CBB697" stroke="#2D1A0E" stroke-width="2"/>
    <!-- 뚫린 로마식 반원형 볼트 아치 -->
    <path d="M 21,86 L 21,52 Q 42,32 63,52 L 63,86 Z" fill="#E2D0B6" stroke="#2D1A0E" stroke-width="2"/>
    <!-- 상부 수로 홈통 -->
    <polygon points="42,20 82,39 42,58 2,39" fill="#FFF9EE" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="2,39 42,58 42,67 2,48" fill="#D8C8B0" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="42,58 82,39 82,48 42,67" fill="#CBB697" stroke="#2D1A0E" stroke-width="2"/>
    <!-- 푸른 실로암 물 -->
    <polygon points="42,24 76,39 42,54 8,39" fill="#38BDF8" stroke="#0284C7" stroke-width="1.5"/>
  </svg>`,

  // 12. 백색 회당 (2x2: 페디먼트 박공, 메노라, 4개 기둥)
  synagogue: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 156" width="168" height="156">
    <ellipse cx="84" cy="146" rx="72" ry="10" fill="#2D1A0E" opacity="0.35"/>
    <polygon points="84,136 158,100 84,64 10,100" fill="#F1F5F9" stroke="#2D1A0E" stroke-width="2.2"/>
    <polygon points="10,100 84,136 84,145 10,109" fill="#CBD5E1" stroke="#2D1A0E" stroke-width="2.2"/>
    <polygon points="84,136 158,100 158,109 84,145" fill="#94A3B8" stroke="#2D1A0E" stroke-width="2.2"/>
    <!-- 본당 벽체 -->
    <polygon points="84,110 144,82 144,38 84,66" fill="#E2E8F0" stroke="#2D1A0E" stroke-width="2.2"/>
    <polygon points="24,82 84,110 84,66 24,38" fill="#FFFFFF" stroke="#2D1A0E" stroke-width="2.2"/>
    <!-- 삼각 박공 페디먼트 -->
    <polygon points="24,38 84,66 84,22" fill="#F8FAFC" stroke="#2D1A0E" stroke-width="2.2"/>
    <polygon points="84,66 144,38 84,22" fill="#CBD5E1" stroke="#2D1A0E" stroke-width="2.2"/>
    <circle cx="84" cy="42" r="5" fill="#FBBF24" stroke="#2D1A0E" stroke-width="1.2"/>
    <!-- 대리석 기둥 4개 -->
    ${[38, 58, 110, 130].map(x => `
      <rect x="${x-3.5}" y="56" width="7" height="42" fill="#FFFFFF" stroke="#2D1A0E" stroke-width="1.4" rx="1.5"/>
    `).join('')}
  </svg>`,

  // 13. 성벽 (1x1 요새화 치벽)
  wall: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 86" width="84" height="86">
    <ellipse cx="42" cy="80" rx="36" ry="6" fill="#2D1A0E" opacity="0.35"/>
    <polygon points="42,70 78,52 78,24 42,42" fill="#94A3B8" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="6,52 42,70 42,42 6,24" fill="#CBD5E1" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="42,42 78,24 42,12 6,24" fill="#E2E8F0" stroke="#2D1A0E" stroke-width="2"/>
    <rect x="10" y="16" width="7" height="9" fill="#CBD5E1" stroke="#2D1A0E" stroke-width="1.2"/>
    <rect x="25" y="24" width="7" height="9" fill="#CBD5E1" stroke="#2D1A0E" stroke-width="1.2"/>
  </svg>`,

  // 14. 성문 (2x1 아치 철문과 붉은 깃발)
  gate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 130" width="168" height="130">
    <ellipse cx="84" cy="120" rx="72" ry="9" fill="#2D1A0E" opacity="0.35"/>
    <polygon points="84,108 152,74 152,34 84,68" fill="#64748B" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="16,74 84,108 84,68 16,34" fill="#94A3B8" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="84,68 152,34 84,18 16,34" fill="#CBD5E1" stroke="#2D1A0E" stroke-width="2"/>
    <path d="M 70,102 L 70,74 Q 84,58 98,74 L 98,102 Z" fill="#2D1A0E" stroke="#1C1917" stroke-width="2.5"/>
    <line x1="84" y1="18" x2="84" y2="2" stroke="#2D1A0E" stroke-width="2.5"/>
    <polygon points="84,2 104,7 84,12" fill="#EF4444"/>
  </svg>`,

  // 15. 안토니아 망대 (1x1 봉화대 타워)
  tower: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 116" width="84" height="116">
    <ellipse cx="42" cy="110" rx="36" ry="6" fill="#2D1A0E" opacity="0.35"/>
    <polygon points="42,98 76,80 76,28 42,46" fill="#64748B" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="8,80 42,98 42,46 8,28" fill="#94A3B8" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="42,46 76,28 42,14 8,28" fill="#CBD5E1" stroke="#2D1A0E" stroke-width="2"/>
    <ellipse cx="42" cy="14" rx="7" ry="4" fill="#451A03" stroke="#2D1A0E" stroke-width="1.5"/>
    <circle cx="42" cy="8" r="6" fill="#F59E0B"/>
    <circle cx="42" cy="7" r="3.5" fill="#EF4444"/>
  </svg>`,

  // 16. 야곱의 우물 (1x1 목재 도르래 지붕)
  well: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 86" width="84" height="86">
    <ellipse cx="42" cy="80" rx="32" ry="5.5" fill="#2D1A0E" opacity="0.35"/>
    <ellipse cx="42" cy="62" rx="16" ry="8" fill="#78716C" stroke="#2D1A0E" stroke-width="2"/>
    <ellipse cx="42" cy="62" rx="11" ry="5" fill="#0284C7"/>
    <line x1="30" y1="62" x2="42" y2="38" stroke="#5C2E0B" stroke-width="3"/>
    <line x1="54" y1="62" x2="42" y2="38" stroke="#5C2E0B" stroke-width="3"/>
    <rect x="38" y="46" width="8" height="6" fill="#78350F"/>
  </svg>`,

  // 17. 대리석 분수 (2x2 뿜어져 나오는 물)
  fountain: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 126" width="168" height="126">
    <ellipse cx="84" cy="116" rx="68" ry="9" fill="#2D1A0E" opacity="0.35"/>
    <ellipse cx="84" cy="90" rx="38" ry="18" fill="#CBD5E1" stroke="#2D1A0E" stroke-width="2.2"/>
    <ellipse cx="84" cy="90" rx="30" ry="13" fill="#38BDF8" stroke="#0284C7" stroke-width="1.5"/>
    <rect x="81" y="58" width="6" height="32" fill="#FFFFFF" stroke="#2D1A0E" stroke-width="1.5"/>
    <ellipse cx="84" cy="58" rx="12" ry="6" fill="#FFFFFF" stroke="#2D1A0E" stroke-width="1.5"/>
    <circle cx="84" cy="50" r="5" fill="#E0F2FE"/>
  </svg>`,

  // 18. 가나의 포도원 (2x2 포도 지주대와 열매)
  vineyard: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 136" width="168" height="136">
    <ellipse cx="84" cy="126" rx="68" ry="9" fill="#2D1A0E" opacity="0.35"/>
    <polygon points="84,116 148,84 84,54 20,84" fill="#C9B090" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="20,84 84,116 84,124 20,92" fill="#9C8265" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="84,116 148,84 148,92 84,124" fill="#78654B" stroke="#2D1A0E" stroke-width="2"/>
    ${[42, 68, 94, 122].map((x, i) => `
      <line x1="${x}" y1="${88-i*4}" x2="${x}" y2="${70-i*4}" stroke="#5C2E0B" stroke-width="3"/>
      <circle cx="${x}" cy="${68-i*4}" r="5.5" fill="#84CC16"/>
      <circle cx="${x-2}" cy="${75-i*4}" r="4" fill="#7E22CE"/>
      <circle cx="${x+3}" cy="${76-i*4}" r="4" fill="#9333EA"/>
    `).join('')}
  </svg>`,

  // 19. 감람산 올리브원 (2x2 맷돌 기름틀과 올리브 고목)
  olive_grove: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 136" width="168" height="136">
    <ellipse cx="84" cy="126" rx="68" ry="9" fill="#2D1A0E" opacity="0.35"/>
    <polygon points="84,116 148,84 84,54 20,84" fill="#F3E7CF" stroke="#2D1A0E" stroke-width="2"/>
    <ellipse cx="84" cy="90" rx="18" ry="9" fill="#94A3B8" stroke="#2D1A0E" stroke-width="2"/>
    <ellipse cx="84" cy="90" rx="11" ry="5.5" fill="#84CC16"/>
    <circle cx="48" cy="68" r="16" fill="#4D7C0F" stroke="#2D1A0E" stroke-width="2"/>
    <circle cx="51" cy="65" r="12" fill="#84CC16"/>
    <circle cx="122" cy="68" r="17" fill="#4D7C0F" stroke="#2D1A0E" stroke-width="2"/>
    <circle cx="125" cy="65" r="13" fill="#84CC16"/>
  </svg>`,

  // 20. 갈릴리 선착장 (2x2 목조 부두와 나룻배)
  fishery: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 136" width="168" height="136">
    <ellipse cx="84" cy="126" rx="68" ry="9" fill="#2D1A0E" opacity="0.35"/>
    <polygon points="32,84 96,116 86,121 22,89" fill="#854D0E" stroke="#2D1A0E" stroke-width="2.2"/>
    <ellipse cx="108" cy="90" rx="24" ry="12" fill="#78350F" stroke="#2D1A0E" stroke-width="2"/>
    <polygon points="108,90 108,48 130,70" fill="#FFFFFF" stroke="#2D1A0E" stroke-width="1.8"/>
    <line x1="108" y1="90" x2="108,42" stroke="#451A03" stroke-width="3"/>
  </svg>`,

  // 21. 도로 (1x1 석조 판석)
  road: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 42" width="84" height="42">
    <polygon points="42,0 84,21 42,42 0,21" fill="#D6C1A0" stroke="#E0CFB4" stroke-width="1.5"/>
    <ellipse cx="32" cy="18" rx="8" ry="4" fill="#ECE0CD" stroke="#78350F" stroke-width="0.8"/>
    <ellipse cx="50" cy="19" rx="9" ry="4.5" fill="#B59D7B" stroke="#78350F" stroke-width="0.8"/>
    <ellipse cx="40" cy="27" rx="10" ry="5" fill="#D1BD9F" stroke="#78350F" stroke-width="0.8"/>
  </svg>`,

  // 22. 다윗성 광장 (1x1 대리석 포장)
  plaza: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 42" width="84" height="42">
    <polygon points="42,0 84,21 42,42 0,21" fill="#F8FAFC" stroke="#FBBF24" stroke-width="2"/>
    <ellipse cx="42" cy="21" rx="8" ry="4" fill="#E2E8F0" stroke="#2D1A0E" stroke-width="1"/>
  </svg>`
};

// 미정의 건물 매핑
SVGS.caravan = SVGS.bread_market;
SVGS.sacrifice_market = SVGS.bread_market;
SVGS.money_changer = SVGS.bread_market;
SVGS.beatitudes = SVGS.olive_grove;
SVGS.gethsemane = SVGS.olive_grove;
SVGS.granary = SVGS.wheat_farm;

console.log('🏛️ [예루살렘 타이쿤] 28대 고대 건축물 프리미엄 디오라마 생성 시작...');
let count = 0;
for (const [key, svgStr] of Object.entries(SVGS)) {
  const filePath = path.join(TARGET_DIR, `${key}.svg`);
  fs.writeFileSync(filePath, svgStr.trim(), 'utf8');
  count++;
}
console.log(`✅ 생성 완료! 총 ${count}개 건축물이 ${TARGET_DIR} 에 업데이트되었습니다.\n`);
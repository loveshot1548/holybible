// scripts/setup-assets.js
const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.join(__dirname, '..', 'public', 'assets', 'buildings');

if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// 🏛️ 고전 명작 파라오 / 시저 3 고증 기반 정밀 벡터 디오라마 생성기
const SVGS = {
  // 1. 헤롯 대성전 (3x3 대성소)
  temple: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 252 220" width="252" height="220">
    <ellipse cx="126" cy="205" rx="100" ry="14" fill="#361F12" opacity="0.3"/>
    <!-- 1단 대리석 기단 -->
    <polygon points="126,160 230,120 126,80 22,120" fill="#FFF9EE" stroke="#361F12" stroke-width="2.5"/>
    <polygon points="22,120 126,160 126,175 22,135" fill="#EAD6BD" stroke="#361F12" stroke-width="2.5"/>
    <polygon points="126,160 230,120 230,135 126,175" fill="#D4BC98" stroke="#361F12" stroke-width="2.5"/>
    <!-- 2단 열주 안뜰 테라스 -->
    <polygon points="126,130 205,98 126,65 47,98" fill="#FFF8EB" stroke="#361F12" stroke-width="2"/>
    <polygon points="47,98 126,130 126,145 47,113" fill="#EAD6BD" stroke="#361F12" stroke-width="2"/>
    <polygon points="126,130 205,98 205,113 126,145" fill="#D4BC98" stroke="#361F12" stroke-width="2"/>
    <!-- 대리석 열주 회랑 기둥 7개 -->
    ${[65, 85, 105, 126, 147, 167, 187].map(x => `
      <rect x="${x-3}" y="85" width="6" height="35" fill="#FFFFFF" stroke="#361F12" stroke-width="1.2"/>
      <rect x="${x-4}" y="82" width="8" height="4" fill="#FBBF24" stroke="#361F12" stroke-width="1"/>
    `).join('')}
    <!-- 3단 지성소 헤이칼 본관 -->
    <polygon points="80,110 172,75 172,25 80,60" fill="#D4BC98" stroke="#361F12" stroke-width="2.5"/>
    <polygon points="80,110 80,60 126,42 126,92" fill="#FFF9EE" stroke="#361F12" stroke-width="2.5"/>
    <!-- 황금 코니스 & 파사드 -->
    <polygon points="80,60 126,42 172,25 126,15" fill="#FBBF24" stroke="#361F12" stroke-width="2.5"/>
    <polygon points="80,60 126,42 126,49 80,67" fill="#F59E0B" stroke="#361F12" stroke-width="2"/>
    <polygon points="126,42 172,25 172,32 126,49" fill="#D97706" stroke="#361F12" stroke-width="2"/>
    <!-- 니카노르 청동 대문 -->
    <rect x="98" y="70" width="14" height="22" fill="#78350F" stroke="#361F12" stroke-width="1.5" rx="3"/>
    <circle x="103" y="82" r="1.5" fill="#FBBF24"/>
    <!-- 번제단 & 불꽃 -->
    <rect x="145" y="112" width="18" height="15" fill="#5C381E" stroke="#361F12" stroke-width="1.5"/>
    <circle cx="154" cy="110" r="5" fill="#EF4444"/>
    <circle cx="154" cy="108" r="3" fill="#FBBF24"/>
  </svg>`,

  // 2. 골고다 언덕 (2x2 암반 절벽과 3개 십자가)
  golgotha: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 150" width="168" height="150">
    <ellipse cx="84" cy="138" rx="72" ry="10" fill="#361F12" opacity="0.3"/>
    <!-- 거친 암반 절벽 1단 -->
    <polygon points="84,130 155,100 135,70 84,85 25,65 10,95" fill="#57534E" stroke="#361F12" stroke-width="2.5"/>
    <!-- 상부 암반 2단 -->
    <polygon points="84,85 140,60 84,40 28,65" fill="#78716C" stroke="#361F12" stroke-width="2"/>
    <polygon points="28,65 84,85 84,95 28,75" fill="#44403C" stroke="#361F12" stroke-width="2"/>
    <polygon points="84,85 140,60 140,70 84,95" fill="#292524" stroke="#361F12" stroke-width="2"/>
    <!-- 바위 크랙 텍스처 -->
    <path d="M 60,70 L 72,82 L 80,78 M 100,65 L 115,75" stroke="#292524" stroke-width="1.5" fill="none"/>
    <!-- 중앙 그리스도 십자가 -->
    <rect x="81" y="5" width="6" height="52" fill="#78350F" stroke="#361F12" stroke-width="1.5"/>
    <rect x="67" y="16" width="34" height="6" fill="#78350F" stroke="#361F12" stroke-width="1.5"/>
    <rect x="79" y="8" width="10" height="5" fill="#FDF2E9" stroke="#361F12" stroke-width="1"/>
    <!-- 좌측 강도 십자가 -->
    <rect x="52" y="25" width="5" height="36" fill="#5C381E" stroke="#361F12" stroke-width="1.2"/>
    <rect x="42" y="32" width="24" height="5" fill="#5C381E" stroke="#361F12" stroke-width="1.2"/>
    <!-- 우측 강도 십자가 -->
    <rect x="110" y="25" width="5" height="36" fill="#5C381E" stroke="#361F12" stroke-width="1.2"/>
    <rect x="100" y="32" width="24" height="5" fill="#5C381E" stroke="#361F12" stroke-width="1.2"/>
  </svg>`,

  // 3. 실로암 수로교 (1x1 뚫린 아치 교각)
  aqueduct: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 90" width="84" height="90">
    <ellipse cx="42" cy="85" rx="36" ry="5" fill="#361F12" opacity="0.3"/>
    <!-- 좌우 석조 기둥 -->
    <rect x="10" y="35" width="12" height="45" fill="#FFF8EB" stroke="#361F12" stroke-width="2"/>
    <rect x="62" y="35" width="12" height="45" fill="#D4BC98" stroke="#361F12" stroke-width="2"/>
    <!-- 뚫린 반원형 아치 -->
    <path d="M 22,80 L 22,50 Q 42,32 62,50 L 62,80 Z" fill="#F3E7CF" stroke="#361F12" stroke-width="2"/>
    <rect x="40" y="34" width="4" height="6" fill="#D4BC98" stroke="#361F12" stroke-width="1"/>
    <!-- 상부 수로 홈통 -->
    <polygon points="42,20 80,38 42,56 4,38" fill="#FFF9EE" stroke="#361F12" stroke-width="2"/>
    <polygon points="4,38 42,56 42,64 4,46" fill="#EAD6BD" stroke="#361F12" stroke-width="2"/>
    <polygon points="42,56 80,38 80,46 42,64" fill="#D4BC98" stroke="#361F12" stroke-width="2"/>
    <!-- 찰랑이는 실로암 푸른 물 -->
    <polygon points="42,24 74,38 42,52 10,38" fill="#38BDF8" stroke="#0284C7" stroke-width="1.5"/>
  </svg>`,

  // 4. 가버나움 백색회당 (2x2 코린트식 회당)
  synagogue: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 150" width="168" height="150">
    <ellipse cx="84" cy="140" rx="70" ry="9" fill="#361F12" opacity="0.3"/>
    <!-- 1단 기단 -->
    <polygon points="84,130 155,95 84,60 13,95" fill="#F1F5F9" stroke="#361F12" stroke-width="2"/>
    <polygon points="13,95 84,130 84,138 13,103" fill="#CBD5E1" stroke="#361F12" stroke-width="2"/>
    <polygon points="84,130 155,95 155,103 84,138" fill="#94A3B8" stroke="#361F12" stroke-width="2"/>
    <!-- 회당 본당 벽체 -->
    <polygon points="84,105 140,78 140,35 84,62" fill="#E2E8F0" stroke="#361F12" stroke-width="2"/>
    <polygon points="28,78 84,105 84,62 28,35" fill="#FFFFFF" stroke="#361F12" stroke-width="2"/>
    <!-- 삼각 박공지붕 (Pediment) & 메노라 -->
    <polygon points="28,35 84,62 84,20" fill="#F8FAFC" stroke="#361F12" stroke-width="2"/>
    <polygon points="84,62 140,35 84,20" fill="#CBD5E1" stroke="#361F12" stroke-width="2"/>
    <circle cx="84" cy="38" r="4" fill="#FBBF24" stroke="#361F12" stroke-width="1"/>
    <!-- 대리석 기둥 4개 -->
    ${[40, 58, 110, 128].map(x => `
      <rect x="${x-3}" y="52" width="6" height="38" fill="#FFFFFF" stroke="#361F12" stroke-width="1.2"/>
    `).join('')}
  </svg>`,

  // 5. 생명의 빵 장터 (2x2 오픈 바자르 & 화덕)
  bread_market: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 140" width="168" height="140">
    <ellipse cx="84" cy="130" rx="65" ry="8" fill="#361F12" opacity="0.3"/>
    <!-- 후면 석조 공방 -->
    <polygon points="35,70 84,95 84,55 35,30" fill="#FFF8EB" stroke="#361F12" stroke-width="2"/>
    <polygon points="84,95 133,70 133,30 84,55" fill="#D4BC98" stroke="#361F12" stroke-width="2"/>
    <!-- 공방 평지붕 -->
    <polygon points="84,55 133,30 84,10 35,30" fill="#EAD6BD" stroke="#361F12" stroke-width="2"/>
    <!-- 전면 오픈 목조 가판대 -->
    <polygon points="84,115 145,85 96,62 35,92" fill="#854D0E" stroke="#361F12" stroke-width="1.5"/>
    <polygon points="35,92 84,115 84,124 35,101" fill="#5C381E" stroke="#361F12" stroke-width="1.5"/>
    <polygon points="84,115 145,85 145,94 84,124" fill="#451A03" stroke="#361F12" stroke-width="1.5"/>
    <!-- 목재 기둥 -->
    <line x1="45" y1="95" x2="45" y2="60" stroke="#78350F" stroke-width="2.5"/>
    <line x1="84" y1="115" x2="84" y2="78" stroke="#78350F" stroke-width="2.5"/>
    <line x1="135" y1="90" x2="135" y2="58" stroke="#78350F" stroke-width="2.5"/>
    <!-- 주황빛 물결 차양막 -->
    <polygon points="35,45 84,68 145,40 96,20" fill="#F59E0B" stroke="#361F12" stroke-width="2"/>
    <polygon points="45,50 84,68 95,62 55,45" fill="#FBBF24"/>
    <!-- 빵 바구니와 황금 보리떡 -->
    <circle cx="70" cy="100" r="5" fill="#D97706" stroke="#361F12" stroke-width="1"/>
    <circle cx="68" cy="98" r="2.5" fill="#FDE68A"/>
    <circle cx="73" cy="99" r="2.5" fill="#FDE68A"/>
    <!-- 타분 점토 화덕 -->
    <ellipse cx="115" cy="85" rx="7" ry="5" fill="#78716C" stroke="#361F12" stroke-width="1.2"/>
    <circle cx="115" cy="83" r="2.5" fill="#EF4444"/>
  </svg>`,

  // 6. 가버나움 생선전 (2x2 푸른 어물전)
  fish_market: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 140" width="168" height="140">
    <ellipse cx="84" cy="130" rx="65" ry="8" fill="#361F12" opacity="0.3"/>
    <polygon points="35,70 84,95 84,55 35,30" fill="#FFF8EB" stroke="#361F12" stroke-width="2"/>
    <polygon points="84,95 133,70 133,30 84,55" fill="#D4BC98" stroke="#361F12" stroke-width="2"/>
    <polygon points="84,55 133,30 84,10 35,30" fill="#EAD6BD" stroke="#361F12" stroke-width="2"/>
    <!-- 가판대 & 파란 줄무늬 차양막 -->
    <polygon points="84,115 145,85 96,62 35,92" fill="#854D0E" stroke="#361F12" stroke-width="1.5"/>
    <line x1="45" y1="95" x2="45" y2="60" stroke="#78350F" stroke-width="2.5"/>
    <line x1="84" y1="115" x2="84" y2="78" stroke="#78350F" stroke-width="2.5"/>
    <line x1="135" y1="90" x2="135" y2="58" stroke="#78350F" stroke-width="2.5"/>
    <polygon points="35,45 84,68 145,40 96,20" fill="#0284C7" stroke="#361F12" stroke-width="2"/>
    <polygon points="45,50 84,68 95,62 55,45" fill="#38BDF8"/>
    <!-- 생선 궤짝 -->
    <rect x="65" y="94" width="14" height="8" fill="#78350F" stroke="#361F12" stroke-width="1"/>
    <ellipse cx="72" cy="95" rx="5" ry="2" fill="#38BDF8"/>
  </svg>`,

  // 7. 갈릴리 밀밭 & 풍차 (2x2)
  wheat_farm: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 150" width="168" height="150">
    <ellipse cx="84" cy="138" rx="70" ry="10" fill="#361F12" opacity="0.3"/>
    <!-- 황금 밀밭 고랑 -->
    ${[15, 30, 45, 60, 75].map((y, i) => `
      <path d="M ${20+i*10},${100+i*5} L ${90+i*10},${60+i*5}" stroke="#FBBF24" stroke-width="4"/>
    `).join('')}
    <!-- 석조 방앗간 타워 -->
    <polygon points="75,115 125,90 125,50 75,75" fill="#D4BC98" stroke="#361F12" stroke-width="2"/>
    <polygon points="25,90 75,115 75,75 25,50" fill="#FFF8EB" stroke="#361F12" stroke-width="2"/>
    <!-- 고깔 지붕 -->
    <polygon points="25,50 75,75 75,30" fill="#ED5E34" stroke="#361F12" stroke-width="2"/>
    <polygon points="75,75 125,50 75,30" fill="#B33714" stroke="#361F12" stroke-width="2"/>
    <!-- 4날개 풍차 -->
    <circle cx="75" cy="52" r="4" fill="#78350F" stroke="#361F12" stroke-width="1.5"/>
    <line x1="75" y1="52" x2="50" y2="30" stroke="#78350F" stroke-width="3"/>
    <line x1="75" y1="52" x2="100" y2="74" stroke="#78350F" stroke-width="3"/>
    <line x1="75" y1="52" x2="52" y2="76" stroke="#78350F" stroke-width="3"/>
    <line x1="75" y1="52" x2="98" y2="28" stroke="#78350F" stroke-width="3"/>
    <polygon points="50,30 45,40 75,52" fill="#FFFFFF" stroke="#361F12" stroke-width="1"/>
    <polygon points="100,74 105,64 75,52" fill="#FFFFFF" stroke="#361F12" stroke-width="1"/>
    <polygon points="52,76 62,80 75,52" fill="#FFFFFF" stroke="#361F12" stroke-width="1"/>
    <polygon points="98,28 88,24 75,52" fill="#FFFFFF" stroke="#361F12" stroke-width="1"/>
  </svg>`,

  // 8. 주택 1단계: 베두인 유목민 텐트 (1x1)
  house_1: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 80" width="84" height="80">
    <ellipse cx="42" cy="74" rx="36" ry="5" fill="#361F12" opacity="0.3"/>
    <!-- 거친 염소털 텐트 삼각뿔 -->
    <polygon points="10,65 42,20 74,65" fill="#5C381E" stroke="#361F12" stroke-width="2"/>
    <polygon points="42,20 74,65 52,70 42,20" fill="#452310" stroke="#361F12" stroke-width="1.5"/>
    <!-- 목재 말뚝 밧줄 -->
    <line x1="42" y1="20" x2="8" y2="68" stroke="#361F12" stroke-width="1.5"/>
    <line x1="42" y1="20" x2="76" y2="68" stroke="#361F12" stroke-width="1.5"/>
    <!-- 텐트 입구 & 모닥불 -->
    <polygon points="36,65 42,35 48,65" fill="#29180C"/>
    <circle cx="28" cy="68" r="3" fill="#EF4444"/>
    <circle cx="28" cy="67" r="1.5" fill="#FBBF24"/>
  </svg>`,

  // 9. 주택 2단계: 갈릴리 흙벽돌집 (1x1)
  house_2: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 90" width="84" height="90">
    <ellipse cx="42" cy="85" rx="36" ry="5" fill="#361F12" opacity="0.3"/>
    <polygon points="42,75 75,58 75,25 42,42" fill="#D4A373" stroke="#361F12" stroke-width="2"/>
    <polygon points="9,58 42,75 42,42 9,25" fill="#F5D0A9" stroke="#361F12" stroke-width="2"/>
    <polygon points="42,42 75,25 42,10 9,25" fill="#EAD6BD" stroke="#361F12" stroke-width="2"/>
    <!-- 옥상 차양막 & 사다리 -->
    <line x1="18" y1="28" x2="18" y2="12" stroke="#78350F" stroke-width="1.5"/>
    <line x1="30" y1="34" x2="30" y2="18" stroke="#78350F" stroke-width="1.5"/>
    <polygon points="16,13 32,20 40,15 24,8" fill="#F59E0B" stroke="#361F12" stroke-width="1"/>
    <!-- 둥근 아치문 -->
    <rect x="22" y="55" width="8" height="12" fill="#451A03" rx="3"/>
  </svg>`,

  // 10. 주택 3단계: 석회암 평지붕 가옥 (1x1 외벽 계단 & 다락방)
  house_3: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 100" width="84" height="100">
    <ellipse cx="42" cy="94" rx="36" ry="5" fill="#361F12" opacity="0.3"/>
    <polygon points="42,82 76,64 76,26 42,44" fill="#D4BC98" stroke="#361F12" stroke-width="2"/>
    <polygon points="8,64 42,82 42,44 8,26" fill="#FFF8EB" stroke="#361F12" stroke-width="2"/>
    <polygon points="42,44 76,26 42,12 8,26" fill="#E4D1B8" stroke="#361F12" stroke-width="2"/>
    <!-- 옥상 다락방 -->
    <polygon points="25,35 48,46 48,32 25,20" fill="#FFF9EE" stroke="#361F12" stroke-width="1.5"/>
    <polygon points="48,46 62,38 62,24 48,32" fill="#D4BC98" stroke="#361F12" stroke-width="1.5"/>
    <polygon points="48,32 62,24 48,15 25,20" fill="#A45A17" stroke="#361F12" stroke-width="1.5"/>
    <!-- 외벽 돌계단 -->
    <polygon points="12,65 18,68 18,62 12,59" fill="#FFF8EB" stroke="#361F12" stroke-width="1"/>
    <polygon points="18,62 24,65 24,59 18,56" fill="#FFF8EB" stroke="#361F12" stroke-width="1"/>
    <polygon points="24,59 30,62 30,56 24,53" fill="#FFF8EB" stroke="#361F12" stroke-width="1"/>
  </svg>`,

  // 11. 주택 4단계: 2층 테라스 저택 (1x1 테라코타 주황 기와)
  house_4: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 110" width="84" height="110">
    <ellipse cx="42" cy="102" rx="36" ry="5" fill="#361F12" opacity="0.3"/>
    <polygon points="42,90 76,72 76,32 42,50" fill="#D4BC98" stroke="#361F12" stroke-width="2"/>
    <polygon points="8,72 42,90 42,50 8,32" fill="#FFF8EB" stroke="#361F12" stroke-width="2"/>
    <!-- 오렌지 테라코타 기와지붕 -->
    <polygon points="6,34 42,54 42,28 10,12" fill="#ED5E34" stroke="#361F12" stroke-width="2"/>
    <polygon points="42,54 78,34 50,12 42,28" fill="#B33714" stroke="#361F12" stroke-width="2"/>
    <line x1="42" y1="54" x2="42" y2="28" stroke="#FDBA74" stroke-width="2"/>
    <!-- 2층 발코니 창문 -->
    <rect x="22" y="60" width="7" height="9" fill="#2D1E12" rx="2"/>
    <rect x="23" y="62" width="5" height="5" fill="#FDE68A"/>
  </svg>`,

  // 12. 주택 5단계: 헤롯식 대리석 궁정 (1x1 순백 기둥과 황금 박공)
  house_5: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 120" width="84" height="120">
    <ellipse cx="42" cy="112" rx="38" ry="6" fill="#361F12" opacity="0.3"/>
    <polygon points="42,98 78,78 78,35 42,55" fill="#E2E8F0" stroke="#361F12" stroke-width="2"/>
    <polygon points="6,78 42,98 42,55 6,35" fill="#FFFFFF" stroke="#361F12" stroke-width="2"/>
    <!-- 전면 코린트식 대리석 기둥 -->
    <rect x="12" y="58" width="5" height="30" fill="#FFFFFF" stroke="#361F12" stroke-width="1.2"/>
    <rect x="28" y="66" width="5" height="30" fill="#FFFFFF" stroke="#361F12" stroke-width="1.2"/>
    <!-- 황금 박공 & 기와 -->
    <polygon points="4,37 42,58 42,26 8,10" fill="#ED5E34" stroke="#361F12" stroke-width="2"/>
    <polygon points="42,58 80,37 50,10 42,26" fill="#B33714" stroke="#361F12" stroke-width="2"/>
    <polygon points="8,37 42,56 42,48" fill="#FBBF24" stroke="#361F12" stroke-width="1.5"/>
  </svg>`,

  // 13. 성벽 (1x1 치벽)
  wall: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 80" width="84" height="80">
    <ellipse cx="42" cy="74" rx="36" ry="5" fill="#361F12" opacity="0.3"/>
    <polygon points="42,65 76,48 76,22 42,39" fill="#94A3B8" stroke="#361F12" stroke-width="2"/>
    <polygon points="8,48 42,65 42,39 8,22" fill="#CBD5E1" stroke="#361F12" stroke-width="2"/>
    <polygon points="42,39 76,22 42,10 8,22" fill="#E2E8F0" stroke="#361F12" stroke-width="2"/>
    <!-- 요새 톱니바퀴 흉벽 (Crenels) -->
    <rect x="12" y="14" width="6" height="8" fill="#CBD5E1" stroke="#361F12" stroke-width="1"/>
    <rect x="26" y="21" width="6" height="8" fill="#CBD5E1" stroke="#361F12" stroke-width="1"/>
  </svg>`,

  // 14. 다마스커스 성문 (2x1 요새화 문루 & 깃발)
  gate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 120" width="168" height="120">
    <ellipse cx="84" cy="110" rx="70" ry="8" fill="#361F12" opacity="0.3"/>
    <polygon points="84,100 150,68 150,30 84,62" fill="#64748B" stroke="#361F12" stroke-width="2"/>
    <polygon points="18,68 84,100 84,62 18,30" fill="#94A3B8" stroke="#361F12" stroke-width="2"/>
    <polygon points="84,62 150,30 84,15 18,30" fill="#CBD5E1" stroke="#361F12" stroke-width="2"/>
    <!-- 아치 철문 -->
    <path d="M 72,95 L 72,70 Q 84,55 96,70 L 96,95 Z" fill="#3E2723" stroke="#361F12" stroke-width="2"/>
    <!-- 깃발 -->
    <line x1="84" y1="15" x2="84" y2="0" stroke="#361F12" stroke-width="2"/>
    <polygon points="84,0 100,5 84,10" fill="#EF4444"/>
  </svg>`,

  // 15. 안토니아 망대 (1x1 봉화대 타워)
  tower: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 110" width="84" height="110">
    <ellipse cx="42" cy="104" rx="36" ry="5" fill="#361F12" opacity="0.3"/>
    <polygon points="42,92 74,75 74,25 42,42" fill="#64748B" stroke="#361F12" stroke-width="2"/>
    <polygon points="10,75 42,92 42,42 10,25" fill="#94A3B8" stroke="#361F12" stroke-width="2"/>
    <polygon points="42,42 74,25 42,12 10,25" fill="#CBD5E1" stroke="#361F12" stroke-width="2"/>
    <!-- 타오르는 봉화 불꽃 -->
    <ellipse cx="42" cy="12" rx="6" ry="4" fill="#5C381E" stroke="#361F12" stroke-width="1.5"/>
    <circle cx="42" cy="7" r="5" fill="#F59E0B"/>
    <circle cx="42" cy="6" r="3" fill="#EF4444"/>
  </svg>`,

  // 16. 야곱의 우물 (1x1)
  well: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 80" width="84" height="80">
    <ellipse cx="42" cy="74" rx="30" ry="5" fill="#361F12" opacity="0.3"/>
    <!-- 둥근 석재 우물 림 -->
    <ellipse cx="42" cy="58" rx="14" ry="7" fill="#78716C" stroke="#361F12" stroke-width="2"/>
    <ellipse cx="42" cy="58" rx="9" ry="4.5" fill="#0284C7"/>
    <!-- A자 목재 지붕 프레임 -->
    <line x1="32" y1="58" x2="42" y2="35" stroke="#78350F" stroke-width="2.5"/>
    <line x1="52" y1="58" x2="42" y2="35" stroke="#78350F" stroke-width="2.5"/>
    <rect x="39" y="44" width="6" height="5" fill="#5C381E"/>
  </svg>`,

  // 17. 대리석 분수 (2x2)
  fountain: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 120" width="168" height="120">
    <ellipse cx="84" cy="110" rx="65" ry="8" fill="#361F12" opacity="0.3"/>
    <!-- 원형 대리석 수조 -->
    <ellipse cx="84" cy="85" rx="35" ry="16" fill="#CBD5E1" stroke="#361F12" stroke-width="2"/>
    <ellipse cx="84" cy="85" rx="28" ry="12" fill="#38BDF8" stroke="#0284C7" stroke-width="1.5"/>
    <!-- 중앙 분수탑 & 뿜어져 나오는 물 -->
    <rect x="81" y="55" width="6" height="30" fill="#FFFFFF" stroke="#361F12" stroke-width="1.5"/>
    <ellipse cx="84" cy="55" rx="10" ry="5" fill="#FFFFFF" stroke="#361F12" stroke-width="1.5"/>
    <circle cx="84" cy="48" r="4" fill="#E0F2FE"/>
  </svg>`,

  // 18. 가나의 포도원 (2x2 계단식 포도밭)
  vineyard: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 130" width="168" height="130">
    <ellipse cx="84" cy="120" rx="65" ry="8" fill="#361F12" opacity="0.3"/>
    <polygon points="84,110 145,80 84,52 23,80" fill="#C9B090" stroke="#361F12" stroke-width="2"/>
    <polygon points="23,80 84,110 84,118 23,88" fill="#9C8265" stroke="#361F12" stroke-width="2"/>
    <polygon points="84,110 145,80 145,88 84,118" fill="#78654B" stroke="#361F12" stroke-width="2"/>
    <!-- 포도 지주대 4개 & 보랏빛 포도 -->
    ${[45, 70, 95, 120].map((x, i) => `
      <line x1="${x}" y1="${85-i*4}" x2="${x}" y2="${68-i*4}" stroke="#78350F" stroke-width="2.5"/>
      <circle cx="${x}" cy="${66-i*4}" r="5" fill="#84CC16"/>
      <circle cx="${x-2}" cy="${72-i*4}" r="3.5" fill="#7E22CE"/>
      <circle cx="${x+3}" cy="${73-i*4}" r="3.5" fill="#9333EA"/>
    `).join('')}
  </svg>`,

  // 19. 감람산 올리브원 (2x2 올리브 고목 & 맷돌 틀)
  olive_grove: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 130" width="168" height="130">
    <ellipse cx="84" cy="120" rx="65" ry="8" fill="#361F12" opacity="0.3"/>
    <polygon points="84,110 145,80 84,52 23,80" fill="#F3E7CF" stroke="#361F12" stroke-width="2"/>
    <!-- 원형 맷돌 기름틀 -->
    <ellipse cx="84" cy="85" rx="16" ry="8" fill="#94A3B8" stroke="#361F12" stroke-width="2"/>
    <ellipse cx="84" cy="85" rx="10" ry="5" fill="#84CC16"/>
    <!-- 올리브 고목 2그루 -->
    <circle cx="50" cy="65" r="14" fill="#4D7C0F" stroke="#361F12" stroke-width="2"/>
    <circle cx="52" cy="62" r="11" fill="#84CC16"/>
    <circle cx="120" cy="65" r="15" fill="#4D7C0F" stroke="#361F12" stroke-width="2"/>
    <circle cx="122" cy="62" r="12" fill="#84CC16"/>
  </svg>`,

  // 20. 갈릴리 어선 선착장 (2x2 나룻배와 부두)
  fishery: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 130" width="168" height="130">
    <ellipse cx="84" cy="120" rx="65" ry="8" fill="#361F12" opacity="0.3"/>
    <!-- 목조 부두 -->
    <polygon points="35,80 95,110 85,115 25,85" fill="#854D0E" stroke="#361F12" stroke-width="2"/>
    <!-- 갈릴리 목조 나룻배 -->
    <ellipse cx="105" cy="85" rx="22" ry="11" fill="#78350F" stroke="#361F12" stroke-width="2"/>
    <polygon points="105,85 105,45 125,65" fill="#FFFFFF" stroke="#361F12" stroke-width="1.5"/>
    <line x1="105" y1="85" x2="105" y2="40" stroke="#451A03" stroke-width="2.5"/>
  </svg>`,

  // 21. 도로 타일 (1x1 석조 판석)
  road: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 42" width="84" height="42">
    <polygon points="42,0 84,21 42,42 0,21" fill="#D6C1A0" stroke="#E0CFB4" stroke-width="1.5"/>
    <ellipse cx="32" cy="18" rx="8" ry="4" fill="#ECE0CD" stroke="#78350F" stroke-width="0.8"/>
    <ellipse cx="50" cy="19" rx="9" ry="4.5" fill="#B59D7B" stroke="#78350F" stroke-width="0.8"/>
    <ellipse cx="40" cy="27" rx="10" ry="5" fill="#D1BD9F" stroke="#78350F" stroke-width="0.8"/>
  </svg>`,

  // 22. 다윗성 광장 (1x1 대리석 포장)
  plaza: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 42" width="84" height="42">
    <polygon points="42,0 84,21 42,42 0,21" fill="#F8FAFC" stroke="#FBBF24" stroke-width="2"/>
    <ellipse cx="42" cy="21" rx="8" ry="4" fill="#E2E8F0" stroke="#361F12" stroke-width="1"/>
  </svg>`
};

// 미정의 건물은 가판대/성벽으로 안전 매핑
SVGS.caravan = SVGS.bread_market;
SVGS.sacrifice_market = SVGS.bread_market;
SVGS.money_changer = SVGS.bread_market;
SVGS.beatitudes = SVGS.olive_grove;
SVGS.gethsemane = SVGS.olive_grove;
SVGS.granary = SVGS.wheat_farm;

console.log('🏛️ [예루살렘 타이쿤] 28대 고대 건축물 로컬 벡터 디오라마 생성 시작...');

let count = 0;
for (const [key, svgStr] of Object.entries(SVGS)) {
  const filePath = path.join(TARGET_DIR, `${key}.svg`);
  fs.writeFileSync(filePath, svgStr.trim(), 'utf8');
  count++;
}

console.log(`✅ 생성 완료! 총 ${count}개 건축물 SVG가 ${TARGET_DIR} 에 안전하게 배치되었습니다.`);
console.log('0% 네트워크 실패, 100% 오프라인 로컬 무결성 보장!\n');
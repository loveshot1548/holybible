// src/games/jerusalem/data/quests.js

export const MATTHEW_CAMPAIGN = [
  {
    chapter: 1,
    title: '마태복음 3장: 요단강의 세례와 회개의 외침',
    verse: '마 3:16~17',
    summary: '세례 요한이 요단강에서 "회개하라 천국이 가까이 왔느니라" 외치고, 예수님께서 세례를 받으실 때 하늘이 열리고 성령이 비둘기같이 임하십니다.',
    targetDesc: '실로암 수로 2개와 야곱의 우물 1개를 건설하여 도성에 생명수를 공급하세요.',
    checkTarget: (grid) => {
      let aqua = 0; let wells = 0;
      for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
          if (grid[r][c]?.type === 'aqueduct') aqua++;
          if (grid[r][c]?.type === 'well') wells++;
        }
      }
      return aqua >= 2 && wells >= 1;
    },
    rewardShekels: 150,
    rewardFaith: 25
  },
  {
    chapter: 2,
    title: '마태복음 4장: 갈릴리 어부 제자들을 부르심',
    verse: '마 4:19',
    summary: '갈릴리 해변에서 그물을 던지던 베드로와 안드레에게 말씀하십니다: "나를 따라오라 내가 너희를 사람을 낚는 어부가 되게 하리라"',
    targetDesc: '갈릴리 선착장(2x2) 1개와 주거 구역 3채를 지어 순례자 어부들을 정착시키세요.',
    checkTarget: (grid) => {
      let boats = 0; let houses = 0;
      for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
          if (grid[r][c]?.type === 'fishery' && grid[r][c]?.isRoot) boats++;
          if (grid[r][c]?.type === 'house') houses++;
        }
      }
      return boats >= 1 && houses >= 3;
    },
    rewardShekels: 200,
    rewardFaith: 30
  },
  {
    chapter: 3,
    title: '마태복음 5~7장: 팔복산의 산상수훈 선포',
    verse: '마 5:3, 14',
    summary: '산에 올라 가르치십니다: "심령이 가난한 자는 복이 있나니 천국이 그들의 것임이요. 너희는 세상의 빛이라 산 위의 동네가 숨겨지지 못하리라"',
    targetDesc: '팔복 기도 동산(2x2) 1개와 가버나움 백색회당(2x2) 1개를 봉헌하세요.',
    checkTarget: (grid) => {
      let garden = 0; let syn = 0;
      for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
          if (grid[r][c]?.type === 'beatitudes' && grid[r][c]?.isRoot) garden++;
          if (grid[r][c]?.type === 'synagogue' && grid[r][c]?.isRoot) syn++;
        }
      }
      return garden >= 1 && syn >= 1;
    },
    rewardShekels: 260,
    rewardFaith: 35
  },
  {
    chapter: 4,
    title: '마태복음 9장: 세리 마태의 회심과 나눔의 큰 잔치',
    verse: '마 9:9, 13',
    summary: '세관에 앉은 마태를 보시고 "나를 따르라" 부르시니 따릅니다. "내가 긍휼을 원하고 제사를 원하지 아니하노라"',
    targetDesc: '나귀 캐러밴 기지(2x2) 1개와 생명의 빵 장터(2x2) 2개를 구축하여 물류를 연결하세요.',
    checkTarget: (grid) => {
      let caravan = 0; let markets = 0;
      for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
          if (grid[r][c]?.type === 'caravan' && grid[r][c]?.isRoot) caravan++;
          if (grid[r][c]?.type === 'bread_market' && grid[r][c]?.isRoot) markets++;
        }
      }
      return caravan >= 1 && markets >= 2;
    },
    rewardShekels: 320,
    rewardFaith: 35
  },
  {
    chapter: 5,
    title: '마태복음 14장: 오병이어 5천 명 급식의 대기적',
    verse: '마 14:19~20',
    summary: '떡 다섯 개와 물고기 두 마리를 축사하사 떼어 주시매 여자와 어린이 외에 오천 명이 배불리 먹고 남은 조각이 열두 바구니에 차고 넘쳤도다.',
    targetDesc: '도시 인구를 70명 이상으로 번영시키고 식량 60 이상을 비축하세요.',
    checkTarget: (grid, res) => res.population >= 70 && res.food >= 60,
    rewardShekels: 450,
    rewardFaith: 45
  },
  {
    chapter: 6,
    title: '마태복음 21장: 나귀 타고 입성 & 성전 정화',
    verse: '마 21:9, 12',
    summary: '"호산나 다윗의 자손이여 찬송하리로다 주의 이름으로 오시는 이여!" 성전에 들어가 매매하는 자들의 상을 엎으시며 거룩함을 회복하십니다.',
    targetDesc: '헤롯 제2성전(3x3)을 완공하고 도시 신앙도를 80% 이상으로 유지하세요.',
    checkTarget: (grid, res) => {
      let temple = false;
      for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
          if (grid[r][c]?.type === 'temple' && grid[r][c]?.isRoot) temple = true;
        }
      }
      return temple && res.faith >= 80;
    },
    rewardShekels: 700,
    rewardFaith: 50
  },
  {
    chapter: 7,
    title: '마태복음 28장: 빈 무덤과 부활의 대위임령',
    verse: '마 28:19~20',
    summary: '"그가 여기 계시지 않고 살아나셨느니라! 너희는 가서 모든 민족을 제자로 삼으라 내가 세상 끝날까지 너희와 항상 함께 있으리라!"',
    targetDesc: '골고다 십자가 언덕(2x2)을 세우고 도시 인구를 150명 이상으로 번영시키세요.',
    checkTarget: (grid, res) => {
      let golgotha = false;
      for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
          if (grid[r][c]?.type === 'golgotha' && grid[r][c]?.isRoot) golgotha = true;
        }
      }
      return golgotha && res.population >= 150;
    },
    rewardShekels: 1200,
    rewardFaith: 100
  }
];
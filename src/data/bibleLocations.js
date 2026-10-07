// 성경 주요 장소 GPS 좌표 및 여정 데이터
export const BIBLE_LOCATIONS = [
  {
    id: 'loc-1',
    name: '라암셋',
    subName: 'Rameses',
    coords: [31.8333, 30.7833], // [경도, 위도]
    verse: '출애굽기 12:37',
    category: '출애굽 여정',
    desc: '이스라엘 자손이 라암셋을 떠나서 숙곳에 이르니 유아 외에 보행하는 장정이 육십만 가량이요'
  },
  {
    id: 'loc-2',
    name: '숙곳',
    subName: 'Succoth',
    coords: [32.0833, 30.6333],
    verse: '출애굽기 13:20',
    category: '출애굽 여정',
    desc: '그들이 숙곳을 떠나서 광야 끝 에담에 장막을 치니'
  },
  {
    id: 'loc-3',
    name: '홍해 (마라)',
    subName: 'Red Sea / Marah',
    coords: [32.5500, 29.9167],
    verse: '출애굽기 15:23',
    category: '출애굽 여정',
    desc: '마라에 이르렀더니 그 곳 물이 써서 마시지 못하겠으므로... 여호와께서 한 나무를 가리키시니'
  },
  {
    id: 'loc-4',
    name: '시내산',
    subName: 'Mt. Sinai',
    coords: [33.9750, 28.5394],
    verse: '출애굽기 19:2',
    category: '출애굽 여정',
    desc: '시내 광야에 이르러 그 광야에 장막을 치되 이스라엘이 거기 산 앞에 장막을 치니라 (십계명)'
  },
  {
    id: 'loc-5',
    name: '예루살렘',
    subName: 'Jerusalem',
    coords: [35.2137, 31.7683],
    verse: '마태복음 21:1',
    category: '예수님 생애',
    desc: '그들이 예루살렘에 가까이 가서 감람 산 벳바게에 이르렀을 때에 예수께서 두 제자를 보내시며'
  }
];

// 출애굽 이동 경로 선 (GeoLine)
export const EXODUS_ROUTE = BIBLE_LOCATIONS.filter(l => l.category === '출애굽 여정').map(l => l.coords);
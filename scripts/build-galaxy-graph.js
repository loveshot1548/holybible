// scripts/build-galaxy-graph.js
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SERMON_PATH = path.join(PUBLIC_DIR, 'sermon_summary.json');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'data', 'bible_knowledge_galaxy.json');

if (!fs.existsSync(path.join(PUBLIC_DIR, 'data'))) {
  fs.mkdirSync(path.join(PUBLIC_DIR, 'data'), { recursive: true });
}

// 🏛️ 성경 66권 정경 분류 및 각도 배치 구역 (8대 섹터)
const CANON_SECTORS = [
  { id: 'law', name: '모세오경', color: '#38BDF8', angleStart: 0, angleEnd: 45, books: ['창세기', '출애굽기', '레위기', '민수기', '신명기'] },
  { id: 'ot_history', name: '구약 역사서', color: '#818CF8', angleStart: 45, angleEnd: 90, books: ['여호수아', '사사기', '룻기', '사무엘상', '사무엘하', '열왕기상', '열왕기하', '역대상', '역대하', '에스라', '느헤미야', '에스더'] },
  { id: 'poetry', name: '시가서', color: '#F472B6', angleStart: 90, angleEnd: 135, books: ['욥기', '시편', '잠언', '전도서', '아가'] },
  { id: 'prophets', name: '선지서', color: '#FB923C', angleStart: 135, angleEnd: 180, books: ['이사야', '예레미야', '예레미야애가', '에스겔', '다니엘', '호세아', '요엘', '아모스', '오바댜', '요나', '미가', '나훔', '하박국', '스바냐', '학개', '스가랴', '말라기'] },
  { id: 'gospels', name: '복음서 & 사도행전', color: '#34D399', angleStart: 180, angleEnd: 225, books: ['마태복음', '마가복음', '누가복음', '요한복음', '사도행전'] },
  { id: 'pauline', name: '바울서신', color: '#A78BFA', angleStart: 225, angleEnd: 270, books: ['로마서', '고린도전서', '고린도후서', '갈라디아서', '에베소서', '빌립보서', '골로새서', '데살로니가전서', '데살로니가후서', '디모데전서', '디모데후서', '디도서', '빌레몬서'] },
  { id: 'general', name: '공동서신', color: '#FBBF24', angleStart: 270, angleEnd: 315, books: ['히브리서', '야고보서', '베드로전서', '베드로후서', '요한일서', '요한이서', '요한삼서', '유다서'] },
  { id: 'prophecy_nt', name: '예언서', color: '#E879F9', angleStart: 315, angleEnd: 360, books: ['요한계시록'] }
];

// 🌟 구속사 핵심 12대 원어 성운 (외곽 4궤도에 별자리처럼 배치)
const ORIGINAL_LANGUAGE_ROOTS = [
  { id: 'root_hesed', strongs: 'H2617', original: 'חֶסֶד', label: '헤세드 (언약적 사랑)', lang: '히브리어', meaning: '인애, 자비, 변치 않는 언약적 사랑', books: ['창세기', '룻기', '시편', '호세아'], color: '#EC4899', angle: 20 },
  { id: 'root_berit', strongs: 'H1285', original: 'בְּרִית', label: '베리트 (구속 언약)', lang: '히브리어', meaning: '피로 맺은 쪼갠 고기 사이의 영원한 언약', books: ['창세기', '출애굽기', '신명기'], color: '#F43F5E', angle: 40 },
  { id: 'root_shalom', strongs: 'H7965', original: 'שָׁלוֹם', label: '샬롬 (참된 평강)', lang: '히브리어', meaning: '온전함, 결핍이 없는 하나님의 평화', books: ['민수기', '사사기', '이사야'], color: '#06B6D4', angle: 75 },
  { id: 'root_ruah', strongs: 'H7307', original: 'רוּחַ', label: '루아흐 (성령/생기)', lang: '히브리어', meaning: '바람, 호흡, 하나님의 창조적 생명 영', books: ['창세기', '에스겔', '요엘'], color: '#10B981', angle: 110 },
  { id: 'root_qadosh', strongs: 'H6918', original: 'קָדוֹשׁ', label: '카도시 (거룩/구별)', lang: '히브리어', meaning: '세속과 구별된 절대 순결과 신적 성결', books: ['레위기', '이사야', '에스겔'], color: '#F59E0B', angle: 155 },
  { id: 'root_agape', strongs: 'G26', original: 'ἀγάπη', label: '아가페 (무조건적 사랑)', lang: '헬라어', meaning: '자기희생적이고 조건 없는 신적 사랑', books: ['요한복음', '로마서', '고린도전서', '요한일서'], color: '#EF4444', angle: 195 },
  { id: 'root_charis', strongs: 'G5485', original: 'χάρις', label: '카리스 (값없는 은혜)', lang: '헬라어', meaning: '자격 없는 자에게 거저 주시는 하나님의 선물', books: ['로마서', '에베소서', '갈라디아서'], color: '#8B5CF6', angle: 230 },
  { id: 'root_pistis', strongs: 'G4102', original: 'πίστις', label: '피스티스 (구원하는 믿음)', lang: '헬라어', meaning: '그리스도께 온전히 맡기는 신뢰와 충성', books: ['로마서', '갈라디아서', '히브리서'], color: '#3B82F6', angle: 255 },
  { id: 'root_basileia', strongs: 'G932', original: 'βασιλεία', label: '바실레이아 (하나님 나라)', lang: '헬라어', meaning: '하나님의 주권적 통치와 다스림', books: ['마태복음', '마가복음', '누가복음'], color: '#10B981', angle: 285 },
  { id: 'root_stauros', strongs: 'G4716', original: 'σταυρός', label: '스타우로스 (십자가 대속)', lang: '헬라어', meaning: '화목제물이 되신 예수 그리스도의 대속 자리', books: ['마태복음', '갈라디아서', '골로새서'], color: '#E11D48', angle: 310 },
  { id: 'root_zoe', strongs: 'G2222', original: 'ζωή', label: '조에 (영원한 생명)', lang: '헬라어', meaning: '하나님께 속한 썩지 않는 부활의 생명', books: ['요한복음', '요한일서'], color: '#14B8A6', angle: 335 },
  { id: 'root_elohim', strongs: 'H430', original: 'אֱלֹהִים', label: '엘로힘 (전능하신 창조주)', lang: '히브리어', meaning: '천지만물을 말씀으로 지으신 주권자', books: ['창세기', '시편'], color: '#6366F1', angle: 355 }
];

console.log('🌌 [성경 지식 은하계] 노드-링크 세컨드 브레인 빌드 시작...');

let sermonData = { index: {}, sermons: [] };
if (fs.existsSync(SERMON_PATH)) {
  try {
    sermonData = JSON.parse(fs.readFileSync(SERMON_PATH, 'utf8'));
    console.log(`✅ 설교 아카이브 로드 성공 (인덱스 키: ${Object.keys(sermonData.index || {}).length}개)`);
  } catch (e) {
    console.warn('⚠️ sermon_summary.json 파싱 실패, 기본 템플릿으로 생성합니다.');
  }
}

const nodes = [];
const links = [];

// [궤도 0] 중심 코어: 구속사 중심축
nodes.push({
  id: 'core',
  label: '예수 그리스도 (구속사)',
  level: 0,
  radius: 0,
  angle: 0,
  size: 36,
  color: '#FFFFFF',
  type: 'core',
  desc: '성경 66권 전체가 증언하는 알파와 오메가이신 언약의 성취자'
});

// [궤도 1 & 2] 8대 정경 대분류 및 66권 성경 노드
const BOOK_NODE_MAP = {};

CANON_SECTORS.forEach((sec) => {
  const midAngle = (sec.angleStart + sec.angleEnd) / 2;
  const secNodeId = `sector_${sec.id}`;

  nodes.push({
    id: secNodeId,
    label: sec.name,
    level: 1,
    radius: 140,
    angle: midAngle,
    size: 20,
    color: sec.color,
    type: 'sector',
    desc: `${sec.name} (${sec.books.length}권)`
  });
  links.push({ source: 'core', target: secNodeId, distance: 140, color: sec.color, alpha: 0.35 });

  const bookCount = sec.books.length;
  const stepAngle = (sec.angleEnd - sec.angleStart) / (bookCount + 1);

  sec.books.forEach((bookName, bIdx) => {
    const bookAngle = sec.angleStart + stepAngle * (bIdx + 1);
    const bookNodeId = `book_${bookName}`;
    BOOK_NODE_MAP[bookName] = bookNodeId;

    nodes.push({
      id: bookNodeId,
      label: bookName,
      bookName: bookName,
      level: 2,
      radius: 260,
      angle: bookAngle,
      size: 13,
      color: sec.color,
      type: 'book',
      sector: sec.name,
      desc: `${bookName} 성경 본문`
    });
    links.push({ source: secNodeId, target: bookNodeId, distance: 120, color: sec.color, alpha: 0.25 });
  });
});

// [궤도 3] 설교 아카이브 노드
const sermonIndex = sermonData.index || {};
let sermonCount = 0;

Object.entries(sermonIndex).forEach(([refKey, sermonList]) => {
  if (!Array.isArray(sermonList) || sermonList.length === 0) return;

  const matchedBookName = Object.keys(BOOK_NODE_MAP).find(b => refKey.startsWith(b));
  const targetBookNodeId = matchedBookName ? BOOK_NODE_MAP[matchedBookName] : 'sector_gospels';
  const parentBookNode = nodes.find(n => n.id === targetBookNodeId);

  sermonList.slice(0, 3).forEach((sermon, idx) => {
    sermonCount++;
    const sermonId = `sermon_${sermonCount}`;
    const jitterAngle = (parentBookNode ? parentBookNode.angle : 0) + (idx - 1) * 3.5;
    
    nodes.push({
      id: sermonId,
      label: sermon.title || `${refKey} 강해`,
      sermonTitle: sermon.title,
      preacher: sermon.preacher || '담임목사',
      date: sermon.date || '',
      ref: refKey,
      summary: sermon.summary || sermon.oneLineSummary || '은혜의 말씀 선포',
      level: 3,
      radius: 385 + (idx % 2 === 0 ? -12 : 12),
      angle: jitterAngle,
      size: 9,
      color: '#34D399',
      type: 'sermon'
    });

    links.push({
      source: targetBookNodeId,
      target: sermonId,
      distance: 125,
      color: '#34D399',
      alpha: 0.4
    });
  });
});

// [궤도 4] 12대 원어 성운(Root Words) 노드 & 연관 성경 권별 십자 링크
ORIGINAL_LANGUAGE_ROOTS.forEach((root) => {
  const rootNodeId = root.id;

  nodes.push({
    id: rootNodeId,
    label: `${root.original} (${root.label.split(' ')[0]})`,
    original: root.original,
    strongs: root.strongs,
    lang: root.lang,
    koreanName: root.label,
    desc: root.meaning,
    level: 4,
    radius: 495,
    angle: root.angle,
    size: 20,
    color: root.color,
    type: 'original_word'
  });

  // 코어와 은은한 방사선 연결
  links.push({
    source: 'core',
    target: rootNodeId,
    distance: 495,
    color: root.color,
    alpha: 0.12,
    dashed: true
  });

  // 해당 원어가 핵심으로 쓰인 성경 권들과 상호 연결
  root.books.forEach(bName => {
    const bookNodeId = BOOK_NODE_MAP[bName];
    if (bookNodeId) {
      links.push({
        source: rootNodeId,
        target: bookNodeId,
        color: root.color,
        alpha: 0.28
      });
    }
  });
});

const galaxyData = {
  meta: {
    title: '성경 66권 & 설교 세컨드 브레인 은하계',
    generatedAt: new Date().toISOString(),
    totalNodes: nodes.length,
    totalLinks: links.length
  },
  sectors: CANON_SECTORS,
  nodes,
  links
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(galaxyData, null, 2), 'utf8');
console.log(`🎉 은하계 빌드 성공! 총 ${nodes.length}개 노드와 ${links.length}개 링크가 생성되었습니다.`);
console.log(`📁 저장 완료: ${OUTPUT_PATH}\n`);
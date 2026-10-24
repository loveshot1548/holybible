import bibleData from '../ko_ko.json'; // 경로에 맞게 수정해주세요
import React from 'react';
import { HeartIcon, BibleIcon, FireIcon, PrayingHandsIcon, SmileFaceIcon } from '../utils/icons';

export const bibles = typeof bibleData !== 'undefined' && bibleData.length > 0 ? bibleData : [{ name: "Genesis", chapters: [["태초에 하나님이 천지를 창조하시니라"]] }];

export const bookNamesKo = {"Genesis":"창세기","Exodus":"출애굽기","Leviticus":"레위기","Numbers":"민수기","Deuteronomy":"신명기","Joshua":"여호수아","Judges":"사사기","Ruth":"룻기","1 Samuel":"사무엘상","2 Samuel":"사무엘하","1 Kings":"열왕기상","2 Kings":"열왕기하","1 Chronicles":"역대상","2 Chronicles":"역대하","Ezra":"에스라","Nehemiah":"느헤미야","Esther":"에스더","Job":"욥기","Psalms":"시편","Proverbs":"잠언","Ecclesiastes":"전도서","Song of Solomon":"아가","Isaiah":"이사야","Jeremiah":"예레미야","Lamentations":"예레미야애가","Ezekiel":"에스겔","Daniel":"다니엘","Hosea":"호세아","Joel":"요엘","Amos":"아모스","Obadiah":"오바댜","Jonah":"요나","Micah":"미가","Nahum":"나훔","Habakkuk":"하박국","Zephaniah":"스바냐","Haggai":"학개","Zechariah":"스가랴","Malachi":"말라기","Matthew":"마태복음","Mark":"마가복음","Luke":"누가복음","John":"요한복음","Acts":"사도행전","Romans":"로마서","1 Corinthians":"고린도전서","2 Corinthians":"고린도후서","Galatians":"갈라디아서","Ephesians":"에베소서","Philippians":"빌립보서","Colossians":"골로새서","1 Thessalonians":"데살로니가전서","2 Thessalonians":"데살로니가후서","1 Timothy":"디모데전서","2 Timothy":"디모데후서","Titus":"디도서","Philemon":"빌레몬서","Hebrews":"히브리서","James":"야고보서","1 Peter":"베드로전서","2 Peter":"베드로후서","1 John":"요한일서","2 John":"요한이서","3 John":"요한삼서","Jude":"유다서","Revelation":"요한계시록"};

export const fallbackKoMap = {"창세기":"Genesis","출애굽기":"Exodus","레위기":"Leviticus","민수기":"Numbers","신명기":"Deuteronomy","여호수아":"Joshua","사사기":"Judges","룻기":"Ruth","사무엘상":"1 Samuel","사무엘하":"2 Samuel","열왕기상":"1 Kings","열왕기하":"2 Kings","역대상":"1 Chronicles","역대하":"2 Chronicles","에스라":"Ezra","느헤미야":"Nehemiah","에스더":"Esther","욥기":"Job","시편":"Psalms","잠언":"Proverbs","전도서":"Ecclesiastes","아가":"Song of Solomon","이사야":"Isaiah","예레미야":"Jeremiah","애":"Lamentations","에스겔":"Ezekiel","다니엘":"Daniel","호세아":"Hosea","요엘":"Joel","아모스":"Amos","옵":"Obadiah","욘":"Jonah","미가":"Micah","나훔":"Nahum","하박국":"Habakkuk","스바냐":"Zephaniah","학개":"Haggai","슥":"Zechariah","말라기":"Malachi","마태복음":"Matthew","마가복음":"Mark","눅":"Luke","요한복음":"John","사도행전":"Acts","로마서":"Romans","고전":"1 Corinthians","고후":"2 Corinthians","갈":"Galatians","엡":"Ephesians","빌":"Philippians","골":"Colossians"};

export const cuteEmojis = ['💖','✨','🔥','🌸','🌱','⭐','🎉','💡','🙏','🦋','⛪','🕊️','🍞','🍷','🌿','👼','👑','🎺','📖','🍎','🍇','🦁','🐑','🌈','☀️','☁️','☔','🍀','🌷','🎨','📝','🎵','🥰','😎','🥳','🤗','😇','🤩','💕'];

export const TESTIMONY_TEMPLATE = `1. 제목 (한 문장으로) : \n\n2. 오늘 받은 말씀 : \n\n3. 사건 (무슨 일이 있었는가?) : \n\n4. 내 죄와 우상 (왜 그렇게 반응했는가?) : \n\n5. 말씀으로 받은 깨달음 : \n\n6. 적용 (구체적으로 무엇을 순종할 일인가?) : \n\n7. 하나님이 주신 열매 : \n\n8. 감사 : `;

export const ytCards = [
  { id: 1, label: '매일 QT', title: '큐티인 / 큐티노트', q: '우리들교회 큐티인 새벽기도회', img: `https://picsum.photos/seed/yt1/400/250` },
  { id: 2, label: '맥체인 듣기', title: '맥체인 듣기', q: '부산신성교회 맥체인 성경읽기', img: `https://picsum.photos/seed/yt2/400/250` },
  { id: 3, label: '맥체인 해설', title: '맥체인 해설', q: '부산신성교회 맥체인 성경 해설', img: `https://picsum.photos/seed/yt3/400/250` },
  { id: 4, label: '1분설교', title: '1분설교', q: '김포좋은나무교회 1분설교', img: `https://picsum.photos/seed/yt4/400/250` },
  { id: 5, label: '새벽기도회', title: '새벽기도회', q: '김포좋은나무교회 새벽기도회', img: `https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=400&q=80` }
];

export const praiseChannels = [
  { id: 1, title: '예람워십', url: 'https://youtube.com/@yeramworship?si=Bq5r5TWU1oOGJ795', bg: 'https://picsum.photos/seed/tree1/400/600' },
  { id: 2, title: 'FIA', url: 'https://youtube.com/@fiaworship?si=VVyCDx805PHRVXhf', bg: 'https://picsum.photos/seed/sky2/400/600' },
  { id: 3, title: '노부부 찬양', url: 'https://youtube.com/channel/UCCW08kVjOMQg9IsFvub8oOw?si=u_dfveMGu0mfcj4q', bg: 'https://picsum.photos/seed/sea3/400/600' },
  { id: 4, title: '아가파오', url: 'https://youtube.com/@agapaoworship?si=E1RdGIIcSu-_SCK8', bg: 'https://picsum.photos/seed/star4/400/600' },
  { id: 5, title: '팀룩워십', url: 'https://youtube.com/results?search_query=%ED%8C%80%EB%A3%A9%EC%9B%8C%EC%8B%AD', bg: 'https://picsum.photos/seed/rain5/400/600' },
  { id: 6, title: '지나워십(Gina)', url: 'https://www.youtube.com/results?search_query=%EC%A7%80%EB%82%98%EC%9B%8C%EC%8B%AD+%EC%B0%AC%EC%96%91', bg: 'https://picsum.photos/seed/gina/400/600' },
  { id: 7, title: '조선찬양', url: 'https://www.youtube.com/results?search_query=%EC%A1%B0%EC%84%A0%ED%8C%94%EB%8F%84%EC%9B%8C%EC%8B%AD', bg: 'https://picsum.photos/seed/joseon/400/600' },
  { id: 8, title: '마커스워십', url: 'https://www.youtube.com/results?search_query=%EB%A7%88%EC%BB%A4%EC%8A%A4%EC%9B%8C%EC%8B%AD', bg: 'https://picsum.photos/seed/markers/400/600' },
  { id: 9, title: '위러브', url: 'https://www.youtube.com/results?search_query=%EC%9C%84%EB%9F%AC%EB%B8%8C+%EC%B0%AC%EC%96%91', bg: 'https://picsum.photos/seed/welove/400/600' },
  { id: 10, title: '제이어스', url: 'https://www.youtube.com/results?search_query=%EC%A0%9C%EC%9D%B4%EC%96%B4%EC%8A%A4+%EC%B0%AC%EC%96%91', bg: 'https://picsum.photos/seed/jus/400/600' }
];

export const checkItems = [
  { id: '감사', icon: <HeartIcon className="w-6 h-6 text-current"/> },
  { id: '성경읽기', icon: <BibleIcon className="w-6 h-6 text-current"/> },
  { id: 'QTin', icon: <FireIcon className="w-6 h-6 text-current"/> },
  { id: '기도하기', icon: <PrayingHandsIcon className="w-6 h-6 text-current"/> },
  { id: '가정예배', icon: <SmileFaceIcon className="w-6 h-6 text-current"/> }
];

// ⚠️ 기존 App.js에 있던 3개의 거대한 배열(mockInterlinearGen1_1, newYearVerseCards, familyVerseCards)을
// 이 위치에 100% 동일하게 복사해서 붙여넣어 주세요! (글자 수 제한 방지)
export const mockInterlinearGen1_1 = []; // 기존 배열 붙여넣기
export const newYearVerseCards = []; // 기존 배열 붙여넣기
export const familyVerseCards = []; // 기존 배열 붙여넣기
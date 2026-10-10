// src/pages/BibleWiki.js
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { SearchIcon } from '../components/icons';
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import ForceGraph2D from 'react-force-graph-2d';
import L from 'leaflet';

import { 
  BIBLE_ABBREV_MAP, 
  bookAnalysisData, 
  deepChronoData, 
  prophecyReportData, 
  wikiData,
  holyWeekData,
  masterCharacterDictionary 
} from '../data/bibleWikiData';

// =====================================================================
// 🏛️ [원어 성경 연구 규격] 고고학 OpenBible GPS 정밀 7대 구속사 여정 데이터셋
// =====================================================================
const COMPREHENSIVE_BIBLE_ROUTES = [
  {
    id: 'route_abraham',
    name: '아브라함의 믿음의 순례 여정',
    color: '#0284C7',
    dashArray: '6, 6',
    places: [
      { id: 'ab_1', name: '갈대아 우르', nameEn: 'Ur of the Chaldees', nameOrig: 'אוּר כַּשְׂדִּים', coords: [30.962, 46.103], region: '메소포타미아 남부', verse: '창세기 11:31', event: '주권적 소명', desc: '우상 숭배의 땅 메소포타미아에서 하나님의 일방적인 은혜로 부름을 받은 구속사의 출발점.' },
      { id: 'ab_2', name: '하란', nameEn: 'Haran', nameOrig: 'חָרָן', coords: [36.864, 39.027], region: '메소포타미아 북부', verse: '창세기 12:4', event: '데라의 죽음과 재출발', desc: '아버지 데라가 죽은 후 본토 친척 아비 집을 완전히 떠나 약속의 땅으로 발걸음을 옮긴 순종의 자리.' },
      { id: 'ab_3', name: '세겜 (모레 상수리)', nameEn: 'Shechem', nameOrig: 'שְׁכֶם', coords: [32.213, 35.281], region: '가나안 중부', verse: '창세기 12:6-7', event: '가나안 첫 단', desc: '약속의 땅에 도착하여 여호와의 나타나심을 경험하고 최초로 여호와의 이름을 부르며 단을 쌓은 성소.' },
      { id: 'ab_4', name: '벧엘과 아이 사이', nameEn: 'Bethel', nameOrig: 'בֵּית־אֵל', coords: [31.930, 35.239], region: '베냐민 산지', verse: '창세기 13:3-4', event: '언약 백성의 정체성', desc: '애굽의 실패를 딛고 돌아와 처음 단을 쌓았던 자리에서 다시금 여호와의 이름을 부르며 신앙을 회복한 곳.' },
      { id: 'ab_5', name: '헤브론 (마므레)', nameEn: 'Hebron', nameOrig: 'חֶבְרוֹן', coords: [31.532, 35.099], region: '유다 산지', verse: '창세기 13:18', event: '언약의 영구 정착지', desc: '조카 롯과 결별한 후 마므레 상수리 수풀에 거하며 막벨라 굴을 매장지로 사서 언약적 소망을 묻은 땅.' },
      { id: 'ab_6', name: '모리아 산', nameEn: 'Mt. Moriah', nameOrig: 'הַר הַמּוֹרִיָּה', coords: [31.778, 35.235], region: '예루살렘 성전산', verse: '창세기 22:2', event: '이삭 번제와 여호와 이레', desc: '독자 이삭을 번제로 바치며 부활의 신앙을 증명한 곳. 하나님이 친히 어린양(예수 그리스도)을 예비하신 십자가의 모형.' },
      { id: 'ab_7', name: '브엘세바', nameEn: 'Beersheba', nameOrig: 'בְּאֵר שֶׁבַע', coords: [31.245, 34.841], region: '네게브 광야', verse: '창세기 21:33', event: '영생하시는 하나님 경배', desc: '에셀 나무를 심고 영원하신 여호와의 이름을 부르며 평화의 언약을 체결한 신앙의 안식처.' }
    ]
  },
  {
    id: 'route_exodus',
    name: '모세의 출애굽과 광야 40년 여정',
    color: '#D97706',
    dashArray: '6, 6',
    places: [
      { id: 'ex_1', name: '라암셋', nameEn: 'Rameses', nameOrig: 'רַעְמְסֵס', coords: [30.800, 31.833], region: '애굽 고센 땅', verse: '출애굽기 12:37', event: '유월절과 출애굽', desc: '어린양의 피로 죽음의 재앙을 넘어가고 430년 노예 생활의 사슬을 끊고 행진을 시작한 구원의 출발점.' },
      { id: 'ex_2', name: '숙곳', nameEn: 'Succoth', nameOrig: 'סֻכֹּות', coords: [30.633, 32.083], region: '동부 국경지대', verse: '출애굽기 13:20', event: '첫 장막', desc: '애굽 국경을 벗어나 광야 길로 접어들며 장막을 치고 하나님의 구름기둥과 불기둥의 인도를 받기 시작한 곳.' },
      { id: 'ex_3', name: '홍해 (마라)', nameEn: 'Marah', nameOrig: 'מָרָה', coords: [29.916, 32.550], region: '수르 광야', verse: '출애굽기 15:23', event: '쓴 물의 치유', desc: '홍해 도하의 감격 직후 마주한 쓴 물 앞에서 한 나무를 던져 물을 달게 하신 치료자 여호와 라파의 계시.' },
      { id: 'ex_4', name: '엘림', nameEn: 'Elim', nameOrig: 'אֵילִם', coords: [29.317, 33.150], region: '시나이 반도', verse: '출애굽기 15:27', event: '오아시스의 쉼', desc: '물샘 열둘과 종려나무 일흔 그루가 예비된 하나님의 풍성한 위로와 안식의 오아시스.' },
      { id: 'ex_5', name: '시내산 (호렙산)', nameEn: 'Mt. Sinai', nameOrig: 'הַר סִינַי', coords: [28.539, 33.975], region: '시나이 반도 남부', verse: '출애굽기 19:2', event: '율법과 성막 수여', desc: '우레와 번개 속에 임재하신 하나님과 시내산 언약을 체결하고 십계명과 성막의 식양을 계시받은 거룩한 산.' },
      { id: 'ex_6', name: '가데스 바네아', nameEn: 'Kadesh Barnea', nameOrig: 'קָדֵשׁ בַּרְנֵעַ', coords: [30.648, 34.420], region: '바란 광야', verse: '민수기 13:26', event: '12정탐꾼과 38년 방랑', desc: '10명의 불신앙 보고로 인해 가나안 입성이 좌절되고 1세대가 광야에서 엎드러지도록 판결받은 영적 분기점.' },
      { id: 'ex_7', name: '모압 평지 (느보산)', nameEn: 'Mt. Nebo', nameOrig: 'הַר נְבוֹ', coords: [31.767, 35.725], region: '요단 동편', verse: '신명기 34:1', event: '모세의 고별과 임종', desc: '신명기 고별 설교를 마치고 약속의 땅을 바라보며 모세가 하나님의 품에 안긴 약속의 문턱.' }
    ]
  },
  {
    id: 'route_joshua',
    name: '여호수아 가나안 정복 전쟁',
    color: '#059669',
    dashArray: '5, 5',
    places: [
      { id: 'jos_1', name: '길갈', nameEn: 'Gilgal', nameOrig: 'גִּלְגָּל', coords: [31.880, 35.480], region: '요단 계곡', verse: '여호수아 5:9', event: '수치의 굴러감 & 할례', desc: '요단강을 마른 땅으로 건넌 후 12돌 기념비를 세우고 광야 세대에게 할례를 행하여 애굽의 수치를 굴려버린 진영.' },
      { id: 'jos_2', name: '여리고', nameEn: 'Jericho', nameOrig: 'יְרִיחוֹ', coords: [31.871, 35.444], region: '요단 계곡 서안', verse: '여호수아 6:20', event: '믿음의 함성과 난공불락 함락', desc: '칼과 창이 아니라 7일간 궤를 메고 행진하여 외친 믿음의 함성으로 성벽이 무너져 내린 첫 열매의 승리.' },
      { id: 'jos_3', name: '아이성', nameEn: 'Ai', nameOrig: 'הָעַי', coords: [31.917, 35.258], region: '중부 산지', verse: '여호수아 8:18', event: '아간의 죄와 회복의 승리', desc: '아간의 탐욕으로 패배했으나 죄를 도려낸 후 하나님의 복병 전략으로 온전히 정복한 거룩함의 교훈.' },
      { id: 'jos_4', name: '기브온 (아얄론)', nameEn: 'Gibeon', nameOrig: 'גִּבְעוֹן', coords: [31.848, 35.185], region: '베냐민 지파', verse: '여호수아 10:12', event: '태양이 머문 이적', desc: '아모리 5대 왕 연합군과의 전쟁에서 여호수아의 기도에 응답하사 해와 달이 하늘에 멈추어 선 기적의 전장.' },
      { id: 'jos_5', name: '하솔', nameEn: 'Hazor', nameOrig: 'חָצוֹר', coords: [33.018, 35.568], region: '갈릴리 북부', verse: '여호수아 11:10', event: '북부 동맹군 격파', desc: '북부 가나안 연합군 총사령부인 하솔을 불사르고 가나안 땅의 주요 거점을 완전히 평정한 대승의 자리.' }
    ]
  },
  {
    id: 'route_david',
    name: '다윗의 광야 도피와 왕권 확립',
    color: '#8B5CF6',
    dashArray: '4, 4',
    places: [
      { id: 'dav_1', name: '기브아', nameEn: 'Gibeah', nameOrig: 'גִּבְעָה', coords: [31.823, 35.231], region: '사울의 수도', verse: '사무엘상 19:11', event: '사울의 암살 시도 (시 59편)', desc: '사울이 다윗의 집을 지키고 죽이려 할 때 미갈의 도움으로 창문에서 탈출한 도피의 시작.' },
      { id: 'dav_2', name: '가드', nameEn: 'Gath', nameOrig: 'גַּת', coords: [31.699, 34.848], region: '블레셋 평야', verse: '사무엘상 21:13', event: '미친 체함 (시 34, 56편)', desc: '아기스 왕 앞에서 침을 수염에 흘리며 미친 체하여 죽음의 위기를 벗어난 절대 굴욕과 신뢰의 자리.' },
      { id: 'dav_3', name: '아둘람 굴', nameEn: 'Adullam Cave', nameOrig: 'מְעָרַת עֲדֻלָּם', coords: [31.650, 34.996], region: '유다 저지대 셰펠라', verse: '사무엘상 22:1', event: '환난당한 자들의 피난처 (시 57, 142편)', desc: '환난당하고 빚진 자 400명이 모여 다윗 왕국의 영적 핵심 정병으로 빚어진 은혜의 도가니.' },
      { id: 'dav_4', name: '엔게디 요새', nameEn: 'Ein Gedi', nameOrig: 'עֵין גֶּדִי', coords: [31.458, 35.388], region: '사해 서안 절벽', verse: '사무엘상 24:4', event: '사울 옷자락과 원수 사랑', desc: '굴속에 들어온 사울을 손수 죽이지 않고 하나님의 공의로운 심판에 온전히 맡긴 언약적 순종.' },
      { id: 'dav_5', name: '시글락', nameEn: 'Ziklag', nameOrig: 'צִקְלַג', coords: [31.385, 34.622], region: '네게브 남단', verse: '사무엘상 30:6', event: '아말렉 침공과 영적 회복', desc: '가족이 포로로 잡혀 백성들이 돌로 치려 할 때 하나님을 힘입고 용기를 얻어 전리품을 탈환한 반전의 땅.' },
      { id: 'dav_6', name: '헤브론', nameEn: 'Hebron', nameOrig: 'חֶבְרוֹן', coords: [31.532, 35.099], region: '유다 산지', verse: '사무엘하 2:4', event: '유다 지파의 왕 대관', desc: '사울 사후 유다 족속의 기름 부음을 받고 7년 6개월간 통치하며 통일 이스라엘의 왕도를 예비한 곳.' },
      { id: 'dav_7', name: '예루살렘 (시온산)', nameEn: 'Jerusalem', nameOrig: 'יְרוּשָׁלַיִם', coords: [31.778, 35.235], region: '유다 산지', verse: '사무엘하 5:7', event: '시온 산성 정복과 다윗 언약 (시 18, 24편)', desc: '여부스 족속의 요새를 함락하여 다윗 성으로 삼고 법궤를 안치하며 영원한 메시아 언약을 받은 수도.' }
    ]
  },
  {
    id: 'route_jesus',
    name: '예수님의 공생애 & 십자가 구속 여정',
    color: '#EF4444',
    dashArray: 'none',
    places: [
      { id: 'jes_1', name: '베들레헴', nameEn: 'Bethlehem', nameOrig: 'Βηθλεέμ', coords: [31.705, 35.207], region: '유대 산지', verse: '미가 5:2, 마태 2:1', event: '성육신 탄생', desc: '떡집이라는 이름처럼 생명의 떡으로 오사 낮고 천한 말구유에 누이신 만왕의 왕의 탄생지.' },
      { id: 'jes_2', name: '나사렛', nameEn: 'Nazareth', nameOrig: 'Ναζαρέτ', coords: [32.702, 35.298], region: '갈릴리 남부', verse: '누가복음 4:16', event: '순종의 성장과 희년 선포', desc: '가난한 목수로 순종하며 자라나사 가난한 자에게 복음을 전하는 은혜의 해를 선포하신 고향.' },
      { id: 'jes_3', name: '요단강 세례터 (베다니)', nameEn: 'Bethabara / Jordan', nameOrig: 'Βηθαβαρά', coords: [31.838, 35.546], region: '요단강 하류', verse: '마태복음 3:16', event: '세례와 삼위일체 임재', desc: '모든 의를 이루기 위해 세례를 받으실 때 하늘이 열리고 성령이 비둘기처럼 임하신 공생애의 시작.' },
      { id: 'jes_4', name: '가나', nameEn: 'Cana', nameOrig: 'Κανᾶ', coords: [32.747, 35.339], region: '갈릴리 중부', verse: '요한복음 2:11', event: '물로 포도주를 만드신 첫 표적', desc: '혼인 잔치에서 물을 포도주로 바꾸어 장차 어린양의 혼인 잔치에서 완성될 구원의 기쁨을 계시하신 곳.' },
      { id: 'jes_5', name: '가버나움', nameEn: 'Capernaum', nameOrig: 'Καπερναούμ', coords: [32.880, 35.575], region: '갈릴리 호수 북안', verse: '마태복음 4:13', event: '공생애 사역의 본부', desc: '수많은 병자를 고치시고 천국 복음을 전파하사 흑암에 앉은 백성에게 큰 빛으로 비취신 갈릴리 사역의 중심지.' },
      { id: 'jes_6', name: '수가성 (야곱의 우물)', nameEn: 'Sychar', nameOrig: 'Συχάρ', coords: [32.210, 35.284], region: '사마리아', verse: '요한복음 4:14', event: '사마리아 여인과 생수', desc: '버림받은 사마리아 여인에게 영원히 목마르지 않는 영생의 생수를 주사 참된 영과 진리의 예배자로 회복시키신 곳.' },
      { id: 'jes_7', name: '겟세마네 동산', nameEn: 'Gethsemane', nameOrig: 'Γεθσημανῆ', coords: [31.779, 35.240], region: '감람산 기슭', verse: '마태복음 26:39', event: '피땀 어린 순종의 기도', desc: '기름 짜는 틀이라는 뜻처럼 땀방울이 핏방울이 되도록 \"내 뜻대로 마옵시고 아버지의 원대로 하옵소서\" 기도하신 곳.' },
      { id: 'jes_8', name: '골고다 (갈보리 언덕)', nameEn: 'Golgotha', nameOrig: 'Γολγοθᾶ', coords: [31.778, 35.229], region: '예루살렘 성벽 밖', verse: '요한복음 19:30', event: '십자가 대속과 \"다 이루었다\"', desc: '인류의 모든 죄악을 짊어지시고 피 흘려 죽으심으로 구속 언약을 단번에 영원히 완성하신 구원의 심장.' }
    ]
  },
  {
    id: 'route_paul',
    name: '사도 바울의 복음 전도 & 로마 압송 항해',
    color: '#0284C7',
    dashArray: '4, 4',
    places: [
      { id: 'pl_1', name: '다메섹', nameEn: 'Damascus', nameOrig: 'Δαμασκός', coords: [33.513, 36.292], region: '수리아', verse: '사도행전 9:3', event: '부활의 주님과의 직면', desc: '그리스도인들을 체포하러 가던 중 하늘의 강렬한 빛 속에 부활하신 예수님을 만나 이방인의 사도로 회심한 곳.' },
      { id: 'pl_2', name: '수리아 안디옥', nameEn: 'Antioch', nameOrig: 'Ἀντιόχεια', coords: [36.202, 36.160], region: '수리아 북부', verse: '사도행전 11:26', event: '이방 선교의 전초기지', desc: '성도들이 비로소 \'그리스도인\'이라 일컬음을 받고 바울과 바나바를 세계 최초의 선교사로 파송한 모교회.' },
      { id: 'pl_3', name: '에베소', nameEn: 'Ephesus', nameOrig: 'Ἔφεσος', coords: [37.940, 27.341], region: '소아시아 서안', verse: '사도행전 19:10', event: '두란노 서원과 아시아의 부흥', desc: '2년 동안 날마다 두란노 서원에서 말씀을 강론하여 온 아시아에 주의 말씀이 흥왕하게 만든 전도 거점.' },
      { id: 'pl_4', name: '빌립보', nameEn: 'Philippi', nameOrig: 'Φίλιπποι', coords: [41.013, 24.286], region: '마게도냐', verse: '사도행전 16:14', event: '유럽 선교의 첫 성문', desc: '루디아의 회심과 감옥 터진 이적 속에서 \"주 예수를 믿으라 그리하면 너와 네 집이 구원을 받으리라\" 선포된 유럽의 관문.' },
      { id: 'pl_5', name: '아테네 (아레오바고)', nameEn: 'Athens', nameOrig: 'Ἀθῆναι', coords: [37.974, 23.725], region: '아가야', verse: '사도행전 17:22', event: '알지 못하는 신과 부활 변증', desc: '철학의 중심지에서 우상 숭배를 파하고 천지만물의 주재이신 하나님과 예수 그리스도의 부활을 논증한 현장.' },
      { id: 'pl_6', name: '로마', nameEn: 'Rome', nameOrig: 'Ῥώμη', coords: [41.902, 12.496], region: '이탈리아 제국 수도', verse: '사도행전 28:31', event: '셋집에서의 담대한 하나님 나라 전파', desc: '쇠사슬에 매인 몸이었으나 거침없이 담대하게 하나님 나라를 전파하며 복음이 땅끝까지 행진하도록 마감한 성도의 무대.' }
    ]
  }
];

const Icons = {
  Book: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
  Tree: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>,
  Star: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>,
  Leaf: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" /></svg>,
  Network: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>,
  Map: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.705V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>,
  Pin: (props) => <svg fill="currentColor" viewBox="0 0 24 24" {...props}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" /></svg>,
  ChevronRight: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>,
  ArrowDown: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" /></svg>,
  ArrowRight: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5-7.5M21 12H3" /></svg>,
  SearchRef: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.773 4.773zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Person: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
  Menu: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>,
  Back: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
};

const getVersesFromQuery = (query, bibles) => {
  const results = [];
  if (!query || !bibles) return [{ ref: query, text: '데이터를 불러올 수 없습니다.' }];
  const cleanQuery = query.replace(/\([^)]+\)/g, '').trim();
  const parts = cleanQuery.split(',').map(s => s.trim());
  let currentBook = '';
  let currentChap = 0;

  parts.forEach(part => {
    const match = part.match(/^([가-힣1-2]+)?\s*(?:(\d+)(?:장|:))?\s*(\d+)?(?:(?:\s*-\s*|~)(\d+))?(?:절)?$/);
    if (match) {
      const parsedBook = match[1]; 
      const parsedChap = match[2]; 
      const parsedVerseStart = match[3]; 
      const parsedVerseEnd = match[4]; 

      if (parsedBook) currentBook = parsedBook;
      let c, vStart, vEnd;

      if (parsedChap && parsedVerseStart) {
        currentChap = parseInt(parsedChap); c = currentChap; vStart = parseInt(parsedVerseStart); vEnd = parsedVerseEnd ? parseInt(parsedVerseEnd) : vStart;
      } else if (!parsedChap && parsedVerseStart && currentChap) {
        c = currentChap; vStart = parseInt(parsedVerseStart); vEnd = parsedVerseEnd ? parseInt(parsedVerseEnd) : vStart;
      } else if (parsedChap && !parsedVerseStart) {
        currentChap = parseInt(parsedChap); c = currentChap; vStart = 1; vEnd = 1; 
      }

      if (currentBook && c && vStart) {
        const engBook = BIBLE_ABBREV_MAP[currentBook] || currentBook;
        const bObj = bibles.find(b => b.name === engBook);
        if (bObj && bObj.chapters && bObj.chapters[c - 1]) {
          for (let v = vStart; v <= (vEnd || vStart); v++) {
            const txt = bObj.chapters[c - 1][v - 1];
            if (txt) {
              let cTxt = typeof txt === 'object' ? (txt.text || txt.content) : txt;
              results.push({ ref: `${currentBook} ${c}:${v}`, text: cTxt.replace(/ |'/g, "'").replace(/"/g, '"') });
            }
          }
        }
      }
    }
  });
  return results.length > 0 ? results : [{ ref: query, text: '본문을 불러오지 못했습니다. 앱 내 성경을 확인해주세요.' }];
};

// 🌟 고해상도 벡터 핀 마커 (원어 성경 연구 스타일)
const createPinIcon = (isActive, indexStr) => L.divIcon({
  className: 'custom-pin-icon',
  html: `<div style="
           background: ${isActive ? '#EF4444' : '#0284C7'};
           color: #FFFFFF;
           border: 2.5px solid #FFFFFF;
           box-shadow: 0 4px 12px rgba(0,0,0,0.35);
           border-radius: 50%;
           width: ${isActive ? '32px' : '26px'};
           height: ${isActive ? '32px' : '26px'};
           display: flex;
           align-items: center;
           justify-content: center;
           font-size: ${isActive ? '12px' : '10px'};
           font-weight: 900;
           transform: translate(-50%, -50%);
           transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
         ">
           ${indexStr || '📍'}
         </div>`,
  iconSize: [0, 0], iconAnchor: [0, 0]
});

function MapController({ selectedLoc, positions }) {
  const map = useMap();
  useEffect(() => {
    if (selectedLoc) {
      map.flyTo(selectedLoc.coords, 9, { duration: 1.2 });
    } else if (positions && positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 7, animate: true, duration: 1.0 });
    }
    const timer = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(timer);
  }, [map, selectedLoc, positions]);
  return null;
}

const typeColors = {
  "인물": { bg: "#0284C7", text: "#E0F2FE" }, 
  "사건": { bg: "#0369A1", text: "#E0F2FE" }, 
  "신": { bg: "#0ea5e9", text: "#F0F9FF" }, 
  "사물": { bg: "#38BDF8", text: "#F0F9FF" }
};

export default function BibleWiki({
  wikiSearchTerm, setWikiSearchTerm, bibles, getKoName, setActiveScreen,
  isDarkMode, t, isSidebarOpen, setIsSidebarOpen
}) {
  const [activeTab, setActiveTab] = useState('analysis');
  const [expandedChrono, setExpandedChrono] = useState('era_1');
  const [expandedProphecySec, setExpandedProphecySec] = useState(0); 
  const [popupVerseData, setPopupVerseData] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedAnalysisBook, setSelectedAnalysisBook] = useState('Pentateuch');
  
  const activeBookData = bookAnalysisData[selectedAnalysisBook];
  const graphRef = useRef();
  const graphContainerRef = useRef(null);
  const [graphSize, setGraphSize] = useState({ width: window.innerWidth || 800, height: 600 });
  
  // 🌟 고도화된 지도 상태 (타일 모드: 'satellite' | 'topo' | 'osm')
  const [mapTileType, setMapTileType] = useState('satellite'); 
  const [activeRouteId, setActiveRouteId] = useState('route_abraham');
  const [mapSearch, setMapSearch] = useState('');
  const [selectedLoc, setSelectedLoc] = useState(null);

  useEffect(() => {
    if (activeTab === 'network' && graphContainerRef.current) {
      const observer = new ResizeObserver((entries) => {
        if (entries[0]) setGraphSize({ width: entries[0].contentRect.width, height: 600 });
      });
      observer.observe(graphContainerRef.current);
      return () => observer.disconnect();
    }
  }, [activeTab]);

  const cleanTerm = (wikiSearchTerm || '').replace(/\s+/g, '').toLowerCase();

  const filteredChronoData = useMemo(() => {
    if (!cleanTerm) return deepChronoData;
    return deepChronoData.filter(era => 
      era.title.toLowerCase().includes(cleanTerm) ||
      era.scope.toLowerCase().includes(cleanTerm) ||
      era.summary.toLowerCase().includes(cleanTerm) ||
      era.figures.some(f => f.toLowerCase().includes(cleanTerm)) ||
      era.events.some(e => e.name.toLowerCase().includes(cleanTerm) || e.refs.toLowerCase().includes(cleanTerm))
    );
  }, [cleanTerm]);

  // 🌟 구속사 7대 이동 경로 결합 및 실시간 검색 필터
  const allRoutesList = useMemo(() => {
    const base = COMPREHENSIVE_BIBLE_ROUTES;
    const additional = (wikiData && wikiData.mapRoutes) ? wikiData.mapRoutes : [];
    const merged = [...base];
    additional.forEach(ar => {
      if (!merged.some(m => m.id === ar.id)) merged.push(ar);
    });
    return merged;
  }, []);

  const activeRoute = useMemo(() => {
    return allRoutesList.find(r => r.id === activeRouteId) || allRoutesList[0];
  }, [allRoutesList, activeRouteId]);

  const displayRoutes = useMemo(() => {
    const term = mapSearch.replace(/\s+/g, '').toLowerCase() || cleanTerm;
    if (!term) return allRoutesList;
    return allRoutesList.map(route => {
      const filteredPlaces = route.places.filter(p => 
        p.name.replace(/\s+/g, '').toLowerCase().includes(term) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(term)) ||
        (p.region && p.region.toLowerCase().includes(term)) ||
        (p.event && p.event.toLowerCase().includes(term))
      );
      return { ...route, places: filteredPlaces };
    }).filter(route => route.places.length > 0);
  }, [allRoutesList, cleanTerm, mapSearch]);
  
  const mapPositions = useMemo(() => {
    if (activeRoute && activeRoute.places) {
      return activeRoute.places.map(p => p.coords);
    }
    return allRoutesList.flatMap(r => r.places.map(p => p.coords));
  }, [allRoutesList, activeRoute]);

  const displayGraph = useMemo(() => {
    const nodes = wikiData.network.nodes.map(n => {
      if (n.id === '예수 그리스도') {
        return { ...n, fx: 0, fy: 0, val: 20 };
      }
      return { ...n, val: 5 };
    });

    const nodeIds = new Set(nodes.map(n => n.id));
    const links = wikiData.network.links
      .filter(l => {
        const srcId = typeof l.source === 'object' ? l.source.id : l.source;
        const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
        return nodeIds.has(srcId) && nodeIds.has(tgtId);
      })
      .map(l => ({ ...l }));

    return { nodes, links };
  }, []);

  const handleNodeClick = useCallback((node) => {
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(3, 1000);
    }
    
    const charData = masterCharacterDictionary ? masterCharacterDictionary[node.id] : null;

    if (charData) {
       setSelectedCharacter({ name: node.id, group: node.group || '상세 정보', data: charData });
    } else {
       setSelectedCharacter({ name: node.id, group: node.group || '상세 정보', data: "상세 설명, 해석 및 사역 내역이 아직 등록되지 않은 항목입니다." });
    }
  }, []);

  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;
  const bgBody = isDark ? 'bg-[#0B1120]' : 'bg-[#F4F7FB]';
  const textMainStyle = isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]';
  const textSubStyle = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';
  
  const glassCard = isDark 
    ? 'bg-[#111827]/95 border border-[#1E293B] shadow-[0_4px_12px_rgba(0,0,0,0.15)] backdrop-blur-md rounded-[20px]' 
    : 'bg-white/95 border border-[#E2E8F0] shadow-[0_4px_15px_rgba(149,157,165,0.08)] backdrop-blur-md rounded-[20px]';
  const bgSubCard = isDark ? 'bg-[#0F172A]/90 border border-[#1E293B]' : 'bg-[#F8FAFC]/90 border border-[#E2E8F0]';
  const inputBgStyle = isDark 
    ? 'bg-[#0B1120] border border-[#1E293B] text-[#F8FAFC] focus:border-[#38BDF8] outline-none placeholder:text-[#475569]' 
    : 'bg-white border border-[#E2E8F0] text-[#0F172A] focus:border-[#38BDF8] outline-none placeholder:text-[#94A3B8]';
  const borderStyle = isDark ? 'border-[#1E293B]' : 'border-[#E2E8F0]';

  const bgAccentSoft = isDark ? 'bg-[#1E293B] text-[#38BDF8]' : 'bg-[#F0F9FF] text-[#0284C7]';
  const bgAccentFresh = isDark ? 'bg-[#0284C7] text-white hover:bg-[#0369A1]' : 'bg-[#38BDF8] text-white hover:bg-[#0284C7]';

  return (
    <div className={`flex-1 flex flex-col h-full ${bgBody} pointer-events-auto relative overflow-hidden font-sans`}>
      
      {/* S-Curve 레이어 배경 */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <svg className="absolute top-0 left-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path d="M0,0 L100,0 L100,35 C75,55 25,15 0,40 Z" className={`transition-colors duration-700 ${isDarkMode ? 'fill-[#17223B]' : 'fill-[#EBF3F8]'}`} />
            <path d="M0,40 C25,15 75,55 100,35 L100,65 C60,85 30,45 0,70 Z" className={`transition-colors duration-700 ${isDarkMode ? 'fill-[#101828]' : 'fill-[#F0F6F9]'}`} />
            <path d="M0,70 C30,45 60,85 100,65 L100,100 L0,100 Z" className={`transition-colors duration-700 ${isDarkMode ? 'fill-[#0B1120]' : 'fill-[#F4F7FB]'}`} />
          </svg>
      </div>

      {/* 상단 글로벌 헤더 */}
      <div className={`px-3 sm:px-6 py-3 backdrop-blur-md border-b ${borderStyle} sticky top-0 z-[100] flex items-center gap-3 bg-transparent`}>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-[12px] transition-colors border shadow-sm ${isDark ? 'bg-[#111827]/90 border-[#1E293B] text-[#F8FAFC] hover:bg-[#1E293B]' : 'bg-white/90 border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]'}`}><Icons.Menu className="w-5 h-5"/></button>
        <button onClick={() => setActiveScreen('home')} className={`p-2 rounded-[12px] transition-colors border shadow-sm ${isDark ? 'bg-[#111827]/90 border-[#1E293B] text-[#F8FAFC] hover:bg-[#1E293B]' : 'bg-white/90 border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]'}`}><Icons.Back className="w-5 h-5"/></button>
        <div className="flex-1"><h1 className={`text-[15px] sm:text-[16px] font-bold ${textMainStyle} tracking-tight`}>성경 위키</h1></div>
      </div>

      {/* 검색 바 */}
      <div className={`px-3 sm:px-6 py-2.5 backdrop-blur-md z-50 flex items-center gap-2 bg-transparent`}>
        <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-[12px] border transition-colors ${inputBgStyle}`}>
          <Icons.SearchRef className={`w-4 h-4 ${textSubStyle} shrink-0`} />
          <input 
            type="text" 
            value={wikiSearchTerm || ''} 
            onChange={(e) => setWikiSearchTerm && setWikiSearchTerm(e.target.value)}
            placeholder="위키 전체 검색..." 
            className={`w-full bg-transparent text-[13px] sm:text-[14px] outline-none ${textMainStyle} placeholder:${textSubStyle} font-medium`}
          />
          {wikiSearchTerm && (
            <button onClick={() => setWikiSearchTerm && setWikiSearchTerm('')} className={`text-xs font-bold ${textSubStyle} hover:${textMainStyle} px-1`}>✕</button>
          )}
        </div>
      </div>

      {/* 상단 6대 탭 바 */}
      <div className={`flex overflow-x-auto hide-scrollbar px-3 sm:px-6 pt-2 pb-2.5 z-40 border-b ${borderStyle} bg-transparent`}>
        {[
          { id: 'analysis', label: '성경 분석', icon: <Icons.Book className="w-4 h-4 mr-1.5" /> },
          { id: 'chrono', label: '심층 연대기', icon: <Icons.Tree className="w-4 h-4 mr-1.5" /> },
          { id: 'prophecy', label: '예언 성취', icon: <Icons.Star className="w-4 h-4 mr-1.5" /> },
          { id: 'holyweek', label: '절기 인포', icon: <Icons.Leaf className="w-4 h-4 mr-1.5" /> },
          { id: 'network', label: '인물 관계망', icon: <Icons.Network className="w-4 h-4 mr-1.5" /> },
          { id: 'map', label: '지도 이동', icon: <Icons.Map className="w-4 h-4 mr-1.5" /> }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`flex items-center shrink-0 px-3.5 py-2 mb-1 mr-2 rounded-[12px] text-[12.5px] sm:text-[13px] font-bold transition-all shadow-sm border cursor-pointer ${activeTab === tab.id ? `${bgAccentFresh} border-transparent shadow-md` : `${isDark ? 'bg-[#111827]/80 text-[#94A3B8] border-[#1E293B]' : 'bg-white/80 text-[#64748B] border-[#E2E8F0]'} hover:opacity-80`}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 relative z-10 hide-scrollbar w-full max-w-none mx-auto">
        
        {/* ========================================================================= */}
        {/* 1. 성경 심층 분석 탭 (시편 포함)                                          */}
        {/* ========================================================================= */}
        {activeTab === 'analysis' && (
          <div className="w-full space-y-4 pb-20 animate-fade-in-up">
             
             <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {Object.keys(bookAnalysisData).map(bookKey => (
                   <button 
                      key={bookKey}
                      onClick={() => setSelectedAnalysisBook(bookKey)}
                      className={`px-3.5 py-2 rounded-[12px] text-[12.5px] sm:text-[13px] font-bold shadow-sm whitespace-nowrap transition-all border cursor-pointer ${selectedAnalysisBook === bookKey ? `${bgAccentFresh} border-transparent` : `${isDark ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-white border-[#E2E8F0]'} ${textMainStyle}`}`}
                   >
                      {bookAnalysisData[bookKey].meta.name}
                   </button>
                ))}
             </div>

             {activeBookData && (
                <div className="space-y-4 sm:space-y-5 mt-2">
                  <div className={`relative p-5 sm:p-7 md:p-10 ${glassCard}`}>
                     <span className={`text-[10px] sm:text-[11px] font-bold tracking-widest uppercase mb-1.5 block ${textSubStyle}`}>개혁주의 구속사적 심층 연구 보고서</span>
                     <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2 ${textMainStyle}`}>{activeBookData.meta.name} <span className="text-lg sm:text-xl md:text-2xl opacity-70 font-medium">({activeBookData.meta.enName})</span></h2>
                     <span className={`text-md sm:text-lg font-bold block mb-5 sm:mb-6 ${textSubStyle}`}>{activeBookData.meta.hebName}</span>
                     
                     <div className={`inline-flex flex-wrap gap-2.5 sm:gap-3 text-[12px] sm:text-[13px] font-bold ${bgSubCard} px-4 py-2.5 rounded-[14px]`}>
                        <div className={`flex items-center gap-1.5 ${textMainStyle}`}><span className={textSubStyle}>저자:</span> {activeBookData.meta.author}</div>
                        <div className={`hidden sm:block w-[1px] h-3.5 ${isDark ? 'bg-[#1E293B]' : 'bg-[#E2E8F0]'}`}></div>
                        <div className={`flex items-center gap-1.5 ${textMainStyle}`}><span className={textSubStyle}>기록 연대:</span> {activeBookData.meta.date}</div>
                     </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
                     <div className={`p-4 sm:p-6 ${glassCard}`}>
                        <h3 className={`text-[14.5px] sm:text-[15.5px] font-bold mb-3 sm:mb-4 flex items-center tracking-tight ${textMainStyle}`}>
                          <Icons.SearchRef className={`w-4 h-4 mr-2 ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`} /> 핵심 키워드
                        </h3>
                        <div className="flex flex-wrap gap-1.5 mb-3 sm:mb-4">
                           {activeBookData.meta.keywords.map((kw, i) => (
                              <span key={i} className={`px-2.5 py-1 rounded-[10px] text-[11.5px] sm:text-[12.5px] font-bold ${bgAccentSoft}`}>
                                 #{kw}
                              </span>
                           ))}
                        </div>
                        <p className={`text-[12.5px] sm:text-[13.5px] leading-[1.7] font-medium ${textSubStyle}`}>{activeBookData.meta.intro}</p>
                     </div>

                     <div className={`p-4 sm:p-6 ${glassCard}`}>
                        <h3 className={`text-[14.5px] sm:text-[15.5px] font-bold mb-3 sm:mb-4 flex items-center tracking-tight ${textMainStyle}`}>
                          <Icons.Book className={`w-4 h-4 mr-2 ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`} /> 대표 요절
                        </h3>
                        <div className="space-y-2.5">
                           {activeBookData.meta.keyVerses.map((v, i) => (
                              <div 
                                 key={i} 
                                 onClick={() => setPopupVerseData({ query: v.ref, verses: getVersesFromQuery(v.ref, bibles) })}
                                 className={`p-3 sm:p-4 rounded-[14px] ${bgSubCard} cursor-pointer transition-colors group shadow-sm`}
                              >
                                 <span className={`text-[11.5px] sm:text-[12px] font-bold ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'} flex items-center mb-1.5`}>
                                   {v.ref} <Icons.SearchRef className="w-3 h-3 ml-1 opacity-50" />
                                 </span>
                                 <span className={`text-[13px] sm:text-[13.5px] ${textMainStyle} font-medium leading-[1.6]`}>"{v.text}"</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className={`p-5 sm:p-7 md:p-8 ${glassCard}`}>
                     <h3 className={`text-[15.5px] sm:text-[17px] font-bold mb-2.5 tracking-tight ${textMainStyle}`}>{activeBookData.context.title}</h3>
                     <p className={`text-[12.5px] sm:text-[13.5px] font-medium ${textSubStyle} mb-5 sm:mb-6`}>{activeBookData.context.desc}</p>
                     <div className="space-y-5 sm:space-y-6">
                        {activeBookData.context.items.map((item, i) => (
                           <div key={i}>
                              <h4 className={`text-[13.5px] sm:text-[14.5px] font-bold mb-1.5 flex items-center ${textMainStyle}`}>
                                <Icons.Pin className={`w-3.5 h-3.5 mr-1.5 ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`} /> {item.subtitle}
                              </h4>
                              <p className={`text-[12.5px] sm:text-[13.5px] leading-[1.7] whitespace-pre-wrap font-medium ${textSubStyle}`}>{item.content}</p>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className={`p-5 sm:p-7 md:p-8 ${glassCard}`}>
                     <h3 className={`text-[15.5px] sm:text-[17px] font-bold mb-2.5 tracking-tight ${textMainStyle}`}>{activeBookData.structure.title}</h3>
                     <p className={`text-[12.5px] sm:text-[13.5px] font-medium ${textSubStyle} mb-5 sm:mb-6`}>{activeBookData.structure.desc}</p>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 mb-6 sm:mb-8">
                        {activeBookData.structure.parts.map((p, i) => (
                           <div key={i} className={`p-4 rounded-[16px] ${bgSubCard} border shadow-sm`}>
                              <h4 className={`font-bold text-[13px] sm:text-[13.5px] mb-1.5 ${textMainStyle}`}>{p.name}</h4>
                              <p className={`text-[11.5px] sm:text-[12px] font-medium ${textSubStyle} leading-[1.6] break-keep`}>{p.summary}</p>
                           </div>
                        ))}
                     </div>
                  
                     {activeBookData.characters && (
                       <div className={`mt-6 pt-5 sm:pt-6 border-t ${borderStyle}`}>
                          <h3 className={`text-[15.5px] sm:text-[17px] font-bold mb-2.5 tracking-tight ${textMainStyle}`}>{activeBookData.characters.title}</h3>
                          <p className={`text-[12.5px] sm:text-[13.5px] font-medium ${textSubStyle} mb-5 sm:mb-6 whitespace-pre-wrap`}>{activeBookData.characters.desc}</p>
                          <div className="grid md:grid-cols-2 gap-4">
                             {activeBookData.characters.items.map((char, i) => (
                                <div key={i} className={`p-4 sm:p-5 rounded-[16px] ${bgSubCard} border shadow-sm`}>
                                   <h4 className={`text-[14px] sm:text-[15px] font-bold mb-3 flex items-center ${textMainStyle}`}>
                                     <Icons.Person className={`w-4 h-4 mr-1.5 ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`} /> {char.name}
                                   </h4>
                                   <div className={`text-[12.5px] sm:text-[13px] leading-[1.7] whitespace-pre-wrap font-medium ${textSubStyle}`}>
                                      {char.desc && <p>{char.desc}</p>}
                                      {char.details && char.details.length > 0 && (
                                        <div className="space-y-2.5 mt-2">
                                          {char.details.map((detail, idx) => (
                                            <div key={idx} className="flex flex-col gap-1">
                                              <span className={`text-[10.5px] sm:text-[11px] font-bold ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`}>{detail.label}</span>
                                              <span className={`${textMainStyle} font-medium leading-[1.6] break-keep`}>{detail.text}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                     )}
                  </div>

                  {activeBookData.theology && (
                    <div className={`p-5 sm:p-7 md:p-8 relative overflow-hidden ${glassCard}`}>
                       <div className={`absolute top-0 left-0 w-1.5 h-full ${isDark ? 'bg-[#38BDF8]' : 'bg-[#0284C7]'}`}></div>
                       <h3 className={`text-[15.5px] sm:text-[17px] font-bold mb-2.5 tracking-tight ${textMainStyle}`}>{activeBookData.theology.title}</h3>
                       <p className={`text-[12.5px] sm:text-[13.5px] font-medium ${textSubStyle} mb-5 sm:mb-6 whitespace-pre-wrap`}>{activeBookData.theology.desc}</p>
                       
                       <div className="space-y-4">
                          {activeBookData.theology.items.map((item, i) => (
                             <div key={i} className={`p-4 sm:p-5 rounded-[16px] ${bgSubCard} border shadow-sm`}>
                                <h4 className={`font-bold text-[13.5px] sm:text-[14px] mb-2 ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`}>{item.sub || item.subtitle}</h4>
                                <div className={`text-[12.5px] sm:text-[13px] leading-[1.7] whitespace-pre-wrap font-medium ${textSubStyle}`}>
                                  {item.text || item.content}
                                </div>
                                
                                {item.table && (
                                  <div className={`mt-4 overflow-x-auto rounded-[12px] border ${borderStyle}`}>
                                    <table className="w-full text-left border-collapse min-w-[500px]">
                                      <thead>
                                        <tr className={isDark ? "bg-[#0F172A]" : "bg-white"}>
                                          {item.table.headers.map((header, hIdx) => (
                                            <th key={hIdx} className={`p-3 text-[12px] sm:text-[12.5px] font-bold border-b ${borderStyle} ${textMainStyle}`}>
                                              {header}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {item.table.rows.map((row, rIdx) => (
                                          <tr key={rIdx} className={`border-b last:border-b-0 ${borderStyle} ${isDark ? "hover:bg-[#1E293B]" : "hover:bg-slate-50"}`}>
                                            {row.map((cell, cIdx) => (
                                              <td key={cIdx} className={`p-3 text-[11.5px] sm:text-[12px] font-medium ${textSubStyle}`}>
                                                {cell}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                             </div>
                          ))}
                       </div>
                    </div>
                  )}

                  {activeBookData.glossary && (
                    <div className={`p-5 sm:p-7 md:p-8 ${glassCard}`}>
                       <h3 className={`text-[15.5px] sm:text-[17px] font-bold mb-4 sm:mb-5 tracking-tight ${textMainStyle}`}>{activeBookData.glossary.title}</h3>
                       <div className="grid md:grid-cols-2 gap-4">
                          {activeBookData.glossary.items.map((word, i) => (
                             <div key={i} className={`flex flex-col p-4 sm:p-5 rounded-[16px] ${bgSubCard} border shadow-sm transition-colors group`}>
                                <div className="flex justify-between items-start mb-2.5">
                                   <div>
                                      <span className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'} mr-2`} dir="rtl">{word.heb}</span>
                                      <span className={`text-[10px] sm:text-[10.5px] font-medium ${textSubStyle} uppercase tracking-wider`}>[{word.pron}]</span>
                                   </div>
                                   <span className={`text-[13px] sm:text-[13.5px] font-bold ${textMainStyle}`}>{word.kr}</span>
                                </div>
                                <p className={`text-[12.5px] sm:text-[13px] leading-[1.7] whitespace-pre-wrap font-medium ${textSubStyle} flex-1`}>{word.desc}</p>
                                {word.ref && (
                                  <div 
                                     onClick={() => setPopupVerseData({ query: word.ref, verses: getVersesFromQuery(word.ref, bibles) })}
                                     className={`mt-3 text-[11px] sm:text-[11.5px] font-bold ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'} cursor-pointer hover:underline text-right flex items-center justify-end gap-1`}
                                  >
                                     적용 구절: {word.ref} <Icons.SearchRef className="w-3 h-3" />
                                  </div>
                                )}
                             </div>
                          ))}
                       </div>
                    </div>
                  )}
                </div>
             )}
          </div>
        )}

        {/* 심층 연대기 탭 */}
        {activeTab === 'chrono' && (
          <div className="w-full space-y-5 pb-20 animate-fade-in-up">
             <div className={`p-5 sm:p-6 ${glassCard} mb-4`}>
               <h2 className={`text-[15.5px] sm:text-[17px] font-bold tracking-tight flex items-center ${textMainStyle}`}>
                 <Icons.Tree className={`w-5 h-5 mr-2 ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`} /> 성경 구속사 심층 트리
               </h2>
               <p className={`text-[12.5px] sm:text-[13px] font-medium ${textSubStyle} mt-1.5`}>시대를 클릭하여 인물 계보와 핵심 사건을 마인드맵처럼 펼쳐보세요.</p>
             </div>

             <div className={`relative pl-4 sm:pl-6 border-l-2 ${borderStyle} space-y-5 sm:space-y-6`}>
                {filteredChronoData.map((era) => (
                  <div key={era.id} className="relative">
                    <div className={`absolute -left-[21px] sm:-left-[29px] top-5 w-3.5 h-3.5 ${isDark ? 'bg-[#38BDF8]' : 'bg-[#0284C7]'} rounded-full border-2 ${isDark ? 'border-[#0B1120]' : 'border-[#F4F7FB]'} z-10`}></div>
                    
                    <div className={`${glassCard} overflow-hidden transition-all duration-300`}>
                      <button 
                        onClick={() => setExpandedChrono(expandedChrono === era.id ? null : era.id)}
                        className={`w-full text-left p-5 sm:p-6 flex justify-between items-center transition-colors ${isDark ? 'hover:bg-[#1E293B]' : 'hover:bg-[#F8FAFC]'}`}
                      >
                        <div>
                          <span className={`text-[10px] sm:text-[10.5px] font-bold ${bgAccentSoft} px-2.5 py-1 rounded-[8px] mb-2 inline-block border ${isDark ? 'border-[#1E293B]' : 'border-[#BAE6FD]'}`}>{era.scope}</span>
                          <h3 className={`text-[14.5px] sm:text-[15.5px] font-bold tracking-tight ${textMainStyle}`}>{era.title}</h3>
                        </div>
                        <Icons.ChevronRight className={`w-4 h-4 ${textSubStyle} transition-transform ${expandedChrono === era.id ? 'rotate-90' : ''}`} />
                      </button>

                      {expandedChrono === era.id && (
                        <div className={`px-5 sm:px-6 pb-6 pt-0 animate-fade-in-up border-t ${borderStyle} mt-1`}>
                           <div className={`p-4 rounded-[16px] ${bgSubCard} mt-4 mb-5 text-[12.5px] sm:text-[13.5px] font-medium leading-[1.7] ${textSubStyle} border shadow-sm`}>
                             "{era.summary}"
                           </div>
                           
                           <div className="mb-6">
                              <h4 className={`text-[12.5px] sm:text-[13.5px] font-bold ${textMainStyle} mb-3 flex items-center`}>
                                <Icons.Person className={`w-3.5 h-3.5 mr-1.5 ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`} /> 핵심 인물 흐름
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                 {era.figures.map((fig, idx) => (
                                   <React.Fragment key={idx}>
                                     <span className={`${bgSubCard} border ${textMainStyle} px-3 py-1.5 rounded-[10px] text-[11.5px] sm:text-[12px] font-bold shadow-sm`}>{fig}</span>
                                     {idx < era.figures.length - 1 && <Icons.ArrowRight className={`w-3.5 h-3.5 ${textSubStyle}`} />}
                                   </React.Fragment>
                                 ))}
                              </div>
                           </div>
                           
                           <div>
                              <h4 className={`text-[12.5px] sm:text-[13.5px] font-bold ${textMainStyle} mb-3 flex items-center`}>
                                <Icons.Book className={`w-3.5 h-3.5 mr-1.5 ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`} /> 주요 사건 본문 매핑
                              </h4>
                              <div className="grid gap-2.5">
                                 {era.events.map((evt, idx) => (
                                   <div key={idx} className={`flex flex-col sm:flex-row sm:justify-between sm:items-center ${bgSubCard} p-3 sm:p-4 rounded-[14px] gap-2 border shadow-sm`}>
                                      <span className={`text-[12.5px] sm:text-[13px] font-bold ${textMainStyle}`}>{evt.name}</span>
                                      <span 
                                        onClick={() => setPopupVerseData({ query: evt.refs, verses: getVersesFromQuery(evt.refs, bibles) })}
                                        className={`text-[10.5px] sm:text-[11px] font-bold cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 ${bgAccentSoft} px-3 py-1.5 rounded-[10px] border ${isDark ? 'border-[#1E293B]' : 'border-[#BAE6FD]'} self-start sm:self-auto`}
                                      >
                                        {evt.refs} <Icons.SearchRef className="w-3 h-3" />
                                      </span>
                                   </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* 인물 관계망 탭 */}
        {activeTab === 'network' && (
          <div ref={graphContainerRef} className={`w-full h-[65vh] min-h-[450px] md:min-h-[550px] ${isDark ? 'bg-[#0B1120]' : 'bg-[#F8FAFC]'} rounded-[20px] md:rounded-[24px] border ${borderStyle} overflow-hidden relative shadow-sm animate-fade-in-up`}>
            <div className={`absolute top-4 left-4 z-10 ${glassCard} px-3.5 py-2.5 rounded-[14px] pointer-events-none`}>
               <h4 className={`font-bold text-[13px] sm:text-[14px] flex items-center ${textMainStyle}`}>
                 <Icons.Network className={`w-4 h-4 mr-1.5 ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`} /> 성경 인물 유니버스
               </h4>
               <p className={`text-[10.5px] sm:text-[11px] mt-1 font-medium ${textSubStyle}`}>노드를 클릭하면 상세 해설이 나타납니다.</p>
            </div>
            {graphSize.width > 0 && (
              <ForceGraph2D
                ref={graphRef}
                graphData={displayGraph}
                width={graphSize.width}
                height={graphSize.height}
                cooldownTicks={100}
                onNodeClick={handleNodeClick}
                onEngineStop={() => graphRef.current?.zoomToFit(600, 50)}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const label = node.id;
                  const fontSize = 12 / globalScale;
                  ctx.font = `${fontSize}px sans-serif`;
                  
                  const isCenter = label === '예수 그리스도';
                  const radius = isCenter ? 8 / globalScale : 4 / globalScale;
                  
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                  ctx.fillStyle = typeColors[node.group]?.bg || node.color || (isDark ? '#0284C7' : '#38BDF8');
                  ctx.fill();

                  if (isCenter) {
                    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.8)' : 'rgba(2, 132, 199, 0.8)';
                    ctx.lineWidth = 3 / globalScale;
                    ctx.stroke();
                    ctx.shadowColor = isDark ? 'rgba(56, 189, 248, 1)' : 'rgba(2, 132, 199, 1)';
                    ctx.shadowBlur = 15 / globalScale;
                  } else {
                    ctx.shadowBlur = 0;
                  }

                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'top';
                  ctx.fillStyle = isDark ? '#F8FAFC' : '#0F172A';
                  if (isCenter) ctx.fillStyle = isDark ? '#38BDF8' : '#0284C7';
                  
                  ctx.fillText(label, node.x, node.y + radius + (3 / globalScale));
                }}
                linkColor={() => isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                linkWidth={1.5}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                linkDirectionalParticleWidth={2}
                linkCanvasObjectMode={() => 'after'}
                linkCanvasObject={(link, ctx, globalScale) => {
                  if (globalScale < 1.8) return;
                  const fontSize = 4 / globalScale;
                  ctx.font = `${fontSize}px sans-serif`;
                  const textPos = { x: link.source.x + (link.target.x - link.source.x) / 2, y: link.source.y + (link.target.y - link.source.y) / 2 };
                  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(link.label, textPos.x, textPos.y);
                }}
              />
            )}
          </div>
        )}

        {/* 예언 성취 분석 탭 */}
        {activeTab === 'prophecy' && (
          <div className="w-full space-y-5 md:space-y-6 pb-32 animate-fade-in-up">
             <section className={`p-5 sm:p-7 ${glassCard}`}>
                <h2 className={`text-[15.5px] sm:text-[17px] font-bold tracking-tight mb-3 sm:mb-4 flex items-center ${textMainStyle}`}>
                  <Icons.Star className={`w-5 h-5 mr-2 ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`} /> {prophecyReportData.intro.title}
                </h2>
                <div className={`space-y-3 sm:space-y-4 text-[13px] sm:text-[14px] leading-[1.7] font-medium ${textSubStyle}`}>
                   {prophecyReportData.intro.content.map((p, i) => <p key={i}>{p}</p>)}
                </div>
             </section>

             <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
               <section className={`p-5 sm:p-7 ${glassCard}`}>
                  <h3 className={`text-[14.5px] sm:text-[15.5px] font-bold tracking-tight mb-4 ${textMainStyle}`}>{prophecyReportData.hermeneutics.title}</h3>
                  <div className="space-y-4">
                    {prophecyReportData.hermeneutics.items.map((item, i) => (
                      <div key={i}>
                         <h4 className={`text-[13px] sm:text-[13.5px] font-bold mb-1.5 ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`}>{item.subtitle}</h4>
                         <p className={`text-[12.5px] sm:text-[13px] leading-[1.7] font-medium ${textSubStyle}`}>{item.text}</p>
                      </div>
                    ))}
                  </div>
               </section>

               <section className={`p-5 sm:p-7 ${glassCard}`}>
                  <h3 className={`text-[14.5px] sm:text-[15.5px] font-bold tracking-tight mb-4 ${textMainStyle}`}>{prophecyReportData.statistics.title}</h3>
                  <div className={`space-y-3.5 text-[12.5px] sm:text-[13px] leading-[1.7] font-medium ${textSubStyle}`}>
                    {prophecyReportData.statistics.content.map((p, i) => <p key={i}>{p}</p>)}
                  </div>
               </section>
             </div>
             
             <div className="space-y-3 sm:space-y-4 pt-1">
               {prophecyReportData.categories.map((category, idx) => {
                 return (
                 <div key={idx} className={`${glassCard} overflow-hidden transition-all duration-300`}>
                   <button 
                     onClick={() => setExpandedProphecySec(expandedProphecySec === idx ? null : idx)}
                     className={`w-full text-left px-5 sm:px-6 py-4 sm:py-5 flex justify-between items-center transition-colors ${isDark ? 'hover:bg-[#1E293B]' : 'hover:bg-[#F8FAFC]'}`}
                   >
                      <div>
                        <h3 className={`font-bold text-[14px] sm:text-[15px] ${textMainStyle}`}>{category.title}</h3>
                        <p className={`text-[11.5px] sm:text-[12px] mt-1 font-medium ${textSubStyle}`}>{category.desc}</p>
                      </div>
                      <Icons.ChevronRight className={`w-4 h-4 ${textSubStyle} transition-transform ${expandedProphecySec === idx ? 'rotate-90' : ''}`} />
                   </button>
                   
                   {expandedProphecySec === idx && (
                     <div className={`px-5 sm:px-6 pb-6 pt-0 animate-fade-in-up`}>
                       <div className="space-y-5">
                         {category.items.map((item, iIdx) => (
                           <div key={iIdx} className={`flex flex-col gap-4 p-4 sm:p-5 rounded-[16px] ${bgSubCard} border shadow-sm`}>
                              <div className="space-y-2.5">
                                <h4 className={`font-bold text-[13.5px] sm:text-[14px] ${textMainStyle}`}>{item.topic}</h4>
                                <div className={`text-[12.5px] sm:text-[13px] leading-[1.7] font-medium ${textSubStyle}`}>
                                  {item.text}
                                </div>
                              </div>
                              
                              <div className={`flex flex-col gap-2 p-3 sm:p-4 rounded-[14px] ${isDark ? 'bg-[#0B1120]' : 'bg-white'} border ${borderStyle}`}>
                                 <div 
                                   onClick={() => setPopupVerseData({ query: item.old, verses: getVersesFromQuery(item.old, bibles) })}
                                   className={`flex items-center justify-between p-3 rounded-[10px] cursor-pointer ${isDark ? 'bg-[#1E293B] hover:bg-[#334155]' : 'bg-[#F8FAFC] hover:bg-[#E2E8F0]'} transition-colors`}
                                 >
                                    <div>
                                      <div className={`text-[10px] font-bold ${textSubStyle} mb-0.5`}>구약의 예언</div>
                                      <div className={`text-[12.5px] sm:text-[13px] font-bold ${textMainStyle}`}>{item.old}</div>
                                    </div>
                                    <Icons.SearchRef className={`w-4 h-4 ${textSubStyle}`} />
                                 </div>
                                 
                                 <div className="flex justify-center -my-1.5 relative z-10">
                                   <div className={`w-7 h-7 rounded-full ${isDark ? 'bg-[#1E293B] border border-[#334155]' : 'bg-white border border-[#E2E8F0]'} flex items-center justify-center`}>
                                      <Icons.ArrowDown className={`w-3.5 h-3.5 ${textSubStyle}`} />
                                   </div>
                                 </div>

                                 <div 
                                   onClick={() => setPopupVerseData({ query: item.new, verses: getVersesFromQuery(item.new, bibles) })}
                                   className={`flex items-center justify-between p-3 rounded-[10px] cursor-pointer ${bgAccentSoft} border ${isDark ? 'border-[#1E293B]' : 'border-[#BAE6FD]'}`}
                                 >
                                    <div>
                                      <div className={`text-[10px] font-bold ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'} mb-0.5`}>신약의 성취</div>
                                      <div className={`text-[12.5px] sm:text-[13px] font-bold ${textMainStyle}`}>{item.new}</div>
                                    </div>
                                    <Icons.SearchRef className={`w-4 h-4 ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`} />
                                 </div>
                              </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               )})}
             </div>

             <div className="grid md:grid-cols-2 gap-4 sm:gap-5 mt-5">
                <section className={`p-5 sm:p-7 ${glassCard}`}>
                  <h3 className={`text-[14.5px] sm:text-[15.5px] font-bold tracking-tight mb-4 ${textMainStyle}`}>{prophecyReportData.apologetics.title}</h3>
                  <div className="space-y-3.5">
                    {prophecyReportData.apologetics.items.map((item, i) => (
                      <div key={i}>
                        <h4 className={`text-[13px] sm:text-[13.5px] font-bold mb-1.5 ${isDark ? 'text-[#F43F5E]' : 'text-[#E11D48]'}`}>{item.subtitle}</h4>
                        <p className={`text-[12.5px] sm:text-[13px] leading-[1.7] font-medium ${textSubStyle}`}>{item.content}</p>
                      </div>
                    ))}
                  </div>
                </section>
                <section className={`p-5 sm:p-7 ${glassCard}`}>
                   <h3 className={`text-[14.5px] sm:text-[15.5px] font-bold tracking-tight mb-4 ${textMainStyle}`}>{prophecyReportData.conclusion.title}</h3>
                   <div className={`space-y-3.5 text-[12.5px] sm:text-[13px] leading-[1.7] font-medium ${textSubStyle}`}>
                     {prophecyReportData.conclusion.content.map((p, i) => <p key={i}>{p}</p>)}
                   </div>
                </section>
             </div>
          </div>
        )}

        {/* 절기 인포그래픽 탭 */}
        {activeTab === 'holyweek' && (
          <div className="w-full space-y-6 md:space-y-8 pb-32 animate-fade-in-up">
            <div className={`${glassCard} overflow-hidden`}>
              <div className={`p-6 sm:p-8 text-center border-b ${borderStyle}`}>
                <span className={`font-bold tracking-wider text-[10.5px] sm:text-[11px] mb-1.5 block ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`}>Palm Sunday</span>
                <h2 className={`text-xl sm:text-2xl font-bold tracking-tight mb-1.5 ${textMainStyle}`}>{holyWeekData.palmSunday.title}</h2>
                <p className={`text-[12px] sm:text-[12.5px] font-bold mb-3 ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`}>{holyWeekData.palmSunday.subtitle}</p>
                <p className={`text-[12.5px] sm:text-[13px] font-medium leading-[1.7] max-w-2xl mx-auto ${textSubStyle}`}>{holyWeekData.palmSunday.intro}</p>
              </div>
              <div className="px-5 sm:px-6 pb-6 sm:pb-8 grid sm:grid-cols-2 md:grid-cols-3 gap-4 pt-5">
                {holyWeekData.palmSunday.symbols.map((sym, i) => (
                  <div key={i} className={`p-4 sm:p-5 rounded-[16px] ${bgSubCard} border shadow-sm flex flex-col items-center text-center`}>
                    <div className={`w-12 h-12 rounded-[14px] ${isDark ? 'bg-[#0F172A]' : 'bg-white'} border ${borderStyle} flex items-center justify-center text-[20px] mb-3`}>🌿</div>
                    <h3 className={`text-[13.5px] sm:text-[14px] font-bold mb-1.5 ${textMainStyle}`}>{sym.title}</h3>
                    {sym.situation && <p className={`text-[11.5px] sm:text-[12px] font-medium leading-[1.6] mb-2.5 ${textSubStyle} bg-black/5 dark:bg-white/5 p-2.5 rounded-[10px]`}>{sym.situation}</p>}
                    <p className={`text-[12px] sm:text-[12.5px] font-medium leading-[1.6] mb-3 ${textMainStyle}`}>{sym.meaning}</p>
                    <div 
                      onClick={() => setPopupVerseData({ query: sym.verse, verses: getVersesFromQuery(sym.verse, bibles) })}
                      className={`mt-auto text-[11px] sm:text-[11.5px] font-bold ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'} cursor-pointer hover:underline`}
                    >
                      {sym.verse}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${glassCard} overflow-hidden`}>
              <div className={`p-6 sm:p-8 text-center border-b ${borderStyle}`}>
                <span className={`font-bold tracking-wider text-[10.5px] sm:text-[11px] mb-1.5 block text-[#A78BFA]`}>Holy Week</span>
                <h2 className={`text-xl sm:text-2xl font-bold tracking-tight mb-1.5 ${textMainStyle}`}>{holyWeekData.holyWeek.title}</h2>
                <p className={`text-[12px] sm:text-[12.5px] font-bold mb-3 text-[#A78BFA]`}>{holyWeekData.holyWeek.subtitle}</p>
                <p className={`text-[12.5px] sm:text-[13px] font-medium leading-[1.7] max-w-2xl mx-auto ${textSubStyle}`}>{holyWeekData.holyWeek.intro}</p>
              </div>
              
              <div className="px-5 sm:px-6 pb-6 sm:pb-8 pt-5 relative">
                <div className={`absolute left-[36px] sm:left-[43px] top-8 bottom-8 w-[1.5px] ${isDark ? 'bg-[#1E293B]' : 'bg-[#E2E8F0]'}`}></div>
                <div className="space-y-6 sm:space-y-8 relative z-10">
                  {holyWeekData.holyWeek.timeline.map((day, i) => (
                    <div key={i} className="flex gap-4 sm:gap-5">
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-[12px] ${isDark ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-white border-[#E2E8F0]'} shadow-sm border flex items-center justify-center text-[14px] z-10`}>
                        <span className={`font-bold ${textSubStyle} text-[10px]`}>{i+1}</span>
                      </div>
                      <div className="flex-1 pt-0.5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                          <h3 className={`text-[14px] sm:text-[15px] font-bold ${textMainStyle}`}>{day.day} <span className={`text-[11.5px] sm:text-[12px] font-medium ml-0 sm:ml-1 block sm:inline ${textSubStyle}`}>{day.title}</span></h3>
                        </div>
                        <div 
                          onClick={() => setPopupVerseData({ query: day.verse, verses: getVersesFromQuery(day.verse, bibles) })}
                          className={`inline-block mb-2 text-[10.5px] sm:text-[11px] font-bold ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'} cursor-pointer hover:underline`}
                        >
                          {day.verse}
                        </div>
                        <p className={`text-[12.5px] sm:text-[13px] font-medium leading-[1.7] mb-3 ${textSubStyle}`}>{day.detail}</p>
                        <div className={`p-3.5 rounded-[12px] ${bgSubCard} border shadow-sm text-[12px] sm:text-[12.5px] font-medium leading-[1.7] ${textMainStyle}`}>
                          <span className={`font-bold block mb-1 text-[#A78BFA]`}>구속사적 의미</span> 
                          <span className={`${textSubStyle}`} dangerouslySetInnerHTML={{ __html: day.theology.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`${glassCard} overflow-hidden`}>
              <div className={`p-6 sm:p-8 text-center border-b ${borderStyle}`}>
                <span className={`font-bold tracking-wider text-[10.5px] sm:text-[11px] mb-1.5 block text-[#F59E0B]`}>Easter</span>
                <h2 className={`text-xl sm:text-2xl font-bold tracking-tight mb-1.5 ${textMainStyle}`}>{holyWeekData.easter.title}</h2>
                <p className={`text-[12px] sm:text-[12.5px] font-bold mb-3 text-[#F59E0B]`}>{holyWeekData.easter.subtitle}</p>
                <p className={`text-[12.5px] sm:text-[13px] font-medium leading-[1.7] max-w-2xl mx-auto ${textSubStyle}`}>{holyWeekData.easter.intro}</p>
              </div>
              <div className="px-5 sm:px-6 pb-6 sm:pb-8 grid sm:grid-cols-2 md:grid-cols-3 gap-4 pt-5">
                {holyWeekData.easter.symbols.map((sym, i) => (
                  <div key={i} className={`p-4 sm:p-5 rounded-[16px] ${bgSubCard} border shadow-sm flex flex-col items-center text-center`}>
                    <div className={`w-12 h-12 rounded-[14px] ${isDark ? 'bg-[#0F172A]' : 'bg-white'} border ${borderStyle} flex items-center justify-center text-[20px] mb-3`}>🥚</div>
                    <h3 className={`text-[13.5px] sm:text-[14px] font-bold mb-1.5 ${textMainStyle}`}>{sym.title}</h3>
                    <p className={`text-[12px] sm:text-[12.5px] font-medium leading-[1.6] mb-3 ${textSubStyle}`}>{sym.text}</p>
                    <div 
                      onClick={() => setPopupVerseData({ query: sym.verse, verses: getVersesFromQuery(sym.verse, bibles) })}
                      className={`mt-auto text-[11px] sm:text-[11.5px] font-bold text-[#F59E0B] cursor-pointer hover:underline`}
                    >
                      {sym.verse}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 🌟 6. [고도화 완성] 지도 이동 탭: API Key 불필요 고고학 위성·지형 엔진     */}
        {/* ========================================================================= */}
        {activeTab === 'map' && (
          <div className={`flex flex-col md:flex-row w-full h-[75vh] min-h-[500px] md:min-h-[620px] ${glassCard} overflow-hidden animate-fade-in-up border ${borderStyle}`}>
            
            {/* [좌측 패널]: 구속사 7대 여정 선택 & 장소 타임라인 리스트 */}
            <div className={`flex flex-col w-full h-[42%] md:h-full md:w-1/3 md:max-w-[320px] border-b md:border-b-0 md:border-r ${borderStyle} ${isDark ? 'bg-[#0F172A]/90' : 'bg-white/90'}`}>
              
              {/* 여정 선택 셀렉터 & 검색 바 */}
              <div className={`p-3 border-b ${borderStyle} space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold font-mono ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`}>
                    BIBLICAL EXPEDITION
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {activeRoute?.places?.length || 0}개 유적지
                  </span>
                </div>

                <select
                  value={activeRouteId}
                  onChange={(e) => {
                    setActiveRouteId(e.target.value);
                    setSelectedLoc(null);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-[10px] text-[12px] font-bold outline-none border cursor-pointer ${
                    isDark ? 'bg-[#1E293B] border-[#334155] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {allRoutesList.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>

                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] border ${inputBgStyle}`}>
                  <Icons.SearchRef className={`w-3.5 h-3.5 ${textSubStyle} shrink-0`} />
                  <input 
                    type="text" 
                    value={mapSearch} 
                    onChange={(e) => setMapSearch(e.target.value)}
                    placeholder="지명, 성구, 사건 검색..." 
                    className={`w-full bg-transparent text-[11.5px] outline-none font-medium ${textMainStyle}`}
                  />
                  {mapSearch && <button onClick={() => setMapSearch('')} className="text-[10px] text-slate-400">✕</button>}
                </div>
              </div>

              {/* 순차적 장소 리스트 */}
              <div className="flex-1 overflow-y-auto hide-scrollbar divide-y divide-slate-100 dark:divide-slate-800/60">
                {displayRoutes.flatMap(r => r.places).length === 0 ? (
                  <div className={`p-8 text-center text-[12px] font-medium ${textSubStyle}`}>검색된 성경 장소가 없습니다.</div>
                ) : (
                  (activeRoute?.places || []).map((loc, idx) => {
                    const isSelected = selectedLoc?.id === loc.id;
                    return (
                      <div 
                        key={loc.id} 
                        onClick={() => setSelectedLoc(loc)}
                        className={`p-3 cursor-pointer transition-all flex items-start gap-2.5 ${
                          isSelected 
                            ? (isDark ? 'bg-[#0284C7]/20 border-l-4 border-[#38BDF8]' : 'bg-[#E0F2FE] border-l-4 border-[#0284C7]') 
                            : (isDark ? 'hover:bg-[#1E293B]/60' : 'hover:bg-slate-50')
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 ${
                          isSelected ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}>
                          {idx + 1}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className={`text-[12.5px] font-bold ${textMainStyle} truncate`}>
                              {loc.name}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">{loc.verse.split(' ')[0]}</span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5">
                            {loc.nameOrig && (
                              <span className="text-[10.5px] font-serif text-amber-600 dark:text-amber-400 font-bold" dir="rtl">
                                {loc.nameOrig}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 truncate">({loc.region})</span>
                          </div>

                          <p className={`text-[11px] font-medium ${textSubStyle} truncate mt-0.5`}>
                            {loc.event}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* [우측 지도 뷰포트]: 워터마크 없는 Esri 위성 / 지형도 + OpenStreetMap & 레이블 레이어 */}
            <div className="w-full h-[58%] md:h-full md:flex-1 relative z-0">
              
              {/* 상단 3단 지도 모드 스위처 (위성 / 지형도 / 표준) */}
              <div className="absolute top-3 right-3 z-[1000] flex items-center p-1 rounded-xl bg-black/75 backdrop-blur-md border border-white/20 shadow-lg gap-1">
                <button
                  type="button"
                  onClick={() => setMapTileType('satellite')}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                    mapTileType === 'satellite' 
                      ? 'bg-[#0284C7] text-white shadow-xs' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  🛰️ 고고학 위성
                </button>
                <button
                  type="button"
                  onClick={() => setMapTileType('topo')}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                    mapTileType === 'topo' 
                      ? 'bg-[#0284C7] text-white shadow-xs' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  ⛰️ 지형도
                </button>
                <button
                  type="button"
                  onClick={() => setMapTileType('osm')}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                    mapTileType === 'osm' 
                      ? 'bg-[#0284C7] text-white shadow-xs' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  🗺️ 표준
                </button>
              </div>

              <MapContainer 
                center={[31.7, 35.2]} 
                zoom={6} 
                scrollWheelZoom={true} 
                dragging={true}
                zoomControl={true}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
              >
                <MapController selectedLoc={selectedLoc} positions={mapPositions} /> 
                
                {/* 🌟 1. 위성 지도 모드 (Esri World Imagery + 지명/경계선 오버레이) */}
                {mapTileType === 'satellite' && (
                  <>
                    <TileLayer 
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
                      attribution="&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                      maxZoom={18}
                    />
                    <TileLayer 
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" 
                      attribution=""
                      maxZoom={18}
                    />
                  </>
                )}

                {/* 🌟 2. 등고선 고고학 지형도 모드 (Esri World Topo Map) */}
                {mapTileType === 'topo' && (
                  <TileLayer 
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}" 
                    attribution="&copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community"
                    maxZoom={18}
                  />
                )}

                {/* 🌟 3. 오픈스트리트맵 표준 타일 모드 (워터마크 완전 무료) */}
                {mapTileType === 'osm' && (
                  <TileLayer 
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    maxZoom={19}
                  />
                )}

                {/* 경로 이동 선 (Polyline) */}
                {activeRoute && activeRoute.places && (
                  <Polyline 
                    positions={activeRoute.places.map(p => p.coords)} 
                    color={activeRoute.color || '#0284C7'} 
                    weight={3.5} 
                    opacity={0.8} 
                    dashArray={activeRoute.dashArray || '6, 6'} 
                  />
                )}

                {/* 장소 마커 및 툴팁 */}
                {(activeRoute?.places || []).map((loc, idx) => {
                  const isActive = selectedLoc?.id === loc.id;
                  return (
                    <Marker 
                      key={`${activeRoute.id}-${loc.id}`} 
                      position={loc.coords} 
                      icon={createPinIcon(isActive, String(idx + 1))}
                      eventHandlers={{ click: () => setSelectedLoc(loc) }}
                    >
                      <Tooltip direction="top" offset={[0, -22]} opacity={0.95} className="custom-tooltip">
                        <div className="text-center font-sans">
                          <span className="font-black text-[12px] block">{loc.name}</span>
                          <span className="text-[10px] text-blue-500 font-bold">{loc.verse}</span>
                        </div>
                      </Tooltip>
                    </Marker>
                  );
                })}
              </MapContainer>
              
              {/* 🌟 원어 성경 연구 6번 스타일 고고학 OpenBible GPS 인스펙터 플로팅 카드 */}
              {selectedLoc && (
                <div className={`absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md ${
                  isDark ? 'bg-[#0B1120]/95 border-[#1E293B] text-white' : 'bg-white/95 border-slate-200 text-slate-900'
                } backdrop-blur-xl p-4 sm:p-5 rounded-2xl shadow-2xl border z-[1000] animate-fade-in-up space-y-2.5`}>
                  
                  <div className="flex justify-between items-start border-b border-dashed pb-2 border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-black">
                          {selectedLoc.name}
                        </h3>
                        {selectedLoc.nameOrig && (
                          <span className="text-[13px] font-serif font-black text-amber-600 dark:text-amber-400" dir="rtl">
                            {selectedLoc.nameOrig}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span>{selectedLoc.nameEn || ''}</span>
                        <span>•</span>
                        <span className="font-bold text-sky-500">{selectedLoc.region || '성경 지명'}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedLoc(null)} 
                      className="text-slate-400 hover:text-white p-1 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* 위경도 GPS & 구글 위성 바로가기 바 */}
                  <div className="flex items-center justify-between text-[10.5px] font-mono px-2.5 py-1 rounded-lg bg-black/40 border border-white/10">
                    <span className="text-slate-300">
                      GPS: {selectedLoc.coords[0].toFixed(3)}, {selectedLoc.coords[1].toFixed(3)}
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedLoc.coords[0]},${selectedLoc.coords[1]}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 hover:text-sky-300 font-bold hover:underline flex items-center gap-0.5"
                    >
                      📍 구글 지도 위성 보기 ↗
                    </a>
                  </div>

                  {/* 역사적 사건 및 고고학 주해 */}
                  <p className="text-[12px] leading-relaxed font-medium text-slate-300 whitespace-pre-wrap break-keep">
                    {selectedLoc.desc}
                  </p>

                  {/* 성경 구절 본문 팝업 버튼 */}
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setPopupVerseData({ query: selectedLoc.verse, verses: getVersesFromQuery(selectedLoc.verse, bibles) })}
                      className="px-3 py-1.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-[11px] font-bold shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      📖 {selectedLoc.verse} 말씀 읽기
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* 말씀 팝업 모달 */}
      {popupVerseData && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4 pointer-events-auto">
          <div className={`${isDark ? 'bg-[#0B1120] border-[#1E293B]' : 'bg-white border-[#E2E8F0]'} rounded-[24px] shadow-2xl border overflow-hidden w-full max-w-md animate-fade-in-up max-h-[85vh] flex flex-col`}>
            <div className={`px-5 py-3.5 flex justify-between items-center border-b ${isDark ? 'border-[#1E293B] bg-[#111827]' : 'border-[#E2E8F0] bg-[#F8FAFC]'}`}>
              <h3 className={`font-bold ${textMainStyle} text-[13.5px] sm:text-[14px]`}>
                {popupVerseData.query}
              </h3>
              <button onClick={() => setPopupVerseData(null)} className={`${textSubStyle} hover:${textMainStyle} text-xl w-7 h-7 flex items-center justify-center rounded-full transition-colors cursor-pointer`}>
                &times;
              </button>
            </div>
            <div className={`p-5 overflow-y-auto space-y-3.5`}>
              {popupVerseData.verses.map((v, i) => (
                 <div key={i} className={`text-[13px] sm:text-[13.5px] leading-[1.7] ${textMainStyle} font-medium`}>
                    <span className={`font-bold ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'} mr-1.5`}>{v.ref.split(':')[1]}</span>
                    {v.text}
                 </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 인물 상세 모달 */}
      {selectedCharacter && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4 pointer-events-auto">
          <div className={`${isDark ? 'bg-[#0B1120] border-[#1E293B]' : 'bg-white border-[#E2E8F0]'} rounded-[24px] shadow-2xl border overflow-hidden w-full max-w-lg animate-fade-in-up flex flex-col max-h-[85vh]`}>
            <div className={`px-5 py-3.5 flex justify-between items-center border-b ${isDark ? 'border-[#1E293B] bg-[#111827]' : 'border-[#E2E8F0] bg-[#F8FAFC]'}`}>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-[6px] ${bgAccentSoft}`}>
                  {selectedCharacter.group}
                </span>
                <h3 className={`font-bold ${textMainStyle} text-[15px] sm:text-[16px]`}>
                  {selectedCharacter.name}
                </h3>
              </div>
              <button onClick={() => setSelectedCharacter(null)} className={`${textSubStyle} hover:${textMainStyle} text-2xl w-7 h-7 flex items-center justify-center rounded-full transition-colors cursor-pointer`}>
                &times;
              </button>
            </div>
            <div className={`p-5 overflow-y-auto space-y-3.5`}>
              {typeof selectedCharacter.data === 'string' ? (
                <p className={`text-[13px] sm:text-[13.5px] leading-[1.7] ${textMainStyle} whitespace-pre-wrap font-medium`}>
                  {selectedCharacter.data}
                </p>
              ) : (
                <div className="space-y-3.5">
                   {Object.entries(selectedCharacter.data).map(([key, val]) => (
                      <div key={key}>
                         <h4 className={`text-[12.5px] font-bold ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'} mb-1 uppercase`}>{key}</h4>
                         <p className={`text-[13px] sm:text-[13.5px] leading-[1.7] ${textMainStyle} whitespace-pre-wrap font-medium`}>{val}</p>
                      </div>
                   ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-tooltip {
          background: ${isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'} !important;
          border: 1px solid ${isDark ? 'rgba(30, 41, 59, 1)' : 'rgba(226, 232, 240, 1)'} !important;
          border-radius: 10px !important;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;
          padding: 6px 10px !important;
          color: ${isDark ? '#F8FAFC' : '#0F172A'} !important;
          font-family: inherit !important;
        }
        .custom-tooltip::before { display: none !important; }
      `}</style>
    </div>
  );
}
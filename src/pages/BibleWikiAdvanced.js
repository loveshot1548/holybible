import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { SearchIcon } from '../components/icons';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polyline, useMap } from 'react-leaflet';
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

const Icons = {
  Book: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
  Tree: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>,
  Star: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>,
  Leaf: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" /></svg>,
  Network: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>,
  Map: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.705V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>,
  Pin: (props) => <svg fill="currentColor" viewBox="0 0 24 24" {...props}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" /></svg>,
  ChevronRight: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>,
  ArrowDown: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" /></svg>,
  ArrowRight: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5-7.5M21 12H3" /></svg>,
  SearchRef: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.773 4.773zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Person: (props) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
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
              results.push({ ref: `${currentBook} ${c}:${v}`, text: cTxt.replace(/|'/g, "'").replace(/"/g, '"') });
            }
          }
        }
      }
    }
  });
  return results.length > 0 ? results : [{ ref: query, text: '본문을 불러오지 못했습니다. 앱 내 성경을 확인해주세요.' }];
};

const createPinIcon = (isActive) => L.divIcon({
  className: 'custom-pin-icon',
  html: `<div style="color: ${isActive ? '#EF4444' : '#558B2F'}; transform: translate(-50%, -100%); width: ${isActive ? '36px' : '28px'}; height: ${isActive ? '36px' : '28px'}; transition: all 0.3s ease;">
           <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" /></svg>
         </div>`,
  iconSize: [0, 0], iconAnchor: [0, 0]
});

function MapController({ selectedLoc, positions }) {
  const map = useMap();
  useEffect(() => {
    if (selectedLoc) {
      map.flyTo(selectedLoc.coords, 8, { duration: 1.5 });
    } else if (positions && positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6, animate: true, duration: 1.2 });
    }
    const timer = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(timer);
  }, [map, selectedLoc, positions]);
  return null;
}

const typeColors = {
  "인물": { bg: "#7CB342", text: "#1E3A8A" }, 
  "사건": { bg: "#8BC34A", text: "#7C2D12" }, 
  "신": { bg: "#558B2F", text: "#064E3B" }, 
  "사물": { bg: "#689F38", text: "#4C1D95" }
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

  const displayRoutes = useMemo(() => {
    const term = mapSearch.replace(/\s+/g, '').toLowerCase() || cleanTerm;
    if (!term) return wikiData.mapRoutes;
    return wikiData.mapRoutes.map(route => {
      const filteredPlaces = route.places.filter(p => p.name.replace(/\s+/g, '').toLowerCase().includes(term));
      return { ...route, places: filteredPlaces };
    }).filter(route => route.places.length > 0);
  }, [cleanTerm, mapSearch]);
  
  const mapPositions = useMemo(() => wikiData.mapRoutes.flatMap(r => r.places.map(p => p.coords)), []);

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
       setSelectedCharacter({
          name: node.id,
          group: node.group || '상세 정보',
          data: charData
       });
    } else {
       setSelectedCharacter({
          name: node.id,
          group: node.group || '상세 정보',
          data: "상세 설명, 해석 및 사역 내역이 아직 등록되지 않은 항목입니다."
       });
    }
  }, []);

  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;
  const pageBg = isDark ? 'bg-[#162218]' : 'bg-[#F1F7EC]';
  const cardStyle = isDark 
    ? 'bg-[#1D2D1F]/80 border border-[#344C36] shadow-sm backdrop-blur-2xl rounded-[20px] md:rounded-[24px]' 
    : 'bg-white/80 border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-2xl rounded-[20px] md:rounded-[24px]';
  const textMainStyle = isDark ? 'text-[#E8F3E5]' : 'text-[#1D2D1F]';
  const textSubStyle = isDark ? 'text-[#9DBB96]' : 'text-[#4A6B44]';
  const inputBgStyle = isDark ? 'bg-[#162218]/60 border border-[#344C36]' : 'bg-[#F9FCF7] border border-[#D1E2C9]';
  const borderStyle = isDark ? 'border-[#344C36]' : 'border-[#D1E2C9]';

  return (
    <div className={`flex-1 flex flex-col h-full ${pageBg} pointer-events-auto relative overflow-hidden font-sans`}>
      
      {/* S-Curve 유려한 이중 곡선 배경 */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
         <svg preserveAspectRatio="none" viewBox="0 0 1440 600" className="w-full h-full absolute top-0 left-0">
            <path d="M0,0 L1440,0 L1440,250 C1100,550 400,-50 0,350 Z" fill={isDark ? "#1D2D1F" : "#E5F0DE"} opacity={isDark ? "0.6" : "0.7"} />
            <path d="M0,0 L1440,0 L1440,150 C1000,400 500,50 0,250 Z" fill={isDark ? "#162218" : "#F1F7EC"} opacity="1" />
         </svg>
      </div>

      {/* 상단 헤더 */}
      <div className={`px-4 md:px-8 py-4 backdrop-blur-xl border-b ${borderStyle} sticky top-0 z-[100] flex items-center gap-3 bg-transparent`}>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-xl backdrop-blur-md transition-colors border shadow-sm ${isDark ? 'bg-[#1D2D1F]/50 border-[#344C36] text-white hover:bg-[#243627]' : 'bg-white/50 border-white text-[#1D2D1F] hover:bg-white'}`}>☰</button>
        <button onClick={() => setActiveScreen('home')} className={`p-2 rounded-xl backdrop-blur-md transition-colors border shadow-sm ${isDark ? 'bg-[#1D2D1F]/50 border-[#344C36] text-white hover:bg-[#243627]' : 'bg-white/50 border-white text-[#1D2D1F] hover:bg-white'}`}>&larr;</button>
        <div className="flex-1"><h1 className={`text-[16px] md:text-[17px] font-extrabold ${textMainStyle} tracking-tight`}>성경 위키</h1></div>
      </div>

      <div className={`px-4 md:px-8 py-2.5 backdrop-blur-xl z-50 flex items-center gap-2 bg-transparent`}>
        <div className={`flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl ${inputBgStyle}`}>
          <SearchIcon className={`w-4 h-4 ${textSubStyle} shrink-0`} isDark={isDark} />
          <input 
            type="text" 
            value={wikiSearchTerm || ''} 
            onChange={(e) => setWikiSearchTerm && setWikiSearchTerm(e.target.value)}
            placeholder="위키 전체 검색..." 
            className={`w-full bg-transparent text-[14px] md:text-[15px] outline-none ${textMainStyle} placeholder:${textSubStyle}`}
          />
          {wikiSearchTerm && (
            <button onClick={() => setWikiSearchTerm && setWikiSearchTerm('')} className={`text-xs font-bold ${textSubStyle} hover:${textMainStyle} px-1`}>✕</button>
          )}
        </div>
      </div>

      <div className={`flex overflow-x-auto hide-scrollbar px-4 md:px-8 pt-3 pb-2 z-40 border-b ${borderStyle} bg-transparent`}>
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
            className={`flex items-center shrink-0 px-4 py-2.5 mb-1 mr-2.5 rounded-xl text-[13px] md:text-[14px] font-bold transition-all shadow-sm border ${activeTab === tab.id ? `bg-[#7CB342] text-white border-transparent shadow-md` : `${isDark ? 'bg-[#1D2D1F]/50 text-[#E8F3E5] border-[#344C36]' : 'bg-white/80 text-[#1D2D1F] border-white'} hover:opacity-80`}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 hide-scrollbar w-full max-w-none mx-auto">
        
        {/* 📚 성경 심층 분석 탭 */}
        {activeTab === 'analysis' && (
          <div className="w-full space-y-6 pb-20 animate-fade-in-up">
             
             <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                {Object.keys(bookAnalysisData).map(bookKey => (
                   <button 
                      key={bookKey}
                      onClick={() => setSelectedAnalysisBook(bookKey)}
                      className={`px-4.5 py-2.5 rounded-xl text-[13px] md:text-[14px] font-bold shadow-sm whitespace-nowrap transition-all border ${selectedAnalysisBook === bookKey ? 'bg-[#7CB342] text-white border-transparent' : `${isDark ? 'bg-[#1D2D1F]/50 border-[#344C36]' : 'bg-white/80 border-white'} ${textMainStyle}`}`}
                   >
                      {bookAnalysisData[bookKey].meta.name}
                   </button>
                ))}
             </div>

             {activeBookData && (
                <div className="space-y-6">
                  <div className={`relative rounded-[24px] md:rounded-[32px] overflow-hidden p-6 md:p-12 ${cardStyle}`}>
                     <span className={`text-[11px] md:text-sm font-extrabold tracking-widest uppercase mb-2 block ${textSubStyle}`}>개혁주의 구속사적 심층 연구 보고서</span>
                     <h2 className={`text-3xl md:text-5xl font-black tracking-tight mb-2 ${textMainStyle}`}>{activeBookData.meta.name} <span className="text-xl md:text-2xl opacity-70 font-normal">({activeBookData.meta.enName})</span></h2>
                     <span className={`text-lg md:text-xl font-bold block mb-6 md:mb-8 ${textSubStyle}`}>{activeBookData.meta.hebName}</span>
                     
                     <div className={`inline-flex flex-wrap gap-3 md:gap-4 text-[13px] md:text-[14px] font-bold ${isDark ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/5'} px-5 py-3 rounded-2xl`}>
                        <div className={`flex items-center gap-1.5 ${textMainStyle}`}><span className={textSubStyle}>저자:</span> {activeBookData.meta.author}</div>
                        <div className={`hidden md:block w-[1px] h-4 ${isDark ? 'bg-white/10' : 'bg-black/10'}`}></div>
                        <div className={`flex items-center gap-1.5 ${textMainStyle}`}><span className={textSubStyle}>기록 연대:</span> {activeBookData.meta.date}</div>
                     </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                     <div className={`${cardStyle} p-6 md:p-8`}>
                        <h3 className={`text-lg md:text-xl font-bold mb-4 flex items-center tracking-tight ${textMainStyle}`}>
                          <Icons.SearchRef className="w-5 h-5 mr-2 text-[#7CB342]" /> 핵심 키워드
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-5">
                           {activeBookData.meta.keywords.map((kw, i) => (
                              <span key={i} className={`px-3.5 py-1.5 rounded-xl text-[13px] md:text-[14px] font-bold ${isDark ? 'bg-[#7CB342]/20 text-[#A9D179]' : 'bg-[#E5F0DE] text-[#558B2F]'}`}>
                                 #{kw}
                              </span>
                           ))}
                        </div>
                        <p className={`text-[14px] md:text-[15px] leading-relaxed font-medium ${textSubStyle}`}>{activeBookData.meta.intro}</p>
                     </div>

                     <div className={`${cardStyle} p-6 md:p-8`}>
                        <h3 className={`text-lg md:text-xl font-bold mb-4 flex items-center tracking-tight ${textMainStyle}`}>
                          <Icons.Book className="w-5 h-5 mr-2 text-[#7CB342]" /> 대표 요절
                        </h3>
                        <div className="space-y-3">
                           {activeBookData.meta.keyVerses.map((v, i) => (
                              <div 
                                 key={i} 
                                 onClick={() => setPopupVerseData({ query: v.ref, verses: getVersesFromQuery(v.ref, bibles) })}
                                 className={`p-4 rounded-2xl ${isDark ? 'bg-black/30 hover:bg-black/50 border border-white/5' : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'} cursor-pointer transition-colors group`}
                              >
                                 <span className={`text-[12px] md:text-[13px] font-extrabold ${accentGrass} flex items-center mb-1.5`}>
                                   {v.ref} <Icons.SearchRef className="w-3 h-3 ml-1 opacity-50" />
                                 </span>
                                 <span className={`text-[14px] md:text-[15px] ${textMainStyle} font-medium leading-relaxed`}>"{v.text}"</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className={`${cardStyle} p-6 md:p-10`}>
                     <h3 className={`text-xl md:text-2xl font-bold mb-3 tracking-tight ${textMainStyle}`}>{activeBookData.context.title}</h3>
                     <p className={`text-[13px] md:text-[15px] font-medium ${textSubStyle} mb-8`}>{activeBookData.context.desc}</p>
                     <div className="space-y-8">
                        {activeBookData.context.items.map((item, i) => (
                           <div key={i}>
                              <h4 className={`text-[15px] md:text-[17px] font-bold mb-2 flex items-center ${textMainStyle}`}>
                                <Icons.Pin className="w-4 h-4 mr-2 text-[#7CB342]" /> {item.subtitle}
                              </h4>
                              <p className={`text-[14px] md:text-[15px] leading-[1.7] whitespace-pre-wrap font-medium ${textSubStyle}`}>{item.content}</p>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className={`${cardStyle} p-6 md:p-10`}>
                     <h3 className={`text-xl md:text-2xl font-bold mb-3 tracking-tight ${textMainStyle}`}>{activeBookData.structure.title}</h3>
                     <p className={`text-[13px] md:text-[15px] font-medium ${textSubStyle} mb-8`}>{activeBookData.structure.desc}</p>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                        {activeBookData.structure.parts.map((p, i) => (
                           <div key={i} className={`p-5 rounded-2xl ${isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-200'}`}>
                              <h4 className={`font-bold text-[14px] md:text-[15px] mb-2 ${textMainStyle}`}>{p.name}</h4>
                              <p className={`text-[13px] md:text-[14px] font-medium ${textSubStyle} leading-relaxed break-keep`}>{p.summary}</p>
                           </div>
                        ))}
                     </div>
                  
                     {activeBookData.characters && (
                       <div className={`mt-10 pt-8 border-t ${borderStyle}`}>
                          <h3 className={`text-xl md:text-2xl font-bold mb-3 tracking-tight ${textMainStyle}`}>{activeBookData.characters.title}</h3>
                          <p className={`text-[13px] md:text-[15px] font-medium ${textSubStyle} mb-8 whitespace-pre-wrap`}>{activeBookData.characters.desc}</p>
                          <div className="grid md:grid-cols-2 gap-6">
                             {activeBookData.characters.items.map((char, i) => (
                                <div key={i} className={`p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-200'}`}>
                                   <h4 className={`text-[16px] md:text-[17px] font-bold mb-4 flex items-center ${textMainStyle}`}>
                                     <Icons.Person className="w-5 h-5 mr-2 text-[#7CB342]" /> {char.name}
                                   </h4>
                                   <div className={`text-[14px] md:text-[15px] leading-relaxed whitespace-pre-wrap font-medium ${textSubStyle}`}>
                                      {char.desc && <p>{char.desc}</p>}
                                      {char.details && char.details.length > 0 && (
                                        <div className="space-y-3 mt-2">
                                          {char.details.map((detail, idx) => (
                                            <div key={idx} className="flex flex-col gap-1">
                                              <span className={`text-[11px] md:text-[12px] font-extrabold ${accentGrass}`}>{detail.label}</span>
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
                    <div className={`${cardStyle} p-6 md:p-10 relative overflow-hidden`}>
                       <div className={`absolute top-0 left-0 w-2 h-full bg-[#7CB342]`}></div>
                       <h3 className={`text-xl md:text-2xl font-bold mb-3 tracking-tight ${textMainStyle}`}>{activeBookData.theology.title}</h3>
                       <p className={`text-[13px] md:text-[15px] font-medium ${textSubStyle} mb-8 whitespace-pre-wrap`}>{activeBookData.theology.desc}</p>
                       
                       <div className="space-y-6">
                          {activeBookData.theology.items.map((item, i) => (
                             <div key={i} className={`p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-200'}`}>
                                <h4 className={`font-bold text-[15px] md:text-[16px] mb-3 ${accentGrass}`}>{item.sub || item.subtitle}</h4>
                                <div className={`text-[14px] md:text-[15px] leading-[1.7] whitespace-pre-wrap font-medium ${textSubStyle}`}>
                                  {item.text || item.content}
                                </div>
                                
                                {item.table && (
                                  <div className={`mt-5 overflow-x-auto rounded-2xl border ${borderStyle}`}>
                                    <table className="w-full text-left border-collapse min-w-[500px]">
                                      <thead>
                                        <tr className={isDark ? "bg-white/5" : "bg-white"}>
                                          {item.table.headers.map((header, hIdx) => (
                                            <th key={hIdx} className={`p-4 text-[13px] md:text-[14px] font-bold border-b ${borderStyle} ${textMainStyle}`}>
                                              {header}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {item.table.rows.map((row, rIdx) => (
                                          <tr key={rIdx} className={`border-b last:border-b-0 ${borderStyle} ${isDark ? "hover:bg-white/5" : "hover:bg-white"}`}>
                                            {row.map((cell, cIdx) => (
                                              <td key={cIdx} className={`p-4 text-[13px] md:text-[14px] font-medium ${textSubStyle}`}>
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
                    <div className={`${cardStyle} p-6 md:p-10`}>
                       <h3 className={`text-xl md:text-2xl font-bold mb-6 tracking-tight ${textMainStyle}`}>{activeBookData.glossary.title}</h3>
                       <div className="grid md:grid-cols-2 gap-6">
                          {activeBookData.glossary.items.map((word, i) => (
                             <div key={i} className={`flex flex-col p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-200'} transition-colors group`}>
                                <div className="flex justify-between items-start mb-3">
                                   <div>
                                      <span className={`text-2xl md:text-3xl font-bold ${accentGrass} mr-2`} dir="rtl">{word.heb}</span>
                                      <span className={`text-[11px] md:text-[12px] font-medium ${textSubStyle} uppercase tracking-wider`}>[{word.pron}]</span>
                                   </div>
                                   <span className={`text-[14px] md:text-[15px] font-bold ${textMainStyle}`}>{word.kr}</span>
                                </div>
                                <p className={`text-[14px] md:text-[15px] leading-relaxed whitespace-pre-wrap font-medium ${textSubStyle} flex-1`}>{word.desc}</p>
                                {word.ref && (
                                  <div 
                                     onClick={() => setPopupVerseData({ query: word.ref, verses: getVersesFromQuery(word.ref, bibles) })}
                                     className={`mt-4 text-[12px] md:text-[13px] font-bold ${accentGrass} cursor-pointer hover:underline text-right flex items-center justify-end gap-1`}
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

        {/* 🌳 심층 연대기 탭 */}
        {activeTab === 'chrono' && (
          <div className="w-full space-y-6 pb-20 animate-fade-in-up">
             <div className={`${cardStyle} p-6 md:p-8 mb-6`}>
               <h2 className={`text-xl md:text-2xl font-bold tracking-tight flex items-center ${textMainStyle}`}>
                 <Icons.Tree className="w-6 h-6 mr-3 text-[#7CB342]" /> 성경 구속사 심층 트리
               </h2>
               <p className={`text-[13px] md:text-[14px] font-medium ${textSubStyle} mt-2`}>시대를 클릭하여 인물 계보와 핵심 사건을 마인드맵처럼 펼쳐보세요.</p>
             </div>

             <div className={`relative pl-4 md:pl-8 border-l-2 ${borderStyle} space-y-6 md:space-y-8`}>
                {filteredChronoData.map((era) => (
                  <div key={era.id} className="relative">
                    <div className={`absolute -left-[21px] md:-left-[41px] top-6 w-4 h-4 bg-[#7CB342] rounded-full border-4 ${isDark ? 'border-[#162218]' : 'border-[#F1F7EC]'} z-10`}></div>
                    
                    <div className={`${cardStyle} overflow-hidden transition-all duration-300`}>
                      <button 
                        onClick={() => setExpandedChrono(expandedChrono === era.id ? null : era.id)}
                        className={`w-full text-left p-6 md:p-8 flex justify-between items-center transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                      >
                        <div>
                          <span className={`text-[10px] md:text-[11px] font-extrabold ${isDark ? 'bg-white/10 text-[#A9D179]' : 'bg-[#E5F0DE] text-[#558B2F]'} px-3 py-1 rounded-full mb-3 inline-block`}>{era.scope}</span>
                          <h3 className={`text-[16px] md:text-[18px] font-bold tracking-tight ${textMainStyle}`}>{era.title}</h3>
                        </div>
                        <Icons.ChevronRight className={`w-5 h-5 ${textSubStyle} transition-transform ${expandedChrono === era.id ? 'rotate-90' : ''}`} />
                      </button>

                      {expandedChrono === era.id && (
                        <div className={`px-6 md:px-8 pb-8 pt-0 animate-fade-in-up border-t ${borderStyle} mt-2`}>
                           <div className={`p-5 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'} mt-6 mb-8 text-[14px] md:text-[15px] font-medium leading-relaxed ${textSubStyle}`}>
                             "{era.summary}"
                           </div>
                           
                           <div className="mb-8">
                              <h4 className={`text-[13px] md:text-[14px] font-bold ${textMainStyle} mb-4 flex items-center`}>
                                <Icons.Person className="w-4 h-4 mr-2 text-[#7CB342]" /> 핵심 인물 흐름
                              </h4>
                              <div className="flex flex-wrap items-center gap-2">
                                 {era.figures.map((fig, idx) => (
                                   <React.Fragment key={idx}>
                                     <span className={`${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200'} border ${textMainStyle} px-4 py-2 rounded-xl text-[12px] md:text-[13px] font-bold shadow-sm`}>{fig}</span>
                                     {idx < era.figures.length - 1 && <Icons.ArrowRight className={`w-4 h-4 ${textSubStyle}`} />}
                                   </React.Fragment>
                                 ))}
                              </div>
                           </div>
                           
                           <div>
                              <h4 className={`text-[13px] md:text-[14px] font-bold ${textMainStyle} mb-4 flex items-center`}>
                                <Icons.Book className="w-4 h-4 mr-2 text-[#7CB342]" /> 주요 사건 본문 매핑
                              </h4>
                              <div className="grid gap-3">
                                 {era.events.map((evt, idx) => (
                                   <div key={idx} className={`flex flex-col sm:flex-row sm:justify-between sm:items-center ${isDark ? 'bg-white/5' : 'bg-slate-50'} p-4 rounded-2xl gap-3 border ${borderStyle}`}>
                                      <span className={`text-[13px] md:text-[14px] font-bold ${textMainStyle}`}>{evt.name}</span>
                                      <span 
                                        onClick={() => setPopupVerseData({ query: evt.refs, verses: getVersesFromQuery(evt.refs, bibles) })}
                                        className={`text-[11px] md:text-[12px] font-extrabold cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 ${isDark ? 'bg-white/10 text-[#A9D179]' : 'bg-white text-[#558B2F]'} px-3.5 py-1.5 rounded-xl border ${borderStyle} self-start sm:self-auto`}
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

        {/* 🕸️ 인물 관계망 탭 */}
        {activeTab === 'network' && (
          <div ref={graphContainerRef} className={`w-full h-[65vh] min-h-[500px] md:h-[650px] ${isDark ? 'bg-[#181A20]' : 'bg-white'} rounded-[24px] border ${borderStyle} overflow-hidden relative shadow-sm animate-fade-in-up`}>
            <div className={`absolute top-5 left-5 z-10 ${isDark ? 'bg-[#1C1C1E]/90' : 'bg-white/90'} px-4 py-3 rounded-2xl shadow-sm backdrop-blur-md pointer-events-none border ${borderStyle}`}>
               <h4 className={`font-bold text-[14px] md:text-[15px] flex items-center ${textMainStyle}`}>
                 <Icons.Network className="w-5 h-5 mr-2 text-[#7CB342]" /> 성경 인물 유니버스
               </h4>
               <p className={`text-[12px] mt-1 font-medium ${textSubStyle}`}>노드를 클릭하면 상세 해설이 나타납니다.</p>
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
                  ctx.font = `${fontSize}px Pretendard, sans-serif`;
                  
                  const isCenter = label === '예수 그리스도';
                  const radius = isCenter ? 8 / globalScale : 4 / globalScale;
                  
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                  ctx.fillStyle = typeColors[node.group]?.bg || node.color || '#7CB342';
                  ctx.fill();

                  if (isCenter) {
                    ctx.strokeStyle = isDark ? 'rgba(169, 209, 121, 0.8)' : 'rgba(124, 179, 66, 0.8)';
                    ctx.lineWidth = 3 / globalScale;
                    ctx.stroke();
                    ctx.shadowColor = isDark ? 'rgba(169, 209, 121, 1)' : 'rgba(124, 179, 66, 1)';
                    ctx.shadowBlur = 15 / globalScale;
                  } else {
                    ctx.shadowBlur = 0;
                  }

                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'top';
                  ctx.fillStyle = isDark ? '#E8F3E5' : '#1D2D1F';
                  if (isCenter) ctx.fillStyle = isDark ? '#A9D179' : '#558B2F';
                  
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

        {/* ✨ 예언 성취 분석 탭 */}
        {activeTab === 'prophecy' && (
          <div className="w-full space-y-6 md:space-y-8 pb-32 animate-fade-in-up">
             <section className={`${cardStyle} p-6 md:p-10`}>
                <h2 className={`text-xl md:text-2xl font-bold tracking-tight mb-4 md:mb-6 flex items-center ${textMainStyle}`}>
                  <Icons.Star className={`w-6 h-6 mr-3 ${accentGrass}`} /> {prophecyReportData.intro.title}
                </h2>
                <div className={`space-y-4 text-[14px] md:text-[15px] leading-relaxed font-medium ${textSubStyle}`}>
                   {prophecyReportData.intro.content.map((p, i) => <p key={i}>{p}</p>)}
                </div>
             </section>

             <div className="grid md:grid-cols-2 gap-6">
               <section className={`${cardStyle} p-6 md:p-8`}>
                  <h3 className={`text-lg md:text-xl font-bold tracking-tight mb-5 ${textMainStyle}`}>{prophecyReportData.hermeneutics.title}</h3>
                  <div className="space-y-5">
                    {prophecyReportData.hermeneutics.items.map((item, i) => (
                      <div key={i}>
                         <h4 className={`text-[14px] md:text-[15px] font-extrabold mb-2 text-[#7CB342]`}>{item.subtitle}</h4>
                         <p className={`text-[14px] md:text-[15px] leading-relaxed font-medium ${textSubStyle}`}>{item.text}</p>
                      </div>
                    ))}
                  </div>
               </section>

               <section className={`${cardStyle} p-6 md:p-8`}>
                  <h3 className={`text-lg md:text-xl font-bold tracking-tight mb-5 ${textMainStyle}`}>{prophecyReportData.statistics.title}</h3>
                  <div className={`space-y-4 text-[14px] md:text-[15px] leading-relaxed font-medium ${textSubStyle}`}>
                    {prophecyReportData.statistics.content.map((p, i) => <p key={i}>{p}</p>)}
                  </div>
               </section>
             </div>
             
             <div className="space-y-4 pt-2">
               {prophecyReportData.categories.map((category, idx) => {
                 return (
                 <div key={idx} className={`${cardStyle} overflow-hidden transition-all duration-300`}>
                   <button 
                     onClick={() => setExpandedProphecySec(expandedProphecySec === idx ? null : idx)}
                     className={`w-full text-left px-6 md:px-8 py-6 flex justify-between items-center transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                   >
                      <div>
                        <h3 className={`font-bold text-[15px] md:text-[17px] ${textMainStyle}`}>{category.title}</h3>
                        <p className={`text-[12px] md:text-[13px] mt-1.5 font-medium ${textSubStyle}`}>{category.desc}</p>
                      </div>
                      <Icons.ChevronRight className={`w-5 h-5 ${textSubStyle} transition-transform ${expandedProphecySec === idx ? 'rotate-90' : ''}`} />
                   </button>
                   
                   {expandedProphecySec === idx && (
                     <div className={`px-6 md:px-8 pb-8 pt-0 animate-fade-in-up`}>
                       <div className="space-y-6">
                         {category.items.map((item, iIdx) => (
                           <div key={iIdx} className={`flex flex-col gap-5 p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-200'}`}>
                              <div className="space-y-3">
                                <h4 className={`font-bold text-[15px] md:text-[16px] ${textMainStyle}`}>{item.topic}</h4>
                                <div className={`text-[14px] md:text-[15px] leading-relaxed font-medium ${textSubStyle}`}>
                                  {item.text}
                                </div>
                              </div>
                              
                              <div className={`flex flex-col gap-2 p-4 rounded-2xl ${isDark ? 'bg-[#162218]/80 border border-[#344C36]' : 'bg-white border border-slate-200'}`}>
                                 <div 
                                   onClick={() => setPopupVerseData({ query: item.old, verses: getVersesFromQuery(item.old, bibles) })}
                                   className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-50 hover:bg-slate-100'} transition-colors`}
                                 >
                                    <div>
                                      <div className={`text-[10px] md:text-[11px] font-extrabold ${textSubStyle} mb-0.5`}>구약의 예언</div>
                                      <div className={`text-[13px] md:text-[14px] font-bold ${textMainStyle}`}>{item.old}</div>
                                    </div>
                                    <Icons.SearchRef className={`w-4 h-4 ${textSubStyle}`} />
                                 </div>
                                 
                                 <div className="flex justify-center -my-1.5 relative z-10">
                                   <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-[#1D2D1F] border border-[#344C36]' : 'bg-white border border-slate-200'} flex items-center justify-center`}>
                                      <Icons.ArrowDown className={`w-4 h-4 ${textSubStyle}`} />
                                   </div>
                                 </div>

                                 <div 
                                   onClick={() => setPopupVerseData({ query: item.new, verses: getVersesFromQuery(item.new, bibles) })}
                                   className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer ${isDark ? 'bg-[#7CB342]/20 hover:bg-[#7CB342]/30 border border-[#7CB342]/30' : 'bg-[#E5F0DE] hover:bg-[#D1E2C9] border border-[#D1E2C9]'}`}
                                 >
                                    <div>
                                      <div className={`text-[10px] md:text-[11px] font-extrabold ${accentGrass} mb-0.5`}>신약의 성취</div>
                                      <div className={`text-[13px] md:text-[14px] font-bold ${textMainStyle}`}>{item.new}</div>
                                    </div>
                                    <Icons.SearchRef className={`w-4 h-4 ${accentGrass}`} />
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

             <div className="grid md:grid-cols-2 gap-6 mt-6">
                <section className={`${cardStyle} p-6 md:p-8`}>
                  <h3 className={`text-lg md:text-xl font-bold tracking-tight mb-5 ${textMainStyle}`}>{prophecyReportData.apologetics.title}</h3>
                  <div className="space-y-4">
                    {prophecyReportData.apologetics.items.map((item, i) => (
                      <div key={i}>
                        <h4 className={`text-[14px] md:text-[15px] font-extrabold mb-1.5 text-[#CD5C5C]`}>{item.subtitle}</h4>
                        <p className={`text-[14px] md:text-[15px] leading-relaxed font-medium ${textSubStyle}`}>{item.content}</p>
                      </div>
                    ))}
                  </div>
                </section>
                <section className={`${cardStyle} p-6 md:p-8`}>
                   <h3 className={`text-lg md:text-xl font-bold tracking-tight mb-5 ${textMainStyle}`}>{prophecyReportData.conclusion.title}</h3>
                   <div className={`space-y-4 text-[14px] md:text-[15px] leading-relaxed font-medium ${textSubStyle}`}>
                     {prophecyReportData.conclusion.content.map((p, i) => <p key={i}>{p}</p>)}
                   </div>
                </section>
             </div>
          </div>
        )}

        {/* 🌿 절기 인포그래픽 탭 */}
        {activeTab === 'holyweek' && (
          <div className="w-full space-y-8 md:space-y-10 pb-32 animate-fade-in-up">
            <div className={`${cardStyle} overflow-hidden`}>
              <div className="p-8 md:p-10 text-center border-b border-slate-100 dark:border-white/10">
                <span className={`font-extrabold tracking-wider text-[11px] md:text-sm mb-2 block ${accentGrass}`}>Palm Sunday</span>
                <h2 className={`text-2xl md:text-3xl font-black tracking-tight mb-2 ${textMainStyle}`}>{holyWeekData.palmSunday.title}</h2>
                <p className={`text-[13px] md:text-[14px] font-bold mb-4 ${accentGrass}`}>{holyWeekData.palmSunday.subtitle}</p>
                <p className={`text-[14px] md:text-[15px] font-medium leading-relaxed max-w-2xl mx-auto ${textSubStyle}`}>{holyWeekData.palmSunday.intro}</p>
              </div>
              <div className="px-6 md:px-8 pb-8 md:pb-10 grid sm:grid-cols-2 md:grid-cols-3 gap-5 pt-6">
                {holyWeekData.palmSunday.symbols.map((sym, i) => (
                  <div key={i} className={`p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-200'} flex flex-col items-center text-center`}>
                    <div className={`w-14 h-14 rounded-2xl ${isDark ? 'bg-white/10 text-white' : 'bg-white text-slate-900 shadow-sm'} flex items-center justify-center text-2xl mb-4`}>{sym.icon}</div>
                    <h3 className={`text-[15px] md:text-[16px] font-bold mb-2 ${textMainStyle}`}>{sym.title}</h3>
                    {sym.situation && <p className={`text-[12px] md:text-[13px] font-medium leading-relaxed mb-3 ${textSubStyle} bg-black/5 dark:bg-white/5 p-3 rounded-xl`}>{sym.situation}</p>}
                    <p className={`text-[13px] md:text-[14px] font-medium leading-relaxed mb-4 ${textMainStyle}`}>{sym.meaning}</p>
                    <div 
                      onClick={() => setPopupVerseData({ query: sym.verse, verses: getVersesFromQuery(sym.verse, bibles) })}
                      className={`mt-auto text-[12px] md:text-[13px] font-bold ${accentGrass} cursor-pointer hover:underline`}
                    >
                      {sym.verse}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${cardStyle} overflow-hidden`}>
              <div className="p-8 md:p-10 text-center border-b border-slate-100 dark:border-white/10">
                <span className={`font-extrabold tracking-wider text-[11px] md:text-sm mb-2 block text-[#DAA520]`}>Holy Week</span>
                <h2 className={`text-2xl md:text-3xl font-black tracking-tight mb-2 ${textMainStyle}`}>{holyWeekData.holyWeek.title}</h2>
                <p className={`text-[13px] md:text-[14px] font-bold mb-4 text-[#DAA520]`}>{holyWeekData.holyWeek.subtitle}</p>
                <p className={`text-[14px] md:text-[15px] font-medium leading-relaxed max-w-2xl mx-auto ${textSubStyle}`}>{holyWeekData.holyWeek.intro}</p>
              </div>
              
              <div className="px-6 md:px-8 pb-8 md:pb-10 pt-6 relative">
                <div className={`absolute left-[41px] md:left-[53px] top-10 bottom-10 w-[2px] ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                <div className="space-y-8 md:space-y-10 relative z-10">
                  {holyWeekData.holyWeek.timeline.map((day, i) => (
                    <div key={i} className="flex gap-5">
                      <div className={`w-10 h-10 shrink-0 rounded-2xl ${isDark ? 'bg-[#1D2D1F] border border-[#344C36]' : 'bg-white border border-slate-200'} shadow-sm flex items-center justify-center text-lg z-10`}>
                        {day.icon}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                          <h3 className={`text-[16px] md:text-[18px] font-bold ${textMainStyle}`}>{day.day} <span className={`text-[13px] md:text-[14px] font-medium ml-0 sm:ml-1 block sm:inline ${textSubStyle}`}>{day.title}</span></h3>
                        </div>
                        <div 
                          onClick={() => setPopupVerseData({ query: day.verse, verses: getVersesFromQuery(day.verse, bibles) })}
                          className={`inline-block mb-3 text-[11px] md:text-[12px] font-bold ${accentGrass} cursor-pointer hover:underline`}
                        >
                          {day.verse}
                        </div>
                        <p className={`text-[14px] md:text-[15px] font-medium leading-relaxed mb-4 ${textSubStyle}`}>{day.detail}</p>
                        <div className={`p-4 rounded-2xl ${isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-200'} text-[13px] md:text-[14px] font-medium leading-relaxed ${textMainStyle}`}>
                          <span className={`font-bold block mb-1 text-[#DAA520]`}>구속사적 의미</span> 
                          <span className={`${textSubStyle}`} dangerouslySetInnerHTML={{ __html: day.theology.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`${cardStyle} overflow-hidden`}>
              <div className="p-8 md:p-10 text-center border-b border-slate-100 dark:border-white/10">
                <span className={`font-extrabold tracking-wider text-[11px] md:text-sm mb-2 block ${accentGrass}`}>Easter</span>
                <h2 className={`text-2xl md:text-3xl font-black tracking-tight mb-2 ${textMainStyle}`}>{holyWeekData.easter.title}</h2>
                <p className={`text-[13px] md:text-[14px] font-bold mb-4 ${accentGrass}`}>{holyWeekData.easter.subtitle}</p>
                <p className={`text-[14px] md:text-[15px] font-medium leading-relaxed max-w-2xl mx-auto ${textSubStyle}`}>{holyWeekData.easter.intro}</p>
              </div>
              <div className="px-6 md:px-8 pb-8 md:pb-10 grid sm:grid-cols-2 md:grid-cols-3 gap-5 pt-6">
                {holyWeekData.easter.symbols.map((sym, i) => (
                  <div key={i} className={`p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-200'} flex flex-col items-center text-center`}>
                    <div className={`w-14 h-14 rounded-2xl ${isDark ? 'bg-white/10 text-white' : 'bg-white text-slate-900 shadow-sm'} flex items-center justify-center text-2xl mb-4`}>{sym.icon}</div>
                    <h3 className={`text-[15px] md:text-[16px] font-bold mb-2 ${textMainStyle}`}>{sym.title}</h3>
                    <p className={`text-[13px] md:text-[14px] font-medium leading-relaxed mb-4 ${textSubStyle}`}>{sym.text}</p>
                    <div 
                      onClick={() => setPopupVerseData({ query: sym.verse, verses: getVersesFromQuery(sym.verse, bibles) })}
                      className={`mt-auto text-[12px] md:text-[13px] font-bold ${accentGrass} cursor-pointer hover:underline`}
                    >
                      {sym.verse}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 🗺️ 지도 이동 탭 */}
        {activeTab === 'map' && (
          <div className={`flex flex-col md:flex-row w-full h-[70vh] min-h-[500px] md:min-h-[600px] ${cardStyle} overflow-hidden animate-fade-in-up`}>
            
            <div className={`flex flex-col w-full h-[40%] md:h-full md:w-1/3 md:max-w-[320px] border-b md:border-b-0 md:border-r ${borderStyle} ${isDark ? 'bg-[#181A20]' : 'bg-white'}`}>
              <div className={`p-4 border-b ${borderStyle}`}>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${inputBgStyle}`}>
                  <SearchIcon className={`w-4 h-4 ${textSubStyle} shrink-0`} isDark={isDark} />
                  <input 
                    type="text" 
                    value={mapSearch} 
                    onChange={(e) => setMapSearch(e.target.value)}
                    placeholder="장소, 인물 검색..." 
                    className={`w-full bg-transparent text-[13px] md:text-[14px] outline-none font-medium ${textMainStyle}`}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto hide-scrollbar">
                {displayRoutes.length === 0 ? (
                  <div className={`p-8 text-center text-[12px] md:text-[13px] font-medium ${textSubStyle}`}>검색 결과가 없습니다.</div>
                ) : (
                  displayRoutes.map(route => (
                    <div key={route.id} className="mb-2">
                      <div className={`px-4 py-2 text-[11px] font-extrabold ${accentGrass} ${isDark ? 'bg-white/5' : 'bg-slate-100'} sticky top-0 z-10 backdrop-blur-md`}>
                        {route.name}
                      </div>
                      {route.places.map(loc => (
                        <div 
                          key={loc.id} 
                          onClick={() => setSelectedLoc(loc)}
                          className={`p-4 border-b ${borderStyle} cursor-pointer transition-colors ${selectedLoc?.id === loc.id ? (isDark ? 'bg-[#7CB342]/20' : 'bg-[#E5F0DE]') : (isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50')}`}
                        >
                          <h4 className={`text-[14px] md:text-[15px] font-bold ${textMainStyle} mb-1 flex items-center justify-between`}>
                            {loc.name}
                            <Icons.ChevronRight className={`w-4 h-4 ${textSubStyle}`} />
                          </h4>
                          <p className={`text-[12px] font-medium ${textSubStyle} line-clamp-1`}>{loc.event}</p>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={`w-full h-[60%] md:h-full md:flex-1 relative ${isDark ? 'bg-[#000000]' : 'bg-[#F2F2F7]'} z-0`}>
              <MapContainer 
                center={[31.7, 35.2]} 
                zoom={5} 
                scrollWheelZoom={true} 
                dragging={true}
                zoomControl={true}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
              >
                <MapController selectedLoc={selectedLoc} positions={mapPositions} /> 
                {isDark ? (
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/">CARTO</a>' />
                ) : (
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/">CARTO</a>' />
                )}
                {displayRoutes.map((route, rIdx) => (
                  <React.Fragment key={route.id}>
                    {route.places.map((loc) => {
                      const isActive = selectedLoc?.id === loc.id;
                      return (
                        <Marker 
                          key={`${route.id}-${loc.id}`} 
                          position={loc.coords} 
                          icon={createPinIcon(isActive)}
                          eventHandlers={{ click: () => setSelectedLoc(loc) }}
                        >
                          <Tooltip direction="top" offset={[0, -30]} opacity={1} className="custom-tooltip">
                            <span className="font-bold text-[13px]">{loc.name}</span>
                          </Tooltip>
                        </Marker>
                      );
                    })}
                    <Polyline positions={route.places.map(p => p.coords)} color={rIdx % 2 === 0 ? "#7CB342" : "#8BC34A"} weight={3} opacity={0.6} dashArray="5, 8" />
                  </React.Fragment>
                ))}
              </MapContainer>
              
              {selectedLoc && (
                <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm ${isDark ? 'bg-[#181A20]/95 border-white/10' : 'bg-white/95 border-slate-200'} backdrop-blur-xl p-5 rounded-2xl shadow-xl border z-[1000] animate-fade-in-up`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-[15px] md:text-[16px] font-bold ${textMainStyle}`}>{selectedLoc.name}</h3>
                    <button onClick={() => setSelectedLoc(null)} className={`${textSubStyle} hover:${textMainStyle} p-1`}>✕</button>
                  </div>
                  <p className={`text-[12px] md:text-[13px] font-extrabold ${accentGrass} mb-2`}>{selectedLoc.event}</p>
                  <p className={`leading-relaxed font-medium ${textSubStyle} text-[12px] md:text-[13px] line-clamp-3 mb-3`}>{selectedLoc.desc}</p>
                  <div 
                    onClick={() => setPopupVerseData({ query: selectedLoc.verse, verses: getVersesFromQuery(selectedLoc.verse, bibles) })}
                    className={`text-[11px] md:text-[12px] font-bold ${textMainStyle} cursor-pointer inline-block ${isDark ? 'bg-white/10' : 'bg-slate-100'} px-3 py-1.5 rounded-xl`}
                  >
                    📖 {selectedLoc.verse} 보기
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {popupVerseData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[1000] flex items-center justify-center p-4 pointer-events-auto">
          <div className={`${isDark ? 'bg-[#181A20] border-white/10' : 'bg-white border-slate-200'} rounded-3xl shadow-2xl border overflow-hidden w-full max-w-md animate-fade-in-up max-h-[85vh] flex flex-col`}>
            <div className={`px-6 py-4 flex justify-between items-center border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
              <h3 className={`font-bold ${textMainStyle} text-[14px] md:text-[15px]`}>
                {popupVerseData.query}
              </h3>
              <button onClick={() => setPopupVerseData(null)} className={`${textSubStyle} hover:${textMainStyle} text-xl w-8 h-8 flex items-center justify-center rounded-full transition-colors`}>
                &times;
              </button>
            </div>
            <div className={`p-6 overflow-y-auto space-y-4`}>
              {popupVerseData.verses.map((v, i) => (
                 <div key={i} className={`text-[14px] md:text-[15px] leading-relaxed ${textMainStyle} font-medium`}>
                    <span className={`font-extrabold ${accentGrass} mr-2`}>{v.ref.split(':')[1]}</span>
                    {v.text}
                 </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedCharacter && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[1000] flex items-center justify-center p-4 pointer-events-auto">
          <div className={`${isDark ? 'bg-[#181A20] border-white/10' : 'bg-white border-slate-200'} rounded-3xl shadow-2xl border overflow-hidden w-full max-w-lg animate-fade-in-up flex flex-col max-h-[85vh]`}>
            <div className={`px-6 py-4 flex justify-between items-center border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center gap-2.5">
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-[#7CB342]/20 text-[#7CB342]`}>
                  {selectedCharacter.group}
                </span>
                <h3 className={`font-black ${textMainStyle} text-[17px]`}>
                  {selectedCharacter.name}
                </h3>
              </div>
              <button onClick={() => setSelectedCharacter(null)} className={`${textSubStyle} hover:${textMainStyle} text-2xl w-8 h-8 flex items-center justify-center rounded-full transition-colors`}>
                &times;
              </button>
            </div>
            <div className={`p-6 overflow-y-auto space-y-4`}>
              {typeof selectedCharacter.data === 'string' ? (
                <p className={`text-[14px] md:text-[15px] leading-[1.8] ${textMainStyle} whitespace-pre-wrap font-medium`}>
                  {selectedCharacter.data}
                </p>
              ) : (
                <div className="space-y-4">
                   {Object.entries(selectedCharacter.data).map(([key, val]) => (
                      <div key={key}>
                         <h4 className={`text-[13px] font-bold ${accentGrass} mb-1.5 uppercase`}>{key}</h4>
                         <p className={`text-[14px] md:text-[15px] leading-relaxed ${textMainStyle} whitespace-pre-wrap font-medium`}>{val}</p>
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
          background: ${isDark ? 'rgba(24, 26, 32, 0.95)' : 'rgba(255, 255, 255, 0.95)'} !important;
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15) !important;
          padding: 8px 12px !important;
          color: ${isDark ? '#E8F3E5' : '#1D2D1F'} !important;
          font-family: inherit !important;
        }
        .custom-tooltip::before { display: none !important; }
      `}</style>
    </div>
  );
}
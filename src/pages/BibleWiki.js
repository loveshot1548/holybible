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
  html: `<div style="color: ${isActive ? '#EF4444' : '#0284C7'}; transform: translate(-50%, -100%); width: ${isActive ? '36px' : '28px'}; height: ${isActive ? '36px' : '28px'}; transition: all 0.3s ease;">
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

      <div className={`px-3 sm:px-6 py-3 backdrop-blur-md border-b ${borderStyle} sticky top-0 z-[100] flex items-center gap-3 bg-transparent`}>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-[12px] transition-colors border shadow-sm ${isDark ? 'bg-[#111827]/90 border-[#1E293B] text-[#F8FAFC] hover:bg-[#1E293B]' : 'bg-white/90 border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]'}`}><Icons.Menu className="w-5 h-5"/></button>
        <button onClick={() => setActiveScreen('home')} className={`p-2 rounded-[12px] transition-colors border shadow-sm ${isDark ? 'bg-[#111827]/90 border-[#1E293B] text-[#F8FAFC] hover:bg-[#1E293B]' : 'bg-white/90 border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]'}`}><Icons.Back className="w-5 h-5"/></button>
        <div className="flex-1"><h1 className={`text-[15px] sm:text-[16px] font-bold ${textMainStyle} tracking-tight`}>성경 위키</h1></div>
      </div>

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
            className={`flex items-center shrink-0 px-3.5 py-2 mb-1 mr-2 rounded-[12px] text-[12.5px] sm:text-[13px] font-bold transition-all shadow-sm border ${activeTab === tab.id ? `${bgAccentFresh} border-transparent shadow-md` : `${isDark ? 'bg-[#111827]/80 text-[#94A3B8] border-[#1E293B]' : 'bg-white/80 text-[#64748B] border-[#E2E8F0]'} hover:opacity-80`}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 relative z-10 hide-scrollbar w-full max-w-none mx-auto">
        
        {/* 성경 심층 분석 탭 */}
        {activeTab === 'analysis' && (
          <div className="w-full space-y-4 pb-20 animate-fade-in-up">
             
             <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {Object.keys(bookAnalysisData).map(bookKey => (
                   <button 
                      key={bookKey}
                      onClick={() => setSelectedAnalysisBook(bookKey)}
                      className={`px-3.5 py-2 rounded-[12px] text-[12.5px] sm:text-[13px] font-bold shadow-sm whitespace-nowrap transition-all border ${selectedAnalysisBook === bookKey ? `${bgAccentFresh} border-transparent` : `${isDark ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-white border-[#E2E8F0]'} ${textMainStyle}`}`}
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
                    <div className={`w-12 h-12 rounded-[14px] ${isDark ? 'bg-[#0F172A]' : 'bg-white'} border ${borderStyle} flex items-center justify-center text-[20px] mb-3`}><span className="opacity-0"></span>{/* 이모지 제거됨, UI만 유지 */}🌿</div>
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
                        {/* 이모지 제거됨, 대체 텍스트 */}
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
                    <div className={`w-12 h-12 rounded-[14px] ${isDark ? 'bg-[#0F172A]' : 'bg-white'} border ${borderStyle} flex items-center justify-center text-[20px] mb-3`}><span className="opacity-0"></span>🥚</div>
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

        {/* 지도 이동 탭 */}
        {activeTab === 'map' && (
          <div className={`flex flex-col md:flex-row w-full h-[70vh] min-h-[450px] md:min-h-[550px] ${glassCard} overflow-hidden animate-fade-in-up`}>
            
            <div className={`flex flex-col w-full h-[40%] md:h-full md:w-1/3 md:max-w-[300px] border-b md:border-b-0 md:border-r ${borderStyle} ${isDark ? 'bg-[#0B1120]/50' : 'bg-white/50'}`}>
              <div className={`p-3 border-b ${borderStyle}`}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-[10px] ${inputBgStyle} border`}>
                  <Icons.SearchRef className={`w-3.5 h-3.5 ${textSubStyle} shrink-0`} />
                  <input 
                    type="text" 
                    value={mapSearch} 
                    onChange={(e) => setMapSearch(e.target.value)}
                    placeholder="장소, 인물 검색..." 
                    className={`w-full bg-transparent text-[12.5px] sm:text-[13px] outline-none font-medium ${textMainStyle}`}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto hide-scrollbar">
                {displayRoutes.length === 0 ? (
                  <div className={`p-6 text-center text-[11.5px] sm:text-[12px] font-medium ${textSubStyle}`}>검색 결과가 없습니다.</div>
                ) : (
                  displayRoutes.map(route => (
                    <div key={route.id} className="mb-2">
                      <div className={`px-3.5 py-1.5 text-[10.5px] font-bold ${isDark ? 'text-[#38BDF8] bg-[#0F172A]' : 'text-[#0284C7] bg-[#F0F9FF]'} sticky top-0 z-10 backdrop-blur-md`}>
                        {route.name}
                      </div>
                      {route.places.map(loc => (
                        <div 
                          key={loc.id} 
                          onClick={() => setSelectedLoc(loc)}
                          className={`p-3.5 border-b ${borderStyle} cursor-pointer transition-colors ${selectedLoc?.id === loc.id ? (isDark ? 'bg-[#38BDF8]/10' : 'bg-[#E0F2FE]') : (isDark ? 'hover:bg-[#1E293B]' : 'hover:bg-[#F8FAFC]')}`}
                        >
                          <h4 className={`text-[13px] sm:text-[13.5px] font-bold ${textMainStyle} mb-1 flex items-center justify-between`}>
                            {loc.name}
                            <Icons.ChevronRight className={`w-3.5 h-3.5 ${textSubStyle}`} />
                          </h4>
                          <p className={`text-[11.5px] font-medium ${textSubStyle} line-clamp-1`}>{loc.event}</p>
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
                            <span className="font-bold text-[12.5px]">{loc.name}</span>
                          </Tooltip>
                        </Marker>
                      );
                    })}
                    <Polyline positions={route.places.map(p => p.coords)} color={rIdx % 2 === 0 ? (isDark ? "#38BDF8" : "#0284C7") : (isDark ? "#A78BFA" : "#7C3AED")} weight={3} opacity={0.6} dashArray="5, 8" />
                  </React.Fragment>
                ))}
              </MapContainer>
              
              {selectedLoc && (
                <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 w-[90%] max-w-sm ${isDark ? 'bg-[#0B1120]/95 border-[#1E293B]' : 'bg-white/95 border-[#E2E8F0]'} backdrop-blur-xl p-4 rounded-[16px] shadow-lg border z-[1000] animate-fade-in-up`}>
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className={`text-[14px] sm:text-[14.5px] font-bold ${textMainStyle}`}>{selectedLoc.name}</h3>
                    <button onClick={() => setSelectedLoc(null)} className={`${textSubStyle} hover:${textMainStyle} p-1`}>✕</button>
                  </div>
                  <p className={`text-[11.5px] sm:text-[12px] font-bold ${isDark ? 'text-[#38BDF8]' : 'text-[#0284C7]'} mb-1.5`}>{selectedLoc.event}</p>
                  <p className={`leading-[1.6] font-medium ${textSubStyle} text-[11.5px] sm:text-[12px] line-clamp-3 mb-2.5`}>{selectedLoc.desc}</p>
                  <div 
                    onClick={() => setPopupVerseData({ query: selectedLoc.verse, verses: getVersesFromQuery(selectedLoc.verse, bibles) })}
                    className={`text-[10.5px] sm:text-[11px] font-bold ${textMainStyle} cursor-pointer inline-block ${isDark ? 'bg-[#1E293B]' : 'bg-[#F1F5F9]'} px-2.5 py-1 rounded-[8px]`}
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
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4 pointer-events-auto">
          <div className={`${isDark ? 'bg-[#0B1120] border-[#1E293B]' : 'bg-white border-[#E2E8F0]'} rounded-[24px] shadow-2xl border overflow-hidden w-full max-w-md animate-fade-in-up max-h-[85vh] flex flex-col`}>
            <div className={`px-5 py-3.5 flex justify-between items-center border-b ${isDark ? 'border-[#1E293B] bg-[#111827]' : 'border-[#E2E8F0] bg-[#F8FAFC]'}`}>
              <h3 className={`font-bold ${textMainStyle} text-[13.5px] sm:text-[14px]`}>
                {popupVerseData.query}
              </h3>
              <button onClick={() => setPopupVerseData(null)} className={`${textSubStyle} hover:${textMainStyle} text-xl w-7 h-7 flex items-center justify-center rounded-full transition-colors`}>
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
              <button onClick={() => setSelectedCharacter(null)} className={`${textSubStyle} hover:${textMainStyle} text-2xl w-7 h-7 flex items-center justify-center rounded-full transition-colors`}>
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
          box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
          padding: 6px 10px !important;
          color: ${isDark ? '#F8FAFC' : '#0F172A'} !important;
          font-family: inherit !important;
        }
        .custom-tooltip::before { display: none !important; }
      `}</style>
    </div>
  );
}
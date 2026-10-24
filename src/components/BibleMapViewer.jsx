import React, { useEffect, useRef, useState } from 'react';
// 💡 에러 완벽 해결: default 방식이 아닌 개별 모듈(Named Export)만 콕 집어서 가져오기
import { Map, NavigationControl, Marker, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// 원본 데이터 연동
import { wikiData } from '../data/bibleAnalysisData'; 

export default function BibleMapViewer({ t, isDarkMode, onSelectLocation }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  
  // 원본 데이터의 mapRoutes 활용
  const allRoutes = wikiData.mapRoutes || [];
  const [activeRouteId, setActiveRouteId] = useState(allRoutes[0]?.id);
  const activeRoute = allRoutes.find(r => r.id === activeRouteId) || allRoutes[0];
  const activePlaces = activeRoute?.places || [];
  
  const [activeLocId, setActiveLocId] = useState(activePlaces[0]?.id);

  useEffect(() => {
    if (!mapContainerRef.current || activePlaces.length === 0) return;

    const styleUrl = isDarkMode 
      ? 'https://tiles.openfreemap.org/styles/positron' 
      : 'https://tiles.openfreemap.org/styles/liberty';

    // 💡 에러 수정: new maplibregl.Map -> new Map
    const map = new Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: activePlaces[0].coords, 
      zoom: 6,
      pitch: 35,
      bearing: 0
    });

    mapRef.current = map;
    
    // 💡 에러 수정: new maplibregl.NavigationControl -> new NavigationControl
    map.addControl(new NavigationControl(), 'top-right');

    map.on('load', () => {
      // 1. 경로 선 (Line) 그리기
      const coordinates = activePlaces.map(p => p.coords);
      
      map.addSource('journey-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates }
        }
      });

      map.addLayer({
        id: 'journey-route-layer',
        type: 'line',
        source: 'journey-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4,
          'line-dasharray': [2, 1]
        }
      });

      // 2. 장소 마커 및 팝업 그리기
      activePlaces.forEach((loc) => {
        const el = document.createElement('div');
        el.className = 'custom-bible-marker';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.backgroundColor = activeLocId === loc.id ? '#ef4444' : '#3b82f6';
        el.style.borderRadius = '50%';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.color = 'white';
        el.style.fontSize = '10px';
        el.style.fontWeight = 'bold';
        el.innerText = loc.id;

        const popupHtml = `
          <div style="padding: 6px; color: #1e293b;">
            <div style="font-weight: 800; font-size: 14px; margin-bottom: 2px;">${loc.name}</div>
            <div style="font-size: 11px; color: #2563eb; font-weight: bold; margin-bottom: 4px;">${loc.verse}</div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 6px; line-height: 1.3;">${loc.desc}</div>
          </div>
        `;

        // 💡 에러 수정: new maplibregl.Popup / Marker -> new Popup / Marker
        const popup = new Popup({ offset: 15 }).setHTML(popupHtml);
        new Marker(el)
          .setLngLat(loc.coords)
          .setPopup(popup)
          .addTo(map);

        el.addEventListener('click', () => {
          setActiveLocId(loc.id);
          if (onSelectLocation) onSelectLocation(loc);
        });
      });
    });

    return () => map.remove();
  }, [isDarkMode, activeRouteId]);

  const flyToLocation = (loc) => {
    setActiveLocId(loc.id);
    if (onSelectLocation) onSelectLocation(loc);

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: loc.coords,
        zoom: 9,
        pitch: 45,
        duration: 1500,
        essential: true
      });
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden pointer-events-auto">
      <div ref={mapContainerRef} className="w-full h-full flex-1" />

      <div className={`absolute bottom-4 left-4 right-4 z-10 p-3 rounded-2xl border ${t?.border || 'border-slate-200'} ${t?.cardBg || 'bg-white'} shadow-lg flex flex-col gap-3`}>
        
        {/* 상단 루트 선택 탭 */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar border-b border-slate-200 dark:border-slate-800 pb-2">
           {allRoutes.map(route => (
              <button 
                key={route.id} 
                onClick={() => setActiveRouteId(route.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${activeRouteId === route.id ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
              >
                {route.name}
              </button>
           ))}
        </div>

        {/* 하단 장소 타임라인 이동 버튼 */}
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {activePlaces.map((loc) => {
            const isActive = activeLocId === loc.id;
            return (
              <button
                key={loc.id}
                onClick={() => flyToLocation(loc)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex flex-col items-start ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/40 dark:border-blue-800' 
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-transparent hover:bg-slate-100'
                }`}
              >
                <span>{loc.name}</span>
                <span className={`text-[9px] ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>{loc.verse}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
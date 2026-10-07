import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// =====================================================================
// 🔐 [양방향 암호화 유틸리티] 여리고/땅밟기 기도제목 보호
// =====================================================================
const ENCRYPT_PREFIX = "ENC_GTC_v1::";

const encryptField = (plainText) => {
  if (!plainText || typeof plainText !== 'string') return plainText;
  try {
    const encoded = btoa(encodeURIComponent(plainText));
    return `${ENCRYPT_PREFIX}${encoded}`;
  } catch (e) {
    return plainText;
  }
};

const decryptField = (cipherText) => {
  if (!cipherText || typeof cipherText !== 'string') return cipherText;
  if (!cipherText.startsWith(ENCRYPT_PREFIX)) return cipherText;
  try {
    const payload = cipherText.replace(ENCRYPT_PREFIX, '');
    return decodeURIComponent(atob(payload));
  } catch (e) {
    return cipherText;
  }
};

const StrokeWidth = "1.8";
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><polyline points="15 18 9 12 15 6" /></svg>;
const IconFlag = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeWidth} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" /></svg>;
const IconChurch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeWidth} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25V4.5m0 0v2.25m0-2.25h2.25m-2.25 0H9.75m-6.364 4.136a8.96 8.96 0 00-1.136 4.364v7.5A2.25 2.25 0 004.5 22.5h15a2.25 2.25 0 002.25-2.25v-7.5a8.96 8.96 0 00-1.136-4.364l-8.614-7.23a.75.75 0 00-.9 0l-8.614 7.23z" /></svg>;
const IconTrophy = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.004-6.75V4.875c0-.621-.504-1.125-1.125-1.125h-4.5c-.621 0-1.125.504-1.125 1.125V8.625M17.25 6h2.25a2.25 2.25 0 012.25 2.25v.75a4.5 4.5 0 01-4.5 4.5h-1.5M6.75 6H4.5A2.25 2.25 0 002.25 8.25v.75a4.5 4.5 0 004.5 4.5h1.5" /></svg>;
const IconDocument = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeWidth} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const IconSend = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;

const HistoryMap = ({ logs, isDark }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!window.L || !mapRef.current) return;
    if (mapInstanceRef.current) { 
      try { mapInstanceRef.current.remove(); } catch(e) {}
      mapInstanceRef.current = null; 
    }
    if (mapRef.current._leaflet_id) mapRef.current._leaflet_id = null;

    const map = window.L.map(mapRef.current, { zoomControl: false, dragging: true, scrollWheelZoom: false });
    mapInstanceRef.current = map;

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '' }).addTo(map);

    const allLatLangs = [];
    logs.forEach(log => {
      if (log.path && log.path.length >= 2) {
        const pts = log.path.map(p => [p.lat, p.lng]);
        window.L.polyline(pts, { color: isDark ? '#71717A' : '#3F3F46', weight: 4, opacity: 0.8, lineCap: 'round', lineJoin: 'round' }).addTo(map);
        pts.forEach(pt => allLatLangs.push(pt));
      }
    });

    if (allLatLangs.length > 0) map.fitBounds(allLatLangs, { padding: [30, 30] });
    else map.setView([37.6446, 126.6697], 15);

    return () => { 
      if (mapInstanceRef.current) { 
        try { mapInstanceRef.current.remove(); } catch(e) {}
        mapInstanceRef.current = null; 
      } 
    };
  }, [logs, isDark]);

  return <div ref={mapRef} className="w-full h-full touch-none overscroll-none" />;
};

export default function JerichoWalk({ t, isDarkMode, setActiveScreen, triggerConfetti, authUser }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof isDarkMode === 'boolean') return isDarkMode;
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
    }
    return !!(t?.appBg?.includes('dark') || t?.appBg?.includes('121212'));
  });

  useEffect(() => {
    if (typeof isDarkMode === 'boolean') {
      setIsDark(isDarkMode);
    } else if (typeof document !== 'undefined') {
      const updateTheme = () => {
        const hasDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
        setIsDark(hasDark || !!(t?.appBg?.includes('dark') || t?.appBg?.includes('121212')));
      };
      updateTheme();
      const observer = new MutationObserver(updateTheme);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    }
  }, [isDarkMode, t]);

  // 🌟 ERP 4종과 완벽하게 일치하는 정갈한 모노크롬 (Zinc) 디자인 시스템
  const theme = {
    bgPage: 'bg-zinc-100',
    headerBg: 'bg-zinc-900 text-white border-zinc-800',
    tabBg: 'bg-zinc-900 text-white border-zinc-800',
    sheetBg: 'bg-white border-zinc-200 text-zinc-900',
    cardBg: 'bg-white border border-zinc-200 shadow-2xs',
    textMain: 'text-zinc-900',
    textSub: 'text-zinc-500',
    textMuted: 'text-zinc-400',
    inputBg: 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400',
    pillCard: 'bg-white/95 text-zinc-900 border-zinc-200 shadow-sm',
    pillDanger: 'bg-rose-50 text-rose-700 border-rose-200',
    pillBlue: 'bg-zinc-100 text-zinc-800 border-zinc-200',
    stat1: 'bg-zinc-50 border-zinc-200 text-zinc-900',
    stat2: 'bg-zinc-50 border-zinc-200 text-zinc-900',
    stat3: 'bg-zinc-50 border-zinc-200 text-zinc-900',
    btnStart: 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm',
    btnStop: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
  };

  const [activeTab, setActiveTab] = useState('myWalk'); 
  const [walkMode, setWalkMode] = useState('jericho'); 
  
  const [churchPos, setChurchPos] = useState(() => {
    const saved = localStorage.getItem('jericho_locked_church_pos');
    if (saved) { try { return JSON.parse(saved); } catch(e) {} }
    return null; 
  });
  
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [userName, setUserName] = useState(() => authUser?.name || localStorage.getItem('jericho_username') || '');
  const [mainPrayer, setMainPrayer] = useState('');
  const [dailyPrayer, setDailyPrayer] = useState(''); 
  
  const [startDate, setStartDate] = useState(() => {
    const local = new Date();
    const offset = local.getTimezoneOffset() * 60000;
    return new Date(local.getTime() - offset).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState('');

  const [isTracking, setIsTracking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPos, setCurrentPos] = useState(churchPos || { lat: 37.6446, lng: 126.6697 });
  const [path, setPath] = useState([]);
  const [lapStartTime, setLapStartTime] = useState(null);
  const [elapsedSec, setElapsedSec] = useState(0); 
  
  const [communityData, setCommunityData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [cheerInputs, setCheerInputs] = useState({});
  
  const watchIdRef = useRef(null);
  const wakeLockRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylinesRef = useRef([]); 
  const markerRef = useRef(null);
  const userMarkerRef = useRef(null);

  useEffect(() => {
    let timer;
    if (isTracking) {
      timer = setInterval(() => setElapsedSec(prev => prev + 1), 1000);
    } else {
      setElapsedSec(0);
    }
    return () => clearInterval(timer);
  }, [isTracking]);

  const getDday = (dateInput) => {
    if (!dateInput) return 1;
    const start = new Date(dateInput); const today = new Date();
    start.setHours(0,0,0,0); today.setHours(0,0,0,0);
    const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const calculatePathDistance = (pts) => {
    if (!pts || pts.length < 2) return 0;
    let totalKm = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i]; const p2 = pts[i+1]; const R = 6371;
      const dLat = (p2.lat - p1.lat) * (Math.PI / 180); const dLon = (p2.lng - p1.lng) * (Math.PI / 180);
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(p1.lat * (Math.PI / 180)) * Math.cos(p2.lat * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      totalKm += R * c;
    }
    return totalKm;
  };

  const formatHMS = (seconds) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return { h, m, s };
  };

  const createCustomIcon = (bgColor, pulse = false) => {
    if (!window.L) return null;
    return window.L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
          ${pulse ? '<div style="position: absolute; width: 36px; height: 36px; top: -7px; left: -7px; border-radius: 50%; background: ' + bgColor + '; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
          <div style="width: 16px; height: 16px; border-radius: 50%; background: ${bgColor}; border: 3px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
        </div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
  };

  useEffect(() => {
    if (activeTab !== 'myWalk' || !activeCampaign) return;
    let resizeTimer = null;

    const loadLeaflet = () => {
      if (window.L && mapContainerRef.current) { initMap(); return; }
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link'); 
        link.id = 'leaflet-css'; 
        link.rel = 'stylesheet'; 
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; 
        document.head.appendChild(link);
      }
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script'); 
        script.id = 'leaflet-js'; 
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; 
        script.async = true; 
        script.onload = () => initMap(); 
        document.head.appendChild(script);
      } else { 
        const checkL = setInterval(() => { if (window.L) { clearInterval(checkL); initMap(); } }, 100); 
      }
    };

    const initMap = () => {
      if (!window.L || !mapContainerRef.current) return;
      if (mapInstanceRef.current) { try { mapInstanceRef.current.remove(); } catch (e) {} mapInstanceRef.current = null; }
      if (mapContainerRef.current._leaflet_id) mapContainerRef.current._leaflet_id = null;
      
      const center = churchPos || { lat: 37.6446, lng: 126.6697 };
      const map = window.L.map(mapContainerRef.current, { zoomControl: false }).setView([center.lat, center.lng], 17);
      mapInstanceRef.current = map;
      
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '' }).addTo(map);

      if (churchPos) {
        const churchIcon = createCustomIcon('#09090B', false);
        markerRef.current = window.L.marker([churchPos.lat, churchPos.lng], { icon: churchIcon }).addTo(map);
      }

      map.on('click', (e) => {
        if (!churchPos) {
          const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
          setChurchPos(newPos); setCurrentPos(newPos); 
          localStorage.setItem('jericho_locked_church_pos', JSON.stringify(newPos));
          if (markerRef.current) markerRef.current.remove();
          const churchIcon = createCustomIcon('#09090B', false);
          markerRef.current = window.L.marker([newPos.lat, newPos.lng], { icon: churchIcon }).addTo(map);
          alert('출발 기준 위치가 지정되었습니다.');
        }
      });

      resizeTimer = setTimeout(() => {
        if (mapInstanceRef.current && mapInstanceRef.current._mapPane) {
          try { mapInstanceRef.current.invalidateSize(); } catch (err) {}
        }
      }, 300);
    };

    loadLeaflet();
    return () => { 
      if (resizeTimer) clearTimeout(resizeTimer);
      if (mapInstanceRef.current) { try { mapInstanceRef.current.remove(); } catch (e) {} mapInstanceRef.current = null; } 
    };
  }, [activeTab, activeCampaign, churchPos]);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    const map = mapInstanceRef.current;
    if (isTracking) {
      map.setView([currentPos.lat, currentPos.lng]);
      if (userMarkerRef.current) userMarkerRef.current.remove();
      const liveIcon = createCustomIcon('#09090B', true);
      userMarkerRef.current = window.L.marker([currentPos.lat, currentPos.lng], { icon: liveIcon }).addTo(map);
    }

    if (polylinesRef.current && polylinesRef.current.length > 0) {
      polylinesRef.current.forEach(pl => pl.remove());
      polylinesRef.current = [];
    }

    const allStoredLogs = activeCampaign?.jericho_logs || [];
    allStoredLogs.forEach((log) => {
      if (log.path && log.path.length >= 2) {
        const pts = log.path.map(p => [p.lat, p.lng]);
        const pastPl = window.L.polyline(pts, { color: '#71717A', weight: 3, opacity: 0.5, lineCap: 'round', lineJoin: 'round', dashArray: '4, 4' }).addTo(map);
        polylinesRef.current.push(pastPl);
      }
    });

    if (path.length > 0) {
      const currentPts = path.map(p => [p.lat, p.lng]);
      const activePl = window.L.polyline(currentPts, { color: '#09090B', weight: 5, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }).addTo(map);
      polylinesRef.current.push(activePl);
    }
  }, [currentPos, path, isTracking, activeCampaign]);

  useEffect(() => {
    if (activeTab === 'myWalk') fetchMyCampaign();
    if (activeTab === 'community') fetchCommunity();
    if (activeTab === 'history') fetchHistory();
  }, [activeTab]);

  const fetchMyCampaign = async () => {
    if(!supabase) return;
    try {
      const { data: campaign } = await supabase.from('jericho_campaigns').select('*').eq('status', 'active').eq('user_name', userName).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (campaign) { 
        const decPrayer = decryptField(campaign.main_prayer);
        setWalkMode(decPrayer?.includes('여리고') ? 'jericho' : 'groundWalk');
        const { data: logs } = await supabase.from('jericho_logs').select('*').eq('campaign_id', campaign.id); 
        const decryptedLogs = (logs || []).map(l => ({ ...l, daily_prayer: decryptField(l.daily_prayer) }));
        setActiveCampaign({ ...campaign, main_prayer: decPrayer, jericho_logs: decryptedLogs }); 
      }
    } catch(e) {}
  };

  const fetchCommunity = async () => {
    if(!supabase) return;
    try {
      const { data: campaigns } = await supabase.from('jericho_campaigns').select('*').order('created_at', { ascending: false });
      if (!campaigns) return;
      const enriched = await Promise.all(campaigns.map(async (c) => {
        const { data: logs } = await supabase.from('jericho_logs').select('*').eq('campaign_id', c.id);
        const { data: cheers } = await supabase.from('jericho_cheers').select('*').eq('campaign_id', c.id);
        return { 
          ...c, 
          main_prayer: decryptField(c.main_prayer),
          jericho_logs: (logs || []).map(l => ({ ...l, daily_prayer: decryptField(l.daily_prayer) })),
          jericho_cheers: (cheers || []).map(ch => ({ ...ch, message: decryptField(ch.message) }))
        };
      }));
      setCommunityData(enriched || []);
    } catch(e) {}
  };

  const fetchHistory = async () => {
    if(!supabase) return;
    try {
      const { data: campaigns } = await supabase.from('jericho_campaigns').select('*').eq('status', 'completed').order('completed_at', { ascending: false });
      if (!campaigns) return;
      const enriched = await Promise.all(campaigns.map(async (c) => {
        const { data: logs } = await supabase.from('jericho_logs').select('*').eq('campaign_id', c.id).order('day_number', { ascending: true });
        return { 
          ...c, 
          main_prayer: decryptField(c.main_prayer),
          jericho_logs: (logs || []).map(l => ({ ...l, daily_prayer: decryptField(l.daily_prayer) }))
        };
      }));
      setHistoryData(enriched || []);
    } catch(e) {}
  };

  const handleStartCampaign = async () => {
    if (!userName || !mainPrayer) return alert('이름과 기도제목을 입력해주세요.');
    if (walkMode === 'groundWalk' && !endDate) return alert('땅밟기 종료 예정일을 지정해주세요.');

    const titlePrefix = walkMode === 'jericho' ? '[여리고 7일]' : '[땅밟기]';
    let prayerText = `${titlePrefix} ${mainPrayer}`;
    if (walkMode === 'groundWalk') {
      prayerText = `[땅밟기: ~${endDate}까지] ${mainPrayer}`;
    }

    const { data: newCampaign, error } = await supabase.from('jericho_campaigns').insert([{ 
      user_name: userName, 
      main_prayer: encryptField(prayerText), 
      started_at: new Date(startDate).toISOString()
    }]).select().single();
    
    if (error) { alert('시작 중 에러 발생: ' + error.message); return; }
    
    if (newCampaign) {
      await supabase.from('jericho_cheers').insert([{ 
        campaign_id: newCampaign.id, 
        cheerer_name: '시스템', 
        message: encryptField(`${userName} 성도님이 새로운 믿음의 발걸음을 시작하셨습니다.`), 
        is_system: true 
      }]);
      setActiveCampaign({ ...newCampaign, main_prayer: prayerText, jericho_logs: [] });
    }
  };

  const startTracking = async () => {
    if (!churchPos) return alert('먼저 지도에서 "기준점"을 터치하여 지정해주세요.');
    try { if ('wakeLock' in navigator) wakeLockRef.current = await navigator.wakeLock.request('screen'); } catch (err) {}

    if (navigator.geolocation) {
      const geoOptions = { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 };
      navigator.geolocation.getCurrentPosition((position) => {
        const startPos = { lat: position.coords.latitude, lng: position.coords.longitude };
        setCurrentPos(startPos); setPath([startPos]); setLapStartTime(Date.now()); setIsTracking(true);

        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => { const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setCurrentPos(newPos); setPath((prev) => [...prev, newPos]); },
          (err) => console.error(err), geoOptions
        );
      }, (error) => { alert("GPS 권한이 필요합니다."); }, geoOptions);
    }
  };

  const recordLap = async () => {
    if (!supabase) return;
    setIsSaving(true);
    const timeTaken = Math.floor((Date.now() - lapStartTime) / 1000);
    const dDay = getDday(activeCampaign.started_at || activeCampaign.created_at);
    const logsToday = (activeCampaign.jericho_logs || []).filter(l => l.day_number === dDay);
    const currentLap = logsToday.length + 1;

    const { data: newLog } = await supabase.from('jericho_logs').insert([{
       campaign_id: activeCampaign.id,
       day_number: dDay, lap_number: currentLap, daily_prayer: '', path: path, time_taken_sec: timeTaken
    }]).select().single();

    if (newLog) {
      setActiveCampaign(prev => ({ ...prev, jericho_logs: [...(prev.jericho_logs || []), newLog] }));
      setPath([currentPos]); setLapStartTime(Date.now()); 
      alert(`${currentLap}바퀴가 기록되었습니다.`);
    }
    setIsSaving(false);
  };

  const stopTracking = async (finishCampaign = false) => {
    setIsTracking(false); setIsSaving(true);
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    if (wakeLockRef.current) { try { await wakeLockRef.current.release(); } catch(e) {} wakeLockRef.current = null; }

    const dDay = getDday(activeCampaign.started_at || activeCampaign.created_at);
    const logsToday = (activeCampaign.jericho_logs || []).filter(l => l.day_number === dDay);
    const currentLap = logsToday.length + 1;
    const timeTaken = Math.floor((Date.now() - lapStartTime) / 1000);

    let newLog = null;
    if (path.length > 1) { 
        const { data } = await supabase.from('jericho_logs').insert([{ 
          campaign_id: activeCampaign.id, 
          day_number: dDay, 
          lap_number: currentLap, 
          daily_prayer: encryptField(dailyPrayer.trim()), 
          path: path, 
          time_taken_sec: timeTaken 
        }]).select().single();
        if (data) newLog = { ...data, daily_prayer: dailyPrayer.trim() };
    }
    
    let updatedCampaign = { ...activeCampaign };
    if (newLog) updatedCampaign.jericho_logs = [...(updatedCampaign.jericho_logs || []), newLog];

    const isJerichoComplete = walkMode === 'jericho' && dDay >= 7 && currentLap >= 7;

    if (isJerichoComplete || finishCampaign) {
      await supabase.from('jericho_campaigns').update({ status: 'completed', completed_at: new Date() }).eq('id', activeCampaign.id);
      if(triggerConfetti) triggerConfetti();
      alert(`축하합니다! 여정을 완주하셨습니다. 완주 기록에서 확인하세요.`);
      setActiveCampaign(null); 
    } else {
      setActiveCampaign(updatedCampaign);
      setDailyPrayer(''); setPath([]);
      alert('오늘의 기록과 경로가 성공적으로 누적되었습니다.');
    }
    setIsSaving(false);
  };

  const handleAddCheer = async (campaignId) => {
    const msg = cheerInputs[campaignId]; if (!msg) return;
    await supabase.from('jericho_cheers').insert([{ 
      campaign_id: campaignId, 
      cheerer_name: userName || '익명', 
      message: encryptField(msg.trim()) 
    }]);
    setCheerInputs({ ...cheerInputs, [campaignId]: '' });
    fetchCommunity();
  };

  const handleForceEndCampaign = async () => {
    if (!window.confirm("현재 진행 중인 여정을 종료하시겠습니까?\n종료 시 완주 기록으로 이동됩니다.")) return;
    setIsSaving(true);
    await supabase.from('jericho_campaigns').update({ status: 'completed', completed_at: new Date() }).eq('id', activeCampaign.id);
    setActiveCampaign(null);
    setIsSaving(false);
    alert("여정이 종료되었습니다.");
  };

  const handleSendToIntercession = (text) => {
    if (!text || !text.trim()) return alert("전송할 기도제목이 없습니다.");
    try {
      const globalInter = JSON.parse(localStorage.getItem('goodtree_global_intercessions') || '[]');
      const newInter = { 
        id: Date.now(), 
        text: encryptField(`[땅밟기] ${text.trim()}`), 
        status: 'praying', 
        date: new Date().toISOString().split('T')[0] 
      };
      localStorage.setItem('goodtree_global_intercessions', JSON.stringify([...globalInter, newInter]));
      alert('나의 중보 기도함으로 전송되었습니다!');
    } catch (e) {
      alert("전송 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className={`flex-1 flex flex-col h-full w-full relative pointer-events-auto ${theme.bgPage} font-sans overflow-hidden select-none overscroll-none text-zinc-900`}>
      
      {/* 상단 네비게이션 헤더 (ERP 4종 스타일 일치) */}
      <div className={`relative z-30 px-5 py-4 flex items-center justify-between border-b ${theme.headerBg} backdrop-blur-xl shrink-0`}>
        <div className="flex items-center gap-3">
           <button onClick={() => setActiveScreen('home')} className={`p-1 -ml-1 transition-all text-white hover:opacity-75 cursor-pointer active:scale-95`}>
               <IconArrowLeft />
           </button>
           <h1 className="text-[15px] font-black tracking-tight text-white">
               여리고 & 땅밟기 (Jericho Walk)
           </h1>
        </div>
      </div>

      {/* 상단 탭 네비게이션 */}
      <div className={`flex w-full px-5 border-b ${theme.tabBg} backdrop-blur-2xl shrink-0 z-20 text-[12.5px] font-black`}>
         <button onClick={() => setActiveTab('myWalk')} className={`py-3 mr-6 border-b-[2px] transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'myWalk' ? `border-white text-white` : `border-transparent text-zinc-400 hover:text-white`}`}>
            나의 여정
         </button>
         <button onClick={() => setActiveTab('community')} className={`py-3 mr-6 border-b-[2px] transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'community' ? `border-white text-white` : `border-transparent text-zinc-400 hover:text-white`}`}>
            공동체 현황
         </button>
         <button onClick={() => setActiveTab('history')} className={`py-3 border-b-[2px] transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'history' ? `border-white text-white` : `border-transparent text-zinc-400 hover:text-white`}`}>
            완주 기록
         </button>
      </div>

      <div className="flex-1 relative w-full h-full overflow-hidden flex flex-col z-10">
        
        {/* A. 여정 시작 전 입력 폼 */}
        {activeTab === 'myWalk' && !activeCampaign && (
          <div className="flex-1 w-full overflow-y-auto pb-36 px-5 pt-6 max-w-xl mx-auto hide-scrollbar">
            <div className={`flex w-full rounded-xl p-1 mb-5 border bg-zinc-200/60`}>
               <button onClick={() => setWalkMode('jericho')} className={`flex-1 py-2.5 rounded-lg font-black text-[12.5px] transition-all cursor-pointer ${walkMode === 'jericho' ? `bg-zinc-900 text-white shadow-xs` : `text-zinc-600 hover:text-zinc-900`}`}>
                 여리고 (7일 여정)
               </button>
               <button onClick={() => setWalkMode('groundWalk')} className={`flex-1 py-2.5 rounded-lg font-black text-[12.5px] transition-all cursor-pointer ${walkMode === 'groundWalk' ? `bg-zinc-900 text-white shadow-xs` : `text-zinc-600 hover:text-zinc-900`}`}>
                 땅밟기 (매일 누적)
               </button>
            </div>

            <div className={`flex flex-col gap-4 w-full p-6 rounded-2xl border bg-white shadow-sm`}>
              <div className="flex flex-col gap-1">
                 <h2 className="text-[18px] font-black text-zinc-900 tracking-tight">
                   {walkMode === 'jericho' ? '여리고 7일의 순례길' : '매일 땅밟기 챌린지'}
                 </h2>
                 <p className="text-[12px] text-zinc-500 font-medium">
                   기도의 발걸음으로 영적 성벽을 무너뜨리는 믿음의 레이스입니다.
                 </p>
              </div>
              
              <div className="flex flex-col gap-3.5 w-full">
                <div className="flex flex-col gap-1">
                   <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500">참여자 이름</label>
                   <input 
                     type="text" 
                     placeholder="성명 입력" 
                     value={userName} 
                     onChange={(e) => setUserName(e.target.value)} 
                     className="w-full p-3 rounded-xl outline-none text-[13px] font-bold border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-zinc-800 transition-colors" 
                   />
                </div>
                
                <div className="flex flex-col gap-1">
                   <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500">우리의 대표 기도제목</label>
                   <textarea 
                     placeholder="마음에 품은 핵심 기도제목을 적어주세요." 
                     value={mainPrayer} 
                     onChange={(e) => setMainPrayer(e.target.value)} 
                     className="w-full p-3 h-24 resize-none rounded-xl outline-none text-[13px] leading-relaxed font-bold border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-zinc-800 transition-colors" 
                   />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                   <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500">시작일</label>
                      <input 
                        type="date" 
                        value={startDate} 
                        onChange={e => setStartDate(e.target.value)} 
                        className="w-full px-3 py-2.5 rounded-xl outline-none text-[12px] font-bold border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-zinc-800 transition-colors font-mono" 
                      />
                   </div>
                   {walkMode === 'groundWalk' && (
                      <div className="flex-1 flex flex-col gap-1 min-w-0">
                         <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500">종료 예정일</label>
                         <input 
                           type="date" 
                           value={endDate} 
                           onChange={e => setEndDate(e.target.value)} 
                           className="w-full px-3 py-2.5 rounded-xl outline-none text-[12px] font-bold border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-zinc-800 transition-colors font-mono" 
                         />
                      </div>
                   )}
                </div>

                <button 
                  onClick={handleStartCampaign} 
                  className="w-full py-3.5 mt-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-black text-[13.5px] transition-transform active:scale-95 cursor-pointer shadow-sm"
                >
                   여정 시작하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* B. 여정 진행 중 (지도를 최대한 크게 확보한 모바일 최적화 레이아웃) */}
        {activeTab === 'myWalk' && activeCampaign && (() => {
           const dDay = getDday(activeCampaign.started_at || activeCampaign.created_at);
           const targetLaps = walkMode === 'jericho' ? (dDay >= 7 ? 7 : 1) : 1;
           const logsToday = (activeCampaign.jericho_logs || []).filter(l => l.day_number === dDay);
           const currentLap = logsToday.length + 1; 
           const currentDistance = calculatePathDistance(path).toFixed(2);
           const { h, m, s } = formatHMS(elapsedSec);

           return (
             <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
                
                {/* 🌟 지도를 최대한 크게 확보 (h-[52vh] 이상) */}
                <div className="relative w-full h-[52vh] min-h-[280px] shrink-0 bg-zinc-200 border-b border-zinc-300">
                   <div ref={mapContainerRef} className="w-full h-full touch-none overscroll-none">
                      {!window.L && <div className="flex h-full items-center justify-center text-[12px] font-bold text-zinc-500">지도를 불러오는 중입니다...</div>}
                   </div>

                   {/* 상단 플로팅 뱃지 */}
                   <div className="absolute top-3 left-3 right-3 z-[400] flex justify-between items-center pointer-events-none">
                     <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-200 flex items-center gap-2 pointer-events-auto shadow-sm">
                       <span className="text-zinc-800"><IconTrophy /></span>
                       <span className="text-[11.5px] font-black leading-none text-zinc-900">
                         {walkMode === 'jericho' ? `${dDay}일차 순례` : `${dDay}일차`} ({logsToday.length}/{targetLaps}완료)
                       </span>
                     </div>
                     <button 
                       onClick={handleForceEndCampaign} 
                       className="bg-rose-50 text-rose-700 border border-rose-200 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-black shadow-sm pointer-events-auto cursor-pointer active:scale-95 transition-all"
                     >
                       여정 종료
                     </button>
                   </div>

                   {/* 출발 기준점 뱃지 */}
                   <div className="absolute bottom-4 left-3 z-[400] flex items-center gap-2">
                     <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-zinc-200 text-[10.5px] font-black flex items-center gap-1.5 shadow-sm text-zinc-800">
                       <span className="text-zinc-900"><IconChurch /></span>
                       <span>{churchPos ? '출발 기준점 설정됨' : '지도 터치: 출발 기준점 설정'}</span>
                     </div>
                     {churchPos && (
                       <button 
                         onClick={() => { if(window.confirm('출발 위치를 재설정하시겠습니까?')) { localStorage.removeItem('jericho_locked_church_pos'); setChurchPos(null); window.location.reload(); } }} 
                         className="bg-white/90 backdrop-blur-md px-2 py-1 rounded-full border border-zinc-200 text-[10.5px] font-black shadow-sm cursor-pointer active:scale-95 text-zinc-700"
                       >
                         재설정
                       </button>
                     )}
                   </div>
                </div>

                {/* 하단 콤팩트 바텀시트 대시보드 */}
                <div className="flex-1 w-full z-20 bg-white rounded-t-2xl shadow-[0_-8px_25px_rgba(0,0,0,0.06)] border-t border-zinc-200 -mt-4 overflow-y-auto hide-scrollbar">
                  
                  <div className="w-full px-5 pt-3.5 pb-36 flex flex-col gap-3 max-w-lg mx-auto">
                    
                    {/* 핸들 바 */}
                    <div className="w-10 h-1 bg-zinc-300 rounded-full mx-auto" />

                    <div className="flex justify-between items-center shrink-0">
                      <span className="text-[13.5px] font-black text-zinc-900 tracking-tight">기도의 발걸음 (Live)</span>
                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        GPS 로깅
                      </div>
                    </div>

                    {/* 타이머 */}
                    <div className="flex flex-col items-center justify-center py-1.5 shrink-0 bg-zinc-50 rounded-xl border border-zinc-200/80">
                      <span className="text-[9.5px] font-black tracking-widest uppercase mb-0.5 text-zinc-400">DURATION</span>
                      <div className="text-[34px] font-black tracking-tighter flex items-baseline gap-1 font-mono text-zinc-900">
                        <span>{h}</span>
                        <span className="text-zinc-400 text-[22px] font-light">:</span>
                        <span>{m}</span>
                        <span className="text-zinc-400 text-[22px] font-light">:</span>
                        <span className="text-indigo-600">{s}</span>
                      </div>
                    </div>

                    {/* 3열 통계 카드 */}
                    <div className="grid grid-cols-3 gap-2 shrink-0">
                      <div className="flex flex-col items-center justify-center py-2.5 rounded-xl border border-zinc-200 bg-zinc-50">
                        <span className="text-[17px] font-black font-mono leading-tight text-zinc-900">{currentDistance}</span>
                        <span className="text-[10px] font-bold mt-0.5 text-zinc-500">거리 (KM)</span>
                      </div>
                      <div className="flex flex-col items-center justify-center py-2.5 rounded-xl border border-zinc-200 bg-zinc-50">
                        <span className="text-[17px] font-black font-mono leading-tight text-zinc-900">{logsToday.length}</span>
                        <span className="text-[10px] font-bold mt-0.5 text-zinc-500">완료 바퀴</span>
                      </div>
                      <div className="flex flex-col items-center justify-center py-2.5 rounded-xl border border-zinc-200 bg-zinc-50">
                        <span className="text-[17px] font-black font-mono leading-tight text-zinc-900">{targetLaps}</span>
                        <span className="text-[10px] font-bold mt-0.5 text-zinc-500">목표 바퀴</span>
                      </div>
                    </div>

                    {/* 중보기도 입력 */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center px-0.5">
                        <span className="text-[11px] font-black text-zinc-700">땅을 밟으며 올리는 중보기도</span>
                        <button 
                          onClick={() => handleSendToIntercession(dailyPrayer)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-700 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <IconSend /> 중보기도함 전송
                        </button>
                      </div>
                      <input 
                        type="text"
                        value={dailyPrayer} 
                        onChange={(e) => setDailyPrayer(e.target.value)} 
                        disabled={isTracking && currentLap < targetLaps} 
                        className={`w-full px-3.5 py-3 rounded-xl outline-none text-[12px] font-bold border transition-colors shrink-0 ${theme.inputBg} focus:border-zinc-800 ${(isTracking && currentLap < targetLaps) ? 'opacity-50' : ''}`} 
                        placeholder={currentLap < targetLaps && isTracking ? '마지막 바퀴에 기록할 수 있습니다.' : '주신 마음을 기록하세요...'} 
                      />
                    </div>

                    {/* 제어 버튼 */}
                    <div className="flex flex-col gap-2 w-full pt-1 shrink-0">
                      {!isTracking ? (
                        <button 
                          onClick={startTracking} 
                          className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-black text-[13.5px] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                        >
                          <IconFlag /> {targetLaps > 1 ? `1바퀴 땅밟기 레이스 시작` : `땅밟기 레이스 시작`}
                        </button>
                      ) : (
                        <>
                          {currentLap < targetLaps ? (
                            <button 
                              onClick={recordLap} 
                              disabled={isSaving} 
                              className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-black text-[13.5px] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                            >
                              {isSaving ? '기록 중...' : `${currentLap}바퀴 완료 기록하기 (+1)`}
                            </button>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={() => stopTracking(false)} 
                                disabled={isSaving} 
                                className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-[13.5px] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                              >
                                {isSaving ? '저장 중...' : '오늘의 여정 완주 및 저장하기'}
                              </button>
                              {walkMode === 'groundWalk' && (
                                <button 
                                  onClick={() => { if(window.confirm('땅밟기 여정을 완전히 종료하시겠습니까?')) stopTracking(true); }} 
                                  disabled={isSaving} 
                                  className="w-full py-2.5 bg-transparent text-zinc-500 rounded-xl font-bold text-[11.5px] border border-zinc-300 hover:text-zinc-900 hover:border-zinc-500 transition-colors cursor-pointer"
                                >
                                  여정 최종 마감 (기록실 이동)
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                  </div>
                </div>

             </div>
           );
        })()}

        {/* C. 공동체 현황 */}
        {activeTab === 'community' && (
          <div className="flex-1 w-full overflow-y-auto pb-36 px-5 pt-5 max-w-xl mx-auto hide-scrollbar space-y-3">
            {communityData.length === 0 ? (
              <p className="text-center py-16 text-[12.5px] font-bold text-zinc-400">진행 중인 공동체 순례 여정이 없습니다.</p>
            ) : (
              communityData.map((campaign) => {
                if(!campaign) return null;
                const cDday = getDday(campaign.started_at || campaign.created_at);
                const isJericho = campaign.main_prayer?.includes('여리고');
                
                return (
                  <div key={campaign.id} className="p-5 rounded-xl border bg-white border-zinc-200 shadow-xs flex flex-col">
                    <div className="flex justify-between items-center mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded font-black border border-zinc-200 bg-zinc-100 text-zinc-700">
                          {isJericho ? '여리고 7일' : '땅밟기'}
                        </span>
                        <span className="font-black text-[14px] text-zinc-900">
                          {campaign.user_name} 성도
                        </span>
                      </div>
                      <span className="text-[11.5px] font-black font-mono text-zinc-500">{campaign.status === 'completed' ? '완주 완료' : `D-${cDday}`}</span>
                    </div>

                    <p className="text-[13px] font-bold leading-relaxed break-keep text-zinc-800 mb-3.5 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                      {campaign.main_prayer}
                    </p>

                    <div className="flex flex-col gap-2 mb-3">
                      {(campaign.jericho_cheers || []).map(cheer => (
                        <div key={cheer.id} className={`p-2.5 rounded-lg text-[12px] font-medium leading-relaxed border ${cheer.is_system ? 'bg-transparent border-transparent text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-800'}`}>
                          {!cheer.is_system && <span className="font-black mr-2 text-zinc-900">{cheer.cheerer_name}</span>}
                          {cheer.message}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="응원 메시지 남기기..." 
                        value={cheerInputs[campaign.id] || ''} 
                        onChange={(e) => setCheerInputs({...cheerInputs, [campaign.id]: e.target.value})} 
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCheer(campaign.id)} 
                        className="flex-1 px-3 py-2 text-[12px] font-bold rounded-lg outline-none border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-zinc-800 transition-colors" 
                      />
                      <button 
                        onClick={() => handleAddCheer(campaign.id)} 
                        className="px-4 rounded-lg text-[12px] font-black bg-zinc-900 hover:bg-zinc-800 text-white transition-colors cursor-pointer shadow-sm"
                      >
                        응원
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* D. 완주 기록 */}
        {activeTab === 'history' && (
          <div className="flex-1 w-full overflow-y-auto pb-36 px-5 pt-5 max-w-xl mx-auto hide-scrollbar space-y-4">
            {historyData.length === 0 ? (
              <p className="text-center py-16 text-[12.5px] font-bold text-zinc-400">아직 완주 기록이 없습니다.</p>
            ) : (
              historyData.map(campaign => {
                if(!campaign) return null;
                const allLogs = campaign.jericho_logs || [];
                const totalSecs = allLogs.reduce((sum, log) => sum + (log.time_taken_sec || 0), 0);
                const formatTime = (secs) => {
                  const m = Math.floor(secs / 60); const s = secs % 60;
                  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
                };

                return (
                  <div key={campaign.id} className="p-5 rounded-xl border bg-white border-zinc-200 shadow-xs flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded border border-zinc-300 bg-zinc-100 text-zinc-800 text-[10px] font-black uppercase tracking-widest">
                          VICTORY FINISH
                        </span>
                      </div>
                      
                      <h3 className="text-[16px] font-black mb-1 text-zinc-900">{campaign.user_name} 성도님</h3>
                      <p className="text-[13px] font-bold leading-relaxed mb-3 text-zinc-800">{campaign.main_prayer}</p>

                      <div className="w-full h-[200px] mb-4 rounded-xl overflow-hidden border border-zinc-200 relative z-10 touch-none">
                        <HistoryMap logs={allLogs} isDark={false} />
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10.5px] font-bold text-zinc-500">총 누적 레이스</span>
                            <span className="text-[15px] font-black font-mono text-zinc-900">{allLogs.length} 바퀴</span>
                        </div>
                        <div className="flex flex-col gap-0.5 border-l pl-3 border-zinc-200">
                            <span className="text-[10.5px] font-bold text-zinc-500">총 소요 시간</span>
                            <span className="text-[15px] font-black font-mono text-zinc-900">{formatTime(totalSecs)}</span>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-dashed border-zinc-200">
                          <span className="text-[12px] font-black mb-2.5 flex items-center gap-1.5 text-zinc-900">
                            <IconDocument /> 일차별 순례 기도 요약
                          </span>
                          <div className="space-y-2.5">
                            {allLogs.filter(l => l.daily_prayer).map((log, i) => (
                              <div key={i} className="flex flex-col pl-3 border-l-2 border-zinc-900 gap-0.5">
                                <span className="text-[10.5px] font-black text-zinc-900">{log.day_number}일차 레이스</span>
                                <p className="text-[12.5px] font-bold leading-relaxed text-zinc-700">{log.daily_prayer}</p>
                              </div>
                            ))}
                            {allLogs.filter(l => l.daily_prayer).length === 0 && (
                              <p className="text-[11.5px] text-zinc-400 font-bold">기록된 기도 요약이 없습니다.</p>
                            )}
                          </div>
                      </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
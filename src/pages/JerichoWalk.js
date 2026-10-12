// src/components/JerichoWalk.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// =====================================================================
// 🔐 [보안 암호화 유틸리티] 여리고/땅밟기 기도제목 보호
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

// =====================================================================
// 🎨 모던 테크니컬 아카데믹 아이콘 (NRC & ERP 스타일)
// =====================================================================
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IconFlag = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" /></svg>;
const IconPlay = () => <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6 ml-0.5"><path d="M8 5v14l11-7z" /></svg>;
const IconPause = () => <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><polyline points="20 6 9 17 4 12" /></svg>;
const IconLock = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const IconUnlock = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>;
const IconSend = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
const IconSparkles = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>;
const IconTrophy = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.004-6.75V4.875c0-.621-.504-1.125-1.125-1.125h-4.5c-.621 0-1.125.504-1.125 1.125V8.625M17.25 6h2.25a2.25 2.25 0 012.25 2.25v.75a4.5 4.5 0 01-4.5 4.5h-1.5M6.75 6H4.5A2.25 2.25 0 002.25 8.25v.75a4.5 4.5 0 004.5 4.5h1.5" /></svg>;
const IconCompass = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>;

// 완주 기록 리프렛 지도 컴포넌트
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
        window.L.polyline(pts, { color: isDark ? '#E2E8F0' : '#0F172A', weight: 4, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }).addTo(map);
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
  const isDark = typeof isDarkMode === 'boolean' ? isDarkMode : !!(t?.appBg?.includes('dark') || t?.appBg?.includes('121212'));

  const [activeTab, setActiveTab] = useState('myWalk'); // 'myWalk' | 'community' | 'history'
  const [walkMode, setWalkMode] = useState('jericho'); // 'jericho' | 'groundWalk'
  
  // 기준점 (교회/출발지)[cite: 20]
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

  // 🏃 NRC 실시간 트래킹 상태
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLocked, setIsLocked] = useState(false); // 화면 오작동 방지 잠금
  const [isSaving, setIsSaving] = useState(false);
  const [currentPos, setCurrentPos] = useState(churchPos || { lat: 37.6446, lng: 126.6697 });
  const [path, setPath] = useState([]);
  const [lapStartTime, setLapStartTime] = useState(null);
  const [elapsedSec, setElapsedSec] = useState(0); 
  const [gpsAccuracy, setGpsAccuracy] = useState('HIGH'); // 'HIGH' | 'MEDIUM' | 'SEARCHING'
  
  const [communityData, setCommunityData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [cheerInputs, setCheerInputs] = useState({});
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  }, []);
  
  const watchIdRef = useRef(null);
  const wakeLockRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylinesRef = useRef([]); 
  const markerRef = useRef(null);
  const userMarkerRef = useRef(null);

  // 초 단위 타이머[cite: 20]
  useEffect(() => {
    let timer;
    if (isTracking && !isPaused) {
      timer = setInterval(() => setElapsedSec(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isTracking, isPaused]);

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

  // 🏃 나이키 런 페이스 연산 (분'초"/km)
  const currentDistanceKm = useMemo(() => calculatePathDistance(path), [path]);
  const currentPaceStr = useMemo(() => {
    if (currentDistanceKm < 0.03 || elapsedSec < 5) return `--'--"`;
    const secPerKm = Math.floor(elapsedSec / currentDistanceKm);
    const m = Math.floor(secPerKm / 60);
    const s = secPerKm % 60;
    if (m > 99) return `99'59"`;
    return `${m}'${String(s).padStart(2, '0')}"`;
  }, [currentDistanceKm, elapsedSec]);

  // 소모 칼로리 추정
  const estimatedCalories = useMemo(() => {
    return Math.floor(currentDistanceKm * 62);
  }, [currentDistanceKm]);

  const formatHMS = (seconds) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return { h, m, s };
  };

  // 나이키 네온 스타일 리프렛 마커 생성[cite: 20]
  const createCustomIcon = (bgColor, pulse = false) => {
    if (!window.L) return null;
    return window.L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="position: relative; width: 24px; height: 24px; display: flex; items-center; justify-content: center;">
          ${pulse ? '<div style="position: absolute; width: 44px; height: 44px; top: -10px; left: -10px; border-radius: 50%; background: ' + bgColor + '; opacity: 0.35; animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
          <div style="width: 18px; height: 18px; border-radius: 50%; background: ${bgColor}; border: 3px solid #FFFFFF; box-shadow: 0 0 14px rgba(0,0,0,0.4);"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  // 지도 인스턴스 초기화[cite: 20]
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
        const churchIcon = createCustomIcon('#E11D48', false);
        markerRef.current = window.L.marker([churchPos.lat, churchPos.lng], { icon: churchIcon }).addTo(map);
      }

      map.on('click', (e) => {
        if (!churchPos) {
          const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
          setChurchPos(newPos); setCurrentPos(newPos); 
          localStorage.setItem('jericho_locked_church_pos', JSON.stringify(newPos));
          if (markerRef.current) markerRef.current.remove();
          const churchIcon = createCustomIcon('#E11D48', false);
          markerRef.current = window.L.marker([newPos.lat, newPos.lng], { icon: churchIcon }).addTo(map);
          showToast('📍 출발 기준점이 지도에 락인되었습니다!');
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
  }, [activeTab, activeCampaign, churchPos, showToast]);

  // 실시간 경로 렌더링[cite: 20]
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    const map = mapInstanceRef.current;
    if (isTracking && !isPaused) {
      map.setView([currentPos.lat, currentPos.lng]);
      if (userMarkerRef.current) userMarkerRef.current.remove();
      const liveIcon = createCustomIcon('#0284C7', true);
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
        const pastPl = window.L.polyline(pts, { color: '#94A3B8', weight: 3.5, opacity: 0.6, lineCap: 'round', lineJoin: 'round', dashArray: '4, 6' }).addTo(map);
        polylinesRef.current.push(pastPl);
      }
    });

    if (path.length > 0) {
      const currentPts = path.map(p => [p.lat, p.lng]);
      const activePl = window.L.polyline(currentPts, { color: '#0284C7', weight: 6, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }).addTo(map);
      polylinesRef.current.push(activePl);
    }
  }, [currentPos, path, isTracking, isPaused, activeCampaign]);

  // 캠페인 데이터 패칭[cite: 20]
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
    if (!userName || !mainPrayer) return alert('이름과 대표 기도제목을 입력해주세요.');
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
        message: encryptField(`${userName} 성도님이 새로운 믿음의 레이스를 시작하셨습니다.`), 
        is_system: true 
      }]);
      setActiveCampaign({ ...newCampaign, main_prayer: prayerText, jericho_logs: [] });
      showToast("🚀 새로운 순례 레이스가 생성되었습니다!");
    }
  };

  const startTracking = async () => {
    if (!churchPos) return alert('먼저 지도에서 "출발 기준점"을 터치하여 지정해주세요.');
    try { if ('wakeLock' in navigator) wakeLockRef.current = await navigator.wakeLock.request('screen'); } catch (err) {}

    if (navigator.geolocation) {
      setGpsAccuracy('SEARCHING');
      const geoOptions = { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 };
      navigator.geolocation.getCurrentPosition((position) => {
        const startPos = { lat: position.coords.latitude, lng: position.coords.longitude };
        setCurrentPos(startPos); 
        setPath([startPos]); 
        setLapStartTime(Date.now()); 
        setIsTracking(true);
        setIsPaused(false);
        setGpsAccuracy('HIGH');

        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => { 
            const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude }; 
            setCurrentPos(newPos); 
            setPath((prev) => [...prev, newPos]); 
          },
          (err) => console.error(err), geoOptions
        );
      }, (error) => { alert("GPS 위치 권한이 필요합니다."); }, geoOptions);
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
      setPath([currentPos]); 
      setLapStartTime(Date.now()); 
      showToast(`⚡ ${currentLap}바퀴 스플릿 기록 완수!`);
    }
    setIsSaving(false);
  };

  const stopTracking = async (finishCampaign = false) => {
    setIsTracking(false); 
    setIsPaused(false);
    setIsSaving(true);
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
      alert(`🎉 축하합니다! 믿음의 승리로 여정을 완주하셨습니다!`);
      setActiveCampaign(null); 
    } else {
      setActiveCampaign(updatedCampaign);
      setDailyPrayer(''); 
      setPath([]);
      showToast('🏆 오늘의 여정 기록이 안전하게 저장되었습니다!');
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
    showToast('💬 응원 메시지가 전송되었습니다!');
  };

  const handleForceEndCampaign = async () => {
    if (!window.confirm("현재 진행 중인 여정을 종료하시겠습니까?\n종료 시 완주 기록으로 즉시 이동됩니다.")) return;
    setIsSaving(true);
    await supabase.from('jericho_campaigns').update({ status: 'completed', completed_at: new Date() }).eq('id', activeCampaign.id);
    setActiveCampaign(null);
    setIsSaving(false);
    showToast("여정이 완주 기록으로 이동되었습니다.");
  };

  // 🌟 [유기적 파이프라인] 중보기도함 전송[cite: 20]
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
      showToast('🙏 나의 중보 기도함으로 전송 완료!');
    } catch (e) {
      alert("전송 중 오류가 발생했습니다.");
    }
  };

  // 🌟 [유기적 파이프라인] 실천 트래커 전송
  const handleSendToApplyTracker = (text) => {
    if (!text || !text.trim()) return;
    try {
      const items = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      const newItem = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        text: `[땅밟기 결단] ${text.trim()}`,
        category: '개인 영성',
        source: 'jericho_walk',
        completed: false
      };
      localStorage.setItem('apply_tracker_items', JSON.stringify([newItem, ...items]));
      window.dispatchEvent(new Event('storage'));
      showToast("⚡ [삶의 실천 트래커]로 결단이 등록되었습니다!");
    } catch {}
  };

  // 🌟 [유기적 파이프라인] 3초 릴스 스튜디오 전송
  const handleExportToReels = () => {
    const payload = {
      sourceMode: 'jericho',
      targetDate: new Date().toISOString().split('T')[0],
      title: '[여리고 땅밟기] 승리의 발걸음',
      subtitle: `${currentDistanceKm.toFixed(2)} KM · ${currentPaceStr}`,
      heroText: activeCampaign?.main_prayer || '믿음으로 여리고 성을 무너뜨립니다.',
      bodyText: dailyPrayer || '한 걸음마다 기도를 심으며 전진합니다.',
      actionText: '믿음의 순종으로 일어섭니다.'
    };
    localStorage.setItem('reels_direct_trigger', JSON.stringify(payload));
    showToast("🎬 땅밟기 기록으로 릴스 스튜디오를 준비합니다...");
    if (setActiveScreen) setActiveScreen('reelsStudio');
  };

  return (
    <div className={`flex-1 flex flex-col h-full w-full relative pointer-events-auto select-none font-sans overflow-hidden text-left ${isDark ? 'bg-[#08090C] text-white' : 'bg-[#F4F5F7] text-slate-900'}`}>
      
      {/* 토스트 피드백 */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 rounded-full bg-slate-900/95 text-white text-[12px] font-bold border border-white/20 shadow-xl backdrop-blur-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          {toastMsg}
        </div>
      )}

      {/* 1. 상단 미니멀 네비게이션 헤더[cite: 20] */}
      <header className={`px-4 sm:px-6 py-3 border-b shrink-0 flex items-center justify-between z-30 backdrop-blur-md ${
        isDark ? 'border-white/10 bg-[#0E1117]/90' : 'border-slate-200 bg-white/95'
      }`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveScreen ? setActiveScreen('home') : null} 
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="홈으로 복귀"
          >
            <IconArrowLeft />
          </button>
          <div>
            <h1 className="text-[15px] sm:text-[16.5px] font-black tracking-tight leading-none flex items-center gap-2">
              JERICHO RUN <span className="text-sky-500 text-xs font-mono font-bold">[NRC PRO]</span>
            </h1>
            <span className="text-[10px] font-mono font-bold text-slate-400 block mt-0.5">
              FAITH PACE & SPIRITUAL TELEMETRY
            </span>
          </div>
        </div>

        {/* 탭 네비게이션[cite: 20] */}
        <div className="flex p-0.5 rounded-lg bg-black/5 dark:bg-white/10 text-xs font-bold">
          <button 
            onClick={() => setActiveTab('myWalk')} 
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'myWalk' 
                ? (isDark ? 'bg-sky-600 text-white font-black shadow-xs' : 'bg-slate-900 text-white font-black shadow-xs') 
                : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            나의 여정
          </button>
          <button 
            onClick={() => setActiveTab('community')} 
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'community' 
                ? (isDark ? 'bg-sky-600 text-white font-black shadow-xs' : 'bg-slate-900 text-white font-black shadow-xs') 
                : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            공동체
          </button>
          <button 
            onClick={() => setActiveTab('history')} 
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'history' 
                ? (isDark ? 'bg-sky-600 text-white font-black shadow-xs' : 'bg-slate-900 text-white font-black shadow-xs') 
                : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            완주 기록
          </button>
        </div>
      </header>

      {/* 2. 메인 컨테이너 (하단 플로팅 홈바 없는 풀스크린 뷰포트) */}
      <div className="flex-1 relative w-full h-full overflow-hidden flex flex-col z-10">

        {/* ========================================================================= */}
        {/* A. 여정 시작 전: 등록 카드[cite: 20]                                      */}
        {/* ========================================================================= */}
        {activeTab === 'myWalk' && !activeCampaign && (
          <div className="flex-1 w-full overflow-y-auto px-4 sm:px-6 pt-6 pb-20 max-w-lg mx-auto hide-scrollbar space-y-4">
            <div className="flex w-full rounded-2xl p-1 border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5">
              <button 
                onClick={() => setWalkMode('jericho')} 
                className={`flex-1 py-3 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  walkMode === 'jericho' 
                    ? 'bg-slate-900 text-white dark:bg-sky-600 shadow-xs' 
                    : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                여리고 순례 (7일 작정)
              </button>
              <button 
                onClick={() => setWalkMode('groundWalk')} 
                className={`flex-1 py-3 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  walkMode === 'groundWalk' 
                    ? 'bg-slate-900 text-white dark:bg-sky-600 shadow-xs' 
                    : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                매일 땅밟기 (자유 누적)
              </button>
            </div>

            <div className={`p-6 rounded-3xl border space-y-4 ${
              isDark ? 'bg-[#11141D] border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-black text-sky-500 uppercase tracking-widest block">
                  CHALLENGE SETUP
                </span>
                <h2 className="text-[18px] font-black tracking-tight">
                  {walkMode === 'jericho' ? '여리고 7일 순례 레이스' : '매일 땅밟기 챌린지'}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed break-keep">
                  믿음의 발걸음으로 영적 성벽을 무너뜨리는 순례 레이스입니다.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">참여자 이름</label>
                  <input 
                    type="text" 
                    value={userName} 
                    onChange={e => setUserName(e.target.value)} 
                    placeholder="성도 이름 입력"
                    className={`w-full p-3 rounded-xl text-xs font-bold border outline-none ${
                      isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">대표 기도제목 (품고 달릴 제목)</label>
                  <textarea 
                    rows={3}
                    value={mainPrayer} 
                    onChange={e => setMainPrayer(e.target.value)} 
                    placeholder="이 땅과 가정을 위해 품고 달릴 믿음의 기도제목을 적으세요..."
                    className={`w-full p-3 text-xs font-bold leading-relaxed rounded-xl border outline-none resize-none ${
                      isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">시작일</label>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)} 
                      className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold border outline-none ${
                        isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  {walkMode === 'groundWalk' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400">종료 예정일</label>
                      <input 
                        type="date" 
                        value={endDate} 
                        onChange={e => setEndDate(e.target.value)} 
                        className={`w-full p-2.5 rounded-xl text-xs font-mono font-bold border outline-none ${
                          isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleStartCampaign}
                  className="w-full py-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-sm shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <IconFlag /> 레이스 스타트
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* B. 여정 진행 중: 🏃 나이키 런(NRC) 스타일 고대비 텔레메트리 레이아웃       */}
        {/* ========================================================================= */}
        {activeTab === 'myWalk' && activeCampaign && (() => {
          const dDay = getDday(activeCampaign.started_at || activeCampaign.created_at);
          const targetLaps = walkMode === 'jericho' ? (dDay >= 7 ? 7 : 1) : 1;
          const logsToday = (activeCampaign.jericho_logs || []).filter(l => l.day_number === dDay);
          const currentLap = logsToday.length + 1;
          const { h, m, s } = formatHMS(elapsedSec);

          return (
            <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
              
              {/* 상단 1:1 몰입형 지도 뷰포트 (전체 높이의 46% 확보)[cite: 20] */}
              <div className="relative w-full h-[46vh] min-h-[260px] shrink-0 bg-slate-800">
                <div ref={mapContainerRef} className="w-full h-full touch-none overscroll-none" />

                {/* 상단 오버레이: GPS 신호 뱃지 & 완주/종료 버튼 */}
                <div className="absolute top-3 inset-x-3 z-[400] flex justify-between items-center pointer-events-none">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 text-white border border-white/15 backdrop-blur-md shadow-lg pointer-events-auto text-[11px] font-mono font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>GPS {gpsAccuracy}</span>
                  </div>

                  <div className="flex items-center gap-1.5 pointer-events-auto">
                    <button
                      onClick={handleExportToReels}
                      className="px-2.5 py-1.5 rounded-full bg-rose-600 text-white border border-rose-400 text-[11px] font-black shadow-lg flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <span>🎬</span> 릴스
                    </button>
                    <button 
                      onClick={handleForceEndCampaign}
                      className="px-3 py-1.5 rounded-full bg-slate-900/90 text-rose-400 border border-rose-500/30 text-[11px] font-black shadow-lg cursor-pointer active:scale-95"
                    >
                      여정 종료
                    </button>
                  </div>
                </div>

                {/* 하단 오버레이: 출발 기준점 락인 표시[cite: 20] */}
                <div className="absolute bottom-3 left-3 z-[400] flex items-center gap-2">
                  <div className="px-3 py-1 rounded-full bg-slate-900/90 text-white border border-white/15 text-[10.5px] font-bold backdrop-blur-md flex items-center gap-1.5">
                    <span className="text-rose-500">📍</span>
                    <span>{churchPos ? '출발 기준점 락인됨' : '지도 터치: 출발 기준점 설정'}</span>
                  </div>
                  {churchPos && (
                    <button 
                      onClick={() => {
                        if (window.confirm('출발 기준점을 재설정하시겠습니까?')) {
                          localStorage.removeItem('jericho_locked_church_pos');
                          setChurchPos(null);
                          window.location.reload();
                        }
                      }}
                      className="px-2 py-1 rounded-full bg-white/90 text-slate-900 text-[10.5px] font-bold shadow-md cursor-pointer"
                    >
                      재설정
                    </button>
                  )}
                </div>
              </div>

              {/* 하단 NRC 스타일 고대비 텔레메트리 바텀시트[cite: 20] */}
              <div className={`flex-1 w-full rounded-t-3xl border-t shadow-2xl -mt-4 z-20 flex flex-col justify-between overflow-y-auto hide-scrollbar ${
                isDark ? 'bg-[#0E1117] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                
                {/* 텔레메트리 데이터 그리드 */}
                <div className="p-4 sm:p-6 space-y-3 max-w-lg mx-auto w-full">
                  
                  {/* NRC 메인 디스플레이: 대형 거리(KM) */}
                  <div className="text-center space-y-0.5">
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                      TOTAL DISTANCE
                    </span>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl sm:text-6xl font-black font-mono tracking-tighter leading-none">
                        {currentDistanceKm.toFixed(2)}
                      </span>
                      <span className="text-xl font-bold font-mono text-sky-500">KM</span>
                    </div>
                  </div>

                  {/* 3대 보조 텔레메트리 (페이스, 시간, 칼로리) */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-b border-slate-100 dark:border-white/5 py-2">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block font-bold">AVG PACE</span>
                      <span className="text-lg font-black font-mono leading-tight">{currentPaceStr}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block font-bold">DURATION</span>
                      <span className="text-lg font-black font-mono leading-tight text-sky-500">
                        {h !== '00' ? `${h}:` : ''}{m}:{s}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block font-bold">CALORIES</span>
                      <span className="text-lg font-black font-mono leading-tight">{estimatedCalories} kcal</span>
                    </div>
                  </div>

                  {/* 여리고 순례 진행도 (바퀴 수)[cite: 20] */}
                  <div className="flex justify-between items-center px-2 text-xs font-bold">
                    <span className="text-slate-400">
                      {walkMode === 'jericho' ? `${dDay}일차 순례` : `${dDay}일차`} 바퀴 진행도
                    </span>
                    <span className="font-mono text-sky-500">
                      {logsToday.length} / {targetLaps} 바퀴 완료
                    </span>
                  </div>

                  {/* 중보기도 입력 & 파이프라인 전송[cite: 20] */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-400">땅을 밟으며 올리는 중보기도</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSendToIntercession(dailyPrayer)}
                          className="text-[10.5px] font-bold text-sky-500 hover:underline flex items-center gap-0.5"
                        >
                          <IconSend /> 중보함
                        </button>
                        <button
                          onClick={() => handleSendToApplyTracker(dailyPrayer)}
                          className="text-[10.5px] font-bold text-purple-500 hover:underline flex items-center gap-0.5 ml-1"
                        >
                          ⚡ 실천과제
                        </button>
                      </div>
                    </div>
                    <input 
                      type="text"
                      value={dailyPrayer}
                      onChange={e => setDailyPrayer(e.target.value)}
                      placeholder="발걸음 닿는 곳마다 선포할 기도제목을 적으세요..."
                      className={`w-full p-2.5 text-xs rounded-xl border outline-none font-bold ${
                        isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  {/* 🏃 나이키 런 거대 원형 컨트롤 버튼군[cite: 20] */}
                  <div className="pt-2 flex items-center justify-center gap-4">
                    {!isTracking ? (
                      <button
                        onClick={startTracking}
                        className="w-20 h-20 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex flex-col items-center justify-center font-black shadow-[0_0_25px_rgba(14,165,233,0.5)] active:scale-95 transition-all cursor-pointer"
                      >
                        <IconPlay />
                        <span className="text-[10px] font-mono tracking-widest mt-0.5">START</span>
                      </button>
                    ) : (
                      <>
                        {/* 일시정지 / 재개 버튼 */}
                        <button
                          onClick={() => setIsPaused(!isPaused)}
                          className={`w-16 h-16 rounded-full flex flex-col items-center justify-center font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer ${
                            isPaused ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                          }`}
                        >
                          {isPaused ? <IconPlay /> : <IconPause />}
                          <span className="text-[9px] font-mono mt-0.5">{isPaused ? 'RESUME' : 'PAUSE'}</span>
                        </button>

                        {/* 바퀴 완료 버튼 (+1 Lap)[cite: 20] */}
                        {currentLap < targetLaps && (
                          <button
                            onClick={recordLap}
                            disabled={isSaving}
                            className="px-4 py-3 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                          >
                            {isSaving ? '기록 중...' : `+1 바퀴 완료 (${currentLap}바퀴)`}
                          </button>
                        )}

                        {/* 완주 및 정지 버튼[cite: 20] */}
                        <button
                          onClick={() => stopTracking(false)}
                          disabled={isSaving}
                          className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex flex-col items-center justify-center font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                        >
                          <IconCheck />
                          <span className="text-[9px] font-mono mt-0.5">FINISH</span>
                        </button>
                      </>
                    )}
                  </div>

                </div>

              </div>

            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* C. 공동체 현황 피드[cite: 20]                                             */}
        {/* ========================================================================= */}
        {activeTab === 'community' && (
          <div className="flex-1 w-full overflow-y-auto px-4 sm:px-6 pt-5 pb-20 max-w-lg mx-auto hide-scrollbar space-y-3">
            {communityData.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                진행 중인 공동체 순례 여정이 없습니다.
              </div>
            ) : (
              communityData.map(campaign => {
                if (!campaign) return null;
                const cDday = getDday(campaign.started_at || campaign.created_at);
                const isJericho = campaign.main_prayer?.includes('여리고');

                return (
                  <div key={campaign.id} className={`p-4 rounded-2xl border space-y-3 ${
                    isDark ? 'bg-[#11141D] border-white/10' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-sky-500/10 text-sky-500 border border-sky-500/20">
                          {isJericho ? '여리고 7일' : '땅밟기'}
                        </span>
                        <span className="font-bold text-xs">{campaign.user_name} 성도</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {campaign.status === 'completed' ? '완주' : `D-${cDday}`}
                      </span>
                    </div>

                    <p className={`p-3 rounded-xl text-xs font-medium leading-relaxed break-keep ${
                      isDark ? 'bg-black/30' : 'bg-slate-50'
                    }`}>
                      {campaign.main_prayer}
                    </p>

                    {/* 응원 메시지 목록[cite: 20] */}
                    <div className="space-y-1.5">
                      {(campaign.jericho_cheers || []).map(cheer => (
                        <div key={cheer.id} className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-snug">
                          {!cheer.is_system && <strong className="text-slate-800 dark:text-slate-200 mr-1.5">{cheer.cheerer_name}:</strong>}
                          {cheer.message}
                        </div>
                      ))}
                    </div>

                    {/* 응원 입력창[cite: 20] */}
                    <div className="flex gap-1.5 pt-1">
                      <input 
                        type="text" 
                        placeholder="지체에게 응원의 한마디 남기기..."
                        value={cheerInputs[campaign.id] || ''}
                        onChange={e => setCheerInputs({ ...cheerInputs, [campaign.id]: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && handleAddCheer(campaign.id)}
                        className={`flex-1 p-2 text-xs rounded-xl border outline-none ${
                          isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                      <button
                        onClick={() => handleAddCheer(campaign.id)}
                        className="px-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer"
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

        {/* ========================================================================= */}
        {/* D. 완주 기록실 (Victory Finisher Archive)[cite: 20]                      */}
        {/* ========================================================================= */}
        {activeTab === 'history' && (
          <div className="flex-1 w-full overflow-y-auto px-4 sm:px-6 pt-5 pb-20 max-w-lg mx-auto hide-scrollbar space-y-4">
            {historyData.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                아직 완주 기록이 없습니다.
              </div>
            ) : (
              historyData.map(campaign => {
                if (!campaign) return null;
                const allLogs = campaign.jericho_logs || [];
                const totalSecs = allLogs.reduce((sum, log) => sum + (log.time_taken_sec || 0), 0);
                const formatTime = (secs) => {
                  const m = Math.floor(secs / 60); const s = secs % 60;
                  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
                };

                return (
                  <div key={campaign.id} className={`p-5 rounded-2xl border space-y-3.5 ${
                    isDark ? 'bg-[#11141D] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        🏆 VICTORY FINISH
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {campaign.completed_at ? new Date(campaign.completed_at).toLocaleDateString() : ''}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-black">{campaign.user_name} 성도님</h3>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {campaign.main_prayer}
                      </p>
                    </div>

                    {/* 완주 지도[cite: 20] */}
                    <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
                      <HistoryMap logs={allLogs} isDark={isDark} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-black/30 text-center font-mono text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">TOTAL LAPS</span>
                        <span className="text-base font-black text-sky-500">{allLogs.length} 바퀴</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">TOTAL DURATION</span>
                        <span className="text-base font-black">{formatTime(totalSecs)}</span>
                      </div>
                    </div>

                    {/* 일차별 기도 요약[cite: 20] */}
                    <div className="space-y-1.5 pt-1 border-t border-dashed border-slate-200 dark:border-white/10">
                      <span className="text-[11px] font-bold text-slate-400 block">일차별 순례 기도 요약</span>
                      {allLogs.filter(l => l.daily_prayer).map((log, i) => (
                        <div key={i} className="text-xs pl-2.5 border-l-2 border-sky-500 space-y-0.5">
                          <span className="font-mono font-bold text-sky-500 text-[10px]">{log.day_number}일차 스플릿</span>
                          <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{log.daily_prayer}</p>
                        </div>
                      ))}
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
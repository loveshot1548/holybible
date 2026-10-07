import React, { useMemo, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import myFontUrl from '../MYYeongnamnu.ttf'; // 폰트 경로 확인
import { bookNamesKo, fallbackKoMap, familyVerseCards, newYearVerseCards } from '../data/constants';

// Supabase 설정
export const SUPABASE_URL = 'https://fenzodpldsxdttzgztcl.supabase.co'; 
export const SUPABASE_ANON_KEY = 'sb_publishable_-vkRD_NKdbuiLxNbE_PceA_pIE63Ui-'; 
export const supabase = SUPABASE_URL.includes('YOUR-PROJECT') ? null : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const safeParse = (key, def) => { try { const val = localStorage.getItem(key); if (!val) return def; const parsed = JSON.parse(val); return parsed !== null ? parsed : def; } catch(e) { return def; } };
export const getKoName = (n) => bookNamesKo[n] || n;
export const getLocalToday = () => { const o = new Date().getTimezoneOffset() * 60000; return new Date(Date.now() - o).toISOString().split('T')[0]; };
export const cleanText = (t) => (t || '').replace(/|'|\x1B|\(가정\d*\)|\(개인\d*\)|\(개인\)/gi, '').trim();
export const getArr = (val, def = []) => Array.isArray(val) ? val : def;
export const extractVideoId = (url) => { if(!url) return null; const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/); return m ? m[1] : null; };
export const isGisangogi = (d) => { const t = new Date(d).getTime(); return [{start:'2026-07-06',end:'2026-07-10'}].some(r => t >= new Date(r.start).getTime() && t <= new Date(r.end).getTime()); };

export const parseBibleRefExt = (r) => { 
  const m = r.replace(/\s+/g, '').match(/([가-힣0-9]+?)(\d+)(?:장|:)(?:(\d+)(?:절)?)?(?:~|-)?(?:(\d+)(?:장|:))?(?:(\d+)(?:절)?)?/); 
  if (!m) return null; const eb = fallbackKoMap[m[1]] || bookNamesKo[m[1]]; if (!eb) return null; 
  const c1 = parseInt(m[2]), v1 = m[3] ? parseInt(m[3]) : 1, c2 = m[4] ? parseInt(m[4]) : c1, v2 = m[5] ? parseInt(m[5]) : (m[3] && !m[4] ? v1 : 999); 
  return { eb, c1, v1, c2, v2, kb: m[1] }; 
};

export const getSeededVerse = (d, type) => { 
    const h = d.replace(/-/g, '').split('').reduce((a,c)=>a+parseInt(c||0),0)+parseInt(d.slice(-2)); 
    return type === 'family' ? familyVerseCards[h % (familyVerseCards.length || 1)] : newYearVerseCards[h % (newYearVerseCards.length || 1)]; 
};

export const formatVerseText = (ft) => { 
    if (!ft || typeof ft !== 'string') return { text: '말씀을 불러오는 중입니다...', ref: '' }; 
    const match = ft.match(/(.*?)\s*(\([^)]+\))$/); 
    return match ? { text: match[1], ref: match[2] } : { text: ft, ref: '' }; 
};

export const handleAutoResize = (e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; };

export const watercolorBgs = Array.from({length: 50}, (_, i) => `https://picsum.photos/seed/qtwatercolors${i}/800/1500`);

export const useTheme = (isD) => useMemo(() => ({
  appBg: isD ? 'bg-slate-900' : 'bg-[#F1F5F9]', pageBg: isD ? 'bg-slate-950' : 'bg-[#F8FAFC]', cardBg: isD ? 'bg-slate-800 border-slate-700 shadow-none' : 'bg-white border-slate-100 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)]',
  textMain: isD ? 'text-slate-100' : 'text-slate-800', textSub: isD ? 'text-slate-400' : 'text-slate-500', inputBg: isD ? 'bg-slate-900 text-slate-100 border-slate-700' : 'bg-slate-50 text-slate-800 border-slate-200',
  tabBar: isD ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]', border: isD ? 'border-slate-700' : 'border-slate-200', primaryBg: 'bg-[#9CB4D8]', primaryText: 'text-[#7A9BB8]', pinkText: 'text-[#FFB7B2]', highlight: 'bg-slate-200 dark:bg-slate-700'
}), [isD]);

export const GlobalStyles = () => (
  <style>{`
    @font-face { font-family: 'MYYeongnamnu'; src: url('${myFontUrl}') format('truetype'); font-display: swap; }
    .font-yeongnamnu { font-family: 'MYYeongnamnu', sans-serif !important; }
    html, body { overflow-x: hidden; overscroll-behavior-x: none; width: 100vw; height: 100vh; margin: 0; padding: 0; position: fixed; }
    #root { width: 100vw; height: 100vh; display: flex; overflow-x: hidden; }
    @keyframes swing3d { 0% { transform: perspective(400px) rotateY(-20deg); } 50% { transform: perspective(400px) rotateY(20deg); } 100% { transform: perspective(400px) rotateY(-20deg); } }
    .animate-3d-swing { animation: swing3d 3.5s ease-in-out infinite; display: inline-block; }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    input[type="date"].date-hidden::-webkit-calendar-picker-indicator { background: transparent; bottom: 0; color: transparent; cursor: pointer; height: auto; left: 0; position: absolute; right: 0; top: 0; width: auto; pointer-events: none; }
    [contenteditable]:empty:before { content: attr(placeholder); color: #94a3b8; pointer-events: none; display: block; white-space: pre-wrap; }
    .note-lines { background-image: repeating-linear-gradient(transparent, transparent 37px, rgba(148,163,184,0.3) 38px); background-size: 100% 38px; line-height: 38px; padding-top: 6px; background-attachment: local; }
    .dark .note-lines { background-image: repeating-linear-gradient(transparent, transparent 37px, rgba(71,85,105,0.5) 38px); }
  `}</style>
);

export const Confetti = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current; if(!canvas) return; const ctx = canvas.getContext('2d'); canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const particles = []; const colors = ['#fce18a', '#ff726d', '#b48def', '#f4306d', '#5af158', '#4285F4'];
    for(let i=0; i<150; i++) particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height-canvas.height, r: Math.random()*5+3, dx: Math.random()*4-2, dy: Math.random()*4+2, color: colors[Math.floor(Math.random()*colors.length)], tilt: Math.floor(Math.random()*10)-10, tiltAngle: 0, tiltAngleInc: (Math.random()*0.07)+0.05 });
    let id; const render = () => { ctx.clearRect(0,0,canvas.width,canvas.height); particles.forEach(p => { p.tiltAngle += p.tiltAngleInc; p.y += (Math.cos(p.tiltAngle) + 1 + p.r / 2) / 2 + p.dy; p.x += Math.sin(p.tiltAngle) * 2 + p.dx; ctx.beginPath(); ctx.lineWidth = p.r; ctx.strokeStyle = p.color; ctx.moveTo(p.x + p.tilt + p.r, p.y); ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r); ctx.stroke(); }); id = requestAnimationFrame(render); };
    render(); return () => cancelAnimationFrame(id);
  }, []); return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[9999]" />;
};
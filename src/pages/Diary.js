// src/components/Diary.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import CryptoJS from 'crypto-js';

// =====================================================================
// 🔐 [보안 표준화] 군사급 AES-256 종단간 암호화 (구버전 Base64 호환)
// =====================================================================
const CHAT_SECRET_KEY = process.env.REACT_APP_CHAT_SECRET || 'tree-secret-key-2026';
const ENC_PREFIX_V2 = "ENC_GTC_v2::";
const ENC_PREFIX_V1 = "ENC_GTC_v1::";

const encryptField = (plainText) => {
  if (!plainText || typeof plainText !== 'string') return plainText;
  try {
    const cipher = CryptoJS.AES.encrypt(plainText, CHAT_SECRET_KEY).toString();
    return `${ENC_PREFIX_V2}${cipher}`;
  } catch (e) {
    return plainText;
  }
};

const decryptField = (cipherText) => {
  if (!cipherText || typeof cipherText !== 'string') return cipherText || '';
  
  if (cipherText.startsWith(ENC_PREFIX_V2)) {
    try {
      const rawCipher = cipherText.replace(ENC_PREFIX_V2, '');
      const bytes = CryptoJS.AES.decrypt(rawCipher, CHAT_SECRET_KEY);
      const original = bytes.toString(CryptoJS.enc.Utf8);
      return original || cipherText;
    } catch (e) {
      return cipherText;
    }
  }

  if (cipherText.startsWith(ENC_PREFIX_V1)) {
    try {
      const payload = cipherText.replace(ENC_PREFIX_V1, '');
      return decodeURIComponent(atob(payload));
    } catch (e) {
      return cipherText;
    }
  }

  return cipherText;
};

const StrokeW = "1.5";
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>;
const IconMenu = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const IconHeart = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>;
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4"><polyline points="20 6 9 17 4 12" /></svg>;
const IconChevronRight = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><polyline points="9 18 15 12 9 6" /></svg>;
const IconEdit = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>;
const IconSend = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
const IconClose = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IconSparkles = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>;

const TESTIMONY_TEMPLATE = `1. 제목 (한 문장으로) : \n\n2. 오늘 받은 말씀 : \n\n3. 사건 (무슨 일이 있었는가?) : \n\n4. 내 죄와 우상 (왜 그렇게 반응했는가?) : \n\n5. 말씀으로 받은 깨달음 : \n\n6. 적용 (구체적으로 무엇을 순종할 일인가?) : \n\n7. 하나님이 주신 열매 : \n\n8. 감사 : `;

const getLocal = (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const setLocal = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

export default function Diary({ t, isDarkMode, setActiveScreen, isSidebarOpen, setIsSidebarOpen, openModal, currDay = {}, bibleNotes = [], getArr = (a)=>a||[], authUser }) {

  const [secretThanks, setSecretThanks] = useState([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedThanksItem, setSelectedThanksItem] = useState('');

  // 🌟 [모바일 UX 최적화] 10분 훈련표 점진적 스텝퍼 상태 (0: 관찰과 감정, 1: 말씀과 해석, 2: 회개와 순종)
  const [trainingStep, setTrainingStep] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;

    const fetchSecretThanks = async () => {
      try {
        const { data } = await supabase.from('secret_injections').select('*').eq('type', 'thanks').order('created_at', { ascending: false });
        if (data && isMounted) {
          setSecretThanks(data.map(st => ({
            ...st,
            content: decryptField(st.content)
          })));
        }
      } catch (e) {}
    };
    fetchSecretThanks();

    const sub = supabase.channel('secret_thanks_fixed_chan')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'secret_injections', filter: "type=eq.thanks" }, payload => {
        if (isMounted && payload.new) {
          const item = { ...payload.new, content: decryptField(payload.new.content) };
          setSecretThanks(prev => [item, ...prev]);
        }
      }).subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(sub);
    };
  }, []);

  const isDark = isDarkMode;

  const ui = {
    bgBody: isDark ? 'bg-[#0F1115]' : 'bg-[#FAFAF9]',
    bgPanel: isDark ? 'bg-[#181A20]/80 border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)] backdrop-blur-xl' : 'bg-white/95 border border-[#E7E5E4] shadow-[0_4px_15px_rgba(149,157,165,0.08)] backdrop-blur-xl',
    bgInput: isDark ? 'bg-black/30 border-white/10 text-[#F4F4F5] focus:border-sky-400 placeholder:text-[#475569]' : 'bg-white border-[#E7E5E4] text-[#292524] focus:border-sky-500 placeholder:text-[#94A3B8]',
    border: isDark ? 'border-white/10' : 'border-[#E7E5E4]',
    borderDash: isDark ? 'border-white/10' : 'border-[#D6D3D1]',
    textMain: isDark ? 'text-[#F4F4F5]' : 'text-[#292524]', 
    textSub: isDark ? 'text-[#A1A1AA]' : 'text-[#78716C]', 
    accent: isDark ? 'text-[#D4D4D8]' : 'text-[#44403C]',
    btn: isDark ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-sky-500 hover:bg-sky-600 text-white',
  };

  const [activeTab, setActiveTab] = useState('dashboard');

  const [daily10Min, setDaily10Min] = useState(() => getLocal('diary_10min', { word:'', event:'', emotion:'', desire:'', found:'', apply:'', repent:'', thanks:'', obey:'', share:'' }));
  const [theologyNotes, setTheologyNotes] = useState(() => getLocal('diary_theo_notes', { q1:'', q2:'' }));
  const [qtPractice, setQtPractice] = useState(() => getLocal('diary_qt_practice', { fact: '', emotion: [], desire: '', interpretation: '', word: '', myself: '', repent: '', thanks: '', action: '', prayer: '' }));
  const [sufferingPractice, setSufferingPractice] = useState(() => getLocal('diary_suffer_practice', { event:'', emotion:'', interpretation:'', word:'', myself:'', repent:'', action:'', community:'' }));
  const [thanksChecklist, setThanksChecklist] = useState(() => getLocal('diary_thanks_check', { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 }));
  const [sufferingChecklist, setSufferingChecklist] = useState(() => getLocal('diary_suffer_check', { a:false, b:false, c:false, d:false, e:false, f:false, g:false, h:false, i:false, j:false }));
  const [curriculumNotes, setCurriculumNotes] = useState(() => getLocal('diary_curriculum_notes', {}));

  useEffect(() => setLocal('diary_10min', daily10Min), [daily10Min]);
  useEffect(() => setLocal('diary_theo_notes', theologyNotes), [theologyNotes]);
  useEffect(() => setLocal('diary_qt_practice', qtPractice), [qtPractice]);
  useEffect(() => setLocal('diary_suffer_practice', sufferingPractice), [sufferingPractice]);
  useEffect(() => setLocal('diary_thanks_check', thanksChecklist), [thanksChecklist]);
  useEffect(() => setLocal('diary_suffer_check', sufferingChecklist), [sufferingChecklist]);
  useEffect(() => setLocal('diary_curriculum_notes', curriculumNotes), [curriculumNotes]);

  const handle10Min = (f, v) => setDaily10Min(p => ({...p, [f]:v}));
  const handleQt = (f, v) => setQtPractice(p => ({...p, [f]:v}));
  const handleSuffer = (f, v) => setSufferingPractice(p => ({...p, [f]:v}));
  const toggleSufferCheck = (k) => setSufferingChecklist(p => ({...p, [k]:!p[k]}));
  const handleThanksScore = (idx, score) => setThanksChecklist(p => ({...p, [idx]:score}));

  const totalThanksScore = Object.values(thanksChecklist || {}).reduce((a, b) => a + Number(b || 0), 0);

  const parsedThanksList = (currDay.thanksText || '')
    .split('\n')
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);

  // ERP 연동 로직
  const syncThanksToERP = () => {
    if (supabase && (authUser?.name || authUser)) {
      const uName = typeof authUser === 'object' ? authUser?.name : authUser;
      if (uName) {
        supabase.from('attendance_records').upsert({
          date: new Date().toISOString().split('T')[0],
          user_name: uName,
          cell_name: authUser?.cell_name || '내 목장',
          type: '감사',
          status: '출석'
        }, { onConflict: 'date,user_name,type' }).then();
      }
    }
  };

  // 🌟 [핵심 신규 기능] 제자훈련 은혜/간증 ➔ 블록버스터 릴스 원터치 직결
  const handleExportToReels = (textToShare = '', category = '감사') => {
    const targetText = textToShare || daily10Min.share || daily10Min.thanks || parsedThanksList[0] || '말씀으로 해석된 은혜의 고백';
    const payload = {
      sourceMode: 'diary',
      targetDate: currDay?.date || new Date().toISOString().split('T')[0],
      title: `[제자훈련] ${category} 고백`,
      subtitle: daily10Min.word || 'DISCIPLESHIP',
      heroText: targetText.slice(0, 40),
      bodyText: targetText,
      actionText: daily10Min.obey || ''
    };

    localStorage.setItem('reels_direct_trigger', JSON.stringify(payload));
    alert("🎬 제자훈련 은혜 고백으로 릴스 스튜디오를 준비합니다...");
    
    if (typeof setActiveScreen === 'function') {
      setActiveScreen('reels');
    }
  };

  const handleSendAllToCell = () => {
    if (parsedThanksList.length === 0) return alert('전송할 감사 리스트가 비어있습니다.');
    try {
      const existing = JSON.parse(localStorage.getItem('cell_shared_thanks') || '[]');
      const allTextFormatted = parsedThanksList.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
      existing.push({
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        source: 'diary_thanks_all',
        text: encryptField(allTextFormatted)
      });
      localStorage.setItem('cell_shared_thanks', JSON.stringify(existing));
      
      syncThanksToERP();

      alert(`오늘의 감사 ${parsedThanksList.length}건이 목장 모임 [감사나눔]으로 일괄 전송되었습니다!`);
    } catch (e) {
      alert("일괄 전송 중 오류가 발생했습니다.");
    }
  };

  const handleSendToCell = (text) => {
    if (!text || !text.trim()) return;
    try {
      const existing = JSON.parse(localStorage.getItem('cell_shared_thanks') || '[]');
      existing.push({
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        source: 'diary_thanks',
        text: encryptField(text.trim())
      });
      localStorage.setItem('cell_shared_thanks', JSON.stringify(existing));

      syncThanksToERP();

      alert("목장 모임 [감사나눔]으로 전송되었습니다!");
      setShowSendModal(false);
    } catch (e) {
      alert("전송 중 오류가 발생했습니다.");
    }
  };

  const handleSendToSermon = (text) => {
    if (!text || !text.trim()) return;
    try {
      const todayKey = new Date().toISOString().split('T')[0];
      const allDaily = JSON.parse(localStorage.getItem('qt_daily') || '{}');
      const todayData = allDaily[todayKey] || {};
      const currentDeclarations = Array.isArray(todayData.thanksDeclarations) ? [...todayData.thanksDeclarations] : ['', ''];
      
      if (!currentDeclarations[0]) currentDeclarations[0] = text.trim();
      else if (!currentDeclarations[1]) currentDeclarations[1] = text.trim();
      else currentDeclarations.push(text.trim());

      allDaily[todayKey] = { ...todayData, thanksDeclarations: currentDeclarations };
      localStorage.setItem('qt_daily', JSON.stringify(allDaily));

      syncThanksToERP();

      alert("예배노트 [나의 감사선포]로 전송되었습니다!");
      setShowSendModal(false);
    } catch (e) {
      alert("전송 중 오류가 발생했습니다.");
    }
  };

  const tabs = [
    { id: 'dashboard', label: '감사 대시보드' },
    { id: 'theology', label: '감사와 고난 신학' },
    { id: 'thanks', label: '감사 훈련 6단계' },
    { id: 'suffering', label: '고난 해석 8단계' },
    { id: 'curriculum', label: '12주 훈련 커리큘럼' }
  ];

  // 10분 훈련표 3단계 스텝 데이터 구성
  const trainingStepGroups = [
    {
      title: '1단계: 사건과 감정 직면',
      desc: '오늘 하루 일어난 팩트와 정직한 내 감정을 마주합니다.',
      fields: [
        { id: 'event', label: '오늘의 사건 (팩트)' },
        { id: 'emotion', label: '오늘의 감정' },
        { id: 'desire', label: '내가 원했던 것 (우상)' }
      ]
    },
    {
      title: '2단계: 말씀의 빛으로 조명',
      desc: '내 생각이 아닌 오늘 주신 말씀의 관점으로 상황을 해석합니다.',
      fields: [
        { id: 'word', label: '오늘의 말씀' },
        { id: 'found', label: '말씀에서 발견한 것' },
        { id: 'apply', label: '나에게 적용되는 것' }
      ]
    },
    {
      title: '3단계: 회개·감사·공동체 나눔',
      desc: '행동으로 순종하고 믿음의 공동체와 나눌 한 문장을 완성합니다.',
      fields: [
        { id: 'repent', label: '회개할 것' },
        { id: 'thanks', label: '감사의 고백' },
        { id: 'obey', label: '오늘의 순종 실천' },
        { id: 'share', label: '오늘 공동체에 나눌 한 문장', ph: '오늘 말씀을 통해 하나님께서 제게 보여주신 것은 ______입니다.' }
      ]
    }
  ];

  return (
    <div className={`flex-1 flex flex-col h-full relative overflow-hidden font-sans ${ui.bgBody}`}>
      
      {/* 헤더 */}
      <div className={`px-4 py-3 flex items-center justify-between border-b ${ui.border} ${ui.bgPanel} shrink-0`}>
        <div className="flex items-center gap-3">
           <button onClick={() => setActiveScreen('home')} className={`p-1 -ml-1 transition-colors ${ui.textSub} hover:${ui.textMain} cursor-pointer`}><IconArrowLeft /></button>
           <h1 className={`text-[16px] font-black tracking-tight ${ui.textMain}`}>말씀으로 삶을 해석하는 제자훈련</h1>
        </div>
        <button onClick={() => setIsSidebarOpen && setIsSidebarOpen(!isSidebarOpen)} className={`p-1 transition-colors ${ui.textSub} hover:${ui.textMain} cursor-pointer`}><IconMenu /></button>
      </div>

      {/* 가로 탭 바 */}
      <div className={`flex w-full px-4 overflow-x-auto hide-scrollbar border-b ${ui.border} ${ui.bgPanel} shrink-0`}>
         {tabs.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              className={`py-3.5 mr-6 text-[13px] font-bold border-b-[2px] transition-colors whitespace-nowrap cursor-pointer
                ${activeTab === tab.id ? `border-sky-500 ${ui.textMain} font-black` : `border-transparent ${ui.textSub} hover:${ui.textMain}`}`}
            >
              {tab.label}
            </button>
         ))}
      </div>

      <div className="flex-1 overflow-y-auto w-full hide-scrollbar">
        <div className="w-full h-full">

          {/* TAB 1: 감사 대시보드 */}
          {activeTab === 'dashboard' && (
            <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-[1600px] mx-auto pb-32">
               
               <div className="lg:col-span-5 flex flex-col gap-4">
                  {secretThanks.length > 0 && (
                    <div className="p-5 border border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10 flex flex-col gap-3 rounded-2xl shadow-xs">
                       <h3 className="text-[14px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-2">
                         💌 당신의 삶에 심겨진 익명의 감사
                       </h3>
                       <div className="flex flex-col gap-2">
                          {secretThanks.map(st => (
                            <div key={st.id} className="p-3 bg-white/80 dark:bg-black/30 backdrop-blur-sm text-[13.5px] font-bold text-gray-800 dark:text-gray-200 rounded-xl shadow-xs">
                              "{st.content}"
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  {/* 오늘의 감사 리스트 카드 + 릴스 변환 버튼 */}
                  <div className={`${ui.bgPanel} p-5 border ${ui.border} flex flex-col gap-3 rounded-2xl`}>
                     <div className="flex justify-between items-center">
                        <h3 className={`text-[15px] font-black ${ui.textMain} flex items-center gap-2`}><IconHeart/> 오늘의 감사 리스트</h3>
                        
                        <div className="flex items-center gap-2">
                           {parsedThanksList.length > 0 && (
                             <>
                               <button
                                 onClick={() => handleExportToReels(parsedThanksList[0], '오늘의 감사')}
                                 className="px-2.5 py-1 text-[11px] font-black bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 text-white rounded-lg shadow-xs transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
                                 title="첫 번째 감사를 3초 시네마틱 릴스로 즉시 제작"
                               >
                                 <span>🎬</span> 릴스 변환
                               </button>

                               <button
                                 onClick={handleSendAllToCell}
                                 className="px-2.5 py-1 text-[11px] font-black bg-sky-500 hover:bg-sky-600 text-white rounded-lg shadow-xs transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
                                 title="전체 감사 리스트를 목장 모임으로 한 번에 보냅니다"
                               >
                                 <IconSend /> 일괄 전송
                               </button>
                             </>
                           )}
                           <span onClick={() => openModal && openModal('thanks')} className={`text-[12px] font-bold ${ui.textSub} flex items-center cursor-pointer hover:${ui.textMain}`}>전체 편집 <IconChevronRight/></span>
                        </div>
                     </div>
                     
                     {parsedThanksList.length === 0 ? (
                       <p className={`text-[13px] font-medium ${ui.textSub} py-1`}>
                         오늘의 감사를 기록하세요.
                       </p>
                     ) : (
                       <div className="flex flex-col gap-1.5 pt-1">
                         {parsedThanksList.map((item, idx) => (
                           <div key={idx} className={`p-2.5 border rounded-xl flex items-center justify-between gap-2 ${isDark ? 'bg-black/20 border-white/10' : 'bg-stone-50 border-stone-200'}`}>
                             <div className="flex items-start gap-2 min-w-0">
                               <span className="text-[11.5px] font-bold text-amber-500 shrink-0 mt-0.5">{idx + 1}.</span>
                               <span className={`text-[13px] font-medium leading-snug truncate ${ui.textMain}`}>{item}</span>
                             </div>
                             
                             <div className="flex items-center gap-1 shrink-0">
                               <button
                                 onClick={() => handleExportToReels(item, `감사 ${idx + 1}`)}
                                 className="px-2 py-1 text-[10.5px] font-black text-rose-500 hover:underline cursor-pointer"
                                 title="이 감사 항목으로 릴스 제작"
                               >
                                 🎬 릴스
                               </button>
                               <button
                                 onClick={() => {
                                   setSelectedThanksItem(item);
                                   setShowSendModal(true);
                                 }}
                                 className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white rounded-md transition-all flex items-center gap-1 cursor-pointer"
                               >
                                 <IconSend /> 전송
                               </button>
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                  </div>

                  {/* 말씀 묵상 노트 */}
                  <div className={`${ui.bgPanel} p-5 border ${ui.border} flex flex-col gap-3 rounded-2xl`}>
                     <div className="flex justify-between items-center border-b border-dashed pb-2 mb-1 border-current opacity-20">
                        <h3 className={`text-[15px] font-black ${ui.textMain} flex items-center gap-2`}><IconBook/> 말씀 묵상 노트</h3>
                        <span className={`text-[11px] font-bold ${ui.textSub}`}>총 {getArr(bibleNotes).length}개</span>
                     </div>
                     <div className="flex flex-col gap-0">
                        {getArr(bibleNotes).length === 0 ? (
                           <p className={`text-[13px] font-medium ${ui.textSub} py-2`}>저장된 노트가 없습니다.</p>
                        ) : (
                           getArr(bibleNotes).slice(0, 3).map(n => (
                              <div key={n.id} onClick={() => openModal && openModal('bibleNoteList', n)} className={`py-3 border-b last:border-0 border-dashed ${ui.borderDash} cursor-pointer`}>
                                 <p className={`text-[13px] font-bold ${ui.textMain} truncate`}>{n.verses?.[0]?.ref || '말씀'} : <span className="font-medium text-slate-500">{n.note ? n.note.replace(/<[^>]*>?/gm, '') : '내용 없음'}</span></p>
                              </div>
                           ))
                        )}
                     </div>
                  </div>

                  {/* 나의 묵상 간증 */}
                  <div onClick={() => openModal && openModal('testimony')} className={`${ui.bgPanel} p-5 border ${ui.border} rounded-2xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex flex-col gap-2`}>
                     <div className="flex justify-between items-center">
                        <h3 className={`text-[15px] font-black ${ui.textMain} flex items-center gap-2`}><IconEdit/> 나의 묵상 간증</h3>
                        <span className={`text-[12px] font-bold ${ui.textSub} flex items-center`}>작성 <IconChevronRight/></span>
                     </div>
                     <p className={`text-[13px] font-medium ${ui.textSub} line-clamp-2`}>
                        {currDay.testimony && currDay.testimony !== TESTIMONY_TEMPLATE ? '간증문이 작성되어 있습니다.' : '오늘의 묵상과 간증을 기록하세요.'}
                     </p>
                  </div>
               </div>

               {/* 우측: 10분 훈련표 (3단계 점진적 스텝퍼 UX 적용) */}
               <div className="lg:col-span-7 flex flex-col">
                  <div className={`${ui.bgPanel} border ${ui.border} rounded-2xl h-full flex flex-col overflow-hidden`}>
                     
                     <div className={`p-4 sm:p-5 border-b ${ui.border} flex flex-col gap-2`}>
                        <div className="flex justify-between items-center">
                          <h3 className={`text-[16px] font-black ${ui.textMain}`}>매일 사용하는 10분 훈련표</h3>
                          
                          {/* 🌟 한 문장 나눔 릴스 변환 버튼 */}
                          <button
                            onClick={() => handleExportToReels(daily10Min.share, '10분 훈련 한문장')}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:opacity-90 text-white font-black text-[11px] shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                            title="공동체 나눌 한 문장을 릴스로 즉시 제작"
                          >
                            <IconSparkles /> 릴스 제작
                          </button>
                        </div>

                        {/* 스텝퍼 세그먼트 버튼 */}
                        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 mt-1">
                          {trainingStepGroups.map((grp, idx) => (
                            <button
                              key={idx}
                              onClick={() => setTrainingStep(idx)}
                              className={`py-1.5 px-2 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer truncate ${
                                trainingStep === idx
                                  ? 'bg-white dark:bg-zinc-800 text-sky-600 dark:text-sky-400 shadow-xs font-black'
                                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                              }`}
                            >
                              {idx + 1}단계
                            </button>
                          ))}
                        </div>
                     </div>

                     {/* 현재 스텝 입력 폼 */}
                     <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
                        <div className="space-y-3.5 animate-fade-in">
                          <div className="border-b border-dashed border-zinc-200 dark:border-zinc-800 pb-2 mb-3">
                            <span className="text-[12px] font-black text-sky-600 dark:text-sky-400 block">
                              {trainingStepGroups[trainingStep].title}
                            </span>
                            <span className="text-[11px] text-zinc-500 font-medium">
                              {trainingStepGroups[trainingStep].desc}
                            </span>
                          </div>

                          {trainingStepGroups[trainingStep].fields.map(f => (
                            <div key={f.id} className="flex flex-col gap-1.5">
                              <label className={`text-[12px] font-bold ${ui.textMain}`}>{f.label}</label>
                              <input 
                                type="text"
                                value={daily10Min[f.id] || ''}
                                onChange={e => handle10Min(f.id, e.target.value)}
                                placeholder={f.ph || "기록하십시오..."}
                                className={`w-full px-3 py-2.5 text-[13px] font-medium rounded-xl outline-none transition-colors border ${ui.bgInput}`}
                              />
                            </div>
                          ))}
                        </div>

                        {/* 스텝 네비게이션 버튼 */}
                        <div className="flex justify-between items-center gap-2 pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800">
                          <button
                            disabled={trainingStep === 0}
                            onClick={() => setTrainingStep(p => Math.max(0, p - 1))}
                            className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-500 disabled:opacity-30 cursor-pointer"
                          >
                            ◀ 이전 단계
                          </button>
                          
                          <span className="text-[11px] font-mono font-bold text-zinc-400">
                            {trainingStep + 1} / 3 STEP
                          </span>

                          <button
                            disabled={trainingStep === 2}
                            onClick={() => setTrainingStep(p => Math.min(2, p + 1))}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 disabled:opacity-30 cursor-pointer shadow-xs"
                          >
                            다음 단계 ▶
                          </button>
                        </div>
                     </div>

                  </div>
               </div>

            </div>
          )}

          {/* TAB 2: 감사와 고난 신학 */}
          {activeTab === 'theology' && (
            <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1600px] mx-auto pb-32">
               <div className="flex flex-col gap-6">
                  <div className={`p-6 border ${ui.border} ${ui.bgPanel} rounded-2xl`}>
                     <span className={`text-[11px] font-bold ${ui.textSub} block mb-1 tracking-widest`}>PART 1. 감사의 본질</span>
                     <h2 className={`text-[18px] font-black ${ui.textMain} mb-4`}>감사는 감정이 아니다</h2>
                     <p className={`text-[13.5px] font-medium leading-[1.8] ${ui.textMain} break-keep mb-4`}>
                        성도들에게 제일 먼저 가르쳐야 할 것은 <strong>"감사하라는 말씀은 좋은 일이 생겼을 때 기분 좋게 반응하라는 뜻으로만 이해해서는 안 된다"</strong>는 것입니다. 성경은 어려운 상황에서도 하나님께 감사하도록 가르칩니다. <span className={ui.textSub}>(살전 5:18, 엡 5:20, 빌 4:6-7, 골 3:15-17, 시 50:14-15, 합 3:17-18)</span>
                     </p>
                     <div className={`p-4 bg-transparent border border-dashed ${ui.borderDash} rounded-xl flex flex-col gap-2`}>
                        <div className="flex items-start gap-2">
                           <span className="font-bold text-red-500 shrink-0">X</span>
                           <span className={`text-[13px] font-medium ${ui.textSub}`}>감사 = 기분 좋은 감정</span>
                        </div>
                        <div className="flex items-start gap-2">
                           <span className="font-bold text-emerald-500 shrink-0">O</span>
                           <span className={`text-[13.5px] font-bold ${ui.textMain}`}>감사 = 하나님을 인정하고 현재의 삶을 말씀 안에서 받아들이며 하나님께 반응하는 훈련</span>
                        </div>
                     </div>
                  </div>

                  <div className={`p-6 border ${ui.border} ${ui.bgPanel} rounded-2xl`}>
                     <span className={`text-[11px] font-bold ${ui.textSub} block mb-1 tracking-widest`}>PART 2. 고난의 해석</span>
                     <h2 className={`text-[18px] font-black ${ui.textMain} mb-4`}>김양재 목사의 고난 이해의 핵심축</h2>
                     <p className={`text-[13.5px] font-medium leading-[1.8] ${ui.textMain} break-keep mb-4`}>
                        김양재 목사는 고난을 <strong>"축복의 약재"</strong>라고 표현했고, 고난을 겪을 때 자기 생각이 아니라 말씀에 따라 고난을 해석해야 한다고 말했습니다. 성도들이 매일 같은 성경 본문을 묵상하고 그 말씀에 기초하여 자기 삶의 고통과 고난을 해석하는 훈련입니다.
                     </p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className={`p-4 border ${ui.border} rounded-xl`}>
                           <span className={`text-[12px] font-bold text-red-500 block mb-2`}>잘못된 접근</span>
                           <ul className={`text-[13px] font-medium ${ui.textSub} space-y-1.5`}>
                              <li>"왜 나에게 이런 일이 생겼지?"</li>
                              <li>"하나님이 나를 벌하시는 건가?"</li>
                              <li>"빨리 고난이 없어졌으면 좋겠다."</li>
                           </ul>
                        </div>
                        <div className={`p-4 border border-emerald-500/30 bg-emerald-500/5 rounded-xl`}>
                           <span className={`text-[12px] font-bold text-emerald-600 dark:text-emerald-400 block mb-2`}>말씀훈련의 접근</span>
                           <ul className={`text-[13px] font-bold ${ui.textMain} space-y-1.5`}>
                              <li>1. 무슨 일이 일어났는가?</li>
                              <li>2. 나는 지금 무엇을 느끼는가?</li>
                              <li>3. 나는 이 사건을 어떻게 해석하는가?</li>
                              <li>4. 말씀은 나에게 무엇을 보여주는가?</li>
                              <li>5. 이 사건에서 볼 나의 죄와 우상은?</li>
                              <li>6. 하나님은 내게 무엇을 말씀하시는가?</li>
                              <li>7. 무엇을 회개하고 순종할 것인가?</li>
                              <li>8. 구원의 방향은 무엇인가?</li>
                           </ul>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col gap-6">
                  <div className={`p-6 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-2xl`}>
                     <h3 className="text-[15px] font-black text-red-700 dark:text-red-400 mb-3">반드시 넣어야 할 「고난 해석 금지사항」</h3>
                     <p className="text-[12.5px] font-medium text-red-800/80 dark:text-red-300/80 mb-4 break-keep">
                        고난이 왔다고 해서 반드시 특정한 죄 때문에 하나님이 벌하신 것이라고 단정하지 않습니다. 성경 자체가 욥기의 경우처럼 단순한 인과관계를 부정합니다.
                     </p>
                     <ul className="space-y-2 text-[13.5px] font-bold text-red-900 dark:text-red-200">
                        <li>금지 1. "네가 죄를 지어서 이런 일이 생긴 거야."</li>
                        <li>금지 2. "하나님께서 반드시 이런 뜻으로 이 일을 주셨어."</li>
                        <li>금지 3. "믿음이 좋으면 고난이 없어져."</li>
                        <li>금지 4. "감사하면 무조건 문제가 해결돼."</li>
                        <li>금지 5. "고난이 축복이니까 힘들어도 힘들다고 하면 안 돼."</li>
                        <li>금지 6. "기도하면 반드시 내가 원하는 결과를 얻는다."</li>
                     </ul>
                  </div>

                  <div className={`p-6 border ${ui.border} ${ui.bgPanel} rounded-2xl`}>
                     <h3 className={`text-[16px] font-black ${ui.textMain} mb-3`}>이 훈련의 가장 중요한 문장</h3>
                     <div className={`p-5 text-center flex flex-col gap-4 bg-transparent border-t border-b border-dashed ${ui.borderDash}`}>
                        <p className={`text-[15px] font-black ${ui.accent} leading-[1.6] break-keep`}>
                           "고난을 없애달라고만 기도하지 말고, 고난 가운데서 말씀으로 나를 보게 해 달라고 기도한다."
                        </p>
                        <p className={`text-[14px] font-bold ${ui.textSub} leading-[1.6] break-keep`}>
                           "감사는 좋은 일이 생겼다는 선언이 아니라, 좋지 않은 상황에서도 하나님을 잃지 않겠다는 믿음의 반응이다."
                        </p>
                     </div>
                     <div className="mt-4 flex flex-col gap-2">
                        <label className={`text-[12px] font-bold ${ui.textMain}`}>위 문장을 묵상하며 나의 결단 적기</label>
                        <textarea 
                           value={theologyNotes.q1 || ''}
                           onChange={e => setTheologyNotes(p => ({...p, q1: e.target.value}))}
                           className={`w-full p-3 text-[13px] font-medium leading-[1.6] resize-none h-24 outline-none border rounded-xl ${ui.bgInput}`}
                           placeholder="기록하십시오..."
                        />
                     </div>
                  </div>
               </div>

            </div>
          )}

          {/* TAB 3: 감사 훈련 6단계 & 실습 */}
          {activeTab === 'thanks' && (
            <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto pb-32">
               <div className="lg:col-span-5 flex flex-col gap-6">
                  <div className={`p-6 border ${ui.border} ${ui.bgPanel} rounded-2xl`}>
                     <span className={`text-[11px] font-bold ${ui.textSub} block mb-1 tracking-widest`}>PART 3. 실전 가이드</span>
                     <h2 className={`text-[18px] font-black ${ui.textMain} mb-5`}>감사 훈련 6단계</h2>
                     
                     <div className="space-y-4">
                        <div>
                           <span className={`text-[13.5px] font-black ${ui.textMain} block mb-1`}>STEP 1. 사실을 기록한다</span>
                           <p className={`text-[12.5px] font-medium ${ui.textSub} mb-1.5`}>감정과 해석을 섞지 않습니다.</p>
                        </div>
                        <div>
                           <span className={`text-[13.5px] font-black ${ui.textMain} block mb-1`}>STEP 2. 내 감정을 기록한다</span>
                           <p className={`text-[12.5px] font-medium ${ui.textSub}`}>화, 서운함, 두려움, 억울함, 질투 등 감정을 숨기지 않습니다.</p>
                        </div>
                        <div>
                           <span className={`text-[13.5px] font-black ${ui.textMain} block mb-1`}>STEP 3. 내가 원하는 것을 찾는다</span>
                           <p className={`text-[12.5px] font-medium ${ui.textSub}`}>"나는 이 상황에서 무엇을 얻고 싶었는가?"</p>
                        </div>
                        <div>
                           <span className={`text-[13.5px] font-black ${ui.textMain} block mb-1`}>STEP 4. 말씀 앞에서 나를 본다</span>
                           <p className={`text-[12.5px] font-medium ${ui.textSub}`}>"오늘 말씀에서 하나님은 나에게 무엇을 말씀하시는가?"</p>
                        </div>
                        <div>
                           <span className={`text-[13.5px] font-black ${ui.textMain} block mb-1`}>STEP 5. 감사의 이유를 발견한다</span>
                           <p className={`text-[12.5px] font-medium ${ui.textSub}`}>"이 사건에서도 내가 발견한 하나님의 은혜는 무엇인가?"</p>
                        </div>
                        <div>
                           <span className={`text-[13.5px] font-black ${ui.textMain} block mb-1`}>STEP 6. 감사가 행동으로 연결된다</span>
                           <p className={`text-[12.5px] font-medium ${ui.textSub}`}>"그러므로 나는 오늘 무엇을 할 것인가?"</p>
                        </div>
                     </div>
                  </div>

                  <div className={`p-6 border ${ui.border} ${ui.bgPanel} rounded-2xl`}>
                     <div className="flex justify-between items-end mb-4">
                        <h2 className={`text-[16px] font-black ${ui.textMain}`}>감사 훈련 체크리스트</h2>
                        <span className={`text-[12px] font-bold ${ui.textMain}`}>총점: {totalThanksScore} / 20점</span>
                     </div>
                     <div className="flex flex-col gap-0 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                        {[
                          "매일 말씀을 읽었다", "말씀을 내 삶에 연결했다", "사건과 해석을 구분했다", "내 감정을 정직하게 기록했다", 
                          "남의 문제보다 나를 먼저 보았다", "회개할 것을 발견했다", "구체적으로 적용했다", "감사 제목을 기록했다", 
                          "불평을 줄이려고 노력했다", "공동체에 나누었다"
                        ].map((item, idx) => (
                           <div key={idx} className={`flex items-center justify-between p-2.5 border-b last:border-b-0 border-slate-200 dark:border-white/10 ${idx%2===0 ? 'bg-transparent' : 'bg-black/5 dark:bg-white/5'}`}>
                              <span className={`text-[12.5px] font-bold ${ui.textMain}`}>{item}</span>
                              <div className="flex gap-1">
                                 {[0, 1, 2].map(s => (
                                    <button 
                                       key={s} onClick={() => handleThanksScore(idx, s)}
                                       className={`w-7 h-7 text-[12px] font-black border rounded-lg transition-colors cursor-pointer ${thanksChecklist[idx] === s ? 'bg-sky-500 text-white border-transparent' : 'bg-transparent text-slate-400 border-slate-300 dark:border-slate-600'}`}
                                    >
                                       {s}
                                    </button>
                                 ))}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="lg:col-span-7 flex flex-col">
                  <div className={`p-6 border ${ui.border} ${ui.bgPanel} rounded-2xl h-full flex flex-col`}>
                     <span className={`text-[11px] font-bold ${ui.textSub} block mb-1 tracking-widest`}>Interactive Workbook</span>
                     <h2 className={`text-[18px] font-black ${ui.textMain} mb-5`}>오늘의 감사 QT (실습지)</h2>
                     
                     <div className="flex-1 flex flex-col gap-4">
                        {[
                           { id: 'fact', label: '① 오늘 일어난 사실 (팩트만)' },
                           { id: 'desire', label: '③ 내가 원하는 것은 무엇이었는가?' },
                           { id: 'interpretation', label: '④ 나는 이 사건을 어떻게 해석하고 있었는가?' },
                           { id: 'word', label: '⑤ 오늘 본문에서 발견한 말씀' },
                           { id: 'myself', label: '⑥ 말씀 앞에서 발견한 나의 모습' },
                           { id: 'repent', label: '⑦ 회개할 것은 무엇인가?' },
                           { id: 'thanks', label: '⑧ 감사할 이유는 무엇인가?' },
                           { id: 'action', label: '⑨ 오늘 실천할 한 가지' },
                           { id: 'prayer', label: '⑩ 오늘의 기도' },
                        ].map((f, i) => (
                           <React.Fragment key={f.id}>
                              {i === 1 && (
                                 <div className="flex flex-col gap-1.5 mb-2">
                                    <label className={`text-[13.5px] font-black ${ui.textMain}`}>② 내가 느낀 감정 (중복 체크)</label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                       {['화', '서운함', '두려움', '억울함', '질투', '불안', '감사', '기쁨'].map(em => {
                                          const isChecked = (qtPractice.emotion || []).includes(em);
                                          return (
                                             <button 
                                                key={em}
                                                onClick={() => {
                                                   const currentEmotions = qtPractice.emotion || [];
                                                   const newEmotions = isChecked 
                                                      ? currentEmotions.filter(e => e !== em)
                                                      : [...currentEmotions, em];
                                                   handleQt('emotion', newEmotions);
                                                }}
                                                className={`px-3 py-1.5 text-[12px] font-bold border rounded-lg transition-colors cursor-pointer ${isChecked ? 'bg-sky-500 text-white border-transparent' : `bg-transparent ${ui.textSub}${ui.border}`}`}
                                             >
                                                {em}
                                             </button>
                                          );
                                       })}
                                    </div>
                                 </div>
                              )}
                              <div className="flex flex-col gap-1.5">
                                 <label className={`text-[13.5px] font-black ${ui.textMain}`}>{f.label}</label>
                                 <textarea 
                                    value={qtPractice[f.id] || ''}
                                    onChange={(e) => handleQt(f.id, e.target.value)}
                                    className={`w-full p-3 text-[13px] font-medium leading-[1.6] resize-none h-16 outline-none transition-colors border rounded-xl ${ui.bgInput}`}
                                    placeholder="기록하십시오..."
                                 />
                              </div>
                           </React.Fragment>
                        ))}
                     </div>
                  </div>
               </div>

            </div>
          )}

          {/* TAB 4: 고난 해석 8단계 & 실습 + 릴스 변환 */}
          {activeTab === 'suffering' && (
            <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto pb-32">
               <div className="lg:col-span-5 flex flex-col gap-6">
                  <div className={`p-6 border ${ui.border} ${ui.bgPanel} rounded-2xl`}>
                     <span className={`text-[11px] font-bold ${ui.textSub} block mb-1 tracking-widest`}>PART 4. 실전 가이드</span>
                     <h2 className={`text-[18px] font-black ${ui.textMain} mb-5`}>고난을 말씀으로 해석하는 8단계</h2>
                     
                     <div className="flex flex-col gap-0 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                        {[
                          { step: '1. 사건', desc: '무슨 일이 일어났는가? (사실만 기록)' },
                          { step: '2. 감정', desc: '나는 무엇을 느끼는가?' },
                          { step: '3. 해석', desc: '나는 이 사건을 어떻게 해석하고 있는가?' },
                          { step: '4. 말씀', desc: '내 생각과 말씀은 같은가?' },
                          { step: '5. 나', desc: '내 죄, 내 욕심, 두려움, 집착, 우상, 비교 등 직면.' },
                          { step: '6. 회개', desc: '하나님, 이 사건에서 제가 돌이켜야 할 것은 무엇입니까?' },
                          { step: '7. 적용', desc: '반드시 행동으로 내려옵니다.' },
                          { step: '8. 공동체', desc: '혼자 끝내지 않고 공동체 안에서 회복 경험.' }
                        ].map((item, i) => (
                           <div key={i} className={`flex flex-col gap-1 p-3 border-b last:border-b-0 border-slate-200 dark:border-white/10 ${i%2===0 ? 'bg-transparent' : 'bg-black/5 dark:bg-white/5'}`}>
                              <span className={`text-[12.5px] font-black ${ui.textMain}`}>{item.step}</span>
                              <span className={`text-[12px] font-medium ${ui.textSub}`}>{item.desc}</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className={`p-6 border ${ui.border} ${ui.bgPanel} rounded-2xl`}>
                     <h2 className={`text-[16px] font-black ${ui.textMain} mb-4`}>고난 해석 체크리스트</h2>
                     <div className="flex flex-col gap-2">
                        {[
                           { k: 'a', t: 'A. 사건: 사실을 정확하게 기록했는가?' },
                           { k: 'b', t: 'B. 감정: 내 감정을 숨기지 않았는가?' },
                           { k: 'c', t: 'C. 해석: 내가 이 사건에 붙인 의미를 기록했는가?' },
                           { k: 'd', t: 'D. 말씀: 내 생각이 아니라 성경 본문을 먼저 확인했는가?' },
                           { k: 'e', t: 'E. 자기: 상대방 문제만 보지 않고 나 자신을 살폈는가?' },
                           { k: 'f', t: 'F. 회개: 내가 돌이킬 부분을 찾았는가?' },
                           { k: 'g', t: 'G. 적용: 실제 행동을 정했는가?' },
                           { k: 'h', t: 'H. 감사: 상황이 아니라 하나님을 바라보며 감사할 이유를 찾았는가?' },
                           { k: 'i', t: 'I. 공동체: 혼자 판단하지 않고 믿음의 공동체와 나누었는가?' },
                           { k: 'j', t: 'J. 순종: 말씀을 실제 생활에서 실행했는가?' }
                        ].map(item => (
                           <div key={item.k} className="flex items-start gap-3 cursor-pointer" onClick={() => toggleSufferCheck(item.k)}>
                              <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${sufferingChecklist[item.k] ? 'bg-sky-500 text-white border-transparent' : `bg-transparent ${ui.border}`}`}>
                                 {sufferingChecklist[item.k] && <IconCheck />}
                              </div>
                              <span className={`text-[13px] font-bold ${sufferingChecklist[item.k] ? ui.textSub : ui.textMain}`}>{item.t}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="lg:col-span-7 flex flex-col">
                  <div className={`p-6 border ${ui.border} ${ui.bgPanel} rounded-2xl h-full flex flex-col`}>
                     <div className="flex justify-between items-center mb-4">
                        <div>
                          <span className={`text-[11px] font-bold ${ui.textSub} block mb-0.5 tracking-widest`}>Interactive Workbook</span>
                          <h2 className={`text-[18px] font-black ${ui.textMain}`}>고난 해석 8단계 (실습지)</h2>
                        </div>

                        {/* 고난 해석 릴스 변환 버튼 */}
                        <button
                          onClick={() => handleExportToReels(sufferingPractice.interpretation || sufferingPractice.action, '고난 해석')}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:opacity-90 text-white font-black text-[11px] shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                          title="작성된 고난 해석과 적용을 릴스로 제작"
                        >
                          <IconSparkles /> 릴스 변환
                        </button>
                     </div>
                     
                     <div className="flex-1 flex flex-col gap-4">
                        {[
                           { id: 'event', label: '1단계. 사건 (사실만)' },
                           { id: 'emotion', label: '2단계. 감정 (숨김없이)' },
                           { id: 'interpretation', label: '3단계. 해석 (내 생각)' },
                           { id: 'word', label: '4단계. 말씀 (성경 본문)' },
                           { id: 'myself', label: '5단계. 나 (내 죄와 우상)' },
                           { id: 'repent', label: '6단계. 회개 (돌이킬 것)' },
                           { id: 'action', label: '7단계. 적용 (구체적 행동)' },
                           { id: 'community', label: '8단계. 공동체 (나눔 계획)' }
                        ].map((f) => (
                           <div key={f.id} className="flex flex-col gap-1.5">
                              <label className={`text-[13.5px] font-black ${ui.textMain}`}>{f.label}</label>
                              <textarea 
                                 value={sufferingPractice[f.id] || ''}
                                 onChange={(e) => handleSuffer(f.id, e.target.value)}
                                 className={`w-full p-3 text-[13px] font-medium leading-[1.6] resize-none h-16 outline-none transition-colors border rounded-xl ${ui.bgInput}`}
                                 placeholder="정직하게 기록하십시오..."
                              />
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

            </div>
          )}

          {/* TAB 5: 12주 훈련 커리큘럼 */}
          {activeTab === 'curriculum' && (
            <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto pb-32">
               <div className="lg:col-span-5 flex flex-col gap-6">
                  <div className={`p-6 border ${ui.border} ${ui.bgPanel} rounded-2xl`}>
                     <span className={`text-[11px] font-bold ${ui.textSub} block mb-1 tracking-widest`}>Master Curriculum</span>
                     <h2 className={`text-[18px] font-black ${ui.textMain} mb-5`}>감사와 고난 해석 12주 마스터 과정</h2>
                     
                     <div className="flex flex-col gap-0 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                        {[
                          { w: 1, title: '나는 왜 감사하지 못하는가?', desc: '감사에 대한 오해, 불평의 구조 파악' },
                          { w: 2, title: '말씀 앞에 나를 세우기', desc: 'QT 구조 이해 (관찰-묵상-적용-기도)' },
                          { w: 3, title: '사건과 해석을 분리하기', desc: '사건 ≠ 내가 붙인 의미' },
                          { w: 4, title: '감사의 근원을 찾기', desc: '환경, 사람 탓을 넘어 "하나님 때문에" 하는 감사' },
                          { w: 5, title: '고난은 무엇인가?', desc: '내 인생 고난 지도를 그리고 축복의 약재로 보기' },
                          { w: 6, title: '고난을 잘못 해석하고 있지는 않은가?', desc: '저주받았다 등 잘못된 해석 부수기' },
                          { w: 7, title: '고난 속에서 나를 발견하기', desc: '내게 보게 하시는 나의 모습 찾기' },
                          { w: 8, title: '회개와 적용', desc: '단순 후회가 아닌 구체적 수고 동반 (인정→회개→행동)' },
                          { w: 9, title: '고난을 공동체에서 나누기', desc: '어디까지 말해야 하는가, 자기 의를 내려놓는 법' },
                          { w: 10, title: '고난에서 말씀을 발견하다', desc: '성경 인물(요셉, 다윗, 욥, 바울) 연구' },
                          { w: 11, title: '내 고난을 간증으로 바꾸기', desc: '내가 얼마나 힘들었는가가 아니라 "하나님이 무엇을 하셨는가"' },
                          { w: 12, title: '감사하는 제자로 살아가기', desc: '묵상→자기발견→회개→순종→공동체 간증 패턴화' }
                        ].map((item, i) => (
                           <div key={item.w} className={`flex flex-col gap-1 p-3 border-b last:border-b-0 border-slate-200 dark:border-white/10 ${i%2===0 ? 'bg-transparent' : 'bg-black/5 dark:bg-white/5'}`}>
                              <span className={`text-[12.5px] font-black ${ui.textMain}`}>{item.w}주차. {item.title}</span>
                              <span className={`text-[12px] font-medium ${ui.textSub}`}>{item.desc}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="lg:col-span-7 flex flex-col">
                  <div className={`p-6 border ${ui.border} ${ui.bgPanel} rounded-2xl h-full flex flex-col gap-4`}>
                     <h2 className={`text-[18px] font-black ${ui.textMain} mb-1`}>주차별 훈련 일지 및 소논고</h2>
                     <p className={`text-[13px] font-medium ${ui.textSub} mb-2`}>해당 주차의 강의를 듣고 나의 삶에 적용한 내용을 진실되게 기록하십시오.</p>
                     
                     <div className="flex flex-col gap-4 overflow-y-auto hide-scrollbar flex-1 max-h-[700px] pr-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(w => (
                           <div key={w} className="flex flex-col gap-2">
                              <label className={`text-[13.5px] font-black ${ui.textMain}`}>{w}주차 소논고 / 결단</label>
                              <textarea 
                                 value={curriculumNotes[w] || ''}
                                 onChange={e => setCurriculumNotes(p => ({...p, [w]: e.target.value}))}
                                 className={`w-full p-4 text-[13px] font-medium leading-[1.6] resize-none h-24 outline-none transition-colors border rounded-xl ${ui.bgInput}`}
                                 placeholder={`${w}주차 훈련을 통해 깨달은 점과 적용을 기록하세요...`}
                              />
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

            </div>
          )}

        </div>
      </div>

      {/* 개별 감사 전송 모달 */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-sm rounded-[24px] border p-5 shadow-2xl backdrop-blur-2xl flex flex-col gap-3.5 ${isDark ? 'bg-[#1C1C1E]/95 border-white/20 text-white' : 'bg-white/95 border-slate-300 text-slate-900'}`}>
            <div className="flex justify-between items-center border-b pb-2.5 border-slate-200 dark:border-white/10">
              <span className="font-black text-[14.5px] flex items-center gap-1.5"><IconSend /> 감사 항목 전송</span>
              <button onClick={() => setShowSendModal(false)} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"><IconClose /></button>
            </div>
            <div className={`p-3 rounded-xl border text-[13px] font-medium leading-relaxed ${isDark ? 'bg-black/30 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              "{selectedThanksItem}"
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => handleSendToCell(selectedThanksItem)}
                className="w-full py-3 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[13px] font-black shadow-sm active:scale-98 transition-transform cursor-pointer"
              >
                🌱 내 목장 모임 [감사나눔]으로 전송
              </button>
              <button
                onClick={() => handleSendToSermon(selectedThanksItem)}
                className="w-full py-3 rounded-xl border border-slate-300 dark:border-white/20 bg-black/5 dark:bg-white/5 text-[13px] font-black active:scale-98 transition-transform cursor-pointer"
              >
                📖 주일 예배노트 [감사선포]로 전송
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
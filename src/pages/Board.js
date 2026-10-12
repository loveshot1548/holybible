// src/pages/Board.js
import React, { useState, useCallback, useMemo } from 'react';

// =====================================================================
// 🔐 [양방향 암호화 유틸리티] 공동체 게시판 데이터 암호화 (100% 보존)
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
// 🎨 모던 시스템 라인 아이콘 (2px stroke)
// =====================================================================
const StrokeW = "1.8";
const IconHeart = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>;
const IconPray = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>;
const IconUser = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const IconTarget = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const IconSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconUsers = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;

export default function Board({
  t,
  isDarkMode,
  setActiveScreen,
  isSidebarOpen,
  setIsSidebarOpen,
  SubPageHeader,
  mLocal = {},
  setMLocal,
  authUser = {},
  boardPosts = [],
  setBoardPosts,
  newPostText,
  setNewPostText,
  isLoadingPosts,
  supabase,
  fetchPosts,
  getArr
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  }, []);

  if (!SubPageHeader) return <div className="p-4 font-bold text-[#F87171] text-sm">App.js에서 SubPageHeader가 넘어오지 않았습니다!</div>;

  const currentBoardTab = mLocal?.boardTab || 'thanks';
  const setBoardTab = (tab) => setMLocal && setMLocal({ ...mLocal, boardTab: tab });

  const parsePostData = useCallback((content) => {
    try {
      const dec = decryptField(content);
      return JSON.parse(dec);
    } catch (e) {
      try { 
        return JSON.parse(content); 
      } catch (err) { 
        return { text: content, author: '익명', likes: 0, status: 'praying' }; 
      }
    }
  }, []);

  const handleAction = async (post, actionType, newText = '') => {
    try {
      let parsed = parsePostData(post.content);
      if (actionType === 'amen') parsed.likes = (parsed.likes || 0) + 1;
      if (actionType === 'answer') parsed.status = 'answered';
      if (actionType === 'edit') parsed.text = newText;
      
      const encryptedContent = encryptField(JSON.stringify(parsed));
      if (supabase) await supabase.from('test_board').update({ content: encryptedContent }).eq('id', post.id);
      if (setBoardPosts) {
        setBoardPosts(posts => (getArr ? getArr(posts) : []).map(p => p.id === post.id ? { ...p, content: encryptedContent } : p));
      }

      if (actionType === 'amen') {
        showToast(parsed.type === 'thanks' ? "할렐루야! 감사의 고백에 동참했습니다." : "아멘! 지체를 위해 함께 기도했습니다.");
      }
    } catch (e) {
      showToast("처리 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("정말 이 글을 삭제하시겠습니까?")) return;
    if (supabase) {
      const { error } = await supabase.from('test_board').delete().eq('id', postId);
      if (!error && fetchPosts) {
        fetchPosts();
        showToast("게시글이 삭제되었습니다.");
      }
    }
  };

  // 🌟 [유기적 연동 1] 게시글의 기도를 내 골방 기도함(PrayerBox)으로 담아가기
  const handleImportToMyPrayerBox = (postData) => {
    try {
      const prayers = JSON.parse(localStorage.getItem('goodtree_global_prayers') || localStorage.getItem('globalPrayers') || '[]');
      const newPrayer = {
        id: Date.now(),
        text: `[공동체 중보: ${postData.author}] ${postData.text}`,
        status: 'praying',
        date: new Date().toISOString().split('T')[0]
      };
      localStorage.setItem('goodtree_global_prayers', JSON.stringify([newPrayer, ...prayers]));
      localStorage.setItem('globalPrayers', JSON.stringify([newPrayer, ...prayers]));
      window.dispatchEvent(new Event('storage'));
      showToast(`🙏 [${postData.author}] 님의 기도제목이 나의 골방 기도함에 담겼습니다!`);
    } catch {
      showToast("기도함 담기 중 오류가 발생했습니다.");
    }
  };

  // 🌟 [유기적 연동 2] 게시글을 삶의 실천 트래커(ApplyTracker) 순종 과제로 등록
  const handleExportToApplyTracker = (postData) => {
    try {
      const items = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      const newItem = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        text: `[공동체 나눔 실천: ${postData.author}] ${postData.text}`,
        category: '가정과 관계',
        source: 'community_board',
        completed: false
      };
      localStorage.setItem('apply_tracker_items', JSON.stringify([newItem, ...items]));
      window.dispatchEvent(new Event('storage'));
      showToast("⚡ 삶의 실천 트래커에 순종 과제로 등록되었습니다!");
    } catch {
      showToast("실천 과제 등록 중 오류가 발생했습니다.");
    }
  };

  // 🌟 [유기적 연동 3] 게시글의 감사를 내 감사 일기장(Diary)으로 스크랩
  const handleImportToMyDiary = (postData) => {
    try {
      const diaries = JSON.parse(localStorage.getItem('goodtree_diary_entries') || '[]');
      diaries.push({
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        content: encryptField(`[공동체 은혜 나눔 스크랩: ${postData.author}]\n"${postData.text}"\n\n지체의 감사 고백을 통해 우리 공동체에 동일한 은혜를 주신 주님을 찬양합니다.`)
      });
      localStorage.setItem('goodtree_diary_entries', JSON.stringify(diaries));
      window.dispatchEvent(new Event('storage'));
      showToast("📖 감사/간증 일기장에 안전하게 스크랩되었습니다!");
    } catch {
      showToast("일기장 스크랩 중 오류가 발생했습니다.");
    }
  };

  // 🌟 [유기적 연동 4] 응답된 기도를 감사 일기장 간증문으로 봉헌
  const handleAnswerPrayerWithDiary = async (post) => {
    if (!window.confirm("기도가 응답되었나요? 응답 리스트로 이동하며 감사 고백으로 기록됩니다.")) return;
    
    await handleAction(post, 'answer');
    const data = parsePostData(post.content);

    try {
      const diaries = JSON.parse(localStorage.getItem('goodtree_diary_entries') || '[]');
      diaries.push({
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        content: encryptField(`[공동체 기도 응답 감사: ${data.author}]\n기도제목: "${data.text}"\n\n주님께서 공동체의 부르짖음을 들으시고 신실하게 응답하셨습니다!`)
      });
      localStorage.setItem('goodtree_diary_entries', JSON.stringify(diaries));
      window.dispatchEvent(new Event('storage'));
      showToast("🏆 응답받은 기도가 감사 일기장으로 이관되었습니다!");
    } catch {}
  };

  const validPosts = getArr ? getArr(boardPosts) : [];

  // 4대 거버넌스 벤토 통계
  const stats = useMemo(() => {
    let thanksCount = 0;
    let prayerCount = 0;
    let answeredCount = 0;
    let totalResonance = 0;

    validPosts.forEach(p => {
      const data = parsePostData(p.content);
      totalResonance += (data.likes || 0);
      if (data.type === 'thanks') {
        thanksCount++;
      } else if (data.type === 'prayer') {
        if (data.status === 'answered') answeredCount++;
        else prayerCount++;
      }
    });

    return { thanksCount, prayerCount, answeredCount, totalResonance };
  }, [validPosts, parsePostData]);

  // 검색 및 탭 필터링
  const filteredPosts = useMemo(() => {
    return validPosts.filter(p => {
      const data = parsePostData(p.content);
      const matchesTab = data.type === currentBoardTab;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || data.text?.toLowerCase().includes(term) || data.author?.toLowerCase().includes(term);
      return matchesTab && matchesSearch;
    });
  }, [validPosts, currentBoardTab, searchTerm, parsePostData]);

  const activePrayers = useMemo(() => {
    return filteredPosts.filter(p => {
      const data = parsePostData(p.content);
      return data.status !== 'answered';
    });
  }, [filteredPosts, parsePostData]);

  const answeredPrayers = useMemo(() => {
    return filteredPosts.filter(p => {
      const data = parsePostData(p.content);
      return data.status === 'answered';
    });
  }, [filteredPosts, parsePostData]);

  // 🌟 구문 오류 해결: 복잡한 JSX 삼항 연산자를 JS 계층에서 명확히 분기
  const displayPosts = useMemo(() => {
    return currentBoardTab === 'thanks' ? filteredPosts : activePrayers;
  }, [currentBoardTab, filteredPosts, activePrayers]);

  const isDark = Boolean(t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode);
  const bgBody = isDark ? 'bg-[#0B0D12]' : 'bg-[#F6F8FB]';
  const textMain = isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]';
  const textSub = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';
  
  const glassCard = isDark 
    ? 'bg-[#131620]/90 border border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-xl' 
    : 'bg-white border border-slate-200/80 shadow-[0_2px_12px_rgba(15,23,42,0.04)] backdrop-blur-xl';
  const inputBg = isDark 
    ? 'bg-black/35 border-white/10 text-[#F8FAFC] focus:border-[#38BDF8] outline-none placeholder:text-[#475569]' 
    : 'bg-slate-50/70 border-slate-200 text-[#0F172A] focus:border-[#0284C7] focus:bg-white outline-none placeholder:text-[#94A3B8]';

  return (
    <div className={`flex-1 flex flex-col h-full ${bgBody} animate-fade-in-up relative font-sans overflow-hidden select-none text-left`}>
      
      {/* 상단 플로팅 토스트 피드백 */}
      {toastMsg && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[300] px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-slate-900/95 text-white text-[11px] sm:text-[12px] font-bold border border-white/20 shadow-xl backdrop-blur-md flex items-center gap-1.5 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
          {toastMsg}
        </div>
      )}

      {/* S-Curve 레이어 배경 */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
          <svg className="absolute top-0 left-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path d="M0,0 L100,0 L100,35 C75,55 25,15 0,40 Z" className={`transition-colors duration-700 ${isDarkMode ? 'fill-[#17223B]' : 'fill-[#EBF3F8]'}`} />
            <path d="M0,40 C25,15 75,55 100,35 L100,65 C60,85 30,45 0,70 Z" className={`transition-colors duration-700 ${isDarkMode ? 'fill-[#101828]' : 'fill-[#F0F6F9]'}`} />
            <path d="M0,70 C30,45 60,85 100,65 L100,100 L0,100 Z" className={`transition-colors duration-700 ${isDarkMode ? 'fill-[#0B1120]' : 'fill-[#F4F7FB]'}`} />
          </svg>
      </div>

      {/* 상단 서브 헤더 */}
      <div className="relative z-10 shrink-0">
        <SubPageHeader 
          title="함께하는 감사/기도" 
          onBack={() => setActiveScreen ? setActiveScreen('home') : null} 
          t={t} 
          toggleSidebar={() => setIsSidebarOpen && setIsSidebarOpen(!isSidebarOpen)} 
        />
      </div>

      {/* 전방위 유기적 점프 통로 바 (모바일 가로 마진 및 패딩 컴팩트 조율) */}
      <div className={`px-2.5 sm:px-6 py-1.5 sm:py-2 border-b shrink-0 flex items-center justify-between z-20 backdrop-blur-md ${
        isDark ? 'border-white/[0.08] bg-[#10131B]/95' : 'border-slate-200 bg-white/95'
      }`}>
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto hide-scrollbar py-0.5">
          <button
            onClick={() => setActiveScreen ? setActiveScreen('qt') : null}
            className={`px-2 py-1 rounded-md text-[10.5px] sm:text-[11px] font-bold border ${isDark ? 'border-slate-700 bg-slate-800/80 text-gray-300' : 'border-slate-200 bg-slate-100 text-slate-700'} flex items-center gap-1 cursor-pointer shrink-0`}
          >
            <IconBook /> QT
          </button>
          <button
            onClick={() => setActiveScreen ? setActiveScreen('sermon') : null}
            className={`px-2 py-1 rounded-md text-[10.5px] sm:text-[11px] font-bold border ${isDark ? 'border-slate-700 bg-slate-800/80 text-gray-300' : 'border-slate-200 bg-slate-100 text-slate-700'} flex items-center gap-1 cursor-pointer shrink-0`}
          >
            <span>🏛️</span> 설교
          </button>
          <button
            onClick={() => setActiveScreen ? setActiveScreen('apply') : null}
            className={`px-2 py-1 rounded-md text-[10.5px] sm:text-[11px] font-bold border ${isDark ? 'border-slate-700 bg-slate-800/80 text-gray-300' : 'border-slate-200 bg-slate-100 text-slate-700'} flex items-center gap-1 cursor-pointer shrink-0`}
          >
            <IconTarget /> 실천
          </button>
          <button
            onClick={() => setActiveScreen ? setActiveScreen('prayer') : null}
            className={`px-2 py-1 rounded-md text-[10.5px] sm:text-[11px] font-bold border ${isDark ? 'border-slate-700 bg-slate-800/80 text-gray-300' : 'border-slate-200 bg-slate-100 text-slate-700'} flex items-center gap-1 cursor-pointer shrink-0`}
          >
            <IconPray /> 기도
          </button>
          <button
            onClick={() => setActiveScreen ? setActiveScreen('diary') : null}
            className={`px-2 py-1 rounded-md text-[10.5px] sm:text-[11px] font-bold border ${isDark ? 'border-slate-700 bg-slate-800/80 text-gray-300' : 'border-slate-200 bg-slate-100 text-slate-700'} flex items-center gap-1 cursor-pointer shrink-0`}
          >
            <span>📖</span> 일기
          </button>
          <button
            onClick={() => setActiveScreen ? setActiveScreen('cell') : null}
            className={`px-2 py-1 rounded-md text-[10.5px] sm:text-[11px] font-bold border ${isDark ? 'border-slate-700 bg-slate-800/80 text-gray-300' : 'border-slate-200 bg-slate-100 text-slate-700'} flex items-center gap-1 cursor-pointer shrink-0`}
          >
            <IconUsers /> 목장
          </button>
        </div>

        {/* 검색창 */}
        <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border text-xs shrink-0 ml-1.5 ${isDark ? 'border-white/10 bg-black/25 text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}>
          <IconSearch />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="성도, 키워드..."
            className="bg-transparent outline-none text-[11px] sm:text-xs w-20 sm:w-36 placeholder:text-slate-400"
          />
        </div>
      </div>
      
      {/* 2대 탭 바 */}
      <div className={`flex ${isDark ? 'bg-[#10131B]/95 border-white/[0.08]' : 'bg-white/95 border-slate-200'} border-b shrink-0 px-2 sm:px-6 pt-1 relative z-10 backdrop-blur-md`}>
          <button 
            onClick={() => setBoardTab('thanks')} 
            className={`flex-1 pb-2.5 sm:pb-3 text-[12.5px] sm:text-[14px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              currentBoardTab === 'thanks' 
                ? `${isDark ? 'text-sky-400 border-sky-400' : 'text-sky-600 border-sky-600'} border-b-2 font-black` 
                : textSub
            }`}
          >
            <IconHeart /> 함께하는 감사
          </button>
          <button 
            onClick={() => setBoardTab('prayer')} 
            className={`flex-1 pb-2.5 sm:pb-3 text-[12.5px] sm:text-[14px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              currentBoardTab === 'prayer' 
                ? `${isDark ? 'text-sky-400 border-sky-400' : 'text-sky-600 border-sky-600'} border-b-2 font-black` 
                : textSub
            }`}
          >
            <IconPray /> 오늘 필요한 기도
          </button>
      </div>
      
      {/* 메인 콘텐츠 리스트 영역 (모바일 상하 여백 최적화) */}
      <div className="flex-1 overflow-y-auto px-2.5 sm:px-6 md:px-10 pb-16 sm:pb-28 space-y-3 sm:space-y-4.5 relative z-10 w-full max-w-4xl mx-auto hide-scrollbar pt-2.5 sm:pt-4">
        
        {/* 4대 공동체 거버넌스 벤토 통계 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2.5">
          <div className={`${glassCard} p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex flex-col justify-between`}>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tight">SHARED THANKS</span>
            <div className="flex items-baseline gap-1 mt-0.5 sm:mt-1">
              <span className="text-lg sm:text-xl font-black text-rose-500 font-mono">{stats.thanksCount}</span>
              <span className="text-[10.5px] sm:text-[11px] font-bold text-slate-400">건 나눔</span>
            </div>
          </div>

          <div className={`${glassCard} p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex flex-col justify-between`}>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tight">ACTIVE PRAYERS</span>
            <div className="flex items-baseline gap-1 mt-0.5 sm:mt-1">
              <span className="text-lg sm:text-xl font-black text-sky-500 font-mono">{stats.prayerCount}</span>
              <span className="text-[10.5px] sm:text-[11px] font-bold text-slate-400">건 중보 중</span>
            </div>
          </div>

          <div className={`${glassCard} p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex flex-col justify-between`}>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tight">ANSWERED</span>
            <div className="flex items-baseline gap-1 mt-0.5 sm:mt-1">
              <span className="text-lg sm:text-xl font-black text-emerald-500 font-mono">{stats.answeredCount}</span>
              <span className="text-[10.5px] sm:text-[11px] font-bold text-slate-400">건 응답</span>
            </div>
          </div>

          <div className={`${glassCard} p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex flex-col justify-between`}>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tight">AMEN RESONANCE</span>
            <div className="flex items-baseline gap-1 mt-0.5 sm:mt-1">
              <span className="text-lg sm:text-xl font-black text-amber-500 font-mono">{stats.totalResonance}</span>
              <span className="text-[10.5px] sm:text-[11px] font-bold text-slate-400">회 동참</span>
            </div>
          </div>
        </div>

        {/* 새 글 작성 카드 */}
        <div className={`${glassCard} p-3.5 sm:p-5 rounded-2xl sm:rounded-[24px]`}>
           <textarea 
             value={newPostText || ''} 
             onChange={e => setNewPostText && setNewPostText(e.target.value)} 
             className={`w-full p-3 sm:p-4 rounded-xl sm:rounded-[16px] ${inputBg} border transition-colors resize-none h-20 sm:h-24 text-[13px] sm:text-[13.5px] leading-[1.6] shadow-inner`} 
             placeholder={currentBoardTab === 'thanks' ? "우리 모두가 함께 감사할 수 있도록 은혜를 적어주세요..." : "우리 모두가 함께 기도할 수 있도록 기도제목을 나누어주세요..."} 
           />
           <button 
             onClick={async () => {
               if (!supabase) return alert("Supabase 연결 설정이 필요합니다."); 
               if (!newPostText || !newPostText.trim()) return alert("내용을 입력해주세요."); 
               const rawPayload = JSON.stringify({ type: currentBoardTab, text: newPostText.trim(), likes: 0, author: authUser?.name || '익명', status: 'praying' });
               const { error } = await supabase.from('test_board').insert([{ content: encryptField(rawPayload) }]); 
               if (error) alert("오류 발생: " + error.message); 
               else { 
                 if(setNewPostText) setNewPostText(''); 
                 if(fetchPosts) fetchPosts(); 
                 showToast("게시글이 공동체에 등록되었습니다!");
               } 
             }} 
             className="w-full mt-2.5 sm:mt-3 h-10 sm:h-12 font-black rounded-xl sm:rounded-[16px] transition-transform active:scale-[0.98] text-[13px] sm:text-[13.5px] cursor-pointer bg-sky-500 hover:bg-sky-600 text-white shadow-sm"
           >
             등록하기
           </button>
        </div>
        
        {/* 게시글 리스트 (구문 오류 완전 소멸 & 단일 클린 루프) */}
        <div className="space-y-2.5 sm:space-y-4">
          {isLoadingPosts ? (
            <div className={`text-center py-8 text-[13px] font-medium ${textSub}`}>불러오는 중...</div>
          ) : displayPosts.length === 0 ? (
            <div className={`text-center py-8 text-[13px] font-medium ${textSub}`}>아직 등록된 글이 없습니다.</div>
          ) : (
            displayPosts.map(post => {
              const data = parsePostData(post.content);
              const isAuthor = data.author === authUser?.name;
              const isAdmin = authUser?.role === 'admin' || authUser?.role === '관리자' || authUser?.role === '운영자';
              const canEditOrDelete = isAuthor || isAdmin;

              if (currentBoardTab === 'thanks') {
                return (
                  <div key={post.id} className={`${glassCard} p-3.5 sm:p-5 rounded-2xl sm:rounded-[24px] space-y-2.5 sm:space-y-3`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-[12px] sm:text-[12.5px] font-bold ${textMain} flex items-center gap-1.5`}>
                        <IconUser /> {data.author}
                      </span>
                      <span className={`text-[10px] sm:text-[10.5px] font-medium ${textSub}`}>
                        {new Date(post.created_at).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className={`text-[13px] sm:text-[13.5px] ${textMain} leading-[1.7] whitespace-pre-wrap break-keep`}>{data.text}</p>

                    <div className={`flex flex-wrap justify-between items-center border-t ${isDark ? 'border-white/[0.08]' : 'border-slate-100'} pt-2.5 sm:pt-3 gap-1.5 sm:gap-2`}>
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          onClick={() => handleImportToMyDiary(data)}
                          className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[10.5px] font-bold border ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'} flex items-center gap-1 cursor-pointer`}
                          title="내 감사 일기장에 스크랩"
                        >
                          <IconBook /> 내 일기로 담기
                        </button>

                        <button
                          onClick={() => handleExportToApplyTracker(data)}
                          className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[10.5px] font-bold border ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'} flex items-center gap-1 cursor-pointer`}
                          title="삶의 실천 과제로 결단"
                        >
                          <IconTarget /> 실천 결단
                        </button>

                        {canEditOrDelete && (
                          <>
                            <button onClick={() => { const edited = window.prompt("수정:", data.text); if (edited) handleAction(post, 'edit', edited); }} className={`text-[10px] sm:text-[10.5px] font-semibold ${textSub} px-1.5 py-1 hover:${textMain} cursor-pointer`}>수정</button>
                            <button onClick={() => handleDelete(post.id)} className="text-[10px] sm:text-[10.5px] font-semibold text-rose-500 px-1.5 py-1 hover:text-rose-600 cursor-pointer">삭제</button>
                          </>
                        )}
                      </div>

                      <button 
                        onClick={() => handleAction(post, 'amen')} 
                        className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-[12px] font-bold cursor-pointer transition-colors ${
                          isDark ? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                        }`}
                      >
                        <IconHeart /> 할렐루야 <span className={`px-1.5 py-0.2 rounded-md ${isDark ? 'bg-black/30' : 'bg-white/90'}`}>{data.likes || 0}</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={post.id} className="flex relative shadow-xs rounded-2xl sm:rounded-[24px] overflow-hidden">
                  <div className={`flex-1 ${glassCard} p-3.5 sm:p-5 flex flex-col justify-between ${!canEditOrDelete ? 'rounded-r-2xl sm:rounded-r-[24px]' : 'rounded-l-2xl sm:rounded-l-[24px]'}`}>
                    <div>
                      <div className="flex justify-between items-center mb-2 sm:mb-2.5">
                        <span className={`text-[12px] sm:text-[12.5px] font-bold ${textMain} flex items-center gap-1.5`}>
                          <IconUser /> {data.author}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {canEditOrDelete && (
                            <>
                              <button onClick={() => { const edited = window.prompt("기도제목 수정:", data.text); if (edited) handleAction(post, 'edit', edited); }} className={`text-[10px] sm:text-[11px] font-semibold ${textSub} px-1 py-0.5 hover:${textMain} transition-colors cursor-pointer`}>수정</button>
                              <button onClick={() => handleDelete(post.id)} className="text-[10px] sm:text-[11px] font-semibold text-rose-500 px-1 py-0.5 hover:text-rose-600 transition-colors cursor-pointer">삭제</button>
                            </>
                          )}
                          <span className={`text-[10px] sm:text-[10.5px] font-medium ${textSub}`}>
                            {new Date(post.created_at).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      <p className={`text-[13px] sm:text-[13.5px] ${textMain} leading-[1.7] whitespace-pre-wrap mb-3 sm:mb-4 break-keep`}>{data.text}</p>
                    </div>

                    <div className="flex flex-wrap justify-between items-center border-t border-slate-100 dark:border-white/[0.06] pt-2.5 sm:pt-3 gap-1.5 sm:gap-2">
                      <div className="flex items-center gap-1 flex-wrap">
                        <button 
                          onClick={() => handleAction(post, 'amen')} 
                          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-[12px] font-bold cursor-pointer transition-colors ${
                            isDark ? 'bg-sky-500/15 text-sky-400 hover:bg-sky-500/25' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'
                          }`}
                        >
                          <IconPray /> 기도합니다 <span className={`px-1.5 py-0.2 rounded-md ${isDark ? 'bg-black/30' : 'bg-white/90'}`}>{data.likes || 0}</span>
                        </button>

                        <button
                          onClick={() => handleImportToMyPrayerBox(data)}
                          className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[10.5px] font-bold border ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'} flex items-center gap-1 cursor-pointer`}
                          title="내 골방 기도함에 담기"
                        >
                          <span>🙏</span> 내 기도함
                        </button>

                        <button
                          onClick={() => handleExportToApplyTracker(data)}
                          className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[10.5px] font-bold border ${isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'} flex items-center gap-1 cursor-pointer`}
                          title="삶의 실천 과제로 결단"
                        >
                          <IconTarget /> 실천 결단
                        </button>
                      </div>
                    </div>
                  </div>

                  {canEditOrDelete && (
                    <button 
                      onClick={() => handleAnswerPrayerWithDiary(post)} 
                      className={`w-10 sm:w-14 cursor-pointer ${isDark ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-700' : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600'} text-white flex flex-col items-center justify-center text-[11px] sm:text-[13px] font-bold leading-tight transition-colors active:scale-95 border-y border-r`}
                      title="기도 응답 감사 확정"
                    >
                      <span>응</span><span className="mt-0.5 sm:mt-1">답</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
        
        {/* 주님이 응답하신 기도 섹션 */}
        {currentBoardTab === 'prayer' && answeredPrayers.length > 0 && (
          <div className={`mt-5 sm:mt-8 pt-4 sm:pt-5 border-t border-dashed ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <div className="flex justify-between items-center mb-2.5 px-0.5">
                <h4 className={`text-[12px] sm:text-[13px] font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'} flex items-center gap-1.5`}>
                  <IconCheck/> 주님이 응답하신 기도 ({answeredPrayers.length}건)
                </h4>
                <span className="text-[10px] sm:text-[10.5px] font-mono text-slate-400">모든 영광을 주님께!</span>
              </div>

              <div className="space-y-2 sm:space-y-2.5">
                  {answeredPrayers.map(post => {
                      const data = parsePostData(post.content);
                      return (
                          <div key={post.id} className={`${isDark ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50/80 border-emerald-200'} p-3 sm:p-4 rounded-xl sm:rounded-[20px] border flex justify-between items-center shadow-xs`}>
                             <div className="space-y-0.5 min-w-0 pr-2">
                               <div className="flex items-center gap-1.5 mb-0.5">
                                 <span className={`text-[10.5px] sm:text-[11px] font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'} flex items-center gap-1`}><IconUser/> {data.author}</span>
                                 <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono font-bold">응답 완료 🏆</span>
                               </div>
                               <p className={`text-[11.5px] sm:text-[12.5px] font-medium ${isDark ? 'text-emerald-300/80' : 'text-emerald-800'} line-through opacity-80 break-keep truncate`}>{data.text}</p>
                             </div>
                             
                             <div className="flex items-center gap-1 shrink-0">
                               <button
                                 onClick={() => handleImportToMyDiary(data)}
                                 className="px-2 py-1 rounded-md text-[9.5px] sm:text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 cursor-pointer"
                                 title="내 감사 일기장으로 스크랩"
                               >
                                 간증 스크랩
                               </button>

                               {(data.author === authUser?.name || authUser?.role === 'admin' || authUser?.role === '관리자') && (
                                 <button onClick={() => handleDelete(post.id)} className="text-[10px] sm:text-[10.5px] font-semibold text-rose-500 hover:text-rose-600 px-1.5 py-1 cursor-pointer">삭제</button>
                               )}
                             </div>
                          </div>
                      );
                  })}
              </div>
          </div>
        )}
      </div>
    </div>
  );
}
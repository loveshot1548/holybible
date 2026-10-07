import React, { useCallback, useMemo } from 'react';

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

// 모던 라인 아이콘 (2px stroke)
const IconHeart = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>;
const IconPray = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>;
const IconUser = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;

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

  if (!SubPageHeader) return <div className="p-4 font-bold text-[#F87171] text-sm">App.js에서 SubPageHeader가 넘어오지 않았습니다!</div>;

  const currentBoardTab = mLocal?.boardTab || 'thanks';
  const setBoardTab = (tab) => setMLocal && setMLocal({...mLocal, boardTab: tab});

  const parsePostData = useCallback((content) => {
    try {
      const dec = decryptField(content);
      return JSON.parse(dec);
    } catch(e) {
      try { return JSON.parse(content); } catch(err) { return { text: content, author: '익명', likes: 0, status: 'praying' }; }
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
        if (setBoardPosts) setBoardPosts(posts => (getArr ? getArr(posts) : []).map(p => p.id === post.id ? {...p, content: encryptedContent} : p));
     } catch(e) {}
  };

  const handleDelete = async (postId) => {
     if (!window.confirm("정말 이 글을 삭제하시겠습니까?")) return;
     if (supabase) {
         const { error } = await supabase.from('test_board').delete().eq('id', postId);
         if (!error && fetchPosts) fetchPosts();
     }
  };

  const validPosts = getArr ? getArr(boardPosts) : [];
  
  const filteredPosts = useMemo(() => {
    return validPosts.filter(p => {
      const data = parsePostData(p.content);
      return data.type === currentBoardTab;
    });
  }, [validPosts, currentBoardTab, parsePostData]);

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

  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;
  const bgBody = isDark ? 'bg-[#0F1115]' : 'bg-[#F4F7FB]';
  const textMain = isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]';
  const textSub = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';
  
  const glassCard = isDark 
    ? 'bg-[#181A20]/80 border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)] backdrop-blur-xl' 
    : 'bg-white/95 border border-[#E2E8F0] shadow-[0_4px_15px_rgba(149,157,165,0.08)] backdrop-blur-xl';
  const inputBg = isDark 
    ? 'bg-black/30 border-white/10 text-[#F8FAFC] focus:border-[#38BDF8] outline-none placeholder:text-[#475569]' 
    : 'bg-white border-[#E2E8F0] text-[#0F172A] focus:border-[#38BDF8] outline-none placeholder:text-[#94A3B8]';

  return (
    <div className={`flex-1 flex flex-col h-full ${bgBody} animate-fade-in-up relative font-sans overflow-hidden`}>
      
      {/* S-Curve 레이어 배경 */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-40">
          <svg className="absolute top-0 left-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path d="M0,0 L100,0 L100,35 C75,55 25,15 0,40 Z" className={`transition-colors duration-700 ${isDarkMode ? 'fill-[#17223B]' : 'fill-[#EBF3F8]'}`} />
            <path d="M0,40 C25,15 75,55 100,35 L100,65 C60,85 30,45 0,70 Z" className={`transition-colors duration-700 ${isDarkMode ? 'fill-[#101828]' : 'fill-[#F0F6F9]'}`} />
            <path d="M0,70 C30,45 60,85 100,65 L100,100 L0,100 Z" className={`transition-colors duration-700 ${isDarkMode ? 'fill-[#0B1120]' : 'fill-[#F4F7FB]'}`} />
          </svg>
      </div>

      <div className="relative z-10"><SubPageHeader title="함께하는 감사/기도" onBack={() => setActiveScreen('home')} t={t} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} /></div>
      
      <div className={`flex ${isDark ? 'bg-[#181A20]/90 border-white/10' : 'bg-white/90 border-[#E2E8F0]'} border-b shrink-0 px-2 sm:px-6 pt-1.5 shadow-xs relative z-10 backdrop-blur-md`}>
          <button onClick={() => setBoardTab('thanks')} className={`flex-1 pb-3 text-[13px] sm:text-[14px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${currentBoardTab==='thanks' ? `${isDark ? 'text-[#38BDF8] border-[#38BDF8]' : 'text-[#0284C7] border-[#0284C7]'} border-b-2 font-black` : textSub}`}><IconHeart /> 함께하는 감사</button>
          <button onClick={() => setBoardTab('prayer')} className={`flex-1 pb-3 text-[13px] sm:text-[14px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${currentBoardTab==='prayer' ? `${isDark ? 'text-[#38BDF8] border-[#38BDF8]' : 'text-[#0284C7] border-[#0284C7]'} border-b-2 font-black` : textSub}`}><IconPray /> 오늘 필요한 기도</button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-10 pb-24 space-y-4 sm:space-y-5 relative z-10 w-full max-w-4xl mx-auto hide-scrollbar pt-4">
        <div className={`${glassCard} p-4 sm:p-5 rounded-[24px]`}>
           <textarea value={newPostText || ''} onChange={e=>setNewPostText && setNewPostText(e.target.value)} className={`w-full p-3.5 sm:p-4 rounded-[16px] ${inputBg} border transition-colors resize-none h-24 text-[13px] sm:text-[13.5px] leading-[1.6] shadow-inner`} placeholder={currentBoardTab==='thanks' ? "우리 모두가 함께 감사할 수 있도록 적어주세요..." : "우리 모두가 함께 기도할 수 있도록 적어주세요..."} />
           <button onClick={async () => {
               if (!supabase) return alert("Supabase 연결 설정이 필요합니다."); 
               if (!newPostText || !newPostText.trim()) return alert("내용을 입력해주세요."); 
               const rawPayload = JSON.stringify({ type: currentBoardTab, text: newPostText.trim(), likes: 0, author: authUser?.name || '익명', status: 'praying' });
               const { error } = await supabase.from('test_board').insert([{ content: encryptField(rawPayload) }]); 
               if (error) alert("오류 발생: " + error.message); 
               else { if(setNewPostText) setNewPostText(''); if(fetchPosts) fetchPosts(); } 
           }} className={`w-full mt-3 h-11 sm:h-12 font-black rounded-[16px] transition-transform active:scale-[0.98] text-[13px] sm:text-[13.5px] cursor-pointer ${isDark ? 'bg-sky-500 hover:bg-sky-600 text-white' : 'bg-sky-500 hover:bg-sky-600 text-white'} shadow-md`}>등록하기</button>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          {isLoadingPosts ? <div className={`text-center py-10 text-[13px] font-medium ${textSub}`}>불러오는 중...</div> :
           (currentBoardTab === 'thanks' ? filteredPosts : activePrayers).length === 0 ? <div className={`text-center py-10 text-[13px] font-medium ${textSub}`}>아직 등록된 글이 없습니다.</div> :
           (currentBoardTab === 'thanks' ? filteredPosts : activePrayers).map(post => {
            const data = parsePostData(post.content);
            
            const isAuthor = data.author === authUser?.name;
            const isAdmin = authUser?.role === 'admin' || authUser?.role === '관리자' || authUser?.role === '운영자';
            const canEditOrDelete = isAuthor || isAdmin; 

            return currentBoardTab === 'thanks' ? (
             <div key={post.id} className={`${glassCard} p-4 sm:p-5 rounded-[24px]`}>
                <div className="flex justify-between items-center mb-2.5"><span className={`text-[12px] sm:text-[12.5px] font-bold ${textMain} flex items-center gap-1.5`}><IconUser/> {data.author}</span><span className={`text-[10px] sm:text-[10.5px] font-medium ${textSub}`}>{new Date(post.created_at).toLocaleString()}</span></div>
                <p className={`text-[13px] sm:text-[13.5px] ${textMain} leading-[1.7] whitespace-pre-wrap mb-4`}>{data.text}</p>
                <div className={`flex justify-between items-center border-t ${isDark ? 'border-white/10' : 'border-[#E2E8F0]'} pt-3`}>
                    
                    <div className="flex gap-2">
                      {canEditOrDelete && (
                        <>
                          <button onClick={() => { const edited = window.prompt("수정:", data.text); if (edited) handleAction(post, 'edit', edited); }} className={`text-[10.5px] sm:text-[11px] font-semibold ${textSub} px-2 py-1 hover:${textMain} transition-colors cursor-pointer`}>수정</button>
                          <button onClick={() => handleDelete(post.id)} className={`text-[10.5px] sm:text-[11px] font-semibold text-[#F43F5E] px-2 py-1 hover:text-[#E11D48] transition-colors cursor-pointer`}>삭제</button>
                        </>
                      )}
                    </div>
                    
                    <button onClick={() => handleAction(post, 'amen')} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[12px] text-[11px] sm:text-[12px] font-bold cursor-pointer ${isDark ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'} transition-colors`}><IconHeart /> 할렐루야 <span className={`px-1.5 py-0.5 rounded-[6px] ${isDark ? 'bg-black/20' : 'bg-white/80'}`}>{data.likes || 0}</span></button>
                </div>
             </div>
            ) : (
             <div key={post.id} className="flex relative shadow-sm group rounded-[24px] overflow-hidden">
                <div className={`flex-1 ${glassCard} p-4 sm:p-5 flex flex-col justify-between ${!canEditOrDelete ? 'rounded-r-[24px]' : 'rounded-l-[24px]'}`}>
                    <div>
                        <div className="flex justify-between items-center mb-2.5">
                          <span className={`text-[12px] sm:text-[12.5px] font-bold ${textMain} flex items-center gap-1.5`}><IconUser/> {data.author}</span>
                          <div className="flex items-center gap-2">
                             
                             {canEditOrDelete && (
                               <>
                                 <button onClick={() => { const edited = window.prompt("기도제목 수정:", data.text); if (edited) handleAction(post, 'edit', edited); }} className={`text-[10.5px] sm:text-[11px] font-semibold ${textSub} px-1.5 py-0.5 hover:${textMain} transition-colors cursor-pointer`}>수정</button>
                                 <button onClick={() => handleDelete(post.id)} className={`text-[10.5px] sm:text-[11px] font-semibold text-[#F43F5E] px-1.5 py-0.5 hover:text-[#E11D48] transition-colors cursor-pointer`}>삭제</button>
                               </>
                             )}

                             <span className={`text-[10px] sm:text-[10.5px] font-medium ${textSub}`}>{new Date(post.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <p className={`text-[13px] sm:text-[13.5px] ${textMain} leading-[1.7] whitespace-pre-wrap mb-4`}>{data.text}</p>
                    </div>
                    <div className="flex justify-start"><button onClick={() => handleAction(post, 'amen')} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[12px] text-[11px] sm:text-[12px] font-bold cursor-pointer ${isDark ? 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'} transition-colors`}><IconPray /> 기도합니다 <span className={`px-1.5 py-0.5 rounded-[6px] ${isDark ? 'bg-black/20' : 'bg-white/80'}`}>{data.likes || 0}</span></button></div>
                </div>
                
                {canEditOrDelete && (
                  <button onClick={() => { if(window.confirm('기도가 응답되었나요? 응답 리스트로 이동합니다.')) handleAction(post, 'answer') }} className={`w-12 sm:w-14 cursor-pointer ${isDark ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-500 hover:bg-emerald-600'} text-white flex flex-col items-center justify-center text-[12px] sm:text-[13px] font-bold leading-tight transition-colors active:scale-95 origin-right border-y border-r ${isDark ? 'border-emerald-800' : 'border-emerald-600'}`}><span>응</span><span className="mt-1">답</span></button>
                )}
             </div>
            );
          })}
        </div>
        
        {currentBoardTab === 'prayer' && answeredPrayers.length > 0 && (
          <div className={`mt-8 pt-5 border-t border-dashed ${isDark ? 'border-white/10' : 'border-[#E2E8F0]'}`}>
              <h4 className={`text-[12px] sm:text-[13px] font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'} mb-3 px-1 flex items-center gap-1.5`}><IconCheck/> 주님이 응답하신 기도</h4>
              <div className="space-y-2.5">
                  {answeredPrayers.map(post => {
                      const data = parsePostData(post.content);
                      return (
                          <div key={post.id} className={`${isDark ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50 border-emerald-200'} p-3.5 sm:p-4 rounded-[20px] border flex justify-between items-center shadow-xs`}>
                             <div>
                               <div className="flex justify-between items-center mb-1"><span className={`text-[10.5px] sm:text-[11px] font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'} flex items-center gap-1`}><IconUser/> {data.author}</span></div>
                               <p className={`text-[12px] sm:text-[12.5px] font-medium ${isDark ? 'text-emerald-300/80' : 'text-emerald-800'} line-through opacity-80`}>{data.text}</p>
                             </div>
                             
                             {(data.author === authUser?.name || authUser?.role === 'admin' || authUser?.role === '관리자') && (
                               <button onClick={() => handleDelete(post.id)} className={`text-[10.5px] font-semibold text-[#F43F5E] hover:text-[#E11D48] px-2 py-1 cursor-pointer`}>삭제</button>
                             )}
                          </div>
                      )
                  })}
              </div>
          </div>
        )}
      </div>
    </div>
  );
}
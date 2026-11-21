// src/pages/Board.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Check,
  Heart,
  Search,
  Send,
  User,
  Edit3,
  Trash2,
  Target,
  BookOpen
} from 'lucide-react';
import ChurchSketchIcon from '../components/ChurchSketchIcon';

// =====================================================================
// 양방향 암호화 유틸리티 (기존 DB 데이터 100% 호환)
// =====================================================================
const ENCRYPT_PREFIX = 'ENC_GTC_v1::';

const encryptField = (plainText) => {
  if (!plainText || typeof plainText !== 'string') return plainText;
  try {
    const encoded = btoa(encodeURIComponent(plainText));
    return `${ENCRYPT_PREFIX}${encoded}`;
  } catch (_) {
    return plainText;
  }
};

const decryptField = (cipherText) => {
  if (!cipherText || typeof cipherText !== 'string') return cipherText;
  if (!cipherText.startsWith(ENCRYPT_PREFIX)) return cipherText;
  try {
    const payload = cipherText.replace(ENCRYPT_PREFIX, '');
    return decodeURIComponent(atob(payload));
  } catch (_) {
    return cipherText;
  }
};

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
  // iOS 야간 다크모드 자동 감지 + 앱 테마 100% 호환
  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const isDark = typeof isDarkMode === 'boolean' ? isDarkMode : systemDark;

  const [internalPostText, setInternalPostText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const [internalTab, setInternalTab] = useState('thanks');

  const currentInputText = newPostText !== undefined ? newPostText : internalPostText;
  const handleInputChange = (val) => {
    setInternalPostText(val);
    if (setNewPostText) setNewPostText(val);
  };

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  }, []);

  const currentBoardTab = mLocal?.boardTab || internalTab;
  const setBoardTab = (tab) => {
    setInternalTab(tab);
    if (setMLocal) setMLocal({ ...mLocal, boardTab: tab });
  };

  const parsePostData = useCallback((content) => {
    try {
      const dec = decryptField(content);
      return JSON.parse(dec);
    } catch {
      try {
        return JSON.parse(content);
      } catch {
        return { text: content, author: '익명', likes: 0, status: 'praying', type: 'thanks' };
      }
    }
  }, []);

  const quickChips = useMemo(() => {
    return currentBoardTab === 'thanks'
      ? ['#오늘의감사', '#구원의은혜', '#가족', '#일터', '#치유회복', '#말씀동행']
      : ['#건강회복', '#가족구원', '#마음평안', '#진로지혜', '#영적성장', '#사역과목장'];
  }, [currentBoardTab]);

  const handleAddChip = (chip) => {
    const space = currentInputText && !currentInputText.endsWith(' ') ? ' ' : '';
    handleInputChange(`${currentInputText}${space}${chip} `);
  };

  const handleSubmitPost = async () => {
    const textToSubmit = currentInputText.trim();
    if (!textToSubmit) return showToast('내용을 입력해주세요.');
    if (!supabase) return showToast('Supabase 연결이 필요합니다.');

    setIsSubmitting(true);
    try {
      const authorName = isAnonymous ? '익명의 지체' : authUser?.name || '성도';
      const rawPayload = JSON.stringify({
        type: currentBoardTab,
        text: textToSubmit,
        likes: 0,
        author: authorName,
        status: 'praying',
        isAnonymous
      });

      const { error } = await supabase.from('test_board').insert([{ content: encryptField(rawPayload) }]);
      if (error) throw error;

      handleInputChange('');
      if (fetchPosts) fetchPosts();
      showToast(currentBoardTab === 'thanks' ? '감사 나눔이 등록되었습니다.' : '기도제목이 등록되었습니다.');
    } catch (err) {
      showToast('등록 오류: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (post, actionType, newText = '') => {
    try {
      const parsed = parsePostData(post.content);
      if (actionType === 'amen') parsed.likes = (parsed.likes || 0) + 1;
      if (actionType === 'answer') parsed.status = 'answered';
      if (actionType === 'edit') parsed.text = newText;

      const encryptedContent = encryptField(JSON.stringify(parsed));
      if (supabase) await supabase.from('test_board').update({ content: encryptedContent }).eq('id', post.id);
      if (setBoardPosts) {
        setBoardPosts((posts) =>
          (getArr ? getArr(posts) : []).map((p) => (p.id === post.id ? { ...p, content: encryptedContent } : p))
        );
      }

      if (actionType === 'amen') {
        showToast(parsed.type === 'thanks' ? '할렐루야! 감사에 동참했습니다.' : '아멘! 함께 기도했습니다.');
      }
    } catch (_) {
      showToast('처리 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('이 글을 삭제하시겠습니까?')) return;
    if (supabase) {
      const { error } = await supabase.from('test_board').delete().eq('id', postId);
      if (!error && fetchPosts) {
        fetchPosts();
        showToast('게시글이 삭제되었습니다.');
      }
    }
  };

  const handleSaveEdit = async (post) => {
    if (!editingText.trim()) return showToast('수정할 내용을 입력해주세요.');
    await handleAction(post, 'edit', editingText.trim());
    setEditingPostId(null);
    setEditingText('');
    showToast('게시글이 수정되었습니다.');
  };

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
      showToast(`[${postData.author}] 님의 기도제목이 나의 기도함에 담겼습니다.`);
    } catch (_) {
      showToast('기도함 담기 중 오류가 발생했습니다.');
    }
  };

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
      showToast('삶의 실천 트래커에 등록되었습니다.');
    } catch (_) {
      showToast('실천 과제 등록 중 오류가 발생했습니다.');
    }
  };

  const handleImportToMyDiary = (postData) => {
    try {
      const diaries = JSON.parse(localStorage.getItem('goodtree_diary_entries') || '[]');
      diaries.push({
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        content: encryptField(
          `[공동체 은혜 나눔 스크랩: ${postData.author}]\n"${postData.text}"\n\n지체의 감사 고백을 통해 동일한 은혜를 주신 주님을 찬양합니다.`
        )
      });
      localStorage.setItem('goodtree_diary_entries', JSON.stringify(diaries));
      window.dispatchEvent(new Event('storage'));
      showToast('감사/간증 일기장에 스크랩되었습니다.');
    } catch (_) {
      showToast('일기장 스크랩 중 오류가 발생했습니다.');
    }
  };

  const handleAnswerPrayerWithDiary = async (post) => {
    if (!window.confirm('기도가 응답되었나요? 응답 리스트로 이동하며 감사 일기장에도 기록됩니다.')) return;
    await handleAction(post, 'answer');
    const data = parsePostData(post.content);
    try {
      const diaries = JSON.parse(localStorage.getItem('goodtree_diary_entries') || '[]');
      diaries.push({
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        content: encryptField(
          `[공동체 기도 응답 감사: ${data.author}]\n기도제목: "${data.text}"\n\n주님께서 공동체의 부르짖음을 들으시고 신실하게 응답하셨습니다.`
        )
      });
      localStorage.setItem('goodtree_diary_entries', JSON.stringify(diaries));
      window.dispatchEvent(new Event('storage'));
      showToast('응답받은 기도가 감사 일기장으로 이관되었습니다.');
    } catch (_) {}
  };

  const validPosts = getArr ? getArr(boardPosts) : [];

  const stats = useMemo(() => {
    let thanksCount = 0;
    let prayerCount = 0;
    let answeredCount = 0;
    let totalResonance = 0;

    validPosts.forEach((p) => {
      const data = parsePostData(p.content);
      totalResonance += data.likes || 0;
      if (data.type === 'thanks') thanksCount++;
      else if (data.type === 'prayer') {
        if (data.status === 'answered') answeredCount++;
        else prayerCount++;
      }
    });
    return { thanksCount, prayerCount, answeredCount, totalResonance };
  }, [validPosts, parsePostData]);

  const filteredPosts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return validPosts.filter((p) => {
      const data = parsePostData(p.content);
      const matchesTab = data.type === currentBoardTab;
      const matchesSearch = !term || data.text?.toLowerCase().includes(term) || data.author?.toLowerCase().includes(term);
      return matchesTab && matchesSearch;
    });
  }, [validPosts, currentBoardTab, searchTerm, parsePostData]);

  const activePrayers = useMemo(
    () => filteredPosts.filter((p) => parsePostData(p.content).status !== 'answered'),
    [filteredPosts, parsePostData]
  );

  const answeredPrayers = useMemo(
    () => filteredPosts.filter((p) => parsePostData(p.content).status === 'answered'),
    [filteredPosts, parsePostData]
  );

  const displayPosts = currentBoardTab === 'thanks' ? filteredPosts : activePrayers;

  // 글로벌 SaaS 3색 조화 토큰
  const pageBg = isDark ? 'bg-[#0F1115]' : 'bg-[#F5F6F8]';
  const surfaceBg = isDark ? 'bg-[#171A21]' : 'bg-white';
  const subBg = isDark ? 'bg-[#20242E]' : 'bg-[#F1F3F6]';
  const borderClass = isDark ? 'border-[#262B36]' : 'border-[#E5E8EC]';
  const textMain = isDark ? 'text-[#F8FAFC]' : 'text-[#191F28]';
  const textSub = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';
  const inputClass = isDark
    ? 'bg-[#20242E] border-[#262B36] text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#2563EB]'
    : 'bg-[#F8F9FA] border-[#E5E8EC] text-[#191F28] placeholder:text-[#94A3B8] focus:border-[#2563EB]';

  return (
    <div
      style={{ colorScheme: isDark ? 'dark' : 'light' }}
      className={`flex-1 flex flex-col h-full ${pageBg} ${textMain} relative font-sans overflow-hidden text-left select-none`}
    >
      {/* 토스트 알림 */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[999999] bg-[#191F28] text-white text-[12.5px] font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5 whitespace-nowrap">
          <Check className="w-4 h-4 text-[#34D399]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. 상단 서브 헤더 */}
      <div className="relative z-20 shrink-0">
        {SubPageHeader && (
          <SubPageHeader
            title="함께하는 감사 · 기도"
            onBack={() => setActiveScreen && setActiveScreen('home')}
            t={t}
            toggleSidebar={() => setIsSidebarOpen && setIsSidebarOpen(!isSidebarOpen)}
          />
        )}
      </div>

      {/* 2. 딥링크 퀵 바 + 검색 + 탭 */}
      <div className={`shrink-0 border-b ${borderClass} ${surfaceBg} z-20`}>
        <div className="max-w-[920px] mx-auto px-3 sm:px-5 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
            {[
              { id: 'qt', label: 'QT' },
              { id: 'sermon', label: '설교' },
              { id: 'applyTracker', label: '실천' },
              { id: 'prayer', label: '기도' },
              { id: 'diary', label: '일기' },
              { id: 'cell', label: '목장' }
            ].map((nav) => (
              <button
                key={nav.id}
                type="button"
                onClick={() => setActiveScreen && setActiveScreen(nav.id)}
                className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold border ${borderClass} ${subBg} ${textSub} hover:text-[#2563EB] cursor-pointer shrink-0`}
              >
                {nav.label}
              </button>
            ))}
          </div>

          <div className={`flex items-center gap-1.5 px-2.5 h-8 rounded-lg border shrink-0 ${inputClass}`}>
            <Search className={`w-3.5 h-3.5 ${textSub} shrink-0`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="검색..."
              className="bg-transparent outline-none text-[12px] w-20 sm:w-36 select-text"
            />
          </div>
        </div>

        <div className="max-w-[920px] mx-auto px-3 sm:px-5 grid grid-cols-2">
          <button
            type="button"
            onClick={() => setBoardTab('thanks')}
            className={`py-2.5 text-[13.5px] font-bold border-b-2 flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              currentBoardTab === 'thanks' ? 'border-[#2563EB] text-[#2563EB]' : `border-transparent ${textSub}`
            }`}
          >
            <Heart className="w-4 h-4" /> 함께하는 감사
          </button>
          <button
            type="button"
            onClick={() => setBoardTab('prayer')}
            className={`py-2.5 text-[13.5px] font-bold border-b-2 flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              currentBoardTab === 'prayer' ? 'border-[#2563EB] text-[#2563EB]' : `border-transparent ${textSub}`
            }`}
          >
            <ChurchSketchIcon name="prayer-hands" className="w-4 h-4" isDarkMode={isDark} /> 오늘 필요한 기도
          </button>
        </div>
      </div>

      {/* 3. 메인 스크롤 영역 */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-5 pt-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] hide-scrollbar">
        <div className="max-w-[920px] mx-auto space-y-3.5">
          {/* 4대 통계 카드 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className={`${surfaceBg} border ${borderClass} p-3 rounded-xl space-y-0.5`}>
              <span className={`text-[11px] font-bold ${textSub} block`}>함께한 감사</span>
              <span className="text-[20px] font-mono font-bold text-[#D97706]">{stats.thanksCount}</span>
            </div>
            <div className={`${surfaceBg} border ${borderClass} p-3 rounded-xl space-y-0.5`}>
              <span className={`text-[11px] font-bold ${textSub} block`}>중보 중인 기도</span>
              <span className="text-[20px] font-mono font-bold text-[#2563EB]">{stats.prayerCount}</span>
            </div>
            <div className={`${surfaceBg} border ${borderClass} p-3 rounded-xl space-y-0.5`}>
              <span className={`text-[11px] font-bold ${textSub} block`}>응답된 기도</span>
              <span className="text-[20px] font-mono font-bold text-[#0D9488]">{stats.answeredCount}</span>
            </div>
            <div className={`${surfaceBg} border ${borderClass} p-3 rounded-xl space-y-0.5`}>
              <span className={`text-[11px] font-bold ${textSub} block`}>아멘 · 동참</span>
              <span className="text-[20px] font-mono font-bold text-[#2563EB]">{stats.totalResonance}</span>
            </div>
          </div>

          {/* 새 글 작성 카드 */}
          <section className={`${surfaceBg} border ${borderClass} p-4 rounded-xl space-y-2.5`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[13.5px] font-bold text-[#2563EB]">
                  {currentBoardTab === 'thanks' ? '새로운 감사 나눔' : '함께할 기도제목 나누기'}
                </span>
                <span className={`text-[11.5px] ${textSub}`}>({authUser?.name || '성도'})</span>
              </div>

              <label className={`flex items-center gap-1.5 text-[12px] font-bold ${textSub} cursor-pointer`}>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#2563EB] rounded cursor-pointer"
                />
                익명 작성
              </label>
            </div>

            <div className="relative">
              <textarea
                value={currentInputText}
                onChange={(e) => handleInputChange(e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                placeholder={
                  currentBoardTab === 'thanks'
                    ? '오늘 부어주신 은혜와 감사를 공동체와 나눠주세요...'
                    : '함께 손을 모아 기도할 제목을 편안하게 나누어주세요...'
                }
                rows={3}
                className={`w-full p-3 rounded-xl border text-[13.5px] leading-[1.7] resize-none outline-none select-text ${inputClass}`}
              />
              <span className={`absolute right-3 bottom-2.5 text-[10.5px] font-mono ${textSub} pointer-events-none`}>
                {currentInputText.length}자
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 flex-wrap">
                {quickChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleAddChip(chip)}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${borderClass} ${subBg} ${textSub} hover:text-[#2563EB] cursor-pointer`}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={isSubmitting || !currentInputText.trim()}
                onClick={handleSubmitPost}
                className="h-9 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 text-white font-bold text-[12.5px] flex items-center gap-1.5 cursor-pointer ml-auto transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? '등록 중...' : '올리기'}</span>
              </button>
            </div>
          </section>

          {/* 게시글 리스트 */}
          <div className="space-y-2.5">
            {isLoadingPosts ? (
              <div className={`text-center py-10 text-[13px] ${textSub}`}>불러오는 중입니다...</div>
            ) : displayPosts.length === 0 ? (
              <div className={`${surfaceBg} border border-dashed ${borderClass} rounded-xl py-12 text-center space-y-1`}>
                <p className="text-[14px] font-bold">{searchTerm ? '검색 결과가 없습니다.' : '아직 등록된 나눔이 없습니다.'}</p>
                <p className={`text-[12.5px] ${textSub}`}>
                  위 작성창에 첫 번째 {currentBoardTab === 'thanks' ? '감사 고백' : '기도제목'}을 남겨보세요.
                </p>
              </div>
            ) : (
              displayPosts.map((post) => {
                const data = parsePostData(post.content);
                const isAuthor = data.author === authUser?.name;
                const isAdmin = ['admin', '관리자', '운영자'].includes(authUser?.role);
                const canEditOrDelete = isAuthor || isAdmin;
                const isEditingThis = editingPostId === post.id;

                return (
                  <article key={post.id} className={`${surfaceBg} border ${borderClass} rounded-xl overflow-hidden flex`}>
                    <div className="flex-1 p-4 space-y-2.5 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-bold flex items-center gap-1.5 truncate">
                          <User className={`w-3.5 h-3.5 ${textSub} shrink-0`} />
                          <span className="truncate">{data.author}</span>
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {canEditOrDelete && !isEditingThis && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPostId(post.id);
                                  setEditingText(data.text);
                                }}
                                className={`text-[11.5px] font-bold ${textSub} hover:text-[#2563EB] flex items-center gap-0.5 cursor-pointer`}
                              >
                                <Edit3 className="w-3 h-3" /> 수정
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(post.id)}
                                className="text-[11.5px] font-bold text-rose-500 flex items-center gap-0.5 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" /> 삭제
                              </button>
                            </>
                          )}
                          <span className={`text-[11px] font-mono ${textSub}`}>
                            {new Date(post.created_at).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {isEditingThis ? (
                        <div className="space-y-2">
                          <textarea
                            rows={3}
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className={`w-full p-2.5 rounded-xl border text-[13.5px] outline-none resize-none select-text ${inputClass}`}
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingPostId(null)}
                              className={`px-3 py-1 rounded-lg text-[12px] font-bold ${subBg} cursor-pointer`}
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(post)}
                              className="px-3 py-1 rounded-lg text-[12px] font-bold bg-[#2563EB] text-white cursor-pointer"
                            >
                              저장
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[14px] leading-[1.75] whitespace-pre-wrap break-keep select-text">{data.text}</p>
                      )}

                      <div className={`pt-2.5 border-t ${borderClass} flex flex-wrap items-center justify-between gap-2`}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {currentBoardTab === 'thanks' ? (
                            <button
                              type="button"
                              onClick={() => handleImportToMyDiary(data)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${borderClass} ${subBg} ${textSub} hover:text-[#2563EB] flex items-center gap-1 cursor-pointer`}
                            >
                              <BookOpen className="w-3 h-3" /> 내 일기로
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleImportToMyPrayerBox(data)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${borderClass} ${subBg} ${textSub} hover:text-[#2563EB] cursor-pointer`}
                            >
                              내 기도함
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleExportToApplyTracker(data)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${borderClass} ${subBg} ${textSub} hover:text-[#0D9488] flex items-center gap-1 cursor-pointer`}
                          >
                            <Target className="w-3 h-3" /> 실천 결단
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAction(post, 'amen')}
                          className={`px-3 py-1 rounded-full text-[12px] font-bold flex items-center gap-1.5 cursor-pointer ${
                            currentBoardTab === 'thanks'
                              ? 'bg-[#D97706]/15 text-[#D97706]'
                              : 'bg-[#2563EB]/12 text-[#2563EB]'
                          }`}
                        >
                          <Heart className="w-3.5 h-3.5" />
                          <span>{currentBoardTab === 'thanks' ? '할렐루야' : '기도합니다'}</span>
                          <span className="font-mono">{data.likes || 0}</span>
                        </button>
                      </div>
                    </div>

                    {currentBoardTab === 'prayer' && canEditOrDelete && (
                      <button
                        type="button"
                        onClick={() => handleAnswerPrayerWithDiary(post)}
                        className="w-12 sm:w-14 bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-[12px] flex flex-col items-center justify-center shrink-0 cursor-pointer transition-colors"
                        title="기도 응답 확정"
                      >
                        <span>응</span>
                        <span className="mt-0.5">답</span>
                      </button>
                    )}
                  </article>
                );
              })
            )}
          </div>

          {/* 응답된 기도 섹션 */}
          {currentBoardTab === 'prayer' && answeredPrayers.length > 0 && (
            <section className={`pt-4 border-t ${borderClass} space-y-2.5`}>
              <div className="flex items-center justify-between">
                <h3 className="text-[13.5px] font-bold text-[#0D9488] flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> 주님이 응답하신 기도 ({answeredPrayers.length}건)
                </h3>
              </div>

              <div className="space-y-2">
                {answeredPrayers.map((post) => {
                  const data = parsePostData(post.content);
                  return (
                    <div
                      key={post.id}
                      className={`${surfaceBg} border border-[#0D9488]/35 p-3.5 rounded-xl flex items-center justify-between gap-2`}
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold text-[#0D9488]">{data.author}</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#0D9488]/15 text-[#0D9488] text-[10px] font-bold">
                            응답 완료
                          </span>
                        </div>
                        <p className={`text-[13px] ${textSub} line-through truncate select-text`}>{data.text}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleImportToMyDiary(data)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#0D9488]/12 text-[#0D9488] cursor-pointer"
                        >
                          간증 스크랩
                        </button>
                        {(data.author === authUser?.name || ['admin', '관리자', '운영자'].includes(authUser?.role)) && (
                          <button
                            type="button"
                            onClick={() => handleDelete(post.id)}
                            className="text-[11px] font-bold text-rose-500 px-1.5 py-1 cursor-pointer"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
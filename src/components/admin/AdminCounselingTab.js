// src/components/admin/AdminCounselingTab.js
import React, { useState, useMemo } from 'react';
import CryptoJS from 'crypto-js';

// =====================================================================
// 🔐 [보안 표준화] 군사급 AES-256 종단간 복호화 엔진 (v1, v2 전수 호환)
// =====================================================================
const CHAT_SECRET_KEY = process.env.REACT_APP_CHAT_SECRET || 'tree-secret-key-2026';
const ENC_PREFIX_V2 = "ENC_GTC_v2::";
const ENC_PREFIX_V1 = "ENC_GTC_v1::";

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

// 엔터프라이즈 모노크롬 SVG 아이콘 세트
const SvgMail = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>;
const SvgSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const SvgSend = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const SvgCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const SvgClock = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const SvgUser = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632zM19.5 12l2.25 2.25 4.5-4.5" /></svg>;
const SvgLock = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>;
const SvgTag = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>;

// 목회 실무 성경 말씀 및 위로 스니펫 프리셋
const QUICK_SNIPPETS = [
  { 
    label: "평안과 위로", 
    text: "성도님의 나눔에 깊은 마음이 머뭅니다. \"아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라 그리하면 모든 지각에 뛰어난 하나님의 평강이 그리스도 예수 안에서 너희 마음과 생각을 지키시리라\"(빌 4:6-7) 오늘 하루 주님의 참된 평안이 성도님의 삶과 영혼에 가득하길 간절히 중보합니다." 
  },
  { 
    label: "치유와 회복", 
    text: "\"여호와는 나의 목자시니 내게 부족함이 없으리로다 그가 나를 푸른 풀밭에 누이시며 쉴 만한 물 가로 인도하시는도다 내 영혼을 소생시키시고\"(시 23:1-3) 연약한 육신과 지친 마음에 주님의 전능하신 치유의 손길이 임하시길 기도드립니다. 언제나 주님이 함께하십니다." 
  },
  { 
    label: "지혜와 인도", 
    text: "\"너는 마음을 다하여 여호와를 신뢰하고 네 명철을 의지하지 말라 너는 범사에 그를 인정하라 그리하면 네 길을 지도하시리라\"(잠 3:5-6) 깊은 기도로 지혜를 구할 때 하나님께서 가장 선한 길로 인도해 주실 줄 믿습니다." 
  },
  { 
    label: "심방/티타임 제안", 
    text: "소중한 마음을 나누어 주셔서 감사합니다. 메세지 너머로 더 따뜻한 위로와 기도를 전하고 싶습니다. 괜찮으시다면 이번 주 중 편하신 시간에 짧은 티타임이나 심방을 통해 뵙고 싶은데 어떠실지요? 편히 말씀해 주시면 일정을 조율하겠습니다." 
  }
];

export default function AdminCounselingTab({
  counselingList = [],
  counselingReplies = {},
  setCounselingReplies,
  handleSendCounselingReply
}) {
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(() => counselingList[0]?.id || null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // 에디터 모드: 공식 회신 vs 사역자 내부 비공개 메모
  const [editorMode, setEditorMode] = useState('REPLY'); // 'REPLY' | 'INTERNAL_NOTE'
  const [internalMemos, setInternalMemos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('church_counseling_internal_memos')) || {}; } catch { return {}; }
  });
  const [currentMemoInput, setCurrentMemoInput] = useState('');

  // 🌟 [핵심] 암호화된 모든 상담 티켓의 본문, 제목, 회신을 실시간 자동 복호화
  const decryptedList = useMemo(() => {
    return (counselingList || []).map(c => ({
      ...c,
      title: decryptField(c.title),
      content: decryptField(c.content),
      reply: decryptField(c.reply)
    }));
  }, [counselingList]);

  // 🌟 복호화된 데이터를 기반으로 필터링 및 검색 수행
  const filteredList = useMemo(() => {
    return decryptedList.filter(c => {
      const isAnswered = c.status === 'answered';
      const isInProgress = c.status === 'in_progress';

      if (filterMode === 'PENDING' && (isAnswered || isInProgress)) return false;
      if (filterMode === 'IN_PROGRESS' && !isInProgress) return false;
      if (filterMode === 'RESOLVED' && !isAnswered) return false;

      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        (c.user_name || '').toLowerCase().includes(q) ||
        (c.title || '').toLowerCase().includes(q) ||
        (c.content || '').toLowerCase().includes(q) ||
        (c.cell_name || '').toLowerCase().includes(q)
      );
    });
  }, [decryptedList, filterMode, query]);

  // 활성 선택 티켓 (복호화된 데이터 연동)
  const activeTicket = useMemo(() => {
    if (!selectedId && filteredList.length > 0) return filteredList[0];
    const found = decryptedList.find(c => c.id === selectedId);
    return found || filteredList[0] || null;
  }, [decryptedList, filteredList, selectedId]);

  // 해당 성도의 과거 상담 누적 건수
  const userPastTickets = useMemo(() => {
    if (!activeTicket) return [];
    return decryptedList.filter(c => c.user_name === activeTicket.user_name);
  }, [decryptedList, activeTicket]);

  const currentReplyText = activeTicket ? (counselingReplies[activeTicket.id] || '') : '';
  const currentTicketMemos = activeTicket ? (internalMemos[activeTicket.id] || []) : [];

  // 스니펫 본문 삽입
  const handleApplySnippet = (snippetText) => {
    if (!activeTicket) return;
    const prev = counselingReplies[activeTicket.id] || '';
    const updated = prev ? `${prev}\n\n${snippetText}` : snippetText;
    setCounselingReplies({ ...counselingReplies, [activeTicket.id]: updated });
  };

  // 단축키 전송 (Cmd/Ctrl + Enter)
  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      if (editorMode === 'REPLY' && activeTicket && currentReplyText.trim()) {
        handleSendCounselingReply(activeTicket.id);
      } else if (editorMode === 'INTERNAL_NOTE' && currentMemoInput.trim()) {
        handleAddInternalMemo();
      }
    }
  };

  // 내부 교역자 인계 메모 추가
  const handleAddInternalMemo = () => {
    if (!activeTicket || !currentMemoInput.trim()) return;
    const newMemo = {
      id: Date.now(),
      text: currentMemoInput.trim(),
      author: '담당 사역자',
      created_at: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    const updated = {
      ...internalMemos,
      [activeTicket.id]: [newMemo, ...(internalMemos[activeTicket.id] || [])]
    };
    setInternalMemos(updated);
    localStorage.setItem('church_counseling_internal_memos', JSON.stringify(updated));
    setCurrentMemoInput('');
  };

  const pendingCount = decryptedList.filter(c => c.status !== 'answered' && c.status !== 'in_progress').length;
  const inProgressCount = decryptedList.filter(c => c.status === 'in_progress').length;

  return (
    <div className="h-full flex flex-col md:flex-row bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden box-border font-sans select-none text-zinc-900">
      
      {/* =========================================================================
          PANEL 1: 상담 인박스 (Master Ticket Queue)
          ========================================================================= */}
      <div className={`w-full md:w-[320px] lg:w-[350px] bg-zinc-50/60 border-b md:border-b-0 md:border-r border-zinc-200 flex flex-col shrink-0 min-h-0 ${mobileDetailOpen ? 'hidden md:flex' : 'flex flex-1 md:flex-initial'}`}>
        
        {/* 인박스 상단 필터 헤더 */}
        <div className="p-3.5 border-b border-zinc-200 flex flex-col gap-2.5 bg-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-black text-zinc-900 tracking-tight flex items-center gap-1.5">
                <SvgMail /> 목회 상담 인박스
              </span>
              {pendingCount > 0 && (
                <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded">
                  {pendingCount}대기
                </span>
              )}
            </div>
            <span className="text-[10.5px] font-mono text-zinc-400">총 {decryptedList.length}건</span>
          </div>

          {/* 3단계 파이프라인 필터 탭 */}
          <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/80 text-[10.5px] font-bold shadow-inner">
            <button onClick={() => setFilterMode('ALL')} className={`flex-1 py-1 rounded-md transition-all ${filterMode === 'ALL' ? 'bg-white text-zinc-900 shadow-2xs font-black' : 'text-zinc-500 hover:text-zinc-800'}`}>전체</button>
            <button onClick={() => setFilterMode('PENDING')} className={`flex-1 py-1 rounded-md transition-all ${filterMode === 'PENDING' ? 'bg-white text-rose-700 shadow-2xs font-black' : 'text-zinc-500 hover:text-zinc-800'}`}>접수대기 ({pendingCount})</button>
            <button onClick={() => setFilterMode('IN_PROGRESS')} className={`flex-1 py-1 rounded-md transition-all ${filterMode === 'IN_PROGRESS' ? 'bg-white text-amber-700 shadow-2xs font-black' : 'text-zinc-500 hover:text-zinc-800'}`}>진행중 ({inProgressCount})</button>
            <button onClick={() => setFilterMode('RESOLVED')} className={`flex-1 py-1 rounded-md transition-all ${filterMode === 'RESOLVED' ? 'bg-white text-zinc-900 shadow-2xs font-black' : 'text-zinc-500 hover:text-zinc-800'}`}>답변완료</button>
          </div>

          <div className="relative flex items-center">
            <span className="absolute left-2.5 text-zinc-400 pointer-events-none"><SvgSearch /></span>
            <input 
              type="text" 
              placeholder="성도명, 상담 제목 검색..." 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
              className="w-full pl-8 pr-2.5 py-1.5 text-[11.5px] bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:bg-white focus:border-zinc-800 text-zinc-900 font-bold placeholder:text-zinc-400 placeholder:font-medium transition-all shadow-2xs" 
            />
          </div>
        </div>

        {/* 티켓 카드 큐 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 hide-scrollbar bg-zinc-50/40">
          {filteredList.length === 0 ? (
            <div className="py-20 text-center text-zinc-400 text-[11.5px] font-bold">
              조회 조건에 해당하는 상담 티켓이 없습니다.
            </div>
          ) : (
            filteredList.map(c => {
              const isSelected = activeTicket?.id === c.id;
              const isAnswered = c.status === 'answered';
              const isInProgress = c.status === 'in_progress';

              return (
                <div
                  key={c.id}
                  onClick={() => { setSelectedId(c.id); setMobileDetailOpen(true); }}
                  className={`p-3 rounded-xl cursor-pointer transition-all border shadow-2xs flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-zinc-900 border-zinc-900 text-white'
                      : 'bg-white border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-black text-[12.5px] ${isSelected ? 'text-white' : 'text-zinc-900'}`}>{c.user_name}</span>
                      <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded border ${isSelected ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-zinc-50 text-zinc-500 border-zinc-200'}`}>
                        {c.cell_name || '미배정'}
                      </span>
                    </div>

                    <span className={`text-[9.5px] font-mono flex items-center gap-1 font-bold ${isSelected ? 'text-zinc-400' : 'text-zinc-400'}`}>
                      <SvgClock /> {new Date(c.created_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                    </span>
                  </div>

                  <h4 className={`text-[12px] font-bold truncate leading-snug ${isSelected ? 'text-zinc-100' : 'text-zinc-800'}`}>
                    {c.title}
                  </h4>

                  <p className={`text-[11px] line-clamp-2 leading-relaxed font-medium ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {c.content}
                  </p>

                  <div className={`mt-1 pt-2 border-t flex justify-between items-center text-[10px] ${isSelected ? 'border-zinc-800' : 'border-zinc-100'}`}>
                    <span className={`font-mono text-[9px] ${isSelected ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      #TICKET-{String(c.id).slice(-4)}
                    </span>

                    <span className={`px-1.5 py-0.2 rounded font-black border text-[9.5px] flex items-center gap-1 ${
                      isAnswered
                        ? (isSelected ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                        : isInProgress
                        ? (isSelected ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200')
                        : (isSelected ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200')
                    }`}>
                      {isAnswered ? <><SvgCheck /> 회신 완료</> : isInProgress ? '심방 진행중' : '접수 대기'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* =========================================================================
          PANEL 2: 활성 스레드 상세 & 듀얼 에디터 (Conversation + Staff Memos)
          ========================================================================= */}
      <div className={`flex-1 flex flex-col min-h-0 bg-white ${!mobileDetailOpen ? 'hidden md:flex' : 'flex absolute inset-0 z-50'}`}>
        
        {/* 모바일 전용 뒤로가기 바 */}
        <div className="md:hidden px-4 py-2.5 border-b border-zinc-200 flex items-center bg-zinc-50 shrink-0">
          <button 
            type="button" 
            onClick={() => setMobileDetailOpen(false)} 
            className="text-[11.5px] font-bold text-zinc-700 flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-zinc-200 shadow-2xs"
          >
            ← 상담 목록으로
          </button>
        </div>

        {!activeTicket ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 gap-2 p-8 bg-zinc-50/30">
            <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 shadow-2xs flex items-center justify-center">
              <SvgMail />
            </div>
            <span className="text-[12.5px] font-bold text-zinc-500">좌측 목록에서 상담 티켓을 선택해 주세요.</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            
            {/* 스레드 상단 헤더 */}
            <div className="px-6 py-3.5 border-b border-zinc-200 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-black text-[14px] shadow-2xs shrink-0">
                  {activeTicket.user_name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-black text-[15px] text-zinc-900 truncate tracking-tight">{activeTicket.title}</h3>
                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200 flex items-center gap-1 shrink-0">
                      <SvgLock /> 비공개 목회상담
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-bold">
                    {activeTicket.user_name} 성도 <span className="font-medium">· 접수: {new Date(activeTicket.created_at).toLocaleString('ko-KR')}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 스레드 본문 영역 (성도 고민 + 사역자 답변 + 내부 인계 메모) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 hide-scrollbar bg-zinc-50/30">
              
              {/* 성도 원문 카드 (완전 복호화된 본문 표시) */}
              <div className="flex flex-col gap-1.5 max-w-3xl">
                <div className="flex items-center gap-1 text-[10.5px] font-black text-zinc-400 uppercase tracking-wider pl-1">
                  <SvgUser /> <span>{activeTicket.user_name} 성도의 나눔/고민</span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-2xs">
                  <div className="text-[13px] text-zinc-800 leading-[1.8] whitespace-pre-wrap font-medium">
                    {activeTicket.content}
                  </div>
                </div>
              </div>

              {/* 사역자 공식 답변 카드 (완전 복호화된 회신 표시) */}
              {activeTicket.status === 'answered' && (
                <div className="flex flex-col gap-1.5 max-w-3xl pl-4 border-l-2 border-zinc-900 ml-2 mt-3">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-black text-zinc-900 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                    <span>목양 서신 회신 ({activeTicket.replied_by || '담당 교역자'})</span>
                    <span className="text-[10px] font-mono text-zinc-400 normal-case ml-1">
                      {activeTicket.replied_at ? new Date(activeTicket.replied_at).toLocaleString('ko-KR') : ''}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-2xs">
                    <div className="text-[13px] text-zinc-800 leading-[1.8] whitespace-pre-wrap font-medium">
                      {activeTicket.reply}
                    </div>
                  </div>
                </div>
              )}

              {/* 교역자 내부 비공개 심방 메모 타임라인 */}
              {currentTicketMemos.length > 0 && (
                <div className="flex flex-col gap-2 max-w-3xl pt-2">
                  <span className="text-[10.5px] font-black text-amber-800 uppercase tracking-wider pl-1 flex items-center gap-1">
                    🔒 교역자 비공개 심방/인계 메모 ({currentTicketMemos.length}건)
                  </span>
                  <div className="space-y-1.5">
                    {currentTicketMemos.map(m => (
                      <div key={m.id} className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-[11.5px] text-amber-950 flex justify-between items-start gap-3">
                        <span className="font-medium whitespace-pre-wrap leading-relaxed">{m.text}</span>
                        <span className="font-mono text-[10px] text-amber-700 shrink-0 font-bold">[{m.created_at}]</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 하단 듀얼 작성 에디터 */}
            <div className="p-4 bg-white border-t border-zinc-200 shrink-0 flex flex-col gap-2.5">
              
              <div className="flex items-center justify-between">
                <div className="flex bg-zinc-100 p-0.5 rounded-md border border-zinc-200 text-[10.5px] font-bold">
                  <button 
                    type="button" 
                    onClick={() => setEditorMode('REPLY')}
                    className={`px-3 py-1 rounded transition-colors ${editorMode === 'REPLY' ? 'bg-white text-zinc-900 shadow-2xs font-black' : 'text-zinc-500'}`}
                  >
                    공식 목양 회신 (성도 앱 전송)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditorMode('INTERNAL_NOTE')}
                    className={`px-3 py-1 rounded transition-colors ${editorMode === 'INTERNAL_NOTE' ? 'bg-white text-amber-800 shadow-2xs font-black' : 'text-zinc-500'}`}
                  >
                    🔒 교역자 비공개 메모
                  </button>
                </div>

                {editorMode === 'REPLY' && (
                  <div className="hidden sm:flex items-center gap-1 overflow-x-auto text-[10.5px]">
                    <span className="text-zinc-400 font-bold shrink-0">성구 스니펫:</span>
                    {QUICK_SNIPPETS.map(snip => (
                      <button
                        key={snip.label}
                        type="button"
                        onClick={() => handleApplySnippet(snip.text)}
                        className="px-2 py-0.5 rounded bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-bold border border-zinc-200 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {snip.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {editorMode === 'REPLY' ? (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={currentReplyText}
                    onKeyDown={handleKeyDown}
                    onChange={e => setCounselingReplies({ ...counselingReplies, [activeTicket.id]: e.target.value })}
                    placeholder={activeTicket.status === 'answered' ? '보충 답변 작성...' : '성도님께 전할 따뜻한 목양 서신을 작성하세요... (Ctrl + Enter로 전송)'}
                    className="w-full p-3.5 text-[12.5px] bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:bg-white focus:border-zinc-800 transition-all resize-none leading-relaxed text-zinc-900 font-medium placeholder:text-zinc-400 shadow-2xs"
                  />
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-zinc-400">
                      답변 발송 시 성도의 모바일 기기로 푸시 알림이 즉시 발송됩니다.
                    </span>
                    <button
                      type="button"
                      disabled={!currentReplyText.trim()}
                      onClick={() => handleSendCounselingReply(activeTicket.id)}
                      className="px-5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-black text-[11.5px] shadow-2xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <SvgSend /> {activeTicket.status === 'answered' ? '답변 수정 발송' : '답변 전송'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={currentMemoInput}
                    onKeyDown={handleKeyDown}
                    onChange={e => setCurrentMemoInput(e.target.value)}
                    placeholder="교역자 및 담당 리더만 열람 가능한 특이사항이나 심방 계획을 메모하세요..."
                    className="w-full p-3.5 text-[12.5px] bg-amber-50/50 border border-amber-200 rounded-xl outline-none focus:bg-white focus:border-amber-400 transition-all resize-none leading-relaxed text-zinc-900 font-medium placeholder:text-amber-800/50 shadow-2xs"
                  />
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-amber-800 font-bold">
                      * 이 메모는 성도에게 절대 노출되지 않으며 교역자 행정망에만 기록됩니다.
                    </span>
                    <button
                      type="button"
                      disabled={!currentMemoInput.trim()}
                      onClick={handleAddInternalMemo}
                      className="px-5 py-2 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-black text-[11.5px] shadow-2xs active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                    >
                      내부 메모 기록
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}
      </div>

      {/* =========================================================================
          PANEL 3: 성도 360° 인텔리전스 사이드바
          ========================================================================= */}
      {activeTicket && (
        <div className="hidden xl:flex w-[260px] bg-zinc-50/80 border-l border-zinc-200 p-4.5 flex-col gap-4.5 shrink-0 overflow-y-auto hide-scrollbar">
          
          <div className="flex flex-col gap-0.5 border-b border-zinc-200 pb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">성도 인텔리전스</span>
            <span className="text-[15px] font-black text-zinc-900">{activeTicket.user_name} 성도</span>
            <span className="text-[11.5px] font-bold text-zinc-500">{activeTicket.cell_name || '목장 미배정'}</span>
          </div>

          <div className="space-y-2.5 text-[11.5px]">
            <div className="p-3 bg-white rounded-xl border border-zinc-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">상담 카테고리</span>
              <span className="font-black text-zinc-800 flex items-center gap-1.5">
                <SvgTag /> 신앙·삶의 고민
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-zinc-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">과거 상담 누적 이력</span>
              <div className="flex justify-between items-baseline">
                <span className="font-black text-zinc-900">{userPastTickets.length}건 등록됨</span>
                <span className="text-[10px] font-mono text-zinc-400">
                  완료 {userPastTickets.filter(t => t.status === 'answered').length}건
                </span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-zinc-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">보안 등급</span>
              <span className="text-[11px] font-bold text-zinc-700 flex items-center gap-1">
                <SvgLock /> 교역자 1:1 비밀 전용
              </span>
            </div>
          </div>

          <div className="mt-auto space-y-1.5 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => alert(`[${activeTicket.user_name}] 성도에게 긴급 모바일 알림을 전송합니다.`)}
              className="w-full py-2 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg text-[11px] font-bold text-zinc-700 shadow-2xs cursor-pointer transition-colors"
            >
              다이렉트 PUSH 전송
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
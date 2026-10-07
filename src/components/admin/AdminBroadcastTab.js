// src/components/admin/AdminBroadcastTab.js
import React, { useState, useMemo } from 'react';

// 엔터프라이즈 모노크롬 SVG 아이콘 세트
const SvgMegaphone = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>;
const SvgSend = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const SvgEdit = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>;
const SvgCopy = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>;
const SvgTrash = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const SvgGlobe = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const SvgShield = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const SvgUsers = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const SvgUser = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const SvgClock = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const SvgSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const IconClose = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

// 자주 쓰는 교회 공지 템플릿 프리셋
const NOTICE_PRESETS = [
  {
    label: '주일 예배 안내',
    scope: 'all',
    title: '[예배 안내] 이번 주일 본당 예배 및 실시간 방송 안내',
    body: '샬롬! 이번 주일 예배는 오전 11시 본당에서 현장 예배로 드려집니다.\n\n• 본당 입장: 10시 30분부터 가능\n• 온라인 실시간 방송: 홈페이지 및 유튜브 채널 동시 송출\n\n은혜로운 주일을 기도로 준비하시기 바랍니다.'
  },
  {
    label: '긴급 기도요청',
    scope: 'all',
    title: '[긴급 중보기도] 환우 및 애경사를 위한 기도 요청',
    body: '사랑하는 성도 여러분, 긴급한 중보기도를 요청드립니다.\n\n• 기도 제목:\n• 요청 내용:\n\n함께 마음을 모아 하나님의 치유와 위로의 손길을 구하는 기도를 부탁드립니다.'
  },
  {
    label: '목자 모임 권면',
    scope: 'shepherds',
    title: '[리더십 공지] 주간 목장 보고서 제출 및 리더 모임 안내',
    body: '목자님들 평안하신지요.\n\n금주 목장 모임 진행 후 주간 목장 보고서를 일요일 저녁 8시까지 제출해 주시기 바랍니다.\n이번 주 월례 리더십 나눔 모임은 수요일 예배 직후 진행됩니다.'
  },
  {
    label: '사역 회비/준비물',
    scope: 'cell',
    title: '[사역 공지] 수련회 회비 납부 및 준비물 점검 안내',
    body: '사역 참여 성도님들께 안내드립니다.\n\n• 회비 납부 기한: 이번 주 금요일까지\n• 개인 준비물: 성경, 필기도구, 세면도구\n\n원활한 진행을 위해 기한 내 확인을 부탁드립니다.'
  }
];

export default function AdminBroadcastTab({
  broadcastScope, setBroadcastScope, cells = [], broadcastCellTarget, setBroadcastCellTarget,
  users = [], broadcastUserTarget, setBroadcastUserTarget, broadcastTitle, setBroadcastTitle,
  broadcastBody, setBroadcastBody, handlePublishNotice, editingNoticeId, setEditingNoticeId,
  noticeList = [], handleEditNotice, handleDeleteNotice
}) {
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyFilterScope, setHistoryFilterScope] = useState('ALL');
  const [noticePriority, setNoticePriority] = useState('NORMAL'); // 'NORMAL' | 'URGENT' | 'PRAYER'

  // 실시간 예상 수신 대상자 수 계산
  const targetAudienceCount = useMemo(() => {
    if (broadcastScope === 'all') return users.length;
    if (broadcastScope === 'shepherds') {
      return users.filter(u => ['목자', '부목자', '간사', '교역자'].includes(u.role) || ['장로', '권사', '안수집사'].includes(u.office)).length;
    }
    if (broadcastScope === 'cell') {
      if (!broadcastCellTarget) return 0;
      return users.filter(u => u.cell_name === broadcastCellTarget || u.department === broadcastCellTarget).length || '목장 배정 인원';
    }
    if (broadcastScope === 'individual') {
      return broadcastUserTarget ? 1 : 0;
    }
    return 0;
  }, [broadcastScope, broadcastCellTarget, broadcastUserTarget, users]);

  const SCOPE_OPTIONS = [
    { id: 'all', label: '전체 성도', desc: '모두에게 발송', icon: <SvgGlobe />, count: `${users.length}명` },
    { id: 'shepherds', label: '리더십', desc: '목자 및 임원', icon: <SvgShield />, count: '핵심 인원' },
    { id: 'cell', label: '특정 목장', desc: '부서별 맞춤', icon: <SvgUsers />, count: cells.length > 0 ? `${cells.length}개 목장` : '목장 선택' },
    { id: 'individual', label: '개별 성도', desc: '1:1 다이렉트', icon: <SvgUser />, count: '지정 1인' }
  ];

  // 템플릿 적용 핸들러
  const handleApplyPreset = (preset) => {
    setBroadcastScope(preset.scope);
    setBroadcastTitle(preset.title);
    setBroadcastBody(preset.body);
  };

  // 복사하여 새 공지로 작성 (Duplicate)
  const handleDuplicateNotice = (item) => {
    setEditingNoticeId(null);
    setBroadcastTitle(`[재발송] ${item.title}`);
    setBroadcastBody(item.content);
    if (item.scope_type) setBroadcastScope(item.scope_type);
    if (item.target_name) {
      if (item.scope_type === 'cell') setBroadcastCellTarget(item.target_name);
      if (item.scope_type === 'individual') setBroadcastUserTarget(item.target_name);
    }
  };

  // 필터링된 발송 이력 목록
  const filteredHistory = useMemo(() => {
    return noticeList.filter(n => {
      const q = historySearchTerm.trim().toLowerCase();
      const matchesSearch = !q || (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q) || (n.scope || '').toLowerCase().includes(q);
      const matchesScope = historyFilterScope === 'ALL' || (n.scope_type || n.scope) === historyFilterScope;
      return matchesSearch && matchesScope;
    });
  }, [noticeList, historySearchTerm, historyFilterScope]);

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden box-border font-sans select-none text-zinc-900">
      
      {/* =========================================================================
          [1] 좌측 패널: 스마트 컴포저 (에디터 & 템플릿 & 실시간 타겟 프리뷰)
          ========================================================================= */}
      <div className="flex-[6.5] bg-white rounded-xl shadow-2xs border border-zinc-200 flex flex-col min-h-0 overflow-hidden relative">
        
        {/* 에디터 헤더 */}
        <div className="px-5 py-3.5 border-b border-zinc-200 flex justify-between items-center bg-zinc-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${editingNoticeId ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-zinc-800 border-zinc-200 shadow-2xs'}`}>
              <SvgMegaphone />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[14.5px] font-black text-zinc-900 tracking-tight">
                  {editingNoticeId ? '공지 수정 및 재배포' : '공지 및 메세지 배포 센터'}
                </h3>
                {/* 실시간 수신 예상 인원수 뱃지 */}
                <span className="font-mono text-[10.5px] font-bold bg-zinc-900 text-white px-2 py-0.5 rounded-full shadow-2xs">
                  수신 예상: {targetAudienceCount}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                지정한 성도의 모바일 기기로 실시간 앱 푸시 및 공지사항이 동기화됩니다.
              </p>
            </div>
          </div>

          {editingNoticeId && (
            <button 
              onClick={() => { setEditingNoticeId(null); setBroadcastTitle(''); setBroadcastBody(''); }} 
              className="text-[11.5px] font-bold text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-100 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer border border-zinc-200 shadow-2xs"
            >
              수정 취소
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar bg-white p-5 space-y-4.5">
          
          {/* 자주 쓰는 교회 맞춤형 공지 템플릿 바 */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10.5px] font-black text-zinc-400 uppercase tracking-wider">
                자주 쓰는 공지 템플릿
              </label>
              <span className="text-[10px] text-zinc-400">클릭 시 자동 서식 완성</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
              {NOTICE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200/80 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
                >
                  ⚡ {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 수신 대상 선택 컨트롤 */}
          <div className="space-y-2">
            <label className="text-[10.5px] font-black text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>수신 대상 지정</span>
              <span className="text-zinc-500 font-mono font-bold">대상: {SCOPE_OPTIONS.find(o => o.id === broadcastScope)?.label}</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {SCOPE_OPTIONS.map(opt => {
                const isActive = broadcastScope === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBroadcastScope(opt.id)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs' 
                        : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-800'
                    }`}
                  >
                    <div className={`mb-1.5 p-1.5 rounded-md ${isActive ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                      {opt.icon}
                    </div>
                    <div className="flex items-baseline justify-between w-full">
                      <span className="text-[12.5px] font-black">{opt.label}</span>
                      <span className={`text-[10px] font-mono ${isActive ? 'text-zinc-300' : 'text-zinc-400'}`}>{opt.count}</span>
                    </div>
                    <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-zinc-400' : 'text-zinc-500'}`}>{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 조건부 대상 선택 드롭다운 */}
          <div className={`transition-all duration-300 overflow-hidden ${['cell', 'individual'].includes(broadcastScope) ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
            {broadcastScope === 'cell' && (
              <select 
                value={broadcastCellTarget} 
                onChange={e => setBroadcastCellTarget(e.target.value)} 
                className="w-full px-3 py-2 text-[12.5px] rounded-lg bg-zinc-50 border border-zinc-200 font-bold text-zinc-800 outline-none focus:bg-white focus:border-zinc-800 transition-all cursor-pointer shadow-2xs"
              >
                <option value="">대상이 될 목장을 선택하세요...</option>
                {cells.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            )}
            {broadcastScope === 'individual' && (
              <select 
                value={broadcastUserTarget} 
                onChange={e => setBroadcastUserTarget(e.target.value)} 
                className="w-full px-3 py-2 text-[12.5px] rounded-lg bg-zinc-50 border border-zinc-200 font-bold text-zinc-800 outline-none focus:bg-white focus:border-zinc-800 transition-all cursor-pointer shadow-2xs"
              >
                <option value="">메세지를 수신할 성도를 선택하세요...</option>
                {users.map(u => <option key={u.name} value={u.name}>{u.name} ({u.office || '성도'} · {u.role})</option>)}
              </select>
            )}
          </div>

          {/* 에디터 폼 */}
          <div className="space-y-3.5 pt-2 border-t border-zinc-100 flex-1 flex flex-col">
            
            {/* 제목 & 긴급도 뱃지 셀렉터 */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10.5px] font-black text-zinc-400 uppercase tracking-wider">
                  메세지 제목
                </label>
                <div className="flex items-center gap-1 text-[10.5px] font-bold">
                  <button 
                    type="button" 
                    onClick={() => setNoticePriority('NORMAL')}
                    className={`px-2 py-0.5 rounded border transition-colors ${noticePriority === 'NORMAL' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 text-zinc-500 border-zinc-200'}`}
                  >
                    일반
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setNoticePriority('URGENT')}
                    className={`px-2 py-0.5 rounded border transition-colors ${noticePriority === 'URGENT' ? 'bg-rose-600 text-white border-rose-600' : 'bg-zinc-50 text-zinc-500 border-zinc-200'}`}
                  >
                    긴급
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setNoticePriority('PRAYER')}
                    className={`px-2 py-0.5 rounded border transition-colors ${noticePriority === 'PRAYER' ? 'bg-amber-600 text-white border-amber-600' : 'bg-zinc-50 text-zinc-500 border-zinc-200'}`}
                  >
                    기도요청
                  </button>
                </div>
              </div>
              <input 
                type="text" 
                placeholder="공지 제목을 명확하게 입력하세요" 
                value={broadcastTitle} 
                onChange={e => setBroadcastTitle(e.target.value)} 
                className="w-full px-3 py-2.5 text-[13px] rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 outline-none focus:bg-white focus:border-zinc-800 transition-all font-bold placeholder:text-zinc-400 shadow-2xs" 
              />
            </div>

            {/* 상세 내용 및 글자 수 카운터 */}
            <div className="space-y-1.5 flex-1 flex flex-col min-h-[220px]">
              <label className="text-[10.5px] font-black text-zinc-400 uppercase tracking-wider">
                상세 본문 내용
              </label>
              <div className="relative flex-1 flex flex-col">
                <textarea 
                  placeholder="성도들에게 전달할 상세 안내 및 권면 메세지를 입력하세요..." 
                  value={broadcastBody} 
                  onChange={e => setBroadcastBody(e.target.value)} 
                  className="flex-1 w-full p-3 text-[12.5px] rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-800 outline-none resize-none leading-relaxed focus:bg-white focus:border-zinc-800 transition-all font-medium placeholder:text-zinc-400 pb-9 shadow-2xs" 
                />
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center px-2 py-1 bg-white rounded-md border border-zinc-200/60 shadow-2xs">
                  <span className="text-[10px] text-zinc-400">
                    줄바꿈 및 특수문자가 모바일 푸시 본문에 그대로 반영됩니다.
                  </span>
                  <span className="text-[10px] font-mono font-bold text-zinc-500">
                    {broadcastBody.length}자 ({new Blob([broadcastBody]).size} bytes)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 액션 바 */}
        <div className="px-5 py-3.5 border-t border-zinc-200 bg-zinc-50 flex flex-col md:flex-row items-center justify-between shrink-0 z-10 gap-2.5">
          <div className="hidden md:flex items-center gap-1.5 text-zinc-500 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 
            푸시 발송망 가동 중 (실시간 암호화 전송)
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button 
              onClick={handlePublishNotice} 
              className="w-full md:w-auto px-6 py-2.5 rounded-lg bg-zinc-900 text-white text-[12.5px] font-black flex items-center justify-center gap-2 shadow-2xs hover:bg-zinc-800 transition-colors active:scale-95 cursor-pointer"
            >
              <SvgSend />
              {editingNoticeId ? '수정 내용 재발송' : '공지 즉시 배포하기'}
            </button>
          </div>
          
          {/* 모바일 바텀시트 토글 */}
          <button
            type="button"
            onClick={() => setShowMobileHistory(!showMobileHistory)}
            className="md:hidden w-full py-2 bg-white border border-zinc-200 text-zinc-700 font-bold text-[11.5px] rounded-lg flex items-center justify-center shadow-2xs"
          >
            발송 기록 아카이브 열기 ({noticeList.length}건)
          </button>
        </div>
      </div>

      {/* =========================================================================
          [2] 우측 패널: 발송 기록 아카이브 (검색 / 복제 작성 기능 탑재)
          ========================================================================= */}
      <div className={`
        fixed inset-x-0 bottom-0 z-[200] max-h-[75vh] bg-white rounded-t-2xl border-t border-zinc-200 shadow-2xl p-4 flex flex-col transition-transform duration-300
        md:relative md:inset-auto md:z-auto md:max-h-none md:flex-[3.5] md:bg-white md:rounded-xl md:border md:border-zinc-200 md:shadow-2xs md:min-h-[400px] md:overflow-hidden md:translate-y-0
        ${showMobileHistory ? 'translate-y-0' : 'translate-y-full md:flex hidden'}
      `}>
        <div className="px-1 md:px-4 py-2 md:py-3.5 md:border-b md:border-zinc-100 flex justify-between items-center shrink-0 mb-2 md:mb-0 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-black tracking-tight text-zinc-900">
              발송 기록 아카이브
            </span>
            <span className="text-[10px] font-mono font-bold bg-zinc-100 text-zinc-500 px-1.5 py-0.2 rounded border border-zinc-200">
              {filteredHistory.length}건
            </span>
          </div>
          <button type="button" onClick={() => setShowMobileHistory(false)} className="md:hidden text-zinc-400 p-1 cursor-pointer bg-zinc-100 rounded-md"><IconClose /></button>
        </div>

        {/* 아카이브 검색창 및 필터 */}
        <div className="p-2 md:px-3 md:py-2 border-b border-zinc-100 bg-zinc-50/70 flex flex-col gap-1.5 shrink-0">
          <div className="relative">
            <span className="absolute left-2.5 top-2 text-zinc-400 pointer-events-none"><SvgSearch /></span>
            <input 
              type="text" 
              placeholder="발송 기록 검색..." 
              value={historySearchTerm} 
              onChange={e => setHistorySearchTerm(e.target.value)} 
              className="w-full pl-7.5 pr-2 py-1 text-[11px] bg-white border border-zinc-200 rounded-md outline-none focus:border-zinc-800 text-zinc-900 font-bold placeholder:text-zinc-400 shadow-2xs" 
            />
          </div>
        </div>
        
        {/* 발송 기록 목록 */}
        <div className="flex-1 overflow-y-auto md:p-3 space-y-2 hide-scrollbar bg-zinc-50/40">
          {filteredHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-400 py-12">
              <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-300">
                <SvgMegaphone />
              </div>
              <span className="text-[12px] font-bold text-zinc-600">발송 내역이 없습니다.</span>
            </div>
          ) : (
            filteredHistory.map(n => (
              <div 
                key={n.id} 
                className="p-3 rounded-xl bg-white border border-zinc-200 hover:border-zinc-400 transition-colors group flex flex-col gap-1.5 shadow-2xs"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9.5px] font-black uppercase px-1.5 py-0.2 rounded border bg-zinc-100 border-zinc-200 text-zinc-700">
                      {n.scope}
                    </span>
                    <span className="text-[9.5px] font-mono text-zinc-400 flex items-center gap-1">
                      <SvgClock /> {n.created_at?.slice(0, 16)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      type="button" 
                      onClick={() => handleDuplicateNotice(n)} 
                      title="이 내용으로 새 공지 작성" 
                      className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
                    >
                      <SvgCopy />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleEditNotice(n)} 
                      title="공지 수정" 
                      className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
                    >
                      <SvgEdit />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteNotice(n.id)} 
                      title="공지 회수 및 삭제" 
                      className="p-1 rounded hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <SvgTrash />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-[12.5px] font-black text-zinc-900 leading-snug truncate">{n.title}</h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed whitespace-pre-wrap line-clamp-2 font-medium mt-0.5">{n.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
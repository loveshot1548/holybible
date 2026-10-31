// src/components/admin/AdminBroadcastTab.js
import React, { useState, useMemo, useCallback } from 'react';

// =====================================================================
// ✒️ 엔터프라이즈 모노크롬 SVG 아이콘 세트 (Linear / Vercel SaaS 규격)
// =====================================================================
const SvgMegaphone = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);
const SvgSend = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const SvgEdit = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);
const SvgCopy = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
  </svg>
);
const SvgTrash = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);
const SvgGlobe = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 shrink-0">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const SvgShield = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const SvgUsers = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const SvgUser = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const SvgClock = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 shrink-0">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const SvgSearch = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);
const IconClose = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const SvgDownload = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);
const SvgEye = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const SvgCheck = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

// =====================================================================
// 📋 자주 쓰는 교회 공지 템플릿 프리셋 (원터치 매크로)
// =====================================================================
const NOTICE_PRESETS = [
  {
    label: '주일 예배 안내',
    scope: 'all',
    priority: 'NORMAL',
    title: '[예배 안내] 이번 주일 본당 예배 및 실시간 방송 안내',
    body: '샬롬! 이번 주일 예배는 오전 11시 본당에서 현장 예배로 드려집니다.\n\n• 본당 입장: 10시 30분부터 가능\n• 온라인 실시간 방송: 홈페이지 및 유튜브 채널 동시 송출\n\n은혜로운 주일을 기도로 준비하시기 바랍니다.'
  },
  {
    label: '긴급 기도요청',
    scope: 'all',
    priority: 'URGENT',
    title: '[긴급 중보기도] 환우 및 애경사를 위한 기도 요청',
    body: '사랑하는 성도 여러분, 긴급한 중보기도를 요청드립니다.\n\n• 기도 대상:\n• 기도 제목:\n\n함께 마음을 모아 하나님의 치유와 위로의 손길을 구하는 기도를 부탁드립니다.'
  },
  {
    label: '목자 모임 권면',
    scope: 'shepherds',
    priority: 'NORMAL',
    title: '[리더십 공지] 주간 목장 보고서 제출 및 리더 모임 안내',
    body: '목자님들 평안하신지요.\n\n금주 목장 모임 진행 후 주간 목장 보고서를 일요일 저녁 8시까지 제출해 주시기 바랍니다.\n이번 주 월례 리더십 나눔 모임은 수요일 예배 직후 진행됩니다.'
  },
  {
    label: '사역 회비/준비물',
    scope: 'cell',
    priority: 'NORMAL',
    title: '[사역 공지] 수련회 회비 납부 및 준비물 점검 안내',
    body: '사역 참여 성도님들께 안내드립니다.\n\n• 회비 납부 기한: 이번 주 금요일까지\n• 개인 준비물: 성경, 필기도구, 세면도구\n\n원활한 진행을 위해 기한 내 확인을 부탁드립니다.'
  },
  {
    label: '금요 성령집회',
    scope: 'all',
    priority: 'PRAYER',
    title: '[집회 안내] 금요 성령 기도의 밤 안내',
    body: '가정과 교회, 다음 세대를 깨우는 금요 기도의 밤이 금요일 저녁 8시 30분 본당에서 진행됩니다.\n\n기도의 불씨를 살리는 은혜의 자리에 성도님들의 많은 동참 바랍니다.'
  }
];

export default function AdminBroadcastTab({
  broadcastScope,
  setBroadcastScope,
  cells = [],
  broadcastCellTarget,
  setBroadcastCellTarget,
  users = [],
  broadcastUserTarget,
  setBroadcastUserTarget,
  broadcastTitle,
  setBroadcastTitle,
  broadcastBody,
  setBroadcastBody,
  handlePublishNotice,
  editingNoticeId,
  setEditingNoticeId,
  noticeList = [],
  handleEditNotice,
  handleDeleteNotice
}) {
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyFilterScope, setHistoryFilterScope] = useState('ALL'); // 'ALL' | 'GLOBAL' | 'LEADERS' | 'TARGET'
  const [noticePriority, setNoticePriority] = useState('NORMAL'); // 'NORMAL' | 'URGENT' | 'PRAYER'

  // 신규 고도화 상태: 모바일 푸시 라이브 프리뷰 토글, 개별 성도 빠른 검색, 아카이브 상세 펼침, 복사 피드백
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [userTargetSearch, setUserTargetSearch] = useState('');
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // 리더십 성도 수 정밀 산출
  const leadershipCount = useMemo(() => {
    return (users || []).filter(
      u =>
        ['목자', '부목자', '간사', '교역자', '목사', '전도사'].includes(u.role) ||
        ['장로', '권사', '안수집사'].includes(u.office)
    ).length;
  }, [users]);

  // 실시간 예상 수신 대상자 수 계산
  const targetAudienceCount = useMemo(() => {
    if (broadcastScope === 'all') return `${users.length}명`;
    if (broadcastScope === 'shepherds') return `${leadershipCount}명`;
    if (broadcastScope === 'cell') {
      if (!broadcastCellTarget) return '목장 미선택';
      const cnt = (users || []).filter(
        u => u.cell_name === broadcastCellTarget || u.department === broadcastCellTarget
      ).length;
      return cnt > 0 ? `${cnt}명` : '목장원 전체';
    }
    if (broadcastScope === 'individual') {
      return broadcastUserTarget ? '1명 (지정)' : '성도 미선택';
    }
    return '0명';
  }, [broadcastScope, broadcastCellTarget, broadcastUserTarget, users, leadershipCount]);

  const SCOPE_OPTIONS = useMemo(
    () => [
      { id: 'all', label: '전체 성도', desc: '교인 전체 발송', icon: <SvgGlobe />, count: `${users.length}명` },
      { id: 'shepherds', label: '리더십', desc: '목자 및 직분자', icon: <SvgShield />, count: `${leadershipCount}명` },
      { id: 'cell', label: '특정 목장', desc: '목장·부서 맞춤', icon: <SvgUsers />, count: `${cells.length}개 목장` },
      { id: 'individual', label: '개별 성도', desc: '1:1 다이렉트', icon: <SvgUser />, count: '지정 1인' }
    ],
    [users.length, leadershipCount, cells.length]
  );

  // 개별 성도 드롭다운 검색 필터링
  const filteredTargetUsers = useMemo(() => {
    const q = userTargetSearch.trim().toLowerCase();
    if (!q) return users;
    return (users || []).filter(
      u =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.office || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q) ||
        (u.cell_name || '').toLowerCase().includes(q)
    );
  }, [users, userTargetSearch]);

  // 긴급도 변경 시 제목 말머리 자동 동기화
  const handlePriorityChange = (prio) => {
    setNoticePriority(prio);
    const cleanTitle = (broadcastTitle || '')
      .replace(/^\[(긴급|긴급공지|중보기도|기도요청)\]\s*/g, '')
      .trim();

    if (prio === 'URGENT') {
      setBroadcastTitle(`[긴급] ${cleanTitle}`);
    } else if (prio === 'PRAYER') {
      setBroadcastTitle(`[기도요청] ${cleanTitle}`);
    } else {
      setBroadcastTitle(cleanTitle);
    }
  };

  // 템플릿 적용 핸들러
  const handleApplyPreset = (preset) => {
    setBroadcastScope(preset.scope);
    setNoticePriority(preset.priority || 'NORMAL');
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
    setShowMobileHistory(false);
  };

  // 클립보드에 공지 전문 복사 (카카오톡/문자 공유용)
  const handleCopyClipboard = (item, e) => {
    if (e) e.stopPropagation();
    const textToCopy = `${item.title}\n\n${item.content}\n\n- 발송대상: ${item.scope || '전체'} (${item.created_at?.slice(0, 16) || ''})`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).catch(() => {});
    }
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // 필터링된 발송 이력 목록
  const filteredHistory = useMemo(() => {
    return (noticeList || []).filter(n => {
      const q = historySearchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (n.title || '').toLowerCase().includes(q) ||
        (n.content || '').toLowerCase().includes(q) ||
        (n.scope || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (historyFilterScope === 'ALL') return true;

      const rawScope = String(n.scope_type || n.scope || '').toLowerCase();
      if (historyFilterScope === 'GLOBAL') {
        return rawScope === 'all' || rawScope.includes('전체');
      }
      if (historyFilterScope === 'LEADERS') {
        return rawScope === 'shepherds' || rawScope.includes('리더') || rawScope.includes('목자');
      }
      if (historyFilterScope === 'TARGET') {
        return (
          rawScope === 'cell' ||
          rawScope === 'individual' ||
          (!rawScope.includes('전체') && !rawScope.includes('리더') && rawScope !== 'all' && rawScope !== 'shepherds')
        );
      }
      return true;
    });
  }, [noticeList, historySearchTerm, historyFilterScope]);

  // 발송 이력 CSV 추출
  const handleExportHistoryCSV = useCallback(() => {
    if (!filteredHistory || filteredHistory.length === 0) return;
    const headers = ['No', '발송일시', '수신범위', '공지제목', '본문내용'];
    const rows = filteredHistory.map((item, idx) => [
      idx + 1,
      `"${(item.created_at || '').replace(/"/g, '""')}"`,
      `"${(item.scope || '전체').replace(/"/g, '""')}"`,
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${(item.content || '').replace(/\n/g, ' ').replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `공지발송기록_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredHistory]);

  const currentScopeLabel = useMemo(() => {
    if (broadcastScope === 'all') return '전체 성도';
    if (broadcastScope === 'shepherds') return '리더십 전용';
    if (broadcastScope === 'cell') return broadcastCellTarget ? `${broadcastCellTarget} 목장` : '특정 목장';
    if (broadcastScope === 'individual') return broadcastUserTarget ? `${broadcastUserTarget} 성도` : '개별 성도';
    return '전체 성도';
  }, [broadcastScope, broadcastCellTarget, broadcastUserTarget]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-3.5 min-h-0 overflow-hidden box-border font-sans select-none text-zinc-900 bg-[#FAFAFA] p-1 sm:p-2">
      
      {/* =========================================================================
          [1] 좌측 메인 패널: 스마트 공지 컴포저 & 모바일 푸시 라이브 프리뷰 (6.5 Cols)
          ========================================================================= */}
      <div className="flex-[6.5] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-zinc-200/90 flex flex-col min-h-0 overflow-hidden relative">
        
        {/* 에디터 상단 헤더 (줄바꿈 방지 완료) */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-zinc-200/90 flex flex-wrap justify-between items-center gap-2 bg-zinc-50/70 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 transition-colors ${
                editingNoticeId
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
              }`}
            >
              <SvgMegaphone />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[14.5px] font-black text-zinc-900 tracking-tight whitespace-nowrap">
                  {editingNoticeId ? '공지 수정 및 재배포' : '공지 및 메세지 배포 센터'}
                </h3>
                <span className="font-mono text-[10.5px] font-bold bg-zinc-900 text-white px-2 py-0.5 rounded-md shadow-2xs whitespace-nowrap tabular-nums">
                  수신 대상: {targetAudienceCount}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium mt-0.5 truncate">
                지정한 코호트의 모바일 기기로 실시간 인앱 알림 및 공지사항이 동기화됩니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* 실시간 모바일 푸시 미리보기 토글 */}
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                showLivePreview
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                  : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100 shadow-2xs'
              }`}
            >
              <SvgEye /> {showLivePreview ? '미리보기 닫기' : '모바일 미리보기'}
            </button>

            {editingNoticeId && (
              <button 
                type="button"
                onClick={() => {
                  setEditingNoticeId(null);
                  setBroadcastTitle('');
                  setBroadcastBody('');
                }} 
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer border border-rose-200 whitespace-nowrap"
              >
                수정 취소 ✕
              </button>
            )}
          </div>
        </div>

        {/* 컴포저 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto hide-scrollbar bg-white p-4 sm:p-5 space-y-4">
          
          {/* 1. 자주 쓰는 교회 맞춤형 공지 템플릿 바 */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center whitespace-nowrap">
              <label className="text-[10.5px] font-black text-zinc-400 uppercase tracking-wider">
                QUICK TEMPLATES (자주 쓰는 공지 프리셋)
              </label>
              <span className="text-[10px] font-mono text-zinc-400">원터치 서식 자동 입력</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
              {NOTICE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-zinc-50 hover:bg-zinc-900 hover:text-white text-zinc-700 border border-zinc-200/90 transition-all whitespace-nowrap cursor-pointer shadow-2xs shrink-0"
                >
                  + {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 수신 대상 코호트 지정 (4-Grid Cards) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between whitespace-nowrap">
              <label className="text-[10.5px] font-black text-zinc-400 uppercase tracking-wider">
                TARGET COHORT (수신 범위 설정)
              </label>
              <span className="text-[11px] text-zinc-700 font-mono font-bold tabular-nums">
                선택됨: <b className="text-zinc-950">{currentScopeLabel}</b>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SCOPE_OPTIONS.map(opt => {
                const isActive = broadcastScope === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBroadcastScope(opt.id)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-zinc-900 border-zinc-900 text-white shadow-sm' 
                        : 'bg-white border-zinc-200/90 hover:border-zinc-400 hover:bg-zinc-50/60 text-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <div className={`p-1.5 rounded-lg ${isActive ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-700'}`}>
                        {opt.icon}
                      </div>
                      <span className={`text-[10px] font-mono font-bold whitespace-nowrap tabular-nums ${isActive ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {opt.count}
                      </span>
                    </div>
                    <span className="text-[12.5px] font-black whitespace-nowrap">{opt.label}</span>
                    <span className={`text-[10px] mt-0.5 font-medium whitespace-nowrap ${isActive ? 'text-zinc-400' : 'text-zinc-400'}`}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 조건부 세부 타겟 선택기 (목장 선택 / 개별 성도 검색+선택) */}
          {broadcastScope === 'cell' && (
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/90 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-600 whitespace-nowrap">
                <span>수신할 목장 선택</span>
                <span className="font-mono text-[10px] text-zinc-400">총 {cells.length}개 목장</span>
              </div>
              <select 
                value={broadcastCellTarget} 
                onChange={e => setBroadcastCellTarget(e.target.value)} 
                className="w-full px-3 py-2 text-[12.5px] rounded-lg bg-white border border-zinc-300 font-bold text-zinc-900 outline-none focus:border-zinc-900 transition-all cursor-pointer shadow-2xs"
              >
                <option value="">대상이 될 목장을 선택하세요...</option>
                {cells.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name} {c.shepherd_name ? `(목자: ${c.shepherd_name})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {broadcastScope === 'individual' && (
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/90 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-zinc-600 whitespace-nowrap">
                  1:1 다이렉트 수신 성도 지정
                </span>
                <div className="relative w-48">
                  <span className="absolute left-2.5 top-1.5 text-zinc-400"><SvgSearch /></span>
                  <input
                    type="text"
                    value={userTargetSearch}
                    onChange={e => setUserTargetSearch(e.target.value)}
                    placeholder="이름·직분 빠른 검색..."
                    className="w-full pl-7 pr-2 py-1 text-[11px] bg-white border border-zinc-200 rounded-md outline-none focus:border-zinc-900 font-medium"
                  />
                </div>
              </div>
              <select 
                value={broadcastUserTarget} 
                onChange={e => setBroadcastUserTarget(e.target.value)} 
                className="w-full px-3 py-2 text-[12.5px] rounded-lg bg-white border border-zinc-300 font-bold text-zinc-900 outline-none focus:border-zinc-900 transition-all cursor-pointer shadow-2xs"
              >
                <option value="">메세지를 수신할 성도를 선택하세요 ({filteredTargetUsers.length}명)...</option>
                {filteredTargetUsers.map(u => (
                  <option key={u.name} value={u.name}>
                    {u.name} ({u.office || '성도'} · {u.role || '일반'}{u.cell_name ? ` · ${u.cell_name}` : ''})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 4. 실시간 모바일 푸시 & 인앱 공지 카드 라이브 프리뷰 (토글 시 표시) */}
          {showLivePreview && (
            <div className="p-3.5 rounded-2xl bg-zinc-900 text-white border border-zinc-800 space-y-2.5 animate-fade-in shadow-inner">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 border-b border-zinc-800 pb-1.5 whitespace-nowrap">
                <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  MOBILE PUSH & IN-APP PREVIEW
                </span>
                <span>수신 범위: {currentScopeLabel} ({targetAudienceCount})</span>
              </div>
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white text-zinc-900 whitespace-nowrap">
                    {currentScopeLabel}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 whitespace-nowrap">방금 전</span>
                </div>
                <p className="text-[13px] font-black text-white truncate pt-0.5">
                  {broadcastTitle || '공지 제목이 여기에 표시됩니다'}
                </p>
                <p className="text-[11.5px] text-zinc-300 leading-relaxed whitespace-pre-wrap line-clamp-3">
                  {broadcastBody || '입력하신 상세 본문 내용이 성도들의 모바일 알림창과 공지 피드에 이 형태로 표시됩니다.'}
                </p>
              </div>
            </div>
          )}

          {/* 5. 공지 제목 & 본문 에디터 폼 */}
          <div className="space-y-3.5 pt-2 border-t border-zinc-100 flex-1 flex flex-col">
            
            {/* 제목 & 말머리 태그 셀렉터 */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center gap-2 flex-wrap">
                <label className="text-[10.5px] font-black text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                  MESSAGE SUBJECT (공지 제목)
                </label>
                <div className="flex items-center gap-1 text-[10.5px] font-bold shrink-0">
                  <button 
                    type="button" 
                    onClick={() => handlePriorityChange('NORMAL')}
                    className={`px-2 py-0.5 rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                      noticePriority === 'NORMAL'
                        ? 'bg-zinc-900 text-white border-zinc-900 font-black'
                        : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:text-zinc-800'
                    }`}
                  >
                    일반 공지
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handlePriorityChange('URGENT')}
                    className={`px-2 py-0.5 rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                      noticePriority === 'URGENT'
                        ? 'bg-rose-600 text-white border-rose-600 font-black'
                        : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:text-rose-600'
                    }`}
                  >
                    긴급 말머리
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handlePriorityChange('PRAYER')}
                    className={`px-2 py-0.5 rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                      noticePriority === 'PRAYER'
                        ? 'bg-amber-600 text-white border-amber-600 font-black'
                        : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:text-amber-600'
                    }`}
                  >
                    기도요청 말머리
                  </button>
                </div>
              </div>
              <input 
                type="text" 
                placeholder="공지 제목을 명확하게 입력하세요..." 
                value={broadcastTitle} 
                onChange={e => setBroadcastTitle(e.target.value)} 
                className="w-full px-3.5 py-2.5 text-[13px] rounded-xl bg-zinc-50/70 border border-zinc-200 text-zinc-900 outline-none focus:bg-white focus:border-zinc-900 transition-all font-bold placeholder:text-zinc-400 shadow-2xs" 
              />
            </div>

            {/* 상세 내용 및 글자 수 / 바이트 카운터 */}
            <div className="space-y-1.5 flex-1 flex flex-col min-h-[210px]">
              <div className="flex justify-between items-center whitespace-nowrap">
                <label className="text-[10.5px] font-black text-zinc-400 uppercase tracking-wider">
                  MESSAGE BODY (상세 본문 내용)
                </label>
                {(broadcastTitle || broadcastBody) && (
                  <button
                    type="button"
                    onClick={() => {
                      setBroadcastTitle('');
                      setBroadcastBody('');
                      setNoticePriority('NORMAL');
                    }}
                    className="text-[10px] font-bold text-zinc-400 hover:text-rose-600 cursor-pointer transition-colors"
                  >
                    본문 초기화 ↺
                  </button>
                )}
              </div>
              <div className="relative flex-1 flex flex-col">
                <textarea 
                  placeholder="성도들에게 전달할 상세 안내 및 권면 메세지를 입력하세요..." 
                  value={broadcastBody} 
                  onChange={e => setBroadcastBody(e.target.value)} 
                  className="flex-1 w-full p-3.5 text-[12.5px] rounded-xl bg-zinc-50/70 border border-zinc-200 text-zinc-800 outline-none resize-none leading-relaxed focus:bg-white focus:border-zinc-900 transition-all font-medium placeholder:text-zinc-400 pb-10 shadow-2xs" 
                />
                <div className="absolute bottom-2 left-2.5 right-2.5 flex justify-between items-center px-2.5 py-1 bg-white/95 backdrop-blur-xs rounded-lg border border-zinc-200/80 shadow-2xs whitespace-nowrap">
                  <span className="text-[10px] text-zinc-400 truncate pr-2">
                    줄바꿈 및 기호가 모바일 알림 본문에 1:1 반영됩니다.
                  </span>
                  <span className="text-[10px] font-mono font-bold text-zinc-600 tabular-nums shrink-0">
                    {(broadcastBody || '').length}자 · {new Blob([broadcastBody || '']).size} B
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 액션 바 */}
        <div className="px-4 sm:px-5 py-3.5 border-t border-zinc-200/90 bg-zinc-50/80 flex flex-col sm:flex-row items-center justify-between shrink-0 z-10 gap-2.5">
          <div className="hidden sm:flex items-center gap-2 text-zinc-500 text-[11px] font-bold whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> 
            <span>실시간 푸시 발송망 정상 가동 중</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowMobileHistory(!showMobileHistory)}
              className="lg:hidden flex-1 py-2.5 px-3 bg-white border border-zinc-300 text-zinc-800 font-bold text-[12px] rounded-xl flex items-center justify-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
            >
              발송 기록 ({noticeList.length}건)
            </button>

            <button 
              type="button"
              onClick={handlePublishNotice} 
              className="flex-[2] sm:flex-initial px-6 py-2.5 rounded-xl bg-zinc-900 text-white text-[12.5px] font-black flex items-center justify-center gap-2 shadow-sm hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <SvgSend />
              {editingNoticeId ? '수정 내용 재배포하기' : `${currentScopeLabel}에게 즉시 배포`}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          [2] 우측 패널: 발송 기록 아카이브 (분류 탭 · 클립보드 복사 · CSV 백업 탑재)
          ========================================================================= */}
      <div
        className={`
          fixed inset-x-0 bottom-0 z-[200] max-h-[80vh] bg-white rounded-t-3xl border-t border-zinc-300 shadow-[0_-20px_60px_rgba(0,0,0,0.18)] p-4 flex flex-col transition-transform duration-300
          lg:relative lg:inset-auto lg:z-auto lg:max-h-none lg:flex-[3.5] lg:bg-white lg:rounded-2xl lg:border lg:border-zinc-200/90 lg:shadow-[0_1px_3px_rgba(0,0,0,0.03)] lg:p-0 lg:min-h-[400px] lg:overflow-hidden lg:translate-y-0
          ${showMobileHistory ? 'translate-y-0' : 'translate-y-full lg:flex hidden'}
        `}
      >
        {/* 아카이브 상단 헤더 */}
        <div className="px-1 lg:px-4 py-2 lg:py-3.5 lg:border-b lg:border-zinc-200/90 flex justify-between items-center gap-2 shrink-0 mb-2 lg:mb-0 bg-zinc-50/70">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[14px] font-black tracking-tight text-zinc-900 whitespace-nowrap">
              발송 기록 아카이브
            </span>
            <span className="text-[10.5px] font-mono font-bold bg-white text-zinc-700 px-2 py-0.5 rounded-md border border-zinc-200 shadow-2xs whitespace-nowrap tabular-nums">
              {filteredHistory.length}/{noticeList.length}건
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleExportHistoryCSV}
              disabled={filteredHistory.length === 0}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-white text-[10.5px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs transition-all"
              title="발송 이력 CSV 백업"
            >
              <SvgDownload /> CSV
            </button>
            <button
              type="button"
              onClick={() => setShowMobileHistory(false)}
              className="lg:hidden text-zinc-500 hover:text-zinc-900 p-1.5 cursor-pointer bg-zinc-100 rounded-lg"
            >
              <IconClose />
            </button>
          </div>
        </div>

        {/* 아카이브 카테고리 필터 탭 & 검색창 */}
        <div className="p-2 lg:px-3.5 lg:py-2.5 border-b border-zinc-100 bg-white flex flex-col gap-2 shrink-0">
          <div className="grid grid-cols-4 gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/70 text-[10.5px] font-bold">
            {[
              { id: 'ALL', label: '전체' },
              { id: 'GLOBAL', label: '전체성도' },
              { id: 'LEADERS', label: '리더십' },
              { id: 'TARGET', label: '목장/개별' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setHistoryFilterScope(tab.id)}
                className={`py-1 rounded-md transition-all whitespace-nowrap cursor-pointer text-center ${
                  historyFilterScope === tab.id
                    ? 'bg-white text-zinc-950 shadow-2xs font-black'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="absolute left-2.5 top-2 text-zinc-400 pointer-events-none"><SvgSearch /></span>
            <input 
              type="text" 
              placeholder="제목, 본문, 수신 대상 검색..." 
              value={historySearchTerm} 
              onChange={e => setHistorySearchTerm(e.target.value)} 
              className="w-full pl-8 pr-6 py-1.5 text-[11.5px] bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:bg-white focus:border-zinc-900 text-zinc-900 font-medium placeholder:text-zinc-400 transition-all" 
            />
            {historySearchTerm && (
              <button
                type="button"
                onClick={() => setHistorySearchTerm('')}
                className="absolute right-2 top-1.5 text-[11px] text-zinc-400 hover:text-zinc-800 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        
        {/* 발송 기록 카드 리스트 */}
        <div className="flex-1 overflow-y-auto p-1 lg:p-3.5 space-y-2.5 hide-scrollbar bg-zinc-50/40">
          {filteredHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-400 py-14">
              <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-300 shadow-2xs">
                <SvgMegaphone />
              </div>
              <span className="text-[12px] font-bold text-zinc-500">조회된 발송 내역이 없습니다.</span>
            </div>
          ) : (
            filteredHistory.map(n => {
              const isExpanded = expandedHistoryId === n.id;
              const isCopied = copiedId === n.id;
              const isEditingThis = editingNoticeId === n.id;

              return (
                <div 
                  key={n.id} 
                  onClick={() => setExpandedHistoryId(isExpanded ? null : n.id)}
                  className={`p-3.5 rounded-xl bg-white border transition-all group flex flex-col gap-2 shadow-2xs cursor-pointer ${
                    isEditingThis
                      ? 'border-amber-400 ring-1 ring-amber-400 bg-amber-50/20'
                      : 'border-zinc-200/90 hover:border-zinc-400'
                  }`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md border bg-zinc-100 border-zinc-200 text-zinc-800 whitespace-nowrap">
                        {n.scope || '전체'}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1 whitespace-nowrap tabular-nums">
                        <SvgClock /> {n.created_at?.slice(0, 16)}
                      </span>
                    </div>

                    {/* 액션 툴바 (클립보드 복사 / 재발송 복제 / 수정 / 삭제) */}
                    <div
                      className="flex items-center gap-0.5 shrink-0"
                      onClick={e => e.stopPropagation()}
                    >
                      <button 
                        type="button" 
                        onClick={(e) => handleCopyClipboard(n, e)} 
                        title="공지 전문 클립보드 복사 (카톡/문자 공유용)" 
                        className={`px-1.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
                        }`}
                      >
                        {isCopied ? <><SvgCheck /> 복사됨</> : <SvgCopy />}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDuplicateNotice(n)} 
                        title="이 내용으로 새 공지 작성 (재발송)" 
                        className="px-1.5 py-1 rounded-md hover:bg-zinc-100 text-[10px] font-bold text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        재사용
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          handleEditNotice(n);
                          setShowMobileHistory(false);
                        }} 
                        title="공지 수정" 
                        className="p-1 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
                      >
                        <SvgEdit />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteNotice(n.id)} 
                        title="공지 회수 및 삭제" 
                        className="p-1 rounded-md hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <SvgTrash />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[12.5px] font-black text-zinc-900 leading-snug break-keep">
                      {n.title}
                    </h4>
                    <p
                      className={`text-[11.5px] text-zinc-600 leading-relaxed whitespace-pre-wrap font-medium mt-1 ${
                        isExpanded ? '' : 'line-clamp-2'
                      }`}
                    >
                      {n.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
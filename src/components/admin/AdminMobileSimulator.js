// src/components/admin/AdminMobileSimulator.js
import React, { useState, useMemo, useCallback } from 'react';

// =====================================================================
// ✒️ 엔터프라이즈 모노크롬 SVG 아이콘 세트 (Linear / Vercel SaaS 규격)
// =====================================================================
const SvgMobile = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 shrink-0">
    <rect x="5" y="2" width="14" height="20" rx="3" />
    <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth={3} strokeLinecap="round" />
  </svg>
);
const SvgClose = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.3} stroke="currentColor" className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const SvgUsers = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);
const SvgMegaphone = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);
const SvgSend = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IconChevronLeft = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconChevronRight = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const SvgSearch = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);
const SvgCheck = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);
const SvgCopy = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
  </svg>
);

// 모바일 현장 공지 원클릭 템플릿 프리셋
const MOBILE_NOTICE_PRESETS = [
  {
    label: '목장 모임 장소',
    title: '금주 목장 모임 시간 및 장소 안내',
    body: '사랑하는 목원 여러분, 이번 주일 대예배 직후 지정된 모임 장소에서 목장 나눔이 진행됩니다. 한 주간 받은 은혜와 감사 제목을 함께 나누길 소망합니다.'
  },
  {
    label: '주일 애찬 교제',
    title: '주일 식사 및 티타임 교제 안내',
    body: '오늘 예배 후 함께 식사하며 따뜻한 교제를 나누고자 합니다. 빠짐없이 참석해 주시기 바랍니다.'
  },
  {
    label: '중보기도 요청',
    title: '목장 가족을 위한 긴급 중보기도 요청',
    body: '우리 목장 지체의 건강과 가정의 평안을 위해 오늘 저녁 각자의 처소에서 합심하여 기도해 주시기를 부탁드립니다.'
  },
  {
    label: '심방 일정 안내',
    title: '이번 주간 가정 및 일터 심방 안내',
    body: '금주 중 교역자 및 목자 동행 심방이 진행될 예정입니다. 기도로 준비해 주시고 가능한 일정을 회신해 주시기 바랍니다.'
  }
];

export default function AdminMobileSimulator({
  currentWeek,
  users = [],
  attendance = [],
  noticeList = [],
  cells = [],
  cellMembers = [],
  setNoticeList,
  handleToggleAttendance,
  setSelectedWeekOffset,
  setSelectedUserProfile,
  onClose
}) {
  const [simTab, setSimTab] = useState('attendance'); // 'attendance' | 'notices' | 'sendNotice'
  const [simNoticeTitle, setSimNoticeTitle] = useState('');
  const [simNoticeBody, setSimNoticeBody] = useState('');

  // 고도화 상태: 목장 필터, 성도 검색, 출결 상태 필터, 공지 타겟 목장, 복사/전송 피드백
  const [selectedCellFilter, setSelectedCellFilter] = useState('ALL');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [attFilterMode, setAttFilterMode] = useState('ALL'); // 'ALL' | 'SUN_PRESENT' | 'SUN_ABSENT'
  const [targetNoticeCell, setTargetNoticeCell] = useState(() => cells[0]?.name || '전체 공지');
  const [noticeSearchQuery, setNoticeSearchQuery] = useState('');
  const [copiedNoticeId, setCopiedNoticeId] = useState(null);
  const [toastFeedback, setToastFeedback] = useState(null);

  const triggerToast = useCallback((msg) => {
    setToastFeedback(msg);
    setTimeout(() => setToastFeedback(null), 2200);
  }, []);

  // 성도별 소속 목장 매핑 사전
  const userToCellNameMap = useMemo(() => {
    const map = new Map();
    (cellMembers || []).forEach(m => {
      const foundCell = (cells || []).find(c => String(c.id) === String(m.cell_id));
      if (foundCell && m.user_name) {
        map.set(m.user_name.trim(), foundCell.name);
      }
    });
    return map;
  }, [cellMembers, cells]);

  const handleWeeklyToggle = (userName, cellName, type, currentStatus) => {
    const targetDate =
      type === '수요'
        ? currentWeek?.wedStr
        : type === '금요'
        ? currentWeek?.friStr
        : currentWeek?.sunStr;
    if (handleToggleAttendance) {
      handleToggleAttendance(targetDate, userName, cellName, type, currentStatus);
    }
  };

  // 성도별 4대 예배(수요·금요·주일·목장) 출결 상태 및 필터링 데이터 산출
  const enrichedUsers = useMemo(() => {
    const wedStr = currentWeek?.wedStr;
    const friStr = currentWeek?.friStr;
    const sunStr = currentWeek?.sunStr;
    const weekDates = currentWeek?.dates || [];

    return (users || []).map(u => {
      const trimmedName = (u.name || '').trim();
      const realCellName =
        userToCellNameMap.get(trimmedName) || u.cell_name || cells[0]?.name || '미배정';

      const stWed =
        (attendance || []).find(
          a => (a.user_name || '').trim() === trimmedName && a.date === wedStr && a.type === '수요'
        )?.status || '결석';

      const stFri =
        (attendance || []).find(
          a => (a.user_name || '').trim() === trimmedName && a.date === friStr && a.type === '금요'
        )?.status || '결석';

      const stSun =
        (attendance || []).find(
          a =>
            (a.user_name || '').trim() === trimmedName &&
            a.date === sunStr &&
            (a.type === '주일' || a.type === '주일예배')
        )?.status || '결석';

      const stCell =
        (attendance || []).find(
          a =>
            (a.user_name || '').trim() === trimmedName &&
            (a.type === '목장' || a.type === '목장모임') &&
            (a.date === sunStr || weekDates.some(d => d.full === a.date))
        )?.status || '결석';

      const presentCount = [stWed, stFri, stSun, stCell].filter(s => s === '출석').length;

      return {
        ...u,
        realCellName,
        stWed,
        stFri,
        stSun,
        stCell,
        presentCount
      };
    });
  }, [users, userToCellNameMap, cells, attendance, currentWeek]);

  // 목장 필터 + 검색어 + 출결 상태 필터 적용
  const filteredUsers = useMemo(() => {
    const q = memberSearchQuery.trim().toLowerCase();
    return enrichedUsers.filter(u => {
      if (selectedCellFilter !== 'ALL' && u.realCellName !== selectedCellFilter) return false;
      if (attFilterMode === 'SUN_PRESENT' && u.stSun !== '출석') return false;
      if (attFilterMode === 'SUN_ABSENT' && u.stSun === '출석') return false;
      if (!q) return true;
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.office || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q) ||
        (u.realCellName || '').toLowerCase().includes(q)
      );
    });
  }, [enrichedUsers, selectedCellFilter, attFilterMode, memberSearchQuery]);

  // 현재 필터된 코호트의 4대 모임 출석 통계 집계
  const cohortStats = useMemo(() => {
    const baseList =
      selectedCellFilter === 'ALL'
        ? enrichedUsers
        : enrichedUsers.filter(u => u.realCellName === selectedCellFilter);
    const total = baseList.length || 1;
    const wedCnt = baseList.filter(u => u.stWed === '출석').length;
    const friCnt = baseList.filter(u => u.stFri === '출석').length;
    const sunCnt = baseList.filter(u => u.stSun === '출석').length;
    const cellCnt = baseList.filter(u => u.stCell === '출석').length;

    return {
      totalCount: baseList.length,
      wedCnt,
      friCnt,
      sunCnt,
      cellCnt,
      sunRate: baseList.length > 0 ? Math.round((sunCnt / total) * 100) : 0,
      cellRate: baseList.length > 0 ? Math.round((cellCnt / total) * 100) : 0
    };
  }, [enrichedUsers, selectedCellFilter]);

  // 현재 화면에 표시된 미출석 성도 일괄 출석 처리 (주일 / 목장)
  const handleBatchMarkPresent = (targetType) => {
    const targetDate =
      targetType === '수요'
        ? currentWeek?.wedStr
        : targetType === '금요'
        ? currentWeek?.friStr
        : currentWeek?.sunStr;

    const targets = filteredUsers.filter(u => {
      if (targetType === '주일') return u.stSun !== '출석';
      if (targetType === '목장') return u.stCell !== '출석';
      return false;
    });

    if (targets.length === 0) {
      triggerToast(`이미 모든 성도가 [${targetType}] 출석 완료 상태입니다.`);
      return;
    }

    targets.forEach(u => {
      if (handleToggleAttendance) {
        handleToggleAttendance(targetDate, u.name, u.realCellName, targetType, '결석');
      }
    });
    triggerToast(`${targets.length}명의 성도를 [${targetType} 출석]으로 일괄 반영했습니다.`);
  };

  // 현장 공지 발송 핸들러 (원본 스토리지 이벤트 100% 유지)
  const handleSimCellNoticeSend = () => {
    if (!simNoticeTitle.trim() || !simNoticeBody.trim()) {
      return alert('공지 제목과 상세 내용을 입력해주세요.');
    }
    const targetCell =
      targetNoticeCell && targetNoticeCell !== '전체 공지'
        ? targetNoticeCell
        : cells[0]?.name || '임시 목장';
    const scopeLabel =
      targetNoticeCell === '전체 공지' ? '전체 공지' : `${targetCell} 공지`;
    const fullText = `[공지] ${simNoticeTitle.trim()}\n${simNoticeBody.trim()}`;
    const newNotice = {
      id: Date.now(),
      scope: scopeLabel,
      title: simNoticeTitle.trim(),
      content: simNoticeBody.trim(),
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    if (setNoticeList) {
      setNoticeList(prev => [newNotice, ...(prev || [])]);
    }
    localStorage.setItem('admin_notices', JSON.stringify([newNotice, ...(noticeList || [])]));
    localStorage.setItem(`cell_notice_${targetCell}`, fullText);
    window.dispatchEvent(new Event('storage'));
    setSimNoticeTitle('');
    setSimNoticeBody('');
    triggerToast(`[${scopeLabel}] 알림이 즉시 배포되었습니다.`);
    setSimTab('notices');
  };

  // 수신 공지 검색 필터
  const filteredNotices = useMemo(() => {
    const q = noticeSearchQuery.trim().toLowerCase();
    if (!q) return noticeList;
    return (noticeList || []).filter(
      n =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.content || '').toLowerCase().includes(q) ||
        (n.scope || '').toLowerCase().includes(q)
    );
  }, [noticeList, noticeSearchQuery]);

  const handleCopyNotice = (n) => {
    const text = `${n.title}\n\n${n.content}\n(${n.scope} · ${n.created_at})`;
    navigator.clipboard?.writeText?.(text).catch(() => {});
    setCopiedNoticeId(n.id);
    setTimeout(() => setCopiedNoticeId(null), 1800);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#FAFAFA] select-none overflow-hidden relative font-sans text-zinc-900">
      <div className="w-full h-full flex flex-col overflow-hidden relative">
        
        {/* 실시간 액션 피드백 토스트 */}
        {toastFeedback && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[300] px-3.5 py-2 rounded-xl bg-zinc-900 text-white text-[11.5px] font-bold shadow-xl border border-white/15 flex items-center gap-1.5 animate-fade-in whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{toastFeedback}</span>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 1. 상단 모바일 시뮬레이터 헤더 (줄바꿈 0% 보장)                        */}
        {/* ===================================================================== */}
        <header className="px-4 py-3 border-b border-zinc-200/90 bg-white text-zinc-900 flex items-center justify-between gap-2 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.03)] z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <SvgMobile />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-[14px] font-black tracking-tight text-zinc-900">
                  모바일 현장 지원실
                </span>
                <span className="text-[9.5px] font-mono font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                  SYNC
                </span>
              </div>
              <span className="text-[10.5px] font-mono font-bold text-zinc-500 block whitespace-nowrap tabular-nums">
                {currentWeek?.rangeShort} ({cohortStats.totalCount}명 관제중)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 cursor-pointer rounded-lg hover:bg-zinc-100 transition-colors border border-zinc-200/80 shrink-0"
            title="지원실 닫기"
          >
            <SvgClose />
          </button>
        </header>

        {/* ===================================================================== */}
        {/* 2. 3대 기능 탭 네비게이션 (출석부 / 공지함 / 현장발송)                 */}
        {/* ===================================================================== */}
        <div className="px-3 py-2 bg-white border-b border-zinc-200/90 shrink-0 z-10">
          <div className="grid grid-cols-3 gap-1 bg-zinc-100 p-0.5 rounded-xl border border-zinc-200/80 text-[12px] font-bold">
            <button
              type="button"
              onClick={() => setSimTab('attendance')}
              className={`py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap tabular-nums ${
                simTab === 'attendance'
                  ? 'bg-white text-zinc-950 font-black shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              출석부 ({filteredUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setSimTab('notices')}
              className={`py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap tabular-nums ${
                simTab === 'notices'
                  ? 'bg-white text-zinc-950 font-black shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              공지함 ({noticeList.length})
            </button>
            <button
              type="button"
              onClick={() => setSimTab('sendNotice')}
              className={`py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                simTab === 'sendNotice'
                  ? 'bg-white text-zinc-950 font-black shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              현장 발송
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 3. 메인 스크롤 뷰포트                                                  */}
        {/* ===================================================================== */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 hide-scrollbar pb-12">
          
          {/* -----------------------------------------------------------------
              TAB 1: 실시간 모바일 출석부 (주간 스트립 + 4대 예배 KPI + 원터치 출결)
             ----------------------------------------------------------------- */}
          {simTab === 'attendance' && (
            <>
              {/* 주간 날짜 스트립 & 주차 이동 컨트롤 */}
              <div className="p-3.5 bg-white rounded-2xl border border-zinc-200/90 shadow-2xs space-y-3">
                <div className="flex justify-between items-center gap-2 whitespace-nowrap">
                  <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/80">
                    <button
                      type="button"
                      onClick={() => setSelectedWeekOffset && setSelectedWeekOffset(prev => prev - 1)}
                      className="p-1.5 rounded-md bg-white shadow-2xs text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                    >
                      <IconChevronLeft />
                    </button>
                    <span className="px-2.5 text-[11.5px] font-mono font-black text-zinc-900 tabular-nums">
                      {currentWeek?.rangeShort}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedWeekOffset && setSelectedWeekOffset(prev => prev + 1)}
                      className="p-1.5 rounded-md bg-white shadow-2xs text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                    >
                      <IconChevronRight />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedWeekOffset && setSelectedWeekOffset(0)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white font-black text-[10.5px] cursor-pointer whitespace-nowrap shadow-2xs"
                  >
                    금주 복귀
                  </button>
                </div>

                {/* 7일 캘린더 스트립 */}
                <div className="grid grid-cols-7 gap-1 pt-2 border-t border-zinc-100">
                  {(currentWeek?.dates || []).map(d => (
                    <div
                      key={d.full}
                      className={`py-1.5 rounded-xl flex flex-col items-center select-none border transition-all ${
                        d.isToday
                          ? 'bg-zinc-900 border-zinc-900 text-white shadow-2xs'
                          : 'bg-zinc-50/60 border-zinc-200/60 text-zinc-600'
                      }`}
                    >
                      <span
                        className={`text-[9.5px] font-bold ${
                          d.dayName === '일' && !d.isToday ? 'text-rose-500' : ''
                        }`}
                      >
                        {d.dayName}
                      </span>
                      <span className="text-[12px] font-mono font-black mt-0.5 tabular-nums">
                        {d.dayNum}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 4대 예배 실시간 출석 미니 KPI 바 */}
                <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-zinc-100 text-center whitespace-nowrap">
                  <div className="p-1.5 rounded-lg bg-zinc-50 border border-zinc-200/70">
                    <span className="text-[9.5px] font-bold text-zinc-400 block">수요예배</span>
                    <span className="text-[12px] font-mono font-black text-zinc-900 tabular-nums">
                      {cohortStats.wedCnt}명
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-zinc-50 border border-zinc-200/70">
                    <span className="text-[9.5px] font-bold text-zinc-400 block">금요기도</span>
                    <span className="text-[12px] font-mono font-black text-zinc-900 tabular-nums">
                      {cohortStats.friCnt}명
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-indigo-50/70 border border-indigo-200">
                    <span className="text-[9.5px] font-bold text-indigo-600 block">주일성수</span>
                    <span className="text-[12px] font-mono font-black text-indigo-900 tabular-nums">
                      {cohortStats.sunCnt}명 ({cohortStats.sunRate}%)
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                    <span className="text-[9.5px] font-bold text-emerald-700 block">목장모임</span>
                    <span className="text-[12px] font-mono font-black text-emerald-900 tabular-nums">
                      {cohortStats.cellCnt}명 ({cohortStats.cellRate}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* 목장 선택 · 검색 · 상태 필터 · 일괄 출석 컨트롤 바 */}
              <div className="p-3 bg-white rounded-2xl border border-zinc-200/90 shadow-2xs space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedCellFilter}
                    onChange={e => setSelectedCellFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11.5px] font-black text-zinc-800 outline-none cursor-pointer shrink-0"
                  >
                    <option value="ALL">전체 목장 ({enrichedUsers.length}명)</option>
                    {cells.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>

                  <div className="relative flex-1 min-w-0">
                    <span className="absolute left-2.5 top-2 text-zinc-400 pointer-events-none">
                      <SvgSearch />
                    </span>
                    <input
                      type="text"
                      value={memberSearchQuery}
                      onChange={e => setMemberSearchQuery(e.target.value)}
                      placeholder="성도명·직분 검색..."
                      className="w-full pl-8 pr-6 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11.5px] font-bold text-zinc-900 outline-none focus:bg-white focus:border-zinc-900"
                    />
                    {memberSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setMemberSearchQuery('')}
                        className="absolute right-2 top-1.5 text-[10px] text-zinc-400 hover:text-zinc-800 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/70 text-[10.5px] font-bold">
                    {[
                      { id: 'ALL', label: '전체' },
                      { id: 'SUN_PRESENT', label: '주일출석' },
                      { id: 'SUN_ABSENT', label: '미출석' }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setAttFilterMode(f.id)}
                        className={`px-2 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                          attFilterMode === f.id
                            ? 'bg-white text-zinc-950 font-black shadow-2xs'
                            : 'text-zinc-500'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      type="button"
                      onClick={() => handleBatchMarkPresent('주일')}
                      className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10.5px] font-black cursor-pointer whitespace-nowrap"
                    >
                      + 주일 일괄출석
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchMarkPresent('목장')}
                      className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10.5px] font-black cursor-pointer whitespace-nowrap"
                    >
                      + 목장 일괄출석
                    </button>
                  </div>
                </div>
              </div>

              {/* 성도별 4대 예배 원터치 출결 리스트 */}
              {filteredUsers.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-2 text-zinc-400 text-[12.5px] font-bold bg-white rounded-2xl border border-zinc-200">
                  <SvgUsers />
                  <span>조건에 일치하는 성도가 없습니다.</span>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-zinc-200/90 p-2 divide-y divide-zinc-100 shadow-2xs">
                  {filteredUsers.map(u => (
                    <div
                      key={u.name}
                      className="py-2.5 px-2 flex flex-col gap-2 hover:bg-zinc-50/60 transition-colors rounded-xl"
                    >
                      <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                        <div
                          onClick={() => setSelectedUserProfile && setSelectedUserProfile(u)}
                          className="font-black text-[13.5px] text-zinc-900 cursor-pointer flex items-center gap-1.5 min-w-0"
                        >
                          <span className="truncate">{u.name}</span>
                          <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded shrink-0">
                            {u.office || '성도'} · {u.role || '일반'}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded shrink-0">
                            {u.realCellName}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono font-bold text-zinc-400 tabular-nums shrink-0">
                          금주 {u.presentCount}/4
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          {
                            label: '수요',
                            st: u.stWed,
                            targetDate: currentWeek?.wedStr,
                            type: '수요',
                            col: 'bg-zinc-900 text-white shadow-2xs border-zinc-900'
                          },
                          {
                            label: '금요',
                            st: u.stFri,
                            targetDate: currentWeek?.friStr,
                            type: '금요',
                            col: 'bg-zinc-900 text-white shadow-2xs border-zinc-900'
                          },
                          {
                            label: '주일',
                            st: u.stSun,
                            targetDate: currentWeek?.sunStr,
                            type: '주일',
                            col: 'bg-indigo-600 text-white shadow-2xs border-indigo-600'
                          },
                          {
                            label: '목장',
                            st: u.stCell,
                            targetDate: currentWeek?.sunStr,
                            type: '목장',
                            col: 'bg-emerald-600 text-white shadow-2xs border-emerald-600'
                          }
                        ].map(btn => (
                          <button
                            key={btn.label}
                            type="button"
                            onClick={() =>
                              handleWeeklyToggle(u.name, u.realCellName, btn.type, btn.st)
                            }
                            className={`py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer text-center border whitespace-nowrap ${
                              btn.st === '출석'
                                ? btn.col
                                : 'bg-zinc-50 text-zinc-400 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-700'
                            }`}
                          >
                            {btn.label} {btn.st === '출석' ? '✓' : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* -----------------------------------------------------------------
              TAB 2: 공지사항 수신함 (실시간 검색 + 클립보드 복사 + 재사용)
             ----------------------------------------------------------------- */}
          {simTab === 'notices' && (
            <div className="space-y-3">
              <div className="p-3 bg-white rounded-2xl border border-zinc-200/90 shadow-2xs flex items-center justify-between gap-2">
                <h3 className="text-[13.5px] font-black text-zinc-900 whitespace-nowrap pl-1">
                  수신 공지 아카이브
                </h3>
                <div className="relative flex-1 max-w-[200px]">
                  <span className="absolute left-2.5 top-2 text-zinc-400 pointer-events-none">
                    <SvgSearch />
                  </span>
                  <input
                    type="text"
                    value={noticeSearchQuery}
                    onChange={e => setNoticeSearchQuery(e.target.value)}
                    placeholder="공지 검색..."
                    className="w-full pl-8 pr-5 py-1 rounded-lg bg-zinc-50 border border-zinc-200 text-[11.5px] font-bold text-zinc-900 outline-none focus:bg-white focus:border-zinc-900"
                  />
                </div>
              </div>

              {filteredNotices.length === 0 ? (
                <div className="py-20 flex flex-col items-center gap-2 text-zinc-400 text-[12.5px] font-bold bg-white rounded-2xl border border-zinc-200">
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center border border-zinc-200 text-zinc-300">
                    <SvgMegaphone />
                  </div>
                  <span>수신된 공지사항이 없습니다.</span>
                </div>
              ) : (
                filteredNotices.map(n => (
                  <div
                    key={n.id}
                    className="p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs flex flex-col gap-2 hover:border-zinc-400 transition-colors"
                  >
                    <div className="flex justify-between items-center gap-2 whitespace-nowrap">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border bg-zinc-100 border-zinc-200 text-zinc-800">
                        {n.scope}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-zinc-400 tabular-nums">
                          {n.created_at}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyNotice(n)}
                          className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedNoticeId === n.id ? <><SvgCheck /> 복사됨</> : <><SvgCopy /> 복사</>}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSimNoticeTitle(n.title || '');
                            setSimNoticeBody(n.content || '');
                            setSimTab('sendNotice');
                          }}
                          className="px-2 py-0.5 rounded bg-zinc-900 text-white text-[10px] font-bold cursor-pointer"
                        >
                          재사용
                        </button>
                      </div>
                    </div>
                    <h4 className="text-[13.5px] font-black text-zinc-900 tracking-tight leading-snug break-keep">
                      {n.title}
                    </h4>
                    <p className="text-[12px] text-zinc-600 leading-relaxed whitespace-pre-wrap font-medium">
                      {n.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* -----------------------------------------------------------------
              TAB 3: 모바일 현장 알림 발송 (타겟 목장 지정 + 원클릭 프리셋)
             ----------------------------------------------------------------- */}
          {simTab === 'sendNotice' && (
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-2xl border border-zinc-200/90 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 whitespace-nowrap">
                  <h3 className="text-[13.5px] font-black text-zinc-900">현장 알림 즉시 배포</h3>
                  <span className="text-[10px] font-mono font-bold text-zinc-400">
                    실시간 앱 푸시 연동
                  </span>
                </div>

                {/* 원클릭 현장 템플릿 칩 */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                    빠른 현장 템플릿
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
                    {MOBILE_NOTICE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSimNoticeTitle(preset.title);
                          setSimNoticeBody(preset.body);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-zinc-900 hover:text-white text-zinc-700 border border-zinc-200 text-[10.5px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 수신 대상 목장 선택 */}
                <div>
                  <label className="text-[10.5px] font-black uppercase tracking-wider text-zinc-500 block mb-1.5">
                    수신 대상 목장 선택
                  </label>
                  <select
                    value={targetNoticeCell}
                    onChange={e => setTargetNoticeCell(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-[12.5px] font-bold bg-zinc-50 text-zinc-900 outline-none focus:bg-white focus:border-zinc-900 cursor-pointer"
                  >
                    <option value="전체 공지">전체 성도 공지</option>
                    {cells.map(c => (
                      <option key={c.id} value={c.name}>{c.name} 전용 공지</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10.5px] font-black uppercase tracking-wider text-zinc-500 block mb-1.5">
                    알림 제목 *
                  </label>
                  <input
                    type="text"
                    placeholder="명확한 공지 제목을 입력하세요..."
                    value={simNoticeTitle}
                    onChange={e => setSimNoticeTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] font-bold bg-zinc-50 focus:bg-white focus:border-zinc-900 outline-none transition-all placeholder:font-medium placeholder:text-zinc-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5 whitespace-nowrap">
                    <label className="text-[10.5px] font-black uppercase tracking-wider text-zinc-500">
                      상세 전달 내용 *
                    </label>
                    <span className="text-[10px] font-mono text-zinc-400 tabular-nums">
                      {simNoticeBody.length}자
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    placeholder="목원들에게 전달할 상세 내용을 작성하세요..."
                    value={simNoticeBody}
                    onChange={e => setSimNoticeBody(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-zinc-200 text-[12.5px] font-medium bg-zinc-50 focus:bg-white focus:border-zinc-900 outline-none leading-relaxed resize-none transition-all placeholder:text-zinc-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSimCellNoticeSend}
                  className="w-full py-3 mt-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-black text-[12.5px] shadow-sm active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <SvgSend />
                  <span>{targetNoticeCell}에 즉시 배포하기</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
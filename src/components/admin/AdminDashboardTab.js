// src/components/admin/AdminDashboardTab.js
import React, { useState, useMemo, useCallback } from 'react';

// =====================================================================
// ✒️ 엔터프라이즈 모노크롬 SVG 아이콘 세트 (Linear / Vercel SaaS 규격)
// =====================================================================
const SvgUsers = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);
const SvgDownload = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);
const IconClose = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.3} stroke="currentColor" className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const SvgSearch = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);
const SvgChevronLeft = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);
const SvgChevronRight = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

export default function AdminDashboardTab({
  cells = [],
  cellMembers = [],
  attendance = [],
  currentWeek,
  users = [],
  realStats,
  exportAttendanceCSV,
  setSelectedWeekOffset,
  setSelectedUserProfile,
  setActiveReportCell,
  getReportForCell,
  handleToggleRoutineCheck
}) {
  const [activeChecklistCell, setActiveChecklistCell] = useState(null);

  // 목장 검색 · 보고서 제출 필터 · 정렬 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [reportFilter, setReportFilter] = useState('ALL'); // 'ALL' | 'SUBMITTED' | 'UNSUBMITTED'
  const [sortBy, setSortBy] = useState('DEFAULT'); // 'DEFAULT' | 'ATT_DESC' | 'SIZE_DESC'

  const weekDateStrings = useMemo(
    () => (currentWeek?.dates || []).map(d => d.full),
    [currentWeek]
  );

  // 목장별 출석률, 보고서 상태, 주간 Q/M/T 합산 데이터 정밀 가공
  const enrichedCells = useMemo(() => {
    const sunStr = currentWeek?.sunStr;

    return (cells || []).map((c, idx) => {
      const members = (cellMembers || []).filter(m => m.cell_id === c.id);
      const report = getReportForCell ? getReportForCell(c) : null;

      let sundayAttCount = 0;
      let weeklyQmtCount = 0;

      const memberDetails = members.map(m => {
        const uName = (m.user_name || '').trim();
        const isAtt = (attendance || []).some(
          a =>
            (a.user_name || '').trim() === uName &&
            a.status === '출석' &&
            (a.type === '주일' || a.type === '주일예배') &&
            a.date === sunStr
        );
        if (isAtt) sundayAttCount += 1;

        const memberQmt = (attendance || []).filter(
          a =>
            (a.user_name || '').trim() === uName &&
            a.status === '출석' &&
            weekDateStrings.includes(a.date) &&
            ['QT', '큐티', '맥체인', '성경', '감사', '목장'].includes(a.type)
        ).length;
        weeklyQmtCount += memberQmt;

        const userRecord = (users || []).find(u => u.name === m.user_name) || {
          name: m.user_name,
          role: '목원'
        };

        return {
          ...m,
          isAtt,
          memberQmt,
          userRecord
        };
      });

      const attRate = members.length > 0 ? Math.round((sundayAttCount / members.length) * 100) : 0;

      return {
        ...c,
        orderNo: idx + 1,
        members,
        memberDetails,
        sundayAttCount,
        attRate,
        weeklyQmtCount,
        report,
        hasReport: Boolean(report)
      };
    });
  }, [cells, cellMembers, attendance, currentWeek, users, getReportForCell, weekDateStrings]);

  // 검색 및 필터·정렬이 적용된 목장 목록
  const filteredAndSortedCells = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = enrichedCells.filter(c => {
      if (reportFilter === 'SUBMITTED' && !c.hasReport) return false;
      if (reportFilter === 'UNSUBMITTED' && c.hasReport) return false;
      if (!q) return true;
      const matchCell = (c.name || '').toLowerCase().includes(q);
      const matchShepherd = (c.shepherd_name || '').toLowerCase().includes(q);
      const matchMember = c.memberDetails.some(m => (m.user_name || '').toLowerCase().includes(q));
      return matchCell || matchShepherd || matchMember;
    });

    if (sortBy === 'ATT_DESC') {
      return [...filtered].sort((a, b) => b.attRate - a.attRate || b.sundayAttCount - a.sundayAttCount);
    }
    if (sortBy === 'SIZE_DESC') {
      return [...filtered].sort((a, b) => b.members.length - a.members.length);
    }
    return filtered;
  }, [enrichedCells, searchQuery, reportFilter, sortBy]);

  // 전체 요약 메트릭
  const summaryStats = useMemo(() => {
    const totalCells = enrichedCells.length;
    const submittedCells = enrichedCells.filter(c => c.hasReport).length;
    const assignedMembersCount = enrichedCells.reduce((acc, c) => acc + c.members.length, 0);
    const totalSaints = realStats?.totalSaints ?? users.length ?? 0;
    const todayAttCount = realStats?.todayAttCount ?? 0;
    const totalAttRate = realStats?.totalAttRate ?? 0;
    const reportRate = totalCells > 0 ? Math.round((submittedCells / totalCells) * 100) : 0;

    return {
      totalCells,
      submittedCells,
      reportRate,
      assignedMembersCount,
      totalSaints,
      todayAttCount,
      totalAttRate
    };
  }, [enrichedCells, realStats, users.length]);

  const activeCellMemberList = useMemo(() => {
    if (!activeChecklistCell) return [];
    const memberNames = (cellMembers || [])
      .filter(m => m.cell_id === activeChecklistCell.id)
      .map(m => m.user_name);
    if (
      activeChecklistCell.shepherd_name &&
      !memberNames.includes(activeChecklistCell.shepherd_name)
    ) {
      memberNames.unshift(activeChecklistCell.shepherd_name);
    }
    return memberNames;
  }, [activeChecklistCell, cellMembers]);

  // 선택된 목장의 Q/M/T 주간 통계 집계
  const activeModalQmtSummary = useMemo(() => {
    if (!activeChecklistCell || activeCellMemberList.length === 0) {
      return { qTotal: 0, mTotal: 0, tTotal: 0 };
    }
    let qTotal = 0;
    let mTotal = 0;
    let tTotal = 0;

    activeCellMemberList.forEach(name => {
      (currentWeek?.dates || []).forEach(d => {
        const isQ = (attendance || []).some(
          a => a.user_name === name && a.date === d.full && (a.type === 'QT' || a.type === '큐티') && a.status === '출석'
        );
        const isM = (attendance || []).some(
          a => a.user_name === name && a.date === d.full && (a.type === '맥체인' || a.type === '성경') && a.status === '출석'
        );
        const isT = (attendance || []).some(
          a => a.user_name === name && a.date === d.full && (a.type === '감사' || a.type === '목장') && a.status === '출석'
        );
        if (isQ) qTotal += 1;
        if (isM) mTotal += 1;
        if (isT) tTotal += 1;
      });
    });

    return { qTotal, mTotal, tTotal };
  }, [activeChecklistCell, activeCellMemberList, currentWeek, attendance]);

  // 모달 내 해당 목장 Q/M/T 주간 루틴 CSV 단독 추출
  const handleExportModalQmtCSV = useCallback(() => {
    if (!activeChecklistCell || activeCellMemberList.length === 0) return;
    const dates = currentWeek?.dates || [];
    const headers = [
      '성도명',
      ...dates.map(d => `${d.month}/${d.dayNum}(${d.dayName})`),
      '주간달성합계'
    ];

    const rows = activeCellMemberList.map(name => {
      let sum = 0;
      const dayCells = dates.map(d => {
        const isQ = (attendance || []).some(
          a => a.user_name === name && a.date === d.full && (a.type === 'QT' || a.type === '큐티') && a.status === '출석'
        );
        const isM = (attendance || []).some(
          a => a.user_name === name && a.date === d.full && (a.type === '맥체인' || a.type === '성경') && a.status === '출석'
        );
        const isT = (attendance || []).some(
          a => a.user_name === name && a.date === d.full && (a.type === '감사' || a.type === '목장') && a.status === '출석'
        );
        const flags = [isQ ? 'Q' : '', isM ? 'M' : '', isT ? 'T' : ''].filter(Boolean).join('/');
        sum += (isQ ? 1 : 0) + (isM ? 1 : 0) + (isT ? 1 : 0);
        return flags || '-';
      });
      return [`"${name}"`, ...dayCells, `${sum}회`];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeChecklistCell.name}_QMT루틴점검표_${currentWeek?.sunStr || '금주'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeChecklistCell, activeCellMemberList, currentWeek, attendance]);

  return (
    <div className="h-full flex flex-col gap-3.5 min-h-0 overflow-hidden box-border font-sans select-none text-zinc-900 bg-[#FAFAFA] p-1 sm:p-2">
      
      {/* ====================================================================
          [1] 상단 4대 핵심 KPI 벤토(Bento) 카드 그리드 (줄바꿈 0% 보장)
         ==================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        
        {/* KPI 1: 운영 목장 및 보고서 제출 현황 */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 whitespace-nowrap">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-zinc-400">
              운영 목장 현황
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 tabular-nums">
              보고서 {summaryStats.submittedCells}/{summaryStats.totalCells}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2 whitespace-nowrap">
            <div className="flex items-baseline gap-1">
              <span className="text-[24px] sm:text-[26px] font-black font-mono text-zinc-900 leading-none tabular-nums">
                {summaryStats.totalCells}
              </span>
              <span className="text-[11.5px] font-bold text-zinc-500">개 목장</span>
            </div>
            <span className="text-[10.5px] font-mono font-bold text-emerald-600 tabular-nums">
              제출률 {summaryStats.reportRate}%
            </span>
          </div>
        </div>

        {/* KPI 2: 전체 성도 및 목장 배정 인원 */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 whitespace-nowrap">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-zinc-400">
              전체 재적 성도
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 tabular-nums">
              배정 {summaryStats.assignedMembersCount}명
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2 whitespace-nowrap">
            <div className="flex items-baseline gap-1">
              <span className="text-[24px] sm:text-[26px] font-black font-mono text-zinc-900 leading-none tabular-nums">
                {summaryStats.totalSaints}
              </span>
              <span className="text-[11.5px] font-bold text-zinc-500">명</span>
            </div>
            <span className="text-[10.5px] font-mono font-bold text-zinc-400 tabular-nums">
              평균 {summaryStats.totalCells > 0 ? (summaryStats.assignedMembersCount / summaryStats.totalCells).toFixed(1) : 0}명/목장
            </span>
          </div>
        </div>

        {/* KPI 3: 주일 출석 인원 */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 whitespace-nowrap">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-zinc-400">
              주일 출석 인원
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 tabular-nums">
              {currentWeek?.sunStr?.slice(5) || '금주'}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2 whitespace-nowrap">
            <div className="flex items-baseline gap-1">
              <span className="text-[24px] sm:text-[26px] font-black font-mono text-emerald-600 leading-none tabular-nums">
                {summaryStats.todayAttCount}
              </span>
              <span className="text-[11.5px] font-bold text-zinc-500">명 출석</span>
            </div>
            <span className="text-[10.5px] font-mono font-bold text-zinc-400 tabular-nums">
              결석 {Math.max(0, summaryStats.totalSaints - summaryStats.todayAttCount)}명
            </span>
          </div>
        </div>

        {/* KPI 4: 주간 종합 출석률 & 게이지 */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 whitespace-nowrap">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-zinc-400">
              주간 종합 출석률
            </span>
            <span className="text-[9.5px] font-mono font-black text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
              LIVE
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline justify-between mb-1.5 whitespace-nowrap">
              <div className="flex items-baseline gap-1">
                <span className="text-[24px] sm:text-[26px] font-black font-mono text-zinc-900 leading-none tabular-nums">
                  {summaryStats.totalAttRate}
                </span>
                <span className="text-[11.5px] font-bold text-zinc-500">%</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 tabular-nums">
                {summaryStats.todayAttCount}/{summaryStats.totalSaints}명
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, summaryStats.totalAttRate)}%` }}
                className="h-full bg-zinc-900 rounded-full transition-all duration-500"
              />
            </div>
          </div>
        </div>

      </div>

      {/* ====================================================================
          [2] 메인 목장 편성 및 출결·루틴 관제 컨테이너
         ==================================================================== */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-2xl border border-zinc-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        
        {/* 상단 그리드 툴바 */}
        <div className="px-4 sm:px-5 py-3 border-b border-zinc-200/90 bg-zinc-50/70 flex flex-wrap justify-between items-center shrink-0 gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[14.5px] font-black text-zinc-900 tracking-tight whitespace-nowrap">
              목장 편성 및 주간 출결 관제
            </h3>
            <span className="text-[10.5px] font-mono font-bold px-2.5 py-0.5 rounded-md border bg-white border-zinc-200 text-zinc-600 shadow-2xs whitespace-nowrap tabular-nums">
              {currentWeek?.range}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-200/60 p-0.5 text-[11px] font-bold shrink-0">
              <button
                type="button"
                onClick={() => setSelectedWeekOffset(prev => prev - 1)}
                className="px-2 py-1 text-zinc-700 hover:bg-white rounded-md transition-all cursor-pointer flex items-center gap-0.5 whitespace-nowrap"
              >
                <SvgChevronLeft /> 이전 주
              </button>
              <button
                type="button"
                onClick={() => setSelectedWeekOffset(0)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  currentWeek?.isCurrentWeek
                    ? 'bg-white text-zinc-950 font-black shadow-2xs'
                    : 'text-zinc-600 hover:bg-white'
                }`}
              >
                이번 주
              </button>
              <button
                type="button"
                onClick={() => setSelectedWeekOffset(prev => prev + 1)}
                className="px-2 py-1 text-zinc-700 hover:bg-white rounded-md transition-all cursor-pointer flex items-center gap-0.5 whitespace-nowrap"
              >
                다음 주 <SvgChevronRight />
              </button>
            </div>

            <button
              type="button"
              onClick={exportAttendanceCSV}
              className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 whitespace-nowrap shrink-0"
            >
              <SvgDownload /> CSV 추출
            </button>
          </div>
        </div>

        {/* 서브 필터 & 검색 & 정렬 바 */}
        <div className="px-4 sm:px-5 py-2 border-b border-zinc-100 bg-white flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/70 text-[10.5px] font-bold">
              {[
                { id: 'ALL', label: `전체 (${enrichedCells.length})` },
                { id: 'SUBMITTED', label: `보고서 제출 (${summaryStats.submittedCells})` },
                { id: 'UNSUBMITTED', label: `미제출 (${summaryStats.totalCells - summaryStats.submittedCells})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setReportFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer tabular-nums ${
                    reportFilter === tab.id
                      ? 'bg-white text-zinc-950 font-black shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] font-bold text-zinc-700 outline-none cursor-pointer"
            >
              <option value="DEFAULT">기본 편성순</option>
              <option value="ATT_DESC">출석률 높은순</option>
              <option value="SIZE_DESC">편성 인원순</option>
            </select>
          </div>

          <div className="relative w-full sm:w-56">
            <span className="absolute left-2.5 top-2 text-zinc-400 pointer-events-none"><SvgSearch /></span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="목장, 목자, 소속 성도 검색..."
              className="w-full pl-8 pr-6 py-1 text-[11.5px] bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:bg-white focus:border-zinc-900 font-medium placeholder:text-zinc-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1 text-[11px] text-zinc-400 hover:text-zinc-800 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 💻 데스크톱 & 태블릿 가로 뷰: 초고밀도 테이블 (줄바꿈 방지 완료) */}
        <div className="hidden md:block flex-1 w-full overflow-x-auto overflow-y-auto hide-scrollbar bg-white">
          <table className="w-full text-left border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-zinc-50/90 text-zinc-500 text-[10.5px] font-black uppercase tracking-wider border-b border-zinc-200 sticky top-0 z-10 whitespace-nowrap">
                <th className="py-2.5 px-3.5 w-12 text-center">No</th>
                <th className="py-2.5 px-3 w-36">목장명</th>
                <th className="py-2.5 px-3 w-28">담당 목자</th>
                <th className="py-2.5 px-3 w-32">주일 출석률</th>
                <th className="py-2.5 px-3">소속 목원 (흑색: 주일성수 완료)</th>
                <th className="py-2.5 px-3 w-28 text-center">주간 보고서</th>
                <th className="py-2.5 px-3.5 w-28 text-center">루틴 관제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium">
              {filteredAndSortedCells.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-zinc-400 font-bold">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <SvgUsers />
                      <span>조건에 해당하는 목장이 없습니다.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedCells.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/80 transition-colors group">
                    <td className="py-2.5 px-3.5 text-center text-zinc-400 font-mono text-[11px] tabular-nums whitespace-nowrap">
                      {String(c.orderNo).padStart(2, '0')}
                    </td>
                    <td className="py-2.5 px-3 font-black text-zinc-900 whitespace-nowrap">
                      {c.name}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-700 font-bold whitespace-nowrap">
                      {c.shepherd_name || <span className="text-zinc-300 italic font-normal">미지정</span>}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[10.5px] font-mono tabular-nums">
                          <span className="font-black text-zinc-900">{c.attRate}%</span>
                          <span className="text-zinc-400">{c.sundayAttCount}/{c.members.length}명</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${c.attRate}%` }}
                            className="h-full bg-zinc-900 rounded-full transition-all duration-300"
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1 text-[11px]">
                        {c.memberDetails.length === 0 ? (
                          <span className="text-zinc-300 italic">미배정</span>
                        ) : (
                          c.memberDetails.map(m => (
                            <button
                              key={m.id || m.user_name}
                              type="button"
                              onClick={() => setSelectedUserProfile && setSelectedUserProfile(m.userRecord)}
                              className={`font-bold cursor-pointer px-2 py-0.5 rounded-md border transition-all whitespace-nowrap ${
                                m.isAtt
                                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                                  : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900'
                              }`}
                            >
                              {m.user_name}
                            </button>
                          ))
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveReportCell({
                            ...c,
                            reportData: c.report || {
                              word_sharing: '미제출 (작성된 데이터가 없습니다.)',
                              thanks_sharing: '미제출 (작성된 데이터가 없습니다.)',
                              prayer_requests: '미제출 (작성된 데이터가 없습니다.)'
                            }
                          });
                        }}
                        className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold cursor-pointer transition-all border whitespace-nowrap ${
                          c.hasReport
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-2xs'
                            : 'bg-zinc-50 border-zinc-200/80 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700'
                        }`}
                      >
                        {c.hasReport ? '제출됨' : '미제출'}
                      </button>
                    </td>

                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setActiveChecklistCell(c)}
                        className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-[10.5px] font-black cursor-pointer shadow-2xs transition-all whitespace-nowrap tabular-nums"
                      >
                        Q/M/T ({c.weeklyQmtCount})
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 📱 모바일 전용 고밀도 Bento 카드 리스트 뷰 (가로 스크롤 0%) */}
        <div className="md:hidden flex-1 overflow-y-auto p-3 space-y-2.5 bg-zinc-50/50 hide-scrollbar">
          {filteredAndSortedCells.length === 0 ? (
            <div className="py-14 text-center text-zinc-400 text-xs font-bold">
              조건에 해당하는 목장이 없습니다.
            </div>
          ) : (
            filteredAndSortedCells.map((c) => (
              <div key={c.id} className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                      #{String(c.orderNo).padStart(2, '0')}
                    </span>
                    <span className="text-[13.5px] font-black text-zinc-900 truncate">{c.name}</span>
                    <span className="text-[11px] font-bold text-zinc-500">
                      (목자: {c.shepherd_name || '미지정'})
                    </span>
                  </div>
                  <span className="text-[10.5px] font-mono font-black text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 tabular-nums">
                    출석 {c.sundayAttCount}/{c.members.length} ({c.attRate}%)
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {c.memberDetails.length === 0 ? (
                    <span className="text-[11px] text-zinc-300 italic">미배정</span>
                  ) : (
                    c.memberDetails.map(m => (
                      <button
                        key={m.id || m.user_name}
                        type="button"
                        onClick={() => setSelectedUserProfile && setSelectedUserProfile(m.userRecord)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border whitespace-nowrap ${
                          m.isAtt
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                        }`}
                      >
                        {m.user_name}
                      </button>
                    ))
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveReportCell({
                        ...c,
                        reportData: c.report || {
                          word_sharing: '미제출 (작성된 데이터가 없습니다.)',
                          thanks_sharing: '미제출 (작성된 데이터가 없습니다.)',
                          prayer_requests: '미제출 (작성된 데이터가 없습니다.)'
                        }
                      });
                    }}
                    className={`py-1.5 rounded-lg text-[11px] font-bold border whitespace-nowrap cursor-pointer ${
                      c.hasReport
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                    }`}
                  >
                    보고서: {c.hasReport ? '제출됨' : '미제출'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveChecklistCell(c)}
                    className="py-1.5 rounded-lg text-[11px] font-black bg-zinc-900 text-white whitespace-nowrap cursor-pointer tabular-nums"
                  >
                    Q/M/T 점검표 ({c.weeklyQmtCount})
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ====================================================================
          [3] 실시간 Q/M/T 주간 체크표 인스펙터 모달 (달성률 + 단독 CSV 추출 탑재)
         ==================================================================== */}
      {activeChecklistCell && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in select-none"
          onClick={() => setActiveChecklistCell(null)}
        >
          <div
            className="w-full max-w-4xl bg-white rounded-2xl p-4 sm:p-5 shadow-2xl border border-zinc-200 flex flex-col gap-3.5 max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* 모달 상단 헤더 */}
            <div className="flex flex-wrap justify-between items-center border-b border-zinc-200 pb-3 gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 animate-pulse shrink-0" />
                <h3 className="text-[15.5px] font-black text-zinc-900 whitespace-nowrap">
                  {activeChecklistCell.name} 주간 Q/M/T 루틴 점검표
                </h3>
                <span className="text-[10.5px] font-mono font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200 whitespace-nowrap tabular-nums">
                  {currentWeek?.range}
                </span>
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <div className="hidden sm:flex items-center gap-1.5 text-[10.5px] font-mono font-bold mr-1 whitespace-nowrap tabular-nums">
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Q(큐티) {activeModalQmtSummary.qTotal}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    M(말씀) {activeModalQmtSummary.mTotal}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    T(감사) {activeModalQmtSummary.tTotal}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleExportModalQmtCSV}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs"
                  title="이 목장의 주간 Q/M/T 체크표 CSV 다운로드"
                >
                  <SvgDownload /> CSV
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChecklistCell(null)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg border border-zinc-200 cursor-pointer"
                >
                  <IconClose />
                </button>
              </div>
            </div>

            {/* 7일 Q/M/T 매트릭스 그리드 */}
            <div className="flex-1 overflow-x-auto overflow-y-auto hide-scrollbar border border-zinc-200 rounded-xl bg-white">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[110px_repeat(7,minmax(0,1fr))] items-center bg-zinc-50 border-b border-zinc-200 sticky top-0 z-10">
                  <div className="text-left font-black text-[10.5px] text-zinc-500 uppercase tracking-wider pl-3.5 border-r border-zinc-200 py-2.5 whitespace-nowrap">
                    성도명 (주간합계)
                  </div>
                  {(currentWeek?.dates || []).map(d => (
                    <div
                      key={d.full}
                      className={`flex flex-col items-center justify-center py-2 border-r border-zinc-100 last:border-0 whitespace-nowrap ${
                        d.isToday ? 'bg-zinc-900 text-white' : 'text-zinc-600'
                      }`}
                    >
                      <span className={`text-[10px] font-bold ${d.dayName === '일' && !d.isToday ? 'text-rose-500' : ''}`}>
                        {d.dayName}
                      </span>
                      <span className={`text-[12px] font-mono font-black mt-0.5 tabular-nums ${d.isToday ? 'text-white' : 'text-zinc-800'}`}>
                        {d.dayNum}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col divide-y divide-zinc-100 bg-white">
                  {activeCellMemberList.length === 0 ? (
                    <div className="py-16 text-zinc-400 text-center font-medium text-[12.5px]">
                      목장에 등록된 성도가 없습니다.
                    </div>
                  ) : (
                    activeCellMemberList.map(name => {
                      const memberWeeklyDone = (currentWeek?.dates || []).reduce((acc, d) => {
                        const q = (attendance || []).some(a => a.user_name === name && a.date === d.full && (a.type === 'QT' || a.type === '큐티') && a.status === '출석');
                        const m = (attendance || []).some(a => a.user_name === name && a.date === d.full && (a.type === '맥체인' || a.type === '성경') && a.status === '출석');
                        const t = (attendance || []).some(a => a.user_name === name && a.date === d.full && (a.type === '감사' || a.type === '목장') && a.status === '출석');
                        return acc + (q ? 1 : 0) + (m ? 1 : 0) + (t ? 1 : 0);
                      }, 0);

                      return (
                        <div
                          key={name}
                          className="grid grid-cols-[110px_repeat(7,minmax(0,1fr))] items-center hover:bg-zinc-50/80 transition-colors"
                        >
                          <div className="flex items-center justify-between min-w-0 px-3 py-2.5 border-r border-zinc-200 bg-white whitespace-nowrap">
                            <span className="font-black text-[12px] text-zinc-900 truncate">{name}</span>
                            <span className="text-[10px] font-mono font-bold text-zinc-400 tabular-nums ml-1">
                              {memberWeeklyDone}
                            </span>
                          </div>
                          {(currentWeek?.dates || []).map(d => {
                            const isQ = (attendance || []).some(a => a.user_name === name && a.date === d.full && (a.type === 'QT' || a.type === '큐티') && a.status === '출석');
                            const isM = (attendance || []).some(a => a.user_name === name && a.date === d.full && (a.type === '맥체인' || a.type === '성경') && a.status === '출석');
                            const isT = (attendance || []).some(a => a.user_name === name && a.date === d.full && (a.type === '감사' || a.type === '목장') && a.status === '출석');

                            return (
                              <div key={d.full} className="flex items-center justify-center gap-1 border-r border-zinc-100 last:border-0 py-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleRoutineCheck && handleToggleRoutineCheck(name, d.full, 'Q')}
                                  className={`w-5 h-5 rounded text-[9.5px] font-black flex items-center justify-center transition-all cursor-pointer border ${
                                    isQ
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                      : 'bg-white text-zinc-300 border-zinc-200 hover:border-zinc-400 hover:text-zinc-600'
                                  }`}
                                  title={`${name} - ${d.full} QT 토글`}
                                >
                                  Q
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleRoutineCheck && handleToggleRoutineCheck(name, d.full, 'M')}
                                  className={`w-5 h-5 rounded text-[9.5px] font-black flex items-center justify-center transition-all cursor-pointer border ${
                                    isM
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                      : 'bg-white text-zinc-300 border-zinc-200 hover:border-zinc-400 hover:text-zinc-600'
                                  }`}
                                  title={`${name} - ${d.full} 맥체인/말씀 토글`}
                                >
                                  M
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleRoutineCheck && handleToggleRoutineCheck(name, d.full, 'T')}
                                  className={`w-5 h-5 rounded text-[9.5px] font-black flex items-center justify-center transition-all cursor-pointer border ${
                                    isT
                                      ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-2xs'
                                      : 'bg-white text-zinc-300 border-zinc-200 hover:border-zinc-400 hover:text-zinc-600'
                                  }`}
                                  title={`${name} - ${d.full} 감사나눔 토글`}
                                >
                                  T
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 pt-1 whitespace-nowrap">
              <span className="text-[11px] font-bold text-zinc-500">
                * <b className="text-indigo-600">Q</b>: 큐티 / <b className="text-emerald-600">M</b>: 맥체인·성경 / <b className="text-amber-600">T</b>: 감사나눔 (클릭 시 출석 즉시 반영)
              </span>
              <button
                type="button"
                onClick={() => setActiveChecklistCell(null)}
                className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-black text-[12px] cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                점검 완료 및 닫기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
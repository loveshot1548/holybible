// src/components/admin/AdminAnnualDashboard.js
import React, { useState, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

// =====================================================================
// ✒️ 엔터프라이즈 모노크롬 SVG 아이콘 세트 (Linear / Vercel SaaS 규격)
// =====================================================================
const SvgDownload = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);
const SvgTarget = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const SvgSend = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const SvgTrash = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);
const SvgClock = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const SvgClose = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const SvgSearch = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);
const SvgBell = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
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
const SvgArrowUpRight = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3 h-3 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
  </svg>
);

// 공지 배포 퀵 템플릿 프리셋
const NOTICE_TEMPLATES = [
  {
    label: '주일예배 안내',
    title: '[공지] 주일 대예배 및 목장 모임 안내',
    scope: 'all',
    body: '사랑하는 성도 여러분, 이번 주일 예배 말씀 본문을 미리 묵상하시고 기도로 예배의 자리에 나아오시길 바랍니다.'
  },
  {
    label: '목자 사역 공지',
    title: '[리더십] 금주 목장 보고서 및 Q/M/T 점검 안내',
    scope: 'shepherds',
    body: '목자님들의 헌신에 감사드립니다. 금주 목장 모임 후 성도님들의 QT·맥체인·감사 나눔 현황과 기도제목을 제출해 주시기 바랍니다.'
  },
  {
    label: '특별기도회',
    title: '[안내] 금요 성령 집회 및 합심 기도회',
    scope: 'all',
    body: '가정과 교회, 다음 세대를 깨우는 금요 기도회에 모든 성도님들의 뜨거운 동참을 바랍니다.'
  }
];

export default function AdminAnnualDashboard({
  chartZoomMode = 'weekly',
  setChartZoomMode,
  calendarYear,
  recentSundaysData = [],
  selectedWeekOffset,
  setSelectedWeekOffset,
  hoveredBarIndex,
  setHoveredBarIndex,
  annualMonthlyData = [],
  currentWeek,
  realStats,
  metricViewMode,
  setMetricViewMode,
  activeMetricDetail,
  setActiveMetricDetail,
  annualMetrics,
  isEditingGoal,
  setIsEditingGoal,
  goalInput,
  setGoalInput,
  handleSaveGoal,
  targetGoal,
  cells = [],
  cellMembers = [],
  attendance = [],
  users = [],
  getReportForCell,
  exportAttendanceCSV,
  setSelectedUserProfile,
  setActiveReportCell,
  setActiveChecklistCell,
  noticeList = [],
  handleDeleteNotice,
  broadcastTitle,
  setBroadcastTitle,
  broadcastScope,
  setBroadcastScope,
  broadcastBody,
  setBroadcastBody,
  handlePublishNotice
}) {
  const [activeTabNotice, setActiveTabNotice] = useState('create');

  // 연간 누적 팝업 상태 (마우스 호버 & 터치 제어)
  const [showAnnualPopup, setShowAnnualPopup] = useState(false);
  const [hoveredAnnualMonthIdx, setHoveredAnnualMonthIdx] = useState(null);

  // 목장 관제 테이블 고도화 필터 & 검색 상태
  const [cellSearchQuery, setCellSearchQuery] = useState('');
  const [cellStatusFilter, setCellStatusFilter] = useState('ALL'); // 'ALL' | 'SUBMITTED' | 'UNSUBMITTED'

  // 사역 인스펙터 드로어 상태
  const [modalCohortTab, setModalCohortTab] = useState('UNCOMPLETED');
  const [modalCellFilter, setModalCellFilter] = useState('ALL');
  const [modalSearch, setModalSearch] = useState('');
  const [modalPage, setModalPage] = useState(1);
  const [sendingSingleUser, setSendingSingleUser] = useState(null);
  const PAGE_SIZE = 30;

  const registeredCount = realStats?.totalSaints || users.length || 0;
  const goalCount = Number(targetGoal) || 0;
  const goalProgress = goalCount > 0 ? Math.min(100, Math.round((registeredCount / goalCount) * 100)) : 0;
  const remainingToGoal = Math.max(0, goalCount - registeredCount);

  // 1년 월간 누적 정리 데이터 산출
  const annualCumulativeSummary = useMemo(() => {
    let runningTotal = 0;
    const totalMembers = registeredCount || 1;

    return (annualMonthlyData || []).map((m, idx) => {
      const monthCount = m.count || 0;
      runningTotal += monthCount;

      return {
        month: m.month || `${idx + 1}월`,
        monthIdx: idx + 1,
        quarter: Math.ceil((idx + 1) / 3),
        monthAttendees: monthCount,
        cumulativeAttendees: runningTotal,
        rate: m.rate || 0,
        totalMembers,
        isCurrentMonth: m.isCurrentMonth
      };
    });
  }, [annualMonthlyData, registeredCount]);

  // 분기별(Q1~Q4) 요약 데이터 산출
  const quarterlySummary = useMemo(() => {
    return [1, 2, 3, 4].map(q => {
      const qMonths = annualCumulativeSummary.filter(m => m.quarter === q);
      const sumAttendees = qMonths.reduce((acc, cur) => acc + cur.monthAttendees, 0);
      const avgRate = qMonths.length > 0
        ? Math.round(qMonths.reduce((acc, cur) => acc + (cur.rate || 0), 0) / qMonths.length)
        : 0;
      return { quarter: `Q${q}`, sumAttendees, avgRate };
    });
  }, [annualCumulativeSummary]);

  const annualTotalAttendees = useMemo(() => {
    if (annualCumulativeSummary.length === 0) return 0;
    return annualCumulativeSummary[annualCumulativeSummary.length - 1].cumulativeAttendees;
  }, [annualCumulativeSummary]);

  // 차트 평균선 계산
  const chartAvgRate = useMemo(() => {
    if (chartZoomMode === 'weekly') {
      if (!recentSundaysData || recentSundaysData.length === 0) return 0;
      const sum = recentSundaysData.reduce((acc, cur) => acc + (Number(cur.rate) || 0), 0);
      return Math.round(sum / recentSundaysData.length);
    } else {
      if (!annualCumulativeSummary || annualCumulativeSummary.length === 0) return 0;
      const activeMonths = annualCumulativeSummary.filter(m => m.rate > 0);
      if (activeMonths.length === 0) return 0;
      const sum = activeMonths.reduce((acc, cur) => acc + (Number(cur.rate) || 0), 0);
      return Math.round(sum / activeMonths.length);
    }
  }, [chartZoomMode, recentSundaysData, annualCumulativeSummary]);

  const userCellMap = useMemo(() => {
    const map = new Map();
    (cellMembers || []).forEach(m => {
      const c = (cells || []).find(item => item.id === m.cell_id);
      if (c) map.set(m.user_name, c.name);
    });
    return map;
  }, [cellMembers, cells]);

  // 목장별 사역 관제 데이터 가공 및 필터링
  const enrichedCells = useMemo(() => {
    const sunDate = currentWeek?.sunStr;
    return (cells || []).map((cell, idx) => {
      const members = (cellMembers || []).filter(m => m.cell_id === cell.id);
      const rep = getReportForCell ? getReportForCell(cell) : null;

      let attendedCount = 0;
      const memberStatuses = members.map(m => {
        const isAtt = (attendance || []).some(
          a =>
            (a.user_name || '').trim() === (m.user_name || '').trim() &&
            a.date === sunDate &&
            (a.type === '주일' || a.type === '주일예배') &&
            a.status === '출석'
        );
        if (isAtt) attendedCount += 1;
        return { userName: m.user_name, isAtt };
      });

      const attRate = members.length > 0 ? Math.round((attendedCount / members.length) * 100) : 0;

      return {
        ...cell,
        orderNo: idx + 1,
        members,
        memberStatuses,
        attendedCount,
        attRate,
        report: rep,
        hasReport: Boolean(rep)
      };
    });
  }, [cells, cellMembers, attendance, currentWeek, getReportForCell]);

  const filteredCells = useMemo(() => {
    const q = cellSearchQuery.trim().toLowerCase();
    return enrichedCells.filter(c => {
      if (cellStatusFilter === 'SUBMITTED' && !c.hasReport) return false;
      if (cellStatusFilter === 'UNSUBMITTED' && c.hasReport) return false;
      if (!q) return true;
      const matchName = (c.name || '').toLowerCase().includes(q);
      const matchShepherd = (c.shepherd_name || '').toLowerCase().includes(q);
      const matchMember = c.memberStatuses.some(m => (m.userName || '').toLowerCase().includes(q));
      return matchName || matchShepherd || matchMember;
    });
  }, [enrichedCells, cellSearchQuery, cellStatusFilter]);

  const submittedReportCount = useMemo(
    () => enrichedCells.filter(c => c.hasReport).length,
    [enrichedCells]
  );

  const fullMetricDataset = useMemo(() => {
    if (!activeMetricDetail) return [];
    const weekDates = currentWeek?.dates?.map(d => d.full) || [];
    const typeId = activeMetricDetail.id;

    const userAttMap = new Map();
    (attendance || []).forEach(a => {
      if (a.status !== '출석') return;
      const uName = (a.user_name || '').trim();
      if (!userAttMap.has(uName)) userAttMap.set(uName, []);
      userAttMap.get(uName).push(a);
    });

    return (users || []).map(u => {
      const trimmedName = (u.name || '').trim();
      const userAtts = userAttMap.get(trimmedName) || [];
      let isDone = false;
      let count = 0;

      if (typeId === 'qt') {
        const matches = userAtts.filter(a => {
          const t = (a.type || '').toUpperCase();
          return weekDates.includes(a.date) && (t === 'QT' || t === '큐티');
        });
        isDone = matches.length > 0;
        count = matches.length;
      } else if (typeId === 'bible') {
        const matches = userAtts.filter(a => {
          const t = a.type || '';
          return weekDates.includes(a.date) && (t === '맥체인' || t === '성경' || t === '통독');
        });
        isDone = matches.length > 0;
        count = matches.length * 4; // 1일 4장
      } else if (typeId === 'thanks') {
        const matches = userAtts.filter(a => {
          const t = a.type || '';
          return weekDates.includes(a.date) && (t === '감사' || t === '목장' || t === '감사나눔');
        });
        isDone = matches.length > 0;
        count = matches.length;
      } else if (typeId === 'sunday') {
        isDone = userAtts.some(
          a => a.date === currentWeek?.sunStr && (a.type === '주일' || a.type === '주일예배')
        );
        count = isDone ? 1 : 0;
      }

      return { user: u, cellName: userCellMap.get(u.name) || '미배정', isDone, count };
    });
  }, [activeMetricDetail, users, attendance, currentWeek, userCellMap]);

  // 개인별 실천 지표 단위 포맷터 (장/회/출석 완벽 분기)
  const formatIndividualMetric = (typeId, count, isDone) => {
    if (typeId === 'bible') return `${count}장`;
    if (typeId === 'qt') return `${count}회`;
    if (typeId === 'thanks') return `${count}회`;
    if (typeId === 'sunday') return isDone ? '출석' : '결석';
    return `${count}회`;
  };

  const uncompletedUsers = useMemo(
    () => fullMetricDataset.filter(d => !d.isDone).map(d => d.user),
    [fullMetricDataset]
  );

  // 미실천자 일괄 독려
  const handleBulkRemindUncompleted = async () => {
    if (!uncompletedUsers || uncompletedUsers.length === 0) {
      return alert('독려할 미실천자가 없습니다. 모든 성도가 실천을 완료했습니다.');
    }

    if (!window.confirm(`${uncompletedUsers.length}명의 미실천자에게 [${activeMetricDetail?.label}] 독려 알림을 발송하시겠습니까?`)) return;

    if (supabase) {
      try {
        const payloads = uncompletedUsers.map(user => ({
          target_user_name: user.name,
          title: `[목양 권면] ${activeMetricDetail?.label} 실천 동참 안내`,
          content: `사랑하는 ${user.name} 성도님, 이번 주 ${activeMetricDetail?.label}에 함께 동참하시어 풍성한 은혜를 누리시길 기도합니다.`,
          scope: '개별 성도'
        }));

        const { error } = await supabase.from('user_notices').insert(payloads);
        if (error) throw error;
        alert(`${uncompletedUsers.length}명의 성도에게 성공적으로 독려 알림이 발송되었습니다.`);
      } catch (err) {
        alert('알림 발송 중 오류가 발생했습니다: ' + err.message);
      }
    } else {
      alert('데이터베이스가 연결되어 있지 않습니다.');
    }
  };

  // 개별 성도 1:1 핀셋 독려 알림 발송
  const handleSingleRemindUser = async (targetUser) => {
    if (!targetUser?.name || !supabase) return;
    setSendingSingleUser(targetUser.name);
    try {
      const { error } = await supabase.from('user_notices').insert([
        {
          target_user_name: targetUser.name,
          title: `[목양 권면] ${activeMetricDetail?.label} 실천 안내`,
          content: `사랑하는 ${targetUser.name} 성도님, 이번 주 ${activeMetricDetail?.label}의 은혜의 자리에 함께 동참하시길 기도합니다.`,
          scope: '개별 성도'
        }
      ]);
      if (error) throw error;
      alert(`${targetUser.name} 성도님께 개별 독려 알림을 발송했습니다.`);
    } catch (err) {
      alert('발송 실패: ' + err.message);
    } finally {
      setSendingSingleUser(null);
    }
  };

  const cellAnalyticsBreakdown = useMemo(() => {
    if (!activeMetricDetail || cells.length === 0) return [];
    return cells
      .map(c => {
        const cellUsers = fullMetricDataset.filter(d => d.cellName === c.name);
        const total = cellUsers.length;
        const done = cellUsers.filter(d => d.isDone).length;
        const rate = total > 0 ? Math.round((done / total) * 100) : 0;
        return {
          cellName: c.name,
          shepherd: c.shepherd_name || '미지정',
          total,
          done,
          uncompleted: total - done,
          rate
        };
      })
      .sort((a, b) => b.rate - a.rate);
  }, [activeMetricDetail, cells, fullMetricDataset]);

  const filteredDataset = useMemo(() => {
    return fullMetricDataset.filter(item => {
      if (modalCohortTab === 'UNCOMPLETED' && item.isDone) return false;
      if (modalCohortTab === 'COMPLETED' && !item.isDone) return false;
      if (modalCellFilter !== 'ALL' && item.cellName !== modalCellFilter) return false;
      if (!modalSearch.trim()) return true;
      const q = modalSearch.toLowerCase();
      return (
        item.user.name.toLowerCase().includes(q) ||
        (item.user.office || '').toLowerCase().includes(q) ||
        item.cellName.toLowerCase().includes(q)
      );
    });
  }, [fullMetricDataset, modalCohortTab, modalCellFilter, modalSearch]);

  // 인스펙터 코호트 CSV 다운로드
  const handleExportCohortCSV = useCallback(() => {
    if (!activeMetricDetail || filteredDataset.length === 0) return;
    const headers = ['No', '성도명', '직분', '소속목장', '실천지표', '상태'];
    const rows = filteredDataset.map((item, i) => [
      i + 1,
      item.user.name,
      item.user.office || '성도',
      item.cellName,
      formatIndividualMetric(activeMetricDetail.id, item.count, item.isDone),
      item.isDone ? '완료' : '미실천'
    ]);
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeMetricDetail.label}_코호트분석_${currentWeek?.sunStr || '금주'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeMetricDetail, filteredDataset, currentWeek]);

  const totalFilteredCount = filteredDataset.length;
  const totalPages = Math.ceil(totalFilteredCount / PAGE_SIZE) || 1;
  const paginatedList = useMemo(() => {
    const start = (modalPage - 1) * PAGE_SIZE;
    return filteredDataset.slice(start, start + PAGE_SIZE);
  }, [filteredDataset, modalPage]);

  const uncompletedTotalCount = useMemo(
    () => fullMetricDataset.filter(d => !d.isDone).length,
    [fullMetricDataset]
  );

  return (
    <div className="flex-1 flex flex-col gap-3.5 min-h-0 overflow-y-auto hide-scrollbar font-sans select-none text-zinc-900 pb-20 bg-[#FAFAFA] p-1 sm:p-2">
      
      {/* ====================================================================
          TOP ROW: 3-Column Executive Analytics Bento Grid (12 Cols)
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 shrink-0">
        
        {/* 1. 주간 출석 동향 및 연간 누적 텔레메트리 카드 (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-zinc-200/90 p-4 sm:p-5 flex flex-col justify-between min-h-[276px] shadow-[0_1px_3px_rgba(0,0,0,0.03)] relative">
          <div>
            {/* 상단 컨트롤 헤더 (줄바꿈 원천 차단) */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[14.5px] font-black text-zinc-900 tracking-tight whitespace-nowrap">
                  주간 출석 동향
                </span>
                <span className="text-[10px] font-mono font-bold text-zinc-500 bg-zinc-100 border border-zinc-200/80 px-1.5 py-0.5 rounded whitespace-nowrap tabular-nums">
                  {chartZoomMode === 'weekly' ? '최근 8주' : `${calendarYear}년`}
                </span>
                
                {/* 연간 누적 인터랙티브 팝오버 배지 */}
                <div 
                  className="relative inline-block"
                  onMouseEnter={() => setShowAnnualPopup(true)}
                  onMouseLeave={() => setShowAnnualPopup(false)}
                  onClick={(e) => { e.stopPropagation(); setShowAnnualPopup(prev => !prev); }}
                >
                  <button
                    type="button"
                    className="px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 border border-zinc-300/90 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap tabular-nums shadow-2xs"
                    title="클릭 또는 마우스 오버 시 1년 월간·분기별 누적 상세 팝업"
                  >
                    <span>연간 누적 <b className="font-black text-zinc-950">{annualTotalAttendees.toLocaleString()}명</b></span>
                    <span className="text-[9px] bg-zinc-900 text-white px-1 py-0.2 rounded font-black">Q1-Q4</span>
                  </button>

                  {/* 1년 전체 월간 + 분기별 누적 정리 팝업 */}
                  {showAnnualPopup && (
                    <div 
                      className="fixed sm:absolute left-3 right-3 sm:left-0 sm:right-auto top-24 sm:top-full mt-2 sm:w-[400px] bg-white border border-zinc-300 rounded-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] z-[150] animate-fade-in pointer-events-auto"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center pb-2.5 border-b border-zinc-200 mb-3 gap-2">
                        <div className="min-w-0">
                          <span className="text-[13px] font-black text-zinc-900 block tracking-tight truncate">
                            {calendarYear}년 월간·분기별 누적 텔레메트리
                          </span>
                          <span className="text-[10.5px] font-mono text-zinc-500 whitespace-nowrap">
                            등록 성도 <b className="text-zinc-900">{registeredCount}명</b> 기준
                          </span>
                        </div>
                        <span className="text-[10.5px] font-mono font-black text-zinc-900 bg-zinc-100 px-2 py-1 rounded-md border border-zinc-200 whitespace-nowrap shrink-0 tabular-nums">
                          누적 {annualTotalAttendees.toLocaleString()}명
                        </span>
                      </div>

                      {/* 4분기(Q1~Q4) 요약 미니 그리드 */}
                      <div className="grid grid-cols-4 gap-1.5 mb-3">
                        {quarterlySummary.map(q => (
                          <div key={q.quarter} className="p-2 rounded-lg bg-zinc-50 border border-zinc-200/80 text-center">
                            <span className="text-[9.5px] font-mono font-black text-zinc-400 block">{q.quarter}</span>
                            <span className="text-[11.5px] font-mono font-black text-zinc-900 block tabular-nums">{q.sumAttendees}명</span>
                            <span className="text-[9.5px] font-mono text-zinc-500 tabular-nums">평균 {q.avgRate}%</span>
                          </div>
                        ))}
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-1 pr-1 hide-scrollbar">
                        {annualCumulativeSummary.map((item, idx) => (
                          <div 
                            key={idx} 
                            className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] border transition-colors whitespace-nowrap tabular-nums ${
                              item.isCurrentMonth 
                                ? 'bg-zinc-900 text-white border-zinc-900 font-bold shadow-2xs' 
                                : 'bg-zinc-50/70 border-zinc-200/70 text-zinc-700'
                            }`}
                          >
                            <span className="font-bold w-10">{item.month}</span>
                            <span className={`font-mono ${item.isCurrentMonth ? 'text-zinc-300' : 'text-zinc-500'}`}>
                              참석 <strong className={item.isCurrentMonth ? 'text-white' : 'text-zinc-900'}>{item.monthAttendees}명</strong>
                            </span>
                            <span className="font-mono font-black">
                              누적 {item.cumulativeAttendees.toLocaleString()}명
                            </span>
                            <span className={`font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                              item.isCurrentMonth ? 'bg-white/20 text-white' : 'bg-zinc-200/70 text-zinc-800'
                            }`}>
                              {item.rate}%
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2.5 mt-2.5 border-t border-zinc-100 text-[10px] text-zinc-400 flex justify-between items-center">
                        <span>* 등록 성도 대비 월평균 출석률 산출</span>
                        <button 
                          type="button" 
                          onClick={() => setShowAnnualPopup(false)} 
                          className="text-zinc-700 hover:text-zinc-950 font-black px-2 py-0.5 rounded bg-zinc-100 cursor-pointer"
                        >
                          닫기 ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/80 text-[10.5px] font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setChartZoomMode('weekly')}
                  className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                    chartZoomMode === 'weekly' ? 'bg-white text-zinc-900 shadow-2xs font-black' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  주간 8주
                </button>
                <button
                  type="button"
                  onClick={() => setChartZoomMode('annual')}
                  className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                    chartZoomMode === 'annual' ? 'bg-white text-zinc-900 shadow-2xs font-black' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  연간 12개월
                </button>
              </div>
            </div>

            {/* 차트 범례 및 평균선 표시 */}
            <div className="flex items-center justify-between text-[10.5px] text-zinc-400 mb-3 whitespace-nowrap">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 font-medium text-zinc-600">
                  <span className="w-2 h-2 rounded-xs bg-zinc-900" /> 선택/금주
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-xs bg-zinc-400" /> 주간 추이
                </span>
              </div>
              <span className="font-mono text-[10px] text-zinc-500 tabular-nums">
                평균 이행률 <b className="text-zinc-800">{chartAvgRate}%</b>
              </span>
            </div>
          </div>

          {/* 바 차트 캔버스 (평균 가이드라인 포함) */}
          <div className="h-36 w-full flex items-end justify-between gap-1.5 pt-4 pb-1 px-1 border-b border-zinc-100 relative">
            {/* 평균 기준 점선 */}
            {chartAvgRate > 0 && (
              <div
                style={{ bottom: `${Math.min(92, Math.max(12, chartAvgRate))}%` }}
                className="absolute inset-x-0 border-t border-dashed border-zinc-300/90 pointer-events-none z-0 flex justify-end pr-1"
              >
                <span className="text-[8.5px] font-mono font-bold text-zinc-400 bg-white/90 px-1 -mt-2 rounded">
                  AVG {chartAvgRate}%
                </span>
              </div>
            )}

            {chartZoomMode === 'weekly' ? (
              (recentSundaysData || []).map((d, idx) => {
                const isHovered = hoveredBarIndex === idx;
                const isCurrent = d.isSelected;
                const heightPct = Math.max(8, Math.min(100, d.rate || 0));

                return (
                  <div
                    key={d.date || idx}
                    onMouseEnter={() => setHoveredBarIndex && setHoveredBarIndex(idx)}
                    onMouseLeave={() => setHoveredBarIndex && setHoveredBarIndex(null)}
                    onClick={() => setSelectedWeekOffset && setSelectedWeekOffset(d.offset)}
                    className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer relative group z-10"
                  >
                    {(isHovered || isCurrent) && (
                      <div
                        className={`absolute -top-7 z-30 text-[9.5px] font-mono py-0.5 px-1.5 rounded shadow-sm pointer-events-none whitespace-nowrap tabular-nums transition-all ${
                          isHovered ? 'bg-zinc-900 text-white font-bold scale-105' : 'bg-zinc-100 text-zinc-800 border border-zinc-200 font-bold'
                        }`}
                      >
                        {isHovered ? `${d.attended}명 (${d.rate}%)` : `${d.rate}%`}
                      </div>
                    )}
                    <div className="w-full max-w-[26px] bg-zinc-100/90 border border-zinc-200/60 rounded-t-md overflow-hidden flex flex-col justify-end h-full">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full transition-all duration-300 rounded-t-sm ${
                          isCurrent ? 'bg-zinc-900' : isHovered ? 'bg-zinc-700' : 'bg-zinc-400/85'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-mono mt-1.5 whitespace-nowrap tabular-nums ${
                        isCurrent ? 'text-zinc-900 font-black underline underline-offset-4' : 'text-zinc-400 font-bold'
                      }`}
                    >
                      {d.label}
                    </span>
                  </div>
                );
              })
            ) : (
              annualCumulativeSummary.map((m, idx) => {
                const heightPct = Math.max(8, Math.min(100, m.rate || 0));
                const isHovered = hoveredAnnualMonthIdx === idx;

                return (
                  <div 
                    key={m.month} 
                    onMouseEnter={() => setHoveredAnnualMonthIdx(idx)}
                    onMouseLeave={() => setHoveredAnnualMonthIdx(null)}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer z-10"
                  >
                    {isHovered && (
                      <div className="absolute -top-11 z-30 bg-zinc-900 text-white text-[9.5px] font-mono py-1 px-2 rounded-lg shadow-xl pointer-events-none whitespace-nowrap text-center tabular-nums">
                        <div className="font-bold">{m.month}: {m.monthAttendees}명 ({m.rate}%)</div>
                        <div className="text-[8.5px] text-zinc-300">누적 {m.cumulativeAttendees}명</div>
                      </div>
                    )}
                    <div className="w-full max-w-[18px] bg-zinc-100/90 border border-zinc-200/60 rounded-t-sm overflow-hidden flex flex-col justify-end h-full">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full transition-all rounded-t-sm ${
                          m.isCurrentMonth ? 'bg-zinc-900' : isHovered ? 'bg-zinc-700' : 'bg-zinc-400/85'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[9.5px] font-mono mt-1.5 whitespace-nowrap tabular-nums ${
                        m.isCurrentMonth ? 'text-zinc-900 font-black' : 'text-zinc-400 font-medium'
                      }`}
                    >
                      {m.month.replace('월', '')}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex flex-wrap justify-between items-center gap-2 pt-2.5 text-[11px] whitespace-nowrap">
            <span className="text-zinc-500">
              주간 범위: <b className="text-zinc-900 font-mono tabular-nums">{currentWeek?.rangeShort}</b>
            </span>
            <span className="font-mono font-black text-zinc-900 bg-zinc-100 px-2.5 py-0.5 rounded-md border border-zinc-200/90 tabular-nums">
              주일 성수 {realStats?.totalAttRate || 0}% ({realStats?.todayAttCount || 0}/{registeredCount}명)
            </span>
          </div>
        </div>

        {/* 2. 사역 지표 4대 실천 KPI 매트릭스 (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-zinc-200/90 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[276px]">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-2.5 mb-3 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[14.5px] font-black text-zinc-900 tracking-tight whitespace-nowrap">
                사역 핵심 지표 (KPI)
              </span>
              <span className="text-[9px] font-mono font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            </div>
            <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/80 text-[10.5px] font-bold shrink-0">
              <button
                type="button"
                onClick={() => setMetricViewMode('current')}
                className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  metricViewMode === 'current' ? 'bg-white text-zinc-900 shadow-2xs font-black' : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                주간
              </button>
              <button
                type="button"
                onClick={() => setMetricViewMode('cumulative')}
                className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  metricViewMode === 'cumulative' ? 'bg-white text-zinc-900 shadow-2xs font-black' : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                누적
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 flex-1">
            {Object.values(annualMetrics || {}).map(metric => (
              <div 
                key={metric.id} 
                onClick={() => {
                  setActiveMetricDetail(metric);
                  setModalCohortTab('UNCOMPLETED');
                  setModalCellFilter('ALL');
                  setModalSearch('');
                  setModalPage(1);
                }}
                className="p-3 rounded-xl bg-zinc-50/70 border border-zinc-200/80 hover:border-zinc-900 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex justify-between items-center gap-1 mb-1">
                    <span className="text-[11.5px] font-black text-zinc-700 group-hover:text-zinc-950 transition-colors whitespace-nowrap truncate">
                      {metric.label}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-zinc-500 group-hover:text-zinc-900 flex items-center gap-0.5 shrink-0 tabular-nums">
                      {metric.rate}% <SvgArrowUpRight />
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-1 mt-1">
                    <div className="flex items-baseline gap-1 whitespace-nowrap">
                      <span className="text-[21px] font-mono font-black text-zinc-900 leading-none tabular-nums">
                        {metric.doneCount}
                      </span>
                      <span className="text-[10.5px] font-bold text-zinc-500">{metric.unit}</span>
                    </div>
                    {metric.subBadge && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-zinc-200 text-zinc-600 whitespace-nowrap shrink-0 tabular-nums">
                        {metric.subBadge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 block truncate mt-1.5">{metric.sub}</span>
                </div>
                <div className="mt-2.5 w-full bg-zinc-200/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, metric.rate || 0)}%`, backgroundColor: metric.color || '#18181B' }}
                    className="h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. 연간 전도 및 재적 목표 게이지 (3 Cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-zinc-200/90 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[276px]">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-2.5 mb-2 gap-2">
            <span className="text-[14.5px] font-black text-zinc-900 tracking-tight whitespace-nowrap">
              전도 목표 달성도
            </span>
            <button
              type="button"
              onClick={() => setIsEditingGoal(!isEditingGoal)}
              className="px-2 py-1 rounded-md text-[10.5px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              <SvgTarget /> {isEditingGoal ? '취소' : '목표 수정'}
            </button>
          </div>

          {isEditingGoal ? (
            <div className="flex-1 flex flex-col justify-center gap-2.5 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 animate-fade-in">
              <label className="text-[10.5px] font-black text-zinc-500 uppercase tracking-wider">
                {calendarYear}년 목표 재적 인원 설정
              </label>
              <input
                type="number"
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-white border border-zinc-300 font-mono font-black text-zinc-900 outline-none focus:border-zinc-900 text-[15px] tabular-nums"
              />
              <button
                type="button"
                onClick={handleSaveGoal}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-black text-[12px] shadow-xs cursor-pointer transition-colors"
              >
                목표 저장하기
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-between flex-1 pt-1">
              <div className="relative w-28 h-28 flex flex-col items-center justify-center my-auto">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-zinc-100"
                    strokeWidth="3.2"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-zinc-900 transition-all duration-1000"
                    strokeDasharray={`${goalProgress}, 100`}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[22px] font-mono font-black text-zinc-900 leading-none tabular-nums">
                    {goalProgress}%
                  </span>
                  <span className="text-[9.5px] font-bold text-zinc-400 mt-1 uppercase tracking-widest">
                    ACHIEVED
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-3 gap-1.5 pt-3 mt-2 border-t border-zinc-100 text-center whitespace-nowrap">
                <div className="p-1.5 rounded-lg bg-zinc-50 border border-zinc-200/60">
                  <span className="text-[9.5px] font-bold text-zinc-400 block">현재 재적</span>
                  <span className="text-[12.5px] font-mono font-black text-zinc-900 tabular-nums">{registeredCount}명</span>
                </div>
                <div className="p-1.5 rounded-lg bg-zinc-50 border border-zinc-200/60">
                  <span className="text-[9.5px] font-bold text-zinc-400 block">연간 목표</span>
                  <span className="text-[12.5px] font-mono font-bold text-zinc-600 tabular-nums">{goalCount}명</span>
                </div>
                <div className="p-1.5 rounded-lg bg-zinc-900 text-white">
                  <span className="text-[9.5px] font-bold text-zinc-300 block">잔여 목표</span>
                  <span className="text-[12.5px] font-mono font-black tabular-nums">
                    {remainingToGoal > 0 ? `-${remainingToGoal}명` : '달성'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ====================================================================
          BOTTOM ROW: 2-Column Split (목장별 주간 사역 관제 8 Cols + 공지 콘솔 4 Cols)
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 min-h-0 flex-1">
        
        {/* 1. 목장별 주간 사역 관제 센터 (8 Cols - PC 테이블 & 모바일 카드 자동 대응) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-zinc-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden min-h-[340px]">
          
          {/* 상단 툴바 */}
          <div className="px-4 py-3 border-b border-zinc-200/90 bg-zinc-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[14.5px] font-black text-zinc-900 tracking-tight whitespace-nowrap">
                목장별 주간 사역 관제
              </span>
              <span className="text-[10.5px] font-mono font-bold text-zinc-600 bg-white border border-zinc-200 px-2 py-0.5 rounded-md whitespace-nowrap tabular-nums">
                {currentWeek?.rangeShort}
              </span>
              <span className="text-[10.5px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md whitespace-nowrap tabular-nums">
                보고서 {submittedReportCount}/{enrichedCells.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center bg-zinc-200/70 p-0.5 rounded-lg border border-zinc-200 text-[11px] font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedWeekOffset(prev => prev - 1)}
                  className="px-2 py-1 rounded-md hover:bg-white text-zinc-700 transition-all cursor-pointer flex items-center gap-0.5 whitespace-nowrap"
                >
                  <SvgChevronLeft /> 이전
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWeekOffset(0)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                    selectedWeekOffset === 0 ? 'bg-white text-zinc-950 shadow-2xs font-black' : 'text-zinc-600'
                  }`}
                >
                  금주
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWeekOffset(prev => prev + 1)}
                  className="px-2 py-1 rounded-md hover:bg-white text-zinc-700 transition-all cursor-pointer flex items-center gap-0.5 whitespace-nowrap"
                >
                  다음 <SvgChevronRight />
                </button>
              </div>

              <button
                type="button"
                onClick={exportAttendanceCSV}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <SvgDownload /> CSV 추출
              </button>
            </div>
          </div>

          {/* 서브 검색 및 보고서 제출 필터 바 */}
          <div className="px-4 py-2 border-b border-zinc-100 bg-white flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/70 text-[10.5px] font-bold">
              {[
                { id: 'ALL', label: `전체 목장 (${enrichedCells.length})` },
                { id: 'SUBMITTED', label: `제출 완료 (${submittedReportCount})` },
                { id: 'UNSUBMITTED', label: `미제출 (${enrichedCells.length - submittedReportCount})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCellStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                    cellStatusFilter === tab.id ? 'bg-white text-zinc-900 shadow-2xs font-black' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 max-w-xs min-w-[160px]">
              <span className="absolute left-2.5 top-2 text-zinc-400"><SvgSearch /></span>
              <input
                type="text"
                value={cellSearchQuery}
                onChange={e => setCellSearchQuery(e.target.value)}
                placeholder="목장, 목자, 성도명 검색..."
                className="w-full pl-8 pr-2.5 py-1 text-[11.5px] bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:bg-white focus:border-zinc-800 font-medium"
              />
            </div>
          </div>

          {/* 데스크톱 & 태블릿 가로 뷰: 정밀 테이블 (줄바꿈 방지 완료) */}
          <div className="hidden md:block flex-1 overflow-auto hide-scrollbar bg-white">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/90 text-[10.5px] font-black text-zinc-500 uppercase tracking-wider sticky top-0 z-10 whitespace-nowrap">
                  <th className="py-2.5 px-3.5 w-11 text-center">No</th>
                  <th className="py-2.5 px-3">목장명</th>
                  <th className="py-2.5 px-3">담당 목자</th>
                  <th className="py-2.5 px-3 w-28">주일 출석률</th>
                  <th className="py-2.5 px-3">배정 성도 (흑색: 주일출석)</th>
                  <th className="py-2.5 px-3 text-center w-24">목장보고서</th>
                  <th className="py-2.5 px-3.5 text-center w-20">점검표</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredCells.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-zinc-400 font-medium">
                      조건에 해당하는 목장 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredCells.map((cell) => (
                    <tr key={cell.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-2.5 px-3.5 text-center font-mono text-[11px] text-zinc-400 tabular-nums whitespace-nowrap">
                        {String(cell.orderNo).padStart(2, '0')}
                      </td>
                      <td className="py-2.5 px-3 font-black text-zinc-900 whitespace-nowrap">
                        {cell.name}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-zinc-600 whitespace-nowrap">
                        {cell.shepherd_name || <span className="text-zinc-300 italic font-normal">미지정</span>}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[10.5px] font-mono tabular-nums">
                            <span className="font-black text-zinc-800">{cell.attRate}%</span>
                            <span className="text-zinc-400">{cell.attendedCount}/{cell.members.length}명</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${cell.attRate}%` }}
                              className="h-full bg-zinc-900 rounded-full transition-all duration-300"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {cell.memberStatuses.length === 0 ? (
                            <span className="text-[10.5px] text-zinc-300 italic">미배정</span>
                          ) : (
                            cell.memberStatuses.map(m => (
                              <button
                                key={m.userName}
                                type="button"
                                onClick={() =>
                                  setSelectedUserProfile &&
                                  setSelectedUserProfile(users.find(u => u.name === m.userName) || { name: m.userName })
                                }
                                className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold cursor-pointer transition-all border whitespace-nowrap ${
                                  m.isAtt
                                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                                    : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900'
                                }`}
                              >
                                {m.userName}
                              </button>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setActiveReportCell(cell)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all border whitespace-nowrap cursor-pointer ${
                            cell.hasReport
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-2xs'
                              : 'bg-zinc-50 border-zinc-200/80 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          {cell.hasReport ? '제출 완료' : '미제출'}
                        </button>
                      </td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setActiveChecklistCell(cell)}
                          className="px-2.5 py-1 rounded-md text-[11px] font-black bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 cursor-pointer shadow-2xs transition-colors whitespace-nowrap"
                        >
                          Q/M/T
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 📱 모바일 전용 고밀도 카드 리스트 뷰 (가로 스크롤 0%, 줄바꿈 깨짐 0%) */}
          <div className="md:hidden flex-1 overflow-y-auto p-3 space-y-2.5 bg-zinc-50/50 hide-scrollbar">
            {filteredCells.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-xs font-medium">
                조건에 해당하는 목장이 없습니다.
              </div>
            ) : (
              filteredCells.map((cell) => (
                <div key={cell.id} className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10.5px] font-mono font-bold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                        #{String(cell.orderNo).padStart(2, '0')}
                      </span>
                      <span className="text-[13.5px] font-black text-zinc-900 truncate">{cell.name}</span>
                      <span className="text-[11px] font-bold text-zinc-500 whitespace-nowrap">
                        (목자: {cell.shepherd_name || '미지정'})
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-black text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 whitespace-nowrap tabular-nums">
                      출석 {cell.attendedCount}/{cell.members.length} ({cell.attRate}%)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {cell.memberStatuses.map(m => (
                      <button
                        key={m.userName}
                        type="button"
                        onClick={() =>
                          setSelectedUserProfile &&
                          setSelectedUserProfile(users.find(u => u.name === m.userName) || { name: m.userName })
                        }
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border whitespace-nowrap ${
                          m.isAtt
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                        }`}
                      >
                        {m.userName}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setActiveReportCell(cell)}
                      className={`py-1.5 rounded-lg text-[11px] font-bold border whitespace-nowrap ${
                        cell.hasReport
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                      }`}
                    >
                      보고서: {cell.hasReport ? '제출 완료' : '미제출'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveChecklistCell(cell)}
                      className="py-1.5 rounded-lg text-[11px] font-black bg-zinc-900 text-white whitespace-nowrap"
                    >
                      Q/M/T 점검표 열기
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. 공지 배포 센터 (4 Cols - 원클릭 템플릿 매크로 탑재) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-zinc-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between overflow-hidden min-h-[340px]">
          <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/70 flex justify-between items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-zinc-900 animate-pulse" />
              <span className="text-[14px] font-black text-zinc-900 tracking-tight">공지 배포 센터</span>
            </div>
            <div className="flex bg-zinc-200/70 p-0.5 rounded-lg border border-zinc-200 text-[10.5px] font-bold shrink-0">
              <button
                type="button"
                onClick={() => setActiveTabNotice('create')}
                className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  activeTabNotice === 'create' ? 'bg-white text-zinc-900 shadow-2xs font-black' : 'text-zinc-500'
                }`}
              >
                공지 작성
              </button>
              <button
                type="button"
                onClick={() => setActiveTabNotice('history')}
                className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  activeTabNotice === 'history' ? 'bg-white text-zinc-900 shadow-2xs font-black' : 'text-zinc-500'
                }`}
              >
                발송 이력 ({noticeList.length})
              </button>
            </div>
          </div>

          {activeTabNotice === 'create' ? (
            <div className="p-4 flex flex-col gap-3 flex-1 justify-between bg-white">
              <div className="space-y-2.5">
                {/* 퀵 템플릿 매크로 칩 바 */}
                <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
                  <span className="text-[10px] font-bold text-zinc-400 whitespace-nowrap shrink-0">템플릿:</span>
                  {NOTICE_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setBroadcastTitle && setBroadcastTitle(tpl.title);
                        setBroadcastScope && setBroadcastScope(tpl.scope);
                        setBroadcastBody && setBroadcastBody(tpl.body);
                      }}
                      className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-bold border border-zinc-200/80 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                    >
                      + {tpl.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="공지 제목을 입력하세요..."
                    value={broadcastTitle}
                    onChange={e => setBroadcastTitle(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 text-[12px] font-bold bg-zinc-50/70 border border-zinc-200 rounded-xl outline-none focus:bg-white focus:border-zinc-900 text-zinc-900 placeholder:text-zinc-400 transition-all"
                  />
                  <select
                    value={broadcastScope}
                    onChange={e => setBroadcastScope(e.target.value)}
                    className="px-2.5 py-2 text-[11.5px] font-bold bg-zinc-50 border border-zinc-200 rounded-xl outline-none text-zinc-800 cursor-pointer shrink-0"
                  >
                    <option value="all">전체 성도</option>
                    <option value="shepherds">목자 전용</option>
                  </select>
                </div>

                <textarea
                  rows={5}
                  placeholder="성도 및 목자들에게 전달할 공지 내용을 입력하세요..."
                  value={broadcastBody}
                  onChange={e => setBroadcastBody(e.target.value)}
                  className="w-full p-3 text-[12.5px] bg-zinc-50/70 border border-zinc-200 rounded-xl outline-none focus:bg-white focus:border-zinc-900 text-zinc-800 resize-none leading-relaxed placeholder:text-zinc-400 transition-all"
                />
              </div>

              <button
                type="button"
                onClick={handlePublishNotice}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-[12px] font-black shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <SvgSend /> 공지사항 즉시 배포하기
              </button>
            </div>
          ) : (
            <div className="p-3.5 flex-1 overflow-y-auto space-y-2 hide-scrollbar bg-zinc-50/40">
              {noticeList.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-[12px] font-medium">
                  발송된 공지 이력이 없습니다.
                </div>
              ) : (
                noticeList.map(n => (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl border border-zinc-200 bg-white flex flex-col gap-1 shadow-2xs hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex justify-between items-center text-[10px] whitespace-nowrap">
                      <span className="font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
                        {n.scope}
                      </span>
                      <div className="flex items-center gap-1.5 text-zinc-400 font-mono tabular-nums">
                        <SvgClock /> {n.created_at}
                        <button
                          type="button"
                          onClick={() => handleDeleteNotice(n.id)}
                          className="hover:text-rose-600 cursor-pointer ml-1 p-0.5 transition-colors"
                          title="공지 삭제"
                        >
                          <SvgTrash />
                        </button>
                      </div>
                    </div>
                    <span className="text-[12.5px] font-black text-zinc-900 truncate mt-0.5">{n.title}</span>
                    <p className="text-[11.5px] text-zinc-500 line-clamp-2 leading-relaxed">{n.content}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          🌟 슬라이드 오버(Drawer) 사역 인텔리전스 인스펙터 패널
         ==================================================================== */}
      {activeMetricDetail && (
        <div
          className="fixed inset-0 z-[300] bg-zinc-950/45 backdrop-blur-xs flex justify-end transition-all animate-fade-in pointer-events-auto select-none"
          onClick={() => setActiveMetricDetail(null)}
        >
          <div
            className="w-full max-w-[580px] h-full bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.18)] flex flex-col border-l border-zinc-200 animate-slide-left"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-zinc-200 bg-zinc-50/80 flex justify-between items-start gap-3 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    style={{ backgroundColor: activeMetricDetail.color || '#18181B' }}
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                  />
                  <h3 className="text-[17px] font-black text-zinc-900 tracking-tight whitespace-nowrap">
                    {activeMetricDetail.label} 코호트 인스펙터
                  </h3>
                  <span className="text-[10.5px] font-mono font-bold text-zinc-600 bg-white border border-zinc-200 px-2 py-0.5 rounded-md shadow-2xs whitespace-nowrap tabular-nums">
                    재적 {users.length}명
                  </span>
                </div>
                <p className="text-[11.5px] font-medium text-zinc-500 mt-1 truncate">
                  목장별 이행률 분석 및 미실천 성도에게 개별/일괄 독려 알림을 발송합니다.
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleExportCohortCSV}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs"
                  title="현재 필터링된 성도 명단을 CSV로 저장"
                >
                  <SvgDownload /> CSV
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMetricDetail(null)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-900 bg-white rounded-lg border border-zinc-200 shadow-2xs cursor-pointer transition-colors"
                >
                  <SvgClose />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto hide-scrollbar flex-1 bg-white">
              
              {/* Summary KPI Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex flex-col justify-between">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">전체 실천율</span>
                  <div className="mt-1">
                    <span className="text-[20px] font-mono font-black text-zinc-900 block leading-none tabular-nums">
                      {activeMetricDetail.rate}%
                    </span>
                    <span className="text-[10.5px] font-mono font-bold text-zinc-400 mt-1 block tabular-nums">
                      {activeMetricDetail.doneCount}/{users.length}명
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-200 flex flex-col justify-between">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">미실천군</span>
                    <span className="text-[18px] font-mono font-black text-rose-700 leading-none tabular-nums">
                      {uncompletedTotalCount}명
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleBulkRemindUncompleted}
                    className="mt-2 w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10.5px] font-black shadow-2xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <SvgBell /> 전체 일괄 독려
                  </button>
                </div>

                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex flex-col justify-between">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">완료군</span>
                    <span className="text-[18px] font-mono font-black text-emerald-700 leading-none tabular-nums">
                      {activeMetricDetail.doneCount}명
                    </span>
                  </div>
                  <div className="mt-2 w-full py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg text-[10.5px] font-black text-center whitespace-nowrap">
                    정상 이행
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col gap-2.5 pt-3 border-t border-zinc-100 flex-1 min-h-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-[11px] font-bold overflow-x-auto hide-scrollbar">
                    <button
                      type="button"
                      onClick={() => { setModalCohortTab('UNCOMPLETED'); setModalPage(1); }}
                      className={`px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                        modalCohortTab === 'UNCOMPLETED' ? 'bg-white text-rose-700 shadow-2xs font-black' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      미실천 ({uncompletedTotalCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => { setModalCohortTab('COMPLETED'); setModalPage(1); }}
                      className={`px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                        modalCohortTab === 'COMPLETED' ? 'bg-white text-emerald-700 shadow-2xs font-black' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      완료 ({activeMetricDetail.doneCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => { setModalCohortTab('ALL'); setModalPage(1); }}
                      className={`px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                        modalCohortTab === 'ALL' ? 'bg-white text-zinc-900 shadow-2xs font-black' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      전체 ({users.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalCohortTab('CELL_BREAKDOWN')}
                      className={`px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                        modalCohortTab === 'CELL_BREAKDOWN' ? 'bg-white text-zinc-900 shadow-2xs font-black' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      목장별 순위
                    </button>
                  </div>

                  {modalCohortTab !== 'CELL_BREAKDOWN' && (
                    <select
                      value={modalCellFilter}
                      onChange={e => { setModalCellFilter(e.target.value); setModalPage(1); }}
                      className="px-2.5 py-1.5 text-[11px] bg-white border border-zinc-200 rounded-lg outline-none font-bold text-zinc-700 cursor-pointer shadow-2xs shrink-0"
                    >
                      <option value="ALL">전체 목장</option>
                      {cells.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  )}
                </div>

                {modalCohortTab !== 'CELL_BREAKDOWN' && (
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-400"><SvgSearch /></span>
                    <input
                      type="text"
                      placeholder="성도 이름, 직분, 소속 목장 검색..."
                      value={modalSearch}
                      onChange={e => { setModalSearch(e.target.value); setModalPage(1); }}
                      className="w-full pl-9 pr-3 py-2 text-[12px] bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:bg-white focus:border-zinc-900 placeholder:text-zinc-400 font-medium transition-all"
                    />
                  </div>
                )}

                {/* List/Table View */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-2xs flex-1 min-h-[280px] flex flex-col">
                  {modalCohortTab === 'CELL_BREAKDOWN' ? (
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-zinc-50/50 hide-scrollbar">
                      {cellAnalyticsBreakdown.map((cb, rIdx) => (
                        <div key={cb.cellName} className="p-3 bg-white rounded-xl border border-zinc-200 shadow-2xs flex flex-col gap-1.5">
                          <div className="flex justify-between items-center whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-[10.5px] font-mono font-black text-zinc-400 w-5">
                                #{rIdx + 1}
                              </span>
                              <span className="text-[13.5px] font-black text-zinc-900">{cb.cellName}</span>
                              <span className="text-[10.5px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                                목자: {cb.shepherd}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 font-mono tabular-nums">
                              <span className="text-[11.5px] font-bold text-zinc-600">{cb.done}/{cb.total}명</span>
                              <span
                                className={`text-[11px] font-black px-2 py-0.5 rounded border ${
                                  cb.rate >= 70
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : cb.rate >= 40
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {cb.rate}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${cb.rate}%` }}
                              className={`h-full rounded-full transition-all duration-500 ${
                                cb.rate >= 70 ? 'bg-emerald-500' : cb.rate >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto hide-scrollbar">
                      <table className="w-full text-left border-collapse text-[12px]">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10 whitespace-nowrap">
                          <tr>
                            <th className="py-2.5 px-3 w-10 text-center">No</th>
                            <th className="py-2.5 px-2.5">성도명</th>
                            <th className="py-2.5 px-2.5">직분</th>
                            <th className="py-2.5 px-2.5">소속 목장</th>
                            <th className="py-2.5 px-2.5 text-center">실천량</th>
                            <th className="py-2.5 px-3 text-right">상태 / 권면</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white font-medium">
                          {paginatedList.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-16 text-center text-zinc-400 font-bold text-[12.5px]">
                                일치하는 성도가 없습니다.
                              </td>
                            </tr>
                          ) : (
                            paginatedList.map((item, idx) => (
                              <tr key={item.user.name} className="hover:bg-zinc-50/80 transition-colors whitespace-nowrap">
                                <td className="py-2.5 px-3 text-center font-mono text-[10.5px] text-zinc-400 tabular-nums">
                                  {(modalPage - 1) * PAGE_SIZE + idx + 1}
                                </td>
                                <td
                                  onClick={() => setSelectedUserProfile && setSelectedUserProfile(item.user)}
                                  className="py-2.5 px-2.5 font-black text-zinc-900 hover:underline cursor-pointer"
                                >
                                  {item.user.name}
                                </td>
                                <td className="py-2.5 px-2.5 text-zinc-500 font-bold text-[11px]">
                                  {item.user.office || '성도'}
                                </td>
                                <td className="py-2.5 px-2.5 text-zinc-700 font-semibold text-[11.5px]">
                                  {item.cellName}
                                </td>
                                <td className="py-2.5 px-2.5 text-center font-mono font-bold text-zinc-900 bg-zinc-50/70 tabular-nums">
                                  {formatIndividualMetric(activeMetricDetail.id, item.count, item.isDone)}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  {item.isDone ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      완료
                                    </span>
                                  ) : (
                                    <div className="inline-flex items-center gap-1">
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                                        미실천
                                      </span>
                                      <button
                                        type="button"
                                        disabled={sendingSingleUser === item.user.name}
                                        onClick={() => handleSingleRemindUser(item.user)}
                                        className="px-2 py-0.5 rounded text-[10px] font-black bg-zinc-900 hover:bg-zinc-700 text-white cursor-pointer disabled:opacity-40 transition-colors"
                                        title={`${item.user.name} 성도에게 1:1 권면 알림 발송`}
                                      >
                                        {sendingSingleUser === item.user.name ? '...' : '독려'}
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Drawer Footer (Pagination) */}
            <div className="px-6 py-3.5 border-t border-zinc-200 bg-zinc-50 flex justify-between items-center text-[11.5px] shrink-0 whitespace-nowrap">
              {modalCohortTab !== 'CELL_BREAKDOWN' ? (
                <>
                  <div className="flex items-center gap-1 text-zinc-500 font-mono tabular-nums">
                    <span>조회 {totalFilteredCount}명 중</span>
                    <b className="text-zinc-900">
                      {totalFilteredCount === 0 ? 0 : (modalPage - 1) * PAGE_SIZE + 1}-
                      {Math.min(totalFilteredCount, modalPage * PAGE_SIZE)}
                    </b>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={modalPage === 1}
                        onClick={() => setModalPage(p => Math.max(1, p - 1))}
                        className="px-2.5 py-1 bg-white border border-zinc-200 rounded-md text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 cursor-pointer font-bold shadow-2xs"
                      >
                        이전
                      </button>
                      <span className="px-1.5 font-mono font-black text-zinc-900 tabular-nums">
                        {modalPage}/{totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={modalPage === totalPages}
                        onClick={() => setModalPage(p => Math.min(totalPages, p + 1))}
                        className="px-2.5 py-1 bg-white border border-zinc-200 rounded-md text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 cursor-pointer font-bold shadow-2xs"
                      >
                        다음
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <span className="text-[11px] text-zinc-400 font-mono">
                  * 목장별 실천율 내림차순 정렬
                </span>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 슬라이드 애니메이션 스타일 */}
      <style>{`
        .animate-slide-left { animation: slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}
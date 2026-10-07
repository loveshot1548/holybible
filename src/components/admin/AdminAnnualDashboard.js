// src/components/admin/AdminAnnualDashboard.js
import React, { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';

// 엔터프라이즈 모노크롬 SVG 아이콘 세트
const SvgDownload = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const SvgTarget = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const SvgSend = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const SvgTrash = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const SvgClock = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const SvgClose = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const SvgSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const SvgBell = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;

export default function AdminAnnualDashboard({
  chartZoomMode = 'weekly', setChartZoomMode, calendarYear, recentSundaysData = [], selectedWeekOffset, setSelectedWeekOffset,
  hoveredBarIndex, setHoveredBarIndex, annualMonthlyData = [], currentWeek, realStats, metricViewMode, setMetricViewMode,
  activeMetricDetail, setActiveMetricDetail, annualMetrics, isEditingGoal, setIsEditingGoal, goalInput, setGoalInput,
  handleSaveGoal, targetGoal, cells = [], cellMembers = [], attendance = [], users = [], getReportForCell, exportAttendanceCSV,
  setSelectedUserProfile, setActiveReportCell, setActiveChecklistCell, noticeList = [], handleDeleteNotice, broadcastTitle,
  setBroadcastTitle, broadcastScope, setBroadcastScope, broadcastBody, setBroadcastBody, handlePublishNotice
}) {
  const [activeTabNotice, setActiveTabNotice] = useState('create');

  // 연간 누적 팝업 상태 (마우스 호버 & 터치 제어)
  const [showAnnualPopup, setShowAnnualPopup] = useState(false);
  const [hoveredAnnualMonthIdx, setHoveredAnnualMonthIdx] = useState(null);

  const [modalCohortTab, setModalCohortTab] = useState('UNCOMPLETED');
  const [modalCellFilter, setModalCellFilter] = useState('ALL');
  const [modalSearch, setModalSearch] = useState('');
  const [modalPage, setModalPage] = useState(1);
  const PAGE_SIZE = 30;

  const registeredCount = realStats?.totalSaints || users.length || 0;
  const goalCount = Number(targetGoal) || 0;
  const goalProgress = goalCount > 0 ? Math.min(100, Math.round((registeredCount / goalCount) * 100)) : 0;

  // 1년 월간 누적 정리 데이터 산출
  const annualCumulativeSummary = useMemo(() => {
    let runningTotal = 0;
    const totalMembers = registeredCount || 1;

    return annualMonthlyData.map((m) => {
      const monthCount = m.count || 0;
      runningTotal += monthCount;

      return {
        month: m.month,
        monthAttendees: monthCount,
        cumulativeAttendees: runningTotal,
        rate: m.rate,
        totalMembers,
        isCurrentMonth: m.isCurrentMonth
      };
    });
  }, [annualMonthlyData, registeredCount]);

  const annualTotalAttendees = useMemo(() => {
    if (annualCumulativeSummary.length === 0) return 0;
    return annualCumulativeSummary[annualCumulativeSummary.length - 1].cumulativeAttendees;
  }, [annualCumulativeSummary]);

  const userCellMap = useMemo(() => {
    const map = new Map();
    cellMembers.forEach(m => {
      const c = cells.find(item => item.id === m.cell_id);
      if (c) map.set(m.user_name, c.name);
    });
    return map;
  }, [cellMembers, cells]);

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
        isDone = userAtts.some(a => a.date === currentWeek.sunStr && (a.type === '주일' || a.type === '주일예배'));
        count = isDone ? 1 : 0;
      }

      return { user: u, cellName: userCellMap.get(u.name) || '미배정', isDone, count };
    });
  }, [activeMetricDetail, users, attendance, currentWeek, userCellMap]);

  // 🌟 [핵심 개선] 개인별 실천 지표 단위 포맷터 (장/회/출석 완벽 분기)
  const formatIndividualMetric = (typeId, count, isDone) => {
    if (typeId === 'bible') return `${count}장`;
    if (typeId === 'qt') return `${count}회`;
    if (typeId === 'thanks') return `${count}회`;
    if (typeId === 'sunday') return isDone ? '출석' : '결석';
    return `${count}회`;
  };

  const uncompletedUsers = useMemo(() => fullMetricDataset.filter(d => !d.isDone).map(d => d.user), [fullMetricDataset]);

  const handleBulkRemindUncompleted = async () => {
    if (!uncompletedUsers || uncompletedUsers.length === 0) {
      return alert("독려할 미실천자가 없습니다. 모든 성도가 실천을 완료했습니다.");
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
      } catch (err) { alert("알림 발송 중 오류가 발생했습니다: " + err.message); }
    } else { alert("데이터베이스가 연결되어 있지 않습니다."); }
  };

  const cellAnalyticsBreakdown = useMemo(() => {
    if (!activeMetricDetail || cells.length === 0) return [];
    return cells.map(c => {
      const cellUsers = fullMetricDataset.filter(d => d.cellName === c.name);
      const total = cellUsers.length;
      const done = cellUsers.filter(d => d.isDone).length;
      const rate = total > 0 ? Math.round((done / total) * 100) : 0;
      return { cellName: c.name, shepherd: c.shepherd_name || '미지정', total, done, uncompleted: total - done, rate };
    }).sort((a, b) => a.rate - b.rate);
  }, [activeMetricDetail, cells, fullMetricDataset]);

  const filteredDataset = useMemo(() => {
    return fullMetricDataset.filter(item => {
      if (modalCohortTab === 'UNCOMPLETED' && item.isDone) return false;
      if (modalCohortTab === 'COMPLETED' && !item.isDone) return false;
      if (modalCellFilter !== 'ALL' && item.cellName !== modalCellFilter) return false;
      if (!modalSearch.trim()) return true;
      const q = modalSearch.toLowerCase();
      return item.user.name.toLowerCase().includes(q) || (item.user.office || '').toLowerCase().includes(q) || item.cellName.toLowerCase().includes(q);
    });
  }, [fullMetricDataset, modalCohortTab, modalCellFilter, modalSearch]);

  const totalFilteredCount = filteredDataset.length;
  const totalPages = Math.ceil(totalFilteredCount / PAGE_SIZE) || 1;
  const paginatedList = useMemo(() => {
    const start = (modalPage - 1) * PAGE_SIZE;
    return filteredDataset.slice(start, start + PAGE_SIZE);
  }, [filteredDataset, modalPage]);

  const uncompletedTotalCount = useMemo(() => fullMetricDataset.filter(d => !d.isDone).length, [fullMetricDataset]);

  return (
    <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto hide-scrollbar font-sans select-none text-zinc-900 pb-16 bg-white">
      
      {/* ====================================================================
          TOP ROW: 3-Column Analytics Grid
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 shrink-0">
        
        {/* 1. 주간 출석 동향 및 차분한 모노크롬 연간 누적 카드 (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-zinc-200 p-4 flex flex-col justify-between min-h-[260px] shadow-xs relative">
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-black text-zinc-900 tracking-tight">주간 출석 동향</span>
                <span className="text-[10px] font-mono font-bold text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">
                  {chartZoomMode === 'weekly' ? '최근 8주' : `${calendarYear}년`}
                </span>
                
                {/* 🌟 톤다운된 엔터프라이즈 모노크롬 연간 누적 뱃지 */}
                <div 
                  className="relative inline-block"
                  onMouseEnter={() => setShowAnnualPopup(true)}
                  onMouseLeave={() => setShowAnnualPopup(false)}
                  onTouchStart={(e) => { e.stopPropagation(); setShowAnnualPopup(prev => !prev); }}
                >
                  <button
                    type="button"
                    className="px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="마우스 오버 또는 터치 시 1년 월간 누적 상세 팝업"
                  >
                    <span>연간 누적 <b className="font-black text-zinc-900">{annualTotalAttendees.toLocaleString()}명</b></span>
                    <span className="text-[9px] bg-zinc-900 text-white px-1 py-0.2 rounded font-black">월별</span>
                  </button>

                  {/* 🌟 차분한 모노크롬 1년 전체 월간 누적 정리 팝업 */}
                  {showAnnualPopup && (
                    <div 
                      className="absolute left-0 top-full mt-2 w-84 sm:w-96 bg-white border border-zinc-300 rounded-xl p-4 shadow-xl z-[100] animate-fade-in pointer-events-auto"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center pb-2.5 border-b border-zinc-200 mb-3">
                        <div>
                          <span className="text-[12.5px] font-black text-zinc-900 block tracking-tight">
                            {calendarYear}년 월간 누적 정리 & 성도 현황
                          </span>
                          <span className="text-[10.5px] font-mono text-zinc-500">
                            전체 등록 성도: <b className="text-zinc-900">{registeredCount}명</b> 기준
                          </span>
                        </div>
                        <span className="text-[10.5px] font-mono font-black text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                          총 {annualTotalAttendees.toLocaleString()}명 누적
                        </span>
                      </div>

                      <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 hide-scrollbar">
                        {annualCumulativeSummary.map((item, idx) => (
                          <div 
                            key={idx} 
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-[11px] border transition-colors ${
                              item.isCurrentMonth 
                                ? 'bg-zinc-100 border-zinc-400 font-bold text-zinc-900 shadow-2xs' 
                                : 'bg-zinc-50/70 border-zinc-200/80 text-zinc-700'
                            }`}
                          >
                            <span className="font-bold w-10 text-zinc-800">{item.month}</span>
                            <span className="font-mono text-zinc-500">
                              월 참석: <strong className="text-zinc-800">{item.monthAttendees}명</strong>
                            </span>
                            <span className="font-mono text-zinc-900 font-black">
                              누적: {item.cumulativeAttendees}명
                            </span>
                            <span className="font-mono font-bold text-zinc-700">
                              {item.rate}%
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2.5 mt-2 border-t border-zinc-100 text-[10px] text-zinc-400 flex justify-between items-center">
                        <span>* 등록 성도 대비 월평균 출석률 기준</span>
                        <button 
                          type="button" 
                          onClick={() => setShowAnnualPopup(false)} 
                          className="text-zinc-600 hover:text-zinc-900 font-bold underline cursor-pointer"
                        >
                          닫기
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex bg-zinc-100 p-0.5 rounded-md border border-zinc-200 text-[10.5px] font-bold shadow-inner">
                <button type="button" onClick={() => setChartZoomMode('weekly')} className={`px-2 py-1 rounded transition-all ${chartZoomMode === 'weekly' ? 'bg-white text-zinc-900 shadow-xs font-black' : 'text-zinc-500 hover:text-zinc-700'}`}>주간 상세</button>
                <button type="button" onClick={() => setChartZoomMode('annual')} className={`px-2 py-1 rounded transition-all ${chartZoomMode === 'annual' ? 'bg-white text-zinc-900 shadow-xs font-black' : 'text-zinc-500 hover:text-zinc-700'}`}>1년 추세</button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[10.5px] text-zinc-400 mb-3">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-sm bg-zinc-800" /> 출석률</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-sm bg-zinc-200" /> 결석률</span>
            </div>
          </div>

          <div className="h-32 w-full flex items-end justify-between gap-1.5 pt-1 pb-1 px-1 border-b border-zinc-100">
            {chartZoomMode === 'weekly' ? (
              recentSundaysData.map((d, idx) => {
                const isHovered = hoveredBarIndex === idx;
                const isCurrent = d.isSelected;
                const heightPct = Math.max(8, d.rate);

                return (
                  <div key={d.date} onMouseEnter={() => setHoveredBarIndex(idx)} onMouseLeave={() => setHoveredBarIndex(null)} onClick={() => setSelectedWeekOffset(d.offset)} className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer relative group">
                    {isHovered && (
                      <div className="absolute -top-8 z-30 bg-zinc-900 text-white text-[10px] font-mono py-1 px-2 rounded shadow-md pointer-events-none whitespace-nowrap">
                        {d.label}: {d.attended}명 ({d.rate}%)
                      </div>
                    )}
                    <div className="w-full max-w-[24px] bg-zinc-100 border border-zinc-200/50 rounded-t-md overflow-hidden flex flex-col justify-end h-full">
                      <div style={{ height: `${heightPct}%` }} className={`w-full transition-all duration-300 rounded-t-sm ${isCurrent ? 'bg-zinc-900' : isHovered ? 'bg-zinc-700' : 'bg-zinc-400'}`} />
                    </div>
                    <span className={`text-[10px] font-mono mt-1.5 font-bold ${isCurrent ? 'text-zinc-900 font-black' : 'text-zinc-400'}`}>{d.label}</span>
                  </div>
                );
              })
            ) : (
              annualCumulativeSummary.map((m, idx) => {
                const heightPct = Math.max(8, m.rate);
                const isHovered = hoveredAnnualMonthIdx === idx;

                return (
                  <div 
                    key={m.month} 
                    onMouseEnter={() => setHoveredAnnualMonthIdx(idx)}
                    onMouseLeave={() => setHoveredAnnualMonthIdx(null)}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                  >
                    {isHovered && (
                      <div className="absolute -top-10 z-30 bg-zinc-900 text-white text-[10px] font-mono py-1.5 px-2 rounded-lg shadow-xl pointer-events-none whitespace-nowrap text-center">
                        <div>{m.month}: {m.monthAttendees}명 ({m.rate}%)</div>
                        <div className="text-[9px] text-zinc-300">누적: {m.cumulativeAttendees}명</div>
                      </div>
                    )}
                    <div className="w-full max-w-[16px] bg-zinc-100 border border-zinc-200/50 rounded-t-sm overflow-hidden flex flex-col justify-end h-full">
                      <div style={{ height: `${heightPct}%` }} className={`w-full transition-all rounded-t-sm ${m.isCurrentMonth ? 'bg-zinc-900' : isHovered ? 'bg-zinc-700' : 'bg-zinc-400'}`} />
                    </div>
                    <span className={`text-[10px] font-mono mt-1.5 ${m.isCurrentMonth ? 'text-zinc-900 font-black' : 'text-zinc-400 font-medium'}`}>{m.month.replace('월', '')}</span>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-between items-center pt-2 text-[11px]">
            <span className="text-zinc-500">범위: <b className="text-zinc-800 font-mono">{currentWeek.rangeShort}</b></span>
            <span className="font-mono font-black text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">출석률 {realStats?.totalAttRate || 0}% ({realStats?.todayAttCount || 0}명)</span>
          </div>
        </div>

        {/* 2. 사역 지표 4대 실천 (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-zinc-200 p-4 shadow-xs flex flex-col justify-between min-h-[260px]">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-black text-zinc-900 tracking-tight">사역 지표 (KPI)</span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />LIVE</span>
            </div>
            <div className="flex bg-zinc-100 p-0.5 rounded-md border border-zinc-200 text-[10px] font-bold shadow-inner">
              <button type="button" onClick={() => setMetricViewMode('current')} className={`px-2 py-1 rounded transition-all ${metricViewMode === 'current' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-700'}`}>주간</button>
              <button type="button" onClick={() => setMetricViewMode('cumulative')} className={`px-2 py-1 rounded transition-all ${metricViewMode === 'cumulative' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-700'}`}>누적</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 flex-1">
            {Object.values(annualMetrics || {}).map(metric => (
              <div 
                key={metric.id} 
                onClick={() => { setActiveMetricDetail(metric); setModalCohortTab('UNCOMPLETED'); setModalCellFilter('ALL'); setModalSearch(''); setModalPage(1); }}
                className="p-3 rounded-lg bg-zinc-50/50 border border-zinc-200 hover:border-zinc-400 hover:bg-white hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[11.5px] font-black text-zinc-600 group-hover:text-zinc-900 transition-colors">{metric.label}</span>
                    <span className="text-[10px] font-mono font-bold text-zinc-400">{metric.rate}%</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[20px] font-mono font-black text-zinc-900 leading-none">{metric.doneCount}</span>
                      <span className="text-[10px] font-bold text-zinc-500">{metric.unit}</span>
                    </div>
                    {metric.subBadge && <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-zinc-200 text-zinc-500 shadow-2xs whitespace-nowrap">{metric.subBadge}</span>}
                  </div>
                  <span className="text-[10px] text-zinc-400 block truncate mt-1.5">{metric.sub}</span>
                </div>
                <div className="mt-2 w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                  <div style={{ width: `${Math.min(100, metric.rate)}%`, backgroundColor: metric.color }} className="h-full rounded-full transition-all duration-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. 연간 목표 현황 (3 Cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-zinc-200 p-4 shadow-xs flex flex-col justify-between min-h-[260px]">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-2 mb-2">
            <span className="text-[14px] font-black text-zinc-900 tracking-tight">전도 목표 현황</span>
            <button onClick={() => setIsEditingGoal(!isEditingGoal)} className="text-[11px] text-zinc-500 hover:text-zinc-900 font-bold flex items-center gap-1 cursor-pointer transition-colors">
              <SvgTarget /> {isEditingGoal ? '닫기' : '목표 설정'}
            </button>
          </div>

          {isEditingGoal ? (
            <div className="flex-1 flex flex-col justify-center gap-2 p-3 bg-zinc-50 rounded-lg border border-zinc-200 animate-fade-in">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">목표 인원</label>
              <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)} className="w-full p-2 rounded-md bg-white border border-zinc-300 font-mono font-black text-zinc-900 outline-none focus:border-zinc-800 text-[14px]" />
              <button type="button" onClick={handleSaveGoal} className="w-full mt-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md font-bold text-[12px] shadow-xs cursor-pointer transition-colors">저장하기</button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 py-1">
              <div className="relative w-28 h-28 flex flex-col items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-zinc-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-zinc-900 transition-all duration-1000" strokeDasharray={`${goalProgress}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[22px] font-mono font-black text-zinc-900 leading-none">{goalProgress}%</span>
                  <span className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-widest">달성률</span>
                </div>
              </div>

              <div className="w-full space-y-1.5 pt-3 mt-3 border-t border-zinc-100 text-[11.5px]">
                <div className="flex justify-between items-center"><span className="text-zinc-500 font-bold">재적 성도</span><span className="font-mono font-black text-zinc-900">{registeredCount}명</span></div>
                <div className="flex justify-between items-center"><span className="text-zinc-400 font-bold">목표 인원</span><span className="font-mono font-bold text-zinc-500">{goalCount}명</span></div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ====================================================================
          BOTTOM ROW: 2-Column Split
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 flex-1">
        
        {/* 1. 목장별 사역 관제 (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-zinc-200 shadow-xs flex flex-col overflow-hidden min-h-[280px]">
          <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-black text-zinc-900 tracking-tight">목장별 주간 사역 관제</span>
              <span className="text-[10px] font-mono font-bold text-zinc-500 bg-white border border-zinc-200 px-2 py-0.5 rounded">
                {currentWeek.rangeShort}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-zinc-100 p-0.5 rounded-md border border-zinc-200/80 text-[11px] font-bold">
                <button type="button" onClick={() => setSelectedWeekOffset(prev => prev - 1)} className="px-2 py-1 rounded hover:bg-white text-zinc-600 transition-colors">이전</button>
                <button type="button" onClick={() => setSelectedWeekOffset(0)} className={`px-2.5 py-1 rounded transition-colors ${selectedWeekOffset === 0 ? 'bg-white text-zinc-900 shadow-xs font-black' : 'text-zinc-600'}`}>금주</button>
                <button type="button" onClick={() => setSelectedWeekOffset(prev => prev + 1)} className="px-2 py-1 rounded hover:bg-white text-zinc-600 transition-colors">다음</button>
              </div>
              <button type="button" onClick={exportAttendanceCSV} className="px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer">
                <SvgDownload /> CSV 추출
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto hide-scrollbar bg-white">
            <table className="w-full text-left border-collapse text-[12px] min-w-[580px]">
              <thead>
                <tr className="border-b border-zinc-200 bg-white text-[10.5px] font-black text-zinc-400 uppercase tracking-wider sticky top-0 z-10 shadow-xs">
                  <th className="py-2.5 px-4 w-12 text-center">No</th>
                  <th className="py-2.5 px-3">목장명</th>
                  <th className="py-2.5 px-3">담당 목자</th>
                  <th className="py-2.5 px-2 text-center">배정</th>
                  <th className="py-2.5 px-3">성도 (주일 성수)</th>
                  <th className="py-2.5 px-3 text-center">보고서</th>
                  <th className="py-2.5 px-3 text-center">체크표</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {cells.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-zinc-400 font-medium">등록된 목장 데이터가 없습니다.</td></tr>
                ) : (
                  cells.map((cell, idx) => {
                    const members = cellMembers.filter(m => m.cell_id === cell.id);
                    const rep = getReportForCell(cell);
                    return (
                      <tr key={cell.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-2.5 px-4 text-center font-mono text-[11px] text-zinc-400">{String(idx + 1).padStart(2, '0')}</td>
                        <td className="py-2.5 px-3 font-black text-zinc-900">{cell.name}</td>
                        <td className="py-2.5 px-3 font-bold text-zinc-600">{cell.shepherd_name || <span className="text-zinc-300 italic font-medium">미지정</span>}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-zinc-500">{members.length}명</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            {members.length === 0 ? <span className="text-[10.5px] text-zinc-300 italic">미배정</span> : members.map(m => {
                                const isAtt = attendance.some(a => (a.user_name || '').trim() === (m.user_name || '').trim() && a.date === currentWeek.sunStr && (a.type === '주일' || a.type === '주일예배') && a.status === '출석');
                                return (
                                  <span key={m.user_name} onClick={() => setSelectedUserProfile && setSelectedUserProfile(users.find(u => u.name === m.user_name) || { name: m.user_name })} className={`px-1.5 py-0.5 rounded text-[10.5px] font-bold cursor-pointer transition-all border ${isAtt ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400 hover:text-zinc-800'}`}>
                                    {m.user_name}
                                  </span>
                                );
                            })}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button type="button" onClick={() => setActiveReportCell(cell)} className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all border ${rep ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer shadow-2xs' : 'bg-zinc-50 border-transparent text-zinc-400'}`}>
                            {rep ? '제출 완료' : '미제출'}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button type="button" onClick={() => setActiveChecklistCell(cell)} className="px-2.5 py-1 rounded-md text-[11px] font-black bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 cursor-pointer shadow-2xs transition-colors">
                            Q/M/T
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. 공지 배포 콘솔 (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-zinc-200 shadow-xs flex flex-col justify-between overflow-hidden min-h-[260px]">
          <div className="p-3 border-b border-zinc-100 bg-zinc-50/80 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 animate-pulse" />
              <span className="text-[13px] font-black text-zinc-900 tracking-tight">공지 배포 센터</span>
            </div>
            <div className="flex bg-white p-0.5 rounded-md border border-zinc-200 text-[10.5px] font-bold shadow-2xs">
              <button type="button" onClick={() => setActiveTabNotice('create')} className={`px-2.5 py-1 rounded transition-all ${activeTabNotice === 'create' ? 'bg-zinc-100 text-zinc-900 shadow-inner' : 'text-zinc-500'}`}>작성</button>
              <button type="button" onClick={() => setActiveTabNotice('history')} className={`px-2.5 py-1 rounded transition-all ${activeTabNotice === 'history' ? 'bg-zinc-100 text-zinc-900 shadow-inner' : 'text-zinc-500'}`}>이력 ({noticeList.length})</button>
            </div>
          </div>

          {activeTabNotice === 'create' ? (
            <div className="p-4 flex flex-col gap-3 flex-1 justify-between bg-white">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input type="text" placeholder="공지 제목..." value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} className="flex-1 px-3 py-2 text-[12px] font-bold bg-white border border-zinc-200 rounded-lg outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 text-zinc-900 placeholder:text-zinc-400 transition-all" />
                  <select value={broadcastScope} onChange={e => setBroadcastScope(e.target.value)} className="px-2.5 py-2 text-[11.5px] font-bold bg-zinc-50 border border-zinc-200 rounded-lg outline-none text-zinc-700 cursor-pointer">
                    <option value="all">전체 배포</option><option value="shepherds">리더십 전용</option>
                  </select>
                </div>
                <textarea rows={4} placeholder="상세 내용 입력..." value={broadcastBody} onChange={e => setBroadcastBody(e.target.value)} className="w-full p-3 text-[12.5px] bg-white border border-zinc-200 rounded-lg outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 text-zinc-800 resize-none leading-relaxed placeholder:text-zinc-400 transition-all" />
              </div>
              <button type="button" onClick={handlePublishNotice} className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-[12px] font-black shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                <SvgSend /> 즉시 배포
              </button>
            </div>
          ) : (
            <div className="p-3 flex-1 overflow-y-auto space-y-1.5 hide-scrollbar bg-zinc-50/30">
              {noticeList.length === 0 ? (
                <div className="py-10 text-center text-zinc-400 text-[12px] font-medium">발송 이력이 없습니다.</div>
              ) : (
                noticeList.map(n => (
                  <div key={n.id} className="p-3 rounded-xl border border-zinc-200 bg-white flex flex-col gap-1 shadow-2xs hover:border-zinc-300 transition-colors">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">{n.scope}</span>
                      <div className="flex items-center gap-1.5 text-zinc-400 font-mono">
                        <SvgClock /> {n.created_at}
                        <button type="button" onClick={() => handleDeleteNotice(n.id)} className="hover:text-rose-500 cursor-pointer ml-1 transition-colors"><SvgTrash /></button>
                      </div>
                    </div>
                    <span className="text-[12px] font-black text-zinc-900 truncate mt-0.5">{n.title}</span>
                    <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">{n.content}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          🌟 슬라이드 오버(Drawer) 방식의 사역 인텔리전스 인스펙터 패널
         ==================================================================== */}
      {activeMetricDetail && (
        <div className="fixed inset-0 z-[300] bg-zinc-900/40 backdrop-blur-sm flex justify-end transition-all animate-fade-in pointer-events-auto select-none" onClick={() => setActiveMetricDetail(null)}>
          <div className="w-full max-w-[540px] h-full bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.15)] flex flex-col border-l border-zinc-200 animate-slide-left" onClick={e => e.stopPropagation()}>
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50/80 flex justify-between items-start shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ backgroundColor: activeMetricDetail.color }} className="w-2.5 h-2.5 rounded-full shadow-xs" />
                  <h3 className="text-[18px] font-black text-zinc-900 tracking-tight">
                    {activeMetricDetail.label} 인스펙터
                  </h3>
                  <span className="text-[11px] font-mono font-bold text-zinc-600 bg-white border border-zinc-200 px-2 py-0.5 rounded shadow-2xs">
                    전체 {users.length}명
                  </span>
                </div>
                <p className="text-[12px] font-medium text-zinc-500 mt-1">목장별 이행률 및 미실천 코호트를 분석하고 일괄 권면합니다.</p>
              </div>
              <button onClick={() => setActiveMetricDetail(null)} className="p-1.5 text-zinc-400 hover:text-zinc-800 bg-white rounded-md border border-zinc-200 shadow-xs cursor-pointer transition-colors"><SvgClose /></button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 flex flex-col gap-5 overflow-y-auto hide-scrollbar flex-1 bg-white">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex flex-col justify-center">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-0.5">실천율</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[20px] font-mono font-black text-zinc-900">{activeMetricDetail.rate}%</span>
                    <span className="text-[11px] font-mono font-bold text-zinc-400">{activeMetricDetail.doneCount} / {users.length}명</span>
                  </div>
                </div>

                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-200 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block mb-0.5">미실천군</span>
                    <span className="text-[20px] font-mono font-black text-rose-700 leading-none">{uncompletedTotalCount}명</span>
                  </div>
                  <button type="button" onClick={handleBulkRemindUncompleted} className="mt-2 w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-black shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer">
                    <SvgBell /> 일괄 독려
                  </button>
                </div>

                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block mb-0.5">완료군</span>
                    <span className="text-[20px] font-mono font-black text-emerald-700 leading-none">{activeMetricDetail.doneCount}명</span>
                  </div>
                  <div className="mt-2 w-full py-1.5 bg-white border border-emerald-200 text-emerald-600 rounded-lg text-[11px] font-black text-center shadow-2xs">
                    정상 상태
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col gap-3 pt-4 border-t border-zinc-100">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-[11px] font-bold shadow-inner">
                    <button type="button" onClick={() => { setModalCohortTab('UNCOMPLETED'); setModalPage(1); }} className={`px-3 py-1.5 rounded-md transition-all ${modalCohortTab === 'UNCOMPLETED' ? 'bg-white text-rose-700 shadow-xs font-black' : 'text-zinc-500 hover:text-zinc-700'}`}>미실천 ({uncompletedTotalCount})</button>
                    <button type="button" onClick={() => { setModalCohortTab('COMPLETED'); setModalPage(1); }} className={`px-3 py-1.5 rounded-md transition-all ${modalCohortTab === 'COMPLETED' ? 'bg-white text-emerald-700 shadow-xs font-black' : 'text-zinc-500 hover:text-zinc-700'}`}>완료 ({activeMetricDetail.doneCount})</button>
                    <button type="button" onClick={() => { setModalCohortTab('ALL'); setModalPage(1); }} className={`px-3 py-1.5 rounded-md transition-all ${modalCohortTab === 'ALL' ? 'bg-white text-zinc-900 shadow-xs font-black' : 'text-zinc-500 hover:text-zinc-700'}`}>전체 ({users.length})</button>
                    <button type="button" onClick={() => setModalCohortTab('CELL_BREAKDOWN')} className={`px-3 py-1.5 rounded-md transition-all ${modalCohortTab === 'CELL_BREAKDOWN' ? 'bg-white text-zinc-900 shadow-xs font-black' : 'text-zinc-500 hover:text-zinc-700'}`}>목장 순위</button>
                  </div>

                  {modalCohortTab !== 'CELL_BREAKDOWN' && (
                    <select value={modalCellFilter} onChange={e => { setModalCellFilter(e.target.value); setModalPage(1); }} className="px-3 py-1.5 text-[11.5px] bg-white border border-zinc-200 rounded-lg outline-none font-bold text-zinc-700 cursor-pointer shadow-2xs">
                      <option value="ALL">전체 목장</option>
                      {cells.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  )}
                </div>

                {modalCohortTab !== 'CELL_BREAKDOWN' && (
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-zinc-400"><SvgSearch /></span>
                    <input type="text" placeholder="성도 이름 검색..." value={modalSearch} onChange={e => { setModalSearch(e.target.value); setModalPage(1); }} className="w-full pl-9 pr-3 py-2 text-[12.5px] bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:bg-white focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 placeholder:text-zinc-400 font-medium transition-all" />
                  </div>
                )}

                {/* List/Table View */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-xs flex-1 min-h-[300px] flex flex-col">
                  {modalCohortTab === 'CELL_BREAKDOWN' ? (
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-zinc-50/50 hide-scrollbar">
                      {cellAnalyticsBreakdown.map(cb => (
                        <div key={cb.cellName} className="p-3.5 bg-white rounded-xl border border-zinc-200 shadow-2xs flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-black text-zinc-900">{cb.cellName}</span>
                              <span className="text-[11px] font-bold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">{cb.shepherd}</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-[12px] font-black text-zinc-700">{cb.done} / {cb.total}명</span>
                              <span className={`text-[11.5px] font-black px-2 py-0.5 rounded border ${cb.rate >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : cb.rate >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{cb.rate}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                            <div style={{ width: `${cb.rate}%` }} className={`h-full rounded-full transition-all duration-500 ${cb.rate >= 70 ? 'bg-emerald-500' : cb.rate >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto hide-scrollbar">
                      <table className="w-full text-left border-collapse text-[12px]">
                        <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10 shadow-xs">
                          <tr>
                            <th className="py-2.5 px-4 w-12 text-center">No</th>
                            <th className="py-2.5 px-3">성도명</th>
                            <th className="py-2.5 px-3">직분</th>
                            <th className="py-2.5 px-3">소속 목장</th>
                            <th className="py-2.5 px-3 text-center">실천 지표</th>
                            <th className="py-2.5 px-4 text-right">상태</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white font-medium">
                          {paginatedList.length === 0 ? (
                            <tr><td colSpan={6} className="py-16 text-center text-zinc-400 font-bold text-[13px]">일치하는 성도가 없습니다.</td></tr>
                          ) : (
                            paginatedList.map((item, idx) => (
                              <tr key={item.user.name} className="hover:bg-zinc-50/70 transition-colors">
                                <td className="py-3 px-4 text-center font-mono text-[11px] text-zinc-400">{(modalPage - 1) * PAGE_SIZE + idx + 1}</td>
                                <td className="py-3 px-3 font-black text-zinc-900">{item.user.name}</td>
                                <td className="py-3 px-3 text-zinc-600 font-bold">{item.user.office || '성도'}</td>
                                <td className="py-3 px-3 text-zinc-700">{item.cellName}</td>
                                
                                {/* 🌟 [수정 완료] 통독은 '장', 묵상/감사는 '회', 주일은 '출석/결석'으로 정상 표기 */}
                                <td className="py-3 px-3 text-center font-mono font-bold text-zinc-900 bg-zinc-50">
                                  {formatIndividualMetric(activeMetricDetail.id, item.count, item.isDone)}
                                </td>

                                <td className="py-3 px-4 text-right">
                                  {item.isDone 
                                    ? <span className="px-2 py-1 rounded text-[10.5px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">완료</span> 
                                    : <span className="px-2 py-1 rounded text-[10.5px] font-black bg-rose-50 text-rose-700 border border-rose-200">미실천</span>}
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
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-between items-center text-[11.5px] shrink-0">
              {modalCohortTab !== 'CELL_BREAKDOWN' ? (
                <>
                  <div className="flex items-center gap-1 text-zinc-500 font-mono">
                    <span>총 {totalFilteredCount}명 중</span>
                    <b className="text-zinc-800">{Math.min(totalFilteredCount, (modalPage - 1) * PAGE_SIZE + 1)}-{Math.min(totalFilteredCount, modalPage * PAGE_SIZE)}</b>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button type="button" disabled={modalPage === 1} onClick={() => setModalPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 bg-white border border-zinc-200 rounded-md text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 cursor-pointer font-bold shadow-2xs transition-colors">이전</button>
                      <span className="px-1.5 font-mono font-black text-zinc-800">{modalPage}/{totalPages}</span>
                      <button type="button" disabled={modalPage === totalPages} onClick={() => setModalPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1.5 bg-white border border-zinc-200 rounded-md text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 cursor-pointer font-bold shadow-2xs transition-colors">다음</button>
                    </div>
                  )}
                </>
              ) : <div />}
            </div>

          </div>
        </div>
      )}

      {/* 슬라이드 애니메이션 스타일 */}
      <style>{`
        .animate-slide-left { animation: slideLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}
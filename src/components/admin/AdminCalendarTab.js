// src/components/admin/AdminCalendarTab.js
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

// =====================================================================
// ✒️ 엔터프라이즈 모노크롬 SVG 아이콘 세트 (Linear / Cron SaaS 규격)
// =====================================================================
const SvgCalendar = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 shrink-0">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const SvgPlus = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);
const SvgClock = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 shrink-0">
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
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
const SvgTrash = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);
const SvgSearch = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);
const SvgCopy = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
  </svg>
);
const SvgDownload = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);
const SvgMapPin = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);
const SvgRepeat = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const formatLocal = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getKSTDateStr = (dateObj = new Date()) => {
  const utc = dateObj.getTime() + dateObj.getTimezoneOffset() * 60000;
  const kst = new Date(utc + 9 * 3600000);
  return formatLocal(kst);
};

// 대한민국 주요 공휴일 및 절기 매핑
const KOR_HOLIDAY_NAMES = {
  '01-01': '신정',
  '02-16': '설날 연휴',
  '02-17': '설날',
  '02-18': '설날 연휴',
  '03-01': '삼일절',
  '05-05': '어린이날',
  '05-24': '부처님오신날',
  '06-06': '현충일',
  '08-15': '광복절',
  '09-24': '추석 연휴',
  '09-25': '추석',
  '09-26': '추석 연휴',
  '10-03': '개천절',
  '10-09': '한글날',
  '12-25': '성탄절'
};
const KOR_HOLIDAYS = Object.keys(KOR_HOLIDAY_NAMES);

export default function AdminCalendarTab({
  calendarYear,
  setCalendarYear,
  calendarMonth,
  setCalendarMonth,
  selectedDateStr,
  filteredEventsForDate: allEvents = [],
  setChurchEvents,
  setEditingEventId,
  setFormEventTitle,
  setFormEventDate,
  setFormEventEndDate,
  setFormEventStartTime,
  setFormEventEndTime,
  setFormEventIsAllDay,
  setFormEventRoom,
  setFormEventTarget,
  setFormEventRepeat,
  setFormEventColor,
  setFormEventMemo,
  setShowEventModal,
  firstDayOfWeek,
  daysInMonth,
  selectedCalDay,
  setSelectedCalDay
}) {
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [agendaWidth, setAgendaWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedDetailEvent, setSelectedDetailEvent] = useState(null);

  const [mobileSelectedDate, setMobileSelectedDate] = useState(getKSTDateStr());
  // 모바일에서 '주간 스트립(week)'과 '월간 그리드(month)'를 전환하는 상태
  const [mobileCalendarView, setMobileCalendarView] = useState('week'); // 'week' | 'month'

  // 사역 검색 및 장소/대상 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState('ALL');
  // 우측 사이드바 탭: 'day' (선택일 상세) | 'month' (이달의 전체 아젠다)
  const [sidebarTab, setSidebarTab] = useState('day');

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      let newWidth = window.innerWidth - e.clientX - 32;
      if (newWidth < 290) newWidth = 290;
      if (newWidth > 540) newWidth = 540;
      setAgendaWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // 장소(Room) 카테고리 목록 자동 추출
  const availableRooms = useMemo(() => {
    const rooms = new Set(['본당', '교육관', '소예배실', '온라인']);
    (allEvents || []).forEach(ev => {
      if (ev?.room && ev.room.trim()) rooms.add(ev.room.trim());
    });
    return Array.from(rooms);
  }, [allEvents]);

  // 검색어 및 장소 필터가 적용된 이벤트 목록
  const filteredMasterEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (allEvents || []).filter(ev => {
      if (!ev) return false;
      if (roomFilter !== 'ALL' && (ev.room || '본당') !== roomFilter) return false;
      if (!q) return true;
      return (
        (ev.title || '').toLowerCase().includes(q) ||
        (ev.room || '').toLowerCase().includes(q) ||
        (ev.target || '').toLowerCase().includes(q) ||
        (ev.memo || '').toLowerCase().includes(q)
      );
    });
  }, [allEvents, searchQuery, roomFilter]);

  // 이전 달 / 다음 달 이동 핸들러 (1월<->12월 연도 자동 증감 버그 완벽 수정)
  const handlePrevMonth = useCallback(() => {
    if (calendarMonth === 1) {
      if (setCalendarYear) setCalendarYear(prev => prev - 1);
      setCalendarMonth(12);
    } else {
      setCalendarMonth(prev => prev - 1);
    }
  }, [calendarMonth, setCalendarMonth, setCalendarYear]);

  const handleNextMonth = useCallback(() => {
    if (calendarMonth === 12) {
      if (setCalendarYear) setCalendarYear(prev => prev + 1);
      setCalendarMonth(1);
    } else {
      setCalendarMonth(prev => prev + 1);
    }
  }, [calendarMonth, setCalendarMonth, setCalendarYear]);

  const calendarCells = useMemo(() => {
    const cells = [];
    const prevLastDay = new Date(calendarYear, calendarMonth - 1, 0).getDate();

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dStr = `${calendarMonth === 1 ? calendarYear - 1 : calendarYear}-${String(
        calendarMonth === 1 ? 12 : calendarMonth - 1
      ).padStart(2, '0')}-${String(prevLastDay - i).padStart(2, '0')}`;
      cells.push({ day: prevLastDay - i, isCurrentMonth: false, dateStr: dStr });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push({ day: i, isCurrentMonth: true, dateStr: dStr });
    }
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const dStr = `${calendarMonth === 12 ? calendarYear + 1 : calendarYear}-${String(
        calendarMonth === 12 ? 1 : calendarMonth + 1
      ).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push({ day: i, isCurrentMonth: false, dateStr: dStr });
    }
    return cells;
  }, [calendarYear, calendarMonth, firstDayOfWeek, daysInMonth]);

  const getEventsForDay = useCallback(
    (dateStr) => {
      if (!dateStr || !Array.isArray(filteredMasterEvents)) return [];
      const targetTime = new Date(`${dateStr}T00:00:00`).getTime();
      const targetDayOfWeek = new Date(`${dateStr}T00:00:00`).getDay();

      return filteredMasterEvents.filter((ev) => {
        if (!ev || !ev.date) return false;
        const startTime = new Date(`${ev.date}T00:00:00`).getTime();
        const endTime = ev.endDate ? new Date(`${ev.endDate}T00:00:00`).getTime() : startTime;

        if (targetTime >= startTime && targetTime <= endTime) {
          if (!ev.repeat || ev.repeat === '한 번만' || ev.repeat === '안 함') return true;
        }

        if (targetTime >= startTime) {
          if (ev.repeat === '매일') return true;
          if (ev.repeat === '주중(월-금)') return targetDayOfWeek >= 1 && targetDayOfWeek <= 5;
          if (ev.repeat === '매주 (주일)') return targetDayOfWeek === 0;
          if (ev.repeat === '매주') return targetDayOfWeek === new Date(`${ev.date}T00:00:00`).getDay();
          if (ev.repeat === '매월')
            return new Date(`${dateStr}T00:00:00`).getDate() === new Date(`${ev.date}T00:00:00`).getDate();
        }
        return false;
      });
    },
    [filteredMasterEvents]
  );

  // 이번 달 전체 고유 일정 목록 및 통계 산출
  const currentMonthEventsSummary = useMemo(() => {
    const monthPrefix = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}`;
    const list = [];
    const seenIds = new Set();

    calendarCells.forEach(cell => {
      if (!cell.isCurrentMonth) return;
      const dayEvs = getEventsForDay(cell.dateStr);
      dayEvs.forEach(ev => {
        const key = `${ev.id}_${ev.repeat && ev.repeat !== '안 함' ? cell.dateStr : 'once'}`;
        if (!seenIds.has(key)) {
          seenIds.add(key);
          list.push({ ...ev, displayDate: cell.dateStr });
        }
      });
    });

    return list.sort((a, b) => (a.displayDate || '').localeCompare(b.displayDate || ''));
  }, [calendarYear, calendarMonth, calendarCells, getEventsForDay]);

  const eventsForSelectedDay = getEventsForDay(selectedDateStr);
  const mobileEventsForDay = getEventsForDay(mobileSelectedDate);

  const { weekDates, mobileMonthStr } = useMemo(() => {
    const dt = new Date(mobileSelectedDate);
    const day = dt.getDay();
    const sunday = new Date(dt);
    sunday.setDate(dt.getDate() - day);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const temp = new Date(sunday);
      temp.setDate(sunday.getDate() + i);
      week.push(formatLocal(temp));
    }
    const monthStr = `${dt.getFullYear()}년 ${dt.getMonth() + 1}월`;
    return { weekDates: week, mobileMonthStr: monthStr };
  }, [mobileSelectedDate]);

  const prevWeek = () => {
    const d = new Date(mobileSelectedDate);
    d.setDate(d.getDate() - 7);
    setMobileSelectedDate(formatLocal(d));
  };
  const nextWeek = () => {
    const d = new Date(mobileSelectedDate);
    d.setDate(d.getDate() + 7);
    setMobileSelectedDate(formatLocal(d));
  };

  const getDotsForDate = (dStr) =>
    getEventsForDay(dStr)
      .slice(0, 4)
      .map((ev) => ev.color || '#18181B');

  // 드래그를 통한 다중 일자 범위 생성 (단일 클릭 시에는 날짜 선택만 수행하도록 정밀화)
  const handleMouseDown = (dateStr) => {
    setIsDragging(true);
    setDragStart(dateStr);
    setDragEnd(dateStr);
  };
  const handleMouseEnter = (dateStr) => {
    if (isDragging) setDragEnd(dateStr);
  };
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      // 시작일과 종료일이 다를 때(실제 범위 드래그 시)만 자동으로 일정 등록 모달 오픈
      if (dragStart && dragEnd && dragStart !== dragEnd) {
        const start =
          new Date(`${dragStart}T00:00:00`) <= new Date(`${dragEnd}T00:00:00`) ? dragStart : dragEnd;
        const end =
          new Date(`${dragStart}T00:00:00`) <= new Date(`${dragEnd}T00:00:00`) ? dragEnd : dragStart;

        setEditingEventId(null);
        setFormEventTitle('');
        setFormEventDate(start);
        setFormEventEndDate(end);
        setFormEventMemo('');
        setShowEventModal(true);
      }
      setDragStart(null);
      setDragEnd(null);
    }
  };

  // 날짜 셀 더블클릭 시 해당 날짜로 즉시 신규 일정 모달 오픈
  const handleCellDoubleClick = (dateStr) => {
    setEditingEventId(null);
    setFormEventTitle('');
    setFormEventDate(dateStr);
    setFormEventEndDate(dateStr);
    setFormEventMemo('');
    setShowEventModal(true);
  };

  const isDateInRange = (dateStr) => {
    if (!dragStart || !dragEnd || dragStart === dragEnd) return false;
    const d = new Date(`${dateStr}T00:00:00`).getTime();
    const s = new Date(`${dragStart}T00:00:00`).getTime();
    const e = new Date(`${dragEnd}T00:00:00`).getTime();
    return (d >= s && d <= e) || (d >= e && d <= s);
  };

  const handleEditClick = (ev) => {
    setEditingEventId(ev.id);
    setFormEventTitle(ev.title);
    setFormEventDate(ev.date);
    setFormEventEndDate(ev.endDate || ev.date);
    setFormEventStartTime(ev.startTime || '11:00');
    setFormEventEndTime(ev.endTime || '12:30');
    setFormEventIsAllDay(ev.isAllDay || false);
    setFormEventRoom(ev.room || '본당');
    setFormEventTarget(ev.target || '전교인');
    setFormEventRepeat(ev.repeat || '안 함');
    setFormEventColor(ev.color || '#18181B');
    setFormEventMemo(ev.memo || '');
    setShowEventModal(true);
  };

  // 일정 복제 (Duplicate) 기능
  const handleDuplicateEvent = (e, ev) => {
    e.stopPropagation();
    setEditingEventId(null);
    setFormEventTitle(`[복사] ${ev.title}`);
    setFormEventDate(ev.date);
    setFormEventEndDate(ev.endDate || ev.date);
    setFormEventStartTime(ev.startTime || '11:00');
    setFormEventEndTime(ev.endTime || '12:30');
    setFormEventIsAllDay(ev.isAllDay || false);
    setFormEventRoom(ev.room || '본당');
    setFormEventTarget(ev.target || '전교인');
    setFormEventRepeat(ev.repeat || '안 함');
    setFormEventColor(ev.color || '#18181B');
    setFormEventMemo(ev.memo || '');
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (e, evId) => {
    e.stopPropagation();
    if (!window.confirm('이 일정을 영구 삭제하시겠습니까?')) return;
    if (setChurchEvents) setChurchEvents((prev) => prev.filter((ev) => ev.id !== evId));
    if (supabase) {
      try {
        await supabase.from('church_events').delete().eq('id', evId);
      } catch (err) {}
    }
  };

  const isHoliday = (dateStr) => {
    const dayOfWeek = new Date(`${dateStr}T00:00:00`).getDay();
    if (dayOfWeek === 0) return true;
    const monthDay = dateStr.slice(5);
    if (KOR_HOLIDAYS.includes(monthDay)) return true;
    return false;
  };

  const getHolidayLabel = (dateStr) => {
    const monthDay = dateStr.slice(5);
    return KOR_HOLIDAY_NAMES[monthDay] || null;
  };

  const goToToday = () => {
    const todayStr = getKSTDateStr();
    const today = new Date(todayStr);
    if (setCalendarYear) setCalendarYear(today.getFullYear());
    setCalendarMonth(today.getMonth() + 1);
    setSelectedCalDay(today.getDate());
    setMobileSelectedDate(todayStr);
  };

  // 월간 사역 일정 CSV 추출
  const handleExportMonthCSV = useCallback(() => {
    if (currentMonthEventsSummary.length === 0) return;
    const headers = ['No', '일자', '종료일', '시간', '사역일정명', '장소', '대상', '반복', '메모'];
    const rows = currentMonthEventsSummary.map((ev, i) => [
      i + 1,
      ev.displayDate || ev.date,
      ev.endDate || ev.date,
      ev.isAllDay ? '종일' : `${ev.startTime || ''}~${ev.endTime || ''}`,
      `"${(ev.title || '').replace(/"/g, '""')}"`,
      `"${(ev.room || '본당').replace(/"/g, '""')}"`,
      `"${(ev.target || '전교인').replace(/"/g, '""')}"`,
      ev.repeat || '안 함',
      `"${(ev.memo || '').replace(/\n/g, ' ').replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `교회사역일정_${calendarYear}년_${calendarMonth}월.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentMonthEventsSummary, calendarYear, calendarMonth]);

  return (
    <div
      className="h-full flex flex-col min-h-0 overflow-hidden box-border bg-white rounded-2xl border border-zinc-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] font-sans select-none text-zinc-900"
      onMouseLeave={() => setIsDragging(false)}
    >
      {/* ===================================================================== */}
      {/* 1. 상단 글로벌 컨트롤 헤더 (줄바꿈 0% 보장)                             */}
      {/* ===================================================================== */}
      <div className="px-4 sm:px-5 py-3 border-b border-zinc-200/90 bg-zinc-50/70 flex flex-wrap justify-between items-center shrink-0 gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-2xs shrink-0">
            <SvgCalendar />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[14.5px] font-black text-zinc-900 tracking-tight whitespace-nowrap leading-none">
                교회 통합 사역 일정표
              </h3>
              <span className="text-[10.5px] font-mono font-bold bg-white text-zinc-700 border border-zinc-200 px-2 py-0.5 rounded-md shadow-2xs whitespace-nowrap tabular-nums">
                이달 사역 {currentMonthEventsSummary.length}건
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 font-medium mt-1 block truncate">
              날짜 드래그로 다중 기간 일정을 등록하거나 더블클릭하여 즉시 추가하세요.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap ml-auto">
          <button
            type="button"
            onClick={goToToday}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-zinc-200/90 shadow-2xs text-[11px] font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            오늘
          </button>

          {/* 연·월 네비게이터 (PC & 모바일 공통 노출) */}
          <div className="flex items-center bg-zinc-200/70 p-0.5 rounded-lg border border-zinc-200 shrink-0">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-md bg-white shadow-2xs text-zinc-700 hover:bg-zinc-50 cursor-pointer transition-colors"
              title="이전 달"
            >
              <IconChevronLeft />
            </button>
            <span className="px-3 text-[12px] font-mono font-black text-zinc-900 whitespace-nowrap tabular-nums">
              {calendarYear}. {String(calendarMonth).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-md bg-white shadow-2xs text-zinc-700 hover:bg-zinc-50 cursor-pointer transition-colors"
              title="다음 달"
            >
              <IconChevronRight />
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportMonthCSV}
            disabled={currentMonthEventsSummary.length === 0}
            className="hidden sm:flex px-2.5 py-1.5 rounded-lg bg-white hover:bg-zinc-100 disabled:opacity-30 text-zinc-700 border border-zinc-200/90 text-[11px] font-bold items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
            title="이번 달 전체 사역 일정 CSV 다운로드"
          >
            <SvgDownload /> CSV
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingEventId(null);
              setFormEventTitle('');
              setFormEventDate(selectedDateStr);
              setFormEventEndDate(selectedDateStr);
              setFormEventMemo('');
              setShowEventModal(true);
            }}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[11.5px] font-black rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 whitespace-nowrap shrink-0"
          >
            <SvgPlus /> 신규 일정
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. 서브 필터 바 (장소별 원터치 필터 + 사역 키워드 실시간 검색)          */}
      {/* ===================================================================== */}
      <div className="px-4 sm:px-5 py-2 border-b border-zinc-100 bg-white flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar py-0.5">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mr-1 whitespace-nowrap">
            장소 필터:
          </span>
          <button
            type="button"
            onClick={() => setRoomFilter('ALL')}
            className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold transition-all whitespace-nowrap cursor-pointer ${
              roomFilter === 'ALL'
                ? 'bg-zinc-900 text-white font-black shadow-2xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70'
            }`}
          >
            전체 장소
          </button>
          {availableRooms.map((room) => (
            <button
              key={room}
              type="button"
              onClick={() => setRoomFilter(room)}
              className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                roomFilter === room
                  ? 'bg-zinc-900 text-white font-black shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70'
              }`}
            >
              {room}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-56">
          <span className="absolute left-2.5 top-2 text-zinc-400 pointer-events-none">
            <SvgSearch />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="사역명, 장소, 대상 검색..."
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

      {/* ===================================================================== */}
      {/* 📱 [모바일 & 태블릿 세로 뷰] 주간 스트립 ↔ 월간 그리드 전환 지원          */}
      {/* ===================================================================== */}
      <div className="flex lg:hidden flex-col flex-1 w-full h-full gap-3 overflow-y-auto bg-zinc-50/50 p-3 hide-scrollbar">
        <div className="p-3.5 rounded-2xl border border-zinc-200/90 shadow-2xs flex flex-col gap-3 shrink-0 bg-white">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-black text-zinc-900 tracking-tight whitespace-nowrap">
                {mobileCalendarView === 'week' ? mobileMonthStr : `${calendarYear}년 ${calendarMonth}월`}
              </h2>
              <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setMobileCalendarView('week')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                    mobileCalendarView === 'week' ? 'bg-white text-zinc-900 font-black shadow-2xs' : 'text-zinc-500'
                  }`}
                >
                  주간
                </button>
                <button
                  type="button"
                  onClick={() => setMobileCalendarView('month')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                    mobileCalendarView === 'month' ? 'bg-white text-zinc-900 font-black shadow-2xs' : 'text-zinc-500'
                  }`}
                >
                  월간
                </button>
              </div>
            </div>

            {mobileCalendarView === 'week' && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevWeek}
                  className="p-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                >
                  <IconChevronLeft />
                </button>
                <button
                  type="button"
                  onClick={nextWeek}
                  className="p-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                >
                  <IconChevronRight />
                </button>
              </div>
            )}
          </div>

          {mobileCalendarView === 'week' ? (
            <div className="grid grid-cols-7 gap-1">
              {weekDates.map((dStr) => {
                const isSelected = dStr === mobileSelectedDate;
                const isToday = dStr === getKSTDateStr();
                const dots = getDotsForDate(dStr);
                const dt = new Date(dStr);
                const dateNum = parseInt(dStr.split('-')[2], 10);
                const dayOfWeekStr = ['일', '월', '화', '수', '목', '금', '토'][dt.getDay()];
                const isRed = isHoliday(dStr);

                return (
                  <div
                    key={dStr}
                    onClick={() => {
                      setMobileSelectedDate(dStr);
                      setSelectedCalDay(dateNum);
                    }}
                    className="flex flex-col items-center justify-center cursor-pointer py-1.5 rounded-xl hover:bg-zinc-50 transition-colors select-none"
                  >
                    <span className={`text-[10px] font-bold mb-1 ${isRed ? 'text-rose-600' : 'text-zinc-400'}`}>
                      {dayOfWeekStr}
                    </span>
                    <div
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-[12px] font-mono tabular-nums transition-all ${
                        isSelected
                          ? 'bg-zinc-900 text-white font-black shadow-xs scale-105'
                          : isToday
                          ? 'bg-zinc-100 text-rose-600 font-black border border-zinc-300'
                          : isRed
                          ? 'font-bold text-rose-600'
                          : 'font-bold text-zinc-800'
                      }`}
                    >
                      {dateNum}
                    </div>
                    <div className="flex gap-0.5 h-1.5 items-center justify-center mt-1">
                      {dots.map((color, idx) => (
                        <div key={idx} className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-7 text-center text-[10px] font-black text-zinc-400 pb-1">
                {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                  <span key={d} className={i === 0 ? 'text-rose-600' : i === 6 ? 'text-blue-600' : ''}>
                    {d}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell, idx) => {
                  const isSelected = cell.dateStr === mobileSelectedDate;
                  const isToday = cell.dateStr === getKSTDateStr();
                  const dots = getDotsForDate(cell.dateStr);
                  const isRed = isHoliday(cell.dateStr);

                  return (
                    <button
                      key={`${cell.dateStr}-${idx}`}
                      type="button"
                      onClick={() => {
                        setMobileSelectedDate(cell.dateStr);
                        if (cell.isCurrentMonth) setSelectedCalDay(cell.day);
                      }}
                      className={`py-1.5 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                        !cell.isCurrentMonth ? 'opacity-30' : ''
                      } ${isSelected ? 'bg-zinc-900 text-white font-black' : isToday ? 'bg-zinc-100 font-black' : ''}`}
                    >
                      <span
                        className={`text-[11px] font-mono tabular-nums ${
                          isSelected ? 'text-white' : isRed ? 'text-rose-600' : 'text-zinc-800'
                        }`}
                      >
                        {cell.day}
                      </span>
                      <div className="flex gap-0.5 h-1 items-center justify-center mt-0.5">
                        {dots.map((c, i) => (
                          <span
                            key={i}
                            className="w-1 h-1 rounded-full"
                            style={{ backgroundColor: isSelected ? '#FFFFFF' : c }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 모바일 선택일 일정 리스트 */}
        <div className="flex-1 bg-white rounded-2xl border border-zinc-200/90 shadow-2xs p-4 space-y-2.5">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-2.5">
            <div className="flex items-center gap-2">
              <h4 className="font-black text-[13.5px] text-zinc-900 font-mono tabular-nums">
                {mobileSelectedDate.replace(/-/g, '. ')}
              </h4>
              {getHolidayLabel(mobileSelectedDate) && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 whitespace-nowrap">
                  {getHolidayLabel(mobileSelectedDate)}
                </span>
              )}
            </div>
            <span className="text-[10.5px] font-mono bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-0.5 rounded-md font-bold whitespace-nowrap tabular-nums">
              {mobileEventsForDay.length}건
            </span>
          </div>

          {mobileEventsForDay.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-zinc-400 text-[12px] font-medium">등록된 사역 일정이 없습니다.</p>
              <button
                type="button"
                onClick={() => handleCellDoubleClick(mobileSelectedDate)}
                className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-bold cursor-pointer"
              >
                + 이 날짜에 일정 추가
              </button>
            </div>
          ) : (
            mobileEventsForDay.map((ev) => (
              <div
                key={ev.id}
                onClick={() => handleEditClick(ev)}
                style={{ borderLeftColor: ev.color || '#18181B', borderLeftWidth: '4px' }}
                className="relative group p-3 rounded-xl border border-zinc-200 hover:border-zinc-400 bg-zinc-50/40 hover:bg-white flex flex-col gap-1.5 cursor-pointer transition-all shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-black text-[13px] text-zinc-900 leading-snug break-keep">{ev.title}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleDuplicateEvent(e, ev)}
                      className="p-1 text-zinc-400 hover:text-zinc-900 rounded cursor-pointer"
                      title="일정 복제"
                    >
                      <SvgCopy />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteEvent(e, ev.id)}
                      className="p-1 text-zinc-400 hover:text-rose-600 rounded cursor-pointer"
                      title="일정 삭제"
                    >
                      <SvgTrash />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500 font-medium whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-zinc-200 font-mono tabular-nums">
                    <SvgClock /> {ev.isAllDay ? '종일' : `${ev.startTime} ~ ${ev.endTime}`}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-zinc-200">
                    <SvgMapPin /> {ev.room || '본당'}
                  </span>
                  {ev.target && (
                    <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded font-bold text-[10px]">
                      {ev.target}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 💻 [PC & 태블릿 가로 뷰] 고밀도 7x6 그리드 캘린더 + 듀얼 아젠다 사이드바 */}
      {/* ===================================================================== */}
      <div className="hidden lg:flex flex-row flex-1 min-h-0 relative bg-zinc-100/60">
        
        {/* 좌측 메인 캘린더 그리드 */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden box-border border-r border-zinc-200">
          <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50/90 shrink-0">
            {['일 (SUN)', '월 (MON)', '화 (TUE)', '수 (WED)', '목 (THU)', '금 (FRI)', '토 (SAT)'].map((day, i) => (
              <div
                key={day}
                className={`py-2 text-center text-[10.5px] font-mono font-black tracking-wider whitespace-nowrap ${
                  i === 0 ? 'text-rose-600' : i === 6 ? 'text-blue-600' : 'text-zinc-500'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-7 grid-rows-6 bg-zinc-200/70 gap-px">
            {calendarCells.map((cell, idx) => {
              const isToday = cell.dateStr === getKSTDateStr();
              const isSelectedDay = cell.dateStr === selectedDateStr && cell.isCurrentMonth;
              const events = getEventsForDay(cell.dateStr);
              const inDragRange = isDateInRange(cell.dateStr);
              const isRedDay = isHoliday(cell.dateStr);
              const holidayName = getHolidayLabel(cell.dateStr);

              return (
                <div
                  key={`${cell.dateStr}-${idx}`}
                  onMouseDown={() => {
                    if (cell.isCurrentMonth) setSelectedCalDay(cell.day);
                    setSidebarTab('day');
                    handleMouseDown(cell.dateStr);
                  }}
                  onMouseEnter={() => handleMouseEnter(cell.dateStr)}
                  onMouseUp={handleMouseUp}
                  onDoubleClick={() => handleCellDoubleClick(cell.dateStr)}
                  className={`min-h-[76px] flex flex-col bg-white transition-colors cursor-pointer group relative ${
                    !cell.isCurrentMonth ? 'bg-zinc-50/60 opacity-45' : ''
                  } ${
                    inDragRange
                      ? 'bg-zinc-100 ring-2 ring-inset ring-zinc-900 z-10'
                      : isSelectedDay
                      ? 'bg-zinc-50/90 ring-1 ring-inset ring-zinc-900 z-10'
                      : 'hover:bg-zinc-50/60'
                  }`}
                >
                  {/* 셀 상단: 일자 & 공휴일명 & 초과 배지 */}
                  <div className="flex justify-between items-center mb-0.5 px-1.5 pt-1.5 pointer-events-none gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <span
                        className={`text-[11px] font-mono font-black w-5 h-5 flex items-center justify-center rounded-md shrink-0 tabular-nums ${
                          isToday
                            ? 'bg-zinc-900 text-white shadow-2xs'
                            : isSelectedDay
                            ? 'bg-zinc-200 text-zinc-950'
                            : cell.isCurrentMonth
                            ? isRedDay
                              ? 'text-rose-600'
                              : 'text-zinc-800'
                            : 'text-zinc-400'
                        }`}
                      >
                        {cell.day}
                      </span>
                      {holidayName && cell.isCurrentMonth && (
                        <span className="text-[9.5px] font-bold text-rose-500 truncate">
                          {holidayName}
                        </span>
                      )}
                    </div>

                    {events.length > 3 && (
                      <span className="text-[9px] font-mono font-black text-zinc-600 bg-zinc-100 border border-zinc-200 px-1 py-0.2 rounded whitespace-nowrap shrink-0 tabular-nums">
                        +{events.length - 3}
                      </span>
                    )}
                  </div>

                  {/* 셀 내부 이벤트 스트립 */}
                  <div className="flex-1 space-y-[2px] overflow-y-auto hide-scrollbar z-10 px-1 pb-1 mt-0.5">
                    {events.slice(0, 3).map((ev, eIdx) => {
                      const evStart = new Date(`${ev.date}T00:00:00`).getTime();
                      const evEnd = ev.endDate ? new Date(`${ev.endDate}T00:00:00`).getTime() : evStart;
                      const current = new Date(`${cell.dateStr}T00:00:00`).getTime();

                      const isFirstDay = current === evStart;
                      const isLastDay = current === evEnd;
                      const isMiddleDay = current > evStart && current < evEnd;
                      const dayOfWeek = new Date(current).getDay();
                      const isStartOfWeek = dayOfWeek === 0;
                      const isEndOfWeek = dayOfWeek === 6;

                      let roundedClass = 'rounded-[4px]';
                      if (isFirstDay && isLastDay) roundedClass = 'rounded-md';
                      else if (isFirstDay || (isMiddleDay && isStartOfWeek)) roundedClass = 'rounded-l-md';
                      else if (isLastDay || (isMiddleDay && isEndOfWeek)) roundedClass = 'rounded-r-md';
                      else if (isMiddleDay) roundedClass = 'rounded-none';

                      let borderClass = 'border-l-[3px]';
                      if (!isFirstDay && !isStartOfWeek) borderClass = 'border-l-0';
                      const showTitle = isFirstDay || isStartOfWeek;
                      const barColor = ev.color || '#18181B';

                      return (
                        <div
                          key={`${ev.id}-${eIdx}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (cell.isCurrentMonth) setSelectedCalDay(cell.day);
                            setSelectedDetailEvent(ev);
                            handleEditClick(ev);
                          }}
                          style={{
                            backgroundColor: `${barColor}18`,
                            borderLeftColor: isFirstDay || isStartOfWeek ? barColor : 'transparent'
                          }}
                          className={`px-1.5 py-0.5 text-[10px] font-bold flex items-center justify-between gap-1 truncate border-y border-r cursor-pointer transition-all ${roundedClass} ${borderClass} ${
                            selectedDetailEvent?.id === ev.id
                              ? 'border-r-zinc-400 border-y-zinc-400 shadow-2xs brightness-95'
                              : 'border-y-transparent border-r-transparent hover:border-y-zinc-300 hover:border-r-zinc-300'
                          }`}
                          title={`${ev.title} (${ev.isAllDay ? '종일' : `${ev.startTime}~${ev.endTime}`} · ${ev.room || '본당'})`}
                        >
                          <span className="truncate flex-1 leading-tight" style={{ color: barColor }}>
                            {showTitle ? ev.title : '\u00A0'}
                          </span>
                          {showTitle && !ev.isAllDay && ev.startTime && (
                            <span className="text-[8.5px] font-mono opacity-70 shrink-0 tabular-nums" style={{ color: barColor }}>
                              {ev.startTime}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 리사이저 핸들 */}
        <div
          onMouseDown={() => setIsResizing(true)}
          className={`w-2 cursor-col-resize flex justify-center items-center group z-20 transition-colors ${
            isResizing ? 'bg-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200'
          }`}
        >
          <div
            className={`w-0.5 h-8 rounded-full transition-all ${
              isResizing ? 'bg-zinc-700 scale-y-125' : 'bg-zinc-300 group-hover:bg-zinc-500'
            }`}
          />
        </div>

        {/* 우측 사이드 패널 (선택일 상세 ↔ 이달의 전체 아젠다 타임라인) */}
        <div style={{ width: agendaWidth }} className="flex flex-col shrink-0 h-full bg-zinc-50/60">
          <div className="flex-1 flex flex-col relative overflow-hidden">
            
            {/* 우측 패널 헤더 & 모드 스위처 */}
            <div className="sticky top-0 px-4 py-3 border-b border-zinc-200 bg-white z-25 shrink-0 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="font-black text-[14px] tracking-tight text-zinc-900 font-mono tabular-nums whitespace-nowrap">
                    {sidebarTab === 'day'
                      ? `${selectedDateStr.replace(/-/g, '. ')}`
                      : `${calendarYear}. ${String(calendarMonth).padStart(2, '0')} 전체`}
                  </h3>
                  {sidebarTab === 'day' && getHolidayLabel(selectedDateStr) && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 whitespace-nowrap">
                      {getHolidayLabel(selectedDateStr)}
                    </span>
                  )}
                </div>

                <span className="text-[10.5px] font-mono font-bold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md border border-zinc-200 whitespace-nowrap tabular-nums">
                  {sidebarTab === 'day' ? `${eventsForSelectedDay.length}건` : `${currentMonthEventsSummary.length}건`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/80 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setSidebarTab('day')}
                  className={`py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                    sidebarTab === 'day' ? 'bg-white text-zinc-950 font-black shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  선택일 상세 ({eventsForSelectedDay.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab('month')}
                  className={`py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                    sidebarTab === 'month' ? 'bg-white text-zinc-950 font-black shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  월간 타임라인 ({currentMonthEventsSummary.length})
                </button>
              </div>
            </div>

            {/* 우측 패널 리스트 바디 */}
            <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-2.5 p-3.5">
              {sidebarTab === 'day' ? (
                eventsForSelectedDay.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-300 shadow-2xs">
                      <SvgCalendar />
                    </div>
                    <span className="text-zinc-400 text-[12px] font-bold">선택한 날짜에 사역 일정이 없습니다.</span>
                    <button
                      type="button"
                      onClick={() => handleCellDoubleClick(selectedDateStr)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-bold cursor-pointer shadow-2xs transition-all"
                    >
                      + 이 날짜에 일정 등록
                    </button>
                  </div>
                ) : (
                  eventsForSelectedDay.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => handleEditClick(ev)}
                      style={{ borderLeftColor: ev.color || '#18181B', borderLeftWidth: '4px' }}
                      className="relative group p-3.5 rounded-xl border border-zinc-200/90 hover:border-zinc-400 bg-white cursor-pointer flex flex-col gap-2 transition-all shadow-2xs hover:shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-black text-[13px] text-zinc-900 leading-snug break-keep">
                          {ev.title}
                        </span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleDuplicateEvent(e, ev)}
                            className="p-1 text-zinc-400 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded cursor-pointer"
                            title="이 일정 복제"
                          >
                            <SvgCopy />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteEvent(e, ev.id)}
                            className="p-1 text-zinc-400 hover:text-rose-600 bg-zinc-50 hover:bg-rose-50 rounded cursor-pointer"
                            title="일정 삭제"
                          >
                            <SvgTrash />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-600 font-medium whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 bg-zinc-50 px-2 py-0.5 rounded-md border border-zinc-200/80 font-mono tabular-nums">
                          <SvgClock /> {ev.isAllDay ? '종일' : `${ev.startTime} ~ ${ev.endTime}`}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-zinc-50 px-2 py-0.5 rounded-md border border-zinc-200/80">
                          <SvgMapPin /> {ev.room || '본당'}
                        </span>
                        {ev.target && (
                          <span className="bg-zinc-900 text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
                            {ev.target}
                          </span>
                        )}
                      </div>

                      {ev.repeat && ev.repeat !== '안 함' && ev.repeat !== '한 번만' && (
                        <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                          <SvgRepeat /> 반복: {ev.repeat}
                        </span>
                      )}

                      {ev.memo && (
                        <p className="text-[11px] text-zinc-500 line-clamp-2 bg-zinc-50/70 p-2 rounded-lg border border-zinc-100 leading-relaxed">
                          {ev.memo}
                        </p>
                      )}
                    </div>
                  ))
                )
              ) : currentMonthEventsSummary.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
                  <span className="text-zinc-400 text-[12px] font-bold">이번 달에 등록된 일정이 없습니다.</span>
                </div>
              ) : (
                currentMonthEventsSummary.map((ev, idx) => (
                  <div
                    key={`${ev.id}_${ev.displayDate}_${idx}`}
                    onClick={() => handleEditClick(ev)}
                    style={{ borderLeftColor: ev.color || '#18181B', borderLeftWidth: '4px' }}
                    className="p-3 rounded-xl border border-zinc-200/90 hover:border-zinc-400 bg-white cursor-pointer flex flex-col gap-1.5 transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[10.5px] font-mono text-zinc-400 tabular-nums whitespace-nowrap">
                      <span className="font-bold text-zinc-700">{ev.displayDate?.replace(/-/g, '. ')}</span>
                      <span>{ev.isAllDay ? '종일' : ev.startTime} · {ev.room || '본당'}</span>
                    </div>
                    <span className="font-black text-[12.5px] text-zinc-900 truncate">{ev.title}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
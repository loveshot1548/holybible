import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

// 🌟 엔터프라이즈 모노크롬 SVG 세트
const SvgCalendar = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const SvgPlus = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const SvgClock = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>;
const IconChevronLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><polyline points="15 18 9 12 15 6" /></svg>;
const IconChevronRight = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><polyline points="9 18 15 12 9 6" /></svg>;
const SvgTrash = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;

const formatLocal = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getKSTDateStr = (dateObj = new Date()) => {
  const utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (9 * 3600000));
  return formatLocal(kst);
};

const KOR_HOLIDAYS = ['01-01', '03-01', '05-05', '06-06', '08-15', '10-03', '10-09', '12-25', '02-16', '02-17', '02-18', '05-24', '09-24', '09-25', '09-26'];

export default function AdminCalendarTab({
  calendarYear, setCalendarYear, calendarMonth, setCalendarMonth, selectedDateStr, 
  filteredEventsForDate: allEvents = [], setChurchEvents,
  setEditingEventId, setFormEventTitle, setFormEventDate, setFormEventEndDate, setFormEventStartTime, setFormEventEndTime,
  setFormEventIsAllDay, setFormEventRoom, setFormEventTarget, setFormEventRepeat, setFormEventColor, setFormEventMemo,
  setShowEventModal, firstDayOfWeek, daysInMonth, selectedCalDay, setSelectedCalDay
}) {
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [agendaWidth, setAgendaWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedDetailEvent, setSelectedDetailEvent] = useState(null);

  const [mobileSelectedDate, setMobileSelectedDate] = useState(getKSTDateStr());

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      let newWidth = window.innerWidth - e.clientX - 32;
      if (newWidth < 260) newWidth = 260;
      if (newWidth > 550) newWidth = 550;
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

  const calendarCells = useMemo(() => {
    const cells = [];
    const prevLastDay = new Date(calendarYear, calendarMonth - 1, 0).getDate();
    
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dStr = `${calendarMonth === 1 ? calendarYear - 1 : calendarYear}-${String(calendarMonth === 1 ? 12 : calendarMonth - 1).padStart(2, '0')}-${String(prevLastDay - i).padStart(2, '0')}`;
      cells.push({ day: prevLastDay - i, isCurrentMonth: false, dateStr: dStr });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push({ day: i, isCurrentMonth: true, dateStr: dStr });
    }
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const dStr = `${calendarMonth === 12 ? calendarYear + 1 : calendarYear}-${String(calendarMonth === 12 ? 1 : calendarMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push({ day: i, isCurrentMonth: false, dateStr: dStr });
    }
    return cells;
  }, [calendarYear, calendarMonth, firstDayOfWeek, daysInMonth]);

  const getEventsForDay = useCallback((dateStr) => {
    if (!dateStr || !Array.isArray(allEvents)) return [];
    const targetTime = new Date(`${dateStr}T00:00:00`).getTime();
    const targetDayOfWeek = new Date(`${dateStr}T00:00:00`).getDay();

    return allEvents.filter(ev => {
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
        if (ev.repeat === '매월') return new Date(`${dateStr}T00:00:00`).getDate() === new Date(`${ev.date}T00:00:00`).getDate();
      }
      return false;
    });
  }, [allEvents]);

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

  const getDotsForDate = (dStr) => getEventsForDay(dStr).slice(0, 3).map(ev => ev.color || '#4F46E5');

  const handleMouseDown = (dateStr) => { setIsDragging(true); setDragStart(dateStr); setDragEnd(dateStr); };
  const handleMouseEnter = (dateStr) => { if (isDragging) setDragEnd(dateStr); };
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      const start = new Date(`${dragStart}T00:00:00`) <= new Date(`${dragEnd}T00:00:00`) ? dragStart : dragEnd;
      const end = new Date(`${dragStart}T00:00:00`) <= new Date(`${dragEnd}T00:00:00`) ? dragEnd : dragStart;
      
      setEditingEventId(null); setFormEventTitle(''); setFormEventDate(start); setFormEventEndDate(end); setFormEventMemo('');
      setShowEventModal(true); setDragStart(null); setDragEnd(null);
    }
  };

  const isDateInRange = (dateStr) => {
    if (!dragStart || !dragEnd) return false;
    const d = new Date(`${dateStr}T00:00:00`).getTime();
    const s = new Date(`${dragStart}T00:00:00`).getTime();
    const e = new Date(`${dragEnd}T00:00:00`).getTime();
    return (d >= s && d <= e) || (d >= e && d <= s);
  };

  const handleEditClick = (ev) => {
    setEditingEventId(ev.id); setFormEventTitle(ev.title); setFormEventDate(ev.date); setFormEventEndDate(ev.endDate || ev.date);
    setFormEventStartTime(ev.startTime || '11:00'); setFormEventEndTime(ev.endTime || '12:30'); setFormEventIsAllDay(ev.isAllDay || false);
    setFormEventRoom(ev.room || '본당'); setFormEventTarget(ev.target || '전교인'); setFormEventRepeat(ev.repeat || '안 함');
    setFormEventColor(ev.color || '#4F46E5'); setFormEventMemo(ev.memo || ''); setShowEventModal(true);
  };

  const handleDeleteEvent = async (e, evId) => {
    e.stopPropagation();
    if (!window.confirm("이 일정을 영구 삭제하시겠습니까?")) return;
    if (setChurchEvents) setChurchEvents(prev => prev.filter(ev => ev.id !== evId));
    if (supabase) { try { await supabase.from('church_events').delete().eq('id', evId); } catch (err) {} }
  };

  const isHoliday = (dateStr) => {
    const dayOfWeek = new Date(`${dateStr}T00:00:00`).getDay();
    if (dayOfWeek === 0) return true;
    const monthDay = dateStr.slice(5); 
    if (KOR_HOLIDAYS.includes(monthDay)) return true;
    return false;
  };

  const goToToday = () => {
    const todayStr = getKSTDateStr();
    const today = new Date(todayStr);
    if (setCalendarYear) setCalendarYear(today.getFullYear());
    setCalendarMonth(today.getMonth() + 1);
    setSelectedCalDay(today.getDate());
    setMobileSelectedDate(todayStr);
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden box-border bg-white rounded-xl border border-zinc-200 shadow-sm" onMouseLeave={() => setIsDragging(false)}>
      
      {/* 상단 컨트롤 바 */}
      <div className="px-5 py-3.5 border-b border-zinc-200 bg-zinc-50/80 flex flex-col sm:flex-row justify-between items-start sm:items-center shrink-0 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-700 shadow-sm"><SvgCalendar /></div>
          <div>
            <h3 className="text-[15px] font-black text-zinc-900 tracking-tight leading-none">교회 통합 사역 일정표</h3>
            <span className="text-[11px] text-zinc-500 font-medium mt-1 block">모든 사역 일정을 한눈에 관리합니다.</span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          <button type="button" onClick={goToToday} className="px-3 py-1.5 rounded-md bg-white border border-zinc-200 shadow-sm text-[11.5px] font-bold text-zinc-700 hover:bg-zinc-50 cursor-pointer transition-colors">오늘</button>
          
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-md border border-zinc-200/80 shadow-inner lg:flex hidden">
            <button type="button" onClick={() => setCalendarMonth(prev => prev === 1 ? 12 : prev - 1)} className="px-2 py-1 rounded bg-white shadow-sm text-zinc-600 font-black cursor-pointer hover:bg-zinc-50 transition-colors"><IconChevronLeft /></button>
            <span className="px-4 text-[12.5px] font-black text-zinc-800">{calendarYear}년 {calendarMonth}월</span>
            <button type="button" onClick={() => setCalendarMonth(prev => prev === 12 ? 1 : prev + 1)} className="px-2 py-1 rounded bg-white shadow-sm text-zinc-600 font-black cursor-pointer hover:bg-zinc-50 transition-colors"><IconChevronRight /></button>
          </div>
          
          <button type="button" onClick={() => { setEditingEventId(null); setFormEventTitle(''); setFormEventDate(selectedDateStr); setFormEventEndDate(selectedDateStr); setFormEventMemo(''); setShowEventModal(true); }} className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[11.5px] font-bold rounded-md shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors active:scale-95">
            <SvgPlus /> 신규 일정
          </button>
        </div>
      </div>

      {/* 📱 [모바일 뷰] */}
      <div className="flex lg:hidden flex-col flex-1 w-full h-full gap-3 overflow-y-auto bg-zinc-50/50 p-3">
        <div className="p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col gap-3 shrink-0 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-black text-zinc-900 tracking-tight">{mobileMonthStr}</h2>
            <div className="flex items-center gap-1">
              <button type="button" onClick={prevWeek} className="p-1 rounded bg-zinc-50 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 cursor-pointer"><IconChevronLeft /></button>
              <button type="button" onClick={nextWeek} className="p-1 rounded bg-zinc-50 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 cursor-pointer"><IconChevronRight /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weekDates.map((dStr) => {
              const isSelected = dStr === mobileSelectedDate;
              const isToday = dStr === getKSTDateStr();
              const dots = getDotsForDate(dStr);
              const dt = new Date(dStr);
              const dateNum = parseInt(dStr.split('-')[2], 10);
              const dayOfWeekStr = ['일', '월', '화', '수', '목', '금', '토'][dt.getDay()];
              const isSunday = dt.getDay() === 0;
              
              return (
                <div key={dStr} onClick={() => setMobileSelectedDate(dStr)} className="flex flex-col items-center justify-center cursor-pointer py-1.5 rounded-lg hover:bg-zinc-50 transition-colors select-none">
                   <span className={`text-[10px] font-bold mb-1 ${isSunday ? 'text-rose-600' : 'text-zinc-400'}`}>{dayOfWeekStr}</span>
                   <div className={`w-[28px] h-[28px] flex items-center justify-center rounded-md text-[12px] transition-all ${isSelected ? 'bg-zinc-900 text-white font-black shadow-sm scale-105' : (isToday ? 'text-rose-600 font-black' : 'font-bold text-zinc-800')}`}>{dateNum}</div>
                   <div className="flex gap-0.5 h-1 justify-center mt-1">
                     {dots.map((color, idx) => (<div key={idx} className="w-1 h-1 rounded-full" style={{ backgroundColor: color }}></div>))}
                   </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-zinc-200 shadow-sm p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
            <h4 className="font-bold text-[13px] text-zinc-900">{mobileSelectedDate.replace(/-/g, '. ')} 일정</h4>
            <span className="text-[10.5px] bg-zinc-100 text-zinc-600 border border-zinc-200 px-2 py-0.5 rounded font-bold">{mobileEventsForDay.length}건</span>
          </div>
          {mobileEventsForDay.length === 0 ? (
            <p className="text-center py-10 text-zinc-400 text-[12px] font-medium">등록된 일정이 없습니다.</p>
          ) : (
            mobileEventsForDay.map(ev => (
              <div key={ev.id} onClick={() => handleEditClick(ev)} className="relative group p-3 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-zinc-50/50 hover:bg-white flex flex-col gap-1 cursor-pointer transition-colors shadow-xs">
                <span className="font-bold text-[13px] text-zinc-900 pr-6">{ev.title}</span>
                <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-medium"><SvgClock /> {ev.isAllDay ? '종일' : `${ev.startTime} ~${ev.endTime}`} ({ev.room})</span>
                <button onClick={(e) => handleDeleteEvent(e, ev.id)} className="absolute right-3 top-3 text-zinc-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"><SvgTrash /></button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 💻 [PC 전용 뷰] 고밀도 그리드 달력 */}
      <div className="hidden lg:flex flex-row flex-1 min-h-0 relative bg-zinc-100/50">
        <div className="flex-1 flex flex-col bg-white overflow-hidden box-border border-r border-zinc-200">
          <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50/80 shrink-0">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
              <div key={day} className={`py-2 text-center text-[11px] font-black tracking-wider ${i === 0 ? 'text-rose-600' : i === 6 ? 'text-blue-600' : 'text-zinc-500'}`}>{day}</div>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-7 grid-rows-6 bg-zinc-200/60 gap-px">
            {calendarCells.map((cell, idx) => {
              const isToday = cell.dateStr === getKSTDateStr();
              const isSelectedDay = cell.dateStr === selectedDateStr;
              const events = getEventsForDay(cell.dateStr);
              const inDragRange = isDateInRange(cell.dateStr);
              const isRedDay = isHoliday(cell.dateStr); 

              return (
                <div 
                  key={`${cell.dateStr}-${idx}`}
                  onMouseDown={() => { setSelectedCalDay(cell.day); handleMouseDown(cell.dateStr); }}
                  onMouseEnter={() => handleMouseEnter(cell.dateStr)}
                  onMouseUp={handleMouseUp}
                  className={`min-h-[70px] flex flex-col bg-white transition-colors cursor-crosshair group relative 
                    ${!cell.isCurrentMonth ? 'bg-zinc-50/40 opacity-40' : ''} 
                    ${inDragRange ? 'bg-zinc-100/80 ring-1 ring-inset ring-zinc-400' : isSelectedDay ? 'bg-zinc-50' : 'hover:bg-zinc-50/50'}
                  `}
                >
                  <div className="flex justify-between items-start mb-0.5 px-1.5 pt-1.5 pointer-events-none">
                    <span className={`text-[11px] font-mono font-bold w-5 h-5 flex items-center justify-center rounded-md 
                      ${isToday ? 'bg-zinc-900 text-white shadow-sm' : cell.isCurrentMonth ? (isRedDay ? 'text-rose-600' : 'text-zinc-700') : 'text-zinc-400'}
                    `}>{cell.day}</span>
                    {events.length > 3 && <span className="text-[9px] font-bold text-zinc-400 bg-zinc-100 border border-zinc-200 px-1 py-0.2 rounded">+{events.length - 3}</span>}
                  </div>

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
                      
                      let roundedClass = 'rounded-[3px]'; 
                      if (isFirstDay && isLastDay) roundedClass = 'rounded-md';
                      else if (isFirstDay || (isMiddleDay && isStartOfWeek)) roundedClass = 'rounded-l-md';
                      else if (isLastDay || (isMiddleDay && isEndOfWeek)) roundedClass = 'rounded-r-md';
                      else if (isMiddleDay) roundedClass = 'rounded-none';

                      let borderClass = 'border-l-[3px]';
                      if (!isFirstDay && !isStartOfWeek) borderClass = 'border-l-0';
                      const showTitle = isFirstDay || isStartOfWeek;

                      return (
                         <div 
                          key={`${ev.id}-${eIdx}`}
                          onClick={(e) => { e.stopPropagation(); setSelectedCalDay(cell.day); setSelectedDetailEvent(ev); }}
                          style={{ backgroundColor: `${ev.color}15`, borderLeftColor: (isFirstDay || isStartOfWeek) ? ev.color : 'transparent' }}
                          className={`px-1.5 py-0.5 text-[10px] font-bold flex items-center gap-1 truncate border-y border-r cursor-pointer transition-all ${roundedClass} ${borderClass}${selectedDetailEvent?.id === ev.id ? 'border-r-zinc-400 border-y-zinc-400 shadow-sm brightness-95' : 'border-y-transparent border-r-transparent hover:border-y-zinc-300 hover:border-r-zinc-300 hover:shadow-xs'}
                          `}
                        >
                          <span className="truncate flex-1 leading-tight" style={{ color: ev.color }}>{showTitle ? ev.title : '\u00A0'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resizer Handle */}
        <div onMouseDown={() => setIsResizing(true)} className={`w-2 cursor-col-resize flex justify-center items-center group z-20 mx-0.5 transition-colors ${isResizing ? 'bg-zinc-200' : 'hover:bg-zinc-200'}`}>
          <div className={`w-0.5 h-8 rounded-full transition-all ${isResizing ? 'bg-zinc-500 scale-y-125' : 'bg-zinc-300 group-hover:bg-zinc-400'}`} />
        </div>

        {/* 우측 사이드 패널 (선택된 날짜 상세) */}
        <div style={{ width: agendaWidth }} className="flex flex-col shrink-0 h-full bg-zinc-50/50">
          <div className="flex-1 flex flex-col relative overflow-hidden">
            <div className="sticky top-0 px-4 py-3.5 border-b border-zinc-200 bg-white/95 backdrop-blur-sm z-25 shrink-0">
              <h3 className="font-black text-[14.5px] tracking-tight text-zinc-900">{selectedDateStr.replace(/-/g, '. ')} 상세 일정</h3>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-2.5 p-4">
              {eventsForSelectedDay.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-300"><SvgCalendar /></div>
                  <span className="text-zinc-400 text-[12px] font-bold">등록된 일정이 없습니다.</span>
                </div>
              ) : (
                eventsForSelectedDay.map(ev => (
                  <div key={ev.id} onClick={() => handleEditClick(ev)} className="relative group p-3.5 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white cursor-pointer flex flex-col gap-1.5 transition-all shadow-xs hover:shadow-sm">
                    <span className="font-bold text-[13px] text-zinc-900 pr-6 leading-tight">{ev.title}</span>
                    <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-medium bg-zinc-50 w-fit px-1.5 py-0.5 rounded border border-zinc-100"><SvgClock /> {ev.isAllDay ? '종일' : `${ev.startTime} ~${ev.endTime}`}</span>
                    <span className="text-[11px] text-zinc-400 font-medium">장소: {ev.room}</span>
                    <button onClick={(e) => handleDeleteEvent(e, ev.id)} className="absolute right-3 top-3 text-zinc-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-zinc-50 rounded hover:bg-rose-50 cursor-pointer"><SvgTrash /></button>
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
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

// VAPID 변환 헬퍼
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

// 1. 상단 registerDevicePush 수정
const registerDevicePush = async (userName) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      console.warn('알림 권한이 허용되지 않았습니다.');
      return;
    }

    const reg = await navigator.serviceWorker.register('/service-worker.js');
    await navigator.serviceWorker.ready;
    
    const publicVapidKey = 'BNu7vI9F15sYpU2eJjC3q2Gv7U-i4_Q5N1aQ9GZ7fNqZ9e_2N_1U4qQYqP3R5K0J5O_gH6a3E0J1x3d5c7f8a9A';
    let sub = await reg.pushManager.getSubscription();
    
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
    }
    
    if (sub && supabase) {
      await supabase.from('user_push_subscriptions').upsert({
        user_name: userName,
        subscription: sub
      }, { onConflict: 'user_name' });
      console.log('푸시 토큰 동기화 성공!');
    }
  } catch (e) {
    console.error('푸시 등록 처리 중 오류:', e);
  }
};

// 2. handleSaveRoutine 함수 전체 수정
const handleSaveRoutine = async () => {
  if (!formTitle.trim()) { alert('일정 제목을 입력해주세요.'); return; }

 // 로그인된 실제 사용자 정보 동적 추출
  let uName = null;
  try {
    const savedUser = localStorage.getItem('church_auth_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      uName = parsed?.name || parsed?.userName || parsed?.email;
    }
  } catch (e) {}

  if (!uName) {
    alert("로그인 후 알람 기능을 이용하실 수 있습니다.");
    return;
  }

  // 알람 설정 시 푸시 등록 및 서버 적재
  if (formAlarmEnabled) {
    registerDevicePush(uName);

    if (supabase) {
      const timeWithSec = formStartTime.length === 5 ? `${formStartTime}:00` : formStartTime;
      supabase.from('routine_alarms').insert([{
        user_name: uName,
        title: formTitle.trim(),
        alarm_time: timeWithSec,
        repeat_type: formRepeat,
        enabled: true
      }]).then(({ error }) => {
        if (error) {
          console.error("서버 알람 적재 실패:", error);
        } else {
          console.log("서버 알람 적재 완료!");
        }
      });
    }
  }

  // 로컬 루틴 상태 업데이트
  if (editingRoutine) {
    setRoutines(routines.map(r => r.id === editingRoutine.id ? {
      ...r, title: formTitle.trim(), date: formDate, startTime: formStartTime, endTime: formEndTime, 
      isAllDay: formIsAllDay, repeat: formRepeat, group: formGroup, linkedPage: formLinkedPage, 
      color: formColor, alarmEnabled: formAlarmEnabled, alarmOffset: formAlarmOffset
    } : r));
  } else {
    setRoutines([...routines, {
      id: Date.now(), title: formTitle.trim(), date: formDate, startTime: formStartTime, endTime: formEndTime, 
      isAllDay: formIsAllDay, repeat: formRepeat, group: formGroup, linkedPage: formLinkedPage, 
      color: formColor, completedDates: [], alarmEnabled: formAlarmEnabled, alarmOffset: formAlarmOffset
    }]);
  }
  
  setIsModalOpen(false);
};


// =====================================================================
// 로컬 스토리지 헬퍼
// =====================================================================
const getLocal = (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const setLocal = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// =====================================================================
// 아이콘 모음
// =====================================================================
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>;
const IconChevronLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>;
const IconChevronRight = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5"><polyline points="9 18 15 12 9 6" /></svg>;
const IconPlus = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const IconTrash = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
const IconBell = ({ className = "w-4 h-4" }) => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;

// 🔔 알람 사운드 및 시스템 푸시 알림 실행기
const triggerRoutineAlarm = (routine) => {
  try {
    const audio = new Audio('https://cdn.freesound.org/previews/221/221528_4091632-lq.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {});
  } catch (e) {}

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(`⏰ [루틴 알람] ${routine.title}`, {
      body: `${routine.startTime || '약속된 시간'} 루틴을 실천할 시간입니다.`,
      icon: '/favicon.ico'
    });
  }
};

const formatLocal = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayLocalString = () => formatLocal(new Date());

const getRoutinesForDate = (dateStr, routinesList) => {
  return routinesList.filter(r => {
    if (!r.repeat || r.repeat === '안 함') return r.date === dateStr;
    if (r.date > dateStr) return false;
    
    const routineStart = new Date(r.date);
    const currentTarget = new Date(dateStr);
    
    if (r.repeat === '매일') return true;
    if (r.repeat === '매주') return routineStart.getDay() === currentTarget.getDay();
    if (r.repeat === '2주마다') {
      const diffTime = Math.abs(currentTarget - routineStart);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return routineStart.getDay() === currentTarget.getDay() && diffDays % 14 === 0;
    }
    if (r.repeat === '매월') return routineStart.getDate() === currentTarget.getDate();
    return r.date === dateStr;
  }).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
};

const getMonthlyDates = (baseDateStr) => {
  const dt = new Date(baseDateStr);
  const year = dt.getFullYear();
  const month = dt.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const endDate = new Date(lastDay);
  if (endDate.getDay() !== 6) {
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
  }

  const dates = [];
  let current = new Date(startDate);
  while (current <= endDate) {
    dates.push(formatLocal(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

const LABEL_COLORS = [
  '#64748B', '#4F46E5', '#0EA5E9', '#10B981', '#84CC16', 
  '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#1E293B'
];

const APP_PAGES = [
  { id: 'home', label: '홈' },
  { id: 'fiveSetMenu', label: '영적 5종 세트' },
  { id: 'qt', label: '매일 QT' },
  { id: 'mcheyne', label: '맥체인 읽기' },
  { id: 'sermon', label: '예배 노트' },
  { id: 'cell', label: '목장 나눔' },
  { id: 'familySelect', label: '가정 예배' },
  { id: 'bible', label: '365 성경통독' },
  { id: 'interlinear', label: '원어성경 (BETA)' },
  { id: 'bibleWiki', label: '성경 위키' },
  { id: 'qtArchiveDetail', label: 'QT 심층 분석' },
  { id: 'sermonAnalytics', label: '설교 분석' },
  { id: 'sermonArchiveAdvanced', label: '삶의 적용과 실천' },
  { id: 'applyTracker', label: '적용 질문 트래커' },
  { id: 'trainingCurriculum', label: '양육 커리큘럼' },
  { id: 'trainingSubPages', label: '4주 심화 워크북' },
  { id: 'generalNote', label: '자유 노트' },
  { id: 'board', label: '공동체 감사/기도' },
  { id: 'diary', label: '나의 감사/간증' },
  { id: 'prayer', label: '기도 보관함' },
  { id: 'jericho', label: '여리고 땅밟기' }
];

export default function DailyRoutine({ t, isDarkMode, setActiveScreen, isSidebarOpen, setIsSidebarOpen }) {
  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;

  const [routines, setRoutines] = useState(() => getLocal('dr_routines_v2', [
    { id: 1, title: '새벽 기도 및 QT', date: getTodayLocalString(), startTime: '06:00', endTime: '07:00', isAllDay: false, repeat: '매일', group: '영적생활', linkedPage: 'qt', color: '#EC4899', completedDates: [], alarmEnabled: true, alarmOffset: '0' },
    { id: 2, title: '맥체인 성경 읽기', date: getTodayLocalString(), startTime: '21:00', endTime: '22:00', isAllDay: false, repeat: '매일', group: '영적생활', linkedPage: 'mcheyne', color: '#0EA5E9', completedDates: [], alarmEnabled: false, alarmOffset: '0' }
  ]));

  const [calendarGroups, setCalendarGroups] = useState(() => getLocal('dr_groups_v1', ['영적생활', '집', '직장', '개인']));
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddGroupInput, setShowAddGroupInput] = useState(false);

  const [selectedDate, setSelectedDate] = useState(getTodayLocalString);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(selectedDate);
  const [formStartTime, setFormStartTime] = useState('07:00');
  const [formEndTime, setFormEndTime] = useState('08:00');
  const [formIsAllDay, setFormIsAllDay] = useState(false);
  const [formRepeat, setFormRepeat] = useState('안 함');
  const [formGroup, setFormGroup] = useState('영적생활');
  const [formLinkedPage, setFormLinkedPage] = useState('');
  const [formColor, setFormColor] = useState('#007AFF');
  const [formAlarmEnabled, setFormAlarmEnabled] = useState(false);
  const [formAlarmOffset, setFormAlarmOffset] = useState('0');

  useEffect(() => { setLocal('dr_routines_v2', routines); }, [routines]);
  useEffect(() => { setLocal('dr_groups_v1', calendarGroups); }, [calendarGroups]);

  // ⏰ 실시간 알람 체커 (시간 도달 시 알람 사운드 + 시스템 푸시)
  useEffect(() => {
    const firedAlarmsKey = 'dr_fired_alarms_today';
    const checkAlarmTime = () => {
      const now = new Date();
      const todayStr = formatLocal(now);
      const todayRoutines = getRoutinesForDate(todayStr, routines);
      const firedAlarms = getLocal(firedAlarmsKey, []);

      todayRoutines.forEach(r => {
        if (!r.alarmEnabled || !r.startTime) return;
        
        const [h, m] = r.startTime.split(':').map(Number);
        const routineDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
        const offsetMin = parseInt(r.alarmOffset || '0', 10);
        routineDate.setMinutes(routineDate.getMinutes() - offsetMin);

        const diffSec = (now.getTime() - routineDate.getTime()) / 1000;
        const alarmKey = `${todayStr}_${r.id}_${r.startTime}_${offsetMin}`;

        if (diffSec >= 0 && diffSec < 60 && !firedAlarms.includes(alarmKey)) {
          triggerRoutineAlarm(r);
          setLocal(firedAlarmsKey, [...firedAlarms, alarmKey]);
        }
      });
    };

    const interval = setInterval(checkAlarmTime, 10000); // 10초마다 대조
    return () => clearInterval(interval);
  }, [routines]);

  const openCreateModal = () => {
    setEditingRoutine(null);
    setFormTitle('');
    setFormDate(selectedDate);
    setFormStartTime('07:00');
    setFormEndTime('08:00');
    setFormIsAllDay(false);
    setFormRepeat('안 함');
    setFormGroup(calendarGroups[0] || '영적생활');
    setFormLinkedPage('');
    setFormColor('#007AFF');
    setFormAlarmEnabled(false);
    setFormAlarmOffset('0');
    setIsModalOpen(true);
  };

  const openEditModal = (routine) => {
    setEditingRoutine(routine);
    setFormTitle(routine.title);
    setFormDate(routine.date || selectedDate);
    setFormStartTime(routine.startTime || '07:00');
    setFormEndTime(routine.endTime || '08:00');
    setFormIsAllDay(routine.isAllDay || false);
    setFormRepeat(routine.repeat || '안 함');
    setFormGroup(routine.group || '영적생활');
    setFormLinkedPage(routine.linkedPage || '');
    setFormColor(routine.color || '#007AFF');
    setFormAlarmEnabled(routine.alarmEnabled || false);
    setFormAlarmOffset(String(routine.alarmOffset || '0'));
    setIsModalOpen(true);
  };

  const handleSaveRoutine = () => {
    if (!formTitle.trim()) { alert('일정 제목을 입력해주세요.'); return; }

    // 1. 유저명 안전하게 추출 (선언 위치 보장)
    let uName = '사용자';
    try {
      const savedUser = localStorage.getItem('church_auth_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        uName = parsed?.name || parsed?.userName || '사용자';
      }
    } catch (e) {
      uName = '사용자';
    }

    // 2. 알람 설정 시 푸시 권한 및 서버 동기화
    if (formAlarmEnabled) {
      if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
      }

      if (typeof registerDevicePush === 'function') {
        registerDevicePush(uName);
      }

      if (supabase) {
        const timeWithSec = formStartTime.length === 5 ? `${formStartTime}:00` : formStartTime;
        supabase.from('routine_alarms').insert([{
          user_name: uName,
          title: formTitle.trim(),
          alarm_time: timeWithSec,
          repeat_type: formRepeat,
          enabled: true
        }]).then(({ error }) => {
          if (error) {
            console.error("서버 알람 저장 에러:", error);
          } else {
            console.log("서버 알람 적재 완료!");
          }
        });
      }
    }

    // 3. 로컬 상태 업데이트
    if (editingRoutine) {
      setRoutines(routines.map(r => r.id === editingRoutine.id ? {
        ...r, title: formTitle.trim(), date: formDate, startTime: formStartTime, endTime: formEndTime, 
        isAllDay: formIsAllDay, repeat: formRepeat, group: formGroup, linkedPage: formLinkedPage, 
        color: formColor, alarmEnabled: formAlarmEnabled, alarmOffset: formAlarmOffset
      } : r));
    } else {
      setRoutines([...routines, {
        id: Date.now(), title: formTitle.trim(), date: formDate, startTime: formStartTime, endTime: formEndTime, 
        isAllDay: formIsAllDay, repeat: formRepeat, group: formGroup, linkedPage: formLinkedPage, 
        color: formColor, completedDates: [], alarmEnabled: formAlarmEnabled, alarmOffset: formAlarmOffset
      }]);
    }
    
    setIsModalOpen(false);
  };

  const handleDeleteRoutine = (id) => {
    if (window.confirm('이 일정을 삭제하시겠습니까?')) {
      setRoutines(routines.filter(r => r.id !== id));
      setIsModalOpen(false);
    }
  };

  const isCompletedOnDate = (routine, dateStr) => {
    if (routine.completedDates && Array.isArray(routine.completedDates)) {
      return routine.completedDates.includes(dateStr);
    }
    return routine.completed === true; 
  };

  const toggleComplete = (id, e, specificDate = selectedDate) => {
    e.stopPropagation();
    setRoutines(routines.map(r => {
      if (r.id === id) {
        const dates = r.completedDates || [];
        if (dates.includes(specificDate)) {
          return { ...r, completedDates: dates.filter(d => d !== specificDate), completed: false };
        } else {
          return { ...r, completedDates: [...dates, specificDate], completed: true };
        }
      }
      return r;
    }));
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    if (calendarGroups.includes(newGroupName.trim())) { alert('이미 존재하는 그룹명입니다.'); return; }
    setCalendarGroups([...calendarGroups, newGroupName.trim()]);
    setFormGroup(newGroupName.trim());
    setNewGroupName('');
    setShowAddGroupInput(false);
  };

  const filteredRoutinesForSelectedDate = useMemo(() => {
    return getRoutinesForDate(selectedDate, routines);
  }, [routines, selectedDate]);

  const { weekDates, currentMonthStr } = useMemo(() => {
    const dt = new Date(selectedDate);
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
    return { weekDates: week, currentMonthStr: monthStr };
  }, [selectedDate]);

  const prevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(formatLocal(d));
  };
  
  const nextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(formatLocal(d));
  };

  const prevMonth = () => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() - 1);
    setSelectedDate(formatLocal(d));
  };
  
  const nextMonth = () => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + 1);
    setSelectedDate(formatLocal(d));
  };

  const getDotsForDate = (dStr) => {
    const dayRoutines = getRoutinesForDate(dStr, routines).slice(0, 3);
    return dayRoutines.map(r => r.color);
  };

  const monthlyDates = useMemo(() => getMonthlyDates(selectedDate), [selectedDate]);

  return (
    <div className={`flex flex-col w-full h-full relative font-sans overflow-hidden select-none animate-fade-in ${isDark ? 'bg-[#0F1115]' : 'bg-[#F4F5F7]'}`}>
      
      {/* 뷰포트 오로라 배경 */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-60 dark:opacity-40">
        <div 
          className="absolute -top-[10%] -left-[10%] w-[800px] max-w-[90vw] h-[800px] max-h-[90vw] rounded-full" 
          style={{ background: 'radial-gradient(circle, rgba(244, 114, 182, 0.35) 0%, transparent 70%)', filter: 'blur(90px)' }} 
        />
        <div 
          className="absolute -bottom-[10%] -right-[10%] w-[900px] max-w-[95vw] h-[900px] max-h-[95vw] rounded-full" 
          style={{ background: 'radial-gradient(circle, rgba(167, 139, 250, 0.35) 0%, transparent 70%)', filter: 'blur(100px)' }} 
        />
      </div>

      {/* 상단 헤더 */}
      <div className={`shrink-0 flex justify-between items-center px-3 sm:px-4 py-3 border-b backdrop-blur-xl z-30 ${isDark ? 'border-white/10 bg-slate-900/60' : 'border-slate-200/80 bg-white/70'}`}>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setActiveScreen('home')} className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark ? 'text-white hover:bg-white/10' : 'text-slate-900 hover:bg-black/5'}`}>
            <IconArrowLeft />
          </button>
          <h1 className={`text-[16.5px] font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>하루 신앙 루틴</h1>
        </div>
        <button 
          type="button" 
          onClick={openCreateModal}
          className="px-3.5 py-1.5 rounded-full font-bold text-[12px] text-white bg-rose-500 hover:bg-rose-600 shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
        >
          <IconPlus /> 신규
        </button>
      </div>

      <div className="flex-1 w-full flex min-h-0 overflow-hidden relative z-10">
        
        {/* PC / 태블릿 캘린더 뷰 */}
        <div className={`hidden md:flex flex-col flex-1 w-full h-full backdrop-blur-2xl ${isDark ? 'bg-[#1C1C1E]/50' : 'bg-white/60'}`}>
          <div className={`flex justify-between items-center px-6 py-4 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <h2 className={`text-[20px] font-black ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight`}>
              {currentMonthStr}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className={`p-2 rounded-xl border ${isDark ? 'border-white/10 text-white hover:bg-white/10' : 'border-slate-200 text-slate-800 hover:bg-slate-100'} transition-colors cursor-pointer`}><IconChevronLeft /></button>
              <button onClick={nextMonth} className={`p-2 rounded-xl border ${isDark ? 'border-white/10 text-white hover:bg-white/10' : 'border-slate-200 text-slate-800 hover:bg-slate-100'} transition-colors cursor-pointer`}><IconChevronRight /></button>
            </div>
          </div>

          <div className={`grid grid-cols-7 border-b ${isDark ? 'border-white/10 bg-black/10' : 'border-slate-200 bg-black/[0.02]'} shrink-0`}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
              <div key={day} className={`py-2 text-center text-[11px] font-bold uppercase tracking-widest ${i === 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                {day}
              </div>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-hidden">
            {monthlyDates.map((dStr) => {
              const isSelected = dStr === selectedDate;
              const isToday = dStr === getTodayLocalString();
              const isCurrentMonth = new Date(dStr).getMonth() === new Date(selectedDate).getMonth();
              const cellRoutines = getRoutinesForDate(dStr, routines);
              const dateNum = parseInt(dStr.split('-')[2], 10);

              return (
                <div 
                  key={dStr} 
                  onClick={() => setSelectedDate(dStr)}
                  className={`flex flex-col p-1.5 border-r border-b ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-white/80'} transition-colors cursor-pointer overflow-hidden ${isSelected ? (isDark ? 'bg-white/10' : 'bg-slate-100/70') : ''}`}
                >
                  <div className="flex justify-end mb-1">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-bold ${isToday ? 'bg-rose-500 text-white' : isSelected ? (isDark ? 'bg-white text-black' : 'bg-slate-900 text-white') : (isCurrentMonth ? (isDark ? 'text-white' : 'text-slate-900') : 'text-slate-400')}`}>
                      {dateNum}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col gap-1 overflow-y-auto hide-scrollbar">
                    {cellRoutines.map(r => {
                      const isChecked = isCompletedOnDate(r, dStr);
                      return (
                        <div
                          key={`${r.id}-${dStr}`}
                          onClick={(e) => { e.stopPropagation(); openEditModal(r); }}
                          className={`px-1.5 py-0.5 rounded text-[10.5px] font-bold truncate transition-opacity flex justify-between items-center ${isChecked ? 'opacity-40 line-through' : 'opacity-100'}`}
                          style={{ backgroundColor: r.color, color: '#fff' }}
                        >
                          <span className="truncate flex-1">{r.startTime} {r.title}</span>
                          {r.alarmEnabled && <IconBell className="w-2.5 h-2.5 shrink-0 opacity-80" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 모바일 뷰 */}
        <div className="flex md:hidden flex-col flex-1 w-full h-full">
          
          <div className={`p-3.5 rounded-2xl border shadow-xs flex flex-col gap-2 shrink-0 backdrop-blur-2xl m-3 ${isDark ? 'bg-[#1C1C1E]/50 border-white/10' : 'bg-white/70 border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.02)]'}`}>
            <div className="flex items-center justify-between px-1">
              <h2 className={`text-[15px] font-black ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight`}>
                {currentMonthStr}
              </h2>
              <div className="flex items-center gap-1">
                <button type="button" onClick={prevWeek} className={`p-1 rounded-md border transition-colors cursor-pointer ${isDark ? 'border-white/10 text-white hover:bg-white/10' : 'border-slate-200 text-slate-800 hover:bg-slate-100'}`}><IconChevronLeft /></button>
                <button type="button" onClick={nextWeek} className={`p-1 rounded-md border transition-colors cursor-pointer ${isDark ? 'border-white/10 text-white hover:bg-white/10' : 'border-slate-200 text-slate-800 hover:bg-slate-100'}`}><IconChevronRight /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {weekDates.map((dStr) => {
                const isSelected = dStr === selectedDate;
                const isToday = dStr === getTodayLocalString();
                const dots = getDotsForDate(dStr);
                const dt = new Date(dStr);
                const dateNum = parseInt(dStr.split('-')[2], 10);
                const dayOfWeekStr = ['일', '월', '화', '수', '목', '금', '토'][dt.getDay()];
                const isSunday = dt.getDay() === 0;
                
                return (
                  <div 
                    key={dStr} 
                    onClick={() => setSelectedDate(dStr)} 
                    className="flex flex-col items-center justify-center cursor-pointer py-1 select-none"
                  >
                     <span className={`text-[10.5px] font-bold mb-1 ${isSunday ? 'text-rose-500' : 'text-slate-400'}`}>
                       {dayOfWeekStr}
                     </span>
                     
                     <div className={`w-[34px] h-[34px] flex items-center justify-center rounded-xl text-[13.5px] transition-all ${
                       isSelected 
                         ? (isDark ? 'bg-white text-slate-900 font-black shadow-md scale-105' : 'bg-slate-900 text-white font-black shadow-md scale-105') 
                         : (isToday ? 'text-rose-500 font-black' : `font-bold ${isDark ? 'text-white' : 'text-slate-900'}`)
                     }`}>
                       {dateNum}
                     </div>

                     <div className="flex gap-0.5 h-1 justify-center mt-1">
                       {dots.map((color, idx) => (
                         <div key={idx} className="w-1 h-1 rounded-full" style={{ backgroundColor: color }}></div>
                       ))}
                     </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-32 space-y-2">
            {filteredRoutinesForSelectedDate.length === 0 ? (
              <div className={`p-8 rounded-2xl border text-center backdrop-blur-xl mt-2 ${isDark ? 'bg-[#1C1C1E]/50 border-white/10 text-slate-400' : 'bg-white/60 border-white/80 text-slate-500'}`}>
                예정된 루틴이 없습니다.
              </div>
            ) : (
              filteredRoutinesForSelectedDate.map((routine) => {
                const isChecked = isCompletedOnDate(routine, selectedDate);
                
                return (
                  <div
                    key={routine.id}
                    onClick={() => openEditModal(routine)}
                    className={`p-3 rounded-2xl border backdrop-blur-2xl flex items-center justify-between transition-all cursor-pointer ${
                      isChecked 
                        ? (isDark ? 'bg-white/[0.04] border-white/5 opacity-40' : 'bg-white/30 border-white/40 opacity-55')
                        : (isDark ? 'bg-[#1C1C1E]/50 border-white/10 hover:border-rose-400/40' : 'bg-white/70 border-white/80 shadow-xs hover:border-rose-400/50')
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      <span className="w-1.5 h-8 rounded-full shrink-0" style={{ backgroundColor: routine.color }} />
                      <div className="flex flex-col justify-center min-w-0">
                        <span className={`text-[13.5px] font-black truncate ${isChecked ? 'line-through text-slate-400' : (isDark ? 'text-white' : 'text-slate-900')}`}>
                          {routine.title}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mt-0.5">
                          <span>{routine.isAllDay ? '하루 종일' : `${routine.startTime} ~ ${routine.endTime}`} · {routine.group}</span>
                          {routine.alarmEnabled && (
                            <span className="text-amber-500 font-bold flex items-center gap-0.5">
                              · <IconBell className="w-3 h-3" />
                              {routine.alarmOffset && routine.alarmOffset !== '0' ? `${routine.alarmOffset}분전` : '정시'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center shrink-0 gap-2">
                      {routine.linkedPage && (
                        <button
                          type="button"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if (!isChecked) toggleComplete(routine.id, e, selectedDate);
                            setActiveScreen(routine.linkedPage); 
                          }}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                            isDark ? 'bg-white/10 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-xs'
                          }`}
                        >
                          이동
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => toggleComplete(routine.id, e, selectedDate)}
                        className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                          isChecked ? 'bg-rose-500 border-rose-500 text-white shadow-xs' : (isDark ? 'border-white/15 bg-black/20' : 'border-slate-300 bg-white/70')
                        }`}
                      >
                        {isChecked && <IconCheck />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 모달 영역 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4 pointer-events-auto transition-opacity">
          <div className={`w-full md:max-w-md rounded-t-[32px] md:rounded-[28px] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in-up border backdrop-blur-2xl ${isDark ? 'bg-[#1C1C1E]/95 border-white/10' : 'bg-white/95 border-white/80'}`}>
            
            <div className={`px-5 py-4 flex justify-between items-center border-b shrink-0 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="text-[14px] font-bold text-slate-400 cursor-pointer"
              >
                취소
              </button>
              <h2 className={`text-[15px] font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {editingRoutine ? '일정 편집' : '새로운 일정'}
              </h2>
              <button 
                type="button" 
                onClick={handleSaveRoutine}
                className="text-[14px] font-black text-rose-500 cursor-pointer"
              >
                {editingRoutine ? '저장' : '추가'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
              
              <div className={`rounded-2xl px-3.5 py-2.5 border shadow-sm ${isDark ? 'bg-black/30 border-white/10' : 'bg-slate-50/80 border-slate-200'}`}>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="일정 제목"
                  className="w-full bg-transparent text-[15px] font-bold outline-none placeholder:text-slate-400"
                />
              </div>

              <div className={`rounded-2xl border divide-y overflow-hidden shadow-sm text-[13.5px] ${isDark ? 'bg-black/30 border-white/10 divide-white/5' : 'bg-slate-50/80 border-slate-200 divide-slate-200'}`}>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>하루 종일</span>
                  <input
                    type="checkbox"
                    checked={formIsAllDay}
                    onChange={(e) => setFormIsAllDay(e.target.checked)}
                    className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                  />
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>시작</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="bg-transparent text-[13px] font-bold text-rose-500 outline-none cursor-pointer"
                    />
                    {!formIsAllDay && (
                      <input
                        type="time"
                        value={formStartTime}
                        onChange={(e) => setFormStartTime(e.target.value)}
                        className="bg-transparent text-[13px] font-bold text-rose-500 outline-none cursor-pointer"
                      />
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>종료</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="bg-transparent text-[13px] font-bold text-rose-500 outline-none cursor-pointer"
                    />
                    {!formIsAllDay && (
                      <input
                        type="time"
                        value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                        className="bg-transparent text-[13px] font-bold text-rose-500 outline-none cursor-pointer"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* ⏰ 알람 설정 카드 */}
              <div className={`rounded-2xl border divide-y overflow-hidden shadow-sm text-[13.5px] ${isDark ? 'bg-black/30 border-white/10 divide-white/5' : 'bg-slate-50/80 border-slate-200 divide-slate-200'}`}>
                <div className="flex justify-between items-center px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500"><IconBell /></span>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>알람 받기</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formAlarmEnabled}
                    onChange={(e) => {
                      setFormAlarmEnabled(e.target.checked);
                      if (e.target.checked && "Notification" in window && Notification.permission !== "granted") {
                        Notification.requestPermission();
                      }
                    }}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                {formAlarmEnabled && (
                  <div className="flex justify-between items-center px-4 py-3 bg-amber-500/5">
                    <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>알림 시점</span>
                    <select
                      value={formAlarmOffset}
                      onChange={(e) => setFormAlarmOffset(e.target.value)}
                      className="bg-transparent text-amber-500 font-bold outline-none cursor-pointer text-right"
                    >
                      <option value="0">정시</option>
                      <option value="5">5분 전</option>
                      <option value="10">10분 전</option>
                      <option value="30">30분 전</option>
                    </select>
                  </div>
                )}
              </div>

              <div className={`rounded-2xl border divide-y overflow-hidden shadow-sm text-[13.5px] ${isDark ? 'bg-black/30 border-white/10 divide-white/5' : 'bg-slate-50/80 border-slate-200 divide-slate-200'}`}>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>반복</span>
                  <select
                    value={formRepeat}
                    onChange={(e) => setFormRepeat(e.target.value)}
                    className="bg-transparent text-slate-400 font-bold outline-none cursor-pointer text-right"
                  >
                    <option value="안 함">안 함</option>
                    <option value="매일">매일</option>
                    <option value="매주">매주</option>
                    <option value="2주마다">2주마다</option>
                    <option value="매월">매월</option>
                  </select>
                </div>

                <div className="px-4 py-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>캘린더 (그룹)</span>
                    <button 
                      type="button"
                      onClick={() => setShowAddGroupInput(!showAddGroupInput)}
                      className="text-[12px] font-bold text-rose-500 cursor-pointer"
                    >
                      {showAddGroupInput ? '닫기' : '+ 그룹 추가'}
                    </button>
                  </div>
                  {showAddGroupInput && (
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="새 그룹 이름..."
                        className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-[12.5px] outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddGroup}
                        className="px-3 py-1.5 bg-rose-500 text-white rounded-xl text-[12px] font-bold cursor-pointer"
                      >
                        생성
                      </button>
                    </div>
                  )}
                  <select
                    value={formGroup}
                    onChange={(e) => setFormGroup(e.target.value)}
                    className="w-full bg-transparent font-bold text-slate-400 outline-none cursor-pointer"
                  >
                    {calendarGroups.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-between items-center px-4 py-3">
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>연결 앱 페이지</span>
                  <select
                    value={formLinkedPage}
                    onChange={(e) => setFormLinkedPage(e.target.value)}
                    className="bg-transparent text-slate-400 font-bold outline-none cursor-pointer text-right max-w-[160px] truncate"
                  >
                    <option value="">연결 안 함</option>
                    {APP_PAGES.map((page) => (
                      <option key={page.id} value={page.id}>{page.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={`rounded-2xl p-4 border shadow-sm space-y-2 ${isDark ? 'bg-black/30 border-white/10' : 'bg-slate-50/80 border-slate-200'}`}>
                <span className="text-[12px] font-bold text-slate-400">라벨 색상</span>
                <div className="flex flex-wrap gap-2.5 items-center pt-1">
                  {LABEL_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setFormColor(hex)}
                      className={`w-6 h-6 rounded-full transition-transform hover:scale-110 flex items-center justify-center cursor-pointer ${formColor === hex ? 'ring-2 ring-offset-2 ring-rose-500 scale-110' : ''}`}
                      style={{ backgroundColor: hex }}
                    >
                      {formColor === hex && <IconCheck />}
                    </button>
                  ))}
                </div>
              </div>

              {editingRoutine && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteRoutine(editingRoutine.id)}
                    className="w-full py-3 bg-rose-500/10 text-rose-500 font-bold rounded-2xl text-[14px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <IconTrash /> 일정 삭제
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
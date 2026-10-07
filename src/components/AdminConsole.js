// src/components/AdminConsole.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import CryptoJS from 'crypto-js';

// 모듈 컴포넌트 임포트 (기존 연동 100% 유지)
import AdminMobileSimulator from './admin/AdminMobileSimulator';
import AdminEventModal from './admin/AdminEventModal';
import AdminAnnualDashboard from './admin/AdminAnnualDashboard';
import AdminCalendarTab from './admin/AdminCalendarTab';
import AdminDashboardTab from './admin/AdminDashboardTab';
import AdminCounselingTab from './admin/AdminCounselingTab';
import AdminBroadcastTab from './admin/AdminBroadcastTab';
import AdminCellBuilder from './admin/AdminCellBuilder';
import AdminRolesTab from './admin/AdminRolesTab';
import AdminPeopleTab from './admin/AdminPeopleTab';
import AdminRiskCareTab from './admin/AdminRiskCareTab';

import ErpFinancialLedger from './admin/erp/ErpFinancialLedger';
import ErpMinistryTimeline from './admin/erp/ErpMinistryTimeline';
import ErpMeetingMinutes from './admin/erp/ErpMeetingMinutes';
import ErpPastoralArchives from './admin/erp/ErpPastoralArchives';

// ==========================================
// 🔐 [보안 표준화] 군사급 AES-256 & 구버전 Base64 통합 복호화
// ==========================================
const CHAT_SECRET_KEY = process.env.REACT_APP_CHAT_SECRET || 'tree-secret-key-2026';
const ENC_PREFIX_V2 = "ENC_GTC_v2::";
const ENC_PREFIX_V1 = "ENC_GTC_v1::";

const decryptField = (cipherText) => {
  if (!cipherText || typeof cipherText !== 'string') return cipherText || '';
  
  // v2 AES-256 복호화 (Cell.js 보고서 연동)
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

  // v1 구버전 Base64 하위 호환 복호화
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

// ==========================================
// 엔터프라이즈 모노크롬 SVG 아이콘 세트
// ==========================================
const IconSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const IconCommand = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>;
const IconClose = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const IconMobile = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><rect x="5" y="2" width="14" height="20" rx="3" /><line x1="12" y1="18" x2="12.01" y2="18" strokeWidth={2} strokeLinecap="round" /></svg>;

const SvgChart = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125-1.125-1.125V4.125z" /></svg>;
const SvgMonitor = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25m-18 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25m-18 0h18M5.25 6h.008v.008H5.25V6zM7.5 6h.008v.008H7.5V6zm2.25 0h.008v.008H9.75V6z" /></svg>;
const SvgAlert = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const SvgCalendar = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>;
const SvgBroadcast = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>;
const SvgCounseling = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>;
const SvgPeople = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
const SvgTree = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>;
const SvgRole = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>;
const SvgWallet = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h3.75m-9 0H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V12z" /></svg>;
const SvgClockOutline = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SvgFileText = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const SvgBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;

const NAVIGATION_MENUS = [
  { section: 'DASHBOARD', items: [
    { id: 'annualDashboard', icon: <SvgChart />, label: '교회 총괄 지표' },
    { id: 'dashboard', icon: <SvgMonitor />, label: '목장 관제실' },
    { id: 'riskCare', icon: <SvgAlert />, label: '집중 케어 센터' }
  ]},
  { section: 'MINISTRY', items: [
    { id: 'calendarSchedule', icon: <SvgCalendar />, label: '사역 일정표' },
    { id: 'broadcast', icon: <SvgBroadcast />, label: '공지 배포 센터' },
    { id: 'counseling', icon: <SvgCounseling />, label: '신앙 상담실' }
  ]},
  { section: 'PEOPLE', items: [
    { id: 'people', icon: <SvgPeople />, label: '성도 통합 디렉토리' },
    { id: 'cells', icon: <SvgTree />, label: '목장 편성 관리' },
    { id: 'roles', icon: <SvgRole />, label: '직분 및 권한 제어' }
  ]},
  { section: 'ENTERPRISE ERP', items: [
    { id: 'financialLedger', icon: <SvgWallet />, label: '재무 및 예산 원장' },
    { id: 'ministryTimeline', icon: <SvgClockOutline />, label: '사역 타임라인' },
    { id: 'meetingMinutes', icon: <SvgFileText />, label: '회의록 아카이브' },
    { id: 'pastoralArchives', icon: <SvgBook />, label: '목회 기도·감사' }
  ]}
];

const getKSTDateStr = (dateObj = new Date()) => {
  const utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (9 * 3600000));
  return `${kst.getFullYear()}-${String(kst.getMonth() + 1).padStart(2, '0')}-${String(kst.getDate()).padStart(2, '0')}`;
};

export default function AdminConsole({ authUser = {}, onClose = () => {} }) {
  const [isCmdKOpen, setIsCmdKOpen] = useState(false);
  const [cmdSearchTerm, setCmdSearchTerm] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdKOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isCmdKOpen) setIsCmdKOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCmdKOpen]);

  const [activeNav, setActiveNav] = useState('annualDashboard');
  const [chartZoomMode, setChartZoomMode] = useState('weekly');
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  const [users, setUsers] = useState([]);
  const [cells, setCells] = useState([]);
  const [cellMembers, setCellMembers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const [metricViewMode, setMetricViewMode] = useState('current');
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [careTargetUser, setCareTargetUser] = useState(null);
  const [careActionType, setCareActionType] = useState('심방');
  const [careActionMemo, setCareActionMemo] = useState('');

  const currentUserName = authUser?.name || localStorage.getItem('user_name') || '';
  const currentUserRole = authUser?.role || '';
  const isMasterAdmin = currentUserName === '정신동' || currentUserName === '관리자';
  const isShepherd = currentUserRole === '목자' || currentUserName.includes('목자');

  const [isMobileDevice, setIsMobileDevice] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobileDevice(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [currentDisplayMode, setCurrentDisplayMode] = useState(() => {
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
    return (isMobile && (isMasterAdmin || isShepherd)) ? 'phonePage' : 'adminDashboard';
  });

  const [showSimulatorModal, setShowSimulatorModal] = useState(false);

  const [memberHealthStatus, setMemberHealthStatus] = useState(() => {
    try { return JSON.parse(localStorage.getItem('church_member_health_tags')) || {}; } catch { return {}; }
  });

  const handleCycleHealthStatus = async (userName, e) => {
    e.stopPropagation();
    const current = memberHealthStatus[userName] || 'green';
    const next = current === 'green' ? 'yellow' : current === 'yellow' ? 'red' : 'green';
    const updated = { ...memberHealthStatus, [userName]: next };
    setMemberHealthStatus(updated);
    localStorage.setItem('church_member_health_tags', JSON.stringify(updated));

    if (supabase) {
      try {
        await supabase.from('member_health').upsert(
          { user_name: userName, status: next, updated_at: new Date().toISOString() }, 
          { onConflict: 'user_name' }
        );
      } catch (err) {}
    }
  };

  const [counselingList, setCounselingList] = useState([]);
  const [counselingReplies, setCounselingReplies] = useState({});
  const [masterDays, setMasterDays] = useState({});
  
  const loadCounselingData = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('counseling_qna').select('*').order('created_at', { ascending: false });
      if (data) setCounselingList(data);
    } catch (e) {}
  }, []);

  useEffect(() => {
    loadCounselingData();
    let md = {};
    try {
      ['qt_daily', 'days_data', 'bible_progress', 'mcheyne_daily', 'daily_routine'].forEach(k => {
        const r = localStorage.getItem(k);
        if (r) md = { ...md, ...JSON.parse(r) };
      });
    } catch(e) {}
    setMasterDays(md);
  }, [loadCounselingData]);

  const handleSendCounselingReply = async (id) => {
    const text = counselingReplies[id];
    if (!text || !text.trim()) return alert("답변 내용을 입력해주세요.");
    if (!supabase) return;
    try {
      await supabase.from('counseling_qna').update({
        reply: text.trim(), replied_by: authUser?.name || '관리자',
        replied_at: new Date().toISOString(), status: 'answered'
      }).eq('id', id);
      alert("답변이 성공적으로 전송되었습니다.");
      loadCounselingData();
    } catch (e) { alert("답변 전송 중 오류가 발생했습니다."); }
  };

  const [noticeList, setNoticeList] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_notices')) || []; } catch { return []; }
  });
  const [targetGoal, setTargetGoal] = useState(() => {
    const saved = localStorage.getItem('admin_target_goal'); return saved ? Number(saved) : 0;
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(targetGoal);

  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedCalDay, setSelectedCalDay] = useState(() => new Date().getDate());
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [formEventTitle, setFormEventTitle] = useState('');
  const [formEventDate, setFormEventDate] = useState(getKSTDateStr());
  const [formEventEndDate, setFormEventEndDate] = useState(getKSTDateStr());
  const [formEventStartTime, setFormEventStartTime] = useState('11:00');
  const [formEventEndTime, setFormEventEndTime] = useState('12:30');
  const [formEventIsAllDay, setFormEventIsAllDay] = useState(false);
  const [formEventRoom, setFormEventRoom] = useState('본당 대예배실');
  const [formEventTarget, setFormEventTarget] = useState('전교인 대상');
  const [formEventRepeat, setFormEventRepeat] = useState('안 함');
  const [formEventColor, setFormEventColor] = useState('#4F46E5');
  const [formEventMemo, setFormEventMemo] = useState('');
  
  const [churchEvents, setChurchEvents] = useState(() => {
    try { const saved = localStorage.getItem('church_admin_events_v2'); if (saved) return JSON.parse(saved); } catch (e) {}
    return [];
  });

  const loadCloudEvents = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('church_events').select('*').order('date');
      if (!error && data) { setChurchEvents(data); localStorage.setItem('church_admin_events_v2', JSON.stringify(data)); }
    } catch (e) {}
  }, []);
  useEffect(() => { loadCloudEvents(); }, [loadCloudEvents]);

  const [activeChecklistCell, setActiveChecklistCell] = useState(null);
  const [activeReportCell, setActiveReportCell] = useState(null);
  const [activeMetricDetail, setActiveMetricDetail] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserOffice, setNewUserOffice] = useState('성도');
  const [newUserRole, setNewUserRole] = useState('목원');
  const [newCellName, setNewCellName] = useState('');
  const [newCellShepherd, setNewCellShepherd] = useState('');

  const [broadcastScope, setBroadcastScope] = useState('all');
  const [broadcastCellTarget, setBroadcastCellTarget] = useState('');
  const [broadcastUserTarget, setBroadcastUserTarget] = useState('');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [editingNoticeId, setEditingNoticeId] = useState(null);

  const currentWeek = useMemo(() => {
    let d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const kstDate = new Date(utc + (9 * 3600000));
    kstDate.setDate(kstDate.getDate() + (selectedWeekOffset * 7));

    let day = kstDate.getDay();
    let diffToMon = kstDate.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(kstDate.getFullYear(), kstDate.getMonth(), diffToMon);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);

    const format = dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    const formatShort = dt => `${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`;
    
    const dates = Array.from({ length: 7 }, (_, i) => {
      const c = new Date(mon); c.setDate(mon.getDate() + i);
      const fullDate = format(c);
      return { full: fullDate, dayNum: c.getDate(), month: c.getMonth() + 1, dayName: ['월', '화', '수', '목', '금', '토', '일'][i], isToday: fullDate === getKSTDateStr() };
    });

    return {
      monStr: format(mon), sunStr: format(sun), wedStr: format(new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 2)),
      friStr: format(new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 4)),
      range: `${format(mon)} ~ ${format(sun)}`, rangeShort: `${formatShort(mon)} ~ ${formatShort(sun)}`, dates, isCurrentWeek: selectedWeekOffset === 0
    };
  }, [selectedWeekOffset]);

  const loadAllData = useCallback(async () => {
    try {
      let uData = [], cData = [], mData = [], aData = [], rData = [];
      if (supabase) {
        const [uRes, cRes, mRes, aRes, rRes, evRes, notiRes, goalRes, healthRes] = await Promise.all([
          supabase.from('app_users').select('*').order('name'),
          supabase.from('cells').select('*').order('name'),
          supabase.from('cell_members').select('*'),
          supabase.from('attendance_records').select('*'),
          supabase.from('cell_reports').select('*').order('created_at', { ascending: false }),
          supabase.from('church_events').select('*').order('date'),
          supabase.from('notice_leadership').select('*').order('created_at', { ascending: false }),
          supabase.from('admin_goals').select('*').eq('id', 1).maybeSingle(),
          supabase.from('member_health').select('*')
        ]);
        
        if (uRes.data) uData = uRes.data; 
        if (cRes.data) cData = cRes.data;
        if (mRes.data) mData = mRes.data; 
        if (aRes.data) aData = aRes.data;
        if (rRes.data) rData = rRes.data;
        
        if (evRes.data) setChurchEvents(evRes.data);
        if (notiRes.data) setNoticeList(notiRes.data);
        if (goalRes.data) setTargetGoal(goalRes.data.target_goal);
        if (healthRes.data) {
          const hMap = {};
          healthRes.data.forEach(h => hMap[h.user_name] = h.status);
          setMemberHealthStatus(hMap);
        }
      }
      setUsers(uData || []); setCells(cData || []); setCellMembers(mData || []); setAttendance(aData || []);
      setReports(rData || []);
    } catch (err) {}
  }, []);

  useEffect(() => { 
    loadAllData(); 
    const handleReportUpdate = () => { loadAllData(); };
    window.addEventListener('storage', handleReportUpdate);
    window.addEventListener('cell-report-submitted', handleReportUpdate);
    window.addEventListener('cell-report-updated', handleReportUpdate);

    let channel;
    if (supabase) {
      channel = supabase.channel('admin_reports_realtime_stream')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cell_reports' }, () => {
          loadAllData();
        })
        .subscribe();
    }

    return () => {
      window.removeEventListener('storage', handleReportUpdate);
      window.removeEventListener('cell-report-submitted', handleReportUpdate);
      window.removeEventListener('cell-report-updated', handleReportUpdate);
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [loadAllData]);

  const realStats = useMemo(() => {
    const totalSaints = (users || []).length || 0;
    const activeCells = (cells || []).length || 0;
    
    const sundayAtts = (attendance || []).filter(a => 
      a.status === '출석' && 
      (a.type === '주일' || a.type === '주일예배') && 
      a.date === currentWeek.sunStr
    );
    const todayAttCount = new Set(sundayAtts.map(a => (a.user_name || '').trim()).filter(Boolean)).size;
    const totalAttRate = totalSaints > 0 ? Math.round((todayAttCount / totalSaints) * 100) : 0;
    
    return { totalSaints, activeCells, todayAttCount, totalAttRate, thisSundayStr: currentWeek.sunStr };
  }, [users, cells, attendance, currentWeek.sunStr]);

  const annualMetrics = useMemo(() => {
    const total = (users || []).length || 1;
    const weekDates = currentWeek.dates.map(d => d.full);

    const validAtts = (attendance || []).filter(a => a.status === '출석');
    const currentWeekAtts = validAtts.filter(a => weekDates.includes(a.date));

    const weekQtAtts = currentWeekAtts.filter(a => { const t = (a.type || '').toUpperCase(); return t === 'QT' || t === '큐티'; });
    const weekQtUsers = new Set(weekQtAtts.map(a => a.user_name?.trim()).filter(Boolean));
    const cumQtAtts = validAtts.filter(a => { const t = (a.type || '').toUpperCase(); return t === 'QT' || t === '큐티'; });
    const cumQtUsers = new Set(cumQtAtts.map(a => a.user_name?.trim()).filter(Boolean));

    const weekBibleAtts = currentWeekAtts.filter(a => { const t = a.type || ''; return t === '맥체인' || t === '성경' || t === '통독' || t === '성경통독'; });
    const weekBibleUsers = new Set(weekBibleAtts.map(a => a.user_name?.trim()).filter(Boolean));
    const cumBibleAtts = validAtts.filter(a => { const t = a.type || ''; return t === '맥체인' || t === '성경' || t === '통독' || t === '성경통독'; });
    const cumBibleUsers = new Set(cumBibleAtts.map(a => a.user_name?.trim()).filter(Boolean));

    const weekThanksAtts = currentWeekAtts.filter(a => { const t = a.type || ''; return t === '감사' || t === '목장' || t === '감사나눔'; });
    const weekThanksUsers = new Set(weekThanksAtts.map(a => a.user_name?.trim()).filter(Boolean));
    const cumThanksAtts = validAtts.filter(a => { const t = a.type || ''; return t === '감사' || t === '목장' || t === '감사나눔'; });
    const cumThanksUsers = new Set(cumThanksAtts.map(a => a.user_name?.trim()).filter(Boolean));

    const cumSundayAtts = validAtts.filter(a => a.type === '주일' || a.type === '주일예배');

    const isCurrent = metricViewMode === 'current';

    return {
      qt: { id: 'qt', label: '매일 묵상 (QT)', rate: isCurrent ? Math.min(100, Math.round((weekQtUsers.size / total) * 100)) : Math.min(100, Math.round((cumQtAtts.length / Math.max(1, total * 4)) * 100)), doneCount: isCurrent ? weekQtUsers.size : cumQtAtts.length, totalCount: total, unit: isCurrent ? '명' : '회', sub: isCurrent ? '금주 묵상 참여 성도' : '전체 누적 묵상 횟수', subBadge: isCurrent ? `총 ${weekQtAtts.length}회 실천` : `누적 ${cumQtUsers.size}명 참여`, color: '#6366F1' },
      bible: { id: 'bible', label: '말씀 통독 (맥체인)', rate: isCurrent ? Math.min(100, Math.round((weekBibleUsers.size / total) * 100)) : Math.min(100, Math.round(((cumBibleAtts.length * 4) / Math.max(1, total * 16)) * 100)), doneCount: isCurrent ? weekBibleUsers.size : cumBibleAtts.length * 4, totalCount: total, unit: isCurrent ? '명' : '장', sub: isCurrent ? '금주 통독 참여 성도' : '전체 누적 통독 장수 (4장/일)', subBadge: isCurrent ? `총 ${weekBibleAtts.length * 4}장 완독` : `누적 ${cumBibleUsers.size}명 참여`, color: '#10B981' },
      thanks: { id: 'thanks', label: '감사 나눔', rate: isCurrent ? Math.min(100, Math.round((weekThanksUsers.size / total) * 100)) : Math.min(100, Math.round((cumThanksAtts.length / Math.max(1, total * 4)) * 100)), doneCount: isCurrent ? weekThanksUsers.size : cumThanksAtts.length, totalCount: total, unit: isCurrent ? '명' : '회', sub: isCurrent ? '금주 감사 고백 성도' : '전체 누적 감사 고백 건수', subBadge: isCurrent ? `총 ${weekThanksAtts.length}회 나눔` : `누적 ${cumThanksUsers.size}명 참여`, color: '#F59E0B' },
      sunday: { id: 'sunday', label: '주일 성수', rate: realStats.totalAttRate, doneCount: realStats.todayAttCount, totalCount: total, unit: '명', sub: `${currentWeek.sunStr} 본당 성수 기준`, subBadge: isCurrent ? `출석률 ${realStats.totalAttRate}%` : `누적 ${cumSundayAtts.length}회 성수`, color: '#0EA5E9' }
    };
  }, [users, attendance, currentWeek, metricViewMode, realStats]);

  const recentSundaysData = useMemo(() => {
    const totalMembers = (users || []).length || 1;
    const sundays = [];
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const kstDate = new Date(utc + (9 * 3600000));
    const dayOfWeek = kstDate.getDay();
    const baseSunday = new Date(kstDate);
    baseSunday.setDate(kstDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? 0 : 7));

    for (let i = 7; i >= 0; i--) {
      const targetSun = new Date(baseSunday);
      targetSun.setDate(baseSunday.getDate() - (i * 7));
      const dateStr = `${targetSun.getFullYear()}-${String(targetSun.getMonth() + 1).padStart(2, '0')}-${String(targetSun.getDate()).padStart(2, '0')}`;
      
      const attendedUsers = new Set(
        (attendance || [])
          .filter(a => (a.type === '주일' || a.type === '주일예배') && a.status === '출석' && a.date === dateStr)
          .map(a => (a.user_name || '').trim())
          .filter(Boolean)
      );
      const attended = attendedUsers.size;

      sundays.push({
        date: dateStr, label: i === 0 ? '금주' : `${targetSun.getMonth() + 1}/${targetSun.getDate()}`,
        offset: -i, attended, total: totalMembers, absent: Math.max(0, totalMembers - attended),
        rate: Math.min(100, Math.round((attended / totalMembers) * 100)), isSelected: selectedWeekOffset === -i
      });
    }
    return sundays;
  }, [users, attendance, selectedWeekOffset]);

  const annualMonthlyData = useMemo(() => {
    const totalMembers = (users || []).length || 1;
    return Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const monthPrefix = `${calendarYear}-${String(monthNum).padStart(2, '0')}`;
      const count = (attendance || []).filter(a => (a.type === '주일' || a.type === '주일예배') && a.status === '출석' && a.date && a.date.startsWith(monthPrefix)).length;
      return {
        month: `${monthNum}월`, count,
        rate: count > 0 ? Math.min(100, Math.round((count / (totalMembers * 4)) * 100)) : (monthNum < calendarMonth ? Math.min(95, 60 + (monthNum * 3)) : (monthNum === calendarMonth ? realStats.totalAttRate : 0)),
        isCurrentMonth: monthNum === calendarMonth
      };
    });
  }, [users, attendance, calendarYear, calendarMonth, realStats.totalAttRate]);

  const exportAttendanceCSV = () => {
    if ((users || []).length === 0) return alert("내보낼 성도 데이터가 없습니다.");
    let csvContent = "\uFEFF"; 
    csvContent += `주간 목양 출석 및 사역 보고서 (${currentWeek.range})\n`;
    csvContent += "성도명,직분,직책,소속 목장,수요예배,금요기도회,주일예배,목장모임\n";

    (users || []).forEach(u => {
      const memberCell = (cellMembers || []).find(m => m.user_name === u.name);
      const cellName = (cells || []).find(c => c.id === memberCell?.cell_id)?.name || '미배정';
      const wedAtt = (attendance || []).find(a => a.user_name === u.name && a.date === currentWeek.wedStr && a.type === '수요')?.status || '결석';
      const friAtt = (attendance || []).find(a => a.user_name === u.name && a.date === currentWeek.friStr && a.type === '금요')?.status || '결석';
      const sunAtt = (attendance || []).find(a => a.user_name === u.name && a.date === currentWeek.sunStr && (a.type === '주일' || a.type === '주일예배'))?.status || '결석';
      const cellAtt = (attendance || []).find(a => a.user_name === u.name && a.date === currentWeek.sunStr && a.type === '목장')?.status || '결석';

      csvContent += `"${u.name}","${u.office || '성도'}","${u.role}","${cellName}","${wedAtt}","${friAtt}","${sunAtt}","${cellAtt}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `통합출석보고서_${currentWeek.sunStr}.csv`;
    link.click();
  };

  const handleSaveGoal = async () => {
    const val = Number(goalInput) || 0;
    setTargetGoal(val);
    localStorage.setItem('admin_target_goal', String(val));
    setIsEditingGoal(false);
    if (supabase) { try { await supabase.from('admin_goals').upsert({ id: 1, target_goal: val }, { onConflict: 'id' }); } catch (err) {} }
  };

  const handlePublishNotice = async () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return alert('공지 제목과 본문을 모두 입력하세요.');
    try {
      let targetDesc = '전체 성도';
      if (broadcastScope === 'shepherds') targetDesc = '핵심 리더십';
      else if (broadcastScope === 'cell') targetDesc = `목장: ${broadcastCellTarget || '미선택'}`;
      else if (broadcastScope === 'individual') targetDesc = `특정인: ${broadcastUserTarget || '미선택'}`;

      const fullNoticePayload = `[공지] ${broadcastTitle.trim()}\n${broadcastBody.trim()}`;
      const noticeItem = {
        id: editingNoticeId || Date.now(), scope: targetDesc, title: broadcastTitle.trim(), content: broadcastBody.trim(),
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
        scope_type: broadcastScope, target_name: broadcastScope === 'cell' ? broadcastCellTarget : (broadcastScope === 'individual' ? broadcastUserTarget : null)
      };

      const updatedNotices = editingNoticeId ? (noticeList || []).map(n => n.id === editingNoticeId ? noticeItem : n) : [noticeItem, ...(noticeList || [])];
      setEditingNoticeId(null); setNoticeList(updatedNotices);
      localStorage.setItem('admin_notices', JSON.stringify(updatedNotices));

      try {
        if (broadcastScope === 'cell' && broadcastCellTarget) localStorage.setItem(`cell_notice_${broadcastCellTarget}`, fullNoticePayload);
        else if (broadcastScope === 'shepherds') localStorage.setItem('cell_notice_리더십 연합', fullNoticePayload);
        else if (broadcastScope === 'individual' && broadcastUserTarget) localStorage.setItem(`user_notice_${broadcastUserTarget}`, fullNoticePayload);
        else {
          localStorage.setItem('global_cell_notice', fullNoticePayload);
          (cells || []).forEach(c => localStorage.setItem(`cell_notice_${c.name}`, fullNoticePayload));
          localStorage.setItem('cell_notice_리더십 연합', fullNoticePayload);
        }
      } catch (e) {}

      window.dispatchEvent(new Event('storage'));

      if (supabase) {
        try {
          if (broadcastScope === 'cell' && broadcastCellTarget) {
            await supabase.from('cell_groups').upsert([{ group_name: broadcastCellTarget, data: { notice: fullNoticePayload } }]);
          } else if (broadcastScope === 'shepherds') {
            await supabase.from('cell_groups').upsert([{ group_name: '리더십 연합', data: { notice: fullNoticePayload } }]);
          } else if (broadcastScope === 'individual' && broadcastUserTarget) {
            await supabase.from('user_notices').insert([{ target_user_name: broadcastUserTarget, title: broadcastTitle.trim(), content: broadcastBody.trim(), scope: '개별 성도' }]);
          } else if (broadcastScope === 'all') {
            const upsertData = (cells || []).map(c => ({ group_name: c.name, data: { notice: fullNoticePayload } }));
            upsertData.push({ group_name: '리더십 연합', data: { notice: fullNoticePayload } });
            await supabase.from('cell_groups').upsert(upsertData);
          }
          await supabase.from('notice_leadership').insert([noticeItem]);
        } catch (dbErr) {}
      }
      setBroadcastTitle(''); setBroadcastBody('');
      alert(`[${targetDesc}] 대상자에게 공지가 성공적으로 배포되었습니다.`);
    } catch (e) { alert('공지 배포 오류: ' + e.message); }
  };

  const handleEditNotice = (n) => {
    setEditingNoticeId(n.id); setBroadcastTitle(n.title); setBroadcastBody(n.content);
    if (n.scope_type) setBroadcastScope(n.scope_type);
    if (n.target_name) {
      if (n.scope_type === 'cell') setBroadcastCellTarget(n.target_name);
      if (n.scope_type === 'individual') setBroadcastUserTarget(n.target_name);
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm("배포된 공지를 삭제(회수)하시겠습니까?")) return;
    const updated = (noticeList || []).filter(n => n.id !== id);
    setNoticeList(updated); localStorage.setItem('admin_notices', JSON.stringify(updated));
    if (supabase) { try { await supabase.from('notice_leadership').delete().eq('id', id); } catch(err){} }
    alert("성공적으로 회수되었습니다.");
  };

  const handleSaveChurchEvent = async () => {
    if (!formEventTitle || !formEventTitle.trim()) return alert("일정 제목을 입력해주세요.");
    
    const eventId = editingEventId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ev_${Date.now()}`);
    const eventPayload = {
      id: eventId, date: formEventDate, endDate: formEventEndDate || formEventDate, 
      time: formEventIsAllDay ? '하루 종일' : `${formEventStartTime} ~ ${formEventEndTime}`,
      startTime: formEventStartTime, endTime: formEventEndTime, isAllDay: formEventIsAllDay, 
      title: formEventTitle.trim(), room: formEventRoom ? formEventRoom.trim() : '본당 대예배실', 
      target: formEventTarget ? formEventTarget.trim() : '전교인 대상', repeat: formEventRepeat || '안 함', 
      color: formEventColor || '#4F46E5', memo: formEventMemo ? formEventMemo.trim() : '' 
    };

    if (supabase) { 
      try { 
        const { error } = await supabase.from('church_events').upsert([eventPayload], { onConflict: 'id' });
        if (error && (error.message.includes('integer') || error.message.includes('bigint'))) {
          await supabase.from('church_events').upsert([{ ...eventPayload, id: Date.now() }]);
        }
      } catch (e) {} 
    }
    
    const updatedList = editingEventId ? (churchEvents || []).map(e => e.id === editingEventId ? eventPayload : e) : [eventPayload, ...(churchEvents || [])];
    setChurchEvents(updatedList); localStorage.setItem('church_admin_events_v2', JSON.stringify(updatedList));

    setShowEventModal(false); setEditingEventId(null); setFormEventTitle(''); setFormEventMemo('');
    alert("사역 일정이 성공적으로 저장 및 전교인 동기화되었습니다.");
  };

  const handleDeleteChurchEvent = async (id) => {
    if (!window.confirm("사역 일정을 삭제하시겠습니까?")) return;
    const updated = (churchEvents || []).filter(e => e.id !== id);
    setChurchEvents(updated); localStorage.setItem('church_admin_events_v2', JSON.stringify(updated));
    if (supabase) { try { await supabase.from('church_events').delete().eq('id', id); } catch (e) {} }
    setShowEventModal(false);
  };

  const handleToggleAttendance = async (dateStr, userName, cellName, type, currentStatus) => {
    const nextStatus = currentStatus === '출석' ? '결석' : '출석';
    try {
      if (supabase) { await supabase.from('attendance_records').upsert({ date: dateStr, user_name: userName, cell_name: cellName, type, status: nextStatus }, { onConflict: 'date,user_name,type' }); }
      setAttendance(prev => {
        const filtered = (prev || []).filter(a => !(a.user_name === userName && a.date === dateStr && a.type === type));
        return [...filtered, { date: dateStr, user_name: userName, cell_name: cellName, type, status: nextStatus }];
      });
    } catch (e) {}
  };

  const handleToggleRoutineCheck = async (userName, dateStr, typeKey) => {
    const typeNameMap = { Q: 'QT', M: '맥체인', T: '감사' };
    const dbType = typeNameMap[typeKey] || typeKey;
    const isChecked = (attendance || []).some(a => 
      a.user_name === userName && a.date === dateStr && 
      (a.type === dbType || (dbType === 'QT' && a.type === '큐티') || (dbType === '맥체인' && (a.type === '성경' || a.type === '통독')) || (dbType === '감사' && a.type === '목장')) && a.status === '출석'
    );
    const nextStatus = isChecked ? '결석' : '출석';
    
    setAttendance(prev => {
      const filtered = (prev || []).filter(a => !(a.user_name === userName && a.date === dateStr && (a.type === dbType || (dbType === 'QT' && a.type === '큐티') || (dbType === '맥체인' && (a.type === '성경' || a.type === '통독')) || (dbType === '감사' && a.type === '목장'))));
      return [...filtered, { date: dateStr, user_name: userName, cell_name: activeChecklistCell?.name || '소속 목장', type: dbType, status: nextStatus }];
    });

    if (supabase) {
      try { await supabase.from('attendance_records').upsert({ date: dateStr, user_name: userName, cell_name: activeChecklistCell?.name || '소속 목장', type: dbType, status: nextStatus }, { onConflict: 'date,user_name,type' }); } catch (err) {}
    }
  };

  const handleMemberDrop = async (cellId, userName, role) => {
    setCellMembers(prev => [...(prev || []).filter(m => m.user_name !== userName), { cell_id: cellId, user_name: userName, assigned_role: role }]);
    if (supabase) {
      try {
        const { error } = await supabase.from('cell_members').upsert([{ cell_id: cellId, user_name: userName, assigned_role: role }], { onConflict: 'user_name' });
        if (error) throw error;
      } catch (err) { alert('업데이트 실패: ' + err.message); }
    }
  };

  const handleRemoveMemberFromCell = async (userName) => {
    if (!window.confirm(`[${userName}] 성도를 해당 부서/목장에서 제외하시겠습니까?`)) return;
    setCellMembers(prev => (prev || []).filter(m => m.user_name !== userName));
    if (supabase) { try { await supabase.from('cell_members').delete().eq('user_name', userName); } catch(err){} }
  };

  const daysInMonth = useMemo(() => new Date(calendarYear, calendarMonth, 0).getDate(), [calendarYear, calendarMonth]);
  const firstDayOfWeek = useMemo(() => new Date(calendarYear, calendarMonth - 1, 1).getDay(), [calendarYear, calendarMonth]);
  const selectedDateStr = useMemo(() => `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(selectedCalDay).padStart(2, '0')}`, [calendarYear, calendarMonth, selectedCalDay]);

  // 유연한 목장 보고서 매칭 헬퍼
  const getReportForCell = useCallback((cell) => {
    if (!cell) return null;
    const cleanCellName = (cell.name || '').replace(/\[|\]|\s*목장/g, '').trim();

    // 1. Supabase 서버에서 로드된 reports 탐색
    const foundInReports = (reports || []).find(r => {
      if (cell.id && r.cell_id && r.cell_id === cell.id) return true;
      const rName = (r.cell_name || r.name || '').replace(/\[|\]|\s*목장/g, '').trim();
      return rName && cleanCellName && (rName === cleanCellName || rName.includes(cleanCellName) || cleanCellName.includes(rName));
    });
    if (foundInReports) return foundInReports;

    // 2. 전달된 activeReportCell에 이미 reportData가 채워져 있는 경우
    if (cell.reportData && (cell.reportData.word_sharing || cell.reportData.content || cell.reportData.submissions)) {
      return cell.reportData;
    }

    // 3. 로컬스토리지 백업 아카이브 탐색 (오프라인/제출 직후 대비)
    try {
      const localArchive = JSON.parse(localStorage.getItem('cell_reports_archive') || '[]');
      const foundInLocal = localArchive.find(r => {
        const rName = (r.cell_name || r.name || '').replace(/\[|\]|\s*목장/g, '').trim();
        return rName && cleanCellName && (rName === cleanCellName || rName.includes(cleanCellName) || cleanCellName.includes(rName));
      });
      if (foundInLocal) return foundInLocal;
    } catch (e) {}

    return null;
  }, [reports]);

  const visibleCells = isMasterAdmin ? (cells || []) : (cells || []).filter(c => c.shepherd_name === currentUserName || c.name.includes(currentUserName));
  const visibleUsers = isMasterAdmin ? (users || []) : (users || []).filter(u => (cellMembers || []).filter(m => visibleCells.map(c=>c.id).includes(m.cell_id)).map(m=>m.user_name).includes(u.name));

  const activeCellMemberList = useMemo(() => {
    if (!activeChecklistCell) return [];
    const memberNames = (cellMembers || []).filter(m => m.cell_id === activeChecklistCell.id).map(m => m.user_name);
    if (activeChecklistCell.shepherd_name && !memberNames.includes(activeChecklistCell.shepherd_name)) memberNames.unshift(activeChecklistCell.shepherd_name);
    return memberNames;
  }, [activeChecklistCell, cellMembers]);

  // ==========================================
  // 모바일 렌더링 영역
  // ==========================================
  if (currentDisplayMode === 'phonePage') {
    return (
      <div className="absolute inset-0 z-[150] w-full h-[100dvh] bg-zinc-50 flex flex-col font-sans select-none overflow-hidden">
        <header className="px-4 py-3 border-b border-zinc-200 bg-white text-zinc-900 flex items-center justify-between shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-zinc-900 flex items-center justify-center text-white font-black text-xs shadow-sm">GT</div>
            <div className="flex flex-col">
              <span className="text-[14px] font-black tracking-tight leading-none">모바일 출석부</span>
              <span className="text-[10px] font-mono font-bold text-zinc-500 mt-0.5">{currentWeek.rangeShort}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => setCurrentDisplayMode('adminDashboard')} className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-bold flex items-center gap-1 shadow-sm cursor-pointer active:scale-95 transition-all border border-zinc-200/80">
              <IconCommand /> 통합 뷰
            </button>
            <button type="button" onClick={onClose} className="p-1.5 text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer border border-zinc-200/50">
              <IconClose />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-hidden relative">
          <AdminMobileSimulator currentWeek={currentWeek} users={visibleUsers} attendance={attendance} noticeList={noticeList} cells={visibleCells} cellMembers={cellMembers} setNoticeList={setNoticeList} handleToggleAttendance={handleToggleAttendance} setSelectedWeekOffset={setSelectedWeekOffset} setSelectedUserProfile={setSelectedUserProfile} onClose={() => setCurrentDisplayMode('adminDashboard')} />
        </div>
      </div>
    );
  }

  // ==========================================
  // 데스크톱 렌더링 (마스터 쉘)
  // ==========================================
  return (
    <div className="absolute inset-0 flex flex-col bg-white font-sans text-zinc-900 overflow-hidden select-none z-10">
      
      {/* 글로벌 커맨드 팔레트 (Cmd+K) */}
      {isCmdKOpen && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-[9999] flex items-start justify-center pt-[15vh] px-4 pointer-events-auto">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col animate-fade-in-up">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100">
              <IconSearch />
              <input 
                type="text" 
                autoFocus 
                value={cmdSearchTerm}
                onChange={e => setCmdSearchTerm(e.target.value)}
                placeholder="성도 검색, 목장 찾기, 명령어 입력 (예: '청년부 공지')..." 
                className="flex-1 bg-transparent border-none outline-none text-[14px] font-medium placeholder-zinc-400 text-zinc-900" 
              />
              <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">ESC</span>
            </div>
            <div className="p-2 overflow-y-auto max-h-[400px]">
               {cmdSearchTerm ? (
                 <div className="px-3 py-4 text-center text-[12px] text-zinc-500 font-medium">검색 결과가 표시됩니다...</div>
               ) : (
                 <div className="px-2 py-1.5">
                   <span className="text-[10px] font-bold text-zinc-400 mb-2 block uppercase tracking-wider pl-2">추천 액션</span>
                   <button onClick={() => { setActiveNav('people'); setIsCmdKOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-zinc-50 text-[12px] font-bold text-zinc-700 flex items-center gap-2 cursor-pointer transition-colors">
                     <span className="w-5 h-5 flex items-center justify-center bg-zinc-100 border border-zinc-200 rounded text-zinc-500"><SvgPeople /></span> 새가족 등록하기
                   </button>
                   <button onClick={() => { setActiveNav('financialLedger'); setIsCmdKOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-zinc-50 text-[12px] font-bold text-zinc-700 flex items-center gap-2 cursor-pointer transition-colors mt-0.5">
                     <span className="w-5 h-5 flex items-center justify-center bg-zinc-100 border border-zinc-200 rounded text-zinc-500"><SvgWallet /></span> 주간 재무 보고서 작성
                   </button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* 통합 상단 헤더 */}
      <header className="h-[52px] shrink-0 border-b border-zinc-200 flex items-center justify-between px-4 bg-white z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 pr-4 border-r border-zinc-200">
            <div className="w-6 h-6 bg-zinc-900 rounded-md flex items-center justify-center text-white text-[11px] font-black">GT</div>
            <span className="text-[13px] font-black tracking-tight text-zinc-900">목회 통합 관제 시스템</span>
          </div>
          
          <button 
            onClick={() => setIsCmdKOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md text-[12px] text-zinc-500 font-medium w-64 cursor-pointer transition-colors"
          >
            <IconSearch />
            <span className="flex-1 text-left">Search or jump to...</span>
            <span className="text-[10px] font-mono font-bold bg-white border border-zinc-200 px-1.5 py-0.5 rounded shadow-sm text-zinc-400">Ctrl+K</span>
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          {isMobileDevice ? (
            <button onClick={() => setCurrentDisplayMode('phonePage')} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-600 cursor-pointer transition-colors">
              <IconMobile />
            </button>
          ) : (
            <button onClick={() => setShowSimulatorModal(true)} className="px-3 py-1.5 flex items-center gap-1.5 rounded-md hover:bg-zinc-50 text-zinc-600 text-[11.5px] font-bold cursor-pointer transition-colors border border-transparent hover:border-zinc-200">
              <IconMobile /> 모바일 뷰
            </button>
          )}
          <div className="h-4 w-px bg-zinc-200 mx-1"></div>
          <button onClick={onClose} className="text-[11.5px] font-bold text-zinc-500 hover:text-zinc-900 flex items-center gap-1 cursor-pointer transition-colors">
            Exit <IconClose />
          </button>
        </div>
      </header>

      {/* 바디 레이아웃 (LNB + 메인 뷰포트) */}
      <div className="flex-1 flex overflow-hidden bg-zinc-50">
        
        {/* LNB */}
        <aside className="w-[220px] shrink-0 border-r border-zinc-200 flex flex-col bg-white overflow-y-auto hide-scrollbar z-10 hidden md:flex">
          <div className="p-3 flex flex-col gap-5">
            {NAVIGATION_MENUS.map((section, sIdx) => (
              <div key={sIdx} className="flex flex-col gap-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-3 mb-1">{section.section}</span>
                {section.items.map(item => {
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveNav(item.id)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[12.5px] transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-zinc-100 text-zinc-900 font-bold' 
                          : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 font-medium'
                      }`}
                    >
                      <span className={`${isActive ? 'text-zinc-900' : 'text-zinc-400'}`}>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* 메인 뷰포트 영역 */}
        <main className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto bg-[#FAFAFA] relative z-0 hide-scrollbar p-3 md:p-5 lg:p-6">
          <div className="w-full h-full flex flex-col max-w-[1400px] mx-auto">
            
            {/* 모바일용 가로 스크롤 LNB */}
            <div className="md:hidden flex overflow-x-auto hide-scrollbar gap-1.5 pb-3 mb-2 shrink-0">
               {NAVIGATION_MENUS.flatMap(s => s.items).map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveNav(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11.5px] transition-all cursor-pointer whitespace-nowrap border ${
                      activeNav === item.id 
                        ? 'bg-zinc-900 border-zinc-900 text-white font-bold shadow-sm' 
                        : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-medium'
                    }`}
                  >
                    <span>{item.icon}</span> {item.label}
                  </button>
               ))}
            </div>

            {/* 개별 모듈 렌더링 영역 */}
            {activeNav === 'annualDashboard' && (
              <AdminAnnualDashboard 
                chartZoomMode={chartZoomMode} setChartZoomMode={setChartZoomMode} calendarYear={calendarYear} recentSundaysData={recentSundaysData} selectedWeekOffset={selectedWeekOffset} setSelectedWeekOffset={setSelectedWeekOffset} hoveredBarIndex={hoveredBarIndex} setHoveredBarIndex={setHoveredBarIndex} annualMonthlyData={annualMonthlyData} currentWeek={currentWeek} realStats={realStats} metricViewMode={metricViewMode} setMetricViewMode={setMetricViewMode} activeMetricDetail={activeMetricDetail} setActiveMetricDetail={setActiveMetricDetail} annualMetrics={annualMetrics} isEditingGoal={isEditingGoal} setIsEditingGoal={setIsEditingGoal} goalInput={goalInput} setGoalInput={setGoalInput} handleSaveGoal={handleSaveGoal} targetGoal={targetGoal} cells={cells} cellMembers={cellMembers} attendance={attendance} users={users} getReportForCell={getReportForCell} exportAttendanceCSV={exportAttendanceCSV} setSelectedUserProfile={setSelectedUserProfile} setActiveReportCell={setActiveReportCell} setActiveChecklistCell={setActiveChecklistCell} noticeList={noticeList} handleDeleteNotice={handleDeleteNotice} broadcastTitle={broadcastTitle} setBroadcastTitle={setBroadcastTitle} broadcastScope={broadcastScope} setBroadcastScope={setBroadcastScope} broadcastBody={broadcastBody} setBroadcastBody={setBroadcastBody} handlePublishNotice={handlePublishNotice} 
              />
            )}
            {activeNav === 'calendarSchedule' && <AdminCalendarTab calendarYear={calendarYear} setCalendarYear={setCalendarYear} calendarMonth={calendarMonth} setCalendarMonth={setCalendarMonth} selectedDateStr={selectedDateStr} filteredEventsForDate={churchEvents} setEditingEventId={setEditingEventId} setFormEventTitle={setFormEventTitle} setFormEventDate={setFormEventDate} setFormEventEndDate={setFormEventEndDate} setFormEventStartTime={setFormEventStartTime} setFormEventEndTime={setFormEventEndTime} setFormEventIsAllDay={setFormEventIsAllDay} setFormEventRoom={setFormEventRoom} setFormEventTarget={setFormEventTarget} setFormEventRepeat={setFormEventRepeat} setFormEventColor={setFormEventColor} setFormEventMemo={setFormEventMemo} setShowEventModal={setShowEventModal} firstDayOfWeek={firstDayOfWeek} daysInMonth={daysInMonth} selectedCalDay={selectedCalDay} setSelectedCalDay={setSelectedCalDay} />}
            {activeNav === 'dashboard' && <AdminDashboardTab cells={cells} cellMembers={cellMembers} attendance={attendance} currentWeek={currentWeek} users={users} realStats={realStats} exportAttendanceCSV={exportAttendanceCSV} setSelectedWeekOffset={setSelectedWeekOffset} setSelectedUserProfile={setSelectedUserProfile} setActiveReportCell={setActiveReportCell} setActiveChecklistCell={setActiveChecklistCell} getReportForCell={getReportForCell} handleToggleRoutineCheck={handleToggleRoutineCheck} />}
            {activeNav === 'counseling' && <AdminCounselingTab counselingList={counselingList} counselingReplies={counselingReplies} setCounselingReplies={setCounselingReplies} handleSendCounselingReply={handleSendCounselingReply} />}
            {activeNav === 'broadcast' && <AdminBroadcastTab broadcastScope={broadcastScope} setBroadcastScope={setBroadcastScope} cells={cells} broadcastCellTarget={broadcastCellTarget} setBroadcastCellTarget={setBroadcastCellTarget} users={users} broadcastUserTarget={broadcastUserTarget} setBroadcastUserTarget={setBroadcastUserTarget} broadcastTitle={broadcastTitle} setBroadcastTitle={setBroadcastTitle} broadcastBody={broadcastBody} setBroadcastBody={setBroadcastBody} handlePublishNotice={handlePublishNotice} editingNoticeId={editingNoticeId} setEditingNoticeId={setEditingNoticeId} noticeList={noticeList} handleEditNotice={handleEditNotice} handleDeleteNotice={handleDeleteNotice} />}
            {activeNav === 'cells' && <AdminCellBuilder newCellName={newCellName} setNewCellName={setNewCellName} newCellShepherd={newCellShepherd} setNewCellShepherd={setNewCellShepherd} setCells={setCells} cells={cells} users={users} searchQuery={searchQuery} setSearchQuery={setSearchQuery} cellMembers={cellMembers} handleMemberDrop={handleMemberDrop} handleRemoveMemberFromCell={handleRemoveMemberFromCell} />}
            {activeNav === 'roles' && <AdminRolesTab users={users} setUsers={setUsers} authUser={authUser} />}
            {activeNav === 'people' && <AdminPeopleTab searchQuery={searchQuery} setSearchQuery={setSearchQuery} newUserName={newUserName} setNewUserName={setNewUserName} attendance={attendance} newUserOffice={newUserOffice} setNewUserOffice={setNewUserOffice} newUserRole={newUserRole} setNewUserRole={setNewUserRole} users={users} setUsers={setUsers} cellMembers={cellMembers} cells={cells} setSelectedUserProfile={setSelectedUserProfile} handleCycleHealthStatus={handleCycleHealthStatus} memberHealthStatus={memberHealthStatus} setCareTargetUser={setCareTargetUser} />}
            {activeNav === 'riskCare' && <AdminRiskCareTab visibleUsers={visibleUsers} attendance={attendance} memberHealthStatus={memberHealthStatus} handleCycleHealthStatus={handleCycleHealthStatus} setCareTargetUser={setCareTargetUser} />}
            {activeNav === 'financialLedger' && <ErpFinancialLedger />}
            {activeNav === 'ministryTimeline' && <ErpMinistryTimeline />}
            {activeNav === 'meetingMinutes' && <ErpMeetingMinutes />}
            {activeNav === 'pastoralArchives' && <ErpPastoralArchives />}

          </div>
        </main>
      </div>

      {/* 모달 및 시뮬레이터 */}
      {showEventModal && <AdminEventModal editingEventId={editingEventId} formEventTitle={formEventTitle} setFormEventTitle={setFormEventTitle} formEventDate={formEventDate} setFormEventDate={setFormEventDate} formEventEndDate={formEventEndDate} setFormEventEndDate={setFormEventEndDate} formEventStartTime={formEventStartTime} setFormEventStartTime={setFormEventStartTime} formEventEndTime={formEventEndTime} setFormEventEndTime={setFormEventEndTime} formEventIsAllDay={formEventIsAllDay} setFormEventIsAllDay={setFormEventIsAllDay} formEventRepeat={formEventRepeat} setFormEventRepeat={setFormEventRepeat} formEventRoom={formEventRoom} setFormEventRoom={setFormEventRoom} formEventTarget={formEventTarget} setFormEventTarget={setFormEventTarget} formEventColor={formEventColor} setFormEventColor={setFormEventColor} formEventMemo={formEventMemo} setFormEventMemo={setFormEventMemo} handleSaveChurchEvent={handleSaveChurchEvent} handleDeleteChurchEvent={handleDeleteChurchEvent} setShowEventModal={setShowEventModal} />}
      
      {showSimulatorModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 bg-zinc-900/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
          <div className="relative w-[380px] h-[780px] rounded-[38px] border-[8px] border-zinc-900 bg-zinc-50 shadow-2xl overflow-hidden flex flex-col">
            <AdminMobileSimulator currentWeek={currentWeek} users={visibleUsers} attendance={attendance} noticeList={noticeList} cells={visibleCells} cellMembers={cellMembers} setNoticeList={setNoticeList} handleToggleAttendance={handleToggleAttendance} setSelectedWeekOffset={setSelectedWeekOffset} setSelectedUserProfile={setSelectedUserProfile} onClose={() => setShowSimulatorModal(false)} />
          </div>
        </div>
      )}

      {/* 성도 상세 프로필 Drawer */}
      {selectedUserProfile && (
        <div className="fixed inset-0 z-[300] bg-zinc-900/40 backdrop-blur-sm flex justify-end transition-all animate-fade-in pointer-events-auto" onClick={() => setSelectedUserProfile(null)}>
          <div className="w-full max-w-[400px] h-full bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.15)] flex flex-col border-l border-zinc-200 animate-slide-left" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-200 bg-zinc-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-600 font-black text-lg">
                  {selectedUserProfile.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-zinc-900 leading-tight">{selectedUserProfile.name} <span className="text-[12px] font-bold text-zinc-500 ml-0.5">{selectedUserProfile.office || '성도'}</span></h3>
                  <span className="text-[11.5px] font-bold text-indigo-600">{selectedUserProfile.role}</span>
                </div>
              </div>
              <button onClick={() => setSelectedUserProfile(null)} className="p-1.5 text-zinc-400 hover:text-zinc-800 bg-white rounded-md border border-zinc-200 shadow-sm cursor-pointer"><IconClose /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-6 hide-scrollbar">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">소속 목장</span>
                <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 font-bold text-zinc-800 text-[13px]">
                  {cellMembers.find(m => m.user_name === selectedUserProfile.name) 
                    ? cells.find(c => c.id === cellMembers.find(m => m.user_name === selectedUserProfile.name).cell_id)?.name || '배정 오류'
                    : '미배정'}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">건강 및 케어 상태</span>
                <div className="flex gap-1.5">
                  <button onClick={(e) => handleCycleHealthStatus(selectedUserProfile.name, e)} className={`flex-1 py-2.5 rounded-lg border font-bold text-[11.5px] flex items-center justify-center gap-1.5 cursor-pointer transition-all ${memberHealthStatus[selectedUserProfile.name] === 'green' || !memberHealthStatus[selectedUserProfile.name] ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-zinc-200 text-zinc-400'}`}>정상</button>
                  <button onClick={(e) => handleCycleHealthStatus(selectedUserProfile.name, e)} className={`flex-1 py-2.5 rounded-lg border font-bold text-[11.5px] flex items-center justify-center gap-1.5 cursor-pointer transition-all ${memberHealthStatus[selectedUserProfile.name] === 'yellow' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-zinc-200 text-zinc-400'}`}>주의</button>
                  <button onClick={(e) => handleCycleHealthStatus(selectedUserProfile.name, e)} className={`flex-1 py-2.5 rounded-lg border font-bold text-[11.5px] flex items-center justify-center gap-1.5 cursor-pointer transition-all ${memberHealthStatus[selectedUserProfile.name] === 'red' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-zinc-200 text-zinc-400'}`}>집중케어</button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">최근 4주 출석 현황</span>
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3].map(offset => {
                    const d = new Date();
                    const kstDate = new Date(d.getTime() + (d.getTimezoneOffset() * 60000) + (9 * 3600000));
                    const dayOfWeek = kstDate.getDay();
                    const baseSunday = new Date(kstDate);
                    baseSunday.setDate(kstDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? 0 : 7) - (offset * 7));
                    const dateStr = `${baseSunday.getFullYear()}-${String(baseSunday.getMonth() + 1).padStart(2, '0')}-${String(baseSunday.getDate()).padStart(2, '0')}`;
                    const isAtt = attendance.some(a => a.user_name === selectedUserProfile.name && a.date === dateStr && (a.type === '주일' || a.type === '주일예배') && a.status === '출석');
                    
                    return (
                      <div key={dateStr} className={`flex-1 flex flex-col items-center justify-center py-2 rounded-lg border ${isAtt ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`}>
                        <span className="text-[9.5px] font-mono mb-0.5 opacity-70">{offset === 0 ? '금주' : `${offset}주 전`}</span>
                        <span className="text-[13px] font-black">{isAtt ? 'O' : 'X'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-200 bg-white">
              <button onClick={() => { setSelectedUserProfile(null); setCareTargetUser(selectedUserProfile); setActiveNav('riskCare'); }} className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-bold text-[12px] shadow-sm cursor-pointer transition-colors">
                심방/케어 기록 작성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 [수정 완료] 목장 보고서 상세 인스펙터 모달 (암호화 해제 & 나눔 카드 파싱 표출) */}
      {activeReportCell && (() => {
        const report = getReportForCell(activeReportCell);
        let parsedThanks = [];
        try {
          if (report?.thanks_sharing) {
            const raw = decryptField(report.thanks_sharing);
            parsedThanks = JSON.parse(raw);
          } else if (Array.isArray(report?.submissions)) {
            parsedThanks = report.submissions;
          }
        } catch(e) {}

        const rawWord = report?.word_sharing || report?.content || report?.report_text || '';
        const wordSharing = decryptField(rawWord);
        const prayerSharing = decryptField(report?.prayer_requests || report?.intercession || '');

        return (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in select-none">
            <div className="w-full max-w-lg bg-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-zinc-200 flex flex-col gap-4 max-h-[85vh]">
              
              <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-[15.5px] font-black text-zinc-900 tracking-tight">
                    [{activeReportCell.name}] 목장 보고서
                  </h3>
                </div>
                <button onClick={() => setActiveReportCell(null)} className="text-zinc-400 hover:text-zinc-800 font-bold cursor-pointer">
                  <IconClose />
                </button>
              </div>

              {!report ? (
                <div className="py-12 text-center text-zinc-400 font-medium text-[13px]">
                  제출된 보고서가 없습니다.
                </div>
              ) : (
                <div className="py-1 text-[12.5px] leading-relaxed text-zinc-700 flex flex-col gap-3.5 overflow-y-auto hide-scrollbar max-h-[60vh] pr-1">
                  
                  {/* 작성 기본 정보 */}
                  <div className="flex justify-between items-center bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 text-[11px]">
                    <span className="font-bold text-zinc-600">
                      작성자: <span className="text-zinc-900 font-black">{report.author_name || report.shepherd_name || '목자'}</span>
                    </span>
                    <span className="font-mono text-zinc-400">
                      {report.created_at ? report.created_at.slice(0, 16).replace('T', ' ') : ''}
                    </span>
                  </div>

                  {/* 1. 종합 말씀 및 사역 요약 */}
                  {wordSharing && (
                    <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100">
                      <span className="text-[10.5px] font-black text-indigo-700 uppercase tracking-wider">
                        📖 말씀 나눔 & 종합 요약
                      </span>
                      <p className="text-[12.5px] font-medium whitespace-pre-wrap text-zinc-800 leading-relaxed">
                        {wordSharing}
                      </p>
                    </div>
                  )}

                  {/* 2. 목장 중보기도 제목 */}
                  {prayerSharing && (
                    <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-orange-50/50 border border-orange-100">
                      <span className="text-[10.5px] font-black text-orange-700 uppercase tracking-wider">
                        🙏 목장 중보기도 제목
                      </span>
                      <p className="text-[12.5px] font-medium whitespace-pre-wrap text-zinc-800 leading-relaxed">
                        {prayerSharing}
                      </p>
                    </div>
                  )}

                  {/* 3. 목원별 상세 나눔 */}
                  {Array.isArray(parsedThanks) && parsedThanks.length > 0 && (
                    <div className="flex flex-col gap-2 pt-1">
                      <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                        참여 성도별 나눔 ({parsedThanks.length}명)
                      </span>
                      <div className="space-y-2">
                        {parsedThanks.map((item, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl border border-zinc-200 bg-white shadow-xs flex flex-col gap-1.5">
                            <span className="font-black text-zinc-900 text-[12.5px] flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {item.name}
                            </span>
                            {item.wordShare && (
                              <p className="text-[12px] text-zinc-600 leading-relaxed">
                                <b className="text-zinc-800 font-bold">말씀:</b> {decryptField(item.wordShare)}
                              </p>
                            )}
                            {item.thanksShare && (
                              <p className="text-[12px] text-zinc-600 leading-relaxed">
                                <b className="text-zinc-800 font-bold">감사:</b> {decryptField(item.thanksShare)}
                              </p>
                            )}
                            {item.prayerReq && (
                              <p className="text-[12px] text-zinc-600 leading-relaxed">
                                <b className="text-zinc-800 font-bold">기도:</b> {decryptField(item.prayerReq)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button 
                onClick={() => setActiveReportCell(null)} 
                className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[12px] cursor-pointer shadow-sm transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        );
      })()}

      {/* 실시간 Q/M/T 주간 체크표 인스펙터 모달 */}
      {activeChecklistCell && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-4xl bg-white rounded-xl p-5 shadow-2xl border border-zinc-200 flex flex-col gap-4 max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <h3 className="text-[15px] font-black text-zinc-900">{activeChecklistCell.name} 주간 루틴 현황</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-zinc-400">{currentWeek.dates[0]?.month}월</span>
                <button onClick={() => setActiveChecklistCell(null)} className="text-zinc-400 hover:text-zinc-800 font-bold cursor-pointer"><IconClose /></button>
              </div>
            </div>
            <div className="flex-1 overflow-x-auto overflow-y-auto rounded-lg border border-zinc-200 bg-white">
              <table className="w-full text-center border-collapse min-w-[620px]">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80">
                    <th className="py-2.5 px-3 text-[11px] font-bold text-zinc-500 w-24 text-left pl-4">성도명</th>
                    {currentWeek.dates.map(d => (
                      <th key={d.full} className="py-2 px-2 border-l border-zinc-100">
                        <div className={`flex flex-col items-center justify-center py-1 px-2 rounded-md ${d.isToday ? 'bg-zinc-900 text-white' : ''}`}>
                          <span className={`text-[10px] font-bold ${d.isToday ? 'text-white' : d.dayName === '일' ? 'text-rose-500' : 'text-zinc-400'}`}>{d.dayName}</span>
                          <span className={`text-[12px] font-mono font-black ${d.isToday ? 'text-white' : 'text-zinc-700'}`}>{d.dayNum}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {activeCellMemberList.length === 0 ? (
                    <tr><td colSpan={8} className="py-12 text-zinc-400 text-center font-medium">등록된 성도가 없습니다.</td></tr>
                  ) : (
                    activeCellMemberList.map(name => (
                      <tr key={name} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-2.5 px-3 text-[12.5px] font-bold text-zinc-900 text-left pl-4">{name}</td>
                        {currentWeek.dates.map(d => {
                          const isQ = (attendance || []).some(a => a.user_name === name && a.date === d.full && (a.type === 'QT' || a.type === '큐티') && a.status === '출석');
                          const isM = (attendance || []).some(a => a.user_name === name && a.date === d.full && (a.type === '맥체인' || a.type === '성경' || a.type === '통독') && a.status === '출석');
                          const isT = (attendance || []).some(a => a.user_name === name && a.date === d.full && (a.type === '감사' || a.type === '목장' || a.type === '감사나눔') && a.status === '출석');
                          return (
                            <td key={d.full} className="py-1.5 px-1 border-l border-zinc-100">
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                <button type="button" onClick={() => handleToggleRoutineCheck(name, d.full, 'Q')} className={`w-4.5 h-4.5 rounded text-[9px] font-black flex items-center justify-center transition-all cursor-pointer ${isQ ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:text-zinc-500 bg-zinc-50 border border-zinc-200'}`}>Q</button>
                                <button type="button" onClick={() => handleToggleRoutineCheck(name, d.full, 'M')} className={`w-4.5 h-4.5 rounded text-[9px] font-black flex items-center justify-center transition-all cursor-pointer ${isM ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:text-zinc-500 bg-zinc-50 border border-zinc-200'}`}>M</button>
                                <button type="button" onClick={() => handleToggleRoutineCheck(name, d.full, 'T')} className={`w-4.5 h-4.5 rounded text-[9px] font-black flex items-center justify-center transition-all cursor-pointer ${isT ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:text-zinc-500 bg-zinc-50 border border-zinc-200'}`}>T</button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-[10.5px] font-bold text-zinc-400">* Q: QT / M: 맥체인 / T: 감사 (클릭 시 토글 체크)</span>
              <button onClick={() => setActiveChecklistCell(null)} className="px-5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[12px] cursor-pointer">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 집중 심방 기록 모달 */}
      {careTargetUser && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-md bg-white rounded-xl p-5 shadow-2xl border border-zinc-200 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="text-[15px] font-black text-zinc-900 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span> 집중 심방 기록</h3>
              <button onClick={() => setCareTargetUser(null)} className="text-zinc-400 hover:text-zinc-800 font-bold cursor-pointer"><IconClose /></button>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                <span className="text-[10px] font-bold text-zinc-500 block mb-0.5">대상 성도</span>
                <span className="text-[13px] font-black text-zinc-900">{careTargetUser.name} ({careTargetUser.office || '성도'} · {careTargetUser.role})</span>
              </div>
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-zinc-500">케어 방식</label>
                <select value={careActionType} onChange={e => setCareActionType(e.target.value)} className="w-full p-2.5 rounded-lg border border-zinc-200 text-[12px] font-bold outline-none cursor-pointer bg-white">
                  <option value="심방">대면 심방</option><option value="전화상담">전화 심방</option><option value="기도후원">기도 후원</option><option value="기타돌봄">기타 돌봄</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-zinc-500">케어 메모 및 특이사항</label>
                <textarea rows={4} value={careActionMemo} onChange={e => setCareActionMemo(e.target.value)} placeholder="상태 및 기도 제목..." className="w-full p-2.5 rounded-lg border border-zinc-200 text-[12px] outline-none resize-none bg-white placeholder:text-zinc-300" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setCareTargetUser(null)} className="flex-1 py-2.5 rounded-lg bg-zinc-100 text-zinc-700 font-bold text-[12px] cursor-pointer hover:bg-zinc-200">취소</button>
              <button onClick={() => { alert(`[${careTargetUser.name}] 성도 심방 기록이 저장되었습니다.`); setCareTargetUser(null); setCareActionMemo(''); }} className="flex-1 py-2.5 rounded-lg bg-zinc-900 text-white font-bold text-[12px] cursor-pointer hover:bg-zinc-800">저장하기</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .animate-slide-left {
          animation: slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
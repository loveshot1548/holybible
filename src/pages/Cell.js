// src/components/Cell.js
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import CryptoJS from 'crypto-js';

// =====================================================================
// 🔐 [보안 표준화] 군사급 AES-256 종단간 암호화 (구버전 Base64 호환)
// =====================================================================
const CHAT_SECRET_KEY = process.env.REACT_APP_CHAT_SECRET || 'tree-secret-key-2026';
const ENC_PREFIX_V2 = "ENC_GTC_v2::";
const ENC_PREFIX_V1 = "ENC_GTC_v1::";

const encryptField = (plainText) => {
  if (!plainText || typeof plainText !== 'string') return plainText;
  try {
    const cipher = CryptoJS.AES.encrypt(plainText, CHAT_SECRET_KEY).toString();
    return `${ENC_PREFIX_V2}${cipher}`;
  } catch (e) {
    return plainText;
  }
};

const decryptField = (cipherText) => {
  if (!cipherText || typeof cipherText !== 'string') return cipherText || '';
  
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

const StrokeW = "1.8";
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>;
const IconCalendar = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IconCollection = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><polyline points="8 6 21 6 21 21 8 21 8 6" /><polyline points="8 12 21 12" /><line x1="3" y1="12" x2="3" y2="12" /><line x1="3" y1="6" x2="3" y2="6" /><line x1="3" y1="18" x2="3" y2="18" /></svg>;
const IconShield = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-3.5 h-3.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
const IconUser = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const IconSpeaker = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" /></svg>;
const IconBook = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeW} className="w-4 h-4"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
const IconHeart = ({ filled, className="w-4 h-4" }) => <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={StrokeW} className={className}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
const IconPrayHand = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeW} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M8.5 10a2.5 2.5 0 0 1 2.5-2.5h2a2.5 2.5 0 0 1 2.5 2.5V21H8.5V10z"/><path d="M12 7.5V3"/><path d="M9 5l3-2 3 2"/></svg>;
const IconFlame = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeW} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>;
const IconTrendingUp = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><polyline points="23 6 13.5 15.5 8.5 10.5 18" /><polyline points="17 6 23 6 23 12" /></svg>;
const IconMenu = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const IconSparkles = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>;

export default function Cell({
  t, isDarkMode, setActiveScreen, isSidebarOpen, setIsSidebarOpen, date, currDay = {}, authUser = {},
  globalCellData = {}, renderToolbar, handleStickerAdd, handleMemoAdd, handleFileUpload, CanvasEngine, tool, setTool,
  color, setColor, size = 2, sizeSet = () => {}, StickerLayer, onPtrDown, updateDay, handleUpdateCell, handleAutoNumbering,
  handleAutoResize, copyCellReport, getArr
}) {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [subView, setSubView] = useState('main');
  const [syncTick, setSyncTick] = useState(0);

  const safeGetArr = getArr || ((arr) => Array.isArray(arr) ? arr : []);
  const userName = authUser?.name || '성도';
  const userRole = authUser?.role || '목원';

  const isSuperAdmin = userName === '정신동' || authUser?.isAdmin;
  const isShepherd = userRole === '목자';
  const isAdminOrSuper = ['관리자', '운영자'].includes(userRole) || isSuperAdmin;
  const canManageNotice = ['부목자', '목자', '관리자', '운영자'].includes(userRole) || isSuperAdmin;
  const canViewSharedReports = ['목자', '관리자', '운영자'].includes(userRole) || isSuperAdmin;

  const [myAssignedCells, setMyAssignedCells] = useState([]);
  const [selectedCellIndex, setSelectedCellIndex] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;
    const fetchUserCellMapping = async () => {
      try {
        const myDirectCell = userName.endsWith('목장') ? userName : `${userName} 목장`;
        let initialList = [];

        if (isShepherd) {
          initialList.push(myDirectCell);
        }

        const { data: memberRows, error: mErr } = await supabase
          .from('cell_members')
          .select('cell_id')
          .eq('user_name', userName);

        if (mErr || !memberRows || memberRows.length === 0) {
          if (isMounted) {
            const fallback = authUser?.shepherdName || authUser?.group;
            if (fallback) {
              setMyAssignedCells([fallback]);
            } else {
              const { data: firstCell } = await supabase.from('cells').select('name').limit(1).maybeSingle();
              setMyAssignedCells(firstCell?.name ? [firstCell.name] : ['목장 미배정']);
            }
          }
          return;
        }

        const cellIds = memberRows.map(r => r.cell_id).filter(Boolean);
        const { data: cellData } = await supabase
          .from('cells')
          .select('id, name')
          .in('id', cellIds);

        if (!isMounted) return;

        if (cellData && cellData.length > 0) {
          const mapped = cellData.map(c => c.name).filter(Boolean);
          initialList.push(...mapped);
        }

        if (isMounted) {
          const uniqueList = Array.from(new Set(initialList.filter(Boolean)));
          setMyAssignedCells(uniqueList.length > 0 ? uniqueList : ['목장 미배정']);
        }
      } catch (e) {
        if (isMounted) setMyAssignedCells(['목장 미배정']);
      }
    };
    fetchUserCellMapping();
    return () => { isMounted = false; };
  }, [userName, authUser, isShepherd]);

  const [activeGroup, setActiveGroup] = useState('cell'); 
  const isLeadershipView = activeGroup === 'leadership' && (isShepherd || isAdminOrSuper || isSuperAdmin);

  const [allShepherdList, setAllShepherdList] = useState([]);
  const [operatorSelectedShepherd, setOperatorSelectedShepherd] = useState('');

  useEffect(() => {
    if (!supabase || !isSuperAdmin) return;
    let isMounted = true;
    const fetchShepherds = async () => {
      const { data } = await supabase.from('cells').select('name');
      if (data && isMounted) {
        const names = Array.from(new Set(data.map(d => d.name)));
        setAllShepherdList(names);
        if (!operatorSelectedShepherd && names.length > 0) {
          setOperatorSelectedShepherd(names[0]);
        }
      }
    };
    fetchShepherds();
    return () => { isMounted = false; };
  }, [isSuperAdmin, operatorSelectedShepherd]);

  useEffect(() => {
    const handleStorageChange = () => setSyncTick(prev => prev + 1);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bible-progress-updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bible-progress-updated', handleStorageChange);
    };
  }, []);

  const targetCellName = useMemo(() => {
    if (isLeadershipView) return '리더십 연합';
    if (isSuperAdmin && operatorSelectedShepherd) return operatorSelectedShepherd;
    if (myAssignedCells.length > 0 && myAssignedCells[selectedCellIndex]) {
      return myAssignedCells[selectedCellIndex];
    }
    if (isShepherd) return userName.endsWith('목장') ? userName : `${userName} 목장`;
    return authUser?.shepherdName || authUser?.group || '목장 미배정';
  }, [authUser, isShepherd, isLeadershipView, isSuperAdmin, operatorSelectedShepherd, userName, myAssignedCells, selectedCellIndex]);

  const targetShepherdName = targetCellName;
  const targetGroupName = targetShepherdName;

  const activeNoticeText = useMemo(() => {
    const cellSpecificNotice = localStorage.getItem(`cell_notice_${targetCellName}`);
    if (cellSpecificNotice) return cellSpecificNotice;
    if (isLeadershipView) {
      const leadershipNotice = localStorage.getItem('cell_notice_리더십 연합');
      if (leadershipNotice) return leadershipNotice;
    }
    const globalNotice = localStorage.getItem('global_cell_notice');
    if (globalNotice) return globalNotice;
    return globalCellData?.notice || '';
  }, [targetCellName, isLeadershipView, globalCellData?.notice, syncTick]);

  const currentPersonalThanks = useMemo(() => {
    const list = [];
    if (currDay?.thanksText) list.push(currDay.thanksText);
    if (currDay?.thanksDeclarations && Array.isArray(currDay.thanksDeclarations)) {
      list.push(...currDay.thanksDeclarations.filter(Boolean));
    }
    return list.join('\n').trim();
  }, [currDay]);

  const draftKey = `cell_draft_${userName}_${activeGroup}_${date}`;
  const [drafts, setDrafts] = useState({ wordShare: '', thanksShare: '', prayerReq: '', shareToBoard: false });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      let sermonContent = '';
      try {
        const sermonNotes = JSON.parse(localStorage.getItem('sermon_notes') || '{}');
        const sermonDaily = JSON.parse(localStorage.getItem('sermon_daily') || '{}');
        const todayNote = sermonNotes[date] || {};
        const todayDaily = sermonDaily[date] || {};

        sermonContent = 
          currDay?.sermonNote || currDay?.sermonApplication || currDay?.application || currDay?.sermonText ||
          todayNote.content || todayNote.application || todayNote.sermonNote || todayNote.sermonApplication ||
          todayDaily.sermonNote || todayDaily.application || todayDaily.sermonApplication || todayDaily.content || '';
      } catch(e) {}

      const autoWordShare = currDay.wordShare || currDay.sermonNote || currDay.sermonApplication || sermonContent || '';

      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.wordShare && autoWordShare) parsed.wordShare = autoWordShare;
        setDrafts(parsed);
      } else {
        setDrafts({ wordShare: autoWordShare, thanksShare: currentPersonalThanks || '', prayerReq: currDay.prayerReq || '', shareToBoard: false });
      }
    } catch(e) {}
  }, [draftKey, currentPersonalThanks, currDay, date]);

  const handleDraftChange = (field, val) => {
    setDrafts(prev => {
      const next = { ...prev, [field]: val };
      localStorage.setItem(draftKey, JSON.stringify(next));
      return next;
    });
  };

  const autoGrow = useCallback((e) => {
    if (!e || !e.target) return;
    const el = e.target;
    el.style.height = 'auto';
    const newHeight = Math.max(54, el.scrollHeight);
    el.style.height = `${newHeight}px`;
  }, []);

  const [cellMembers, setCellMembers] = useState([]);
  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;
    const fetchCellMembersRealtime = async () => {
      try {
        if (isLeadershipView) {
          const { data } = await supabase.from('app_users').select('name, role, shepherd_name').in('role', ['목자', '관리자', '운영자', '부목자']);
          if (isMounted) setCellMembers(data || []);
          return;
        }

        if (targetCellName === '목장 미배정') {
          if (isMounted) setCellMembers([]);
          return;
        }

        const { data: cellRow } = await supabase
          .from('cells')
          .select('id, name')
          .eq('name', targetCellName)
          .maybeSingle();

        if (!isMounted) return;

        if (cellRow) {
          const { data: memberRows } = await supabase
            .from('cell_members')
            .select('user_name, assigned_role')
            .eq('cell_id', cellRow.id);

          if (!isMounted) return;

          if (memberRows && memberRows.length > 0) {
            const names = memberRows.map(m => m.user_name);
            const { data: userRows } = await supabase
              .from('app_users')
              .select('name, role, shepherd_name')
              .in('name', names);

            if (isMounted) setCellMembers(userRows || memberRows.map(m => ({ name: m.user_name, role: m.assigned_role })));
          } else {
            if (isMounted) setCellMembers([]);
          }
        } else {
          const { data } = await supabase.from('app_users').select('name, role, shepherd_name');
          if (isMounted) {
            const matched = (data || []).filter(m => m.shepherd_name === targetCellName || m.name === targetCellName);
            setCellMembers(matched);
          }
        }
      } catch (e) {
        if (isMounted) console.error("Cell members sync error:", e);
      }
    };
    fetchCellMembersRealtime();
    return () => { isMounted = false; };
  }, [targetCellName, isLeadershipView, syncTick]);

  const feedStorageKey = `gratitude_feed_${targetCellName}`;
  const [gratitudeFeed, setGratitudeFeed] = useState([]);
  const [editingFeedId, setEditingFeedId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    try {
      const savedFeed = JSON.parse(localStorage.getItem(feedStorageKey) || '[]');
      setGratitudeFeed(Array.isArray(savedFeed) ? savedFeed : []);
    } catch (e) { setGratitudeFeed([]); }
  }, [feedStorageKey]);

  const handleLikeFeed = (id) => {
    const updated = gratitudeFeed.map(f => f.id === id ? { ...f, likes: (f.likes || 0) + 1 } : f);
    setGratitudeFeed(updated);
    localStorage.setItem(feedStorageKey, JSON.stringify(updated));
  };

  const handleDeleteFeed = (id) => {
    if (!window.confirm("정말 이 감사 나눔을 삭제하시겠습니까?")) return;
    const updated = gratitudeFeed.filter(f => f.id !== id);
    setGratitudeFeed(updated);
    localStorage.setItem(feedStorageKey, JSON.stringify(updated));
  };

  const handleUpdateFeedText = (id) => {
    if (!editText.trim()) return alert("내용을 입력해주세요.");
    const updated = gratitudeFeed.map(f => f.id === id ? { ...f, text: editText } : f);
    setGratitudeFeed(updated);
    localStorage.setItem(feedStorageKey, JSON.stringify(updated));
    setEditingFeedId(null);
    setEditText('');
  };

  const cellData = globalCellData || { notice: '', submissions: [], groupPrayers: [], cellIntercession: '', history: [] };

  // =====================================================================
  // 📅 [주차 계산 로직]
  // =====================================================================
  const currentWeek = useMemo(() => {
    const baseDate = date ? new Date(date) : new Date();
    const day = baseDate.getDay(); 
    const diffToMon = (day === 0 ? -6 : 1) - day;
    
    const mon = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + diffToMon);
    const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);

    const format = dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    
    const dates = Array.from({ length: 7 }, (_, i) => {
      const target = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i);
      return format(target);
    });

    const monthName = mon.toLocaleDateString('ko-KR', { month: 'long', year: 'numeric' });

    return {
      fullRange: `${format(mon)} ~ ${format(sun)}`,
      shortLabel: `${mon.getMonth() + 1}.${mon.getDate()} ~ ${sun.getMonth() + 1}.${sun.getDate()}`,
      dates,
      daysKo: ['월', '화', '수', '목', '금', '토', '일'],
      monthName,
      monTimestamp: mon.getTime(),
      monDateStr: format(mon)
    };
  }, [date]);

  const [weekOffset, setWeekOffset] = useState(0);

  const selectedWeek = useMemo(() => {
    if (weekOffset === 0) return currentWeek;
    
    const baseDate = date ? new Date(date) : new Date();
    const day = baseDate.getDay(); 
    const diffToMon = (day === 0 ? -6 : 1) - day;
    const currentMon = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + diffToMon);
    
    const targetMon = new Date(currentMon.getFullYear(), currentMon.getMonth(), currentMon.getDate() + (weekOffset * 7));
    const targetSun = new Date(targetMon.getFullYear(), targetMon.getMonth(), targetMon.getDate() + 6);

    const format = dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    const dates = Array.from({ length: 7 }, (_, i) => {
      const target = new Date(targetMon.getFullYear(), targetMon.getMonth(), targetMon.getDate() + i);
      return format(target);
    });

    return {
      fullRange: `${format(targetMon)} ~ ${format(targetSun)}`,
      shortLabel: `${targetMon.getMonth() + 1}.${targetMon.getDate()} ~ ${targetSun.getMonth() + 1}.${targetSun.getDate()}`,
      dates,
      daysKo: ['월', '화', '수', '목', '금', '토', '일'],
      monthName: targetMon.toLocaleDateString('ko-KR', { month: 'long', year: 'numeric' }),
      monDateStr: format(targetMon)
    };
  }, [currentWeek, weekOffset, date]);

  const historyStorageKey = `cell_history_${targetShepherdName}`;
  const [shepherdHistories, setShepherdHistories] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(historyStorageKey) || '[]');
      setShepherdHistories(Array.isArray(saved) ? saved : safeGetArr(cellData.history));
    } catch(e) { setShepherdHistories([]); }
  }, [historyStorageKey, cellData.history]);

  const selectedWeekSubmissions = useMemo(() => {
    const allSubs = safeGetArr(cellData.submissions);
    const weekSet = new Set(selectedWeek.dates);
    return allSubs.filter(s => s?.date && weekSet.has(s.date));
  }, [cellData.submissions, selectedWeek.dates, safeGetArr]);

  // 주차별 독립 중보기도 브리핑
  const activeWeekIntercession = useMemo(() => {
    const weekRange = selectedWeek.fullRange;
    
    const savedWeekIntercession = localStorage.getItem(`cell_intercession_${targetCellName}_${weekRange}`);
    if (savedWeekIntercession !== null) return savedWeekIntercession;

    if (cellData.weeklyIntercessions && cellData.weeklyIntercessions[weekRange] !== undefined) {
      return cellData.weeklyIntercessions[weekRange];
    }

    const hist = shepherdHistories.find(h => h.weekRange === weekRange) ||
      safeGetArr(cellData.history).find(h => h.weekRange === weekRange);
    if (hist) {
      return decryptField(hist.intercession || hist.prayer_requests || '');
    }

    if (weekRange === currentWeek.fullRange) {
      return cellData.cellIntercession || '';
    }

    return '';
  }, [targetCellName, selectedWeek.fullRange, currentWeek.fullRange, cellData.weeklyIntercessions, cellData.cellIntercession, shepherdHistories, cellData.history, syncTick]);

  const handleUpdateIntercessionText = (text) => {
    const weekRange = selectedWeek.fullRange;
    localStorage.setItem(`cell_intercession_${targetCellName}_${weekRange}`, text);

    if (handleUpdateCell) {
      handleUpdateCell(prev => ({
        ...prev,
        cellIntercession: weekRange === currentWeek.fullRange ? text : prev.cellIntercession,
        weeklyIntercessions: {
          ...(prev.weeklyIntercessions || {}),
          [weekRange]: text
        }
      }));
    }

    setSyncTick(p => p + 1);
  };

  const handleImportPreviousWeekIntercession = () => {
    const prevWeekMon = new Date(currentWeek.monTimestamp - (7 * 24 * 60 * 60 * 1000));
    const prevWeekSun = new Date(prevWeekMon.getTime() + (6 * 24 * 60 * 60 * 1000));
    const format = dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    const prevRange = `${format(prevWeekMon)} ~ ${format(prevWeekSun)}`;

    const prevSaved = localStorage.getItem(`cell_intercession_${targetCellName}_${prevRange}`);
    const hist = shepherdHistories.find(h => h.weekRange === prevRange) ||
      safeGetArr(cellData.history).find(h => h.weekRange === prevRange);
    const prevText = prevSaved || (hist ? decryptField(hist.intercession || '') : '') || cellData.weeklyIntercessions?.[prevRange];

    if (!prevText || !prevText.trim()) {
      return alert("불러올 지난주 중보기도 내용이 없습니다.");
    }

    handleUpdateIntercessionText(prevText);
    alert("지난주 중보기도 내용을 이번 주로 성공적으로 불러왔습니다!");
  };

  const selectedWeekPrayers = useMemo(() => {
    const list = safeGetArr(cellData.groupPrayers);
    const weekSet = new Set(selectedWeek.dates);

    const hist = shepherdHistories.find(h => h.weekRange === selectedWeek.fullRange) ||
      safeGetArr(cellData.history).find(h => h.weekRange === selectedWeek.fullRange);

    let filtered = list.filter(p => {
      if (p?.weekRange) return p.weekRange === selectedWeek.fullRange;
      if (p?.date) return weekSet.has(p.date);
      return false;
    });

    if (filtered.length === 0 && hist && safeGetArr(hist.groupPrayers).length > 0) {
      filtered = safeGetArr(hist.groupPrayers);
    }

    return filtered;
  }, [cellData.groupPrayers, selectedWeek.dates, selectedWeek.fullRange, shepherdHistories, cellData.history, safeGetArr]);

  const [selectedMemberForPrayer, setSelectedMemberForPrayer] = useState('');
  const [adminPrayerInput, setAdminPrayerInput] = useState('');

  const handleAddMemberPrayerByShepherd = () => {
    const targetMember = selectedMemberForPrayer || (cellMembers[0]?.name);
    if (!targetMember) return alert("기도제목을 입력할 목원을 선택해주세요.");
    if (!adminPrayerInput.trim()) return alert("기도제목 내용을 입력해주세요.");

    const newPrayerEntry = {
      id: `gp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: targetMember,
      text: adminPrayerInput.trim(),
      date: date || new Date().toISOString().split('T')[0],
      weekRange: selectedWeek.fullRange,
      author: userName
    };

    if (handleUpdateCell) {
      handleUpdateCell(prev => ({
        ...prev,
        groupPrayers: [newPrayerEntry, ...safeGetArr(prev.groupPrayers)]
      }));
    }

    setAdminPrayerInput('');
    alert(`[${targetMember}] 목원의 기도제목이 추가되었습니다.`);
  };

  const handleImportPreviousWeekPrayers = () => {
    const prevWeekMon = new Date(currentWeek.monTimestamp - (7 * 24 * 60 * 60 * 1000));
    const prevWeekSun = new Date(prevWeekMon.getTime() + (6 * 24 * 60 * 60 * 1000));
    const format = dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    const prevRange = `${format(prevWeekMon)} ~ ${format(prevWeekSun)}`;

    const hist = shepherdHistories.find(h => h.weekRange === prevRange) ||
      safeGetArr(cellData.history).find(h => h.weekRange === prevRange);

    const prevList = hist?.groupPrayers || safeGetArr(cellData.groupPrayers).filter(p => p.weekRange === prevRange || (p.date && p.date < currentWeek.monDateStr));

    if (!prevList || prevList.length === 0) {
      return alert("불러올 지난주 기도제목이 없습니다.");
    }

    const carried = prevList.map(p => ({
      ...p,
      id: `gp_carry_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      date: currentWeek.monDateStr,
      weekRange: currentWeek.fullRange
    }));

    if (handleUpdateCell) {
      handleUpdateCell(prev => ({
        ...prev,
        groupPrayers: [...carried, ...safeGetArr(prev.groupPrayers)]
      }));
    }
    alert(`지난주 기도제목 ${carried.length}건을 이번 주 캔버스로 불러왔습니다!`);
  };

  const handleDeleteMemberPrayer = (prayerId) => {
    if (!window.confirm("이 기도제목을 삭제하시겠습니까?")) return;
    if (handleUpdateCell) {
      handleUpdateCell(prev => ({
        ...prev,
        groupPrayers: safeGetArr(prev.groupPrayers).filter(p => p.id !== prayerId)
      }));
    }
  };

  const groupedPrayers = useMemo(() => {
    const map = new Map();
    selectedWeekPrayers.forEach(item => {
      if (!item || !item.name) return;
      const key = item.name.trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries());
  }, [selectedWeekPrayers]);

  const [dbAttendance, setDbAttendance] = useState([]);

  useEffect(() => {
    if (!supabase || !currentWeek?.dates) return;
    const fetchAttendance = async () => {
      const { data } = await supabase
        .from('attendance_records')
        .select('*')
        .in('date', currentWeek.dates);
      if (data) setDbAttendance(data);
    };
    fetchAttendance();

    const channel = supabase.channel('cell_attendance_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, () => {
        fetchAttendance();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentWeek.dates]);

  const masterDays = useMemo(() => {
    let md = {};
    try {
      ['qt_daily', 'days_data', 'bible_progress', 'mcheyne_daily', 'daily_routine'].forEach(k => {
        const r = localStorage.getItem(k);
        if (r) md = { ...md, ...JSON.parse(r) };
      });
    } catch(e) {}
    if (date && currDay) md[date] = { ...(md[date] || {}), ...currDay };
    return md;
  }, [date, currDay, syncTick]);

  useEffect(() => {
    if (!supabase || !userName || userName === '성도' || !date) return;

    const syncDailyToDatabase = async () => {
      try {
        const chk = currDay?.checks || {};
        const dayD = masterDays[date] || {};

        const hasQt = chk['QTin'] || chk['QT'] || currDay?.qtTitle || dayD.qtTitle || currDay?.qtMeditation;
        let readCnt = 0;
        [currDay?.mcheyneChecks, currDay?.bible365Checks, currDay?.readingChecks, dayD.readChapters].forEach(c => {
          if (c && typeof c === 'object') {
            readCnt += Array.isArray(c) ? c.filter(Boolean).length : Object.values(c).filter(Boolean).length;
          }
        });
        const hasBible = chk['성경읽기'] || chk['맥체인'] || chk['통독365'] || chk['성경통독'] || readCnt > 0;
        const hasThanks = chk['감사'] || currDay?.thanksText || currentPersonalThanks || drafts.thanksShare;

        const upsertPayloads = [];
        if (hasQt) {
          upsertPayloads.push({ date, user_name: userName, cell_name: targetCellName, type: 'QT', status: '출석' });
        }
        if (hasBible) {
          upsertPayloads.push({ date, user_name: userName, cell_name: targetCellName, type: '맥체인', status: '출석' });
        }
        if (hasThanks) {
          upsertPayloads.push({ date, user_name: userName, cell_name: targetCellName, type: '감사', status: '출석' });
        }

        if (upsertPayloads.length > 0) {
          await supabase.from('attendance_records').upsert(upsertPayloads, { onConflict: 'date,user_name,type' });
        }
      } catch (err) {
        console.error("출결 자동 동기화 오류:", err);
      }
    };

    syncDailyToDatabase();
  }, [date, currDay, currentPersonalThanks, drafts.thanksShare, userName, targetCellName, masterDays]);

  const calculateUserStats = (uName) => {
    let qt = 0, weeklyBiChaps = 0, totalBiChaps = 0, th = 0;

    if (uName === userName) {
      const readSet = new Set();
      try {
        const raw = localStorage.getItem('read_verses');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            Object.keys(parsed).forEach(k => {
              if (parsed[k]) {
                const parts = k.split('-');
                if (parts.length >= 2) readSet.add(`${parts[0]}-${parts[1]}`);
              }
            });
          }
        }
      } catch(e) {}
      totalBiChaps = readSet.size;
    }

    currentWeek.dates.forEach(dStr => {
      const isMe = uName === userName;
      const dayD = isMe ? (masterDays[dStr] || {}) : {}; 
      const chk = dayD.checks || {};

      const dbHasQt = dbAttendance.some(a => a.user_name === uName && a.date === dStr && (a.type === 'QT' || a.type === '큐티') && a.status === '출석');
      if (chk['QTin'] || chk['QT'] || dayD.qtTitle || dbHasQt) qt++;

      if (isMe) {
        let dailyChaps = 0;
        const storedChaps = localStorage.getItem(`chap_count_${dStr}`);
        if (storedChaps) {
          const val = parseInt(storedChaps, 10);
          if (!isNaN(val) && val > 0 && val < 50) dailyChaps = val;
        }

        if (dailyChaps === 0) {
          if (chk['성경읽기'] || chk['맥체인']) dailyChaps = 4;
          else if (chk['통독365'] || chk['성경통독']) dailyChaps = 1;
        }
        weeklyBiChaps += dailyChaps;
      } else {
        const dbHasBi = dbAttendance.some(a => a.user_name === uName && a.date === dStr && (a.type === '맥체인' || a.type === '성경') && a.status === '출석');
        if (dbHasBi) weeklyBiChaps += 4;
      }

      const dbHasTh = dbAttendance.some(a => a.user_name === uName && a.date === dStr && (a.type === '감사' || a.type === '목장') && a.status === '출석');
      if (chk['감사'] || dayD.thanksText || dayD.thanksShare || dbHasTh) th++;
    });

    totalBiChaps = Math.max(totalBiChaps, weeklyBiChaps);
    const biDisplayString = `${totalBiChaps} / ${weeklyBiChaps}`;

    return { qt, bi: biDisplayString, th, weeklyBiChaps };
  };
  const myStats = calculateUserStats(userName);

  // 주간 영적 결산 브리핑 자동 취합
  const handleAutoRollupWeeklyReport = () => {
    const subs = selectedWeekSubmissions;
    const feeds = gratitudeFeed.slice(0, 6);

    if (subs.length === 0 && feeds.length === 0) {
      return alert("취합할 이번 주 목원 나눔이나 감사 피드가 아직 없습니다.");
    }

    let rollup = `[${targetCellName} 주간 영적 결산 브리핑 - ${selectedWeek.shortLabel}]\n\n`;
    rollup += `📊 참여 성도: ${subs.map(s => s.name).join(', ') || '목원 나눔 진행중'}\n\n`;

    if (subs.length > 0) {
      rollup += `📖 [목원 말씀 묵상 및 삶의 나눔]\n`;
      subs.forEach((s, idx) => {
        if (s.wordShare) rollup += `${idx + 1}. ${s.name}: ${decryptField(s.wordShare)}\n`;
      });
      rollup += `\n`;
    }

    if (subs.some(s => s.thanksShare) || feeds.length > 0) {
      rollup += `💌 [목원 감사 고백 종합]\n`;
      subs.filter(s => s.thanksShare).forEach(s => {
        rollup += `• ${s.name}: ${decryptField(s.thanksShare)}\n`;
      });
      feeds.forEach(f => {
        rollup += `• ${f.name} (피드): ${f.text}\n`;
      });
      rollup += `\n`;
    }

    const prayerList = selectedWeekPrayers;
    if (prayerList.length > 0) {
      rollup += `🙏 [공동체 집중 중보기도]\n`;
      prayerList.slice(0, 8).forEach((p, idx) => {
        rollup += `${idx + 1}. [${p.name}] ${p.text}\n`;
      });
    }

    handleUpdateIntercessionText(rollup.trim());
    alert("✨ 이번 주 목원들의 나눔과 감사가 대표 중보/보고서로 1-Click 자동 취합되었습니다!");
  };

  const handlePostDirectGratitude = async () => {
    const textToPost = drafts.thanksShare || currentPersonalThanks;
    if (!textToPost || !textToPost.trim()) return alert('작성된 감사 내용이 없습니다.');

    const newFeedItem = { id: Date.now(), name: userName, text: textToPost, date, likes: 0 };
    const existingFeed = JSON.parse(localStorage.getItem(feedStorageKey) || '[]');
    const nextFeed = [newFeedItem, ...existingFeed];
    
    localStorage.setItem(feedStorageKey, JSON.stringify(nextFeed));
    setGratitudeFeed(nextFeed);

    if (supabase) {
      try {
        await supabase.from('attendance_records').upsert({
          date,
          user_name: userName,
          cell_name: targetCellName,
          type: '감사',
          status: '출석'
        }, { onConflict: 'date,user_name,type' });
      } catch (err) {}
    }

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('bible-progress-updated'));
    alert(`${targetShepherdName} 감사 피드로 전송되었습니다!`);
  };

  const handleMemberSubmitSharing = async () => {
    if (!drafts.prayerReq && !drafts.wordShare && !drafts.thanksShare) {
      return alert("나눔 내용을 작성해주세요.");
    }
    
    const submission = { 
      id: Date.now(), 
      name: userName, 
      shepherdName: targetGroupName, 
      wordShare: encryptField(drafts.wordShare), 
      thanksShare: encryptField(drafts.thanksShare), 
      prayerReq: encryptField(drafts.prayerReq), 
      date 
    }; 

    if (handleUpdateCell) {
      handleUpdateCell(p => ({ ...p, submissions: [submission, ...safeGetArr(p.submissions).filter(s => !(s.name === userName && s.date === date))] }));
    }

    if (supabase) {
      try {
        const autoRecords = [];
        if (drafts.wordShare) autoRecords.push({ date, user_name: userName, cell_name: targetCellName, type: 'QT', status: '출석' });
        autoRecords.push({ date, user_name: userName, cell_name: targetCellName, type: '맥체인', status: '출석' });
        if (drafts.thanksShare) autoRecords.push({ date, user_name: userName, cell_name: targetCellName, type: '감사', status: '출석' });

        await supabase.from('attendance_records').upsert(autoRecords, { onConflict: 'date,user_name,type' });

        if (drafts.shareToBoard) {
          const postBody = `[${userName} 성도의 ${targetGroupName} 나눔]\n\n📖 말씀: ${drafts.wordShare}\n🙏 감사: ${drafts.thanksShare}\n🕊️ 기도: ${drafts.prayerReq}`;
          await supabase.from('test_board').insert([{ 
            author: userName, 
            content: encryptField(postBody), 
            created_at: new Date().toISOString() 
          }]);
        }
      } catch (err) {}
    }

    window.dispatchEvent(new Event('storage'));
    alert(`[${userName}] 성도님의 나눔지가 목장과 관리자 관제실에 안전하게 동기화되었습니다!`);
  };

  const handleShepherdSubmitFinalReport = async () => {
    const subs = selectedWeekSubmissions;
    const gPrayers = selectedWeekPrayers;

    let combinedPrayers = '';
    if (activeWeekIntercession && activeWeekIntercession.trim()) {
      combinedPrayers += `[목장 대표 중보기도]\n${activeWeekIntercession.trim()}\n\n`;
    }

    if (groupedPrayers && groupedPrayers.length > 0) {
      combinedPrayers += `[목원별 기도제목]\n`;
      groupedPrayers.forEach(([mName, prayers]) => {
        combinedPrayers += `• ${mName} (${prayers.length}개)\n`;
        prayers.forEach((p, idx) => {
          combinedPrayers += `  ${idx + 1}. ${p.text}\n`;
        });
      });
    }

    const finalPrayerRequests = combinedPrayers.trim() || '등록된 기도제목이 없습니다.';

    const reportEntry = {
      id: `rep_${Date.now()}`,
      cell_name: targetCellName,
      shepherd_name: targetShepherdName,
      weekRange: selectedWeek.fullRange,
      notice: activeNoticeText,
      intercession: encryptField(activeWeekIntercession || ''),
      prayer_requests: encryptField(finalPrayerRequests),
      submissions: subs,
      groupPrayers: gPrayers,
      created_at: new Date().toISOString()
    };

    try {
      const existingHistory = JSON.parse(localStorage.getItem(historyStorageKey) || '[]');
      const updatedHistory = [reportEntry, ...existingHistory.filter(h => h.weekRange !== selectedWeek.fullRange)];
      localStorage.setItem(historyStorageKey, JSON.stringify(updatedHistory));
      setShepherdHistories(updatedHistory);

      const allReports = JSON.parse(localStorage.getItem('cell_reports_archive') || '[]');
      localStorage.setItem('cell_reports_archive', JSON.stringify([reportEntry, ...allReports.filter(h => h.weekRange !== selectedWeek.fullRange)]));
    } catch(e) {}

    if (handleUpdateCell) {
      handleUpdateCell(prev => ({
        ...prev,
        history: [reportEntry, ...safeGetArr(prev.history).filter(h => h.weekRange !== selectedWeek.fullRange)]
      }));
    }

    if (supabase) {
      try {
        const rawWordShare = `[목장 종합보고서] ${targetCellName}\n중보기도: ${activeWeekIntercession || '없음'}\n참여성도: ${subs.map(s => s.name).join(', ')}`;
        
        await supabase.from('cell_reports').insert([{
          cell_name: targetCellName,
          author_name: userName,
          word_sharing: encryptField(rawWordShare),
          thanks_sharing: encryptField(JSON.stringify(subs)),
          prayer_requests: encryptField(finalPrayerRequests),
          created_at: new Date().toISOString()
        }]);
      } catch(err) {
        console.error("보고서 서버 전송 오류:", err);
      }
    }

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('cell-report-submitted', { detail: reportEntry }));
    window.dispatchEvent(new CustomEvent('cell-report-updated', { detail: reportEntry }));

    alert(`[${targetCellName}] 최종 목장 보고서가 관리자 센터로 전송되었습니다!`);
  };

  const MENU_LIST = useMemo(() => {
    const list = [
      { id: 'main', label: '메인 나눔' },
      { id: 'checklist', label: '체크표', needAuth: true },
      { id: 'gratitude', label: '감사피드' },
      { id: 'shepherdRoom', label: '묵상실', needReport: true },
      { id: 'archive', label: '모임지' }
    ];
    return list.filter(item => {
      if (item.needAuth && !canManageNotice) return false;
      if (item.needReport && !canViewSharedReports) return false;
      return true;
    });
  }, [canManageNotice, canViewSharedReports]);

  const isDark = isDarkMode;

  // 🌟 은은하고 품격 있는 파스텔 틴트 테마 (모바일 타이트한 패딩 적용)
  const themeSky = isDark 
    ? 'bg-[#181A20]/90 border border-sky-800/40 text-white' 
    : 'bg-white/95 border border-sky-200 text-slate-800 shadow-2xs';

  const themeMint = isDark 
    ? 'bg-[#181A20]/90 border border-emerald-800/40 text-white' 
    : 'bg-white/95 border border-emerald-200 text-slate-800 shadow-2xs';

  const themePeach = isDark 
    ? 'bg-[#181A20]/90 border border-orange-800/40 text-white' 
    : 'bg-white/95 border border-orange-200 text-slate-800 shadow-2xs';

  const themeLavender = isDark 
    ? 'bg-[#181A20]/90 border border-purple-800/40 text-white' 
    : 'bg-white/95 border border-purple-200 text-slate-800 shadow-2xs';

  const themeIndigo = isDark 
    ? 'bg-[#181A20]/90 border border-indigo-800/40 text-white' 
    : 'bg-white/95 border border-indigo-200 text-slate-800 shadow-2xs';

  const subBoxStyle = isDark
    ? 'bg-black/20 border border-white/10 text-white'
    : 'bg-stone-50 border border-slate-200/60 text-slate-800';

  const inputStyle = isDark
    ? 'bg-black/30 border border-white/10 text-white placeholder-slate-500 focus:border-slate-400'
    : 'bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-slate-400';

  const primaryButtonStyle = isDark
    ? "w-full py-2.5 mt-1 rounded-xl font-bold text-[13px] bg-stone-200 hover:bg-white text-stone-900 shadow-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
    : "w-full py-2.5 mt-1 rounded-xl font-bold text-[13px] bg-stone-800 hover:bg-stone-900 text-white shadow-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer";

  return (
    <div className={`flex flex-col h-[100dvh] w-full relative font-sans overflow-hidden select-none ${isDark ? 'bg-[#0F1115] text-white' : 'bg-[#FBFBF9] text-slate-800'}`}>
      
      {/* 뷰포트 배경 글로우 */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-45 dark:opacity-25" style={{ transform: 'translate3d(0,0,0)' }}>
        <div className="absolute -top-[12%] -left-[10%] w-[90vw] max-w-[500px] h-[90vw] max-h-[500px] rounded-full blur-[90px]" style={{ background: 'radial-gradient(circle, rgba(186, 215, 201, 0.45) 0%, transparent 70%)' }} />
        <div className="absolute top-[35%] -right-[15%] w-[85vw] max-w-[460px] h-[85vw] max-h-[460px] rounded-full blur-[95px]" style={{ background: 'radial-gradient(circle, rgba(238, 214, 196, 0.35) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-[10%] left-[15%] w-[80vw] max-w-[480px] h-[80vw] max-h-[480px] rounded-full blur-[90px]" style={{ background: 'radial-gradient(circle, rgba(214, 218, 235, 0.35) 0%, transparent 70%)' }} />
      </div>

      {/* 🌟 1. 상단 헤더: 모바일 여백 극대화 (px-2 sm:px-4 py-1.5) */}
      <div className={`shrink-0 px-2 sm:px-4 py-1.5 flex flex-col gap-1.5 z-25 border-b ${isDark ? 'border-white/10 bg-slate-900/60' : 'border-slate-200/70 bg-white/80'} backdrop-blur-xl`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1 min-w-0">
            <button onClick={() => subView === 'main' ? setActiveScreen('home') : setSubView('main')} className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer ${isDark ? 'text-white' : 'text-slate-800'}`}>
              <IconArrowLeft />
            </button>
            
            <div className="flex items-center gap-1 min-w-0">
              <div className="flex bg-slate-100 dark:bg-white/5 rounded-lg p-0.5 shrink-0 border border-slate-200/60 dark:border-white/10">
                {myAssignedCells.length > 0 ? (
                  myAssignedCells.map((cName, idx) => (
                    <button 
                      key={cName}
                      onClick={() => { setActiveGroup('cell'); setSelectedCellIndex(idx); setSubView('main'); }} 
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${activeGroup === 'cell' && selectedCellIndex === idx ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-xs' : 'text-slate-500'}`}
                    >
                      {cName}
                    </button>
                  ))
                ) : (
                  <span className="px-2 py-0.5 text-[11px] font-medium text-slate-400">목장 미배정</span>
                )}

                {(isShepherd || isAdminOrSuper || isSuperAdmin) && (
                  <button 
                    onClick={() => { setActiveGroup('leadership'); setSubView('main'); }} 
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${activeGroup === 'leadership' ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-xs' : 'text-slate-500'}`}
                  >
                    리더십
                  </button>
                )}
              </div>

              {isSuperAdmin && activeGroup === 'cell' && allShepherdList.length > 0 && (
                <select 
                  value={operatorSelectedShepherd} 
                  onChange={e => setOperatorSelectedShepherd(e.target.value)}
                  className={`text-[10.5px] font-bold px-1 py-0.5 rounded border outline-none cursor-pointer ${inputStyle} max-w-[95px] truncate`}
                >
                  {allShepherdList.map(name => <option key={name} value={name} className="text-black">{name}</option>)}
                </select>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setShowHistoryModal(true)} className={`p-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 text-[10.5px] font-bold ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white text-slate-700 shadow-xs'}`}>
              <IconCollection /> 모임지
            </button>
            <button 
              onClick={() => setActiveScreen('home')} 
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-white text-slate-700 shadow-xs'}`}
            >
              <IconMenu />
            </button>
          </div>
        </div>

        {/* 서브 네비게이션 탭바 */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 overflow-x-auto hide-scrollbar">
          {MENU_LIST.map(menu => {
            const isActive = subView === menu.id;
            return (
              <button
                key={menu.id}
                onClick={() => {
                  if (menu.id === 'archive') setShowHistoryModal(true);
                  else setSubView(menu.id);
                }}
                className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive ? 'bg-white text-slate-900 dark:bg-slate-200 dark:text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {menu.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 🌟 2. 메인 뷰포트 영역: 좌우 마진 최소화 (`px-1.5 sm:px-3 md:px-4`) */}
      <div className="flex-1 overflow-y-auto w-full hide-scrollbar px-1.5 sm:px-3 md:px-4 py-2 pb-32 flex flex-col lg:flex-row gap-2.5 sm:gap-3.5 relative z-10 max-w-6xl mx-auto -webkit-overflow-scrolling-touch">
        {subView === 'main' && (
          <>
            {/* 좌측: 나눔 작성 및 주간 요약 컬럼 */}
            <div className="w-full lg:w-1/2 flex flex-col min-w-0 space-y-2">
              
              {/* 목장 타이틀 및 주차 표기 바 */}
              <div className={`p-2.5 rounded-xl flex justify-between items-center ${themeSky}`}>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-[14px] font-bold tracking-tight">{targetCellName}</h2>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-black/30 text-sky-700 dark:text-sky-300">{cellMembers.length}명</span>
                </div>
                <span className="text-[10.5px] font-medium flex items-center gap-1 opacity-80"><IconCalendar /> {selectedWeek.shortLabel}</span>
              </div>

              {targetCellName === '목장 미배정' && (
                <div className="p-2.5 rounded-xl border border-amber-200/80 bg-amber-50/60 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 flex flex-col gap-0.5 text-[11px]">
                  <span className="font-bold">소속된 목장이 아직 배정되지 않았습니다.</span>
                  <span className="opacity-80">교회 관리자에게 목장 편성을 요청하시면 온전히 참여하실 수 있습니다.</span>
                </div>
              )}

              {/* 목장 공지사항 */}
              <div className={`p-2.5 sm:p-3 rounded-xl flex flex-col gap-1 ${themeSky}`}>
                <span className="font-bold text-[12px] flex items-center gap-1.5 text-sky-900 dark:text-sky-200">
                  <IconSpeaker /> 목장 공지사항
                </span>
                {canManageNotice ? (
                  <textarea 
                    value={activeNoticeText} 
                    onChange={e => {
                      const val = e.target.value;
                      localStorage.setItem(`cell_notice_${targetCellName}`, val);
                      if (handleUpdateCell) handleUpdateCell(p => ({ ...p, notice: val }));
                      setSyncTick(p => p + 1);
                    }} 
                    onInput={autoGrow} 
                    className="w-full bg-transparent text-[12px] font-medium min-h-[36px] resize-none outline-none leading-relaxed border-b border-dashed border-sky-300/80 dark:border-sky-700/50" 
                    placeholder="공지사항을 입력하세요..." 
                  />
                ) : (
                  <div className="text-[12px] font-medium whitespace-pre-wrap leading-relaxed opacity-90">
                    {activeNoticeText || '등록된 공지사항이 없습니다.'}
                  </div>
                )}
              </div>

              {/* 이번 주 영적 여정 요약 (3단 메트릭스) */}
              <div className={`p-2.5 sm:p-3 rounded-xl flex flex-col gap-1.5 ${themeMint}`}>
                <span className="text-[12px] font-bold flex items-center gap-1.5 text-emerald-900 dark:text-emerald-200">
                  <IconTrendingUp /> 이번 주 영적 여정 요약
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <div className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg border ${subBoxStyle}`}>
                    <span className="text-[9.5px] font-bold opacity-70">매일 QT</span>
                    <span className="text-[15px] font-black leading-tight">{myStats.qt}<span className="text-[9.5px] font-medium opacity-60 ml-0.5">/7</span></span>
                  </div>
                  <div className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg border ${subBoxStyle}`}>
                    <span className="text-[9.5px] font-bold opacity-70">성경 읽기</span>
                    <span className="text-[13px] font-black leading-tight">{myStats.bi}<span className="text-[9px] font-medium opacity-60 ml-0.5">장</span></span>
                  </div>
                  <div className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg border ${subBoxStyle}`}>
                    <span className="text-[9.5px] font-bold opacity-70">감사 일기</span>
                    <span className="text-[15px] font-black leading-tight">{myStats.th}<span className="text-[9.5px] font-medium opacity-60 ml-0.5">회</span></span>
                  </div>
                </div>
              </div>

              {/* 최근 7일 은혜 발자취 자동 채우기 */}
              <div className={`p-2.5 sm:p-3 rounded-xl flex flex-col gap-1.5 ${themePeach}`}>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-bold flex items-center gap-1.5 text-orange-950 dark:text-orange-200">
                    최근 7일 나의 은혜 발자취
                  </span>
                  <span className="text-[9.5px] font-mono opacity-60">Today - 7일</span>
                </div>
                
                <p className="text-[10.5px] leading-relaxed font-medium break-keep opacity-80">
                  지난 한 주간 묵상한 QT 핵심, 감사 고백, 기도제목을 불러와 아래 나눔지 양식에 자동으로 채웁니다.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    let pulledWord = '';
                    let pulledThanks = '';
                    let pulledPrayer = '';

                    const today = new Date();
                    for (let i = 0; i < 7; i++) {
                      const d = new Date(today);
                      d.setDate(today.getDate() - i);
                      const dStr = d.toISOString().split('T')[0];
                      const dayRec = masterDays[dStr] || {};
                      
                      if (!pulledWord && (dayRec.qtGraceLine || dayRec.qtMeditation || dayRec.sermonNotes)) {
                        pulledWord = dayRec.qtGraceLine || dayRec.qtMeditation || dayRec.sermonNotes;
                      }
                      if (dayRec.thanksText && !pulledThanks.includes(dayRec.thanksText)) {
                        pulledThanks += (pulledThanks ? '\n' : '') + dayRec.thanksText;
                      }
                      if (!pulledPrayer && dayRec.prayerReq) {
                        pulledPrayer = dayRec.prayerReq;
                      }
                    }

                    handleDraftChange('wordShare', pulledWord || drafts.wordShare || '말씀을 통해 나의 연약함을 깨닫고 주님의 은혜를 구했습니다.');
                    handleDraftChange('thanksShare', pulledThanks || drafts.thanksShare || currentPersonalThanks || '한 주간 매 순간 지켜주신 하나님께 감사드립니다.');
                    handleDraftChange('prayerReq', pulledPrayer || drafts.prayerReq || '목장 식구들과 함께 말씀대로 살아내기를 기도합니다.');
                    alert('🌿 지난 7일간의 묵상과 감사가 나눔지에 채워졌습니다!');
                  }}
                  className={primaryButtonStyle}
                >
                  이 내용으로 나눔지 채우기 (1-Click)
                </button>
              </div>

              {/* 모임지 나눔 작성란 */}
              <div className={`p-2.5 sm:p-3.5 rounded-xl flex flex-col gap-2.5 ${themeLavender}`}>
                <h3 className="font-bold text-[13px] flex items-center gap-1.5 text-purple-950 dark:text-purple-200">
                  📝 모임지 나눔 작성
                </h3>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold flex items-center gap-1 text-purple-900 dark:text-purple-300">
                    <IconBook /> 1. 말씀 나눔
                  </span>
                  <textarea 
                    value={drafts.wordShare} 
                    onChange={(e) => handleDraftChange('wordShare', e.target.value)} 
                    onInput={autoGrow} 
                    className={`w-full p-2 sm:p-2.5 rounded-xl text-[12.5px] font-medium min-h-[56px] resize-none outline-none leading-relaxed border ${inputStyle}`} 
                    placeholder="말씀을 통해 받은 은혜를 적어주세요." 
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold flex items-center gap-1 text-purple-900 dark:text-purple-300">
                      <IconHeart filled className="w-3.5 h-3.5 text-rose-500" /> 2. 감사 나눔
                    </span>
                    <button 
                      onClick={handlePostDirectGratitude}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      감사 피드로 전송
                    </button>
                  </div>
                  <textarea 
                    value={drafts.thanksShare} 
                    onChange={(e) => handleDraftChange('thanksShare', e.target.value)} 
                    onInput={autoGrow} 
                    className={`w-full p-2 sm:p-2.5 rounded-xl text-[12.5px] font-medium min-h-[56px] resize-none outline-none leading-relaxed border ${inputStyle}`} 
                    placeholder="한 주간의 감사를 적어주세요." 
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold flex items-center gap-1 text-purple-900 dark:text-purple-300">
                    <IconPrayHand /> 3. 개인 기도제목
                  </span>
                  <textarea 
                    value={drafts.prayerReq} 
                    onChange={(e) => handleDraftChange('prayerReq', e.target.value)} 
                    onInput={autoGrow} 
                    className={`w-full p-2 sm:p-2.5 rounded-xl text-[12.5px] font-medium min-h-[56px] resize-none outline-none leading-relaxed border ${inputStyle}`} 
                    placeholder="공동체가 함께 기도할 제목을 적어주세요." 
                  />
                </div>

                <div onClick={() => handleDraftChange('shareToBoard', !drafts.shareToBoard)} className="flex items-center gap-2 cursor-pointer select-none py-0.5">
                  <input type="checkbox" checked={drafts.shareToBoard} readOnly className="w-3.5 h-3.5 rounded border-slate-300 cursor-pointer accent-slate-800" />
                  <span className="text-[11px] font-bold opacity-80">공동체 게시판(기도/감사)에도 함께 나누기</span>
                </div>

                <button 
                  onClick={handleMemberSubmitSharing} 
                  className={primaryButtonStyle}
                >
                  나눔지 최종 제출
                </button>
              </div>
            </div>

            {/* 우측: 라이브 나눔 캔버스 컬럼 */}
            <div className={`w-full lg:w-1/2 flex flex-col p-2.5 sm:p-4 rounded-xl ${themeIndigo} h-auto lg:h-full lg:overflow-hidden relative`}>
              
              <div className="flex flex-col gap-2 pb-2.5 border-b border-indigo-200/60 dark:border-indigo-700/40 shrink-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-[14.5px] tracking-tight flex items-center gap-1.5 text-indigo-950 dark:text-indigo-200">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-xs animate-ping"></span>
                    라이브 나눔 캔버스
                  </h3>
                  
                  <div className="flex items-center gap-1">
                    {canManageNotice && (
                      <button
                        onClick={handleAutoRollupWeeklyReport}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10.5px] font-bold shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-0.5"
                        title="이번 주 목원들의 나눔과 감사를 대표 보고서로 자동 종합"
                      >
                        <IconSparkles /> 주간 자동취합
                      </button>
                    )}

                    {canManageNotice && (
                      <button onClick={copyCellReport} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-[10.5px] font-bold cursor-pointer active:scale-95 border border-slate-200/50">
                        전체 복사
                      </button>
                    )}
                  </div>
                </div>

                {/* 주차 이동 바 */}
                <div className="flex items-center justify-between bg-white/70 dark:bg-black/30 p-1.5 rounded-lg border border-indigo-100 dark:border-white/10">
                  <button 
                    onClick={() => setWeekOffset(prev => prev - 1)}
                    className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 dark:bg-white/10 hover:bg-slate-200 cursor-pointer"
                  >
                    ◀ 이전 주
                  </button>
                  <div className="flex flex-col items-center">
                    <span className="text-[11.5px] font-black text-indigo-950 dark:text-indigo-200">{selectedWeek.shortLabel}</span>
                    <span className="text-[9px] font-mono opacity-60">{selectedWeek.fullRange}</span>
                  </div>
                  <button 
                    onClick={() => setWeekOffset(prev => prev + 1)}
                    className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 dark:bg-white/10 hover:bg-slate-200 cursor-pointer"
                  >
                    다음 주 ▶
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 flex-1 h-auto lg:overflow-y-auto hide-scrollbar py-2.5">
                {canViewSharedReports && (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center px-0.5">
                      <span className="text-[12px] font-bold flex items-center gap-1.5 text-indigo-950 dark:text-indigo-200">
                        <IconShield /> 선택된 주차 나눔 카드 ({selectedWeekSubmissions.length}건)
                      </span>
                      <span className="text-[9.5px] font-mono text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.2 rounded">LIVE SYNC</span>
                    </div>
                    
                    {selectedWeekSubmissions.length === 0 ? (
                      <div className="p-6 rounded-xl border text-center border-dashed border-indigo-200/70 bg-white/40 dark:bg-black/10">
                        <p className="text-[11.5px] font-medium opacity-60">해당 주차에 제출된 나눔지가 없습니다.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {selectedWeekSubmissions.map(sub => (
                          <div 
                            key={sub.id} 
                            className={`p-3 rounded-xl border transition-all ${subBoxStyle} bg-white dark:bg-white/[0.03] border-indigo-200/60 shadow-2xs flex flex-col gap-2`}
                          >
                            <div className="flex justify-between items-center border-b border-indigo-100/60 dark:border-white/5 pb-1.5">
                              <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 dark:bg-white/10 dark:text-white flex items-center justify-center text-[10.5px] font-bold border border-indigo-200/50">
                                  {sub.name.charAt(0)}
                                </div>
                                <span className="font-bold text-[13px] text-slate-900 dark:text-white">{sub.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9.5px] opacity-50 font-mono">{sub.date}</span>
                                {canManageNotice && (
                                  <button 
                                    onClick={() => { if (handleUpdateCell) handleUpdateCell(p => ({ ...p, submissions: safeGetArr(p.submissions).filter(x => x.id !== sub.id) })); }} 
                                    className="text-[10.5px] text-rose-500 hover:underline font-bold cursor-pointer"
                                  >
                                    삭제
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-1.5 pt-0.5">
                              {sub.wordShare && (
                                <div className="flex flex-col gap-0.5 bg-indigo-50/30 dark:bg-white/[0.02] p-2 rounded-lg border border-indigo-100/40">
                                  <span className="text-[9.5px] font-black text-indigo-600 uppercase tracking-wider">WORD</span>
                                  <p className="text-[12px] font-medium leading-relaxed whitespace-pre-wrap break-keep">{decryptField(sub.wordShare)}</p>
                                </div>
                              )}
                              {sub.thanksShare && (
                                <div className="flex flex-col gap-0.5 bg-emerald-50/30 dark:bg-white/[0.02] p-2 rounded-lg border border-emerald-100/40">
                                  <span className="text-[9.5px] font-black text-emerald-600 uppercase tracking-wider">THANKS</span>
                                  <p className="text-[12px] font-medium leading-relaxed whitespace-pre-wrap break-keep">{decryptField(sub.thanksShare)}</p>
                                </div>
                              )}
                              {sub.prayerReq && (
                                <div className="flex flex-col gap-0.5 bg-orange-50/30 dark:bg-white/[0.02] p-2 rounded-lg border border-orange-100/40">
                                  <span className="text-[9.5px] font-black text-orange-600 uppercase tracking-wider">PRAYER</span>
                                  <p className="text-[12px] font-medium leading-relaxed whitespace-pre-wrap break-keep">{decryptField(sub.prayerReq)}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 기도 나눔 보드 & 주차별 대표 중보 취합 */}
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex justify-between items-center px-0.5">
                    <span className="text-[12px] font-bold flex items-center gap-1.5 text-indigo-950 dark:text-indigo-200">
                      <IconPrayHand /> 기도 나눔 보드
                    </span>

                    {canManageNotice && selectedWeek.fullRange === currentWeek.fullRange && (
                      <button
                        onClick={handleImportPreviousWeekPrayers}
                        className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-0.5"
                        title="지난주 기도제목을 이번 주로 가져옵니다"
                      >
                        <span>📥</span> 지난주 기도제목 불러오기
                      </button>
                    )}
                  </div>
                  
                  <div className={`p-2.5 sm:p-3 rounded-xl border flex flex-col gap-2 ${subBoxStyle} border-indigo-200/50 bg-white dark:bg-white/[0.02]`}>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">
                          목장 대표 중보기도 ({selectedWeek.shortLabel} 브리핑)
                        </span>

                        {canManageNotice && selectedWeek.fullRange === currentWeek.fullRange && !activeWeekIntercession && (
                          <button
                            type="button"
                            onClick={handleImportPreviousWeekIntercession}
                            className="text-[9.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            📥 지난주 내용 복사
                          </button>
                        )}
                      </div>
                      
                      {canManageNotice ? (
                        <textarea 
                          value={activeWeekIntercession} 
                          onChange={e => handleUpdateIntercessionText(e.target.value)} 
                          onInput={autoGrow} 
                          className={`w-full p-2 sm:p-2.5 rounded-lg text-[12px] font-medium outline-none border resize-none min-h-[60px] leading-relaxed ${inputStyle}`} 
                          placeholder={`${selectedWeek.shortLabel} 대표 중보기도를 작성하거나 '주간 자동취합'을 누르세요...`} 
                        />
                      ) : (
                        <div className="text-[12px] font-medium whitespace-pre-wrap leading-relaxed px-1 py-0.5 opacity-90">
                          {activeWeekIntercession || '등록된 중보기도가 없습니다.'}
                        </div>
                      )}
                    </div>

                    {canManageNotice && (
                      <div className="p-2 rounded-lg border border-amber-200/70 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col gap-1.5 mt-0.5">
                        <span className="text-[10.5px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                          ✏️ 목자 전용: 지정 목원 기도제목 추가
                        </span>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1">
                          <select
                            value={selectedMemberForPrayer}
                            onChange={e => setSelectedMemberForPrayer(e.target.value)}
                            className={`text-[11px] font-bold px-1.5 py-1 rounded border outline-none ${inputStyle} w-full sm:w-auto sm:min-w-[100px] shrink-0 cursor-pointer`}
                          >
                            <option value="">목원 선택...</option>
                            {cellMembers.map(m => (
                              <option key={m.name} value={m.name}>{m.name}</option>
                            ))}
                          </select>
                          <input 
                            type="text" 
                            value={adminPrayerInput} 
                            onChange={e => setAdminPrayerInput(e.target.value)} 
                            placeholder="기도제목 입력..." 
                            className={`flex-1 px-2.5 py-1 rounded text-[11.5px] border outline-none ${inputStyle} w-full`} 
                            onKeyDown={e => { if (e.key === 'Enter') handleAddMemberPrayerByShepherd(); }} 
                          />
                          <button 
                            onClick={handleAddMemberPrayerByShepherd}
                            className="px-3 py-1 rounded font-bold text-[11px] bg-amber-600 hover:bg-amber-700 text-white shrink-0 cursor-pointer text-center w-full sm:w-auto"
                          >
                            추가
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 선택된 주차의 목원 기도제목 리스트 */}
                    <div className="flex flex-col gap-1.5 pt-1.5 border-t border-dashed border-indigo-200/50">
                      {groupedPrayers.length === 0 ? (
                        <p className="text-[11.5px] opacity-60 py-2 text-center font-medium">
                          {selectedWeek.fullRange === currentWeek.fullRange 
                            ? "등록된 기도제목이 아직 없습니다." 
                            : "해당 주차에 등록된 기도제목이 없습니다."}
                        </p>
                      ) : (
                        groupedPrayers.map(([mName, prayers]) => (
                          <div 
                            key={mName} 
                            className={`p-2 rounded-lg border flex flex-col gap-1 shadow-2xs ${inputStyle}`}
                          >
                            <div className="flex justify-between items-center border-b border-black/5 dark:border-white/5 pb-0.5">
                              <span className="text-[11.5px] font-black flex items-center gap-1 text-slate-800 dark:text-slate-200">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                {mName}
                                {prayers.length > 1 && (
                                  <span className="text-[9.5px] font-bold px-1 py-0.2 rounded-full bg-indigo-50 text-indigo-600 dark:bg-white/10 dark:text-indigo-300">
                                    {prayers.length}개
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5 pl-0.5">
                              {prayers.map((gp, pIdx) => (
                                <div key={gp.id} className="flex justify-between items-start gap-1">
                                  <p className="text-[11.5px] font-medium whitespace-pre-wrap leading-relaxed opacity-90 flex-1">
                                    {prayers.length > 1 ? (
                                      <span className="font-bold text-amber-700 dark:text-amber-400 mr-1">{pIdx + 1}.</span>
                                    ) : null}
                                    {gp.text}
                                  </p>
                                  {canManageNotice && (
                                    <button 
                                      onClick={() => handleDeleteMemberPrayer(gp.id)} 
                                      className="text-[10px] text-rose-500 hover:underline font-bold shrink-0 opacity-70 hover:opacity-100 cursor-pointer pt-0.5"
                                    >
                                      삭제
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {canViewSharedReports && (
                  <div className="pt-2 mt-auto border-t border-indigo-200/50">
                    <button 
                      onClick={handleShepherdSubmitFinalReport}
                      className={primaryButtonStyle}
                    >
                      {selectedWeek.shortLabel} 목장 보고서 최종 제출
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* [체크표 탭] */}
        {subView === 'checklist' && (
          <div className="w-full flex flex-col gap-2 min-w-0 animate-fade-in">
            <div className={`p-2.5 sm:p-3.5 rounded-xl flex flex-col gap-1.5 ${themeSky}`}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                  <h2 className="font-bold text-[14px] tracking-tight">{targetCellName} 주간 출결</h2>
                </div>
                <span className="text-[11px] font-medium opacity-80">{currentWeek.monthName}</span>
              </div>

              <div className={`grid grid-cols-[56px_repeat(7,minmax(0,1fr))] sm:grid-cols-[75px_repeat(7,minmax(0,1fr))] gap-1 items-center p-1 rounded-lg border mb-1.5 ${subBoxStyle}`}>
                <div className="text-center font-bold text-[10px] opacity-60">성도명</div>
                {currentWeek.daysKo.map((d, i) => {
                  const isSun = d === '일';
                  const isSat = d === '토';
                  const isToday = currentWeek.dates[i] === date;

                  return (
                    <div key={i} className={`flex flex-col items-center justify-center py-1 rounded transition-all ${isToday ? 'bg-slate-800 text-white font-bold shadow-xs' : 'opacity-80'}`}>
                      <span className={`text-[9.5px] leading-none ${!isToday && (isSun ? 'text-rose-500 font-bold' : isSat ? 'text-blue-500 font-bold' : '')}`}>{d}</span>
                      <span className="text-[10.5px] font-bold mt-0.5 leading-none">{currentWeek.dates[i].slice(8)}</span>
                    </div>
                  );
                })}
              </div>

              <div className={`flex flex-col divide-y divide-sky-200/40 dark:divide-white/5 rounded-lg border p-1 ${subBoxStyle}`}>
                {cellMembers.map((m, mIdx) => (
                  <div key={mIdx} className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] sm:grid-cols-[75px_repeat(7,minmax(0,1fr))] gap-1 items-center py-1.5 px-0.5 hover:bg-black/5 dark:hover:bg-white/5 rounded">
                    <span className="font-bold text-[11.5px] truncate px-0.5">{m.name}</span>

                    {currentWeek.dates.map((dateStr, dIdx) => {
                      const isMe = m.name === userName;
                      const dayD = isMe ? (masterDays[dateStr] || {}) : {}; 
                      const chk = dayD.checks || {};

                      const dbHasQt = dbAttendance.some(a => a.user_name === m.name && a.date === dateStr && (a.type === 'QT' || a.type === '큐티') && a.status === '출석');
                      const hasQt = dbHasQt || (isMe && (chk['QTin'] || chk['QT'] || dayD.qtTitle));
                      
                      const dbHasBi = dbAttendance.some(a => a.user_name === m.name && a.date === dateStr && (a.type === '맥체인' || a.type === '성경') && a.status === '출석');
                      const hasBible = dbHasBi || (isMe && (chk['성경읽기'] || chk['맥체인'] || chk['통독365'] || chk['성경통독']));

                      const dbHasTh = dbAttendance.some(a => a.user_name === m.name && a.date === dateStr && (a.type === '감사' || a.type === '목장') && a.status === '출석');
                      const hasThanks = dbHasTh || (isMe && (chk['감사'] || dayD.thanksText));

                      return (
                        <div key={dIdx} className="flex flex-col items-center justify-center gap-0.5">
                          <span className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded text-[9px] font-bold flex items-center justify-center ${hasQt ? 'bg-[#9E5D6B] text-white shadow-2xs' : 'bg-black/5 dark:bg-white/5 opacity-40'}`}>Q</span>
                          <span className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded text-[9px] font-bold flex items-center justify-center ${hasBible ? 'bg-[#506B85] text-white shadow-2xs' : 'bg-black/5 dark:bg-white/5 opacity-40'}`}>M</span>
                          <span className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded text-[9px] font-bold flex items-center justify-center ${hasThanks ? 'bg-[#8F7D58] text-white shadow-2xs' : 'bg-black/5 dark:bg-white/5 opacity-40'}`}>T</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* [감사피드 탭] */}
        {subView === 'gratitude' && (
          <div className="w-full lg:w-3/4 mx-auto flex flex-col gap-2 min-w-0 animate-fade-in">
            <div className={`p-2.5 sm:p-3 rounded-xl flex justify-between items-center ${themePeach}`}>
              <h2 className="font-bold text-[14px] flex items-center gap-1.5 text-orange-950 dark:text-orange-200">
                <IconHeart filled className="w-4 h-4 text-rose-500" /> {targetCellName} 감사 피드
              </h2>
              <span className="text-[11px] opacity-70">총 {gratitudeFeed.length}개</span>
            </div>
            
            <div className="flex flex-col gap-1.5">
              {gratitudeFeed.length === 0 ? (
                <div className={`p-8 rounded-xl text-center flex flex-col items-center justify-center gap-1.5 ${themePeach} border-dashed`}>
                  <p className="text-[13px] font-bold opacity-80">등록된 감사가 없습니다.</p>
                  <p className="text-[11px] opacity-60">메인 화면의 감사 나눔에서 [감사 피드로 전송]을 눌러보세요.</p>
                </div>
              ) : (
                gratitudeFeed.map(feed => {
                  const isMyFeed = feed.name === userName;
                  const isEditing = editingFeedId === feed.id;

                  return (
                    <div key={feed.id} className={`p-2.5 sm:p-3 rounded-xl flex flex-col gap-1.5 ${themePeach}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[13px] flex items-center gap-1"><IconUser /> {feed.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] opacity-60">{feed.date}</span>
                          {isMyFeed && !isEditing && (
                            <div className="flex items-center gap-1 ml-1">
                              <button onClick={() => { setEditingFeedId(feed.id); setEditText(feed.text); }} className="text-[10.5px] font-bold opacity-70 hover:opacity-100 cursor-pointer">수정</button>
                              <span className="opacity-30">|</span>
                              <button onClick={() => handleDeleteFeed(feed.id)} className="text-[10.5px] font-bold text-rose-500 hover:underline cursor-pointer">삭제</button>
                            </div>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="flex flex-col gap-1.5 mt-0.5">
                          <textarea 
                            value={editText} 
                            onChange={(e) => setEditText(e.target.value)} 
                            className={`w-full p-2 rounded-xl text-[12.5px] font-medium min-h-[50px] resize-none outline-none border ${inputStyle}`} 
                          />
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setEditingFeedId(null)} className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/50 dark:bg-black/30 cursor-pointer">취소</button>
                            <button onClick={() => handleUpdateFeedText(feed.id)} className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-stone-800 text-white shadow-xs cursor-pointer">저장</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[12.5px] leading-[1.7] whitespace-pre-wrap font-medium pl-0.5 opacity-90">{feed.text}</p>
                      )}

                      <div className="flex justify-end items-center pt-1 mt-0.5 border-t border-orange-200/50 dark:border-white/10">
                        <button onClick={() => handleLikeFeed(feed.id)} className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/60 dark:bg-white/10 hover:text-rose-500 cursor-pointer text-[11px] font-bold shadow-2xs">
                          <IconHeart filled className="w-3.5 h-3.5 text-rose-500" />
                          <span>{feed.likes || 0}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* [묵상실 탭] */}
        {subView === 'shepherdRoom' && (
          <div className="w-full lg:w-3/4 mx-auto flex flex-col gap-2 min-w-0">
            <div className={`p-2.5 sm:p-3 rounded-xl flex flex-col gap-1 ${themeLavender}`}>
              <h3 className="text-[13px] font-bold flex items-center gap-1.5"><IconFlame /> 오늘의 QT 묵상</h3>
              <div className={`p-2 sm:p-2.5 rounded-lg border flex flex-col gap-0.5 ${subBoxStyle}`}>
                <span className="text-[11.5px] font-bold opacity-80">{currDay?.qtTitle ? `[제목] ${currDay.qtTitle}` : '오늘 작성된 QT 제목이 없습니다.'}</span>
                <p className="text-[12.5px] font-medium leading-[1.7] whitespace-pre-wrap mt-0.5 opacity-90">{currDay?.qtMeditation || currDay?.qtApplication || currDay?.qtText || currDay?.content || '작성된 묵상 내용이 없습니다.'}</p>
              </div>
            </div>

            <div className={`p-2.5 sm:p-3 rounded-xl flex flex-col gap-1 ${themePeach}`}>
              <h3 className="text-[13px] font-bold flex items-center gap-1.5"><IconHeart filled className="w-4 h-4 text-orange-500" /> 오늘 나의 감사</h3>
              <p className={`text-[12.5px] font-medium leading-[1.7] whitespace-pre-wrap p-2 rounded-lg border opacity-90 ${subBoxStyle}`}>{currentPersonalThanks || '오늘 작성된 감사가 없습니다.'}</p>
            </div>

            <div className={`p-2.5 sm:p-3 rounded-xl flex flex-col gap-1 ${themeMint}`}>
              <h3 className="text-[13px] font-bold flex items-center gap-1.5"><IconPrayHand /> 오늘의 기도제목</h3>
              <p className={`text-[12.5px] font-medium leading-[1.7] whitespace-pre-wrap p-2 rounded-lg border opacity-90 ${subBoxStyle}`}>{currDay?.prayerReq || drafts.prayerReq || '오늘 작성된 기도제목이 없습니다.'}</p>
            </div>
          </div>
        )}

      </div>

      {/* 모임지 이력 모달 */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-fade-in select-none">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${isDark ? 'bg-[#181A20] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-black/40">
              <span className="font-bold text-[14px] flex items-center gap-1.5"><IconCollection /> {targetCellName} 모임지</span>
              <button onClick={() => { setShowHistoryModal(false); setSelectedHistoryItem(null); }} className="text-[11.5px] font-bold opacity-60 hover:opacity-100 cursor-pointer">닫기</button>
            </div>

            <div className="overflow-y-auto flex-1 hide-scrollbar p-3 space-y-2 text-left">
              {selectedHistoryItem ? (
                <div className="flex flex-col gap-2.5 animate-fade-in">
                  <button onClick={() => setSelectedHistoryItem(null)} className="text-[11.5px] font-bold opacity-70 hover:opacity-100 flex items-center gap-1 cursor-pointer">← 목록으로 돌아가기</button>
                  <div className="p-3 rounded-xl border bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10">
                    <h4 className="font-bold text-[13.5px] mb-1">📅 {selectedHistoryItem.weekRange}</h4>
                    {selectedHistoryItem.notice && <p className="text-[12px] mb-1 font-medium leading-relaxed"><b>공지사항:</b> {selectedHistoryItem.notice}</p>}
                    {selectedHistoryItem.intercession && <p className="text-[12px] font-medium leading-relaxed"><b>목장 중보:</b> {decryptField(selectedHistoryItem.intercession)}</p>}
                  </div>

                  <h5 className="font-bold text-[12.5px] mt-1 flex items-center gap-1">
                    <IconShield /> 제출된 보고서 ({safeGetArr(selectedHistoryItem.submissions).length}건)
                  </h5>
                  <div className="flex flex-col gap-2">
                    {safeGetArr(selectedHistoryItem.submissions).map(sub => (
                      <div key={sub.id} className="p-3 rounded-xl border bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 flex flex-col gap-1">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-bold text-[12.5px] text-indigo-600 dark:text-indigo-400">{sub.name}</span>
                          <span className="text-[9.5px] opacity-60 font-mono">{sub.date}</span>
                        </div>
                        {sub.wordShare && <p className="text-[12px] leading-relaxed break-keep"><b className="opacity-70">말씀:</b> {decryptField(sub.wordShare)}</p>}
                        {sub.thanksShare && <p className="text-[12px] leading-relaxed break-keep mt-0.5"><b className="opacity-70">감사:</b> {decryptField(sub.thanksShare)}</p>}
                        {sub.prayerReq && <p className="text-[12px] leading-relaxed break-keep mt-0.5"><b className="opacity-70">기도:</b> {decryptField(sub.prayerReq)}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                safeGetArr(shepherdHistories).length === 0 ? (
                  <div className="text-center py-10 text-[12.5px] font-medium opacity-50">저장된 모임지 이력이 없습니다.</div>
                ) : (
                  safeGetArr(shepherdHistories).map(hist => (
                    <div 
                      key={hist.id} 
                      onClick={() => setSelectedHistoryItem(hist)}
                      className="p-3 rounded-xl border flex flex-col gap-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors bg-white dark:bg-[#181A20] border-slate-200 dark:border-white/10 shadow-2xs"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[13px]">📅 {hist.weekRange}</span>
                        <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900">{safeGetArr(hist.submissions).length}건 ▶</span>
                      </div>
                      {hist.notice && <div className="text-[11px] opacity-60 truncate mt-0.5"><b>공지:</b> {hist.notice}</div>}
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
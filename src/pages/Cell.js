// src/components/Cell.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Check,
  Copy,
  Heart,
  Menu,
  Plus,
  Sparkles,
  Trash2,
  Edit3,
  X,
  Download
} from 'lucide-react';
import ChurchSketchIcon from '../components/ChurchSketchIcon';
import { supabase } from '../lib/supabase';
import CryptoJS from 'crypto-js';

// =====================================================================
// 보안 표준화: AES-256 종단간 암호화 (구버전 Base64 호환)
// =====================================================================
const CHAT_SECRET_KEY = process.env.REACT_APP_CHAT_SECRET || 'tree-secret-key-2026';
const ENC_PREFIX_V2 = 'ENC_GTC_v2::';
const ENC_PREFIX_V1 = 'ENC_GTC_v1::';

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

export default function Cell({
  t,
  isDarkMode,
  setActiveScreen,
  isSidebarOpen,
  setIsSidebarOpen,
  date,
  currDay = {},
  authUser = {},
  globalCellData = {},
  renderToolbar,
  handleStickerAdd,
  handleMemoAdd,
  handleFileUpload,
  CanvasEngine,
  tool,
  setTool,
  color,
  setColor,
  size = 2,
  sizeSet = () => {},
  StickerLayer,
  onPtrDown,
  updateDay,
  handleUpdateCell,
  handleAutoNumbering,
  handleAutoResize,
  copyCellReport,
  getArr
}) {
  // iOS 야간 다크모드 자동 감지 + 앱 테마 100% 호환
  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const isDark = typeof isDarkMode === 'boolean' ? isDarkMode : systemDark;

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [subView, setSubView] = useState('main');
  const [syncTick, setSyncTick] = useState(0);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2400);
  }, []);

  const safeGetArr = useCallback(
    (arr) => (getArr ? getArr(arr) : Array.isArray(arr) ? arr : []),
    [getArr]
  );

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
        const initialList = [];

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

        const cellIds = memberRows.map((r) => r.cell_id).filter(Boolean);
        const { data: cellData } = await supabase.from('cells').select('id, name').in('id', cellIds);

        if (!isMounted) return;

        if (cellData && cellData.length > 0) {
          initialList.push(...cellData.map((c) => c.name).filter(Boolean));
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
    return () => {
      isMounted = false;
    };
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
        const names = Array.from(new Set(data.map((d) => d.name)));
        setAllShepherdList(names);
        if (!operatorSelectedShepherd && names.length > 0) {
          setOperatorSelectedShepherd(names[0]);
        }
      }
    };
    fetchShepherds();
    return () => {
      isMounted = false;
    };
  }, [isSuperAdmin, operatorSelectedShepherd]);

  useEffect(() => {
    const handleStorageChange = () => setSyncTick((prev) => prev + 1);
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
          currDay?.sermonNote ||
          currDay?.sermonApplication ||
          currDay?.application ||
          currDay?.sermonText ||
          todayNote.content ||
          todayNote.application ||
          todayNote.sermonNote ||
          todayNote.sermonApplication ||
          todayDaily.sermonNote ||
          todayDaily.application ||
          todayDaily.sermonApplication ||
          todayDaily.content ||
          '';
      } catch (_) {}

      const autoWordShare = currDay.wordShare || currDay.sermonNote || currDay.sermonApplication || sermonContent || '';

      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.wordShare && autoWordShare) parsed.wordShare = autoWordShare;
        setDrafts(parsed);
      } else {
        setDrafts({
          wordShare: autoWordShare,
          thanksShare: currentPersonalThanks || '',
          prayerReq: currDay.prayerReq || '',
          shareToBoard: false
        });
      }
    } catch (_) {}
  }, [draftKey, currentPersonalThanks, currDay, date]);

  const handleDraftChange = (field, val) => {
    setDrafts((prev) => {
      const next = { ...prev, [field]: val };
      localStorage.setItem(draftKey, JSON.stringify(next));
      return next;
    });
  };

  const autoGrow = useCallback((e) => {
    if (!e || !e.target) return;
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.max(56, el.scrollHeight)}px`;
  }, []);

  const [cellMembers, setCellMembers] = useState([]);
  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;
    const fetchCellMembersRealtime = async () => {
      try {
        if (isLeadershipView) {
          const { data } = await supabase
            .from('app_users')
            .select('name, role, shepherd_name')
            .in('role', ['목자', '관리자', '운영자', '부목자']);
          if (isMounted) setCellMembers(data || []);
          return;
        }

        if (targetCellName === '목장 미배정') {
          if (isMounted) setCellMembers([]);
          return;
        }

        const { data: cellRow } = await supabase.from('cells').select('id, name').eq('name', targetCellName).maybeSingle();
        if (!isMounted) return;

        if (cellRow) {
          const { data: memberRows } = await supabase
            .from('cell_members')
            .select('user_name, assigned_role')
            .eq('cell_id', cellRow.id);

          if (!isMounted) return;

          if (memberRows && memberRows.length > 0) {
            const names = memberRows.map((m) => m.user_name);
            const { data: userRows } = await supabase
              .from('app_users')
              .select('name, role, shepherd_name')
              .in('name', names);

            if (isMounted) setCellMembers(userRows || memberRows.map((m) => ({ name: m.user_name, role: m.assigned_role })));
          } else {
            if (isMounted) setCellMembers([]);
          }
        } else {
          const { data } = await supabase.from('app_users').select('name, role, shepherd_name');
          if (isMounted) {
            const matched = (data || []).filter((m) => m.shepherd_name === targetCellName || m.name === targetCellName);
            setCellMembers(matched);
          }
        }
      } catch (e) {
        if (isMounted) console.error('Cell members sync error:', e);
      }
    };
    fetchCellMembersRealtime();
    return () => {
      isMounted = false;
    };
  }, [targetCellName, isLeadershipView, syncTick]);

  const feedStorageKey = `gratitude_feed_${targetCellName}`;
  const [gratitudeFeed, setGratitudeFeed] = useState([]);
  const [editingFeedId, setEditingFeedId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    try {
      const savedFeed = JSON.parse(localStorage.getItem(feedStorageKey) || '[]');
      setGratitudeFeed(Array.isArray(savedFeed) ? savedFeed : []);
    } catch (_) {
      setGratitudeFeed([]);
    }
  }, [feedStorageKey]);

  const handleLikeFeed = (id) => {
    const updated = gratitudeFeed.map((f) => (f.id === id ? { ...f, likes: (f.likes || 0) + 1 } : f));
    setGratitudeFeed(updated);
    localStorage.setItem(feedStorageKey, JSON.stringify(updated));
  };

  const handleDeleteFeed = (id) => {
    if (!window.confirm('이 감사 나눔을 삭제하시겠습니까?')) return;
    const updated = gratitudeFeed.filter((f) => f.id !== id);
    setGratitudeFeed(updated);
    localStorage.setItem(feedStorageKey, JSON.stringify(updated));
  };

  const handleUpdateFeedText = (id) => {
    if (!editText.trim()) return showToast('내용을 입력해주세요.');
    const updated = gratitudeFeed.map((f) => (f.id === id ? { ...f, text: editText } : f));
    setGratitudeFeed(updated);
    localStorage.setItem(feedStorageKey, JSON.stringify(updated));
    setEditingFeedId(null);
    setEditText('');
    showToast('감사 나눔이 수정되었습니다.');
  };

  const cellData = globalCellData || { notice: '', submissions: [], groupPrayers: [], cellIntercession: '', history: [] };

  // =====================================================================
  // 주차 계산 로직
  // =====================================================================
  const currentWeek = useMemo(() => {
    const baseDate = date ? new Date(date) : new Date();
    const day = baseDate.getDay();
    const diffToMon = (day === 0 ? -6 : 1) - day;

    const mon = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + diffToMon);
    const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);

    const format = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;

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

    const targetMon = new Date(currentMon.getFullYear(), currentMon.getMonth(), currentMon.getDate() + weekOffset * 7);
    const targetSun = new Date(targetMon.getFullYear(), targetMon.getMonth(), targetMon.getDate() + 6);

    const format = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
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
    } catch (_) {
      setShepherdHistories([]);
    }
  }, [historyStorageKey, cellData.history, safeGetArr]);

  const selectedWeekSubmissions = useMemo(() => {
    const allSubs = safeGetArr(cellData.submissions);
    const weekSet = new Set(selectedWeek.dates);
    return allSubs.filter((s) => s?.date && weekSet.has(s.date));
  }, [cellData.submissions, selectedWeek.dates, safeGetArr]);

  const activeWeekIntercession = useMemo(() => {
    const weekRange = selectedWeek.fullRange;

    const savedWeekIntercession = localStorage.getItem(`cell_intercession_${targetCellName}_${weekRange}`);
    if (savedWeekIntercession !== null) return savedWeekIntercession;

    if (cellData.weeklyIntercessions && cellData.weeklyIntercessions[weekRange] !== undefined) {
      return cellData.weeklyIntercessions[weekRange];
    }

    const hist =
      shepherdHistories.find((h) => h.weekRange === weekRange) ||
      safeGetArr(cellData.history).find((h) => h.weekRange === weekRange);
    if (hist) {
      return decryptField(hist.intercession || hist.prayer_requests || '');
    }

    if (weekRange === currentWeek.fullRange) {
      return cellData.cellIntercession || '';
    }

    return '';
  }, [targetCellName, selectedWeek.fullRange, currentWeek.fullRange, cellData.weeklyIntercessions, cellData.cellIntercession, shepherdHistories, cellData.history, safeGetArr, syncTick]);

  const handleUpdateIntercessionText = (text) => {
    const weekRange = selectedWeek.fullRange;
    localStorage.setItem(`cell_intercession_${targetCellName}_${weekRange}`, text);

    if (handleUpdateCell) {
      handleUpdateCell((prev) => ({
        ...prev,
        cellIntercession: weekRange === currentWeek.fullRange ? text : prev.cellIntercession,
        weeklyIntercessions: {
          ...(prev.weeklyIntercessions || {}),
          [weekRange]: text
        }
      }));
    }

    setSyncTick((p) => p + 1);
  };

  const handleImportPreviousWeekIntercession = () => {
    const prevWeekMon = new Date(currentWeek.monTimestamp - 7 * 24 * 60 * 60 * 1000);
    const prevWeekSun = new Date(prevWeekMon.getTime() + 6 * 24 * 60 * 60 * 1000);
    const format = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    const prevRange = `${format(prevWeekMon)} ~ ${format(prevWeekSun)}`;

    const prevSaved = localStorage.getItem(`cell_intercession_${targetCellName}_${prevRange}`);
    const hist =
      shepherdHistories.find((h) => h.weekRange === prevRange) ||
      safeGetArr(cellData.history).find((h) => h.weekRange === prevRange);
    const prevText = prevSaved || (hist ? decryptField(hist.intercession || '') : '') || cellData.weeklyIntercessions?.[prevRange];

    if (!prevText || !prevText.trim()) {
      return showToast('불러올 지난주 중보기도 내용이 없습니다.');
    }

    handleUpdateIntercessionText(prevText);
    showToast('지난주 중보기도 내용을 불러왔습니다.');
  };

  const selectedWeekPrayers = useMemo(() => {
    const list = safeGetArr(cellData.groupPrayers);
    const weekSet = new Set(selectedWeek.dates);

    const hist =
      shepherdHistories.find((h) => h.weekRange === selectedWeek.fullRange) ||
      safeGetArr(cellData.history).find((h) => h.weekRange === selectedWeek.fullRange);

    let filtered = list.filter((p) => {
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
    const targetMember = selectedMemberForPrayer || cellMembers[0]?.name;
    if (!targetMember) return showToast('기도제목을 입력할 목원을 선택해주세요.');
    if (!adminPrayerInput.trim()) return showToast('기도제목 내용을 입력해주세요.');

    const newPrayerEntry = {
      id: `gp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: targetMember,
      text: adminPrayerInput.trim(),
      date: date || new Date().toISOString().split('T')[0],
      weekRange: selectedWeek.fullRange,
      author: userName
    };

    if (handleUpdateCell) {
      handleUpdateCell((prev) => ({
        ...prev,
        groupPrayers: [newPrayerEntry, ...safeGetArr(prev.groupPrayers)]
      }));
    }

    setAdminPrayerInput('');
    showToast(`${targetMember} 목원의 기도제목이 추가되었습니다.`);
  };

  const handleImportPreviousWeekPrayers = () => {
    const prevWeekMon = new Date(currentWeek.monTimestamp - 7 * 24 * 60 * 60 * 1000);
    const prevWeekSun = new Date(prevWeekMon.getTime() + 6 * 24 * 60 * 60 * 1000);
    const format = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    const prevRange = `${format(prevWeekMon)} ~ ${format(prevWeekSun)}`;

    const hist =
      shepherdHistories.find((h) => h.weekRange === prevRange) ||
      safeGetArr(cellData.history).find((h) => h.weekRange === prevRange);

    const prevList =
      hist?.groupPrayers ||
      safeGetArr(cellData.groupPrayers).filter((p) => p.weekRange === prevRange || (p.date && p.date < currentWeek.monDateStr));

    if (!prevList || prevList.length === 0) {
      return showToast('불러올 지난주 기도제목이 없습니다.');
    }

    const carried = prevList.map((p) => ({
      ...p,
      id: `gp_carry_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      date: currentWeek.monDateStr,
      weekRange: currentWeek.fullRange
    }));

    if (handleUpdateCell) {
      handleUpdateCell((prev) => ({
        ...prev,
        groupPrayers: [...carried, ...safeGetArr(prev.groupPrayers)]
      }));
    }
    showToast(`지난주 기도제목 ${carried.length}건을 불러왔습니다.`);
  };

  const handleDeleteMemberPrayer = (prayerId) => {
    if (!window.confirm('이 기도제목을 삭제하시겠습니까?')) return;
    if (handleUpdateCell) {
      handleUpdateCell((prev) => ({
        ...prev,
        groupPrayers: safeGetArr(prev.groupPrayers).filter((p) => p.id !== prayerId)
      }));
    }
  };

  const groupedPrayers = useMemo(() => {
    const map = new Map();
    selectedWeekPrayers.forEach((item) => {
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
      const { data } = await supabase.from('attendance_records').select('*').in('date', currentWeek.dates);
      if (data) setDbAttendance(data);
    };
    fetchAttendance();

    const channel = supabase
      .channel('cell_attendance_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, () => {
        fetchAttendance();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWeek.dates]);

  const masterDays = useMemo(() => {
    let md = {};
    try {
      ['qt_daily', 'days_data', 'bible_progress', 'mcheyne_daily', 'daily_routine'].forEach((k) => {
        const r = localStorage.getItem(k);
        if (r) md = { ...md, ...JSON.parse(r) };
      });
    } catch (_) {}
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
        [currDay?.mcheyneChecks, currDay?.bible365Checks, currDay?.readingChecks, dayD.readChapters].forEach((c) => {
          if (c && typeof c === 'object') {
            readCnt += Array.isArray(c) ? c.filter(Boolean).length : Object.values(c).filter(Boolean).length;
          }
        });
        const hasBible = chk['성경읽기'] || chk['맥체인'] || chk['통독365'] || chk['성경통독'] || readCnt > 0;
        const hasThanks = chk['감사'] || currDay?.thanksText || currentPersonalThanks || drafts.thanksShare;

        const upsertPayloads = [];
        if (hasQt) upsertPayloads.push({ date, user_name: userName, cell_name: targetCellName, type: 'QT', status: '출석' });
        if (hasBible) upsertPayloads.push({ date, user_name: userName, cell_name: targetCellName, type: '맥체인', status: '출석' });
        if (hasThanks) upsertPayloads.push({ date, user_name: userName, cell_name: targetCellName, type: '감사', status: '출석' });

        if (upsertPayloads.length > 0) {
          await supabase.from('attendance_records').upsert(upsertPayloads, { onConflict: 'date,user_name,type' });
        }
      } catch (err) {
        console.error('출결 자동 동기화 오류:', err);
      }
    };

    syncDailyToDatabase();
  }, [date, currDay, currentPersonalThanks, drafts.thanksShare, userName, targetCellName, masterDays]);

  const calculateUserStats = (uName) => {
    let qt = 0;
    let weeklyBiChaps = 0;
    let totalBiChaps = 0;
    let th = 0;

    if (uName === userName) {
      const readSet = new Set();
      try {
        const raw = localStorage.getItem('read_verses');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            Object.keys(parsed).forEach((k) => {
              if (parsed[k]) {
                const parts = k.split('-');
                if (parts.length >= 2) readSet.add(`${parts[0]}-${parts[1]}`);
              }
            });
          }
        }
      } catch (_) {}
      totalBiChaps = readSet.size;
    }

    currentWeek.dates.forEach((dStr) => {
      const isMe = uName === userName;
      const dayD = isMe ? masterDays[dStr] || {} : {};
      const chk = dayD.checks || {};

      const dbHasQt = dbAttendance.some((a) => a.user_name === uName && a.date === dStr && (a.type === 'QT' || a.type === '큐티') && a.status === '출석');
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
        const dbHasBi = dbAttendance.some((a) => a.user_name === uName && a.date === dStr && (a.type === '맥체인' || a.type === '성경') && a.status === '출석');
        if (dbHasBi) weeklyBiChaps += 4;
      }

      const dbHasTh = dbAttendance.some((a) => a.user_name === uName && a.date === dStr && (a.type === '감사' || a.type === '목장') && a.status === '출석');
      if (chk['감사'] || dayD.thanksText || dayD.thanksShare || dbHasTh) th++;
    });

    totalBiChaps = Math.max(totalBiChaps, weeklyBiChaps);
    return { qt, bi: `${totalBiChaps} / ${weeklyBiChaps}`, th, weeklyBiChaps };
  };
  const myStats = calculateUserStats(userName);

  const handleAutoRollupWeeklyReport = () => {
    const subs = selectedWeekSubmissions;
    const feeds = gratitudeFeed.slice(0, 6);

    if (subs.length === 0 && feeds.length === 0) {
      return showToast('취합할 이번 주 목원 나눔이나 감사 피드가 아직 없습니다.');
    }

    let rollup = `[${targetCellName} 주간 영적 결산 브리핑 - ${selectedWeek.shortLabel}]\n\n`;
    rollup += `참여 성도: ${subs.map((s) => s.name).join(', ') || '목원 나눔 진행중'}\n\n`;

    if (subs.length > 0) {
      rollup += `[목원 말씀 묵상 및 삶의 나눔]\n`;
      subs.forEach((s, idx) => {
        if (s.wordShare) rollup += `${idx + 1}. ${s.name}: ${decryptField(s.wordShare)}\n`;
      });
      rollup += `\n`;
    }

    if (subs.some((s) => s.thanksShare) || feeds.length > 0) {
      rollup += `[목원 감사 고백 종합]\n`;
      subs
        .filter((s) => s.thanksShare)
        .forEach((s) => {
          rollup += `- ${s.name}: ${decryptField(s.thanksShare)}\n`;
        });
      feeds.forEach((f) => {
        rollup += `- ${f.name} (피드): ${f.text}\n`;
      });
      rollup += `\n`;
    }

    if (selectedWeekPrayers.length > 0) {
      rollup += `[공동체 집중 중보기도]\n`;
      selectedWeekPrayers.slice(0, 8).forEach((p, idx) => {
        rollup += `${idx + 1}. [${p.name}] ${p.text}\n`;
      });
    }

    handleUpdateIntercessionText(rollup.trim());
    showToast('주간 목원 나눔과 감사가 대표 중보 브리핑으로 자동 취합되었습니다.');
  };

  const handlePostDirectGratitude = async () => {
    const textToPost = drafts.thanksShare || currentPersonalThanks;
    if (!textToPost || !textToPost.trim()) return showToast('작성된 감사 내용이 없습니다.');

    const newFeedItem = { id: Date.now(), name: userName, text: textToPost, date, likes: 0 };
    const existingFeed = JSON.parse(localStorage.getItem(feedStorageKey) || '[]');
    const nextFeed = [newFeedItem, ...existingFeed];

    localStorage.setItem(feedStorageKey, JSON.stringify(nextFeed));
    setGratitudeFeed(nextFeed);

    if (supabase) {
      try {
        await supabase.from('attendance_records').upsert(
          { date, user_name: userName, cell_name: targetCellName, type: '감사', status: '출석' },
          { onConflict: 'date,user_name,type' }
        );
      } catch (_) {}
    }

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('bible-progress-updated'));
    showToast(`${targetShepherdName} 감사 피드로 전송되었습니다.`);
  };

  const handleMemberSubmitSharing = async () => {
    if (!drafts.prayerReq && !drafts.wordShare && !drafts.thanksShare) {
      return showToast('나눔 내용을 한 항목 이상 작성해주세요.');
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
      handleUpdateCell((p) => ({
        ...p,
        submissions: [submission, ...safeGetArr(p.submissions).filter((s) => !(s.name === userName && s.date === date))]
      }));
    }

    if (supabase) {
      try {
        const autoRecords = [];
        if (drafts.wordShare) autoRecords.push({ date, user_name: userName, cell_name: targetCellName, type: 'QT', status: '출석' });
        autoRecords.push({ date, user_name: userName, cell_name: targetCellName, type: '맥체인', status: '출석' });
        if (drafts.thanksShare) autoRecords.push({ date, user_name: userName, cell_name: targetCellName, type: '감사', status: '출석' });

        await supabase.from('attendance_records').upsert(autoRecords, { onConflict: 'date,user_name,type' });

        if (drafts.shareToBoard) {
          const postBody = `[${userName} 성도의 ${targetGroupName} 나눔]\n\n말씀: ${drafts.wordShare}\n감사: ${drafts.thanksShare}\n기도: ${drafts.prayerReq}`;
          await supabase.from('test_board').insert([
            { author: userName, content: encryptField(postBody), created_at: new Date().toISOString() }
          ]);
        }
      } catch (_) {}
    }

    window.dispatchEvent(new Event('storage'));
    showToast(`${userName} 성도님의 나눔지가 목장에 제출되었습니다.`);
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
        combinedPrayers += `- ${mName} (${prayers.length}개)\n`;
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
      const updatedHistory = [reportEntry, ...existingHistory.filter((h) => h.weekRange !== selectedWeek.fullRange)];
      localStorage.setItem(historyStorageKey, JSON.stringify(updatedHistory));
      setShepherdHistories(updatedHistory);

      const allReports = JSON.parse(localStorage.getItem('cell_reports_archive') || '[]');
      localStorage.setItem(
        'cell_reports_archive',
        JSON.stringify([reportEntry, ...allReports.filter((h) => h.weekRange !== selectedWeek.fullRange)])
      );
    } catch (_) {}

    if (handleUpdateCell) {
      handleUpdateCell((prev) => ({
        ...prev,
        history: [reportEntry, ...safeGetArr(prev.history).filter((h) => h.weekRange !== selectedWeek.fullRange)]
      }));
    }

    if (supabase) {
      try {
        const rawWordShare = `[목장 종합보고서] ${targetCellName}\n중보기도: ${activeWeekIntercession || '없음'}\n참여성도: ${subs.map((s) => s.name).join(', ')}`;

        await supabase.from('cell_reports').insert([
          {
            cell_name: targetCellName,
            author_name: userName,
            word_sharing: encryptField(rawWordShare),
            thanks_sharing: encryptField(JSON.stringify(subs)),
            prayer_requests: encryptField(finalPrayerRequests),
            created_at: new Date().toISOString()
          }
        ]);
      } catch (err) {
        console.error('보고서 서버 전송 오류:', err);
      }
    }

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('cell-report-submitted', { detail: reportEntry }));
    window.dispatchEvent(new CustomEvent('cell-report-updated', { detail: reportEntry }));

    showToast(`${targetCellName} 최종 목장 보고서가 전송되었습니다.`);
  };

  const handlePullLast7Days = () => {
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
    showToast('최근 7일간의 묵상과 감사가 나눔지에 채워졌습니다.');
  };

  const MENU_LIST = useMemo(() => {
    const list = [
      { id: 'main', label: '메인 나눔' },
      { id: 'checklist', label: '주간 출결', needAuth: true },
      { id: 'gratitude', label: '감사 피드' },
      { id: 'shepherdRoom', label: '묵상실', needReport: true }
    ];
    return list.filter((item) => {
      if (item.needAuth && !canManageNotice) return false;
      if (item.needReport && !canViewSharedReports) return false;
      return true;
    });
  }, [canManageNotice, canViewSharedReports]);

  // =====================================================================
  // 글로벌 SaaS 3색 조화 토큰 (다크/라이트 100% 호환)
  // =====================================================================
  const pageBg = isDark ? 'bg-[#0F1115]' : 'bg-[#F5F6F8]';
  const surfaceBg = isDark ? 'bg-[#171A21]' : 'bg-white';
  const subBg = isDark ? 'bg-[#20242E]' : 'bg-[#F1F3F6]';
  const borderClass = isDark ? 'border-[#262B36]' : 'border-[#E5E8EC]';
  const textMain = isDark ? 'text-[#F8FAFC]' : 'text-[#191F28]';
  const textSub = isDark ? 'text-[#94A3B8]' : 'text-[#64748B]';
  const inputClass = isDark
    ? 'bg-[#20242E] border-[#262B36] text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#2563EB]'
    : 'bg-[#F8F9FA] border-[#E5E8EC] text-[#191F28] placeholder:text-[#94A3B8] focus:border-[#2563EB]';
// ==================== PART 1 끝 (아래에 PART 2 이어붙이기) ====================
// ==================== PART 2 시작 ====================

  return (
    <div
      style={{ colorScheme: isDark ? 'dark' : 'light' }}
      className={`flex flex-col h-[100dvh] w-full relative font-sans overflow-hidden select-none ${pageBg} ${textMain}`}
    >
      {/* 토스트 알림 */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[999999] bg-[#191F28] text-white text-[12.5px] font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5 whitespace-nowrap">
          <Check className="w-4 h-4 text-[#34D399]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. 상단 고정 헤더 & 서브 네비게이션 */}
      <header className={`shrink-0 px-3 sm:px-5 pt-2 pb-2 border-b ${borderClass} ${surfaceBg} z-30 space-y-2`}>
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => (subView === 'main' ? setActiveScreen('home') : setSubView('main'))}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer ${textMain}`}
              aria-label="뒤로 가기"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <ChurchSketchIcon name="community" className="w-5 h-5 shrink-0 hidden sm:block" isDarkMode={isDark} />

            {/* 소속 목장 & 리더십 전환 칩 */}
            <div className={`flex items-center p-0.5 rounded-lg ${subBg} border ${borderClass} overflow-x-auto hide-scrollbar min-w-0`}>
              {myAssignedCells.length > 0 ? (
                myAssignedCells.map((cName, idx) => {
                  const active = activeGroup === 'cell' && selectedCellIndex === idx;
                  return (
                    <button
                      key={cName}
                      type="button"
                      onClick={() => {
                        setActiveGroup('cell');
                        setSelectedCellIndex(idx);
                        setSubView('main');
                      }}
                      className={`px-2.5 py-1 rounded-md text-[12px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                        active ? `${surfaceBg} ${textMain} shadow-2xs` : textSub
                      }`}
                    >
                      {cName}
                    </button>
                  );
                })
              ) : (
                <span className={`px-2.5 py-1 text-[12px] font-medium ${textSub}`}>목장 미배정</span>
              )}

              {(isShepherd || isAdminOrSuper || isSuperAdmin) && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveGroup('leadership');
                    setSubView('main');
                  }}
                  className={`px-2.5 py-1 rounded-md text-[12px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    activeGroup === 'leadership' ? `${surfaceBg} text-[#2563EB] shadow-2xs` : textSub
                  }`}
                >
                  리더십
                </button>
              )}
            </div>

            {isSuperAdmin && activeGroup === 'cell' && allShepherdList.length > 0 && (
              <select
                value={operatorSelectedShepherd}
                onChange={(e) => setOperatorSelectedShepherd(e.target.value)}
                className={`h-8 px-2 rounded-lg border text-[12px] font-bold outline-none cursor-pointer max-w-[115px] truncate shrink-0 ${inputClass}`}
              >
                {allShepherdList.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className={`h-8 px-2.5 rounded-lg border ${borderClass} ${subBg} ${textMain} text-[12px] font-bold flex items-center gap-1 cursor-pointer`}
            >
              <ChurchSketchIcon name="note" className="w-3.5 h-3.5" isDarkMode={isDark} />
              <span>모임지</span>
            </button>
            <button
              type="button"
              onClick={() => (setIsSidebarOpen ? setIsSidebarOpen(!isSidebarOpen) : setActiveScreen('home'))}
              className={`h-8 w-8 rounded-lg border ${borderClass} ${subBg} ${textMain} flex items-center justify-center cursor-pointer`}
              aria-label="메뉴"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 서브 네비게이션 탭 */}
        <div className="max-w-[1280px] mx-auto">
          <div className={`grid grid-cols-${MENU_LIST.length} p-0.5 rounded-xl ${subBg} border ${borderClass} gap-0.5`}>
            {MENU_LIST.map((menu) => {
              const isActive = subView === menu.id;
              return (
                <button
                  key={menu.id}
                  type="button"
                  onClick={() => setSubView(menu.id)}
                  className={`py-1.5 px-2 rounded-lg text-[12.5px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    isActive ? `${surfaceBg} text-[#2563EB] shadow-2xs` : textSub
                  }`}
                >
                  {menu.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* 2. 메인 스크롤 뷰포트 (위에서 아래로 자연스럽게 흐르는 구조 · PC 2단 / 모바일 1단) */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-5 pt-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] hide-scrollbar">
        <div className="max-w-[1280px] mx-auto w-full">
          {subView === 'main' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* 좌측 6컬럼: 목장 현황 -> 공지 -> 주간 영적 요약 -> 7일 불러오기 -> 나눔 작성 */}
              <div className="lg:col-span-6 space-y-3 min-w-0">
                {/* 목장 헤더 & 인원 · 주차 요약 */}
                <section className={`${surfaceBg} rounded-xl border ${borderClass} p-3.5 flex items-center justify-between gap-2`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 className="text-[16px] font-bold tracking-tight truncate">{targetCellName}</h2>
                    <span className="px-2 py-0.5 rounded-md bg-[#2563EB]/10 text-[#2563EB] text-[11.5px] font-bold shrink-0">
                      {cellMembers.length}명
                    </span>
                  </div>
                  <span className={`text-[12px] font-medium flex items-center gap-1 ${textSub} shrink-0`}>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{selectedWeek.shortLabel}</span>
                  </span>
                </section>

                {targetCellName === '목장 미배정' && (
                  <div className="p-3 rounded-xl border border-[#D97706]/40 bg-[#D97706]/10 text-[#D97706] text-[12.5px] space-y-0.5">
                    <p className="font-bold">소속된 목장이 아직 배정되지 않았습니다.</p>
                    <p className="opacity-85">교회 관리자에게 목장 편성을 요청하시면 모든 나눔에 참여하실 수 있습니다.</p>
                  </div>
                )}

                {/* 목장 공지사항 */}
                <section className={`${surfaceBg} rounded-xl border ${borderClass} p-3.5 space-y-2`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold flex items-center gap-1.5">
                      <ChurchSketchIcon name="bell" className="w-4 h-4" isDarkMode={isDark} />
                      <span>목장 공지사항</span>
                    </span>
                    {canManageNotice && <span className={`text-[11px] ${textSub}`}>자동 저장</span>}
                  </div>
                  {canManageNotice ? (
                    <textarea
                      value={activeNoticeText}
                      onChange={(e) => {
                        const val = e.target.value;
                        localStorage.setItem(`cell_notice_${targetCellName}`, val);
                        if (handleUpdateCell) handleUpdateCell((p) => ({ ...p, notice: val }));
                        setSyncTick((p) => p + 1);
                      }}
                      onInput={autoGrow}
                      rows={2}
                      className={`w-full p-2.5 rounded-xl border text-[13.5px] leading-relaxed outline-none resize-none select-text ${inputClass}`}
                      placeholder="목장 모임 장소, 시간, 공지사항을 입력하세요."
                    />
                  ) : (
                    <p className={`text-[13.5px] leading-relaxed whitespace-pre-wrap ${textSub}`}>
                      {activeNoticeText || '등록된 공지사항이 없습니다.'}
                    </p>
                  )}
                </section>

                {/* 이번 주 영적 여정 요약 (3단 메트릭스) */}
                <section className={`${surfaceBg} rounded-xl border ${borderClass} p-3.5 space-y-2.5`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold flex items-center gap-1.5">
                      <ChurchSketchIcon name="chart" className="w-4 h-4" isDarkMode={isDark} />
                      <span>이번 주 영적 여정</span>
                    </span>
                    <button
                      type="button"
                      onClick={handlePullLast7Days}
                      className="px-2.5 py-1 rounded-lg bg-[#0D9488]/10 text-[#0D9488] text-[11.5px] font-bold flex items-center gap-1 cursor-pointer hover:bg-[#0D9488]/20 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>최근 7일 불러오기</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className={`p-2.5 rounded-xl border ${borderClass} ${subBg} text-center`}>
                      <span className={`text-[11px] font-bold ${textSub} block`}>매일 QT</span>
                      <span className="text-[18px] font-bold text-[#2563EB]">
                        {myStats.qt}
                        <span className={`text-[11px] font-medium ${textSub} ml-0.5`}>/7</span>
                      </span>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${borderClass} ${subBg} text-center`}>
                      <span className={`text-[11px] font-bold ${textSub} block`}>성경 읽기</span>
                      <span className="text-[15px] font-bold text-[#0D9488] block mt-0.5">
                        {myStats.bi}
                        <span className={`text-[10.5px] font-medium ${textSub} ml-0.5`}>장</span>
                      </span>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${borderClass} ${subBg} text-center`}>
                      <span className={`text-[11px] font-bold ${textSub} block`}>감사 일기</span>
                      <span className="text-[18px] font-bold text-[#D97706]">
                        {myStats.th}
                        <span className={`text-[11px] font-medium ${textSub} ml-0.5`}>회</span>
                      </span>
                    </div>
                  </div>
                </section>

                {/* 모임지 나눔 작성 */}
                <section className={`${surfaceBg} rounded-xl border ${borderClass} p-3.5 space-y-3`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-bold flex items-center gap-1.5">
                      <ChurchSketchIcon name="pencil" className="w-4 h-4" isDarkMode={isDark} />
                      <span>나의 모임지 나눔 작성</span>
                    </h3>
                    <span className={`text-[11px] font-mono ${textSub}`}>{date}</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] font-bold flex items-center gap-1.5 text-[#2563EB]">
                      <ChurchSketchIcon name="bible" className="w-3.5 h-3.5" isDarkMode={isDark} />
                      <span>1. 말씀 나눔</span>
                    </label>
                    <textarea
                      value={drafts.wordShare}
                      onChange={(e) => handleDraftChange('wordShare', e.target.value)}
                      onInput={autoGrow}
                      rows={3}
                      className={`w-full p-2.5 rounded-xl border text-[13.5px] leading-relaxed outline-none resize-none select-text ${inputClass}`}
                      placeholder="한 주간 말씀을 통해 받은 은혜와 적용을 나눠주세요."
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-bold flex items-center gap-1.5 text-[#0D9488]">
                        <ChurchSketchIcon name="hand-heart" className="w-3.5 h-3.5" isDarkMode={isDark} />
                        <span>2. 감사 나눔</span>
                      </label>
                      <button
                        type="button"
                        onClick={handlePostDirectGratitude}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${subBg} ${textMain} hover:text-[#2563EB] cursor-pointer`}
                      >
                        감사 피드로 바로 전송
                      </button>
                    </div>
                    <textarea
                      value={drafts.thanksShare}
                      onChange={(e) => handleDraftChange('thanksShare', e.target.value)}
                      onInput={autoGrow}
                      rows={2}
                      className={`w-full p-2.5 rounded-xl border text-[13.5px] leading-relaxed outline-none resize-none select-text ${inputClass}`}
                      placeholder="한 주간의 감사 제목을 기록해주세요."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] font-bold flex items-center gap-1.5 text-[#D97706]">
                      <ChurchSketchIcon name="prayer-hands" className="w-3.5 h-3.5" isDarkMode={isDark} />
                      <span>3. 개인 기도제목</span>
                    </label>
                    <textarea
                      value={drafts.prayerReq}
                      onChange={(e) => handleDraftChange('prayerReq', e.target.value)}
                      onInput={autoGrow}
                      rows={2}
                      className={`w-full p-2.5 rounded-xl border text-[13.5px] leading-relaxed outline-none resize-none select-text ${inputClass}`}
                      placeholder="공동체가 함께 기도할 제목을 적어주세요."
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer py-0.5">
                    <input
                      type="checkbox"
                      checked={drafts.shareToBoard}
                      onChange={() => handleDraftChange('shareToBoard', !drafts.shareToBoard)}
                      className="w-4 h-4 rounded accent-[#2563EB] cursor-pointer"
                    />
                    <span className={`text-[12.5px] font-medium ${textSub}`}>공동체 게시판(기도/감사)에도 함께 나누기</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleMemberSubmitSharing}
                    className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[13.5px] cursor-pointer transition-colors"
                  >
                    나눔지 제출하기
                  </button>
                </section>
              </div>

              {/* 우측 6컬럼: 라이브 나눔 캔버스 & 기도 나눔 보드 */}
              <div className="lg:col-span-6 space-y-3 min-w-0">
                <section className={`${surfaceBg} rounded-xl border ${borderClass} p-3.5 space-y-3`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
                      <h3 className="text-[15px] font-bold">라이브 나눔 캔버스</h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {canManageNotice && (
                        <button
                          type="button"
                          onClick={handleAutoRollupWeeklyReport}
                          className="h-8 px-2.5 rounded-lg bg-[#D97706] text-white text-[11.5px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>주간 자동취합</span>
                        </button>
                      )}
                      {canManageNotice && (
                        <button
                          type="button"
                          onClick={copyCellReport}
                          className={`h-8 px-2.5 rounded-lg border ${borderClass} ${subBg} ${textMain} text-[11.5px] font-bold flex items-center gap-1 cursor-pointer`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>복사</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 주차 이동 컨트롤 */}
                  <div className={`flex items-center justify-between p-1.5 rounded-xl ${subBg} border ${borderClass}`}>
                    <button
                      type="button"
                      onClick={() => setWeekOffset((prev) => prev - 1)}
                      className={`h-8 px-2.5 rounded-lg ${surfaceBg} border ${borderClass} text-[12px] font-bold flex items-center gap-1 cursor-pointer`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>이전 주</span>
                    </button>
                    <div className="text-center">
                      <span className="text-[13px] font-bold block">{selectedWeek.shortLabel}</span>
                      <span className={`text-[10.5px] font-mono ${textSub}`}>{selectedWeek.fullRange}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWeekOffset((prev) => prev + 1)}
                      className={`h-8 px-2.5 rounded-lg ${surfaceBg} border ${borderClass} text-[12px] font-bold flex items-center gap-1 cursor-pointer`}
                    >
                      <span>다음 주</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 제출된 목원 나눔 카드 */}
                  {canViewSharedReports && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[12.5px] font-bold">
                          제출된 나눔 ({selectedWeekSubmissions.length}건)
                        </span>
                        <span className="text-[10.5px] font-mono font-bold text-[#0D9488]">LIVE</span>
                      </div>

                      {selectedWeekSubmissions.length === 0 ? (
                        <div className={`p-6 rounded-xl border border-dashed ${borderClass} text-center text-[12.5px] ${textSub}`}>
                          해당 주차에 제출된 나눔지가 없습니다.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedWeekSubmissions.map((sub) => (
                            <article key={sub.id} className={`p-3 rounded-xl border ${borderClass} ${subBg} space-y-2`}>
                              <div className={`flex items-center justify-between pb-1.5 border-b ${borderClass}`}>
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-[#2563EB]/15 text-[#2563EB] flex items-center justify-center text-[11px] font-bold">
                                    {sub.name.charAt(0)}
                                  </span>
                                  <span className="text-[13.5px] font-bold">{sub.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[11px] font-mono ${textSub}`}>{sub.date}</span>
                                  {canManageNotice && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (handleUpdateCell) {
                                          handleUpdateCell((p) => ({
                                            ...p,
                                            submissions: safeGetArr(p.submissions).filter((x) => x.id !== sub.id)
                                          }));
                                        }
                                      }}
                                      className="text-rose-500 hover:underline text-[11px] font-bold cursor-pointer"
                                    >
                                      삭제
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-1.5 text-[13px] leading-relaxed">
                                {sub.wordShare && (
                                  <div>
                                    <span className="text-[10.5px] font-bold text-[#2563EB] block">말씀</span>
                                    <p className="whitespace-pre-wrap break-keep">{decryptField(sub.wordShare)}</p>
                                  </div>
                                )}
                                {sub.thanksShare && (
                                  <div>
                                    <span className="text-[10.5px] font-bold text-[#0D9488] block">감사</span>
                                    <p className="whitespace-pre-wrap break-keep">{decryptField(sub.thanksShare)}</p>
                                  </div>
                                )}
                                {sub.prayerReq && (
                                  <div>
                                    <span className="text-[10.5px] font-bold text-[#D97706] block">기도</span>
                                    <p className="whitespace-pre-wrap break-keep">{decryptField(sub.prayerReq)}</p>
                                  </div>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 기도 나눔 보드 & 대표 중보 */}
                  <div className={`pt-3 border-t ${borderClass} space-y-2.5`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold flex items-center gap-1.5">
                        <ChurchSketchIcon name="prayer-hands" className="w-4 h-4" isDarkMode={isDark} />
                        <span>기도 나눔 보드</span>
                      </span>
                      {canManageNotice && selectedWeek.fullRange === currentWeek.fullRange && (
                        <button
                          type="button"
                          onClick={handleImportPreviousWeekPrayers}
                          className="text-[11.5px] font-bold text-[#2563EB] hover:underline cursor-pointer"
                        >
                          지난주 기도제목 불러오기
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11.5px] font-bold ${textSub}`}>
                          목장 대표 중보기도 ({selectedWeek.shortLabel})
                        </span>
                        {canManageNotice && selectedWeek.fullRange === currentWeek.fullRange && !activeWeekIntercession && (
                          <button
                            type="button"
                            onClick={handleImportPreviousWeekIntercession}
                            className="text-[11px] font-bold text-[#0D9488] hover:underline cursor-pointer"
                          >
                            지난주 내용 복사
                          </button>
                        )}
                      </div>

                      {canManageNotice ? (
                        <textarea
                          value={activeWeekIntercession}
                          onChange={(e) => handleUpdateIntercessionText(e.target.value)}
                          onInput={autoGrow}
                          rows={3}
                          className={`w-full p-2.5 rounded-xl border text-[13px] leading-relaxed outline-none resize-none select-text ${inputClass}`}
                          placeholder="목장 대표 중보기도를 작성하거나 상단의 '주간 자동취합'을 눌러주세요."
                        />
                      ) : (
                        <p className={`p-3 rounded-xl border ${borderClass} ${subBg} text-[13px] leading-relaxed whitespace-pre-wrap`}>
                          {activeWeekIntercession || '등록된 대표 중보기도가 없습니다.'}
                        </p>
                      )}
                    </div>

                    {canManageNotice && (
                      <div className={`p-2.5 rounded-xl border ${borderClass} ${subBg} space-y-2`}>
                        <span className="text-[11.5px] font-bold text-[#D97706] block">지정 목원 기도제목 추가</span>
                        <div className="flex flex-col sm:flex-row gap-1.5">
                          <select
                            value={selectedMemberForPrayer}
                            onChange={(e) => setSelectedMemberForPrayer(e.target.value)}
                            className={`h-9 px-2 rounded-lg border text-[12.5px] font-bold outline-none cursor-pointer sm:w-28 shrink-0 ${inputClass}`}
                          >
                            <option value="">목원 선택</option>
                            {cellMembers.map((m) => (
                              <option key={m.name} value={m.name}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={adminPrayerInput}
                            onChange={(e) => setAdminPrayerInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddMemberPrayerByShepherd();
                            }}
                            placeholder="기도제목 입력..."
                            className={`flex-1 h-9 px-3 rounded-lg border text-[12.5px] outline-none select-text ${inputClass}`}
                          />
                          <button
                            type="button"
                            onClick={handleAddMemberPrayerByShepherd}
                            className="h-9 px-3.5 rounded-lg bg-[#0D9488] text-white font-bold text-[12px] flex items-center justify-center gap-1 cursor-pointer shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>추가</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 목원별 기도제목 목록 */}
                    <div className="space-y-1.5">
                      {groupedPrayers.length === 0 ? (
                        <p className={`py-4 text-center text-[12.5px] ${textSub}`}>등록된 목원 기도제목이 없습니다.</p>
                      ) : (
                        groupedPrayers.map(([mName, prayers]) => (
                          <div key={mName} className={`p-2.5 rounded-xl border ${borderClass} ${subBg} space-y-1`}>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                              <span className="text-[12.5px] font-bold">{mName}</span>
                              {prayers.length > 1 && (
                                <span className={`text-[10.5px] font-bold ${textSub}`}>({prayers.length})</span>
                              )}
                            </div>
                            <div className="space-y-1 pl-3.5">
                              {prayers.map((gp, pIdx) => (
                                <div key={gp.id} className="flex items-start justify-between gap-2">
                                  <p className="text-[12.5px] leading-relaxed flex-1">
                                    {prayers.length > 1 && <b className="text-[#2563EB] mr-1">{pIdx + 1}.</b>}
                                    {gp.text}
                                  </p>
                                  {canManageNotice && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMemberPrayer(gp.id)}
                                      className={`p-1 ${textSub} hover:text-rose-500 cursor-pointer shrink-0`}
                                      aria-label="삭제"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {canViewSharedReports && (
                      <button
                        type="button"
                        onClick={handleShepherdSubmitFinalReport}
                        className="w-full py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-[13.5px] cursor-pointer transition-colors mt-1"
                      >
                        {selectedWeek.shortLabel} 목장 보고서 최종 제출
                      </button>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* [주간 출결 체크표 탭] */}
          {subView === 'checklist' && (
            <section className={`${surfaceBg} rounded-xl border ${borderClass} p-4 space-y-3`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[15.5px] font-bold">{targetCellName} 주간 영적 출결</h2>
                  <p className={`text-[12px] ${textSub}`}>Q: 매일 QT · M: 성경/맥체인 · T: 감사 일기</p>
                </div>
                <span className={`text-[12.5px] font-bold ${textSub}`}>{currentWeek.monthName}</span>
              </div>

              <div className={`grid grid-cols-[64px_repeat(7,minmax(0,1fr))] sm:grid-cols-[90px_repeat(7,minmax(0,1fr))] gap-1 items-center p-1.5 rounded-xl ${subBg} border ${borderClass}`}>
                <div className={`text-center text-[11px] font-bold ${textSub}`}>성도</div>
                {currentWeek.daysKo.map((d, i) => {
                  const isToday = currentWeek.dates[i] === date;
                  return (
                    <div
                      key={i}
                      className={`py-1 rounded-lg text-center ${isToday ? 'bg-[#2563EB] text-white' : ''}`}
                    >
                      <span className={`text-[10px] font-bold block ${!isToday && d === '일' ? 'text-rose-500' : !isToday && d === '토' ? 'text-[#2563EB]' : ''}`}>
                        {d}
                      </span>
                      <span className="text-[11.5px] font-bold">{currentWeek.dates[i].slice(8)}</span>
                    </div>
                  );
                })}
              </div>

              <div className={`divide-y ${isDark ? 'divide-[#262B36]' : 'divide-[#EEF0F3]'} border ${borderClass} rounded-xl overflow-hidden`}>
                {cellMembers.map((m, mIdx) => (
                  <div
                    key={mIdx}
                    className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] sm:grid-cols-[90px_repeat(7,minmax(0,1fr))] gap-1 items-center py-2 px-1.5"
                  >
                    <span className="text-[12.5px] font-bold truncate text-center">{m.name}</span>
                    {currentWeek.dates.map((dateStr, dIdx) => {
                      const isMe = m.name === userName;
                      const dayD = isMe ? masterDays[dateStr] || {} : {};
                      const chk = dayD.checks || {};

                      const hasQt =
                        dbAttendance.some((a) => a.user_name === m.name && a.date === dateStr && (a.type === 'QT' || a.type === '큐티') && a.status === '출석') ||
                        (isMe && (chk['QTin'] || chk['QT'] || dayD.qtTitle));
                      const hasBible =
                        dbAttendance.some((a) => a.user_name === m.name && a.date === dateStr && (a.type === '맥체인' || a.type === '성경') && a.status === '출석') ||
                        (isMe && (chk['성경읽기'] || chk['맥체인'] || chk['통독365'] || chk['성경통독']));
                      const hasThanks =
                        dbAttendance.some((a) => a.user_name === m.name && a.date === dateStr && (a.type === '감사' || a.type === '목장') && a.status === '출석') ||
                        (isMe && (chk['감사'] || dayD.thanksText));

                      return (
                        <div key={dIdx} className="flex flex-col items-center gap-0.5">
                          <span className={`w-4 h-4 rounded text-[9.5px] font-bold flex items-center justify-center ${hasQt ? 'bg-[#2563EB] text-white' : `${subBg} ${textSub} opacity-45`}`}>
                            Q
                          </span>
                          <span className={`w-4 h-4 rounded text-[9.5px] font-bold flex items-center justify-center ${hasBible ? 'bg-[#0D9488] text-white' : `${subBg} ${textSub} opacity-45`}`}>
                            M
                          </span>
                          <span className={`w-4 h-4 rounded text-[9.5px] font-bold flex items-center justify-center ${hasThanks ? 'bg-[#D97706] text-white' : `${subBg} ${textSub} opacity-45`}`}>
                            T
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* [감사 피드 탭] */}
          {subView === 'gratitude' && (
            <div className="max-w-[760px] mx-auto space-y-2.5">
              <div className={`${surfaceBg} rounded-xl border ${borderClass} p-3.5 flex items-center justify-between`}>
                <h2 className="text-[15px] font-bold flex items-center gap-1.5">
                  <ChurchSketchIcon name="hand-heart" className="w-4 h-4" isDarkMode={isDark} />
                  <span>{targetCellName} 감사 피드</span>
                </h2>
                <span className={`text-[12px] font-bold ${textSub}`}>총 {gratitudeFeed.length}건</span>
              </div>

              {gratitudeFeed.length === 0 ? (
                <div className={`${surfaceBg} rounded-xl border border-dashed ${borderClass} p-10 text-center space-y-1`}>
                  <p className="text-[14px] font-bold">등록된 감사가 없습니다.</p>
                  <p className={`text-[12.5px] ${textSub}`}>메인 나눔의 감사 작성란에서 &apos;감사 피드로 바로 전송&apos;을 눌러보세요.</p>
                </div>
              ) : (
                gratitudeFeed.map((feed) => {
                  const isMyFeed = feed.name === userName;
                  const isEditing = editingFeedId === feed.id;
                  return (
                    <article key={feed.id} className={`${surfaceBg} rounded-xl border ${borderClass} p-3.5 space-y-2`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#D97706]/15 text-[#D97706] flex items-center justify-center text-[11px] font-bold">
                            {feed.name.charAt(0)}
                          </span>
                          <span className="text-[13.5px] font-bold">{feed.name}</span>
                          <span className={`text-[11.5px] font-mono ${textSub}`}>{feed.date}</span>
                        </div>
                        {isMyFeed && !isEditing && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingFeedId(feed.id);
                                setEditText(feed.text);
                              }}
                              className={`text-[11.5px] font-bold ${textSub} hover:text-[#2563EB] flex items-center gap-0.5 cursor-pointer`}
                            >
                              <Edit3 className="w-3.5 h-3.5" /> 수정
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFeed(feed.id)}
                              className="text-[11.5px] font-bold text-rose-500 cursor-pointer"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            className={`w-full p-2.5 rounded-xl border text-[13.5px] outline-none resize-none select-text ${inputClass}`}
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingFeedId(null)}
                              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold ${subBg} cursor-pointer`}
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateFeedText(feed.id)}
                              className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-[#2563EB] text-white cursor-pointer"
                            >
                              저장
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-keep">{feed.text}</p>
                      )}

                      <div className={`pt-2 border-t ${borderClass} flex justify-end`}>
                        <button
                          type="button"
                          onClick={() => handleLikeFeed(feed.id)}
                          className={`px-3 py-1 rounded-full ${subBg} text-[12px] font-bold flex items-center gap-1.5 cursor-pointer hover:text-rose-500`}
                        >
                          <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
                          <span>아멘 {feed.likes || 0}</span>
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          )}

          {/* [묵상실 탭] */}
          {subView === 'shepherdRoom' && (
            <div className="max-w-[760px] mx-auto space-y-3">
              <section className={`${surfaceBg} rounded-xl border ${borderClass} p-4 space-y-2`}>
                <h3 className="text-[14px] font-bold text-[#2563EB]">오늘의 QT 묵상</h3>
                <p className="text-[13px] font-bold">{currDay?.qtTitle || '오늘 작성된 QT 제목이 없습니다.'}</p>
                <p className={`text-[13.5px] leading-relaxed whitespace-pre-wrap ${textSub}`}>
                  {currDay?.qtMeditation || currDay?.qtApplication || currDay?.qtText || currDay?.content || '작성된 묵상 내용이 없습니다.'}
                </p>
              </section>

              <section className={`${surfaceBg} rounded-xl border ${borderClass} p-4 space-y-2`}>
                <h3 className="text-[14px] font-bold text-[#0D9488]">오늘 나의 감사</h3>
                <p className={`text-[13.5px] leading-relaxed whitespace-pre-wrap ${textSub}`}>
                  {currentPersonalThanks || '오늘 작성된 감사가 없습니다.'}
                </p>
              </section>

              <section className={`${surfaceBg} rounded-xl border ${borderClass} p-4 space-y-2`}>
                <h3 className="text-[14px] font-bold text-[#D97706]">오늘의 기도제목</h3>
                <p className={`text-[13.5px] leading-relaxed whitespace-pre-wrap ${textSub}`}>
                  {currDay?.prayerReq || drafts.prayerReq || '오늘 작성된 기도제목이 없습니다.'}
                </p>
              </section>
            </div>
          )}
        </div>
      </main>

      {/* 모임지 이력 모달 */}
      {showHistoryModal && (
        <div
          onClick={() => {
            setShowHistoryModal(false);
            setSelectedHistoryItem(null);
          }}
          className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border ${borderClass} ${surfaceBg} ${textMain} flex flex-col max-h-[85vh] overflow-hidden`}
          >
            <div className={`px-4 py-3.5 border-b ${borderClass} flex justify-between items-center shrink-0`}>
              <span className="font-bold text-[15px]">{targetCellName} 모임지 이력</span>
              <button
                type="button"
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedHistoryItem(null);
                }}
                className={`p-1 rounded-lg ${subBg} cursor-pointer`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 hide-scrollbar p-4 space-y-2.5 text-left">
              {selectedHistoryItem ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setSelectedHistoryItem(null)}
                    className="text-[12.5px] font-bold text-[#2563EB] flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> 목록으로
                  </button>

                  <div className={`p-3.5 rounded-xl border ${borderClass} ${subBg} space-y-1.5`}>
                    <h4 className="font-bold text-[14px]">{selectedHistoryItem.weekRange}</h4>
                    {selectedHistoryItem.notice && (
                      <p className="text-[13px] leading-relaxed">
                        <b>공지:</b> {selectedHistoryItem.notice}
                      </p>
                    )}
                    {selectedHistoryItem.intercession && (
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                        <b>목장 중보:</b> {decryptField(selectedHistoryItem.intercession)}
                      </p>
                    )}
                  </div>

                  <h5 className="font-bold text-[13px]">
                    제출된 나눔 ({safeGetArr(selectedHistoryItem.submissions).length}건)
                  </h5>

                  <div className="space-y-2">
                    {safeGetArr(selectedHistoryItem.submissions).map((sub) => (
                      <div key={sub.id} className={`p-3 rounded-xl border ${borderClass} ${subBg} space-y-1 text-[13px]`}>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#2563EB]">{sub.name}</span>
                          <span className={`text-[11px] font-mono ${textSub}`}>{sub.date}</span>
                        </div>
                        {sub.wordShare && <p className="leading-relaxed"><b>말씀:</b> {decryptField(sub.wordShare)}</p>}
                        {sub.thanksShare && <p className="leading-relaxed"><b>감사:</b> {decryptField(sub.thanksShare)}</p>}
                        {sub.prayerReq && <p className="leading-relaxed"><b>기도:</b> {decryptField(sub.prayerReq)}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : safeGetArr(shepherdHistories).length === 0 ? (
                <div className={`text-center py-12 text-[13px] ${textSub}`}>저장된 모임지 이력이 없습니다.</div>
              ) : (
                safeGetArr(shepherdHistories).map((hist) => (
                  <button
                    key={hist.id}
                    type="button"
                    onClick={() => setSelectedHistoryItem(hist)}
                    className={`w-full p-3.5 rounded-xl border ${borderClass} ${subBg} text-left space-y-1 cursor-pointer hover:border-[#2563EB] transition-colors`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[13.5px]">{hist.weekRange}</span>
                      <span className="text-[11.5px] font-bold text-[#2563EB]">
                        {safeGetArr(hist.submissions).length}건
                      </span>
                    </div>
                    {hist.notice && <p className={`text-[12px] ${textSub} truncate`}>공지: {hist.notice}</p>}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
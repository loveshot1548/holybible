// src/components/admin/AdminPeopleTab.js
import React, { useState, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

// =====================================================================
// ✒️ 엔터프라이즈 모노크롬 SVG 아이콘 세트 (Linear / Attio CRM 규격)
// =====================================================================
const SvgSearch = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);
const SvgPlus = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);
const SvgTrash = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);
const SvgClose = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3} className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const SvgUserCheck = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632zM19.5 12l2.25 2.25 4.5-4.5" />
  </svg>
);
const SvgKey = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);
const SvgDownload = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);
const SvgUsers = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);
const SvgIdCard = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
  </svg>
);

const CHURCH_OFFICES = ['성도', '집사', '안수집사', '권사', '장로', '전도사', '목사'];
const MINISTRY_ROLES = ['목원', '부목자', '목자', '간사', '교사', '팀장'];

const OFFICE_PRIORITY = {
  '목사': 1,
  '전도사': 2,
  '장로': 3,
  '권사': 4,
  '안수집사': 5,
  '집사': 6,
  '성도': 7
};

export default function AdminPeopleTab({
  searchQuery,
  setSearchQuery,
  newUserName,
  setNewUserName,
  newUserOffice,
  setNewUserOffice,
  newUserRole,
  setNewUserRole,
  users = [],
  setUsers,
  cellMembers = [],
  cells = [],
  attendance = [],
  setSelectedUserProfile,
  handleCycleHealthStatus,
  memberHealthStatus = {},
  setCareTargetUser
}) {
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState('ALL');
  const [selectedCellFilter, setSelectedCellFilter] = useState('ALL');
  const [selectedStatusTab, setSelectedStatusTab] = useState('ALL'); // 'ALL' | 'RED' | 'YELLOW' | 'GREEN' | 'UNASSIGNED'
  const [sortBy, setSortBy] = useState('RISK_DESC'); // 'RISK_DESC' | 'NAME_ASC' | 'OFFICE_ASC' | 'ATT_DESC'
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetCellIdForNewUser, setTargetCellIdForNewUser] = useState('');
  const [activeSideUser, setActiveSideUser] = useState(null);

  // 다중 성도 선택 및 일괄 목장 배정 상태
  const [selectedUserNames, setSelectedUserNames] = useState(new Set());
  const [bulkTargetCellId, setBulkTargetCellId] = useState('');
  const [localCellOverrideMap, setLocalCellOverrideMap] = useState({});
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  }, []);

  // 1. 최근 8주 주일 날짜 배열 산출 (역추적용)
  const recentSundays = useMemo(() => {
    const sundays = [];
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const kst = new Date(utc + 9 * 3600000);
    const day = kst.getDay();
    const baseSunday = new Date(kst);
    baseSunday.setDate(kst.getDate() - day + (day === 0 ? 0 : 7));

    for (let i = 0; i < 8; i++) {
      const targetSun = new Date(baseSunday);
      targetSun.setDate(baseSunday.getDate() - i * 7);
      const dateStr = `${targetSun.getFullYear()}-${String(targetSun.getMonth() + 1).padStart(2, '0')}-${String(targetSun.getDate()).padStart(2, '0')}`;
      sundays.push(dateStr);
    }
    return sundays;
  }, []);

  // 2. 출석 데이터 기반 성도별 연속 결석, 8주 출석률 및 영적 루틴(Q/M/T) 실시간 분석 엔진
  const userCareAnalysis = useMemo(() => {
    const map = new Map();

    // 성도별 전체 출석 인덱싱 (성능 최적화)
    const attByUser = new Map();
    (attendance || []).forEach(a => {
      if (a.status !== '출석') return;
      const uName = (a.user_name || '').trim();
      if (!attByUser.has(uName)) attByUser.set(uName, []);
      attByUser.get(uName).push(a);
    });

    (users || []).forEach(u => {
      const uName = (u.name || '').trim();
      const userAtts = attByUser.get(uName) || [];

      let absStreak = 0;
      let lastAttendedDate = null;
      let eightWeekPresentCount = 0;
      const recentEightWeeks = [];

      for (let i = 0; i < recentSundays.length; i++) {
        const sDate = recentSundays[i];
        const isAtt = userAtts.some(
          a => a.date === sDate && (a.type === '주일' || a.type === '주일예배')
        );
        if (isAtt) eightWeekPresentCount += 1;
        recentEightWeeks.push({ date: sDate, attended: isAtt });
      }

      // 연속 결석 주수 계산 (가장 최근 주일부터 역순 탐색)
      for (const sunDate of recentSundays) {
        const isAtt = userAtts.some(
          a => a.date === sunDate && (a.type === '주일' || a.type === '주일예배')
        );
        if (isAtt) {
          if (!lastAttendedDate) lastAttendedDate = sunDate;
          break;
        } else {
          absStreak++;
        }
      }

      // 가장 최근 출석일 보정
      if (!lastAttendedDate) {
        const allSundayAtts = userAtts
          .filter(a => a.type === '주일' || a.type === '주일예배')
          .map(a => a.date)
          .sort((a, b) => b.localeCompare(a));
        if (allSundayAtts.length > 0) lastAttendedDate = allSundayAtts[0];
      }

      // 누적 QT / 맥체인 / 감사 활동량 집계
      const qtCount = userAtts.filter(a => a.type === 'QT' || a.type === '큐티').length;
      const bibleCount = userAtts.filter(a => a.type === '맥체인' || a.type === '성경' || a.type === '통독').length;
      const thanksCount = userAtts.filter(a => a.type === '감사' || a.type === '목장' || a.type === '감사나눔').length;

      // 수동 지정 태그 우선 존중 + 출석 기록 자동 판정
      const manualTag = memberHealthStatus[u.name];
      let finalStatus = 'green';
      let statusLabel = '주일 성수 안정';
      let riskPriority = 1;

      if (manualTag) {
        finalStatus = manualTag;
        statusLabel =
          manualTag === 'red'
            ? '관리자 지정 긴급'
            : manualTag === 'yellow'
            ? '관리자 지정 주의'
            : '안정권';
        riskPriority = manualTag === 'red' ? 3 : manualTag === 'yellow' ? 2 : 1;
      } else {
        if (absStreak >= 4) {
          finalStatus = 'red';
          statusLabel = `${absStreak}주 연속 결석 (긴급 심방)`;
          riskPriority = 3;
        } else if (absStreak === 3) {
          finalStatus = 'yellow';
          statusLabel = '3주 연속 결석 (주의 관찰)';
          riskPriority = 2;
        } else if (absStreak > 0) {
          finalStatus = 'green';
          statusLabel = `${absStreak}주 결석 (단기 관찰)`;
          riskPriority = 1;
        } else {
          finalStatus = 'green';
          statusLabel = '정상 성수';
          riskPriority = 0;
        }
      }

      const eightWeekRate =
        recentSundays.length > 0
          ? Math.round((eightWeekPresentCount / recentSundays.length) * 100)
          : 0;

      map.set(u.name, {
        absStreak,
        lastAttendedDate: lastAttendedDate || '출석 기록 없음',
        status: finalStatus,
        statusLabel,
        riskPriority,
        isManual: !!manualTag,
        eightWeekRate,
        qtCount,
        bibleCount,
        thanksCount,
        recentFourWeeks: recentEightWeeks.slice(0, 4).reverse(),
        recentEightWeeks: [...recentEightWeeks].reverse()
      });
    });

    return map;
  }, [users, attendance, recentSundays, memberHealthStatus]);

  // 목장 매핑 테이블 (로컬 즉시 변경 오버라이드 반영)
  const userCellMap = useMemo(() => {
    const map = new Map();
    (cellMembers || []).forEach(m => {
      const c = (cells || []).find(item => String(item.id) === String(m.cell_id));
      if (c) map.set(m.user_name, c);
    });
    Object.entries(localCellOverrideMap).forEach(([uName, cId]) => {
      if (!cId) {
        map.delete(uName);
      } else {
        const found = (cells || []).find(item => String(item.id) === String(cId));
        if (found) map.set(uName, found);
      }
    });
    return map;
  }, [cellMembers, cells, localCellOverrideMap]);

  // 3. 상단 통계 요약 (출석 데이터 기반 실시간 자동 동기화)
  const stats = useMemo(() => {
    const total = users.length;
    const assigned = users.filter(u => userCellMap.has(u.name)).length;
    const unassigned = Math.max(0, total - assigned);
    const leaders = users.filter(
      u =>
        ['목자', '부목자', '간사', '교역자', '팀장'].includes(u.role) ||
        ['장로', '권사', '안수집사', '목사', '전도사'].includes(u.office)
    ).length;

    let redCount = 0;
    let yellowCount = 0;
    users.forEach(u => {
      const st = userCareAnalysis.get(u.name)?.status || 'green';
      if (st === 'red') redCount++;
      else if (st === 'yellow') yellowCount++;
    });

    return {
      total,
      assigned,
      unassigned,
      assignedRate: total > 0 ? Math.round((assigned / total) * 100) : 0,
      redCount,
      yellowCount,
      leaders
    };
  }, [users, userCellMap, userCareAnalysis]);

  // 4. 필터링 및 정렬된 성도 목록
  const processedUsers = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    const filtered = (users || []).filter(u => {
      if (selectedOfficeFilter !== 'ALL' && (u.office || '성도') !== selectedOfficeFilter) return false;
      const cellObj = userCellMap.get(u.name);

      if (selectedCellFilter !== 'ALL') {
        if (selectedCellFilter === 'UNASSIGNED' && cellObj) return false;
        if (selectedCellFilter !== 'UNASSIGNED' && String(cellObj?.id) !== String(selectedCellFilter)) return false;
      }

      const careInfo = userCareAnalysis.get(u.name);
      const st = careInfo?.status || 'green';
      if (selectedStatusTab === 'RED' && st !== 'red') return false;
      if (selectedStatusTab === 'YELLOW' && st !== 'yellow') return false;
      if (selectedStatusTab === 'GREEN' && st !== 'green') return false;
      if (selectedStatusTab === 'UNASSIGNED' && cellObj) return false;

      if (!q) return true;
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.office || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q) ||
        (cellObj?.name || '').toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      const careA = userCareAnalysis.get(a.name);
      const careB = userCareAnalysis.get(b.name);
      if (sortBy === 'RISK_DESC') {
        if ((careB?.riskPriority || 0) !== (careA?.riskPriority || 0)) {
          return (careB?.riskPriority || 0) - (careA?.riskPriority || 0);
        }
        return (careB?.absStreak || 0) - (careA?.absStreak || 0);
      }
      if (sortBy === 'NAME_ASC') {
        return (a.name || '').localeCompare(b.name || '', 'ko');
      }
      if (sortBy === 'OFFICE_ASC') {
        const pA = OFFICE_PRIORITY[a.office || '성도'] || 99;
        const pB = OFFICE_PRIORITY[b.office || '성도'] || 99;
        return pA - pB || (a.name || '').localeCompare(b.name || '', 'ko');
      }
      if (sortBy === 'ATT_DESC') {
        return (careB?.eightWeekRate || 0) - (careA?.eightWeekRate || 0);
      }
      return 0;
    });
  }, [users, userCellMap, userCareAnalysis, selectedOfficeFilter, selectedCellFilter, selectedStatusTab, searchQuery, sortBy]);

  // 다중 체크박스 토글 핸들러
  const handleToggleSelectUser = (userName, e) => {
    if (e) e.stopPropagation();
    setSelectedUserNames(prev => {
      const next = new Set(prev);
      if (next.has(userName)) next.delete(userName);
      else next.add(userName);
      return next;
    });
  };

  const handleToggleSelectAllVisible = () => {
    if (processedUsers.length > 0 && selectedUserNames.size === processedUsers.length) {
      setSelectedUserNames(new Set());
    } else {
      setSelectedUserNames(new Set(processedUsers.map(u => u.name)));
    }
  };

  // 다중 선택 성도 일괄 목장 재배정
  const handleBulkAssignCell = async () => {
    if (selectedUserNames.size === 0) return;
    const names = Array.from(selectedUserNames);
    const targetCell = (cells || []).find(c => String(c.id) === String(bulkTargetCellId));

    try {
      const nextOverrides = { ...localCellOverrideMap };
      names.forEach(n => {
        nextOverrides[n] = bulkTargetCellId || null;
      });
      setLocalCellOverrideMap(nextOverrides);

      if (supabase) {
        if (!bulkTargetCellId) {
          await supabase.from('cell_members').delete().in('user_name', names);
        } else {
          const payloads = names.map(n => ({
            cell_id: bulkTargetCellId,
            user_name: n,
            assigned_role: '목원'
          }));
          await supabase.from('cell_members').upsert(payloads, { onConflict: 'user_name' });
        }
      }
      window.dispatchEvent(new Event('storage'));
      setSelectedUserNames(new Set());
      setBulkTargetCellId('');
      showToast(
        bulkTargetCellId
          ? `${names.length}명의 성도를 [${targetCell?.name}]에 일괄 배정했습니다.`
          : `${names.length}명의 성도를 미배정으로 전환했습니다.`
      );
    } catch (err) {
      alert('일괄 배정 중 오류가 발생했습니다: ' + err.message);
    }
  };

  // 성도 신규 등록
  const handleCreateUser = async (e) => {
    if (e) e.preventDefault();
    if (!newUserName.trim()) return alert('성도 이름을 입력해주세요.');

    const payload = {
      name: newUserName.trim(),
      office: newUserOffice || '성도',
      role: newUserRole || '목원',
      password: '1004',
      created_at: new Date().toISOString()
    };

    try {
      if (supabase) {
        const { data, error } = await supabase.from('app_users').insert([payload]).select();
        if (error) throw error;
        if (data && data[0]) {
          setUsers(prev => [...(prev || []), data[0]]);
          if (targetCellIdForNewUser) {
            await supabase
              .from('cell_members')
              .upsert(
                [{ cell_id: targetCellIdForNewUser, user_name: payload.name, assigned_role: payload.role }],
                { onConflict: 'user_name' }
              );
            setLocalCellOverrideMap(prev => ({ ...prev, [payload.name]: targetCellIdForNewUser }));
          }
        }
      } else {
        setUsers(prev => [...(prev || []), payload]);
        if (targetCellIdForNewUser) {
          setLocalCellOverrideMap(prev => ({ ...prev, [payload.name]: targetCellIdForNewUser }));
        }
      }
      setNewUserName('');
      setTargetCellIdForNewUser('');
      setShowAddModal(false);
      showToast(`[${payload.name}] 성도가 교적부에 등록되었습니다.`);
    } catch (err) {
      alert(`등록 실패: ${err.message}`);
    }
  };

  // 인라인 목장 즉시 변경
  const handleQuickReassignCell = async (userName, targetCellId) => {
    if (!userName) return;
    try {
      setLocalCellOverrideMap(prev => ({ ...prev, [userName]: targetCellId || null }));
      if (targetCellId === '') {
        if (supabase) await supabase.from('cell_members').delete().eq('user_name', userName);
        window.dispatchEvent(new Event('storage'));
        showToast(`[${userName}] 성도가 미배정으로 전환되었습니다.`);
      } else {
        const targetCell = (cells || []).find(c => String(c.id) === String(targetCellId));
        if (supabase) {
          await supabase
            .from('cell_members')
            .upsert([{ cell_id: targetCellId, user_name: userName, assigned_role: '목원' }], {
              onConflict: 'user_name'
            });
        }
        window.dispatchEvent(new Event('storage'));
        showToast(`[${userName}] 성도가 [${targetCell?.name || '선택 목장'}]으로 재배정되었습니다.`);
      }
    } catch (err) {
      alert('목장 배정 변경 오류: ' + err.message);
    }
  };

  // 인라인 직분 / 사역 직책 즉시 변경
  const handleUpdateUserMeta = async (userName, field, nextValue) => {
    if (!userName) return;
    setUsers(prev =>
      (prev || []).map(u => (u.name === userName ? { ...u, [field]: nextValue } : u))
    );
    if (activeSideUser?.name === userName) {
      setActiveSideUser(prev => (prev ? { ...prev, [field]: nextValue } : null));
    }
    if (supabase) {
      try {
        await supabase.from('app_users').update({ [field]: nextValue }).eq('name', userName);
      } catch (_) {}
    }
    showToast(`[${userName}] 성도의 ${field === 'office' ? '교회 직분' : '사역 직책'}이 변경되었습니다.`);
  };

  // 초기 암호(1004) 원클릭 리셋
  const handleResetUserPassword = async (userName) => {
    if (!userName) return;
    if (!window.confirm(`[${userName}] 성도의 로그인 암호를 초기값(1004)으로 초기화하시겠습니까?`)) return;
    if (supabase) {
      try {
        await supabase.from('app_users').update({ password: '1004' }).eq('name', userName);
      } catch (_) {}
    }
    showToast(`[${userName}] 성도의 암호가 '1004'로 초기화되었습니다.`);
  };

  // 성도 삭제
  const handleDeleteUser = async (userName) => {
    if (!window.confirm(`[${userName}] 성도의 등록 데이터와 소속 목장 정보를 영구 삭제하시겠습니까?`)) return;
    try {
      setUsers(prev => (prev || []).filter(u => u.name !== userName));
      if (activeSideUser?.name === userName) setActiveSideUser(null);
      if (supabase) {
        await supabase.from('cell_members').delete().eq('user_name', userName);
        await supabase.from('app_users').delete().eq('name', userName);
      }
      showToast(`[${userName}] 성도 정보가 삭제되었습니다.`);
    } catch (err) {
      alert(`삭제 오류: ${err.message}`);
    }
  };

  // 전교인 통합 명부 CSV 내보내기
  const exportPeopleCSV = () => {
    if (users.length === 0) return alert('내보낼 성도 데이터가 없습니다.');
    let csvContent = '\uFEFF';
    csvContent += '번호,성도명,교회직분,사역직책,소속목장,케어상태,연속결석주차,8주출석률,최근출석일,누적QT,누적말씀,누적감사\n';

    processedUsers.forEach((u, idx) => {
      const cellObj = userCellMap.get(u.name);
      const care = userCareAnalysis.get(u.name);
      const stText =
        care?.status === 'red' ? '긴급심방' : care?.status === 'yellow' ? '주의관찰' : '정상안정';
      csvContent += `"${idx + 1}","${u.name}","${u.office || '성도'}","${u.role || '목원'}","${
        cellObj?.name || '미배정'
      }","${stText}","${care?.absStreak || 0}주","${care?.eightWeekRate || 0}%","${
        care?.lastAttendedDate || '-'
      }","${care?.qtCount || 0}","${care?.bibleCount || 0}","${care?.thanksCount || 0}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `성도통합교적부_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-zinc-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden box-border font-sans select-none text-zinc-900 relative">
      
      {/* 실시간 액션 토스트 알림 */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[400] px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold shadow-2xl border border-white/15 flex items-center gap-2 animate-fade-in whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* =========================================================================
          [1] 상단 실시간 동기화 KPI 대시보드 (4-Grid Bento)
          ========================================================================= */}
      <div className="shrink-0 bg-zinc-50/80 border-b border-zinc-200/90 px-4 sm:px-5 py-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-zinc-200/80 p-3 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between gap-2 whitespace-nowrap">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
              등록 교인 총원
            </span>
            <span className="text-[10px] font-mono font-bold text-zinc-600 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200 tabular-nums">
              조회 {processedUsers.length}명
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1.5 whitespace-nowrap">
            <span className="text-[22px] font-black font-mono text-zinc-900 leading-none tabular-nums">
              {stats.total}
            </span>
            <span className="text-[11px] font-bold text-zinc-500">명</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200/80 p-3 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between gap-2 whitespace-nowrap">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
              목장 배치율
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 tabular-nums">
              미배정 {stats.unassigned}명
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1.5 whitespace-nowrap">
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-black font-mono text-indigo-600 leading-none tabular-nums">
                {stats.assignedRate}%
              </span>
              <span className="text-[11px] font-bold text-zinc-500">배정 완료</span>
            </div>
            <span className="text-[10.5px] font-mono text-zinc-400 tabular-nums">
              {stats.assigned}/{stats.total}명
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200/80 p-3 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between gap-2 whitespace-nowrap">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
              핵심 제직·리더십
            </span>
            <span className="text-[10px] font-mono font-bold text-zinc-600 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200 tabular-nums">
              {stats.total > 0 ? Math.round((stats.leaders / stats.total) * 100) : 0}%
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1.5 whitespace-nowrap">
            <span className="text-[22px] font-black font-mono text-zinc-900 leading-none tabular-nums">
              {stats.leaders}
            </span>
            <span className="text-[11px] font-bold text-zinc-500">명 활동중</span>
          </div>
        </div>

        <div
          onClick={() => setSelectedStatusTab(selectedStatusTab === 'RED' ? 'ALL' : 'RED')}
          className="bg-white hover:bg-rose-50/30 rounded-xl border border-zinc-200/80 hover:border-rose-300 p-3 flex flex-col justify-between shadow-2xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between gap-2 whitespace-nowrap">
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              집중 케어 필요군 (출석 연동)
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1.5 whitespace-nowrap">
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-black font-mono text-rose-600 leading-none tabular-nums">
                {stats.redCount}
              </span>
              <span className="text-[11px] font-bold text-rose-600">명 긴급</span>
            </div>
            <span className="text-[10.5px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 tabular-nums">
              주의 관찰 {stats.yellowCount}명
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          [2] 액션 툴바 & 상태별 탭 필터 (줄바꿈 0% 보장)
          ========================================================================= */}
      <div className="shrink-0 bg-white border-b border-zinc-200/90 px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-[280px]">
          
          {/* 상태별 원클릭 탭 */}
          <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/80 text-[11px] font-bold overflow-x-auto hide-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedStatusTab('ALL')}
              className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer tabular-nums ${
                selectedStatusTab === 'ALL'
                  ? 'bg-white text-zinc-950 shadow-2xs font-black'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              전체 ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusTab('RED')}
              className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer tabular-nums ${
                selectedStatusTab === 'RED'
                  ? 'bg-white text-rose-700 shadow-2xs font-black'
                  : 'text-zinc-500 hover:text-rose-700'
              }`}
            >
              긴급 ({stats.redCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusTab('YELLOW')}
              className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer tabular-nums ${
                selectedStatusTab === 'YELLOW'
                  ? 'bg-white text-amber-800 shadow-2xs font-black'
                  : 'text-zinc-500 hover:text-amber-800'
              }`}
            >
              주의 ({stats.yellowCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatusTab('UNASSIGNED')}
              className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer tabular-nums ${
                selectedStatusTab === 'UNASSIGNED'
                  ? 'bg-white text-zinc-950 shadow-2xs font-black'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              미배정 ({stats.unassigned})
            </button>
          </div>

          <div className="relative flex items-center w-36 sm:w-48">
            <span className="absolute left-2.5 text-zinc-400 pointer-events-none"><SvgSearch /></span>
            <input
              type="text"
              placeholder="성도명, 목장 검색..."
              value={searchQuery || ''}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-6 py-1.5 text-[11.5px] bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:bg-white focus:border-zinc-900 text-zinc-900 font-bold placeholder:text-zinc-400 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-[10px] text-zinc-400 hover:text-zinc-800 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={selectedOfficeFilter}
            onChange={e => setSelectedOfficeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-[11px] bg-zinc-50 border border-zinc-200 rounded-lg outline-none text-zinc-700 font-bold cursor-pointer whitespace-nowrap"
          >
            <option value="ALL">전체 직분</option>
            {CHURCH_OFFICES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <select
            value={selectedCellFilter}
            onChange={e => setSelectedCellFilter(e.target.value)}
            className="px-2.5 py-1.5 text-[11px] bg-zinc-50 border border-zinc-200 rounded-lg outline-none text-zinc-700 font-bold cursor-pointer whitespace-nowrap"
          >
            <option value="ALL">전체 목장</option>
            <option value="UNASSIGNED">미배정 성도</option>
            {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 text-[11px] bg-zinc-50 border border-zinc-200 rounded-lg outline-none text-zinc-700 font-bold cursor-pointer whitespace-nowrap"
          >
            <option value="RISK_DESC">결석 위험도순</option>
            <option value="NAME_ASC">이름 가나다순</option>
            <option value="OFFICE_ASC">직분순</option>
            <option value="ATT_DESC">출석률 높은순</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <button
            type="button"
            onClick={exportPeopleCSV}
            className="px-3 py-1.5 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200/90 text-[11px] font-bold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all whitespace-nowrap"
            title="성도 명부 CSV 다운로드"
          >
            <SvgDownload /> CSV 추출
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-black rounded-lg shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <SvgPlus /> 성도 신규 등록
          </button>
        </div>
      </div>

      {/* 다중 선택 일괄 목장 배정 플로팅 바 */}
      {selectedUserNames.size > 0 && (
        <div className="shrink-0 bg-zinc-900 text-white px-4 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-bold whitespace-nowrap">
            <span className="px-2 py-0.5 rounded bg-amber-400 text-zinc-950 font-black tabular-nums">
              {selectedUserNames.size}명 선택됨
            </span>
            <span className="text-zinc-300">선택한 성도를 일괄 목장 배정합니다:</span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <select
              value={bulkTargetCellId}
              onChange={e => setBulkTargetCellId(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs font-bold outline-none cursor-pointer"
            >
              <option value="">목장 제외 (미배정)</option>
              {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button
              type="button"
              onClick={handleBulkAssignCell}
              className="px-3 py-1 rounded-lg bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-black cursor-pointer whitespace-nowrap"
            >
              일괄 적용
            </button>
            <button
              type="button"
              onClick={() => setSelectedUserNames(new Set())}
              className="px-2 py-1 rounded-lg text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          [3] 성도 데이터 메인 뷰포트 (PC 고밀도 테이블 + 모바일 Bento 카드 + 우측 인스펙터)
          ========================================================================= */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative bg-zinc-50/40">
        
        {/* 💻 데스크톱 & 태블릿 가로 뷰: 정밀 테이블 */}
        <div className="hidden md:block flex-1 overflow-x-auto overflow-y-auto hide-scrollbar border-r border-zinc-200 bg-white">
          {processedUsers.length === 0 ? (
            <div className="py-24 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-300">
                <SvgUsers />
              </div>
              <p className="text-[13px] font-bold text-zinc-500">조건에 일치하는 성도 정보가 없습니다.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/95 text-zinc-400 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10 whitespace-nowrap">
                  <th className="py-2.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={processedUsers.length > 0 && selectedUserNames.size === processedUsers.length}
                      onChange={handleToggleSelectAllVisible}
                      className="w-3.5 h-3.5 rounded accent-zinc-900 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-2 w-12 text-center">No</th>
                  <th className="py-2.5 px-2 w-20 text-center">케어신호</th>
                  <th className="py-2.5 px-3">성도명</th>
                  <th className="py-2.5 px-3">교회 직분</th>
                  <th className="py-2.5 px-3">사역 직책</th>
                  <th className="py-2.5 px-3">소속 목장</th>
                  <th className="py-2.5 px-3">최근 4주 주일출결</th>
                  <th className="py-2.5 px-3 text-center">누적 Q/M/T</th>
                  <th className="py-2.5 px-3 text-right">관리 작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white font-medium">
                {processedUsers.map((u, idx) => {
                  const cellObj = userCellMap.get(u.name);
                  const careInfo = userCareAnalysis.get(u.name);
                  const health = careInfo?.status || 'green';
                  const isSelected = activeSideUser?.name === u.name;
                  const isChecked = selectedUserNames.has(u.name);

                  return (
                    <tr
                      key={u.name}
                      onClick={() => setActiveSideUser(u)}
                      className={`cursor-pointer transition-colors group whitespace-nowrap ${
                        isSelected
                          ? 'bg-zinc-100/90'
                          : isChecked
                          ? 'bg-zinc-50'
                          : 'hover:bg-zinc-50/70'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleToggleSelectUser(u.name, e)}
                          className="w-3.5 h-3.5 rounded accent-zinc-900 cursor-pointer"
                        />
                      </td>

                      <td className="py-2.5 px-2 text-center font-mono text-[11px] text-zinc-400 tabular-nums">
                        {String(idx + 1).padStart(3, '0')}
                      </td>

                      {/* 출석 연동 건강 신호등 (수동 클릭 토글 지원) */}
                      <td className="py-2.5 px-2 text-center" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleCycleHealthStatus && handleCycleHealthStatus(u.name, e)}
                          title={`${careInfo?.statusLabel} (클릭 시 수동 전환)`}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 cursor-pointer border transition-transform hover:scale-105 ${
                            health === 'green'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : health === 'yellow'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              health === 'green'
                                ? 'bg-emerald-500'
                                : health === 'yellow'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          {health === 'green' ? '안정' : health === 'yellow' ? '주의' : '긴급'}
                        </button>
                      </td>

                      <td className="py-2.5 px-3 font-black text-zinc-900">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-zinc-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <span>{u.name}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-bold text-zinc-700">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200/80 text-[11px]">
                          {u.office || '성도'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[11px] font-bold ${
                            ['목자', '부목자', '간사', '팀장'].includes(u.role)
                              ? 'text-indigo-600 font-black'
                              : 'text-zinc-500'
                          }`}
                        >
                          {u.role || '목원'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        {cellObj ? (
                          <span className="font-bold text-zinc-800 text-[11.5px] inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 shrink-0" />
                            {cellObj.name}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            미배정
                          </span>
                        )}
                      </td>

                      {/* 최근 4주 주일 출석 미니 스파크 도트 + 8주 출석률 */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1">
                            {(careInfo?.recentFourWeeks || []).map((w, wIdx) => (
                              <span
                                key={wIdx}
                                title={`${w.date}: ${w.attended ? '출석' : '결석'}`}
                                className={`w-2 h-2 rounded-full ${
                                  w.attended ? 'bg-zinc-900' : 'bg-zinc-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10.5px] font-mono font-bold text-zinc-500 tabular-nums ml-1">
                            {careInfo?.absStreak > 0
                              ? `${careInfo.absStreak}주 결석`
                              : `${careInfo?.eightWeekRate || 0}%`}
                          </span>
                        </div>
                      </td>

                      {/* 누적 Q/M/T 배지 */}
                      <td className="py-2.5 px-3 text-center font-mono text-[10.5px] text-zinc-500 tabular-nums">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-50 border border-zinc-200">
                          Q{careInfo?.qtCount || 0} · M{careInfo?.bibleCount || 0} · T{careInfo?.thanksCount || 0}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {setSelectedUserProfile && (
                            <button
                              type="button"
                              onClick={() => setSelectedUserProfile(u)}
                              className="px-2 py-1 rounded-md text-[10.5px] font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                              title="성도 종합 프로필 열기"
                            >
                              프로필
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setCareTargetUser && setCareTargetUser(u)}
                            className="px-2.5 py-1 rounded-md text-[10.5px] font-bold bg-zinc-900 hover:bg-zinc-800 text-white transition-colors cursor-pointer shadow-2xs"
                          >
                            심방케어
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.name)}
                            className="p-1 rounded-md text-zinc-300 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="성도 삭제"
                          >
                            <SvgTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 📱 모바일 전용 고밀도 Bento 카드 리스트 뷰 (가로 스크롤 0%) */}
        <div className="md:hidden flex-1 overflow-y-auto p-3 space-y-2.5 hide-scrollbar">
          {processedUsers.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 text-xs font-bold bg-white rounded-2xl border border-zinc-200">
              조건에 일치하는 성도가 없습니다.
            </div>
          ) : (
            processedUsers.map((u, idx) => {
              const cellObj = userCellMap.get(u.name);
              const careInfo = userCareAnalysis.get(u.name);
              const health = careInfo?.status || 'green';

              return (
                <div
                  key={u.name}
                  onClick={() => setActiveSideUser(u)}
                  className="p-3.5 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs space-y-2.5 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-xs font-black shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <span className="text-[14px] font-black text-zinc-900 truncate">{u.name}</span>
                      <span className="text-[10.5px] font-bold text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                        {u.office || '성도'} · {u.role || '목원'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCycleHealthStatus && handleCycleHealthStatus(u.name, e);
                      }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black border shrink-0 ${
                        health === 'green'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : health === 'yellow'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                      }`}
                    >
                      {careInfo?.statusLabel}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-100 whitespace-nowrap">
                    <span className="font-bold text-zinc-700">
                      소속: <b className="text-zinc-900">{cellObj?.name || '미배정'}</b>
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-zinc-500 tabular-nums">
                      <span>8주 출석 {careInfo?.eightWeekRate || 0}%</span>
                      <span>•</span>
                      <span>Q{careInfo?.qtCount || 0}/M{careInfo?.bibleCount || 0}/T{careInfo?.thanksCount || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* =========================================================================
            [4] 우측 성도 상세 인텔리전스 인스펙터 (PC 사이드바 & 모바일 모달 자동 대응)
            ========================================================================= */}
        {activeSideUser && (() => {
          const careInfo = userCareAnalysis.get(activeSideUser.name);
          const currentCell = userCellMap.get(activeSideUser.name);

          return (
            <div
              className="fixed inset-0 md:static md:inset-auto z-[350] md:z-20 bg-zinc-950/50 md:bg-transparent backdrop-blur-xs md:backdrop-blur-none flex items-end md:items-stretch justify-center md:justify-end animate-fade-in"
              onClick={() => setActiveSideUser(null)}
            >
              <div
                className="w-full md:w-[340px] max-h-[88vh] md:max-h-none bg-white rounded-t-3xl md:rounded-none border-t md:border-t-0 md:border-l border-zinc-200 p-5 flex flex-col gap-4 shrink-0 shadow-2xl md:shadow-[-10px_0_30px_rgba(0,0,0,0.04)] overflow-y-auto hide-scrollbar"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3 whitespace-nowrap">
                  <span className="text-[10.5px] font-black uppercase tracking-wider text-zinc-400">
                    MEMBER INTELLIGENCE CARD #{String(users.findIndex(u => u.name === activeSideUser.name) + 1).padStart(3, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSideUser(null)}
                    className="text-zinc-400 hover:text-zinc-900 cursor-pointer p-1 rounded-lg hover:bg-zinc-100 transition-colors"
                  >
                    <SvgClose />
                  </button>
                </div>

                {/* 프로필 헤더 */}
                <div className="flex items-center gap-3.5 py-1">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                    {activeSideUser.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-[17px] font-black text-zinc-900 tracking-tight truncate">
                        {activeSideUser.name}
                      </h4>
                      {setSelectedUserProfile && (
                        <button
                          type="button"
                          onClick={() => setSelectedUserProfile(activeSideUser)}
                          className="px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10.5px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <SvgIdCard /> 전체 프로필
                        </button>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400 block mt-0.5 whitespace-nowrap tabular-nums">
                      최근 출석: {careInfo?.lastAttendedDate}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-[12px]">
                  {/* 직분 및 사역 직책 인라인 즉시 수정 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                      <span className="text-[10px] font-black text-zinc-400 uppercase block">교회 직분</span>
                      <select
                        value={activeSideUser.office || '성도'}
                        onChange={e => handleUpdateUserMeta(activeSideUser.name, 'office', e.target.value)}
                        className="w-full p-1.5 bg-white border border-zinc-200 rounded-lg text-[11.5px] font-bold text-zinc-900 outline-none cursor-pointer"
                      >
                        {CHURCH_OFFICES.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                      <span className="text-[10px] font-black text-zinc-400 uppercase block">사역 직책</span>
                      <select
                        value={activeSideUser.role || '목원'}
                        onChange={e => handleUpdateUserMeta(activeSideUser.name, 'role', e.target.value)}
                        className="w-full p-1.5 bg-white border border-zinc-200 rounded-lg text-[11.5px] font-bold text-zinc-900 outline-none cursor-pointer"
                      >
                        {MINISTRY_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* 소속 목장 즉시 재배정 드롭다운 */}
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1.5">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">
                      소속 목장 재배정
                    </span>
                    <select
                      value={currentCell?.id || ''}
                      onChange={e => handleQuickReassignCell(activeSideUser.name, e.target.value)}
                      className="w-full p-2 bg-white border border-zinc-200 rounded-lg text-[12px] font-bold text-zinc-900 outline-none cursor-pointer"
                    >
                      <option value="">미배정 (목장 없음)</option>
                      {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* 영적 건강 & 최근 8주 주일 출석 히트맵 */}
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex flex-col gap-2.5">
                    <div className="flex justify-between items-center whitespace-nowrap">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                        출석 연동 케어 진단
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCycleHealthStatus && handleCycleHealthStatus(activeSideUser.name, e)}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 cursor-pointer shadow-2xs"
                      >
                        신호 수동전환
                      </button>
                    </div>

                    <div className="flex items-center justify-between whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            careInfo?.status === 'green'
                              ? 'bg-emerald-500'
                              : careInfo?.status === 'yellow'
                              ? 'bg-amber-400'
                              : 'bg-rose-500 animate-pulse'
                          }`}
                        />
                        <span
                          className={`font-black text-[12.5px] ${
                            careInfo?.status === 'green'
                              ? 'text-emerald-700'
                              : careInfo?.status === 'yellow'
                              ? 'text-amber-800'
                              : 'text-rose-700'
                          }`}
                        >
                          {careInfo?.statusLabel}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-zinc-600 tabular-nums">
                        8주 {careInfo?.eightWeekRate || 0}%
                      </span>
                    </div>

                    {/* 최근 8주 히트맵 */}
                    <div className="grid grid-cols-8 gap-1 pt-2 border-t border-zinc-200/70">
                      {(careInfo?.recentEightWeeks || []).map((w, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div
                            title={`${w.date}: ${w.attended ? '출석' : '결석'}`}
                            className={`w-full h-5 rounded-md flex items-center justify-center text-[9px] font-mono font-bold ${
                              w.attended
                                ? 'bg-zinc-900 text-white'
                                : 'bg-zinc-200/70 text-zinc-400'
                            }`}
                          >
                            {w.attended ? '✓' : '-'}
                          </div>
                          <span className="text-[8.5px] font-mono text-zinc-400 tabular-nums">
                            {w.date.slice(5).replace('-', '/')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 누적 신앙 루틴(Q/M/T) 요약 & 암호 리셋 */}
                  <div className="grid grid-cols-3 gap-1.5 text-center whitespace-nowrap">
                    <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-200">
                      <span className="text-[9.5px] font-bold text-zinc-400 block">누적 QT</span>
                      <span className="text-[13px] font-mono font-black text-zinc-900 tabular-nums">
                        {careInfo?.qtCount || 0}회
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-200">
                      <span className="text-[9.5px] font-bold text-zinc-400 block">말씀통독</span>
                      <span className="text-[13px] font-mono font-black text-zinc-900 tabular-nums">
                        {careInfo?.bibleCount || 0}회
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-50 border border-zinc-200">
                      <span className="text-[9.5px] font-bold text-zinc-400 block">감사나눔</span>
                      <span className="text-[13px] font-mono font-black text-zinc-900 tabular-nums">
                        {careInfo?.thanksCount || 0}회
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <SvgKey />
                      <span className="text-[11px] font-bold text-zinc-600">초기 암호: 1004</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResetUserPassword(activeSideUser.name)}
                      className="px-2 py-1 rounded bg-white border border-zinc-200 hover:bg-zinc-100 text-[10px] font-bold text-zinc-700 cursor-pointer shadow-2xs"
                    >
                      암호 초기화
                    </button>
                  </div>
                </div>

                <div className="mt-auto space-y-2 pt-3 border-t border-zinc-100 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setCareTargetUser && setCareTargetUser(activeSideUser)}
                    className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-[12px] font-black shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <SvgUserCheck /> 심방 및 케어 일지 작성
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(activeSideUser.name)}
                    className="w-full py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    성도 교적부에서 영구 제외
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* =========================================================================
          [5] 성도 신규 등록 모달
          ========================================================================= */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[380] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in select-none"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-zinc-200 flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="text-[15.5px] font-black text-zinc-900 tracking-tight">새 교인 교적부 등록</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-800 cursor-pointer p-1 rounded-lg hover:bg-zinc-100"
              >
                <SvgClose />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-[12px]">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500 block mb-1">
                  성도 성명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="예: 홍길동"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl outline-none focus:bg-white focus:border-zinc-900 font-bold text-zinc-900 transition-all placeholder:text-zinc-400"
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500 block mb-1">
                    교회 직분
                  </label>
                  <select
                    value={newUserOffice}
                    onChange={e => setNewUserOffice(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-800 outline-none cursor-pointer"
                  >
                    {CHURCH_OFFICES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500 block mb-1">
                    사역 직책
                  </label>
                  <select
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-800 outline-none cursor-pointer"
                  >
                    {MINISTRY_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500 block mb-1">
                  초기 목장 배정 (선택)
                </label>
                <select
                  value={targetCellIdForNewUser}
                  onChange={e => setTargetCellIdForNewUser(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-800 outline-none cursor-pointer"
                >
                  <option value="">미배정으로 등록</option>
                  {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="pt-2 flex gap-2 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold cursor-pointer transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-black shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  등록 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
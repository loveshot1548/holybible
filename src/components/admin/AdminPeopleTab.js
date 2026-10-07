// src/components/admin/AdminPeopleTab.js
import React, { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';

// 엔터프라이즈 모노크롬 SVG 아이콘 세트
const SvgSearch = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const SvgPlus = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const SvgTrash = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const SvgClose = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const SvgUserCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632zM19.5 12l2.25 2.25 4.5-4.5" /></svg>;
const SvgKey = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>;
const SvgDownload = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const SvgUsers = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;

const CHURCH_OFFICES = ['성도', '집사', '안수집사', '권사', '장로', '전도사', '목사'];
const MINISTRY_ROLES = ['목원', '부목자', '목자', '간사', '교사', '팀장'];

export default function AdminPeopleTab({
  searchQuery, setSearchQuery, newUserName, setNewUserName,
  newUserOffice, setNewUserOffice, newUserRole, setNewUserRole,
  users = [], setUsers, cellMembers = [], cells = [],
  attendance = [], // 🌟 출석 기록 주입
  setSelectedUserProfile, handleCycleHealthStatus, memberHealthStatus = {}, setCareTargetUser
}) {
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState('ALL');
  const [selectedCellFilter, setSelectedCellFilter] = useState('ALL');
  const [selectedStatusTab, setSelectedStatusTab] = useState('ALL'); // 'ALL' | 'RED' | 'YELLOW' | 'GREEN' | 'UNASSIGNED'
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetCellIdForNewUser, setTargetCellIdForNewUser] = useState('');
  const [activeSideUser, setActiveSideUser] = useState(null);

  // 1. 최근 8주 주일 날짜 배열 산출 (역추적용)
  const recentSundays = useMemo(() => {
    const sundays = [];
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const kst = new Date(utc + (9 * 3600000));
    const day = kst.getDay();
    const baseSunday = new Date(kst);
    baseSunday.setDate(kst.getDate() - day + (day === 0 ? 0 : 7)); // 직전 주일

    for (let i = 0; i < 8; i++) {
      const targetSun = new Date(baseSunday);
      targetSun.setDate(baseSunday.getDate() - (i * 7));
      const dateStr = `${targetSun.getFullYear()}-${String(targetSun.getMonth() + 1).padStart(2, '0')}-${String(targetSun.getDate()).padStart(2, '0')}`;
      sundays.push(dateStr);
    }
    return sundays;
  }, []);

  // 2. 🌟 [핵심] 출석 데이터 기반 성도별 연속 결석 및 건강상태 실시간 자동 판정 엔진
  const userCareAnalysis = useMemo(() => {
    const map = new Map();

    users.forEach(u => {
      const uName = (u.name || '').trim();
      let absStreak = 0;
      let lastAttendedDate = null;
      const recentFourWeeks = [];

      // 최근 4주 출결 미니 인디케이터용
      for (let i = 0; i < Math.min(4, recentSundays.length); i++) {
        const sDate = recentSundays[i];
        const isAtt = (attendance || []).some(a => 
          (a.user_name || '').trim() === uName &&
          a.date === sDate &&
          (a.type === '주일' || a.type === '주일예배') &&
          a.status === '출석'
        );
        recentFourWeeks.push({ date: sDate, attended: isAtt });
      }

      // 연속 결석 주수 계산 (가장 최근 주일부터 거꾸로 탐색)
      for (const sunDate of recentSundays) {
        const isAtt = (attendance || []).some(a => 
          (a.user_name || '').trim() === uName &&
          a.date === sunDate &&
          (a.type === '주일' || a.type === '주일예배') &&
          a.status === '출석'
        );

        if (isAtt) {
          if (!lastAttendedDate) lastAttendedDate = sunDate;
          break; // 최근 출석이 잡히면 결석 스트릭 종료
        } else {
          absStreak++;
        }
      }

      // 수동 지정 태그가 있으면 우선 존중하되, 없으면 출석 기록에 따라 100% 자동 판정
      const manualTag = memberHealthStatus[u.name];
      let finalStatus = 'green';
      let statusLabel = '주일 성수 안정';

      if (manualTag) {
        finalStatus = manualTag;
        statusLabel = manualTag === 'red' ? '관리자 지정 긴급' : manualTag === 'yellow' ? '관리자 지정 주의' : '안정권';
      } else {
        if (absStreak >= 4) {
          finalStatus = 'red';
          statusLabel = `${absStreak}주 연속 결석 (긴급 심방)`;
        } else if (absStreak === 3) {
          finalStatus = 'yellow';
          statusLabel = '3주 연속 결석 (주의 관찰)';
        } else if (absStreak > 0) {
          finalStatus = 'green';
          statusLabel = `${absStreak}주 결석 (단기 관찰)`;
        } else {
          finalStatus = 'green';
          statusLabel = '정상 성수';
        }
      }

      map.set(u.name, {
        absStreak,
        lastAttendedDate: lastAttendedDate || '출석 기록 없음',
        status: finalStatus,
        statusLabel,
        isManual: !!manualTag,
        recentFourWeeks: recentFourWeeks.reverse() // 과거 -> 최신순
      });
    });

    return map;
  }, [users, attendance, recentSundays, memberHealthStatus]);

  // 목장 매핑 테이블
  const userCellMap = useMemo(() => {
    const map = new Map();
    cellMembers.forEach(m => {
      const c = cells.find(item => item.id === m.cell_id);
      if (c) map.set(m.user_name, c);
    });
    return map;
  }, [cellMembers, cells]);

  // 3. 필터링된 성도 목록
  const processedUsers = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return users.filter(u => {
      if (selectedOfficeFilter !== 'ALL' && (u.office || '성도') !== selectedOfficeFilter) return false;
      const cellObj = userCellMap.get(u.name);

      if (selectedCellFilter !== 'ALL') {
        if (selectedCellFilter === 'UNASSIGNED' && cellObj) return false;
        if (selectedCellFilter !== 'UNASSIGNED' && cellObj?.id !== selectedCellFilter) return false;
      }

      // 상태별 탭 필터
      const careInfo = userCareAnalysis.get(u.name);
      const st = careInfo?.status || 'green';
      if (selectedStatusTab === 'RED' && st !== 'red') return false;
      if (selectedStatusTab === 'YELLOW' && st !== 'yellow') return false;
      if (selectedStatusTab === 'GREEN' && st !== 'green') return false;
      if (selectedStatusTab === 'UNASSIGNED' && cellObj) return false;

      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        (u.office || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q) ||
        (cellObj?.name || '').toLowerCase().includes(q)
      );
    });
  }, [users, userCellMap, userCareAnalysis, selectedOfficeFilter, selectedCellFilter, selectedStatusTab, searchQuery]);

  // 4. 상단 통계 요약 (출석 데이터 기반 실시간 자동 동기화)
  const stats = useMemo(() => {
    const total = users.length;
    const assigned = users.filter(u => userCellMap.has(u.name)).length;
    const leaders = users.filter(u => ['목자', '부목자', '간사', '교역자'].includes(u.role) || ['장로', '권사', '안수집사'].includes(u.office)).length;

    let redCount = 0;
    let yellowCount = 0;
    users.forEach(u => {
      const st = userCareAnalysis.get(u.name)?.status || 'green';
      if (st === 'red') redCount++;
      else if (st === 'yellow') yellowCount++;
    });

    return { 
      total, 
      assignedRate: total > 0 ? Math.round((assigned / total) * 100) : 0, 
      redCount,
      yellowCount,
      leaders 
    };
  }, [users, userCellMap, userCareAnalysis]);

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
          setUsers(prev => [...prev, data[0]]);
          if (targetCellIdForNewUser) {
            await supabase.from('cell_members').upsert([
              { cell_id: targetCellIdForNewUser, user_name: payload.name, assigned_role: payload.role }
            ], { onConflict: 'user_name' });
          }
        }
      } else {
        setUsers(prev => [...prev, payload]);
      }
      setNewUserName('');
      setTargetCellIdForNewUser('');
      setShowAddModal(false);
      alert(`[${payload.name}] 성도가 명부에 성공적으로 등록되었습니다.`);
    } catch (err) { alert(`등록 실패: ${err.message}`); }
  };

  // 인라인 목장 즉시 변경
  const handleQuickReassignCell = async (userName, targetCellId) => {
    if (!userName) return;
    try {
      if (targetCellId === '') {
        // 목장 제외
        if (supabase) await supabase.from('cell_members').delete().eq('user_name', userName);
        window.dispatchEvent(new Event('storage'));
        alert(`[${userName}] 성도가 목장에서 제외(미배정)되었습니다.`);
      } else {
        const targetCell = cells.find(c => c.id === targetCellId);
        if (supabase) {
          await supabase.from('cell_members').upsert([
            { cell_id: targetCellId, user_name: userName, assigned_role: '목원' }
          ], { onConflict: 'user_name' });
        }
        window.dispatchEvent(new Event('storage'));
        alert(`[${userName}] 성도가 [${targetCell?.name || '선택 목장'}]으로 재배정되었습니다.`);
      }
    } catch (err) {
      alert('목장 배정 변경 오류: ' + err.message);
    }
  };

  // 성도 삭제
  const handleDeleteUser = async (userName) => {
    if (!window.confirm(`[${userName}] 성도의 등록 데이터와 소속 목장 정보를 영구 삭제하시겠습니까?`)) return;
    try {
      setUsers(prev => prev.filter(u => u.name !== userName));
      if (activeSideUser?.name === userName) setActiveSideUser(null);
      if (supabase) {
        await supabase.from('cell_members').delete().eq('user_name', userName);
        await supabase.from('app_users').delete().eq('name', userName);
      }
    } catch (err) { alert(`삭제 오류: ${err.message}`); }
  };

  // 전교인 통합 명부 CSV 내보내기
  const exportPeopleCSV = () => {
    if (users.length === 0) return alert('내보낼 성도 데이터가 없습니다.');
    let csvContent = '\uFEFF';
    csvContent += '번호,성도명,교회직분,사역직책,소속목장,케어상태,연속결석주차,최근출석일\n';

    processedUsers.forEach((u, idx) => {
      const cellObj = userCellMap.get(u.name);
      const care = userCareAnalysis.get(u.name);
      const stText = care?.status === 'red' ? '긴급심방' : care?.status === 'yellow' ? '주의관찰' : '정상안정';
      csvContent += `"${idx + 1}","${u.name}","${u.office || '성도'}","${u.role || '목원'}","${cellObj?.name || '미배정'}","${stText}","${care?.absStreak || 0}주","${care?.lastAttendedDate || '-'}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `성도통합명부_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden box-border font-sans select-none text-zinc-900">
      
      {/* =========================================================================
          [1] 상단 실시간 동기화 KPI 대시보드
          ========================================================================= */}
      <div className="shrink-0 bg-zinc-50/70 border-b border-zinc-200 px-5 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-4 shadow-2xs">
        <div className="flex flex-col justify-center">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-0.5">등록 교인 총원</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[22px] font-black font-mono text-zinc-900 leading-none">{stats.total}</span>
            <span className="text-[11px] font-bold text-zinc-500">명</span>
          </div>
        </div>

        <div className="flex flex-col justify-center border-l border-zinc-200 pl-4">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-0.5">목장 배치율</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[22px] font-black font-mono text-indigo-600 leading-none">{stats.assignedRate}%</span>
            <span className="text-[11px] font-bold text-zinc-500">배정 완료</span>
          </div>
        </div>

        <div className="flex flex-col justify-center border-l border-zinc-200 pl-4">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-0.5">핵심 제직·리더십</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[22px] font-black font-mono text-zinc-800 leading-none">{stats.leaders}</span>
            <span className="text-[11px] font-bold text-zinc-500">명 활동</span>
          </div>
        </div>

        {/* 🌟 출석부와 실시간 연동된 집중 케어 현황 */}
        <div className="flex flex-col justify-center border-l border-zinc-200 pl-4">
          <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            집중 케어 필요군 (출석 연동)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-[22px] font-black font-mono text-rose-600 leading-none">{stats.redCount}</span>
            <span className="text-[11px] font-mono font-bold text-amber-700">
              (주의: {stats.yellowCount}명)
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          [2] 액션 툴바 & 상태별 탭 필터
          ========================================================================= */}
      <div className="shrink-0 bg-white border-b border-zinc-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          
          {/* 상태별 원클릭 탭 */}
          <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-[11px] font-bold shadow-inner">
            <button 
              onClick={() => setSelectedStatusTab('ALL')} 
              className={`px-2.5 py-1 rounded transition-all ${selectedStatusTab === 'ALL' ? 'bg-white text-zinc-900 shadow-2xs font-black' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              전체 ({users.length})
            </button>
            <button 
              onClick={() => setSelectedStatusTab('RED')} 
              className={`px-2.5 py-1 rounded transition-all ${selectedStatusTab === 'RED' ? 'bg-white text-rose-700 shadow-2xs font-black' : 'text-zinc-500 hover:text-rose-700'}`}
            >
              긴급 ({stats.redCount})
            </button>
            <button 
              onClick={() => setSelectedStatusTab('YELLOW')} 
              className={`px-2.5 py-1 rounded transition-all ${selectedStatusTab === 'YELLOW' ? 'bg-white text-amber-800 shadow-2xs font-black' : 'text-zinc-500 hover:text-amber-800'}`}
            >
              주의 ({stats.yellowCount})
            </button>
            <button 
              onClick={() => setSelectedStatusTab('UNASSIGNED')} 
              className={`px-2.5 py-1 rounded transition-all ${selectedStatusTab === 'UNASSIGNED' ? 'bg-white text-zinc-900 shadow-2xs font-black' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              미배정
            </button>
          </div>

          <div className="relative flex items-center w-40 sm:w-52">
            <span className="absolute left-2.5 text-zinc-400 pointer-events-none"><SvgSearch /></span>
            <input 
              type="text" 
              placeholder="성도명, 목장 검색..." 
              value={searchQuery || ''} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="w-full pl-8 pr-3 py-1.5 text-[11.5px] bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:bg-white focus:border-zinc-800 text-zinc-900 font-bold placeholder:text-zinc-400 transition-all shadow-2xs" 
            />
          </div>

          <select 
            value={selectedOfficeFilter} 
            onChange={e => setSelectedOfficeFilter(e.target.value)} 
            className="px-2.5 py-1.5 text-[11.5px] bg-zinc-50 border border-zinc-200 rounded-lg outline-none text-zinc-700 font-bold cursor-pointer"
          >
            <option value="ALL">전체 직분</option>
            {CHURCH_OFFICES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <select 
            value={selectedCellFilter} 
            onChange={e => setSelectedCellFilter(e.target.value)} 
            className="px-2.5 py-1.5 text-[11.5px] bg-zinc-50 border border-zinc-200 rounded-lg outline-none text-zinc-700 font-bold cursor-pointer"
          >
            <option value="ALL">전체 목장</option>
            <option value="UNASSIGNED">미배정 성도</option>
            {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={exportPeopleCSV}
            className="px-3 py-1.5 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 text-[11.5px] font-bold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            title="성도 명부 CSV 다운로드"
          >
            <SvgDownload /> CSV 추출
          </button>
          
          <button 
            onClick={() => setShowAddModal(true)} 
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[11.5px] font-black rounded-lg shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <SvgPlus /> 성도 신규 등록
          </button>
        </div>
      </div>

      {/* =========================================================================
          [3] 성도 데이터 테이블 뷰
          ========================================================================= */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative bg-zinc-50/30">
        <div className="flex-1 overflow-x-auto overflow-y-auto hide-scrollbar border-r border-zinc-200 bg-white">
          {processedUsers.length === 0 ? (
            <div className="py-24 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-300"><SvgUsers /></div>
              <p className="text-[13px] font-bold text-zinc-500">조건에 일치하는 성도 정보가 없습니다.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-[12px] min-w-[860px] table-fixed">
              <colgroup>
                <col className="w-12" />
                <col className="w-20 text-center" />
                <col className="w-36" />
                <col className="w-24" />
                <col className="w-24" />
                <col className="w-36" />
                <col className="w-36" />
                <col className="w-16 text-center" />
                <col className="w-24 text-right" />
              </colgroup>
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/90 text-zinc-400 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10 shadow-2xs">
                  <th className="py-2.5 px-3 text-center">번호</th>
                  <th className="py-2.5 px-2 text-center">건강상태</th>
                  <th className="py-2.5 px-3">성도명</th>
                  <th className="py-2.5 px-3">교회 직분</th>
                  <th className="py-2.5 px-3">사역 직책</th>
                  <th className="py-2.5 px-3">소속 목장</th>
                  <th className="py-2.5 px-3">최근 4주 출결</th>
                  <th className="py-2.5 px-2 text-center">초기암호</th>
                  <th className="py-2.5 px-3 text-right">관리 작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white font-medium">
                {processedUsers.map((u, idx) => {
                  const cellObj = userCellMap.get(u.name);
                  const careInfo = userCareAnalysis.get(u.name);
                  const health = careInfo?.status || 'green';
                  const isSelected = activeSideUser?.name === u.name;

                  return (
                    <tr 
                      key={u.name} 
                      onClick={() => setActiveSideUser(u)} 
                      className={`cursor-pointer transition-colors group ${isSelected ? 'bg-zinc-100/70' : 'hover:bg-zinc-50/70'}`}
                    >
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-zinc-400">
                        {String(idx + 1).padStart(3, '0')}
                      </td>

                      {/* 🌟 출석 기록 연동 건강 신호등 (수동 클릭 토글도 100% 지원) */}
                      <td className="py-2.5 px-2 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            type="button" 
                            onClick={(e) => handleCycleHealthStatus(u.name, e)} 
                            title={`${careInfo?.statusLabel} (클릭 시 수동 전환)`}
                            className={`w-3.5 h-3.5 rounded-full inline-block cursor-pointer transition-transform hover:scale-125 ${
                              health === 'green' 
                                ? 'bg-emerald-500 ring-2 ring-emerald-100' 
                                : health === 'yellow' 
                                ? 'bg-amber-400 ring-4 ring-amber-100' 
                                : 'bg-rose-500 ring-4 ring-rose-100 animate-pulse'
                            }`} 
                          />
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-black text-zinc-900 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-600 flex items-center justify-center text-[10px] font-black shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <span className="truncate">{u.name}</span>
                      </td>

                      <td className="py-2.5 px-3 font-bold text-zinc-700">
                        <span className="px-2 py-0.5 rounded bg-zinc-50 text-zinc-600 border border-zinc-200/80 text-[11px]">
                          {u.office || '성도'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className={`text-[11px] font-bold ${['목자', '부목자'].includes(u.role) ? 'text-indigo-600' : 'text-zinc-500'}`}>
                          {u.role || '목원'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        {cellObj ? (
                          <span className="font-bold text-zinc-800 text-[11.5px] flex items-center gap-1.5 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 shrink-0" />
                            {cellObj.name}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            미배정
                          </span>
                        )}
                      </td>

                      {/* 🌟 최근 4주 주일 출석 미니 스파크 도트 */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          {(careInfo?.recentFourWeeks || []).map((w, wIdx) => (
                            <span 
                              key={wIdx} 
                              title={`${w.date}: ${w.attended ? '출석' : '결석'}`}
                              className={`w-2 h-2 rounded-full ${w.attended ? 'bg-zinc-800' : 'bg-zinc-200'}`} 
                            />
                          ))}
                          <span className="text-[10px] font-mono text-zinc-400 ml-1 truncate">
                            {careInfo?.absStreak > 0 ? `${careInfo.absStreak}주 결석` : '성수'}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center font-mono text-[11px] text-zinc-400">
                        1004
                      </td>

                      <td className="py-2.5 px-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            type="button" 
                            onClick={() => setCareTargetUser(u)} 
                            className="px-2 py-1 rounded-md text-[10.5px] font-bold bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 transition-colors cursor-pointer shadow-2xs"
                          >
                            케어
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleDeleteUser(u.name)} 
                            className="p-1 rounded-md text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
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

        {/* =========================================================================
            [4] 우측 성도 상세 인텔리전스 Drawer (목장 즉시 재배정 기능 탑재)
            ========================================================================= */}
        {activeSideUser && (() => {
          const careInfo = userCareAnalysis.get(activeSideUser.name);
          const currentCell = userCellMap.get(activeSideUser.name);

          return (
            <div className="w-[300px] bg-white border-l border-zinc-200 p-5 flex flex-col gap-4.5 shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.05)] animate-fade-in z-20 overflow-y-auto hide-scrollbar">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">성도 상세 카드</span>
                <button onClick={() => setActiveSideUser(null)} className="text-zinc-400 hover:text-zinc-800 cursor-pointer p-1 rounded-md hover:bg-zinc-100 transition-colors"><SvgClose /></button>
              </div>

              <div className="flex flex-col items-center text-center gap-1.5 py-1">
                <div className="w-13 h-13 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-black text-lg shadow-sm">
                  {activeSideUser.name.charAt(0)}
                </div>
                <h4 className="text-[17px] font-black text-zinc-900 tracking-tight mt-1">{activeSideUser.name}</h4>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">{activeSideUser.office || '성도'}</span>
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{activeSideUser.role || '목원'}</span>
                </div>
              </div>

              <div className="space-y-2.5 text-[12px]">
                {/* 🌟 즉시 목장 변경 드롭다운 */}
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1.5">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">소속 목장 재배정</span>
                  <select 
                    value={currentCell?.id || ''} 
                    onChange={e => handleQuickReassignCell(activeSideUser.name, e.target.value)}
                    className="w-full p-2 bg-white border border-zinc-200 rounded-lg text-[12px] font-bold text-zinc-800 outline-none cursor-pointer"
                  >
                    <option value="">미배정 (목장 없음)</option>
                    {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* 영적 건강 & 결석 현황 */}
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex flex-col gap-2">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block">출석 연동 케어 상태</span>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${careInfo?.status === 'green' ? 'bg-emerald-500' : careInfo?.status === 'yellow' ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'}`} />
                      <span className={`font-black text-[12.5px] ${careInfo?.status === 'green' ? 'text-emerald-700' : careInfo?.status === 'yellow' ? 'text-amber-800' : 'text-rose-700'}`}>
                        {careInfo?.statusLabel}
                      </span>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => handleCycleHealthStatus(activeSideUser.name, e)} 
                      className="px-2 py-1 rounded text-[10px] font-bold bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-600 cursor-pointer shadow-2xs"
                    >
                      상태 전환
                    </button>
                  </div>
                  <div className="text-[10.5px] font-mono text-zinc-400 border-t border-zinc-200/60 pt-1.5 flex justify-between">
                    <span>최근 출석: {careInfo?.lastAttendedDate}</span>
                    <span>결석 {careInfo?.absStreak || 0}주차</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"><SvgKey /> 로그인 정보</span>
                  <span className="text-[11.5px] font-mono font-medium text-zinc-600 block">초기 암호: 1004</span>
                </div>
              </div>

              <div className="mt-auto space-y-2 pt-3 border-t border-zinc-100">
                <button 
                  type="button" 
                  onClick={() => setCareTargetUser(activeSideUser)} 
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-[11.5px] font-black shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <SvgUserCheck /> 심방 및 케어 일지 작성
                </button>
                <button 
                  type="button" 
                  onClick={() => handleDeleteUser(activeSideUser.name)} 
                  className="w-full py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  성도 명부에서 제외
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* =========================================================================
          [5] 성도 신규 등록 모달
          ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-fade-in select-none">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-zinc-200 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="text-[15.5px] font-black text-zinc-900 tracking-tight">새 교인 명부 등록</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-800 cursor-pointer p-1 rounded hover:bg-zinc-100"><SvgClose /></button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-3.5 text-[12px]">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500 block mb-1">성도 성명 <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="예: 홍길동" 
                  value={newUserName} 
                  onChange={e => setNewUserName(e.target.value)} 
                  className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-xl outline-none focus:border-zinc-800 font-bold text-zinc-900 transition-all placeholder:text-zinc-300" 
                  autoFocus 
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500 block mb-1">교회 직분</label>
                  <select 
                    value={newUserOffice} 
                    onChange={e => setNewUserOffice(e.target.value)} 
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-800 outline-none cursor-pointer"
                  >
                    {CHURCH_OFFICES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500 block mb-1">사역 직책</label>
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
                <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500 block mb-1">초기 목장 배정 (선택)</label>
                <select 
                  value={targetCellIdForNewUser} 
                  onChange={e => setTargetCellIdForNewUser(e.target.value)} 
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-800 outline-none cursor-pointer"
                >
                  <option value="">미배정으로 등록</option>
                  {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="pt-2 flex gap-2">
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
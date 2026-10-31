// src/components/admin/AdminRolesTab.js
import React, { useState, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

// =====================================================================
// ✒️ 엔터프라이즈 모노크롬 SVG 아이콘 세트 (Linear / Okta IAM 규격)
// =====================================================================
const SvgShield = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);
const SvgSearch = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);
const SvgLock = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);
const SvgInfo = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);
const SvgDownload = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);
const SvgCheck = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const CHURCH_OFFICES = ['성도', '집사', '안수집사', '권사', '장로', '전도사', '목사'];
const MINISTRY_ROLES = ['목원', '부목자', '목자', '간사', '교사', '팀장'];

const OFFICE_RANK = {
  '목사': 1,
  '전도사': 2,
  '장로': 3,
  '권사': 4,
  '안수집사': 5,
  '집사': 6,
  '성도': 7
};

const ROLE_RANK = {
  '목자': 1,
  '간사': 2,
  '팀장': 3,
  '부목자': 4,
  '교사': 5,
  '목원': 6
};

export default function AdminRolesTab({ users = [], setUsers, authUser }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'ADMIN' | 'SHEPHERD' | 'REGULAR'
  const [officeFilter, setOfficeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('SCOPE_DESC'); // 'SCOPE_DESC' | 'OFFICE_ASC' | 'ROLE_ASC' | 'NAME_ASC'
  const [showPolicyMatrix, setShowPolicyMatrix] = useState(false);

  // 다중 계정 일괄 직분/직책 변경 상태
  const [selectedUserNames, setSelectedUserNames] = useState(new Set());
  const [bulkOffice, setBulkOffice] = useState('');
  const [bulkRole, setBulkRole] = useState('');
  const [auditToast, setAuditToast] = useState(null);

  const triggerAuditToast = useCallback((msg) => {
    setAuditToast(msg);
    setTimeout(() => setAuditToast(null), 2400);
  }, []);

  // 1. 상단 RBAC 거버넌스 통계 집계
  const stats = useMemo(() => {
    const total = users.length;
    const adminCount = users.filter(
      u => u.is_admin || u.name === '정신동' || u.name === '관리자'
    ).length;
    const shepherdCount = users.filter(u =>
      ['목자', '부목자', '간사'].includes(u.role)
    ).length;
    const regularCount = Math.max(0, total - adminCount);
    const ordainedCount = users.filter(u =>
      ['목사', '전도사', '장로', '권사', '안수집사'].includes(u.office)
    ).length;

    return { total, adminCount, shepherdCount, regularCount, ordainedCount };
  }, [users]);

  // 2. 필터링 및 다중 정렬된 계정 목록
  const filteredUsers = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    const list = (users || []).filter(u => {
      const isMaster = u.name === '정신동' || u.name === '관리자';
      const hasAdminAccess = !!u.is_admin || isMaster;
      const isShepherd = ['목자', '부목자', '간사'].includes(u.role);

      if (roleFilter === 'ADMIN' && !hasAdminAccess) return false;
      if (roleFilter === 'SHEPHERD' && !isShepherd) return false;
      if (roleFilter === 'REGULAR' && (hasAdminAccess || isShepherd)) return false;
      if (officeFilter !== 'ALL' && (u.office || '성도') !== officeFilter) return false;

      if (!q) return true;
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.office || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      const getScopeWeight = (user) => {
        if (user.name === '정신동' || user.name === '관리자') return 4;
        if (user.is_admin) return 3;
        if (['목자', '부목자', '간사'].includes(user.role)) return 2;
        return 1;
      };

      if (sortBy === 'SCOPE_DESC') {
        const diff = getScopeWeight(b) - getScopeWeight(a);
        if (diff !== 0) return diff;
        return (OFFICE_RANK[a.office || '성도'] || 99) - (OFFICE_RANK[b.office || '성도'] || 99);
      }
      if (sortBy === 'OFFICE_ASC') {
        const diff = (OFFICE_RANK[a.office || '성도'] || 99) - (OFFICE_RANK[b.office || '성도'] || 99);
        if (diff !== 0) return diff;
        return (a.name || '').localeCompare(b.name || '', 'ko');
      }
      if (sortBy === 'ROLE_ASC') {
        const diff = (ROLE_RANK[a.role || '목원'] || 99) - (ROLE_RANK[b.role || '목원'] || 99);
        if (diff !== 0) return diff;
        return (a.name || '').localeCompare(b.name || '', 'ko');
      }
      if (sortBy === 'NAME_ASC') {
        return (a.name || '').localeCompare(b.name || '', 'ko');
      }
      return 0;
    });
  }, [users, roleFilter, officeFilter, searchQuery, sortBy]);

  // 3. 개별 직분 / 직책 / 콘솔 인가 핸들러 (원본 100% 호환)
  const handleUpdateOffice = async (userName, newOffice) => {
    setUsers(prev => prev.map(u => (u.name === userName ? { ...u, office: newOffice } : u)));
    if (supabase) {
      try {
        await supabase.from('app_users').update({ office: newOffice }).eq('name', userName);
      } catch (err) {}
    }
    triggerAuditToast(`[${userName}] 계정의 항존 직분이 '${newOffice}'(으)로 변경되었습니다.`);
  };

  const handleUpdateRole = async (userName, newRole) => {
    setUsers(prev => prev.map(u => (u.name === userName ? { ...u, role: newRole } : u)));
    if (userName === authUser?.name) {
      try {
        const stored = localStorage.getItem('church_auth_user');
        if (stored) {
          localStorage.setItem(
            'church_auth_user',
            JSON.stringify({ ...JSON.parse(stored), role: newRole })
          );
          window.dispatchEvent(new Event('storage'));
        }
      } catch (e) {}
    }
    if (supabase) {
      try {
        await supabase.from('app_users').update({ role: newRole }).eq('name', userName);
      } catch (err) {}
    }
    triggerAuditToast(`[${userName}] 계정의 사역 직책이 '${newRole}'(으)로 변경되었습니다.`);
  };

  const handleToggleAdminAccess = async (userName, currentStatus) => {
    if (userName === '정신동') {
      return alert('최고 총괄 관리자(정신동)의 권한은 해제할 수 없습니다.');
    }
    const nextStatus = !currentStatus;
    setUsers(prev => prev.map(u => (u.name === userName ? { ...u, is_admin: nextStatus } : u)));

    if (userName === authUser?.name) {
      try {
        const stored = localStorage.getItem('church_auth_user');
        if (stored) {
          localStorage.setItem(
            'church_auth_user',
            JSON.stringify({ ...JSON.parse(stored), is_admin: nextStatus })
          );
          window.dispatchEvent(new Event('storage'));
        }
      } catch (e) {}
    }
    if (supabase) {
      try {
        await supabase.from('app_users').update({ is_admin: nextStatus }).eq('name', userName);
      } catch (err) {
        alert('권한 수정 실패: ' + err.message);
      }
    }
    triggerAuditToast(
      nextStatus
        ? `[${userName}] 계정에게 시스템 콘솔(Admin) 접근 권한이 부여되었습니다.`
        : `[${userName}] 계정의 시스템 콘솔 접근 권한이 회수되었습니다.`
    );
  };

  // 4. 다중 선택 및 일괄 직분/직책 업데이트
  const handleToggleSelectUser = (userName) => {
    setSelectedUserNames(prev => {
      const next = new Set(prev);
      if (next.has(userName)) next.delete(userName);
      else next.add(userName);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (filteredUsers.length > 0 && selectedUserNames.size === filteredUsers.length) {
      setSelectedUserNames(new Set());
    } else {
      setSelectedUserNames(new Set(filteredUsers.map(u => u.name)));
    }
  };

  const handleApplyBulkUpdate = async () => {
    if (selectedUserNames.size === 0) return;
    if (!bulkOffice && !bulkRole) {
      return alert('일괄 적용할 교회 직분 또는 사역 직책을 선택해 주세요.');
    }

    const targets = Array.from(selectedUserNames);
    const updatePatch = {};
    if (bulkOffice) updatePatch.office = bulkOffice;
    if (bulkRole) updatePatch.role = bulkRole;

    setUsers(prev =>
      prev.map(u => (selectedUserNames.has(u.name) ? { ...u, ...updatePatch } : u))
    );

    if (supabase) {
      try {
        await supabase.from('app_users').update(updatePatch).in('name', targets);
      } catch (_) {}
    }

    setSelectedUserNames(new Set());
    setBulkOffice('');
    setBulkRole('');
    triggerAuditToast(`${targets.length}명의 계정 권한·직책이 일괄 업데이트되었습니다.`);
  };

  // 5. RBAC 권한 명부 CSV 내보내기
  const handleExportRolesCSV = useCallback(() => {
    if (filteredUsers.length === 0) return;
    const headers = ['No', '계정식별자', '교회직분', '사역직책', '콘솔인가여부', '보안스코프'];
    const rows = filteredUsers.map((u, idx) => {
      const isMaster = u.name === '정신동' || u.name === '관리자';
      const hasAdminAccess = !!u.is_admin || isMaster;
      const isShepherd = ['목자', '부목자', '간사'].includes(u.role);
      const scopeLabel = isMaster
        ? 'Root / Admin'
        : hasAdminAccess
        ? 'Operator'
        : isShepherd
        ? 'Field Leader'
        : 'Standard';

      return [
        idx + 1,
        `"${(u.name || '').replace(/"/g, '""')}"`,
        u.office || '성도',
        u.role || '목원',
        hasAdminAccess ? '허용' : '차단',
        scopeLabel
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RBAC_권한거버넌스명부_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredUsers]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-zinc-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden box-border font-sans select-none text-zinc-900 relative">
      
      {/* 실시간 보안 감사(Audit) 피드백 토스트 */}
      {auditToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[400] px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold shadow-2xl border border-white/15 flex items-center gap-2 animate-fade-in whitespace-nowrap">
          <SvgCheck />
          <span>{auditToast}</span>
        </div>
      )}

      {/* =========================================================================
          [1] 상단 RBAC 거버넌스 KPI 벤토 그리드 (줄바꿈 0% 보장)
         ========================================================================= */}
      <div className="shrink-0 bg-zinc-50/80 border-b border-zinc-200/90 px-4 sm:px-5 py-3.5 grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        <div
          onClick={() => setRoleFilter('ALL')}
          className="bg-white rounded-xl border border-zinc-200/80 hover:border-zinc-400 p-3 flex flex-col justify-between shadow-2xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between gap-2 whitespace-nowrap">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
              전체 등록 계정
            </span>
            <span className="text-[10px] font-mono font-bold text-zinc-600 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200 tabular-nums">
              조회 {filteredUsers.length}명
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1.5 whitespace-nowrap">
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-black font-mono text-zinc-900 leading-none tabular-nums">
                {stats.total}
              </span>
              <span className="text-[11px] font-bold text-zinc-500">명</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 tabular-nums">
              중직자 {stats.ordainedCount}명
            </span>
          </div>
        </div>

        <div
          onClick={() => setRoleFilter(roleFilter === 'ADMIN' ? 'ALL' : 'ADMIN')}
          className="bg-white rounded-xl border border-zinc-200/80 hover:border-indigo-300 p-3 flex flex-col justify-between shadow-2xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between gap-2 whitespace-nowrap">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider flex items-center gap-1">
              <SvgShield /> 시스템 관리자 (Admin)
            </span>
            <span className="text-[9.5px] font-mono font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
              ROOT / OP
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1.5 whitespace-nowrap">
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-black font-mono text-indigo-700 leading-none tabular-nums">
                {stats.adminCount}
              </span>
              <span className="text-[11px] font-bold text-indigo-500">명 인가됨</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">콘솔 전권</span>
          </div>
        </div>

        <div
          onClick={() => setRoleFilter(roleFilter === 'SHEPHERD' ? 'ALL' : 'SHEPHERD')}
          className="bg-white rounded-xl border border-zinc-200/80 hover:border-emerald-300 p-3 flex flex-col justify-between shadow-2xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between gap-2 whitespace-nowrap">
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
              목양 리더십 (Shepherds)
            </span>
            <span className="text-[9.5px] font-mono font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              LEADER
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1.5 whitespace-nowrap">
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-black font-mono text-emerald-700 leading-none tabular-nums">
                {stats.shepherdCount}
              </span>
              <span className="text-[11px] font-bold text-emerald-600">명 활동</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">출석·상담실 권한</span>
          </div>
        </div>

        <div
          onClick={() => setRoleFilter(roleFilter === 'REGULAR' ? 'ALL' : 'REGULAR')}
          className="bg-white rounded-xl border border-zinc-200/80 hover:border-zinc-400 p-3 flex flex-col justify-between shadow-2xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between gap-2 whitespace-nowrap">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
              일반 등록 교인
            </span>
            <span className="text-[9.5px] font-mono font-bold text-zinc-600 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200">
              STANDARD
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1.5 whitespace-nowrap">
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-black font-mono text-zinc-900 leading-none tabular-nums">
                {stats.regularCount}
              </span>
              <span className="text-[11px] font-bold text-zinc-500">명</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">기본 앱 권한</span>
          </div>
        </div>

      </div>

      {/* =========================================================================
          [2] 툴바 및 정밀 필터 / 권한 매트릭스 안내 (줄바꿈 0% 보장)
         ========================================================================= */}
      <div className="shrink-0 bg-white border-b border-zinc-200/90 px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-[280px]">
          
          <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/80 text-[11px] font-bold overflow-x-auto hide-scrollbar">
            <button
              type="button"
              onClick={() => setRoleFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer tabular-nums ${
                roleFilter === 'ALL'
                  ? 'bg-white text-zinc-950 shadow-2xs font-black'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              전체 ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('ADMIN')}
              className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer tabular-nums ${
                roleFilter === 'ADMIN'
                  ? 'bg-white text-indigo-700 shadow-2xs font-black'
                  : 'text-zinc-500 hover:text-indigo-700'
              }`}
            >
              관리자 ({stats.adminCount})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('SHEPHERD')}
              className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer tabular-nums ${
                roleFilter === 'SHEPHERD'
                  ? 'bg-white text-emerald-700 shadow-2xs font-black'
                  : 'text-zinc-500 hover:text-emerald-700'
              }`}
            >
              목양 리더십 ({stats.shepherdCount})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('REGULAR')}
              className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                roleFilter === 'REGULAR'
                  ? 'bg-white text-zinc-950 shadow-2xs font-black'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              일반 성도
            </button>
          </div>

          <div className="relative flex items-center w-36 sm:w-52">
            <span className="absolute left-2.5 text-zinc-400 pointer-events-none"><SvgSearch /></span>
            <input
              type="text"
              placeholder="계정명, 직분, 직책 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-6 py-1.5 text-[11.5px] bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:bg-white focus:border-zinc-900 text-zinc-900 font-bold placeholder:text-zinc-400 transition-colors shadow-2xs"
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
            value={officeFilter}
            onChange={e => setOfficeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-[11px] bg-zinc-50 border border-zinc-200 rounded-lg outline-none text-zinc-700 font-bold cursor-pointer whitespace-nowrap"
          >
            <option value="ALL">전체 직분</option>
            {CHURCH_OFFICES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 text-[11px] bg-zinc-50 border border-zinc-200 rounded-lg outline-none text-zinc-700 font-bold cursor-pointer whitespace-nowrap"
          >
            <option value="SCOPE_DESC">권한 등급순</option>
            <option value="OFFICE_ASC">항존 직분순</option>
            <option value="ROLE_ASC">사역 직책순</option>
            <option value="NAME_ASC">이름 가나다순</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <button
            type="button"
            onClick={() => setShowPolicyMatrix(!showPolicyMatrix)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors ${
              showPolicyMatrix
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}
          >
            <SvgInfo /> 스코프 정책표
          </button>

          <button
            type="button"
            onClick={handleExportRolesCSV}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all whitespace-nowrap"
          >
            <SvgDownload /> CSV 추출
          </button>
        </div>
      </div>

      {/* RBAC 보안 스코프 정책 매트릭스 안내 바 (토글 시 오픈) */}
      {showPolicyMatrix && (
        <div className="shrink-0 bg-zinc-900 text-white px-4 sm:px-5 py-3 border-b border-zinc-800 grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-[11px] animate-fade-in">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
            <span className="font-mono text-[10px] font-black text-amber-400 block">ROOT / ADMIN</span>
            <p className="text-zinc-300 font-medium">시스템 전권, 권한 부여/회수, 교적부·목장 개편·상담실 통합 관제</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
            <span className="font-mono text-[10px] font-black text-indigo-400 block">OPERATOR (콘솔 허용)</span>
            <p className="text-zinc-300 font-medium">관리자 대시보드 진입, 공지 배포, 사역 일정 및 전체 출결 관제</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
            <span className="font-mono text-[10px] font-black text-emerald-400 block">FIELD LEADER (목자·간사)</span>
            <p className="text-zinc-300 font-medium">담당 목장 출석부 체크, 주간 목장보고서 제출, 신앙상담실(담당목장) 열람</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
            <span className="font-mono text-[10px] font-black text-zinc-400 block">STANDARD (일반 성도)</span>
            <p className="text-zinc-300 font-medium">개인 QT·맥체인·예배노트 작성, 1:1 신앙상담 요청, 목장 나눔 참여</p>
          </div>
        </div>
      )}

      {/* 다중 선택 일괄 직분/직책 변경 플로팅 바 */}
      {selectedUserNames.size > 0 && (
        <div className="shrink-0 bg-indigo-950 text-white px-4 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-bold whitespace-nowrap">
            <span className="px-2 py-0.5 rounded bg-amber-400 text-zinc-950 font-black tabular-nums">
              {selectedUserNames.size}명 선택됨
            </span>
            <span className="text-indigo-200">선택한 계정의 직분·직책을 일괄 변경합니다:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap ml-auto">
            <select
              value={bulkOffice}
              onChange={e => setBulkOffice(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-indigo-900 border border-indigo-700 text-white text-xs font-bold outline-none cursor-pointer"
            >
              <option value="">직분 유지...</option>
              {CHURCH_OFFICES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>

            <select
              value={bulkRole}
              onChange={e => setBulkRole(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-indigo-900 border border-indigo-700 text-white text-xs font-bold outline-none cursor-pointer"
            >
              <option value="">사역직책 유지...</option>
              {MINISTRY_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <button
              type="button"
              onClick={handleApplyBulkUpdate}
              className="px-3 py-1 rounded-lg bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-black cursor-pointer whitespace-nowrap"
            >
              일괄 적용
            </button>
            <button
              type="button"
              onClick={() => setSelectedUserNames(new Set())}
              className="px-2 py-1 rounded-lg text-indigo-300 hover:text-white text-xs font-bold cursor-pointer"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          [3] 고밀도 RBAC 데이터 뷰포트 (PC 정밀 그리드 + 모바일 보안 카드)
         ========================================================================= */}
      <div className="flex-1 w-full overflow-x-auto overflow-y-auto hide-scrollbar bg-zinc-50/40">
        {filteredUsers.length === 0 ? (
          <div className="py-24 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-300 shadow-2xs">
              <SvgLock />
            </div>
            <p className="text-[13px] font-bold text-zinc-500">조건에 일치하는 계정이 없습니다.</p>
          </div>
        ) : (
          <>
            {/* 💻 데스크톱 & 태블릿 가로 뷰: 정밀 RBAC 테이블 */}
            <table className="hidden md:table w-full text-left border-collapse text-[12.5px]">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/95 text-zinc-400 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10 whitespace-nowrap">
                  <th className="py-2.5 px-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredUsers.length > 0 && selectedUserNames.size === filteredUsers.length}
                      onChange={handleToggleSelectAll}
                      className="w-3.5 h-3.5 rounded accent-zinc-900 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3 w-12 text-center">No</th>
                  <th className="py-2.5 px-4">계정 식별자</th>
                  <th className="py-2.5 px-4 w-40">교회 직분 (항존직)</th>
                  <th className="py-2.5 px-4 w-40">사역 직책 (목양)</th>
                  <th className="py-2.5 px-5 w-48 text-center">시스템 콘솔 (Admin) 인가</th>
                  <th className="py-2.5 px-4 w-36 text-right">보안 스코프</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white font-medium">
                {filteredUsers.map((u, idx) => {
                  const isMaster = u.name === '정신동' || u.name === '관리자';
                  const hasAdminAccess = !!u.is_admin || isMaster;
                  const isShepherd = ['목자', '부목자', '간사'].includes(u.role);
                  const isChecked = selectedUserNames.has(u.name);

                  return (
                    <tr
                      key={u.name}
                      className={`transition-colors whitespace-nowrap ${
                        isChecked ? 'bg-zinc-50' : 'hover:bg-zinc-50/80'
                      }`}
                    >
                      <td className="py-2.5 px-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectUser(u.name)}
                          className="w-3.5 h-3.5 rounded accent-zinc-900 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-zinc-400 tabular-nums">
                        {String(idx + 1).padStart(3, '0')}
                      </td>
                      <td className="py-2.5 px-4 font-black text-zinc-900">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 shadow-2xs ${
                              isMaster
                                ? 'bg-zinc-900 text-white'
                                : hasAdminAccess
                                ? 'bg-indigo-600 text-white'
                                : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                            }`}
                          >
                            {u.name.charAt(0)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isMaster && (
                              <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-zinc-900 text-amber-400 uppercase tracking-wider">
                                SUPER ADMIN
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <select
                          value={u.office || '성도'}
                          onChange={(e) => handleUpdateOffice(u.name, e.target.value)}
                          className="px-3 py-1.5 text-[12px] bg-zinc-50 hover:bg-white border border-zinc-200 rounded-lg outline-none font-bold text-zinc-800 cursor-pointer focus:border-zinc-900 transition-colors w-full max-w-[130px]"
                        >
                          {CHURCH_OFFICES.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                      <td className="py-2.5 px-4">
                        <select
                          value={u.role || '목원'}
                          onChange={(e) => handleUpdateRole(u.name, e.target.value)}
                          className={`px-3 py-1.5 text-[12px] rounded-lg outline-none font-bold cursor-pointer border transition-colors w-full max-w-[130px] shadow-2xs ${
                            isShepherd
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-white'
                          }`}
                        >
                          {MINISTRY_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="py-2.5 px-5 text-center">
                        <div className="flex items-center justify-center">
                          {isMaster ? (
                            <span className="px-3 py-1.5 rounded-lg text-[11px] font-black bg-zinc-900 text-white inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap">
                              <SvgShield /> 마스터 전권
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleAdminAccess(u.name, hasAdminAccess)}
                              className={`w-[122px] py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs border whitespace-nowrap ${
                                hasAdminAccess
                                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 font-black'
                                  : 'bg-white hover:bg-zinc-50 text-zinc-500 border-zinc-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  hasAdminAccess ? 'bg-white animate-pulse' : 'bg-zinc-300'
                                }`}
                              />
                              {hasAdminAccess ? '콘솔 접속 허용' : '접근 차단됨'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider border whitespace-nowrap ${
                            isMaster
                              ? 'bg-zinc-900 text-amber-400 border-zinc-900'
                              : hasAdminAccess
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : isShepherd
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-zinc-50 text-zinc-400 border-zinc-200'
                          }`}
                        >
                          {isMaster
                            ? 'Root / Admin'
                            : hasAdminAccess
                            ? 'Operator'
                            : isShepherd
                            ? 'Field Leader'
                            : 'Standard'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 📱 모바일 전용 고밀도 RBAC 카드 리스트 (가로 스크롤 0%) */}
            <div className="md:hidden p-3 space-y-2.5">
              {filteredUsers.map((u, idx) => {
                const isMaster = u.name === '정신동' || u.name === '관리자';
                const hasAdminAccess = !!u.is_admin || isMaster;
                const isShepherd = ['목자', '부목자', '간사'].includes(u.role);

                return (
                  <div
                    key={u.name}
                    className="p-3.5 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                            isMaster
                              ? 'bg-zinc-900 text-white'
                              : hasAdminAccess
                              ? 'bg-indigo-600 text-white'
                              : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                          }`}
                        >
                          {u.name.charAt(0)}
                        </div>
                        <span className="text-[14px] font-black text-zinc-900 truncate">{u.name}</span>
                        <span className="text-[10px] font-mono text-zinc-400 tabular-nums">
                          #{String(idx + 1).padStart(3, '0')}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase border shrink-0 ${
                          isMaster
                            ? 'bg-zinc-900 text-amber-400 border-zinc-900'
                            : hasAdminAccess
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : isShepherd
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-zinc-50 text-zinc-400 border-zinc-200'
                        }`}
                      >
                        {isMaster
                          ? 'Root / Admin'
                          : hasAdminAccess
                          ? 'Operator'
                          : isShepherd
                          ? 'Field Leader'
                          : 'Standard'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1">교회 직분</label>
                        <select
                          value={u.office || '성도'}
                          onChange={(e) => handleUpdateOffice(u.name, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-800 outline-none"
                        >
                          {CHURCH_OFFICES.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1">사역 직책</label>
                        <select
                          value={u.role || '목원'}
                          onChange={(e) => handleUpdateRole(u.name, e.target.value)}
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none ${
                            isShepherd
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                          }`}
                        >
                          {MINISTRY_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between whitespace-nowrap">
                      <span className="text-[11px] font-bold text-zinc-500">시스템 콘솔(Admin) 권한</span>
                      {isMaster ? (
                        <span className="px-3 py-1 rounded-lg text-[11px] font-black bg-zinc-900 text-white inline-flex items-center gap-1">
                          <SvgShield /> 마스터 전권
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleAdminAccess(u.name, hasAdminAccess)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            hasAdminAccess
                              ? 'bg-indigo-600 text-white border-indigo-700 font-black'
                              : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              hasAdminAccess ? 'bg-white animate-pulse' : 'bg-zinc-300'
                            }`}
                          />
                          {hasAdminAccess ? '콘솔 접속 허용됨' : '접근 차단됨'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
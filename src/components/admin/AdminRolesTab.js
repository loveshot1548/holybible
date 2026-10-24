import React, { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';

const SvgShield = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>;
const SvgSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const SvgLock = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>;
const SvgInfo = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>;

const CHURCH_OFFICES = ['성도', '집사', '안수집사', '권사', '장로', '전도사', '목사'];
const MINISTRY_ROLES = ['목원', '부목자', '목자', '간사', '교사', '팀장'];

export default function AdminRolesTab({ users = [], setUsers, authUser }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); 

  const stats = useMemo(() => {
    const total = users.length;
    const adminCount = users.filter(u => u.is_admin || u.name === '정신동' || u.name === '관리자').length;
    const shepherdCount = users.filter(u => ['목자', '부목자', '간사'].includes(u.role)).length;
    const regularCount = total - adminCount;
    return { total, adminCount, shepherdCount, regularCount };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return users.filter(u => {
      const isMaster = u.name === '정신동' || u.name === '관리자';
      const hasAdminAccess = !!u.is_admin || isMaster;
      const isShepherd = ['목자', '부목자', '간사'].includes(u.role);

      if (roleFilter === 'ADMIN' && !hasAdminAccess) return false;
      if (roleFilter === 'SHEPHERD' && !isShepherd) return false;
      if (roleFilter === 'REGULAR' && (hasAdminAccess || isShepherd)) return false;
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || (u.office || '').toLowerCase().includes(q) || (u.role || '').toLowerCase().includes(q);
    });
  }, [users, roleFilter, searchQuery]);

  const handleUpdateOffice = async (userName, newOffice) => {
    setUsers(prev => prev.map(u => u.name === userName ? { ...u, office: newOffice } : u));
    if (supabase) { try { await supabase.from('app_users').update({ office: newOffice }).eq('name', userName); } catch (err) {} }
  };

  const handleUpdateRole = async (userName, newRole) => {
    setUsers(prev => prev.map(u => u.name === userName ? { ...u, role: newRole } : u));
    if (userName === authUser?.name) {
      try {
        const stored = localStorage.getItem('church_auth_user');
        if (stored) {
          localStorage.setItem('church_auth_user', JSON.stringify({ ...JSON.parse(stored), role: newRole }));
          window.dispatchEvent(new Event('storage'));
        }
      } catch (e) {}
    }
    if (supabase) { try { await supabase.from('app_users').update({ role: newRole }).eq('name', userName); } catch (err) {} }
  };

  const handleToggleAdminAccess = async (userName, currentStatus) => {
    if (userName === '정신동') return alert('최고 총괄 관리자(정신동)의 권한은 해제할 수 없습니다.');
    const nextStatus = !currentStatus;
    setUsers(prev => prev.map(u => u.name === userName ? { ...u, is_admin: nextStatus } : u));
    
    if (userName === authUser?.name) {
      try {
        const stored = localStorage.getItem('church_auth_user');
        if (stored) {
          localStorage.setItem('church_auth_user', JSON.stringify({ ...JSON.parse(stored), is_admin: nextStatus }));
          window.dispatchEvent(new Event('storage'));
        }
      } catch (e) {}
    }
    if (supabase) { try { await supabase.from('app_users').update({ is_admin: nextStatus }).eq('name', userName); } catch (err) { alert('권한 수정 실패: ' + err.message); } }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden box-border font-sans select-none text-zinc-900">
      
      {/* 1. 상단 RBAC 거버넌스 KPI 바 */}
      <div className="shrink-0 bg-zinc-50/50 border-b border-zinc-200 px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 shadow-sm">
        <div className="flex flex-col justify-center">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-0.5">전체 등록 계정</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[22px] font-black font-mono text-zinc-900 leading-none">{stats.total}</span>
            <span className="text-[11px] font-bold text-zinc-500">명</span>
          </div>
        </div>
        <div className="flex flex-col justify-center border-l border-zinc-200 pl-4">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider flex items-center gap-1 mb-0.5"><SvgShield /> 시스템 관리자 (Admin)</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[22px] font-black font-mono text-indigo-700 leading-none">{stats.adminCount}</span>
            <span className="text-[11px] font-bold text-indigo-500">콘솔 전권 인가</span>
          </div>
        </div>
        <div className="flex flex-col justify-center border-l border-zinc-200 pl-4">
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-0.5">목양 리더십 (Shepherds)</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[22px] font-black font-mono text-emerald-700 leading-none">{stats.shepherdCount}</span>
            <span className="text-[11px] font-bold text-emerald-500">출석부·모바일 권한</span>
          </div>
        </div>
        <div className="flex flex-col justify-center border-l border-zinc-200 pl-4">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-0.5">일반 등록 교인</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[22px] font-black font-mono text-zinc-800 leading-none">{stats.regularCount}</span>
            <span className="text-[11px] font-bold text-zinc-500">기본 사용자</span>
          </div>
        </div>
      </div>

      {/* 2. 툴바 및 필터 */}
      <div className="shrink-0 bg-white border-b border-zinc-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-zinc-100 p-0.5 rounded-md border border-zinc-200 text-[11.5px] font-bold shadow-inner">
            <button onClick={() => setRoleFilter('ALL')} className={`px-3 py-1.5 rounded transition-all ${roleFilter === 'ALL' ? 'bg-white text-zinc-900 shadow-sm font-black' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'}`}>전체 ({stats.total})</button>
            <button onClick={() => setRoleFilter('ADMIN')} className={`px-3 py-1.5 rounded transition-all ${roleFilter === 'ADMIN' ? 'bg-white text-indigo-700 shadow-sm font-black' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'}`}>관리자 ({stats.adminCount})</button>
            <button onClick={() => setRoleFilter('SHEPHERD')} className={`px-3 py-1.5 rounded transition-all ${roleFilter === 'SHEPHERD' ? 'bg-white text-emerald-700 shadow-sm font-black' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'}`}>목양 리더십 ({stats.shepherdCount})</button>
            <button onClick={() => setRoleFilter('REGULAR')} className={`px-3 py-1.5 rounded transition-all ${roleFilter === 'REGULAR' ? 'bg-white text-zinc-900 shadow-sm font-black' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'}`}>일반 성도</button>
          </div>

          <div className="relative flex items-center">
            <span className="absolute left-3 text-zinc-400 pointer-events-none"><SvgSearch /></span>
            <input type="text" placeholder="계정명 또는 직분 검색..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 pr-3 py-1.5 text-[12px] bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:bg-white focus:border-zinc-800 text-zinc-900 font-bold placeholder:text-zinc-400 placeholder:font-medium w-48 sm:w-64 transition-colors" />
          </div>
        </div>

        <div className="text-[11px] text-zinc-400 font-bold flex items-center gap-1.5 bg-zinc-50 px-3 py-1.5 rounded-md border border-zinc-200">
          <SvgInfo /> 권한 변경 시 대상 계정의 접근 레벨이 실시간 동기화됩니다.
        </div>
      </div>

      {/* 3. 고밀도 RBAC 데이터 그리드 */}
      <div className="flex-1 w-full overflow-x-auto overflow-y-auto hide-scrollbar bg-zinc-50/30">
        {filteredUsers.length === 0 ? (
          <div className="py-24 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-300 shadow-sm"><SvgLock /></div>
            <p className="text-[13px] font-bold">조건에 일치하는 계정이 없습니다.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-[12.5px] min-w-[700px] table-fixed">
            <colgroup>
              <col className="w-12" /><col className="w-40" /><col className="w-36" /><col className="w-36" />
              <col className="w-44 text-center" /><col className="w-32 text-right" />
            </colgroup>
            <thead>
              <tr className="border-b border-zinc-200 bg-white text-zinc-400 text-[10.5px] font-black uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">계정 식별자</th>
                <th className="py-3 px-4">교회 직분 (항존직)</th>
                <th className="py-3 px-4">사역 직책 (목양)</th>
                <th className="py-3 px-5 text-center">시스템 콘솔 (Admin) 인가</th>
                <th className="py-3 px-4 text-right">보안 스코프</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white font-medium">
              {filteredUsers.map((u, idx) => {
                const isMaster = u.name === '정신동' || u.name === '관리자';
                const hasAdminAccess = !!u.is_admin || isMaster;
                const isShepherd = ['목자', '부목자', '간사'].includes(u.role);

                return (
                  <tr key={u.name} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-[11px] text-zinc-400">{String(idx + 1).padStart(3, '0')}</td>
                    <td className="py-3 px-4 font-black text-zinc-900 flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm ${isMaster ? 'bg-zinc-900 text-white' : hasAdminAccess ? 'bg-indigo-600 text-white' : 'bg-white text-zinc-600 border border-zinc-200'}`}>
                        {u.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="leading-none mb-1">{u.name}</span>
                        {isMaster && <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter leading-none">Super Admin</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <select value={u.office || '성도'} onChange={(e) => handleUpdateOffice(u.name, e.target.value)} className="px-3 py-1.5 text-[12px] bg-zinc-50 hover:bg-white border border-zinc-200 rounded-lg outline-none font-bold text-zinc-700 cursor-pointer focus:border-zinc-800 transition-colors w-full max-w-[120px]">
                        {CHURCH_OFFICES.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <select value={u.role || '목원'} onChange={(e) => handleUpdateRole(u.name, e.target.value)} className={`px-3 py-1.5 text-[12px] rounded-lg outline-none font-bold cursor-pointer border transition-colors w-full max-w-[120px] shadow-sm ${isShepherd ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-white'}`}>
                        {MINISTRY_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <div className="flex items-center justify-center">
                        {isMaster ? (
                          <span className="px-3 py-1.5 rounded-md text-[11px] font-black bg-zinc-900 text-white flex items-center gap-1.5 shadow-sm">
                            <SvgShield /> 마스터 전권
                          </span>
                        ) : (
                          <button type="button" onClick={() => handleToggleAdminAccess(u.name, hasAdminAccess)} className={`w-[110px] py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border ${hasAdminAccess ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 font-black' : 'bg-white hover:bg-zinc-50 text-zinc-500 border-zinc-200'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${hasAdminAccess ? 'bg-white animate-pulse' : 'bg-zinc-300'}`} />
                            {hasAdminAccess ? '콘솔 접속 허용' : '접근 차단됨'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${isMaster ? 'bg-zinc-100 text-zinc-900 border-zinc-200' : hasAdminAccess ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : isShepherd ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-zinc-400 border-zinc-200'}`}>
                        {isMaster ? 'Root / Admin' : hasAdminAccess ? 'Operator' : isShepherd ? 'Field Leader' : 'Standard'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
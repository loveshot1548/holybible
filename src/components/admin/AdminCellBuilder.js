// src/components/admin/AdminCellBuilder.js
import React, { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';

// 엔터프라이즈 모노크롬 SVG 아이콘 세트
const SvgUsers = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
const SvgSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const SvgTrash = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const SvgClose = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const SvgPlus = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const SvgGrip = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-zinc-300 group-hover:text-zinc-500 transition-colors"><circle cx="8" cy="6" r="2"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/></svg>;
const SvgDownload = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const SvgCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;

export default function AdminCellBuilder({
  newCellName, setNewCellName, newCellShepherd, setNewCellShepherd, setCells, cells = [],
  users = [], searchQuery, setSearchQuery, cellMembers = [],
  handleMemberDrop, handleRemoveMemberFromCell
}) {
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🌟 다중 선택 및 일괄 이동 상태
  const [selectedUnassigned, setSelectedUnassigned] = useState(new Set());
  const [bulkTargetCellId, setBulkTargetCellId] = useState('');
  
  // 목장 기준 정원 (표준: 8명)
  const CELL_TARGET_CAPACITY = 8;

  // 배정된 성도 맵
  const assignedMap = useMemo(() => {
    const map = new Map();
    cellMembers.forEach(m => {
      const isRealCell = cells.some(c => c.id === m.cell_id);
      if (isRealCell) map.set(m.user_name, m);
    });
    return map;
  }, [cellMembers, cells]);

  // 미배정 성도 목록
  const unassignedUsers = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return users.filter(u => {
      const isAssigned = assignedMap.has(u.name);
      if (isAssigned) return false;
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || (u.office || '').toLowerCase().includes(q);
    });
  }, [users, assignedMap, searchQuery]);

  // 조직도 통계 집계
  const stats = useMemo(() => {
    const total = users.length;
    const assigned = assignedMap.size;
    const rate = total > 0 ? Math.round((assigned / total) * 100) : 0;
    const avgMembers = cells.length > 0 ? (assigned / cells.length).toFixed(1) : 0;
    return { total, assigned, unassigned: unassignedUsers.length, rate, avgMembers };
  }, [users, assignedMap, unassignedUsers, cells]);

  // 목장 개설
  const handleCreateCellSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newCellName || !newCellName.trim()) return alert('목장 이름을 입력해주세요.');
    if (isSubmitting) return;

    setIsSubmitting(true);
    const cleanName = newCellName.trim().endsWith('목장') ? newCellName.trim() : `${newCellName.trim()} 목장`;
    const shepherd = (newCellShepherd || '').trim() || null;

    const generatedUuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cell_${Date.now()}`;
    let payload = { id: generatedUuid, name: cleanName, shepherd_name: shepherd };

    try {
      if (supabase) {
        let { data, error } = await supabase.from('cells').insert([payload]).select();
        if (error && (error.message.includes('integer') || error.message.includes('bigint') || error.code === '22P02')) {
          payload = { ...payload, id: Date.now() };
          const retry = await supabase.from('cells').insert([payload]).select();
          data = retry.data; error = retry.error;
        }
        if (error) throw error;
        if (data && data[0]) {
          setCells(prev => [...prev, data[0]]);
          if (shepherd) await handleMemberDrop(data[0].id, shepherd, '목자');
        }
      } else {
        setCells(prev => [...prev, payload]);
      }
      setNewCellName(''); setNewCellShepherd('');
    } catch (err) { alert(`목장 개설 오류: ${err.message}`); } 
    finally { setIsSubmitting(false); }
  };

  // 목장 해체/삭제
  const handleDeleteCell = async (cellId, cellName) => {
    if (!window.confirm(`[${cellName}]을(를) 해체하시겠습니까?\n소속된 모든 성도는 미배정 대기 상태로 자동 복귀됩니다.`)) return;
    try {
      setCells(prev => prev.filter(c => c.id !== cellId));
      if (supabase) {
        await supabase.from('cell_members').delete().eq('cell_id', cellId);
        await supabase.from('cells').delete().eq('id', cellId);
      }
    } catch (err) { alert(`삭제 오류: ${err.message}`); }
  };

  // 드래그 앤 드롭
  const onDragStart = (e, userName) => {
    e.dataTransfer.setData('text/plain', userName);
    e.dataTransfer.effectAllowed = 'move';
    setActiveDragItem(userName);
  };

  const onDragEnd = () => { setActiveDragItem(null); setDragOverTarget(null); };

  const handleRoleDrop = async (e, cellId, role) => {
    e.preventDefault(); setDragOverTarget(null);
    const userName = e.dataTransfer.getData('text/plain') || activeDragItem;
    if (userName && cellId) await handleMemberDrop(cellId, userName, role);
  };

  const handleUnassignDrop = async (e) => {
    e.preventDefault(); setDragOverTarget(null);
    const userName = e.dataTransfer.getData('text/plain') || activeDragItem;
    if (userName) await handleRemoveMemberFromCell(userName);
  };

  // 🌟 다중 선택 토글 핸들러
  const handleToggleSelectUnassigned = (userName) => {
    setSelectedUnassigned(prev => {
      const next = new Set(prev);
      if (next.has(userName)) next.delete(userName);
      else next.add(userName);
      return next;
    });
  };

  const handleSelectAllUnassigned = () => {
    if (selectedUnassigned.size === unassignedUsers.length) {
      setSelectedUnassigned(new Set());
    } else {
      setSelectedUnassigned(new Set(unassignedUsers.map(u => u.name)));
    }
  };

  // 🌟 1-클릭 다중 성도 일괄 배정
  const handleExecuteBulkAssign = async () => {
    if (!bulkTargetCellId) return alert('배정할 목표 목장을 선택하세요.');
    if (selectedUnassigned.size === 0) return alert('배정할 성도를 1명 이상 선택하세요.');

    const targetCell = cells.find(c => c.id === bulkTargetCellId);
    const count = selectedUnassigned.size;

    for (const name of Array.from(selectedUnassigned)) {
      await handleMemberDrop(bulkTargetCellId, name, '목원');
    }

    setSelectedUnassigned(new Set());
    setBulkTargetCellId('');
    alert(`${count}명의 성도가 [${targetCell?.name || '선택 목장'}]에 성공적으로 일괄 배정되었습니다.`);
  };

  // 🌟 항목 내 인라인 목장 즉시 변경
  const handleQuickMoveMember = async (userName, targetCellId, currentRole = '목원') => {
    if (!targetCellId) {
      await handleRemoveMemberFromCell(userName);
    } else {
      await handleMemberDrop(targetCellId, userName, currentRole);
    }
  };

  // 조직 편성표 CSV 내보내기
  const exportOrganizationChartCSV = () => {
    if (cells.length === 0) return alert('내보낼 목장 편성 데이터가 없습니다.');
    let csvContent = '\uFEFF';
    csvContent += '목장명,구분,성도명,교회직분,역할\n';

    cells.forEach(c => {
      const members = cellMembers.filter(m => m.cell_id === c.id);
      if (members.length === 0) {
        csvContent += `"${c.name}","공실","(배정성도 없음)","-","-"\n`;
      } else {
        members.forEach(m => {
          const uInfo = users.find(u => u.name === m.user_name);
          csvContent += `"${c.name}","소속","${m.user_name}","${uInfo?.office || '성도'}","${m.assigned_role || '목원'}"\n`;
        });
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `목장_조직편성표_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white rounded-xl border border-zinc-200 shadow-2xs text-zinc-900 font-sans select-none">
      
      {/* =========================================================================
          [1] 상단 조직 지표 요약 & 글로벌 컨트롤 바
          ========================================================================= */}
      <div className="shrink-0 bg-zinc-50 border-b border-zinc-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-black uppercase tracking-wider bg-zinc-900 text-white px-2 py-0.5 rounded">
              ORG BUILDER
            </span>
            <span className="text-[14px] font-black tracking-tight text-zinc-900">목장 조직 개편 빌더</span>
          </div>

          <span className="hidden sm:inline-block h-4 w-px bg-zinc-200" />

          {/* 실시간 조직 편성 지표 뱃지 */}
          <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] font-bold">
            <span className="text-zinc-500">배치율: <strong className="text-zinc-900">{stats.rate}%</strong> ({stats.assigned}/{stats.total}명)</span>
            <span className="text-zinc-300">•</span>
            <span className="text-zinc-500">목장당 평균: <strong className="text-zinc-900">{stats.avgMembers}명</strong></span>
          </div>
        </div>

        {/* 액션 버튼군 및 목장 개설 폼 */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            type="button" 
            onClick={exportOrganizationChartCSV} 
            className="px-3 py-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-[11px] font-bold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            title="편성표 CSV 다운로드"
          >
            <SvgDownload /> 조직도 추출
          </button>

          {/* 신규 목장 간편 등록 폼 */}
          <form onSubmit={handleCreateCellSubmit} className="flex items-center gap-1.5">
            <input 
              type="text" 
              placeholder="목장명 (예: 믿음)" 
              value={newCellName} 
              onChange={e => setNewCellName(e.target.value)} 
              className="w-28 sm:w-32 px-2.5 py-1.5 text-[11.5px] rounded-lg bg-white border border-zinc-300 focus:border-zinc-800 outline-none font-bold text-zinc-900 transition-all placeholder:font-medium placeholder:text-zinc-400 shadow-2xs" 
            />
            <input 
              type="text" 
              placeholder="목자 성명" 
              value={newCellShepherd} 
              onChange={e => setNewCellShepherd(e.target.value)} 
              className="w-24 sm:w-28 px-2.5 py-1.5 text-[11.5px] rounded-lg bg-white border border-zinc-300 focus:border-zinc-800 outline-none font-bold text-zinc-900 transition-all placeholder:font-medium placeholder:text-zinc-400 shadow-2xs" 
            />
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-black rounded-lg shadow-2xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
            >
              <SvgPlus /> {isSubmitting ? '생성 중...' : '목장 개설'}
            </button>
          </form>
        </div>
      </div>

      {/* =========================================================================
          [2] 메인 작업 영역: 2단 분할 레이아웃
          ========================================================================= */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-white">
        
        {/* =====================================================================
            [좌측 패널] 미배정 성도 풀 (다중 일괄 선택 & 검색 바)
           ===================================================================== */}
        <div 
          onDragOver={e => { e.preventDefault(); setDragOverTarget('unassigned'); }}
          onDragLeave={() => setDragOverTarget(null)}
          onDrop={handleUnassignDrop}
          className={`w-full md:w-[280px] shrink-0 border-r border-zinc-200 flex flex-col min-h-0 transition-colors ${
            dragOverTarget === 'unassigned' ? 'bg-amber-50/50 ring-1 ring-inset ring-amber-400' : 'bg-zinc-50/40'
          }`}
        >
          <div className="p-3 border-b border-zinc-200 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[12px] font-black text-zinc-900">미배정 대기 명단</span>
            </div>
            <span className="text-[10px] font-mono font-black text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
              {unassignedUsers.length}명
            </span>
          </div>

          {/* 검색창 */}
          <div className="p-2 border-b border-zinc-100 bg-white shrink-0">
            <div className="relative flex items-center">
              <span className="absolute left-2.5 text-zinc-400 pointer-events-none"><SvgSearch /></span>
              <input 
                type="text" 
                placeholder="미배정 성도 검색..." 
                value={searchQuery || ''} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="w-full pl-8 pr-2.5 py-1 text-[11px] bg-zinc-50 border border-zinc-200 rounded-md outline-none focus:bg-white focus:border-zinc-800 text-zinc-900 font-bold placeholder:font-medium placeholder:text-zinc-400 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* 🌟 다중 일괄 선택 액션 바 */}
          <div className="px-3 py-1.5 bg-zinc-100/70 border-b border-zinc-200 flex items-center justify-between text-[10.5px] font-bold text-zinc-600 shrink-0">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input 
                type="checkbox" 
                checked={unassignedUsers.length > 0 && selectedUnassigned.size === unassignedUsers.length} 
                onChange={handleSelectAllUnassigned}
                className="w-3.5 h-3.5 rounded accent-zinc-900 cursor-pointer"
              />
              <span>전체 선택</span>
            </label>
            <span className="text-zinc-400 font-mono">{selectedUnassigned.size}명 선택됨</span>
          </div>

          {/* 선택 성도 일괄 배정 컨트롤 */}
          {selectedUnassigned.size > 0 && (
            <div className="p-2 bg-zinc-900 text-white flex flex-col gap-1.5 animate-fade-in shrink-0">
              <span className="text-[10px] font-bold text-zinc-400">선택 성도 {selectedUnassigned.size}명 일괄 배정</span>
              <div className="flex gap-1">
                <select 
                  value={bulkTargetCellId} 
                  onChange={e => setBulkTargetCellId(e.target.value)} 
                  className="flex-1 p-1 bg-zinc-800 border border-zinc-700 text-white text-[11px] rounded font-bold outline-none cursor-pointer"
                >
                  <option value="">목표 목장 선택...</option>
                  {cells.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button 
                  type="button" 
                  onClick={handleExecuteBulkAssign} 
                  className="px-2.5 py-1 bg-white text-zinc-950 font-black text-[11px] rounded shadow-2xs hover:bg-zinc-100 cursor-pointer shrink-0"
                >
                  배정
                </button>
              </div>
            </div>
          )}

          {/* 미배정 목록 스크롤 뷰 */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 hide-scrollbar">
            {unassignedUsers.length === 0 ? (
              <div className="py-16 px-4 flex flex-col items-center justify-center text-center gap-2">
                <div className="w-9 h-9 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-300"><SvgUsers /></div>
                <p className="text-[11px] font-bold text-zinc-400">모든 성도가 목장에<br/>배정 완료되었습니다.</p>
              </div>
            ) : (
              unassignedUsers.map(u => {
                const isChecked = selectedUnassigned.has(u.name);
                return (
                  <div 
                    key={u.name}
                    draggable
                    onDragStart={e => onDragStart(e, u.name)}
                    onDragEnd={onDragEnd}
                    className={`p-2 rounded-lg bg-white border shadow-2xs flex items-center justify-between cursor-grab active:cursor-grabbing transition-all group hover:border-zinc-400 ${
                      isChecked ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200'
                    } ${activeDragItem === u.name ? 'opacity-40 scale-95 border-dashed border-zinc-400' : ''}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => handleToggleSelectUnassigned(u.name)}
                        onClick={e => e.stopPropagation()}
                        className="w-3.5 h-3.5 rounded accent-zinc-900 cursor-pointer shrink-0"
                      />
                      <SvgGrip />
                      <span className="text-[11.5px] font-black text-zinc-900 truncate">{u.name}</span>
                    </div>
                    <span className="text-[9.5px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.2 rounded shrink-0 border border-zinc-200">
                      {u.office || '성도'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="p-2 border-t border-zinc-200 bg-white text-[10px] font-bold text-center text-zinc-400">
            성도를 이곳으로 드래그하면 목장 배정이 해제됩니다.
          </div>
        </div>

        {/* =====================================================================
            [우측 패널] 멀티 목장 칸반 그리드 (정원 밸런싱 & 인라인 이동 지원)
           ===================================================================== */}
        <div className="flex-1 p-4 min-h-0 overflow-y-auto hide-scrollbar bg-zinc-100/40">
          {cells.length === 0 ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center border border-dashed border-zinc-300 rounded-2xl bg-white text-zinc-400 gap-2">
              <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-300"><SvgPlus /></div>
              <p className="text-[12px] font-bold">개설된 목장이 없습니다. 상단에서 목장을 개설해 주세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 items-start">
              {cells.map(c => {
                const members = cellMembers.filter(m => m.cell_id === c.id);
                const shepherdList = members.filter(m => m.assigned_role === '목자');
                const subList = members.filter(m => m.assigned_role === '부목자' || m.assigned_role === '간사');
                const regularList = members.filter(m => !['목자', '부목자', '간사'].includes(m.assigned_role));

                const memberCount = members.length;
                const capacityRate = Math.round((memberCount / CELL_TARGET_CAPACITY) * 100);
                const isOvercrowded = memberCount > 10;
                const isUndersized = memberCount > 0 && memberCount < 5;

                return (
                  <div key={c.id} className="bg-white rounded-xl border border-zinc-200 shadow-2xs flex flex-col overflow-hidden transition-all hover:border-zinc-300">
                    
                    {/* 목장 카드 헤더 & 정원 인디케이터 */}
                    <div className="px-3.5 py-2.5 bg-zinc-50 border-b border-zinc-200 flex flex-col gap-1.5 shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-zinc-900 shrink-0" />
                          <span className="font-black text-[13px] text-zinc-900 truncate">{c.name}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold border ${
                            isOvercrowded 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : isUndersized 
                              ? 'bg-amber-50 text-amber-800 border-amber-200' 
                              : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                          }`}>
                            {memberCount}명 {isOvercrowded ? '(과밀)' : isUndersized ? '(과소)' : '(적정)'}
                          </span>
                        </div>

                        <button 
                          type="button"
                          onClick={() => handleDeleteCell(c.id, c.name)} 
                          title="목장 해체"
                          className="text-zinc-400 hover:text-rose-600 p-1 rounded hover:bg-zinc-100 transition-colors cursor-pointer"
                        >
                          <SvgTrash />
                        </button>
                      </div>

                      {/* 목장 정원 진행 게이지 바 */}
                      <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            isOvercrowded ? 'bg-rose-500' : isUndersized ? 'bg-amber-500' : 'bg-zinc-800'
                          }`} 
                          style={{ width: `${Math.min(capacityRate, 100)}%` }} 
                        />
                      </div>
                    </div>

                    {/* 3단 드롭 존: 목자 / 부목자 / 목원 */}
                    <div className="p-2.5 flex flex-col gap-2.5">
                      
                      {/* 1. 담당 목자 슬롯 */}
                      <div 
                        onDragOver={e => { e.preventDefault(); setDragOverTarget(`${c.id}_shepherd`); }}
                        onDragLeave={() => setDragOverTarget(null)}
                        onDrop={e => handleRoleDrop(e, c.id, '목자')}
                        className={`p-2 rounded-lg border transition-all ${
                          dragOverTarget === `${c.id}_shepherd` 
                            ? 'bg-rose-50 border-rose-400 ring-1 ring-rose-200' 
                            : 'bg-white border-zinc-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9.5px] font-black text-rose-700 uppercase tracking-wider">담당 목자</span>
                          <span className="text-[9px] font-mono text-zinc-400">{shepherdList.length}명</span>
                        </div>

                        {shepherdList.length === 0 ? (
                          <div className="py-2 text-center text-[10px] font-bold text-zinc-400 border border-dashed border-zinc-200 rounded-md bg-zinc-50">
                            목자를 드래그하여 지정
                          </div>
                        ) : (
                          shepherdList.map(s => (
                            <div 
                              key={s.user_name} 
                              draggable 
                              onDragStart={e => onDragStart(e, s.user_name)}
                              onDragEnd={onDragEnd}
                              className="px-2 py-1 rounded bg-white border border-zinc-200 shadow-2xs flex items-center justify-between group cursor-grab active:cursor-grabbing hover:border-zinc-400"
                            >
                              <div className="flex items-center gap-1.5">
                                <SvgGrip />
                                <span className="text-[11px] font-black text-zinc-900">{s.user_name}</span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => handleRemoveMemberFromCell(s.user_name)} 
                                className="text-zinc-300 hover:text-rose-600 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <SvgClose />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* 2. 부목자 / 간사 슬롯 */}
                      <div 
                        onDragOver={e => { e.preventDefault(); setDragOverTarget(`${c.id}_sub`); }}
                        onDragLeave={() => setDragOverTarget(null)}
                        onDrop={e => handleRoleDrop(e, c.id, '부목자')}
                        className={`p-2 rounded-lg border transition-all ${
                          dragOverTarget === `${c.id}_sub` 
                            ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-200' 
                            : 'bg-white border-zinc-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9.5px] font-black text-amber-800 uppercase tracking-wider">부목자 / 임원</span>
                          <span className="text-[9px] font-mono text-zinc-400">{subList.length}명</span>
                        </div>

                        {subList.length === 0 ? (
                          <div className="py-2 text-center text-[10px] font-bold text-zinc-400 border border-dashed border-zinc-200 rounded-md bg-zinc-50">
                            부목자를 드래그하여 지정
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {subList.map(s => (
                              <div 
                                key={s.user_name} 
                                draggable 
                                onDragStart={e => onDragStart(e, s.user_name)}
                                onDragEnd={onDragEnd}
                                className="px-2 py-1 rounded bg-white border border-zinc-200 shadow-2xs flex items-center justify-between group cursor-grab active:cursor-grabbing hover:border-zinc-400"
                              >
                                <div className="flex items-center gap-1.5">
                                  <SvgGrip />
                                  <span className="text-[11px] font-black text-zinc-900">{s.user_name}</span>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => handleRemoveMemberFromCell(s.user_name)} 
                                  className="text-zinc-300 hover:text-rose-600 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                  <SvgClose />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 3. 소속 목원 슬롯 (인라인 목장/직책 이동 지원) */}
                      <div 
                        onDragOver={e => { e.preventDefault(); setDragOverTarget(`${c.id}_member`); }}
                        onDragLeave={() => setDragOverTarget(null)}
                        onDrop={e => handleRoleDrop(e, c.id, '목원')}
                        className={`p-2 rounded-lg border min-h-[130px] flex flex-col transition-all ${
                          dragOverTarget === `${c.id}_member` 
                            ? 'bg-zinc-100 border-zinc-500' 
                            : 'bg-zinc-50/70 border-zinc-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9.5px] font-black text-zinc-500 uppercase tracking-wider">소속 성도</span>
                          <span className="text-[9px] font-mono text-zinc-400">{regularList.length}명</span>
                        </div>

                        <div className="flex-1 space-y-1">
                          {regularList.length === 0 ? (
                            <div className="h-full min-h-[80px] flex items-center justify-center text-center text-[10px] font-bold text-zinc-400 border border-dashed border-zinc-200 rounded-md bg-white">
                              성도를 이곳으로 드래그
                            </div>
                          ) : (
                            regularList.map(r => (
                              <div 
                                key={r.user_name} 
                                draggable 
                                onDragStart={e => onDragStart(e, r.user_name)}
                                onDragEnd={onDragEnd}
                                className="px-2 py-1 rounded bg-white border border-zinc-200 shadow-2xs flex items-center justify-between group cursor-grab active:cursor-grabbing hover:border-zinc-400 transition-colors"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <SvgGrip />
                                  <span className="text-[11px] font-bold text-zinc-900 truncate">{r.user_name}</span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {/* 🌟 원클릭 빠른 목장 변경 셀렉터 */}
                                  <select 
                                    value={c.id} 
                                    onChange={e => handleQuickMoveMember(r.user_name, e.target.value, r.assigned_role)}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-[9px] bg-zinc-50 border border-zinc-200 rounded font-bold text-zinc-600 outline-none cursor-pointer"
                                    title="다른 목장으로 즉시 이동"
                                  >
                                    <option value={c.id}>현 목장</option>
                                    <option value="">미배정</option>
                                    {cells.filter(other => other.id !== c.id).map(other => (
                                      <option key={other.id} value={other.id}>{other.name}</option>
                                    ))}
                                  </select>

                                  <button 
                                    type="button"
                                    onClick={() => handleRemoveMemberFromCell(r.user_name)} 
                                    title="목장에서 제외"
                                    className="text-zinc-300 hover:text-rose-600 cursor-pointer p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <SvgClose />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
// src/components/admin/erp/ErpMinistryTimeline.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../../lib/supabase';

const PHASES = ['기획 및 준비', '실행 및 홍보', '본 행사 진행', '사후 평가 및 결산'];

// 🎨 스크린샷 기반 단계별 파스텔 컬러 테마 (Lavender, Sage Green, Amber, Sky Blue)
const PHASE_THEMES = {
  '기획 및 준비': {
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    bar: 'bg-[#DCD6FA] border-[#C3B8F5] text-purple-950',
    barFill: 'bg-purple-600',
    dot: 'bg-purple-500'
  },
  '실행 및 홍보': {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bar: 'bg-[#CEEAD6] border-[#A8DBB5] text-emerald-950',
    barFill: 'bg-emerald-600',
    dot: 'bg-emerald-500'
  },
  '본 행사 진행': {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    bar: 'bg-[#FEE3A2] border-[#FCD269] text-amber-950',
    barFill: 'bg-amber-600',
    dot: 'bg-amber-500'
  },
  '사후 평가 및 결산': {
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    bar: 'bg-[#D0E7FD] border-[#A6D1FB] text-sky-950',
    barFill: 'bg-sky-600',
    dot: 'bg-sky-500'
  }
};

// 🌟 엔터프라이즈 모노크롬 SVG 세트
const SvgSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const SvgPlus = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const SvgClose = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const SvgGrip = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 transition-colors"><circle cx="8" cy="6" r="2"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/></svg>;
const SvgLink = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;
const SvgChevronDown = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>;
const SvgCheckCircle = () => <svg fill="currentColor" viewBox="0 0 20 20" className="w-3.5 h-3.5 text-emerald-500"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>;
const SvgBranch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-zinc-300"><path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v11.25a2.25 2.25 0 002.25 2.25H18" /></svg>;

// 날짜 연산 유틸
const addDays = (dateStr, days) => {
  const d = new Date(dateStr); d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const diffDays = (startStr, endStr) => {
  const s = new Date(startStr); const e = new Date(endStr);
  return Math.round((e - s) / (1000 * 60 * 60 * 24));
};

// 🌟 고도화된 정밀 D-Day 계산 헬퍼
const calculateDDay = (targetDateStr) => {
  if (!targetDateStr) return { text: '-', isOverdue: false, isUrgent: false, days: 0 };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr); target.setHours(0, 0, 0, 0);
  const diffTime = target - today;
  const dDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (dDays === 0) return { text: 'D-Day', isOverdue: false, isUrgent: true, days: 0, badgeClass: 'bg-rose-500 text-white font-black animate-pulse' };
  if (dDays > 0) {
    const isUrgent = dDays <= 3;
    return {
      text: `D-${dDays}`,
      isOverdue: false,
      isUrgent,
      days: dDays,
      badgeClass: isUrgent 
        ? 'bg-amber-50 text-amber-700 border-amber-300 font-black' 
        : 'bg-zinc-100 text-zinc-700 border-zinc-200 font-bold'
    };
  }
  return { 
    text: `D+${Math.abs(dDays)} 지연`, 
    isOverdue: true, 
    isUrgent: false, 
    days: dDays,
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 font-black' 
  };
};

export default function ErpMinistryTimeline() {
  const [projects, setProjects] = useState([]);
  const [viewMode, setViewMode] = useState('gantt'); // 'gantt' | 'kanban' | 'feed' | 'dday'
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // 접힘/펼침 Phase 상태 (스크린샷 세부 제어 대응)
  const [collapsedPhases, setCollapsedPhases] = useState({});

  const projectsRef = useRef(projects);
  useEffect(() => { projectsRef.current = projects; }, [projects]);

  // 칸반 보드 드래그 상태
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null); 

  // 간트 차트 리사이즈/무브 상태
  const ganttContainerRef = useRef(null);
  const [ganttDrag, setGanttDrag] = useState(null); 
  
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [newSubtask, setNewSubtask] = useState({ title: '', assignee: '', due_date: '', priority: '보통' });
  const [newLogMemo, setNewLogMemo] = useState('');
  const [newLogDate, setNewLogDate] = useState(new Date().toISOString().split('T')[0]);

  const initialFormState = {
    project_name: '', 
    department: '', 
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    manager: '', priority: '보통', phase: '기획 및 준비', allocated_budget: '', actual_spent: 0, progress: 0,
    dependencies: [], order_index: 0,
    subtasks: [
      { id: 1, title: '사역 기본 기획안 수립 및 당회 품의', completed: true, assignee: '김목회', priority: '높음', due_date: new Date().toISOString().split('T')[0] },
      { id: 2, title: '예산 및 인력 배정 확정', completed: false, assignee: '이행정', priority: '보통', due_date: addDays(new Date().toISOString().split('T')[0], 5) }
    ],
    logs: []
  };
  const [form, setForm] = useState(initialFormState);

  // DB 통신: 순수 데이터 호출 및 UI 가상 데이터 바인딩
  const fetchTimeline = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('erp_ministry_timeline').select('*');
      if (data && !error) {
        const sanitized = data.map((d, i) => ({ 
          ...d, 
          code: `MP-${String(i + 1).padStart(2, '0')}`,
          order_index: i * 1000, 
          dependencies: [] 
        }));
        setProjects(sanitized);
      }
    } catch (e) {}
  }, []);

  useEffect(() => { fetchTimeline(); }, [fetchTimeline]);

  // 동적 부서 목록
  const dynamicDepartments = useMemo(() => {
    const defaults = ['예배사역부', '청년교구', '교구사역국', '선교위원회', '교육위원회', '재정관리부'];
    const dbDepts = projects.map(p => p.department).filter(Boolean);
    return Array.from(new Set([...defaults, ...dbDepts])).sort();
  }, [projects]);

  // 의존성(Dependencies) 도미노 시프트 연산
  const cascadeDependencies = (projectId, newEndDate, currentProjects) => {
    let updated = [...currentProjects];
    const dependents = updated.filter(p => p.dependencies?.includes(projectId));
    
    dependents.forEach(dep => {
      const minStartDate = addDays(newEndDate, 1);
      if (new Date(dep.start_date) < new Date(minStartDate)) {
        const duration = diffDays(dep.start_date, dep.end_date);
        const newDepStart = minStartDate;
        const newDepEnd = addDays(newDepStart, duration);
        const index = updated.findIndex(p => p.id === dep.id);
        updated[index] = { ...updated[index], start_date: newDepStart, end_date: newDepEnd };
        updated = cascadeDependencies(dep.id, newDepEnd, updated);
      }
    });
    return updated;
  };

  // DB 업데이트
  const syncProjectsToDB = async (updatedProjects) => {
    if (!supabase) return;
    try {
      for (const p of updatedProjects) {
        await supabase.from('erp_ministry_timeline').update({
          start_date: p.start_date, 
          end_date: p.end_date, 
          phase: p.phase
        }).eq('id', p.id);
      }
    } catch(e) { console.error('DB 동기화 에러:', e); }
  };

  // 간트 차트 리사이즈 & 드래그 이동
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!ganttDrag || !ganttContainerRef.current) return;
      const rect = ganttContainerRef.current.getBoundingClientRect();
      const pxPerDay = rect.width / 45; // 45일 스케일 대응
      const diffPx = e.clientX - ganttDrag.startX;
      const shiftDays = Math.round(diffPx / pxPerDay);

      if (shiftDays === 0) return;

      setProjects(prev => {
        const newProjects = [...prev];
        const idx = newProjects.findIndex(p => p.id === ganttDrag.id);
        if (idx === -1) return prev;

        const target = { ...newProjects[idx] };
        if (ganttDrag.mode === 'move') {
          target.start_date = addDays(ganttDrag.origStart, shiftDays);
          target.end_date = addDays(ganttDrag.origEnd, shiftDays);
        } else if (ganttDrag.mode === 'left') {
          const newStart = addDays(ganttDrag.origStart, shiftDays);
          if (new Date(newStart) <= new Date(target.end_date)) target.start_date = newStart;
        } else if (ganttDrag.mode === 'right') {
          const newEnd = addDays(ganttDrag.origEnd, shiftDays);
          if (new Date(newEnd) >= new Date(target.start_date)) target.end_date = newEnd;
        }

        newProjects[idx] = target;
        return cascadeDependencies(target.id, target.end_date, newProjects);
      });
    };

    const handleMouseUp = () => {
      if (ganttDrag) {
        syncProjectsToDB(projectsRef.current); 
        setGanttDrag(null);
      }
    };

    if (ganttDrag) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [ganttDrag]);

  // 프로젝트 등록 핸들러
  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!form.project_name.trim()) return alert('사역 프로젝트명을 입력해주세요.');
    if (!form.department.trim()) return alert('사역 주관 부서를 입력해주세요.');

    const maxOrder = projects.length > 0 ? Math.max(...projects.map(p => p.order_index || 0)) : 0;
    const progress = form.subtasks.length > 0 ? Math.round((form.subtasks.filter(s => s.completed).length / form.subtasks.length) * 100) : 0;
    const generatedId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const dbPayload = {
      id: generatedId,
      project_name: form.project_name.trim(),
      department: form.department.trim(), 
      start_date: form.start_date,
      end_date: form.end_date,
      manager: form.manager.trim(),
      priority: form.priority,
      phase: form.phase,
      allocated_budget: Number(form.allocated_budget) || 0,
      actual_spent: 0,
      progress,
      status: progress === 100 ? '완료' : '진행중',
      subtasks: form.subtasks,
      logs: [{ id: Date.now(), date: new Date().toISOString().split('T')[0], memo: '사역 프로젝트 최초 등록' }]
    };

    if (supabase) {
      const { error } = await supabase.from('erp_ministry_timeline').insert([dbPayload]);
      if (error) return alert(`저장 실패: ${error.message}`);
    }

    const uiPayload = {
      ...dbPayload,
      code: `MP-${String(projects.length + 1).padStart(2, '0')}`,
      order_index: maxOrder + 1000,
      dependencies: form.dependencies.filter(Boolean)
    };

    setProjects(prev => [...prev, uiPayload]);
    setShowCreateModal(false);
    setForm({ ...initialFormState });
    alert('새로운 사역 프로젝트가 성공적으로 수립되었습니다.');
  };

  const handleUpdatePhase = async (id, nextPhase) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, phase: nextPhase } : p));
    if (selectedProject?.id === id) setSelectedProject(prev => ({ ...prev, phase: nextPhase }));
    if (supabase) await supabase.from('erp_ministry_timeline').update({ phase: nextPhase }).eq('id', id);
  };

  const onDragStart = (e, projectId) => {
    e.dataTransfer.setData('text/plain', projectId); e.dataTransfer.effectAllowed = 'move'; setActiveDragItem(projectId);
  };
  const onDragEnd = () => { setActiveDragItem(null); setDragOverColumn(null); };
  const onDragOverPhase = (e, phaseName) => { e.preventDefault(); if (dragOverColumn !== phaseName) setDragOverColumn(phaseName); };
  const onDragOverItem = (e, projectId) => { e.preventDefault(); e.stopPropagation(); setDragOverItem(projectId); };

  const onDrop = async (e, phaseName) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain') || activeDragItem;
    setDragOverColumn(null); setDragOverItem(null); setActiveDragItem(null);
    if (!draggedId) return;

    setProjects(prev => {
      let updated = [...prev];
      const draggedIdx = updated.findIndex(p => p.id === draggedId);
      const draggedProject = { ...updated[draggedIdx], phase: phaseName };

      let phaseList = updated.filter(p => p.phase === phaseName && p.id !== draggedId).sort((a, b) => a.order_index - b.order_index);
      let newOrderIndex = draggedProject.order_index;

      if (dragOverItem) {
        const dropTargetIdx = phaseList.findIndex(p => p.id === dragOverItem);
        if (dropTargetIdx === 0) newOrderIndex = phaseList[0].order_index - 1000;
        else if (dropTargetIdx > 0) newOrderIndex = (phaseList[dropTargetIdx - 1].order_index + phaseList[dropTargetIdx].order_index) / 2;
      } else {
        newOrderIndex = phaseList.length > 0 ? phaseList[phaseList.length - 1].order_index + 1000 : 1000;
      }

      draggedProject.order_index = newOrderIndex;
      updated[draggedIdx] = draggedProject;
      syncProjectsToDB([draggedProject]); 
      return updated.sort((a, b) => a.order_index - b.order_index);
    });
  };

  const handleToggleSubtask = async (projectId, subtaskId) => {
    const target = projects.find(p => p.id === projectId);
    if (!target) return;
    const updatedSubtasks = (target.subtasks || []).map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
    const completedCount = updatedSubtasks.filter(s => s.completed).length;
    const autoProgress = updatedSubtasks.length > 0 ? Math.round((completedCount / updatedSubtasks.length) * 100) : target.progress;
    
    const updatedProject = { ...target, subtasks: updatedSubtasks, progress: autoProgress, status: autoProgress === 100 ? '완료' : '진행중' };
    setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
    if (selectedProject?.id === projectId) setSelectedProject(updatedProject);
    
    if (supabase) {
      await supabase.from('erp_ministry_timeline').update({ subtasks: updatedSubtasks, progress: autoProgress, status: updatedProject.status }).eq('id', projectId);
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtask.title.trim() || !selectedProject) return;
    const newItem = { id: Date.now(), ...newSubtask, completed: false };
    const updatedSubtasks = [...(selectedProject.subtasks || []), newItem];
    const autoProgress = Math.round((updatedSubtasks.filter(s => s.completed).length / updatedSubtasks.length) * 100);

    const updatedProject = { ...selectedProject, subtasks: updatedSubtasks, progress: autoProgress };
    setSelectedProject(updatedProject);
    setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
    setNewSubtask({ title: '', assignee: '', due_date: '', priority: '보통' });

    if (supabase) await supabase.from('erp_ministry_timeline').update({ subtasks: updatedSubtasks, progress: autoProgress }).eq('id', selectedProject.id);
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!newLogMemo.trim() || !selectedProject) return;
    const updatedProject = { ...selectedProject, logs: [{ id: Date.now(), date: newLogDate, memo: newLogMemo.trim() }, ...(selectedProject.logs || [])] };
    setSelectedProject(updatedProject);
    setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
    setNewLogMemo('');
    if (supabase) await supabase.from('erp_ministry_timeline').update({ logs: updatedProject.logs }).eq('id', selectedProject.id);
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('해당 사역 프로젝트를 영구 삭제하시겠습니까?')) return;
    if (supabase) await supabase.from('erp_ministry_timeline').delete().eq('id', id);
    setProjects(prev => prev.filter(p => p.id !== id).map(p => ({ ...p, dependencies: p.dependencies?.filter(dep => dep !== id) })));
    if (selectedProject?.id === id) setSelectedProject(null);
  };

  const metrics = useMemo(() => {
    const total = projects.length;
    const completed = projects.filter(p => p.progress === 100).length;
    return { 
      total, 
      completed, 
      inProgress: total - completed, 
      totalBudget: projects.reduce((acc, cur) => acc + (Number(cur.allocated_budget) || 0), 0) 
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = !searchTerm || p.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.manager?.toLowerCase().includes(searchTerm.toLowerCase());
      return (filterDept === 'ALL' || p.department === filterDept) && (filterPriority === 'ALL' || p.priority === filterPriority) && matchesSearch;
    }).sort((a, b) => a.order_index - b.order_index);
  }, [projects, filterDept, filterPriority, searchTerm]);

  // 🌟 스크린샷과 동일한 멀티 먼스(월 단위 대구획 + 주 단위) 스케일
  const timelineMonths = useMemo(() => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 7);
    const months = [];
    
    for (let i = 0; i < 3; i++) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
      const monthName = d.toLocaleString('en-US', { month: 'short' });
      const monthLabel = `${d.getFullYear()}.${d.getMonth() + 1}월 (${monthName})`;
      months.push({ label: monthLabel, shortName: monthName, year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    return months;
  }, []);

  // 총 60일 그리드 단위 산출
  const ganttScale = useMemo(() => {
    const days = [];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 7); // 일주일 전부터 시작
    for (let i = 0; i < 60; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const str = d.toISOString().split('T')[0];
      days.push({
        dateStr: str,
        dayNum: d.getDate(),
        month: d.getMonth() + 1,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        isToday: str === new Date().toISOString().split('T')[0]
      });
    }
    return days;
  }, []);

  const getGanttBarStyle = (startStr, endStr) => {
    if (!startStr || !endStr || ganttScale.length === 0) return { left: '0%', width: '10%' };
    const gridStart = new Date(ganttScale[0].dateStr).getTime();
    const totalDuration = new Date(ganttScale[ganttScale.length - 1].dateStr).getTime() - gridStart;
    const leftPercent = Math.max(0, Math.min(100, ((new Date(startStr).getTime() - gridStart) / totalDuration) * 100));
    const rightPercent = Math.max(0, Math.min(100, ((new Date(endStr).getTime() - gridStart) / totalDuration) * 100));
    return { left: `${leftPercent}%`, width: `${Math.max(3, rightPercent - leftPercent)}%` };
  };

  const togglePhaseCollapse = (ph) => {
    setCollapsedPhases(prev => ({ ...prev, [ph]: !prev[ph] }));
  };

  return (
    <div className="flex flex-col h-full w-full bg-white border border-zinc-200/90 rounded-2xl overflow-hidden font-sans text-zinc-900 text-[12px] shadow-sm select-none">
      
      {/* =========================================================================
          1. 스크린샷 규격 상단 브레드크럼 & 뷰 스위처 헤더 (Linear & Notion 룩)
          ========================================================================= */}
      <div className="px-5 py-3.5 border-b border-zinc-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-zinc-400 font-bold text-[13px]">
            <span>사역 본부</span>
            <span>/</span>
            <span className="text-zinc-600">2026 공정 관제</span>
            <span>/</span>
            <span className="text-zinc-900 font-black">사역 타임라인</span>
          </div>

          <span className="hidden sm:inline-block w-px h-4 bg-zinc-200 mx-1" />

          {/* D-Day 종합 요약 뱃지 */}
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold">
              진행 {metrics.inProgress}건
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
              완료 {metrics.completed}건
            </span>
          </div>
        </div>

        {/* 뷰 선택 스위처 (스크린샷 우측 버튼 매핑) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-zinc-100 p-0.5 rounded-xl border border-zinc-200 text-[11.5px] font-bold shadow-inner">
            <button 
              onClick={() => setViewMode('gantt')} 
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'gantt' ? 'bg-white text-zinc-900 shadow-sm font-black' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              타임라인 (Timeline)
            </button>
            <button 
              onClick={() => setViewMode('kanban')} 
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white text-zinc-900 shadow-sm font-black' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              칸반 보드 (Board)
            </button>
            <button 
              onClick={() => setViewMode('feed')} 
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'feed' ? 'bg-white text-zinc-900 shadow-sm font-black' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              WBS 피드 (Table)
            </button>
            <button 
              onClick={() => setViewMode('dday')} 
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'dday' ? 'bg-white text-zinc-900 shadow-sm font-black' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              D-Day 리스크 관제
            </button>
          </div>

          <button 
            onClick={() => setShowCreateModal(true)} 
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-xl text-[12px] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
          >
            <SvgPlus /> 신규 사역 수립
          </button>
        </div>
      </div>

      {/* 2. 검색 및 필터 툴바 */}
      <div className="px-5 py-2.5 bg-zinc-50/70 border-b border-zinc-200 flex flex-wrap justify-between items-center gap-2.5 shrink-0 text-[11.5px]">
        <div className="flex items-center gap-2">
          <select 
            value={filterDept} 
            onChange={e => setFilterDept(e.target.value)} 
            className="border border-zinc-200 bg-white px-2.5 py-1.5 rounded-lg font-bold text-zinc-700 outline-none cursor-pointer shadow-xs"
          >
            <option value="ALL">전체 사역 부서</option>
            {dynamicDepartments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select 
            value={filterPriority} 
            onChange={e => setFilterPriority(e.target.value)} 
            className="border border-zinc-200 bg-white px-2.5 py-1.5 rounded-lg font-bold text-zinc-700 outline-none cursor-pointer shadow-xs"
          >
            <option value="ALL">전체 우선순위</option>
            <option value="긴급">긴급 (Critical)</option>
            <option value="높음">높음 (High)</option>
            <option value="보통">보통 (Normal)</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <span className="absolute left-2.5 top-2 text-zinc-400 pointer-events-none"><SvgSearch /></span>
          <input 
            type="text" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            placeholder="사역명, 책임자 검색..." 
            className="w-full pl-8 pr-3 py-1.5 border border-zinc-200 bg-white rounded-lg outline-none focus:border-zinc-800 font-bold text-zinc-800 placeholder:text-zinc-400 placeholder:font-medium shadow-xs" 
          />
        </div>
      </div>

      {/* =========================================================================
          3-A. [메인 뷰 1] 🌟 스크린샷 1:1 고도화: Phased Hierarchical Timeline
          ========================================================================= */}
      {viewMode === 'gantt' && (
        <div className="flex-1 overflow-x-auto overflow-y-auto bg-white relative hide-scrollbar">
          <div className="min-w-[1100px] flex flex-col">
            
            {/* Timeline Column Headers (Months: Jan, Feb, Mar...) */}
            <div className="flex border-b border-zinc-200 bg-zinc-50/90 text-[11px] font-mono sticky top-0 z-30 shadow-xs">
              <div className="w-[340px] px-5 py-2.5 font-black text-zinc-400 uppercase tracking-wider border-r border-zinc-200 shrink-0 font-sans flex items-center justify-between">
                <span>Items & WBS Tasks</span>
                <span className="text-[10px] font-mono font-bold text-zinc-500">D-Day</span>
              </div>
              <div className="flex-1 grid grid-cols-3 divide-x divide-zinc-200 text-center font-bold text-zinc-600">
                {timelineMonths.map(m => (
                  <div key={m.label} className="py-2.5 flex items-center justify-center gap-1.5">
                    <span>{m.shortName}</span>
                    <span className="text-[10px] font-mono text-zinc-400 font-medium">({m.month}월)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Phased Section Blocks (스크린샷 그룹핑 완벽 재현) */}
            <div className="divide-y divide-zinc-200 bg-white">
              {PHASES.map((phaseName) => {
                const phaseProjects = filteredProjects.filter(p => p.phase === phaseName);
                const isCollapsed = collapsedPhases[phaseName];
                const theme = PHASE_THEMES[phaseName] || PHASE_THEMES['기획 및 준비'];

                // 단계별 전체 타임라인 범위 산출
                const startDates = phaseProjects.map(p => p.start_date).filter(Boolean);
                const endDates = phaseProjects.map(p => p.end_date).filter(Boolean);
                const minStart = startDates.length > 0 ? startDates.sort()[0] : '2026-01-01';
                const maxEnd = endDates.length > 0 ? endDates.sort().reverse()[0] : '2026-12-31';

                return (
                  <div key={phaseName} className="flex flex-col">
                    
                    {/* Phase Category Header Bar (스크린샷 상단 밴드) */}
                    <div className="px-5 py-2 bg-zinc-50/80 border-b border-zinc-200/80 flex items-center justify-between sticky top-[37px] z-20 backdrop-blur-xs">
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => togglePhaseCollapse(phaseName)}>
                        <button type="button" className={`text-zinc-400 hover:text-zinc-700 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}>
                          <SvgChevronDown />
                        </button>
                        <span className="font-black text-[12.5px] text-zinc-900 tracking-tight">Phase: {phaseName}</span>
                        <span className="text-[10.5px] font-mono text-zinc-500 ml-2">Timeline: {minStart} ~ {maxEnd}</span>
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ml-1 ${theme.badge}`}>
                          {phaseProjects.length}개 사역
                        </span>
                      </div>

                      {/* 아바타 스택 (스크린샷 우측 People) */}
                      <div className="flex items-center gap-1.5 text-zinc-500 font-bold text-[10.5px]">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {phaseProjects.slice(0, 4).map((p, pIdx) => (
                            <div key={p.id || pIdx} className={`w-5 h-5 rounded-full flex items-center justify-center text-[9.5px] font-black text-white border border-white shadow-xs ${theme.dot}`}>
                              {p.manager ? p.manager.charAt(0) : '목'}
                            </div>
                          ))}
                        </div>
                        <span className="ml-1 font-mono">{phaseProjects.length} People</span>
                      </div>
                    </div>

                    {/* Phase Projects & Subtasks Tree Rows */}
                    {!isCollapsed && (
                      <div className="divide-y divide-zinc-100">
                        {phaseProjects.length === 0 ? (
                          <div className="py-6 px-5 text-zinc-400 text-[11px] italic">
                            이 공정 단계에 배정된 사역이 없습니다.
                          </div>
                        ) : (
                          phaseProjects.map((p) => {
                            const dday = calculateDDay(p.end_date);
                            const barStyle = getGanttBarStyle(p.start_date, p.end_date);
                            const isDraggingThis = ganttDrag?.id === p.id;
                            const subtasks = p.subtasks || [];

                            return (
                              <React.Fragment key={p.id}>
                                {/* 메인 프로젝트 행 */}
                                <div className={`flex items-stretch transition-colors min-h-[46px] group ${isDraggingThis ? 'bg-indigo-50/40' : 'hover:bg-zinc-50/50'}`}>
                                  
                                  {/* 좌측 Items & Code & D-day 컬럼 */}
                                  <div 
                                    className="w-[340px] px-5 py-2 border-r border-zinc-200 shrink-0 flex items-center justify-between gap-2 cursor-pointer"
                                    onClick={() => setSelectedProject(p)}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="font-mono text-[10px] font-black text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 shrink-0">
                                        {p.code}
                                      </span>
                                      {p.progress === 100 ? (
                                        <SvgCheckCircle />
                                      ) : (
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${theme.dot}`} />
                                      )}
                                      <span className="font-black text-[12.5px] text-zinc-900 truncate tracking-tight group-hover:text-indigo-600 transition-colors">
                                        {p.project_name}
                                      </span>
                                    </div>

                                    {/* D-Day 뱃지 */}
                                    <span className={`px-2 py-0.5 rounded-md font-mono text-[10.5px] border shrink-0 shadow-xs ${dday.badgeClass}`}>
                                      {dday.text}
                                    </span>
                                  </div>

                                  {/* 우측 캔버스 캡슐 바 (Pill Bar) */}
                                  <div className="flex-1 relative flex items-center px-1">
                                    <div 
                                      className={`absolute h-[26px] rounded-full border shadow-xs overflow-hidden flex items-center px-3 transition-all cursor-move ${theme.bar} ${isDraggingThis ? 'ring-2 ring-indigo-300 z-20' : 'z-10'}`} 
                                      style={barStyle}
                                      title={`${p.project_name} (${p.start_date} ~ ${p.end_date})`}
                                    >
                                      {/* 내부 프로그레스 진척도 */}
                                      <div 
                                        className={`absolute bottom-0 left-0 top-0 opacity-20 ${theme.barFill}`} 
                                        style={{ width: `${p.progress}%` }} 
                                      />
                                      
                                      {/* 좌측 리사이즈 핸들 */}
                                      <div 
                                        onMouseDown={(e) => { e.stopPropagation(); setGanttDrag({ id: p.id, mode: 'left', startX: e.clientX, origStart: p.start_date, origEnd: p.end_date }); }} 
                                        className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-black/15 z-30" 
                                      />

                                      {/* 몸통 드래그 이동 핸들 */}
                                      <div 
                                        onMouseDown={(e) => setGanttDrag({ id: p.id, mode: 'move', startX: e.clientX, origStart: p.start_date, origEnd: p.end_date })} 
                                        className="absolute inset-x-2.5 top-0 bottom-0 cursor-move z-20" 
                                      />

                                      <div className="relative z-10 flex items-center justify-between w-full pointer-events-none text-[10.5px] font-black">
                                        <span className="truncate pr-1">{p.manager || '미지정'} ({p.progress}%)</span>
                                        <span className="font-mono text-[9.5px] opacity-75 shrink-0">{p.start_date.substring(5)}</span>
                                      </div>

                                      {/* 우측 리사이즈 핸들 */}
                                      <div 
                                        onMouseDown={(e) => { e.stopPropagation(); setGanttDrag({ id: p.id, mode: 'right', startX: e.clientX, origStart: p.start_date, origEnd: p.end_date }); }} 
                                        className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-black/15 z-30" 
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* 하위 태스크 가지치기 (스크린샷 └ 하위 항목들) */}
                                {subtasks.map((st, stIdx) => {
                                  const subDDay = calculateDDay(st.due_date);
                                  const subBarStyle = getGanttBarStyle(p.start_date, st.due_date || p.end_date);

                                  return (
                                    <div key={st.id || stIdx} className="flex items-stretch bg-zinc-50/30 hover:bg-zinc-50 transition-colors min-h-[34px]">
                                      
                                      {/* 좌측 브랜치 계층 표시 */}
                                      <div 
                                        className="w-[340px] pl-9 pr-5 py-1.5 border-r border-zinc-200 shrink-0 flex items-center justify-between gap-2 cursor-pointer"
                                        onClick={() => setSelectedProject(p)}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <SvgBranch />
                                          <input 
                                            type="checkbox" 
                                            checked={st.completed} 
                                            onChange={() => handleToggleSubtask(p.id, st.id)}
                                            onClick={e => e.stopPropagation()}
                                            className="w-3.5 h-3.5 rounded accent-zinc-900 cursor-pointer" 
                                          />
                                          <span className={`text-[11.5px] font-bold truncate ${st.completed ? 'line-through text-zinc-400' : 'text-zinc-700'}`}>
                                            {st.title}
                                          </span>
                                        </div>

                                        <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                                          {st.assignee || '배정중'}
                                        </span>
                                      </div>

                                      {/* 우측 하위 항목 서브 캡슐 바 */}
                                      <div className="flex-1 relative flex items-center px-1">
                                        <div 
                                          className={`absolute h-[16px] rounded-full border border-dashed opacity-75 shadow-2xs overflow-hidden flex items-center px-2 pointer-events-none ${theme.bar}`} 
                                          style={subBarStyle}
                                        >
                                          <span className="text-[9px] font-bold truncate">{st.title}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          3-B. [뷰 2] 4단계 드래그 앤 드롭 칸반 보드 (Board View)
          ========================================================================= */}
      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-x-auto overflow-y-auto bg-zinc-100/50 p-5 hide-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 min-w-[1000px] h-full">
            {PHASES.map((phaseName) => {
              const phaseProjects = filteredProjects.filter(p => p.phase === phaseName);
              const theme = PHASE_THEMES[phaseName];

              return (
                <div 
                  key={phaseName} 
                  onDragOver={e => onDragOverPhase(e, phaseName)}
                  onDragLeave={() => setDragOverColumn(null)}
                  onDrop={e => onDrop(e, phaseName)}
                  className={`bg-white border rounded-2xl flex flex-col h-full overflow-hidden transition-all shadow-sm ${dragOverColumn === phaseName ? 'border-zinc-500 ring-2 ring-zinc-200 bg-zinc-50/50' : 'border-zinc-200'}`}
                >
                  <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center shrink-0">
                    <span className="font-black text-[13px] text-zinc-900 tracking-tight">{phaseName}</span>
                    <span className="text-[11px] font-mono bg-white border border-zinc-200 text-zinc-600 px-2 py-0.5 rounded-md font-bold">{phaseProjects.length}</span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {phaseProjects.map((p) => {
                      const dday = calculateDDay(p.end_date);
                      const isDragOverThis = dragOverItem === p.id;
                      
                      return (
                        <React.Fragment key={p.id}>
                          {isDragOverThis && <div className="h-1 bg-indigo-500 rounded-full my-1 animate-pulse" />}
                          <div 
                            draggable
                            onDragStart={e => onDragStart(e, p.id)}
                            onDragEnd={onDragEnd}
                            onDragOver={e => onDragOverItem(e, p.id)}
                            onClick={() => setSelectedProject(p)}
                            className={`bg-white border rounded-xl p-3.5 space-y-3 transition-all cursor-grab active:cursor-grabbing shadow-xs hover:border-zinc-400 group ${activeDragItem === p.id ? 'opacity-40 scale-95 border-dashed border-zinc-400' : 'border-zinc-200'}`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <SvgGrip />
                                <span className="font-mono text-[10px] font-black text-zinc-400 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200 shrink-0">{p.code}</span>
                                <span className="font-black text-[13px] text-zinc-900 leading-snug truncate">{p.project_name}</span>
                              </div>
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${dday.badgeClass}`}>
                                {dday.text}
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[10.5px] font-bold text-zinc-500">
                                <span>WBS 진척률</span>
                                <strong className="text-zinc-900 font-mono">{p.progress}%</strong>
                              </div>
                              <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden border border-zinc-200/50">
                                <div className={`h-full transition-all duration-300 ${p.progress === 100 ? 'bg-emerald-500' : 'bg-zinc-800'}`} style={{ width: `${p.progress}%` }} />
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-zinc-100 text-[10.5px]">
                              <span className="text-zinc-500 font-bold bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100">{p.manager || '미지정'}</span>
                              <span className="text-zinc-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">클릭하여 상세 조회</span>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          3-C. [뷰 3] WBS 태스크 및 공정 상세 피드 (Table / Feed View)
          ========================================================================= */}
      {viewMode === 'feed' && (
        <div className="flex-1 overflow-y-auto bg-zinc-50 p-5 space-y-4 hide-scrollbar">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-20 bg-white border border-zinc-200 rounded-2xl text-zinc-400 font-bold">등록된 사역 일정이 없습니다.</div>
          ) : (
            filteredProjects.map((p) => {
              const dday = calculateDDay(p.end_date);
              const subtasks = p.subtasks || [];
              return (
                <div key={p.id} onClick={() => setSelectedProject(p)} className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4 shadow-xs hover:border-zinc-300 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10.5px] font-black text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">{p.code}</span>
                        <span className="font-black text-[15px] text-zinc-900 tracking-tight">{p.project_name}</span>
                        <span className="bg-zinc-100 border border-zinc-200 text-zinc-700 px-2 py-0.5 rounded-md text-[10.5px] font-bold">{p.department}</span>
                        <span className="bg-zinc-900 text-white px-2 py-0.5 rounded-md text-[10.5px] font-bold shadow-xs">{p.phase}</span>
                      </div>
                      <div className="text-[11.5px] text-zinc-500 font-mono font-medium">
                        기간: {p.start_date} ~ {p.end_date} (책임: {p.manager || '미지정'}) | 배정예산: ₩{Number(p.allocated_budget || 0).toLocaleString()}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] shrink-0 border shadow-xs ${dday.badgeClass}`}>
                      {dday.text}
                    </span>
                  </div>

                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between text-[11px] font-black text-zinc-500 uppercase tracking-wider mb-2">
                      <span>WBS 하위 실행 태스크 ({subtasks.filter(s => s.completed).length}/{subtasks.length})</span>
                      <span className="font-mono text-zinc-900">{p.progress}% 완료</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {subtasks.map(s => (
                        <div key={s.id} onClick={() => handleToggleSubtask(p.id, s.id)} className={`flex items-center gap-2.5 p-2 rounded-lg border text-[12px] cursor-pointer transition-colors ${s.completed ? 'bg-zinc-100/50 border-transparent' : 'bg-white border-zinc-200 hover:border-zinc-300'}`}>
                          <input type="checkbox" checked={s.completed} readOnly className="w-4 h-4 accent-zinc-900 cursor-pointer" />
                          <div className="flex flex-col">
                            <span className={`font-bold ${s.completed ? 'line-through text-zinc-400' : 'text-zinc-800'}`}>{s.title}</span>
                            <span className="text-[9.5px] font-bold text-zinc-500 flex items-center gap-1.5 mt-0.5">
                              {s.assignee && <span className="bg-zinc-200/60 px-1 rounded">{s.assignee}</span>}
                              {s.due_date && <span className="font-mono text-zinc-400">{s.due_date}</span>}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* =========================================================================
          3-D. [뷰 4] D-Day 리스크 관제 뷰 (D-Day Risk Center)
          ========================================================================= */}
      {viewMode === 'dday' && (
        <div className="flex-1 overflow-y-auto bg-zinc-50 p-5 space-y-4 hide-scrollbar">
          <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-xs space-y-1">
            <h4 className="font-black text-zinc-900 text-[14.5px]">D-Day 일정 리스크 집중 관제</h4>
            <p className="text-[11.5px] font-medium text-zinc-500">종료일이 임박하거나 기한이 초과된 사역 일정을 D-Day 카운트다운 기준으로 최우선 통제합니다.</p>
          </div>

          <div className="space-y-2.5">
            {filteredProjects.map((p) => {
              const dday = calculateDDay(p.end_date);
              return (
                <div key={p.id} className="bg-white border border-zinc-200 p-4 rounded-xl flex justify-between items-center gap-3 shadow-xs hover:border-zinc-300 transition-colors cursor-pointer" onClick={() => setSelectedProject(p)}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10.5px] font-black text-zinc-400 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200">{p.code}</span>
                      <span className="font-black text-[14px] text-zinc-900 tracking-tight">{p.project_name}</span>
                      <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">{p.department}</span>
                    </div>
                    <div className="text-[11.5px] text-zinc-500 font-mono font-medium">
                      마감 목표일: {p.end_date} | 공정률: {p.progress}% | 단계: {p.phase}
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-lg font-mono font-black text-[12px] border shadow-xs ${dday.badgeClass}`}>
                    {dday.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          4. 신규 사역 프로젝트 수립 모달
          ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[400] bg-zinc-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4 animate-fade-in select-none">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl font-sans flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-200 bg-zinc-50 shrink-0">
              <h3 className="text-[15.5px] font-black text-zinc-900 tracking-tight">신규 사역 프로젝트 수립</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-900 font-bold p-1 rounded-md hover:bg-zinc-200 transition-colors cursor-pointer"><SvgClose /></button>
            </div>

            <form onSubmit={handleAddProject} className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500 mb-1.5 pl-1">사역 프로젝트명 <span className="text-rose-500">*</span></label>
                <input type="text" value={form.project_name} onChange={e => setForm({...form, project_name: e.target.value})} placeholder="예: 2026 청년부 여름 수련회" className="w-full border border-zinc-200 bg-zinc-50 focus:bg-white p-3 rounded-xl font-bold text-[13px] text-zinc-900 outline-none focus:border-zinc-800 transition-colors" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500 mb-1.5 pl-1">주관 사역 부서 <span className="text-rose-500">*</span></label>
                  <input 
                    list="new-dept-options" 
                    value={form.department} 
                    onChange={e => setForm({...form, department: e.target.value})} 
                    placeholder="부서 입력 또는 선택..."
                    className="w-full border border-zinc-200 bg-zinc-50 focus:bg-white p-3 rounded-xl font-bold text-[12.5px] outline-none focus:border-zinc-800 transition-colors" 
                    required 
                  />
                  <datalist id="new-dept-options">
                    {dynamicDepartments.map(d => <option key={d} value={d} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500 mb-1.5 pl-1">사역 공정 단계</label>
                  <select 
                    value={form.phase} 
                    onChange={e => setForm({...form, phase: e.target.value})}
                    className="w-full border border-zinc-200 bg-zinc-50 focus:bg-white p-3 rounded-xl font-bold text-zinc-700 outline-none cursor-pointer focus:border-zinc-800 transition-colors"
                  >
                    {PHASES.map(ph => <option key={ph} value={ph}>{ph}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500 mb-1.5 pl-1">시작일 <span className="text-rose-500">*</span></label>
                  <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full border border-zinc-200 bg-zinc-50 focus:bg-white p-3 rounded-xl font-mono text-[12.5px] outline-none focus:border-zinc-800 transition-colors cursor-pointer font-bold" required />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500 mb-1.5 pl-1">종료일 (D-Day 기준일) <span className="text-rose-500">*</span></label>
                  <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full border border-zinc-200 bg-zinc-50 focus:bg-white p-3 rounded-xl font-mono text-[12.5px] outline-none focus:border-zinc-800 transition-colors cursor-pointer font-bold" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500 mb-1.5 pl-1">총괄 책임자</label>
                  <input type="text" value={form.manager} onChange={e => setForm({...form, manager: e.target.value})} placeholder="예: 김디렉터 목사" className="w-full border border-zinc-200 bg-zinc-50 focus:bg-white p-3 rounded-xl font-bold text-[12.5px] outline-none focus:border-zinc-800 transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500 mb-1.5 pl-1">우선순위</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full border border-zinc-200 bg-zinc-50 focus:bg-white p-3 rounded-xl font-bold text-rose-700 outline-none cursor-pointer focus:border-zinc-800 transition-colors">
                    <option value="보통">보통 (Normal)</option>
                    <option value="높음">높음 (High)</option>
                    <option value="긴급">긴급 (Critical)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 shrink-0 mt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 rounded-xl font-bold text-[12.5px] text-zinc-700 cursor-pointer transition-colors">취소</button>
                <button type="submit" className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-xl text-[12.5px] cursor-pointer shadow-sm active:scale-95 transition-all">프로젝트 수립</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. 상세 프로젝트 WBS & Audit 로그 인스펙터 모달
          ========================================================================= */}
      {selectedProject && (
        <div className="fixed inset-0 z-[400] bg-zinc-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4 animate-fade-in select-none">
          <div className="w-full max-w-3xl bg-white border border-zinc-300 rounded-2xl p-6 shadow-2xl font-sans flex flex-col max-h-[92vh] overflow-hidden">
            
            <div className="flex justify-between items-center border-b border-zinc-200 pb-4 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[10px] font-black bg-zinc-100 border border-zinc-200 text-zinc-500 px-2 py-0.5 rounded">{selectedProject.code}</span>
                <span className="bg-zinc-100 border border-zinc-200 text-zinc-600 font-bold text-[10px] px-2 py-0.5 rounded">{selectedProject.department}</span>
                <h3 className="text-[17px] font-black text-zinc-900 tracking-tight">{selectedProject.project_name}</h3>
              </div>
              <button onClick={() => setSelectedProject(null)} className="text-zinc-400 hover:text-zinc-900 font-bold p-1 rounded-md hover:bg-zinc-100 transition-colors cursor-pointer"><SvgClose /></button>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-5 px-1 pb-4">
              
              <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl space-y-2 text-[12px] shadow-xs">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-zinc-700">진행 공정 단계 변경</span>
                  <select value={selectedProject.phase} onChange={e => handleUpdatePhase(selectedProject.id, e.target.value)} className="border border-zinc-300 bg-white px-3 py-1.5 rounded-lg font-bold outline-none cursor-pointer focus:border-zinc-800 transition-colors shadow-xs">
                    {PHASES.map(ph => <option key={ph} value={ph}>{ph}</option>)}
                  </select>
                </div>
                <div className="flex justify-between text-zinc-500 font-mono text-[11.5px] font-medium pt-1 border-t border-zinc-200/60 mt-1">
                  <span>기간: {selectedProject.start_date} ~ {selectedProject.end_date}</span>
                  <span className="font-bold text-zinc-800">D-Day: {calculateDDay(selectedProject.end_date).text}</span>
                </div>
              </div>

              {/* WBS 세부 실행 체크리스트 */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-end border-b border-zinc-100 pb-2">
                  <div>
                    <span className="font-black text-zinc-900 text-[14.5px] block">WBS 하위 마이크로 태스크</span>
                    <span className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider">담당자, 마감일 할당</span>
                  </div>
                  <span className="font-mono font-black text-indigo-600 text-[15px] bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100 shadow-xs">{selectedProject.progress}% 완료</span>
                </div>

                <form onSubmit={handleAddSubtask} className="flex flex-wrap sm:flex-nowrap gap-2 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                  <input type="text" value={newSubtask.title} onChange={e => setNewSubtask({...newSubtask, title: e.target.value})} placeholder="실행 태스크 명..." className="flex-1 border border-zinc-200 bg-white px-3 py-2 rounded-lg text-[12px] font-bold outline-none focus:border-zinc-800" required />
                  <input type="text" value={newSubtask.assignee} onChange={e => setNewSubtask({...newSubtask, assignee: e.target.value})} placeholder="담당자" className="w-24 border border-zinc-200 bg-white px-2 py-2 rounded-lg text-[12px] font-bold outline-none focus:border-zinc-800 text-center" />
                  <input type="date" value={newSubtask.due_date} onChange={e => setNewSubtask({...newSubtask, due_date: e.target.value})} className="w-32 border border-zinc-200 bg-white px-2 py-2 rounded-lg text-[11.5px] font-mono font-bold outline-none focus:border-zinc-800 cursor-pointer text-zinc-600" />
                  <button type="submit" className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-lg text-[12px] cursor-pointer shadow-xs active:scale-95 transition-all">추가</button>
                </form>

                <div className="space-y-1.5 max-h-48 overflow-y-auto hide-scrollbar border border-zinc-200 rounded-xl p-1 bg-white">
                  {(selectedProject.subtasks || []).map(s => (
                    <div key={s.id} className={`flex items-center justify-between p-3 rounded-lg border text-[12.5px] transition-colors ${s.completed ? 'bg-zinc-50 border-transparent' : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-xs'}`}>
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleToggleSubtask(selectedProject.id, s.id)}>
                        <input type="checkbox" checked={s.completed} readOnly className="w-4 h-4 accent-zinc-900 cursor-pointer" />
                        <span className={`font-bold ${s.completed ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>{s.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.assignee && <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded text-[10.5px] font-bold border border-zinc-200">{s.assignee}</span>}
                        {s.due_date && <span className="font-mono text-zinc-400 text-[10.5px] font-bold">{s.due_date}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 감사 로그 (Audit Trail) */}
              <div className="space-y-3 pt-4 border-t border-zinc-200">
                <div className="flex justify-between items-end border-b border-zinc-100 pb-2">
                  <div>
                    <span className="font-black text-zinc-900 text-[14.5px] block">이벤트 로그 (Audit Trail)</span>
                    <span className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider">누적 {selectedProject.logs?.length || 0}건 기록됨</span>
                  </div>
                </div>
                
                <form onSubmit={handleAddLog} className="flex gap-2">
                  <input type="date" value={newLogDate} onChange={e => setNewLogDate(e.target.value)} className="w-32 border border-zinc-200 bg-zinc-50 focus:bg-white px-3 py-2.5 rounded-lg font-mono font-bold text-[11.5px] outline-none focus:border-zinc-800 transition-colors cursor-pointer shrink-0 text-zinc-700" required />
                  <input type="text" value={newLogMemo} onChange={e => setNewLogMemo(e.target.value)} placeholder="의사결정, 리스크 등 특이사항 기입..." className="flex-1 border border-zinc-200 bg-zinc-50 focus:bg-white px-4 py-2.5 rounded-lg text-[13px] font-bold outline-none focus:border-zinc-800 transition-colors placeholder:font-medium placeholder:text-zinc-400" required />
                  <button type="submit" className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-lg text-[12px] cursor-pointer shadow-xs active:scale-95 transition-all shrink-0">로그 기록</button>
                </form>

                <div className="space-y-2 max-h-36 overflow-y-auto hide-scrollbar bg-zinc-50/50 p-2 rounded-xl border border-zinc-200">
                  {(selectedProject.logs || []).map(l => (
                    <div key={l.id} className="p-2.5 bg-white border border-zinc-200 shadow-xs rounded-lg text-[12.5px] flex items-center gap-3">
                      <span className="font-mono text-zinc-400 font-bold text-[11px] shrink-0">[{l.date}]</span>
                      <span className="text-zinc-800 font-bold">{l.memo}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="flex justify-between items-center pt-4 border-t border-zinc-200 shrink-0 mt-2">
              <button onClick={() => handleDeleteProject(selectedProject.id)} className="px-4 py-2.5 bg-white hover:bg-rose-50 text-rose-600 border border-zinc-200 hover:border-rose-200 rounded-xl font-bold text-[11.5px] cursor-pointer transition-colors shadow-xs">
                사역 프로젝트 완전 삭제
              </button>
              <button onClick={() => setSelectedProject(null)} className="px-8 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-xl text-[12.5px] cursor-pointer shadow-xs active:scale-95 transition-all">
                저장 및 닫기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
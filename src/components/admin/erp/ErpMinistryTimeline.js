// src/components/admin/erp/ErpMinistryTimeline.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../../lib/supabase';

const PHASES = ['기획 및 준비', '실행 및 홍보', '본 행사 진행', '사후 평가 및 결산'];

// 🎨 Rapport 에디토리얼 파스텔 & 솔리드 컬러 테마
const PHASE_THEMES = {
  '기획 및 준비': {
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    bar: 'bg-[#DCD6FA]/90 border-[#B8ACF6] text-purple-950',
    barFill: 'bg-purple-600',
    dot: 'bg-purple-500',
    accentBorder: 'border-l-purple-500'
  },
  '실행 및 홍보': {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bar: 'bg-[#CEEAD6]/90 border-[#9AD3AA] text-emerald-950',
    barFill: 'bg-emerald-600',
    dot: 'bg-emerald-500',
    accentBorder: 'border-l-emerald-500'
  },
  '본 행사 진행': {
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    bar: 'bg-[#FEE3A2]/90 border-[#F9C851] text-amber-950',
    barFill: 'bg-amber-600',
    dot: 'bg-amber-500',
    accentBorder: 'border-l-amber-500'
  },
  '사후 평가 및 결산': {
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    bar: 'bg-[#D0E7FD]/90 border-[#93C8FA] text-sky-950',
    barFill: 'bg-sky-600',
    dot: 'bg-sky-500',
    accentBorder: 'border-l-sky-500'
  }
};

// 🌟 엔터프라이즈 모노크롬 SVG 아이콘 세트
const SvgSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const SvgPlus = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const SvgClose = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const SvgGrip = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0"><circle cx="8" cy="6" r="2"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/></svg>;
const SvgChevronDown = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>;
const SvgCheckCircle = () => <svg fill="currentColor" viewBox="0 0 20 20" className="w-3.5 h-3.5 text-emerald-500 shrink-0"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>;
const SvgBranch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-zinc-300 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v11.25a2.25 2.25 0 002.25 2.25H18" /></svg>;
const SvgCopy = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>;

// 날짜 연산 유틸
const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const diffDays = (startStr, endStr) => {
  const s = new Date(startStr);
  const e = new Date(endStr);
  return Math.round((e - s) / (1000 * 60 * 60 * 24));
};

// 🌟 정밀 D-Day 계산 헬퍼
const calculateDDay = (targetDateStr, progress = 0) => {
  if (progress === 100) {
    return { text: '완료됨', isOverdue: false, isUrgent: false, days: 999, badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' };
  }
  if (!targetDateStr) return { text: '-', isOverdue: false, isUrgent: false, days: 0, badgeClass: 'bg-zinc-100 text-zinc-500 border-zinc-200' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  const diffTime = target - today;
  const dDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (dDays === 0) return { text: 'D-Day', isOverdue: false, isUrgent: true, days: 0, badgeClass: 'bg-rose-600 text-white border-rose-600 font-black animate-pulse' };
  if (dDays > 0) {
    const isUrgent = dDays <= 5;
    return {
      text: `D-${dDays}`,
      isOverdue: false,
      isUrgent,
      days: dDays,
      badgeClass: isUrgent
        ? 'bg-amber-50 text-amber-800 border-amber-300 font-black'
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
  const [scaleDays, setScaleDays] = useState(60);    // 30 | 60 | 90일 스케일
  const [showKpiStrip, setShowKpiStrip] = useState(true);
  const [mobileGanttMode, setMobileGanttMode] = useState('split'); // 'split' (슬림간트) | 'cards' (모바일 카드형)

  const [filterDept, setFilterDept] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterRisk, setFilterRisk] = useState('ALL'); // 'ALL' | 'OVERDUE' | 'URGENT'
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

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

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const initialFormState = {
    project_name: '',
    department: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    manager: '',
    priority: '보통',
    phase: '기획 및 준비',
    allocated_budget: '',
    actual_spent: 0,
    progress: 0,
    dependencies: [],
    order_index: 0,
    subtasks: [
      { id: 1, title: '사역 기본 기획안 수립 및 당회 품의', completed: true, assignee: '김목회', priority: '높음', due_date: new Date().toISOString().split('T')[0] },
      { id: 2, title: '예산 및 인력 배정 확정', completed: false, assignee: '이행정', priority: '보통', due_date: addDays(new Date().toISOString().split('T')[0], 5) }
    ],
    logs: []
  };
  const [form, setForm] = useState(initialFormState);

  // DB 호출
  const fetchTimeline = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('erp_ministry_timeline').select('*');
      if (data && !error) {
        const sanitized = data.map((d, i) => ({
          ...d,
          code: d.code || `MP-${String(i + 1).padStart(2, '0')}`,
          order_index: d.order_index ?? i * 1000,
          dependencies: Array.isArray(d.dependencies) ? d.dependencies : []
        }));
        setProjects(sanitized);
      }
    } catch (_) {}
  }, []);

  useEffect(() => { fetchTimeline(); }, [fetchTimeline]);

  // 동적 부서 목록
  const dynamicDepartments = useMemo(() => {
    const defaults = ['예배사역부', '청년교구', '교구사역국', '선교위원회', '교육위원회', '재정관리부'];
    const dbDepts = projects.map(p => p.department).filter(Boolean);
    return Array.from(new Set([...defaults, ...dbDepts])).sort();
  }, [projects]);

  // 의존성 도미노 시프트 연산
  const cascadeDependencies = useCallback((projectId, newEndDate, currentProjects) => {
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
  }, []);

  // DB 동기화
  const syncProjectsToDB = async (updatedProjects) => {
    if (!supabase) return;
    try {
      for (const p of updatedProjects) {
        await supabase.from('erp_ministry_timeline').update({
          start_date: p.start_date,
          end_date: p.end_date,
          phase: p.phase,
          progress: p.progress,
          allocated_budget: Number(p.allocated_budget) || 0,
          actual_spent: Number(p.actual_spent) || 0,
          manager: p.manager,
          priority: p.priority
        }).eq('id', p.id);
      }
    } catch (e) {
      console.error('DB 동기화 에러:', e);
    }
  };

  // 🌟 [버그 수정 완료] 간트 차트 리사이즈 & 드래그 이동 (ganttContainerRef 정상 참조)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!ganttDrag || !ganttContainerRef.current) return;
      const rect = ganttContainerRef.current.getBoundingClientRect();
      const trackWidth = Math.max(300, rect.width);
      const pxPerDay = trackWidth / scaleDays;
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
        showToast('⚡ 타임라인 일정이 업데이트되었습니다.');
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
  }, [ganttDrag, scaleDays, cascadeDependencies, showToast]);

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
      actual_spent: Number(form.actual_spent) || 0,
      progress,
      status: progress === 100 ? '완료' : '진행중',
      subtasks: form.subtasks,
      logs: [{ id: Date.now(), date: new Date().toISOString().split('T')[0], memo: '사역 프로젝트 최초 수립' }]
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
    showToast('✨ 새로운 사역 프로젝트가 수립되었습니다.');
  };

  // 프로젝트 필드 업데이트 (상세 모달 내부 수정용)
  const handleUpdateProjectFields = async (id, patch) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    if (selectedProject?.id === id) {
      setSelectedProject(prev => ({ ...prev, ...patch }));
    }
    if (supabase) {
      await supabase.from('erp_ministry_timeline').update(patch).eq('id', id);
    }
  };

  const handleUpdatePhase = async (id, nextPhase) => {
    await handleUpdateProjectFields(id, { phase: nextPhase });
    showToast(`📌 공정 단계가 [${nextPhase}](으)로 변경되었습니다.`);
  };

  // 칸반 드래그 핸들러
  const onDragStart = (e, projectId) => {
    e.dataTransfer.setData('text/plain', projectId);
    e.dataTransfer.effectAllowed = 'move';
    setActiveDragItem(projectId);
  };
  const onDragEnd = () => { setActiveDragItem(null); setDragOverColumn(null); };
  const onDragOverPhase = (e, phaseName) => { e.preventDefault(); if (dragOverColumn !== phaseName) setDragOverColumn(phaseName); };
  const onDragOverItem = (e, projectId) => { e.preventDefault(); e.stopPropagation(); setDragOverItem(projectId); };

  const onDrop = async (e, phaseName) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain') || activeDragItem;
    setDragOverColumn(null);
    setDragOverItem(null);
    setActiveDragItem(null);
    if (!draggedId) return;

    setProjects(prev => {
      let updated = [...prev];
      const draggedIdx = updated.findIndex(p => p.id === draggedId);
      if (draggedIdx === -1) return prev;
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

  // 서브태스크 완료 토글
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

  // 서브태스크 추가
  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtask.title.trim() || !selectedProject) return;
    const newItem = { id: Date.now(), ...newSubtask, completed: false };
    const updatedSubtasks = [...(selectedProject.subtasks || []), newItem];
    const autoProgress = Math.round((updatedSubtasks.filter(s => s.completed).length / updatedSubtasks.length) * 100);

    const updatedProject = { ...selectedProject, subtasks: updatedSubtasks, progress: autoProgress, status: autoProgress === 100 ? '완료' : '진행중' };
    setSelectedProject(updatedProject);
    setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
    setNewSubtask({ title: '', assignee: '', due_date: '', priority: '보통' });

    if (supabase) {
      await supabase.from('erp_ministry_timeline').update({ subtasks: updatedSubtasks, progress: autoProgress, status: updatedProject.status }).eq('id', selectedProject.id);
    }
  };

  // 서브태스크 삭제
  const handleDeleteSubtask = async (subtaskId) => {
    if (!selectedProject) return;
    const updatedSubtasks = (selectedProject.subtasks || []).filter(s => s.id !== subtaskId);
    const autoProgress = updatedSubtasks.length > 0
      ? Math.round((updatedSubtasks.filter(s => s.completed).length / updatedSubtasks.length) * 100)
      : 0;

    const updatedProject = { ...selectedProject, subtasks: updatedSubtasks, progress: autoProgress, status: autoProgress === 100 ? '완료' : '진행중' };
    setSelectedProject(updatedProject);
    setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));

    if (supabase) {
      await supabase.from('erp_ministry_timeline').update({ subtasks: updatedSubtasks, progress: autoProgress, status: updatedProject.status }).eq('id', selectedProject.id);
    }
  };

  // 로그 기록 추가
  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!newLogMemo.trim() || !selectedProject) return;
    const updatedProject = { ...selectedProject, logs: [{ id: Date.now(), date: newLogDate, memo: newLogMemo.trim() }, ...(selectedProject.logs || [])] };
    setSelectedProject(updatedProject);
    setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
    setNewLogMemo('');
    if (supabase) await supabase.from('erp_ministry_timeline').update({ logs: updatedProject.logs }).eq('id', selectedProject.id);
  };

  // 프로젝트 삭제
  const handleDeleteProject = async (id) => {
    if (!window.confirm('해당 사역 프로젝트를 영구 삭제하시겠습니까?')) return;
    if (supabase) await supabase.from('erp_ministry_timeline').delete().eq('id', id);
    setProjects(prev => prev.filter(p => p.id !== id).map(p => ({ ...p, dependencies: p.dependencies?.filter(dep => dep !== id) })));
    if (selectedProject?.id === id) setSelectedProject(null);
    showToast('🗑️ 사역 프로젝트가 삭제되었습니다.');
  };

  // =========================================================================
  // 📊 Rapport 에그제큐티브 벤토 메트릭 연산
  // =========================================================================
  const metrics = useMemo(() => {
    const total = projects.length;
    const completed = projects.filter(p => p.progress === 100).length;
    const avgProgress = total > 0 ? Math.round(projects.reduce((a, b) => a + (Number(b.progress) || 0), 0) / total) : 0;

    let overdueCount = 0;
    let urgentCount = 0;
    let totalSubtasks = 0;
    let completedSubtasks = 0;

    projects.forEach(p => {
      const d = calculateDDay(p.end_date, p.progress);
      if (d.isOverdue) overdueCount++;
      else if (d.isUrgent) urgentCount++;

      const subs = p.subtasks || [];
      totalSubtasks += subs.length;
      completedSubtasks += subs.filter(s => s.completed).length;
    });

    const totalBudget = projects.reduce((acc, cur) => acc + (Number(cur.allocated_budget) || 0), 0);
    const totalSpent = projects.reduce((acc, cur) => acc + (Number(cur.actual_spent) || 0), 0);
    const burnRate = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;

    return {
      total,
      completed,
      inProgress: total - completed,
      avgProgress,
      overdueCount,
      urgentCount,
      totalBudget,
      totalSpent,
      burnRate,
      totalSubtasks,
      completedSubtasks
    };
  }, [projects]);

  // 원클릭 당회/사역 보고서 클립보드 복사 (Rapport Report Generator)
  const handleCopyRapportSummary = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lines = [
      `📋 [사역 본부 공정 & 예산 Rapport 보고서] (${todayStr} 기준)`,
      `• 전체 사역: 총 ${metrics.total}건 (완료 ${metrics.completed}건 / 진행 ${metrics.inProgress}건 / 평균 진척률 ${metrics.avgProgress}%)`,
      `• 일정 리스크: 지연 ${metrics.overdueCount}건 / 임박(D-5 이내) ${metrics.urgentCount}건`,
      `• 총 배정 예산: ₩${metrics.totalBudget.toLocaleString()} (실집행: ₩${metrics.totalSpent.toLocaleString()} / 집행률 ${metrics.burnRate}%)`,
      ``,
      `[단계별 주요 사역 현황]`
    ];

    PHASES.forEach(ph => {
      const list = projects.filter(p => p.phase === ph);
      if (list.length > 0) {
        lines.push(`\n▶ ${ph} (${list.length}건)`);
        list.forEach(p => {
          const dday = calculateDDay(p.end_date, p.progress);
          lines.push(`  - [${p.code}] ${p.project_name} (${p.department}/${p.manager || '미지정'}) : 진척 ${p.progress}% | ${dday.text}`);
        });
      }
    });

    navigator.clipboard.writeText(lines.join('\n'));
    showToast('📋 당회/목회 브리핑 보고서가 클립보드에 복사되었습니다!');
  };

  // 필터링된 프로젝트 목록
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = !searchTerm ||
        p.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.manager?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchTerm.toLowerCase());

      const dday = calculateDDay(p.end_date, p.progress);
      const matchesRisk =
        filterRisk === 'ALL' ||
        (filterRisk === 'OVERDUE' && dday.isOverdue) ||
        (filterRisk === 'URGENT' && dday.isUrgent);

      return (
        (filterDept === 'ALL' || p.department === filterDept) &&
        (filterPriority === 'ALL' || p.priority === filterPriority) &&
        matchesRisk &&
        matchesSearch
      );
    }).sort((a, b) => a.order_index - b.order_index);
  }, [projects, filterDept, filterPriority, filterRisk, searchTerm]);

  // =========================================================================
  // 🗓️ 1:1 정밀 동기화된 간트 스케일 & 월(Month) 헤더 구간 계산
  // =========================================================================
  const ganttScale = useMemo(() => {
    const days = [];
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);
    baseDate.setDate(baseDate.getDate() - 10); // 오늘로부터 10일 전부터 표시
    const todayIso = new Date().toISOString().split('T')[0];

    for (let i = 0; i < scaleDays; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const str = d.toISOString().split('T')[0];
      days.push({
        dateStr: str,
        dayNum: d.getDate(),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        shortMonth: d.toLocaleString('en-US', { month: 'short' }),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        isToday: str === todayIso
      });
    }
    return days;
  }, [scaleDays]);

  // ganttScale 내부 일수 비율에 정확히 맞춘 상단 월(Month) 헤더 그룹
  const timelineMonthSegments = useMemo(() => {
    const map = new Map();
    ganttScale.forEach(d => {
      const key = `${d.year}-${d.month}`;
      if (!map.has(key)) {
        map.set(key, { key, year: d.year, month: d.month, shortMonth: d.shortMonth, count: 0 });
      }
      map.get(key).count += 1;
    });
    return Array.from(map.values()).map(seg => ({
      ...seg,
      widthPercent: (seg.count / ganttScale.length) * 100
    }));
  }, [ganttScale]);

  // 오늘(Today) 수직 레이저 라인 위치 (%)
  const todayLineLeftPercent = useMemo(() => {
    const idx = ganttScale.findIndex(d => d.isToday);
    if (idx === -1) return null;
    return ((idx + 0.5) / ganttScale.length) * 100;
  }, [ganttScale]);

  const getGanttBarStyle = (startStr, endStr) => {
    if (!startStr || !endStr || ganttScale.length === 0) return { left: '0%', width: '8%' };
    const gridStart = new Date(ganttScale[0].dateStr).getTime();
    const gridEnd = new Date(ganttScale[ganttScale.length - 1].dateStr).getTime();
    const totalDuration = Math.max(86400000, gridEnd - gridStart);

    const sTime = new Date(startStr).getTime();
    const eTime = new Date(endStr).getTime();

    const leftPercent = Math.max(0, Math.min(96, ((sTime - gridStart) / totalDuration) * 100));
    const rightPercent = Math.max(leftPercent + 3, Math.min(100, ((eTime - gridStart) / totalDuration) * 100));
    return { left: `${leftPercent}%`, width: `${Math.max(3.5, rightPercent - leftPercent)}%` };
  };

  const togglePhaseCollapse = (ph) => {
    setCollapsedPhases(prev => ({ ...prev, [ph]: !prev[ph] }));
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#FAFAFA] border border-zinc-200/90 rounded-2xl overflow-hidden font-sans text-zinc-900 text-[12px] shadow-sm select-none relative">
      
      {/* 토스트 알림 */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[500] px-4 py-2 rounded-full bg-zinc-900 text-white text-xs font-bold shadow-xl border border-white/15 flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* =========================================================================
          1. Rapport 스타일 상단 에디토리얼 헤더 & 뷰 컨트롤러
          ========================================================================= */}
      <div className="px-3.5 sm:px-6 py-3 border-b border-zinc-200/90 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-2.5 bg-white shrink-0">
        
        <div className="flex items-center justify-between lg:justify-start gap-2.5">
          <div className="flex items-center gap-1.5 text-zinc-400 font-bold text-xs sm:text-[13px] truncate">
            <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-white font-mono text-[10px] font-black tracking-wider">RAPPORT</span>
            <span className="hidden sm:inline">사역 본부</span>
            <span className="hidden sm:inline">/</span>
            <span className="text-zinc-900 font-black truncate">2026 사역 로드맵 & 공정 관제</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopyRapportSummary}
              className="px-2.5 py-1 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
              title="당회 및 목회 회의용 텍스트 보고서 복사"
            >
              <SvgCopy /> <span className="hidden sm:inline">브리핑 복사</span>
            </button>
            <button
              onClick={() => setShowKpiStrip(!showKpiStrip)}
              className="px-2 py-1 rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 text-[10.5px] font-bold cursor-pointer"
            >
              {showKpiStrip ? '지표 접기 ▴' : '지표 열기 ▾'}
            </button>
          </div>
        </div>

        {/* 뷰 스위처 & 신규 수립 버튼 */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div className="flex bg-zinc-100 p-0.5 rounded-xl border border-zinc-200/80 text-[11px] font-bold overflow-x-auto hide-scrollbar">
            {[
              { id: 'gantt', label: '타임라인' },
              { id: 'kanban', label: '칸반 보드' },
              { id: 'feed', label: 'WBS 테이블' },
              { id: 'dday', label: 'D-Day 관제' }
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  viewMode === v.id ? 'bg-white text-zinc-900 shadow-xs font-black' : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 sm:px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-xl text-[11.5px] shadow-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
          >
            <SvgPlus /> <span>신규 수립</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. Rapport 4대 에그제큐티브 벤토(Bento) KPI 요약 스트립
          ========================================================================= */}
      {showKpiStrip && (
        <div className="px-3.5 sm:px-6 py-2.5 bg-white border-b border-zinc-200/80 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 shrink-0">
          
          {/* KPI 1: 전체 사역 공정률 */}
          <div className="p-2.5 sm:p-3 rounded-xl border border-zinc-200/80 bg-[#FAFAFA] flex flex-col justify-between">
            <div className="flex justify-between items-center text-[10.5px] font-bold text-zinc-400 uppercase font-mono">
              <span>VELOCITY / 공정률</span>
              <span className="text-zinc-900 font-black">{metrics.completed}/{metrics.total} 완료</span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg sm:text-xl font-black text-zinc-900 font-mono">{metrics.avgProgress}%</span>
              <span className="text-[10.5px] font-bold text-emerald-600">진행 {metrics.inProgress}건</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-zinc-900 transition-all duration-500" style={{ width: `${metrics.avgProgress}%` }} />
            </div>
          </div>

          {/* KPI 2: 일정 리스크 (클릭 시 즉시 필터링) */}
          <div 
            onClick={() => setFilterRisk(prev => prev === 'ALL' ? 'OVERDUE' : prev === 'OVERDUE' ? 'URGENT' : 'ALL')}
            className="p-2.5 sm:p-3 rounded-xl border border-zinc-200/80 bg-[#FAFAFA] hover:border-zinc-400 transition-all cursor-pointer flex flex-col justify-between"
            title="클릭하여 지연/임박 사역만 필터링"
          >
            <div className="flex justify-between items-center text-[10.5px] font-bold text-zinc-400 uppercase font-mono">
              <span>SCHEDULE RISK</span>
              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-700">
                {filterRisk === 'ALL' ? '전체보기' : filterRisk === 'OVERDUE' ? '지연필터' : '임박필터'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg sm:text-xl font-black text-rose-600 font-mono">지연 {metrics.overdueCount}</span>
              <span className="text-xs font-bold text-zinc-300">/</span>
              <span className="text-sm sm:text-base font-black text-amber-600 font-mono">임박 {metrics.urgentCount}</span>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 mt-1 block truncate">
              터치하여 리스크 사역 즉시 필터링
            </span>
          </div>

          {/* KPI 3: 예산 집행 리포트 (Burn-Rate) */}
          <div className="p-2.5 sm:p-3 rounded-xl border border-zinc-200/80 bg-[#FAFAFA] flex flex-col justify-between">
            <div className="flex justify-between items-center text-[10.5px] font-bold text-zinc-400 uppercase font-mono">
              <span>BUDGET RAPPORT</span>
              <span className="text-indigo-600 font-black">집행 {metrics.burnRate}%</span>
            </div>
            <div className="mt-1 truncate">
              <span className="text-sm sm:text-base font-black text-zinc-900 font-mono">
                ₩{metrics.totalBudget.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 mt-1 block truncate">
              실집행: ₩{metrics.totalSpent.toLocaleString()}
            </span>
          </div>

          {/* KPI 4: WBS 실행 체크리스트 */}
          <div className="p-2.5 sm:p-3 rounded-xl border border-zinc-200/80 bg-[#FAFAFA] flex flex-col justify-between">
            <div className="flex justify-between items-center text-[10.5px] font-bold text-zinc-400 uppercase font-mono">
              <span>WBS SUBTASKS</span>
              <span className="text-emerald-600 font-black">
                {metrics.totalSubtasks > 0 ? Math.round((metrics.completedSubtasks / metrics.totalSubtasks) * 100) : 0}%
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg sm:text-xl font-black text-zinc-900 font-mono">
                {metrics.completedSubtasks} <span className="text-xs font-normal text-zinc-400">/ {metrics.totalSubtasks}</span>
              </span>
              <span className="text-[10.5px] font-bold text-zinc-500">세부 과업</span>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 mt-1 block truncate">
              체크리스트 완료 시 공정률 자동 반영
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. 필터 & 스케일 & 모바일 뷰 컨트롤 바
          ========================================================================= */}
      <div className="px-3.5 sm:px-6 py-2 bg-zinc-50 border-b border-zinc-200/90 flex flex-wrap justify-between items-center gap-2 shrink-0 text-[11.5px]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="border border-zinc-200 bg-white px-2.5 py-1 rounded-lg font-bold text-zinc-700 outline-none cursor-pointer shadow-2xs"
          >
            <option value="ALL">전체 부서</option>
            {dynamicDepartments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="border border-zinc-200 bg-white px-2.5 py-1 rounded-lg font-bold text-zinc-700 outline-none cursor-pointer shadow-2xs"
          >
            <option value="ALL">전체 우선순위</option>
            <option value="긴급">🔥 긴급</option>
            <option value="높음">⚡ 높음</option>
            <option value="보통">📌 보통</option>
          </select>

          {/* 간트 스케일 조절 (타임라인 모드일 때만) */}
          {viewMode === 'gantt' && (
            <div className="flex items-center bg-zinc-200/70 p-0.5 rounded-lg text-[10.5px] font-bold">
              {[
                { d: 30, label: '30일' },
                { d: 60, label: '60일' },
                { d: 90, label: '90일' }
              ].map(s => (
                <button
                  key={s.d}
                  onClick={() => setScaleDays(s.d)}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${
                    scaleDays === s.d ? 'bg-white text-zinc-900 font-black shadow-2xs' : 'text-zinc-600'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* 📱 모바일 전용: 슬림 간트 vs 모바일 카드 리스트 전환 스위치 */}
          {viewMode === 'gantt' && (
            <button
              onClick={() => setMobileGanttMode(prev => prev === 'split' ? 'cards' : 'split')}
              className="sm:hidden px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-black text-[10.5px] cursor-pointer"
            >
              {mobileGanttMode === 'split' ? '📱 카드형으로 보기' : '📊 간트차트로 보기'}
            </button>
          )}
        </div>

        {/* 검색창 */}
        <div className="relative flex-1 sm:flex-initial sm:w-60 min-w-[160px]">
          <span className="absolute left-2.5 top-1.5 text-zinc-400 pointer-events-none"><SvgSearch /></span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="사역명, 코드(MP-01), 책임자..."
            className="w-full pl-8 pr-3 py-1 border border-zinc-200 bg-white rounded-lg outline-none focus:border-zinc-800 font-bold text-zinc-800 placeholder:text-zinc-400 select-text shadow-2xs"
          />
        </div>
      </div>

      {/* =========================================================================
          4-A. [메인 뷰 1] 🌟 Rapport Phased Hierarchical Timeline (데스크톱 & 모바일)
          ========================================================================= */}
      {viewMode === 'gantt' && (
        <div className="flex-1 overflow-x-auto overflow-y-auto bg-white relative hide-scrollbar">
          
          {/* 📱 모바일에서 '카드형으로 보기'를 선택했을 때 렌더링되는 모바일 최적화 타임라인 */}
          {mobileGanttMode === 'cards' ? (
            <div className="sm:hidden p-3 space-y-4 pb-20">
              {PHASES.map(phaseName => {
                const phaseProjects = filteredProjects.filter(p => p.phase === phaseName);
                const theme = PHASE_THEMES[phaseName];
                return (
                  <div key={phaseName} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${theme.dot}`} />
                        <span className="font-black text-xs text-zinc-900">{phaseName}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${theme.badge}`}>
                        {phaseProjects.length}건
                      </span>
                    </div>

                    {phaseProjects.length === 0 ? (
                      <div className="p-3 rounded-xl border border-dashed border-zinc-200 text-center text-zinc-400 text-[11px]">
                        등록된 사역 없음
                      </div>
                    ) : (
                      phaseProjects.map(p => {
                        const dday = calculateDDay(p.end_date, p.progress);
                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedProject(p)}
                            className={`p-3.5 rounded-xl bg-white border border-zinc-200 border-l-4 ${theme.accentBorder} shadow-2xs space-y-2 active:scale-[0.99] transition-transform`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[10px] font-black text-zinc-400">{p.code}</span>
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600">{p.department}</span>
                                </div>
                                <h4 className="font-black text-[13.5px] text-zinc-900 truncate mt-0.5">{p.project_name}</h4>
                              </div>
                              <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] border shrink-0 ${dday.badgeClass}`}>
                                {dday.text}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                              <span>📅 {p.start_date.slice(5)} ~ {p.end_date.slice(5)}</span>
                              <span className="font-sans font-bold text-zinc-700">👤 {p.manager || '미지정'}</span>
                            </div>

                            {/* 모바일 캡슐 프로그레스 바 */}
                            <div className="w-full h-5 rounded-full border p-0.5 flex items-center relative overflow-hidden bg-zinc-50 border-zinc-200">
                              <div className={`h-full rounded-full transition-all ${theme.bar}`} style={{ width: `${Math.max(12, p.progress)}%` }} />
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-black text-zinc-800">
                                공정률 {p.progress}%
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* 🖥️ 데스크톱 및 모바일 슬림 스플릿 간트 타임라인 */}
          <div className={`${mobileGanttMode === 'cards' ? 'hidden sm:flex' : 'flex'} min-w-[720px] sm:min-w-[1080px] flex-col relative`}>
            
            {/* 1) 상단 월(Month) & 일(Day) 2단 고정 스케일 헤더 */}
            <div className="flex border-b border-zinc-200 bg-zinc-50/95 text-[11px] font-mono sticky top-0 z-30 shadow-2xs">
              {/* 좌측 고정 컬럼 헤더 (모바일은 165px로 슬림화하여 우측 타임라인 시야 확보!) */}
              <div className="w-[165px] sm:w-[330px] px-3 sm:px-5 py-2.5 font-black text-zinc-500 uppercase tracking-wider border-r border-zinc-200 shrink-0 font-sans flex items-center justify-between bg-zinc-50 sticky left-0 z-40">
                <span className="truncate">사역 및 WBS 항목</span>
                <span className="text-[10px] font-mono font-bold text-zinc-400 hidden sm:inline">D-Day</span>
              </div>

              {/* 우측 타임라인 월/주 트랙 헤더 (ref={ganttContainerRef} 연결!) */}
              <div ref={ganttContainerRef} className="flex-1 flex flex-col relative overflow-hidden">
                {/* 1층: 월(Month) 구간 */}
                <div className="flex border-b border-zinc-200/70 divide-x divide-zinc-200">
                  {timelineMonthSegments.map(seg => (
                    <div
                      key={seg.key}
                      style={{ width: `${seg.widthPercent}%` }}
                      className="py-1.5 px-2 text-center font-bold text-zinc-700 truncate bg-white/60"
                    >
                      {seg.year}.{seg.month}월 <span className="text-zinc-400 font-normal">({seg.shortMonth})</span>
                    </div>
                  ))}
                </div>

                {/* 2층: 일(Day) 눈금 */}
                <div className="flex h-5 items-center relative">
                  {ganttScale.map((d, idx) => (
                    <div
                      key={d.dateStr}
                      style={{ width: `${100 / ganttScale.length}%` }}
                      className={`h-full flex items-center justify-center text-[9px] border-r border-zinc-100 ${
                        d.isToday
                          ? 'bg-rose-500 text-white font-black'
                          : d.isWeekend
                          ? 'bg-zinc-100/70 text-zinc-400'
                          : 'text-zinc-400'
                      }`}
                    >
                      {(scaleDays <= 30 || idx % 2 === 0 || d.isToday) ? d.dayNum : ''}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2) 단계별(Phase) 사역 & 하위 태스크 트리 행 */}
            <div className="divide-y divide-zinc-200 bg-white relative">
              {PHASES.map((phaseName) => {
                const phaseProjects = filteredProjects.filter(p => p.phase === phaseName);
                const isCollapsed = collapsedPhases[phaseName];
                const theme = PHASE_THEMES[phaseName] || PHASE_THEMES['기획 및 준비'];

                const startDates = phaseProjects.map(p => p.start_date).filter(Boolean);
                const endDates = phaseProjects.map(p => p.end_date).filter(Boolean);
                const minStart = startDates.length > 0 ? [...startDates].sort()[0] : '-';
                const maxEnd = endDates.length > 0 ? [...endDates].sort().reverse()[0] : '-';

                return (
                  <div key={phaseName} className="flex flex-col">
                    
                    {/* Phase 그룹 헤더 밴드 */}
                    <div className="px-3 sm:px-5 py-2 bg-zinc-50/90 border-b border-zinc-200/80 flex items-center justify-between sticky top-[45px] z-20 backdrop-blur-xs">
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => togglePhaseCollapse(phaseName)}>
                        <button type="button" className={`text-zinc-400 hover:text-zinc-700 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}>
                          <SvgChevronDown />
                        </button>
                        <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                        <span className="font-black text-[12px] sm:text-[12.5px] text-zinc-900 tracking-tight">
                          {phaseName}
                        </span>
                        <span className="hidden md:inline text-[10.5px] font-mono text-zinc-400 ml-1">
                          ({minStart} ~ {maxEnd})
                        </span>
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ml-1 ${theme.badge}`}>
                          {phaseProjects.length}
                        </span>
                      </div>

                      {/* 참여 사역자 아바타 스택 */}
                      <div className="flex items-center gap-1.5 text-zinc-500 font-bold text-[10.5px]">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {phaseProjects.slice(0, 4).map((p, pIdx) => (
                            <div key={p.id || pIdx} className={`w-5 h-5 rounded-full flex items-center justify-center text-[9.5px] font-black text-white border border-white shadow-2xs ${theme.dot}`}>
                              {p.manager ? p.manager.charAt(0) : '사'}
                            </div>
                          ))}
                        </div>
                        <span className="hidden sm:inline ml-1 font-mono text-[10px]">{phaseProjects.length} Projects</span>
                      </div>
                    </div>

                    {/* Phase 내부 프로젝트 및 서브태스크 행 */}
                    {!isCollapsed && (
                      <div className="divide-y divide-zinc-100">
                        {phaseProjects.length === 0 ? (
                          <div className="py-5 px-5 text-zinc-400 text-[11px] italic">
                            이 단계에 배정된 사역이 없습니다.
                          </div>
                        ) : (
                          phaseProjects.map((p) => {
                            const dday = calculateDDay(p.end_date, p.progress);
                            const barStyle = getGanttBarStyle(p.start_date, p.end_date);
                            const isDraggingThis = ganttDrag?.id === p.id;
                            const subtasks = p.subtasks || [];

                            return (
                              <React.Fragment key={p.id}>
                                {/* 메인 프로젝트 행 */}
                                <div className={`flex items-stretch transition-colors min-h-[44px] group ${isDraggingThis ? 'bg-indigo-50/40' : 'hover:bg-zinc-50/60'}`}>
                                  
                                  {/* 좌측 Sticky 사역명 컬럼 */}
                                  <div 
                                    className="w-[165px] sm:w-[330px] px-3 sm:px-5 py-2 border-r border-zinc-200 shrink-0 flex items-center justify-between gap-1.5 cursor-pointer bg-white group-hover:bg-zinc-50/90 sticky left-0 z-20"
                                    onClick={() => setSelectedProject(p)}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="hidden sm:inline-block font-mono text-[10px] font-black text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 shrink-0">
                                        {p.code}
                                      </span>
                                      {p.progress === 100 ? (
                                        <SvgCheckCircle />
                                      ) : (
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${theme.dot}`} />
                                      )}
                                      <span className="font-black text-[11.5px] sm:text-[12.5px] text-zinc-900 truncate tracking-tight group-hover:text-indigo-600 transition-colors">
                                        {p.project_name}
                                      </span>
                                    </div>

                                    <span className={`px-1.5 sm:px-2 py-0.5 rounded-md font-mono text-[9.5px] sm:text-[10px] border shrink-0 ${dday.badgeClass}`}>
                                      {dday.text}
                                    </span>
                                  </div>

                                  {/* 우측 타임라인 트랙 + TODAY 기준선 + 드래그 캡슐 바 */}
                                  <div className="flex-1 relative flex items-center">
                                    {/* 주말 배경 줄무늬 */}
                                    <div className="absolute inset-0 flex pointer-events-none">
                                      {ganttScale.map(d => (
                                        <div
                                          key={d.dateStr}
                                          style={{ width: `${100 / ganttScale.length}%` }}
                                          className={`h-full border-r border-zinc-100/60 ${d.isWeekend ? 'bg-zinc-50/70' : ''}`}
                                        />
                                      ))}
                                    </div>

                                    {/* 🔴 실시간 TODAY 수직 레이저 라인 */}
                                    {todayLineLeftPercent !== null && (
                                      <div
                                        style={{ left: `${todayLineLeftPercent}%` }}
                                        className="absolute top-0 bottom-0 w-[1.5px] bg-rose-500/80 z-10 pointer-events-none"
                                      />
                                    )}

                                    {/* 캡슐 바 */}
                                    <div
                                      className={`absolute h-[26px] rounded-full border shadow-2xs overflow-hidden flex items-center px-2.5 transition-shadow cursor-move ${theme.bar} ${isDraggingThis ? 'ring-2 ring-zinc-900 z-30 shadow-md' : 'z-10 hover:shadow-sm'}`}
                                      style={barStyle}
                                      onClick={() => setSelectedProject(p)}
                                      title={`${p.project_name} (${p.start_date} ~ ${p.end_date}) — 드래그하여 일정 조정`}
                                    >
                                      {/* 진척도 채움 레이어 */}
                                      <div
                                        className={`absolute bottom-0 left-0 top-0 opacity-20 ${theme.barFill}`}
                                        style={{ width: `${p.progress}%` }}
                                      />

                                      {/* 좌측 리사이즈 핸들 */}
                                      <div
                                        onMouseDown={(e) => { e.stopPropagation(); setGanttDrag({ id: p.id, mode: 'left', startX: e.clientX, origStart: p.start_date, origEnd: p.end_date }); }}
                                        className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-black/15 z-30"
                                      />

                                      {/* 중앙 이동 핸들 */}
                                      <div
                                        onMouseDown={(e) => { e.stopPropagation(); setGanttDrag({ id: p.id, mode: 'move', startX: e.clientX, origStart: p.start_date, origEnd: p.end_date }); }}
                                        className="absolute inset-x-2.5 top-0 bottom-0 cursor-move z-20"
                                      />

                                      <div className="relative z-10 flex items-center justify-between w-full pointer-events-none text-[10px] font-black gap-1">
                                        <span className="truncate">{p.manager || p.department} ({p.progress}%)</span>
                                        <span className="font-mono text-[9px] opacity-75 shrink-0 hidden sm:inline">
                                          {p.start_date.slice(5)}~{p.end_date.slice(5)}
                                        </span>
                                      </div>

                                      {/* 우측 리사이즈 핸들 */}
                                      <div
                                        onMouseDown={(e) => { e.stopPropagation(); setGanttDrag({ id: p.id, mode: 'right', startX: e.clientX, origStart: p.start_date, origEnd: p.end_date }); }}
                                        className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-black/15 z-30"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* 하위 WBS 서브태스크 트리 행 */}
                                {subtasks.map((st, stIdx) => {
                                  const subBarStyle = getGanttBarStyle(p.start_date, st.due_date || p.end_date);
                                  return (
                                    <div key={st.id || stIdx} className="flex items-stretch bg-zinc-50/40 hover:bg-zinc-50 transition-colors min-h-[32px]">
                                      <div
                                        className="w-[165px] sm:w-[330px] pl-5 sm:pl-9 pr-3 sm:pr-5 py-1 border-r border-zinc-200 shrink-0 flex items-center justify-between gap-1.5 cursor-pointer bg-zinc-50/90 sticky left-0 z-20"
                                        onClick={() => setSelectedProject(p)}
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <SvgBranch />
                                          <input
                                            type="checkbox"
                                            checked={st.completed}
                                            onChange={() => handleToggleSubtask(p.id, st.id)}
                                            onClick={e => e.stopPropagation()}
                                            className="w-3.5 h-3.5 rounded accent-zinc-900 cursor-pointer shrink-0"
                                          />
                                          <span className={`text-[11px] font-bold truncate ${st.completed ? 'line-through text-zinc-400' : 'text-zinc-700'}`}>
                                            {st.title}
                                          </span>
                                        </div>
                                        <span className="hidden sm:inline text-[9.5px] font-mono text-zinc-400 shrink-0">
                                          {st.assignee || '배정중'}
                                        </span>
                                      </div>

                                      <div className="flex-1 relative flex items-center">
                                        {todayLineLeftPercent !== null && (
                                          <div
                                            style={{ left: `${todayLineLeftPercent}%` }}
                                            className="absolute top-0 bottom-0 w-[1.5px] bg-rose-500/40 z-10 pointer-events-none"
                                          />
                                        )}
                                        <div
                                          className={`absolute h-[15px] rounded-full border border-dashed opacity-80 overflow-hidden flex items-center px-2 pointer-events-none ${theme.bar}`}
                                          style={subBarStyle}
                                        >
                                          <span className="text-[8.5px] font-bold truncate">{st.title}</span>
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
          4-B. [뷰 2] Rapport 4단계 칸반 보드 (모바일 가로 스냅 + 원터치 단계 이동 지원)
          ========================================================================= */}
      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-x-auto overflow-y-auto bg-zinc-100/60 p-3 sm:p-5 hide-scrollbar">
          <div className="flex sm:grid sm:grid-cols-4 gap-3.5 sm:gap-4 h-full snap-x snap-mandatory overflow-x-auto hide-scrollbar">
            {PHASES.map((phaseName, phIdx) => {
              const phaseProjects = filteredProjects.filter(p => p.phase === phaseName);
              const theme = PHASE_THEMES[phaseName];

              return (
                <div
                  key={phaseName}
                  onDragOver={e => onDragOverPhase(e, phaseName)}
                  onDragLeave={() => setDragOverColumn(null)}
                  onDrop={e => onDrop(e, phaseName)}
                  className={`w-[85vw] sm:w-auto shrink-0 snap-center bg-white border rounded-2xl flex flex-col h-full overflow-hidden transition-all shadow-2xs ${
                    dragOverColumn === phaseName ? 'border-zinc-800 ring-2 ring-zinc-200 bg-zinc-50/50' : 'border-zinc-200/90'
                  }`}
                >
                  <div className="px-4 py-3 bg-zinc-50/80 border-b border-zinc-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${theme.dot}`} />
                      <span className="font-black text-[13px] text-zinc-900 tracking-tight">{phaseName}</span>
                    </div>
                    <span className="text-[11px] font-mono bg-white border border-zinc-200 text-zinc-700 px-2 py-0.5 rounded-md font-black">
                      {phaseProjects.length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5 hide-scrollbar">
                    {phaseProjects.map((p) => {
                      const dday = calculateDDay(p.end_date, p.progress);
                      const isDragOverThis = dragOverItem === p.id;

                      return (
                        <React.Fragment key={p.id}>
                          {isDragOverThis && <div className="h-1 bg-zinc-900 rounded-full my-1 animate-pulse" />}
                          <div
                            draggable
                            onDragStart={e => onDragStart(e, p.id)}
                            onDragEnd={onDragEnd}
                            onDragOver={e => onDragOverItem(e, p.id)}
                            onClick={() => setSelectedProject(p)}
                            className={`bg-white border border-l-4 ${theme.accentBorder} rounded-xl p-3.5 space-y-2.5 transition-all cursor-grab active:cursor-grabbing shadow-2xs hover:border-zinc-400 group ${
                              activeDragItem === p.id ? 'opacity-40 scale-95 border-dashed border-zinc-400' : 'border-zinc-200'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <SvgGrip />
                                <span className="font-mono text-[10px] font-black text-zinc-400 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200 shrink-0">
                                  {p.code}
                                </span>
                                <span className="font-black text-[13px] text-zinc-900 leading-snug truncate">
                                  {p.project_name}
                                </span>
                              </div>
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${dday.badgeClass}`}>
                                {dday.text}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[10.5px] font-bold text-zinc-500">
                                <span>{p.department}</span>
                                <strong className="text-zinc-900 font-mono">{p.progress}%</strong>
                              </div>
                              <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-300 ${p.progress === 100 ? 'bg-emerald-500' : 'bg-zinc-900'}`} style={{ width: `${p.progress}%` }} />
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-zinc-100 text-[10.5px]">
                              <span className="text-zinc-600 font-bold bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200/80">
                                👤 {p.manager || '미지정'}
                              </span>

                              {/* 모바일 터치 사용자를 위한 원터치 단계 이동 버튼 */}
                              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                {phIdx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdatePhase(p.id, PHASES[phIdx - 1])}
                                    className="px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold text-[10px] cursor-pointer"
                                    title="이전 단계로 이동"
                                  >
                                    ◀
                                  </button>
                                )}
                                {phIdx < PHASES.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdatePhase(p.id, PHASES[phIdx + 1])}
                                    className="px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold text-[10px] cursor-pointer"
                                    title="다음 단계로 이동"
                                  >
                                    ▶
                                  </button>
                                )}
                              </div>
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
          4-C. [뷰 3] WBS 태스크 및 예산 상세 피드 (Table / Feed View)
          ========================================================================= */}
      {viewMode === 'feed' && (
        <div className="flex-1 overflow-y-auto bg-zinc-50 p-3.5 sm:p-5 space-y-3.5 hide-scrollbar">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-20 bg-white border border-zinc-200 rounded-2xl text-zinc-400 font-bold">
              조건에 해당하는 사역 일정이 없습니다.
            </div>
          ) : (
            filteredProjects.map((p) => {
              const dday = calculateDDay(p.end_date, p.progress);
              const subtasks = p.subtasks || [];
              const theme = PHASE_THEMES[p.phase] || PHASE_THEMES['기획 및 준비'];

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProject(p)}
                  className={`bg-white border border-zinc-200 border-l-4 ${theme.accentBorder} rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs hover:border-zinc-300 transition-colors cursor-pointer group`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[10.5px] font-black text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">{p.code}</span>
                        <span className="font-black text-sm sm:text-[15px] text-zinc-900 tracking-tight">{p.project_name}</span>
                        <span className="bg-zinc-100 border border-zinc-200 text-zinc-700 px-2 py-0.5 rounded-md text-[10.5px] font-bold">{p.department}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${theme.badge}`}>{p.phase}</span>
                      </div>
                      <div className="text-[11px] sm:text-[11.5px] text-zinc-500 font-mono font-medium flex flex-wrap gap-x-3 gap-y-1">
                        <span>📅 {p.start_date} ~ {p.end_date}</span>
                        <span>👤 책임: {p.manager || '미지정'}</span>
                        <span>💰 예산: ₩{Number(p.allocated_budget || 0).toLocaleString()} (집행: ₩{Number(p.actual_spent || 0).toLocaleString()})</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] shrink-0 border shadow-2xs ${dday.badgeClass}`}>
                      {dday.text}
                    </span>
                  </div>

                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between text-[11px] font-black text-zinc-500 uppercase tracking-wider mb-2">
                      <span>WBS 실행 체크리스트 ({subtasks.filter(s => s.completed).length}/{subtasks.length})</span>
                      <span className="font-mono text-zinc-900">{p.progress}% 완료</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {subtasks.map(s => (
                        <div
                          key={s.id}
                          onClick={() => handleToggleSubtask(p.id, s.id)}
                          className={`flex items-center gap-2.5 p-2 rounded-lg border text-[12px] cursor-pointer transition-colors ${
                            s.completed ? 'bg-zinc-100/60 border-transparent' : 'bg-white border-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          <input type="checkbox" checked={s.completed} readOnly className="w-4 h-4 accent-zinc-900 cursor-pointer shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className={`font-bold truncate ${s.completed ? 'line-through text-zinc-400' : 'text-zinc-800'}`}>{s.title}</span>
                            <span className="text-[9.5px] font-bold text-zinc-500 flex items-center gap-1.5 mt-0.5">
                              {s.assignee && <span className="bg-zinc-200/70 px-1.5 rounded">{s.assignee}</span>}
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
          4-D. [뷰 4] D-Day 리스크 관제 뷰 (마감 임박 순 자동 정렬)
          ========================================================================= */}
      {viewMode === 'dday' && (
        <div className="flex-1 overflow-y-auto bg-zinc-50 p-3.5 sm:p-5 space-y-3 hide-scrollbar">
          <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-black text-zinc-900 text-sm sm:text-[14.5px]">🚨 D-Day 일정 리스크 집중 관제</h4>
              <p className="text-[11.5px] font-medium text-zinc-500">기한이 초과되었거나 마감일이 임박한 순서대로 정렬하여 리스크를 사전 차단합니다.</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-mono font-black text-xs">
                지연 {metrics.overdueCount}건
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-mono font-black text-xs">
                임박 {metrics.urgentCount}건
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {[...filteredProjects]
              .sort((a, b) => calculateDDay(a.end_date, a.progress).days - calculateDDay(b.end_date, b.progress).days)
              .map((p) => {
                const dday = calculateDDay(p.end_date, p.progress);
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    className="bg-white border border-zinc-200 p-3.5 sm:p-4 rounded-xl flex justify-between items-center gap-3 shadow-2xs hover:border-zinc-400 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="font-mono text-[10px] font-black text-zinc-500 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200">{p.code}</span>
                        <span className="font-black text-xs sm:text-[14px] text-zinc-900 tracking-tight truncate">{p.project_name}</span>
                        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">{p.department}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono font-medium">
                        목표일: {p.end_date} | 공정률: {p.progress}% | 책임: {p.manager || '미지정'}
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg font-mono font-black text-[11.5px] border shadow-2xs shrink-0 ${dday.badgeClass}`}>
                      {dday.text}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* =========================================================================
          5. 신규 사역 프로젝트 수립 모달 (배정 예산 입력 필드 추가 완료)
          ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[400] bg-zinc-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in select-none">
          <div className="w-full max-w-xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl font-sans flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-200 bg-zinc-50 shrink-0">
              <h3 className="text-[15px] font-black text-zinc-900 tracking-tight">➕ 신규 사역 프로젝트 수립</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-900 font-bold p-1 rounded-md hover:bg-zinc-200 cursor-pointer"><SvgClose /></button>
            </div>

            <form onSubmit={handleAddProject} className="flex-1 overflow-y-auto hide-scrollbar p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500 mb-1 pl-1">사역 프로젝트명 <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={form.project_name}
                  onChange={e => setForm({ ...form, project_name: e.target.value })}
                  placeholder="예: 2026 전교인 수련회 및 부흥성회"
                  className="w-full border border-zinc-200 bg-zinc-50 focus:bg-white p-3 rounded-xl font-bold text-[13px] text-zinc-900 outline-none focus:border-zinc-900 select-text"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500 mb-1 pl-1">주관 사역 부서 <span className="text-rose-500">*</span></label>
                  <input
                    list="new-dept-options"
                    value={form.department}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                    placeholder="부서 선택 또는 직접 입력..."
                    className="w-full border border-zinc-200 bg-zinc-50 focus:bg-white p-3 rounded-xl font-bold text-[12.5px] outline-none focus:border-zinc-900 select-text"
                    required
                  />
                  <datalist id="new-dept-options">
                    {dynamicDepartments.map(d => <option key={d} value={d} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500 mb-1 pl-1">사역 공정 단계</label>
                  <select
                    value={form.phase}
                    onChange={e => setForm({ ...form, phase: e.target.value })}
                    className="w-full border border-zinc-200 bg-zinc-50 focus:bg-white p-3 rounded-xl font-bold text-zinc-800 outline-none cursor-pointer"
                  >
                    {PHASES.map(ph => <option key={ph} value={ph}>{ph}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500 mb-1 pl-1">시작일 <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={e => setForm({ ...form, start_date: e.target.value })}
                    className="w-full border border-zinc-200 bg-zinc-50 focus:bg-white p-3 rounded-xl font-mono text-[12.5px] font-bold outline-none cursor-pointer"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500 mb-1 pl-1">종료일 (D-Day) <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={e => setForm({ ...form, end_date: e.target.value })}
                    className="w-full border border-zinc-200 bg-zinc-50 focus:bg-white p-3 rounded-xl font-mono text-[12.5px] font-bold outline-none cursor-pointer"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500 mb-1 pl-1">총괄 책임자</label>
                  <input
                    type="text"
                    value={form.manager}
                    onChange={e => setForm({ ...form, manager: e.target.value })}
                    placeholder="예: 김목회 목사"
                    className="w-full border border-zinc-200 bg-zinc-50 focus:bg-white p-3 rounded-xl font-bold text-[12.5px] outline-none select-text"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500 mb-1 pl-1">배정 예산 (원)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={form.allocated_budget}
                    onChange={e => setForm({ ...form, allocated_budget: e.target.value })}
                    placeholder="예: 3000000"
                    className="w-full border border-zinc-200 bg-zinc-50 focus:bg-white p-3 rounded-xl font-mono font-bold text-[12.5px] outline-none select-text"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500 mb-1 pl-1">우선순위</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="w-full border border-zinc-200 bg-zinc-50 focus:bg-white p-3 rounded-xl font-bold text-rose-700 outline-none cursor-pointer"
                  >
                    <option value="보통">보통 (Normal)</option>
                    <option value="높음">높음 (High)</option>
                    <option value="긴급">긴급 (Critical)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 shrink-0">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 rounded-xl font-bold text-[12.5px] text-zinc-700 cursor-pointer">취소</button>
                <button type="submit" className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-xl text-[12.5px] cursor-pointer shadow-sm active:scale-95 transition-all">프로젝트 수립</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. 상세 프로젝트 WBS & 예산·일정·감사로그 통합 인스펙터 모달
          ========================================================================= */}
      {selectedProject && (
        <div className="fixed inset-0 z-[400] bg-zinc-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in select-none">
          <div className="w-full max-w-3xl bg-white border border-zinc-300 rounded-t-3xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl font-sans flex flex-col max-h-[92vh] overflow-hidden">
            
            <div className="flex justify-between items-start border-b border-zinc-200 pb-3.5 mb-4 shrink-0 gap-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="font-mono text-[10.5px] font-black bg-zinc-900 text-white px-2 py-0.5 rounded">{selectedProject.code}</span>
                <span className="bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold text-[10.5px] px-2 py-0.5 rounded">{selectedProject.department}</span>
                <h3 className="text-base sm:text-[17px] font-black text-zinc-900 tracking-tight truncate">{selectedProject.project_name}</h3>
              </div>
              <button onClick={() => setSelectedProject(null)} className="text-zinc-400 hover:text-zinc-900 font-bold p-1 rounded-md hover:bg-zinc-100 cursor-pointer shrink-0"><SvgClose /></button>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-5 px-0.5 pb-4">
              
              {/* 1) 공정 단계 · 일정 · 예산 · 실집행액 실시간 수정 그리드 */}
              <div className="bg-zinc-50 border border-zinc-200 p-3.5 sm:p-4 rounded-xl space-y-3 text-[12px]">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">진행 공정 단계</label>
                    <select
                      value={selectedProject.phase}
                      onChange={e => handleUpdatePhase(selectedProject.id, e.target.value)}
                      className="w-full border border-zinc-300 bg-white px-2.5 py-1.5 rounded-lg font-bold outline-none cursor-pointer"
                    >
                      {PHASES.map(ph => <option key={ph} value={ph}>{ph}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">시작일</label>
                    <input
                      type="date"
                      value={selectedProject.start_date}
                      onChange={e => handleUpdateProjectFields(selectedProject.id, { start_date: e.target.value })}
                      className="w-full border border-zinc-300 bg-white px-2.5 py-1.5 rounded-lg font-mono font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">종료일 ({calculateDDay(selectedProject.end_date, selectedProject.progress).text})</label>
                    <input
                      type="date"
                      value={selectedProject.end_date}
                      onChange={e => handleUpdateProjectFields(selectedProject.id, { end_date: e.target.value })}
                      className="w-full border border-zinc-300 bg-white px-2.5 py-1.5 rounded-lg font-mono font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-zinc-200/70">
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">총괄 책임자</label>
                    <input
                      type="text"
                      value={selectedProject.manager || ''}
                      onChange={e => handleUpdateProjectFields(selectedProject.id, { manager: e.target.value })}
                      placeholder="담당자 이름"
                      className="w-full border border-zinc-300 bg-white px-2.5 py-1.5 rounded-lg font-bold outline-none select-text"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase block mb-1">배정 예산 (₩)</label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={selectedProject.allocated_budget || 0}
                      onChange={e => handleUpdateProjectFields(selectedProject.id, { allocated_budget: Number(e.target.value) || 0 })}
                      className="w-full border border-zinc-300 bg-white px-2.5 py-1.5 rounded-lg font-mono font-bold outline-none select-text"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-indigo-600 uppercase block mb-1">실집행 결산액 (₩)</label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={selectedProject.actual_spent || 0}
                      onChange={e => handleUpdateProjectFields(selectedProject.id, { actual_spent: Number(e.target.value) || 0 })}
                      className="w-full border border-indigo-300 bg-white px-2.5 py-1.5 rounded-lg font-mono font-bold text-indigo-700 outline-none select-text"
                    />
                  </div>
                </div>
              </div>

              {/* 2) WBS 세부 실행 체크리스트 */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-end border-b border-zinc-100 pb-2">
                  <div>
                    <span className="font-black text-zinc-900 text-sm block">✅ WBS 하위 실행 태스크</span>
                    <span className="text-[10.5px] font-bold text-zinc-400">체크 시 전체 공정률이 자동 계산됩니다</span>
                  </div>
                  <span className="font-mono font-black text-indigo-600 text-sm bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">
                    {selectedProject.progress}% 완료
                  </span>
                </div>

                <form onSubmit={handleAddSubtask} className="flex flex-wrap sm:flex-nowrap gap-2 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                  <input
                    type="text"
                    value={newSubtask.title}
                    onChange={e => setNewSubtask({ ...newSubtask, title: e.target.value })}
                    placeholder="새로운 세부 실행 과업 입력..."
                    className="flex-1 min-w-[160px] border border-zinc-200 bg-white px-3 py-2 rounded-lg text-[12px] font-bold outline-none focus:border-zinc-800 select-text"
                    required
                  />
                  <input
                    type="text"
                    value={newSubtask.assignee}
                    onChange={e => setNewSubtask({ ...newSubtask, assignee: e.target.value })}
                    placeholder="담당자"
                    className="w-24 border border-zinc-200 bg-white px-2 py-2 rounded-lg text-[12px] font-bold outline-none text-center select-text"
                  />
                  <input
                    type="date"
                    value={newSubtask.due_date}
                    onChange={e => setNewSubtask({ ...newSubtask, due_date: e.target.value })}
                    className="w-32 border border-zinc-200 bg-white px-2 py-2 rounded-lg text-[11.5px] font-mono font-bold outline-none cursor-pointer text-zinc-600"
                  />
                  <button type="submit" className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-lg text-[12px] cursor-pointer shrink-0">
                    추가
                  </button>
                </form>

                <div className="space-y-1.5 max-h-48 overflow-y-auto hide-scrollbar border border-zinc-200 rounded-xl p-1.5 bg-white">
                  {(selectedProject.subtasks || []).map(s => (
                    <div key={s.id} className={`flex items-center justify-between p-2.5 rounded-lg border text-[12px] transition-colors ${s.completed ? 'bg-zinc-50 border-transparent' : 'bg-white border-zinc-200 hover:border-zinc-300'}`}>
                      <div className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1" onClick={() => handleToggleSubtask(selectedProject.id, s.id)}>
                        <input type="checkbox" checked={s.completed} readOnly className="w-4 h-4 accent-zinc-900 cursor-pointer shrink-0" />
                        <span className={`font-bold truncate ${s.completed ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>{s.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {s.assignee && <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded text-[10px] font-bold border border-zinc-200">{s.assignee}</span>}
                        {s.due_date && <span className="font-mono text-zinc-400 text-[10px] font-bold">{s.due_date.slice(5)}</span>}
                        <button
                          type="button"
                          onClick={() => handleDeleteSubtask(s.id)}
                          className="text-zinc-300 hover:text-rose-500 px-1 font-bold cursor-pointer"
                          title="태스크 삭제"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3) 감사 로그 (Audit Trail) */}
              <div className="space-y-2.5 pt-3 border-t border-zinc-200">
                <div className="flex justify-between items-end">
                  <span className="font-black text-zinc-900 text-sm">📝 사역 히스토리 & 의사결정 로그</span>
                  <span className="text-[10.5px] font-mono text-zinc-400">총 {selectedProject.logs?.length || 0}건</span>
                </div>

                <form onSubmit={handleAddLog} className="flex flex-wrap sm:flex-nowrap gap-2">
                  <input
                    type="date"
                    value={newLogDate}
                    onChange={e => setNewLogDate(e.target.value)}
                    className="w-32 border border-zinc-200 bg-zinc-50 px-2.5 py-2 rounded-lg font-mono font-bold text-[11.5px] outline-none cursor-pointer shrink-0 text-zinc-700"
                    required
                  />
                  <input
                    type="text"
                    value={newLogMemo}
                    onChange={e => setNewLogMemo(e.target.value)}
                    placeholder="당회 승인, 예산 변경, 특이사항 기록..."
                    className="flex-1 min-w-[160px] border border-zinc-200 bg-zinc-50 focus:bg-white px-3 py-2 rounded-lg text-[12.5px] font-bold outline-none focus:border-zinc-800 select-text"
                    required
                  />
                  <button type="submit" className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-lg text-[12px] cursor-pointer shrink-0">
                    기록
                  </button>
                </form>

                <div className="space-y-1.5 max-h-36 overflow-y-auto hide-scrollbar bg-zinc-50/60 p-2 rounded-xl border border-zinc-200">
                  {(selectedProject.logs || []).map(l => (
                    <div key={l.id} className="p-2 bg-white border border-zinc-200/80 rounded-lg text-[12px] flex items-center gap-2.5">
                      <span className="font-mono text-zinc-400 font-bold text-[10.5px] shrink-0">[{l.date}]</span>
                      <span className="text-zinc-800 font-bold break-keep">{l.memo}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="flex justify-between items-center pt-3.5 border-t border-zinc-200 shrink-0 mt-2">
              <button
                onClick={() => handleDeleteProject(selectedProject.id)}
                className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-zinc-200 hover:border-rose-200 rounded-xl font-bold text-[11.5px] cursor-pointer transition-colors"
              >
                프로젝트 삭제
              </button>
              <button
                onClick={() => setSelectedProject(null)}
                className="px-7 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-xl text-[12px] cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                저장 완료 및 닫기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
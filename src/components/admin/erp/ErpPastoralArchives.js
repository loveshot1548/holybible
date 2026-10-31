// src/components/admin/erp/ErpPastoralArchives.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';

const CARE_STATUSES = ['접수대기', '중보기도중', '심방필요', '응답완료', '케어종결'];
const CATEGORIES = ['기도', '감사', '심방상담', '환우케어', '가정회복'];

// 원클릭 목회 아카이브 템플릿 프리셋
const PASTORAL_TEMPLATES = [
  {
    label: '새가족 심방',
    category: '심방상담',
    urgency: '일반',
    care_status: '심방필요',
    keyword: '새가족정착',
    content: '교회 등록 후 첫 주일 예배 드림. 목장 정착 및 양육 과정 안내와 함께 가정을 위한 축복기도를 드림.'
  },
  {
    label: '환우 위로 방문',
    category: '환우케어',
    urgency: '긴급',
    care_status: '중보기도중',
    keyword: '건강회복',
    content: '수술 후 입원 중인 환우 병문안 및 안수기도. 주의 치유의 손길과 평강이 임하도록 집중 중보 진행.'
  },
  {
    label: '가정 회복 중보',
    category: '가정회복',
    urgency: '긴급',
    care_status: '중보기도중',
    keyword: '가정평화',
    content: '부부 갈등 및 자녀 진로 문제로 인한 낙심. 말씀으로 권면하고 가정의 영적 회복을 위해 교역자 중보 상정.'
  },
  {
    label: '사업장 축복기도',
    category: '기도',
    urgency: '일반',
    care_status: '응답완료',
    keyword: '사업장형통',
    content: '신규 사업장 오픈 감사예배 드림. 정직과 성실로 세상을 빛내는 일터가 되기를 간구함.'
  }
];

// =========================================================================
// ✒️ 엔터프라이즈 모노크롬 SVG 아이콘 세트 (Linear / Attio CRM 규격)
// =========================================================================
const SvgSearch = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);
const SvgPlus = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);
const SvgClose = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const SvgPrint = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.728 6.75H17.27m-10.542 0A2.25 2.25 0 004.5 9v6a2.25 2.25 0 002.25 2.25h10.5A2.25 2.25 0 0019.5 15V9a2.25 2.25 0 00-2.25-2.25m-10.542 0V4.5a2.25 2.25 0 012.25-2.25h6a2.25 2.25 0 012.25 2.25v2.25m-10.542 0h10.542" />
  </svg>
);
const SvgCopy = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
  </svg>
);
const SvgDownload = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);
const SvgShieldCheck = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-600 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043A3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296A3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043A3.746 3.746 0 0121 12z" />
  </svg>
);
const SvgCheck = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

// 심방 예정일 D-Day 계산 엔진
const calculateDDay = (targetDateStr) => {
  if (!targetDateStr) return { text: '', isOverdue: false, isUrgent: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  const diffTime = target - today;
  const dDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (dDays === 0) return { text: 'D-Day 오늘 심방!', isOverdue: false, isUrgent: true };
  if (dDays > 0) return { text: `D-${dDays}`, isOverdue: false, isUrgent: dDays <= 3 };
  return { text: `지연됨 (+${Math.abs(dDays)}일)`, isOverdue: true, isUrgent: false };
};

export default function ErpPastoralArchives() {
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'dossier' | 'urgent' | 'batch' | 'report'
  const [archives, setArchives] = useState([]);
  
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterUrgency, setFilterUrgency] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [testimonyInput, setTestimonyInput] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  const triggerToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }, []);

  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const initialFormState = {
    user_name: '',
    phone: '',
    category: '기도',
    urgency: '일반',
    care_status: '중보기도중',
    pastor_name: '담당교역자',
    followup_date: '',
    keyword: '',
    is_confidential: false,
    content: '',
    submitted_date: new Date().toISOString().split('T')[0]
  };
  const [form, setForm] = useState(initialFormState);

  const [batchRows, setBatchRows] = useState([
    { id: 1, user_name: '', phone: '', category: '기도', urgency: '일반', care_status: '중보기도중', pastor_name: '담당교역자', keyword: '', content: '', submitted_date: new Date().toISOString().split('T')[0] },
    { id: 2, user_name: '', phone: '', category: '감사', urgency: '일반', care_status: '응답완료', pastor_name: '담당교역자', keyword: '', content: '', submitted_date: new Date().toISOString().split('T')[0] }
  ]);

  const fetchArchives = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('erp_pastoral_archives')
        .select('*')
        .order('submitted_date', { ascending: false });
      if (!error && data) {
        setArchives(data);
        if (data.length > 0 && !selectedUserName) setSelectedUserName(data[0].user_name);
      }
    } catch (e) {}
  }, [selectedUserName]);

  useEffect(() => {
    fetchArchives();
  }, [fetchArchives]);

  // 목양 템플릿 원클릭 적용
  const handleApplyTemplate = (tpl) => {
    setForm(prev => ({
      ...prev,
      category: tpl.category,
      urgency: tpl.urgency,
      care_status: tpl.care_status,
      keyword: tpl.keyword,
      content: tpl.content
    }));
    triggerToast(`[${tpl.label}] 목양 서식이 자동 입력되었습니다.`);
  };

  // 단일 목회 기록 저장 (Null-Safety)
  const handleSaveSingle = async (e) => {
    e.preventDefault();
    if (!form.user_name.trim() || !form.content.trim()) return alert('성도명과 내용은 필수입니다.');

    const payload = {
      id: `arch_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      user_name: form.user_name.trim(), 
      phone: form.phone.trim(),
      category: form.category,
      urgency: form.urgency,
      care_status: form.care_status,
      pastor_name: form.pastor_name.trim(),
      keyword: form.keyword.trim(),
      content: form.content.trim(),
      is_confidential: form.is_confidential,
      submitted_date: form.submitted_date || new Date().toISOString().split('T')[0],
      followup_date: form.followup_date || null,
      is_answered: form.care_status === '응답완료',
      answered_date: form.care_status === '응답완료' ? (form.submitted_date || new Date().toISOString().split('T')[0]) : null,
      review_status: '접수완료'
    };

    if (supabase) {
      const { error } = await supabase.from('erp_pastoral_archives').insert([payload]);
      if (error) return alert(`저장 실패 (코드: ${error.code}): ${error.message}`);
    }

    setArchives(prev => [payload, ...prev]);
    setShowCreateModal(false);
    setSelectedUserName(payload.user_name);
    setForm(initialFormState);
    triggerToast('목양 아카이브에 영구 적재되었습니다.');
  };

  const handleAddBatchRow = () => setBatchRows(prev => [...prev, { id: Date.now(), user_name: '', phone: '', category: '기도', urgency: '일반', care_status: '중보기도중', pastor_name: '담당교역자', keyword: '', content: '', submitted_date: new Date().toISOString().split('T')[0] }]);
  const handleBatchRowChange = (id, field, value) => setBatchRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  const handleRemoveBatchRow = (id) => { if (batchRows.length <= 1) return alert('최소 1개 행이 유지되어야 합니다.'); setBatchRows(prev => prev.filter(r => r.id !== id)); };

  // 일괄 기장 처리
  const handleSaveBatch = async () => {
    const validRows = batchRows.filter(r => r.user_name.trim() && r.content.trim());
    if (validRows.length === 0) return alert('입력된 유효한 데이터가 없습니다.');

    const payloads = validRows.map((r, idx) => ({
      id: `arch_${Date.now()}_${idx}`, 
      user_name: r.user_name.trim(), 
      phone: r.phone.trim(), 
      category: r.category, 
      urgency: r.urgency, 
      care_status: r.care_status,
      pastor_name: r.pastor_name || '담당교역자', 
      keyword: r.keyword.trim(), 
      content: r.content.trim(), 
      submitted_date: r.submitted_date || new Date().toISOString().split('T')[0],
      followup_date: null,
      is_answered: r.care_status === '응답완료', 
      answered_date: r.care_status === '응답완료' ? (r.submitted_date || new Date().toISOString().split('T')[0]) : null, 
      is_confidential: false, 
      review_status: '접수완료'
    }));

    if (supabase) {
      const { error } = await supabase.from('erp_pastoral_archives').insert(payloads);
      if (error) return alert(`일괄 저장 실패: ${error.message}`);
    }

    setArchives(prev => [...payloads, ...prev]);
    triggerToast(`${payloads.length}건의 목회 기록이 일괄 등록되었습니다.`);
    setActiveTab('ledger');
  };

  const handleUpdateCareStatus = async (id, nextStatus) => {
    const isAnswered = nextStatus === '응답완료' || nextStatus === '케어종결';
    const answeredDate = isAnswered ? new Date().toISOString().split('T')[0] : null;

    setArchives(prev => prev.map(item => item.id === id ? { ...item, care_status: nextStatus, is_answered: isAnswered, answered_date: answeredDate } : item));
    if (selectedRecord?.id === id) setSelectedRecord(prev => ({ ...prev, care_status: nextStatus, is_answered: isAnswered, answered_date: answeredDate }));
    if (supabase) await supabase.from('erp_pastoral_archives').update({ care_status: nextStatus, is_answered: isAnswered, answered_date: answeredDate }).eq('id', id);
    triggerToast(`진행 상태가 [${nextStatus}] (으)로 변경되었습니다.`);
  };

  const handleSaveTestimony = async (id) => {
    if (!testimonyInput.trim()) return alert('간증 및 응답 내용을 입력해주세요.');
    setArchives(prev => prev.map(item => item.id === id ? { ...item, testimony_note: testimonyInput.trim(), is_answered: true, answered_date: new Date().toISOString().split('T')[0], care_status: '응답완료' } : item));
    if (selectedRecord?.id === id) {
      setSelectedRecord(prev => ({ ...prev, testimony_note: testimonyInput.trim(), is_answered: true, answered_date: new Date().toISOString().split('T')[0], care_status: '응답완료' }));
    }
    if (supabase) {
      await supabase.from('erp_pastoral_archives').update({
        testimony_note: testimonyInput.trim(),
        is_answered: true,
        answered_date: new Date().toISOString().split('T')[0],
        care_status: '응답완료'
      }).eq('id', id);
    }
    setTestimonyInput('');
    triggerToast('기도 응답 간증이 목양 일지에 기록되고 상태가 응답완료되었습니다.');
  };

  const handleToggleConfidential = async (id, currentStatus) => {
    const nextStatus = !currentStatus;
    setArchives(prev => prev.map(item => item.id === id ? { ...item, is_confidential: nextStatus } : item));
    if (selectedRecord?.id === id) setSelectedRecord(prev => ({ ...prev, is_confidential: nextStatus }));
    if (supabase) await supabase.from('erp_pastoral_archives').update({ is_confidential: nextStatus }).eq('id', id);
    triggerToast(nextStatus ? '대외비 보안 설정이 켜졌습니다.' : '대외비 보안이 해제되었습니다.');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('해당 목회 기록을 영구 삭제하시겠습니까? (성도 케어 이력 보존 주의)')) return;
    if (supabase) await supabase.from('erp_pastoral_archives').delete().eq('id', id);
    setArchives(prev => prev.filter(item => item.id !== id));
    if (selectedRecord?.id === id) setSelectedRecord(null);
    triggerToast('목회 기록이 삭제되었습니다.');
  };

  // 목회 브리핑 클립보드 복사
  const handleCopyPastoralBriefing = () => {
    if (filteredList.length === 0) return alert('복사할 목회 데이터가 없습니다.');
    let text = `[교회 목양 케어 및 중보기도 총괄 브리핑]\n보고일자: ${new Date().toLocaleDateString()}\n총 건수: ${filteredList.length}건\n--------------------------\n`;
    filteredList.forEach((item, idx) => {
      text += `${idx + 1}. [${item.category}] ${item.user_name} (${item.care_status || '중보기도중'}${item.urgency === '긴급' ? ' / 긴급' : ''})\n`;
      text += `내용: ${item.content}\n`;
      if (item.testimony_note) text += `응답간증: ${item.testimony_note}\n`;
      if (item.followup_date) text += `심방예정: ${item.followup_date}\n`;
      text += `\n`;
    });
    navigator.clipboard.writeText(text).then(() => triggerToast('목회 브리핑이 클립보드에 복사되었습니다.'));
  };

  // 목회 아카이브 CSV 다운로드
  const exportArchivesCSV = () => {
    if (filteredList.length === 0) return alert('내보낼 목회 기록이 없습니다.');
    let csvContent = '\uFEFF';
    csvContent += '번호,성도명,연락처,구분,목양상태,긴급도,키워드,기도및심방내용,응답간증,심방예정일,접수일자,담당교역자,대외비\n';

    filteredList.forEach((item, idx) => {
      csvContent += `"${idx + 1}","${item.user_name}","${item.phone || '-'}","${item.category}","${item.care_status || '중보기도중'}","${item.urgency}","${item.keyword || '-'}","${(item.content || '').replace(/"/g, '""')}","${(item.testimony_note || '').replace(/"/g, '""')}","${item.followup_date || '-'}","${item.submitted_date}","${item.pastor_name || '-'}","${item.is_confidential ? '대외비' : '일반'}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `목회_심방_아카이브_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const metrics = useMemo(() => {
    const total = archives.length;
    const urgentCount = archives.filter(a => a.urgency === '긴급').length;
    const visitNeedCount = archives.filter(a => a.care_status === '심방필요').length;
    const answeredCount = archives.filter(a => a.is_answered || a.care_status === '응답완료').length;
    return {
      total,
      urgentCount,
      visitNeedCount,
      answeredCount,
      answerRate: total > 0 ? Math.round((answeredCount / total) * 100) : 0
    };
  }, [archives]);

  const filteredList = useMemo(() => {
    return archives.filter(item => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        item.user_name?.toLowerCase().includes(q) ||
        item.content?.toLowerCase().includes(q) ||
        item.keyword?.toLowerCase().includes(q) ||
        item.pastor_name?.toLowerCase().includes(q);
      return (
        (filterType === 'ALL' || item.category === filterType) &&
        (filterStatus === 'ALL' || item.care_status === filterStatus) &&
        (filterUrgency === 'ALL' || item.urgency === filterUrgency) &&
        matchesSearch
      );
    });
  }, [archives, filterType, filterStatus, filterUrgency, searchTerm]);

  const uniqueMembers = useMemo(() => {
    const map = new Map();
    archives.forEach(a => {
      if (!map.has(a.user_name)) map.set(a.user_name, { name: a.user_name, count: 0, phone: a.phone || '' });
      map.get(a.user_name).count += 1;
    });
    return Array.from(map.values());
  }, [archives]);

  const selectedMemberHistory = useMemo(
    () => archives.filter(a => a.user_name === selectedUserName),
    [archives, selectedUserName]
  );

  return (
    <div className="flex flex-col h-full w-full bg-white font-sans text-zinc-900 text-[12px] select-none relative overflow-hidden rounded-2xl border border-zinc-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      
      {/* 실시간 피드백 토스트 */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[600] px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold shadow-2xl border border-white/15 flex items-center gap-2 animate-fade-in whitespace-nowrap">
          <SvgCheck />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* =========================================================================
          [1] 상단 글로벌 목양 KPI 바 (100% 풀 와이드 & 줄바꿈 방지)
         ========================================================================= */}
      <div className="w-full bg-zinc-950 text-zinc-100 px-4 sm:px-6 py-3.5 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3.5 shrink-0 border-b border-zinc-800">
        
        <div className="flex flex-wrap items-center gap-4 sm:gap-5 w-full xl:w-auto">
          <div className="flex items-center gap-2.5 pr-4 border-r border-zinc-800 shrink-0 whitespace-nowrap">
            <span className="font-mono text-[10px] font-black tracking-widest text-emerald-400 uppercase bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
              PASTORAL CARE
            </span>
            <span className="font-black text-[15px] text-white tracking-tight">
              목회·심방·중보 통합 아카이브
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-5 font-mono text-[11.5px] font-bold whitespace-nowrap tabular-nums">
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[9.5px] uppercase tracking-wider">누적 기록 총수</span>
              <span className="text-white text-[14.5px] sm:text-[15px] leading-tight">{metrics.total}건</span>
            </div>
            <span className="w-px h-6 bg-zinc-800 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[9.5px] uppercase tracking-wider">긴급 중보</span>
              <span className="text-rose-400 text-[14.5px] sm:text-[15px] leading-tight">{metrics.urgentCount}건</span>
            </div>
            <span className="w-px h-6 bg-zinc-800 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[9.5px] uppercase tracking-wider">심방 요망</span>
              <span className="text-amber-400 text-[14.5px] sm:text-[15px] leading-tight">{metrics.visitNeedCount}건</span>
            </div>
            <span className="w-px h-6 bg-zinc-800 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[9.5px] uppercase tracking-wider">기도 응답률</span>
              <span className="text-emerald-400 text-[14.5px] sm:text-[15px] leading-tight">{metrics.answerRate}%</span>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 & 글로벌 버튼 */}
        <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto hide-scrollbar shrink-0">
          <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[11px] font-bold shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'ledger' ? 'bg-zinc-800 text-white font-black shadow-2xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              목양 원장 ({archives.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dossier')}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'dossier' ? 'bg-zinc-800 text-white font-black shadow-2xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              성도별 히스토리
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('urgent')}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'urgent' ? 'bg-zinc-800 text-white font-black shadow-2xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              긴급·심방 관제 ({metrics.urgentCount + metrics.visitNeedCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('batch')}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'batch' ? 'bg-zinc-800 text-white font-black shadow-2xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              일괄 기장 시트
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'report' ? 'bg-zinc-800 text-white font-black shadow-2xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              심방 총괄 편철
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto xl:ml-0">
            <button
              type="button"
              onClick={exportArchivesCSV}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
              title="목회 기록 CSV 다운로드"
            >
              <SvgDownload /> CSV
            </button>
            <button
              type="button"
              onClick={handleCopyPastoralBriefing}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
            >
              <SvgCopy /> 브리핑 복사
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(createDefaultForm('당회'));
                setShowCreateModal(true);
              }}
              className="px-3.5 py-1.5 bg-white text-zinc-950 font-black rounded-lg text-[11px] hover:bg-zinc-100 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
            >
              <SvgPlus /> 신규 목양 등록
            </button>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 바 */}
      <div className="w-full px-4 sm:px-6 py-2.5 border-b border-zinc-200/90 flex flex-wrap justify-between items-center gap-2.5 bg-zinc-50 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="border border-zinc-300 bg-white px-2.5 py-1 rounded-lg text-[11px] font-bold outline-none cursor-pointer text-zinc-800 whitespace-nowrap shadow-2xs"
          >
            <option value="ALL">전체 구분</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-zinc-300 bg-white px-2.5 py-1 rounded-lg text-[11px] font-bold outline-none cursor-pointer text-zinc-800 whitespace-nowrap shadow-2xs"
          >
            <option value="ALL">전체 진행 상태</option>
            {CARE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={filterUrgency}
            onChange={e => setFilterUrgency(e.target.value)}
            className="border border-zinc-300 bg-white px-2.5 py-1 rounded-lg text-[11px] font-bold outline-none cursor-pointer text-zinc-800 whitespace-nowrap shadow-2xs"
          >
            <option value="ALL">긴급도 전체</option>
            <option value="긴급">🚨 긴급 중보</option>
            <option value="일반">일반 목양</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <span className="absolute left-2.5 top-2 text-zinc-400 pointer-events-none"><SvgSearch /></span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="성도명, 기도제목, 키워드 검색..."
            className="w-full pl-8 pr-6 py-1.5 border border-zinc-300 bg-white rounded-lg text-[11.5px] outline-none focus:border-zinc-900 font-bold placeholder:text-zinc-400 shadow-2xs transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1.5 text-[10px] text-zinc-400 hover:text-zinc-800 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          [탭 1] 풀 와이드 목양 원장 뷰 (Full-Width Ledger)
         ========================================================================= */}
      {activeTab === 'ledger' && (
        <div className="flex-1 w-full flex flex-col min-h-0 bg-white overflow-hidden">
          <div className="flex-1 w-full overflow-y-auto px-4 sm:px-6 py-4 space-y-3.5 bg-zinc-100/40 hide-scrollbar">
            
            {/* 모바일 뷰 카드 피드 */}
            <div className="block lg:hidden space-y-3">
              {filteredList.map((item) => {
                const isConf = item.is_confidential;
                const ddayInfo = calculateDDay(item.followup_date);
                
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedRecord(item)}
                    className="bg-white border border-zinc-200/90 p-4 rounded-2xl space-y-2.5 shadow-2xs cursor-pointer group"
                  >
                    <div className="flex justify-between items-start gap-2 whitespace-nowrap">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <span className="font-black text-[14px] text-zinc-900 truncate">{item.user_name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-zinc-100 border border-zinc-200 text-zinc-700 shrink-0">
                          {item.category}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-zinc-50 border border-zinc-200 text-zinc-600 shrink-0">
                          {item.care_status}
                        </span>
                        {item.urgency === '긴급' && (
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded text-[9.5px] font-black shrink-0">
                            긴급
                          </span>
                        )}
                        {isConf && (
                          <span className="bg-zinc-900 text-white px-1.5 py-0.2 rounded text-[9.5px] font-black shrink-0">
                            대외비
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 shrink-0 tabular-nums">
                        {item.submitted_date}
                      </span>
                    </div>
                    
                    <div className="relative">
                      <p className={`text-[12px] text-zinc-800 bg-zinc-50 p-3 rounded-xl border border-zinc-200/90 leading-relaxed whitespace-pre-wrap font-medium transition-all duration-300 ${isConf ? 'blur-[5px] group-hover:blur-none select-none group-hover:select-auto' : ''}`}>
                        {item.content}
                      </p>
                      {isConf && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10.5px] font-black text-zinc-500 pointer-events-none opacity-100 group-hover:opacity-0 transition-opacity">
                          🔒 대외비 보호중 (터치하여 확인)
                        </span>
                      )}
                    </div>

                    {item.testimony_note && (
                      <div className="bg-emerald-50/60 border border-emerald-200 p-2.5 rounded-xl text-[11px] text-emerald-900 font-bold leading-relaxed">
                        <strong className="block text-[9.5px] text-emerald-700 mb-0.5">✓ 기도 응답 감사 간증</strong>
                        {item.testimony_note}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-zinc-100 text-[10.5px] whitespace-nowrap">
                      <span className="text-zinc-500 font-bold truncate pr-1">
                        #{item.keyword || '일반목양'} • 담당: {item.pastor_name}
                      </span>
                      {item.followup_date && (
                        <span className={`font-mono font-bold px-1.5 py-0.2 rounded border shrink-0 tabular-nums ${ddayInfo.isOverdue ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                          {ddayInfo.text || item.followup_date}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PC 풀 와이드 고밀도 데이터 그리드 */}
            <div className="hidden lg:block w-full bg-white border border-zinc-200/90 rounded-2xl overflow-x-auto shadow-2xs">
              <table className="w-full text-[11.5px] text-left border-collapse font-sans min-w-[900px]">
                <thead>
                  <tr className="bg-zinc-50/95 border-b border-zinc-200 text-zinc-500 font-black uppercase tracking-wider text-[10px] sticky top-0 z-10 whitespace-nowrap">
                    <th className="py-2.5 px-3 border-r border-zinc-200 w-12 text-center">No</th>
                    <th className="py-2.5 px-3 border-r border-zinc-200 w-28">성도명</th>
                    <th className="py-2.5 px-3 border-r border-zinc-200 w-20 text-center">구분</th>
                    <th className="py-2.5 px-3 border-r border-zinc-200 w-24 text-center">목양 상태</th>
                    <th className="py-2.5 px-3 border-r border-zinc-200 w-28">키워드</th>
                    <th className="py-2.5 px-4 border-r border-zinc-200 min-w-[340px]">기도 제목 및 목양 상세 내용</th>
                    <th className="py-2.5 px-3 border-r border-zinc-200 w-24 text-center font-mono">접수일자</th>
                    <th className="py-2.5 px-3 border-r border-zinc-200 w-28 text-center font-mono">심방예정 (D-Day)</th>
                    <th className="py-2.5 px-3 border-r border-zinc-200 w-24 text-center">담당</th>
                    <th className="py-2.5 px-3 border-r border-zinc-200 w-20 text-center">보안</th>
                    <th className="py-2.5 px-3 w-16 text-center">상세</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-24 text-zinc-400 font-bold text-[13px]">
                        일치하는 목회 기록이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((item, idx) => {
                      const isConf = item.is_confidential;
                      const ddayInfo = calculateDDay(item.followup_date);

                      return (
                        <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors group">
                          <td className="py-2.5 px-3 border-r border-zinc-100 text-center text-zinc-400 font-mono text-[10.5px] tabular-nums whitespace-nowrap">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 border-r border-zinc-100 font-black text-zinc-900 text-[12.5px] whitespace-nowrap">
                            {item.user_name}
                            {item.urgency === '긴급' && (
                              <span className="ml-1 text-[9px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded font-black">
                                긴급
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 border-r border-zinc-100 text-center font-bold text-zinc-700 whitespace-nowrap">
                            {item.category}
                          </td>
                          <td className="py-2.5 px-3 border-r border-zinc-100 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                              item.care_status === '응답완료'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.care_status === '심방필요'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                            }`}>
                              {item.care_status || '중보기도중'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 border-r border-zinc-100 text-zinc-600 font-bold truncate max-w-[120px]">
                            #{item.keyword || '일반'}
                          </td>

                          {/* 대외비 마스킹 지원 본문 열 */}
                          <td className="py-2.5 px-4 border-r border-zinc-100 text-zinc-800 font-medium leading-relaxed relative">
                            <div className={`transition-all duration-300 ${isConf ? 'blur-[5px] group-hover:blur-none select-none group-hover:select-auto' : ''}`}>
                              <div className="line-clamp-2">{item.content}</div>
                              {item.testimony_note && (
                                <div className="text-[10.5px] text-emerald-700 font-bold mt-1 truncate bg-emerald-50/60 px-2 py-0.2 rounded border border-emerald-200 w-fit">
                                  ✓ 응답: {item.testimony_note}
                                </div>
                              )}
                            </div>
                            {isConf && (
                              <span className="absolute inset-0 flex items-center justify-center text-[10.5px] font-black text-zinc-500 pointer-events-none opacity-100 group-hover:opacity-0 transition-opacity bg-white/20 backdrop-blur-[1px]">
                                🔒 대외비 보호중 (마우스를 올리세요)
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 border-r border-zinc-100 text-center text-zinc-500 font-mono text-[10.5px] tabular-nums whitespace-nowrap">
                            {item.submitted_date}
                          </td>

                          <td className="py-2.5 px-3 border-r border-zinc-100 text-center whitespace-nowrap tabular-nums">
                            {item.followup_date ? (
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                <span className="font-mono font-bold text-[10.5px] text-zinc-700">{item.followup_date}</span>
                                <span className={`font-black text-[9px] px-1.5 py-0.2 rounded ${ddayInfo.isOverdue ? 'bg-rose-100 text-rose-700' : ddayInfo.isUrgent ? 'bg-amber-100 text-amber-800' : 'bg-zinc-100 text-zinc-500'}`}>
                                  {ddayInfo.text}
                                </span>
                              </div>
                            ) : (
                              <span className="text-zinc-300 font-mono">-</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 border-r border-zinc-100 text-center text-zinc-700 font-bold whitespace-nowrap">
                            {item.pastor_name || '교역자'}
                          </td>
                          <td className="py-2.5 px-3 border-r border-zinc-100 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleConfidential(item.id, item.is_confidential)}
                              className={`px-1.5 py-0.5 rounded font-black text-[9.5px] border cursor-pointer ${
                                item.is_confidential
                                  ? 'bg-zinc-900 text-white border-zinc-900'
                                  : 'bg-white text-zinc-400 border-zinc-200 hover:text-zinc-800'
                              }`}
                            >
                              {item.is_confidential ? '대외비' : '일반'}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedRecord(item)}
                              className="px-2.5 py-1 bg-white border border-zinc-200 rounded-md text-zinc-700 hover:border-zinc-900 font-bold text-[10.5px] shadow-2xs cursor-pointer"
                            >
                              열람
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          [탭 2] 풀 와이드 성도별 누적 케어 타임라인 (Dossier View)
         ========================================================================= */}
      {activeTab === 'dossier' && (
        <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 min-h-0 bg-white overflow-hidden">
          
          {/* 성도 명단 사이드 패널 (4 span) */}
          <div className="lg:col-span-4 border-r border-zinc-200 bg-zinc-50/60 flex flex-col min-h-0">
            <div className="p-4 border-b border-zinc-200 bg-white font-black text-zinc-900 text-[13px] flex justify-between items-center shrink-0 whitespace-nowrap">
              <span>교구 성도 명단 ({uniqueMembers.length}인)</span>
              <span className="text-[10.5px] text-zinc-400 font-bold">성도를 선택하세요</span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 hide-scrollbar">
              {uniqueMembers.map(m => (
                <div
                  key={m.name}
                  onClick={() => setSelectedUserName(m.name)}
                  className={`p-3.5 cursor-pointer flex justify-between items-center transition-colors whitespace-nowrap ${
                    selectedUserName === m.name ? 'bg-zinc-900 text-white shadow-2xs' : 'hover:bg-zinc-100 text-zinc-800'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <span className="text-[13.5px] font-black tracking-tight truncate block">{m.name}</span>
                    {m.phone && (
                      <div className={`text-[10.5px] font-mono tabular-nums ${selectedUserName === m.name ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {m.phone}
                      </div>
                    )}
                  </div>
                  <span className={`text-[10.5px] font-mono font-black px-2 py-0.5 rounded-md border shrink-0 tabular-nums ${
                    selectedUserName === m.name ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-white text-zinc-600 border-zinc-200'
                  }`}>
                    누적 {m.count}건
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 타임라인 메인 피드 (8 span) */}
          <div className="lg:col-span-8 flex flex-col min-h-0 bg-zinc-100/30 p-6 overflow-y-auto space-y-5 hide-scrollbar">
            <div className="border-b border-zinc-200 pb-3.5 flex flex-wrap justify-between items-end gap-2 sticky top-0 bg-white/90 backdrop-blur-xs pt-1 z-10 px-2">
              <div className="min-w-0">
                <h4 className="font-black text-[17px] text-zinc-900 tracking-tight truncate">
                  {selectedUserName || '성도를 선택해주세요'}
                </h4>
                <p className="text-[11.5px] text-zinc-500 font-medium mt-0.5">
                  과거부터 누적된 기도제목, 감사, 심방 이력을 시간순으로 조망합니다.
                </p>
              </div>
              {selectedUserName && (
                <button
                  type="button"
                  onClick={() => {
                    setForm(prev => ({ ...prev, user_name: selectedUserName }));
                    setShowCreateModal(true);
                  }}
                  className="px-3.5 py-2 bg-zinc-900 text-white font-black rounded-xl text-[11.5px] hover:bg-zinc-800 cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
                >
                  + 이 성도에게 기록 추가
                </button>
              )}
            </div>

            <div className="space-y-5 pl-4 relative">
              <div className="absolute top-2 bottom-6 left-[15px] w-[2px] bg-zinc-200" />
              
              {selectedMemberHistory.length === 0 && selectedUserName && (
                <div className="text-zinc-400 font-bold text-[12px] py-16 pl-6">
                  이 성도의 목양 기록이 아직 없습니다.
                </div>
              )}

              {selectedMemberHistory.map(item => {
                const isConf = item.is_confidential;
                return (
                  <div key={item.id} className="relative group pl-6">
                    <div className="absolute left-[8px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white shadow-2xs z-10 bg-zinc-400 group-hover:bg-zinc-900 transition-colors" />
                    
                    <div className="bg-white border border-zinc-200/90 rounded-2xl p-4.5 space-y-3 shadow-2xs hover:border-zinc-400 transition-all">
                      <div className="flex justify-between items-center gap-2 whitespace-nowrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded font-black text-[10px] border bg-zinc-100 text-zinc-700 border-zinc-200">
                            {item.category}
                          </span>
                          <span className="font-black text-zinc-900 text-[13.5px]">{item.keyword || '일반목양'}</span>
                          <span className="text-[10px] font-bold bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200 text-zinc-600">
                            {item.care_status}
                          </span>
                        </div>
                        <span className="text-[10.5px] font-mono text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200 tabular-nums">
                          {item.submitted_date}
                        </span>
                      </div>

                      <div className="relative">
                        <p className={`text-[12.5px] text-zinc-800 leading-relaxed whitespace-pre-wrap bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/90 font-medium transition-all duration-300 ${isConf ? 'blur-[5px] group-hover:blur-none select-none group-hover:select-auto' : ''}`}>
                          {item.content}
                        </p>
                        {isConf && (
                          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-zinc-500 pointer-events-none opacity-100 group-hover:opacity-0 transition-opacity">
                            🔒 대외비 (마우스를 올리세요)
                          </span>
                        )}
                      </div>

                      {item.testimony_note && (
                        <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-xl text-[12px] text-emerald-950 font-bold leading-relaxed">
                          <strong className="block text-[10px] text-emerald-700 mb-1">✓ 기도 응답 감사 간증</strong>
                          {item.testimony_note}
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2.5 border-t border-zinc-100 text-[10.5px] text-zinc-500 font-bold whitespace-nowrap">
                        <span>담당 교역자: {item.pastor_name || '미지정'}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(item)}
                          className="text-zinc-800 hover:text-zinc-950 font-black underline cursor-pointer"
                        >
                          상세 관리 및 간증 추가 →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          [탭 3] 풀 와이드 긴급 중보 & 심방 관제 (Urgent Care)
         ========================================================================= */}
      {activeTab === 'urgent' && (
        <div className="flex-1 w-full overflow-y-auto px-4 sm:px-6 py-5 bg-zinc-100/40 space-y-4 hide-scrollbar">
          <div className="w-full bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs space-y-1">
            <h4 className="font-black text-zinc-900 text-[14.5px]">긴급 환우/위기 가정 & 후속 심방 요망 집중 관제</h4>
            <p className="text-[11.5px] text-zinc-500 font-medium">수술, 장례, 가정 위기 등 즉각적인 목회적 돌봄이 필요한 성도를 최우선 통제합니다.</p>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 긴급 중보 큐 */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-4.5 space-y-3 shadow-2xs">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-2.5 whitespace-nowrap">
                <span className="font-black text-[13.5px] text-rose-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  긴급 중보기도 요청 목록
                </span>
                <span className="text-[10px] font-mono font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md tabular-nums">
                  {archives.filter(a => a.urgency === '긴급').length}건
                </span>
              </div>

              <div className="space-y-2.5">
                {archives.filter(a => a.urgency === '긴급').length === 0 ? (
                  <div className="py-10 text-center text-zinc-400 text-[11.5px] font-medium bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200">
                    긴급 조치 대상 성도가 없습니다.
                  </div>
                ) : (
                  archives.filter(a => a.urgency === '긴급').map(item => (
                    <div key={item.id} className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1.5 text-[11.5px]">
                      <div className="flex justify-between font-black whitespace-nowrap">
                        <span className="text-zinc-900 text-[13px] truncate pr-2">
                          {item.user_name} <span className="text-rose-600 text-[10.5px]">({item.keyword || '위기중보'})</span>
                        </span>
                        <span className="text-zinc-400 font-mono text-[10.5px] tabular-nums shrink-0">{item.submitted_date}</span>
                      </div>
                      <p className={`text-zinc-700 leading-relaxed font-medium ${item.is_confidential ? 'blur-[4px] hover:blur-none transition-all' : ''}`}>{item.content}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-zinc-200/60 text-[10.5px] whitespace-nowrap">
                        <span className="text-zinc-500 font-bold">상태: {item.care_status}</span>
                        <button type="button" onClick={() => setSelectedRecord(item)} className="text-zinc-900 hover:underline font-bold cursor-pointer">심방 조치하기 →</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 심방 요망 큐 */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-4.5 space-y-3 shadow-2xs">
              <div className="flex justify-between items-center border-b border-zinc-100 pb-2.5 whitespace-nowrap">
                <span className="font-black text-[13.5px] text-amber-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  교역자 심방/상담 예정 목록
                </span>
                <span className="text-[10px] font-mono font-black text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md tabular-nums">
                  {archives.filter(a => a.care_status === '심방필요' || a.followup_date).length}건
                </span>
              </div>

              <div className="space-y-2.5">
                {archives.filter(a => a.care_status === '심방필요' || a.followup_date).length === 0 ? (
                  <div className="py-10 text-center text-zinc-400 text-[11.5px] font-medium bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200">
                    심방 예정 성도가 없습니다.
                  </div>
                ) : (
                  archives.filter(a => a.care_status === '심방필요' || a.followup_date).map(item => {
                    const ddayInfo = calculateDDay(item.followup_date);
                    return (
                      <div key={item.id} className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1.5 text-[11.5px]">
                        <div className="flex justify-between font-black items-center whitespace-nowrap">
                          <span className="text-zinc-900 text-[13px] truncate pr-2">{item.user_name}</span>
                          <div className="flex items-center gap-1.5 shrink-0 tabular-nums">
                            <span className={`text-[9.5px] font-black px-1.5 py-0.2 rounded border ${ddayInfo.isOverdue ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                              {ddayInfo.text}
                            </span>
                            <span className="text-zinc-500 font-mono text-[10.5px] bg-white px-1.5 py-0.2 rounded border border-zinc-200">
                              {item.followup_date || '일정미정'}
                            </span>
                          </div>
                        </div>
                        <p className={`text-zinc-700 leading-relaxed font-medium ${item.is_confidential ? 'blur-[4px] hover:blur-none transition-all' : ''}`}>{item.content}</p>
                        <div className="flex justify-between items-center pt-2 border-t border-zinc-200/60 text-[10.5px] whitespace-nowrap">
                          <span className="text-zinc-500 font-bold">담당: {item.pastor_name}</span>
                          <button type="button" onClick={() => setSelectedRecord(item)} className="text-zinc-900 hover:underline font-bold cursor-pointer">결과 기록하기 →</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          [탭 4] 풀 와이드 일괄 작성 스프레드시트 (Batch Sheet)
         ========================================================================= */}
      {activeTab === 'batch' && (
        <div className="flex-1 w-full flex flex-col p-4 sm:p-6 overflow-hidden bg-zinc-100/40 space-y-3.5 hide-scrollbar">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 border border-zinc-200 rounded-2xl shrink-0 shadow-2xs">
            <div>
              <h4 className="font-black text-zinc-900 text-[14px]">목회 아카이브 일괄 작성 스프레드시트</h4>
              <p className="text-[11px] font-medium text-zinc-500 mt-0.5">다수 성도의 기도제목이나 심방 메모를 연속으로 입력하고 데이터베이스에 일괄 적재합니다.</p>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <button
                type="button"
                onClick={handleAddBatchRow}
                className="px-3.5 py-1.5 border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg text-[11.5px] font-bold cursor-pointer shadow-2xs"
              >
                + 행 추가
              </button>
              <button
                type="button"
                onClick={handleSaveBatch}
                className="px-5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-[11.5px] font-black cursor-pointer shadow-2xs active:scale-95"
              >
                일괄 저장 실행
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-white border border-zinc-200/90 rounded-2xl shadow-2xs hide-scrollbar">
            <table className="w-full text-[11.5px] text-left border-collapse min-w-[1000px] font-sans">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-black uppercase text-[10px] sticky top-0 z-10 whitespace-nowrap">
                  <th className="py-2.5 px-3 border-r border-zinc-200 w-12 text-center">No</th>
                  <th className="py-2.5 px-3 border-r border-zinc-200 w-32">성도명 *</th>
                  <th className="py-2.5 px-3 border-r border-zinc-200 w-32">연락처</th>
                  <th className="py-2.5 px-3 border-r border-zinc-200 w-24">구분</th>
                  <th className="py-2.5 px-3 border-r border-zinc-200 w-28">목양상태</th>
                  <th className="py-2.5 px-3 border-r border-zinc-200 w-24">긴급도</th>
                  <th className="py-2.5 px-3 border-r border-zinc-200 w-32">키워드</th>
                  <th className="py-2.5 px-3 border-r border-zinc-200">상세 기도 및 심방 내용 *</th>
                  <th className="py-2.5 px-3 border-r border-zinc-200 w-32 text-center font-mono">일자</th>
                  <th className="py-2.5 px-3 w-14 text-center">삭제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {batchRows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-zinc-50">
                    <td className="py-2 px-3 border-r border-zinc-100 text-center text-zinc-400 font-mono tabular-nums">{idx + 1}</td>
                    <td className="py-2 px-3 border-r border-zinc-100">
                      <input
                        type="text"
                        value={row.user_name}
                        onChange={e => handleBatchRowChange(row.id, 'user_name', e.target.value)}
                        placeholder="성도명"
                        className="w-full p-1 bg-transparent border-b border-transparent focus:border-zinc-900 font-black outline-none"
                      />
                    </td>
                    <td className="py-2 px-3 border-r border-zinc-100">
                      <input
                        type="text"
                        value={row.phone}
                        onChange={e => handleBatchRowChange(row.id, 'phone', e.target.value)}
                        placeholder="010-0000-0000"
                        className="w-full p-1 bg-transparent border-b border-transparent focus:border-zinc-900 font-mono outline-none"
                      />
                    </td>
                    <td className="py-2 px-3 border-r border-zinc-100">
                      <select
                        value={row.category}
                        onChange={e => handleBatchRowChange(row.id, 'category', e.target.value)}
                        className="w-full p-1 bg-transparent font-bold outline-none cursor-pointer"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="py-2 px-3 border-r border-zinc-100">
                      <select
                        value={row.care_status}
                        onChange={e => handleBatchRowChange(row.id, 'care_status', e.target.value)}
                        className="w-full p-1 bg-transparent font-bold outline-none cursor-pointer"
                      >
                        {CARE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="py-2 px-3 border-r border-zinc-100">
                      <select
                        value={row.urgency}
                        onChange={e => handleBatchRowChange(row.id, 'urgency', e.target.value)}
                        className="w-full p-1 bg-transparent font-bold text-rose-600 outline-none cursor-pointer"
                      >
                        <option value="일반">일반</option>
                        <option value="긴급">긴급</option>
                      </select>
                    </td>
                    <td className="py-2 px-3 border-r border-zinc-100">
                      <input
                        type="text"
                        value={row.keyword}
                        onChange={e => handleBatchRowChange(row.id, 'keyword', e.target.value)}
                        placeholder="태그"
                        className="w-full p-1 bg-transparent border-b border-transparent focus:border-zinc-900 font-bold outline-none"
                      />
                    </td>
                    <td className="py-2 px-3 border-r border-zinc-100">
                      <input
                        type="text"
                        value={row.content}
                        onChange={e => handleBatchRowChange(row.id, 'content', e.target.value)}
                        placeholder="내용 기재..."
                        className="w-full p-1 bg-transparent border-b border-transparent focus:border-zinc-900 outline-none"
                      />
                    </td>
                    <td className="py-2 px-3 border-r border-zinc-100">
                      <input
                        type="date"
                        value={row.submitted_date}
                        onChange={e => handleBatchRowChange(row.id, 'submitted_date', e.target.value)}
                        className="w-full p-1 bg-transparent font-mono text-[10.5px] outline-none cursor-pointer tabular-nums"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveBatchRow(row.id)}
                        className="text-zinc-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <SvgClose />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          [탭 5] 🏛️ 풀 와이드 주간 목회 심방 보고서 총람 편철 (Official Docket)
         ========================================================================= */}
      {activeTab === 'report' && (
        <div className="flex-1 w-full overflow-y-auto px-4 sm:px-6 py-5 bg-zinc-100/40 hide-scrollbar">
          <div className="w-full bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
            
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-zinc-200 pb-4">
              <div>
                <h4 className="font-black text-zinc-900 text-[16px] tracking-tight">
                  주간 목회 심방 및 중보기도 총괄 편철
                </h4>
                <p className="text-[11.5px] text-zinc-500 mt-0.5 font-medium">
                  담임목사 주간 목회 브리핑 및 교역자 회의 공식 제출용 서식입니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-zinc-900 text-white font-black rounded-xl text-[11.5px] hover:bg-zinc-800 cursor-pointer shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <SvgPrint /> 인쇄 / PDF 저장
              </button>
            </div>

            <div className="w-full space-y-6 text-zinc-900 font-sans">
              <div className="text-center space-y-1.5 py-6 border-b-2 border-zinc-900">
                <h2 className="text-[20px] sm:text-[22px] font-black tracking-widest uppercase">
                  주 간 목 회 심 방 및 중 보 기 도 총 람
                </h2>
                <div className="text-[11.5px] text-zinc-500 font-mono font-bold tabular-nums">
                  출력일자: {new Date().toLocaleDateString()} | 총 수록 건수: {archives.length}건 (응답완료: {metrics.answeredCount}건)
                </div>
              </div>

              <div className="w-full space-y-4">
                {archives.map((item, idx) => (
                  <div
                    key={item.id}
                    className="w-full p-4.5 bg-white border border-zinc-300 rounded-2xl space-y-2 text-[12px] shadow-2xs"
                  >
                    <div className="flex flex-wrap justify-between items-center gap-2 font-bold border-b border-zinc-200 pb-2 whitespace-nowrap">
                      <span className="text-zinc-900 text-[13.5px] font-black flex items-center gap-1.5 truncate">
                        {idx + 1}. {item.user_name} 
                        <span className="text-[10px] bg-zinc-100 border border-zinc-200 text-zinc-700 px-1.5 py-0.2 rounded shrink-0">
                          {item.category} / {item.care_status}
                        </span>
                        {item.urgency === '긴급' && (
                          <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-700 px-1.5 py-0.2 rounded shrink-0">
                            긴급
                          </span>
                        )}
                      </span>
                      <span className="text-zinc-500 font-mono text-[10.5px] bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200 tabular-nums shrink-0">
                        {item.submitted_date}
                      </span>
                    </div>

                    <p className="text-zinc-800 leading-relaxed whitespace-pre-wrap font-medium py-1">
                      {item.content}
                    </p>

                    {item.testimony_note && (
                      <div className="text-emerald-950 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200 font-bold text-[11px] leading-relaxed">
                        <strong className="text-emerald-700 text-[10px] block mb-0.5">✓ 기도 응답 감사 간증: </strong>
                        {item.testimony_note}
                      </div>
                    )}

                    <div className="flex justify-between text-[10.5px] text-zinc-500 font-mono font-bold pt-2.5 border-t border-zinc-200 whitespace-nowrap tabular-nums">
                      <span>담당 교역자: {item.pastor_name || '미지정'}</span>
                      {item.followup_date && <span className="text-amber-800">심방예정: {item.followup_date}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          [모달 1] 신규 목회 기록 등록 모달 (원클릭 템플릿 프리셋 탑재)
         ========================================================================= */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-[400] bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl font-sans flex flex-col max-h-[92dvh] overflow-hidden border border-zinc-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-200 bg-zinc-900 text-white shrink-0">
              <h3 className="text-[15px] font-black tracking-tight">신규 목양·중보기도·심방 등록</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer rounded"
              >
                <SvgClose />
              </button>
            </div>

            <form onSubmit={handleSaveSingle} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-[12px] hide-scrollbar">
              
              {/* 원클릭 목양 템플릿 프리셋 바 */}
              <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-2">
                <div className="flex items-center justify-between whitespace-nowrap">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                    QUICK PASTORAL TEMPLATES (자주 쓰는 목양 서식)
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">원터치 자동 입력</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
                  {PASTORAL_TEMPLATES.map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-zinc-900 hover:text-white text-zinc-700 border border-zinc-200 text-[11px] font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
                    >
                      + {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                    성도명 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.user_name}
                    onChange={e => setForm({ ...form, user_name: e.target.value })}
                    placeholder="성도 성명"
                    className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-2.5 rounded-xl font-black text-zinc-900 outline-none focus:border-zinc-900 shadow-2xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                    성도 연락처
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="010-0000-0000"
                    className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-2.5 rounded-xl font-mono font-bold outline-none focus:border-zinc-900 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                    기록 구분 <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-zinc-300 bg-zinc-50 p-2.5 rounded-xl font-bold outline-none cursor-pointer"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                    목양 진행 상태
                  </label>
                  <select
                    value={form.care_status}
                    onChange={e => setForm({ ...form, care_status: e.target.value })}
                    className="w-full border border-zinc-300 bg-zinc-50 p-2.5 rounded-xl font-bold outline-none cursor-pointer"
                  >
                    {CARE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                    긴급도
                  </label>
                  <select
                    value={form.urgency}
                    onChange={e => setForm({ ...form, urgency: e.target.value })}
                    className="w-full border border-zinc-300 bg-rose-50 p-2.5 rounded-xl font-bold text-rose-700 outline-none cursor-pointer"
                  >
                    <option value="일반">일반 목양</option>
                    <option value="긴급">🚨 긴급 중보</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                    핵심 키워드
                  </label>
                  <input
                    list="keyword-options"
                    type="text"
                    value={form.keyword}
                    onChange={e => setForm({ ...form, keyword: e.target.value })}
                    placeholder="태그 입력"
                    className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-2.5 rounded-xl font-bold outline-none focus:border-zinc-900 shadow-2xs"
                  />
                  <datalist id="keyword-options">
                    {Array.from(new Set(archives.map(a => a.keyword).filter(Boolean))).map(k => (
                      <option key={k} value={k} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                    담당 교역자
                  </label>
                  <input
                    list="pastor-options"
                    type="text"
                    value={form.pastor_name}
                    onChange={e => setForm({ ...form, pastor_name: e.target.value })}
                    placeholder="성명"
                    className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-2.5 rounded-xl font-bold outline-none focus:border-zinc-900 shadow-2xs"
                  />
                  <datalist id="pastor-options">
                    {Array.from(new Set(archives.map(a => a.pastor_name).filter(Boolean))).map(p => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                    후속 심방 예정일
                  </label>
                  <input
                    type="date"
                    value={form.followup_date}
                    onChange={e => setForm({ ...form, followup_date: e.target.value })}
                    className="w-full border border-zinc-300 bg-zinc-50 p-2.5 rounded-xl font-mono outline-none cursor-pointer font-bold shadow-2xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                    접수 일자 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.submitted_date}
                    onChange={e => setForm({ ...form, submitted_date: e.target.value })}
                    className="w-full border border-zinc-300 bg-zinc-50 p-2.5 rounded-xl font-mono outline-none cursor-pointer font-bold shadow-2xs tabular-nums"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                  상세 기도 및 심방 내용 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  placeholder="성도의 구체적인 기도 제목과 심방 상황을 기록하세요..."
                  className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-3 rounded-xl leading-relaxed outline-none focus:border-zinc-900 transition-colors resize-none font-medium text-zinc-800 shadow-2xs"
                  required
                />
              </div>

              <div
                className="flex items-center gap-2 p-3 border border-zinc-200 rounded-xl bg-zinc-50 cursor-pointer"
                onClick={() => setForm({ ...form, is_confidential: !form.is_confidential })}
              >
                <input
                  type="checkbox"
                  checked={form.is_confidential}
                  readOnly
                  className="w-4 h-4 accent-zinc-900 pointer-events-none"
                />
                <label className="text-[12px] font-black text-zinc-800 cursor-pointer select-none">
                  대외비 설정 <span className="text-[10.5px] text-zinc-400 font-normal">(목록에서 마스킹 블라인드 처리)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-zinc-100 rounded-xl font-bold text-zinc-700 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-zinc-900 text-white font-black rounded-xl shadow-2xs active:scale-95 transition-all cursor-pointer"
                >
                  목양 기록 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          [모달 2] 상세 기록 및 기도 응답 간증 결재 모달
         ========================================================================= */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-[400] bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="w-full max-w-3xl bg-white border border-zinc-300 rounded-2xl p-6 shadow-2xl font-sans flex flex-col max-h-[92vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="bg-zinc-900 text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                  {selectedRecord.category}
                </span>
                <h3 className="text-[15.5px] font-black text-zinc-900 tracking-tight">목양 일지 및 응답 결재</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-zinc-400 hover:text-zinc-900 p-1 cursor-pointer rounded"
              >
                <SvgClose />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 px-1 hide-scrollbar">
              
              <div className="flex flex-wrap justify-between items-start border-b border-zinc-200 pb-4 gap-4">
                <div className="space-y-1">
                  <h2 className="text-[18px] sm:text-[19px] font-black text-zinc-900 tracking-tight">
                    {selectedRecord.user_name} 성도 목양 일지
                  </h2>
                  <div className="text-[11px] text-zinc-500 font-mono font-bold flex items-center gap-2">
                    <span className="bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 text-zinc-700">
                      {selectedRecord.keyword || '일반목양'}
                    </span>
                    <span>접수일자: {selectedRecord.submitted_date}</span>
                  </div>
                </div>

                {/* 응답 완료 전자 인영 */}
                <div className="text-center shrink-0 w-20 flex justify-end">
                  {selectedRecord.care_status === '응답완료' || selectedRecord.care_status === '케어종결' ? (
                    <div className="border-[3px] border-zinc-900 text-zinc-900 rounded-full w-14 h-14 flex flex-col items-center justify-center font-black text-[11.5px] leading-tight rotate-[-8deg] shadow-2xs bg-white">
                      <span>응답</span>
                      <span>완료</span>
                    </div>
                  ) : (
                    <div className="border-[2px] border-dashed border-zinc-300 text-zinc-400 rounded-full w-14 h-14 flex items-center justify-center text-[10px] font-bold bg-zinc-50 text-center leading-tight">
                      기도중
                    </div>
                  )}
                </div>
              </div>

              {/* 기본 정보 테이블 */}
              <div className="rounded-xl border border-zinc-300 overflow-hidden text-[12px]">
                <table className="w-full border-collapse bg-white">
                  <tbody>
                    <tr className="border-b border-zinc-200">
                      <td className="w-28 bg-zinc-50 p-3 font-bold text-zinc-500 border-r border-zinc-200 text-center uppercase tracking-wider text-[10px]">
                        진행 상태 변경
                      </td>
                      <td className="p-2 border-r border-zinc-200 font-black text-zinc-900">
                        <select
                          value={selectedRecord.care_status || '중보기도중'}
                          onChange={e => handleUpdateCareStatus(selectedRecord.id, e.target.value)}
                          className="border border-zinc-300 bg-white px-2.5 py-1 rounded-md font-black outline-none cursor-pointer text-[11.5px] w-full"
                        >
                          {CARE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="w-28 bg-zinc-50 p-3 font-bold text-zinc-500 border-r border-zinc-200 text-center uppercase tracking-wider text-[10px]">
                        긴급도
                      </td>
                      <td className="p-3 font-black text-zinc-900 text-center">
                        {selectedRecord.urgency === '긴급' ? <span className="text-rose-600">🚨 긴급</span> : '일반'}
                      </td>
                    </tr>
                    <tr className="border-b border-zinc-200">
                      <td className="bg-zinc-50 p-3 font-bold text-zinc-500 border-r border-zinc-200 text-center uppercase tracking-wider text-[10px]">
                        연락처
                      </td>
                      <td colSpan={3} className="p-3 font-mono font-bold text-zinc-800 tabular-nums">
                        {selectedRecord.phone || '미등록'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-zinc-50 p-3 font-bold text-zinc-500 border-r border-zinc-200 text-center uppercase tracking-wider text-[10px]">
                        대외비 설정
                      </td>
                      <td colSpan={3} className="p-2 text-zinc-900 bg-white">
                        <button
                          type="button"
                          onClick={() => handleToggleConfidential(selectedRecord.id, selectedRecord.is_confidential)}
                          className={`px-3 py-1 rounded-md font-bold text-[11px] cursor-pointer border ${
                            selectedRecord.is_confidential
                              ? 'bg-zinc-900 text-white border-zinc-900'
                              : 'bg-white border-zinc-200 text-zinc-500'
                          }`}
                        >
                          {selectedRecord.is_confidential
                            ? '🔒 대외비 보호중 (클릭 시 일반 공개 전환)'
                            : '일반 공개 문서 (클릭 시 대외비 전환)'}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 본문 전문 */}
              <div className="space-y-1.5 pt-1">
                <span className="font-black text-zinc-900 text-[12.5px] block">상세 기도 및 심방 내용 전문</span>
                <p className={`text-[12.5px] text-zinc-800 leading-relaxed whitespace-pre-wrap bg-zinc-50 p-4 rounded-xl border border-zinc-200 font-medium transition-all duration-300 ${selectedRecord.is_confidential ? 'blur-[5px] group-hover:blur-none select-none group-hover:select-auto' : ''}`}>
                  {selectedRecord.content}
                </p>
              </div>

              {/* 간증 및 피드백 기록 */}
              <div className="space-y-2.5 pt-3 border-t border-zinc-200">
                <span className="font-black text-zinc-900 text-[13px] block">
                  기도 응답 감사 간증 및 사후 피드백 (Testimony)
                </span>

                {selectedRecord.testimony_note && (
                  <div className={`bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-xl text-[12px] text-emerald-950 font-bold whitespace-pre-wrap leading-relaxed shadow-2xs ${selectedRecord.is_confidential ? 'blur-[4px] hover:blur-none' : ''}`}>
                    {selectedRecord.testimony_note}
                  </div>
                )}

                <div className="flex gap-2 bg-zinc-50 p-2 rounded-xl border border-zinc-200">
                  <input
                    type="text"
                    value={testimonyInput}
                    onChange={e => setTestimonyInput(e.target.value)}
                    placeholder="하나님의 역사하심과 응답 간증을 기록하세요..."
                    className="flex-1 border border-zinc-300 bg-white px-3 py-2 rounded-lg text-[12px] font-bold outline-none focus:border-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveTestimony(selectedRecord.id)}
                    className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-lg text-[11.5px] cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
                  >
                    간증 저장
                  </button>
                </div>
              </div>

            </div>

            <div className="flex justify-between items-center pt-4 border-t border-zinc-200 shrink-0 mt-2 whitespace-nowrap">
              <button
                type="button"
                onClick={() => handleDelete(selectedRecord.id)}
                className="px-3.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-zinc-300 rounded-lg font-bold text-[11px] cursor-pointer shadow-2xs"
              >
                기록 완전 삭제
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-lg text-[12px] cursor-pointer shadow-2xs"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
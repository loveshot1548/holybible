// src/components/admin/erp/ErpMeetingMinutes.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';

const RESOLUTION_STATUSES = ['원안가결', '수정가결', '조건부의결', '심의보류', '부결'];

const MEETING_TYPES = [
  '정기당회',
  '임시당회',
  '정기제직회',
  '임시제직회',
  '공동의회',
  '기획위원회',
  '예배사역위원회',
  '재정감사위원회',
  '인사위원회'
];

// 엔터프라이즈 모노크롬 SVG 세트
const SvgSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const SvgPrint = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.728 6.75H17.27m-10.542 0A2.25 2.25 0 004.5 9v6a2.25 2.25 0 002.25 2.25h10.5A2.25 2.25 0 0019.5 15V9a2.25 2.25 0 00-2.25-2.25m-10.542 0V4.5a2.25 2.25 0 012.25-2.25h6a2.25 2.25 0 012.25 2.25v2.25m-10.542 0h10.542" /></svg>;
const SvgClose = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const SvgCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const SvgPlus = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const SvgCopy = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>;
const SvgDownload = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const SvgShieldCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-600"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>;

export default function ErpMeetingMinutes() {
  const [activeTab, setActiveTab] = useState('archive'); // 'archive' | 'analytics' | 'actions' | 'report'
  const [mobileSubMode, setMobileSubMode] = useState('feed'); 
  const [minutes, setMinutes] = useState([]);
  
  const [filterPeriod, setFilterPeriod] = useState('ALL');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedMinute, setSelectedMinute] = useState(null);

  // 공문서 서식 기본값
  const [form, setForm] = useState({
    meeting_date: new Date().toISOString().split('T')[0],
    meeting_type: '정기당회',
    department: '당회',
    doc_no: '',
    title: '',
    total_eligible: 9, // 재적 인원
    attendees_count: 7, // 출석 인원
    attendees: '당회원 일동',
    signed_officers: '당회장(담임목사), 서기장로',
    resolution_status: '원안가결',
    resolution: '',
    content: '',
    votes_for: 7,
    votes_against: 0,
    votes_abstain: 0,
    is_signed: false
  });

  const [actionItems, setActionItems] = useState([
    { id: 1, task: '결의 사항 주보 공지 및 재정부 지출 품의 연계', assignee: '행정실장', dueDate: '', status: '진행중' }
  ]);

  const fetchMinutes = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('erp_meeting_minutes')
        .select('*')
        .order('meeting_date', { ascending: false });
      if (!error && data) setMinutes(data);
    } catch (e) {}
  }, []);

  useEffect(() => { fetchMinutes(); }, [fetchMinutes]);

  // 동적 부서 및 회의체 목록
  const dynamicDepartments = useMemo(() => {
    const defaultDepts = ['당회', '제직회', '공동의회', '기획위원회', '예배위원회', '재정위원회', '인사위원회'];
    const dbDepts = minutes.map(m => m.department).filter(Boolean);
    return Array.from(new Set([...defaultDepts, ...dbDepts])).sort();
  }, [minutes]);

  // 정족수 실시간 감사 연산 (의사정족수: 재적 과반 / 의결정족수: 출석 과반)
  const quorumValidation = useMemo(() => {
    const eligible = Number(form.total_eligible) || 1;
    const attended = Number(form.attendees_count) || 0;
    const votesFor = Number(form.votes_for) || 0;

    const isQuorumMet = attended > Math.floor(eligible / 2); // 의사정족수 충족 여부
    const isVotePassed = votesFor > Math.floor(attended / 2); // 의결정족수 충족 여부

    return {
      isQuorumMet,
      isVotePassed,
      quorumPercent: Math.round((attended / eligible) * 100),
      votePassPercent: attended > 0 ? Math.round((votesFor / attended) * 100) : 0
    };
  }, [form.total_eligible, form.attendees_count, form.votes_for]);

  const handleAddActionRow = () => {
    setActionItems(prev => [
      ...prev,
      { id: Date.now(), task: '', assignee: '', dueDate: '', status: '진행중' }
    ]);
  };

  const handleActionChange = (id, field, value) => {
    setActionItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveActionRow = (id) => {
    if (actionItems.length <= 1) return;
    setActionItems(prev => prev.filter(item => item.id !== id));
  };

  // 공식 의사록 기장 및 아카이빙
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.department.trim()) return alert('회의체 명칭을 입력해주세요.');
    if (!form.title.trim() || !form.content.trim()) return alert('안건 제목과 심의 본문은 필수 입력 사항입니다.');

    const year = form.meeting_date.substring(0, 4);
    const countThisDept = minutes.filter(m => m.department === form.department.trim()).length + 1;
    const generatedDocNo = form.doc_no.trim() || `${year}-${form.department.trim()}-제${String(countThisDept).padStart(2, '0')}호`;

    const validActions = actionItems.filter(a => a.task.trim());
    const payload = {
      id: `MIN_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      ...form,
      department: form.department.trim(),
      doc_no: generatedDocNo,
      total_eligible: Number(form.total_eligible) || 0,
      attendees_count: Number(form.attendees_count) || 0,
      votes_for: Number(form.votes_for) || 0,
      votes_against: Number(form.votes_against) || 0,
      votes_abstain: Number(form.votes_abstain) || 0,
      action_items: validActions,
      writer: '기록서기',
      status: '공식 확정',
      is_signed: false,
      signed_at: null
    };

    if (supabase) {
      const { error } = await supabase.from('erp_meeting_minutes').insert([payload]);
      if (error) return alert('회의록 기장 실패: ' + error.message);
    }

    setMinutes(prev => [payload, ...prev]);
    setForm({
      meeting_date: new Date().toISOString().split('T')[0],
      meeting_type: '정기당회',
      department: form.department.trim(),
      doc_no: '',
      title: '',
      total_eligible: 9,
      attendees_count: 7,
      attendees: '',
      signed_officers: '당회장, 서기',
      resolution_status: '원안가결',
      resolution: '',
      content: '',
      votes_for: 7,
      votes_against: 0,
      votes_abstain: 0,
      is_signed: false
    });
    setActionItems([{ id: Date.now(), task: '', assignee: '', dueDate: '', status: '진행중' }]);
    alert(`공식 의안 [${generatedDocNo}] 회의록이 데이터베이스에 정식 아카이빙되었습니다.`);
    setMobileSubMode('feed');
  };

  // 공식 전자 직인 날인
  const handleToggleSign = async (minuteId, currentStatus) => {
    const nextStatus = !currentStatus;
    const signed_at = nextStatus ? new Date().toISOString() : null;

    setMinutes(prev => prev.map(m => m.id === minuteId ? { ...m, is_signed: nextStatus, signed_at } : m));
    if (selectedMinute?.id === minuteId) setSelectedMinute(prev => ({ ...prev, is_signed: nextStatus, signed_at }));
    if (supabase) await supabase.from('erp_meeting_minutes').update({ is_signed: nextStatus, signed_at }).eq('id', minuteId);
  };

  // 후속 조치 상태 토글
  const handleToggleActionStatus = async (meetingId, actionId, currentStatus) => {
    const nextStatus = currentStatus === '완료' ? '진행중' : '완료';
    const targetMeeting = minutes.find(m => m.id === meetingId);
    if (!targetMeeting) return;

    const updatedActions = (targetMeeting.action_items || []).map(act => act.id === actionId ? { ...act, status: nextStatus } : act);
    const updatedMinutes = minutes.map(m => m.id === meetingId ? { ...m, action_items: updatedActions } : m);
    
    setMinutes(updatedMinutes);
    if (selectedMinute?.id === meetingId) setSelectedMinute(prev => ({ ...prev, action_items: updatedActions }));
    if (supabase) await supabase.from('erp_meeting_minutes').update({ action_items: updatedActions }).eq('id', meetingId);
  };

  // 회의록 삭제
  const handleDelete = async (id) => {
    if (!window.confirm('선택한 공식 회의록을 영구 폐기하시겠습니까?\n(공공 거버넌스 규격상 폐기 시 감사 로그에 기록됩니다)')) return;
    if (supabase) await supabase.from('erp_meeting_minutes').delete().eq('id', id);
    setMinutes(prev => prev.filter(m => m.id !== id));
    if (selectedMinute?.id === id) setSelectedMinute(null);
  };

  // 전체 의안 CSV 내보내기
  const exportMinutesCSV = () => {
    if (filteredMinutes.length === 0) return alert('내보낼 회의록 내역이 없습니다.');
    let csvContent = '\uFEFF';
    csvContent += '의안번호,회의일자,회의체,안건제목,의결상태,참석자,찬성,반대,기권,결의주문,날인여부\n';

    filteredMinutes.forEach(m => {
      csvContent += `"${m.doc_no || '-'}","${m.meeting_date}","${m.department}","${m.title}","${m.resolution_status}","${m.attendees}","${m.votes_for || 0}","${m.votes_against || 0}","${m.votes_abstain || 0}","${(m.resolution || '').replace(/"/g, '""')}","${m.is_signed ? '날인완료' : '미날인'}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `의사록_총괄보고서_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 클립보드 브리핑 복사
  const handleCopyMeetingBrief = () => {
    if (filteredMinutes.length === 0) return alert('복사할 회의록 내역이 없습니다.');
    let text = `[거버넌스 공식 회의록 요약 보고]\n발행일자: ${new Date().toLocaleDateString()}\n총 의안: ${filteredMinutes.length}건\n--------------------------\n`;
    filteredMinutes.forEach((m, idx) => {
      text += `${idx + 1}. [${m.doc_no || m.department}] ${m.title} (${m.meeting_date})\n`;
      text += `결과: ${m.resolution_status} (찬성 ${m.votes_for || 0} / 반대 ${m.votes_against || 0})\n`;
      if (m.resolution) text += `주문: ${m.resolution}\n`;
      if (m.action_items && m.action_items.length > 0) text += `이행: ${m.action_items.map(a => `${a.task}(${a.assignee || '미지정'})`).join(', ')}\n`;
      text += `\n`;
    });

    navigator.clipboard.writeText(text).then(() => alert('의결 회의록 브리핑이 클립보드에 복사되었습니다.'));
  };

  // 필터링된 회의록 목록
  const filteredMinutes = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    return minutes.filter(m => {
      const matchesDept = filterDept === 'ALL' || m.department === filterDept;
      const matchesStatus = filterStatus === 'ALL' || m.resolution_status === filterStatus;
      const q = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        m.title?.toLowerCase().includes(q) ||
        m.content?.toLowerCase().includes(q) ||
        m.doc_no?.toLowerCase().includes(q) ||
        m.attendees?.toLowerCase().includes(q) ||
        m.resolution?.toLowerCase().includes(q);

      let matchesPeriod = true;
      if (m.meeting_date) {
        const mDate = new Date(m.meeting_date);
        const mYear = mDate.getFullYear();
        const mMonth = mDate.getMonth() + 1;
        if (filterPeriod === 'weekly') {
          const diffDays = (now - mDate) / (1000 * 60 * 60 * 24);
          matchesPeriod = diffDays >= 0 && diffDays <= 7;
        } else if (filterPeriod === 'monthly') {
          matchesPeriod = mYear === currentYear && mMonth === currentMonth;
        } else if (filterPeriod === 'quarterly') {
          matchesPeriod = mYear === currentYear && Math.ceil(mMonth / 3) === Math.ceil(currentMonth / 3);
        } else if (filterPeriod === 'yearly') {
          matchesPeriod = mYear === currentYear;
        }
      }
      return matchesDept && matchesStatus && matchesSearch && matchesPeriod;
    });
  }, [minutes, filterPeriod, filterDept, filterStatus, searchTerm]);

  // 전사 실행 과제 풀
  const allActionItemsExtracted = useMemo(() => {
    const list = [];
    minutes.forEach(m => {
      if (m.action_items && Array.isArray(m.action_items)) {
        m.action_items.forEach((act) => {
          const isOverdue = act.dueDate && new Date(act.dueDate) < new Date() && act.status !== '완료';
          list.push({
            ...act,
            meetingId: m.id,
            meetingTitle: m.title,
            docNo: m.doc_no,
            meetingDate: m.meeting_date,
            department: m.department,
            isOverdue,
            uniqueKey: `${m.id}_${act.id}`
          });
        });
      }
    });
    return list;
  }, [minutes]);

  // 거버넌스 KPI 지표
  const stats = useMemo(() => {
    const total = minutes.length;
    const passed = minutes.filter(m => m.resolution_status === '원안가결' || m.resolution_status === '수정가결').length;
    const signedCount = minutes.filter(m => m.is_signed).length;
    const pendingActions = allActionItemsExtracted.filter(a => a.status !== '완료').length;
    const overdueActions = allActionItemsExtracted.filter(a => a.isOverdue).length;

    return {
      total,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      signRate: total > 0 ? Math.round((signedCount / total) * 100) : 0,
      pendingActions,
      overdueActions
    };
  }, [minutes, allActionItemsExtracted]);

  return (
    <div className="flex flex-col h-full w-full bg-white font-sans text-zinc-900 text-[12px] select-none">
      
      {/* =========================================================================
          [1] 공직 감사원 규격 거버넌스 헤더 (100% 풀 와이드)
          ========================================================================= */}
      <div className="w-full bg-zinc-950 text-zinc-100 px-6 py-3.5 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0 border-b border-zinc-800">
        
        <div className="flex flex-wrap items-center gap-5 w-full xl:w-auto">
          <div className="flex items-center gap-2.5 pr-5 border-r border-zinc-800 shrink-0">
            <span className="font-mono text-[10px] font-black tracking-widest text-zinc-400 uppercase bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">BOARD AUDIT</span>
            <span className="font-black text-[15px] text-white tracking-tight">의결 회의록 총람 (Board Minutes)</span>
          </div>

          <div className="flex flex-wrap items-center gap-5 font-mono text-[11.5px] font-bold">
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[9.5px] uppercase tracking-wider">상정 의안 총수</span>
              <span className="text-white text-[15px] leading-tight">{stats.total}건</span>
            </div>
            <span className="w-px h-6 bg-zinc-800 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[9.5px] uppercase tracking-wider">가결 통과율</span>
              <span className="text-emerald-400 text-[15px] leading-tight">{stats.passRate}%</span>
            </div>
            <span className="w-px h-6 bg-zinc-800 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[9.5px] uppercase tracking-wider">공식 직인 날인율</span>
              <span className="text-zinc-200 text-[15px] leading-tight">{stats.signRate}%</span>
            </div>
            <span className="w-px h-6 bg-zinc-800 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[9.5px] uppercase tracking-wider">후속 미결 과제</span>
              <span className="text-amber-400 text-[15px] leading-tight">
                {stats.pendingActions}건 {stats.overdueActions > 0 && <b className="text-rose-400 text-[11px]">({stats.overdueActions}건 지연)</b>}
              </span>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 & 글로벌 액션 버튼군 */}
        <div className="flex items-center gap-2.5 w-full xl:w-auto overflow-x-auto hide-scrollbar shrink-0">
          <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[11px] font-bold">
            <button 
              onClick={() => setActiveTab('archive')} 
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${activeTab === 'archive' ? 'bg-zinc-800 text-white font-black' : 'text-zinc-400 hover:text-white'}`}
            >
              의사록 피드
            </button>
            <button 
              onClick={() => setActiveTab('analytics')} 
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${activeTab === 'analytics' ? 'bg-zinc-800 text-white font-black' : 'text-zinc-400 hover:text-white'}`}
            >
              의결 분석표
            </button>
            <button 
              onClick={() => setActiveTab('actions')} 
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${activeTab === 'actions' ? 'bg-zinc-800 text-white font-black' : 'text-zinc-400 hover:text-white'}`}
            >
              실행 마스터 보드
            </button>
            <button 
              onClick={() => setActiveTab('report')} 
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${activeTab === 'report' ? 'bg-zinc-800 text-white font-black' : 'text-zinc-400 hover:text-white'}`}
            >
              공문서 총람 편철
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto xl:ml-0">
            <button 
              onClick={exportMinutesCSV} 
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              title="의안 목록 CSV 다운로드"
            >
              <SvgDownload /> CSV 추출
            </button>
            <button 
              onClick={handleCopyMeetingBrief} 
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <SvgCopy /> 브리핑 복사
            </button>
            <button 
              onClick={() => window.print()} 
              className="px-3.5 py-1.5 bg-white text-zinc-950 font-black rounded-lg text-[11px] hover:bg-zinc-100 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <SvgPrint /> 인쇄 / PDF
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          [탭 1] 🏛️ 풀 와이드 공식 의사록 아카이브 뷰
          ========================================================================= */}
      {activeTab === 'archive' && (
        <div className="flex-1 w-full flex flex-col min-h-0 bg-white overflow-hidden">
          
          {/* 모바일 서브 탭 스위처 */}
          <div className="flex lg:hidden bg-zinc-100 border-b border-zinc-200 p-1 shrink-0">
            <button onClick={() => setMobileSubMode('feed')} className={`flex-1 py-1.5 rounded-md text-[11.5px] font-bold transition-all ${mobileSubMode === 'feed' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500'}`}>의사록 피드</button>
            <button onClick={() => setMobileSubMode('write')} className={`flex-1 py-1.5 rounded-md text-[11.5px] font-bold transition-all ${mobileSubMode === 'write' ? 'bg-zinc-900 text-white shadow-2xs' : 'text-zinc-500'}`}>+ 안건 상정</button>
          </div>

          <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden bg-zinc-100/40">
            
            {/* 좌측: 안건 상정 & 공문서 작성 폼 (5 span) */}
            <div className={`lg:col-span-5 p-6 border-r border-zinc-200 bg-white overflow-y-auto hide-scrollbar shadow-2xs z-10 ${mobileSubMode === 'write' ? 'block' : 'hidden lg:block'}`}>
              <div className="border-b border-zinc-200 pb-3 mb-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-zinc-900 text-[15px] flex items-center gap-2">
                    <SvgPlus /> 공식 의안 상정 및 결의 등록
                  </h4>
                  {mobileSubMode === 'write' && (
                    <button onClick={() => setMobileSubMode('feed')} className="lg:hidden text-[11px] text-zinc-600 font-bold bg-zinc-100 px-2 py-1 rounded">← 목록으로</button>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                  의안 번호가 공식 채번되며, 정족수 검증 및 결의 주문이 영구 아카이빙됩니다[cite: 37].
                </p>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-[12px]">
                
                {/* 일자 & 회의체 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-black text-zinc-400 uppercase tracking-wider mb-1 text-[10px]">회의 일자 <span className="text-rose-500">*</span></label>
                    <input 
                      type="date" 
                      value={form.meeting_date} 
                      onChange={e => setForm({...form, meeting_date: e.target.value})} 
                      className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-2.5 rounded-lg font-mono font-bold outline-none focus:border-zinc-900 transition-colors cursor-pointer shadow-2xs" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block font-black text-zinc-400 uppercase tracking-wider mb-1 text-[10px]">회의체 / 위원회 <span className="text-rose-500">*</span></label>
                    <input 
                      list="dept-options" 
                      value={form.department} 
                      onChange={e => setForm({...form, department: e.target.value})} 
                      placeholder="위원회 명칭..."
                      className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-2.5 rounded-lg font-bold outline-none focus:border-zinc-900 transition-colors shadow-2xs"
                      required
                    />
                    <datalist id="dept-options">
                      {dynamicDepartments.map(d => <option key={d} value={d} />)}
                    </datalist>
                  </div>
                </div>

                {/* 의안번호 & 의결상태 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-black text-zinc-400 uppercase tracking-wider mb-1 text-[10px]">공문서 의안 번호</label>
                    <input 
                      type="text" 
                      value={form.doc_no} 
                      onChange={e => setForm({...form, doc_no: e.target.value})} 
                      placeholder="미입력 시 자동 채번" 
                      className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-2.5 rounded-lg font-mono font-bold text-zinc-700 outline-none focus:border-zinc-900 transition-colors shadow-2xs placeholder:font-sans placeholder:font-medium placeholder:text-zinc-400" 
                    />
                  </div>
                  <div>
                    <label className="block font-black text-zinc-400 uppercase tracking-wider mb-1 text-[10px]">의결 상태 <span className="text-rose-500">*</span></label>
                    <select 
                      value={form.resolution_status} 
                      onChange={e => setForm({...form, resolution_status: e.target.value})} 
                      className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-2.5 rounded-lg font-bold outline-none cursor-pointer focus:border-zinc-900 transition-colors shadow-2xs text-zinc-900"
                    >
                      {RESOLUTION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* 안건 제목 */}
                <div>
                  <label className="block font-black text-zinc-400 uppercase tracking-wider mb-1 text-[10px]">안건 심의 제목 <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    value={form.title} 
                    onChange={e => setForm({...form, title: e.target.value})} 
                    placeholder="예: 2026년도 상반기 목회 사역계획 및 추가경정예산안 심의의 건" 
                    className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-2.5 rounded-lg font-black text-zinc-900 outline-none focus:border-zinc-900 transition-colors shadow-2xs placeholder:font-medium placeholder:text-zinc-400" 
                    required 
                  />
                </div>

                {/* 🌟 법적 정족수 검증 & 표결 카운터 블록 */}
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 shadow-2xs space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-black text-zinc-900 text-[11.5px]">정족수 대사 및 표결 명세 (Quorum & Vote)</label>
                    <span className={`px-2 py-0.2 rounded text-[10px] font-black border flex items-center gap-1 ${
                      quorumValidation.isQuorumMet && quorumValidation.isVotePassed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {quorumValidation.isQuorumMet && quorumValidation.isVotePassed ? <><SvgShieldCheck /> 정족수 적법 충족</> : '정족수 결격 주의'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-2 border-b border-zinc-200">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold block mb-1">재적 위원수 (총원)</span>
                      <input 
                        type="number" 
                        value={form.total_eligible} 
                        onChange={e => setForm({...form, total_eligible: e.target.value})} 
                        className="w-full border border-zinc-300 bg-white p-2 rounded-md font-mono font-bold text-center outline-none" 
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold block mb-1">출석 위원수 (의사정족)</span>
                      <input 
                        type="number" 
                        value={form.attendees_count} 
                        onChange={e => setForm({...form, attendees_count: e.target.value})} 
                        className="w-full border border-zinc-300 bg-white p-2 rounded-md font-mono font-bold text-center outline-none" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] text-emerald-700 font-bold block mb-1">찬성표</span>
                      <input type="number" value={form.votes_for} onChange={e => setForm({...form, votes_for: e.target.value})} className="w-full border border-zinc-300 bg-white p-2 rounded-md font-mono font-black text-emerald-600 outline-none text-center" />
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-700 font-bold block mb-1">반대표</span>
                      <input type="number" value={form.votes_against} onChange={e => setForm({...form, votes_against: e.target.value})} className="w-full border border-zinc-300 bg-white p-2 rounded-md font-mono font-black text-rose-600 outline-none text-center" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold block mb-1">기권표</span>
                      <input type="number" value={form.votes_abstain} onChange={e => setForm({...form, votes_abstain: e.target.value})} className="w-full border border-zinc-300 bg-white p-2 rounded-md font-mono font-black text-zinc-600 outline-none text-center" />
                    </div>
                  </div>
                </div>

                {/* 참석자 & 날인위원 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-black text-zinc-400 uppercase tracking-wider mb-1 text-[10px]">출석자 명단 <span className="text-rose-500">*</span></label>
                    <input type="text" value={form.attendees} onChange={e => setForm({...form, attendees: e.target.value})} placeholder="예: 당회원 7인" className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-2.5 rounded-lg outline-none font-bold shadow-2xs" required />
                  </div>
                  <div>
                    <label className="block font-black text-zinc-400 uppercase tracking-wider mb-1 text-[10px]">직인 날인위원</label>
                    <input type="text" value={form.signed_officers} onChange={e => setForm({...form, signed_officers: e.target.value})} placeholder="예: 당회장, 서기장로" className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-2.5 rounded-lg outline-none font-bold shadow-2xs" />
                  </div>
                </div>

                {/* 결의 주문 */}
                <div>
                  <label className="block font-black text-zinc-400 uppercase tracking-wider mb-1 text-[10px]">결의 주문 (Official Resolution) <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    value={form.resolution} 
                    onChange={e => setForm({...form, resolution: e.target.value})} 
                    placeholder="예: 출석 당회원 전원 일치로 원안 통과하고, 예산 집행을 재정부에 위임 승인함" 
                    className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-2.5 rounded-lg font-black text-zinc-900 outline-none focus:border-zinc-900 transition-colors shadow-2xs" 
                    required 
                  />
                </div>

                {/* 토의 전문 기록 */}
                <div>
                  <label className="block font-black text-zinc-400 uppercase tracking-wider mb-1 text-[10px]">심의 과정 및 토의 전문 <span className="text-rose-500">*</span></label>
                  <textarea 
                    rows={5} 
                    value={form.content} 
                    onChange={e => setForm({...form, content: e.target.value})} 
                    className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-3 rounded-lg leading-relaxed outline-none focus:border-zinc-900 transition-colors resize-none font-medium text-zinc-800 shadow-2xs" 
                    placeholder="심의 쟁점 사항, 찬반 토론 요지 및 최종 합의 도출 과정을 상세히 기술하세요..." 
                    required 
                  />
                </div>

                {/* 후속 실행 과제 (Action Items) */}
                <div className="space-y-2.5 pt-3 border-t border-zinc-200">
                  <div className="flex justify-between items-center">
                    <label className="font-black text-zinc-900 text-[12.5px]">후속 실행 과제 분배 (Action Items Tracker)</label>
                    <button type="button" onClick={handleAddActionRow} className="px-2.5 py-1 bg-white border border-zinc-300 rounded-md text-[10.5px] font-bold text-zinc-700 hover:bg-zinc-50 cursor-pointer shadow-2xs">+ 과제 추가</button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto hide-scrollbar bg-zinc-50 p-2 rounded-xl border border-zinc-200">
                    {actionItems.map((act, idx) => (
                      <div key={act.id} className="bg-white p-2.5 border border-zinc-200 rounded-lg space-y-2 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10.5px] font-bold text-zinc-400 w-4">{idx + 1}.</span>
                          <input type="text" value={act.task} onChange={e => handleActionChange(act.id, 'task', e.target.value)} placeholder="실행 과제 명칭" className="flex-1 border border-zinc-200 bg-zinc-50 px-2.5 py-1 rounded-md text-[11.5px] font-bold outline-none focus:border-zinc-900" />
                          <button type="button" onClick={() => handleRemoveActionRow(act.id)} className="text-zinc-400 hover:text-rose-600 p-1 cursor-pointer"><SvgClose /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pl-6">
                          <input type="text" value={act.assignee} onChange={e => handleActionChange(act.id, 'assignee', e.target.value)} placeholder="실무 책임자" className="border border-zinc-200 bg-zinc-50 px-2 py-1 rounded-md text-[11px] font-bold outline-none text-center" />
                          <input type="date" value={act.dueDate} onChange={e => handleActionChange(act.id, 'dueDate', e.target.value)} className="border border-zinc-200 bg-zinc-50 px-2 py-1 rounded-md text-[10.5px] font-mono font-bold text-zinc-600 outline-none cursor-pointer" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button type="submit" className="w-full py-3 bg-zinc-900 text-white font-black hover:bg-zinc-800 rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all text-[12.5px]">
                    공식 의안 확정 및 아카이빙 기장
                  </button>
                </div>
              </form>
            </div>

            {/* 우측: 풀 와이드 공식 의사록 열람 피드 (7 span) */}
            <div className={`lg:col-span-7 flex flex-col min-h-0 overflow-hidden ${mobileSubMode === 'feed' ? 'flex' : 'hidden lg:flex'}`}>
              
              {/* 필터 바 */}
              <div className="px-6 py-2.5 bg-zinc-50 border-b border-zinc-200 flex flex-wrap justify-between items-center gap-2.5 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex bg-zinc-200/70 rounded-md p-0.5 text-[10.5px] font-bold">
                    {['ALL', 'weekly', 'monthly', 'quarterly', 'yearly'].map(p => (
                      <button key={p} onClick={() => setFilterPeriod(p)} className={`px-2.5 py-1 rounded transition-colors ${filterPeriod === p ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600'}`}>
                        {p === 'ALL' ? '전체' : p === 'weekly' ? '주간' : p === 'monthly' ? '월간' : p === 'quarterly' ? '분기' : '연간'}
                      </button>
                    ))}
                  </div>

                  <select 
                    value={filterDept} 
                    onChange={e => setFilterDept(e.target.value)} 
                    className="border border-zinc-300 bg-white px-2.5 py-1 rounded-md text-[11px] font-bold outline-none cursor-pointer text-zinc-800 shadow-2xs"
                  >
                    <option value="ALL">전체 회의체</option>
                    {dynamicDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>

                  <select 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value)} 
                    className="border border-zinc-300 bg-white px-2.5 py-1 rounded-md text-[11px] font-bold outline-none cursor-pointer text-zinc-800 shadow-2xs"
                  >
                    <option value="ALL">전체 의결 상태</option>
                    {RESOLUTION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="relative w-full sm:w-64">
                  <span className="absolute left-2.5 top-2 text-zinc-400 pointer-events-none"><SvgSearch /></span>
                  <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    placeholder="의안번호, 안건, 결의내용..." 
                    className="w-full pl-8 pr-3 py-1.5 border border-zinc-300 bg-white rounded-md text-[11px] outline-none focus:border-zinc-900 font-bold placeholder:text-zinc-400 shadow-2xs transition-colors" 
                  />
                </div>
              </div>

              {/* 회의록 카드 스트림 (풀 와이드 고밀도) */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5 hide-scrollbar">
                {filteredMinutes.length === 0 ? (
                  <div className="text-center py-24 bg-white border border-zinc-200 rounded-xl text-zinc-400 font-bold text-[13px] shadow-2xs">
                    일치하는 공식 의사록이 없습니다.
                  </div>
                ) : (
                  filteredMinutes.map(m => {
                    const totalVotes = (m.votes_for || 0) + (m.votes_against || 0) + (m.votes_abstain || 0);
                    const forPct = totalVotes > 0 ? Math.round(((m.votes_for || 0) / totalVotes) * 100) : 100;

                    return (
                      <div 
                        key={m.id} 
                        onClick={() => setSelectedMinute(m)} 
                        className="bg-white border border-zinc-200 rounded-xl p-4.5 space-y-3 shadow-2xs hover:border-zinc-400 transition-all cursor-pointer group"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="bg-zinc-900 text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold shadow-2xs shrink-0">
                                {m.doc_no || m.department}
                              </span>
                              <span className={`px-2 py-0.2 rounded font-black text-[10px] border shrink-0 ${
                                m.resolution_status === '원안가결' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                m.resolution_status === '수정가결' ? 'bg-zinc-100 text-zinc-800 border-zinc-300' :
                                m.resolution_status === '부결' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                              }`}>
                                {m.resolution_status}
                              </span>
                              {m.is_signed ? (
                                <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.2 rounded font-black flex items-center gap-1 shrink-0">
                                  <SvgCheck /> 공식 직인 날인완료
                                </span>
                              ) : (
                                <span className="text-[10px] bg-zinc-100 text-zinc-500 border border-zinc-200 px-2 py-0.2 rounded font-bold shrink-0">
                                  날인 대기
                                </span>
                              )}
                            </div>
                            <h5 className="font-black text-[15px] text-zinc-900 leading-snug pt-0.5 truncate">{m.title}</h5>
                          </div>
                          <span className="text-[11px] text-zinc-500 font-mono font-bold shrink-0">{m.meeting_date}</span>
                        </div>

                        {/* 결의 주문 요약 */}
                        <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg text-[12px] font-sans">
                          <strong className="text-zinc-500 mr-2 text-[10.5px] uppercase tracking-wider block sm:inline">결의 주문:</strong>
                          <span className="text-zinc-900 font-black">{m.resolution || m.content.substring(0, 100)}</span>
                        </div>

                        {/* 표결 게이지 */}
                        {totalVotes > 0 && (
                          <div className="space-y-1 pt-0.5">
                            <div className="flex justify-between text-[10.5px] font-mono text-zinc-500 font-bold">
                              <span>표결 결과: 찬성 {m.votes_for || 0} / 반대 {m.votes_against || 0} / 기권 {m.votes_abstain || 0}</span>
                              <strong className={forPct >= 50 ? 'text-zinc-900' : 'text-rose-600'}>{forPct}% 가결</strong>
                            </div>
                            <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden flex">
                              <div className="bg-zinc-900 h-full" style={{ width: `${forPct}%` }} />
                              <div className="bg-rose-500 h-full" style={{ width: `${100 - forPct}%` }} />
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-zinc-100 text-[10.5px]">
                          <span className="text-zinc-500 font-mono font-bold truncate max-w-[280px]">서명위원: {m.signed_officers || '당회장, 서기'}</span>
                          <span className="text-zinc-400 font-bold group-hover:text-zinc-900 transition-colors flex items-center gap-1">
                            공문서 전문 및 전자 인영 확인 →
                          </span>
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
          [탭 2] 🏛️ 풀 와이드 의결 안건 분석 매트릭스
          ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="flex-1 w-full overflow-y-auto px-6 py-5 bg-zinc-100/40 space-y-4">
          <div className="w-full bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs space-y-1">
            <h4 className="font-black text-zinc-900 text-[14.5px]">회의체별 의결 안건 분석 매트릭스 (Resolution Matrix)</h4>
            <p className="text-[11.5px] text-zinc-500 font-medium">당회 및 위원회별 의안 가결률, 부결률, 보류 추이를 공공 감사 기준으로 대사합니다[cite: 37].</p>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {dynamicDepartments.map(dept => {
              const deptMinutes = minutes.filter(m => m.department === dept);
              const passed = deptMinutes.filter(m => m.resolution_status === '원안가결' || m.resolution_status === '수정가결').length;
              const rejected = deptMinutes.filter(m => m.resolution_status === '부결').length;
              const pending = deptMinutes.length - passed - rejected;
              const rate = deptMinutes.length > 0 ? Math.round((passed / deptMinutes.length) * 100) : 0;

              return (
                <div key={dept} className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4 shadow-2xs hover:border-zinc-400 transition-colors">
                  <div className="flex justify-between items-center">
                    <h5 className="font-black text-[15px] text-zinc-900 tracking-tight">{dept}</h5>
                    <span className="font-mono text-[11px] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded font-bold border border-zinc-200">
                      총 {deptMinutes.length}건 상정
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-center">
                    <div><span className="text-zinc-500 font-bold block text-[10px] mb-0.5">가결</span><strong className="text-zinc-900 text-[15px]">{passed}건</strong></div>
                    <div><span className="text-zinc-500 font-bold block text-[10px] mb-0.5">부결</span><strong className="text-rose-600 text-[15px]">{rejected}건</strong></div>
                    <div><span className="text-zinc-500 font-bold block text-[10px] mb-0.5">보류/조건</span><strong className="text-amber-700 text-[15px]">{pending}건</strong></div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold text-zinc-600">
                      <span>가결 통과율 (Pass Rate)</span><strong className="text-zinc-900 font-mono">{rate}%</strong>
                    </div>
                    <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-zinc-900 h-full" style={{ width: `${rate}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          [탭 3] 🏛️ 풀 와이드 실행 과제 마스터 보드
          ========================================================================= */}
      {activeTab === 'actions' && (
        <div className="flex-1 w-full overflow-y-auto px-6 py-5 bg-zinc-100/40 space-y-4">
          <div className="w-full bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs space-y-1">
            <h4 className="font-black text-zinc-900 text-[14.5px]">전사 회의 후속 실행 과제 마스터 트래커 (Action Items)</h4>
            <p className="text-[11.5px] text-zinc-500 font-medium">의안에서 도출된 실무 과제의 이행 여부와 기한 초과(Overdue) 리스크를 실시간 관리합니다[cite: 37].</p>
          </div>

          <div className="w-full space-y-2.5">
            {allActionItemsExtracted.length === 0 ? (
              <div className="text-center py-20 bg-white border border-zinc-200 rounded-xl text-zinc-400 font-bold text-[13px]">
                등록된 후속 실행 과제가 없습니다.
              </div>
            ) : (
              allActionItemsExtracted.map((item) => {
                const isDone = item.status === '완료';
                return (
                  <div 
                    key={item.uniqueKey} 
                    onClick={() => handleToggleActionStatus(item.meetingId, item.id, item.status)} 
                    className={`w-full bg-white border rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all cursor-pointer shadow-2xs group ${
                      item.isOverdue ? 'border-rose-300 bg-rose-50/20' : 'border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    <div className="space-y-1 overflow-hidden flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-zinc-900 text-white font-mono text-[10px] px-2 py-0.2 rounded font-bold">
                          {item.docNo || item.department}
                        </span>
                        <span className="text-zinc-600 text-[11px] font-bold truncate">
                          {item.meetingTitle} <span className="font-mono text-[10px] text-zinc-400 ml-1">({item.meetingDate})</span>
                        </span>
                        {item.isOverdue && (
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-rose-100 text-rose-700">
                            기한 초과
                          </span>
                        )}
                      </div>
                      <div className={`font-black text-[13.5px] ${isDone ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>
                        {item.task}
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 text-[11.5px] font-mono shrink-0">
                      <div className="text-zinc-600 font-bold">
                        담당: <strong className="text-zinc-900">{item.assignee || '미지정'}</strong> 
                        {item.dueDate && <span className="text-zinc-400 ml-1">({item.dueDate})</span>}
                      </div>
                      <span className={`px-2.5 py-1 rounded font-black text-[11px] border ${
                        isDone 
                          ? 'bg-zinc-900 text-white border-zinc-900' 
                          : 'bg-white text-zinc-700 border-zinc-300'
                      }`}>
                        {item.status || '진행중'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          [탭 4] 🏛️ 풀 와이드 공문서 제본 및 총람 인쇄 뷰
          ========================================================================= */}
      {activeTab === 'report' && (
        <div className="flex-1 w-full overflow-y-auto px-6 py-5 bg-zinc-100/40">
          <div className="w-full bg-white border border-zinc-200 rounded-xl p-8 shadow-2xs space-y-6">
            
            <div className="flex justify-between items-center border-b border-zinc-200 pb-4">
              <div>
                <h4 className="font-black text-zinc-900 text-[16px] tracking-tight">공식 의사록 총괄 제본 편철 (Official Docket)</h4>
                <p className="text-[11.5px] text-zinc-500 mt-1 font-medium">교단 총회 감사 및 당회 영구 보존용 공문서 규격입니다[cite: 37].</p>
              </div>
              <button 
                onClick={() => window.print()} 
                className="px-4 py-2 bg-zinc-900 text-white font-black rounded-lg text-[11.5px] hover:bg-zinc-800 cursor-pointer shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <SvgPrint /> 인쇄 / PDF 저장
              </button>
            </div>

            <div className="w-full space-y-6 text-zinc-900 font-sans">
              <div className="text-center space-y-2 py-6 border-b-2 border-zinc-900">
                <h2 className="text-[24px] font-black tracking-widest text-zinc-900 uppercase">
                  교 회 사 역 공 식 의 사 록 총 람
                </h2>
                <div className="text-[11.5px] text-zinc-500 font-mono font-bold">
                  발행일자: {new Date().toLocaleDateString()} | 수록 의안: {minutes.length}건
                </div>
              </div>

              <div className="w-full space-y-5">
                {minutes.map((m, idx) => (
                  <div key={m.id} className="w-full p-5 bg-white border border-zinc-300 rounded-xl space-y-3 text-[12px] shadow-2xs">
                    <div className="flex justify-between items-center font-bold border-b border-zinc-200 pb-2">
                      <span className="text-[14.5px] text-zinc-900 font-black">
                        {idx + 1}. [{m.doc_no || m.department}] {m.title}
                      </span>
                      <span className="font-mono text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">{m.meeting_date}</span>
                    </div>

                    <div className="text-zinc-700 font-mono text-[11.5px] flex justify-between font-bold bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                      <span>출석: {m.attendees} (재적 {m.total_eligible || '-'}인 중 {m.attendees_count || '-'}인 출석)</span>
                      <span>의결: <strong className="text-zinc-900">{m.resolution_status}</strong> (찬성 {m.votes_for || 0} / 반대 {m.votes_against || 0})</span>
                    </div>

                    {m.resolution && (
                      <div className="bg-zinc-100 p-3 border border-zinc-300 rounded-lg font-black text-zinc-900 text-[12.5px]">
                        [결의 주문] {m.resolution}
                      </div>
                    )}

                    <p className="text-zinc-800 leading-relaxed whitespace-pre-wrap font-medium py-1">
                      {m.content}
                    </p>

                    <div className="flex justify-between items-center text-[11px] text-zinc-500 font-mono font-bold pt-3 border-t border-zinc-200">
                      <span>날인위원: {m.signed_officers}</span>
                      <span className={m.is_signed ? 'text-zinc-900 font-black' : 'text-zinc-400'}>
                        {m.is_signed ? '✓ 공식 직인 날인완료' : '미날인'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          [모달] 공식 의사록 정밀 열람 & 전자 직인 인영 날인 모달
          ========================================================================= */}
      {selectedMinute && (
        <div className="fixed inset-0 z-[400] bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-4xl bg-white border border-zinc-300 rounded-2xl p-6 shadow-2xl font-sans flex flex-col max-h-[92vh] overflow-hidden">
            
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="bg-zinc-900 text-white font-mono text-[10.5px] px-2 py-0.5 rounded font-bold">
                  {selectedMinute.doc_no || selectedMinute.department}
                </span>
                <h3 className="text-[15.5px] font-black text-zinc-900 tracking-tight">공식 의사록 및 전자 직인 확인</h3>
              </div>
              <button onClick={() => setSelectedMinute(null)} className="text-zinc-400 hover:text-zinc-900 p-1 cursor-pointer"><SvgClose /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 px-1">
              
              {/* 공문서 헤더 및 인영 날인 도장 */}
              <div className="flex justify-between items-start border-b border-zinc-200 pb-4">
                <div className="space-y-1">
                  <h2 className="text-[19px] font-black text-zinc-900 tracking-tight">{selectedMinute.title}</h2>
                  <div className="text-[11.5px] text-zinc-500 font-mono font-bold flex items-center gap-2">
                    <span className="bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 text-zinc-800">{selectedMinute.department}</span>
                    <span>회의일자: {selectedMinute.meeting_date}</span>
                  </div>
                </div>

                {/* 🌟 감사원 공직 인영 직인 도장 디자인 */}
                <div className="text-center shrink-0 w-24 flex justify-end">
                  {selectedMinute.is_signed ? (
                    <div className="border-[3px] border-zinc-900 text-zinc-900 rounded-full w-16 h-16 flex flex-col items-center justify-center font-black text-[12px] leading-tight rotate-[-8deg] shadow-2xs bg-white">
                      <span className="tracking-widest">승인</span>
                      <span className="tracking-widest">인영</span>
                    </div>
                  ) : (
                    <div className="border-[2px] border-dashed border-zinc-300 text-zinc-400 rounded-full w-16 h-16 flex items-center justify-center text-[11px] font-bold bg-zinc-50">
                      직인대기
                    </div>
                  )}
                </div>
              </div>

              {/* 기본 대사 테이블 */}
              <div className="rounded-xl border border-zinc-300 overflow-hidden text-[12px]">
                <table className="w-full border-collapse bg-white">
                  <tbody>
                    <tr className="border-b border-zinc-200">
                      <td className="w-28 bg-zinc-50 p-3 font-bold text-zinc-500 border-r border-zinc-200 text-center uppercase tracking-wider text-[10.5px]">의결 결과</td>
                      <td className="p-3 border-r border-zinc-200 font-black text-zinc-900">{selectedMinute.resolution_status}</td>
                      <td className="w-28 bg-zinc-50 p-3 font-bold text-zinc-500 border-r border-zinc-200 text-center uppercase tracking-wider text-[10.5px]">표결 수치</td>
                      <td className="p-3 font-mono font-bold text-zinc-800">
                        찬성 {selectedMinute.votes_for || 0} / 반대 {selectedMinute.votes_against || 0} / 기권 {selectedMinute.votes_abstain || 0}
                      </td>
                    </tr>
                    <tr className="border-b border-zinc-200">
                      <td className="bg-zinc-50 p-3 font-bold text-zinc-500 border-r border-zinc-200 text-center uppercase tracking-wider text-[10.5px]">출석 위원</td>
                      <td colSpan={3} className="p-3 font-bold text-zinc-800">{selectedMinute.attendees}</td>
                    </tr>
                    <tr className="border-b border-zinc-200">
                      <td className="bg-zinc-50 p-3 font-bold text-zinc-500 border-r border-zinc-200 text-center uppercase tracking-wider text-[10.5px]">날인 위원</td>
                      <td colSpan={3} className="p-3 font-mono font-bold text-zinc-600">{selectedMinute.signed_officers}</td>
                    </tr>
                    <tr>
                      <td className="bg-zinc-50 p-3 font-bold text-zinc-700 border-r border-zinc-200 text-center uppercase tracking-wider text-[10.5px]">결의 주문</td>
                      <td colSpan={3} className="p-3 font-black text-zinc-900 bg-zinc-50/50 leading-relaxed">{selectedMinute.resolution}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 토의 전문 */}
              <div className="space-y-1.5 pt-1">
                <span className="font-black text-zinc-900 text-[13px] block">심의 및 토의 전문 기록</span>
                <p className="text-[12.5px] text-zinc-800 leading-relaxed whitespace-pre-wrap bg-zinc-50 p-4 rounded-xl border border-zinc-200 font-medium">
                  {selectedMinute.content}
                </p>
              </div>

              {/* 후속 조치 목록 */}
              {selectedMinute.action_items && selectedMinute.action_items.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-zinc-200">
                  <span className="font-black text-zinc-900 text-[13px] block">후속 실행 과제 이행 상태</span>
                  <div className="space-y-1.5">
                    {selectedMinute.action_items.map(act => (
                      <div 
                        key={act.id} 
                        onClick={() => handleToggleActionStatus(selectedMinute.id, act.id, act.status)} 
                        className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-[11.5px] cursor-pointer hover:border-zinc-400 hover:bg-white transition-colors shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center font-bold text-[9px] ${
                            act.status === '완료' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white border-zinc-300'
                          }`}>
                            {act.status === '완료' ? '✓' : ''}
                          </span>
                          <span className={`font-bold ${act.status === '완료' ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>{act.task}</span>
                        </div>
                        <span className="text-zinc-500 font-mono font-bold text-[10.5px] bg-white px-2 py-0.5 rounded border border-zinc-200">
                          {act.assignee || '미지정'} {act.dueDate && <span className="ml-1 text-zinc-400">({act.dueDate})</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* 하단 모달 액션 */}
            <div className="flex justify-between items-center pt-4 border-t border-zinc-200 shrink-0 mt-2">
              <button 
                onClick={() => handleDelete(selectedMinute.id)} 
                className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-zinc-300 hover:border-rose-300 rounded-lg font-bold text-[11.5px] cursor-pointer shadow-2xs transition-colors"
              >
                의사록 완전 폐기
              </button>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()} 
                  className="px-4 py-2 bg-white hover:bg-zinc-50 border border-zinc-300 rounded-lg font-bold text-[11.5px] text-zinc-700 cursor-pointer shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <SvgPrint /> 인쇄
                </button>
                <button 
                  onClick={() => handleToggleSign(selectedMinute.id, selectedMinute.is_signed)} 
                  className={`px-5 py-2 rounded-lg font-black text-[11.5px] text-white cursor-pointer shadow-2xs active:scale-95 transition-all ${
                    selectedMinute.is_signed ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-zinc-950 hover:bg-zinc-800'
                  }`}
                >
                  {selectedMinute.is_signed ? '전자 직인 날인 취소' : '공식 전자 직인 날인'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
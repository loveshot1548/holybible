// src/components/admin/erp/ErpMeetingMinutes.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';

// =========================================================================
// 🏛️ 교회 거버넌스 표준 의결 상태 및 회의체 상수
// =========================================================================
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

// 원클릭 표준 의사록 서식 프리셋
const MINUTE_TEMPLATES = [
  {
    label: '정기당회 표준안',
    meeting_type: '정기당회',
    department: '당회',
    title: '월례 정기당회 목양 현안 및 행정 안건 심의의 건',
    total_eligible: 9,
    attendees_count: 9,
    attendees: '당회장 외 시무장로 전원',
    signed_officers: '당회장(담임목사), 당회서기',
    resolution_status: '원안가결',
    resolution: '출석 당회원 전원 찬성(만장일치)으로 상정 안건을 원안대로 가결하다.',
    content: `1. 개회선언: 당회장이 기도로 개회를 선언하다.\n2. 성수보고: 서기가 재적 과반 이상 출석으로 의사정족수가 충족되었음을 보고하다.\n3. 전회의록 낭독: 전회 회의록을 낭독하고 원안대로 받기로 하다.\n4. 안건심의:\n  - 제1호 의안: 월간 목양 및 심방 사역 보고의 건\n  - 제2호 의안: 부서별 특별 사역 지원의 건\n5. 폐회: 합심 기도 후 당회장의 축도로 폐회하다.`,
    defaultTask: '당회 결의 사항 각 위원회 시달 및 주보 공고'
  },
  {
    label: '제직회 예산/재정',
    meeting_type: '정기제직회',
    department: '제직회',
    title: '정기제직회 월간 세입·세출 결산 보고 및 사역 예산 심의의 건',
    total_eligible: 45,
    attendees_count: 38,
    attendees: '제직회원 38명 출석',
    signed_officers: '제직회장, 제직회서기, 회계',
    resolution_status: '원안가결',
    resolution: '재정부 결산 보고를 원안대로 승인하고 차월 사역 예산 집행을 가결하다.',
    content: `1. 예배 및 개회: 찬송과 기도 후 제직회장이 개회를 선언하다.\n2. 회계보고: 재정부 회계가 전월 세입·세출 결산 내역을 유인물과 같이 보고하니 박수로 받다.\n3. 안건토의: 각 부서별 사역 계획 및 예산 지출 품의안을 심의하고 원안대로 가결하다.\n4. 폐회: 주기도문으로 폐회하다.`,
    defaultTask: '제직회 승인 예산 재정부 원장 집행 반영'
  },
  {
    label: '공동의회 결산/예산',
    meeting_type: '공동의회',
    department: '공동의회',
    title: '정기 공동의회 회계연도 결산 승인 및 신년도 예산안 인준의 건',
    total_eligible: 150,
    attendees_count: 112,
    attendees: '등록 세례교인(입교인) 112명 출석',
    signed_officers: '공동의회장(담임목사), 공동의회서기',
    resolution_status: '원안가결',
    resolution: '당회가 제출한 결산안과 신년도 예산안을 출석 회원 만장일치로 인준 확정하다.',
    content: `1. 개회 및 회원점명: 의장이 개회를 선언하고 서기가 출석 회원을 보고하다.\n2. 감사보고: 감사위원장이 회계연도 재정 감사 결과 적법·적정함을 보고하다.\n3. 결산 및 예산 심의: 당회가 상정한 결산 보고서와 신년도 세입·세출 예산안을 만장일치로 통과시키다.\n4. 폐회: 의장의 축도로 폐회하다.`,
    defaultTask: '확정 예산안 ERP 부서별 예산 통제 모듈 등록'
  },
  {
    label: '재정감사위원회',
    meeting_type: '재정감사위원회',
    department: '재정위원회',
    title: '반기 정기 회계 감사 및 적격증빙 대사 보고의 건',
    total_eligible: 5,
    attendees_count: 5,
    attendees: '감사위원 전원 및 재정부장 배석',
    signed_officers: '감사위원장, 감사위원, 재정부장',
    resolution_status: '원안가결',
    resolution: '복식부기 전표 및 합계잔액시산표, 통장 잔고증명서가 100% 일치함을 확인 승인하다.',
    content: `1. 감사범위: 회계연도 상반기 전체 수입/지출 결의서 및 금융기관 잔고 대사\n2. 감사소견: 모든 지출 전표에 적격 증빙이 첨부되어 있으며 대차평균이 완벽히 일치함을 확인함.\n3. 권고사항: 사역부서 예비비 집행 시 사전 품의 절차를 지속 준수할 것을 권고함.`,
    defaultTask: '감사필 직인 날인 및 당회 정기보고 상정'
  }
];

// =========================================================================
// ✒️ 엔터프라이즈 모노크롬 SVG 아이콘 세트 (Linear / Diligent Boards 규격)
// =========================================================================
const SvgSearch = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);
const SvgPrint = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.728 6.75H17.27m-10.542 0A2.25 2.25 0 004.5 9v6a2.25 2.25 0 002.25 2.25h10.5A2.25 2.25 0 0019.5 15V9a2.25 2.25 0 00-2.25-2.25m-10.542 0V4.5a2.25 2.25 0 012.25-2.25h6a2.25 2.25 0 012.25 2.25v2.25m-10.542 0h10.542" />
  </svg>
);
const SvgClose = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.3} stroke="currentColor" className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const SvgCheck = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);
const SvgPlus = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.3} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);
const SvgCopy = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
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
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
  </svg>
);
const SvgEdit = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

export default function ErpMeetingMinutes() {
  const [activeTab, setActiveTab] = useState('archive'); // 'archive' | 'analytics' | 'actions' | 'report'
  const [mobileSubMode, setMobileSubMode] = useState('feed'); // 'feed' | 'write'
  const [minutes, setMinutes] = useState([]);

  const [filterPeriod, setFilterPeriod] = useState('ALL');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // 실행 마스터 보드(탭 3) 전용 필터
  const [actionFilterStatus, setActionFilterStatus] = useState('ALL'); // 'ALL' | 'PENDING' | 'OVERDUE' | 'DONE'
  const [actionSearchTerm, setActionSearchTerm] = useState('');

  const [selectedMinute, setSelectedMinute] = useState(null);
  const [editingMinuteId, setEditingMinuteId] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const triggerToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }, []);

  // 공문서 서식 기본값
  const createDefaultForm = useCallback((dept = '당회') => ({
    meeting_date: new Date().toISOString().split('T')[0],
    meeting_type: '정기당회',
    department: dept,
    doc_no: '',
    title: '',
    total_eligible: 9,
    attendees_count: 7,
    attendees: '당회원 일동',
    signed_officers: '당회장(담임목사), 서기장로',
    resolution_status: '원안가결',
    resolution: '',
    content: '',
    votes_for: 7,
    votes_against: 0,
    votes_abstain: 0,
    is_signed: false
  }), []);

  const [form, setForm] = useState(() => createDefaultForm('당회'));

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

  useEffect(() => {
    fetchMinutes();
  }, [fetchMinutes]);

  // 동적 부서 및 회의체 목록
  const dynamicDepartments = useMemo(() => {
    const defaultDepts = ['당회', '제직회', '공동의회', '기획위원회', '예배위원회', '재정위원회', '인사위원회'];
    const dbDepts = minutes.map(m => m.department).filter(Boolean);
    return Array.from(new Set([...defaultDepts, ...dbDepts])).sort();
  }, [minutes]);

  // 정족수 실시간 감사 연산 (의사정족수: 재적 과반 / 의결정족수: 출석 과반)
  const quorumValidation = useMemo(() => {
    const eligible = Math.max(1, Number(form.total_eligible) || 1);
    const attended = Math.max(0, Number(form.attendees_count) || 0);
    const votesFor = Math.max(0, Number(form.votes_for) || 0);

    const isQuorumMet = attended > Math.floor(eligible / 2);
    const isVotePassed = votesFor > Math.floor(attended / 2);

    return {
      isQuorumMet,
      isVotePassed,
      quorumPercent: Math.min(100, Math.round((attended / eligible) * 100)),
      votePassPercent: attended > 0 ? Math.min(100, Math.round((votesFor / attended) * 100)) : 0
    };
  }, [form.total_eligible, form.attendees_count, form.votes_for]);

  // 원클릭 표준 의사록 템플릿 적용
  const handleApplyTemplate = (tpl) => {
    setForm(prev => ({
      ...prev,
      meeting_type: tpl.meeting_type,
      department: tpl.department,
      title: tpl.title,
      total_eligible: tpl.total_eligible,
      attendees_count: tpl.attendees_count,
      attendees: tpl.attendees,
      signed_officers: tpl.signed_officers,
      resolution_status: tpl.resolution_status,
      resolution: tpl.resolution,
      content: tpl.content,
      votes_for: tpl.attendees_count,
      votes_against: 0,
      votes_abstain: 0
    }));
    if (tpl.defaultTask) {
      setActionItems([
        { id: Date.now(), task: tpl.defaultTask, assignee: '담당간사', dueDate: '', status: '진행중' }
      ]);
    }
    triggerToast(`[${tpl.label}] 표준 공문서 서식이 자동 적용되었습니다.`);
  };

  // 기등록 의사록 수정 모드로 폼에 불러오기
  const handleEditMinute = (minute) => {
    setEditingMinuteId(minute.id);
    setForm({
      meeting_date: minute.meeting_date || new Date().toISOString().split('T')[0],
      meeting_type: minute.meeting_type || '정기당회',
      department: minute.department || '당회',
      doc_no: minute.doc_no || '',
      title: minute.title || '',
      total_eligible: Number(minute.total_eligible) || 9,
      attendees_count: Number(minute.attendees_count) || 7,
      attendees: minute.attendees || '',
      signed_officers: minute.signed_officers || '당회장, 서기',
      resolution_status: minute.resolution_status || '원안가결',
      resolution: minute.resolution || '',
      content: minute.content || '',
      votes_for: Number(minute.votes_for) || 0,
      votes_against: Number(minute.votes_against) || 0,
      votes_abstain: Number(minute.votes_abstain) || 0,
      is_signed: !!minute.is_signed
    });
    setActionItems(
      Array.isArray(minute.action_items) && minute.action_items.length > 0
        ? minute.action_items
        : [{ id: Date.now(), task: '', assignee: '', dueDate: '', status: '진행중' }]
    );
    setSelectedMinute(null);
    setActiveTab('archive');
    setMobileSubMode('write');
  };

  // 기등록 의사록 복제하여 새 안건으로 작성
  const handleDuplicateMinute = (minute) => {
    setEditingMinuteId(null);
    setForm({
      meeting_date: new Date().toISOString().split('T')[0],
      meeting_type: minute.meeting_type || '정기당회',
      department: minute.department || '당회',
      doc_no: '',
      title: `[차회 상정] ${minute.title || ''}`,
      total_eligible: Number(minute.total_eligible) || 9,
      attendees_count: Number(minute.attendees_count) || 7,
      attendees: minute.attendees || '',
      signed_officers: minute.signed_officers || '당회장, 서기',
      resolution_status: minute.resolution_status || '원안가결',
      resolution: minute.resolution || '',
      content: minute.content || '',
      votes_for: Number(minute.votes_for) || 0,
      votes_against: Number(minute.votes_against) || 0,
      votes_abstain: Number(minute.votes_abstain) || 0,
      is_signed: false
    });
    setSelectedMinute(null);
    setActiveTab('archive');
    setMobileSubMode('write');
    triggerToast('선택한 의사록 양식이 새 안건 작성 폼으로 복제되었습니다.');
  };

  const handleAddActionRow = () => {
    setActionItems(prev => [
      ...prev,
      { id: Date.now(), task: '', assignee: '', dueDate: '', status: '진행중' }
    ]);
  };

  const handleActionChange = (id, field, value) => {
    setActionItems(prev => prev.map(item => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleRemoveActionRow = (id) => {
    if (actionItems.length <= 1) return;
    setActionItems(prev => prev.filter(item => item.id !== id));
  };

  // 공식 의사록 기장 및 수정 아카이빙
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.department.trim()) return alert('회의체 명칭을 입력해주세요.');
    if (!form.title.trim() || !form.content.trim()) return alert('안건 제목과 심의 본문은 필수 입력 사항입니다.');

    const year = form.meeting_date.substring(0, 4);
    const countThisDept = minutes.filter(m => m.department === form.department.trim()).length + 1;
    const generatedDocNo =
      form.doc_no.trim() || `${year}-${form.department.trim()}-제${String(countThisDept).padStart(2, '0')}호`;

    const validActions = actionItems.filter(a => a.task.trim());
    const targetId = editingMinuteId || `MIN_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const payload = {
      id: targetId,
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
      is_signed: editingMinuteId ? form.is_signed : false
    };

    if (supabase) {
      if (editingMinuteId) {
        const { error } = await supabase.from('erp_meeting_minutes').update(payload).eq('id', editingMinuteId);
        if (error) return alert('회의록 수정 실패: ' + error.message);
      } else {
        const { error } = await supabase.from('erp_meeting_minutes').insert([payload]);
        if (error) return alert('회의록 기장 실패: ' + error.message);
      }
    }

    if (editingMinuteId) {
      setMinutes(prev => prev.map(m => (m.id === editingMinuteId ? payload : m)));
      triggerToast(`공식 의안 [${generatedDocNo}] 회의록이 수정 완료되었습니다.`);
    } else {
      setMinutes(prev => [payload, ...prev]);
      triggerToast(`공식 의안 [${generatedDocNo}] 회의록이 정식 아카이빙되었습니다.`);
    }

    setEditingMinuteId(null);
    setForm(createDefaultForm(form.department.trim()));
    setActionItems([{ id: Date.now(), task: '', assignee: '', dueDate: '', status: '진행중' }]);
    setMobileSubMode('feed');
  };

  // 공식 전자 직인 날인
  const handleToggleSign = async (minuteId, currentStatus) => {
    const nextStatus = !currentStatus;
    const signed_at = nextStatus ? new Date().toISOString() : null;

    setMinutes(prev => prev.map(m => (m.id === minuteId ? { ...m, is_signed: nextStatus, signed_at } : m)));
    if (selectedMinute?.id === minuteId) {
      setSelectedMinute(prev => ({ ...prev, is_signed: nextStatus, signed_at }));
    }
    if (supabase) {
      await supabase.from('erp_meeting_minutes').update({ is_signed: nextStatus, signed_at }).eq('id', minuteId);
    }
    triggerToast(nextStatus ? '공식 전자 직인이 날인되었습니다.' : '전자 직인 날인이 취소되었습니다.');
  };

  // 미날인 의사록 일괄 직인 날인
  const handleBatchSignUnsigned = async () => {
    const unsignedList = minutes.filter(m => !m.is_signed);
    if (unsignedList.length === 0) return triggerToast('미날인 상태인 의사록이 없습니다.');
    if (!window.confirm(`미날인 상태인 ${unsignedList.length}건의 공식 의사록에 일괄 직인 날인하시겠습니까?`)) return;

    const signed_at = new Date().toISOString();
    const ids = unsignedList.map(m => m.id);

    setMinutes(prev => prev.map(m => (ids.includes(m.id) ? { ...m, is_signed: true, signed_at } : m)));
    if (supabase) {
      try {
        await supabase.from('erp_meeting_minutes').update({ is_signed: true, signed_at }).in('id', ids);
      } catch (_) {}
    }
    triggerToast(`${unsignedList.length}건의 의사록에 전자 직인이 일괄 날인되었습니다.`);
  };

  // 후속 조치 상태 토글
  const handleToggleActionStatus = async (meetingId, actionId, currentStatus) => {
    const nextStatus = currentStatus === '완료' ? '진행중' : '완료';
    const targetMeeting = minutes.find(m => m.id === meetingId);
    if (!targetMeeting) return;

    const updatedActions = (targetMeeting.action_items || []).map(act =>
      act.id === actionId ? { ...act, status: nextStatus } : act
    );
    const updatedMinutes = minutes.map(m =>
      m.id === meetingId ? { ...m, action_items: updatedActions } : m
    );

    setMinutes(updatedMinutes);
    if (selectedMinute?.id === meetingId) {
      setSelectedMinute(prev => ({ ...prev, action_items: updatedActions }));
    }
    if (supabase) {
      await supabase.from('erp_meeting_minutes').update({ action_items: updatedActions }).eq('id', meetingId);
    }
  };

  // 회의록 삭제
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        '선택한 공식 회의록을 영구 폐기하시겠습니까?\n(공공 거버넌스 규격상 폐기 시 감사 로그에 기록됩니다)'
      )
    )
      return;
    if (supabase) await supabase.from('erp_meeting_minutes').delete().eq('id', id);
    setMinutes(prev => prev.filter(m => m.id !== id));
    if (selectedMinute?.id === id) setSelectedMinute(null);
    triggerToast('선택한 회의록이 영구 폐기되었습니다.');
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
      const matchesSearch =
        !searchTerm ||
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

  // 전체 의안 CSV 내보내기
  const exportMinutesCSV = () => {
    if (filteredMinutes.length === 0) return alert('내보낼 회의록 내역이 없습니다.');
    let csvContent = '\uFEFF';
    csvContent += '의안번호,회의일자,회의구분,회의체,안건제목,의결상태,재적,출석,참석자,찬성,반대,기권,결의주문,날인여부\n';

    filteredMinutes.forEach(m => {
      csvContent += `"${m.doc_no || '-'}","${m.meeting_date}","${m.meeting_type || '정기회의'}","${m.department}","${(m.title || '').replace(/"/g, '""')}","${m.resolution_status}","${m.total_eligible || 0}","${m.attendees_count || 0}","${(m.attendees || '').replace(/"/g, '""')}","${m.votes_for || 0}","${m.votes_against || 0}","${m.votes_abstain || 0}","${(m.resolution || '').replace(/"/g, '""')}","${m.is_signed ? '날인완료' : '미날인'}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `의사록_총괄보고서_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // 클립보드 브리핑 복사
  const handleCopyMeetingBrief = () => {
    if (filteredMinutes.length === 0) return alert('복사할 회의록 내역이 없습니다.');
    let text = `[거버넌스 공식 회의록 요약 보고]\n발행일자: ${new Date().toLocaleDateString()}\n총 의안: ${filteredMinutes.length}건\n--------------------------\n`;
    filteredMinutes.forEach((m, idx) => {
      text += `${idx + 1}. [${m.doc_no || m.department}] ${m.title} (${m.meeting_date})\n`;
      text += `결과: ${m.resolution_status} (찬성 ${m.votes_for || 0} / 반대 ${m.votes_against || 0})\n`;
      if (m.resolution) text += `주문: ${m.resolution}\n`;
      if (m.action_items && m.action_items.length > 0) {
        text += `이행: ${m.action_items.map(a => `${a.task}(${a.assignee || '미지정'})`).join(', ')}\n`;
      }
      text += `\n`;
    });

    navigator.clipboard?.writeText?.(text).then(() => {
      triggerToast('의결 회의록 요약 브리핑이 클립보드에 복사되었습니다.');
    });
  };

  // 전사 실행 과제 풀
  const allActionItemsExtracted = useMemo(() => {
    const list = [];
    minutes.forEach(m => {
      if (m.action_items && Array.isArray(m.action_items)) {
        m.action_items.forEach(act => {
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

  // 실행 마스터 보드 필터링
  const filteredActionItems = useMemo(() => {
    const q = actionSearchTerm.trim().toLowerCase();
    return allActionItemsExtracted.filter(item => {
      if (actionFilterStatus === 'PENDING' && item.status === '완료') return false;
      if (actionFilterStatus === 'DONE' && item.status !== '완료') return false;
      if (actionFilterStatus === 'OVERDUE' && !item.isOverdue) return false;
      if (!q) return true;
      return (
        (item.task || '').toLowerCase().includes(q) ||
        (item.assignee || '').toLowerCase().includes(q) ||
        (item.meetingTitle || '').toLowerCase().includes(q) ||
        (item.department || '').toLowerCase().includes(q)
      );
    });
  }, [allActionItemsExtracted, actionFilterStatus, actionSearchTerm]);

  // 거버넌스 KPI 지표
  const stats = useMemo(() => {
    const total = minutes.length;
    const passed = minutes.filter(
      m => m.resolution_status === '원안가결' || m.resolution_status === '수정가결'
    ).length;
    const signedCount = minutes.filter(m => m.is_signed).length;
    const unsignedCount = Math.max(0, total - signedCount);
    const pendingActions = allActionItemsExtracted.filter(a => a.status !== '완료').length;
    const overdueActions = allActionItemsExtracted.filter(a => a.isOverdue).length;

    return {
      total,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      signRate: total > 0 ? Math.round((signedCount / total) * 100) : 0,
      unsignedCount,
      pendingActions,
      overdueActions
    };
  }, [minutes, allActionItemsExtracted]);

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
          [1] 공직 감사원 규격 거버넌스 헤더 (100% 풀 와이드 & 줄바꿈 방지)
         ========================================================================= */}
      <div className="w-full bg-zinc-950 text-zinc-100 px-4 sm:px-6 py-3.5 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3.5 shrink-0 border-b border-zinc-800">
        
        <div className="flex flex-wrap items-center gap-4 sm:gap-5 w-full xl:w-auto">
          <div className="flex items-center gap-2.5 pr-4 border-r border-zinc-800 shrink-0 whitespace-nowrap">
            <span className="font-mono text-[10px] font-black tracking-widest text-amber-400 uppercase bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
              BOARD AUDIT
            </span>
            <span className="font-black text-[15px] text-white tracking-tight">
              의결 회의록 총람 (Board Minutes)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-5 font-mono text-[11.5px] font-bold whitespace-nowrap tabular-nums">
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[9.5px] uppercase tracking-wider">상정 의안 총수</span>
              <span className="text-white text-[14.5px] sm:text-[15px] leading-tight">{stats.total}건</span>
            </div>
            <span className="w-px h-6 bg-zinc-800 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[9.5px] uppercase tracking-wider">가결 통과율</span>
              <span className="text-emerald-400 text-[14.5px] sm:text-[15px] leading-tight">{stats.passRate}%</span>
            </div>
            <span className="w-px h-6 bg-zinc-800 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[9.5px] uppercase tracking-wider">공식 직인 날인율</span>
              <span className="text-zinc-200 text-[14.5px] sm:text-[15px] leading-tight">{stats.signRate}%</span>
            </div>
            <span className="w-px h-6 bg-zinc-800 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[9.5px] uppercase tracking-wider">후속 미결 과제</span>
              <span className="text-amber-400 text-[14.5px] sm:text-[15px] leading-tight">
                {stats.pendingActions}건{' '}
                {stats.overdueActions > 0 && (
                  <b className="text-rose-400 text-[11px]">({stats.overdueActions}건 지연)</b>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 & 글로벌 액션 버튼군 */}
        <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto hide-scrollbar shrink-0">
          <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[11px] font-bold shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('archive')}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'archive' ? 'bg-zinc-800 text-white font-black shadow-2xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              의사록 피드 ({minutes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'analytics' ? 'bg-zinc-800 text-white font-black shadow-2xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              의결 분석표
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('actions')}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'actions' ? 'bg-zinc-800 text-white font-black shadow-2xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              실행 보드 ({allActionItemsExtracted.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'report' ? 'bg-zinc-800 text-white font-black shadow-2xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              공문서 편철
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto xl:ml-0">
            {stats.unsignedCount > 0 && (
              <button
                type="button"
                onClick={handleBatchSignUnsigned}
                className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs"
                title="미날인 상태인 모든 의사록에 공식 직인을 일괄 날인합니다"
              >
                <SvgCheck /> 일괄날인 ({stats.unsignedCount})
              </button>
            )}
            <button
              type="button"
              onClick={exportMinutesCSV}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
              title="의안 목록 CSV 다운로드"
            >
              <SvgDownload /> CSV
            </button>
            <button
              type="button"
              onClick={handleCopyMeetingBrief}
              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
            >
              <SvgCopy /> 브리핑 복사
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-white text-zinc-950 font-black rounded-lg text-[11px] hover:bg-zinc-100 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <SvgPrint /> 인쇄
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          [탭 1] 풀 와이드 공식 의사록 아카이브 뷰
         ========================================================================= */}
      {activeTab === 'archive' && (
        <div className="flex-1 w-full flex flex-col min-h-0 bg-white overflow-hidden">
          
          {/* 모바일 서브 탭 스위처 */}
          <div className="flex lg:hidden bg-zinc-100 border-b border-zinc-200 p-1 shrink-0">
            <button
              type="button"
              onClick={() => setMobileSubMode('feed')}
              className={`flex-1 py-1.5 rounded-md text-[11.5px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                mobileSubMode === 'feed' ? 'bg-white text-zinc-900 shadow-2xs font-black' : 'text-zinc-500'
              }`}
            >
              의사록 피드 ({filteredMinutes.length})
            </button>
            <button
              type="button"
              onClick={() => setMobileSubMode('write')}
              className={`flex-1 py-1.5 rounded-md text-[11.5px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                mobileSubMode === 'write' ? 'bg-zinc-900 text-white shadow-2xs font-black' : 'text-zinc-500'
              }`}
            >
              {editingMinuteId ? '의안 수정중' : '+ 안건 상정'}
            </button>
          </div>

          <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden bg-zinc-100/40">
            
            {/* 좌측: 안건 상정 & 공문서 작성 폼 (5 span) */}
            <div
              className={`lg:col-span-5 p-5 sm:p-6 border-r border-zinc-200 bg-white overflow-y-auto hide-scrollbar shadow-2xs z-10 ${
                mobileSubMode === 'write' ? 'block' : 'hidden lg:block'
              }`}
            >
              <div className="border-b border-zinc-200 pb-3 mb-3.5">
                <div className="flex justify-between items-center gap-2 whitespace-nowrap">
                  <h4 className="font-black text-zinc-900 text-[14.5px] flex items-center gap-2">
                    <SvgPlus />
                    <span>{editingMinuteId ? '공식 의안 내용 수정' : '공식 의안 상정 및 결의 등록'}</span>
                  </h4>
                  <div className="flex items-center gap-1.5">
                    {editingMinuteId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMinuteId(null);
                          setForm(createDefaultForm('당회'));
                        }}
                        className="text-[11px] text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded-md border border-rose-200 cursor-pointer"
                      >
                        수정 취소 ✕
                      </button>
                    )}
                    {mobileSubMode === 'write' && (
                      <button
                        type="button"
                        onClick={() => setMobileSubMode('feed')}
                        className="lg:hidden text-[11px] text-zinc-600 font-bold bg-zinc-100 px-2 py-1 rounded-md cursor-pointer"
                      >
                        ← 목록으로
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                  의안 번호가 공식 채번되며, 정족수 검증 및 결의 주문이 영구 아카이빙됩니다.
                </p>

                {/* 원클릭 표준 의사록 템플릿 프리셋 바 */}
                <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pt-2.5">
                  <span className="text-[10px] font-black text-zinc-400 uppercase whitespace-nowrap shrink-0">
                    표준서식:
                  </span>
                  {MINUTE_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="px-2 py-1 rounded-md bg-zinc-50 hover:bg-zinc-900 hover:text-white text-zinc-700 border border-zinc-200 text-[10.5px] font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      + {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-3.5 text-[12px]">
                
                {/* 일자 & 회의 구분 & 회의체 */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-black text-zinc-400 uppercase tracking-wider mb-1 text-[10px] whitespace-nowrap">
                      회의 일자 *
                    </label>
                    <input
                      type="date"
                      value={form.meeting_date}
                      onChange={e => setForm({ ...form, meeting_date: e.target.value })}
                      className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-2 rounded-lg font-mono font-bold outline-none focus:border-zinc-900 transition-colors cursor-pointer text-[11.5px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-black text-zinc-400 uppercase tracking-wider mb-1 text-[10px] whitespace-nowrap">
                      회의 종류
                    </label>
                    <select
                      value={form.meeting_type}
                      onChange={e => setForm({ ...form, meeting_type: e.target.value })}
                      className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-2 rounded-lg font-bold outline-none cursor-pointer focus:border-zinc-900 text-[11.5px]"
                    >
                      {MEETING_TYPES.map(mt => <option key={mt} value={mt}>{mt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-black text-zinc-400 uppercase tracking-wider mb-1 text-[10px] whitespace-nowrap">
                      회의체/위원회 *
                    </label>
                    <input
                      list="dept-options"
                      value={form.department}
                      onChange={e => setForm({ ...form, department: e.target.value })}
                      placeholder="위원회 명칭..."
                      className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-2 rounded-lg font-bold outline-none focus:border-zinc-900 transition-colors text-[11.5px]"
                      required
                    />
                    <datalist id="dept-options">
                      {dynamicDepartments.map(d => <option key={d} value={d} />)}
                    </datalist>
                  </div>
                </div>

                {/* 의안번호 & 의결상태 */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-black text-zinc-400 uppercase tracking-wider mb-1 text-[10px]">
                      공문서 의안 번호
                    </label>
                    <input
                      type="text"
                      value={form.doc_no}
                      onChange={e => setForm({ ...form, doc_no: e.target.value })}
                      placeholder="미입력 시 자동 채번"
                      className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-2 rounded-lg font-mono font-bold text-zinc-700 outline-none focus:border-zinc-900 transition-colors placeholder:font-sans placeholder:font-medium placeholder:text-zinc-400"
                    />
                  </div>
                  <div>
                    <label className="block font-black text-zinc-400 uppercase tracking-wider mb-1 text-[10px]">
                      의결 상태 *
                    </label>
                    <select
                      value={form.resolution_status}
                      onChange={e => setForm({ ...form, resolution_status: e.target.value })}
                      className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-2 rounded-lg font-bold outline-none cursor-pointer focus:border-zinc-900 transition-colors text-zinc-900"
                    >
                      {RESOLUTION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* 안건 제목 */}
                <div>
                  <label className="block font-black text-zinc-400 uppercase tracking-wider mb-1 text-[10px]">
                    안건 심의 제목 *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="예: 2026년도 상반기 목회 사역계획 및 추가경정예산안 심의의 건"
                    className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-2.5 rounded-lg font-black text-zinc-900 outline-none focus:border-zinc-900 transition-colors placeholder:font-medium placeholder:text-zinc-400"
                    required
                  />
                </div>

                {/* 법적 정족수 검증 & 표결 카운터 블록 */}
                <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-2.5">
                  <div className="flex flex-wrap justify-between items-center gap-2 whitespace-nowrap">
                    <label className="font-black text-zinc-900 text-[11.5px]">
                      정족수 대사 및 표결 명세 ({quorumValidation.quorumPercent}% 출석)
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setForm(prev => ({
                            ...prev,
                            attendees_count: prev.total_eligible,
                            votes_for: prev.total_eligible,
                            votes_against: 0,
                            votes_abstain: 0
                          }))
                        }
                        className="px-2 py-0.5 rounded bg-zinc-900 text-white text-[10px] font-bold cursor-pointer"
                      >
                        전원출석·만장일치
                      </button>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black border flex items-center gap-1 ${
                          quorumValidation.isQuorumMet && quorumValidation.isVotePassed
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {quorumValidation.isQuorumMet && quorumValidation.isVotePassed ? (
                          <><SvgShieldCheck /> 정족수 충족</>
                        ) : (
                          '정족수 미달주의'
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pb-2 border-b border-zinc-200">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold block mb-1">재적 위원수 (총원)</span>
                      <input
                        type="number"
                        value={form.total_eligible}
                        onChange={e => setForm({ ...form, total_eligible: e.target.value })}
                        className="w-full border border-zinc-300 bg-white p-1.5 rounded-lg font-mono font-bold text-center outline-none tabular-nums"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold block mb-1">출석 위원수 (의사정족)</span>
                      <input
                        type="number"
                        value={form.attendees_count}
                        onChange={e => setForm({ ...form, attendees_count: e.target.value })}
                        className="w-full border border-zinc-300 bg-white p-1.5 rounded-lg font-mono font-bold text-center outline-none tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <span className="text-[10px] text-emerald-700 font-bold block mb-1">찬성표</span>
                      <input
                        type="number"
                        value={form.votes_for}
                        onChange={e => setForm({ ...form, votes_for: e.target.value })}
                        className="w-full border border-zinc-300 bg-white p-1.5 rounded-lg font-mono font-black text-emerald-600 outline-none text-center tabular-nums"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-700 font-bold block mb-1">반대표</span>
                      <input
                        type="number"
                        value={form.votes_against}
                        onChange={e => setForm({ ...form, votes_against: e.target.value })}
                        className="w-full border border-zinc-300 bg-white p-1.5 rounded-lg font-mono font-black text-rose-600 outline-none text-center tabular-nums"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold block mb-1">기권표</span>
                      <input
                        type="number"
                        value={form.votes_abstain}
                        onChange={e => setForm({ ...form, votes_abstain: e.target.value })}
                        className="w-full border border-zinc-300 bg-white p-1.5 rounded-lg font-mono font-black text-zinc-600 outline-none text-center tabular-nums"
                      />
                    </div>
                  </div>
                </div>

                {/* 참석자 & 날인위원 */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-black text-zinc-400 uppercase tracking-wider mb-1 text-[10px]">
                      출석자 명단 *
                    </label>
                    <input
                      type="text"
                      value={form.attendees}
                      onChange={e => setForm({ ...form, attendees: e.target.value })}
                      placeholder="예: 당회원 7인"
                      className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-2 rounded-lg outline-none font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-black text-zinc-400 uppercase tracking-wider mb-1 text-[10px]">
                      직인 날인위원
                    </label>
                    <input
                      type="text"
                      value={form.signed_officers}
                      onChange={e => setForm({ ...form, signed_officers: e.target.value })}
                      placeholder="예: 당회장, 서기장로"
                      className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-2 rounded-lg outline-none font-bold"
                    />
                  </div>
                </div>

                {/* 결의 주문 */}
                <div>
                  <label className="block font-black text-zinc-400 uppercase tracking-wider mb-1 text-[10px]">
                    결의 주문 (Official Resolution) *
                  </label>
                  <input
                    type="text"
                    value={form.resolution}
                    onChange={e => setForm({ ...form, resolution: e.target.value })}
                    placeholder="예: 출석 당회원 전원 일치로 원안 통과하고, 예산 집행을 재정부에 위임 승인함"
                    className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-2.5 rounded-lg font-black text-zinc-900 outline-none focus:border-zinc-900 transition-colors"
                    required
                  />
                </div>

                {/* 토의 전문 기록 */}
                <div>
                  <label className="block font-black text-zinc-400 uppercase tracking-wider mb-1 text-[10px]">
                    심의 과정 및 토의 전문 *
                  </label>
                  <textarea
                    rows={4}
                    value={form.content}
                    onChange={e => setForm({ ...form, content: e.target.value })}
                    className="w-full border border-zinc-300 bg-zinc-50 focus:bg-white p-3 rounded-lg leading-relaxed outline-none focus:border-zinc-900 transition-colors resize-none font-medium text-zinc-800"
                    placeholder="심의 쟁점 사항, 찬반 토론 요지 및 최종 합의 도출 과정을 상세히 기술하세요..."
                    required
                  />
                </div>

                {/* 후속 실행 과제 (Action Items) */}
                <div className="space-y-2 pt-2 border-t border-zinc-200">
                  <div className="flex justify-between items-center whitespace-nowrap">
                    <label className="font-black text-zinc-900 text-[12px]">
                      후속 실행 과제 분배 (Action Items)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddActionRow}
                      className="px-2.5 py-1 bg-white border border-zinc-300 rounded-md text-[10.5px] font-bold text-zinc-700 hover:bg-zinc-50 cursor-pointer shadow-2xs"
                    >
                      + 과제 추가
                    </button>
                  </div>

                  <div className="space-y-2 max-h-44 overflow-y-auto hide-scrollbar bg-zinc-50 p-2 rounded-xl border border-zinc-200">
                    {actionItems.map((act, idx) => (
                      <div key={act.id} className="bg-white p-2 border border-zinc-200 rounded-lg space-y-1.5 shadow-2xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10.5px] font-bold text-zinc-400 w-4">{idx + 1}.</span>
                          <input
                            type="text"
                            value={act.task}
                            onChange={e => handleActionChange(act.id, 'task', e.target.value)}
                            placeholder="실행 과제 명칭"
                            className="flex-1 border border-zinc-200 bg-zinc-50 px-2.5 py-1 rounded-md text-[11.5px] font-bold outline-none focus:border-zinc-900"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveActionRow(act.id)}
                            className="text-zinc-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <SvgClose />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 pl-5">
                          <input
                            type="text"
                            value={act.assignee}
                            onChange={e => handleActionChange(act.id, 'assignee', e.target.value)}
                            placeholder="실무 책임자"
                            className="border border-zinc-200 bg-zinc-50 px-2 py-1 rounded-md text-[11px] font-bold outline-none text-center"
                          />
                          <input
                            type="date"
                            value={act.dueDate}
                            onChange={e => handleActionChange(act.id, 'dueDate', e.target.value)}
                            className="border border-zinc-200 bg-zinc-50 px-2 py-1 rounded-md text-[10.5px] font-mono font-bold text-zinc-600 outline-none cursor-pointer"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    className="w-full py-3 bg-zinc-900 text-white font-black hover:bg-zinc-800 rounded-xl cursor-pointer shadow-sm active:scale-[0.99] transition-all text-[12.5px] whitespace-nowrap"
                  >
                    {editingMinuteId ? '공식 의안 수정사항 저장하기' : '공식 의안 확정 및 아카이빙 기장'}
                  </button>
                </div>
              </form>
            </div>

            {/* 우측: 풀 와이드 공식 의사록 열람 피드 (7 span) */}
            <div
              className={`lg:col-span-7 flex flex-col min-h-0 overflow-hidden ${
                mobileSubMode === 'feed' ? 'flex' : 'hidden lg:flex'
              }`}
            >
              {/* 필터 바 */}
              <div className="px-4 sm:px-6 py-2.5 bg-zinc-50 border-b border-zinc-200 flex flex-wrap justify-between items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="flex bg-zinc-200/70 rounded-lg p-0.5 text-[10.5px] font-bold">
                    {['ALL', 'weekly', 'monthly', 'quarterly', 'yearly'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFilterPeriod(p)}
                        className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          filterPeriod === p ? 'bg-white text-zinc-950 font-black shadow-2xs' : 'text-zinc-600'
                        }`}
                      >
                        {p === 'ALL'
                          ? '전체'
                          : p === 'weekly'
                          ? '주간'
                          : p === 'monthly'
                          ? '월간'
                          : p === 'quarterly'
                          ? '분기'
                          : '연간'}
                      </button>
                    ))}
                  </div>

                  <select
                    value={filterDept}
                    onChange={e => setFilterDept(e.target.value)}
                    className="border border-zinc-300 bg-white px-2.5 py-1 rounded-lg text-[11px] font-bold outline-none cursor-pointer text-zinc-800 whitespace-nowrap"
                  >
                    <option value="ALL">전체 회의체</option>
                    {dynamicDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>

                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="border border-zinc-300 bg-white px-2.5 py-1 rounded-lg text-[11px] font-bold outline-none cursor-pointer text-zinc-800 whitespace-nowrap"
                  >
                    <option value="ALL">전체 의결 상태</option>
                    {RESOLUTION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="relative w-full sm:w-60">
                  <span className="absolute left-2.5 top-2 text-zinc-400 pointer-events-none"><SvgSearch /></span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="의안번호, 안건, 결의내용..."
                    className="w-full pl-8 pr-6 py-1.5 border border-zinc-300 bg-white rounded-lg text-[11px] outline-none focus:border-zinc-900 font-bold placeholder:text-zinc-400 transition-colors"
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

              {/* 회의록 카드 스트림 (풀 와이드 고밀도) */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 hide-scrollbar">
                {filteredMinutes.length === 0 ? (
                  <div className="text-center py-24 bg-white border border-zinc-200 rounded-2xl text-zinc-400 font-bold text-[13px]">
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
                        className="bg-white border border-zinc-200/90 rounded-2xl p-4 space-y-2.5 shadow-2xs hover:border-zinc-400 transition-all cursor-pointer group"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 whitespace-nowrap">
                              <span className="bg-zinc-900 text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold shrink-0">
                                {m.doc_no || m.department}
                              </span>
                              {m.meeting_type && (
                                <span className="bg-zinc-100 text-zinc-700 border border-zinc-200 text-[10px] px-2 py-0.5 rounded font-bold shrink-0">
                                  {m.meeting_type}
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded font-black text-[10px] border shrink-0 ${
                                  m.resolution_status === '원안가결'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : m.resolution_status === '수정가결'
                                    ? 'bg-zinc-100 text-zinc-800 border-zinc-300'
                                    : m.resolution_status === '부결'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                {m.resolution_status}
                              </span>
                              {m.is_signed ? (
                                <span className="text-[10px] bg-zinc-900 text-amber-400 px-2 py-0.5 rounded font-black flex items-center gap-1 shrink-0">
                                  <SvgCheck /> 직인날인필
                                </span>
                              ) : (
                                <span className="text-[10px] bg-zinc-100 text-zinc-500 border border-zinc-200 px-2 py-0.5 rounded font-bold shrink-0">
                                  날인대기
                                </span>
                              )}
                            </div>
                            <h5 className="font-black text-[14.5px] text-zinc-900 leading-snug pt-0.5 truncate">
                              {m.title}
                            </h5>
                          </div>
                          <span className="text-[11px] text-zinc-500 font-mono font-bold shrink-0 whitespace-nowrap tabular-nums">
                            {m.meeting_date}
                          </span>
                        </div>

                        {/* 결의 주문 요약 */}
                        <div className="bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl text-[12px] font-sans">
                          <strong className="text-zinc-400 mr-2 text-[10px] uppercase tracking-wider">
                            결의 주문:
                          </strong>
                          <span className="text-zinc-900 font-bold">
                            {m.resolution || (m.content || '').substring(0, 100)}
                          </span>
                        </div>

                        {/* 표결 게이지 */}
                        {totalVotes > 0 && (
                          <div className="space-y-1 pt-0.5">
                            <div className="flex justify-between text-[10.5px] font-mono text-zinc-500 font-bold whitespace-nowrap tabular-nums">
                              <span>
                                표결: 찬성 {m.votes_for || 0} / 반대 {m.votes_against || 0} / 기권 {m.votes_abstain || 0}
                              </span>
                              <strong className={forPct >= 50 ? 'text-zinc-900' : 'text-rose-600'}>
                                {forPct}% 찬성
                              </strong>
                            </div>
                            <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden flex">
                              <div className="bg-zinc-900 h-full" style={{ width: `${forPct}%` }} />
                              <div className="bg-rose-500 h-full" style={{ width: `${100 - forPct}%` }} />
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-zinc-100 text-[10.5px] whitespace-nowrap">
                          <span className="text-zinc-500 font-mono font-bold truncate max-w-[260px]">
                            서명위원: {m.signed_officers || '당회장, 서기'}
                          </span>
                          <div
                            className="flex items-center gap-1.5"
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleEditMinute(m)}
                              className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-[10px] cursor-pointer"
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateMinute(m)}
                              className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-[10px] cursor-pointer"
                            >
                              복제
                            </button>
                            <span className="text-zinc-400 font-bold group-hover:text-zinc-900 transition-colors pl-1">
                              열람 →
                            </span>
                          </div>
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
          [탭 2] 풀 와이드 의결 안건 분석 매트릭스
         ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="flex-1 w-full overflow-y-auto px-4 sm:px-6 py-5 bg-zinc-100/40 space-y-4 hide-scrollbar">
          <div className="w-full bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs space-y-1">
            <h4 className="font-black text-zinc-900 text-[14.5px]">
              회의체별 의결 안건 분석 매트릭스 (Resolution Matrix)
            </h4>
            <p className="text-[11.5px] text-zinc-500 font-medium">
              당회 및 위원회별 의안 가결률, 부결률, 보류 추이를 공공 감사 기준으로 대사합니다.
            </p>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {dynamicDepartments.map(dept => {
              const deptMinutes = minutes.filter(m => m.department === dept);
              const passed = deptMinutes.filter(
                m => m.resolution_status === '원안가결' || m.resolution_status === '수정가결'
              ).length;
              const rejected = deptMinutes.filter(m => m.resolution_status === '부결').length;
              const pending = deptMinutes.length - passed - rejected;
              const rate = deptMinutes.length > 0 ? Math.round((passed / deptMinutes.length) * 100) : 0;

              return (
                <div
                  key={dept}
                  className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4 shadow-2xs hover:border-zinc-400 transition-colors"
                >
                  <div className="flex justify-between items-center whitespace-nowrap">
                    <h5 className="font-black text-[15px] text-zinc-900 tracking-tight">{dept}</h5>
                    <span className="font-mono text-[11px] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md font-bold border border-zinc-200 tabular-nums">
                      총 {deptMinutes.length}건 상정
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-center tabular-nums">
                    <div>
                      <span className="text-zinc-500 font-bold block text-[10px] mb-0.5">가결</span>
                      <strong className="text-zinc-900 text-[15px]">{passed}건</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 font-bold block text-[10px] mb-0.5">부결</span>
                      <strong className="text-rose-600 text-[15px]">{rejected}건</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 font-bold block text-[10px] mb-0.5">보류/조건</span>
                      <strong className="text-amber-700 text-[15px]">{pending}건</strong>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold text-zinc-600 whitespace-nowrap">
                      <span>가결 통과율 (Pass Rate)</span>
                      <strong className="text-zinc-900 font-mono tabular-nums">{rate}%</strong>
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
          [탭 3] 풀 와이드 실행 과제 마스터 보드 (상태 필터 + 검색 탑재)
         ========================================================================= */}
      {activeTab === 'actions' && (
        <div className="flex-1 w-full overflow-y-auto px-4 sm:px-6 py-5 bg-zinc-100/40 space-y-4 hide-scrollbar">
          <div className="w-full bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-black text-zinc-900 text-[14.5px]">
                전사 회의 후속 실행 과제 마스터 트래커 (Action Items)
              </h4>
              <p className="text-[11.5px] text-zinc-500 font-medium mt-0.5">
                의안에서 도출된 실무 과제의 이행 여부와 기한 초과(Overdue) 리스크를 실시간 관리합니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-[11px] font-bold">
                {[
                  { id: 'ALL', label: `전체 (${allActionItemsExtracted.length})` },
                  { id: 'PENDING', label: `진행중 (${stats.pendingActions})` },
                  { id: 'OVERDUE', label: `기한초과 (${stats.overdueActions})` },
                  { id: 'DONE', label: '완료됨' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActionFilterStatus(tab.id)}
                    className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer tabular-nums ${
                      actionFilterStatus === tab.id
                        ? 'bg-white text-zinc-950 font-black shadow-2xs'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-48">
                <span className="absolute left-2.5 top-2 text-zinc-400 pointer-events-none"><SvgSearch /></span>
                <input
                  type="text"
                  value={actionSearchTerm}
                  onChange={e => setActionSearchTerm(e.target.value)}
                  placeholder="과제명, 담당자 검색..."
                  className="w-full pl-8 pr-3 py-1 rounded-lg bg-zinc-50 border border-zinc-200 text-[11.5px] font-bold outline-none focus:bg-white focus:border-zinc-900"
                />
              </div>
            </div>
          </div>

          <div className="w-full space-y-2.5">
            {filteredActionItems.length === 0 ? (
              <div className="text-center py-20 bg-white border border-zinc-200 rounded-2xl text-zinc-400 font-bold text-[13px]">
                조회된 후속 실행 과제가 없습니다.
              </div>
            ) : (
              filteredActionItems.map((item) => {
                const isDone = item.status === '완료';
                return (
                  <div
                    key={item.uniqueKey}
                    onClick={() => handleToggleActionStatus(item.meetingId, item.id, item.status)}
                    className={`w-full bg-white border rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all cursor-pointer shadow-2xs group ${
                      item.isOverdue
                        ? 'border-rose-300 bg-rose-50/20'
                        : 'border-zinc-200/90 hover:border-zinc-400'
                    }`}
                  >
                    <div className="space-y-1 overflow-hidden flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 whitespace-nowrap">
                        <span className="bg-zinc-900 text-white font-mono text-[10px] px-2 py-0.2 rounded font-bold">
                          {item.docNo || item.department}
                        </span>
                        <span className="text-zinc-600 text-[11px] font-bold truncate">
                          {item.meetingTitle}{' '}
                          <span className="font-mono text-[10px] text-zinc-400 ml-1 tabular-nums">
                            ({item.meetingDate})
                          </span>
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

                    <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 text-[11.5px] font-mono shrink-0 whitespace-nowrap tabular-nums">
                      <div className="text-zinc-600 font-bold">
                        담당: <strong className="text-zinc-900">{item.assignee || '미지정'}</strong>
                        {item.dueDate && <span className="text-zinc-400 ml-1">({item.dueDate})</span>}
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg font-black text-[11px] border ${
                          isDone
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'bg-white text-zinc-700 border-zinc-300'
                        }`}
                      >
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
          [탭 4] 풀 와이드 공문서 제본 및 총람 인쇄 뷰
         ========================================================================= */}
      {activeTab === 'report' && (
        <div className="flex-1 w-full overflow-y-auto px-4 sm:px-6 py-5 bg-zinc-100/40 hide-scrollbar">
          <div className="w-full bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
            
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-zinc-200 pb-4">
              <div>
                <h4 className="font-black text-zinc-900 text-[16px] tracking-tight">
                  공식 의사록 총괄 제본 편철 (Official Docket)
                </h4>
                <p className="text-[11.5px] text-zinc-500 mt-1 font-medium">
                  교단 총회 감사 및 당회 영구 보존용 공문서 규격입니다.
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
              <div className="text-center space-y-2 py-6 border-b-2 border-zinc-900">
                <h2 className="text-[22px] sm:text-[24px] font-black tracking-widest text-zinc-900 uppercase">
                  교 회 사 역 공 식 의 사 록 총 람
                </h2>
                <div className="text-[11.5px] text-zinc-500 font-mono font-bold tabular-nums">
                  발행일자: {new Date().toLocaleDateString()} | 수록 의안: {minutes.length}건
                </div>
              </div>

              <div className="w-full space-y-5">
                {minutes.map((m, idx) => (
                  <div
                    key={m.id}
                    className="w-full p-5 bg-white border border-zinc-300 rounded-2xl space-y-3 text-[12px] shadow-2xs"
                  >
                    <div className="flex flex-wrap justify-between items-center gap-2 font-bold border-b border-zinc-200 pb-2">
                      <span className="text-[14.5px] text-zinc-900 font-black">
                        {idx + 1}. [{m.doc_no || m.department}] {m.title}
                      </span>
                      <span className="font-mono text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200 whitespace-nowrap tabular-nums">
                        {m.meeting_date}
                      </span>
                    </div>

                    <div className="text-zinc-700 font-mono text-[11.5px] flex flex-wrap justify-between gap-2 font-bold bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 tabular-nums">
                      <span>
                        출석: {m.attendees} (재적 {m.total_eligible || '-'}인 중 {m.attendees_count || '-'}인 출석)
                      </span>
                      <span>
                        의결: <strong className="text-zinc-900">{m.resolution_status}</strong> (찬성 {m.votes_for || 0} / 반대 {m.votes_against || 0})
                      </span>
                    </div>

                    {m.resolution && (
                      <div className="bg-zinc-100 p-3 border border-zinc-300 rounded-xl font-black text-zinc-900 text-[12.5px]">
                        [결의 주문] {m.resolution}
                      </div>
                    )}

                    <p className="text-zinc-800 leading-relaxed whitespace-pre-wrap font-medium py-1">
                      {m.content}
                    </p>

                    <div className="flex justify-between items-center text-[11px] text-zinc-500 font-mono font-bold pt-3 border-t border-zinc-200 whitespace-nowrap">
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
        <div
          className="fixed inset-0 z-[400] bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedMinute(null)}
        >
          <div
            className="w-full max-w-4xl bg-white border border-zinc-300 rounded-2xl p-6 shadow-2xl font-sans flex flex-col max-h-[92vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="bg-zinc-900 text-white font-mono text-[10.5px] px-2 py-0.5 rounded font-bold">
                  {selectedMinute.doc_no || selectedMinute.department}
                </span>
                <h3 className="text-[15.5px] font-black text-zinc-900 tracking-tight">
                  공식 의사록 및 전자 직인 확인
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMinute(null)}
                className="text-zinc-400 hover:text-zinc-900 p-1 cursor-pointer"
              >
                <SvgClose />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 px-1 hide-scrollbar">
              
              {/* 공문서 헤더 및 인영 날인 도장 */}
              <div className="flex justify-between items-start border-b border-zinc-200 pb-4 gap-4">
                <div className="space-y-1">
                  <h2 className="text-[18px] sm:text-[19px] font-black text-zinc-900 tracking-tight">
                    {selectedMinute.title}
                  </h2>
                  <div className="text-[11.5px] text-zinc-500 font-mono font-bold flex flex-wrap items-center gap-2">
                    <span className="bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 text-zinc-800">
                      {selectedMinute.department} ({selectedMinute.meeting_type || '정기회의'})
                    </span>
                    <span>회의일자: {selectedMinute.meeting_date}</span>
                  </div>
                </div>

                {/* 감사원 공직 인영 직인 도장 디자인 */}
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
                      <td className="w-28 bg-zinc-50 p-3 font-bold text-zinc-500 border-r border-zinc-200 text-center uppercase tracking-wider text-[10.5px]">
                        의결 결과
                      </td>
                      <td className="p-3 border-r border-zinc-200 font-black text-zinc-900">
                        {selectedMinute.resolution_status}
                      </td>
                      <td className="w-28 bg-zinc-50 p-3 font-bold text-zinc-500 border-r border-zinc-200 text-center uppercase tracking-wider text-[10.5px]">
                        표결 수치
                      </td>
                      <td className="p-3 font-mono font-bold text-zinc-800 tabular-nums">
                        찬성 {selectedMinute.votes_for || 0} / 반대 {selectedMinute.votes_against || 0} / 기권 {selectedMinute.votes_abstain || 0}
                      </td>
                    </tr>
                    <tr className="border-b border-zinc-200">
                      <td className="bg-zinc-50 p-3 font-bold text-zinc-500 border-r border-zinc-200 text-center uppercase tracking-wider text-[10.5px]">
                        출석 위원
                      </td>
                      <td colSpan={3} className="p-3 font-bold text-zinc-800">
                        {selectedMinute.attendees} (재적 {selectedMinute.total_eligible || '-'}인 중 {selectedMinute.attendees_count || '-'}인 출석)
                      </td>
                    </tr>
                    <tr className="border-b border-zinc-200">
                      <td className="bg-zinc-50 p-3 font-bold text-zinc-500 border-r border-zinc-200 text-center uppercase tracking-wider text-[10.5px]">
                        날인 위원
                      </td>
                      <td colSpan={3} className="p-3 font-mono font-bold text-zinc-600">
                        {selectedMinute.signed_officers}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-zinc-50 p-3 font-bold text-zinc-700 border-r border-zinc-200 text-center uppercase tracking-wider text-[10.5px]">
                        결의 주문
                      </td>
                      <td colSpan={3} className="p-3 font-black text-zinc-900 bg-zinc-50/50 leading-relaxed">
                        {selectedMinute.resolution}
                      </td>
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
                        className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-[11.5px] cursor-pointer hover:border-zinc-400 hover:bg-white transition-colors shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center font-bold text-[9.5px] ${
                              act.status === '완료'
                                ? 'bg-zinc-900 text-white border-zinc-900'
                                : 'bg-white border-zinc-300'
                            }`}
                          >
                            {act.status === '완료' ? '✓' : ''}
                          </span>
                          <span className={`font-bold ${act.status === '완료' ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>
                            {act.task}
                          </span>
                        </div>
                        <span className="text-zinc-500 font-mono font-bold text-[10.5px] bg-white px-2 py-0.5 rounded border border-zinc-200 whitespace-nowrap tabular-nums">
                          {act.assignee || '미지정'}{' '}
                          {act.dueDate && <span className="ml-1 text-zinc-400">({act.dueDate})</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* 하단 모달 액션 */}
            <div className="flex flex-wrap justify-between items-center gap-2 pt-4 border-t border-zinc-200 shrink-0 mt-2 whitespace-nowrap">
              <button
                type="button"
                onClick={() => handleDelete(selectedMinute.id)}
                className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-zinc-300 hover:border-rose-300 rounded-xl font-bold text-[11.5px] cursor-pointer shadow-2xs transition-colors"
              >
                의사록 완전 폐기
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => handleEditMinute(selectedMinute)}
                  className="px-3.5 py-2 bg-white hover:bg-zinc-50 border border-zinc-300 rounded-xl font-bold text-[11.5px] text-zinc-700 cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <SvgEdit /> 내용 수정
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-white hover:bg-zinc-50 border border-zinc-300 rounded-xl font-bold text-[11.5px] text-zinc-700 cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <SvgPrint /> 인쇄
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleSign(selectedMinute.id, selectedMinute.is_signed)}
                  className={`px-5 py-2 rounded-xl font-black text-[11.5px] text-white cursor-pointer shadow-sm active:scale-95 transition-all ${
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
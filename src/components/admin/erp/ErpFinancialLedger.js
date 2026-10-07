// src/components/admin/erp/ErpFinancialLedger.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../../lib/supabase';

// =========================================================================
// 🏛️ 공공 비영리 회계기준(GAAP 준용) 표준 계정과목표 (Chart of Accounts)
// =========================================================================
const COA = {
  ASSET: [
    { code: '10100', name: '현금', category: '유동자산' },
    { code: '10300', name: '보통예금(운영계좌)', category: '유동자산' },
    { code: '10400', name: '정기예적금(목적기금)', category: '유동자산' },
    { code: '11000', name: '미수금', category: '유동자산' },
    { code: '12000', name: '선급금(가지급금)', category: '유동자산' },
    { code: '15000', name: '비품 및 성구집기', category: '고정자산' },
    { code: '16000', name: '토지 및 건물', category: '고정자산' },
    { code: '17000', name: '시설장치', category: '고정자산' }
  ],
  LIABILITY: [
    { code: '20100', name: '미지급금', category: '유동부채' },
    { code: '21000', name: '예수금(원천세/4대보험)', category: '유동부채' },
    { code: '21500', name: '선수금', category: '유동부채' },
    { code: '22000', name: '단기차입금', category: '유동부채' },
    { code: '25000', name: '장기차입금(건축시설대출)', category: '고정부채' },
    { code: '29000', name: '퇴직급여충당부채', category: '고정부채' }
  ],
  EQUITY: [
    { code: '30100', name: '기본재산(설립출연원금)', category: '기본금' },
    { code: '31000', name: '전기이월이익잉여금(이월잔액)', category: '잉여금' },
    { code: '39000', name: '당기순운영차액(당기손익)', category: '잉여금' }
  ],
  REVENUE: [
    { code: '40100', name: '십일조헌금', category: '경상수입' },
    { code: '40200', name: '주일감사헌금', category: '경상수입' },
    { code: '40300', name: '특별목적감사헌금', category: '경상수입' },
    { code: '40400', name: '절기헌금(부활/성탄/추수)', category: '경상수입' },
    { code: '40500', name: '선교 및 구제지정헌금', category: '목적수입' },
    { code: '40600', name: '건축 및 시설목적헌금', category: '목적수입' },
    { code: '41000', name: '사역사업수입', category: '사업수입' },
    { code: '49000', name: '이자수입 및 잡수입', category: '영업외수입' }
  ],
  EXPENSE: [
    { code: '50100', name: '목회자 사례비 및 급여', category: '인건비' },
    { code: '50200', name: '상여금 및 퇴직적립금', category: '인건비' },
    { code: '50300', name: '제세공과 및 복리후생비', category: '운영비' },
    { code: '50400', name: '예배행사비', category: '사역비' },
    { code: '50500', name: '교육훈련 및 수련회비', category: '사역비' },
    { code: '50600', name: '국내외 선교구제지원비', category: '사역비' },
    { code: '50700', name: '차량유지비(유류/보험)', category: '관리비' },
    { code: '50800', name: '지급임차료', category: '관리비' },
    { code: '50900', name: '수도광열비(전기/가스/수도)', category: '관리비' },
    { code: '51000', name: '시설유지수선비', category: '관리비' },
    { code: '51100', name: '소모품비 및 인쇄출판비', category: '관리비' },
    { code: '51200', name: '통신비 및 전산유지비', category: '관리비' },
    { code: '52000', name: '금융지급이자 및 수수료', category: '금융비용' },
    { code: '59000', name: '예비비지출', category: '기타비용' }
  ]
};

const ALL_ACCOUNTS = [
  ...COA.ASSET.map(a => ({ ...a, type: '자산' })),
  ...COA.LIABILITY.map(a => ({ ...a, type: '부채' })),
  ...COA.EQUITY.map(a => ({ ...a, type: '자본' })),
  ...COA.REVENUE.map(a => ({ ...a, type: '수익' })),
  ...COA.EXPENSE.map(a => ({ ...a, type: '비용' }))
];

const PROOF_TYPES = [
  '전자세금계산서',
  '전자계산서',
  '법인(교회)카드',
  '현금영수증(지출증빙)',
  '원천징수영수증',
  '간이영수증',
  '입금증/이체확인증'
];

// 엔터프라이즈 모노크롬 SVG 아이콘 세트
const SvgPlus = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const SvgClose = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const SvgSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const SvgPrint = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.728 6.75H17.27m-10.542 0A2.25 2.25 0 004.5 9v6a2.25 2.25 0 002.25 2.25h10.5A2.25 2.25 0 0019.5 15V9a2.25 2.25 0 00-2.25-2.25m-10.542 0V4.5a2.25 2.25 0 012.25-2.25h6a2.25 2.25 0 012.25 2.25v2.25m-10.542 0h10.542" /></svg>;
const SvgCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const SvgAlert = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>;
const SvgRefresh = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>;

export default function ErpFinancialLedger() {
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'trial_balance' | 'financial_statements' | 'budget'
  const [ledgerList, setLedgerList] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptBudget, setNewDeptBudget] = useState('');

  const [filterPeriod, setFilterPeriod] = useState('ALL');
  const [filterVoucherType, setFilterVoucherType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [openingBankName, setOpeningBankName] = useState('보통예금(주거래)');

  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // 전표 초기 템플릿
  const initialFormState = {
    voucher_type: '지출결의서',
    transaction_date: new Date().toISOString().split('T')[0],
    department: '재정부',
    manager: '회계간사',
    description: '',
    proof_type: '전자세금계산서',
    has_receipt: false,
    receipt_url: '',
    is_approved: false,
    lines: [
      { id: 1, account_code: '50400', debit: '', credit: '', memo: '' },
      { id: 2, account_code: '10300', debit: '', credit: '', memo: '' }
    ]
  };
  const [formData, setFormData] = useState(initialFormState);

  // 1. Supabase 원장 및 예산 데이터 조회
  const fetchData = useCallback(async () => {
    if (!supabase) return;
    try {
      const [ledgerRes, budgetRes] = await Promise.all([
        supabase.from('erp_financial_ledger').select('*').order('transaction_date', { ascending: true }),
        supabase.from('erp_department_budgets').select('*')
      ]);

      if (!ledgerRes.error && ledgerRes.data) {
        const standardizedData = ledgerRes.data.map((item, idx) => {
          const amt = Number(item.amount) || 0;
          const assignedId = item.id || `VCH-${item.transaction_date.replace(/-/g, '').slice(0, 6)}-${String(idx + 1).padStart(4, '0')}`;
          
          if (item.lines && Array.isArray(item.lines)) {
            return { ...item, id: assignedId, status: item.status || 'POSTED' };
          }

          return {
            ...item,
            id: assignedId,
            status: item.status || 'POSTED',
            voucher_type: item.voucher_type || (amt > 0 ? '지출결의서' : '수입결의서'),
            proof_type: item.proof_type || '전자세금계산서',
            lines: [
              { account_code: '50300', account_name: item.debit_account || '사역지원비(부서)', debit: amt, credit: 0, memo: item.description },
              { account_code: '10300', account_name: item.credit_account || '보통예금', debit: 0, credit: amt, memo: item.description }
            ]
          };
        });
        setLedgerList(standardizedData);
      }

      if (!budgetRes.error && budgetRes.data) {
        const bMap = {};
        budgetRes.data.forEach(b => { bMap[b.department] = b.allocated_budget; });
        setBudgets(bMap);
      }
    } catch (e) {}
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 분개 라인 관리
  const handleAddLine = () => {
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, { id: Date.now(), account_code: '50900', debit: '', credit: '', memo: '' }]
    }));
  };

  const handleRemoveLine = (id) => {
    if (formData.lines.length <= 2) return alert('복식부기 원칙상 최소 2개 이상의 차변·대변 계정과목이 필요합니다.');
    setFormData(prev => ({ ...prev, lines: prev.lines.filter(l => l.id !== id) }));
  };

  const handleLineChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map(l => l.id === id ? { ...l, [field]: value } : l)
    }));
  };

  // 실시간 대차평균 계산
  const totalDebit = useMemo(() => formData.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0), [formData.lines]);
  const totalCredit = useMemo(() => formData.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0), [formData.lines]);
  const balanceDifference = Math.abs(totalDebit - totalCredit);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  // 증빙 서류 업로드
  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) return alert('증빙 파일은 25MB 이하만 업로드 가능합니다.');

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `voucher_proof_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('chat_attachments').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('chat_attachments').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, receipt_url: publicUrlData.publicUrl, has_receipt: true }));
      alert('공직 회계 적격증빙 사본이 안전하게 시스템에 등록되었습니다.');
    } catch (err) {
      alert('증빙 업로드 실패: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 🌟 [핵심] 기초 자산(전기이월금) 등록기 - 통장 마이너스 원천 방지
  const handleSaveOpeningBalance = async (e) => {
    e.preventDefault();
    const amount = Number(openingAmount) || 0;
    if (amount <= 0) return alert('기초 자산(전기이월금)은 0원보다 커야 합니다.');

    const datePrefix = new Date().getFullYear() + '01';
    const voucherId = `OPN-${datePrefix}-0001`;

    const payload = {
      id: voucherId,
      voucher_type: '대체전표',
      transaction_date: `${new Date().getFullYear()}-01-01`,
      department: '재정부',
      manager: '회계책임관',
      description: `[전기이월] ${openingBankName} 기초 잔액 설정`,
      proof_type: '입금증/이체확인증',
      has_receipt: false,
      receipt_url: '',
      lines: [
        { account_code: '10300', account_name: '보통예금(운영계좌)', debit: amount, credit: 0, memo: '전기이월 통장 시작 잔고' },
        { account_code: '31000', account_name: '전기이월이익잉여금(이월잔액)', debit: 0, credit: amount, memo: '기초 잉여금 자본 설정' }
      ],
      status: 'POSTED',
      amount: amount,
      is_approved: true,
      approver: '시스템승인',
      approved_at: new Date().toISOString()
    };

    if (supabase) {
      const { error } = await supabase.from('erp_financial_ledger').insert([payload]);
      if (error && error.code === 'PGRST204') {
        const safePayload = {
          id: payload.id,
          transaction_date: payload.transaction_date,
          description: payload.description,
          amount: payload.amount,
          debit_account: '보통예금',
          credit_account: '전기이월금'
        };
        await supabase.from('erp_financial_ledger').insert([safePayload]);
      }
    }

    setLedgerList(prev => [payload, ...prev]);
    setShowOpeningModal(false);
    setOpeningAmount('');
    alert(`기초 자산 ₩${amount.toLocaleString()}원이 장부에 정상 기장되어 통장 마이너스가 해소되었습니다.`);
  };

  // 전표 기장 처리
  const handleSaveVoucher = async (e) => {
    e.preventDefault();
    if (!formData.description.trim()) return alert('전표 적요는 감사 필수 기재 항목입니다.');
    if (!isBalanced) return alert(`대차평균이 일치하지 않습니다. 불일치 차액: ₩${balanceDifference.toLocaleString()}`);

    const enrichedLines = formData.lines.map(l => {
      const acc = ALL_ACCOUNTS.find(a => a.code === l.account_code);
      return {
        ...l,
        account_name: acc ? acc.name : '계정미지정',
        category: acc ? acc.category : '기타'
      };
    });

    const datePrefix = formData.transaction_date.replace(/-/g, '').slice(0, 6);
    const generatedVoucherNo = `VCH-${datePrefix}-${String(ledgerList.length + 1).padStart(4, '0')}`;

    const payload = {
      id: generatedVoucherNo,
      voucher_type: formData.voucher_type,
      transaction_date: formData.transaction_date,
      department: formData.department,
      manager: formData.manager,
      description: formData.description.trim(),
      proof_type: formData.proof_type,
      has_receipt: formData.has_receipt,
      receipt_url: formData.receipt_url,
      lines: enrichedLines,
      status: 'POSTED',
      amount: totalDebit,
      is_approved: formData.is_approved,
      approver: formData.is_approved ? '회계책임관' : null,
      approved_at: formData.is_approved ? new Date().toISOString() : null
    };

    if (supabase) {
      const { error } = await supabase.from('erp_financial_ledger').insert([payload]);
      if (error && error.code === 'PGRST204') {
        const safePayload = {
          id: payload.id,
          transaction_date: payload.transaction_date,
          description: payload.description,
          amount: payload.amount,
          debit_account: enrichedLines.find(l => Number(l.debit) > 0)?.account_name || '차변과목',
          credit_account: enrichedLines.find(l => Number(l.credit) > 0)?.account_name || '대변과목'
        };
        await supabase.from('erp_financial_ledger').insert([safePayload]);
      }
    }

    setLedgerList(prev => [payload, ...prev]);
    setShowEntryModal(false);
    setFormData(initialFormState);
    alert(`[${generatedVoucherNo}] 회계 전표가 승인 대기열에 정식 기장되었습니다.`);
  };

  // 전표 결재 승인 토글
  const handleToggleApproval = async (id, currentStatus) => {
    const nextStatus = !currentStatus;
    const approver = nextStatus ? '담임목사/회계책임관(인)' : null;
    const approved_at = nextStatus ? new Date().toISOString() : null;

    setLedgerList(prev => prev.map(item => item.id === id ? { ...item, is_approved: nextStatus, approver, approved_at } : item));
    if (selectedVoucher?.id === id) setSelectedVoucher(prev => ({ ...prev, is_approved: nextStatus, approver, approved_at }));

    if (supabase) {
      await supabase.from('erp_financial_ledger').update({ is_approved: nextStatus, approver, approved_at }).eq('id', id);
    }
  };

  // 역분개(Reversal Journal) 취소
  const handleReverseVoucher = async (voucher) => {
    if (voucher.status === 'CANCELED') return alert('이미 감액 취소 처리된 전표입니다.');
    if (!window.confirm('선택한 전표를 상계 취소하시겠습니까?\n공공 회계 원칙에 따라 장부는 임의 삭제되지 않고, 정식 (-)역분개 전표가 추가 기장됩니다.')) return;

    const updatedOriginal = { ...voucher, status: 'CANCELED', description: `[취소·폐기] ${voucher.description}` };
    const reversedLines = voucher.lines.map(l => ({
      ...l,
      debit: l.credit,
      credit: l.debit,
      memo: `[역분개 취소] ${l.memo || voucher.description}`
    }));

    const datePrefix = new Date().toISOString().replace(/-/g, '').slice(0, 6);
    const reversePayload = {
      ...voucher,
      id: `REV-${datePrefix}-${String(Date.now()).slice(-4)}`,
      description: `[역분개 상계] 원전표번호: ${voucher.id}`,
      lines: reversedLines,
      status: 'REVERSED',
      is_approved: true,
      approver: '감사시스템(자동)',
      approved_at: new Date().toISOString()
    };

    if (supabase) {
      await supabase.from('erp_financial_ledger').update({ description: updatedOriginal.description }).eq('id', voucher.id);
      await supabase.from('erp_financial_ledger').insert([reversePayload]);
    }

    setLedgerList(prev => prev.map(item => item.id === voucher.id ? updatedOriginal : item).concat(reversePayload));
    if (selectedVoucher?.id === voucher.id) setSelectedVoucher(updatedOriginal);
    alert('정식 회계 역분개 전표가 발행되어 원전표가 적법하게 상계 취소되었습니다.');
  };

  // 부서별 세출예산 배정
  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim() || !newDeptBudget) return alert('사역 부서명과 연간 배정 예산을 입력하세요.');
    const allocated = Number(newDeptBudget) || 0;
    const payload = { department: newDeptName.trim(), allocated_budget: allocated };

    if (supabase) {
      await supabase.from('erp_department_budgets').upsert([payload], { onConflict: 'department' });
    }

    setBudgets(prev => ({ ...prev, [payload.department]: allocated }));
    setNewDeptName('');
    setNewDeptBudget('');
    alert(`[${payload.department}] 부서 회계연도 예산이 성공적으로 배정되었습니다.`);
  };

  // 2. 재무상태표 및 손익 집계
  const financialData = useMemo(() => {
    let revenue = 0; let expense = 0;
    let assets = 0; let liabilities = 0; let equity = 0;

    ledgerList.forEach(voucher => {
      if (voucher.status === 'CANCELED') return;
      (voucher.lines || []).forEach(line => {
        const d = Number(line.debit) || 0;
        const c = Number(line.credit) || 0;
        const code = String(line.account_code || '00000');

        if (code.startsWith('1')) assets += (d - c);
        if (code.startsWith('2')) liabilities += (c - d);
        if (code.startsWith('3')) equity += (c - d);
        if (code.startsWith('4')) revenue += (c - d);
        if (code.startsWith('5')) expense += (d - c);

        if (code === '00000') {
          if (line.account_name?.includes('헌금') || line.account_name?.includes('수입')) revenue += (c - d);
          else if (line.account_name?.includes('비') || line.account_name?.includes('사례')) expense += (d - c);
          else assets += (d - c);
        }
      });
    });

    const netIncome = revenue - expense;
    const totalEquity = equity + netIncome;
    return { revenue, expense, netIncome, assets, liabilities, equity, totalEquity };
  }, [ledgerList]);

  // 3. 🏛️ 합계잔액시산표(Trial Balance) 계정별 완전 대사표
  const trialBalanceData = useMemo(() => {
    const accMap = {};

    ALL_ACCOUNTS.forEach(a => {
      accMap[a.code] = {
        code: a.code,
        name: a.name,
        type: a.type,
        category: a.category,
        totalDebit: 0,
        totalCredit: 0,
        debitBalance: 0,
        creditBalance: 0
      };
    });

    ledgerList.forEach(v => {
      if (v.status === 'CANCELED') return;
      (v.lines || []).forEach(l => {
        const code = String(l.account_code || '00000');
        if (!accMap[code]) {
          accMap[code] = {
            code,
            name: l.account_name || '기타계정',
            type: code.startsWith('1') ? '자산' : code.startsWith('2') ? '부채' : code.startsWith('3') ? '자본' : code.startsWith('4') ? '수익' : '비용',
            category: '일반',
            totalDebit: 0,
            totalCredit: 0,
            debitBalance: 0,
            creditBalance: 0
          };
        }
        accMap[code].totalDebit += Number(l.debit) || 0;
        accMap[code].totalCredit += Number(l.credit) || 0;
      });
    });

    let sumDebitTotal = 0;
    let sumCreditTotal = 0;
    let sumDebitBal = 0;
    let sumCreditBal = 0;

    const rows = Object.values(accMap)
      .filter(a => a.totalDebit > 0 || a.totalCredit > 0)
      .map(a => {
        sumDebitTotal += a.totalDebit;
        sumCreditTotal += a.totalCredit;

        if (a.type === '자산' || a.type === '비용') {
          const bal = a.totalDebit - a.totalCredit;
          if (bal >= 0) a.debitBalance = bal;
          else a.creditBalance = Math.abs(bal);
        } else {
          const bal = a.totalCredit - a.totalDebit;
          if (bal >= 0) a.creditBalance = bal;
          else a.debitBalance = Math.abs(bal);
        }

        sumDebitBal += a.debitBalance;
        sumCreditBal += a.creditBalance;
        return a;
      })
      .sort((a, b) => a.code.localeCompare(b.code));

    return { rows, sumDebitTotal, sumCreditTotal, sumDebitBal, sumCreditBal };
  }, [ledgerList]);

  // 필터링된 전표 목록
  const filteredLedger = useMemo(() => {
    return ledgerList.filter(item => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        item.description?.toLowerCase().includes(q) ||
        item.manager?.toLowerCase().includes(q) ||
        item.id?.toLowerCase().includes(q) ||
        item.department?.toLowerCase().includes(q);

      let matchesPeriod = true;
      if (filterPeriod === 'monthly') matchesPeriod = item.transaction_date?.startsWith(new Date().toISOString().substring(0, 7));
      else if (filterPeriod === 'yearly') matchesPeriod = item.transaction_date?.startsWith(new Date().getFullYear().toString());

      let matchesType = true;
      if (filterVoucherType !== 'ALL') matchesType = item.voucher_type === filterVoucherType;

      return matchesSearch && matchesPeriod && matchesType;
    }).sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
  }, [ledgerList, filterPeriod, filterVoucherType, searchTerm]);

  // 부서별 예산 실집행 분석
  const departmentExecution = useMemo(() => {
    const depts = Object.keys(budgets);
    return depts.map(dept => {
      const allocated = budgets[dept] || 0;
      const executed = ledgerList.filter(v => v.department === dept && v.status !== 'CANCELED').reduce((acc, v) => {
        const expLine = v.lines?.find(l => String(l.account_code).startsWith('5') || (l.account_name && l.account_name.includes('비')));
        return acc + (expLine ? Number(expLine.debit || 0) : 0);
      }, 0);
      const remaining = allocated - executed;
      const rate = allocated > 0 ? Math.min(100, Math.round((executed / allocated) * 100)) : 0;
      return { dept, allocated, executed, remaining, rate };
    });
  }, [budgets, ledgerList]);

  return (
    <div className="flex flex-col h-full w-full bg-white font-sans text-zinc-900 text-[12px] select-none">
      
      {/* =========================================================================
          [1] 공직 감사원 규격 메트릭 헤더 (풀 와이드 100% 레이아웃)
          ========================================================================= */}
      <div className="w-full bg-zinc-950 text-zinc-100 px-6 py-3.5 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shrink-0 border-b border-zinc-800">
        
        <div className="flex flex-wrap items-center gap-5 w-full xl:w-auto">
          <div className="flex items-center gap-2.5 pr-5 border-r border-zinc-800 shrink-0">
            <span className="font-mono text-[10px] font-black tracking-widest text-zinc-400 uppercase bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">PUBLIC AUDIT</span>
            <span className="font-black text-[15px] text-white tracking-tight">회계재정·세입세출 원장</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-5 font-mono text-[11.5px] font-bold">
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[9.5px] uppercase tracking-wider">자산 총액 (Assets)</span>
              <span className={`text-[15px] leading-tight ${financialData.assets >= 0 ? 'text-white' : 'text-rose-400'}`}>
                ₩{financialData.assets.toLocaleString()}
              </span>
            </div>
            <span className="w-px h-6 bg-zinc-800 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[9.5px] uppercase tracking-wider">세입 누적 (Revenue)</span>
              <span className="text-zinc-200 text-[15px] leading-tight">₩{financialData.revenue.toLocaleString()}</span>
            </div>
            <span className="w-px h-6 bg-zinc-800 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[9.5px] uppercase tracking-wider">세출 집행 (Expense)</span>
              <span className="text-zinc-200 text-[15px] leading-tight">₩{financialData.expense.toLocaleString()}</span>
            </div>
            <span className="w-px h-6 bg-zinc-800 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-zinc-500 text-[9.5px] uppercase tracking-wider">당기 운영차액 (Net)</span>
              <span className={`text-[15px] leading-tight ${financialData.netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₩{financialData.netIncome.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 상단 탭 및 액션 버튼군 */}
        <div className="flex items-center gap-2.5 w-full xl:w-auto overflow-x-auto hide-scrollbar shrink-0">
          <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[11px] font-bold">
            <button 
              onClick={() => setActiveTab('ledger')} 
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${activeTab === 'ledger' ? 'bg-zinc-800 text-white font-black' : 'text-zinc-400 hover:text-white'}`}
            >
              분개장 (Journal)
            </button>
            <button 
              onClick={() => setActiveTab('trial_balance')} 
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${activeTab === 'trial_balance' ? 'bg-zinc-800 text-white font-black' : 'text-zinc-400 hover:text-white'}`}
            >
              합계잔액시산표 (T/B)
            </button>
            <button 
              onClick={() => setActiveTab('financial_statements')} 
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${activeTab === 'financial_statements' ? 'bg-zinc-800 text-white font-black' : 'text-zinc-400 hover:text-white'}`}
            >
              재무상태·수지표
            </button>
            <button 
              onClick={() => setActiveTab('budget')} 
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${activeTab === 'budget' ? 'bg-zinc-800 text-white font-black' : 'text-zinc-400 hover:text-white'}`}
            >
              세출예산 통제
            </button>
          </div>

          <button 
            onClick={() => setShowOpeningModal(true)} 
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
            title="기초 통장 잔액을 설정하여 자산 마이너스를 해소합니다"
          >
            <SvgRefresh /> 기초자산 설정
          </button>

          <button 
            onClick={() => setShowEntryModal(true)} 
            className="px-4 py-1.5 bg-white text-zinc-950 font-black rounded-lg text-[11.5px] hover:bg-zinc-100 shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
          >
            <SvgPlus /> 복식 전표 기장
          </button>
        </div>
      </div>

      {/* =========================================================================
          [탭 1] 🏛️ 풀 와이드 고밀도 분개장 (Full-Width General Journal)
          ========================================================================= */}
      {activeTab === 'ledger' && (
        <div className="flex-1 w-full flex flex-col min-h-0 bg-white overflow-hidden">
          {/* 필터 툴바 */}
          <div className="w-full px-6 py-2.5 border-b border-zinc-200 flex flex-wrap justify-between items-center gap-3 bg-zinc-50 shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex bg-zinc-200/70 rounded-md p-0.5 text-[11px] font-bold">
                <button onClick={() => setFilterPeriod('ALL')} className={`px-3 py-1 rounded transition-colors ${filterPeriod === 'ALL' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600'}`}>전체 기간</button>
                <button onClick={() => setFilterPeriod('monthly')} className={`px-3 py-1 rounded transition-colors ${filterPeriod === 'monthly' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600'}`}>당월</button>
                <button onClick={() => setFilterPeriod('yearly')} className={`px-3 py-1 rounded transition-colors ${filterPeriod === 'yearly' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600'}`}>당해연도</button>
              </div>

              <select 
                value={filterVoucherType} 
                onChange={e => setFilterVoucherType(e.target.value)}
                className="px-3 py-1 text-[11px] font-bold bg-white border border-zinc-300 rounded-md outline-none text-zinc-800 cursor-pointer"
              >
                <option value="ALL">전체 전표 구분</option>
                <option value="지출결의서">지출결의서</option>
                <option value="수입결의서">수입결의서</option>
                <option value="대체전표">대체전표</option>
              </select>
            </div>

            <div className="relative w-full sm:w-80">
              <span className="absolute left-3 top-2 text-zinc-400 pointer-events-none"><SvgSearch /></span>
              <input 
                type="text" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                placeholder="전표번호, 적요, 부서, 담당자 검색..." 
                className="w-full pl-9 pr-3 py-1.5 border border-zinc-300 bg-white rounded-md text-[11.5px] outline-none focus:border-zinc-900 font-bold placeholder:text-zinc-400 transition-colors" 
              />
            </div>
          </div>

          {/* 풀 와이드 전표 목록 */}
          <div className="flex-1 w-full overflow-y-auto px-6 py-4 space-y-3 bg-zinc-100/50">
            {filteredLedger.length === 0 ? (
              <div className="w-full text-center py-24 bg-white border border-zinc-200 rounded-xl text-zinc-400 font-bold text-[13px]">
                기장된 회계 전표 내역이 없습니다. 상단 [+ 복식 전표 기장]을 통해 전표를 발행하세요.
              </div>
            ) : (
              filteredLedger.map((voucher) => (
                <div 
                  key={voucher.id} 
                  onClick={() => setSelectedVoucher(voucher)} 
                  className={`w-full bg-white border rounded-xl p-4 transition-all cursor-pointer shadow-2xs hover:border-zinc-400 ${
                    voucher.status === 'CANCELED' 
                      ? 'border-zinc-200 bg-zinc-50/70 opacity-60' 
                      : voucher.status === 'REVERSED' 
                      ? 'border-zinc-300 bg-zinc-100/50' 
                      : 'border-zinc-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10.5px] font-black text-zinc-700 bg-zinc-100 border border-zinc-300 px-2 py-0.5 rounded">
                          {voucher.id}
                        </span>
                        <span className="font-black text-[14px] text-zinc-900">{voucher.description}</span>
                        {voucher.status === 'CANCELED' && <span className="bg-rose-100 text-rose-700 px-2 py-0.2 rounded text-[9.5px] font-black">폐기취소</span>}
                        {voucher.status === 'REVERSED' && <span className="bg-zinc-800 text-white px-2 py-0.2 rounded text-[9.5px] font-black">역분개</span>}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-2">
                        <span>발의일: {voucher.transaction_date}</span>
                        <span>•</span>
                        <span>부서: {voucher.department}</span>
                        <span>•</span>
                        <span>기안자: {voucher.manager || '미상'}</span>
                        <span>•</span>
                        <span>증빙: {voucher.proof_type || '영수증'}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-black text-[16px] text-zinc-950">
                        ₩{Number(voucher.amount || 0).toLocaleString()}
                      </div>
                      <div className="mt-1 flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black border ${
                          voucher.is_approved 
                            ? 'bg-zinc-900 text-white border-zinc-900' 
                            : 'bg-white text-zinc-500 border-zinc-300'
                        }`}>
                          {voucher.is_approved ? '결재승인 (필)' : '결재대기'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 세부 분개 라인 테이블 (풀 와이드) */}
                  <div className="w-full rounded-lg border border-zinc-200 overflow-hidden bg-white">
                    <table className="w-full text-left border-collapse text-[11.5px]">
                      <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-4 border-r border-zinc-100 w-64">계정코드 및 과목명</th>
                          <th className="py-2 px-4 border-r border-zinc-100">세부 적요 (Line Memo)</th>
                          <th className="py-2 px-4 text-right w-44 border-r border-zinc-100 font-mono">차변 (Debit)</th>
                          <th className="py-2 px-4 text-right w-44 font-mono">대변 (Credit)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-mono">
                        {(voucher.lines || []).map((l, i) => (
                          <tr key={i} className="hover:bg-zinc-50/50">
                            <td className="py-2 px-4 border-r border-zinc-100 font-sans">
                              <span className="text-zinc-400 mr-2 font-mono">[{l.account_code || '00000'}]</span>
                              <span className="font-bold text-zinc-900">{l.account_name}</span>
                            </td>
                            <td className="py-2 px-4 border-r border-zinc-100 font-sans text-zinc-600 truncate">
                              {l.memo || '-'}
                            </td>
                            <td className="py-2 px-4 text-right border-r border-zinc-100 font-bold text-zinc-900">
                              {Number(l.debit) > 0 ? `₩${Number(l.debit).toLocaleString()}` : ''}
                            </td>
                            <td className="py-2 px-4 text-right font-bold text-zinc-900">
                              {Number(l.credit) > 0 ? `₩${Number(l.credit).toLocaleString()}` : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          [탭 2] 🏛️️ 합계잔액시산표 (Full-Width Trial Balance)
          ========================================================================= */}
      {activeTab === 'trial_balance' && (
        <div className="flex-1 w-full overflow-y-auto px-6 py-5 bg-zinc-100/50">
          <div className="w-full bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-2xs">
            
            <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center">
              <div>
                <h3 className="font-black text-zinc-900 text-[14.5px] tracking-tight">합계잔액시산표 (Trial Balance)</h3>
                <span className="text-[11px] font-mono text-zinc-500">
                  대차평균검증: 차변합계와 대변합계의 일치 여부를 전면 대사합니다.
                </span>
              </div>
              <button 
                onClick={() => window.print()} 
                className="px-3.5 py-1.5 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-lg text-[11px] font-bold text-zinc-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <SvgPrint /> 시산표 인쇄
              </button>
            </div>

            <table className="w-full text-left border-collapse text-[12px] font-mono">
              <thead>
                <tr className="bg-zinc-100/70 border-b border-zinc-200 text-zinc-600 font-black uppercase text-[10.5px] text-center">
                  <th className="py-2.5 px-4 border-r border-zinc-200 w-44">차변 잔액</th>
                  <th className="py-2.5 px-4 border-r border-zinc-200 w-44">차변 합계</th>
                  <th className="py-2.5 px-6 border-r border-zinc-200 font-sans text-left">계정과목 (Account COA)</th>
                  <th className="py-2.5 px-4 border-r border-zinc-200 w-44">대변 합계</th>
                  <th className="py-2.5 px-4 w-44">대변 잔액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {trialBalanceData.rows.map((row) => (
                  <tr key={row.code} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-2.5 px-4 border-r border-zinc-100 text-right text-zinc-900 font-bold">
                      {row.debitBalance > 0 ? `₩${row.debitBalance.toLocaleString()}` : ''}
                    </td>
                    <td className="py-2.5 px-4 border-r border-zinc-100 text-right text-zinc-500">
                      {row.totalDebit > 0 ? `₩${row.totalDebit.toLocaleString()}` : ''}
                    </td>
                    <td className="py-2.5 px-6 border-r border-zinc-100 font-sans font-bold text-zinc-900">
                      <span className="font-mono text-zinc-400 text-[10.5px] mr-2">[{row.code}]</span>
                      {row.name}
                      <span className="text-[10px] text-zinc-400 font-normal ml-2 font-mono">({row.type} · {row.category})</span>
                    </td>
                    <td className="py-2.5 px-4 border-r border-zinc-100 text-right text-zinc-500">
                      {row.totalCredit > 0 ? `₩${row.totalCredit.toLocaleString()}` : ''}
                    </td>
                    <td className="py-2.5 px-4 text-right text-zinc-900 font-bold">
                      {row.creditBalance > 0 ? `₩${row.creditBalance.toLocaleString()}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-zinc-100 border-t-2 border-zinc-300 font-black text-zinc-900 text-[13px]">
                <tr>
                  <td className="py-3 px-4 border-r border-zinc-200 text-right">
                    ₩{trialBalanceData.sumDebitBal.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 border-r border-zinc-200 text-right">
                    ₩{trialBalanceData.sumDebitTotal.toLocaleString()}
                  </td>
                  <td className="py-3 px-6 border-r border-zinc-200 font-sans text-center">
                    합 계 (Total Balance)
                  </td>
                  <td className="py-3 px-4 border-r border-zinc-200 text-right">
                    ₩{trialBalanceData.sumCreditTotal.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    ₩{trialBalanceData.sumCreditBal.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td colSpan={5} className="py-2 px-4 text-center text-[11px] font-sans font-bold bg-zinc-200/60">
                    대차평균검증: 차변합계(₩{trialBalanceData.sumDebitTotal.toLocaleString()}) = 대변합계(₩{trialBalanceData.sumCreditTotal.toLocaleString()}) • 잔액일치(₩{trialBalanceData.sumDebitBal.toLocaleString()})
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          [탭 3] 🏛️ 풀 와이드 재무제표 (B/S & Income Statement)
          ========================================================================= */}
      {activeTab === 'financial_statements' && (
        <div className="flex-1 w-full overflow-y-auto px-6 py-5 bg-zinc-100/50 space-y-5">
          <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-5">
            
            {/* 재무상태표 */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="border-b border-zinc-200 pb-3 flex justify-between items-end mb-4">
                  <div>
                    <h4 className="font-black text-zinc-900 text-[15.5px] tracking-tight">재무상태표 (Balance Sheet)</h4>
                    <span className="text-[11px] font-mono text-zinc-500">당기말 현재 자산, 부채 및 기본금(자본) 상태</span>
                  </div>
                  <button onClick={() => window.print()} className="px-3 py-1.5 bg-white border border-zinc-300 text-zinc-700 font-bold rounded-md text-[11px] shadow-2xs">
                    <SvgPrint /> 인쇄
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6 font-mono text-[12.5px]">
                  <div className="space-y-1.5">
                    <div className="border-b-2 border-zinc-800 pb-1.5 mb-2 font-bold font-sans text-[13px] text-zinc-900">자 산 (Assets)</div>
                    <div className="flex justify-between py-1 text-zinc-600"><span>유동자산 (예금/현금)</span><span>₩{financialData.assets.toLocaleString()}</span></div>
                    <div className="flex justify-between py-1 text-zinc-400"><span>고정자산 (토지/건물/비품)</span><span>₩0</span></div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="border-b-2 border-zinc-800 pb-1.5 mb-2 font-bold font-sans text-[13px] text-zinc-900">부채 및 기본금 (Liabilities & Fund)</div>
                    <div className="flex justify-between py-1 text-zinc-600"><span>부채총계 (미지급/예수금)</span><span>₩{financialData.liabilities.toLocaleString()}</span></div>
                    <div className="flex justify-between py-1 text-zinc-600"><span>기본금 (원금/전기이월)</span><span>₩{financialData.equity.toLocaleString()}</span></div>
                    <div className="flex justify-between py-1 text-zinc-600"><span>당기운영차액 (순이익)</span><span>₩{financialData.netIncome.toLocaleString()}</span></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 font-mono text-[13.5px] mt-6 pt-3 border-t border-zinc-200">
                <div className="flex justify-between py-2 font-black text-zinc-900 bg-zinc-50 px-2 rounded">
                  <span>자산총계</span><span>₩{financialData.assets.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 font-black text-zinc-900 bg-zinc-50 px-2 rounded">
                  <span>부채와기본금총계</span><span>₩{(financialData.liabilities + financialData.totalEquity).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 수지운영계산서 */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="border-b border-zinc-200 pb-3 mb-4">
                  <h4 className="font-black text-zinc-900 text-[15.5px] tracking-tight">수지운영계산서 (Statement of Operations)</h4>
                  <span className="text-[11px] font-mono text-zinc-500">당해 회계연도 총 세입 및 세출 운영 성과</span>
                </div>

                <div className="space-y-3 font-mono text-[13px]">
                  <div className="bg-zinc-50 p-3.5 rounded-lg border border-zinc-200 flex justify-between items-center font-bold font-sans">
                    <span className="text-zinc-700">I. 총 세입 수입액 (Revenues)</span>
                    <span className="font-mono text-[15px] font-black text-zinc-950">₩{financialData.revenue.toLocaleString()}</span>
                  </div>
                  <div className="bg-zinc-50 p-3.5 rounded-lg border border-zinc-200 flex justify-between items-center font-bold font-sans">
                    <span className="text-zinc-700">II. 총 세출 집행액 (Expenses)</span>
                    <span className="font-mono text-[15px] font-black text-zinc-950">₩{financialData.expense.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950 text-white p-4 rounded-lg flex justify-between items-center font-bold font-sans shadow-2xs mt-6">
                <span>III. 당기 운영 차액 (Net Surplus)</span>
                <span className="font-mono text-[17px] font-black text-zinc-100">₩{financialData.netIncome.toLocaleString()}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          [탭 4] 🏛️ 풀 와이드 세출예산 통제 대사표
          ========================================================================= */}
      {activeTab === 'budget' && (
        <div className="flex-1 w-full overflow-y-auto px-6 py-5 bg-zinc-100/50 space-y-4">
          <div className="w-full bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-3">
            <h4 className="font-black text-zinc-900 text-[13.5px]">사역부서별 세출예산 배정 등록</h4>
            <form onSubmit={handleSaveBudget} className="flex flex-col sm:flex-row items-end gap-3 text-[11.5px]">
              <div className="flex-1 w-full">
                <label className="block font-bold text-zinc-500 uppercase tracking-wider mb-1">사역 부서명</label>
                <input 
                  type="text" 
                  value={newDeptName} 
                  onChange={e => setNewDeptName(e.target.value)} 
                  placeholder="예: 청년교구, 찬양위원회, 교육부서" 
                  className="w-full border border-zinc-300 bg-white p-2.5 rounded-lg font-bold outline-none focus:border-zinc-900 transition-colors shadow-2xs" 
                  required 
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block font-bold text-zinc-500 uppercase tracking-wider mb-1">연간 배정 예산액 (KRW)</label>
                <input 
                  type="number" 
                  value={newDeptBudget} 
                  onChange={e => setNewDeptBudget(e.target.value)} 
                  placeholder="금액 입력" 
                  className="w-full border border-zinc-300 bg-white p-2.5 rounded-lg font-mono font-bold outline-none focus:border-zinc-900 transition-colors shadow-2xs" 
                  required 
                />
              </div>
              <button 
                type="submit" 
                className="w-full sm:w-auto px-6 py-2.5 bg-zinc-900 text-white font-black text-[11.5px] rounded-lg hover:bg-zinc-800 cursor-pointer shadow-2xs active:scale-95 transition-all"
              >
                예산 배정
              </button>
            </form>
          </div>

          <div className="w-full bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="px-5 py-3 border-b border-zinc-200 bg-zinc-50 font-black text-[13.5px] text-zinc-900">
              부서별 세출예산 집행 실적 대사표
            </div>
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="bg-zinc-100/70 border-b border-zinc-200 text-zinc-500 font-black uppercase text-[10.5px]">
                  <th className="py-2.5 px-5 border-r border-zinc-200">사역 부서</th>
                  <th className="py-2.5 px-5 border-r border-zinc-200 text-right w-48 font-mono">배정 예산 (A)</th>
                  <th className="py-2.5 px-5 border-r border-zinc-200 text-right w-48 font-mono">실집행액 (B)</th>
                  <th className="py-2.5 px-5 border-r border-zinc-200 text-right w-48 font-mono">가용 잔액 (A-B)</th>
                  <th className="py-2.5 px-5 border-r border-zinc-200 w-72">집행률 진행도</th>
                  <th className="py-2.5 px-4 text-center w-28">건전도 진단</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {departmentExecution.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-zinc-400 font-bold">등록된 부서 예산이 없습니다.</td></tr>
                ) : (
                  departmentExecution.map(row => (
                    <tr key={row.dept} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3 px-5 border-r border-zinc-100 font-black text-zinc-900">{row.dept}</td>
                      <td className="py-3 px-5 border-r border-zinc-100 text-right font-mono text-zinc-600">₩{row.allocated.toLocaleString()}</td>
                      <td className="py-3 px-5 border-r border-zinc-100 text-right font-mono font-black text-zinc-950">₩{row.executed.toLocaleString()}</td>
                      <td className="py-3 px-5 border-r border-zinc-100 text-right font-mono font-black text-zinc-900 bg-zinc-50/50">₩{row.remaining.toLocaleString()}</td>
                      <td className="py-3 px-5 border-r border-zinc-100">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-zinc-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${row.rate > 90 ? 'bg-zinc-950' : 'bg-zinc-600'}`} 
                              style={{ width: `${Math.min(row.rate, 100)}%` }} 
                            />
                          </div>
                          <span className="font-mono font-bold text-[11px] w-10 text-right text-zinc-800">{row.rate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded text-[10.5px] font-black border ${
                          row.remaining < 0 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : row.rate > 85 
                            ? 'bg-amber-50 text-amber-800 border-amber-200' 
                            : 'bg-zinc-100 text-zinc-800 border-zinc-300'
                        }`}>
                          {row.remaining < 0 ? '예산초과' : row.rate > 85 ? '주의' : '정상'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          [모달 1] 기초 자산(전기이월금) 등록 모달
          ========================================================================= */}
      {showOpeningModal && (
        <div className="fixed inset-0 z-[500] bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-300 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <div>
                <h3 className="text-[15.5px] font-black text-zinc-900">기초 자산(전기이월금) 설정</h3>
                <span className="text-[11px] text-zinc-500">통장 시작 잔고를 등록하여 자산 마이너스를 해소합니다.</span>
              </div>
              <button onClick={() => setShowOpeningModal(false)} className="text-zinc-400 hover:text-zinc-800 cursor-pointer p-1"><SvgClose /></button>
            </div>

            <form onSubmit={handleSaveOpeningBalance} className="space-y-3.5 text-[12px]">
              <div>
                <label className="text-[11px] font-bold text-zinc-500 block mb-1">통장/계좌 구분</label>
                <input 
                  type="text" 
                  value={openingBankName} 
                  onChange={e => setOpeningBankName(e.target.value)} 
                  className="w-full p-2.5 border border-zinc-300 rounded-lg font-bold outline-none" 
                  required 
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 block mb-1">기초 잔액(이월금액, KRW)</label>
                <input 
                  type="number" 
                  value={openingAmount} 
                  onChange={e => setOpeningAmount(e.target.value)} 
                  placeholder="예: 50000000" 
                  className="w-full p-2.5 border border-zinc-300 rounded-lg font-mono font-bold text-[14px] outline-none" 
                  required 
                />
              </div>

              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-[11px] text-zinc-600">
                💡 <b>분개 자동 생성 안내</b><br />
                • 차변(Debit): 보통예금(운영계좌)<br />
                • 대변(Credit): 전기이월이익잉여금(자본)
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowOpeningModal(false)} className="px-4 py-2 bg-zinc-100 rounded-lg font-bold text-zinc-600">취소</button>
                <button type="submit" className="px-5 py-2 bg-zinc-900 text-white rounded-lg font-black shadow-sm">기초 자산 반영</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          [모달 2] 복식부기 전표 발행 모달 (대차 차액 실시간 인디케이터)
          ========================================================================= */}
      {showEntryModal && (
        <div className="fixed inset-0 z-[400] bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl font-sans flex flex-col max-h-[92vh] overflow-hidden border border-zinc-300">
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-200 bg-zinc-50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10.5px] font-black bg-zinc-900 text-white px-2 py-0.5 rounded">FORM-VCH</span>
                <h3 className="text-[15.5px] font-black text-zinc-900 tracking-tight">공식 회계 전표 기장 (Journal Entry)</h3>
              </div>
              <button onClick={() => setShowEntryModal(false)} className="text-zinc-400 hover:text-zinc-900 cursor-pointer p-1 rounded"><SvgClose /></button>
            </div>

            <form onSubmit={handleSaveVoucher} className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/30">
              
              <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs grid grid-cols-1 sm:grid-cols-4 gap-3 text-[11.5px]">
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1">전표 구분</label>
                  <select 
                    value={formData.voucher_type} 
                    onChange={e => setFormData({ ...formData, voucher_type: e.target.value })}
                    className="w-full border border-zinc-300 bg-zinc-50 p-2 rounded-lg font-bold outline-none cursor-pointer"
                  >
                    <option value="지출결의서">지출결의서 (출금)</option>
                    <option value="수입결의서">수입결의서 (입금)</option>
                    <option value="대체전표">대체전표</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1">기안 일자</label>
                  <input 
                    type="date" 
                    value={formData.transaction_date} 
                    onChange={e => setFormData({ ...formData, transaction_date: e.target.value })}
                    className="w-full border border-zinc-300 bg-zinc-50 p-2 rounded-lg font-mono font-bold outline-none cursor-pointer" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1">소속 부서</label>
                  <select 
                    value={formData.department} 
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full border border-zinc-300 bg-zinc-50 p-2 rounded-lg font-bold outline-none cursor-pointer"
                  >
                    {Object.keys(budgets).map(d => <option key={d} value={d}>{d}</option>)}
                    <option value="재정부">재정부</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1">적격 증빙 구분</label>
                  <select 
                    value={formData.proof_type} 
                    onChange={e => setFormData({ ...formData, proof_type: e.target.value })}
                    className="w-full border border-zinc-300 bg-zinc-50 p-2 rounded-lg font-bold outline-none cursor-pointer"
                  >
                    {PROOF_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="sm:col-span-4 border-t border-zinc-100 pt-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1">전표 대표 적요 (Description)</label>
                  <input 
                    type="text" 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="감사원 지출 목적 및 적요를 명확하게 기재하세요" 
                    className="w-full border border-zinc-300 bg-zinc-50 p-2.5 rounded-lg font-bold text-zinc-900 outline-none focus:bg-white focus:border-zinc-900 transition-colors" 
                    required 
                  />
                </div>
              </div>

              {/* 분개 라인 입력 그리드 */}
              <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center">
                  <span className="font-black text-[12px] text-zinc-800">분개 세부 항목 (Debit / Credit Lines)</span>
                  <button 
                    type="button" 
                    onClick={handleAddLine} 
                    className="px-2.5 py-1 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-md text-[10.5px] font-bold shadow-2xs cursor-pointer"
                  >
                    + 계정 라인 추가
                  </button>
                </div>

                <table className="w-full text-left border-collapse text-[11.5px]">
                  <thead>
                    <tr className="bg-zinc-50/50 border-b border-zinc-200 text-zinc-400 text-[9.5px] font-black uppercase tracking-wider">
                      <th className="py-2 px-3 w-64">계정과목 (Account COA)</th>
                      <th className="py-2 px-3">라인 적요</th>
                      <th className="py-2 px-3 w-40 text-right font-mono">차변 (Debit)</th>
                      <th className="py-2 px-3 w-40 text-right font-mono">대변 (Credit)</th>
                      <th className="py-2 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {formData.lines.map((line) => (
                      <tr key={line.id} className="hover:bg-zinc-50/40">
                        <td className="p-2">
                          <select 
                            value={line.account_code} 
                            onChange={e => handleLineChange(line.id, 'account_code', e.target.value)}
                            className="w-full p-2 bg-zinc-50 border border-zinc-300 rounded-md font-bold outline-none cursor-pointer text-[11px]"
                          >
                            <optgroup label="[1] 자산 (Assets)">{COA.ASSET.map(a => <option key={a.code} value={a.code}>[{a.code}] {a.name}</option>)}</optgroup>
                            <optgroup label="[2] 부채 (Liabilities)">{COA.LIABILITY.map(a => <option key={a.code} value={a.code}>[{a.code}] {a.name}</option>)}</optgroup>
                            <optgroup label="[3] 기본금·자본 (Equity)">{COA.EQUITY.map(a => <option key={a.code} value={a.code}>[{a.code}] {a.name}</option>)}</optgroup>
                            <optgroup label="[4] 수입·수익 (Revenue)">{COA.REVENUE.map(a => <option key={a.code} value={a.code}>[{a.code}] {a.name}</option>)}</optgroup>
                            <optgroup label="[5] 지출·비용 (Expense)">{COA.EXPENSE.map(a => <option key={a.code} value={a.code}>[{a.code}] {a.name}</option>)}</optgroup>
                          </select>
                        </td>
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={line.memo} 
                            onChange={e => handleLineChange(line.id, 'memo', e.target.value)}
                            placeholder="상세 적요..." 
                            className="w-full p-2 bg-zinc-50 border border-zinc-300 rounded-md outline-none text-[11px]" 
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            value={line.debit} 
                            onChange={e => handleLineChange(line.id, 'debit', e.target.value)}
                            disabled={Number(line.credit) > 0} 
                            placeholder="차변 금액" 
                            className="w-full p-2 bg-zinc-50 border border-zinc-300 rounded-md outline-none text-right font-mono font-bold text-zinc-900 disabled:opacity-20 text-[11px]" 
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            value={line.credit} 
                            onChange={e => handleLineChange(line.id, 'credit', e.target.value)}
                            disabled={Number(line.debit) > 0} 
                            placeholder="대변 금액" 
                            className="w-full p-2 bg-zinc-50 border border-zinc-300 rounded-md outline-none text-right font-mono font-bold text-zinc-900 disabled:opacity-20 text-[11px]" 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button 
                            type="button" 
                            onClick={() => handleRemoveLine(line.id)} 
                            className="p-1 text-zinc-400 hover:text-rose-600 rounded cursor-pointer"
                          >
                            <SvgClose />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-zinc-50 border-t-2 border-zinc-300 font-mono text-[12.5px]">
                    <tr>
                      <td colSpan={2} className="py-2.5 px-4 font-bold font-sans text-zinc-600 text-right">대차 합계</td>
                      <td className="py-2.5 px-4 text-right font-black text-zinc-950">₩{totalDebit.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-black text-zinc-950">₩{totalCredit.toLocaleString()}</td>
                      <td />
                    </tr>
                    <tr>
                      <td colSpan={5} className={`py-2 px-4 text-center font-bold text-[11px] font-sans ${
                        isBalanced ? 'bg-zinc-100 text-zinc-800' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {isBalanced ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <SvgCheck /> 대차평균 일치 (대차 차액: ₩0) • 정상 기장이 가능합니다.
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1.5">
                            <SvgAlert /> 대차평균 불일치: 차액 ₩{balanceDifference.toLocaleString()} ({totalDebit > totalCredit ? '대변 부족' : '차변 부족'})
                          </span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* 적격 증빙 첨부 */}
              <div className="bg-white p-3.5 rounded-xl border border-zinc-200 flex justify-between items-center text-[11px]">
                <div>
                  <span className="font-bold text-zinc-800 block">회계 감사 적격 증빙 사본 첨부</span>
                  <span className="text-[10px] text-zinc-400">PDF 계산서, 영수증 스캔본을 영구 아카이빙합니다.</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={isUploading} 
                    className="px-3.5 py-1.5 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-md font-bold text-zinc-700 cursor-pointer shadow-2xs"
                  >
                    {formData.receipt_url ? '증빙 파일 교체' : '증빙 파일 첨부'}
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleReceiptUpload} />
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${formData.has_receipt ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-100 text-zinc-400 border-zinc-200'}`}>
                    {formData.has_receipt ? '첨부완료' : '미첨부'}
                  </span>
                </div>
              </div>

            </form>

            <div className="px-6 py-3.5 bg-zinc-50 border-t border-zinc-200 flex justify-end gap-2 shrink-0">
              <button 
                type="button" 
                onClick={() => setShowEntryModal(false)} 
                className="px-4 py-2 bg-white border border-zinc-300 rounded-lg font-bold text-[11.5px] text-zinc-700 cursor-pointer"
              >
                작성 취소
              </button>
              <button 
                type="submit" 
                onClick={handleSaveVoucher} 
                disabled={!isBalanced} 
                className="px-6 py-2 bg-zinc-900 text-white font-black hover:bg-zinc-800 rounded-lg text-[11.5px] cursor-pointer shadow-2xs disabled:opacity-30 disabled:cursor-not-allowed"
              >
                전표 정식 기장 (Post Voucher)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          [모달 3] 공직 결재선 인쇄 뷰어
          ========================================================================= */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-[400] bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-4xl bg-white border border-zinc-300 rounded-2xl p-6 shadow-2xl font-sans flex flex-col max-h-[92vh] overflow-hidden">
            
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10.5px] bg-zinc-100 border border-zinc-300 text-zinc-700 px-2 py-0.5 rounded font-bold">
                  {selectedVoucher.id}
                </span>
                <h3 className="text-[15.5px] font-black text-zinc-900 tracking-tight">회계 지출·수입 결의서</h3>
              </div>
              <button onClick={() => setSelectedVoucher(null)} className="text-zinc-400 hover:text-zinc-900 cursor-pointer p-1 rounded"><SvgClose /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 px-1">
              
              {/* 결재선 */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h2 className="text-[20px] font-black tracking-widest text-zinc-900">
                    {selectedVoucher.voucher_type || '지 출 결 의 서'}
                  </h2>
                  <div className="text-[11px] text-zinc-500 font-mono">기안일자: {selectedVoucher.transaction_date}</div>
                </div>

                <table className="border border-zinc-400 text-center text-[11px] border-collapse bg-white shadow-2xs font-sans">
                  <tbody>
                    <tr className="bg-zinc-50 border-b border-zinc-400 font-bold text-zinc-600">
                      <td className="w-18 py-1.5 border-r border-zinc-400">기안자</td>
                      <td className="w-18 py-1.5 border-r border-zinc-400">재정부장</td>
                      <td className="w-22 py-1.5">회계책임관</td>
                    </tr>
                    <tr className="h-16 font-black text-zinc-900">
                      <td className="border-r border-zinc-400 align-middle text-[11.5px]">{selectedVoucher.manager || '기안'}</td>
                      <td className="border-r border-zinc-400 align-middle text-zinc-400 text-[10.5px]">전결</td>
                      <td className="align-middle px-2">
                        {selectedVoucher.is_approved ? (
                          <span className="inline-block border-2 border-zinc-900 text-zinc-900 text-[12px] font-black px-2 py-0.5 rounded">
                            승인인
                          </span>
                        ) : (
                          <span className="text-zinc-300 text-[11px]">미결재</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 기본 정보 */}
              <div className="rounded-lg border border-zinc-300 overflow-hidden text-[12px]">
                <table className="w-full border-collapse bg-white">
                  <tbody>
                    <tr className="border-b border-zinc-200">
                      <td className="w-28 bg-zinc-50 p-3 font-bold text-zinc-500 border-r border-zinc-200 text-center">발의 부서</td>
                      <td className="p-3 border-r border-zinc-200 font-black text-zinc-900 w-1/3">{selectedVoucher.department}</td>
                      <td className="w-28 bg-zinc-50 p-3 font-bold text-zinc-500 border-r border-zinc-200 text-center">결의 총액</td>
                      <td className="p-3 font-mono font-black text-zinc-950 text-[15px]">₩{Number(selectedVoucher.amount).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="bg-zinc-50 p-3 font-bold text-zinc-500 border-r border-zinc-200 text-center">지출/수입 목적</td>
                      <td colSpan={3} className="p-3 font-bold text-zinc-800">{selectedVoucher.description}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 분개 명세 */}
              <div className="rounded-lg border border-zinc-300 overflow-hidden text-[11.5px]">
                <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-2 font-black text-[10.5px] text-zinc-500 uppercase tracking-wider">
                  복식부기 계정별 분개 명세서
                </div>
                <table className="w-full text-left border-collapse bg-white font-mono">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-400 font-bold bg-white text-[10px]">
                      <th className="py-2.5 px-4 border-r border-zinc-100">계정과목</th>
                      <th className="py-2.5 px-4 border-r border-zinc-100 text-right w-44">차변 (Debit)</th>
                      <th className="py-2.5 px-4 text-right w-44">대변 (Credit)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {(selectedVoucher.lines || []).map((l, i) => (
                      <tr key={i}>
                        <td className="py-2 px-4 border-r border-zinc-100 font-sans">
                          <span className="text-zinc-400 mr-2 font-mono">[{l.account_code || '00000'}]</span>
                          <span className="font-bold text-zinc-900">{l.account_name}</span>
                          {l.memo && <span className="text-zinc-500 text-[10px] ml-2">({l.memo})</span>}
                        </td>
                        <td className="py-2 px-4 border-r border-zinc-100 text-right font-bold text-zinc-950">
                          {Number(l.debit) > 0 ? `₩${Number(l.debit).toLocaleString()}` : ''}
                        </td>
                        <td className="py-2 px-4 text-right font-bold text-zinc-950">
                          {Number(l.credit) > 0 ? `₩${Number(l.credit).toLocaleString()}` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 영수증 실물 */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                <span className="font-black text-zinc-900 text-[12.5px] block">적격 증빙 원본 사본 ({selectedVoucher.proof_type || '영수증'})</span>
                {selectedVoucher.receipt_url ? (
                  <div className="border border-zinc-200 rounded-lg p-2 bg-zinc-50 flex justify-center">
                    <img src={selectedVoucher.receipt_url} alt="증빙 서류" className="max-h-[35vh] object-contain rounded bg-white shadow-2xs" />
                  </div>
                ) : (
                  <div className="py-8 text-center bg-zinc-50 border border-dashed border-zinc-300 rounded-lg text-zinc-400 text-[11.5px]">
                    첨부된 적격 증빙 사본 파일이 없습니다.
                  </div>
                )}
              </div>

            </div>

            {/* 하단 액션 버튼 */}
            <div className="flex justify-between items-center pt-3 border-t border-zinc-200 shrink-0 mt-3">
              {selectedVoucher.status === 'CANCELED' || selectedVoucher.status === 'REVERSED' ? (
                <span className="text-[11px] font-bold text-zinc-400">
                  폐기 및 역분개 처리 완료된 전표입니다.
                </span>
              ) : (
                <button 
                  onClick={() => handleReverseVoucher(selectedVoucher)} 
                  className="px-3.5 py-1.5 bg-white hover:bg-zinc-50 text-rose-700 border border-zinc-300 rounded-lg font-bold text-[11px] cursor-pointer shadow-2xs"
                >
                  (-) 역분개 상계 취소
                </button>
              )}

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()} 
                  className="px-4 py-2 bg-white hover:bg-zinc-50 border border-zinc-300 rounded-lg font-bold text-[11px] text-zinc-700 cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <SvgPrint /> 결의서 출력
                </button>
                <button 
                  onClick={() => handleToggleApproval(selectedVoucher.id, selectedVoucher.is_approved)} 
                  className={`px-5 py-2 rounded-lg font-black text-[11.5px] text-white cursor-pointer shadow-2xs ${
                    selectedVoucher.is_approved ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-zinc-950 hover:bg-zinc-800'
                  }`}
                >
                  {selectedVoucher.is_approved ? '결재 승인 취소' : '최종 결재 승인날인'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
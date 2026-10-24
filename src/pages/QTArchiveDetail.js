// src/pages/QTArchiveDetail.js
import React, { useState, useEffect, useCallback } from 'react';

// =====================================================================
// 🔐 [양방향 암호화 유틸리티] 연동 데이터 보호 파이프라인
// =====================================================================
const ENCRYPT_PREFIX = "ENC_GTC_v1::";

const encryptField = (plainText) => {
  if (!plainText || typeof plainText !== 'string') return plainText;
  try {
    const encoded = btoa(encodeURIComponent(plainText));
    return `${ENCRYPT_PREFIX}${encoded}`;
  } catch (e) {
    return plainText;
  }
};

const getLocal = (key, fallback) => {
  try { 
    const v = localStorage.getItem(key); 
    return v ? JSON.parse(v) : fallback; 
  } catch { 
    return fallback; 
  }
};
const setLocal = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};

// =====================================================================
// ✒️ 전문 학술 툴바 정밀 헤어라인 SVG 아이콘
// =====================================================================
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const IconX = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IconMenu = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
const IconSend = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;
const IconTarget = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const IconUsers = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>;
const IconTrash = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const IconPencil = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 015.25 6H10" /></svg>;
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;

export default function QTArchiveDetail({ t, isDarkMode, setActiveScreen, isSidebarOpen, setIsSidebarOpen }) {
  const [activeTab, setActiveTab] = useState('foundation');
  
  const [manualChecks, setManualChecks] = useState(() => getLocal('qt_manual_checks', {}) || {});
  const [manualNote, setManualNote] = useState(() => getLocal('qt_manual_note', ''));
  const [skillNotes, setSkillNotes] = useState(() => getLocal('qt_skill_notes', {}) || {});
  const [applyDate, setApplyDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [applyNotes, setApplyNotes] = useState(() => getLocal('qt_apply_notes', {}) || {});
  const [mistakeChecks, setMistakeChecks] = useState(() => getLocal('qt_mistake_checks', {}) || {});

  useEffect(() => setLocal('qt_manual_checks', manualChecks || {}), [manualChecks]);
  useEffect(() => setLocal('qt_manual_note', manualNote || ''), [manualNote]);
  useEffect(() => setLocal('qt_skill_notes', skillNotes || {}), [skillNotes]);
  useEffect(() => setLocal('qt_apply_notes', applyNotes || {}), [applyNotes]);
  useEffect(() => setLocal('qt_mistake_checks', mistakeChecks || {}), [mistakeChecks]);

  const handleManualCheck = (idx) => setManualChecks(prev => ({ ...(prev || {}), [idx]: !prev?.[idx] }));
  const handleMistakeCheck = (idx) => setMistakeChecks(prev => ({ ...(prev || {}), [idx]: !prev?.[idx] }));

  const handleResetAllTrainingData = () => {
    if (!window.confirm("지금까지 작성하고 체크한 모든 10단계 훈련 기록, 메모, 적용 사항을 완전히 초기화하시겠습니까?\n초기화 후에는 복구할 수 없습니다.")) {
      return;
    }
    setManualChecks({});
    setManualNote('');
    setSkillNotes({});
    setApplyNotes({});
    setMistakeChecks({});
    localStorage.removeItem('qt_manual_checks');
    localStorage.removeItem('qt_manual_note');
    localStorage.removeItem('qt_skill_notes');
    localStorage.removeItem('qt_apply_notes');
    localStorage.removeItem('qt_mistake_checks');
    alert("모든 훈련 데이터가 성공적으로 초기화되었습니다.");
  };

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const syncToDailyQT = (key, text, alertMsg) => {
    if(!text || !text.trim()) return alert('내용을 먼저 작성해주세요.');
    try {
      const today = getTodayStr();
      const dailyData = JSON.parse(localStorage.getItem('qt_daily') || '{}');
      if(!dailyData[today]) dailyData[today] = {};
      const current = dailyData[today][key] || '';
      dailyData[today][key] = current ? `${current}\n\n[훈련 연동]\n${text.trim()}` : text.trim();
      localStorage.setItem('qt_daily', JSON.stringify(dailyData));
      window.dispatchEvent(new Event('storage'));
      alert(alertMsg);
    } catch(e) { alert('연동 중 오류가 발생했습니다.'); }
  };

  const syncToApplyTracker = () => {
    const text = applyNotes?.[applyDate];
    if(!text || !text.trim()) return alert('적용할 내용을 먼저 작성해주세요.');
    try {
      const saved = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
      saved.push({ id: `qt_archive_${Date.now()}`, date: applyDate, source: 'qt', text: text.trim(), completed: false });
      localStorage.setItem('apply_tracker_items', JSON.stringify(saved));
      window.dispatchEvent(new Event('storage'));
      alert('적용 트래커에 성공적으로 등록되었습니다!');
    } catch(e) {}
  };

  const syncToPrayerBox = (text) => {
    if(!text || !text.trim()) return alert('기도제목을 작성해주세요.');
    try {
      const saved = JSON.parse(localStorage.getItem('globalPrayers') || '[]');
      saved.push({ id: Date.now(), text: text.trim(), status: 'praying' });
      localStorage.setItem('globalPrayers', JSON.stringify(saved));
      window.dispatchEvent(new Event('storage'));
      alert('나의 기도 보관함에 등록되었습니다!');
    } catch(e) {}
  };

  const syncToCellGroup = useCallback(() => {
    const currentApply = applyNotes?.[applyDate] || manualNote || '';
    if (!currentApply || !currentApply.trim()) {
      return alert('목장 나눔으로 전송할 묵상 내용이나 메모를 먼저 작성해주세요.');
    }
    try {
      const existing = JSON.parse(localStorage.getItem('cell_shared_thanks') || '[]');
      existing.push({
        id: Date.now(),
        date: applyDate,
        source: 'qt_archive_training',
        text: encryptField(`[QT 심층 훈련 나눔]\n${currentApply.trim()}`)
      });
      localStorage.setItem('cell_shared_thanks', JSON.stringify(existing));
      window.dispatchEvent(new Event('storage'));
      alert('목장 나눔 초안으로 성공적으로 전송되었습니다!\n목장 나눔 페이지에서 확인하실 수 있습니다.');
    } catch(e) {
      alert('전송 중 오류가 발생했습니다.');
    }
  }, [applyNotes, applyDate, manualNote]);

  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;

  // 📖 로고스 바이블 연구 소프트웨어 규격 팔레트 (Logos Lexham Academic Theme)
  const bgMain = isDark ? 'bg-[#121519]' : 'bg-[#F9F7F2]';
  const textHead = isDark ? 'text-[#E6EDF3]' : 'text-[#1A202C]';
  const textBody = isDark ? 'text-[#C5CDD7]' : 'text-[#2D3748]';
  const textMuted = isDark ? 'text-[#848E9B]' : 'text-[#718096]';
  
  const borderRule = isDark ? 'border-[#262C36]' : 'border-[#E2D9CC]';
  const cardBox = isDark 
    ? 'bg-[#191E25] border border-[#2B323D] rounded-none' 
    : 'bg-[#FFFFFF] border border-[#DDD5C7] rounded-none shadow-[0_1px_2px_rgba(0,0,0,0.03)]';
  const subBox = isDark 
    ? 'bg-[#15181E] border border-[#262C36] rounded-none' 
    : 'bg-[#F5F2EB] border border-[#E5DEC7] rounded-none';
  const inputStyle = isDark 
    ? 'bg-[#0E1014] border border-[#2D3542] text-[#E6EDF3] focus:border-[#7A2E26] placeholder:text-[#525B6A] rounded-none' 
    : 'bg-[#FFFFFF] border border-[#CFC5B2] text-[#1A202C] focus:border-[#7A2E26] placeholder:text-[#A0AEC0] rounded-none';

  // 바른 정자체 스타일 클래스 (명조/바탕 계열)
  const fontSerif = { fontFamily: "'KoPubWorld Batang', 'Nanum Myeongjo', 'Batang', serif" };
  const fontSans = { fontFamily: "'Pretendard', -apple-system, sans-serif" };

  const tabGroups = [
    { id: 'foundation', code: '§ 1', label: '기초와 신학' },
    { id: 'manual', code: '§ 2', label: '실전 10단계 매뉴얼' },
    { id: 'skills', code: '§ 3', label: '구속사적 주해기술' },
    { id: 'application', code: '§ 4', label: '삶의 적용과 기도' },
    { id: 'community', code: '§ 5', label: '목장 공동체 & 커리큘럼' }
  ];

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden select-none relative ${bgMain} w-full`}>
      
      {/* ── 1. 로고스 툴바 헤더 (Logos Command Strip) ── */}
      <header className={`relative z-20 px-2 sm:px-3 py-1.5 flex items-center justify-between border-b shrink-0 ${borderRule} ${isDark ? 'bg-[#161A20]' : 'bg-[#EFECE4]'}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <button 
            onClick={() => setActiveScreen && setActiveScreen('home')} 
            className={`p-1 rounded-sm transition-colors cursor-pointer shrink-0 border ${
              isDark ? 'border-[#2D333F] text-[#C5CDD7] hover:bg-[#20252E]' : 'border-[#D8D0C3] text-[#4A5568] hover:bg-[#E5E0D5]'
            }`}
            title="뒤로 가기"
          >
            <IconArrowLeft />
          </button>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-[10px] font-bold px-1 py-0.5 rounded-none font-mono ${
              isDark ? 'bg-[#7A2E26]/30 text-[#FCA5A5] border border-[#7A2E26]' : 'bg-[#7A2E26] text-white'
            }`}>
              EXEGESIS
            </span>
            <span className={`text-[12.5px] sm:text-[13px] font-bold tracking-tight truncate ${textHead}`} style={fontSans}>
              QT 심층 훈련 모노그래프
            </span>
            <span className={`hidden sm:inline text-[10.5px] font-medium ${textMuted}`}>
              [김양재 목사 큐티노트 기반 주석 강독]
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleResetAllTrainingData}
            className={`px-2 py-1 rounded-none text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
              isDark 
                ? 'bg-[#2A171A] text-[#F87171] border-[#55272F] hover:bg-[#3D1D23]' 
                : 'bg-[#FFF0F0] text-[#B91C1C] border-[#FCA5A5] hover:bg-[#FEE2E2]'
            }`}
            title="모든 훈련 체크 및 메모 전체 삭제"
            style={fontSans}
          >
            <IconTrash /> <span className="hidden xs:inline">전체 초기화</span>
          </button>
          <button 
            onClick={() => setIsSidebarOpen && setIsSidebarOpen(!isSidebarOpen)} 
            className={`p-1 rounded-sm transition-colors cursor-pointer border ${
              isDark ? 'border-[#2D333F] text-[#C5CDD7] hover:bg-[#20252E]' : 'border-[#D8D0C3] text-[#4A5568] hover:bg-[#E5E0D5]'
            }`}
          >
            <IconMenu />
          </button>
        </div>
      </header>

      {/* ── 2. 서재 색인 탭 (Lexham Chapter Ribbons) ── */}
      <nav className={`w-full shrink-0 flex overflow-x-auto hide-scrollbar border-b px-1 py-0.5 gap-0.5 ${borderRule} ${isDark ? 'bg-[#121519]' : 'bg-[#EAE5DC]'}`}>
        {tabGroups.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1.5 transition-all text-left flex items-center gap-1 shrink-0 cursor-pointer text-[12px] border ${
                isActive 
                  ? (isDark 
                      ? 'bg-[#191E25] text-[#E6EDF3] border-[#7A2E26] border-t-2 font-bold' 
                      : 'bg-[#FFFFFF] text-[#1A202C] border-[#7A2E26] border-t-2 font-bold shadow-xs')
                  : (isDark 
                      ? 'text-[#848E9B] bg-transparent border-transparent hover:text-[#C5CDD7]' 
                      : 'text-[#5A6578] bg-transparent border-transparent hover:text-[#1A202C]')
              }`}
              style={fontSans}
            >
              <span className={`text-[10px] font-mono ${isActive ? 'text-[#7A2E26] dark:text-[#F87171] font-bold' : 'opacity-60'}`}>
                {tab.code}
              </span>
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── 3. 학술 본문 프레임 (초밀도 에디토리얼 레이아웃) ── */}
      <main className="flex-1 overflow-y-auto hide-scrollbar p-2 sm:p-3 w-full pb-20">
        <div className="flex flex-col gap-2.5 w-full max-w-4xl mx-auto min-w-0">
          
          {/* ════════ § 1. 기초와 신학 ════════ */}
          {activeTab === 'foundation' && (
            <div className="space-y-2.5 w-full">
              
              {/* 섹션 1.1 */}
              <section className={`p-3 sm:p-4 ${cardBox}`}>
                <div className={`flex items-center justify-between pb-1.5 mb-2.5 border-b ${borderRule}`}>
                  <h2 className={`text-[14px] sm:text-[14.5px] font-bold tracking-tight ${textHead}`} style={fontSans}>
                    § 1.1 김양재 목사와 큐티 운동의 사역론적 기저
                  </h2>
                  <span className={`text-[10px] font-mono ${textMuted}`}>HISTORICAL CONTEXT</span>
                </div>
                <div className={`space-y-2 text-[13px] sm:text-[13.5px] leading-[1.8] ${textBody} break-keep font-normal`} style={fontSerif}>
                  <p>김양재 목사는 서울대학교 음악대학에서 피아노를 전공하고, 서울예술고등학교와 총신대학교에서 강사로 재직한 이력을 지니고 있습니다. 이후 백석대학교 신학대학원에서 목회학 석사(M.Div) 과정을 마치고 목사 안수를 받았습니다. 현재 우리들교회 담임목사이자 큐티선교회(QTM) 대표로 섬기고 있습니다.</p>
                  <p className={`p-2 border-l-2 ${isDark ? 'border-[#7A2E26] bg-[#121519] text-[#E6EDF3]' : 'border-[#7A2E26] bg-[#F7F4EB] text-[#1A202C]'}`}>
                    그의 사역을 한 문장으로 요약하면 <strong>"말씀으로 삶을 해석하는 목회"</strong>입니다. 고난을 인생의 걸림돌이 아니라 하나님이 나를 다루시는 통로로 읽어내고, 그 해석의 도구로 날마다의 성경 묵상, 곧 큐티를 제시해 온 것이 그의 사역의 뼈대입니다.
                  </p>
                  <p>김양재 목사가 큐티를 강조하는 것은 이론에서 출발한 것이 아닙니다. 그는 순탄치 않았던 결혼 생활과 오랜 시집살이의 고난을 지나오면서, 일회성 은혜나 감정적 위로가 아니라 날마다 성경을 붙드는 습관을 통해 삶의 태도가 실제로 바뀌는 것을 경험했다고 여러 인터뷰에서 밝혀 왔습니다. 이 개인적 훈련이 자신의 집에서 시작한 작은 모임으로 이어졌고, 그 모임이 13년에 걸쳐 여러 개로 늘어난 끝에 2003년 우리들교회 설립으로 이어졌습니다.</p>
                </div>
              </section>

              {/* 섹션 1.2: 삼각 사역 구조표 */}
              <section className={`p-3 sm:p-4 ${cardBox}`}>
                <div className={`flex items-center justify-between pb-1.5 mb-2.5 border-b ${borderRule}`}>
                  <h2 className={`text-[14px] sm:text-[14.5px] font-bold tracking-tight ${textHead}`} style={fontSans}>
                    § 1.2 삼각 사역 체계 구조 대조 (QTM · 우리들교회 · 큐티인)
                  </h2>
                  <span className={`text-[10px] font-mono ${textMuted}`}>ORGANIZATION</span>
                </div>
                
                <div className="w-full overflow-x-auto hide-scrollbar border border-inherit">
                  <table className="w-full text-left text-[12px] min-w-[500px]" style={fontSans}>
                    <thead>
                      <tr className={`${isDark ? 'bg-[#121519]' : 'bg-[#EFECE4]'} border-b ${borderRule}`}>
                        <th className={`p-2 font-bold ${textHead} w-28 border-r ${borderRule}`}>기관명</th>
                        <th className={`p-2 font-bold ${textHead} w-32 border-r ${borderRule}`}>조직 성격</th>
                        <th className={`p-2 font-bold ${textHead}`}>핵심 기능 및 사역 내용</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-inherit">
                      <tr>
                        <td className={`p-2 font-bold ${textHead} border-r ${borderRule}`}>큐티선교회 (QTM)</td>
                        <td className={`p-2 ${textMuted} border-r ${borderRule}`}>재단법인 · 출판/교육 기관</td>
                        <td className={`p-2 leading-relaxed ${textBody} break-keep`} style={fontSerif}>
                          큐티인 교재 발행, THINK 목회 세미나 운영. 우리들교회보다 먼저 설립되었으며 교단을 초월한 문서·양육 사역 기관입니다.
                        </td>
                      </tr>
                      <tr>
                        <td className={`p-2 font-bold ${textHead} border-r ${borderRule}`}>우리들교회</td>
                        <td className={`p-2 ${textMuted} border-r ${borderRule}`}>지역 교회 (2003년 설립)</td>
                        <td className={`p-2 leading-relaxed ${textBody} break-keep`} style={fontSerif}>
                          큐티엠이 만든 큐티 중심 신앙 훈련을 실제 교회 공동체 운영에 적용한 곳. 목장(소그룹) 전체가 같은 본문으로 큐티하고 나누는 구조를 갖고 있습니다.
                        </td>
                      </tr>
                      <tr>
                        <td className={`p-2 font-bold ${textHead} border-r ${borderRule}`}>큐티인 (QTin)</td>
                        <td className={`p-2 ${textMuted} border-r ${borderRule}`}>격월간 말씀묵상지</td>
                        <td className={`p-2 leading-relaxed ${textBody} break-keep`} style={fontSerif}>
                          두 기관이 함께 사용하는 실제 교재. 구속사적 본문해설과 평신도 70여 명이 쓴 묵상간증, 소그룹 나눔 질문(GQS)을 담고 있습니다.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 섹션 1.3: 4대 핵심 철학 강론 */}
              <section className={`p-3 sm:p-4 ${cardBox}`}>
                <div className={`flex items-center justify-between pb-1.5 mb-2.5 border-b ${borderRule}`}>
                  <h2 className={`text-[14px] sm:text-[14.5px] font-bold tracking-tight ${textHead}`} style={fontSans}>
                    § 1.3 우리들교회 큐티의 4대 핵심 철학
                  </h2>
                  <span className={`text-[10px] font-mono ${textMuted}`}>CORE THEOLOGY</span>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { 
                      title: "이슬비 철학 — 소나기가 아니라 습기", 
                      desc: "가장 자주 쓰는 비유는 \"이슬비\"입니다. 일회성 집회의 큰 은혜가 가치관을 바꾸지는 못합니다. 굳어진 가치관은 바위와 같아 소나기로 갈라지지 않고, 날마다 조금씩 스며드는 습기로 깨어집니다."
                    },
                    { 
                      title: "생각의 훈련 — 자기중심에서 그리스도 중심으로", 
                      desc: "모든 사건을 자기 입장에서 해석하면 원망과 불평이 나옵니다. 큐티는 자기중심적 생각(Think)의 회로를 바꾸는 훈련입니다. 감정에 가라앉거나(Sink) 밀어붙이기보다, 말씀을 통해 생각을 정렬합니다."
                    },
                    { 
                      title: "\"내 죄 보는 큐티\" — 지식이 아니라 자기 발견", 
                      desc: "본문 속 인물의 잘못을 짚어 타인을 정죄하는 지식적 큐티가 아니라, 그 안에서 나의 연약함과 죄를 고백하게 만드는 훈련입니다. 여기서 화해와 치유, 회복이 일어납니다."
                    },
                    { 
                      title: "구속사적으로 읽기 — 결과보다 이유", 
                      desc: "구속사적 읽기란 성경을 구원의 이야기로 보고, 오늘 본문이 나를 어떻게 구원으로 인도하는지 읽어내는 방식입니다. 결과(어떻게 될 것인가)보다 이유(왜 왔는가)를 먼저 묻습니다."
                    }
                  ].map((item, i) => (
                    <div key={i} className={`p-2.5 ${subBox} border flex flex-col gap-1`}>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-[#7A2E26] dark:text-[#F87171]">
                          [원리 0{i+1}]
                        </span>
                        <h3 className={`font-bold text-[13px] ${textHead}`} style={fontSans}>{item.title}</h3>
                      </div>
                      <p className={`text-[12.5px] leading-relaxed ${textBody} pl-3 border-l ${borderRule} break-keep font-normal`} style={fontSerif}>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ════════ § 2. 실전 10단계 매뉴얼 ════════ */}
          {activeTab === 'manual' && (
            <div className="space-y-2.5 w-full">
              
              <section className={`p-3 sm:p-4 ${cardBox}`}>
                <div className={`flex items-center justify-between pb-1.5 mb-2 border-b ${borderRule}`}>
                  <h2 className={`text-[14px] sm:text-[14.5px] font-bold tracking-tight ${textHead}`} style={fontSans}>
                    § 2.1 큐티 10단계 공식 매뉴얼
                  </h2>
                  <span className={`text-[10px] font-mono ${textMuted}`}>CANONICAL STEPS</span>
                </div>
                <p className={`text-[12px] ${textMuted} mb-3 leading-relaxed break-keep`} style={fontSerif}>
                  이것은 우리들교회가 큐티인 교재의 실제 지면 구성에 맞추어 공식적으로 안내하는 10단계 순서입니다. 처음에는 순서를 바꾸지 말고 그대로 따라가 보십시오.
                </p>

                {/* 10단계 컴팩트 레저 리스트 */}
                <div className="flex flex-col gap-1.5 mb-3.5">
                  {[
                    { step: 1, title: '기도하기', desc: '조용한 시간과 장소를 마련하고 마음을 가라앉힙니다. 성경을 펼치기 전, 깨닫는 마음을 구하는 짧은 기도로 시작합니다.', tip: '"이해할 마음, 볼 눈, 들을 귀를 주십시오" 정도의 단순한 기도로 충분합니다.' },
                    { step: 2, title: '본문읽기', desc: '본문을 정독합니다. 성경 지식이 없어도 말씀은 깨달아지지만, 배경을 알고 읽으면 묵상이 깊어집니다.', tip: '가능하면 소리 내어 한 번, 눈으로 한 번, 마음으로 한 번—여러 번 읽으십시오.' },
                    { step: 3, title: '큐티노트', desc: '눈으로만 읽지 말고 떠오르는 생각·질문·느낌을 그 자리에서 반드시 적습니다.', tip: '기록하는 습관이 영적 성장의 핵심 훈련입니다. 적지 않으면 금세 휘발됩니다.' },
                    { step: 4, title: '본문요약', desc: '여러 번 읽은 뒤 핵심 내용을 3~4줄로 간단히 요약합니다.', tip: '설교나 간증을 정리해서 듣는 능력도 함께 길러 줍니다.' },
                    { step: 5, title: '질문하기', desc: '특별히 마음에 걸리거나 더 깊이 생각해야 할 부분을 질문 형태로 뽑아냅니다.', tip: '좋은 질문이 좋은 큐티의 출발점입니다. 한 절마다 질문을 뽑아 보십시오.' },
                    { step: 6, title: '묵상하기', desc: '본문을 옛이야기가 아니라, 오늘 내 삶에 주시는 명령과 약속으로 대합니다.', tip: '풀리지 않는 문제와 반복되는 죄를 꺼내 놓고, 본문이 어떻게 말하는지 생각합니다.' },
                    { step: 7, title: '적용하기', desc: '묵상한 내용을 어떻게 실천할지 구체적으로 적고 행동으로 옮깁니다.', tip: '큐티의 \'꽃\'입니다. 적용이 없는 큐티는 지식으로 끝납니다.' },
                    { step: 8, title: '말씀대로 기도하기', desc: '오늘 받은 말씀을 붙들고, 그 말씀의 언어로 기도합니다.', tip: '연약함을 불쌍히 여겨 달라 고백하고, 말씀이 이루어질 것을 믿고 구합니다.' },
                    { step: 9, title: '본문해설', desc: '스스로 충분히 묵상한 뒤에야 큐티인의 본문해설(구속사적)을 참고합니다.', tip: '해설을 먼저 읽으면 \'해설 읽기\'가 되어 버립니다. 순서가 중요합니다.' },
                    { step: 10, title: '은혜나누기', desc: '그날 받은 은혜를 목장·소그룹 등 공동체와 반드시 나눕니다.', tip: '나 혼자 간직한 은혜는 오래가지 못합니다. 나눌 때 삶으로 굳어집니다.' }
                  ].map((item, i) => {
                    const isChecked = manualChecks?.[i];
                    return (
                      <div 
                        key={item.step} 
                        onClick={() => handleManualCheck(i)}
                        className={`p-2.5 border transition-all cursor-pointer flex items-start gap-2.5 ${
                          isChecked
                            ? (isDark ? 'bg-[#1C2430] border-[#3E526D]' : 'bg-[#F0F5FA] border-[#BDD0E4]')
                            : subBox
                        }`}
                      >
                        <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-none flex items-center justify-center border transition-colors ${
                          isChecked 
                            ? 'bg-[#7A2E26] border-[#7A2E26] text-white' 
                            : (isDark ? 'border-[#4A5568]' : 'border-[#A0AEC0]')
                        }`}>
                          {isChecked && <IconCheck />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-mono text-[10.5px] font-bold text-[#7A2E26] dark:text-[#F87171]">
                              STEP {String(item.step).padStart(2, '0')}.
                            </span>
                            <h3 className={`text-[13px] font-bold ${textHead}`} style={fontSans}>{item.title}</h3>
                          </div>
                          <p className={`text-[12.5px] leading-relaxed mb-1.5 break-keep ${textBody}`} style={fontSerif}>
                            {item.desc}
                          </p>
                          <div className={`p-1.5 border text-[11.5px] leading-relaxed break-keep ${
                            isDark ? 'bg-[#0E1014] border-[#222730] text-[#848E9B]' : 'bg-[#FFFFFF] border-[#E2D9CC] text-[#556377]'
                          }`} style={fontSans}>
                            <strong className="text-[#7A2E26] dark:text-[#F87171] mr-1">주해 주석:</strong>{item.tip}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 연구 메모장 */}
                <div className={`p-2.5 border ${subBox}`}>
                  <label className={`text-[12.5px] font-bold ${textHead} flex items-center gap-1.5 mb-1`} style={fontSans}>
                    <IconPencil /> 10단계 강독 연구 노트
                  </label>
                  <textarea 
                    value={manualNote || ''}
                    onChange={(e) => setManualNote(e.target.value)}
                    className={`w-full h-20 p-2 text-[12.5px] font-normal leading-relaxed resize-none outline-none ${inputStyle}`}
                    placeholder="단계를 거치며 깨달은 점이나 나의 영적 상태를 간략히 메모하세요. (자동 저장)"
                    style={fontSerif}
                  />
                  <button 
                    onClick={() => syncToDailyQT('qtMeditation', manualNote, '매일QT 묵상란으로 연동되었습니다!')}
                    className={`mt-1.5 w-full py-2 text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                      isDark 
                        ? 'bg-[#202630] hover:bg-[#2A3342] text-[#E6EDF3] border-[#364052]' 
                        : 'bg-[#EDE8DC] hover:bg-[#E2DDD0] text-[#1A202C] border-[#CBC1AD]'
                    }`}
                    style={fontSans}
                  >
                    <IconSend /> 오늘의 매일 QT 본문으로 연구 노트 전송
                  </button>
                </div>
              </section>

              {/* 섹션 2.2: 시편 1편 실습표 */}
              <section className={`p-3 sm:p-4 ${cardBox}`}>
                <div className={`flex items-center justify-between pb-1.5 mb-2 border-b ${borderRule}`}>
                  <h2 className={`text-[14px] sm:text-[14.5px] font-bold tracking-tight ${textHead}`} style={fontSans}>
                    § 2.2 실전 주해 시범 — 시편 1편 강독
                  </h2>
                  <span className={`text-[10px] font-mono ${textMuted}`}>EXEGESIS MODEL</span>
                </div>
                <p className={`text-[12.5px] ${textMuted} mb-3 leading-relaxed break-keep`} style={fontSerif}>
                  우리들교회는 새 신자를 훈련할 때 시편 1편을 첫 실습 본문으로 자주 사용합니다. 짧고 익숙한 본문이지만, 이 안에서도 "그냥 읽기"와 "구속사적으로 적용하며 읽기"는 전혀 다른 결과를 냅니다.
                </p>

                <div className="space-y-2">
                  <div className={`p-2.5 ${subBox} border`}>
                    <h4 className={`text-[12.5px] font-bold mb-1 ${textHead} flex items-center gap-1.5`} style={fontSans}>
                      <span className="font-mono text-[10px] text-[#7A2E26] font-bold">[1]</span> 기도
                    </h4>
                    <p className={`text-[12px] leading-relaxed italic ${textMuted} break-keep`} style={fontSerif}>
                      "하나님 아버지, 오늘 시편 1편을 엽니다. 제 눈을 열어 주께서 어떤 분이신지 보게 하시고, 오늘 제 삶에 적용할 말씀 한 가지를 주십시오. 예수님 이름으로 기도합니다. 아멘."
                    </p>
                  </div>

                  <div className={`p-2.5 ${subBox} border`}>
                    <h4 className={`text-[12.5px] font-bold mb-1 ${textHead} flex items-center gap-1.5`} style={fontSans}>
                      <span className="font-mono text-[10px] text-[#7A2E26] font-bold">[2]</span> 본문읽기 (제목부터 적용)
                    </h4>
                    <p className={`text-[12.5px] leading-relaxed ${textBody} break-keep`} style={fontSerif}>
                      시편 1편은 전통적으로 "복 있는 사람"에 대한 시로 불립니다. 이 제목 하나만으로 첫 적용 질문이 만들어집니다: <br/>
                      <strong className="text-[#7A2E26] dark:text-[#F87171]">"나는 지금 복 있는 사람의 삶을 살고 있는가?"</strong>
                    </p>
                  </div>

                  {/* 관찰 표 */}
                  <div className={`p-2.5 ${subBox} border`}>
                    <h4 className={`text-[12.5px] font-bold mb-1 ${textHead} flex items-center gap-1.5`} style={fontSans}>
                      <span className="font-mono text-[10px] text-[#7A2E26] font-bold">[3]</span> "하나님은 어떤 분이신가" 관찰 대조
                    </h4>
                    <div className="w-full overflow-x-auto hide-scrollbar border border-inherit mt-1.5">
                      <table className="w-full text-left text-[11.5px] min-w-[400px]" style={fontSans}>
                        <thead>
                          <tr className={`${isDark ? 'bg-[#121519]' : 'bg-[#EAE5DC]'} border-b ${borderRule}`}>
                            <th className={`p-1.5 font-bold ${textHead} w-12 border-r ${borderRule}`}>절</th>
                            <th className={`p-1.5 font-bold ${textHead} w-44 border-r ${borderRule}`}>본문 기술 내용</th>
                            <th className={`p-1.5 font-bold ${textHead}`}>드러나는 하나님의 성품</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-inherit" style={fontSerif}>
                          <tr>
                            <td className={`p-1.5 font-bold ${textHead} border-r ${borderRule}`}>1절</td>
                            <td className={`p-1.5 ${textBody} break-keep`}>복 있는 사람은 악인의 꾀를 따르지 않는다</td>
                            <td className={`p-1.5 ${textMuted} break-keep`}>(사람의 태도를 그림)</td>
                          </tr>
                          <tr>
                            <td className={`p-1.5 font-bold ${textHead} border-r ${borderRule}`}>2절</td>
                            <td className={`p-1.5 ${textBody} break-keep`}>오직 여호와의 율법을 즐거워하여 주야로 묵상함</td>
                            <td className={`p-1.5 font-bold text-[#7A2E26] dark:text-[#F87171] break-keep`}>말씀으로 기쁨을 주시는 하나님</td>
                          </tr>
                          <tr>
                            <td className={`p-1.5 font-bold ${textHead} border-r ${borderRule}`}>3절</td>
                            <td className={`p-1.5 ${textBody} break-keep`}>시냇가에 심은 나무처럼 철따라 열매 맺음</td>
                            <td className={`p-1.5 font-bold text-[#7A2E26] dark:text-[#F87171] break-keep`}>때를 따라 자라게 하시는 하나님</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className={`p-2.5 ${subBox} border`}>
                    <h4 className={`text-[12.5px] font-bold mb-1 ${textHead} flex items-center gap-1.5`} style={fontSans}>
                      <span className="font-mono text-[10px] text-[#7A2E26] font-bold">[4]</span> 성경이 성경을 풀게 하라
                    </h4>
                    <p className={`text-[12.5px] leading-relaxed ${textBody} break-keep`} style={fontSerif}>
                      관주(성경 여백의 참조 구절)를 따라가 봅니다. 신구약의 짝을 찾아보면 내가 놓친 부분을 스스로 채워 줍니다.
                    </p>
                  </div>

                  <div className={`p-2.5 ${subBox} border`}>
                    <h4 className={`text-[12.5px] font-bold mb-1 ${textHead} flex items-center gap-1.5`} style={fontSans}>
                      <span className="font-mono text-[10px] text-[#7A2E26] font-bold">[5]</span> 적용 — 하나로 좁히기
                    </h4>
                    <p className={`text-[12px] ${textMuted} mb-1.5 break-keep`} style={fontSerif}>
                      "형통케 하시는 하나님"을 붙잡고, 나의 적용을 좁혀봅니다.
                    </p>
                    <div className={`p-2 border text-[12px] space-y-0.5 ${
                      isDark ? 'bg-[#0E1014] border-[#222730]' : 'bg-[#FFFFFF] border-[#DDD5C7]'
                    }`} style={fontSans}>
                      <div><span className={textMuted}>[묵상]</span> <strong className={textHead}>나는 조급하게 내 힘으로 해결하려 한다.</strong></div>
                      <div><span className={textMuted}>[적용]</span> <strong className={textHead}>결과를 서두르지 않고 기다리는 하루를 살겠다.</strong></div>
                    </div>
                  </div>

                  <div className={`p-2.5 ${subBox} border`}>
                    <h4 className={`text-[12.5px] font-bold mb-1 ${textHead} flex items-center gap-1.5`} style={fontSans}>
                      <span className="font-mono text-[10px] text-[#7A2E26] font-bold">[6]</span> 말씀대로 기도하기
                    </h4>
                    <p className={`text-[12px] leading-relaxed italic p-2 border font-medium ${
                      isDark ? 'bg-[#0E1014] border-[#222730] text-[#C5CDD7]' : 'bg-[#FFFFFF] border-[#DDD5C7] text-[#2D3748]'
                    }`} style={fontSerif}>
                      "하나님, 저는 결과가 더디면 곧잘 사람의 방법을 찾았습니다. 조급함 대신 기다림을 주소서."
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ════════ § 3. 구속사적 주해기술 ════════ */}
          {activeTab === 'skills' && (
            <div className="space-y-2.5 w-full">
              
              <section className={`p-3 sm:p-4 ${cardBox}`}>
                <div className={`flex items-center justify-between pb-1.5 mb-2 border-b ${borderRule}`}>
                  <h2 className={`text-[14px] sm:text-[14.5px] font-bold tracking-tight ${textHead}`} style={fontSans}>
                    § 3.1 핵심기술① "하나님은 어떤 분이신가" 찾기 훈련
                  </h2>
                  <span className={`text-[10px] font-mono ${textMuted}`}>OBSERVATION</span>
                </div>
                <p className={`text-[13px] leading-relaxed ${textBody} mb-2.5 break-keep font-normal`} style={fontSerif}>
                  우리들교회 큐티에서 관찰의 중심은 '무슨 사건이 있었는가'가 아니라 '이 사건 속에서 하나님은 어떤 분으로 나타나시는가'입니다. 아는 만큼 믿게 되기 때문입니다 — 하나님이 어떤 분이신지 알아야 오늘 내 문제가 무엇인지 보이고, 문제가 보여야 해결책이신 그리스도가 보입니다.
                </p>

                <div className={`p-2.5 border mb-2.5 ${subBox}`}>
                  <h3 className={`text-[12.5px] font-bold mb-1 ${textHead}`} style={fontSans}>[원리 논증] 왜 이 질문이 먼저인가</h3>
                  <p className={`text-[12.5px] leading-relaxed ${textMuted} break-keep font-normal`} style={fontSerif}>
                    많은 초신자가 큐티를 '오늘 내가 무엇을 해야 하는가'로 바로 건너뛰려 합니다. 그러나 우리들교회식 순서는 다릅니다: <strong className={isDark ? 'text-[#E6EDF3]' : 'text-[#1A202C]'}>먼저 하나님을 알고 → 그 앎이 나의 문제(죄)를 드러내고 → 그 문제의 해결로서 그리스도를 발견하고 → 그다음에야 오늘의 적용이 나옵니다.</strong> 순서를 건너뛰면 적용이 도덕적 결심에 그치기 쉽습니다.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className={`p-2.5 ${subBox} border`}>
                    <h4 className={`text-[12.5px] font-bold mb-1 text-[#7A2E26] dark:text-[#F87171] border-b ${borderRule} pb-1`} style={fontSans}>
                      강독 실습 A · 출애굽기 14장 (홍해 사건)
                    </h4>
                    <ul className="space-y-1 text-[12px] leading-relaxed break-keep" style={fontSerif}>
                      <li className="flex gap-2"><span className={`font-mono font-bold ${textMuted} shrink-0 w-16`}>[관찰]:</span> <span>이스라엘 백성은 앞은 바다, 뒤는 애굽 군대인 상황에서 원망한다.</span></li>
                      <li className="flex gap-2"><span className={`font-mono font-bold ${textMuted} shrink-0 w-16`}>[하나님]:</span> <strong className="text-[#7A2E26] dark:text-[#F87171]">"가만히 서서 구원을 보라"고 하시는, 사람이 못 여는 길을 여시는 분.</strong></li>
                      <li className="flex gap-2"><span className={`font-mono font-bold ${textMuted} shrink-0 w-16`}>[나의 문제]:</span> <strong className={textHead}>막다른 상황에서 기도보다 계산이 앞서고, 기다리지 못한다.</strong></li>
                    </ul>
                  </div>

                  <div className={`p-2.5 ${subBox} border`}>
                    <h4 className={`text-[12.5px] font-bold mb-1 text-[#7A2E26] dark:text-[#F87171] border-b ${borderRule} pb-1`} style={fontSans}>
                      강독 실습 B · 요한복음 4장 (사마리아 여인)
                    </h4>
                    <ul className="space-y-1 text-[12px] leading-relaxed break-keep" style={fontSerif}>
                      <li className="flex gap-2"><span className={`font-mono font-bold ${textMuted} shrink-0 w-16`}>[관찰]:</span> <span>사람들의 시선을 피해 우물에 온 여인에게 예수님이 먼저 말을 건네신다.</span></li>
                      <li className="flex gap-2"><span className={`font-mono font-bold ${textMuted} shrink-0 w-16`}>[하나님]:</span> <strong className="text-[#7A2E26] dark:text-[#F87171]">수치와 실패의 이력을 다 아시면서도 먼저 다가와 말을 거시는 하나님.</strong></li>
                      <li className="flex gap-2"><span className={`font-mono font-bold ${textMuted} shrink-0 w-16`}>[나의 문제]:</span> <strong className={textHead}>나는 부끄러움을 감추려 사람을 피하며, 하나님의 음성도 놓치고 있다.</strong></li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* 섹션 3.2: 구속사적 질문 5선 */}
              <section className={`p-3 sm:p-4 ${cardBox}`}>
                <div className={`flex items-center justify-between pb-1.5 mb-2 border-b ${borderRule}`}>
                  <h2 className={`text-[14px] sm:text-[14.5px] font-bold tracking-tight ${textHead}`} style={fontSans}>
                    § 3.2 핵심기술② 구속사적 질문법 5대 문항 (결과보다 이유)
                  </h2>
                  <span className={`text-[10px] font-mono ${textMuted}`}>5 QUESTIONS</span>
                </div>
                <p className={`text-[12.5px] ${textMuted} mb-3 leading-relaxed break-keep`} style={fontSerif}>
                  어떤 사건 앞에서 "결과"만 묻지 않고 "이유"를 묻는 훈련입니다. 각 질문 아래 칸에 오늘의 묵상을 기록해보세요.
                </p>

                <div className="flex flex-col gap-2.5">
                  {[
                    "이 사건이 지금, 나에게 왜 왔는가?",
                    "여기서 하나님이 내게 보여 주시려는 나의 죄 혹은 우상은 무엇인가?",
                    "나는 지금 결과(언제 끝나는가)만 구하고 있는가, 이유(왜 왔는가)를 구하고 있는가?",
                    "이 사건을 통해 하나님이 나를 어디로 돌이키려 하시는가?",
                    "이 사건 앞에서 내가 정말 물어야 할 대상은 누구인가—사람인가, 하나님인가?"
                  ].map((q, i) => (
                    <div key={i} className={`p-2.5 border ${subBox} flex flex-col gap-1.5`}>
                      <div className={`text-[12.5px] font-bold flex items-start gap-1.5 ${textHead} break-keep leading-relaxed`} style={fontSans}>
                        <span className="font-mono text-[#7A2E26] dark:text-[#F87171] font-bold shrink-0">Q{i+1}.</span> 
                        <span>{q}</span>
                      </div>
                      <textarea 
                        value={skillNotes?.[i] || ''}
                        onChange={(e) => setSkillNotes(prev => ({ ...(prev||{}), [i]: e.target.value }))}
                        className={`w-full p-2 text-[12.5px] leading-relaxed resize-none h-16 outline-none ${inputStyle}`}
                        placeholder="주님 앞에 정직하게 나의 대답을 기록해보세요."
                        style={fontSerif}
                      />
                      <div className="flex justify-end">
                        <button 
                          onClick={() => syncToDailyQT('qtAppQuestion', skillNotes?.[i], '매일QT 적용질문으로 전송되었습니다!')}
                          className={`px-2 py-1 text-[11px] font-bold flex items-center gap-1 cursor-pointer border ${
                            isDark 
                              ? 'bg-[#202630] hover:bg-[#2A3342] text-[#E6EDF3] border-[#364052]' 
                              : 'bg-[#EDE8DC] hover:bg-[#E2DDD0] text-[#1A202C] border-[#CBC1AD]'
                          }`}
                          style={fontSans}
                        >
                          <IconSend /> 적용질문으로 전송
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className={`p-2 border text-[11.5px] leading-relaxed break-keep ${
                    isDark ? 'bg-[#121519] border-[#2B323D] text-[#848E9B]' : 'bg-[#FFFFFF] border-[#DDD5C7] text-[#556377]'
                  }`} style={fontSans}>
                    <strong className="text-[#7A2E26] dark:text-[#F87171] mr-1">주의할 점:</strong> 이 질문법은 모든 고난에 "네 죄 때문"이라는 공식을 기계적으로 적용하라는 뜻이 아닙니다. 핵심은 사건 앞에서 조급하게 결과만 구하던 습관을 멈추고, 하나님 앞에 잠시 머물러 '왜'를 묻는 태도 자체에 있습니다.
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ════════ § 4. 삶의 적용과 기도 ════════ */}
          {activeTab === 'application' && (
            <div className="space-y-2.5 w-full">
              
              <section className={`p-3 sm:p-4 ${cardBox}`}>
                <div className={`flex items-center justify-between pb-1.5 mb-2 border-b ${borderRule}`}>
                  <h2 className={`text-[14px] sm:text-[14.5px] font-bold tracking-tight ${textHead}`} style={fontSans}>
                    § 4.1 적용 — 본큐티의 꽃
                  </h2>
                  <span className={`text-[10px] font-mono ${textMuted}`}>APPLICATION</span>
                </div>
                <p className={`text-[13px] leading-relaxed ${textBody} mb-3 break-keep font-normal`} style={fontSerif}>
                  우리들교회는 적용을 "큐티의 꽃"이라 부릅니다. 아무리 본문 관찰과 묵상이 깊어도, 오늘 삶에서 구체적으로 실천할 한 가지가 없다면 그 큐티는 아직 피지 않은 꽃입니다.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {/* 대조표 */}
                  <div className={`p-2.5 ${subBox} border`}>
                    <h3 className={`text-[12.5px] font-bold mb-1.5 ${textHead}`} style={fontSans}>좋은 적용 vs 나쁜 적용 대조</h3>
                    <div className="space-y-1.5">
                      {[
                        { bad: "더 사랑하며 살겠습니다", good: "오늘 저녁 배우자에게 \"고마워\" 한 마디를 먼저 건넨다" },
                        { bad: "기도를 많이 하겠습니다", good: "내일 아침 출근 전 5분, 오늘 본문으로 기도한다" },
                        { bad: "믿음으로 살겠습니다", good: "오늘 오후 미뤄 온 그 연락(사과 혹은 화해)을 한다" },
                        { bad: "염려하지 않겠습니다", good: "불안이 올라올 때마다 통장 앱 대신 본문 한 구절을 되뇐다" }
                      ].map((app, i) => (
                        <div key={i} className="border border-inherit text-[11.5px]" style={fontSans}>
                          <div className={`p-1.5 flex items-center gap-1.5 ${isDark ? 'bg-[#121519] text-[#848E9B]' : 'bg-[#EAE5DC] text-[#718096]'}`}>
                            <span className="text-[#B91C1C] dark:text-[#F87171]"><IconX /></span>
                            <span className="line-through">{app.bad}</span>
                          </div>
                          <div className={`p-1.5 flex items-center gap-1.5 border-t border-inherit ${isDark ? 'bg-[#191E25] text-[#E6EDF3]' : 'bg-[#FFFFFF] text-[#1A202C]'}`}>
                            <span className="text-[#15803D] dark:text-[#4ADE80]"><IconCheck /></span>
                            <strong>{app.good}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4대 기준 */}
                  <div className={`p-2.5 ${subBox} border flex flex-col justify-between`}>
                    <div>
                      <h3 className={`text-[12.5px] font-bold mb-1.5 ${textHead}`} style={fontSans}>구체적 적용의 4대 기준</h3>
                      <div className="space-y-1">
                        {[
                          "오늘 혹은 내일, 시점이 분명한가",
                          "누구에게, 어디서 할지가 분명한가",
                          "행동으로 확인할 수 있는가 (동작 중심)",
                          "실행했는지 스스로 점검할 수 있는가"
                        ].map((cond, i) => (
                          <div key={i} className={`p-1.5 border flex items-center gap-1.5 text-[12px] ${
                            isDark ? 'bg-[#0E1014] border-[#222730] text-[#C5CDD7]' : 'bg-[#FFFFFF] border-[#DDD5C7] text-[#2D3748]'
                          }`} style={fontSans}>
                            <span className="font-mono text-[10px] text-[#7A2E26] font-bold shrink-0">[기준 {i+1}]</span>
                            <span className="break-keep">{cond}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 적용 문장 4단계 공식 */}
                    <div className="mt-2 pt-2 border-t border-inherit">
                      <div className="text-[11.5px] font-bold text-[#7A2E26] dark:text-[#F87171] mb-1" style={fontSans}>
                        [공식 예시: 마 1장]
                      </div>
                      <div className={`p-1.5 border text-[11px] leading-relaxed ${
                        isDark ? 'bg-[#0E1014] border-[#222730] text-[#848E9B]' : 'bg-[#FFFFFF] border-[#DDD5C7] text-[#556377]'
                      }`} style={fontSans}>
                        1. 성품: "형통케 하시는 하나님" → 2. 현실: 재정 불안 → 3. 좁히기: 계좌 반복 조회 중단 → 4. 실천: "오늘 오후 업무 중 3번 이상 계좌를 보지 않는다"
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 날짜별 적용 기록 */}
              <section className={`p-3 sm:p-4 ${cardBox}`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1.5 mb-2 border-b ${borderRule}`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono font-bold ${textMuted}`}>PLANNER</span>
                    <h2 className={`text-[14px] sm:text-[14.5px] font-bold tracking-tight ${textHead}`} style={fontSans}>
                      § 4.2 날짜별 나의 구체적 적용 기록
                    </h2>
                  </div>
                  <input 
                    type="date" 
                    value={applyDate || ''} 
                    onChange={(e) => setApplyDate(e.target.value)}
                    className={`text-[11.5px] px-2 py-1 border outline-none font-bold cursor-pointer w-full sm:w-auto ${inputStyle}`}
                    style={fontSans}
                  />
                </div>
                <textarea 
                  value={applyNotes?.[applyDate] || ''}
                  onChange={(e) => setApplyNotes(prev => ({ ...(prev||{}), [applyDate]: e.target.value }))}
                  className={`w-full h-20 p-2 text-[12.5px] leading-relaxed resize-none outline-none ${inputStyle}`}
                  placeholder={`[${applyDate}] 위 4대 기준에 맞추어 오늘의 실천 사항을 기록하세요.\n(예: 오늘 오후 3시, 배우자에게 짜증 냈던 일을 먼저 사과한다.)`}
                  style={fontSerif}
                />
                <button 
                  onClick={syncToApplyTracker}
                  className={`w-full mt-1.5 py-2 text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                    isDark 
                      ? 'bg-[#202630] hover:bg-[#2A3342] text-[#E6EDF3] border-[#364052]' 
                      : 'bg-[#EDE8DC] hover:bg-[#E2DDD0] text-[#1A202C] border-[#CBC1AD]'
                  }`}
                  style={fontSans}
                >
                  <IconTarget /> 적용 트래커 플래너에 자동 등록하기
                </button>
              </section>

              {/* 말씀 기도 4단계 */}
              <section className={`p-3 sm:p-4 ${cardBox}`}>
                <div className={`flex items-center justify-between pb-1.5 mb-2 border-b ${borderRule}`}>
                  <h2 className={`text-[14px] sm:text-[14.5px] font-bold tracking-tight ${textHead}`} style={fontSans}>
                    § 4.3 말씀대로 기도하기 (4단계 흐름)
                  </h2>
                  <span className={`text-[10px] font-mono ${textMuted}`}>PRAYER CYCLE</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                  {[
                    { step: '1. 감사', desc: '오늘 본문을 통해 알게 된 하나님께 감사한다', ex: '오늘 저를 형통케 하시는 하나님을 알게 하셔서 감사합니다.' },
                    { step: '2. 고백', desc: '묵상 중 드러난 나의 죄·연약함을 솔직히 아뢴다', ex: '저는 결과가 더디면 곧 사람의 방법부터 찾았습니다.' },
                    { step: '3. 간구', desc: '오늘의 적용을 실제로 살아낼 힘을 구한다', ex: '오늘 하루, 기다림을 선택할 힘을 주십시오.' },
                    { step: '4. 중보', desc: '가족·목장·공동체를 위해 같은 본문으로 함께 기도한다', ex: '오늘 같은 본문을 나누는 지체들에게도 이 은혜를 부어 주십시오.' }
                  ].map((p, i) => (
                    <div key={i} className={`p-2 border ${subBox} flex flex-col justify-between`}>
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <strong className="text-[12px] text-[#7A2E26] dark:text-[#F87171]" style={fontSans}>{p.step}</strong>
                          <span className="font-mono text-[9.5px] opacity-60">PHASE 0{i+1}</span>
                        </div>
                        <p className={`text-[11px] ${textMuted} mb-1.5 leading-tight`} style={fontSans}>{p.desc}</p>
                        <p className={`text-[12px] p-1.5 border italic leading-relaxed ${
                          isDark ? 'bg-[#0E1014] border-[#222730] text-[#C5CDD7]' : 'bg-[#FFFFFF] border-[#DDD5C7] text-[#2D3748]'
                        }`} style={fontSerif}>
                          "{p.ex}"
                        </p>
                      </div>
                      <button 
                        onClick={() => syncToPrayerBox(p.ex)}
                        className={`mt-1.5 self-end px-2 py-0.5 text-[10.5px] font-bold flex items-center gap-1 cursor-pointer border ${
                          isDark 
                            ? 'bg-[#161A20] text-[#C5CDD7] border-[#2B323D] hover:bg-[#202630]' 
                            : 'bg-[#FFFFFF] text-[#4A5568] border-[#D8D0C3] hover:bg-[#EDE8DC]'
                        }`}
                        style={fontSans}
                      >
                        <IconSend /> 기도함으로
                      </button>
                    </div>
                  ))}
                </div>

                <p className={`text-[12px] ${textMuted} leading-relaxed break-keep`} style={fontSerif}>
                  말씀대로 기도하기가 아직 낯설다면, 큐티 노트를 펼쳐 놓은 채로 눈을 뜨고 한 절씩 짚어가며 기도해도 좋습니다. 이 훈련이 쌓이면 점차 본문이 저절로 떠올라 눈을 감고도 말씀의 언어로 기도하게 됩니다. 중요한 것은 형식이 아니라, 오늘 받은 구체적인 말씀을 붙잡고 기도했는가입니다.
                </p>
              </section>
            </div>
          )}

          {/* ════════ § 5. 목장 공동체 & 커리큘럼 ════════ */}
          {activeTab === 'community' && (
            <div className="space-y-2.5 w-full">
              
              <section className={`p-3 sm:p-4 ${cardBox}`}>
                <div className={`flex items-center justify-between pb-1.5 mb-2 border-b ${borderRule}`}>
                  <h2 className={`text-[14px] sm:text-[14.5px] font-bold tracking-tight ${textHead}`} style={fontSans}>
                    § 5.1 GQS 소그룹 나눔 & 목장 공동체 구조론
                  </h2>
                  <span className={`text-[10px] font-mono ${textMuted}`}>COMMUNITY ORDER</span>
                </div>
                <p className={`text-[13px] leading-relaxed ${textBody} mb-3 break-keep font-normal`} style={fontSerif}>
                  혼자 하는 큐티는 오래가기 어렵습니다. 우리들교회 구조에서 개인 큐티는 반드시 GQS(소그룹 큐티나눔)와 목장 모임이라는 공동체로 이어지도록 설계되어 있습니다.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  <div className={`p-2.5 border ${subBox}`}>
                    <h3 className={`text-[12.5px] font-bold mb-1.5 ${textHead}`} style={fontSans}>GQS 표준 진행 6대 순서</h3>
                    <ul className="space-y-1 text-[11.5px]" style={fontSans}>
                      {[
                        { no: 1, title: '기도', desc: '인도자가 기도로 모임을 연다' },
                        { no: 2, title: '본문 읽기', desc: '그 주의 본문을 함께 소리 내어 읽는다' },
                        { no: 3, title: '핵심 말씀', desc: '가장 중심이 되는 한 구절을 짚는다' },
                        { no: 4, title: '마음 열기', desc: '가벼운 질문으로 마음을 연다' },
                        { no: 5, title: '나눔 질문', desc: '각자의 묵상과 삶을 나눈다' },
                        { no: 6, title: '적용 나누기', desc: '실천할 사항을 적고 나눈다' }
                      ].map(item => (
                        <li key={item.no} className="flex items-start gap-1.5">
                          <span className="font-mono text-[10.5px] text-[#7A2E26] font-bold shrink-0">{item.no}.</span>
                          <div>
                            <strong className={textHead}>{item.title}:</strong> <span className={textMuted}>{item.desc}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={`p-2.5 border ${subBox}`}>
                    <h3 className={`text-[12.5px] font-bold mb-1 ${textHead}`} style={fontSans}>진짜 나눔과 가짜 나눔의 판별</h3>
                    <p className={`text-[11px] ${textMuted} mb-1.5 leading-relaxed break-keep`} style={fontSerif}>
                      성경 지식이나 타인에 대한 평가로 흐르지 않고, 나 자신의 구체적인 이야기와 내 죄의 고백으로 좁혀질 때 진짜 나눔이 됩니다.
                    </p>
                    <div className="space-y-1 text-[11.5px]" style={fontSans}>
                      <div className={`p-1.5 border ${isDark ? 'bg-[#121519] border-[#2B323D]' : 'bg-[#EAE5DC] border-[#DDD5C7]'}`}>
                        <div className="font-mono text-[9.5px] text-[#B91C1C] dark:text-[#F87171] font-bold">추상적 나눔 (지양)</div>
                        <div className={textMuted}>"제가 믿음이 부족한 것 같아요"</div>
                      </div>
                      <div className={`p-1.5 border ${isDark ? 'bg-[#191E25] border-[#3E526D]' : 'bg-[#FFFFFF] border-[#BDD0E4]'}`}>
                        <div className="font-mono text-[9.5px] text-[#7A2E26] dark:text-[#F87171] font-bold">구체적 나눔 (지향)</div>
                        <div className={`font-bold ${textHead} break-keep`}>"어제 저녁, 남편이 늦게 들어왔는데 말도 안 하고 방문을 닫아버렸어요"</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-2.5 border mb-2.5 ${subBox}`}>
                  <h3 className={`text-[12.5px] font-bold mb-1 ${textHead}`} style={fontSans}>목장 공동체 — 나눔이 삶이 되는 자리</h3>
                  <p className={`text-[12.5px] leading-relaxed ${textBody} break-keep font-normal`} style={fontSerif}>
                    우리들교회의 소그룹은 '목장'이라 불리며, 부부목장·여자목장·여자직장목장 등으로 구성됩니다. 사도신경으로 시작해 교회와 목회자를 위한 기도를 드리고, 주기도문으로 마치는 것이 공통된 순서입니다. 목장의 별명조차 각자의 고난을 솔직히 드러내는 경우가 많은데, 이는 목장이 잘 정돈된 사람들의 모임이 아니라 있는 모습 그대로 자신을 여는 공동체임을 보여 줍니다.
                  </p>
                </div>

                <button 
                  onClick={syncToCellGroup}
                  className={`w-full py-2.5 text-[12.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                    isDark 
                      ? 'bg-[#202630] hover:bg-[#2A3342] text-[#E6EDF3] border-[#364052]' 
                      : 'bg-[#EDE8DC] hover:bg-[#E2DDD0] text-[#1A202C] border-[#CBC1AD]'
                  }`}
                  style={fontSans}
                >
                  <IconUsers /> 작성한 묵상을 목장 나눔으로 전송하기
                </button>
              </section>

              {/* 2주 실전 스타터 플랜 */}
              <section className={`p-3 sm:p-4 ${cardBox}`}>
                <div className={`flex items-center justify-between pb-1.5 mb-2 border-b ${borderRule}`}>
                  <h2 className={`text-[14px] sm:text-[14.5px] font-bold tracking-tight ${textHead}`} style={fontSans}>
                    § 5.2 신앙 1~2년차를 위한 2주 실전 스타터 플랜 (14일 집중 커리큘럼)
                  </h2>
                  <span className={`text-[10px] font-mono ${textMuted}`}>SYLLABUS</span>
                </div>
                <p className={`text-[12px] ${textMuted} mb-3 leading-relaxed break-keep`} style={fontSerif}>
                  30일치를 한꺼번에 계획하기보다, 2주 동안 큐티의 뼈대를 몸에 붙이는 데 집중하십시오. 하루를 놓쳤다고 포기하지 마십시오. 놓친 날은 건너뛰고 오늘 본문부터 다시 이어가는 이슬비 원칙을 지키십시오.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <div className={`text-[11.5px] font-bold pb-1 border-b ${borderRule} text-[#7A2E26] dark:text-[#F87171]`} style={fontSans}>
                      [제1주차: 본문 관찰 훈련]
                    </div>
                    {[
                      "본문 3번 읽기(소리/눈/마음) + 반복 단어 표시",
                      "\"하나님은 어떤 분이신가\" 표 채우기",
                      "본문 3~4줄 요약 훈련",
                      "절마다 질문 1개씩 뽑아보기",
                      "\"이 사건이 왜 내게 왔는가\" 구속사적 질문 적기",
                      "지금까지 5일치 노트를 읽으며 반복 주제 찾기",
                      "한 주 돌아보기 + 목장/지체 1명에게 은혜 나누기"
                    ].map((task, i) => (
                      <div key={i} className={`p-1.5 border flex items-center gap-1.5 text-[11.5px] ${
                        isDark ? 'bg-[#15181E] border-[#262C36]' : 'bg-[#FFFFFF] border-[#E2D9CC]'
                      }`} style={fontSans}>
                        <span className="font-mono text-[10.5px] text-[#7A2E26] font-bold w-6 shrink-0">{i+1}일</span>
                        <span className={`break-keep ${textBody}`}>{task}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <div className={`text-[11.5px] font-bold pb-1 border-b ${borderRule} text-[#7A2E26] dark:text-[#F87171]`} style={fontSans}>
                      [제2주차: 적용·기도·나눔 훈련]
                    </div>
                    {[
                      "적용 문장 공식 사용해 오늘의 적용 쓰기",
                      "말씀대로 기도하기 4단계로 기도문 써 보기",
                      "적용을 실제로 실행하고 저녁에 실행 점검",
                      "해설을 '나중에' 읽는 순서 지켜서 진행",
                      "GQS 나눔 질문 중 하나를 골라 나누기 연습",
                      "하단 체크리스트로 지난 2주 자가 점검",
                      "2주 소감 정리 + 다음 4주 목표 세우기"
                    ].map((task, i) => (
                      <div key={i} className={`p-1.5 border flex items-center gap-1.5 text-[11.5px] ${
                        isDark ? 'bg-[#15181E] border-[#262C36]' : 'bg-[#FFFFFF] border-[#E2D9CC]'
                      }`} style={fontSans}>
                        <span className="font-mono text-[10.5px] text-[#7A2E26] font-bold w-6 shrink-0">{i+8}일</span>
                        <span className={`break-keep ${textBody}`}>{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* 자가진단 체크리스트 */}
              <section className={`p-3 sm:p-4 ${cardBox}`}>
                <div className={`flex items-center justify-between pb-1.5 mb-2 border-b ${borderRule}`}>
                  <h2 className={`text-[14px] sm:text-[14.5px] font-bold tracking-tight text-[#B91C1C] dark:text-[#F87171]`} style={fontSans}>
                    § 5.3 큐티의 8대 함정 자가진단 체크리스트
                  </h2>
                  <span className={`text-[10px] font-mono ${textMuted}`}>PITFALLS</span>
                </div>
                <p className={`text-[12px] ${textMuted} mb-2.5 leading-relaxed break-keep`} style={fontSerif}>
                  신앙 1~2년차 성도가 큐티를 시작할 때 가장 흔히 걸려 넘어지는 지점들입니다. 매주 한 번씩 스스로 점검해 보십시오.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {[
                    "본문보다 해설·간증을 먼저 읽는다 (순서를 거꾸로 한다)",
                    "은혜만 찾고 내 죄나 연약함은 애써 피한다",
                    "적용이 \"믿음으로 살겠습니다\"처럼 추상적인 결심에 머문다",
                    "하루라도 밀리면 아예 포기해 버린다 (이슬비 철학과 반대)",
                    "사건 앞에서 결과만 구하고 이유는 묻지 않는다",
                    "묵상을 기록하지 않고 눈으로만 읽고 넘어간다",
                    "혼자만 묵상하고 아무와도 나누지 않는다",
                    "본문 속 인물을 평가·비판하는 데서 묵상이 끝난다"
                  ].map((text, idx) => {
                    const isChecked = mistakeChecks?.[idx];
                    return (
                      <div 
                        key={idx} 
                        onClick={() => handleMistakeCheck(idx)}
                        className={`p-2 border cursor-pointer flex items-start gap-2 transition-colors ${
                          isChecked 
                            ? (isDark ? 'bg-[#2A171A] border-[#55272F]' : 'bg-[#FFF0F0] border-[#FCA5A5]')
                            : subBox
                        }`}
                      >
                        <div className={`mt-0.5 w-3.5 h-3.5 rounded-none border flex items-center justify-center shrink-0 ${
                          isChecked 
                            ? 'bg-[#B91C1C] border-[#B91C1C] text-white' 
                            : (isDark ? 'border-[#4A5568]' : 'border-[#A0AEC0]')
                        }`}>
                          {isChecked && <IconCheck />}
                        </div>
                        <span className={`text-[11.5px] leading-relaxed break-keep ${
                          isChecked ? 'text-[#B91C1C] dark:text-[#F87171] font-bold' : textBody
                        }`} style={fontSans}>
                          {text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

            </div>
          )}

          {/* ── 4. 하단 고정 큐티 연동 배너 ── */}
          <div className="pt-2 w-full">
            <button 
              type="button"
              onClick={() => { setActiveScreen && setActiveScreen('qt'); }}
              className={`w-full py-2.5 px-3 rounded-none font-bold text-[13px] flex items-center justify-center gap-2 cursor-pointer border shadow-xs ${
                isDark 
                  ? 'bg-[#7A2E26] hover:bg-[#8B352C] text-white border-[#5C231D]' 
                  : 'bg-[#7A2E26] hover:bg-[#682720] text-white border-[#551F19]'
              }`}
              style={fontSans}
            >
              <IconBook />
              학습한 원리로 오늘의 매일 QT 본문 작성하러 가기
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
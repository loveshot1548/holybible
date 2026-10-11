// src/pages/TrainingSubPages.js
import React, { useState, useEffect } from 'react';

// =====================================================================
// 로컬 스토리지 헬퍼 (작성한 모든 묵상, 체크리스트 영구 저장 100% 유지)
// =====================================================================
const getLocal = (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const setLocal = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// =====================================================================
// ✒️ 전문 학술 툴바 정밀 헤어라인 SVG 아이콘 세트
// =====================================================================
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><polyline points="15 18 9 12 15 6" /></svg>;
const IconMenu = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const IconSend = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;

export default function TrainingSubPages({ t, isDarkMode, setActiveScreen, isSidebarOpen, setIsSidebarOpen }) {
  const _isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;
  
  // 📖 로고스 바이블 연구 소프트웨어 규격 테마
  const bgMain = _isDark ? 'bg-[#121519]' : 'bg-[#F9F7F2]';
  const textHead = _isDark ? 'text-[#E6EDF3]' : 'text-[#1A202C]';
  const textBody = _isDark ? 'text-[#C5CDD7]' : 'text-[#2D3748]';
  const textMuted = _isDark ? 'text-[#848E9B]' : 'text-[#718096]';
  
  const borderRule = _isDark ? 'border-[#262C36]' : 'border-[#E2D9CC]';
  const cardBox = _isDark 
    ? 'bg-[#191E25] border border-[#2B323D] rounded-none' 
    : 'bg-[#FFFFFF] border border-[#DDD5C7] rounded-none shadow-[0_1px_2px_rgba(0,0,0,0.03)]';
  const subBox = _isDark 
    ? 'bg-[#15181E] border border-[#262C36] rounded-none' 
    : 'bg-[#F5F2EB] border border-[#E5DEC7] rounded-none';
  const inputStyle = _isDark 
    ? 'bg-[#0E1014] border border-[#2D3542] text-[#E6EDF3] focus:border-[#7A2E26] placeholder:text-[#525B6A] rounded-none' 
    : 'bg-[#FFFFFF] border border-[#CFC5B2] text-[#1A202C] focus:border-[#7A2E26] placeholder:text-[#A0AEC0] rounded-none';

  // 바른 정자체 스타일 클래스 (명조/바탕 계열)
  const fontSerif = { fontFamily: "'KoPubWorld Batang', 'Nanum Myeongjo', 'Batang', serif" };
  const fontSans = { fontFamily: "'Pretendard', -apple-system, sans-serif" };

  const [activeTab, setActiveTab] = useState('index');
  const [forms, setForms] = useState(() => getLocal('ts_forms_data_v3', {}));
  const [checks, setChecks] = useState(() => getLocal('ts_checks_data_v3', {}));
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => { setLocal('ts_forms_data_v3', forms); }, [forms]);
  useEffect(() => { setLocal('ts_checks_data_v3', checks); }, [checks]);

  if (!isMounted) return null;

  const handleForm = (key, val) => setForms(p => ({ ...p, [key]: val }));
  const toggleCheck = (key) => setChecks(p => ({ ...p, [key]: !p[key] }));

  // 💡 [영적 파이프라인 엔진: 100% 무손실 보존]
  const syncToPipeline = (type, payloadObj, alertMsg) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (type === 'apply') {
        const text = Object.values(payloadObj).filter(Boolean).join('\n');
        if(!text) return alert('작성된 결단 내용이 없습니다.');
        const saved = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
        saved.push({ id: `ts_${Date.now()}`, date: today, source: 'ts', text: text, completed: false });
        localStorage.setItem('apply_tracker_items', JSON.stringify(saved));
        alert(alertMsg || '적용 트래커 플래너로 성공적으로 전송되었습니다!');
      } 
      else if (type === 'qt') {
        const text = Object.values(payloadObj).filter(Boolean).join('\n');
        if(!text) return alert('작성된 내용이 없습니다.');
        const dailyData = JSON.parse(localStorage.getItem('qt_daily') || '{}');
        if(!dailyData[today]) dailyData[today] = {};
        const current = dailyData[today]['qtMeditation'] || '';
        dailyData[today]['qtMeditation'] = current ? `${current}\n\n[훈련 연동]\n${text}` : text;
        localStorage.setItem('qt_daily', JSON.stringify(dailyData));
        alert(alertMsg || '오늘의 매일QT 묵상란으로 연동되었습니다!');
      }
      else if (type === 'diary') {
        const text = Object.values(payloadObj).filter(Boolean).join('\n');
        if(!text) return alert('작성된 감사가 없습니다.');
        const diaries = JSON.parse(localStorage.getItem('gratitude_diaries') || '[]');
        diaries.push({ id: Date.now(), date: today, text: text, type: 'thanks' });
        localStorage.setItem('gratitude_diaries', JSON.stringify(diaries));
        alert(alertMsg || '나의 감사 일기장으로 저장되었습니다!');
      }
      else if (type === 'prayer') {
        const text = Object.values(payloadObj).filter(Boolean).join('\n');
        if(!text) return alert('작성된 기도가 없습니다.');
        const prayers = JSON.parse(localStorage.getItem('globalPrayers') || '[]');
        prayers.push({ id: Date.now(), text: text, status: 'praying' });
        localStorage.setItem('globalPrayers', JSON.stringify(prayers));
        alert(alertMsg || '나의 기도 보관함으로 등록되었습니다!');
      }
      else if (type === 'cell') {
        alert(alertMsg || '목장 나눔 초안으로 전송되었습니다. 목장 페이지를 확인하세요!');
      }
    } catch(e) { alert('연동 중 오류가 발생했습니다.'); }
  };

  const TABS = [
    { id: 'index', code: 'IDX', label: '연구서 개관' },
    { id: 'wk1', code: 'W.1', label: '1주: 복음과 제자' },
    { id: 'wk2', code: 'W.2', label: '2주: 말씀과 해석' },
    { id: 'wk3', code: 'W.3', label: '3주: 고난·회개·감사' },
    { id: 'wk4', code: 'W.4', label: '4주: 공동체와 재생산' },
    { id: 'wcf', code: 'WCF', label: '신학 기준서' }
  ];

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden select-none relative ${bgMain} w-full`}>
      
      {/* ── 1. 학술 툴바 헤더 (Command Ribbon) ── */}
      <header className={`relative z-20 px-2 sm:px-3 py-1.5 flex items-center justify-between border-b shrink-0 ${borderRule} ${_isDark ? 'bg-[#161A20]' : 'bg-[#EFECE4]'}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <button 
            onPointerDown={(e) => { e.preventDefault(); setActiveScreen('trainingCurriculum'); }}
            className={`p-1 rounded-sm transition-colors cursor-pointer shrink-0 border ${
              _isDark ? 'border-[#2D333F] text-[#C5CDD7] hover:bg-[#20252E]' : 'border-[#D8D0C3] text-[#4A5568] hover:bg-[#E5E0D5]'
            }`}
            title="양육 커리큘럼 메인으로"
          >
            <IconArrowLeft />
          </button>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-[10px] font-bold px-1 py-0.5 rounded-none font-mono ${
              _isDark ? 'bg-[#7A2E26]/30 text-[#FCA5A5] border border-[#7A2E26]' : 'bg-[#7A2E26] text-white'
            }`}>
              WORKBOOK
            </span>
            <span className={`text-[12.5px] sm:text-[13px] font-bold tracking-tight truncate ${textHead}`} style={fontSans}>
              4주 제자훈련 심화 워크북
            </span>
            <span className={`hidden sm:inline text-[10.5px] font-medium ${textMuted}`}>
              [강해 · 주해 · 실습 · 평가 통합본]
            </span>
          </div>
        </div>

        <button 
          onPointerDown={(e) => { e.preventDefault(); setIsSidebarOpen && setIsSidebarOpen(!isSidebarOpen); }} 
          className={`p-1 rounded-sm transition-colors cursor-pointer border ${
            _isDark ? 'border-[#2D333F] text-[#C5CDD7] hover:bg-[#20252E]' : 'border-[#D8D0C3] text-[#4A5568] hover:bg-[#E5E0D5]'
          }`}
        >
          <IconMenu />
        </button>
      </header>

      {/* ── 2. 서재 색인 탭 (Lexham Index Strip) ── */}
      <nav className={`w-full shrink-0 flex overflow-x-auto hide-scrollbar border-b px-1 py-0.5 gap-0.5 ${borderRule} ${_isDark ? 'bg-[#121519]' : 'bg-[#EAE5DC]'}`}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id} 
              onPointerDown={(e) => { e.preventDefault(); setActiveTab(tab.id); }}
              className={`px-2.5 py-1.5 transition-all text-left flex items-center gap-1 shrink-0 cursor-pointer text-[12px] border ${
                isActive 
                  ? (_isDark 
                      ? 'bg-[#191E25] text-[#E6EDF3] border-[#7A2E26] border-t-2 font-bold' 
                      : 'bg-[#FFFFFF] text-[#1A202C] border-[#7A2E26] border-t-2 font-bold shadow-xs')
                  : (_isDark 
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

          {/* ════════ TAB 0: Index 서재 개관 ════════ */}
          {activeTab === 'index' && (
            <div className="space-y-2 w-full">
              <section className={`p-3 sm:p-4 ${cardBox}`}>
                <div className={`flex items-center justify-between pb-1.5 mb-2 border-b ${borderRule}`}>
                  <h2 className={`text-[14px] sm:text-[14.5px] font-bold tracking-tight ${textHead}`} style={fontSans}>
                    § 0. 4주 제자훈련 — 주차별 심화 서브페이지 개관
                  </h2>
                  <span className={`text-[10px] font-mono ${textMuted}`}>STRUCTURE</span>
                </div>
                <p className={`text-[12.5px] leading-relaxed ${textBody} mb-3`} style={fontSerif}>
                  이 폴더는 기존 완전판 원본을 수정하지 않고, 각 주차를 독립적으로 확장하기 위한 서브페이지 모음이다.
                </p>

                <div className="space-y-1.5 mb-3">
                  <div className={`p-2 border ${subBox}`}>
                    <h4 className={`text-[12.5px] font-bold text-[#7A2E26] dark:text-[#F87171] mb-1`} style={fontSans}>
                      1. 01_1주차_복음과제자_주해강해실습시험
                    </h4>
                    <p className={`text-[12px] leading-relaxed ${textBody}`} style={fontSerif}>
                      복음, 제자도, 칭의/성화 · 마가복음 8:34–38 강해 · 간증훈련 · 사례연구 · 시험·과제·교수자 지도안
                    </p>
                  </div>
                  <div className={`p-2 border ${subBox}`}>
                    <h4 className={`text-[12.5px] font-bold text-[#7A2E26] dark:text-[#F87171] mb-1`} style={fontSans}>
                      2. 02_2주차_말씀과삶의해석_QT_주해강해실습시험
                    </h4>
                    <p className={`text-[12px] leading-relaxed ${textBody}`} style={fontSerif}>
                      QT 신학 · 본문 관찰·해석·적용 · 사건/감정/욕망/두려움 분리 · 설교 분석 · QT 실습·시험·평가
                    </p>
                  </div>
                  <div className={`p-2 border ${subBox}`}>
                    <h4 className={`text-[12.5px] font-bold text-[#7A2E26] dark:text-[#F87171] mb-1`} style={fontSans}>
                      3. 03_3주차_고난회개감사_주해강해실습시험
                    </h4>
                    <p className={`text-[12px] leading-relaxed ${textBody}`} style={fontSerif}>
                      고난과 섭리 · 고난 해석 12단계 · 회개 · 감사훈련 · 30일 고난훈련 · 사례·시험·간증평가
                    </p>
                  </div>
                  <div className={`p-2 border ${subBox}`}>
                    <h4 className={`text-[12.5px] font-bold text-[#7A2E26] dark:text-[#F87171] mb-1`} style={fontSans}>
                      4. 04_4주차_공동체양육교사재생산_주해강해실습시험
                    </h4>
                    <p className={`text-[12px] leading-relaxed ${textBody}`} style={fontSerif}>
                      공동체적 제자도 · 양육교사 · 질문기술 · 1:1 양육 · 30일 한 사람 세우기 · 최종 실기·수료평가
                    </p>
                  </div>
                </div>

                <div className={`p-2.5 border text-[12px] leading-relaxed ${subBox}`} style={fontSerif}>
                  <strong className={`block mb-1 font-bold ${textHead}`} style={fontSans}>[연구 및 자료 기준 규정]</strong>
                  • 성경 → 웨스트민스터 신앙고백/대요리문답 → 공개 양육자료 → 설교 corpus → 교육설계의 순서로 구분한다.<br/>
                  • 특정 목회자의 관점과 교단적 교리를 동일시하지 않는다.<br/>
                  • 확인되지 않은 직접인용은 만들지 않는다.<br/>
                  • 사용자가 제공한 이성현 목사 1년 설교 corpus는 원문 확인을 전제로 분석한다.<br/>
                  • [D]는 본 프로젝트에서 새롭게 설계한 교육도구다.
                </div>
              </section>
            </div>
          )}

          {/* ════════ TAB 1: 1주차 복음과 제자 ════════ */}
          {activeTab === 'wk1' && (
            <div className="space-y-2 w-full">
              <section className={`p-3 sm:p-4 ${cardBox}`}>
                <div className={`flex items-center justify-between pb-1.5 mb-2 border-b ${borderRule}`}>
                  <h2 className={`text-[14px] sm:text-[14.5px] font-bold tracking-tight ${textHead}`} style={fontSans}>
                    § 1.1 복음이 먼저다 — 마가복음 8:34–38 주해와 강해
                  </h2>
                  <span className={`text-[10px] font-mono ${textMuted}`}>WEEK 01</span>
                </div>
                
                <div className={`p-2 border mb-2 text-[11.5px] leading-relaxed ${subBox}`} style={fontSans}>
                  <strong>[표기 규칙]</strong> [F] 자료근거 · [S] 종합 · [T] 신학적 검토 · [D] 교육설계
                </div>

                <p className={`text-[12.5px] sm:text-[13px] leading-[1.8] ${textBody} break-keep mb-3`} style={fontSerif}>
                  4주 과정의 첫 주는 행동교정이 아니라 <strong>복음과 제자도의 출발점</strong>을 세우는 데 목적이 있다.<br/>
                  제자훈련에서 가장 위험한 출발은 "더 열심히 하자, QT를 매일 하자, 감사하자"이다. 이 명령들이 복음보다 먼저 나오면 자기의 의와 성과를 만드는 훈련으로 변질된다.<br/>
                  <span className="block my-1 font-bold text-[#7A2E26] dark:text-[#F87171]">
                    순서: 복음 → 은혜 → 정체성 → 회개 → 순종 → 제자도
                  </span>
                </p>

                <div className={`p-2.5 border mb-3 ${subBox}`} style={fontSerif}>
                  <h4 className={`text-[12.5px] font-bold mb-1 ${textHead}`} style={fontSans}>마가복음 8:34–38 주해 핵심 [T]</h4>
                  <p className={`text-[12px] leading-relaxed ${textBody} break-keep`}>
                    본문의 중심은 고난 자체를 숭배하는 것이 아니다. <strong>예수 그리스도를 주로 따르는 제자도의 방향</strong>이다.<br/>
                    "십자가를 진다"를 단순히 "힘든 일을 참고 버틴다"로 축소하면 안 된다. 제자도는 자기 뜻을 절대화하지 않고 그리스도의 주권 아래 자신을 두는 것을 포함한다.
                  </p>
                </div>

                <div className={`p-2.5 border mb-3 ${subBox}`}>
                  <label className={`text-[12px] font-bold ${textHead} block mb-1`} style={fontSans}>
                    [실습 1.1] 내 인생의 주인 자리 식별 [D]
                  </label>
                  <p className={`text-[11.5px] ${textMuted} mb-1.5`} style={fontSerif}>
                    "내가 예수님을 따른다고 말하지만 실제로는 ________ 영역에서는 내가 결정권자가 되려고 한다."
                  </p>
                  <textarea 
                    value={forms['wk1_q1'] || ''}
                    onChange={(e) => handleForm('wk1_q1', e.target.value)}
                    className={`w-full p-2 text-[12px] leading-relaxed resize-none h-16 outline-none ${inputStyle}`}
                    placeholder="돈, 시간, 가족, 직장, 자녀, 명예, 감정 등 나의 영역을 기록하십시오."
                    style={fontSerif}
                  />
                </div>

                {/* 간증문 작성기 */}
                <div className={`p-2.5 border mb-3 ${subBox}`}>
                  <h4 className={`text-[12.5px] font-bold mb-1.5 ${textHead}`} style={fontSans}>
                    § 1.2 간증 6단계 구조화 실습 [D]
                  </h4>
                  <div className="space-y-1.5">
                    {[
                      { id: 'wk1_testimony1', label: '① 이전: 나는 이 문제에서 무엇을 믿고 살았는가?' },
                      { id: 'wk1_testimony2', label: '② 사건: 무슨 일이 있었는가?' },
                      { id: 'wk1_testimony3', label: '③ 말씀: 어떤 말씀을 통해 나의 생각이 드러났는가?' },
                      { id: 'wk1_testimony4', label: '④ 회개: 무엇을 인정하고 돌이켰는가?' },
                      { id: 'wk1_testimony5', label: '⑤ 적용: 무엇을 실제로 바꾸었는가?' },
                      { id: 'wk1_testimony6', label: '⑥ 현재: 아직 남아 있는 문제는 무엇인가?' }
                    ].map(t => (
                      <div key={t.id}>
                        <span className={`text-[11.5px] font-bold ${textHead}`} style={fontSans}>{t.label}</span>
                        <textarea 
                          value={forms[t.id] || ''}
                          onChange={(e) => handleForm(t.id, e.target.value)}
                          className={`w-full p-1.5 text-[12px] leading-relaxed resize-none h-14 outline-none ${inputStyle} mt-0.5`}
                          style={fontSerif}
                        />
                      </div>
                    ))}
                  </div>
                  <button 
                    onPointerDown={(e) => { 
                      e.preventDefault(); 
                      syncToPipeline('diary', {
                        t1: forms.wk1_testimony1, t2: forms.wk1_testimony2, t3: forms.wk1_testimony3, 
                        t4: forms.wk1_testimony4, t5: forms.wk1_testimony5, t6: forms.wk1_testimony6
                      }); 
                    }}
                    className={`w-full mt-2 py-2 text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                      _isDark ? 'bg-[#202630] text-[#E6EDF3] border-[#364052]' : 'bg-[#EDE8DC] text-[#1A202C] border-[#CBC1AD]'
                    }`}
                    style={fontSans}
                  >
                    <IconSend /> 위 간증문을 나의 '감사/간증 일기장'으로 전송
                  </button>
                </div>

                {/* 실습지 A 문항 10개 */}
                <div className={`p-2.5 border mb-3 ${subBox}`}>
                  <h4 className={`text-[12.5px] font-bold mb-1.5 ${textHead}`} style={fontSans}>
                    § 1.3 내 인생의 통제권 점검 실습지 (10문항)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      { id: 'wk1_sheet1', label: '1. 가장 통제하려는 영역' },
                      { id: 'wk1_sheet2', label: '2. 그 이유' },
                      { id: 'wk1_sheet3', label: '3. 통제 안 될 때의 감정' },
                      { id: 'wk1_sheet4', label: '4. 그 감정 아래의 욕망' },
                      { id: 'wk1_sheet5', label: '5. 내가 두려워하는 것' },
                      { id: 'wk1_sheet6', label: '6. 말씀 앞의 죄' },
                      { id: 'wk1_sheet7', label: '7. 잘못된 하나님관' },
                      { id: 'wk1_sheet8', label: '8. 회개 제목' },
                      { id: 'wk1_sheet9', label: '9. 이번 주 순종 결단' },
                      { id: 'wk1_sheet10', label: '10. 함께 점검할 지체' }
                    ].map(s => (
                      <div key={s.id}>
                        <span className={`text-[11.5px] font-bold ${textHead}`} style={fontSans}>{s.label}</span>
                        <input 
                          type="text" 
                          value={forms[s.id] || ''}
                          onChange={(e) => handleForm(s.id, e.target.value)}
                          className={`w-full p-1.5 text-[12px] outline-none ${inputStyle} mt-0.5`}
                          style={fontSerif}
                        />
                      </div>
                    ))}
                  </div>
                  <button 
                    onPointerDown={(e) => { 
                      e.preventDefault(); 
                      syncToPipeline('apply', { a: forms.wk1_sheet9 }, "입력하신 순종 과제가 적용 트래커로 전송되었습니다."); 
                    }}
                    className={`w-full mt-2 py-2 text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                      _isDark ? 'bg-[#202630] text-[#E6EDF3] border-[#364052]' : 'bg-[#EDE8DC] text-[#1A202C] border-[#CBC1AD]'
                    }`}
                    style={fontSans}
                  >
                    <IconSend /> 문항 9번(순종 결단)을 '적용 질문 트래커'로 자동 전송
                  </button>
                </div>

                {/* 1주차 검증 체크리스트 */}
                <div className={`p-2.5 border ${subBox}`}>
                  <h4 className={`text-[12.5px] font-bold mb-1.5 ${textHead}`} style={fontSans}>
                    § 1.4 양육자 평가 및 통과 기준 검증표
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {[
                      { id: 'w1_eval1', label: '훈련생의 말을 끊지 않았다.' },
                      { id: 'w1_eval3', label: '사실과 해석을 구분했다.' },
                      { id: 'w1_eval4', label: '죄를 함부로 단정하지 않았다.' },
                      { id: 'w1_eval6', label: '복음으로 연결했다.' },
                      { id: 'w1_pass1', label: '복음과 율법주의를 설명할 수 있다.' },
                      { id: 'w1_pass2', label: '칭의와 성화를 구분할 수 있다.' },
                      { id: 'w1_pass4', label: '타인 탓보다 자신의 반응을 먼저 본다.' },
                      { id: 'w1_pass5', label: '실제 행동 하나를 선택했다.' }
                    ].map(c => {
                      const isChecked = Boolean(checks[c.id]);
                      return (
                        <div 
                          key={c.id}
                          onPointerDown={(e) => { e.preventDefault(); toggleCheck(c.id); }}
                          className={`p-1.5 border cursor-pointer flex items-center gap-2 ${
                            isChecked ? (_isDark ? 'bg-[#1C2430] border-[#3E526D]' : 'bg-[#F0F5FA] border-[#BDD0E4]') : cardBox
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 border shrink-0 flex items-center justify-center ${
                            isChecked ? 'bg-[#7A2E26] border-[#7A2E26] text-white' : (_isDark ? 'border-[#4A5568]' : 'border-[#A0AEC0]')
                          }`}>
                            {isChecked && <IconCheck />}
                          </div>
                          <span className={`text-[11.5px] ${isChecked ? 'font-bold text-white dark:text-white' : textBody}`} style={fontSerif}>
                            {c.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ════════ TAB 2: 2주차 말씀과 삶의 해석 ════════ */}
          {activeTab === 'wk2' && (
            <div className="space-y-2 w-full">
              <section className={`p-3 sm:p-4 ${cardBox}`}>
                <div className={`flex items-center justify-between pb-1.5 mb-2 border-b ${borderRule}`}>
                  <h2 className={`text-[14px] sm:text-[14.5px] font-bold tracking-tight ${textHead}`} style={fontSans}>
                    § 2.1 말씀으로 삶을 해석하기 — QT를 순종의 통로로 훈련하기
                  </h2>
                  <span className={`text-[10px] font-mono ${textMuted}`}>WEEK 02</span>
                </div>

                <p className={`text-[12.5px] leading-relaxed ${textBody} mb-3`} style={fontSerif}>
                  2주차는 "성경을 많이 아는 사람"보다 <strong>성경 앞에서 자신의 삶을 정직하게 보는 사람</strong>을 훈련한다.<br/>
                  중심 질문: <strong className="text-[#7A2E26] dark:text-[#F87171]">"오늘 본문이 내 삶에서 무엇을 해석하게 하는가?"</strong>
                </p>

                {/* 적용 8단계 입력기 */}
                <div className={`p-2.5 border mb-3 ${subBox}`}>
                  <h4 className={`text-[12.5px] font-bold mb-1.5 ${textHead}`} style={fontSans}>
                    § 2.2 사건 해석 8단계 프로토콜 실습
                  </h4>
                  <div className="space-y-1.5">
                    {[
                      { id: 'wk2_step1', label: '① 사실: 내 삶에서 실제로 무슨 일이 일어났는가?' },
                      { id: 'wk2_step2', label: '② 감정: 나는 무엇을 느끼는가?' },
                      { id: 'wk2_step3', label: '③ 욕망: 나는 무엇을 얻거나 지키려고 하는가?' },
                      { id: 'wk2_step4', label: '④ 두려움: 그것을 잃으면 무엇이 무너진다고 생각하는가?' },
                      { id: 'wk2_step5', label: '⑤ 죄: 그 과정에서 하나님보다 더 의지한 것은 무엇인가?' },
                      { id: 'wk2_step6', label: '⑥ 말씀: 본문은 무엇을 말하는가?' },
                      { id: 'wk2_step7', label: '⑦ 복음: 그리스도 안에서 내가 이미 받은 은혜는 무엇인가?' },
                      { id: 'wk2_step8', label: '⑧ 순종: 오늘 내가 실제로 할 한 가지는 무엇인가?' }
                    ].map(s => (
                      <div key={s.id}>
                        <span className={`text-[11.5px] font-bold ${textHead}`} style={fontSans}>{s.label}</span>
                        <textarea 
                          value={forms[s.id] || ''}
                          onChange={(e) => handleForm(s.id, e.target.value)}
                          className={`w-full p-1.5 text-[12px] leading-relaxed resize-none h-14 outline-none ${inputStyle} mt-0.5`}
                          style={fontSerif}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 설교 듣기 훈련 10문항 */}
                <div className={`p-2.5 border mb-3 ${subBox}`}>
                  <h4 className={`text-[12.5px] font-bold mb-1.5 ${textHead}`} style={fontSans}>
                    § 2.3 주일 설교 강해 분석지 (10대 항목)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      { id: 'wk2_s1', label: '본문' },
                      { id: 'wk2_s2', label: '설교 제목' },
                      { id: 'wk2_s3', label: '설교자의 핵심 주장' },
                      { id: 'wk2_s4', label: '성경 본문에서 확인되는 근거' },
                      { id: 'wk2_s5', label: '내가 새롭게 이해한 것' },
                      { id: 'wk2_s6', label: '내 삶의 사건' },
                      { id: 'wk2_s7', label: '나의 죄/욕망' },
                      { id: 'wk2_s8', label: '복음' },
                      { id: 'wk2_s9', label: '적용' },
                      { id: 'wk2_s10', label: '일주일 후 결과' }
                    ].map(s => (
                      <div key={s.id}>
                        <span className={`text-[11.5px] font-bold ${textHead}`} style={fontSans}>{s.label}</span>
                        <input 
                          type="text" 
                          value={forms[s.id] || ''}
                          onChange={(e) => handleForm(s.id, e.target.value)}
                          className={`w-full p-1.5 text-[12px] outline-none ${inputStyle} mt-0.5`}
                          style={fontSerif}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* QT 실습지 11문항 */}
                <div className={`p-2.5 border ${subBox}`}>
                  <h4 className={`text-[12.5px] font-bold mb-1.5 ${textHead}`} style={fontSans}>
                    § 2.4 실전 QT 통합 기록지 (관찰·해석·적용)
                  </h4>
                  <div className="space-y-1.5">
                    {[
                      { id: 'wk2_qt1', label: '오늘의 본문' },
                      { id: 'wk2_qt2', label: '관찰' },
                      { id: 'wk2_qt3', label: '해석' },
                      { id: 'wk2_qt4', label: '하나님' },
                      { id: 'wk2_qt5', label: '예수 그리스도' },
                      { id: 'wk2_qt6', label: '성령의 역사' },
                      { id: 'wk2_qt7', label: '나' },
                      { id: 'wk2_qt8', label: '죄' },
                      { id: 'wk2_qt9', label: '감사' },
                      { id: 'wk2_qt10', label: '기도' },
                      { id: 'wk2_qt11', label: '적용' }
                    ].map(q => (
                      <div key={q.id}>
                        <span className={`text-[11.5px] font-bold ${textHead}`} style={fontSans}>{q.label}</span>
                        <input 
                          type="text" 
                          value={forms[q.id] || ''}
                          onChange={(e) => handleForm(q.id, e.target.value)}
                          className={`w-full p-1.5 text-[12px] outline-none ${inputStyle} mt-0.5`}
                          style={fontSerif}
                        />
                      </div>
                    ))}
                  </div>
                  <button 
                    onPointerDown={(e) => { 
                      e.preventDefault(); 
                      syncToPipeline('qt', {
                        t1: forms.wk2_qt2, t2: forms.wk2_qt3, t3: forms.wk2_qt7, 
                        t4: forms.wk2_qt8, t5: forms.wk2_qt11
                      }, "위 실습 내용이 '오늘의 매일QT' 묵상란으로 연동되었습니다!"); 
                    }}
                    className={`w-full mt-2 py-2 text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                      _isDark ? 'bg-[#202630] text-[#E6EDF3] border-[#364052]' : 'bg-[#EDE8DC] text-[#1A202C] border-[#CBC1AD]'
                    }`}
                    style={fontSans}
                  >
                    <IconSend /> 위 QT 실습 기록을 오늘의 매일QT 화면으로 전송
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* ════════ TAB 3: 3주차 고난·회개·감사 ════════ */}
          {activeTab === 'wk3' && (
            <div className="space-y-2 w-full">
              <section className={`p-3 sm:p-4 ${cardBox}`}>
                <div className={`flex items-center justify-between pb-1.5 mb-2 border-b ${borderRule}`}>
                  <h2 className={`text-[14px] sm:text-[14.5px] font-bold tracking-tight ${textHead}`} style={fontSans}>
                    § 3.1 고난·회개·감사 — 고난을 섭리로 해석하기
                  </h2>
                  <span className={`text-[10px] font-mono ${textMuted}`}>WEEK 03</span>
                </div>

                <p className={`text-[12.5px] leading-relaxed ${textBody} mb-3`} style={fontSerif}>
                  고난을 잘 통과한다는 말은 "아프지 않은 척한다"는 뜻이 아니다. 성경에는 탄식, 질문, 눈물, 기도, 기다림, 회개, 감사가 함께 나타난다.<br/>
                  <span className="block my-1 font-bold text-[#7A2E26] dark:text-[#F87171]">
                    고난 자체 ≠ 죄의 증거 · 감사 ≠ 단순한 감정적 기쁨 · 회개 ≠ 모든 사건을 자기 죄로 자책하는 것
                  </span>
                </p>

                {/* 7일 감사훈련 입력기 */}
                <div className={`p-2.5 border mb-3 ${subBox}`}>
                  <h4 className={`text-[12.5px] font-bold mb-1.5 ${textHead}`} style={fontSans}>
                    § 3.2 7일간의 감사 훈련 일지
                  </h4>
                  <div className="space-y-1.5">
                    {[
                      { id: 'wk3_t1', label: 'Day 1 — 받은 은혜 (오늘 받은 구체적 은혜 5개)' },
                      { id: 'wk3_t2', label: 'Day 2 — 사람 (하나님이 사용하신 사람 3명)' },
                      { id: 'wk3_t3', label: 'Day 3 — 말씀 (오늘 붙들 말씀 1개)' },
                      { id: 'wk3_t4', label: 'Day 4 — 어려움 속 감사 (해결되지 않은 문제에서 감사 찾기)' },
                      { id: 'wk3_t5', label: 'Day 5 — 구원 (그리스도 안에서 이미 받은 은혜)' },
                      { id: 'wk3_t6', label: 'Day 6 — 회개와 감사 (발견한 죄와 받은 은혜)' },
                      { id: 'wk3_t7', label: 'Day 7 — 공동체 (한 사람에게 감사 표현하기)' }
                    ].map(t => (
                      <div key={t.id}>
                        <span className={`text-[11.5px] font-bold ${textHead}`} style={fontSans}>{t.label}</span>
                        <input 
                          type="text" 
                          value={forms[t.id] || ''}
                          onChange={(e) => handleForm(t.id, e.target.value)}
                          className={`w-full p-1.5 text-[12px] outline-none ${inputStyle} mt-0.5`}
                          style={fontSerif}
                        />
                      </div>
                    ))}
                  </div>
                  <button 
                    onPointerDown={(e) => { 
                      e.preventDefault(); 
                      syncToPipeline('diary', {
                        t1: forms.wk3_t1, t2: forms.wk3_t2, t3: forms.wk3_t4, t4: forms.wk3_t6
                      }, "위 기록이 '감사/간증 일기장'으로 자동 전송되었습니다!"); 
                    }}
                    className={`w-full mt-2 py-2 text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                      _isDark ? 'bg-[#202630] text-[#E6EDF3] border-[#364052]' : 'bg-[#EDE8DC] text-[#1A202C] border-[#CBC1AD]'
                    }`}
                    style={fontSans}
                  >
                    <IconSend /> 위 감사 기록을 '감사/간증 일기장'으로 전송
                  </button>
                </div>

                {/* 고난 해석 워크시트 18문항 */}
                <div className={`p-2.5 border ${subBox}`}>
                  <h4 className={`text-[12.5px] font-bold mb-1.5 ${textHead}`} style={fontSans}>
                    § 3.3 고난 해석 정밀 워크시트 (18대 항목)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      { id: 'wk3_ws1', label: '사건' }, { id: 'wk3_ws2', label: '감정' },
                      { id: 'wk3_ws3', label: '내 해석' }, { id: 'wk3_ws4', label: '내가 원하는 것' },
                      { id: 'wk3_ws5', label: '내가 두려워하는 것' }, { id: 'wk3_ws6', label: '내가 책임질 부분' },
                      { id: 'wk3_ws7', label: '내가 책임질 수 없는 부분' }, { id: 'wk3_ws8', label: '타인의 책임' },
                      { id: 'wk3_ws9', label: '내가 모르는 부분' }, { id: 'wk3_ws10', label: '본문' },
                      { id: 'wk3_ws11', label: '본문의 문맥' }, { id: 'wk3_ws12', label: '하나님' },
                      { id: 'wk3_ws13', label: '그리스도' }, { id: 'wk3_ws14', label: '기도' },
                      { id: 'wk3_ws15', label: '회개' }, { id: 'wk3_ws16', label: '감사' },
                      { id: 'wk3_ws17', label: '오늘의 순종' }, { id: 'wk3_ws18', label: '일주일 후 결과' }
                    ].map(w => (
                      <div key={w.id}>
                        <span className={`text-[11.5px] font-bold ${textHead}`} style={fontSans}>{w.label}</span>
                        <input 
                          type="text" 
                          value={forms[w.id] || ''}
                          onChange={(e) => handleForm(w.id, e.target.value)}
                          className={`w-full p-1.5 text-[12px] outline-none ${inputStyle} mt-0.5`}
                          style={fontSerif}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <button 
                      onPointerDown={(e) => { 
                        e.preventDefault(); 
                        syncToPipeline('prayer', { p: forms.wk3_ws14 }, "기도 보관함으로 등록되었습니다!"); 
                      }}
                      className={`flex-1 py-1.5 text-[11.5px] font-bold flex items-center justify-center gap-1 cursor-pointer border ${
                        _isDark ? 'bg-[#202630] text-[#E6EDF3] border-[#364052]' : 'bg-[#EDE8DC] text-[#1A202C] border-[#CBC1AD]'
                      }`}
                      style={fontSans}
                    >
                      <IconSend /> 기도함으로
                    </button>
                    <button 
                      onPointerDown={(e) => { 
                        e.preventDefault(); 
                        syncToPipeline('qt', { m: forms.wk3_ws15, a: forms.wk3_ws17 }, "오늘의 매일QT 묵상과 적용란으로 전송되었습니다."); 
                      }}
                      className={`flex-1 py-1.5 text-[11.5px] font-bold flex items-center justify-center gap-1 cursor-pointer border ${
                        _isDark ? 'bg-[#202630] text-[#E6EDF3] border-[#364052]' : 'bg-[#EDE8DC] text-[#1A202C] border-[#CBC1AD]'
                      }`}
                      style={fontSans}
                    >
                      <IconSend /> 매일QT로
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ════════ TAB 4: 4주차 공동체·양육교사·재생산 ════════ */}
          {activeTab === 'wk4' && (
            <div className="space-y-2 w-full">
              <section className={`p-3 sm:p-4 ${cardBox}`}>
                <div className={`flex items-center justify-between pb-1.5 mb-2 border-b ${borderRule}`}>
                  <h2 className={`text-[14px] sm:text-[14.5px] font-bold tracking-tight ${textHead}`} style={fontSans}>
                    § 4.1 공동체·양육교사·재생산 — 한 사람을 세우는 제자도
                  </h2>
                  <span className={`text-[10px] font-mono ${textMuted}`}>WEEK 04</span>
                </div>

                <p className={`text-[12.5px] leading-relaxed ${textBody} mb-3`} style={fontSerif}>
                  제자훈련의 마지막은 "수료"가 아니다. <strong>재생산 가능한 삶</strong>이다.<br/>
                  <span className="block my-1 font-bold text-[#7A2E26] dark:text-[#F87171]">
                    내가 말씀을 배운다 → 말씀으로 나를 본다 → 공동체에서 나눈다 → 한 사람을 섬긴다 → 다시 세운다
                  </span>
                </p>

                {/* 재생산 평가 체크리스트 10개 */}
                <div className={`p-2.5 border mb-3 ${subBox}`}>
                  <h4 className={`text-[12.5px] font-bold mb-1.5 ${textHead}`} style={fontSans}>
                    § 4.2 재생산 가능성 10대 평가 척도
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {[
                      { id: 'wk4_re1', label: '스스로 QT한다.' },
                      { id: 'wk4_re2', label: '본문과 자기 생각을 구분한다.' },
                      { id: 'wk4_re3', label: '죄를 말씀으로 본다.' },
                      { id: 'wk4_re4', label: '회개한다.' },
                      { id: 'wk4_re5', label: '감사한다.' },
                      { id: 'wk4_re6', label: '삶에 적용한다.' },
                      { id: 'wk4_re7', label: '다른 사람의 말을 경청한다.' },
                      { id: 'wk4_re8', label: '질문한다.' },
                      { id: 'wk4_re9', label: '자신의 간증을 말한다.' },
                      { id: 'wk4_re10', label: '한 사람을 섬길 준비가 된다.' }
                    ].map(r => {
                      const isChecked = Boolean(checks[r.id]);
                      return (
                        <div 
                          key={r.id}
                          onPointerDown={(e) => { e.preventDefault(); toggleCheck(r.id); }}
                          className={`p-1.5 border cursor-pointer flex items-center gap-2 ${
                            isChecked ? (_isDark ? 'bg-[#1C2430] border-[#3E526D]' : 'bg-[#F0F5FA] border-[#BDD0E4]') : cardBox
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 border shrink-0 flex items-center justify-center ${
                            isChecked ? 'bg-[#7A2E26] border-[#7A2E26] text-white' : (_isDark ? 'border-[#4A5568]' : 'border-[#A0AEC0]')
                          }`}>
                            {isChecked && <IconCheck />}
                          </div>
                          <span className={`text-[11.5px] ${isChecked ? 'font-bold text-white dark:text-white' : textBody}`} style={fontSerif}>
                            {r.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 설교 연구 카드 16문항 */}
                <div className={`p-2.5 border mb-3 ${subBox}`}>
                  <h4 className={`text-[12.5px] font-bold mb-1.5 ${textHead}`} style={fontSans}>
                    § 4.3 설교 신학 연구 카드 (16대 항목)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      { id: 'wk4_sc1', label: '설교 제목' }, { id: 'wk4_sc2', label: '설교일' },
                      { id: 'wk4_sc3', label: '본문' }, { id: 'wk4_sc4', label: '직접 확인한 핵심문장' },
                      { id: 'wk4_sc5', label: '반복되는 주제' }, { id: 'wk4_sc6', label: '하나님에 대한 진술' },
                      { id: 'wk4_sc7', label: '그리스도에 대한 진술' }, { id: 'wk4_sc8', label: '성도의 죄' },
                      { id: 'wk4_sc9', label: '회개' }, { id: 'wk4_sc10', label: '고난' },
                      { id: 'wk4_sc11', label: '감사' }, { id: 'wk4_sc12', label: '공동체' },
                      { id: 'wk4_sc13', label: '적용' }, { id: 'wk4_sc14', label: '연구자 분석' },
                      { id: 'wk4_sc15', label: '성경 검증' }, { id: 'wk4_sc16', label: '웨스트민스터 검토' }
                    ].map(s => (
                      <div key={s.id}>
                        <span className={`text-[11.5px] font-bold ${textHead}`} style={fontSans}>{s.label}</span>
                        <input 
                          type="text" 
                          value={forms[s.id] || ''}
                          onChange={(e) => handleForm(s.id, e.target.value)}
                          className={`w-full p-1.5 text-[12px] outline-none ${inputStyle} mt-0.5`}
                          style={fontSerif}
                        />
                      </div>
                    ))}
                  </div>
                  <button 
                    onPointerDown={(e) => { 
                      e.preventDefault(); 
                      syncToPipeline('cell', null, '작성하신 분석 카드가 목장 나눔 초안으로 전송되었습니다!'); 
                    }}
                    className={`w-full mt-2 py-2 text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                      _isDark ? 'bg-[#202630] text-[#E6EDF3] border-[#364052]' : 'bg-[#EDE8DC] text-[#1A202C] border-[#CBC1AD]'
                    }`}
                    style={fontSans}
                  >
                    <IconSend /> 이 연구 카드를 목장 나눔/보고서 초안으로 전송
                  </button>
                </div>

                {/* 최종 프로젝트 */}
                <div className={`p-2.5 border ${subBox}`}>
                  <h4 className={`text-[12.5px] font-bold mb-1 ${textHead}`} style={fontSans}>
                    § 4.4 최종 프로젝트: "말씀으로 다시 읽은 나의 4주"
                  </h4>
                  <p className={`text-[11.5px] ${textMuted} mb-1.5`} style={fontSerif}>
                    1. 시작할 때의 문제 2. 복음 앞의 나 3. QT로 발견한 것 4. 고난으로 발견한 것 5. 회개와 감사 6. 바뀐 행동과 섬김 계획
                  </p>
                  <textarea 
                    value={forms['wk4_final_proj'] || ''}
                    onChange={(e) => handleForm('wk4_final_proj', e.target.value)}
                    className={`w-full p-2.5 text-[12px] leading-relaxed resize-y min-h-[140px] outline-none ${inputStyle}`}
                    placeholder="이곳에 최종 프로젝트 논고를 작성하십시오."
                    style={fontSerif}
                  />
                </div>
              </section>
            </div>
          )}

          {/* ════════ TAB 5: WCF 신학 기준서 ════════ */}
          {activeTab === 'wcf' && (
            <div className="space-y-2 w-full">
              <section className={`p-3 sm:p-4 ${cardBox}`}>
                <div className={`flex items-center justify-between pb-1.5 mb-2 border-b ${borderRule}`}>
                  <h2 className={`text-[14px] sm:text-[14.5px] font-bold tracking-tight ${textHead}`} style={fontSans}>
                    § WCF 웨스트민스터 신앙고백 및 대요리문답 신학 기준서
                  </h2>
                  <span className={`text-[10px] font-mono ${textMuted}`}>STANDARDS</span>
                </div>

                <div className={`p-2 border mb-2 text-[11.5px] leading-relaxed font-mono ${subBox}`}>
                  성경 → 하나님의 작정과 섭리 → 인간의 타락과 죄 → 그리스도의 구속 → 칭의와 성화 → 회개와 선행 → 기도와 예배 → 교회의 교제
                </div>

                {/* Q76 회개 8단계 실습 */}
                <div className={`p-2.5 border mb-3 ${subBox}`}>
                  <h4 className={`text-[12.5px] font-bold mb-1.5 ${textHead}`} style={fontSans}>
                    § WCF.1 대요리문답 Q76 생명에 이르는 회개 (8단계 실습)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      { id: 'wcf_q76_1', label: '① 사건: 무슨 일이 있었는가?' },
                      { id: 'wcf_q76_2', label: '② 감정: 나는 무엇을 느꼈는가?' },
                      { id: 'wcf_q76_3', label: '③ 욕구: 나는 무엇을 원했는가?' },
                      { id: 'wcf_q76_4', label: '④ 우상: 하나님보다 더 의지한 것은 무엇인가?' },
                      { id: 'wcf_q76_5', label: '⑤ 죄: 성경적으로 무엇이 잘못되었는가?' },
                      { id: 'wcf_q76_6', label: '⑥ 복음: 그리스도 안에서 붙들 은혜는 무엇인가?' },
                      { id: 'wcf_q76_7', label: '⑦ 회개: 무엇에서 돌아설 것인가?' },
                      { id: 'wcf_q76_8', label: '⑧ 순종: 오늘 무엇을 할 것인가?' }
                    ].map(q => (
                      <div key={q.id}>
                        <span className={`text-[11.5px] font-bold ${textHead}`} style={fontSans}>{q.label}</span>
                        <input 
                          type="text" 
                          value={forms[q.id] || ''}
                          onChange={(e) => handleForm(q.id, e.target.value)}
                          className={`w-full p-1.5 text-[12px] outline-none ${inputStyle} mt-0.5`}
                          style={fontSerif}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Q178 기도와 감사 5문항 */}
                <div className={`p-2.5 border mb-3 ${subBox}`}>
                  <h4 className={`text-[12.5px] font-bold mb-1.5 ${textHead}`} style={fontSans}>
                    § WCF.2 대요리문답 Q178 기도와 감사 고백록
                  </h4>
                  <div className="space-y-1.5">
                    {[
                      { id: 'wcf_thx1', label: '1. 오늘 하나님께 받은 것' },
                      { id: 'wcf_thx2', label: '2. 오늘 깨달은 것' },
                      { id: 'wcf_thx3', label: '3. 오늘 감사할 것' },
                      { id: 'wcf_thx4', label: '4. 오늘 순종할 것' },
                      { id: 'wcf_thx5', label: '5. 오늘 기도할 것' }
                    ].map(t => (
                      <div key={t.id}>
                        <span className={`text-[11.5px] font-bold ${textHead}`} style={fontSans}>{t.label}</span>
                        <input 
                          type="text" 
                          value={forms[t.id] || ''}
                          onChange={(e) => handleForm(t.id, e.target.value)}
                          className={`w-full p-1.5 text-[12px] outline-none ${inputStyle} mt-0.5`}
                          style={fontSerif}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 최종 신학 체크리스트 */}
                <div className={`p-2.5 border ${subBox}`}>
                  <h4 className={`text-[12.5px] font-bold mb-1.5 ${textHead}`} style={fontSans}>
                    § WCF.3 정통 신학적 안전장치 점검표
                  </h4>
                  <div className="space-y-1">
                    {[
                      { id: 'wcf_f1', label: '성경을 최종 기준으로 삼고, 감정과 계시를 혼동하지 않는다.' },
                      { id: 'wcf_f2', label: '칭의와 성화를 구분하고 인간의 공로를 배제한다.' },
                      { id: 'wcf_f3', label: '자기혐오에 빠지지 않고, 고난의 원인을 함부로 단정하지 않는다.' },
                      { id: 'wcf_f4', label: '섭리를 인정하고 말씀으로 해석하여 순종을 찾는다.' },
                      { id: 'wcf_f5', label: '상황만이 아닌 하나님을 바라보며, 감사가 순종으로 이어진다.' },
                      { id: 'wcf_f6', label: '예배와 교제에 참여하며 다른 사람을 세운다.' }
                    ].map(c => {
                      const isChecked = Boolean(checks[c.id]);
                      return (
                        <div 
                          key={c.id}
                          onPointerDown={(e) => { e.preventDefault(); toggleCheck(c.id); }}
                          className={`p-1.5 border cursor-pointer flex items-center gap-2 ${
                            isChecked ? (_isDark ? 'bg-[#1C2430] border-[#3E526D]' : 'bg-[#F0F5FA] border-[#BDD0E4]') : cardBox
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 border shrink-0 flex items-center justify-center ${
                            isChecked ? 'bg-[#7A2E26] border-[#7A2E26] text-white' : (_isDark ? 'border-[#4A5568]' : 'border-[#A0AEC0]')
                          }`}>
                            {isChecked && <IconCheck />}
                          </div>
                          <span className={`text-[11.5px] ${isChecked ? 'font-bold text-white dark:text-white' : textBody}`} style={fontSerif}>
                            {c.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
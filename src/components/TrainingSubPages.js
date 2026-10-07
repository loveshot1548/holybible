import React, { useState, useEffect } from 'react';

// =====================================================================
// 로컬 스토리지 헬퍼 (작성한 모든 묵상, 체크리스트 영구 저장 100% 유지)
// =====================================================================
const getLocal = (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const setLocal = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// =====================================================================
// 모던 라인 아이콘 세트 (파이프라인 연동 아이콘)
// =====================================================================
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>;
const IconMenu = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const IconSend = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;

// =====================================================================
// 글래스 UI 빌딩 블록 (기존 텍스트 구조 100% 유지 + 모바일 최적화)
// =====================================================================
const Title = ({ children, ui }) => (
  <h1 className={`text-[19px] md:text-[22px] font-black mt-10 mb-5 pb-3 border-b-2 border-black/10 dark:border-white/10 tracking-tight leading-[1.4] break-keep ${ui.textMain}`}>
    {children}
  </h1>
);

const SubTitle = ({ children, ui }) => (
  <h2 className={`text-[16px] md:text-[18px] font-black mt-8 mb-4 ${ui.primary} tracking-tight break-keep flex items-center gap-2`}>
    <span className="w-1.5 h-4 rounded-full bg-sky-500 inline-block shrink-0" />
    {children}
  </h2>
);

const H3 = ({ children, ui }) => (
  <h3 className={`text-[15px] md:text-[16px] font-bold mt-8 mb-3 break-keep ${ui.textMain}`}>
    {children}
  </h3>
);

const H4 = ({ children, ui }) => (
  <h4 className={`text-[14px] md:text-[14.5px] font-bold mt-5 mb-2 break-keep ${ui.textMain}`}>
    {children}
  </h4>
);

const P = ({ children, ui }) => (
  <p className={`text-[13.5px] md:text-[14.5px] leading-[1.8] font-medium mb-5 break-keep whitespace-pre-wrap ${ui.textSub}`}>
    {children}
  </p>
);

const Quote = ({ children, ui }) => (
  <blockquote className={`p-4 md:p-5 my-6 rounded-2xl border-l-4 border-sky-500 bg-sky-500/10 text-[13.5px] md:text-[14.5px] font-bold leading-[1.8] break-keep ${isDark(ui) ? 'text-sky-300' : 'text-sky-800'}`}>
    {children}
  </blockquote>
);

const Textarea = ({ id, label, placeholder, height="min-h-[100px]", ui, value, onChange }) => (
  <div className="w-full mt-3 mb-5 min-w-0">
    {label && <label className={`block text-[13.5px] font-black mb-2.5 break-keep ${ui.textMain}`}>{label}</label>}
    <textarea 
      value={value || ''} onChange={(e) => onChange(id, e.target.value)}
      className={`w-full p-4 text-[13.5px] font-medium leading-[1.8] resize-y ${height} outline-none border transition-all shadow-inner rounded-xl ${ui.inputBg}`}
      placeholder={placeholder || "이곳에 나의 묵상과 결단을 정직하게 기록하십시오."}
    />
  </div>
);

const Input = ({ id, label, placeholder, ui, value, onChange }) => (
  <div className="w-full mt-3 mb-5 min-w-0">
    {label && <label className={`block text-[13.5px] font-black mb-2.5 break-keep ${ui.textMain}`}>{label}</label>}
    <input 
      type="text" value={value || ''} onChange={(e) => onChange(id, e.target.value)}
      className={`w-full px-4 py-3.5 text-[13.5px] font-medium outline-none border transition-all shadow-inner rounded-xl ${ui.inputBg}`}
      placeholder={placeholder || "기록하십시오."}
    />
  </div>
);

const Checkbox = ({ id, label, ui, checked, onToggle }) => (
  <div 
    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(id); }}
    className={`flex items-start gap-3.5 py-3.5 px-4 rounded-2xl cursor-pointer transition-all border shadow-sm w-full min-w-0 ${checked ? 'bg-sky-500/10 border-sky-500/30' : `bg-black/5 dark:bg-white/5 border-transparent`}`}
  >
    <div className={`mt-0.5 w-[20px] h-[20px] rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${checked ? 'bg-sky-500 border-sky-500 text-white' : `bg-transparent ${ui.border}`}`}>
      {checked && <IconCheck />}
    </div>
    <span className={`text-[13.5px] leading-[1.6] select-none flex-1 break-keep ${checked ? `text-sky-500 font-bold` : `${ui.textMain} font-bold`}`}>
      {label}
    </span>
  </div>
);

const isDark = (ui) => ui.bgBody.includes('0F1115');

// =====================================================================
// 메인 컴포넌트
// =====================================================================
export default function TrainingSubPages({ t, isDarkMode, setActiveScreen, isSidebarOpen, setIsSidebarOpen }) {
  const _isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;
  
  const ui = {
    bgBody: _isDark ? 'bg-[#0F1115]' : 'bg-[#F8F9FA]',
    textMain: _isDark ? 'text-white' : 'text-slate-900',
    textSub: _isDark ? 'text-slate-400' : 'text-slate-600',
    border: _isDark ? 'border-white/10' : 'border-slate-300',
    inputBg: _isDark ? 'bg-black/40 border-white/10 text-white focus:border-sky-400 placeholder:text-slate-600' : 'bg-white/50 border-slate-300 text-slate-900 focus:border-sky-500 placeholder:text-slate-500',
    primary: _isDark ? 'text-sky-400' : 'text-sky-600',
    btnPrimary: _isDark ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 border border-sky-400/30' : 'bg-sky-100 text-sky-700 hover:bg-sky-200 border border-sky-200'
  };

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

  // 💡 [영적 파이프라인 엔진: 100% 보존]
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
    { id: 'index', label: 'Index' },
    { id: 'wk1', label: '1주차: 복음' },
    { id: 'wk2', label: '2주차: 해석' },
    { id: 'wk3', label: '3주차: 고난' },
    { id: 'wk4', label: '4주차: 재생산' },
    { id: 'wcf', label: 'WCF 기준서' }
  ];

  return (
    <div className={`flex-1 flex flex-col h-full relative overflow-hidden font-sans select-none animate-fade-in ${ui.bgBody} w-full min-w-0 max-w-full`}>
      
      {/* 💡 라이트모드에서도 영롱한 리퀴드 오로라 배경 */}
      <div className={`absolute inset-0 z-0 pointer-events-none overflow-hidden ${isDark(ui) ? 'opacity-30 mix-blend-lighten' : 'opacity-80'}`}>
        <div className="absolute -top-[5%] -left-[10%] w-[70vw] h-[70vw] rounded-full animate-pulse" style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, transparent 70%)', filter: 'blur(90px)' }} />
        <div className="absolute top-[30%] -right-[20%] w-[80vw] h-[80vw] rounded-full animate-pulse" style={{ background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)', filter: 'blur(100px)', animationDelay: '1s' }} />
        <div className="absolute -bottom-[10%] left-[10%] w-[75vw] h-[75vw] rounded-full animate-pulse" style={{ background: 'radial-gradient(circle, rgba(244, 114, 182, 0.25) 0%, transparent 70%)', filter: 'blur(100px)', animationDelay: '2s' }} />
      </div>

      {/* 1. 상단 글래스 헤더 */}
      <div className={`shrink-0 px-4 sm:px-6 py-3.5 flex items-center justify-between z-30 border-b relative backdrop-blur-2xl w-full min-w-0 ${isDark(ui) ? 'border-white/10 bg-[#0F1115]/60' : 'border-slate-200/50 bg-white/40'}`}>
        <div className="flex items-center gap-3 cursor-pointer" onPointerDown={(e) => { e.preventDefault(); setActiveScreen('trainingCurriculum'); }}>
          <button className={`p-1.5 -ml-1 rounded-full transition-colors ${ui.textMain} hover:bg-black/5 dark:hover:bg-white/10`}><IconArrowLeft /></button>
          <div className="flex flex-col">
            <h1 className={`text-[16px] font-black tracking-tight ${ui.textMain}`}>4주 제자훈련 심화 워크북</h1>
            <span className={`text-[10.5px] font-bold ${ui.primary} hidden sm:block tracking-widest uppercase`}>강해 · 주해 · 실습 · 시험 전권 통합본</span>
          </div>
        </div>
        <button onPointerDown={(e) => { e.preventDefault(); setIsSidebarOpen && setIsSidebarOpen(!isSidebarOpen); }} className={`p-1.5 rounded-full transition-colors cursor-pointer ${ui.textMain} hover:bg-black/5 dark:hover:bg-white/10`}>
           <IconMenu />
        </button>
      </div>

      {/* 2. 탭 바 (글래스모피즘 가로 스크롤) */}
      <div className={`flex w-full overflow-x-auto hide-scrollbar border-b z-20 backdrop-blur-xl shrink-0 px-3 py-2 gap-1 touch-pan-x min-w-0 ${isDark(ui) ? 'border-white/10 bg-[#1C1C1E]/40' : 'border-white/60 bg-white/30'}`}>
        {TABS.map(tab => (
          <button 
            key={tab.id} 
            onPointerDown={(e) => { e.preventDefault(); setActiveTab(tab.id); }}
            className={`shrink-0 px-4 py-2 rounded-xl text-[13px] font-black transition-all cursor-pointer shadow-sm ${
              activeTab === tab.id 
                ? 'bg-sky-500 text-white border border-sky-400' 
                : (isDark(ui) ? 'text-slate-400 hover:text-white bg-white/5 border border-transparent' : 'text-slate-600 hover:text-slate-900 bg-white/40 border border-white/50')
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. 본문 뷰어 (모바일 찌그러짐 방지 & 홈 바 가림 방지 pb-32) */}
      <div className="flex-1 overflow-y-auto hide-scrollbar w-full p-3.5 sm:p-6 relative z-10 min-w-0 pb-32 bg-transparent">
        <div className={`w-full max-w-4xl mx-auto p-5 sm:p-8 rounded-[24px] border shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-3xl min-w-0 ${isDark(ui) ? 'bg-[#1C1C1E]/50 border-white/10' : 'bg-white/40 border-white/60'}`}>

          {/* ==================================================
              TAB 0: Index 안내 및 구조
              ================================================== */}
          {activeTab === 'index' && (
            <div className="animate-fade-in w-full min-w-0">
              <Title ui={ui}>4주 제자훈련 — 주차별 심화 서브페이지</Title>
              <P ui={ui}>이 폴더는 기존 완전판 원본을 수정하지 않고, 각 주차를 독립적으로 확장하기 위한 서브페이지 모음이다.</P>
              
              <SubTitle ui={ui}>구성</SubTitle>
              <div className="space-y-6 pl-4 border-l-2 border-sky-500/40 mb-10 py-1">
                <div>
                  <H4 ui={ui}>1. 01_1주차_복음과제자_주해강해실습시험.md</H4>
                  <P ui={ui}>복음, 제자도, 칭의/성화<br/>마가복음 8:34–38 강해<br/>간증훈련<br/>사례연구<br/>시험·과제·교수자 지도안</P>
                </div>
                <div>
                  <H4 ui={ui}>2. 02_2주차_말씀과삶의해석_QT_주해강해실습시험.md</H4>
                  <P ui={ui}>QT 신학<br/>본문 관찰·해석·적용<br/>사건/감정/욕망/두려움 분리<br/>설교 분석<br/>QT 실습·시험·평가</P>
                </div>
                <div>
                  <H4 ui={ui}>3. 03_3주차_고난회개감사_주해강해실습시험.md</H4>
                  <P ui={ui}>고난과 섭리<br/>고난 해석 12단계<br/>회개<br/>감사훈련<br/>30일 고난훈련<br/>사례·시험·간증평가</P>
                </div>
                <div>
                  <H4 ui={ui}>4. 04_4주차_공동체양육교사재생산_주해강해실습시험.md</H4>
                  <P ui={ui}>공동체적 제자도<br/>양육교사<br/>질문기술<br/>1:1 양육<br/>30일 한 사람 세우기<br/>최종 실기·수료평가</P>
                </div>
              </div>

              <SubTitle ui={ui}>연구 기준</SubTitle>
              <ul className={`list-disc pl-5 space-y-3 text-[13.5px] md:text-[14.5px] font-medium break-keep ${ui.textSub} mb-10`}>
                <li>성경 → 웨스트민스터 신앙고백/대요리문답 → 공개 양육자료 → 설교 corpus → 교육설계의 순서로 구분한다.</li>
                <li>특정 목회자의 관점과 교단적 교리를 동일시하지 않는다.</li>
                <li>확인되지 않은 직접인용은 만들지 않는다.</li>
                <li>사용자가 제공한 이성현 목사 1년 설교 corpus는 원문 확인을 전제로 분석한다.</li>
                <li>[D]는 본 프로젝트에서 새롭게 설계한 교육도구다.</li>
              </ul>

              <SubTitle ui={ui}>공식 자료 확인</SubTitle>
              <P ui={ui}>QTM은 현재 THINK 양육(10주) 개정증보판, THINK 기초양육, THINK 예비목자양육 1·2, THINK 중보기도(4주) 등의 양육교재를 공개하고 있다.</P>
              <P ui={ui}>2026년 공개된 목회자 THINK 양육 안내에서는 주일설교, 주제QT, 독후감, 생활숙제, 매일QT를 과제로 제시하고 있으며 출석 및 과제 기준을 수료요건으로 제시한다.</P>
              <P ui={ui}>본 서브페이지는 이러한 공개 구조를 참고하되, <strong>4주 대학·신학교형 제자훈련 교재로 확장한 교육설계본</strong>이다.</P>
            </div>
          )}

          {/* ==================================================
              TAB 1: 1주차 복음과 제자
              ================================================== */}
          {activeTab === 'wk1' && (
            <div className="animate-fade-in w-full min-w-0">
              <Title ui={ui}>1주차 확장 서브페이지</Title>
              <SubTitle ui={ui}>복음이 먼저다 — 제자가 되는 사람은 먼저 복음 안에서 자기 자신을 해석한다</SubTitle>
              
              <div className={`p-4 rounded-2xl border mb-8 text-[13px] leading-[1.7] break-keep font-medium shadow-sm ${isDark(ui) ? 'bg-black/30 border-white/5 text-slate-300' : 'bg-white/50 border-white/80 text-slate-700'}`}>
                <strong className={ui.textMain}>연구 표기 규칙</strong><br/>
                - [F] 자료근거: 공식 공개자료·사용자가 제공한 설교 corpus·성경·신앙고백서에서 직접 확인되는 내용<br/>
                - [S] 종합: 여러 자료에서 반복되는 주제를 비교하여 묶은 것<br/>
                - [T] 신학적 검토: 성경 및 웨스트민스터 신앙고백/대요리문답과의 관계를 검토한 것<br/>
                - [D] 교육설계: 본 교재 제작자가 실제 양육을 위해 새롭게 설계한 실습·질문·평가도구<br/>
                중요: [D]와 [S]의 교육적 종합은 김양재 목사·이성현 목사·우리들교회·김포좋은나무교회의 공식 교재나 공식 입장을 그대로 옮긴 것이 아니다.
              </div>

              <H3 ui={ui}>0. 1주차의 교육적 위치</H3>
              <P ui={ui}>4주 과정의 첫 주는 행동교정이 아니라 <strong>복음과 제자도의 출발점</strong>을 세우는 데 목적이 있다.<br/><br/>제자훈련에서 가장 위험한 출발은 다음과 같다.</P>
              <ul className={`list-disc pl-5 space-y-2 mb-6 text-[13.5px] md:text-[14.5px] font-bold ${ui.textSub}`}>
                <li>“더 열심히 하자.”</li>
                <li>“QT를 매일 하자.”</li>
                <li>“봉사를 많이 하자.”</li>
                <li>“감사하자.”</li>
                <li>“고난을 잘 견디자.”</li>
              </ul>
              <P ui={ui}>이 명령들이 성경적이라 하더라도 <strong>복음보다 먼저 나오면 자기의 의와 성과를 만드는 훈련</strong>으로 변질될 수 있다. 따라서 첫 주는 다음 순서를 고정한다.</P>
              <Quote ui={ui}>복음 → 은혜 → 정체성 → 회개 → 순종 → 제자도</Quote>

              <H3 ui={ui}>학습목표</H3>
              <P ui={ui}>수료자는 다음을 설명할 수 있어야 한다.</P>
              <ol className={`list-decimal pl-5 space-y-2 mb-8 text-[13.5px] md:text-[14.5px] font-bold ${ui.textMain}`}>
                <li>복음과 도덕적 자기개선의 차이</li>
                <li>칭의와 성화의 차이</li>
                <li>자기부인과 자기혐오의 차이</li>
                <li>회개와 자책의 차이</li>
                <li>제자도의 성경적 의미</li>
                <li>자신의 삶에서 “내가 주인인 영역”을 구체적으로 식별하는 방법</li>
              </ol>

              <Title ui={ui}>1. 성경 강해</Title>
              <SubTitle ui={ui}>1.1 마가복음 8:34–38 — “자기를 부인하고 자기 십자가를 지라”</SubTitle>
              <H4 ui={ui}>본문 관찰 [F]</H4>
              <ul className={`list-disc pl-5 space-y-1.5 mb-6 text-[13.5px] md:text-[14.5px] font-medium break-keep ${ui.textSub}`}>
                <li>예수께서 부르신다.</li>
                <li>따라오려면 자기를 부인한다.</li>
                <li>자기 십자가를 진다.</li>
                <li>예수를 따른다.</li>
                <li>자기 목숨을 구하고자 하면 잃는다.</li>
                <li>복음과 예수 때문에 잃으면 구한다.</li>
              </ul>

              <H4 ui={ui}>해석 [T]</H4>
              <P ui={ui}>본문의 중심은 고난 자체를 숭배하는 것이 아니다.<br/><br/><strong>예수 그리스도를 주로 따르는 제자도의 방향</strong>이다.<br/><br/>따라서 “십자가를 진다”를 단순히 “힘든 일을 참고 버틴다”로 축소하면 안 된다.<br/>제자도는 자기 뜻을 절대화하지 않고 <strong>그리스도의 주권 아래 자신을 두는 것</strong>을 포함한다.</P>

              <H4 ui={ui}>적용 [D]</H4>
              <P ui={ui}>다음 문장을 완성한다.</P>
              <Quote ui={ui}>“내가 예수님을 따른다고 말하지만 실제로는 ________ 영역에서는 내가 결정권자가 되려고 한다.”</Quote>
              <P ui={ui}><span className="text-[12px] text-slate-400">가능한 영역: 돈, 시간, 가족, 직장, 자녀, 인간관계, 명예, 교회, 사역, 감정, 미래, 인정욕구</span></P>
              <Textarea id="wk1_q1" placeholder="나의 영역을 적어보십시오." height="min-h-[90px]" ui={ui} value={forms['wk1_q1']} onChange={handleForm} />

              <Title ui={ui}>2. 칭의와 성화</Title>
              <H4 ui={ui}>2.1 칭의</H4>
              <P ui={ui}>칭의는 사람이 자기 노력으로 하나님께 인정받는 과정이 아니다.<br/>제자훈련에서 이 구분이 무너지면 모든 훈련이 “착한 사람이 되기 위한 종교 프로그램”으로 바뀐다.</P>
              <H4 ui={ui}>2.2 성화</H4>
              <P ui={ui}>성화는 이미 그리스도 안에서 받은 구원을 근거로 삶이 점차 변화되는 과정이다.<br/>웨스트민스터 대요리문답 Q75는 성화를 하나님의 은혜의 역사로 설명하며, 신자가 죄에 대하여 점점 죽고 새 생명 가운데 살아가는 방향을 강조한다.</P>
              <P ui={ui}>따라서 제자훈련의 질문은:</P>
              <Quote ui={ui}>“나는 얼마나 잘했는가?”</Quote>
              <P ui={ui}>에서 끝나면 안 되고,</P>
              <Quote ui={ui}>“말씀 앞에서 무엇이 드러났고, 그 드러남이 어떤 회개와 순종으로 이어졌는가?”</Quote>
              <P ui={ui}>로 이동해야 한다.</P>

              <Title ui={ui}>3. 웨스트민스터 신앙고백과 제자훈련</Title>
              <H4 ui={ui}>3.1 성경의 우선성</H4>
              <P ui={ui}>웨스트민스터 신앙고백 1장은 성경을 구원의 지식과 교회의 진리를 위해 주어진 하나님의 기록된 말씀으로 강조한다.<br/>따라서 제자훈련의 최종 권위는 특정 목회자의 경험이 아니다.<br/><br/><strong>성경이다.</strong><br/><br/>김양재 목사의 큐티목회, 우리들교회의 양육체계, 이성현 목사님의 설교 corpus는 본 과정에서 중요한 연구자료이지만 성경과 동일한 권위를 갖지 않는다.<br/>이 구분은 본 교재 전체에서 계속 유지한다.</P>

              <Title ui={ui}>4. 우리들교회/QTM 공개자료와의 연결</Title>
              <H4 ui={ui}>4.1 공개적으로 확인되는 양육 구조 [F]</H4>
              <P ui={ui}>QTM의 공개 양육 안내에서는 THINK 양육 과정에서 다음 과제가 반복적으로 제시된다.</P>
              <ul className={`list-disc pl-5 space-y-1.5 mb-6 text-[13.5px] md:text-[14.5px] font-medium break-keep ${ui.textSub}`}>
                <li>주일설교</li>
                <li>주제QT</li>
                <li>독후감</li>
                <li>생활숙제</li>
                <li>매일QT</li>
              </ul>
              <P ui={ui}>또한 과제를 자신의 삶과 연결하고, 생활숙제를 실제 한 주간 실천한 뒤 느낀 점을 기록하도록 안내한다.<br/>이는 단순한 강의 수강보다 <strong>말씀 → 기록 → 삶의 적용 → 점검</strong>을 강조하는 구조로 볼 수 있다.</P>

              <H4 ui={ui}>4.2 교육적 추출 [S]</H4>
              <P ui={ui}>이 구조를 제자훈련에 적용할 경우 다음 사이클이 유용하다.</P>
              <Quote ui={ui}>듣기 → 읽기 → 묵상하기 → 기록하기 → 적용하기 → 나누기 → 점검하기</Quote>
              <P ui={ui}>단, 이 사이클 자체를 QTM의 공식 명칭이나 공식 교재 문구라고 오해해서는 안 된다. 본 교재의 교육적 종합이다.</P>

              <Title ui={ui}>5. 김양재 목사/QTM의 공개 핵심가치와 연결</Title>
              <P ui={ui}>QTM 공식 소개에는 다음과 같은 핵심가치가 공개되어 있다.<br/>나눔, 오픈, 고백, 처방, 내 죄 보기, 진실과 성실, 여전한 방식으로, 내면적용과 실천적용, 잘 듣고 잘 묻기, 공감과 체휼.<br/><br/>이 가운데 1주차에서 특히 중요한 것은 <strong>내 죄 보기</strong>와 <strong>내면적용</strong>이다.<br/>그러나 이것을 “모든 사건은 내 죄 때문에 발생했다”는 식으로 확대해서는 안 된다.<br/>성경은 고난의 원인을 단순하게 한 가지 원인으로 환원하지 않는다.</P>

              <Title ui={ui}>6. 이성현 목사 설교 corpus 활용법</Title>
              <P ui={ui}>사용자가 제공한 김포좋은나무교회 이성현 목사님의 1년 설교 corpus는 본 과정에서 <strong>설교 내용의 반복적 강조점과 목회적 적용방식을 관찰하는 2차 연구자료</strong>로 사용한다.</P>
              <H4 ui={ui}>코딩 원칙</H4>
              <P ui={ui}>각 설교에서 다음 항목을 표시한다: G(하나님에 대한 진술), C(그리스도/복음), S(죄와 회개), P(고난/섭리), W(말씀), A(적용), K(공동체), M(선교/사명), Pn(기도), T(감사).</P>
              <H4 ui={ui}>주의</H4>
              <P ui={ui}>설교자가 어떤 주제를 반복한다고 해서 그것이 곧 “교단 공식 교리”가 되는 것은 아니다.<br/>반복성은 <strong>설교 corpus의 특징</strong>으로 기록하고, 교리적 진술은 성경과 신앙고백으로 별도 검토한다.</P>

              <Title ui={ui}>7. 강의안</Title>
              <SubTitle ui={ui}>강의 1 — 나는 왜 제자가 되려 하는가?</SubTitle>
              <H4 ui={ui}>강의 질문</H4>
              <ol className={`list-decimal pl-5 space-y-2 mb-6 text-[13.5px] md:text-[14.5px] font-bold ${ui.textMain}`}>
                <li>나는 구원받기 위해 훈련받는가?</li>
                <li>이미 받은 은혜에 반응하기 위해 훈련받는가?</li>
                <li>내가 원하는 예수와 성경의 예수는 같은가?</li>
                <li>내가 원하는 교회생활과 성경적 제자도는 같은가?</li>
              </ol>
              <H4 ui={ui}>교수자 핵심 설명</H4>
              <P ui={ui}>제자훈련은 “교회에서 일을 잘하는 사람”을 만드는 과정이 아니다.<br/>제자훈련의 목표는 <strong>그리스도를 알고, 그리스도를 따르며, 삶의 모든 영역을 그리스도의 말씀 아래 가져오는 것</strong>이다.</P>

              <Title ui={ui}>8. 강해 실습</Title>
              <SubTitle ui={ui}>실습 A — 본문에서 사실만 적기 (마가복음 8:34–38)</SubTitle>
              <H4 ui={ui}>사실</H4>
              <P ui={ui}>예수께서 무리를 제자들과 함께 부르셨다. 따라오려는 사람에게 자기부인을 요구하셨다. 자기 십자가를 지라고 하셨다. 예수를 따르라고 하셨다.</P>
              <H4 ui={ui}>해석</H4>
              <P ui={ui}>제자도에는 자기중심성의 포기가 포함된다. 예수 따름은 단순한 지적 동의가 아니다.</P>
              <H4 ui={ui}>적용</H4>
              <P ui={ui}>이번 주 내가 실제로 내려놓아야 할 결정 하나를 선택한다.</P>

              <Title ui={ui}>9. 간증훈련</Title>
              <SubTitle ui={ui}>간증의 기본 구조 [D]</SubTitle>
              <div className="space-y-4 mb-4">
                <Textarea id="wk1_testimony1" label="① 이전: 나는 이 문제에서 무엇을 믿고 살았는가?" height="min-h-[90px]" ui={ui} value={forms['wk1_testimony1']} onChange={handleForm} />
                <Textarea id="wk1_testimony2" label="② 사건: 무슨 일이 있었는가?" height="min-h-[90px]" ui={ui} value={forms['wk1_testimony2']} onChange={handleForm} />
                <Textarea id="wk1_testimony3" label="③ 말씀: 어떤 말씀을 통해 나의 생각이 드러났는가?" height="min-h-[90px]" ui={ui} value={forms['wk1_testimony3']} onChange={handleForm} />
                <Textarea id="wk1_testimony4" label="④ 회개: 무엇을 인정하고 돌이켰는가?" height="min-h-[90px]" ui={ui} value={forms['wk1_testimony4']} onChange={handleForm} />
                <Textarea id="wk1_testimony5" label="⑤ 적용: 무엇을 실제로 바꾸었는가?" height="min-h-[90px]" ui={ui} value={forms['wk1_testimony5']} onChange={handleForm} />
                <Textarea id="wk1_testimony6" label="⑥ 현재: 아직 남아 있는 문제는 무엇인가?" height="min-h-[90px]" ui={ui} value={forms['wk1_testimony6']} onChange={handleForm} />
              </div>
              <button 
                onPointerDown={(e) => { e.preventDefault(); syncToPipeline('diary', {t1: forms.wk1_testimony1, t2: forms.wk1_testimony2, t3: forms.wk1_testimony3, t4: forms.wk1_testimony4, t5: forms.wk1_testimony5, t6: forms.wk1_testimony6}); }}
                className={`w-full py-4 rounded-xl text-[13.5px] font-black flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-sm mb-10 ${ui.btnPrimary}`}
              >
                <IconSend /> 위 간증문을 나의 '감사/간증 일기장'으로 전송[cite: 9]
              </button>
              <P ui={ui}>좋은 간증은 자기 자랑이 아니라 <strong>하나님의 은혜가 드러나는 방향</strong>을 가져야 한다.</P>

              <Title ui={ui}>10. 1주차 사례연구</Title>
              <H4 ui={ui}>사례</H4>
              <P ui={ui}>한 성도가 말한다. "저는 교회에 열심히 나오고 QT도 합니다. 그런데 가족이 제 뜻대로 움직이지 않으면 너무 화가 납니다."</P>
              <H4 ui={ui}>나쁜 질문</H4>
              <P ui={ui}>“왜 그렇게 믿음이 없어요?” “기도가 부족한 것 아닌가요?” “감사하세요.”</P>
              <H4 ui={ui}>좋은 질문</H4>
              <ol className={`list-decimal pl-5 space-y-2 mb-6 text-[13.5px] md:text-[14.5px] font-medium break-keep ${ui.textSub}`}>
                <li>가족이 내 뜻대로 움직이지 않을 때 정확히 무엇이 불편한가?</li>
                <li>그 순간 내가 지키고 싶은 것은 무엇인가?</li>
                <li>내가 원하는 결과가 이루어져야 하나님이 나를 사랑하신다고 느끼는가?</li>
                <li>말씀은 이 사건에서 무엇을 보여주는가?</li>
                <li>내가 회개할 수 있는 것은 무엇인가?</li>
                <li>내가 통제할 수 없는 것은 무엇인가?</li>
                <li>이번 주에 실제로 바꿀 행동은 무엇인가?</li>
              </ol>

              <Title ui={ui}>11. 1주차 실습지</Title>
              <SubTitle ui={ui}>A. 내 인생의 “주인 자리”</SubTitle>
              <div className="space-y-4 mb-4">
                <Input id="wk1_sheet1" label="1. 내가 가장 통제하려는 영역:" ui={ui} value={forms['wk1_sheet1']} onChange={handleForm} />
                <Textarea id="wk1_sheet2" label="2. 그 이유:" height="min-h-[90px]" ui={ui} value={forms['wk1_sheet2']} onChange={handleForm} />
                <Textarea id="wk1_sheet3" label="3. 통제가 안 될 때 느끼는 감정:" height="min-h-[90px]" ui={ui} value={forms['wk1_sheet3']} onChange={handleForm} />
                <Textarea id="wk1_sheet4" label="4. 그 감정 아래 있는 욕망:" height="min-h-[90px]" ui={ui} value={forms['wk1_sheet4']} onChange={handleForm} />
                <Textarea id="wk1_sheet5" label="5. 내가 두려워하는 것:" height="min-h-[90px]" ui={ui} value={forms['wk1_sheet5']} onChange={handleForm} />
                <Textarea id="wk1_sheet6" label="6. 말씀 앞에서 드러난 죄:" height="min-h-[90px]" ui={ui} value={forms['wk1_sheet6']} onChange={handleForm} />
                <Textarea id="wk1_sheet7" label="7. 하나님에 대한 잘못된 믿음:" height="min-h-[90px]" ui={ui} value={forms['wk1_sheet7']} onChange={handleForm} />
                <Textarea id="wk1_sheet8" label="8. 회개:" height="min-h-[90px]" ui={ui} value={forms['wk1_sheet8']} onChange={handleForm} />
                <Textarea id="wk1_sheet9" label="9. 이번 주 순종:" height="min-h-[90px]" ui={ui} value={forms['wk1_sheet9']} onChange={handleForm} />
                <Input id="wk1_sheet10" label="10. 함께 점검할 사람:" ui={ui} value={forms['wk1_sheet10']} onChange={handleForm} />
              </div>
              <button 
                onPointerDown={(e) => { e.preventDefault(); syncToPipeline('apply', {a: forms.wk1_sheet9}, "입력하신 순종 과제가 적용 트래커로 전송되었습니다."); }}
                className={`w-full py-4 rounded-xl text-[13.5px] font-black flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-sm mb-10 ${ui.btnPrimary}`}
              >
                <IconSend /> 문항 9번(순종)을 '적용 질문 트래커'로 자동 전송[cite: 9]
              </button>

              <Title ui={ui}>12. 시험</Title>
              <H4 ui={ui}>객관식</H4>
              <P ui={ui}>1. 제자훈련의 최종 권위는? (A. 양육자 B. 목회자의 경험 C. 성경 D. 훈련생의 감정)<br/>정답: C<br/><br/>
              2. 성화에 대한 설명으로 가장 적절한 것은? (A. 구원을 얻기 위한 공로 B. 하나님의 은혜 안에서 이루어지는 변화 C. 교회 봉사량 D. 고난의 양)<br/>정답: B</P>
              <H4 ui={ui}>서술형</H4>
              <Textarea id="wk1_exam_desc" label="자기부인과 자기혐오의 차이를 설명하고, 자신의 삶에서 실제 사례 하나를 제시하라." placeholder="채점 기준: 개념 구분(20), 성경 근거(20), 자기 사례(20), 복음과 연결(20), 구체적 적용(20)" height="min-h-[160px]" ui={ui} value={forms['wk1_exam_desc']} onChange={handleForm} />

              <Title ui={ui}>13. 과제</Title>
              <H4 ui={ui}>필수</H4>
              <ul className={`list-disc pl-5 space-y-2 mb-6 text-[13.5px] md:text-[14.5px] font-medium break-keep ${ui.textSub}`}>
                <li>마가복음 8:34–38 묵상</li>
                <li>자신의 간증 초안 1편</li>
                <li>“내가 통제하려는 영역” 기록</li>
                <li>주일설교 1편 기록</li>
                <li>매일 QT 최소 3회</li>
              </ul>
              <H4 ui={ui}>제출물</H4>
              <P ui={ui}>1. 본문 관찰 2. 본문 해석 3. 자신의 죄/욕망 4. 하나님의 성품 5. 적용 6. 일주일 후 결과 7. 다시 수정할 부분</P>

              <Title ui={ui}>14. 양육자 평가 체크리스트</Title>
              <div className="space-y-1.5 mb-10">
                <Checkbox id="w1_eval1" label="훈련생의 말을 끊지 않았다." ui={ui} checked={checks['w1_eval1']} onToggle={toggleCheck} />
                <Checkbox id="w1_eval2" label="성급하게 정답을 제시하지 않았다." ui={ui} checked={checks['w1_eval2']} onToggle={toggleCheck} />
                <Checkbox id="w1_eval3" label="사실과 해석을 구분했다." ui={ui} checked={checks['w1_eval3']} onToggle={toggleCheck} />
                <Checkbox id="w1_eval4" label="죄를 함부로 단정하지 않았다." ui={ui} checked={checks['w1_eval4']} onToggle={toggleCheck} />
                <Checkbox id="w1_eval5" label="말씀으로 질문했다." ui={ui} checked={checks['w1_eval5']} onToggle={toggleCheck} />
                <Checkbox id="w1_eval6" label="복음으로 연결했다." ui={ui} checked={checks['w1_eval6']} onToggle={toggleCheck} />
                <Checkbox id="w1_eval7" label="실제 적용을 확인했다." ui={ui} checked={checks['w1_eval7']} onToggle={toggleCheck} />
                <Checkbox id="w1_eval8" label="개인의 비밀을 보호했다." ui={ui} checked={checks['w1_eval8']} onToggle={toggleCheck} />
                <Checkbox id="w1_eval9" label="위험한 사안은 목회자에게 연결했다." ui={ui} checked={checks['w1_eval9']} onToggle={toggleCheck} />
              </div>

              <Title ui={ui}>15. 교수자용 90분 진행표</Title>
              <P ui={ui}>0–10분: 출석·기도 / 10–25분: 복음과 제자도 강의 / 25–45분: 마가복음 8:34–38 강해 / 45–60분: 개인 묵상 / 60–75분: 사례연구 / 75–85분: 간증 실습 / 85–90분: 과제 설명·기도</P>

              <Title ui={ui}>16. 1주차 통과 기준</Title>
              <div className="space-y-4 mb-10">
                <H4 ui={ui}>지식</H4>
                <Checkbox id="w1_pass1" label="복음과 율법주의를 설명할 수 있다." ui={ui} checked={checks['w1_pass1']} onToggle={toggleCheck} />
                <Checkbox id="w1_pass2" label="칭의와 성화를 구분할 수 있다." ui={ui} checked={checks['w1_pass2']} onToggle={toggleCheck} />
                <H4 ui={ui}>묵상</H4>
                <Checkbox id="w1_pass3" label="본문과 내 생각을 구분한다." ui={ui} checked={checks['w1_pass3']} onToggle={toggleCheck} />
                <H4 ui={ui}>회개</H4>
                <Checkbox id="w1_pass4" label="타인의 잘못보다 자신의 반응을 먼저 볼 수 있다." ui={ui} checked={checks['w1_pass4']} onToggle={toggleCheck} />
                <H4 ui={ui}>적용</H4>
                <Checkbox id="w1_pass5" label="실제 행동 하나를 선택한다." ui={ui} checked={checks['w1_pass5']} onToggle={toggleCheck} />
                <H4 ui={ui}>공동체</H4>
                <Checkbox id="w1_pass6" label="자신의 나눔을 통해 타인을 정죄하지 않는다." ui={ui} checked={checks['w1_pass6']} onToggle={toggleCheck} />
              </div>

              <Title ui={ui}>17. 교수자 연구 메모</Title>
              <P ui={ui}>이 주차에서 가장 경계할 것은 “우리 교회의 방식”이 “성경의 명령”과 동일하다고 가르치는 것이다.<br/>우리들교회/QTM의 공개 양육자료는 매우 구체적인 실천 구조를 제공한다. 하지만 본 과정은 그것을 <strong>장로교 신앙고백 및 성경의 틀 안에서 비교·분석하여 활용하는 교육과정</strong>이다.<br/>이성현 목사님의 설교 corpus 역시 같은 원칙으로 다룬다.<br/>따라서 학생에게 다음 문장을 반복적으로 교육한다.</P>
              <Quote ui={ui}>“목회자의 좋은 통찰은 배울 수 있지만, 최종적으로 검증할 기준은 말씀이다.”</Quote>

              <Title ui={ui}>18. 주간 묵상 카드</Title>
              <div className="space-y-4 mb-10">
                <Textarea id="wk1_day1" label="월: 오늘 내가 가장 통제하려는 것은 무엇인가?" height="min-h-[85px]" ui={ui} value={forms['wk1_day1']} onChange={handleForm} />
                <Textarea id="wk1_day2" label="화: 그 통제욕 아래 있는 두려움은 무엇인가?" height="min-h-[85px]" ui={ui} value={forms['wk1_day2']} onChange={handleForm} />
                <Textarea id="wk1_day3" label="수: 그 두려움에 대한 하나님의 말씀은 무엇인가?" height="min-h-[85px]" ui={ui} value={forms['wk1_day3']} onChange={handleForm} />
                <Textarea id="wk1_day4" label="목: 내가 인정해야 할 죄는 무엇인가?" height="min-h-[85px]" ui={ui} value={forms['wk1_day4']} onChange={handleForm} />
                <Textarea id="wk1_day5" label="금: 내가 실제로 순종할 수 있는 한 가지는 무엇인가?" height="min-h-[85px]" ui={ui} value={forms['wk1_day5']} onChange={handleForm} />
                <Textarea id="wk1_day6" label="토: 순종했을 때 무엇이 달라졌는가?" height="min-h-[85px]" ui={ui} value={forms['wk1_day6']} onChange={handleForm} />
                <Textarea id="wk1_day7" label="주일: 하나님의 은혜를 무엇으로 고백할 것인가?" height="min-h-[85px]" ui={ui} value={forms['wk1_day7']} onChange={handleForm} />
              </div>

              <Title ui={ui}>19. 1주차 핵심문장</Title>
              <Quote ui={ui}>
                제자는 자기 자신을 개선하는 사람이 아니라, 복음 앞에서 자신을 새롭게 해석하며 그리스도를 따르는 사람이다.<br/><br/>
                <span className="text-[12px] text-sky-600/60 dark:text-sky-300/60 font-medium">이 문장은 본 교재의 교육적 요약이며 특정 목회자의 직접 인용문이 아니다.</span>
              </Quote>
            </div>
          )}

          {/* ==================================================
              TAB 2: 2주차 말씀과 삶의 해석
              ================================================== */}
          {activeTab === 'wk2' && (
            <div className="animate-fade-in w-full min-w-0">
              <Title ui={ui}>2주차 확장 서브페이지</Title>
              <SubTitle ui={ui}>말씀으로 삶을 해석하기 — QT를 정보가 아니라 순종의 통로로 훈련하기</SubTitle>
              
              <div className={`p-4 rounded-2xl border mb-8 text-[13px] leading-[1.7] break-keep font-medium shadow-sm ${isDark(ui) ? 'bg-black/30 border-white/5 text-slate-300' : 'bg-white/50 border-white/80 text-slate-700'}`}>
                <strong className={ui.textMain}>연구 표기 규칙</strong><br/>
                - [F] 자료근거: 공식 공개자료·설교 corpus·성경·신앙고백서에서 직접 확인되는 내용<br/>
                - [S] 종합: 여러 자료에서 반복되는 주제를 비교하여 묶은 것<br/>
                - [T] 신학적 검토: 성경 및 웨스트민스터 신앙고백/대요리문답과의 관계 검토<br/>
                - [D] 교육설계: 본 교재 제작자가 실제 양육을 위해 새롭게 설계한 실습·질문·평가도구
              </div>

              <Title ui={ui}>1. 2주차의 목표</Title>
              <P ui={ui}>2주차는 “성경을 많이 아는 사람”보다 <strong>성경 앞에서 자신의 삶을 정직하게 보는 사람</strong>을 훈련한다.<br/>QTM 공식 소개는 QT를 말씀을 묵상하며 죄를 발견하고 하나님의 은혜를 의지하여 매일 거룩을 이루어가는 신앙훈련으로 설명한다. 또한 핵심가치로 내죄보기, 내면적용과 실천적용, 잘 듣고 잘 묻기 등을 공개하고 있다.<br/>따라서 본 주차의 중심 질문은 다음이다.</P>
              <Quote ui={ui}>“오늘 본문이 내 삶에서 무엇을 해석하게 하는가?”</Quote>

              <Title ui={ui}>2. QT의 신학적 안전장치</Title>
              <H4 ui={ui}>2.1 본문보다 내 경험이 앞서지 않는다</H4>
              <P ui={ui}>가장 흔한 오류: "오늘 말씀을 보니 하나님께서 내가 원하는 대학에 붙는다고 하셨다."<br/>이것은 본문의 의미를 개인의 소원으로 대체할 위험이 있다.<br/>QT는 본문에서 의미를 끌어내는 것이지, 본문에 내 뜻을 집어넣는 과정이 아니다.</P>
              <H4 ui={ui}>2.2 적용은 본문 해석 이후다</H4>
              <P ui={ui}>순서: 본문 → 문맥 → 의미 → 신학적 원리 → 나의 삶 → 적용</P>

              <Title ui={ui}>3. 본문 관찰 15문항</Title>
              <ol className={`list-decimal pl-5 space-y-1.5 mb-8 text-[13.5px] md:text-[14.5px] font-medium break-keep ${ui.textSub}`}>
                <li>누가 등장하는가?</li><li>무엇을 하는가?</li><li>어디서 일어나는가?</li><li>언제인가?</li><li>누구에게 말하는가?</li>
                <li>반복되는 단어는?</li><li>명령은?</li><li>약속은?</li><li>경고는?</li><li>대조는?</li>
                <li>원인과 결과는?</li><li>감정은?</li><li>하나님은 어떻게 나타나는가?</li><li>인간은 어떻게 나타나는가?</li><li>본문의 중심 문제는 무엇인가?</li>
              </ol>

              <Title ui={ui}>4. 해석 10문항</Title>
              <ol className={`list-decimal pl-5 space-y-1.5 mb-8 text-[13.5px] md:text-[14.5px] font-medium break-keep ${ui.textSub}`}>
                <li>앞 문맥은 무엇인가?</li><li>뒤 문맥은 무엇인가?</li><li>장 전체의 주제는?</li><li>책 전체에서 어떤 위치인가?</li><li>구약/신약의 구속사적 위치는?</li>
                <li>등장인물의 행동을 무조건 모범으로 봐도 되는가?</li><li>죄를 죄라고 부르는가?</li><li>하나님의 약속은 누구에게 어떤 조건으로 주어졌는가?</li><li>그리스도와 어떤 관계가 있는가?</li><li>오늘날 직접 적용할 원리와 당시 상황을 구분했는가?</li>
              </ol>

              <Title ui={ui}>5. 적용 8단계</Title>
              <div className="space-y-4 mb-10">
                <Textarea id="wk2_step1" label="① 사실: 내 삶에서 실제로 무슨 일이 일어났는가?" height="min-h-[85px]" ui={ui} value={forms['wk2_step1']} onChange={handleForm} />
                <Textarea id="wk2_step2" label="② 감정: 나는 무엇을 느끼는가?" height="min-h-[85px]" ui={ui} value={forms['wk2_step2']} onChange={handleForm} />
                <Textarea id="wk2_step3" label="③ 욕망: 나는 무엇을 얻거나 지키려고 하는가?" height="min-h-[85px]" ui={ui} value={forms['wk2_step3']} onChange={handleForm} />
                <Textarea id="wk2_step4" label="④ 두려움: 그것을 잃으면 무엇이 무너진다고 생각하는가?" height="min-h-[85px]" ui={ui} value={forms['wk2_step4']} onChange={handleForm} />
                <Textarea id="wk2_step5" label="⑤ 죄: 그 과정에서 하나님보다 더 의지한 것은 무엇인가?" height="min-h-[85px]" ui={ui} value={forms['wk2_step5']} onChange={handleForm} />
                <Textarea id="wk2_step6" label="⑥ 말씀: 본문은 무엇을 말하는가?" height="min-h-[85px]" ui={ui} value={forms['wk2_step6']} onChange={handleForm} />
                <Textarea id="wk2_step7" label="⑦ 복음: 그리스도 안에서 내가 이미 받은 은혜는 무엇인가?" height="min-h-[85px]" ui={ui} value={forms['wk2_step7']} onChange={handleForm} />
                <Textarea id="wk2_step8" label="⑧ 순종: 오늘 내가 실제로 할 한 가지는 무엇인가?" height="min-h-[85px]" ui={ui} value={forms['wk2_step8']} onChange={handleForm} />
              </div>

              <Title ui={ui}>6. 사건과 해석 분리 훈련</Title>
              <H4 ui={ui}>예</H4>
              <P ui={ui}>사건: 팀장이 내 보고서를 공개적으로 지적했다.<br/>해석: “팀장은 나를 무능한 사람으로 생각한다.”<br/>감정: 수치심, 분노<br/>욕망: 인정받고 싶다.<br/>두려움: 인정받지 못하면 내 가치가 없어진다고 느낀다.<br/>말씀: 인간의 평가와 하나님의 평가를 구별한다.<br/>적용: 감정적으로 반응하기 전에 사실을 확인하고, 필요한 수정사항을 정리한다.<br/><br/>이 훈련의 핵심은 <strong>감정을 부정하는 것이 아니라 감정의 근거가 되는 해석을 검증하는 것</strong>이다.</P>

              <Title ui={ui}>7. 주제QT와 본문QT</Title>
              <P ui={ui}>QTM 공개 양육 안내에서 주제QT와 매일QT가 과제 구조에 포함되어 있다. 본 과정에서는 둘을 다음과 같이 구분해 교육한다.<br/><br/>
              <strong>본문QT:</strong> 오늘 정해진 본문을 따라간다.<br/>
              <strong>주제QT:</strong> 특정 신앙 주제를 여러 본문을 통해 탐구한다.<br/>
              둘 다 유익하지만, 주제에 맞는 구절만 모아서 자신의 생각을 정당화하는 방식은 피해야 한다.</P>

              <Title ui={ui}>8. 강해 실습 (본문: 시편 13편)</Title>
              <P ui={ui}>1단계: 시편 기자의 상황을 관찰한다.<br/>2단계: 탄식의 표현을 표시한다.<br/>3단계: 하나님께 드리는 요청을 표시한다.<br/>4단계: 신뢰의 표현을 표시한다.<br/>5단계: “믿음이 있으면 힘들지 않아야 한다”는 생각이 성경 전체와 맞는지 검토한다.<br/>6단계: 탄식과 불신을 구분한다.<br/>7단계: 나의 현재 사건에 적용한다.</P>

              <Title ui={ui}>9. 설교 듣기 훈련</Title>
              <P ui={ui}>QTM의 공개 THINK 양육 안내는 주일설교를 듣고 내용을 기록하며 느낀 점과 적용할 점을 작성하도록 한다.<br/>본 교재의 설교 분석지는 다음 구조를 사용한다.</P>
              <div className="space-y-4 mb-10">
                <Input id="wk2_s1" label="본문" ui={ui} value={forms['wk2_s1']} onChange={handleForm} />
                <Input id="wk2_s2" label="설교 제목" ui={ui} value={forms['wk2_s2']} onChange={handleForm} />
                <Textarea id="wk2_s3" label="설교자의 핵심 주장" height="min-h-[85px]" ui={ui} value={forms['wk2_s3']} onChange={handleForm} />
                <Textarea id="wk2_s4" label="성경 본문에서 확인되는 근거" height="min-h-[85px]" ui={ui} value={forms['wk2_s4']} onChange={handleForm} />
                <Textarea id="wk2_s5" label="내가 새롭게 이해한 것" height="min-h-[85px]" ui={ui} value={forms['wk2_s5']} onChange={handleForm} />
                <Textarea id="wk2_s6" label="내 삶의 사건" height="min-h-[85px]" ui={ui} value={forms['wk2_s6']} onChange={handleForm} />
                <Textarea id="wk2_s7" label="나의 죄/욕망" height="min-h-[85px]" ui={ui} value={forms['wk2_s7']} onChange={handleForm} />
                <Textarea id="wk2_s8" label="복음" height="min-h-[85px]" ui={ui} value={forms['wk2_s8']} onChange={handleForm} />
                <Textarea id="wk2_s9" label="적용" height="min-h-[85px]" ui={ui} value={forms['wk2_s9']} onChange={handleForm} />
                <Textarea id="wk2_s10" label="일주일 후 결과" height="min-h-[85px]" ui={ui} value={forms['wk2_s10']} onChange={handleForm} />
              </div>

              <Title ui={ui}>10. 설교를 비판적으로 듣는 법</Title>
              <P ui={ui}>“비판”은 공격이 아니다. 다음 질문을 사용한다.</P>
              <ol className={`list-decimal pl-5 space-y-2 mb-8 text-[13.5px] md:text-[14.5px] font-medium break-keep ${ui.textSub}`}>
                <li>설교자가 실제로 말한 것은 무엇인가?</li>
                <li>성경 본문이 실제로 말하는 것은 무엇인가?</li>
                <li>설교자의 적용은 본문에서 자연스럽게 나오는가?</li>
                <li>개인적 경험이 성경의 권위를 대신하고 있지는 않은가?</li>
                <li>복음이 있는가?</li>
                <li>회개가 있는가?</li>
                <li>하나님의 은혜가 있는가?</li>
                <li>실제 순종이 제시되는가?</li>
              </ol>

              <Title ui={ui}>11. 이성현 목사 설교 corpus 분석 실습</Title>
              <P ui={ui}>사용자가 제공한 1년 corpus를 활용해 학생이 직접 표를 작성한다. (본문, 핵심명제, 하나님, 그리스도, 죄/회개, 고난, 감사, 적용 등)</P>
              <H4 ui={ui}>연구 질문</H4>
              <ul className={`list-disc pl-5 space-y-2 mb-8 text-[13.5px] md:text-[14.5px] font-medium break-keep ${ui.textSub}`}>
                <li>반복되는 주제는 무엇인가?</li>
                <li>반복되는 성경 본문은 무엇인가?</li>
                <li>적용 방식은 어떤 특징을 보이는가?</li>
                <li>고난을 어떻게 설명하는가?</li>
                <li>하나님을 어떤 분으로 묘사하는가?</li>
                <li>공동체와 성도의 책임은 어떻게 연결되는가?</li>
              </ul>
              <P ui={ui}><strong>단, 반복성만으로 교리적 우선순위를 확정하지 않는다.</strong></P>

              <Title ui={ui}>12. QT 실습지</Title>
              <div className="space-y-4 mb-4">
                <Input id="wk2_qt1" label="오늘의 본문" ui={ui} value={forms['wk2_qt1']} onChange={handleForm} />
                <Textarea id="wk2_qt2" label="관찰" height="min-h-[85px]" ui={ui} value={forms['wk2_qt2']} onChange={handleForm} />
                <Textarea id="wk2_qt3" label="해석" height="min-h-[85px]" ui={ui} value={forms['wk2_qt3']} onChange={handleForm} />
                <Textarea id="wk2_qt4" label="하나님" height="min-h-[85px]" ui={ui} value={forms['wk2_qt4']} onChange={handleForm} />
                <Textarea id="wk2_qt5" label="예수 그리스도" height="min-h-[85px]" ui={ui} value={forms['wk2_qt5']} onChange={handleForm} />
                <Textarea id="wk2_qt6" label="성령의 역사" height="min-h-[85px]" ui={ui} value={forms['wk2_qt6']} onChange={handleForm} />
                <Textarea id="wk2_qt7" label="나" height="min-h-[85px]" ui={ui} value={forms['wk2_qt7']} onChange={handleForm} />
                <Textarea id="wk2_qt8" label="죄" height="min-h-[85px]" ui={ui} value={forms['wk2_qt8']} onChange={handleForm} />
                <Textarea id="wk2_qt9" label="감사" height="min-h-[85px]" ui={ui} value={forms['wk2_qt9']} onChange={handleForm} />
                <Textarea id="wk2_qt10" label="기도" height="min-h-[85px]" ui={ui} value={forms['wk2_qt10']} onChange={handleForm} />
                <Textarea id="wk2_qt11" label="적용" height="min-h-[85px]" ui={ui} value={forms['wk2_qt11']} onChange={handleForm} />
              </div>
              <button 
                onPointerDown={(e) => { e.preventDefault(); syncToPipeline('qt', {t1: forms.wk2_qt2, t2: forms.wk2_qt3, t3: forms.wk2_qt7, t4: forms.wk2_qt8, t5: forms.wk2_qt11}, "위 실습 내용이 '오늘의 매일QT' 묵상란으로 연동되었습니다!"); }}
                className={`w-full py-4 rounded-xl text-[13.5px] font-black flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-sm mb-10 ${ui.btnPrimary}`}
              >
                <IconSend /> 위 QT 실습 기록을 오늘의 매일QT 화면으로 전송[cite: 9]
              </button>

              <Title ui={ui}>13. QT 실패 유형 진단표</Title>
              <P ui={ui}>유형 A — 지식형: 본문 설명은 길지만 자기 삶이 없다.<br/>유형 B — 감정형: “은혜받았다”가 많지만 본문 설명이 없다.<br/>유형 C — 자기계발형: “열심히 해야겠다”로 끝난다.<br/>유형 D — 정죄형: 타인의 죄가 많이 보인다.<br/>유형 E — 신비주의형: 본문에 없는 개인적 계시를 과도하게 끌어낸다.<br/>유형 F — 복음형: 본문 → 죄 → 은혜 → 그리스도 → 순종으로 연결된다.</P>

              <Title ui={ui}>14. 실습 과제</Title>
              <P ui={ui}>7일간 QT를 작성한다. 매일 반드시 포함: 본문, 관찰 5개, 해석 3개, 내 삶의 사건 1개, 내면적용 1개, 실천적용 1개, 기도, 다음날 점검.</P>

              <Title ui={ui}>15. 시험</Title>
              <H4 ui={ui}>서술형</H4>
              <div className="space-y-4 mb-10">
                <Textarea id="wk2_exam1" label="문제 1. “본문을 자기 삶에 적용하는 것”과 “본문을 자기 소원에 이용하는 것”의 차이를 설명하라." height="min-h-[110px]" ui={ui} value={forms['wk2_exam1']} onChange={handleForm} />
                <Textarea id="wk2_exam2" label="문제 2. 사건과 해석을 구분해야 하는 이유를 설명하라." height="min-h-[110px]" ui={ui} value={forms['wk2_exam2']} onChange={handleForm} />
                <Textarea id="wk2_exam3" label="문제 3. 설교자의 적용을 성경과 동일한 권위로 받아들이면 어떤 문제가 생기는가?" height="min-h-[110px]" ui={ui} value={forms['wk2_exam3']} onChange={handleForm} />
                <Textarea id="wk2_exam4" label="문제 4. QT에서 죄를 발견하는 것과 타인의 죄를 찾는 것의 차이를 설명하라." height="min-h-[110px]" ui={ui} value={forms['wk2_exam4']} onChange={handleForm} />
              </div>

              <Title ui={ui}>16. 교수자 채점표</Title>
              <P ui={ui}>본문 관찰 (정확/일부정확/주관적)<br/>해석 (문맥적/부분적/자의적)<br/>적용 (구체적/추상적/없음)<br/>복음 연결 (명확/약함/없음)<br/>실천 (검증 가능/모호/없음)</P>

              <Title ui={ui}>17. 2주차 핵심문장</Title>
              <Quote ui={ui}>QT는 내가 말씀을 평가하는 시간이 아니라 말씀이 나를 드러내도록 자신을 말씀 앞에 세우는 훈련이다.</Quote>

              <Title ui={ui}>18. 7일 실습</Title>
              <div className="space-y-4 mb-10">
                <Textarea id="wk2_d1" label="Day 1: 본문에서 하나님에 대한 진술만 찾기" height="min-h-[85px]" ui={ui} value={forms['wk2_d1']} onChange={handleForm} />
                <Textarea id="wk2_d2" label="Day 2: 본문에서 인간의 죄를 찾기" height="min-h-[85px]" ui={ui} value={forms['wk2_d2']} onChange={handleForm} />
                <Textarea id="wk2_d3" label="Day 3: 내 삶의 사건 하나 기록" height="min-h-[85px]" ui={ui} value={forms['wk2_d3']} onChange={handleForm} />
                <Textarea id="wk2_d4" label="Day 4: 사건과 나의 해석 분리" height="min-h-[85px]" ui={ui} value={forms['wk2_d4']} onChange={handleForm} />
                <Textarea id="wk2_d5" label="Day 5: 복음과 연결" height="min-h-[85px]" ui={ui} value={forms['wk2_d5']} onChange={handleForm} />
                <Textarea id="wk2_d6" label="Day 6: 실제 순종" height="min-h-[85px]" ui={ui} value={forms['wk2_d6']} onChange={handleForm} />
                <Textarea id="wk2_d7" label="Day 7: 결과 평가 및 재적용" height="min-h-[85px]" ui={ui} value={forms['wk2_d7']} onChange={handleForm} />
              </div>

              <Title ui={ui}>19. 양육자 질문은행</Title>
              <P ui={ui}>사실: 정확히 무슨 일이 있었나요? 언제부터 시작됐나요?<br/>감정: 그때 무엇을 느꼈나요? 가장 강했던 감정은 무엇인가요?<br/>욕망: 무엇을 얻고 싶었나요? 무엇을 잃고 싶지 않았나요?<br/>말씀: 본문에서 가장 마음에 걸리는 부분은 무엇인가요? 그 말씀이 왜 걸렸을까요?<br/>회개: 상대방의 잘못과 별개로 내가 볼 수 있는 것은 무엇인가요?<br/>적용: 오늘 바꿀 수 있는 행동은 무엇인가요?</P>

              <Title ui={ui}>20. 2주차 양육자 금지사항</Title>
              <ul className={`list-disc pl-5 space-y-2 mb-8 text-[13.5px] md:text-[14.5px] font-medium break-keep ${ui.textSub}`}>
                <li>성경구절을 맥락 없이 던지지 않는다.</li>
                <li>훈련생의 삶을 대신 해석하지 않는다.</li>
                <li>“하나님이 그러라고 하셨다”고 단정하지 않는다.</li>
                <li>자신의 경험을 정답으로 만들지 않는다.</li>
                <li>정신건강·법률·의료·가정폭력 등 전문영역을 영적 문제 하나로 환원하지 않는다.</li>
              </ul>

              <Title ui={ui}>21. 통과 기준</Title>
              <div className="space-y-1.5 mb-10">
                <Checkbox id="wk2_pass1" label="QT를 7회 기록했다." ui={ui} checked={checks['wk2_pass1']} onToggle={toggleCheck} />
                <Checkbox id="wk2_pass2" label="사건/해석을 구분했다." ui={ui} checked={checks['wk2_pass2']} onToggle={toggleCheck} />
                <Checkbox id="wk2_pass3" label="본문 근거를 제시했다." ui={ui} checked={checks['wk2_pass3']} onToggle={toggleCheck} />
                <Checkbox id="wk2_pass4" label="내면적용을 작성했다." ui={ui} checked={checks['wk2_pass4']} onToggle={toggleCheck} />
                <Checkbox id="wk2_pass5" label="실천적용을 작성했다." ui={ui} checked={checks['wk2_pass5']} onToggle={toggleCheck} />
                <Checkbox id="wk2_pass6" label="일주일 후 결과를 재평가했다." ui={ui} checked={checks['wk2_pass6']} onToggle={toggleCheck} />
              </div>
            </div>
          )}

          {/* ==================================================
              TAB 3: 3주차 고난·회개·감사
              ================================================== */}
          {activeTab === 'wk3' && (
            <div className="animate-fade-in w-full min-w-0">
              <Title ui={ui}>3주차 확장 서브페이지</Title>
              <SubTitle ui={ui}>고난·회개·감사 — 고난을 해석하고, 죄를 분별하고, 은혜를 감사로 고백하기</SubTitle>
              
              <div className={`p-4 rounded-2xl border mb-8 text-[13px] leading-[1.7] break-keep font-medium shadow-sm ${isDark(ui) ? 'bg-black/30 border-white/5 text-slate-300' : 'bg-white/50 border-white/80 text-slate-700'}`}>
                <strong className={ui.textMain}>연구 표기 규칙</strong><br/>
                - [F] 자료근거: 공식 공개자료·설교 corpus·성경·신앙고백서에서 직접 확인되는 내용<br/>
                - [S] 종합: 여러 자료에서 반복되는 주제를 비교하여 묶은 것<br/>
                - [T] 신학적 검토: 성경 및 웨스트민스터 신앙고백/대요리문답과의 관계 검토<br/>
                - [D] 교육설계: 본 교재 제작자가 실제 양육을 위해 새롭게 설계한 실습·질문·평가도구
              </div>

              <Title ui={ui}>1. 3주차의 핵심 명제</Title>
              <P ui={ui}>고난을 잘 통과한다는 말은 “아프지 않은 척한다”는 뜻이 아니다. 성경에는 탄식, 질문, 눈물, 기도, 기다림, 회개, 감사가 함께 나타난다. 따라서 제자훈련에서는 다음을 구분해야 한다.</P>
              <Quote ui={ui}>고난 자체 ≠ 죄의 증거<br/>감사 ≠ 감정적으로 기뻐하는 것<br/>회개 ≠ 모든 사건의 원인을 자기 죄로 돌리는 것</Quote>

              <Title ui={ui}>2. 고난의 성경적 틀</Title>
              <H4 ui={ui}>2.1 하나의 원인으로 환원하지 않는다</H4>
              <P ui={ui}>고난의 원인을 다음 하나로만 설명하는 것은 위험하다.<br/>- “네 죄 때문이다.”<br/>- “믿음이 없어서다.”<br/>- “하나님이 벌하시는 것이다.”<br/>- “기도가 부족해서다.”<br/><br/>성경 전체는 죄의 결과로서의 고난, 타락한 세상에서 경험하는 고난, 하나님의 섭리 안에서 허락되는 시험과 연단, 의인의 고난, 그리스도를 따름으로 인한 고난 등을 다양한 방식으로 보여준다. 그러므로 양육자는 <strong>원인을 모르는 사건을 함부로 판정하지 않는다.</strong></P>

              <Title ui={ui}>3. 웨스트민스터 신앙고백의 섭리</Title>
              <P ui={ui}>웨스트민스터 신앙고백 제5장은 하나님의 섭리를 다룬다.<br/>교육적 핵심은 다음이다.<br/>1. 하나님은 피조세계를 방치하지 않는다.<br/>2. 하나님은 섭리 가운데 일하신다.<br/>3. 인간의 책임과 하나님의 섭리를 함께 고려해야 한다.<br/>4. 섭리를 인정한다고 해서 모든 사건의 구체적 의미를 인간이 즉시 알 수 있는 것은 아니다.</P>
              <P ui={ui}>따라서: “하나님이 주권자이시다.” 와 “나는 왜 이런 일이 일어났는지 정확히 안다.” 는 서로 다른 주장이다. 첫 번째는 신학적 고백이 될 수 있지만, 두 번째는 성급한 추론일 수 있다.</P>

              <Title ui={ui}>4. 고난 해석 12단계</Title>
              <ol className={`list-decimal pl-5 space-y-2 mb-8 text-[13.5px] md:text-[14.5px] font-medium break-keep ${ui.textSub}`}>
                <li><strong>사건을 사실로 기록한다:</strong> 무슨 일이 있었는가?</li>
                <li><strong>감정을 기록한다:</strong> 무엇을 느끼는가?</li>
                <li><strong>해석을 기록한다:</strong> 나는 이 사건을 어떻게 해석하고 있는가?</li>
                <li><strong>욕망을 찾는다:</strong> 무엇을 얻으려고 했는가?</li>
                <li><strong>두려움을 찾는다:</strong> 무엇을 잃을까 두려운가?</li>
                <li><strong>죄를 분별한다:</strong> 하나님보다 더 의지한 것은 무엇인가?</li>
                <li><strong>타인의 죄를 구분한다:</strong> 내 책임과 타인의 책임을 분리한다.</li>
                <li><strong>내가 모르는 것을 인정한다:</strong> 하나님의 섭리를 내가 다 알 수 없음을 인정한다.</li>
                <li><strong>본문을 찾는다:</strong> 내 상황에 맞는 구절을 고르는 것이 아니라 성경의 전체 맥락에서 말씀을 듣는다.</li>
                <li><strong>복음을 확인한다:</strong> 고난 속에서도 변하지 않는 하나님의 은혜는 무엇인가?</li>
                <li><strong>순종한다:</strong> 오늘 할 수 있는 작은 순종은 무엇인가?</li>
                <li><strong>기다린다:</strong> 즉시 결과가 나오지 않아도 하나님을 신뢰한다.</li>
              </ol>

              <Title ui={ui}>5. 감사훈련</Title>
              <P ui={ui}>QTM 공개 THINK 양육 자료에는 “생각을 바르게 하면 어떤 환경에서도 감사가 나온다”는 식의 교육적 문구가 소개되어 있다. 이를 본 과정에서는 <strong>감사를 현실 부정이 아니라 하나님을 향한 신앙적 응답으로 교육</strong>한다.</P>
              <H4 ui={ui}>감사의 세 층위</H4>
              <P ui={ui}>① 사실에 대한 감사: “오늘 하나님께 받은 구체적인 은혜는 무엇인가?”<br/>② 성품에 대한 감사: “상황이 바뀌지 않아도 하나님이 어떤 분이시기에 감사할 수 있는가?”<br/>③ 구속사적 감사: “그리스도 안에서 이미 받은 구원이 무엇인가?”</P>

              <Title ui={ui}>6. 감사와 긍정주의 구분</Title>
              <P ui={ui}><strong>긍정주의:</strong> “좋은 일이 생길 거야.”<br/><strong>성경적 감사:</strong> “상황이 여전히 어렵지만 하나님이 하나님이시며, 그리스도 안에서 받은 은혜가 변하지 않음을 고백한다.”<br/>둘은 다르다.</P>

              <Title ui={ui}>7. 웨스트민스터 대요리문답과 감사</Title>
              <P ui={ui}>대요리문답 Q178은 기도를 하나님께 드리는 간구로 설명하면서 죄 고백과 <strong>그분의 자비에 대한 감사의 인정</strong>을 포함한다.<br/>Q185는 기도의 태도에 회개와 감사, 믿음, 사랑, 인내, 하나님의 뜻에 대한 겸손한 복종을 포함한다.<br/>따라서 감사는 단독 훈련이 아니라 <strong>기도·회개·신뢰·순종과 연결된 영적 실천</strong>으로 볼 수 있다.</P>

              <Title ui={ui}>8. 고난과 감사의 실제</Title>
              <H4 ui={ui}>사례</H4>
              <P ui={ui}>“회사에서 승진하지 못했다.”<br/>1차 반응: “하나님이 나를 버리셨다.”<br/>사실: 승진하지 못했다.<br/>감정: 실망, 분노, 수치<br/>욕망: 인정받고 싶었다.<br/>두려움: 내 능력이 없다는 평가를 받을까 두렵다.<br/>죄: 승진 자체가 아니라 사람의 평가가 내 정체성을 결정하도록 허용한 부분을 점검한다.<br/>그러나: “승진하지 못한 것은 내 죄 때문”이라고 단정할 근거는 없다.<br/>말씀: 하나님의 섭리, 인간의 가치, 일의 의미를 성경적으로 검토한다.<br/>감사: “승진하지 못했지만 하나님이 나를 붙들고 계심에 감사한다.”<br/>적용: 상사와 필요한 피드백을 확인하고, 부족한 업무를 개선하며, 결과를 하나님께 맡긴다.</P>

              <Title ui={ui}>9. 회개훈련</Title>
              <H4 ui={ui}>회개의 5요소</H4>
              <ol className={`list-decimal pl-5 space-y-1.5 mb-6 text-[13.5px] md:text-[14.5px] font-medium break-keep ${ui.textSub}`}>
                <li>죄를 인정한다.</li><li>죄를 하나님 앞에서 본다.</li><li>죄를 미워한다.</li><li>하나님께 돌아간다.</li><li>새 순종을 시도한다.</li>
              </ol>
              <P ui={ui}>웨스트민스터 대요리문답 Q76은 회개를 단순한 후회가 아니라 죄에서 하나님께로 돌이켜 새 순종을 추구하는 방향으로 설명한다.</P>

              <Title ui={ui}>10. 회개와 자기비난</Title>
              <P ui={ui}>자기비난: “나는 왜 이것밖에 안 되지?”<br/>회개: “내가 하나님보다 무엇을 더 사랑했는가?”<br/>자기비난은 자기 자신에게 시선을 고정할 수 있다. 회개는 하나님께 돌아간다.</P>

              <Title ui={ui}>11. 7일 감사훈련</Title>
              <div className="space-y-4 mb-4">
                <Textarea id="wk3_t1" label="Day 1 — 받은 은혜 (오늘 받은 구체적 은혜 5개)" height="min-h-[85px]" ui={ui} value={forms['wk3_t1']} onChange={handleForm} />
                <Textarea id="wk3_t2" label="Day 2 — 사람 (하나님이 사용하신 사람 3명)" height="min-h-[85px]" ui={ui} value={forms['wk3_t2']} onChange={handleForm} />
                <Textarea id="wk3_t3" label="Day 3 — 말씀 (오늘 붙들 말씀 1개)" height="min-h-[85px]" ui={ui} value={forms['wk3_t3']} onChange={handleForm} />
                <Textarea id="wk3_t4" label="Day 4 — 어려움 속 감사 (해결되지 않은 문제에서 감사 찾기)" height="min-h-[100px]" ui={ui} value={forms['wk3_t4']} onChange={handleForm} />
                <Textarea id="wk3_t5" label="Day 5 — 구원 (그리스도 안에서 이미 받은 은혜)" height="min-h-[100px]" ui={ui} value={forms['wk3_t5']} onChange={handleForm} />
                <Textarea id="wk3_t6" label="Day 6 — 회개와 감사 (발견한 죄와 받은 은혜)" height="min-h-[100px]" ui={ui} value={forms['wk3_t6']} onChange={handleForm} />
                <Textarea id="wk3_t7" label="Day 7 — 공동체 (한 사람에게 감사 표현하기)" height="min-h-[100px]" ui={ui} value={forms['wk3_t7']} onChange={handleForm} />
              </div>
              <button 
                onPointerDown={(e) => { e.preventDefault(); syncToPipeline('diary', {t1: forms.wk3_t1, t2: forms.wk3_t2, t3: forms.wk3_t4, t4: forms.wk3_t6}, "위 기록이 '감사/간증 일기장'으로 자동 전송되었습니다!"); }}
                className={`w-full py-4 rounded-xl text-[13.5px] font-black flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-sm mb-10 ${ui.btnPrimary}`}
              >
                <IconSend /> 위 감사 기록을 '감사/간증 일기장'으로 전송[cite: 9]
              </button>

              <Title ui={ui}>12. 30일 고난훈련</Title>
              <P ui={ui}>1–7일: 사실과 감정 분리<br/>8–14일: 욕망과 두려움 식별<br/>15–21일: 말씀과 복음으로 해석<br/>22–27일: 회개와 순종<br/>28–30일: 간증 작성 및 공동체 나눔</P>

              <Title ui={ui}>13. 고난 해석 워크시트</Title>
              <div className="space-y-4 mb-4">
                <Input id="wk3_ws1" label="사건:" ui={ui} value={forms['wk3_ws1']} onChange={handleForm} />
                <Input id="wk3_ws2" label="감정:" ui={ui} value={forms['wk3_ws2']} onChange={handleForm} />
                <Textarea id="wk3_ws3" label="내 해석:" height="min-h-[85px]" ui={ui} value={forms['wk3_ws3']} onChange={handleForm} />
                <Textarea id="wk3_ws4" label="내가 원하는 것:" height="min-h-[85px]" ui={ui} value={forms['wk3_ws4']} onChange={handleForm} />
                <Textarea id="wk3_ws5" label="내가 두려워하는 것:" height="min-h-[85px]" ui={ui} value={forms['wk3_ws5']} onChange={handleForm} />
                <Textarea id="wk3_ws6" label="내가 책임질 부분:" height="min-h-[85px]" ui={ui} value={forms['wk3_ws6']} onChange={handleForm} />
                <Textarea id="wk3_ws7" label="내가 책임질 수 없는 부분:" height="min-h-[85px]" ui={ui} value={forms['wk3_ws7']} onChange={handleForm} />
                <Textarea id="wk3_ws8" label="타인의 책임:" height="min-h-[85px]" ui={ui} value={forms['wk3_ws8']} onChange={handleForm} />
                <Textarea id="wk3_ws9" label="내가 모르는 부분:" height="min-h-[85px]" ui={ui} value={forms['wk3_ws9']} onChange={handleForm} />
                <Input id="wk3_ws10" label="본문:" ui={ui} value={forms['wk3_ws10']} onChange={handleForm} />
                <Textarea id="wk3_ws11" label="본문의 문맥:" height="min-h-[85px]" ui={ui} value={forms['wk3_ws11']} onChange={handleForm} />
                <Textarea id="wk3_ws12" label="하나님:" height="min-h-[85px]" ui={ui} value={forms['wk3_ws12']} onChange={handleForm} />
                <Textarea id="wk3_ws13" label="그리스도:" height="min-h-[85px]" ui={ui} value={forms['wk3_ws13']} onChange={handleForm} />
                <Textarea id="wk3_ws14" label="기도:" height="min-h-[85px]" ui={ui} value={forms['wk3_ws14']} onChange={handleForm} />
                <Textarea id="wk3_ws15" label="회개:" height="min-h-[85px]" ui={ui} value={forms['wk3_ws15']} onChange={handleForm} />
                <Textarea id="wk3_ws16" label="감사:" height="min-h-[85px]" ui={ui} value={forms['wk3_ws16']} onChange={handleForm} />
                <Textarea id="wk3_ws17" label="오늘의 순종:" height="min-h-[85px]" ui={ui} value={forms['wk3_ws17']} onChange={handleForm} />
                <Textarea id="wk3_ws18" label="일주일 후 결과:" height="min-h-[85px]" ui={ui} value={forms['wk3_ws18']} onChange={handleForm} />
              </div>
              <div className="flex gap-2 w-full min-w-0 mb-10">
                 <button 
                   onPointerDown={(e) => { e.preventDefault(); syncToPipeline('prayer', {p: forms.wk3_ws14}, "기도 보관함으로 등록되었습니다!"); }}
                   className={`flex-1 py-3.5 rounded-xl text-[12px] font-black flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-sm ${ui.btnPrimary}`}
                 >
                   <IconSend /> 기도함으로[cite: 9]
                 </button>
                 <button 
                   onPointerDown={(e) => { e.preventDefault(); syncToPipeline('qt', {m: forms.wk3_ws15, a: forms.wk3_ws17}, "오늘의 매일QT 묵상과 적용란으로 전송되었습니다."); }}
                   className={`flex-1 py-3.5 rounded-xl text-[12px] font-black flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-sm ${ui.btnPrimary}`}
                 >
                   <IconSend /> 매일QT로[cite: 9]
                 </button>
              </div>

              <Title ui={ui}>14. 양육자가 반드시 피해야 할 말</Title>
              <ul className="list-disc pl-5 space-y-2 mb-6 text-[13.5px] md:text-[14.5px] font-bold text-rose-500 break-keep">
                <li>“그건 네 죄 때문이야.”</li>
                <li>“감사하면 해결될 거야.”</li>
                <li>“믿음이 있으면 이런 일이 없어.”</li>
                <li>“하나님이 반드시 이렇게 하실 거야.”</li>
                <li>“내가 보기에 하나님 뜻은 이거야.”</li>
              </ul>
              <H4 ui={ui}>대신:</H4>
              <ul className={`list-disc pl-5 space-y-2 mb-8 text-[13.5px] md:text-[14.5px] font-bold break-keep ${ui.primary}`}>
                <li>“성경은 이 상황을 어떻게 보게 합니까?”</li>
                <li>“우리가 아는 것과 모르는 것을 나눠봅시다.”</li>
                <li>“당신이 책임질 수 있는 부분은 무엇입니까?”</li>
                <li>“지금 하나님께 맡겨야 할 부분은 무엇입니까?”</li>
                <li>“오늘 순종할 수 있는 것은 무엇입니까?”</li>
              </ul>

              <Title ui={ui}>15. 3주차 시험</Title>
              <H4 ui={ui}>객관식</H4>
              <P ui={ui}>고난의 원인을 다룰 때 가장 안전한 태도는? (A. 모든 고난은 개인 죄 때문 B. 모든 고난은 믿음 부족 C. 성경 전체의 다양한 틀 고려하고 신중하게 판단 D. 고난 원인 안 중요함)<br/>정답: C</P>
              <H4 ui={ui}>서술형</H4>
              <Textarea id="wk3_ex1" label="“감사와 긍정주의의 차이를 설명하라.”" height="min-h-[110px]" ui={ui} value={forms['wk3_ex1']} onChange={handleForm} />
              <H4 ui={ui}>사례형</H4>
              <Textarea id="wk3_ex2" label="가족 갈등을 겪는 훈련생에게 “그건 네가 부모를 공경하지 않아서다”라고 단정하지 않고 어떻게 질문할 것인지 5개를 작성하라." height="min-h-[140px]" ui={ui} value={forms['wk3_ex2']} onChange={handleForm} />

              <Title ui={ui}>16. 과제</Title>
              <P ui={ui}>1. 자신의 가장 큰 고난 하나를 사실 중심으로 기록<br/>2. 감정과 해석 분리<br/>3. 책임과 비책임 분리<br/>4. 성경본문 3개 연구<br/>5. 감사 7일<br/>6. 회개 1개<br/>7. 순종 1개<br/>8. 일주일 후 결과 기록<br/>9. 1,500자 간증 작성</P>

              <Title ui={ui}>17. 간증 채점표</Title>
              <P ui={ui}>사실성(20), 성경근거(20), 자기성찰(20), 복음(20), 적용(20)</P>

              <Title ui={ui}>18. 3주차 핵심문장</Title>
              <Quote ui={ui}>고난을 해석한다는 것은 모든 이유를 알아내는 것이 아니라, 내가 아는 것과 모르는 것을 하나님 앞에서 분별하고 말씀 안에서 오늘의 순종을 찾는 것이다.</Quote>

              <Title ui={ui}>19. 교수자 심화토론</Title>
              <P ui={ui}>질문 1: “하나님의 주권”을 믿는 것과 “모든 사건의 의미를 안다”고 주장하는 것은 어떻게 다른가?<br/>질문 2: 감사할 수 없는 상황에서도 감사가 가능한 근거는 무엇인가?<br/>질문 3: 회개가 필요한 상황과 단순히 애도하고 기다려야 하는 상황을 어떻게 분별할 것인가?<br/>질문 4: 고난받는 사람에게 교리적 설명을 너무 빨리 제공하면 어떤 위험이 있는가?</P>

              <Title ui={ui}>20. 목회적 안전장치</Title>
              <P ui={ui}>이 과정은 영적 양육과 상담의 경계를 존중한다. 다음 경우에는 양육자가 혼자 해결하려 하지 않는다.<br/>- 자해·자살 위험, 가정폭력, 성폭력, 중독, 심각한 정신건강 위기, 법적 분쟁, 학대, 아동 보호 문제<br/>이 경우 목회자·전문기관·관계기관의 도움을 연결한다.</P>

              <Title ui={ui}>21. 3주차 통과 기준</Title>
              <div className="space-y-1.5 mb-10">
                <Checkbox id="wk3_pass1" label="고난의 원인을 함부로 단정하지 않는다." ui={ui} checked={checks['wk3_pass1']} onToggle={toggleCheck} />
                <Checkbox id="wk3_pass2" label="감사와 긍정주의를 구분한다." ui={ui} checked={checks['wk3_pass2']} onToggle={toggleCheck} />
                <Checkbox id="wk3_pass3" label="회개와 자기비난을 구분한다." ui={ui} checked={checks['wk3_pass3']} onToggle={toggleCheck} />
                <Checkbox id="wk3_pass4" label="섭리와 인간의 무지를 함께 인정한다." ui={ui} checked={checks['wk3_pass4']} onToggle={toggleCheck} />
                <Checkbox id="wk3_pass5" label="실제 순종을 선택한다." ui={ui} checked={checks['wk3_pass5']} onToggle={toggleCheck} />
                <Checkbox id="wk3_pass6" label="7일 감사훈련을 완료한다." ui={ui} checked={checks['wk3_pass6']} onToggle={toggleCheck} />
                <Checkbox id="wk3_pass7" label="고난 간증을 작성한다." ui={ui} checked={checks['wk3_pass7']} onToggle={toggleCheck} />
              </div>
            </div>
          )}

          {/* ==================================================
              TAB 4: 4주차 공동체·양육교사·재생산
              ================================================== */}
          {activeTab === 'wk4' && (
            <div className="animate-fade-in w-full min-w-0">
              <Title ui={ui}>4주차 확장 서브페이지</Title>
              <SubTitle ui={ui}>공동체·양육교사·재생산 — 내가 받은 말씀으로 한 사람을 세우다</SubTitle>
              
              <div className={`p-4 rounded-2xl border mb-8 text-[13px] leading-[1.7] break-keep font-medium shadow-sm ${isDark(ui) ? 'bg-black/30 border-white/5 text-slate-300' : 'bg-white/50 border-white/80 text-slate-700'}`}>
                <strong className={ui.textMain}>연구 표기 규칙</strong><br/>
                - [F] 자료근거: 공식 공개자료·설교 corpus·성경·신앙고백서에서 직접 확인되는 내용<br/>
                - [S] 종합: 여러 자료에서 반복되는 주제를 비교하여 묶은 것<br/>
                - [T] 신학적 검토: 성경 및 웨스트민스터 신앙고백/대요리문답과의 관계 검토<br/>
                - [D] 교육설계: 본 교재 제작자가 실제 양육을 위해 새롭게 설계한 실습·질문·평가도구
              </div>

              <Title ui={ui}>1. 4주차의 목적</Title>
              <P ui={ui}>제자훈련의 마지막은 “수료”가 아니다. <strong>재생산 가능한 삶</strong>이다.<br/>QTM 공개자료에서 THINK 양육, 예비목자양육 1·2, 중보기도학교 등 단계적인 양육교재가 별도로 운영되고 있음을 확인할 수 있다. 이것을 본 교재에서는 다음 교육적 흐름으로 정리한다.</P>
              <Quote ui={ui}>내가 말씀을 배운다 → 말씀으로 나를 본다 → 공동체에서 나눈다 → 한 사람을 섬긴다 → 다시 세운다</Quote>
              <P ui={ui}><span className="text-[12px] text-slate-400">이 흐름은 본 교재의 통합 모델이며 QTM의 공식 단계 명칭을 임의로 재정의한 것이 아니다.</span></P>

              <Title ui={ui}>2. 제자의 공동체성</Title>
              <P ui={ui}>신앙은 개인적이지만 개인주의적이지 않다. 신약의 제자도는 공동체, 서로의 돌봄, 가르침, 권면, 섬김과 연결되어 있다. 따라서 제자훈련은 개인 QT 기록으로 끝나지 않는다.</P>

              <Title ui={ui}>3. 양육교사의 정체성</Title>
              <P ui={ui}>양육교사는 “정답을 많이 아는 사람”이 아니다.<br/>양육교사의 기본 역할:<br/>1. 잘 듣는다.<br/>2. 잘 묻는다.<br/>3. 본문을 확인한다.<br/>4. 훈련생의 삶을 정죄하지 않는다.<br/>5. 말씀 앞에서 스스로 보도록 돕는다.<br/>6. 적용을 구체화한다.<br/>7. 지속적으로 점검한다.<br/>8. 필요한 경우 목회자에게 연결한다.<br/><br/>QTM 공식 소개에서 공개한 핵심가치 가운데 “잘 듣고 잘 묻기”, “공감과 체휼”, “내면적용과 실천적용”은 이 역할과 밀접하게 연결된다.</P>

              <Title ui={ui}>4. 질문의 기술</Title>
              <ul className={`list-disc pl-5 space-y-2 mb-8 text-[13.5px] md:text-[14.5px] font-bold break-keep ${ui.textMain}`}>
                <li><strong>사실 질문:</strong> “정확히 무슨 일이 있었습니까?”</li>
                <li><strong>감정 질문:</strong> “그때 어떤 감정이 가장 컸습니까?”</li>
                <li><strong>욕망 질문:</strong> “무엇이 이루어지기를 가장 원했습니까?”</li>
                <li><strong>두려움 질문:</strong> “그것이 이루어지지 않으면 무엇이 두렵습니까?”</li>
                <li><strong>말씀/복음 질문:</strong> “본문은 무엇을 말합니까? 받은 은혜는 무엇입니까?”</li>
                <li><strong>적용 질문:</strong> “오늘 할 수 있는 순종은 무엇입니까?”</li>
              </ul>

              <Title ui={ui}>5. 잘못된 양육 / 6. 좋은 양육</Title>
              <P ui={ui}><strong>잘못된 양육:</strong><br/>- 양육자가 자신의 경험을 정답으로 말한다. (“나도 그랬는데 이렇게 하면 돼.”)<br/>- 훈련생 대신 죄를 찾아준다. (“당신 문제는 교만이네요.”)<br/>- 하나님 뜻을 단정한다. (“하나님이 이 일을 통해 반드시 이것을 하시는 겁니다.”)<br/>- 감정을 억압한다. (“믿음이 있으면 울면 안 돼요.”)<br/>- 성경구절을 처방전처럼 사용한다. (“이 말씀 읽으면 해결됩니다.”)</P>
              <P ui={ui}><strong>좋은 양육:</strong> 훈련생이 스스로 말씀 앞에서 보고 고백하도록 돕는다.<br/>나쁜 질문: “왜 그렇게 행동했어요?”<br/>좋은 질문: “그 행동을 하게 된 마음속의 가장 큰 바람은 무엇이었을까요?”<br/>나쁜 질문: “그 사람을 용서했어요?”<br/>좋은 질문: “지금 하나님 앞에서 내가 책임질 수 있는 부분은 무엇일까요?”</P>

              <Title ui={ui}>7. 1:1 양육 실제 진행</Title>
              <P ui={ui}>첫 만남<br/>① 관계: 서로 소개<br/>② 기대: 왜 양육을 받는지 확인<br/>③ 현재: QT, 기도, 예배, 공동체 생활 확인<br/>④ 사건: 현재 가장 중요한 삶의 사건 하나<br/>⑤ 말씀: 현재 사건과 연결되는 본문<br/>⑥ 적용: 한 주간 실천<br/>⑦ 다음 만남: 점검 약속</P>

              <Title ui={ui}>8. 30일 한 사람 세우기</Title>
              <P ui={ui}>1–7일: 관계 형성 (경청, 기도, 삶의 상황 파악)<br/>8–14일: 말씀훈련 (함께 QT, 본문 관찰, 적용)<br/>15–21일: 고난·회개 (사건과 해석 분리, 자신의 책임 보기, 복음 연결)<br/>22–30일: 감사·간증 (감사 기록, 변화 확인, 간증 작성)</P>

              <Title ui={ui}>9. 재생산 평가</Title>
              <P ui={ui}>양육받은 사람이 다음을 할 수 있으면 다음 단계로 본다.</P>
              <div className="space-y-1.5 mb-8">
                <Checkbox id="wk4_re1" label="스스로 QT한다." ui={ui} checked={checks['wk4_re1']} onToggle={toggleCheck} />
                <Checkbox id="wk4_re2" label="본문과 자기 생각을 구분한다." ui={ui} checked={checks['wk4_re2']} onToggle={toggleCheck} />
                <Checkbox id="wk4_re3" label="죄를 말씀으로 본다." ui={ui} checked={checks['wk4_re3']} onToggle={toggleCheck} />
                <Checkbox id="wk4_re4" label="회개한다." ui={ui} checked={checks['wk4_re4']} onToggle={toggleCheck} />
                <Checkbox id="wk4_re5" label="감사한다." ui={ui} checked={checks['wk4_re5']} onToggle={toggleCheck} />
                <Checkbox id="wk4_re6" label="삶에 적용한다." ui={ui} checked={checks['wk4_re6']} onToggle={toggleCheck} />
                <Checkbox id="wk4_re7" label="다른 사람의 말을 경청한다." ui={ui} checked={checks['wk4_re7']} onToggle={toggleCheck} />
                <Checkbox id="wk4_re8" label="질문한다." ui={ui} checked={checks['wk4_re8']} onToggle={toggleCheck} />
                <Checkbox id="wk4_re9" label="자신의 간증을 말한다." ui={ui} checked={checks['wk4_re9']} onToggle={toggleCheck} />
                <Checkbox id="wk4_re10" label="한 사람을 섬길 준비가 된다." ui={ui} checked={checks['wk4_re10']} onToggle={toggleCheck} />
              </div>

              <Title ui={ui}>10. 이성현 목사 설교 corpus와 4주 종합</Title>
              <P ui={ui}>사용자가 제공한 1년 설교 자료를 최종적으로 다음 네 가지 관점에서 다시 읽는다.<br/>Week 1: 복음·하나님·그리스도·제자도<br/>Week 2: 말씀·기도·묵상·순종<br/>Week 3: 고난·회개·감사·섭리<br/>Week 4: 공동체·사명·섬김·전도·제자화<br/>각 설교에서 발견되는 내용은 직접 발화 / 문맥상 의미 / 연구자의 종합을 구분하여 기록한다.</P>

              <Title ui={ui}>11. 설교 연구 카드 (나의 분석)</Title>
              <div className="space-y-4 mb-4">
                <Input id="wk4_sc1" label="설교 제목:" ui={ui} value={forms['wk4_sc1']} onChange={handleForm} />
                <Input id="wk4_sc2" label="설교일:" ui={ui} value={forms['wk4_sc2']} onChange={handleForm} />
                <Input id="wk4_sc3" label="본문:" ui={ui} value={forms['wk4_sc3']} onChange={handleForm} />
                <Textarea id="wk4_sc4" label="직접 확인한 핵심문장:" height="min-h-[85px]" ui={ui} value={forms['wk4_sc4']} onChange={handleForm} />
                <Textarea id="wk4_sc5" label="반복되는 주제:" height="min-h-[85px]" ui={ui} value={forms['wk4_sc5']} onChange={handleForm} />
                <Textarea id="wk4_sc6" label="하나님에 대한 진술:" height="min-h-[85px]" ui={ui} value={forms['wk4_sc6']} onChange={handleForm} />
                <Textarea id="wk4_sc7" label="그리스도에 대한 진술:" height="min-h-[85px]" ui={ui} value={forms['wk4_sc7']} onChange={handleForm} />
                <Textarea id="wk4_sc8" label="성도의 죄:" height="min-h-[85px]" ui={ui} value={forms['wk4_sc8']} onChange={handleForm} />
                <Textarea id="wk4_sc9" label="회개:" height="min-h-[85px]" ui={ui} value={forms['wk4_sc9']} onChange={handleForm} />
                <Textarea id="wk4_sc10" label="고난:" height="min-h-[85px]" ui={ui} value={forms['wk4_sc10']} onChange={handleForm} />
                <Textarea id="wk4_sc11" label="감사:" height="min-h-[85px]" ui={ui} value={forms['wk4_sc11']} onChange={handleForm} />
                <Textarea id="wk4_sc12" label="공동체:" height="min-h-[85px]" ui={ui} value={forms['wk4_sc12']} onChange={handleForm} />
                <Textarea id="wk4_sc13" label="적용:" height="min-h-[85px]" ui={ui} value={forms['wk4_sc13']} onChange={handleForm} />
                <Textarea id="wk4_sc14" label="연구자 분석:" height="min-h-[85px]" ui={ui} value={forms['wk4_sc14']} onChange={handleForm} />
                <Textarea id="wk4_sc15" label="성경 검증:" height="min-h-[85px]" ui={ui} value={forms['wk4_sc15']} onChange={handleForm} />
                <Textarea id="wk4_sc16" label="웨스트민스터 검토:" height="min-h-[85px]" ui={ui} value={forms['wk4_sc16']} onChange={handleForm} />
              </div>
              <button 
                onPointerDown={(e) => { e.preventDefault(); syncToPipeline('cell', null, '작성하신 분석 카드가 목장 나눔 초안으로 전송되었습니다!'); }}
                className={`w-full py-4 rounded-xl text-[13.5px] font-black flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-sm mb-10 ${ui.btnPrimary}`}
              >
                <IconSend /> 이 연구 카드를 목장 나눔/보고서 초안으로 전송[cite: 9]
              </button>

              <Title ui={ui}>12. 최종 시험</Title>
              <H4 ui={ui}>A. 성경</H4>
              <div className="space-y-4 mb-8">
                <Textarea id="wk4_ex1" label="1. 제자도란 무엇인가?" height="min-h-[90px]" ui={ui} value={forms['wk4_ex1']} onChange={handleForm} />
                <Textarea id="wk4_ex2" label="2. 자기부인이란 무엇인가?" height="min-h-[90px]" ui={ui} value={forms['wk4_ex2']} onChange={handleForm} />
                <Textarea id="wk4_ex3" label="3. 회개란 무엇인가?" height="min-h-[90px]" ui={ui} value={forms['wk4_ex3']} onChange={handleForm} />
                <Textarea id="wk4_ex4" label="4. 감사는 무엇인가?" height="min-h-[90px]" ui={ui} value={forms['wk4_ex4']} onChange={handleForm} />
                <Textarea id="wk4_ex5" label="5. 고난을 어떻게 성경적으로 해석할 수 있는가?" height="min-h-[90px]" ui={ui} value={forms['wk4_ex5']} onChange={handleForm} />
              </div>
              <H4 ui={ui}>B. 신학</H4>
              <div className="space-y-4 mb-8">
                <Textarea id="wk4_ex6" label="1. 칭의와 성화를 구분하라." height="min-h-[90px]" ui={ui} value={forms['wk4_ex6']} onChange={handleForm} />
                <Textarea id="wk4_ex7" label="2. 하나님의 섭리와 인간의 책임을 설명하라." height="min-h-[90px]" ui={ui} value={forms['wk4_ex7']} onChange={handleForm} />
                <Textarea id="wk4_ex8" label="3. 성경의 최종 권위를 설명하라." height="min-h-[90px]" ui={ui} value={forms['wk4_ex8']} onChange={handleForm} />
              </div>
              <H4 ui={ui}>C. 실제</H4>
              <div className="space-y-4 mb-10">
                <Textarea id="wk4_ex9" label="1. 한 사람의 QT를 지도하라." height="min-h-[90px]" ui={ui} value={forms['wk4_ex9']} onChange={handleForm} />
                <Textarea id="wk4_ex10" label="2. 고난 사례를 상담하라." height="min-h-[90px]" ui={ui} value={forms['wk4_ex10']} onChange={handleForm} />
                <Textarea id="wk4_ex11" label="3. 감사훈련을 설계하라." height="min-h-[90px]" ui={ui} value={forms['wk4_ex11']} onChange={handleForm} />
                <Textarea id="wk4_ex12" label="4. 간증을 피드백하라." height="min-h-[90px]" ui={ui} value={forms['wk4_ex12']} onChange={handleForm} />
              </div>

              <Title ui={ui}>13. 최종 실기시험 / 14. 양육자 실기평가표</Title>
              <P ui={ui}>상황: 훈련생이 말한다. “회사에서 해고됐습니다. 하나님이 저를 버리신 것 같습니다.”<br/>양육자는 15분 동안 지도한다.</P>
              <div className="space-y-1.5 mb-10">
                <Checkbox id="wk4_e1" label="① 듣기: 중간에 끼어들지 않았다. / 핵심 내용을 재확인했다." ui={ui} checked={checks['wk4_e1']} onToggle={toggleCheck} />
                <Checkbox id="wk4_e2" label="② 질문: 열린 질문을 사용했다. / 정답을 유도하지 않았다." ui={ui} checked={checks['wk4_e2']} onToggle={toggleCheck} />
                <Checkbox id="wk4_e3" label="③ 말씀: 본문을 확인했다. / 문맥을 무시하지 않았다." ui={ui} checked={checks['wk4_e3']} onToggle={toggleCheck} />
                <Checkbox id="wk4_e4" label="④ 적용: 행동이 구체적이다. / 기간과 방법이 명확하다." ui={ui} checked={checks['wk4_e4']} onToggle={toggleCheck} />
                <Checkbox id="wk4_e5" label="⑤ 공동체: 필요한 도움을 연결했다. / 비밀을 보호했다." ui={ui} checked={checks['wk4_e5']} onToggle={toggleCheck} />
              </div>

              <Title ui={ui}>15. 최종 간증</Title>
              <P ui={ui}>5분 간증 구조<br/>1분: 내가 어떤 사람이었는가.<br/>1분: 무슨 사건이 있었는가.<br/>1분: 말씀이 어떻게 나를 비추었는가.<br/>1분: 무엇을 회개하고 적용했는가.<br/>1분: 지금 무엇을 고백하는가.</P>

              <Title ui={ui}>16. 최종 프로젝트</Title>
              <H3 ui={ui}>“말씀으로 다시 읽은 나의 4주”</H3>
              <P ui={ui}>구성: 1. 내가 시작할 때의 문제 2. 복음 앞에서 발견한 나 3. QT를 통해 발견한 것 4. 고난을 통해 발견한 것 5. 회개한 것 6. 감사하게 된 것 7. 실제로 바뀐 행동 8. 아직 남아 있는 문제 9. 공동체에서 받은 도움 10. 앞으로 한 사람을 어떻게 섬길 것인가<br/>권장 분량: 5,000–8,000자.</P>
              <Textarea id="wk4_final_proj" placeholder="이곳에 최종 프로젝트를 작성하십시오." height="min-h-[350px]" ui={ui} value={forms['wk4_final_proj']} onChange={handleForm} />

              <Title ui={ui}>17. 4주 종합평가 / 18. 수료 기준 [D]</Title>
              <P ui={ui}>영역 배점: 성경지식(15), 신학적 이해(15), QT(15), 회개(10), 감사(10), 고난해석(10), 공동체(10), 간증(5), 양육실습(10) 총 100점.<br/>권장 기준: 출석 90% 이상, QT 20회 이상, 과제 80% 이상, 감사훈련 7일 이상, 고난 워크시트 1회, 간증 1편, 양육 실기 1회, 최종 프로젝트 제출</P>

              <Title ui={ui}>19. 4주 이후 90일</Title>
              <P ui={ui}>1단계 — 1~30일: 자기 양육 (QT, 기도, 감사, 회개, 말씀암송)<br/>2단계 — 31~60일: 공동체 (한 사람 정기적으로 만남, 함께 QT, 기도, 삶의 적용 점검)<br/>3단계 — 61~90일: 재생산 (간증, 말씀나눔, 질문훈련, 새 양육자 실습)</P>

              <Title ui={ui}>20. 최종 영적 성장 체크리스트</Title>
              <div className="space-y-2 mb-10">
                <H4 ui={ui}>말씀 / 기도</H4>
                <Checkbox id="wk4_f1" label="말씀을 읽고, 이해하고, 자신을 보고, 순종한다." ui={ui} checked={checks['wk4_f1']} onToggle={toggleCheck} />
                <Checkbox id="wk4_f2" label="간구, 회개, 감사하며, 하나님의 뜻에 복종한다." ui={ui} checked={checks['wk4_f2']} onToggle={toggleCheck} />
                <H4 ui={ui}>고난 / 감사</H4>
                <Checkbox id="wk4_f3" label="사실을 보고, 감정을 인정하고, 욕망을 보고, 죄를 분별한다." ui={ui} checked={checks['wk4_f3']} onToggle={toggleCheck} />
                <Checkbox id="wk4_f4" label="모르는 것을 인정하고, 말씀을 듣고, 순종한다." ui={ui} checked={checks['wk4_f4']} onToggle={toggleCheck} />
                <Checkbox id="wk4_f5" label="환경 때문이 아니라 성품과 복음을 감사하며 행동으로 잇는다." ui={ui} checked={checks['wk4_f5']} onToggle={toggleCheck} />
                <H4 ui={ui}>공동체</H4>
                <Checkbox id="wk4_f6" label="잘 듣고, 묻고, 정죄하지 않으며 함께 기도하고 한 사람을 세운다." ui={ui} checked={checks['wk4_f6']} onToggle={toggleCheck} />
              </div>

              <Title ui={ui}>21. 교수자 최종 질문</Title>
              <P ui={ui}>수료 전에 반드시 묻는다.<br/>1. “4주 동안 가장 불편했던 말씀은 무엇이었습니까?”<br/>2. “그 말씀 앞에서 무엇을 발견했습니까?”<br/>3. “내가 가장 회개하기 싫었던 것은 무엇입니까?”<br/>4. “고난에 대한 내 해석 중 무엇이 바뀌었습니까?”<br/>5. “감사할 수 없었던 상황에서 무엇을 감사했습니까?”<br/>6. “내가 실제로 바꾼 행동은 무엇입니까?”<br/>7. “누구에게 도움을 받았습니까?”<br/>8. “이제 누구를 섬길 수 있습니까?”</P>

              <Title ui={ui}>22. 마지막 서약문 [D]</Title>
              <Quote ui={ui}>
                나는 말씀을 나의 생각을 정당화하는 도구로 사용하지 않고, 말씀 앞에서 나 자신을 살피겠습니다.<br/><br/>
                나는 고난의 이유를 함부로 단정하지 않고, 하나님을 신뢰하면서 내가 책임질 부분을 성실히 감당하겠습니다.<br/><br/>
                나는 회개를 자기혐오로 바꾸지 않고 그리스도 안에서 하나님께 돌아가는 길로 삼겠습니다.<br/><br/>
                나는 감사를 상황이 좋아졌다는 선언으로만 제한하지 않고 하나님의 은혜를 기억하고 고백하겠습니다.<br/><br/>
                나는 내가 받은 말씀을 혼자 간직하지 않고 공동체 안에서 나누며 한 사람을 세우겠습니다.
              </Quote>

              <Title ui={ui}>23. 4주 과정의 최종 구조 / 24. 최종 핵심문장</Title>
              <P ui={ui}>1주 — 복음 (나는 누구이며 누구를 따르는가?)<br/>2주 — 말씀 (말씀은 나의 삶을 어떻게 읽어내는가?)<br/>3주 — 고난·회개·감사 (고난 가운데 무엇을 인정하고 어떻게 하나님께 돌아가는가?)<br/>4주 — 공동체·재생산 (내가 받은 은혜로 누구를 세울 것인가?)</P>
              <Quote ui={ui}>
                제자는 말씀을 아는 사람에서 멈추지 않고, 말씀으로 자신을 보고, 그리스도 안에서 회개하고, 고난 속에서도 하나님을 신뢰하며, 감사로 응답하고, 공동체 안에서 한 사람을 세우는 사람으로 자라간다.
              </Quote>
            </div>
          )}

          {/* ==================================================
              TAB 5: WCF 신학기준 심화 업데이트
              ================================================== */}
          {activeTab === 'wcf' && (
            <div className="animate-fade-in w-full min-w-0">
              <Title ui={ui}>웨스트민스터 신앙고백·대요리문답 심화 업데이트</Title>
              <SubTitle ui={ui}>4주 영적 제자훈련을 위한 신학 기준서</SubTitle>
              <P ui={ui}>본 문서는 기존 제자훈련 완전판과 별도로 연결하는 신학 심화 모듈이다. 성경을 최종 권위로 두고 웨스트민스터 신앙고백(WCF)과 대요리문답(WLC)의 해당 조항을 제자훈련의 이론·실습·평가에 연결한다. (주의: 교육용으로 재구성한 도구다)</P>

              <Title ui={ui}>1. 전체 신학 구조</Title>
              <div className={`p-4.5 rounded-2xl border mb-6 font-mono text-[12.5px] leading-relaxed break-keep shadow-sm ${isDark(ui) ? 'bg-black/30 border-white/5 text-slate-300' : 'bg-white/50 border-white/80 text-slate-700'}`}>
                성경 ↓ 하나님과 하나님의 뜻 ↓ 하나님의 작정과 섭리 ↓ 인간의 타락과 죄 ↓ 그리스도와 구속 ↓ 칭의 ↓ 믿음 ↓ 성화 ↓ 회개 ↓ 선행 ↓ 기도·감사·예배 ↓ 교회와 성도의 교제 ↓ 양육·섬김·재생산
              </div>
              <P ui={ui}>제자훈련은 자기계발이나 단순한 도덕훈련으로 축소하지 않는다. 복음 안에서 그리스도를 믿고 성령의 역사 가운데 거룩함으로 자라며 교회 공동체 안에서 순종과 섬김의 삶을 살아가는 과정으로 다룬다.</P>

              <Title ui={ui}>PART I. 웨스트민스터 신앙고백</Title>
              
              <H3 ui={ui}>제1장 성경</H3>
              <P ui={ui}><strong>핵심:</strong> 제자훈련의 출발점은 성경이다. 경험·감정·간증·지도자의 말·시대정신을 성경과 동일한 최종 권위로 두지 않는다.<br/><strong>검증 질문:</strong> 이것은 성경 어디에 근거하는가?</P>
              
              <H3 ui={ui}>제3장 하나님의 영원한 작정 / 제5장 하나님의 섭리</H3>
              <P ui={ui}><strong>핵심:</strong> 하나님은 자신의 지혜롭고 거룩한 뜻에 따라 모든 일을 작정하신다. 그러나 하나님의 작정은 하나님을 죄의 조성자로 만드는 의미가 아니다. 하나님은 창조하신 세계를 버려두지 않고 보존하시고 통치하신다.<br/><strong>균형:</strong> 섭리를 믿는 것과 모든 사건의 구체적인 원인을 안다고 주장하는 것은 다르다.</P>

              <H3 ui={ui}>제6장 인간의 타락 / 제8장 중보자 그리스도</H3>
              <P ui={ui}><strong>핵심:</strong> 인간의 죄 문제는 단순한 행동 몇 가지가 아니라 인간의 본성과 하나님과의 관계를 포함한다. 모든 특정 고난을 특정 개인의 특정 죄 때문이라고 단정할 수는 없다. 예수 그리스도는 참 하나님이시며 참 사람이시며 하나님과 사람 사이의 중보자이시다.</P>
              <Textarea id="wcf_s1" label="자기 적용:" placeholder="나는 무엇을 두려워하는가? 사랑하는가? 통제하려 하는가? 하나님보다 의지하는가?" height="min-h-[90px]" ui={ui} value={forms['wcf_s1']} onChange={handleForm} />

              <H3 ui={ui}>제11장 칭의 / 제13장 성화</H3>
              <P ui={ui}><strong>핵심:</strong> 칭의는 하나님께서 죄인을 의롭다고 선언하시는 은혜의 행위다. 그 근거는 인간의 선행이 아니라 그리스도의 의와 구속사역이다. 성화는 성령의 역사로 사람이 점차 거룩하게 변화되는 과정이다.<br/><strong>차이:</strong> 나는 순종해서 구원받는 것이 아니라, 은혜로 구원받았기 때문에 순종한다.</P>
              <Textarea id="wcf_s2" label="성화 점검:" placeholder="죄를 더 정직하게 인정하는가? 회개가 행동으로 이어지는가? 타인 정죄가 줄어드는가?" height="min-h-[90px]" ui={ui} value={forms['wcf_s2']} onChange={handleForm} />

              <H3 ui={ui}>제14장 구원에 이르는 믿음 / 제15장 생명에 이르는 회개</H3>
              <P ui={ui}><strong>핵심:</strong> 믿음은 단순한 지적 동의에 머물지 않는다. 회개는 자책("나는 형편없는 사람이다")이 아니라 "나는 이 죄에서 돌이켜 하나님께 돌아가야 한다"이다.</P>
              
              <H3 ui={ui}>제16장 선행 / 제18장 은혜와 구원의 확신</H3>
              <P ui={ui}><strong>핵심:</strong> 선행은 구원을 얻기 위한 공로가 아니다. 구원의 확신을 단순한 감정에만 근거하지 않는다.</P>

              <H3 ui={ui}>제21장 예배 / 제25장 교회 / 제26장 성도의 교제</H3>
              <P ui={ui}><strong>핵심:</strong> 개인 QT와 기도는 공적 예배를 대체하지 않는다. 교회는 그리스도의 몸이다. 성도의 교제는 단순한 친목을 넘어 서로의 필요를 돌보고 기도하며 권면하고 위로하고 섬기는 삶을 포함한다.</P>

              <Title ui={ui}>PART II. 웨스트민스터 대요리문답</Title>
              
              <H3 ui={ui}>Q75. 성화란 무엇인가? / Q76. 생명에 이르는 회개</H3>
              <div className="space-y-4 mb-8">
                <Textarea id="wcf_q76_1" label="① 사건: 무슨 일이 있었는가?" height="min-h-[85px]" ui={ui} value={forms['wcf_q76_1']} onChange={handleForm} />
                <Textarea id="wcf_q76_2" label="② 감정: 나는 무엇을 느꼈는가?" height="min-h-[85px]" ui={ui} value={forms['wcf_q76_2']} onChange={handleForm} />
                <Textarea id="wcf_q76_3" label="③ 욕구: 나는 무엇을 원했는가?" height="min-h-[85px]" ui={ui} value={forms['wcf_q76_3']} onChange={handleForm} />
                <Textarea id="wcf_q76_4" label="④ 우상: 하나님보다 더 의지한 것은 무엇인가?" height="min-h-[85px]" ui={ui} value={forms['wcf_q76_4']} onChange={handleForm} />
                <Textarea id="wcf_q76_5" label="⑤ 죄: 성경적으로 무엇이 잘못되었는가?" height="min-h-[85px]" ui={ui} value={forms['wcf_q76_5']} onChange={handleForm} />
                <Textarea id="wcf_q76_6" label="⑥ 복음: 그리스도 안에서 내가 붙들어야 할 은혜는 무엇인가?" height="min-h-[85px]" ui={ui} value={forms['wcf_q76_6']} onChange={handleForm} />
                <Textarea id="wcf_q76_7" label="⑦ 회개: 무엇에서 돌아설 것인가?" height="min-h-[85px]" ui={ui} value={forms['wcf_q76_7']} onChange={handleForm} />
                <Textarea id="wcf_q76_8" label="⑧ 순종: 오늘 무엇을 할 것인가?" height="min-h-[85px]" ui={ui} value={forms['wcf_q76_8']} onChange={handleForm} />
              </div>

              <H3 ui={ui}>Q178 / Q185 / Q193 / Q194 / Q195 / Q196 기도와 감사</H3>
              <P ui={ui}>기도는 하나님께 우리의 소원을 올려드리는 은혜의 행위이며, 죄 고백과 <strong>그분의 자비에 대한 감사의 인정</strong>을 포함한다. 일용할 양식은 합법적 수단 사용 후 결과를 하나님께 맡기는 신뢰를 포함한다.</P>
              <div className="space-y-4 mb-8">
                <Textarea id="wcf_thx1" label="1. 오늘 하나님께 받은 것:" height="min-h-[85px]" ui={ui} value={forms['wcf_thx1']} onChange={handleForm} />
                <Textarea id="wcf_thx2" label="2. 오늘 깨달은 것:" height="min-h-[85px]" ui={ui} value={forms['wcf_thx2']} onChange={handleForm} />
                <Textarea id="wcf_thx3" label="3. 오늘 감사할 것:" height="min-h-[85px]" ui={ui} value={forms['wcf_thx3']} onChange={handleForm} />
                <Textarea id="wcf_thx4" label="4. 오늘 순종할 것:" height="min-h-[85px]" ui={ui} value={forms['wcf_thx4']} onChange={handleForm} />
                <Textarea id="wcf_thx5" label="5. 오늘 기도할 것:" height="min-h-[85px]" ui={ui} value={forms['wcf_thx5']} onChange={handleForm} />
              </div>

              <Title ui={ui}>PART III & IV. 통합 커리큘럼 및 사례</Title>
              <P ui={ui}>1주: 성경·죄·그리스도·칭의·믿음·회개<br/>2주: 성경·성화·예배·기도<br/>3주: 작정·섭리·타락·성화·회개·확신<br/>4주: 선행·예배·교회·성도의 교제</P>

              <Title ui={ui}>PART V. 최종 체크리스트</Title>
              <div className="space-y-2.5 mb-10">
                <H4 ui={ui}>성경 / 복음</H4>
                <Checkbox id="wcf_f1" label="성경을 최종 기준으로 삼고, 감정과 계시를 혼동하지 않는다." ui={ui} checked={checks['wcf_f1']} onToggle={toggleCheck} />
                <Checkbox id="wcf_f2" label="칭의와 성화를 구분하고 인간의 공로를 배제한다." ui={ui} checked={checks['wcf_f2']} onToggle={toggleCheck} />
                <H4 ui={ui}>회개 / 고난</H4>
                <Checkbox id="wcf_f3" label="자기혐오에 빠지지 않고, 고난의 원인을 단정하지 않는다." ui={ui} checked={checks['wcf_f3']} onToggle={toggleCheck} />
                <Checkbox id="wcf_f4" label="섭리를 인정하고 말씀으로 해석하여 순종을 찾는다." ui={ui} checked={checks['wcf_f4']} onToggle={toggleCheck} />
                <H4 ui={ui}>감사 / 기도 / 공동체</H4>
                <Checkbox id="wcf_f5" label="상황만이 아닌 하나님을 바라보며, 감사가 순종으로 이어진다." ui={ui} checked={checks['wcf_f5']} onToggle={toggleCheck} />
                <Checkbox id="wcf_f6" label="예배와 교제에 참여하며 다른 사람을 세운다." ui={ui} checked={checks['wcf_f6']} onToggle={toggleCheck} />
              </div>

              <Title ui={ui}>PART IX. 핵심 문장</Title>
              <ul className={`list-disc pl-5 space-y-2.5 text-[13.5px] md:text-[14.5px] font-bold break-keep ${ui.textSub} mb-8`}>
                <li><strong className={ui.textMain}>성경:</strong> 내 생각보다 먼저 본문을 확인한다.</li>
                <li><strong className={ui.textMain}>섭리:</strong> 모든 이유를 아는 것이 아니라 하나님이 다스리심을 신뢰한다.</li>
                <li><strong className={ui.textMain}>죄:</strong> 타인의 죄보다 먼저 내 죄를 본다.</li>
                <li><strong className={ui.textMain}>칭의:</strong> 나는 그리스도의 의를 의지하여 하나님 앞에 선다.</li>
                <li><strong className={ui.textMain}>성화:</strong> 은혜로 구원받은 사람은 성령 안에서 실제 삶이 변화되어 간다.</li>
                <li><strong className={ui.textMain}>회개:</strong> 죄를 인정하는 데서 멈추지 않고 하나님께 돌아간다.</li>
                <li><strong className={ui.textMain}>감사:</strong> 당연하게 여기던 것을 하나님의 공급으로 다시 본다.</li>
                <li><strong className={ui.textMain}>기도:</strong> 내 뜻을 관철하는 것이 아니라 하나님의 뜻과 나라와 영광을 구한다.</li>
                <li><strong className={ui.textMain}>공동체:</strong> 제자는 혼자만 성장하는 사람이 아니라 다른 사람을 세우는 사람이다.</li>
              </ul>

              <Quote ui={ui}>
                최종 교육 목표 결론<br/><br/>
                제자훈련의 목표는 교재를 많이 아는 사람이 되는 것이 아니라, 말씀 앞에서 자신을 보고 그리스도의 은혜를 의지하며 회개와 믿음으로 순종하고 교회 공동체 안에서 다른 사람을 세우는 성도로 자라가는 것이다.
              </Quote>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
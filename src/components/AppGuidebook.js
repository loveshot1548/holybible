// src/components/guide/AppGuidebook.js (PART 1/2)
import React, { useState } from 'react';

// =====================================================================
// 모던 아카데믹 & 시스템 벡터 아이콘
// =====================================================================
const StrokeW = "1.8";
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IconMenu = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const IconTarget = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
const IconUsers = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconSparkles = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>;
const IconChevronRight = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><polyline points="9 18 15 12 9 6" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12" /></svg>;
const IconMic = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>;
const IconActivity = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
const IconMessage = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.269z" /></svg>;
const IconCompass = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>;
const IconShield = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
const IconBriefcase = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const IconCalculator = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01"/></svg>;
const IconWand = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>;
const IconAcademic = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-5.25 6.557c1.77.65 3.65 1.05 5.25 1.18" /></svg>;

export default function AppGuidebook({ isDarkMode, setActiveScreen, isSidebarOpen, setIsSidebarOpen }) {
  const isDark = isDarkMode;
  const [activeTab, setActiveTab] = useState('interlinearSuite');

  const ui = {
    bgBody: isDark ? 'bg-[#0b0d11]' : 'bg-[#f8fafc]',
    cardBg: isDark 
      ? 'bg-[#13161c]/90 border border-white/10 backdrop-blur-xl text-white shadow-2xs' 
      : 'bg-white/95 border border-stone-200/80 backdrop-blur-xl text-stone-800 shadow-[0_4px_24px_rgba(0,0,0,0.03)]',
    innerCard: isDark ? 'bg-black/40 border border-white/5' : 'bg-stone-50 border border-stone-200/70',
    textMain: isDark ? 'text-white' : 'text-stone-900',
    textSub: isDark ? 'text-slate-400' : 'text-stone-600',
    border: isDark ? 'border-white/10' : 'border-stone-200/80',
    primaryBg: isDark ? 'bg-white text-stone-900 hover:bg-stone-100' : 'bg-stone-800 text-white hover:bg-stone-900',
    secondaryBg: isDark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-stone-100 text-stone-700 hover:bg-stone-200',
  };

  // 영적 성장 파이프라인 데이터 (100% 보존)
  const roadmapSteps = [
    {
      step: 'PHASE 01',
      title: '일일 영적 데이터 구축 (Daily Input)',
      subtitle: '흩어지는 생각과 감정을 체계적인 신앙 데이터로 축적',
      desc: '매일 아침 QT와 주일 설교를 단순한 소비로 끝내지 않고, 앱 내 에디터에 기록하여 나만의 평생 영적 아카이브에 영구 저장합니다.',
      icon: <IconBook />,
      tagColor: 'bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-stone-300 border border-stone-200 dark:border-white/10',
      pipeline: [
        { name: '매일 QT', role: '말씀 묵상 & 구속사적 적용 질문 도출', link: 'qt' },
        { name: '예배 노트', role: '주일 설교 음성/텍스트 필기 및 핵심 요약', link: 'sermon' },
        { name: '맥체인 & 통독', role: '성경 본문 자동 연결 및 주간 실시간 완독 체크', link: 'mcheyne' }
      ],
      flowOutput: '축적된 일일 묵상과 설교 적용 질문이 [신앙 아카이브]로 자동 인덱싱됨',
      actions: [{ label: '매일 QT 쓰기', id: 'qt' }, { label: '예배 노트 쓰기', id: 'sermon' }, { label: '맥체인 성경 읽기', id: 'mcheyne' }]
    },
    {
      step: 'PHASE 02',
      title: '구속사적 삶의 해석 (Analyze & Align)',
      subtitle: '기록된 말씀과 내 삶의 갈등 사건을 1:1로 매핑',
      desc: '내 힘으로 풀리지 않는 일상의 고난과 질문을 아카이브로 끌어와 말씀으로 내 죄와 우상을 직면하고 하나님의 섭리로 재해석합니다.',
      icon: <IconTarget />,
      tagColor: 'bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-stone-300 border border-stone-200 dark:border-white/10',
      pipeline: [
        { name: '설교 심층 아카이브', role: '본문 구절별 설교 요약 및 목회자 큐티노트 색인 조회', link: 'sermonArchiveAdvanced' },
        { name: '적용 질문 트래커', role: '미해결된 질문을 실제 삶의 실천 과제로 전환', link: 'applyTracker' },
        { name: '성경 위키 & 원어', role: '지리, 역사, 원어 어근을 대조하는 입체적 성경 연구', link: 'interlinear' }
      ],
      flowOutput: '해석된 사건과 순종의 결단이 [간증문 8단계 서식]으로 자동 정렬됨',
      actions: [{ label: '원어 성경 연구', id: 'interlinear' }, { label: '삶의 적용과 실천', id: 'sermonArchiveAdvanced' }, { label: '적용 트래커 확인', id: 'applyTracker' }]
    },
    {
      step: 'PHASE 03',
      title: '공동체 나눔과 은혜의 선순환 (Share & Edify)',
      subtitle: '나의 치유와 회복을 지체들과 나누며 연합',
      desc: '해석된 삶의 간증과 감사, 기도제목은 목장 모임지와 공동체 게시판, 공동체 QT 나눔터로 흘러가 서로를 살리는 통로가 됩니다.',
      icon: <IconUsers />,
      tagColor: 'bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-stone-300 border border-stone-200 dark:border-white/10',
      pipeline: [
        { name: '공동체 QT 나눔터', role: '그날의 본문 아래 전교인 묵상·질문·대댓글 나눔', link: 'qt' },
        { name: '목장 나눔 모임지', role: '말씀·감사·기도제목 독립 폼 작성 및 리더십 자동 보고', link: 'cell' },
        { name: '실시간 감사 피드', role: '오늘의 감사 3가지를 목장 식구들에게 즉시 공유', link: 'cell' }
      ],
      flowOutput: '은혜가 확산되며 [영적 5종 세트 연속 실천 달성도]가 실시간 갱신됨',
      actions: [{ label: '공동체 QT 나눔', id: 'qt' }, { label: '목장 모임지 작성', id: 'cell' }, { label: '공동체 감사/기도', id: 'board' }]
    }
  ];

  // 상황별 처방 데이터 (100% 보존)
  const contextCurations = [
    {
      situation: '오늘 본문 말씀이 잘 해석되지 않고 궁금한 점이 생길 때',
      subtitle: '공동체 QT 나눔터 ➜ 성경 자동완성 질문 ➜ 지체·목사님 피드백',
      prescription: '혼자 끙끙 앓지 마세요. 매일 QT 내 [공동체 QT 나눔터]에 들어가 구절을 쓰고 질문을 남기면 지체들과 목사님의 해석 가이드를 마주할 수 있습니다.',
      targetFeature: '매일 QT 내 공동체 나눔터',
      id: 'qt',
      icon: <IconMessage />,
      tag: '본문 질의응답',
      tagColor: 'bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-stone-300',
      iconColor: 'text-stone-700 dark:text-stone-300',
      steps: [
        '매일 QT 상단 탭에서 [공동체 QT 나눔터] 선택',
        '우측 상단 [나의 묵상 올리기] 클릭',
        '[이 부분이 어려워요]에 성경 구절 입력 후 질문 등록'
      ]
    },
    {
      situation: '시험이나 고난을 만나 마음이 답답하고 기도가 막힐 때',
      subtitle: '침묵 정돈 ➜ 랜덤 말씀 직면 ➜ 골방 기도 봉헌',
      prescription: '상황을 바꾸려 애쓰기 전에 [오늘의 묵상 여정]을 열어보세요. 60초의 침묵, 주시는 말씀, 골방의 기도를 통해 하나님의 시선을 회복할 수 있습니다.',
      targetFeature: '오늘의 묵상 여정 (5단계 리터지)',
      id: 'meditationPilgrimage',
      icon: <IconCompass />,
      tag: '회복 & 기도',
      tagColor: 'bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-stone-300',
      iconColor: 'text-stone-700 dark:text-stone-300',
      steps: [
        '사이드바에서 [오늘의 묵상 여정] 입장',
        '잔잔한 피아노 찬양 선율 속 60초 침묵',
        '골방 기도 후 [기도를 주님 손에 올려드립니다] 봉헌'
      ]
    },
    {
      situation: '주일 설교나 QT 말씀이 삶에 실제 적용되지 않고 겉돌 때',
      subtitle: '적용 트래커 가동 ➜ 구체적 실천 과제 분할 ➜ 당일 순종',
      prescription: '말씀을 머리로만 이해하면 삶이 바뀌지 않습니다. 설교 중 던져진 적용 질문을 1가지 실천 과제로 쪼개어 오늘 즉시 행동해 보세요.',
      targetFeature: '적용 질문 트래커 & 삶의 적용과 실천',
      id: 'applyTracker',
      icon: <IconTarget />,
      tag: '순종 & 훈련',
      tagColor: 'bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-stone-300',
      iconColor: 'text-stone-700 dark:text-stone-300',
      steps: [
        '설교 노트에서 마음에 찔린 질문 1개 추출',
        '적용 트래커에서 오늘 순종할 실천 항목 등록',
        '저녁에 순종 완료 여부 원클릭 체크'
      ]
    },
    {
      situation: '나 혼자의 힘으로 영적 슬럼프를 이겨내기 힘들 때',
      subtitle: '약함 오픈 ➜ 목장 기도 요청 ➜ 공동체 중보 연합',
      prescription: '영적 전쟁은 혼자 싸우는 것이 아닙니다. 목장 나눔지에 나의 연약함과 솔직한 기도제목을 털어놓고 식구들의 중보 기도를 덧입으세요.',
      targetFeature: '목장 나눔 모임지 & 공동체 기도실',
      id: 'cell',
      icon: <IconUsers />,
      tag: '공동체 & 중보',
      tagColor: 'bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-stone-300',
      iconColor: 'text-stone-700 dark:text-stone-300',
      steps: [
        '목장 나눔지 [3. 개인 기도제목]에 솔직한 고백 작성',
        '[공동체 게시판에도 함께 나누기] 체크 후 제출',
        '감사 피드에서 다른 지체들의 감사를 읽고 좋아요 응원'
      ]
    }
  ];

  // 스마트 팁 데이터 (100% 보존)
  const smartTips = [
    { title: '원어 묵상 1-클릭 QT & 설교 삽입', desc: '단어 카드 모달 하단의 [🌿 QT 묵상에 삽입] 또는 [📖 설교노트에 삽입]을 누르면 원어 표제어, Strongs 번호, 형태론, 구속사 문법 주석이 오늘 묵상 일지에 자동 기록됩니다.', icon: <IconAcademic /> },
    { title: '성경 본문 스페이스바 자동완성', desc: 'QT 질문란이나 말씀 노트에서 [신명기 22:13]처럼 장:절을 적고 스페이스바를 누르면 성경 말씀 본문이 그 자리에 자동으로 쏙 들어옵니다.', icon: <IconActivity /> },
    { title: '공동체 QT 대댓글 토론', desc: '지체들의 나눔 글 아래 [답글] 버튼을 누르면 해당 성도에게 직접 연결되는 대댓글이 생성되어 깊은 영적 나눔이 가능합니다.', icon: <IconMessage /> },
    { title: '음성으로 설교 필기하기', desc: '예배 노트와 자유 노트에서 마이크 아이콘을 누르면, 스마트폰이 설교 음성을 듣고 자동으로 텍스트 변환해 줍니다.', icon: <IconMic /> },
    { title: '자동 간증문 맵핑', desc: '기록한 일상의 예배를 "간증문으로 피워내기" 버튼만 누르면, 8단계 구속사 서식에 맞게 내용이 스스로 정렬됩니다.', icon: <IconBook /> }
  ];

  return (
    <div className={`flex-1 flex flex-col h-full w-full pointer-events-auto font-sans relative ${ui.bgBody} overflow-hidden select-none text-stone-800`}>
      
      {/* 앰비언트 배경 글로우 */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-50 dark:opacity-20">
        <div 
          className="absolute -top-[15%] -left-[10%] w-[90vw] max-w-[550px] h-[90vw] max-h-[550px] rounded-full blur-[100px]" 
          style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)' }} 
        />
        <div 
          className="absolute -bottom-[15%] -right-[10%] w-[85vw] max-w-[500px] h-[85vw] max-h-[500px] rounded-full blur-[100px]" 
          style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)' }} 
        />
      </div>

      {/* 상단 글로벌 헤더 */}
      <header className={`px-4 sm:px-6 py-3 flex items-center justify-between border-b ${ui.border} backdrop-blur-xl shrink-0 relative z-20 bg-white/80 dark:bg-[#0b0d11]/80`}>
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
          <button 
            onClick={() => setActiveScreen && setActiveScreen('home')} 
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer text-stone-700 dark:text-stone-200"
          >
            <IconArrowLeft />
          </button>
          
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-indigo-600 to-emerald-600 flex items-center justify-center shrink-0 text-white font-black shadow-xs">
            <IconAcademic />
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className={`text-[15px] sm:text-[16.5px] font-black ${ui.textMain} tracking-tight leading-tight truncate`}>
                좋은나무 시스템 종합 가이드북
              </h2>
              <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 dark:bg-indigo-950/80 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 shrink-0">
                10-CORE SUITE
              </span>
            </div>
            <p className={`text-[11px] font-medium ${ui.textSub} leading-tight truncate mt-0.5`}>
              원어 성경 연구 10대 학술 엔진 · 성경통독 365 & 맥체인 1:1 직결 · WEB 영한사전 총람
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsSidebarOpen && setIsSidebarOpen(!isSidebarOpen)} 
          className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer text-stone-700 dark:text-stone-200 md:hidden"
        >
          <IconMenu />
        </button>
      </header>

      {/* 가로 스크롤 네비게이션 탭 (11대 전체 탭 유지 및 원어성경 연구 탭 선두 배치) */}
      <nav className={`flex w-full px-4 sm:px-6 overflow-x-auto hide-scrollbar border-b ${ui.border} shrink-0 relative z-20 backdrop-blur-md gap-3 sm:gap-5 bg-white/50 dark:bg-black/20`}>
        {[
          { id: 'interlinearSuite', label: '🏛️ 원어성경 연구 10-Core 바이블' },
          { id: 'reelsStudioGuide', label: '🎬 릴스 스튜디오 Pro 완벽 바이블' },
          { id: 'oneStream', label: '🚀 원스트림(One-Stream) 연동' },
          { id: 'erpSuite', label: '🏛️ 목회 4종 ERP 상세 매뉴얼' },
          { id: 'qtCommunity', label: '📖 공동체 QT & 목사님 나눔' },
          { id: 'pilgrimage', label: '🕊️ 오늘의 묵상 여정' },
          { id: 'cellManual', label: '👥 목장 모임 & 7일 오토풀링' },
          { id: 'roadmap', label: '🌱 영적 성장 파이프라인' },
          { id: 'context', label: '🎯 상황별 성도 솔루션' },
          { id: 'controlHub', label: '🏢 컨트롤허브(Admin) 사용법' },
          { id: 'tips', label: '💡 스마트 꿀팁' }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`py-3 text-[12px] sm:text-[12.5px] font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === tab.id 
                ? `border-indigo-600 dark:border-indigo-400 text-indigo-900 dark:text-white font-black drop-shadow-xs` 
                : `border-transparent ${ui.textSub} hover:${ui.textMain}`
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 메인 콘텐츠 스크롤 뷰포트 */}
      <main className="flex-1 overflow-y-auto w-full hide-scrollbar relative z-10 pb-28">
        <div className="w-full max-w-4xl mx-auto p-3.5 sm:p-5 md:p-6 flex flex-col gap-5 sm:gap-6 animate-fade-in">
          
          {/* ========================================================================= */}
          {/* 🏛️ [탭 1] 원어 성경 연구 (Interlinear Exegetical Suite) 학술 총람           */}
          {/* ========================================================================= */}
          {activeTab === 'interlinearSuite' && (
            <div className="flex flex-col gap-5 sm:gap-6">
              
              {/* 히어로 배너 */}
              <div className={`p-5 sm:p-6 rounded-3xl border ${ui.cardBg} flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm bg-gradient-to-br from-amber-50/70 via-white to-indigo-50/70 dark:from-amber-950/20 dark:via-[#111622] dark:to-indigo-950/30 border-amber-200/90 dark:border-indigo-800/60`}>
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-black px-2.5 py-0.8 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 uppercase border border-amber-300 dark:border-amber-800">
                      Logos-Class Academic Suite
                    </span>
                    <span className="text-[11.5px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <IconSparkles /> 10대 학술 코퍼스 · 4대 역본 · WEB 영한사전 완비
                    </span>
                  </div>
                  <h3 className={`text-[19px] sm:text-[23px] font-black ${ui.textMain} tracking-tight leading-snug break-keep`}>
                    원어 성경 연구(Interlinear) 10-Core 종합 바이블
                  </h3>
                  <p className={`text-[12.5px] sm:text-[13px] font-medium ${ui.textSub} leading-relaxed break-keep mt-0.5`}>
                    WLC 마소라 히브리어 원문과 NA28 헬라어 원전을 바탕으로, 성경 66권 전체 31,102구절의 형태론과 10대 학술 사료를 유기적으로 연결하는 전문 주석 연구 환경입니다. 성경 통독 365 및 맥체인과의 1:1 직결 파이프라인과 WEB 영단어 사전 엔진의 모든 사용법을 상세히 안내합니다.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveScreen && setActiveScreen('interlinear')} 
                  className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[13px] shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  연구실 바로가기 <IconChevronRight />
                </button>
              </div>

              {/* 시청각 도식: 3대 본문 뷰어 상호 연동 파이프라인 */}
              <div className={`p-4 sm:p-5 rounded-3xl border ${ui.cardBg} flex flex-col gap-3 shadow-xs`}>
                <div className="flex items-center justify-between border-b pb-2.5 border-dashed border-stone-200 dark:border-white/10">
                  <span className="text-[12.5px] font-black flex items-center gap-1.5 text-indigo-900 dark:text-indigo-200">
                    🔄 성경 통독 365 ⇄ 맥체인 ⇄ 원어 연구실 3각 직결 파이프라인
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                    0.1s TELEPORT
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-900 text-slate-200 font-mono text-[11px] sm:text-[11.5px] leading-relaxed overflow-x-auto hide-scrollbar">
                  <pre className="whitespace-pre">
{`┌───────────────────────┐          ┌───────────────────────┐
│  성경통독 365 (Bible)  │          │   맥체인 (Mcheyne)    │
│  - 66권 전체 장별 통독 │          │   - 하루 4편 구속사 플랜│
│  - 본문 끝 [📖 원어]   │          │   - 본문 끝 [📖 원어]   │
└───────────┬───────────┘          └───────────┬───────────┘
            │ [📖 원어 클릭 / 롱프레스]           │ [📖 원어 클릭 / 롱프레스]
            ▼                                  ▼
┌──────────────────────────────────────────────────────────┐
│         인라인 학술 인스펙터 (Exegetical Inspector)         │
│   • 개역개정 vs 쉬운성경 vs World English Bible 3단 대조   │
│   • 단어별 1:1 형태론 / Strongs / 히브리어·헬라어 원문    │
│   • [🔬 원어성경연구실 ➔] 점프 버튼 클릭                  │
└────────────────────────────┬─────────────────────────────┘
                             │ LocalStorage: interlinear_jump
                             ▼
┌──────────────────────────────────────────────────────────┐
│       원어 성경 연구실 (Interlinear Exegetical Suite)      │
│   • 10대 학술 코퍼스 (TSK, BHS, LXX, 타르굼, 반즈 주석 등)   │
│   • WEB 영한 사전 인터랙티브 단어 뜻풀이 & 원어민 낭독      │
│   • [🌿 QT 묵상에 삽입] & [📖 설교노트에 삽입] 원클릭 전송 │
└──────────────────────────────────────────────────────────┘`}
                  </pre>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11.5px] font-medium leading-relaxed">
                  <div className={`p-3 rounded-xl border ${ui.innerCard}`}>
                    <b className="text-amber-800 dark:text-amber-300 block mb-1">1. 끊김 없는 정통 본문</b>
                    절마다 박스를 씌우지 않고 종이 성경처럼 유려하게 읽으며, 각 절 끝의 <b>[📖 원어]</b> 배지로 0.1초 만에 인스펙터를 호출합니다.
                  </div>
                  <div className={`p-3 rounded-xl border ${ui.innerCard}`}>
                    <b className="text-indigo-800 dark:text-indigo-300 block mb-1">2. 안전한 오버레이</b>
                    하단 탭바만 정밀 숨김 처리하여 팝업 오픈 시 흰 화면(Blank Screen)이 발생하는 버그를 완벽하게 차단했습니다.
                  </div>
                  <div className={`p-3 rounded-xl border ${ui.innerCard}`}>
                    <b className="text-emerald-800 dark:text-emerald-300 block mb-1">3. 책·장·절 상태 계승</b>
                    통독 중 보던 구절(예: 열왕기상 12:4)의 번호를 그대로 물고 원어 연구실로 이동해 즉시 심층 연구를 이어갑니다.
                  </div>
                </div>
              </div>

              {/* 4대 역본 & WEB 인터랙티브 영한 사전 */}
              <div className={`p-4 sm:p-5 rounded-3xl border ${ui.cardBg} flex flex-col gap-3 shadow-xs`}>
                <div className="flex items-center justify-between border-b pb-2.5 border-dashed border-stone-200 dark:border-white/10">
                  <span className="text-[12.5px] font-black flex items-center gap-1.5 text-blue-900 dark:text-blue-200">
                    📖 4대 역본 대조 & WEB 영단어 사전 (Biblical English Lexicon)
                  </span>
                  <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                    NEW FEATURE
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className={`p-3.5 rounded-xl border ${ui.innerCard} flex flex-col gap-2`}>
                    <h5 className="font-bold text-[13px] text-stone-900 dark:text-white flex items-center gap-1.5">
                      🔀 4대 역본 원터치 스위처
                    </h5>
                    <ul className="text-[12px] space-y-1.5 text-stone-600 dark:text-slate-300 leading-relaxed font-medium">
                      <li>• <b>개역개정 (KRV)</b>: 정통 개혁주의 공인 예배용 성경</li>
                      <li>• <b>쉬운성경 (Easy)</b>: 현대적 어휘로 문맥을 쉽게 풀어낸 현대어 성경</li>
                      <li>• <b>World English Bible (WEB)</b>: 전 세계 공인 31,102절 직역 영문 성경</li>
                      <li>• <b>동시대조 (Parallel)</b>: 3개 역본을 한 화면에서 나란히 대조 렌더링</li>
                    </ul>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${ui.innerCard} flex flex-col gap-2`}>
                    <h5 className="font-bold text-[13px] text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                      🔍 WEB 영단어 터치 사전 작동법
                    </h5>
                    <p className="text-[11.5px] text-stone-600 dark:text-slate-300 leading-relaxed font-medium">
                      WEB 성경이나 동시대조 화면에서 영단어(예: <code>created</code>, <code>covenant</code>, <code>grace</code>)를 터치하면 하단 시트가 즉각 호출됩니다:
                    </p>
                    <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-[11px] font-mono leading-relaxed text-blue-950 dark:text-blue-200">
                      ✓ 한글 품사 및 번역어 정의 자동 분석
                      <br />✓ 핵심 신학 어휘 구속사적 뜻풀이 (`theology`) 표시
                      <br />✓ [🔊 발음] 버튼 클릭 시 미국식 원어민 음성(`en-US`) 재생
                    </div>
                  </div>
                </div>
              </div>

              {/* 10대 학술 코퍼스 아키텍처 */}
              <div className={`p-4 sm:p-5 rounded-3xl border ${ui.cardBg} flex flex-col gap-3.5 shadow-xs`}>
                <div className="flex items-center justify-between border-b pb-2.5 border-dashed border-stone-200 dark:border-white/10">
                  <div>
                    <h4 className="text-[14.5px] font-black text-stone-900 dark:text-white tracking-tight">
                      🏛️ 10대 글로벌 정밀 학술 코퍼스 (10-Core Exegetical Suite)
                    </h4>
                    <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                      정통 개혁주의·복음주의 표준 사료 전수 탑재
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded">
                    10 ENGINES
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl border bg-sky-50/70 border-sky-200/80 dark:bg-sky-950/20 dark:border-sky-900/60 text-left flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[12px] text-sky-950 dark:text-sky-200">🔗 1. TSK 상호교차참조</span>
                      <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-white dark:bg-black/40 border border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300">34만 구절</span>
                    </div>
                    <p className="text-[11.5px] text-sky-900/80 dark:text-sky-300/80 leading-relaxed font-medium">
                      성경이 성경을 직접 해석하는 종교개혁 표준 교차참조. 클릭 시 해당 장·절로 즉시 이동합니다.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border bg-amber-50/70 border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-900/60 text-left flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[12px] text-amber-950 dark:text-amber-200">📜 2. BHS 히브리어 구문론 끊어읽기</span>
                      <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-white dark:bg-black/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300">Atnach 대휴지</span>
                    </div>
                    <p className="text-[11.5px] text-amber-900/80 dark:text-amber-300/80 leading-relaxed font-medium">
                      마소라 악센트 체계에 따라 Atnach(대휴지) 전후반부를 문장론적으로 양분하여 신적 기원을 명확히 해설합니다.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border bg-stone-100/80 border-stone-300/80 dark:bg-stone-900/40 dark:border-stone-700 text-left flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[12px] text-stone-950 dark:text-stone-200">🏛️ 3. 70인역(LXX) 3단 원전 대조</span>
                      <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-white dark:bg-black/40 border border-stone-400 dark:border-stone-600 text-stone-800 dark:text-stone-300">신약 인용</span>
                    </div>
                    <p className="text-[11.5px] text-stone-800/80 dark:text-stone-300/80 leading-relaxed font-medium">
                      [신약 헬라어 GNT] · [구약 70인역 LXX] · [마소라 MT] 3열 대조로 본문비평 이문을 증명합니다.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border bg-orange-50/70 border-orange-200/80 dark:bg-orange-950/20 dark:border-orange-900/60 text-left flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[12px] text-orange-950 dark:text-orange-200">🏺 4. 고대 아람어 타르굼 & 시리아 페시타</span>
                      <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-white dark:bg-black/40 border border-orange-300 dark:border-orange-800 text-orange-800 dark:text-orange-300">Semitic</span>
                    </div>
                    <p className="text-[11.5px] text-orange-900/80 dark:text-orange-300/80 leading-relaxed font-medium">
                      초대 셈족 언어권 원전과 한국어 직역을 제공하여 고대 유대 낭독 전통을 확인합니다.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border bg-yellow-50/60 border-yellow-200/80 dark:bg-yellow-950/20 dark:border-yellow-900/50 text-left flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[12px] text-yellow-950 dark:text-yellow-200">📜 5. 요세푸스 1세기 유대 고대사/전쟁사</span>
                      <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-white dark:bg-black/40 border border-yellow-300 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300">1st Century</span>
                    </div>
                    <p className="text-[11.5px] text-yellow-900/80 dark:text-yellow-300/80 leading-relaxed font-medium">
                      헤롯 대왕, 세례 요한, 빌라도 총독 등 1세기 로마-유대 역사적 배경을 1:1로 매핑합니다.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border bg-teal-50/70 border-teal-200/80 dark:bg-teal-950/20 dark:border-teal-900/60 text-left flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[12px] text-teal-950 dark:text-teal-200">🗺️ 6. 역사 지리학 & OpenBible GPS</span>
                      <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-white dark:bg-black/40 border border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300">Google Satellite</span>
                    </div>
                    <p className="text-[11.5px] text-teal-900/80 dark:text-teal-300/80 leading-relaxed font-medium">
                      유적지의 위·경도를 바탕으로 구글 위성 지도를 1-클릭 호출하여 지형을 입체적으로 조망합니다.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border bg-indigo-50/70 border-indigo-200/80 dark:bg-indigo-950/20 dark:border-indigo-900/60 text-left flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[12px] text-indigo-950 dark:text-indigo-200">📖 7. 반즈 & JFB 역사문법 강해 주석</span>
                      <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-white dark:bg-black/40 border border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300">단락별 번역</span>
                    </div>
                    <p className="text-[11.5px] text-indigo-900/80 dark:text-indigo-300/80 leading-relaxed font-medium">
                      원어 문맥 주해와 교리적 의미를 단락 단위로 깔끔하게 분할 번역하여 깊은 묵상을 돕습니다.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border bg-emerald-50/70 border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-900/60 text-left flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[12px] text-emerald-950 dark:text-emerald-200">🌿 8. 매튜 헨리 구속사적 묵상 강해</span>
                      <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-white dark:bg-black/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">청교도 표준</span>
                    </div>
                    <p className="text-[11.5px] text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed font-medium">
                      영혼의 양식이 되는 정통 청교도 강해와 삶의 실천 권면을 단락 분할로 출력합니다.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border bg-rose-50/70 border-rose-200/80 dark:bg-rose-950/20 dark:border-rose-900/60 text-left flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[12px] text-rose-950 dark:text-rose-200">🔍 9. NET Bible 사본/원문 비평 각주</span>
                      <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-white dark:bg-black/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300">Textual Criticism</span>
                    </div>
                    <p className="text-[11.5px] text-rose-900/80 dark:text-rose-300/80 leading-relaxed font-medium">
                      현대 최고 복음주의 신학자들이 기록한 번역상 난제와 사본학적 각주를 명쾌히 제공합니다.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border bg-purple-50/70 border-purple-200/80 dark:bg-purple-950/20 dark:border-purple-900/60 text-left flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[12px] text-purple-950 dark:text-purple-200">📚 10. 이스톤 성경 백과사전 (Easton's)</span>
                      <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-white dark:bg-black/40 border border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300">Encyclopedia</span>
                    </div>
                    <p className="text-[11.5px] text-purple-900/80 dark:text-purple-300/80 leading-relaxed font-medium">
                      본문에 등장하는 고대 인물, 지명, 제도, 풍습의 역사적 의미를 사전식으로 총망라합니다.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 🎬 [탭 2] 릴스 스튜디오 Pro 완벽 바이블 (100% 완전 보존)                    */}
          {/* ========================================================================= */}
          {activeTab === 'reelsStudioGuide' && (
            <div className="flex flex-col gap-5 sm:gap-6">
              <div className={`p-5 sm:p-6 rounded-3xl border ${ui.cardBg} flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm bg-gradient-to-br from-cyan-50/80 via-white to-slate-100 dark:from-cyan-950/30 dark:via-black dark:to-slate-900 border-cyan-200/80 dark:border-white/10`}>
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10.5px] font-black px-2.5 py-1 rounded-md bg-cyan-100 text-cyan-800 dark:bg-[#00E5FF]/20 dark:text-[#00E5FF] font-mono tracking-widest uppercase border border-cyan-300 dark:border-[#00E5FF]/30">
                      9:16 Vertical NLE Bible
                    </span>
                    <span className="text-[11.5px] font-bold text-cyan-700 dark:text-cyan-400 flex items-center gap-1">
                      <IconSparkles /> 헐리우드 다빈치 리졸브 & 캡컷 하이브리드 엔진
                    </span>
                  </div>
                  <h3 className={`text-[19px] sm:text-[22px] font-black ${ui.textMain} tracking-tight leading-snug break-keep`}>
                    인스타그램 릴스 & 숏폼 프로 비디오 스튜디오 마스터 가이드
                  </h3>
                  <p className={`text-[13px] font-medium ${ui.textSub} leading-relaxed break-keep mt-0.5`}>
                    방송국 및 전문 프로덕션 워크플로우를 웹 브라우저와 모바일에 1:1로 구현한 고정밀 9:16 NLE 엔진입니다. 트랙 격리 원칙, 오디오 더킹 DSP, 비디오월 멀티 매트릭스, 3-Way 컬러휠, 매직 마스크, 프롬프터까지 전 과정을 완벽히 안내합니다.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveScreen && setActiveScreen('reelsStudio')} 
                  className="px-5 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-[#00E5FF] dark:hover:bg-[#00cce6] dark:text-black font-black text-[13px] shadow-md dark:shadow-[0_0_25px_rgba(0,229,255,0.4)] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  릴스 스튜디오 열기 <IconChevronRight />
                </button>
              </div>

              {/* 타임라인 V/T/A 구조 */}
              <div className={`p-5 sm:p-6 rounded-3xl border ${ui.cardBg} flex flex-col gap-4 shadow-sm`}>
                <div className="flex items-center gap-3 border-b pb-4 border-stone-200/80 dark:border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 flex items-center justify-center text-xl font-black shrink-0">🎞️</div>
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-[17px] font-black ${ui.textMain} tracking-tight break-keep leading-snug`}>
                      CHAPTER 01. V / T / A 엄격 분리 트랙 매트릭스 & 자석 스냅
                    </h4>
                    <p className={`text-[12px] font-bold text-sky-700 dark:text-sky-400 mt-0.5 truncate`}>
                      이종 클립 충돌 방지 아키텍처 및 12ms 햅틱 스내핑
                    </p>
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-100/90 dark:bg-black/60 border border-stone-200 dark:border-white/10 font-mono text-[11px] sm:text-xs space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 text-sky-800 dark:text-sky-300 font-bold border-b border-stone-200 dark:border-white/5 pb-2">
                    <span className="w-max px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 border border-sky-300 dark:border-sky-800 text-[10.5px] shrink-0">V1~V4</span>
                    <span className="break-keep min-w-0 leading-relaxed">🎬 VIDEO / IMAGE TRACK (비디오, 사진 레이어 적층 및 비디오월 전용)</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 text-amber-800 dark:text-amber-300 font-bold border-b border-stone-200 dark:border-white/5 pb-2">
                    <span className="w-max px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 text-[10.5px] shrink-0">T1~T2</span>
                    <span className="break-keep min-w-0 leading-relaxed">💬 TEXT / SUBTITLE TRACK (성경 구절, 릴스 팝업 자막, 가라오케 전용)</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                    <span className="w-max px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-[10.5px] shrink-0">A1~A3</span>
                    <span className="break-keep min-w-0 leading-relaxed">🎵 AUDIO DSP TRACK [A1: 내레이션 보이스, A2: BGM 배경음악, A3: 효과음 SFX]</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl ${ui.innerCard} flex flex-col gap-2.5`}>
                    <h5 className={`text-[13.5px] font-black ${ui.textMain} flex items-center gap-1.5`}>
                      🧲 12ms 햅틱 자석 스냅 & 클립 트랙 이동
                    </h5>
                    <ul className={`text-[12px] ${ui.textSub} font-medium space-y-2 leading-relaxed break-keep`}>
                      <li>• <b>트랙 간 유효성 검증</b>: 사진/영상을 오디오 트랙으로 끌고 가도 자동 차단되어 타임라인 꼬임 방지.</li>
                      <li>• <b>스냅 라인 가이드</b>: 클립 시작/끝 지점 및 플레이헤드와 10px 이내로 접근 시 자석처럼 흡착되며 햅틱 진동 발생.</li>
                      <li>• <b>자유 트랙 점프</b>: 인스펙터 내 <code>[V1] [V2] [V3] [V4]</code> 버튼으로 언제든 원하는 레이어 층으로 수직 점프.</li>
                    </ul>
                  </div>

                  <div className={`p-4 rounded-2xl ${ui.innerCard} flex flex-col gap-2.5`}>
                    <h5 className={`text-[13.5px] font-black ${ui.textMain} flex items-center gap-1.5`}>
                      ⌨ 프로 에디터 전역 단축키 치트시트
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="p-2 bg-stone-100/90 dark:bg-black/40 rounded-lg border border-stone-200 dark:border-white/5 flex items-center justify-between gap-1">
                        <span className="text-stone-600 dark:text-zinc-400 truncate">분할 (Split):</span>
                        <span className="text-cyan-700 dark:text-[#00E5FF] font-black shrink-0">B 키</span>
                      </div>
                      <div className="p-2 bg-stone-100/90 dark:bg-black/40 rounded-lg border border-stone-200 dark:border-white/5 flex items-center justify-between gap-1">
                        <span className="text-stone-600 dark:text-zinc-400 truncate">삭제 (Delete):</span>
                        <span className="text-rose-600 dark:text-rose-400 font-black shrink-0">Del / Backspace</span>
                      </div>
                      <div className="p-2 bg-stone-100/90 dark:bg-black/40 rounded-lg border border-stone-200 dark:border-white/5 flex items-center justify-between gap-1">
                        <span className="text-stone-600 dark:text-zinc-400 truncate">실행 취소:</span>
                        <span className="text-stone-800 dark:text-zinc-200 font-black shrink-0">Ctrl + Z</span>
                      </div>
                      <div className="p-2 bg-stone-100/90 dark:bg-black/40 rounded-lg border border-stone-200 dark:border-white/5 flex items-center justify-between gap-1">
                        <span className="text-stone-600 dark:text-zinc-400 truncate">타임라인 줌:</span>
                        <span className="text-stone-800 dark:text-zinc-200 font-black shrink-0">Ctrl + 휠</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 스마트 오디오 더킹 */}
              <div className={`p-5 sm:p-6 rounded-3xl border ${ui.cardBg} flex flex-col gap-4 shadow-sm`}>
                <div className="flex items-center gap-3 border-b pb-4 border-stone-200/80 dark:border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center text-xl font-black shrink-0">🎛️</div>
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-[17px] font-black ${ui.textMain} tracking-tight break-keep leading-snug`}>
                      CHAPTER 02. 사이드체인 스마트 오디오 더킹 (Fairlight DSP)
                    </h4>
                    <p className={`text-[12px] font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 truncate`}>
                      목소리가 나올 때 BGM 볼륨을 자동으로 부드럽게 감쇄하는 자동 믹싱 엔진
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl ${ui.innerCard} flex flex-col gap-2.5`}>
                    <h5 className={`text-[13.5px] font-black ${ui.textMain} flex items-center gap-1.5`}>
                      🔉 실시간 오디오 더킹 작동 메커니즘
                    </h5>
                    <p className={`text-[12px] ${ui.textSub} leading-relaxed font-medium break-keep`}>
                      설교자나 내레이터의 음성(V1 비디오 음성, A1 마이크 보이스)이 재생되는 구간을 실시간 감지하여, 아래에 깔린 배경음악(A2 BGM)의 볼륨을 부드러운 엔벨로프 곡선으로 <b>-18dB ~ -24dB 자동 다운</b>시킵니다.
                    </p>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-500/40 text-[11.5px] font-mono text-emerald-900 dark:text-emerald-300 leading-relaxed break-keep">
                      ✓ 트리거: V1 비디오 음성 + A1 내레이션 ➔ 타겟: A2 BGM 트랙
                      <br />✓ 감쇄 파형이 타임라인 클립 하단에 <code className="bg-emerald-100 dark:bg-emerald-900/50 px-1 py-0.5 rounded text-emerald-800 dark:text-emerald-200 font-bold">-18dB DUCKED</code>로 실시간 시각화
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl ${ui.innerCard} flex flex-col gap-2.5`}>
                    <h5 className={`text-[13.5px] font-black ${ui.textMain} flex items-center gap-1.5`}>
                      🎙️ 페어라이트 믹서 & 스튜디오 다이내믹스
                    </h5>
                    <ul className={`text-[12px] ${ui.textSub} font-medium space-y-1.5 leading-relaxed break-keep`}>
                      <li>• <b>대화형 수직 페이더</b>: 트랙별 게인(-60dB ~ +6dB) 조절 및 더블클릭 0dB 리셋.</li>
                      <li>• <b>탄도학 피크 홀드 VU 미터</b>: 실시간 데시벨 에너지 바운스 및 피크 클리핑 모니터링.</li>
                      <li>• <b>4-Band Parametric EQ</b>: 저음(250Hz), 중음(1.0kHz), 고음(4.0kHz), 초고역 에어(10kHz).</li>
                      <li>• <b>스튜디오 리버브</b>: 대성당(Cathedral), 녹음실(Studio Room) 공간계 FX.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 비디오월 & 3-Way 컬러휠 */}
              <div className={`p-5 sm:p-6 rounded-3xl border ${ui.cardBg} flex flex-col gap-4 shadow-sm`}>
                <div className="flex items-center gap-3 border-b pb-4 border-stone-200/80 dark:border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 flex items-center justify-center text-xl font-black shrink-0">🎨</div>
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-[17px] font-black ${ui.textMain} tracking-tight break-keep leading-snug`}>
                      CHAPTER 03. 비디오월 멀티 매트릭스 & 3-Way 시네마틱 컬러휠
                    </h4>
                    <p className={`text-[12px] font-bold text-purple-700 dark:text-purple-400 mt-0.5 truncate`}>
                      다분할 레이아웃 자동 좌표 계산 및 헐리우드 색보정
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl ${ui.innerCard} flex flex-col gap-2.5`}>
                    <h5 className={`text-[13.5px] font-black ${ui.textMain}`}>
                      📐 1-클릭 비디오월 멀티 그리드 프리셋
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-bold">
                      <div className="p-2.5 bg-stone-100/90 dark:bg-black/40 rounded-xl border border-stone-200 dark:border-white/5 flex flex-col gap-0.5">
                        <span className="text-cyan-700 dark:text-[#00E5FF] font-black text-[12px] block">상하 2분할 릴스</span>
                        <span className="text-stone-600 dark:text-zinc-400 text-[10.5px] leading-snug break-keep">화면 상/하 50% 분할 배치</span>
                      </div>
                      <div className="p-2.5 bg-stone-100/90 dark:bg-black/40 rounded-xl border border-stone-200 dark:border-white/5 flex flex-col gap-0.5">
                        <span className="text-cyan-700 dark:text-[#00E5FF] font-black text-[12px] block">3단 시네마틱</span>
                        <span className="text-stone-600 dark:text-zinc-400 text-[10.5px] leading-snug break-keep">상/중/하 3단 스토리 스트립</span>
                      </div>
                      <div className="p-2.5 bg-stone-100/90 dark:bg-black/40 rounded-xl border border-stone-200 dark:border-white/5 flex flex-col gap-0.5">
                        <span className="text-cyan-700 dark:text-[#00E5FF] font-black text-[12px] block">2x2 쿼드 비디오월</span>
                        <span className="text-stone-600 dark:text-zinc-400 text-[10.5px] leading-snug break-keep">4개 미디어 동시 재생 매트릭스</span>
                      </div>
                      <div className="p-2.5 bg-stone-100/90 dark:bg-black/40 rounded-xl border border-stone-200 dark:border-white/5 flex flex-col gap-0.5">
                        <span className="text-cyan-700 dark:text-[#00E5FF] font-black text-[12px] block">플로팅 PIP (화면속화면)</span>
                        <span className="text-stone-600 dark:text-zinc-400 text-[10.5px] leading-snug break-keep">메인 배경 + 코너 미니 오버레이</span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl ${ui.innerCard} flex flex-col gap-2.5`}>
                    <h5 className={`text-[13.5px] font-black ${ui.textMain}`}>
                      🌈 다빈치 리졸브 3-Way 컬러 그레이딩
                    </h5>
                    <ul className={`text-[12px] ${ui.textSub} font-medium space-y-1.5 leading-relaxed break-keep`}>
                      <li>• <b>Lift / Gamma / Gain</b>: 암부, 중간톤, 하이라이트 원형 색상환 터치 조절.</li>
                      <li>• <b>켈빈 색온도 (2500K~9500K)</b>: 차가운 블루톤부터 앰버 골드 웜톤까지 실시간 캘리브레이션.</li>
                      <li>• <b>틴트 & 다이내믹 레인지</b>: 그린/마젠타 화이트 밸런스 및 하이라이트 억제/섀도우 부스팅.</li>
                      <li>• <b>8종 시네마틱 LUT</b>: 틸&오렌지, 코닥 200, 후지 에테르나 원터치 주입.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 키네틱 타이포 & 프롬프터 & 매직 마스크 */}
              <div className={`p-5 sm:p-6 rounded-3xl border ${ui.cardBg} flex flex-col gap-4 shadow-sm`}>
                <div className="flex items-center gap-3 border-b pb-4 border-stone-200/80 dark:border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 flex items-center justify-center text-xl font-black shrink-0">✨</div>
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-[17px] font-black ${ui.textMain} tracking-tight break-keep leading-snug`}>
                      CHAPTER 04. 키네틱 타이포그래피 & 음성인식 프롬프터 & 매직 마스크
                    </h4>
                    <p className={`text-[12px] font-bold text-rose-700 dark:text-rose-400 mt-0.5 truncate`}>
                      AI 자동 자막 생성, 빔스플리터 거울 반전 프롬프터, 5대 누끼 컷아웃 마스킹
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className={`p-4 rounded-2xl ${ui.innerCard} flex flex-col gap-2`}>
                    <span className="text-xs font-black text-cyan-700 dark:text-[#00E5FF] font-mono">01. KINETIC TEXT</span>
                    <h6 className={`text-[13px] font-bold ${ui.textMain}`}>키네틱 모션 타이포</h6>
                    <p className={`text-[11.5px] ${ui.textSub} leading-relaxed font-medium break-keep`}>
                      타이프라이터, 바운스 팝인, 슬라이드업, 블러 시네마 모션과 성경 구절 자동 검색 완성, 외곽선 및 백드롭 박스 지원.
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl ${ui.innerCard} flex flex-col gap-2`}>
                    <span className="text-xs font-black text-amber-700 dark:text-amber-400 font-mono">02. TELEPROMPTER</span>
                    <h6 className={`text-[13px] font-bold ${ui.textMain}`}>음성인식 프롬프터</h6>
                    <p className={`text-[11.5px] ${ui.textSub} leading-relaxed font-medium break-keep`}>
                      촬영 중 말하는 음성을 STT로 실시간 분석하여 타임라인 자막과 오디오로 자동 배치. 3초 카운트다운, 빔스플리터 거울 반전 완비.
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl ${ui.innerCard} flex flex-col gap-2`}>
                    <span className="text-xs font-black text-rose-700 dark:text-rose-400 font-mono">03. MAGIC MASK</span>
                    <h6 className={`text-[13px] font-bold ${ui.textMain}`}>매직 마스크 누끼 컷아웃</h6>
                    <p className={`text-[11.5px] ${ui.textSub} leading-relaxed font-medium break-keep`}>
                      브러시, 펜툴 다각형, 타원, 직사각형, 리니어 그라디언트 5대 도구로 피사체 누끼 컷아웃 및 실시간 알파 매트 렌더링.
                    </p>
                  </div>
                </div>
              </div>

              {/* 원클릭 마스터 액션 배너 */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${ui.cardBg} flex flex-col sm:flex-row justify-between sm:items-center gap-3.5 shadow-xs bg-gradient-to-r from-amber-50/70 to-stone-50/90 dark:from-stone-900/60 dark:to-black/80 border-amber-200/80 dark:border-white/10`}>
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <span className="text-xs font-black text-amber-700 dark:text-[#00E5FF] font-mono">ONE-CLICK AI MASTER</span>
                  <h4 className={`text-[14.5px] font-bold ${ui.textMain}`}>AI 마법봉 디렉터 프로 (One-Click Reels Master)</h4>
                  <p className={`text-[12px] ${ui.textSub} leading-relaxed font-medium break-keep`}>
                    클립 구도 9:16 리프레이밍, 3초 바이럴 후크 펀치 줌인, 시네마틱 필름 룩, 칼박 비트 점프컷을 원클릭으로 일괄 자동 조율합니다.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveScreen && setActiveScreen('reelsStudio')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C59B51] to-amber-600 text-black font-black text-xs cursor-pointer shadow-md active:scale-95 transition-all shrink-0 flex items-center justify-center gap-1.5"
                >
                  <IconWand /> AI 마법봉 릴스 제작하기
                </button>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 🚀 [탭 3] 원스트림(One-Stream) 연동 가이드 (100% 완전 보존)                 */}
          {/* ========================================================================= */}
          {activeTab === 'oneStream' && (
            <div className="flex flex-col gap-4">
              <div className={`p-4 sm:p-5 rounded-2xl border ${ui.cardBg} flex flex-col sm:flex-row justify-between sm:items-center gap-3.5 shadow-xs`}>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300 font-mono">
                      ONE-STREAM CONTEXT FLOW
                    </span>
                    <span className="text-[11px] font-medium text-stone-400">0-Click 실시간 동기화</span>
                  </div>
                  <h3 className={`text-[16.5px] font-bold ${ui.textMain} tracking-tight`}>페이지 이동 없는 심리스(Seamless) 신앙 여정</h3>
                  <p className={`text-[12px] font-medium ${ui.textSub} leading-relaxed break-keep`}>
                    메뉴를 뒤로 가며 찾아 헤맬 필요 없이, 한 화면에서 묵상·실천·기도·상담이 물 흐르듯 실시간으로 연결됩니다.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveScreen && setActiveScreen('qt')} 
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-[12px] shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  매일 QT에서 체험하기 <IconChevronRight />
                </button>
              </div>

              {/* 기능 1 */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${ui.cardBg} flex flex-col gap-3`}>
                <div className="flex items-center justify-between border-b pb-2.5 border-dashed border-stone-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-white/10 text-stone-800 dark:text-white flex items-center justify-center text-[11px] font-bold">1</span>
                    <h4 className={`text-[14px] font-bold ${ui.textMain}`}>인라인 액션 허브 (Inline Action Engine)</h4>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300">QT·설교 공통</span>
                </div>
                
                <p className={`text-[12.5px] font-medium leading-relaxed ${ui.textSub} break-keep`}>
                  매일 QT와 주일 예배노트 작성창 바로 밑에는 3개의 마이크로 원터치 버튼이 배치되어 있습니다. 묵상 노트를 닫거나 화면을 이동하지 않고도 0.1초 만에 다른 시스템으로 은혜를 전달합니다:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-1">
                  <div className={`p-3.5 rounded-xl border flex flex-col gap-1 ${ui.innerCard}`}>
                    <span className="text-[11.5px] font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                      🌿 트래커에 실천 심기
                    </span>
                    <p className="text-[11.5px] text-stone-500 leading-snug font-medium">
                      오늘 결단한 행동 목표가 [적용 트래커]로 즉시 심기며 터치로 완료 체크 가능
                    </p>
                  </div>
                  <div className={`p-3.5 rounded-xl border flex flex-col gap-1 ${ui.innerCard}`}>
                    <span className="text-[11.5px] font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                      🙏 나의 기도함에 저장
                    </span>
                    <p className="text-[11.5px] text-stone-500 leading-snug font-medium">
                      묵상 중 떠오른 회개와 결단이 [기도 보관함] DB로 전송되어 평생 아카이빙
                    </p>
                  </div>
                  <div className={`p-3.5 rounded-xl border flex flex-col gap-1 ${ui.innerCard}`}>
                    <span className="text-[11.5px] font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                      💌 1:1 심층상담 요청
                    </span>
                    <p className="text-[11.5px] text-stone-500 leading-snug font-medium">
                      어려운 구절과 죄의 고민이 담당 사역자에게 비공개로 직접 접수
                    </p>
                  </div>
                </div>
              </div>

              {/* 기능 2 */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${ui.cardBg} flex flex-col gap-3`}>
                <div className="flex items-center justify-between border-b pb-2.5 border-dashed border-stone-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-white/10 text-stone-800 dark:text-white flex items-center justify-center text-[11px] font-bold">2</span>
                    <h4 className={`text-[14px] font-bold ${ui.textMain}`}>글로벌 사이드시트 서랍장 (Side Sheet Drawer)</h4>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300">화면 이탈 ZERO</span>
                </div>

                <p className={`text-[12.5px] font-medium leading-relaxed ${ui.textSub} break-keep`}>
                  매일 QT와 예배노트 상단 우측의 <code>🌿 트래커</code>, <code>🙏 기도함</code> 버튼을 누르면, 읽고 있던 성경 본문을 가리지 않고 화면 우측에서 서랍처럼 슬라이드로 패널이 열립니다. 기도제목을 확인하고 트래커를 체크한 뒤 닫기만 하면 이전 묵상 자리로 즉시 복귀합니다.
                </p>
              </div>

              {/* 기능 3 */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${ui.cardBg} flex flex-col gap-3`}>
                <div className="flex items-center justify-between border-b pb-2.5 border-dashed border-stone-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-white/10 text-stone-800 dark:text-white flex items-center justify-center text-[11px] font-bold">3</span>
                    <h4 className={`text-[14px] font-bold ${ui.textMain}`}>1:1 심층 신앙 상담 & 사역자 피드백 루프</h4>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-stone-800 text-white font-mono">2-WAY SYNC</span>
                </div>

                <p className={`text-[12.5px] font-medium leading-relaxed ${ui.textSub} break-keep`}>
                  성도가 상담을 요청하면 관리자 콘솔의 <b>[💌 1:1 심층 상담실]</b>에 알림과 함께 즉각 등록됩니다. 사역자가 기도로 묵상하며 성경적 권면과 답글을 입력하는 순간, 성도의 QT 본문 하단에 <b>"목자님의 답변 도착"</b> 알림과 함께 답변이 실시간으로 노출됩니다.
                </p>
              </div>

              {/* 기능 4 */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${ui.cardBg} flex flex-col gap-3`}>
                <div className="flex items-center justify-between border-b pb-2.5 border-dashed border-stone-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-white/10 text-stone-800 dark:text-white flex items-center justify-center text-[11px] font-bold">4</span>
                    <h4 className={`text-[14px] font-bold ${ui.textMain}`}>Q·M·T 3대 루틴 백엔드 자동 취합</h4>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300">실시간 출석</span>
                </div>

                <p className={`text-[12.5px] font-medium leading-relaxed ${ui.textSub} break-keep`}>
                  성도가 <b>QT(Q)</b>를 작성하고, <b>맥체인(M)</b> 성경을 완독하고, <b>감사(T)</b>를 전송하면, 별도의 저장 작업 없이 백엔드 DB(<code>attendance_records</code>)로 즉시 전송됩니다. 목장 모임 주간 체크표와 관리자 출석 관제판 양쪽에 보라, 파랑, 골드 불빛이 실시간으로 점등됩니다.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 🏛️ [탭 4] 교회 행정·재정 거버넌스 4종 ERP 센터 (100% 완전 보존)           */}
          {/* ========================================================================= */}
          {activeTab === 'erpSuite' && (
            <div className="flex flex-col gap-5 sm:gap-6">
              
              <div className={`p-5 sm:p-6 rounded-3xl border ${ui.cardBg} flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-transparent`}>
                <div className="flex flex-col gap-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono tracking-widest uppercase">
                      Core ERP Engine
                    </span>
                    <span className="text-[11.5px] font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1"><IconShield /> 엔터프라이즈급 무결성</span>
                  </div>
                  <h3 className={`text-[19px] sm:text-[21px] font-black ${ui.textMain} tracking-tight`}>교회 행정·재정 거버넌스 4종 ERP 상세 매뉴얼</h3>
                  <p className={`text-[13px] font-medium ${ui.textSub} leading-relaxed break-keep mt-1`}>
                    외부 회계 감사와 교단 보고를 완벽하게 통과할 수 있도록 설계된 복식부기 재무원장, 인터랙티브 간트 공정 타임라인, 거버넌스 회의록, 목양 케어 CRM의 세부 작동 원리 및 사용 가이드입니다.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveScreen && setActiveScreen('adminConsole')} 
                  className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white font-black text-[13px] shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  관리자 콘솔 즉시 이동 <IconChevronRight />
                </button>
              </div>

              {/* 1. 재무·예산 원장 */}
              <div className={`p-5 sm:p-6 rounded-3xl border ${ui.cardBg} flex flex-col gap-4 shadow-sm relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />
                
                <div className="flex items-center gap-3 border-b pb-4 border-slate-100 dark:border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-black shrink-0">📊</div>
                  <div>
                    <h4 className={`text-[17px] font-black ${ui.textMain} tracking-tight`}>1. 재무·예산 원장 (Financial Ledger)</h4>
                    <p className={`text-[12px] font-bold text-emerald-600 dark:text-emerald-500 mt-0.5`}>글로벌 표준 복식부기(Double-Entry) 코어 엔진 탑재</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl ${ui.innerCard} flex flex-col gap-3`}>
                    <h5 className="text-[13.5px] font-black text-stone-800 dark:text-slate-200 flex items-center gap-1.5"><IconCalculator /> 핵심 회계 원리 및 구조</h5>
                    <ul className="text-[12.5px] text-stone-600 dark:text-slate-400 font-medium space-y-2.5 leading-relaxed">
                      <li>
                        <strong className="text-emerald-700 dark:text-emerald-400">대차평균의 원리 (차대 일치):</strong> 전표 기장 시 반드시 <code>차변 합계 = 대변 합계</code>가 1원 단위까지 정확히 일치해야 합니다. 불일치 시 시스템에서 원천적으로 발행(저장)을 차단하여 휴먼 에러를 방지합니다.
                      </li>
                      <li>
                        <strong className="text-emerald-700 dark:text-emerald-400">재무상태표 (B/S) 등식:</strong> 모든 분개는 즉시 <code>총 자산 = 부채 + 자본 + 당기순이익</code> 공식에 따라 실시간 B/S로 집계됩니다.
                      </li>
                      <li>
                        <strong className="text-emerald-700 dark:text-emerald-400">수지운영표 (P&L):</strong> 교회 특성에 맞춘 계정과목표(COA)를 기반으로 <code>수익(400번대) - 비용(500번대) = 당기순이익</code>이 별도 탭에서 자동 산출됩니다.
                      </li>
                    </ul>
                  </div>

                  <div className={`p-4 rounded-2xl ${ui.innerCard} flex flex-col gap-3`}>
                    <h5 className="text-[13.5px] font-black text-stone-800 dark:text-slate-200 flex items-center gap-1.5"><IconBriefcase /> 전표 조작 및 역분개(Audit Trail)</h5>
                    <ul className="text-[12.5px] text-stone-600 dark:text-slate-400 font-medium space-y-2.5 leading-relaxed">
                      <li>
                        <strong className="text-stone-800 dark:text-stone-200">다중 분개(N:M) 입력:</strong> 단순 1:1 거래창이 아닙니다. <code>[+ 라인 추가]</code> 버튼으로 차변(비용 등)과 대변(결제통장 등)을 무한대로 쪼개어 복합 전표를 발행할 수 있습니다.
                      </li>
                      <li>
                        <strong className="text-stone-800 dark:text-stone-200">역분개(Reverse Entry) 취소:</strong> 기장된 전표는 회계 무결성을 위해 <b>영구 삭제(Hard Delete)가 불가능</b>합니다. 수정/취소가 필요할 경우 <code>[(-) 역분개 취소 전표 발행]</code> 버튼을 누르면 시스템이 자동으로 차/대변을 스왑한 마이너스 전표를 발행하여 투명한 감사 궤적(Audit Trail)을 남깁니다.
                      </li>
                      <li>
                        <strong className="text-stone-800 dark:text-stone-200">예산 통제:</strong> 예산대사 탭에서 부서별 예산을 편성하면, 분개 시 해당 부서를 태깅할 때마다 실집행액과 가용 잔액이 실시간 연동되어 게이지가 차오릅니다.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 2. 사역 공정 관제 */}
              <div className={`p-5 sm:p-6 rounded-3xl border ${ui.cardBg} flex flex-col gap-4 shadow-sm relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
                
                <div className="flex items-center gap-3 border-b pb-4 border-slate-100 dark:border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-black shrink-0">📅</div>
                  <div>
                    <h4 className={`text-[17px] font-black ${ui.textMain} tracking-tight`}>2. 전사 사역 공정 관제 (Gantt PM)</h4>
                    <p className={`text-[12px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5`}>드래그 앤 드롭 지원 인터랙티브 간트 & 칸반 보드</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl ${ui.innerCard} flex flex-col gap-3`}>
                    <h5 className="text-[13.5px] font-black text-stone-800 dark:text-slate-200 flex items-center gap-1.5">📈 인터랙티브 간트 (Interactive Gantt)</h5>
                    <ul className="text-[12.5px] text-stone-600 dark:text-slate-400 font-medium space-y-2.5 leading-relaxed">
                      <li>
                        <strong className="text-indigo-700 dark:text-indigo-400">마우스 드래그 날짜 변경:</strong> 간트 막대그래프의 <b>중앙을 잡고 끌면(Move) 전체 일정이 이동</b>하며, <b>좌우 끝을 잡고 끌면(Resize) 기간이 단축/연장</b>되어 즉시 DB에 저장됩니다.
                      </li>
                      <li>
                        <strong className="text-indigo-700 dark:text-indigo-400">의존성 도미노 시프트 (Dependencies):</strong> 신규 프로젝트 생성 시 '선행 조건'을 걸어두면, <b>선행 일정을 마우스로 뒤로 미룰 때 연결된 후행 일정들이 도미노처럼 자동으로 뒤로 밀려납니다.</b>
                      </li>
                    </ul>
                  </div>

                  <div className={`p-4 rounded-2xl ${ui.innerCard} flex flex-col gap-3`}>
                    <h5 className="text-[13.5px] font-black text-stone-800 dark:text-slate-200 flex items-center gap-1.5">🗂️ WBS 및 칸반 보드 (Kanban Board)</h5>
                    <ul className="text-[12.5px] text-stone-600 dark:text-slate-400 font-medium space-y-2.5 leading-relaxed">
                      <li>
                        <strong className="text-stone-800 dark:text-stone-200">드래그 앤 드롭 페이즈 이동:</strong> 칸반 보드에서 카드를 마우스로 쥐고 다른 공정(Phase) 열로 옮기거나, 같은 열 안에서 위아래로 순서를 정렬할 수 있습니다.
                      </li>
                      <li>
                        <strong className="text-stone-800 dark:text-stone-200">마이크로 태스크 (WBS):</strong> 하위 체크리스트 항목마다 별도의 담당자와 개별 마감일을 지정할 수 있으며, 체크 시 메인 <b>진행률(%) 게이지가 자동으로 연동되어 상승</b>합니다.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 3. 회의록 아카이브 */}
              <div className={`p-5 sm:p-6 rounded-3xl border ${ui.cardBg} flex flex-col gap-4 shadow-sm relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />
                
                <div className="flex items-center gap-3 border-b pb-4 border-slate-100 dark:border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-black shrink-0">📝</div>
                  <div>
                    <h4 className={`text-[17px] font-black ${ui.textMain} tracking-tight`}>3. 회의록 아카이브 (Governance)</h4>
                    <p className={`text-[12px] font-bold text-amber-600 dark:text-amber-400 mt-0.5`}>위원회별 공식 의안 통과 및 전자 결재 시스템</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl ${ui.innerCard} flex flex-col gap-3`}>
                    <h5 className="text-[13.5px] font-black text-stone-800 dark:text-slate-200 flex items-center gap-1.5">⚖️ 동적 위원회 및 표결 관리</h5>
                    <ul className="text-[12.5px] text-stone-600 dark:text-slate-400 font-medium space-y-2.5 leading-relaxed">
                      <li>
                        <strong className="text-amber-700 dark:text-amber-400">동적 회의체 입력:</strong> 상정 폼에서 '부서' 입력칸은 기존 부서를 드롭다운으로 추천해주면서도, <b>원하는 새로운 위원회 이름을 텍스트로 자유롭게 쳐서 즉시 생성</b>할 수 있는 Datalist 구조입니다.
                      </li>
                      <li>
                        <strong className="text-amber-700 dark:text-amber-400">의결 분석 매트릭스:</strong> 찬성/반대/기권 숫자를 기입하면 즉시 프로그레스 바(가결률)로 렌더링 되며, <code>[의결 분석]</code> 탭에서 각 위원회별 상정 대비 통과율을 AI가 자동 집계합니다.
                      </li>
                    </ul>
                  </div>

                  <div className={`p-4 rounded-2xl ${ui.innerCard} flex flex-col gap-3`}>
                    <h5 className="text-[13.5px] font-black text-stone-800 dark:text-slate-200 flex items-center gap-1.5">🔏 전자 직인 및 실행 관제</h5>
                    <ul className="text-[12.5px] text-stone-600 dark:text-slate-400 font-medium space-y-2.5 leading-relaxed">
                      <li>
                        <strong className="text-stone-800 dark:text-stone-200">전자 직인 날인:</strong> 회의록 팝업 하단의 <code>[공식 전자 직인 날인]</code> 버튼을 누르면 문서 우측 상단에 붉은색 도장(인영)이 실제 종이에 찍힌 것처럼 기울어져 표시됩니다.
                      </li>
                      <li>
                        <strong className="text-stone-800 dark:text-stone-200">실행 보드 (Action Tracker):</strong> 회의록에서 파생된 후속 실행 과제들을 <code>[실행 보드]</code> 탭에서 별도로 모아보고 원클릭으로 완료(Done) 처리할 수 있습니다.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 4. 목회 기도·감사 요약 */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${ui.cardBg} flex flex-col sm:flex-row justify-between sm:items-center gap-3.5 shadow-xs`}>
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center text-base font-black shrink-0">📖</span>
                    <h3 className={`text-[16px] font-black ${ui.textMain} tracking-tight`}>4. 목회 기도·감사 (Pastoral CRM)</h3>
                  </div>
                  <p className={`text-[12px] font-medium ${ui.textSub} leading-relaxed break-keep mt-0.5`}>
                    교구 성도들의 개인 기도제목(기도 보관함 데이터)과 감사 일기, 심방 내역이 하나의 통합 타임라인으로 수집되어 목회자의 심방 전 사전 진단 및 히스토리 트래킹을 완벽하게 지원합니다.
                  </p>
                </div>
              </div>

            </div>
          )}
          {/* ========================================================================= */}
          {/* 📖 [탭 5] 공동체 QT & 목사님 나눔 상세 바이블                             */}
          {/* ========================================================================= */}
          {activeTab === 'qtCommunity' && (
            <div className="flex flex-col gap-4">
              
              <div className={`p-4 sm:p-5 rounded-2xl border ${ui.cardBg} flex flex-col sm:flex-row justify-between sm:items-center gap-3.5 shadow-xs`}>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300 font-mono">
                      COMMUNITY QT SQUARE
                    </span>
                    <span className="text-[11px] font-medium text-stone-400">매일 QT 내 전교인 영적 광장</span>
                  </div>
                  <h3 className={`text-[16.5px] font-bold ${ui.textMain} tracking-tight`}>함께 묵상하고 함께 답을 찾는 QT</h3>
                  <p className={`text-[12px] font-medium ${ui.textSub} leading-relaxed break-keep`}>
                    혼자만의 묵상을 넘어, 그날의 본문 아래에서 성도들과 삶을 나누고 목사님의 해석과 권면을 마주합니다.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveScreen && setActiveScreen('qt')} 
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-[12px] shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  매일 QT 나눔터 열기 <IconChevronRight />
                </button>
              </div>

              {/* 기능 1 */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${ui.cardBg} flex flex-col gap-3`}>
                <div className="flex items-center justify-between border-b pb-2.5 border-dashed border-stone-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-white/10 text-stone-800 dark:text-white flex items-center justify-center text-[11px] font-bold">1</span>
                    <h4 className={`text-[14px] font-bold ${ui.textMain}`}>나의 묵상 올리기 & 본문 자동완성 질문</h4>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300">실시간 연동</span>
                </div>
                
                <p className={`text-[12.5px] font-medium leading-relaxed ${ui.textSub} break-keep`}>
                  그날의 본문과 QT 제목이 자동으로 동기화됩니다. 본문을 읽으며 해석이 어렵거나 궁금한 점은 <b>[이 부분이 어려워요]</b>에 기록하고, 깨달은 은혜는 <b>[나의 묵상 나눔 및 삶의 적용]</b>에 작성합니다.
                </p>

                <div className="p-3 rounded-xl bg-stone-50 dark:bg-black/30 border border-stone-200/80 dark:border-white/10 flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-stone-800 dark:text-white">성경 본문 스페이스바 자동완성</span>
                  <div className="flex items-center gap-2 text-[11.5px] text-stone-600 dark:text-stone-300 font-mono">
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-white/10 border border-stone-200 dark:border-white/10 font-bold">신명기 22:13</span>
                    <span>입력 후 스페이스바 ➜ 성경 본문 박스 자동 삽입</span>
                  </div>
                </div>
              </div>

              {/* 기능 2 */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${ui.cardBg} flex flex-col gap-3`}>
                <div className="flex items-center justify-between border-b pb-2.5 border-dashed border-stone-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-stone-800 text-white flex items-center justify-center text-[11px] font-bold">2</span>
                    <h4 className={`text-[14px] font-bold ${ui.textMain}`}>목사님 말씀 나눔 & 상단 고정 가이드</h4>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-stone-800 text-white">사역자 전용</span>
                </div>

                <p className={`text-[12.5px] font-medium leading-relaxed ${ui.textSub} break-keep`}>
                  관리자 시스템에서 '목사' 직책으로 지정된 계정만 <b>[목사님 말씀 나눔 쓰기]</b> 버튼이 활성화됩니다. 목사님께서 들려주시는 <b>[오늘의 QT 해석]</b>과 <b>[목양 권면 이야기]</b>는 전체 성도 나눔 탭 최상단에 상시 고정(Pinned)되어 전교인의 묵상 길잡이가 됩니다.
                </p>
              </div>

              {/* 기능 3 */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${ui.cardBg} flex flex-col gap-3`}>
                <div className="flex items-center justify-between border-b pb-2.5 border-dashed border-stone-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-white/10 text-stone-800 dark:text-white flex items-center justify-center text-[11px] font-bold">3</span>
                    <h4 className={`text-[14px] font-bold ${ui.textMain}`}>은혜와 공감 & 계층형 답글(대댓글)</h4>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300">영적 교제</span>
                </div>

                <p className={`text-[12.5px] font-medium leading-relaxed ${ui.textSub} break-keep`}>
                  은혜받은 지체의 글에 <b>[은혜와 공감]</b>을 눌러 격려하고, 궁금한 점이나 마음에 와닿은 내용에는 <b>[답글]</b>을 눌러 대댓글을 작성할 수 있습니다.
                </p>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 🕊️ [탭 6] 오늘의 묵상 여정 5단계 리터지 예배                             */}
          {/* ========================================================================= */}
          {activeTab === 'pilgrimage' && (
            <div className="flex flex-col gap-4">
              
              <div className={`p-4 sm:p-5 rounded-2xl border ${ui.cardBg} flex flex-col sm:flex-row justify-between sm:items-center gap-3.5 shadow-xs`}>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300 font-mono">
                      LITURGY OF THE DAY
                    </span>
                    <span className="text-[11px] font-medium text-stone-400">일상을 멈추고 주 앞에 머무름</span>
                  </div>
                  <h3 className={`text-[16.5px] font-bold ${ui.textMain} tracking-tight`}>오늘의 묵상 여정 5단계 예배</h3>
                  <p className={`text-[12px] font-medium ${ui.textSub} leading-relaxed break-keep`}>
                    잔잔한 피아노 찬양 선율 속에서 침묵, 말씀, 골방 기도, 중보, 파송으로 이어지는 거룩한 5단계 여정입니다.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveScreen && setActiveScreen('meditationPilgrimage')} 
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-[12px] shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  묵상 여정 시작 <IconChevronRight />
                </button>
              </div>

              {/* 5단계 순서 도식화 */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center">
                {[
                  { num: '01', title: '침묵과 정돈', desc: '60초 호흡 침묵' },
                  { num: '02', title: '말씀 직면', desc: '랜덤 성경 말씀' },
                  { num: '03', title: '골방 기도', desc: '연약함 토설과 결단' },
                  { num: '04', title: '중보의 연대', desc: '공동체 중보 릴레이' },
                  { num: '05', title: '안식과 파송', desc: '삶의 자리로 전진' }
                ].map((st, i) => (
                  <div key={i} className={`p-3 rounded-xl border flex flex-col gap-1 ${ui.innerCard}`}>
                    <span className="text-[10px] font-mono font-bold text-stone-400">{st.num}</span>
                    <span className="text-[12px] font-bold text-stone-800 dark:text-white">{st.title}</span>
                    <span className="text-[10px] text-stone-500 font-medium">{st.desc}</span>
                  </div>
                ))}
              </div>

              <div className={`p-4 sm:p-5 rounded-2xl border ${ui.cardBg} flex flex-col gap-2.5`}>
                <h4 className={`text-[13.5px] font-bold ${ui.textMain}`}>묵상 여정의 특징</h4>
                <ul className="text-[12px] font-medium space-y-1.5 text-stone-600 dark:text-stone-300 leading-relaxed">
                  <li>• <b>잔잔한 피아노 찬양 배경음악</b>: 첫 화면 터치 시 부드러운 피아노 선율이 자동 재생되며 On/Off 조절 가능</li>
                  <li>• <b>새로운 말씀의 조명</b>: 접속할 때마다 전체 성경 중 새로운 구절이 랜덤 조명되어 신선한 은혜 공급</li>
                  <li>• <b>하늘 보좌 봉헌</b>: 골방 기도를 작성하고 [기도를 주님 손에 올려드립니다]를 누르면 나의 기도로 자동 보관</li>
                </ul>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 👥 [탭 7] 목장 모임 & Today-7일 오토풀링(Auto-Pulling)                       */}
          {/* ========================================================================= */}
          {activeTab === 'cellManual' && (
            <div className="flex flex-col gap-4">
              
              <div className={`p-4 sm:p-5 rounded-2xl border ${ui.cardBg} flex flex-col sm:flex-row justify-between sm:items-center gap-3.5 shadow-xs`}>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300 font-mono">
                      CELL & AUTO-PULLING
                    </span>
                    <span className="text-[11px] font-medium text-stone-400">Today - 7일 집계 나눔</span>
                  </div>
                  <h3 className={`text-[16.5px] font-bold ${ui.textMain} tracking-tight`}>스마트 목장 나눔 & 오토풀링(Auto-Pulling)</h3>
                  <p className={`text-[12px] font-medium ${ui.textSub} leading-relaxed break-keep`}>
                    지난 한 주간의 QT 베스트 묵상, 감사 고백, 기도제목이 나눔지에 자동으로 요약되어 기다립니다.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveScreen && setActiveScreen('cell')} 
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-[12px] shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  내 목장 이동하기 <IconChevronRight />
                </button>
              </div>

              {/* 7일 오토풀링 핵심 원리 */}
              <div className={`p-4 rounded-2xl border border-stone-200 dark:border-white/10 bg-stone-50/80 dark:bg-black/20 flex flex-col gap-2`}>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-bold text-stone-800 dark:text-stone-200">
                    ✨ Today - 7일 은혜 발자취 자동 요약 (오토풀링)
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">1-Click Auto Fill</span>
                </div>
                <p className="text-[12px] text-stone-600 dark:text-stone-400 leading-relaxed font-medium">
                  목장 모임 요일이 화요일이든 토요일이든 상관없습니다. 목장 탭에 들어가 <b>[🚀 이 내용으로 나눔지 자동 완성하기]</b>를 누르면 지난 7일 동안 내가 기록한 말씀 묵상 한 줄, 감사 일기, 개인 기도제목이 나눔 양식에 스스로 채워집니다. 모임 자리에서 복사·붙여넣기를 할 필요가 없습니다.
                </p>
              </div>

              {/* 역할별 제출 체계 도식 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`p-4 rounded-2xl border flex flex-col gap-1.5 ${ui.cardBg}`}>
                  <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-white/10 text-stone-800 dark:text-stone-200 w-max">일반 성도 (목원)</span>
                  <h4 className="text-[13.5px] font-bold text-stone-800 dark:text-white">[나눔지 제출] 버튼</h4>
                  <p className="text-[11.5px] text-stone-500 leading-relaxed font-medium">
                    말씀·감사·기도제목을 작성 후 제출하면 목장 식구들의 모임지 일체에 취합되어 목자에게 전달됩니다.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border flex flex-col gap-1.5 ${ui.cardBg}`}>
                  <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-stone-800 text-white w-max">목자 / 부목자</span>
                  <h4 className="text-[13.5px] font-bold text-stone-800 dark:text-white">[주간 목장 보고서 제출] 버튼</h4>
                  <p className="text-[11.5px] text-stone-500 leading-relaxed font-medium">
                    목장 전체 중보기도와 식구들의 나눔이 자동 취합되며, 제출 시 상단 <b>[모임지]</b> 아카이브에 영구 저장됩니다.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 🌱 [탭 8] 영적 성장 파이프라인 (100% 완전 보존)                             */}
          {/* ========================================================================= */}
          {activeTab === 'roadmap' && (
            <div className="flex flex-col gap-4">
              
              <div className={`p-4 rounded-2xl border ${ui.cardBg} flex flex-col gap-1 shadow-xs`}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300 font-mono">
                    Spiritual Architecture
                  </span>
                  <span className="text-[11px] font-medium text-stone-400">데이터 순환 설계</span>
                </div>
                <h3 className={`text-[16px] font-bold ${ui.textMain} leading-tight`}>
                  어떻게 기록이 삶의 예배와 구속사적 회복으로 이어지는가
                </h3>
                <p className={`text-[12px] font-medium leading-relaxed ${ui.textSub} break-keep`}>
                  좋은나무 앱은 기능이 따로 노는 단순 메모장이 아닙니다. 매일 아침의 <b>QT 기록(Input)</b>이 삶의 고난을 해석하는 <b>해석의 렌즈(Analyze)</b>를 거쳐 공동체와 성도들에게 흘러가는 <b>공동체적 선순환(Share)</b> 구조로 정밀하게 설계되어 있습니다.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {roadmapSteps.map((step, idx) => (
                  <div key={idx} className={`p-4 sm:p-5 rounded-2xl border ${ui.cardBg} flex flex-col gap-3 relative overflow-hidden`}>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b pb-2.5 border-dashed border-stone-200 dark:border-white/10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 flex items-center justify-center shrink-0 shadow-xs">
                          {step.icon}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`text-[9.5px] font-bold tracking-widest uppercase w-max px-2 py-0.5 rounded-md ${step.tagColor}`}>
                            {step.step}
                          </span>
                          <h4 className={`text-[14.5px] font-bold ${ui.textMain} mt-0.5 truncate`}>
                            {step.title}
                          </h4>
                        </div>
                      </div>
                      <span className="text-[11px] text-stone-400 truncate">
                        {step.subtitle}
                      </span>
                    </div>

                    <p className={`text-[12px] font-medium leading-relaxed ${ui.textSub} break-keep`}>
                      {step.desc}
                    </p>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-stone-400">연동되는 핵심 기능</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {step.pipeline.map((p, pIdx) => (
                          <div key={pIdx} className={`p-2.5 rounded-xl border flex flex-col justify-between gap-1 ${ui.innerCard}`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-[11.5px] font-bold ${ui.textMain}`}>{p.name}</span>
                              <span className="text-[9px] text-stone-400">동기화</span>
                            </div>
                            <p className="text-[10.5px] text-stone-500 leading-snug font-medium break-keep">
                              {p.role}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <span className="text-[11px] font-medium text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                        <IconCheck /> {step.flowOutput}
                      </span>
                      <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                        {step.actions.map(btn => (
                          <button 
                            key={btn.id}
                            onClick={() => setActiveScreen && setActiveScreen(btn.id)}
                            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[11px] font-bold transition-transform active:scale-95 flex items-center justify-center gap-1 ${ui.secondaryBg} cursor-pointer`}
                          >
                            {btn.label} <IconChevronRight />
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 🎯 [탭 9] 상황별 성도 맞춤 처방 솔루션 (100% 완전 보존)                     */}
          {/* ========================================================================= */}
          {activeTab === 'context' && (
            <div className="flex flex-col gap-3">
              
              <div className={`p-4 rounded-2xl border ${ui.cardBg} flex flex-col gap-1 shadow-xs`}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300 font-mono">
                    Spiritual Prescription
                  </span>
                  <span className="text-[11px] font-medium text-stone-400">맞춤 처방 가이드</span>
                </div>
                <h3 className={`text-[15.5px] font-bold ${ui.textMain}`}>
                  성도님의 현재 영적 상태에 딱 맞는 기능을 안내합니다
                </h3>
                <p className={`text-[12px] font-medium ${ui.textSub} leading-relaxed break-keep`}>
                  어떤 페이지를 열어야 할지 막막할 때, 내 마음의 상태에 해당하는 카드를 선택하면 최적의 묵상 경로를 즉시 연결해 드립니다.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contextCurations.map((item, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${ui.cardBg}`}>
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                          <span className={item.iconColor}>{item.icon}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.tagColor}`}>
                          {item.tag}
                        </span>
                      </div>

                      <div className="flex flex-col gap-0.5 mt-0.5">
                        <h4 className={`text-[13px] font-bold ${ui.textMain} leading-snug break-keep`}>
                          "{item.situation}"
                        </h4>
                        <span className="text-[10.5px] font-medium text-stone-500 mt-0.5">
                          {item.subtitle}
                        </span>
                      </div>

                      <p className={`text-[11.5px] font-medium leading-relaxed ${ui.textSub} break-keep pt-1.5 border-t border-dashed border-stone-200 dark:border-white/10`}>
                        {item.prescription}
                      </p>

                      <div className={`p-2 rounded-xl border flex flex-col gap-1 mt-0.5 ${ui.innerCard}`}>
                        <span className="text-[9.5px] font-bold uppercase text-stone-400">권장 순종 액션</span>
                        {item.steps.map((st, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-1.5 text-[10.5px] text-stone-700 dark:text-stone-300 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0" />
                            <span className="truncate">{st}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => setActiveScreen && setActiveScreen(item.id)}
                      className={`w-full py-2.5 rounded-xl text-[11px] font-bold transition-all active:scale-98 flex items-center justify-center gap-1.5 ${ui.primaryBg} shadow-xs cursor-pointer mt-1`}
                    >
                      {item.targetFeature} 바로가기 <IconChevronRight />
                    </button>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 🏢 [탭 10] 컨트롤허브(Admin) 사용법 (100% 완전 보존)                       */}
          {/* ========================================================================= */}
          {activeTab === 'controlHub' && (
            <div className="flex flex-col gap-4">
              
              <div className={`p-4 sm:p-5 rounded-2xl border ${ui.cardBg} flex flex-col gap-1.5 shadow-xs`}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300 font-mono">
                    CENTRAL CONTROL TOWER
                  </span>
                  <span className="text-[11px] font-medium text-stone-400">교회 전체 30개 목장 총괄 관리 안내</span>
                </div>
                <h3 className={`text-[16.5px] font-bold ${ui.textMain} tracking-tight`}>좋은나무교회 컨트롤허브 소개</h3>
                <p className={`text-[12px] font-medium ${ui.textSub} leading-relaxed break-keep`}>
                  300여 명 성도의 영적 데이터와 30개 목장의 출석, 성경 완독, 감사 나눔 현황을 실시간으로 조망하고 리더십에게 즉시 공지를 배포하는 중앙 관제 센터의 세부 작동 원리를 안내합니다.
                </p>
              </div>

              {/* 기능 1 */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${ui.cardBg} flex flex-col gap-3`}>
                <div className="flex items-center justify-between border-b pb-2 border-dashed border-stone-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-stone-800 text-white flex items-center justify-center text-[11px] font-bold">1</span>
                    <h4 className={`text-[14px] font-bold ${ui.textMain}`}>목장 총괄 관제실 & 실시간 레포트 열람</h4>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300">실시간 연동</span>
                </div>
                
                <p className={`text-[12px] font-medium leading-relaxed ${ui.textSub} break-keep`}>
                  각 목자들의 모바일 출석 체크와 주간 모임 완료 여부가 실시간 집계됩니다. 테이블 내 <b>[보고서 열람]</b> 버튼을 누르면 제출된 나눔 레포트 전문이 복호화되어 펼쳐지며, <b>[체크표 보기]</b>를 누르면 목원별 7일간의 Q(큐티), M(맥체인), T(감사) 체크표 모달이 즉각 렌더링됩니다.
                </p>
              </div>

              {/* 기능 2 */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${ui.cardBg} flex flex-col gap-3`}>
                <div className="flex items-center justify-between border-b pb-2 border-dashed border-stone-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-stone-800 text-white flex items-center justify-center text-[11px] font-bold">2</span>
                    <h4 className={`text-[14px] font-bold ${ui.textMain}`}>리더십 연합(목자 전용) 공지 단독 배포</h4>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300">타겟 배포</span>
                </div>

                <p className={`text-[12px] font-medium leading-relaxed ${ui.textSub} break-keep`}>
                  일반 성도의 화면에 무차별 노출되지 않고, 오직 목자들과 교역자들의 <b>[리더십 연합]</b> 화면 상단 공지사항란에만 단독 반영됩니다. 목자들은 이를 숙지한 후 본인 목장의 특성에 맞춰 목원들에게 전달합니다.
                </p>
              </div>

              {/* 기능 3 */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${ui.cardBg} flex flex-col gap-3`}>
                <div className="flex items-center justify-between border-b pb-2 border-dashed border-stone-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-stone-800 text-white flex items-center justify-center text-[11px] font-bold">3</span>
                    <h4 className={`text-[14px] font-bold ${ui.textMain}`}>모바일 목자 출석부 & 시뮬레이터</h4>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300">스마트폰 최적화</span>
                </div>

                <p className={`text-[12px] font-medium leading-relaxed ${ui.textSub} break-keep`}>
                  스마트폰으로 접속한 목자에게는 복잡한 관리자 대시보드 대신, 주일·수요·금요·목장 출석을 1초 만에 콕 찍을 수 있는 스마트 출석 체크패드가 자동 렌더링됩니다.
                </p>
              </div>

              {/* 기능 4 */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${ui.cardBg} flex flex-col gap-3`}>
                <div className="flex items-center justify-between border-b pb-2 border-dashed border-stone-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-stone-800 text-white flex items-center justify-center text-[11px] font-bold">4</span>
                    <h4 className={`text-[14px] font-bold ${ui.textMain}`}>1:1 신앙 상담실 & AES-256 종단간 복호화 인박스</h4>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300">암호화 무결성</span>
                </div>

                <p className={`text-[12px] font-medium leading-relaxed ${ui.textSub} break-keep`}>
                  성도들이 보낸 비공개 질문이 암호문으로 깨지지 않고 완전한 평문으로 실시간 복호화되어 수신됩니다. 4대 성구 스니펫(평안, 치유, 지혜, 심방 제안)과 교역자 전용 비공개 인계 메모창을 지원합니다.
                </p>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 💡 [탭 11] 스마트 꿀팁 (100% 완전 보존)                                   */}
          {/* ========================================================================= */}
          {activeTab === 'tips' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {smartTips.map((tip, i) => (
                <div key={i} className={`p-3.5 rounded-2xl border ${ui.cardBg} flex flex-col gap-1.5`}>
                  <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 flex items-center justify-center text-stone-700 dark:text-stone-300">
                    {tip.icon}
                  </div>
                  <h3 className={`text-[13px] font-bold ${ui.textMain}`}>{tip.title}</h3>
                  <p className={`text-[11.5px] font-medium leading-relaxed ${ui.textSub} break-keep`}>{tip.desc}</p>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
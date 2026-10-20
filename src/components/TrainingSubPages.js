// src/components/TrainingSubPages.js
import React, { useState, useEffect, useMemo } from 'react';

// =====================================================================
// 로컬 스토리지 헬퍼 (작성한 모든 묵상, 체크리스트 영구 저장 100% 무손실 보존)
// =====================================================================
const getLocal = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const setLocal = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
};

// =====================================================================
// ✒️ 전문 학술 & SaaS LMS 정밀 헤어라인 SVG 아이콘 세트
// =====================================================================
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><polyline points="15 18 9 12 15 6" /></svg>;
const IconMenu = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const IconSend = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const IconSparkles = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>;
const IconTarget = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;

// 기본 설교 코퍼스 폴백 (실시간 /sermon_summary.json 로드 시 99+편으로 자동 확장)
const FALLBACK_SERMONS = [
  { date: "2026-08-23", type: "주일예배", title: "주의 기업으로, 주의 자녀로 살아가려면", verse: "신명기 9:22-29", keywords: "기업, 자녀, 주권" },
  { date: "2026-08-02", type: "주일예배", title: "제자삼는 사명을 감당하려면", verse: "마태복음 28:16-20", keywords: "대위임령, 사명, 제자" },
  { date: "2026-07-24", type: "금요예배", title: "재앙이 그치고 회복과 부흥이 임하려면", verse: "사무엘하 24:16-25", keywords: "아라우나, 제단, 회복" },
  { date: "2026-07-08", type: "기상오기", title: "바르실래처럼", verse: "사무엘하 19:31-39", keywords: "바르실래, 섬김, 무명" },
  { date: "2026-06-10", type: "기상오기", title: "정죄는 없으나 징계는 있다", verse: "사무엘하 12:10-17", keywords: "원죄, 징계, 성화" },
  { date: "2026-06-09", type: "기상오기", title: "당신이 그 사람이에요", verse: "사무엘하 12:1-9", keywords: "나단, 직언, 자기기만" },
  { date: "2026-04-17", type: "금요예배", title: "허물이 드러나도 공동체에 붙어 있으라", verse: "에스라 2:59-70", keywords: "허물, 공동체, 회복" },
  { date: "2026-03-25", type: "수요예배", title: "우리는 조각목입니다", verse: "출애굽기 25:9-16", keywords: "조각목, 성막, 연단" },
  { date: "2026-03-22", type: "주일예배", title: "베드로의 통곡", verse: "마태복음 26:69-75", keywords: "실패, 회개, 통곡" },
  { date: "2026-03-01", type: "주일예배", title: "위대한 발견", verse: "누가복음 5:1-11", keywords: "죄인발견, 영생, 부르심" }
];

// 한글 성경 약어 -> 영문 장 이동 매핑
const BOOK_KO_TO_EN = {
  "창세기": "Genesis", "출애굽기": "Exodus", "레위기": "Leviticus", "민수기": "Numbers", "신명기": "Deuteronomy",
  "여호수아": "Joshua", "사사기": "Judges", "룻기": "Ruth", "사무엘상": "1 Samuel", "사무엘하": "2 Samuel",
  "열왕기상": "1 Kings", "열왕기하": "2 Kings", "역대상": "1 Chronicles", "역대하": "2 Chronicles",
  "에스라": "Ezra", "느헤미야": "Nehemiah", "에스더": "Esther", "욥기": "Job", "시편": "Psalms",
  "잠언": "Proverbs", "전도서": "Ecclesiastes", "아가": "Song of Solomon", "이사야": "Isaiah", "예레미야": "Jeremiah",
  "예레미야애가": "Lamentations", "에스겔": "Ezekiel", "다니엘": "Daniel", "호세아": "Hosea", "요엘": "Joel",
  "아모스": "Amos", "오바댜": "Obadiah", "요나": "Jonah", "미가": "Micah", "나훔": "Nahum",
  "하박국": "Habakkuk", "스바냐": "Zephaniah", "학개": "Haggai", "스가랴": "Zechariah", "말라기": "Malachi",
  "마태복음": "Matthew", "마가복음": "Mark", "누가복음": "Luke", "요한복음": "John", "사도행전": "Acts",
  "로마서": "Romans", "고린도전서": "1 Corinthians", "고린도후서": "2 Corinthians", "갈라디아서": "Galatians",
  "에베소서": "Ephesians", "빌립보서": "Philippians", "골로새서": "Colossians", "데살로니가전서": "1 Thessalonians",
  "데살로니가후서": "2 Thessalonians", "디모데전서": "1 Timothy", "디모데후서": "2 Timothy", "디도서": "Titus",
  "빌레몬서": "Philemon", "히브리서": "Hebrews", "야고보서": "James", "베드로전서": "1 Peter",
  "베드로후서": "2 Peter", "요한일서": "1 John", "요한이서": "2 John", "요한삼서": "3 John",
  "유다서": "Jude", "요한계시록": "Revelation"
};

const getLocalTodayKey = () => {
  const o = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - o).toISOString().split('T')[0];
};

export default function TrainingSubPages({ t, isDarkMode, setActiveScreen, isSidebarOpen, setIsSidebarOpen }) {
  const _isDark = Boolean(t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode);

  // 📖 로고스 학술 & 엔터프라이즈 SaaS 규격 테마
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

  const fontSerif = { fontFamily: "'KoPubWorld Batang', 'Nanum Myeongjo', 'Batang', serif" };
  const fontSans = { fontFamily: "'Pretendard', -apple-system, sans-serif" };

  const [activeTab, setActiveTab] = useState('index');
  const [forms, setForms] = useState(() => getLocal('ts_forms_data_v3', {}));
  const [checks, setChecks] = useState(() => getLocal('ts_checks_data_v3', {}));
  const [toastMsg, setToastMsg] = useState(null);

  // 오늘의 영적 5종 세트 실시간 동기화 상태
  const todayKey = getLocalTodayKey();
  const [todayRoutineChecks, setTodayRoutineChecks] = useState(() => {
    const allDaily = getLocal('qt_daily', {});
    return allDaily[todayKey]?.checks || {};
  });

  // 🌐 99+편 설교 코퍼스 실시간 로드
  const [sermonCorpus, setSermonCorpus] = useState(FALLBACK_SERMONS);

  useEffect(() => {
    fetch('/sermon_summary.json')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data) return;
        const extracted = [];
        const seen = new Set();

        const addSermon = (item, fallbackRef = '') => {
          if (!item || typeof item !== 'object') return;
          const title = (item.title || item.sermonTitle || '').trim();
          const date = (item.date || '').trim();
          const verse = (item.verse || item.reference || item.ref || fallbackRef || '').trim();
          if (!title && !verse) return;

          const key = `${date}_${title || verse}`;
          if (seen.has(key)) return;
          seen.add(key);

          const kwRaw = item.keywords || item.tags || item.theme || '';
          const keywords = Array.isArray(kwRaw) ? kwRaw.join(', ') : String(kwRaw || '');
          const summary = item.summary || item.oneLineSummary || item.content || item.exegesis || '';

          extracted.push({
            date: date || '상시묵상',
            type: item.type || '주일/강해',
            title: title || `${verse} 강해`,
            verse: verse || '성경 본문',
            keywords: keywords || '말씀, 복음, 회개, 순종',
            summary: String(summary).trim()
          });
        };

        if (Array.isArray(data)) data.forEach(s => addSermon(s));
        else {
          if (Array.isArray(data.sermons)) data.sermons.forEach(s => addSermon(s));
          if (Array.isArray(data.items)) data.items.forEach(s => addSermon(s));
          if (data.index && typeof data.index === 'object') {
            Object.entries(data.index).forEach(([refKey, val]) => {
              if (Array.isArray(val)) val.forEach(s => addSermon(s, refKey));
              else if (val && typeof val === 'object') addSermon(val, refKey);
            });
          }
        }
        FALLBACK_SERMONS.forEach(s => addSermon(s));
        extracted.sort((a, b) => String(b.date).localeCompare(String(a.date)));
        if (extracted.length > 0) setSermonCorpus(extracted);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { setLocal('ts_forms_data_v3', forms); }, [forms]);
  useEffect(() => { setLocal('ts_checks_data_v3', checks); }, [checks]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2800);
  };

  const handleForm = (key, val) => setForms(p => ({ ...p, [key]: val }));
  const toggleCheck = (key) => setChecks(p => ({ ...p, [key]: !p[key] }));

  // 오늘의 영적 5종 세트 루틴 즉시 토글 핸들러
  const handleToggleTodayRoutine = (routineKey) => {
    try {
      const allDaily = getLocal('qt_daily', {});
      const curDay = allDaily[todayKey] || {};
      const curChecks = curDay.checks || {};
      const nextVal = !curChecks[routineKey];
      const nextChecks = { ...curChecks, [routineKey]: nextVal };
      allDaily[todayKey] = { ...curDay, checks: nextChecks };
      setLocal('qt_daily', allDaily);
      setTodayRoutineChecks(nextChecks);
      showToast(`🔥 오늘의 영적 5종 세트 [${routineKey}] 항목이 ${nextVal ? '완료' : '해제'}되었습니다!`);
    } catch (_) {}
  };

  // 성경 구절 클릭 시 성경통독(Bible.js) 해당 장으로 직행
  const handleJumpToBible = (bookKo, chapNum = 1) => {
    if (!setActiveScreen) return;
    const enName = BOOK_KO_TO_EN[bookKo] || 'Genesis';
    try {
      localStorage.setItem('bible_jump_target', `${enName}-${chapNum}`);
      setActiveScreen('bible');
    } catch (_) {}
  };

  // 📊 주차별 및 전체 달성률(%) 실시간 계산 엔진
  const progressStats = useMemo(() => {
    const countFilled = (keys) => keys.filter(k => String(forms[k] || '').trim().length > 0).length;
    const countChecked = (keys) => keys.filter(k => Boolean(checks[k])).length;

    const wk1FormKeys = ['wk1_q1', 'wk1_testimony1', 'wk1_testimony2', 'wk1_testimony3', 'wk1_testimony4', 'wk1_testimony5', 'wk1_testimony6', 'wk1_sheet1', 'wk1_sheet2', 'wk1_sheet3', 'wk1_sheet4', 'wk1_sheet5', 'wk1_sheet6', 'wk1_sheet7', 'wk1_sheet8', 'wk1_sheet9', 'wk1_sheet10'];
    const wk1CheckKeys = ['w1_eval1', 'w1_eval3', 'w1_eval4', 'w1_eval6', 'w1_pass1', 'w1_pass2', 'w1_pass4', 'w1_pass5'];
    const wk1Pct = Math.round(((countFilled(wk1FormKeys) + countChecked(wk1CheckKeys)) / (wk1FormKeys.length + wk1CheckKeys.length)) * 100);

    const wk2FormKeys = ['wk2_step1', 'wk2_step2', 'wk2_step3', 'wk2_step4', 'wk2_step5', 'wk2_step6', 'wk2_step7', 'wk2_step8', 'wk2_s1', 'wk2_s2', 'wk2_s3', 'wk2_s4', 'wk2_s5', 'wk2_s6', 'wk2_s7', 'wk2_s8', 'wk2_s9', 'wk2_s10', 'wk2_qt1', 'wk2_qt2', 'wk2_qt3', 'wk2_qt4', 'wk2_qt5', 'wk2_qt6', 'wk2_qt7', 'wk2_qt8', 'wk2_qt9', 'wk2_qt10', 'wk2_qt11'];
    const wk2CheckKeys = ['w2_pass1', 'w2_pass2', 'w2_pass3', 'w2_pass4'];
    const wk2Pct = Math.round(((countFilled(wk2FormKeys) + countChecked(wk2CheckKeys)) / (wk2FormKeys.length + wk2CheckKeys.length)) * 100);

    const wk3FormKeys = ['wk3_t1', 'wk3_t2', 'wk3_t3', 'wk3_t4', 'wk3_t5', 'wk3_t6', 'wk3_t7', 'wk3_ws1', 'wk3_ws2', 'wk3_ws3', 'wk3_ws4', 'wk3_ws5', 'wk3_ws6', 'wk3_ws7', 'wk3_ws8', 'wk3_ws9', 'wk3_ws10', 'wk3_ws11', 'wk3_ws12', 'wk3_ws13', 'wk3_ws14', 'wk3_ws15', 'wk3_ws16', 'wk3_ws17', 'wk3_ws18'];
    const wk3CheckKeys = ['w3_pass1', 'w3_pass2', 'w3_pass3', 'w3_pass4'];
    const wk3Pct = Math.round(((countFilled(wk3FormKeys) + countChecked(wk3CheckKeys)) / (wk3FormKeys.length + wk3CheckKeys.length)) * 100);

    const wk4FormKeys = ['wk4_sc1', 'wk4_sc2', 'wk4_sc3', 'wk4_sc4', 'wk4_sc5', 'wk4_sc6', 'wk4_sc7', 'wk4_sc8', 'wk4_sc9', 'wk4_sc10', 'wk4_sc11', 'wk4_sc12', 'wk4_sc13', 'wk4_sc14', 'wk4_sc15', 'wk4_sc16', 'wk4_final_proj'];
    const wk4CheckKeys = ['wk4_re1', 'wk4_re2', 'wk4_re3', 'wk4_re4', 'wk4_re5', 'wk4_re6', 'wk4_re7', 'wk4_re8', 'wk4_re9', 'wk4_re10'];
    const wk4Pct = Math.round(((countFilled(wk4FormKeys) + countChecked(wk4CheckKeys)) / (wk4FormKeys.length + wk4CheckKeys.length)) * 100);

    const wcfFormKeys = ['wcf_q76_1', 'wcf_q76_2', 'wcf_q76_3', 'wcf_q76_4', 'wcf_q76_5', 'wcf_q76_6', 'wcf_q76_7', 'wcf_q76_8', 'wcf_thx1', 'wcf_thx2', 'wcf_thx3', 'wcf_thx4', 'wcf_thx5'];
    const wcfCheckKeys = ['wcf_f1', 'wcf_f2', 'wcf_f3', 'wcf_f4', 'wcf_f5', 'wcf_f6'];
    const wcfPct = Math.round(((countFilled(wcfFormKeys) + countChecked(wcfCheckKeys)) / (wcfFormKeys.length + wcfCheckKeys.length)) * 100);

    const totalPct = Math.round((wk1Pct + wk2Pct + wk3Pct + wk4Pct + wcfPct) / 5);

    return { wk1Pct, wk2Pct, wk3Pct, wk4Pct, wcfPct, totalPct };
  }, [forms, checks]);

  // 💡 [영적 파이프라인 엔진: 앱 내 모든 화면과 실제 로컬스토리지 100% 연동]
  const syncToPipeline = (type, payloadObj, alertMsg) => {
    try {
      const today = getLocalTodayKey();
      const text = payloadObj ? Object.values(payloadObj).filter(Boolean).join('\n') : '';

      if (type === 'apply') {
        if (!text.trim()) return alert('전송할 순종 결단 내용이 없습니다. 먼저 항목을 작성해 주세요.');
        const saved = getLocal('apply_tracker_items', []);
        saved.unshift({ id: `ts_${Date.now()}`, date: today, source: '4주심화워크북', text: text.trim(), completed: false });
        setLocal('apply_tracker_items', saved);
        showToast(alertMsg || '🎯 적용 트래커에 실천 과제로 등록되었습니다!');
      } 
      else if (type === 'qt') {
        if (!text.trim()) return alert('전송할 QT 묵상 내용이 없습니다.');
        const dailyData = getLocal('qt_daily', {});
        if (!dailyData[today]) dailyData[today] = {};
        const current = dailyData[today]['qtMeditation'] || '';
        dailyData[today]['qtMeditation'] = current ? `${current}\n\n[4주 심화 워크북 연동]\n${text.trim()}` : text.trim();
        dailyData[today]['checks'] = { ...(dailyData[today]['checks'] || {}), QTin: true };
        setLocal('qt_daily', dailyData);
        setTodayRoutineChecks(dailyData[today]['checks']);
        showToast(alertMsg || '🔥 오늘의 매일QT 묵상란에 저장되고 루틴이 체크되었습니다!');
      }
      else if (type === 'diary') {
        if (!text.trim()) return alert('전송할 감사/간증 내용이 없습니다.');
        const diaries = getLocal('gratitude_diaries', []);
        diaries.unshift({ id: Date.now(), date: today, text: text.trim(), type: 'thanks' });
        setLocal('gratitude_diaries', diaries);

        const dailyData = getLocal('qt_daily', {});
        if (!dailyData[today]) dailyData[today] = {};
        const prevThanks = dailyData[today]['thanksText'] || '';
        dailyData[today]['thanksText'] = prevThanks ? `${prevThanks}\n${text.trim()}` : text.trim();
        dailyData[today]['checks'] = { ...(dailyData[today]['checks'] || {}), '감사': true };
        setLocal('qt_daily', dailyData);
        setTodayRoutineChecks(dailyData[today]['checks']);
        showToast(alertMsg || '💖 감사/간증 일기장에 저장되고 오늘의 감사 루틴이 체크되었습니다!');
      }
      else if (type === 'prayer') {
        if (!text.trim()) return alert('전송할 기도제목이 없습니다.');
        const prayers = getLocal('globalPrayers', []);
        prayers.unshift({ id: Date.now(), text: text.trim(), status: 'praying' });
        setLocal('globalPrayers', prayers);

        const dailyData = getLocal('qt_daily', {});
        if (!dailyData[today]) dailyData[today] = {};
        dailyData[today]['checks'] = { ...(dailyData[today]['checks'] || {}), '기도하기': true };
        setLocal('qt_daily', dailyData);
        setTodayRoutineChecks(dailyData[today]['checks']);
        showToast(alertMsg || '🙏 나의 기도 보관함에 등록되고 기도 루틴이 체크되었습니다!');
      }
      else if (type === 'cell') {
        const cellSummary = [
          forms.wk4_sc1 ? `[설교 연구: ${forms.wk4_sc1} (${forms.wk4_sc3 || ''})]` : '[4주 심화 워크북 나눔]',
          forms.wk4_sc4 ? `• 핵심 말씀: ${forms.wk4_sc4}` : '',
          forms.wk4_sc8 ? `• 발견한 나의 죄와 연약함: ${forms.wk4_sc8}` : '',
          forms.wk4_sc11 ? `• 감사 고백: ${forms.wk4_sc11}` : '',
          forms.wk4_sc13 ? `• 이번 주 순종 적용: ${forms.wk4_sc13}` : ''
        ].filter(Boolean).join('\n');

        if (cellSummary.length < 15) return alert('목장 나눔으로 전송할 연구 카드 항목을 먼저 작성해 주세요.');

        const cellData = getLocal('global_cell_data', { notice: '', submissions: [], groupPrayers: [], cellIntercession: '' });
        const nextSubmissions = Array.isArray(cellData.submissions) ? [...cellData.submissions] : [];
        nextSubmissions.unshift({
          id: Date.now(),
          date: today,
          wordShare: cellSummary,
          thanksShare: forms.wk4_sc11 || '',
          prayerReq: forms.wk4_sc13 || ''
        });
        setLocal('global_cell_data', { ...cellData, submissions: nextSubmissions });
        if (navigator.clipboard) navigator.clipboard.writeText(cellSummary).catch(() => {});
        showToast(alertMsg || '🌿 목장 나눔 데이터로 실제 저장되었으며 클립보드에도 복사되었습니다!');
      }
    } catch (e) {
      alert('연동 중 오류가 발생했습니다.');
    }
  };

  // 🔗 12주 커리큘럼(`TrainingCurriculum.js`) 데이터와 양방향 동기화 헬퍼
  const importFrom12WeekCurriculum = (targetWeekGroup) => {
    const tcNotes = getLocal('diary_curriculum_notes', {});
    const tcForms = getLocal('tc_final_forms_v7', {});

    if (targetWeekGroup === 1) {
      const combined = [tcNotes[1], tcNotes[2], tcNotes[3]].filter(Boolean).join('\n\n');
      const step0 = tcForms['w1_step_0'] || '';
      const step1 = tcForms['w1_step_1'] || '';
      const step2 = tcForms['w1_step_2'] || '';
      const step3 = tcForms['w1_step_3'] || '';
      if (!combined && !step0 && !step1) {
        return alert('12주 커리큘럼(1~3주차)에 아직 작성된 기록이 없습니다.');
      }
      setForms(prev => ({
        ...prev,
        wk1_q1: prev.wk1_q1 || step1 || combined.slice(0, 200),
        wk1_testimony2: prev.wk1_testimony2 || step0,
        wk1_testimony4: prev.wk1_testimony4 || step1,
        wk1_testimony5: prev.wk1_testimony5 || step3
      }));
      showToast('📥 12주 커리큘럼 제1기(1~3주) 성찰 기록을 성공적으로 불러왔습니다!');
    } else if (targetWeekGroup === 3) {
      // 12주 커리큘럼 부록의 고난 해석 12문항(`suf_fact` 등)을 3주차 워크시트로 즉시 가져오기
      if (!tcForms.suf_fact && !tcForms.suf_emotion && !tcNotes[5] && !tcNotes[6]) {
        return alert('12주 커리큘럼의 고난 해석 양식에 작성된 기록이 없습니다.');
      }
      setForms(prev => ({
        ...prev,
        wk3_ws1: prev.wk3_ws1 || tcForms.suf_fact || '',
        wk3_ws2: prev.wk3_ws2 || tcForms.suf_emotion || '',
        wk3_ws3: prev.wk3_ws3 || tcForms.suf_interpretation || '',
        wk3_ws4: prev.wk3_ws4 || tcForms.suf_desire || '',
        wk3_ws5: prev.wk3_ws5 || tcForms.suf_fear || '',
        wk3_ws10: prev.wk3_ws10 || tcForms.suf_word || '',
        wk3_ws12: prev.wk3_ws12 || tcForms.suf_character || '',
        wk3_ws13: prev.wk3_ws13 || tcForms.suf_gospel || '',
        wk3_ws15: prev.wk3_ws15 || tcForms.suf_repent || '',
        wk3_ws16: prev.wk3_ws16 || tcForms.suf_thanks || '',
        wk3_ws17: prev.wk3_ws17 || tcForms.suf_action || ''
      }));
      showToast('📥 12주 커리큘럼의 고난 해석 기록을 3주차 정밀 워크시트로 불러왔습니다!');
    }
  };

  // ✨ 4주차 최종 프로젝트 원클릭 자동 조립기 (1~3주차 작성 내용 통합)
  const buildFinalProjectDraft = () => {
    const draftParts = [
      `1. 훈련을 시작할 때 나의 영적 현주소와 통제하려던 영역\n${forms.wk1_q1 || forms.wk1_sheet1 || '(1주차에서 내가 주인 되려 했던 영역을 기록해 보세요)'}`,
      `2. 복음과 십자가 앞에서 발견한 나의 모습\n${forms.wk1_testimony4 || forms.wk1_sheet8 || '(자격 없는 나를 받으신 복음 앞에서의 회개 고백)'}`,
      `3. 말씀 묵상(QT)과 사건·해석 분리를 통해 새롭게 깨달은 것\n${forms.wk2_step6 || forms.wk2_qt3 || '(내 왜곡된 해석을 내려놓고 말씀으로 본 사건의 의미)'}`,
      `4. 고난의 터널을 통과하며 확인한 하나님의 주권과 성품\n${forms.wk3_ws12 || forms.wk3_t4 || '(정죄가 아닌 사랑의 연단으로 나를 빚으신 하나님의 은혜)'}`,
      `5. 생명에 이르는 회개와 감사의 제목\n${forms.wk3_ws15 || forms.wcf_q76_7 || '(단순한 후회를 넘어 값을 치르기로 결단한 회개와 감사)'}`,
      `6. 실제 삶에서 바뀐 순종 행동과 한 영혼을 세우는 향후 섬김 계획\n${forms.wk1_sheet9 || forms.wk2_step8 || forms.wk3_ws17 || '(가정과 공동체에서 바르실래처럼 무명으로 섬길 구체적 실천)'}`
    ];
    handleForm('wk4_final_proj', draftParts.join('\n\n'));
    showToast('✨ 1~3주차 작성 기록을 바탕으로 최종 프로젝트 초안이 자동 생성되었습니다!');
  };

  const TABS = [
    { id: 'index', code: 'IDX', label: '종합 대시보드', pct: progressStats.totalPct },
    { id: 'wk1', code: 'W.1', label: '1주: 복음과 제자', pct: progressStats.wk1Pct },
    { id: 'wk2', code: 'W.2', label: '2주: 말씀과 해석', pct: progressStats.wk2Pct },
    { id: 'wk3', code: 'W.3', label: '3주: 고난·회개·감사', pct: progressStats.wk3Pct },
    { id: 'wk4', code: 'W.4', label: '4주: 공동체와 재생산', pct: progressStats.wk4Pct },
    { id: 'wcf', code: 'STD', label: '교리·신앙 기준서', pct: progressStats.wcfPct }
  ];

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden select-none relative ${bgMain} w-full`}>
      
      {/* 실시간 알림 토스트 */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#7A2E26] text-white text-[12px] font-bold shadow-xl border border-white/20 flex items-center gap-2 animate-fade-in" style={fontSans}>
          <IconSparkles />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── 1. 학술 툴바 헤더 (Command Ribbon) ── */}
      <header className={`relative z-20 px-2.5 sm:px-4 py-2 flex items-center justify-between border-b shrink-0 ${borderRule} ${_isDark ? 'bg-[#161A20]' : 'bg-[#EFECE4]'}`}>
        <div className="flex items-center gap-2 min-w-0">
          <button 
            onClick={() => setActiveScreen && setActiveScreen('trainingCurriculum')}
            className={`px-2 py-1 rounded-sm transition-colors cursor-pointer shrink-0 border flex items-center gap-1 text-[11px] font-bold ${
              _isDark ? 'border-[#2D333F] text-[#C5CDD7] hover:bg-[#20252E]' : 'border-[#D8D0C3] text-[#4A5568] hover:bg-[#E5E0D5]'
            }`}
            style={fontSans}
            title="12주 양육 커리큘럼으로 이동"
          >
            <IconArrowLeft />
            <span className="hidden sm:inline">12주 커리큘럼</span>
          </button>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-[9.5px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-none font-mono shrink-0 ${
              _isDark ? 'bg-[#7A2E26]/30 text-[#FCA5A5] border border-[#7A2E26]' : 'bg-[#7A2E26] text-white'
            }`}>
              WORKBOOK
            </span>
            <h1 className={`text-[12.5px] sm:text-[14px] font-bold tracking-tight truncate ${textHead}`} style={fontSans}>
              4주 제자양육 심화 워크북
            </h1>
            <span className={`hidden md:inline text-[11px] font-mono font-bold px-1.5 py-0.5 border ${subBox} text-[#7A2E26] dark:text-[#F87171]`}>
              종합 달성률 {progressStats.totalPct}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setActiveScreen && setActiveScreen('applyTracker')}
            className={`hidden sm:flex items-center gap-1 px-2 py-1 text-[11px] font-bold border cursor-pointer ${subBox} ${textHead}`}
            style={fontSans}
          >
            <IconTarget /> 적용 트래커
          </button>
          {setIsSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className={`p-1.5 rounded-sm transition-colors cursor-pointer border ${
                _isDark ? 'border-[#2D333F] text-[#C5CDD7] hover:bg-[#20252E]' : 'border-[#D8D0C3] text-[#4A5568] hover:bg-[#E5E0D5]'
              }`}
            >
              <IconMenu />
            </button>
          )}
        </div>
      </header>

      {/* ── 2. 서재 색인 탭 (실시간 주차별 달성률 배지 포함) ── */}
      <nav className={`w-full shrink-0 flex overflow-x-auto hide-scrollbar border-b px-1.5 py-1 gap-1 ${borderRule} ${_isDark ? 'bg-[#121519]' : 'bg-[#EAE5DC]'}`}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1.5 transition-all text-left flex items-center gap-1.5 shrink-0 cursor-pointer text-[11.5px] sm:text-[12px] border ${
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
              <span className={`text-[9.5px] font-mono ${isActive ? 'text-[#7A2E26] dark:text-[#F87171] font-bold' : 'opacity-60'}`}>
                {tab.code}
              </span>
              <span className="whitespace-nowrap">{tab.label}</span>
              <span className={`text-[9.5px] font-mono px-1 py-0.2 border ${
                tab.pct >= 80
                  ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30 font-bold'
                  : 'opacity-65 border-current'
              }`}>
                {tab.pct}%
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── 3. 학술 & 실천 본문 워크스테이션 ── */}
      <main className="flex-1 overflow-y-auto hide-scrollbar p-2.5 sm:p-4 w-full pb-28">
        <div className="flex flex-col gap-3 w-full max-w-4xl mx-auto min-w-0">

          {/* ════════ TAB 0: 종합 대시보드 & 12주 커리큘럼 연계 개관 ════════ */}
          {activeTab === 'index' && (
            <div className="space-y-3 w-full">
              
              {/* 상단 마스터 진행률 & 오늘의 영적 5종 세트 원스톱 점검판 */}
              <section className={`p-3.5 sm:p-4 ${cardBox} space-y-3`}>
                <div className={`flex flex-wrap items-center justify-between gap-2 pb-2 border-b ${borderRule}`}>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#7A2E26] dark:text-[#F87171] uppercase block" style={fontSans}>
                      INTENSIVE DISCIPLESHIP WORKBOOK • MASTER DASHBOARD
                    </span>
                    <h2 className={`text-[15px] sm:text-[17px] font-bold tracking-tight mt-0.5 ${textHead}`} style={fontSerif}>
                      4주 제자양육 심화 워크북 & 일상 영적 규율 통합 점검판
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveScreen && setActiveScreen('trainingCurriculum')}
                    className={`px-3 py-1.5 text-[11.5px] font-bold border cursor-pointer ${
                      _isDark ? 'bg-[#7A2E26] text-white border-[#7A2E26]' : 'bg-[#1B365D] text-white border-[#1B365D]'
                    }`}
                    style={fontSans}
                  >
                    12주 마스터 커리큘럼으로 이동 ↗
                  </button>
                </div>

                <p className={`text-[12.5px] leading-relaxed ${textBody} break-keep`} style={fontSerif}>
                  본 4주 심화 워크북은 <strong>12주 제자양육 커리큘럼의 4대 기수(제1기~제4기)</strong>를 압축하여, 성도가 말씀 앞에서 자신의 통제욕과 죄를 직면하고 구체적인 순종과 재생산으로 나아가도록 돕는 <strong>실전 훈련 기록장</strong>입니다.
                </p>

                {/* 오늘의 영적 5종 세트 즉시 체크 바 */}
                <div className={`p-3 border ${subBox} space-y-2`}>
                  <div className="flex items-center justify-between" style={fontSans}>
                    <span className={`text-[11.5px] font-bold ${textHead}`}>
                      🔥 오늘({todayKey}) 나의 영적 5종 세트 실천 점검 (터치하여 즉시 체크)
                    </span>
                    <span className="text-[10.5px] font-mono font-bold text-[#7A2E26] dark:text-[#F87171]">
                      오늘 {['감사', '성경읽기', 'QTin', '기도하기', '가정예배'].filter(k => todayRoutineChecks[k]).length} / 5 완료
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5" style={fontSans}>
                    {[
                      { id: '감사', label: '1. 감사' },
                      { id: '성경읽기', label: '2. 성경통독' },
                      { id: 'QTin', label: '3. 매일QT' },
                      { id: '기도하기', label: '4. 기도' },
                      { id: '가정예배', label: '5. 가정예배' }
                    ].map(r => {
                      const isDone = Boolean(todayRoutineChecks[r.id]);
                      return (
                        <button
                          key={r.id}
                          onClick={() => handleToggleTodayRoutine(r.id)}
                          className={`py-2 px-1 border text-center cursor-pointer transition-all ${
                            isDone
                              ? (_isDark ? 'bg-[#7A2E26] text-white border-[#7A2E26] font-bold' : 'bg-[#1B365D] text-white border-[#1B365D] font-bold')
                              : `${cardBox} ${textMuted}`
                          }`}
                        >
                          <div className="text-[11px] truncate">{r.label}</div>
                          <div className="text-[9.5px] font-mono mt-0.5">{isDone ? '✓ 완료' : '미체크'}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4주 심화 × 12주 커리큘럼 1:1 매핑 카드 그리드 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      tabId: 'wk1',
                      code: 'WEEK 01 ⇄ 12주 과정 제1기(1~3주)',
                      title: '1주차: 복음과 제자 (주권 이양과 자기부인)',
                      desc: '마가복음 8:34–38 강해 · 내 인생의 통제권 10문항 점검 · 구속사적 간증 6단계 구조화 실습',
                      pct: progressStats.wk1Pct
                    },
                    {
                      tabId: 'wk2',
                      code: 'WEEK 02 ⇄ 12주 과정 제2기(4~6주)',
                      title: '2주차: 말씀과 삶의 해석 (사건과 해석의 분리)',
                      desc: '사건 해석 8단계 프로토콜 · 99+편 설교 코퍼스 연동 강해 분석 · 실전 QT 관찰·해석·적용 11문항',
                      pct: progressStats.wk2Pct
                    },
                    {
                      tabId: 'wk3',
                      code: 'WEEK 03 ⇄ 12주 과정 제3기(7~9주)',
                      title: '3주차: 고난·회개·감사 (정죄와 징계의 구별)',
                      desc: '조각목의 연단과 다윗의 참회 · 7일 구속사 감사 일지 · 고난 해석 정밀 워크시트 18대 항목',
                      pct: progressStats.wk3Pct
                    },
                    {
                      tabId: 'wk4',
                      code: 'WEEK 04 ⇄ 12주 과정 제4기(10~12주)',
                      title: '4주차: 공동체와 재생산 (한 영혼을 세우는 삶)',
                      desc: '허물을 덮는 공동체와 바르실래의 섬김 · 재생산 10대 척도 · 설교 연구 16문항 · 4주 총결산 프로젝트',
                      pct: progressStats.wk4Pct
                    }
                  ].map(item => (
                    <div
                      key={item.tabId}
                      onClick={() => setActiveTab(item.tabId)}
                      className={`p-3 border ${subBox} hover:border-[#7A2E26] cursor-pointer transition-all flex flex-col justify-between gap-2`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-mono mb-1" style={fontSans}>
                          <span className="font-bold text-[#7A2E26] dark:text-[#F87171]">{item.code}</span>
                          <span className={`font-bold ${item.pct >= 80 ? 'text-emerald-500' : textMuted}`}>진행률 {item.pct}%</span>
                        </div>
                        <h4 className={`text-[13px] font-bold ${textHead} mb-1`} style={fontSans}>
                          {item.title}
                        </h4>
                        <p className={`text-[11.5px] leading-relaxed ${textBody} break-keep`} style={fontSerif}>
                          {item.desc}
                        </p>
                      </div>
                      <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 overflow-hidden">
                        <div style={{ width: `${item.pct}%` }} className={`h-full transition-all duration-500 ${_isDark ? 'bg-[#7A2E26]' : 'bg-[#1B365D]'}`} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* 제자양육 5대 황금률 */}
                <div className={`p-3 border text-[12px] leading-relaxed ${subBox}`} style={fontSerif}>
                  <strong className={`block mb-1.5 font-bold ${textHead}`} style={fontSans}>
                    🏛️ 본 워크북의 5대 신학적·실천적 지도 원리
                  </strong>
                  • <strong>복음의 우선성:</strong> 행동 교정이나 열심보다 그리스도의 십자가 대속과 칭의의 은혜가 언제나 먼저다.<br/>
                  • <strong>사건과 해석의 분리:</strong> 일어난 객관적 사실(Fact)과 내 두려움·통제욕이 만들어낸 왜곡된 해석을 말씀 앞에서 분리한다.<br/>
                  • <strong>정죄와 징계의 구별:</strong> 성도에게 형벌적 정죄는 결코 없으나, 거룩한 성화를 위한 아버지의 사랑의 훈육(징계)은 존재한다.<br/>
                  • <strong>값을 치르는 순종:</strong> 참된 회개는 감정적 자책에 머물지 않고, 내 시간·자존심·물질의 손해를 감수하는 구체적 행동으로 열매 맺는다.<br/>
                  • <strong>공동체적 재생산:</strong> 수치가 드러나도 언약 공동체에 붙어 있으며, 내 고난을 간증의 약재로 삼아 또 다른 한 영혼을 세운다.
                </div>
              </section>
            </div>
          )}

          {/* ════════ TAB 1: 1주차 복음과 제자 (제1기 1~3주 연동) ════════ */}
          {activeTab === 'wk1' && (
            <div className="space-y-3 w-full">
              <section className={`p-3.5 sm:p-4 ${cardBox} space-y-3`}>
                <div className={`flex flex-wrap items-center justify-between gap-2 pb-2 border-b ${borderRule}`}>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#7A2E26] dark:text-[#F87171] uppercase block" style={fontSans}>
                      WEEK 01 • GOSPEL & DISCIPLESHIP (12주 과정 제1기 연동)
                    </span>
                    <h2 className={`text-[15px] sm:text-[17px] font-bold tracking-tight mt-0.5 ${textHead}`} style={fontSerif}>
                      § 1. 복음이 먼저다 — 주권 이양과 자기부인의 제자도
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5" style={fontSans}>
                    <button
                      onClick={() => importFrom12WeekCurriculum(1)}
                      className={`px-2.5 py-1 text-[11px] font-bold border cursor-pointer ${subBox} ${textHead}`}
                    >
                      📥 12주 과정(1~3주) 기록 불러오기
                    </button>
                    <button
                      onClick={() => handleJumpToBible('마가복음', 8)}
                      className="px-2.5 py-1 text-[11px] font-bold bg-[#7A2E26] text-white cursor-pointer"
                    >
                      📖 막 8장 열기
                    </button>
                  </div>
                </div>

                <div className={`p-3 border-l-4 border-l-[#7A2E26] ${subBox} space-y-1.5`} style={fontSerif}>
                  <div className="flex items-center justify-between" style={fontSans}>
                    <strong className={`text-[12px] font-bold ${textHead}`}>📖 핵심 강해 본문: 마가복음 8:34–38 / 누가복음 5:8</strong>
                    <span className="text-[10.5px] font-mono text-[#7A2E26] dark:text-[#F87171] font-bold">칭의 · 성화 · 주권 이양</span>
                  </div>
                  <p className={`text-[12.5px] italic ${textHead} break-keep`}>
                    "누구든지 나를 따라오려거든 자기를 부인하고 자기 십자가를 지고 나를 따를 것이니라 누구든지 제 목숨을 구원하고자 하면 잃을 것이요 누구든지 나와 복음을 위하여 제 목숨을 잃으면 구원하리라"
                  </p>
                  <p className={`text-[12px] leading-relaxed ${textBody} break-keep pt-1`}>
                    제자훈련에서 가장 경계해야 할 출발은 복음 없는 열심("더 열심히 하자, 매일 묵상하자")입니다. 명령이 은혜보다 앞서면 자기 의와 생색을 낳는 율법주의로 변질됩니다. 참된 제자도는 <strong>[복음 ➔ 은혜 ➔ 자녀의 정체성 ➔ 자기부인(회개) ➔ 순종]</strong>의 순서로 세워집니다. "자기 십자가를 진다"는 것은 단순히 인생의 고생을 참는 것이 아니라, <strong>내가 내 인생의 주인 되어 휘두르던 결정권을 그리스도의 주권 아래 온전히 넘겨드리는 것</strong>입니다.
                  </p>
                </div>

                {/* 실습 1.1 내 인생의 주인 자리 식별 */}
                <div className={`p-3 border ${subBox} space-y-2`}>
                  <div className="flex flex-wrap items-center justify-between gap-1" style={fontSans}>
                    <label className={`text-[12.5px] font-bold ${textHead}`}>
                      § 1.1 내 인생의 주인 자리(통제권) 식별 실습
                    </label>
                    <span className={`text-[10.5px] ${textMuted}`}>아래 영역 칩을 누르면 문장이 자동 추가됩니다</span>
                  </div>
                  <p className={`text-[11.5px] ${textMuted}`} style={fontSerif}>
                    "나는 예수님을 주님이라고 부르지만, 실제로는 아래 영역에서만큼은 내가 주인이 되어 내 뜻대로 통제하려고 한다."
                  </p>
                  <div className="flex flex-wrap gap-1" style={fontSans}>
                    {['재정과 물질 안전', '자녀의 진로와 성적', '배우자와의 관계 주도권', '직장 평가와 사람들의 인정', '내 자존심과 평판', '시간과 계획의 통제'].map(chip => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          const cur = forms['wk1_q1'] || '';
                          const addition = `[${chip}] 영역에서 내 뜻대로 되지 않으면 불안해하고 원망합니다. `;
                          handleForm('wk1_q1', cur ? `${cur}\n${addition}` : addition);
                        }}
                        className={`px-2 py-0.5 text-[10.5px] font-bold border cursor-pointer ${cardBox} hover:border-[#7A2E26] ${textBody}`}
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                  <textarea 
                    value={forms['wk1_q1'] || ''}
                    onChange={(e) => handleForm('wk1_q1', e.target.value)}
                    className={`w-full p-2 text-[12px] leading-relaxed resize-none h-20 outline-none ${inputStyle}`}
                    placeholder="내가 하나님께 주권을 내어드리지 못하고 끝까지 쥐고 있는 영역과 그때 나타나는 감정을 정직히 기록하십시오."
                    style={fontSerif}
                  />
                </div>

                {/* § 1.2 간증 6단계 구조화 실습 */}
                <div className={`p-3 border ${subBox} space-y-2`}>
                  <div className="flex items-center justify-between" style={fontSans}>
                    <h4 className={`text-[12.5px] font-bold ${textHead}`}>
                      § 1.2 구속사적 간증 6단계 구조화 실습 (내 자랑이 아닌 하나님의 일하심 증거)
                    </h4>
                    <span className="text-[10px] font-mono text-emerald-500">자동 저장</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: 'wk1_testimony1', label: '① 이전의 우상: 나는 이 문제에서 무엇을 하나님보다 더 의지하며 살았는가?' },
                      { id: 'wk1_testimony2', label: '② 직면한 사건: 내 통제력을 무너뜨린 구체적인 사건은 무엇인가?' },
                      { id: 'wk1_testimony3', label: '③ 비추어진 말씀: 어떤 성경 말씀을 통해 나의 죄와 교만이 드러났는가?' },
                      { id: 'wk1_testimony4', label: '④ 참된 회개: 남 탓을 멈추고 하나님 앞에 무엇을 내 죄로 인정했는가?' },
                      { id: 'wk1_testimony5', label: '⑤ 값을 치른 적용: 말씀에 순종하여 실제로 바꾼 태도와 행동은 무엇인가?' },
                      { id: 'wk1_testimony6', label: '⑥ 현재의 은혜: 완벽하지 않지만 지금 주님께 맡기며 누리는 평안은 무엇인가?' }
                    ].map(item => (
                      <div key={item.id} className="flex flex-col justify-between">
                        <span className={`text-[11.5px] font-bold ${textHead} mb-1`} style={fontSans}>{item.label}</span>
                        <textarea 
                          value={forms[item.id] || ''}
                          onChange={(e) => handleForm(item.id, e.target.value)}
                          placeholder="질문에 따라 내 삶을 정직히 기록하십시오..."
                          className={`w-full p-2 text-[12px] leading-relaxed resize-none h-16 outline-none ${inputStyle}`}
                          style={fontSerif}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1" style={fontSans}>
                    <button 
                      onClick={() => syncToPipeline('diary', {
                        t1: `[이전] ${forms.wk1_testimony1 || ''}`,
                        t2: `[사건] ${forms.wk1_testimony2 || ''}`,
                        t3: `[말씀] ${forms.wk1_testimony3 || ''}`,
                        t4: `[회개] ${forms.wk1_testimony4 || ''}`,
                        t5: `[적용] ${forms.wk1_testimony5 || ''}`,
                        t6: `[현재] ${forms.wk1_testimony6 || ''}`
                      })}
                      className={`flex-1 py-2 text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                        _isDark ? 'bg-[#7A2E26] text-white border-[#7A2E26]' : 'bg-[#1B365D] text-white border-[#1B365D]'
                      }`}
                    >
                      <IconSend /> 완성된 6단 간증문을 '감사/간증 일기장'으로 저장 및 루틴 체크
                    </button>
                  </div>
                </div>

                {/* § 1.3 내 인생의 통제권 점검 실습지 (10문항) */}
                <div className={`p-3 border ${subBox} space-y-2`}>
                  <h4 className={`text-[12.5px] font-bold ${textHead}`} style={fontSans}>
                    § 1.3 내면의 우상 및 통제권 해부 실습지 (10문항)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: 'wk1_sheet1', label: '01. 내가 가장 통제하려는 영역' },
                      { id: 'wk1_sheet2', label: '02. 그것을 놓지 못하는 표면적 이유' },
                      { id: 'wk1_sheet3', label: '03. 내 뜻대로 통제되지 않을 때 올라오는 감정(분노/불안)' },
                      { id: 'wk1_sheet4', label: '04. 그 감정 밑바닥에 숨겨진 나의 진짜 욕망(인정/안전)' },
                      { id: 'wk1_sheet5', label: '05. 그것을 잃으면 내 인생이 무너진다고 믿는 두려움' },
                      { id: 'wk1_sheet6', label: '06. 말씀의 거울 앞에 드러난 나의 불신앙과 죄' },
                      { id: 'wk1_sheet7', label: '07. 내가 오해하고 있던 왜곡된 하나님 이미지' },
                      { id: 'wk1_sheet8', label: '08. 주님 앞에 올려드리는 구체적 회개와 기도제목' },
                      { id: 'wk1_sheet9', label: '09. 통제권을 내려놓고 이번 주 실천할 구체적 순종 결단' },
                      { id: 'wk1_sheet10', label: '10. 이 결단을 함께 나누고 중보를 요청할 공동체 지체' }
                    ].map(s => (
                      <div key={s.id}>
                        <span className={`text-[11px] font-bold ${textHead} block mb-0.5`} style={fontSans}>{s.label}</span>
                        <input 
                          type="text" 
                          value={forms[s.id] || ''}
                          onChange={(e) => handleForm(s.id, e.target.value)}
                          placeholder="기록하십시오..."
                          className={`w-full p-1.5 text-[12px] outline-none ${inputStyle}`}
                          style={fontSerif}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1" style={fontSans}>
                    <button 
                      onClick={() => syncToPipeline('apply', { a: forms.wk1_sheet9 }, "🎯 문항 09번(순종 결단)이 적용 트래커에 등록되었습니다!")}
                      className={`py-2 text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                        _isDark ? 'bg-[#202630] text-[#E6EDF3] border-[#364052]' : 'bg-[#EDE8DC] text-[#1A202C] border-[#CBC1AD]'
                      }`}
                    >
                      <IconTarget /> 09번(순종 결단)을 '적용 트래커'로 전송
                    </button>
                    <button 
                      onClick={() => syncToPipeline('prayer', { p: forms.wk1_sheet8 }, "🙏 문항 08번(회개와 기도)이 기도 보관함에 등록되었습니다!")}
                      className={`py-2 text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                        _isDark ? 'bg-[#202630] text-[#E6EDF3] border-[#364052]' : 'bg-[#EDE8DC] text-[#1A202C] border-[#CBC1AD]'
                      }`}
                    >
                      <IconSend /> 08번(회개 제목)을 '기도 보관함'으로 전송
                    </button>
                  </div>
                </div>

                {/* § 1.4 1주차 검증 체크리스트 */}
                <div className={`p-3 border ${subBox}`}>
                  <div className="flex items-center justify-between mb-1.5" style={fontSans}>
                    <h4 className={`text-[12.5px] font-bold ${textHead}`}>
                      § 1.4 1주차 제자도 체화 및 통과 기준 검증표
                    </h4>
                    <span className="text-[10.5px] font-mono text-[#7A2E26] dark:text-[#F87171] font-bold">
                      {['w1_eval1', 'w1_eval3', 'w1_eval4', 'w1_eval6', 'w1_pass1', 'w1_pass2', 'w1_pass4', 'w1_pass5'].filter(id => checks[id]).length} / 8 점검됨
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {[
                      { id: 'w1_eval1', label: '지체의 나눔을 판단하거나 끊지 않고 끝까지 경청했다.' },
                      { id: 'w1_eval3', label: '일어난 객관적 사실과 내 감정적 해석을 구분했다.' },
                      { id: 'w1_eval4', label: '타인의 고난이나 죄를 함부로 정죄하지 않았다.' },
                      { id: 'w1_eval6', label: '도덕적 반성이 아닌 십자가 복음의 은혜로 연결했다.' },
                      { id: 'w1_pass1', label: '은혜의 복음과 자기 의의 율법주의를 구별할 수 있다.' },
                      { id: 'w1_pass2', label: '단번에 이루어진 칭의와 평생 자라가는 성화를 구분한다.' },
                      { id: 'w1_pass4', label: '갈등 상황에서 남 탓보다 내 안의 우상을 먼저 본다.' },
                      { id: 'w1_pass5', label: '추상적 다짐이 아닌 오늘 실천할 행동 하나를 선택했다.' }
                    ].map(c => {
                      const isChecked = Boolean(checks[c.id]);
                      return (
                        <div 
                          key={c.id}
                          onClick={() => toggleCheck(c.id)}
                          className={`p-2 border cursor-pointer flex items-center gap-2 transition-all ${
                            isChecked ? (_isDark ? 'bg-[#1C2430] border-[#3E526D]' : 'bg-[#F0F5FA] border-[#BDD0E4]') : cardBox
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 border shrink-0 flex items-center justify-center ${
                            isChecked ? 'bg-[#7A2E26] border-[#7A2E26] text-white' : 'border-slate-400'
                          }`}>
                            {isChecked && <IconCheck />}
                          </div>
                          <span className={`text-[11.5px] ${isChecked ? `font-bold ${textHead}` : textBody}`} style={fontSerif}>
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

          {/* ════════ TAB 2: 2주차 말씀과 삶의 해석 (99+편 설교 코퍼스 & 매일QT 연동) ════════ */}
          {activeTab === 'wk2' && (
            <div className="space-y-3 w-full">
              <section className={`p-3.5 sm:p-4 ${cardBox} space-y-3`}>
                <div className={`flex flex-wrap items-center justify-between gap-2 pb-2 border-b ${borderRule}`}>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#7A2E26] dark:text-[#F87171] uppercase block" style={fontSans}>
                      WEEK 02 • WORD & HERMENEUTICS (12주 과정 제2기 연동)
                    </span>
                    <h2 className={`text-[15px] sm:text-[17px] font-bold tracking-tight mt-0.5 ${textHead}`} style={fontSerif}>
                      § 2. 말씀으로 삶을 해석하기 — 사건과 해석의 분리 및 강해·QT 실습
                    </h2>
                  </div>
                  <button
                    onClick={() => handleJumpToBible('사무엘하', 14)}
                    className="px-2.5 py-1 text-[11px] font-bold bg-[#7A2E26] text-white cursor-pointer"
                    style={fontSans}
                  >
                    📖 삼하 14장 열기
                  </button>
                </div>

                <div className={`p-3 border-l-4 border-l-[#1B365D] ${subBox} space-y-1`} style={fontSerif}>
                  <strong className={`text-[12px] font-bold block ${textHead}`} style={fontSans}>
                    📖 핵심 원리: 성경 지식을 쌓는 관찰자에서 말씀 앞에 서는 순종자로
                  </strong>
                  <p className={`text-[12px] leading-relaxed ${textBody} break-keep`}>
                    우리를 넘어뜨리는 것은 사건 자체가 아니라, 그 사건에 내가 덧씌운 <strong>‘하나님 없는 인간적 해석(인본주의)’</strong>입니다. 말씀 묵상(QT)과 설교 듣기는 내 기존 생각을 강화하는 도구가 아니라, 성령의 조명을 통해 내 왜곡된 해석을 깨뜨리고 하나님의 구속사적 시선으로 사건을 다시 읽는 과정입니다.
                  </p>
                </div>

                {/* § 2.2 사건 해석 8단계 프로토콜 실습 */}
                <div className={`p-3 border ${subBox} space-y-2`}>
                  <h4 className={`text-[12.5px] font-bold ${textHead}`} style={fontSans}>
                    § 2.2 사건과 해석 분리 8단계 프로토콜 실습
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: 'wk2_step1', label: '① 사실(Fact): 내 감정을 빼고 실제로 일어난 객관적 사건은 무엇인가?' },
                      { id: 'wk2_step2', label: '② 감정(Emotion): 그 사건 앞에서 솔직하게 올라온 감정은 무엇인가?' },
                      { id: 'wk2_step3', label: '③ 욕망(Desire): 나는 그 상황에서 무엇을 얻거나 지키려고 했는가?' },
                      { id: 'wk2_step4', label: '④ 두려움(Fear): 그것이 뜻대로 안 되면 무엇이 무너진다고 믿었는가?' },
                      { id: 'wk2_step5', label: '⑤ 우상과 죄(Sin): 하나님보다 내 힘과 방법을 더 의지한 부분은 무엇인가?' },
                      { id: 'wk2_step6', label: '⑥ 말씀(Word): 오늘 성경 본문은 이 사건에 대해 무엇이라 말씀하는가?' },
                      { id: 'wk2_step7', label: '⑦ 복음(Gospel): 그리스도 안에서 내가 이미 보장받은 은혜는 무엇인가?' },
                      { id: 'wk2_step8', label: '⑧ 순종(Obedience): 인간적 술수를 멈추고 오늘 실천할 한 가지는 무엇인가?' }
                    ].map(s => (
                      <div key={s.id} className="flex flex-col justify-between">
                        <span className={`text-[11.5px] font-bold ${textHead} mb-1`} style={fontSans}>{s.label}</span>
                        <textarea 
                          value={forms[s.id] || ''}
                          onChange={(e) => handleForm(s.id, e.target.value)}
                          placeholder="단계별로 정직하게 분리하여 기록하십시오..."
                          className={`w-full p-2 text-[12px] leading-relaxed resize-none h-16 outline-none ${inputStyle}`}
                          style={fontSerif}
                        />
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => syncToPipeline('apply', { s8: forms.wk2_step8 }, "🎯 ⑧번 순종 결단이 적용 트래커에 등록되었습니다!")}
                    className={`w-full py-2 text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                      _isDark ? 'bg-[#202630] text-[#E6EDF3] border-[#364052]' : 'bg-[#EDE8DC] text-[#1A202C] border-[#CBC1AD]'
                    }`}
                    style={fontSans}
                  >
                    <IconTarget /> ⑧번(오늘의 순종)을 '적용 트래커'에 실천 과제로 등록
                  </button>
                </div>

                {/* § 2.3 설교 강해 분석지 (99+편 설교 코퍼스 실시간 선택 연동!) */}
                <div className={`p-3 border ${subBox} space-y-2`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-inherit" style={fontSans}>
                    <h4 className={`text-[12.5px] font-bold ${textHead}`}>
                      § 2.3 강해 설교 심층 분석지 (10대 항목 • {sermonCorpus.length}편 설교 코퍼스 연동)
                    </h4>
                    <select
                      onChange={(e) => {
                        const idx = e.target.value;
                        if (idx === '') return;
                        const s = sermonCorpus[Number(idx)];
                        if (!s) return;
                        setForms(prev => ({
                          ...prev,
                          wk2_s1: s.verse,
                          wk2_s2: `[${s.date}] ${s.title}`,
                          wk2_s3: s.summary || `핵심 키워드: ${s.keywords}`,
                          wk2_s4: `${s.verse} 본문 문맥 및 구속사적 교훈 (${s.keywords})`
                        }));
                        showToast(`📖 [${s.title}] 설교 정보가 분석지에 자동 입력되었습니다!`);
                      }}
                      defaultValue=""
                      className={`px-2 py-1 text-[11px] font-bold border outline-none cursor-pointer ${inputStyle}`}
                    >
                      <option value="">📚 {sermonCorpus.length}편 설교 코퍼스에서 불러오기 (선택 시 자동 입력)...</option>
                      {sermonCorpus.map((s, idx) => (
                        <option key={idx} value={idx}>
                          [{s.date}] {s.title} ({s.verse})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: 'wk2_s1', label: '01. 성경 본문' },
                      { id: 'wk2_s2', label: '02. 설교 제목 및 일자' },
                      { id: 'wk2_s3', label: '03. 설교의 핵심 메시지 요약' },
                      { id: 'wk2_s4', label: '04. 성경 본문에서 확인되는 문맥적 근거' },
                      { id: 'wk2_s5', label: '05. 말씀을 통해 새롭게 깨달은 하나님의 뜻' },
                      { id: 'wk2_s6', label: '06. 이 말씀이 비추는 내 삶의 구체적 사건' },
                      { id: 'wk2_s7', label: '07. 드러난 나의 죄와 인본주의적 욕망' },
                      { id: 'wk2_s8', label: '08. 나를 다시 살리는 십자가 복음의 약속' },
                      { id: 'wk2_s9', label: '09. 이번 주 삶에서 실천할 구체적 순종' },
                      { id: 'wk2_s10', label: '10. 일주일 후 순종의 열매 및 점검 결과' }
                    ].map(s => (
                      <div key={s.id}>
                        <span className={`text-[11px] font-bold ${textHead} block mb-0.5`} style={fontSans}>{s.label}</span>
                        <input 
                          type="text" 
                          value={forms[s.id] || ''}
                          onChange={(e) => handleForm(s.id, e.target.value)}
                          placeholder="직접 입력하거나 상단 설교 코퍼스에서 선택하세요..."
                          className={`w-full p-1.5 text-[12px] outline-none ${inputStyle}`}
                          style={fontSerif}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* § 2.4 실전 QT 통합 기록지 (11문항) */}
                <div className={`p-3 border ${subBox} space-y-2`}>
                  <h4 className={`text-[12.5px] font-bold ${textHead}`} style={fontSans}>
                    § 2.4 실전 QT 통합 기록지 (구속사적 관찰 · 내 죄 발견 · 적용 · 기도)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: 'wk2_qt1', label: '01. 오늘의 QT 본문' },
                      { id: 'wk2_qt2', label: '02. 관찰 (본문의 핵심 사실과 흐름)' },
                      { id: 'wk2_qt3', label: '03. 해석 (문맥 속에서 주시는 영적 교훈)' },
                      { id: 'wk2_qt4', label: '04. 성부 하나님은 어떤 분이신가?' },
                      { id: 'wk2_qt5', label: '05. 예수 그리스도의 구속은 어떻게 나타나는가?' },
                      { id: 'wk2_qt6', label: '06. 성령님은 내게 무엇을 깨닫게 하시는가?' },
                      { id: 'wk2_qt7', label: '07. 말씀의 거울에 비친 나의 모습' },
                      { id: 'wk2_qt8', label: '08. 오늘 인정하고 돌이킬 나의 죄' },
                      { id: 'wk2_qt9', label: '09. 그럼에도 감사할 제목' },
                      { id: 'wk2_qt10', label: '10. 말씀을 붙들고 드리는 기도' },
                      { id: 'wk2_qt11', label: '11. 오늘 즉시 실천할 구체적 적용' }
                    ].map(q => (
                      <div key={q.id} className={q.id === 'wk2_qt11' ? 'sm:col-span-2' : ''}>
                        <span className={`text-[11px] font-bold ${textHead} block mb-0.5`} style={fontSans}>{q.label}</span>
                        <input 
                          type="text" 
                          value={forms[q.id] || ''}
                          onChange={(e) => handleForm(q.id, e.target.value)}
                          placeholder="기록하십시오..."
                          className={`w-full p-1.5 text-[12px] outline-none ${inputStyle}`}
                          style={fontSerif}
                        />
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => syncToPipeline('qt', {
                      ref: forms.wk2_qt1 ? `[본문: ${forms.wk2_qt1}]` : '',
                      t1: forms.wk2_qt2 ? `• 관찰: ${forms.wk2_qt2}` : '',
                      t2: forms.wk2_qt3 ? `• 해석: ${forms.wk2_qt3}` : '',
                      t3: forms.wk2_qt7 ? `• 나의 모습: ${forms.wk2_qt7}` : '',
                      t4: forms.wk2_qt8 ? `• 회개: ${forms.wk2_qt8}` : '',
                      t5: forms.wk2_qt11 ? `• 적용: ${forms.wk2_qt11}` : ''
                    })}
                    className={`w-full py-2 text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                      _isDark ? 'bg-[#7A2E26] text-white border-[#7A2E26]' : 'bg-[#1B365D] text-white border-[#1B365D]'
                    }`}
                    style={fontSans}
                  >
                    <IconSend /> 위 QT 실습 기록을 오늘의 '매일QT'에 저장 및 루틴 체크
                  </button>
                </div>

                {/* § 2.5 2주차 말씀 해석 검증표 */}
                <div className={`p-3 border ${subBox}`}>
                  <h4 className={`text-[12.5px] font-bold mb-1.5 ${textHead}`} style={fontSans}>
                    § 2.5 2주차 말씀 해석 및 QT 체화 검증표
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {[
                      { id: 'w2_pass1', label: '성경을 남을 판단하는 도구가 아니라 나를 비추는 거울로 읽었다.' },
                      { id: 'w2_pass2', label: '발생한 사건(Fact)과 내 두려움이 만든 해석을 분리하여 기록했다.' },
                      { id: 'w2_pass3', label: '선포된 강해 설교를 내 삶의 구체적 사건과 연결하여 적용했다.' },
                      { id: 'w2_pass4', label: '이번 주 5회 이상 규칙적으로 말씀과 기도의 자리를 지켰다.' }
                    ].map(c => {
                      const isChecked = Boolean(checks[c.id]);
                      return (
                        <div 
                          key={c.id}
                          onClick={() => toggleCheck(c.id)}
                          className={`p-2 border cursor-pointer flex items-center gap-2 ${
                            isChecked ? (_isDark ? 'bg-[#1C2430] border-[#3E526D]' : 'bg-[#F0F5FA] border-[#BDD0E4]') : cardBox
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 border shrink-0 flex items-center justify-center ${
                            isChecked ? 'bg-[#7A2E26] border-[#7A2E26] text-white' : 'border-slate-400'
                          }`}>
                            {isChecked && <IconCheck />}
                          </div>
                          <span className={`text-[11.5px] ${isChecked ? `font-bold ${textHead}` : textBody}`} style={fontSerif}>
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

          {/* ════════ TAB 3: 3주차 고난·회개·감사 (제3기 7~9주 연동) ════════ */}
          {activeTab === 'wk3' && (
            <div className="space-y-3 w-full">
              <section className={`p-3.5 sm:p-4 ${cardBox} space-y-3`}>
                <div className={`flex flex-wrap items-center justify-between gap-2 pb-2 border-b ${borderRule}`}>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#7A2E26] dark:text-[#F87171] uppercase block" style={fontSans}>
                      WEEK 03 • SUFFERING, REPENTANCE & GRATITUDE (12주 과정 제3기 연동)
                    </span>
                    <h2 className={`text-[15px] sm:text-[17px] font-bold tracking-tight mt-0.5 ${textHead}`} style={fontSerif}>
                      § 3. 고난·회개·감사 — 정죄와 징계의 구별 및 구속사적 재해석
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5" style={fontSans}>
                    <button
                      onClick={() => importFrom12WeekCurriculum(3)}
                      className={`px-2.5 py-1 text-[11px] font-bold border cursor-pointer ${subBox} ${textHead}`}
                    >
                      📥 12주 커리큘럼 고난해석표 불러오기
                    </button>
                    <button
                      onClick={() => handleJumpToBible('사무엘하', 12)}
                      className="px-2.5 py-1 text-[11px] font-bold bg-[#7A2E26] text-white cursor-pointer"
                    >
                      📖 삼하 12장 열기
                    </button>
                  </div>
                </div>

                <div className={`p-3 border-l-4 border-l-[#7A2E26] ${subBox} space-y-1`} style={fontSerif}>
                  <strong className={`text-[12px] font-bold block ${textHead}`} style={fontSans}>
                    📖 핵심 교리 분별: 그리스도 안에 결코 정죄함은 없으나, 자녀를 빚으시는 성화의 연단이 있다
                  </strong>
                  <p className={`text-[12px] leading-relaxed ${textBody} break-keep`}>
                    고난을 믿음으로 통과한다는 것은 아픔을 외면하는 것이 아닙니다. 성경은 하나님 앞에서의 정직한 탄식과 눈물, 그리고 자기기만을 깨뜨리는 회개와 조건 없는 감사를 함께 가르칩니다. <strong>고난 자체를 무조건 죄의 형벌(정죄)로 단정하지 마십시오.</strong> 동시에 고난을 통해 광야의 거친 조각목 같은 나를 순금 언약궤로 다듬으시는 아버지의 손길 앞에는 겸손히 무릎 꿇어야 합니다.
                  </p>
                </div>

                {/* § 3.2 7일간의 구속사 감사 훈련 일지 */}
                <div className={`p-3 border ${subBox} space-y-2`}>
                  <div className="flex items-center justify-between" style={fontSans}>
                    <h4 className={`text-[12.5px] font-bold ${textHead}`}>
                      § 3.2 7일간의 구속사 감사 훈련 일지 (환경을 넘어 하나님 한 분만으로 드리는 감사)
                    </h4>
                    <span className="text-[10.5px] font-mono text-[#7A2E26] dark:text-[#F87171] font-bold">
                      {['wk3_t1','wk3_t2','wk3_t3','wk3_t4','wk3_t5','wk3_t6','wk3_t7'].filter(k => (forms[k] || '').trim().length > 0).length} / 7일 기록됨
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { id: 'wk3_t1', label: 'Day 1 [일상의 은혜] — 당연하게 여겼으나 오늘 하나님이 거저 주신 구체적 은혜' },
                      { id: 'wk3_t2', label: 'Day 2 [동역자의 은혜] — 내 삶에 붙여주신 가족·목장 지체·이웃을 향한 감사' },
                      { id: 'wk3_t3', label: 'Day 3 [말씀의 은혜] — 내 영혼을 깨우고 붙들어 주신 생명의 말씀 한 구절' },
                      { id: 'wk3_t4', label: 'Day 4 [고난 속의 감사] — 아직 해결되지 않은 문제 속에서도 일하시는 주권 감사' },
                      { id: 'wk3_t5', label: 'Day 5 [구원의 은혜] — 자격 없는 죄인을 자녀 삼으신 십자가 대속 은혜 감사' },
                      { id: 'wk3_t6', label: 'Day 6 [회개의 은혜] — 내 죄와 우상을 깨닫고 돌이키게 하신 성령의 조명 감사' },
                      { id: 'wk3_t7', label: 'Day 7 [섬김과 표현] — 오늘 한 사람에게 생색 없이 감사를 표현하고 섬긴 기록' }
                    ].map(item => (
                      <div key={item.id}>
                        <span className={`text-[11px] font-bold ${textHead} block mb-0.5`} style={fontSans}>{item.label}</span>
                        <input 
                          type="text" 
                          value={forms[item.id] || ''}
                          onChange={(e) => handleForm(item.id, e.target.value)}
                          placeholder="오늘의 감사를 기록하십시오..."
                          className={`w-full p-1.5 text-[12px] outline-none ${inputStyle}`}
                          style={fontSerif}
                        />
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => syncToPipeline('diary', {
                      d1: forms.wk3_t1, d2: forms.wk3_t2, d3: forms.wk3_t3,
                      d4: forms.wk3_t4, d5: forms.wk3_t5, d6: forms.wk3_t6, d7: forms.wk3_t7
                    })}
                    className={`w-full py-2 text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                      _isDark ? 'bg-[#7A2E26] text-white border-[#7A2E26]' : 'bg-[#1B365D] text-white border-[#1B365D]'
                    }`}
                    style={fontSans}
                  >
                    <IconSend /> 7일 감사 훈련 기록을 '감사/간증 일기장'에 저장 및 오늘의 감사 체크
                  </button>
                </div>

                {/* § 3.3 고난 해석 정밀 워크시트 (18대 항목 - 3단계 그룹핑으로 가독성 극대화) */}
                <div className={`p-3 border ${subBox} space-y-2.5`}>
                  <div className="flex items-center justify-between" style={fontSans}>
                    <h4 className={`text-[12.5px] font-bold ${textHead}`}>
                      § 3.3 고난 해석 정밀 워크시트 (18대 항목 • 책임 분별과 구속사적 순종)
                    </h4>
                    <span className="text-[10.5px] font-mono text-[#7A2E26] dark:text-[#F87171] font-bold">
                      {Array.from({ length: 18 }, (_, i) => `wk3_ws${i + 1}`).filter(k => (forms[k] || '').trim().length > 0).length} / 18 작성됨
                    </span>
                  </div>

                  {/* Phase A: 사건·감정·책임의 정밀 분별 (1~9) */}
                  <div className={`p-2.5 border ${cardBox} space-y-1.5`}>
                    <span className="text-[10.5px] font-mono font-bold text-[#7A2E26] dark:text-[#F87171] block" style={fontSans}>
                      STEP A. 사건 · 내면 욕망 · 책임 영역의 정밀 분별 (01~09)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      {[
                        { id: 'wk3_ws1', label: '01. 발생한 객관적 사건' },
                        { id: 'wk3_ws2', label: '02. 나의 실존적 감정' },
                        { id: 'wk3_ws3', label: '03. 내가 붙인 기존 해석' },
                        { id: 'wk3_ws4', label: '04. 내가 원했던 것(욕망)' },
                        { id: 'wk3_ws5', label: '05. 내가 두려워하는 상실' },
                        { id: 'wk3_ws6', label: '06. 내가 책임지고 회개할 부분' },
                        { id: 'wk3_ws7', label: '07. 내가 통제/책임질 수 없는 부분' },
                        { id: 'wk3_ws8', label: '08. 하나님께 맡길 타인의 몫' },
                        { id: 'wk3_ws9', label: '09. 아직 다 알 수 없는 섭리의 영역' }
                      ].map(w => (
                        <div key={w.id}>
                          <span className={`text-[10.5px] font-bold ${textHead} block mb-0.5`} style={fontSans}>{w.label}</span>
                          <input 
                            type="text" 
                            value={forms[w.id] || ''}
                            onChange={(e) => handleForm(w.id, e.target.value)}
                            className={`w-full p-1.5 text-[11.5px] outline-none ${inputStyle}`}
                            style={fontSerif}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Phase B & C: 말씀 조명 및 회개·순종 열매 (10~18) */}
                  <div className={`p-2.5 border ${cardBox} space-y-1.5`}>
                    <span className="text-[10.5px] font-mono font-bold text-[#1B365D] dark:text-[#93C5FD] block" style={fontSans}>
                      STEP B. 말씀·복음 조명 및 값을 치르는 순종 결단 (10~18)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      {[
                        { id: 'wk3_ws10', label: '10. 붙든 성경 본문' },
                        { id: 'wk3_ws11', label: '11. 본문의 구속사적 문맥' },
                        { id: 'wk3_ws12', label: '12. 확인한 하나님의 성품' },
                        { id: 'wk3_ws13', label: '13. 그리스도의 십자가 은혜' },
                        { id: 'wk3_ws14', label: '14. 탄식과 신뢰의 기도문' },
                        { id: 'wk3_ws15', label: '15. 구체적인 회개 제목' },
                        { id: 'wk3_ws16', label: '16. 고난 속 감사의 고백' },
                        { id: 'wk3_ws17', label: '17. 오늘 값을 치를 순종 행동' },
                        { id: 'wk3_ws18', label: '18. 일주일 후 열매 및 재해석' }
                      ].map(w => (
                        <div key={w.id}>
                          <span className={`text-[10.5px] font-bold ${textHead} block mb-0.5`} style={fontSans}>{w.label}</span>
                          <input 
                            type="text" 
                            value={forms[w.id] || ''}
                            onChange={(e) => handleForm(w.id, e.target.value)}
                            className={`w-full p-1.5 text-[11.5px] outline-none ${inputStyle}`}
                            style={fontSerif}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1" style={fontSans}>
                    <button 
                      onClick={() => syncToPipeline('prayer', { p: forms.wk3_ws14 || forms.wk3_ws15 })}
                      className={`py-2 text-[11.5px] font-bold flex items-center justify-center gap-1 cursor-pointer border ${cardBox} ${textHead}`}
                    >
                      <IconSend /> 14·15번 기도함 전송
                    </button>
                    <button 
                      onClick={() => syncToPipeline('qt', { m: forms.wk3_ws15, a: forms.wk3_ws17 })}
                      className={`py-2 text-[11.5px] font-bold flex items-center justify-center gap-1 cursor-pointer border ${cardBox} ${textHead}`}
                    >
                      <IconBook /> 15·17번 매일QT 연동
                    </button>
                    <button 
                      onClick={() => syncToPipeline('apply', { a: forms.wk3_ws17 })}
                      className={`py-2 text-[11.5px] font-bold flex items-center justify-center gap-1 cursor-pointer border ${cardBox} ${textHead}`}
                    >
                      <IconTarget /> 17번 적용 트래커 등록
                    </button>
                  </div>
                </div>

                {/* § 3.4 3주차 검증표 */}
                <div className={`p-3 border ${subBox}`}>
                  <h4 className={`text-[12.5px] font-bold mb-1.5 ${textHead}`} style={fontSans}>
                    § 3.4 3주차 고난·회개·감사 통과 검증표
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {[
                      { id: 'w3_pass1', label: '고난 앞에서 정죄감(벌 받음)과 성화의 훈육(징계)을 구별했다.' },
                      { id: 'w3_pass2', label: '내가 회개할 책임과 하나님께 맡길 영역을 분리하여 기록했다.' },
                      { id: 'w3_pass3', label: '환경이 바뀌지 않아도 하나님 한 분 때문에 감사할 제목을 찾았다.' },
                      { id: 'w3_pass4', label: '단순한 감정적 후회를 넘어 값을 치르는 순종 행동을 실천했다.' }
                    ].map(c => {
                      const isChecked = Boolean(checks[c.id]);
                      return (
                        <div 
                          key={c.id}
                          onClick={() => toggleCheck(c.id)}
                          className={`p-2 border cursor-pointer flex items-center gap-2 ${
                            isChecked ? (_isDark ? 'bg-[#1C2430] border-[#3E526D]' : 'bg-[#F0F5FA] border-[#BDD0E4]') : cardBox
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 border shrink-0 flex items-center justify-center ${
                            isChecked ? 'bg-[#7A2E26] border-[#7A2E26] text-white' : 'border-slate-400'
                          }`}>
                            {isChecked && <IconCheck />}
                          </div>
                          <span className={`text-[11.5px] ${isChecked ? `font-bold ${textHead}` : textBody}`} style={fontSerif}>
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

          {/* ════════ TAB 4: 4주차 공동체·양육교사·재생산 (제4기 10~12주 연동) ════════ */}
          {activeTab === 'wk4' && (
            <div className="space-y-3 w-full">
              <section className={`p-3.5 sm:p-4 ${cardBox} space-y-3`}>
                <div className={`flex flex-wrap items-center justify-between gap-2 pb-2 border-b ${borderRule}`}>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#7A2E26] dark:text-[#F87171] uppercase block" style={fontSans}>
                      WEEK 04 • COMMUNITY & REPRODUCTION (12주 과정 제4기 연동)
                    </span>
                    <h2 className={`text-[15px] sm:text-[17px] font-bold tracking-tight mt-0.5 ${textHead}`} style={fontSerif}>
                      § 4. 공동체와 영적 재생산 — 허물을 덮는 연합과 한 사람을 세우는 제자도
                    </h2>
                  </div>
                  <button
                    onClick={() => handleJumpToBible('에스라', 2)}
                    className="px-2.5 py-1 text-[11px] font-bold bg-[#7A2E26] text-white cursor-pointer"
                    style={fontSans}
                  >
                    📖 스 2장 열기
                  </button>
                </div>

                <div className={`p-3 border-l-4 border-l-[#1B365D] ${subBox} space-y-1`} style={fontSerif}>
                  <strong className={`text-[12px] font-bold block ${textHead}`} style={fontSans}>
                    📖 핵심 원리: 허물이 드러나도 공동체에 붙어 있고, 바르실래처럼 무명으로 한 영혼을 세운다
                  </strong>
                  <p className={`text-[12px] leading-relaxed ${textBody} break-keep`}>
                    제자훈련의 완성은 개인적 수료가 아니라 <strong>영적 재생산(아비의 마음)</strong>입니다. 나의 약점과 허물이 드러나도 언약 공동체를 떠나지 않고 투명하게 나누며(에스라 2:59–70), 보상을 바라지 않는 바르실래의 무명 충성(사무엘하 19:31–39)으로 또 다른 한 영혼을 말씀 앞에 세울 때 공동체의 등불은 결코 꺼지지 않습니다.
                  </p>
                </div>

                {/* § 4.2 재생산 가능성 10대 평가 척도 */}
                <div className={`p-3 border ${subBox}`}>
                  <div className="flex items-center justify-between mb-1.5" style={fontSans}>
                    <h4 className={`text-[12.5px] font-bold ${textHead}`}>
                      § 4.2 영적 리더 및 재생산 준비도 10대 평가 척도
                    </h4>
                    <span className="text-[10.5px] font-mono text-[#7A2E26] dark:text-[#F87171] font-bold">
                      준비도: {['wk4_re1','wk4_re2','wk4_re3','wk4_re4','wk4_re5','wk4_re6','wk4_re7','wk4_re8','wk4_re9','wk4_re10'].filter(k => checks[k]).length * 10}%
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {[
                      { id: 'wk4_re1', label: '누가 시키지 않아도 스스로 매일 말씀 묵상(QT)을 지속한다.' },
                      { id: 'wk4_re2', label: '성경 본문의 뜻과 내 주관적 생각을 명확히 구분한다.' },
                      { id: 'wk4_re3', label: '사건 속에서 남의 허물보다 내 안의 죄를 말씀으로 먼저 본다.' },
                      { id: 'wk4_re4', label: '감정적 후회에 머물지 않고 하나님 앞에 정직히 회개한다.' },
                      { id: 'wk4_re5', label: '원치 않는 고난 속에서도 하나님의 주권을 인정하며 감사한다.' },
                      { id: 'wk4_re6', label: '깨달은 말씀을 값을 치르는 구체적인 행동으로 삶에 적용한다.' },
                      { id: 'wk4_re7', label: '공동체 지체의 아픔을 섣부른 조언 없이 아비의 마음으로 경청한다.' },
                      { id: 'wk4_re8', label: '내 답을 강요하지 않고 질문으로 지체가 말씀을 만나게 돕는다.' },
                      { id: 'wk4_re9', label: '내 자랑이 아닌 구속사적 은혜 중심으로 간증을 나눌 수 있다.' },
                      { id: 'wk4_re10', label: '보상 없는 무명의 자리에서 한 영혼을 품고 섬길 준비가 되었다.' }
                    ].map(r => {
                      const isChecked = Boolean(checks[r.id]);
                      return (
                        <div 
                          key={r.id}
                          onClick={() => toggleCheck(r.id)}
                          className={`p-2 border cursor-pointer flex items-center gap-2 ${
                            isChecked ? (_isDark ? 'bg-[#1C2430] border-[#3E526D]' : 'bg-[#F0F5FA] border-[#BDD0E4]') : cardBox
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 border shrink-0 flex items-center justify-center ${
                            isChecked ? 'bg-[#7A2E26] border-[#7A2E26] text-white' : 'border-slate-400'
                          }`}>
                            {isChecked && <IconCheck />}
                          </div>
                          <span className={`text-[11.5px] ${isChecked ? `font-bold ${textHead}` : textBody}`} style={fontSerif}>
                            {r.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* § 4.3 설교 신학 연구 카드 (16문항 + 99+편 코퍼스 연동 + 목장 나눔 실제 저장) */}
                <div className={`p-3 border ${subBox} space-y-2`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-inherit" style={fontSans}>
                    <h4 className={`text-[12.5px] font-bold ${textHead}`}>
                      § 4.3 소그룹 인도자를 위한 설교 신학 연구 카드 (16대 항목)
                    </h4>
                    <select
                      onChange={(e) => {
                        const idx = e.target.value;
                        if (idx === '') return;
                        const s = sermonCorpus[Number(idx)];
                        if (!s) return;
                        setForms(prev => ({
                          ...prev,
                          wk4_sc1: s.title,
                          wk4_sc2: s.date,
                          wk4_sc3: s.verse,
                          wk4_sc4: s.summary || `${s.title} (${s.verse})`,
                          wk4_sc5: s.keywords
                        }));
                        showToast(`📚 [${s.title}] 설교 데이터가 연구 카드에 로드되었습니다!`);
                      }}
                      defaultValue=""
                      className={`px-2 py-1 text-[11px] font-bold border outline-none cursor-pointer ${inputStyle}`}
                    >
                      <option value="">📚 {sermonCorpus.length}편 설교 코퍼스에서 연구할 설교 선택...</option>
                      {sermonCorpus.map((s, idx) => (
                        <option key={idx} value={idx}>
                          [{s.date}] {s.title} ({s.verse})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      { id: 'wk4_sc1', label: '01. 설교 제목' }, { id: 'wk4_sc2', label: '02. 선포 일자' },
                      { id: 'wk4_sc3', label: '03. 성경 본문' }, { id: 'wk4_sc4', label: '04. 본문의 핵심 명제' },
                      { id: 'wk4_sc5', label: '05. 핵심 구속사 키워드' }, { id: 'wk4_sc6', label: '06. 계시된 하나님의 성품과 주권' },
                      { id: 'wk4_sc7', label: '07. 그리스도의 대속과 복음 연결' }, { id: 'wk4_sc8', label: '08. 폭로된 인간의 죄와 자기기만' },
                      { id: 'wk4_sc9', label: '09. 촉구하는 참된 회개의 방향' }, { id: 'wk4_sc10', label: '10. 고난에 대한 성경적 재해석' },
                      { id: 'wk4_sc11', label: '11. 성도가 드려야 할 감사의 내용' }, { id: 'wk4_sc12', label: '12. 언약 공동체(교회/목장)를 향한 메시지' },
                      { id: 'wk4_sc13', label: '13. 소그룹에서 나눌 실천적 적용 질문' }, { id: 'wk4_sc14', label: '14. 인도자의 구속사적 문맥 정리' },
                      { id: 'wk4_sc15', label: '15. 정경적 교차참조 구절 검증' }, { id: 'wk4_sc16', label: '16. 정통 교리(칭의·성화·섭리) 부합성 확인' }
                    ].map(s => (
                      <div key={s.id}>
                        <span className={`text-[10.5px] font-bold ${textHead} block mb-0.5`} style={fontSans}>{s.label}</span>
                        <input 
                          type="text" 
                          value={forms[s.id] || ''}
                          onChange={(e) => handleForm(s.id, e.target.value)}
                          className={`w-full p-1.5 text-[11.5px] outline-none ${inputStyle}`}
                          style={fontSerif}
                        />
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => syncToPipeline('cell', null)}
                    className={`w-full mt-2 py-2 text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                      _isDark ? 'bg-[#202630] text-[#E6EDF3] border-[#364052]' : 'bg-[#EDE8DC] text-[#1A202C] border-[#CBC1AD]'
                    }`}
                    style={fontSans}
                  >
                    <IconSend /> 이 연구 카드를 '목장 나눔' 데이터로 실제 저장 및 클립보드 복사
                  </button>
                </div>

                {/* § 4.4 최종 프로젝트 (원클릭 자동 조립 기능 포함) */}
                <div className={`p-3 border ${subBox} space-y-2`}>
                  <div className="flex flex-wrap items-center justify-between gap-2" style={fontSans}>
                    <div>
                      <h4 className={`text-[12.5px] font-bold ${textHead}`}>
                        § 4.4 4주 심화 종합 프로젝트: "말씀으로 다시 읽은 나의 4주"
                      </h4>
                      <p className={`text-[11px] ${textMuted}`}>
                        1~3주차 동안 작성한 기록을 하나로 묶어 나의 구속사적 변화와 한 영혼 섬김 계획을 완성합니다.
                      </p>
                    </div>
                    <button
                      onClick={buildFinalProjectDraft}
                      className={`px-3 py-1.5 text-[11px] font-bold border cursor-pointer flex items-center gap-1 ${
                        _isDark ? 'bg-[#7A2E26] text-white border-[#7A2E26]' : 'bg-[#1B365D] text-white border-[#1B365D]'
                      }`}
                    >
                      <IconSparkles /> 1~3주차 작성 내용으로 초안 자동 조립하기
                    </button>
                  </div>

                  <textarea 
                    value={forms['wk4_final_proj'] || ''}
                    onChange={(e) => handleForm('wk4_final_proj', e.target.value)}
                    className={`w-full p-3 text-[12.5px] leading-relaxed resize-y min-h-[180px] outline-none ${inputStyle}`}
                    placeholder="우측 상단의 [1~3주차 작성 내용으로 초안 자동 조립하기] 버튼을 누르시거나, 이곳에 4주간의 종합 간증과 재생산 서약을 작성하십시오."
                    style={fontSerif}
                  />

                  <div className="flex flex-wrap gap-1.5" style={fontSans}>
                    <button
                      onClick={() => syncToPipeline('diary', { proj: forms['wk4_final_proj'] }, '🎉 4주 최종 프로젝트가 감사/간증 일기장에 영구 보관되었습니다!')}
                      className={`flex-1 py-2 text-[11.5px] font-bold border cursor-pointer flex items-center justify-center gap-1 ${cardBox} ${textHead}`}
                    >
                      <IconSend /> 감사/간증 일기장에 영구 보관
                    </button>
                    <button
                      onClick={() => {
                        const txt = forms['wk4_final_proj'] || '';
                        if (!txt.trim()) return alert('저장할 프로젝트 내용이 없습니다.');
                        const tcNotes = getLocal('diary_curriculum_notes', {});
                        tcNotes[12] = txt;
                        setLocal('diary_curriculum_notes', tcNotes);
                        showToast('🏆 12주 마스터 커리큘럼 최종 12주차 성찰 일지에도 동기화되었습니다!');
                      }}
                      className={`flex-1 py-2 text-[11.5px] font-bold border cursor-pointer flex items-center justify-center gap-1 ${cardBox} ${textHead}`}
                    >
                      🔗 12주 커리큘럼 수료 일지와 동기화
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ════════ TAB 5: 정통 교리·신앙 기준서 (생명에 이르는 회개와 기도의 규범) ════════ */}
          {activeTab === 'wcf' && (
            <div className="space-y-3 w-full">
              <section className={`p-3.5 sm:p-4 ${cardBox} space-y-3`}>
                <div className={`flex items-center justify-between pb-2 border-b ${borderRule}`}>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#7A2E26] dark:text-[#F87171] uppercase block" style={fontSans}>
                      DOCTRINAL STANDARDS & SPIRITUAL SAFEGUARDS • § STD
                    </span>
                    <h2 className={`text-[15px] sm:text-[17px] font-bold tracking-tight mt-0.5 ${textHead}`} style={fontSerif}>
                      § 5. 정통 교리·신앙 기준서 — 생명에 이르는 회개와 기도의 표준
                    </h2>
                  </div>
                  <span className={`text-[10px] font-mono ${textMuted}`}>ORTHODOX FRAMEWORK</span>
                </div>

                <div className={`p-2.5 border text-[11.5px] leading-relaxed font-mono ${subBox}`}>
                  [구속사적 교리 체계] 성경의 절대 권위 ➔ 하나님의 작정과 섭리 ➔ 인간의 전적 타락 ➔ 그리스도의 구속 언약 ➔ 칭의와 성화 ➔ 생명에 이르는 회개 ➔ 은혜의 방도(말씀·기도) ➔ 성도의 교제와 영화
                </div>

                {/* § 5.1 생명에 이르는 회개 8단계 실습 */}
                <div className={`p-3 border ${subBox} space-y-2`}>
                  <div className="space-y-0.5">
                    <h4 className={`text-[12.5px] font-bold ${textHead}`} style={fontSans}>
                      § 5.1 ‘생명에 이르는 회개’ 8단계 교리 실습
                    </h4>
                    <p className={`text-[11.5px] ${textMuted}`} style={fontSerif}>
                      참된 회개는 성령께서 말씀으로 내 죄의 위험성과 더러움을 깨닫게 하실 때, 그리스도 안에서 베푸시는 긍휼을 붙들고 죄를 미워하며 떠나 하나님과 동행하기로 결단하는 구원의 은혜입니다.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      { id: 'wcf_q76_1', label: '① 사건: 내 삶에 어떤 구체적인 일이 있었는가?' },
                      { id: 'wcf_q76_2', label: '② 감정: 그때 내 안에서 요동친 감정은 무엇이었는가?' },
                      { id: 'wcf_q76_3', label: '③ 욕구: 나는 그 상황에서 무엇을 내 뜻대로 관철하려 했는가?' },
                      { id: 'wcf_q76_4', label: '④ 우상: 하나님보다 더 두려워하거나 의지한 우상은 무엇인가?' },
                      { id: 'wcf_q76_5', label: '⑤ 죄의 직면: 하나님의 거룩한 성품과 계명에 비추어 무엇이 죄인가?' },
                      { id: 'wcf_q76_6', label: '⑥ 복음의 긍휼: 정죄를 거두시는 그리스도의 보혈 은혜는 무엇인가?' },
                      { id: 'wcf_q76_7', label: '⑦ 돌이킴(회개): 이제 어떤 죄악된 태도와 습관에서 돌아설 것인가?' },
                      { id: 'wcf_q76_8', label: '⑧ 새 순종: 오늘 하나님과 동행하기 위해 실천할 행동은 무엇인가?' }
                    ].map(q => (
                      <div key={q.id}>
                        <span className={`text-[11px] font-bold ${textHead} block mb-0.5`} style={fontSans}>{q.label}</span>
                        <input 
                          type="text" 
                          value={forms[q.id] || ''}
                          onChange={(e) => handleForm(q.id, e.target.value)}
                          placeholder="교리 기준에 따라 내 마음을 기록하십시오..."
                          className={`w-full p-1.5 text-[12px] outline-none ${inputStyle}`}
                          style={fontSerif}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => syncToPipeline('apply', { r7: forms.wcf_q76_7, r8: forms.wcf_q76_8 })}
                    className={`w-full py-2 text-[11.5px] font-bold border cursor-pointer flex items-center justify-center gap-1.5 ${cardBox} ${textHead}`}
                    style={fontSans}
                  >
                    <IconTarget /> ⑦·⑧번 회개와 새 순종 결단을 '적용 트래커'로 전송
                  </button>
                </div>

                {/* § 5.2 기도와 감사의 5대 고백록 */}
                <div className={`p-3 border ${subBox} space-y-2`}>
                  <div className="space-y-0.5">
                    <h4 className={`text-[12.5px] font-bold ${textHead}`} style={fontSans}>
                      § 5.2 ‘그리스도의 이름으로 드리는 기도와 감사’ 5문항 고백록
                    </h4>
                    <p className={`text-[11.5px] ${textMuted}`} style={fontSerif}>
                      기도는 내 욕망을 관철하는 주문이 아니라, 성령의 도우심으로 하나님의 뜻에 합당한 것을 그리스도의 이름으로 구하며 죄를 자백하고 자비하심에 감사히 아뢰는 영적 호흡입니다.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { id: 'wcf_thx1', label: '1. 오늘 하나님께 거저 받은 은혜와 축복' },
                      { id: 'wcf_thx2', label: '2. 오늘 말씀을 통해 새롭게 깨달은 하나님의 뜻' },
                      { id: 'wcf_thx3', label: '3. 그리 아니하실지라도 드리는 감사의 고백' },
                      { id: 'wcf_thx4', label: '4. 내 뜻을 내려놓고 주님의 뜻에 순종할 한 가지' },
                      { id: 'wcf_thx5', label: '5. 그리스도의 이름으로 올려드리는 간구와 중보기도' }
                    ].map(item => (
                      <div key={item.id}>
                        <span className={`text-[11px] font-bold ${textHead} block mb-0.5`} style={fontSans}>{item.label}</span>
                        <input 
                          type="text" 
                          value={forms[item.id] || ''}
                          onChange={(e) => handleForm(item.id, e.target.value)}
                          placeholder="기록하십시오..."
                          className={`w-full p-1.5 text-[12px] outline-none ${inputStyle}`}
                          style={fontSerif}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => syncToPipeline('prayer', { p1: forms.wcf_thx3, p2: forms.wcf_thx5 })}
                    className={`w-full py-2 text-[11.5px] font-bold border cursor-pointer flex items-center justify-center gap-1.5 ${cardBox} ${textHead}`}
                    style={fontSans}
                  >
                    <IconSend /> 위 감사와 기도를 '기도 보관함'으로 전송
                  </button>
                </div>

                {/* § 5.3 정통 신학적 안전장치 점검표 */}
                <div className={`p-3 border ${subBox}`}>
                  <h4 className={`text-[12.5px] font-bold mb-1.5 ${textHead}`} style={fontSans}>
                    § 5.3 건강한 제자도를 지키는 6대 신학적 안전장치 점검표
                  </h4>
                  <div className="space-y-1">
                    {[
                      { id: 'wcf_f1', label: '성경의 권위: 성경을 신앙과 삶의 최종 기준으로 삼고, 내 주관적 감정이나 직관을 직통 계시와 혼동하지 않는다.' },
                      { id: 'wcf_f2', label: '은혜의 복음: 칭의와 성화를 바르게 구분하며, 나의 큐티나 봉사 열심을 구원의 공로로 삼지 않는다.' },
                      { id: 'wcf_f3', label: '정죄 배격: 죄를 직면하되 율법적 자기혐오에 빠지지 않고, 타인의 고난 원인을 인과응보로 함부로 단정하지 않는다.' },
                      { id: 'wcf_f4', label: '주권적 섭리: 우연이나 운명론을 배격하고, 모든 사건 속에서 하나님의 선하신 섭리를 인정하며 오늘의 순종을 찾는다.' },
                      { id: 'wcf_f5', label: '구속사적 감사: 환경적 조건만이 아닌 구원하신 하나님 자체를 즐거워하며, 감사가 거룩한 삶의 열매로 이어진다.' },
                      { id: 'wcf_f6', label: '공교회 연합: 나 홀로 신앙에 갇히지 않고, 예배와 성도의 교제에 붙어 있어 서로의 짐을 지고 덕을 세운다.' }
                    ].map(c => {
                      const isChecked = Boolean(checks[c.id]);
                      return (
                        <div 
                          key={c.id}
                          onClick={() => toggleCheck(c.id)}
                          className={`p-2 border cursor-pointer flex items-center gap-2 ${
                            isChecked ? (_isDark ? 'bg-[#1C2430] border-[#3E526D]' : 'bg-[#F0F5FA] border-[#BDD0E4]') : cardBox
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 border shrink-0 flex items-center justify-center ${
                            isChecked ? 'bg-[#7A2E26] border-[#7A2E26] text-white' : 'border-slate-400'
                          }`}>
                            {isChecked && <IconCheck />}
                          </div>
                          <span className={`text-[11.5px] leading-snug break-keep ${isChecked ? `font-bold ${textHead}` : textBody}`} style={fontSerif}>
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
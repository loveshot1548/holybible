// src/pages/TrainingCurriculum.js
import React, { useState, useEffect, useMemo } from 'react';

// =====================================================================
// 로컬 스토리지 헬퍼 (모든 입력 데이터 영구 저장 100% 무손실 보존)
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
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const IconSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconTarget = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const IconSend = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;
const IconLock = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><rect x="3" y="11" width="18" height="11" rx="1" ry="1"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconChevronDown = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><polyline points="6 9 12 15 18 9" /></svg>;
const IconChevronUp = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><polyline points="18 15 12 9 6 15" /></svg>;
const IconSparkles = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>;

// 🌱 영적 성장 4단계 인장 아이콘 (Plant Seals)
const SeedIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 22c5.523 0 10-4.477 10-10 0-4.5-4-9-10-10C6 3 2 7.5 2 12c0 5.523 4.477 10 10 10z"/></svg>;
const SproutIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 22V12"/><path d="M12 12C7 12 4 7 4 7c0 5 3 9 8 9z"/><path d="M12 12c5 0 8-5 8-5 0 5-3 9-8 9z"/></svg>;
const SaplingIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 22V8"/><path d="M12 14c-4 0-6-3-6-3 0 4 2 6 6 6z"/><path d="M12 10c4 0 6-3 6-3 0 4-2 6-6 6z"/></svg>;
const TreeIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17 5c0-2.8-2.2-5-5-5S7 2.2 7 5c0 1.3.5 2.5 1.4 3.4C6.1 9.6 4 11.8 4 14.5 4 17.5 6.5 20 9.5 20h5c3 0 5.5-2.5 5.5-5.5 0-2.7-2.1-4.9-4.4-6.1C16.5 7.5 17 6.3 17 5z"/><path d="M11 20h2v4h-2z" fill="currentColor"/></svg>;

// =====================================================================
// 📚 기본 내장 설교 코퍼스 (실시간 /sermon_summary.json 99+편과 자동 병합됨)
// =====================================================================
const SERMON_DATA = [
  { date: "2026-02-01", type: "주일예배", title: "복 받을 자로 살아가라", verse: "마태복음 25:31-46", keywords: "공동체, 섬김, 심판, 생색" },
  { date: "2026-02-11", type: "수요예배", title: "감추인 천국", verse: "마가복음 4:26-34", keywords: "씨뿌림, 열매, 천국" },
  { date: "2026-02-15", type: "주일예배", title: "주님이 기뻐하시는 유월절을 준비하라", verse: "마태복음 26:17-30", keywords: "유월절, 순종, 보혈" },
  { date: "2026-02-18", type: "수요예배", title: "예수님의 복음의 사역", verse: "마가복음 6:7-16", keywords: "파송, 전도, 예수이름" },
  { date: "2026-02-22", type: "주일예배", title: "아버지의 원대로 살아가는 삶", verse: "마태복음 26:31-46", keywords: "겟세마네, 순종, 자기부인" },
  { date: "2026-02-25", type: "주일예배", title: "에바다 (열리라)", verse: "마가복음 7:31-37", keywords: "치유, 복음, 전도" },
  { date: "2026-03-01", type: "주일예배", title: "위대한 발견", verse: "누가복음 5:1-11", keywords: "죄인발견, 영생, 부르심" },
  { date: "2026-03-04", type: "수요예배", title: "섬기는 자가 되려면", verse: "마가복음 9:30-37", keywords: "섬김, 낮아짐, 마음지킴" },
  { date: "2026-03-06", type: "금요예배", title: "하나님이 짝지어주신 결혼", verse: "마가복음 10:1-12", keywords: "가정, 거룩, 언약" },
  { date: "2026-03-08", type: "주일예배", title: "성경대로 이루어지는 삶", verse: "마태복음 26:47-56", keywords: "배신, 혈기, 십자가" },
  { date: "2026-03-09", type: "기상오기", title: "앞서가시는 예수님", verse: "마가복음 10:32-45", keywords: "동행, 고난, 터널" },
  { date: "2026-03-10", type: "기상오기", title: "예수님을 따라가는 길", verse: "마가복음 10:41-52", keywords: "바디매오, 믿음, 응답" },
  { date: "2026-03-11", type: "기상오기", title: "주가 쓰시는 사람이 됩시다", verse: "마가복음 11:1-7", keywords: "나귀, 순종, 쓰임" },
  { date: "2026-03-12", type: "기상오기", title: "호산나 찬양을 드리려면", verse: "마가복음 11:8-14", keywords: "호산나, 구원, 열매" },
  { date: "2026-03-13", type: "기상오기", title: "기도의 집, 성전 되기", verse: "마가복음 11:15-26", keywords: "성전, 기도, 믿음" },
  { date: "2026-03-22", type: "주일예배", title: "베드로의 통곡", verse: "마태복음 26:69-75", keywords: "실패, 회개, 통곡" },
  { date: "2026-03-25", type: "수요예배", title: "우리는 조각목입니다", verse: "출애굽기 25:9-16", keywords: "조각목, 성막, 연단" },
  { date: "2026-03-29", type: "주일예배", title: "십자가 위의 일곱 말씀", verse: "누가복음 23:39-43", keywords: "가상칠언, 용서, 구원" },
  { date: "2026-04-01", type: "수요예배", title: "유대인의 왕 예수님의 십자가", verse: "마가복음 15:12-20", keywords: "십자가, 고난, 대속" },
  { date: "2026-04-03", type: "금요예배", title: "예수님께서 숨지시다", verse: "마가복음 15:33-41", keywords: "성소휘장, 죽음, 대속" },
  { date: "2026-04-05", type: "주일예배", title: "부활의 증인", verse: "마가복음 16:1-8", keywords: "부활, 증인, 생명" },
  { date: "2026-04-06", type: "기상오기", title: "만민에게 복음을 전파하라", verse: "마가복음 16:14-20", keywords: "지상명령, 전파, 기적" },
  { date: "2026-04-07", type: "기상오기", title: "하나님이 일어나시면", verse: "시편 68:1-6", keywords: "전쟁, 기도, 승리" },
  { date: "2026-04-08", type: "기상오기", title: "말씀을 붙들고 살아가는 삶", verse: "시편 68:11-23", keywords: "말씀, 승리, 언약" },
  { date: "2026-04-09", type: "기상오기", title: "하나님을 찬양하라", verse: "시편 68:24-35", keywords: "찬양, 영광, 예배" },
  { date: "2026-04-10", type: "기상오기", title: "위기 속에서 하나님께 집중하라", verse: "시편 69:1-12", keywords: "위기, 탄식, 집중" },
  { date: "2026-04-12", type: "주일예배", title: "믿음 없는 자여, 온 천하에 나가라", verse: "마가복음 16:14-20", keywords: "믿음, 사명, 전도" },
  { date: "2026-04-15", type: "수요예배", title: "이름을 기억하시는 하나님", verse: "에스라 2:1-35", keywords: "기억, 족보, 귀환" },
  { date: "2026-04-17", type: "금요예배", title: "허물이 드러나도 공동체에 붙어 있으라", verse: "에스라 2:59-70", keywords: "허물, 공동체, 회복" },
  { date: "2026-04-19", type: "주일예배", title: "말씀을 이루는 사람", verse: "에스라 1:1-4", keywords: "성취, 고레스, 주권" },
  { date: "2026-04-26", type: "주일예배", title: "영접하는 자, 하나님의 자녀", verse: "요한복음 1:12", keywords: "영접, 자녀, 권세" },
  { date: "2026-04-29", type: "수요예배", title: "준비된 한 사람", verse: "에스라 7:11-20", keywords: "에스라, 준비, 헌신" },
  { date: "2026-05-01", type: "금요예배", title: "올라온 자들", verse: "에스라 8:1-14", keywords: "귀환, 헌신, 공동체" },
  { date: "2026-05-03", type: "주일예배", title: "다시 건축하라", verse: "에스라 5:11-17", keywords: "재건, 성전, 사명" },
  { date: "2026-05-06", type: "수요예배", title: "의로우신 주님을 만나려면", verse: "에스라 9:10-15", keywords: "의, 회개, 은혜" },
  { date: "2026-05-08", type: "금요예배", title: "주의 뜻대로 살아가려면", verse: "에스라 10:9-17", keywords: "결단, 뜻, 순종" },
  { date: "2026-05-12", type: "기상오기", title: "다윗의 활 노래", verse: "사무엘하 1:17-27", keywords: "애가, 다윗, 우정" },
  { date: "2026-05-13", type: "기상오기", title: "약속으로 세워지는 나라", verse: "사무엘하 2:1-11", keywords: "언약, 유다, 다윗" },
  { date: "2026-05-14", type: "기상오기", title: "내 힘을 의지하지 말라", verse: "사무엘하 2:12-23", keywords: "아브넬, 요압, 교만" },
  { date: "2026-05-15", type: "기상오기", title: "점점 강해지는 자", verse: "사무엘하 2:24-3:1", keywords: "다윗의 집, 사울의 집" },
  { date: "2026-05-17", type: "주일예배", title: "죄를 드러낼 때 찾아오는 회복", verse: "에스라 10:1-3", keywords: "죄고백, 회복, 공동체" },
  { date: "2026-05-20", type: "수요예배", title: "내가 약하여서", verse: "사무엘하 3:35-4:4", keywords: "약함, 다윗, 주권" },
  { date: "2026-05-22", type: "금요예배", title: "베레스 웃사", verse: "사무엘하 6:1-8", keywords: "웃사, 거룩, 심판" },
  { date: "2026-05-29", type: "금요예배", title: "하나님의 뜻대로 큰일을 경험하려면", verse: "사무엘하 7:4-18", keywords: "언약, 다윗, 성전" },
  { date: "2026-05-31", type: "주일예배", title: "실패를 딛고 일어나라", verse: "사무엘하 6:12-17", keywords: "언약궤, 기쁨, 예배" },
  { date: "2026-06-05", type: "금요예배", title: "전장에 가지 않았던 다윗", verse: "사무엘하 11:1-5", keywords: "다윗, 범죄, 영적나태" },
  { date: "2026-06-07", type: "주일예배", title: "어디를 가든지 이기게 하시는 하나님", verse: "사무엘하 8:1-6", keywords: "승리, 주권, 동행" },
  { date: "2026-06-09", type: "기상오기", title: "당신이 그 사람이에요", verse: "사무엘하 12:1-9", keywords: "나단, 직언, 자기기만" },
  { date: "2026-06-10", type: "기상오기", title: "정죄는 없으나 징계는 있다", verse: "사무엘하 12:10-17", keywords: "원죄, 징계, 성화" },
  { date: "2026-06-11", type: "기상오기", title: "회개할 때 주시는 하나님의 회복", verse: "사무엘하 12:18-23", keywords: "회복, 탄식, 이타주의" },
  { date: "2026-06-12", type: "기상오기", title: "회개할 때 주시는 하나님의 사랑", verse: "사무엘하 12:24-32", keywords: "솔로몬, 사랑, 긍휼" },
  { date: "2026-06-17", type: "주일예배", title: "하나님 없는 인간의 방법은 죄입니다", verse: "사무엘하 14:1-3", keywords: "인본주의, 요압, 죄" },
  { date: "2026-06-21", type: "주일예배", title: "회심의 자리에서 회개의 자리로", verse: "마태복음 26:75-27:5", keywords: "가룟유다, 베드로, 회개" },
  { date: "2026-06-24", type: "수요예배", title: "죄를 지으면 수치와 징계를 받습니다", verse: "사무엘하 15:29-37", keywords: "압살롬, 반역, 징계" },
  { date: "2026-06-26", type: "금요예배", title: "선으로 갚아 주시리라", verse: "사무엘하 16:9-14", keywords: "시므이, 인내, 보응" },
  { date: "2026-06-28", type: "주일예배", title: "크게 놀라운 믿음", verse: "마태복음 27:11-26", keywords: "빌라도, 예수님, 믿음" },
  { date: "2026-07-01", type: "수요예배", title: "너그러운 아비의 마음을 가지려면", verse: "사무엘하 18:1-5", keywords: "압살롬, 아비, 긍휼" },
  { date: "2026-07-03", type: "금요예배", title: "소식을 전하는 자의 분별력", verse: "사무엘하 18:19-27", keywords: "사신, 소식, 분별" },
  { date: "2026-07-05", type: "주일예배", title: "십자가를 지는 사람", verse: "마태복음 27:27-37", keywords: "십자가, 고난, 죄패" },
  { date: "2026-07-06", type: "기상오기", title: "왕을 영접하다", verse: "사무엘하 19:11-23", keywords: "영접, 다윗, 화해" },
  { date: "2026-07-07", type: "기상오기", title: "받은 은혜를 간직하다", verse: "사무엘하 19:21-30", keywords: "시므이, 은혜, 기억" },
  { date: "2026-07-08", type: "기상오기", title: "바르실래처럼", verse: "사무엘하 19:31-39", keywords: "바르실래, 섬김, 무명" },
  { date: "2026-07-09", type: "기상오기", title: "유다와 이스라엘의 언쟁과 분열", verse: "사무엘하 19:40-20:2", keywords: "분열, 교만, 통합" },
  { date: "2026-07-10", type: "기상오기", title: "사람의 계획보다 크신 구원", verse: "사무엘하 20:3-10", keywords: "구원, 주권, 섭리" },
  { date: "2026-07-12", type: "주일예배", title: "진실로 하나님의 아들이었도다", verse: "마태복음 27:45-56", keywords: "십자가, 죽음, 백부장" },
  { date: "2026-07-15", type: "수요예배", title: "함께한 등불은 꺼지지 않습니다", verse: "사무엘하 21:15-22", keywords: "동역자, 등불, 승리" },
  { date: "2026-07-17", type: "금요예배", title: "하나님을 의지하는 사람", verse: "시편 18:16-29", keywords: "의지, 반석, 방패" },
  { date: "2026-07-19", type: "주일예배", title: "예수님의 장례식", verse: "마태복음 27:57-66", keywords: "아리마대요셉, 무덤, 헌신" },
  { date: "2026-07-22", type: "수요예배", title: "당신은 무엇을 세고 있습니까?", verse: "사무엘하 24:1-9", keywords: "인구조사, 교만, 의지" },
  { date: "2026-07-24", type: "금요예배", title: "재앙이 그치고 회복과 부흥이 임하려면", verse: "사무엘하 24:16-25", keywords: "아라우나, 제단, 회복" },
  { date: "2026-07-26", type: "주일예배", title: "말씀하신 대로 살아나셨습니다", verse: "마태복음 28:1-10", keywords: "부활, 기쁨, 증거" },
  { date: "2026-07-29", type: "수요예배", title: "돌이켜 나아가려면", verse: "신명기 2:1-15", keywords: "광야, 순종, 전진" },
  { date: "2026-07-31", type: "금요예배", title: "약속의 땅을 기업으로 삼으려면", verse: "신명기 2:26-37", keywords: "기업, 약속, 정복" },
  { date: "2026-08-02", type: "주일예배", title: "제자삼는 사명을 감당하려면", verse: "마태복음 28:16-20", keywords: "대위임령, 사명, 제자" },
  { date: "2026-08-07", type: "금요예배", title: "언약을 잊지 않으시는 하나님", verse: "신명기 4:21-31", keywords: "언약, 신실하심, 긍휼" },
  { date: "2026-08-09", type: "주일예배", title: "언약을 잊지 않으려면", verse: "신명기 4:15-24", keywords: "우상, 말씀, 기억" },
  { date: "2026-08-14", type: "금요예배", title: "신실하신 하나님", verse: "신명기 7:1-11", keywords: "사랑, 선택, 거룩" },
  { date: "2026-08-16", type: "주일예배", title: "우리 중에 계시는 하나님", verse: "신명기 6:4-9", keywords: "쉐마, 자녀양육, 동행" },
  { date: "2026-08-23", type: "주일예배", title: "주의 기업으로, 주의 자녀로 살아가려면", verse: "신명기 9:22-29", keywords: "기업, 자녀, 주권" }
];

// =====================================================================
// 🏛️ 12주 마스터 제자양육 커리큘럼 (교리·구속사 묵상·설교 코퍼스 100% 심층 결합)
// =====================================================================
const GAMIFIED_PATH_DATA = [
  {
    w: 1,
    phase: "제1기 · 말씀과 자기직면 (1~3주)",
    title: "나는 왜 감사하지 못하는가?",
    desc: "감사에 대한 오해와 불평의 영적 뿌리 해부",
    doctrine: "창조주 하나님의 절대 주권과 은혜의 분별",
    keyVerse: "신명기 8:14-17",
    keyVerseText: "네 마음이 교만하여 네 하나님 여호와를 잊어버릴까 염려하노라... 또 네가 마음에 말하기를 내 능력과 내 손의 힘으로 내가 이 재물을 얻었다 말할 것이라",
    biblicalModel: "인구조사를 통해 자기 힘을 세려 했던 다윗의 교만과 돌이킴 (사무엘하 24:1-9)",
    academicContext: "불평의 본질은 환경의 결핍이 아니라, 내가 내 인생의 주인이 되어 결과를 통제하려는 ‘자기 주권’에 있습니다. 조건부 감사를 넘어 창조주 하나님의 통치 자체를 인정할 때 비로소 불평의 사슬이 끊어집니다.",
    practicePrinciple: "내 손의 힘으로 이루었다는 생색과 교만을 내려놓고, 오늘 당연하게 여겼던 일상과 호흡이 전적인 은혜임을 고백합니다.",
    diagnostics: [
      "내 뜻대로 일이 풀리지 않을 때 하나님과 주변 사람을 먼저 원망한다.",
      "내가 베푼 섬김이나 수고를 누군가 알아주지 않으면 서운함과 생색이 올라온다.",
      "받은 은혜를 세기보다 남과 비교하며 내게 없는 결핍을 먼저 계산한다.",
      "감사를 ‘조건이 해결된 결과’로만 생각하고 ‘믿음의 선택’으로 여기지 못했다."
    ],
    stepPrompts: [
      "① [사건 직면] 최근 내 마음에서 감사를 빼앗고 원망·불평을 일으킨 구체적인 사건은 무엇입니까?",
      "② [우상 분별] 그 불평 밑바닥에 숨어 있는 ‘내가 당연히 누려야 한다는 권리의식(교만)’은 무엇입니까?",
      "③ [복음 재해석] 자격 없는 죄인인 나에게 이미 허락하신 구원과 일상의 은혜를 말씀에 비추어 다시 적어보십시오.",
      "④ [순종 결단] 이번 주 원망 대신 의지적으로 입술을 열어 감사로 선포하고 실천할 한 가지 행동은 무엇입니까?"
    ],
    weeklyMission: "하루 3가지 ‘당연하지 않은 은혜’를 찾아 기록하고, 가족·지체 한 명에게 생색 없이 진심 어린 감사를 표현하기",
    matchKeywords: ["감사", "인구조사", "교만", "생색", "은혜", "기억"]
  },
  {
    w: 2,
    phase: "제1기 · 말씀과 자기직면 (1~3주)",
    title: "말씀 앞에 나를 세우기",
    desc: "성경의 권위와 구속사적 묵상(관찰·내 죄 발견·적용·기도)의 체화",
    doctrine: "성경의 충족성과 성령의 내적 조명 (은혜의 방도)",
    keyVerse: "누가복음 5:8 / 히브리서 4:12",
    keyVerseText: "시몬 베드로가 이를 보고 예수의 무릎 아래에 엎드려 이르되 주여 나를 떠나소서 나는 죄인이로소이다 하니",
    biblicalModel: "깊은 데로 가서 그물을 내리라는 말씀 앞에 엎드려 ‘죄인 됨’을 발견한 베드로 (누가복음 5:1-11)",
    academicContext: "참된 말씀 묵상은 성경 지식을 쌓아 남을 판단하는 도구가 아니라, 살아계신 하나님의 말씀이라는 거울 앞에서 ‘나의 죄인 됨’을 발견하는 위대한 사건입니다. 성령께서는 말씀을 통해 우리의 마음과 생각을 감찰하십니다.",
    practicePrinciple: "말씀을 읽을 때 ‘저 사람이 들어야 할 말씀’으로 튕겨내지 않고, 오늘 ‘나에게 주시는 하나님의 음성’으로 받아 무릎을 꿇습니다.",
    diagnostics: [
      "성경을 읽거나 설교를 들을 때 나보다 배우자나 타인의 얼굴이 먼저 떠오른다.",
      "말씀을 내 기존 생각과 계획을 정당화하기 위한 근거로만 취사선택하곤 한다.",
      "바쁘다는 핑계로 매일 정해진 시간에 말씀 앞에 서는 영적 우선순위가 무너져 있다.",
      "말씀을 읽고 감동은 받지만, 내 삶을 고치는 구체적인 적용까지 나아가지 못한다."
    ],
    stepPrompts: [
      "① [관찰] 오늘 붙든 말씀에서 하나님은 어떤 분이시며, 내게 무엇을 명령(약속)하고 계십니까?",
      "② [자기 발견] 그 말씀의 거울 앞에 서니 부끄럽게 드러나는 나의 불순종과 완고함은 무엇입니까?",
      "③ [은혜 직면] 죄인인 나를 떠나지 않으시고 다시 부르시는 주님의 긍휼은 나에게 어떤 위로가 됩니까?",
      "④ [적용과 기도] 내 경험과 고집을 내려놓고 오늘 말씀 의지하여 깊은 데로 그물을 내릴 순종은 무엇입니까?"
    ],
    weeklyMission: "매일 정한 시간과 장소에서 성경 본문을 소리 내어 읽고, ‘나에게 주시는 말씀’으로 1줄 적용 기록하기",
    matchKeywords: ["말씀", "죄인발견", "부르심", "에스라", "언약", "성경"]
  },
  {
    w: 3,
    phase: "제1기 · 말씀과 자기직면 (1~3주)",
    title: "사건과 해석을 분리하기",
    desc: "발생한 객관적 사실(Fact)과 내 욕망이 덧씌운 왜곡된 해석 구별하기",
    doctrine: "인간의 전적 부패와 지성·감정의 성화",
    keyVerse: "사무엘하 14:1-3 / 잠언 16:2",
    keyVerseText: "사람의 행위가 자기 보기에는 모두 깨끗하여도 여호와는 심령을 감찰하시느니라",
    biblicalModel: "하나님 없는 인간적 술수로 문제를 해결하려 했던 요압과 내 힘을 의지한 교만 (사무엘하 14:1-3)",
    academicContext: "우리를 무너뜨리는 것은 사건 자체가 아니라 사건에 내가 임의로 붙인 ‘인본주의적 해석’입니다. 타락한 본성은 모든 사건을 자기중심적 두려움과 욕망의 렌즈로 왜곡합니다. 사건과 내 해석을 분리할 때 비로소 하나님의 뜻이 보입니다.",
    practicePrinciple: "감정이 요동칠 때 즉시 판단하거나 행동하지 않고, ‘일어난 사실’과 ‘내 생각’을 종이 위에 분리하여 말씀의 필터로 검증합니다.",
    diagnostics: [
      "상대방의 표정이나 말 한마디를 보고 ‘나를 무시했다’고 성급히 단정 짓는다.",
      "어려운 일이 생기면 ‘내 인생은 끝났다’거나 ‘하나님이 나를 버리셨다’고 극단적으로 해석한다.",
      "기도보다 인간적인 계산과 방법(인맥, 혈기, 술수)이 먼저 앞서 나간다.",
      "내 생각과 감정이 곧 객관적인 사실이라고 굳게 믿어 타인의 말을 듣지 않는다."
    ],
    stepPrompts: [
      "① [사실 기록] 내 감정이나 추측을 완전히 빼고, 육하원칙에 따라 실제로 일어난 ‘객관적 사실’만 적어보십시오.",
      "② [내 해석 분리] 그 사실 위에 내가 덧씌운 억측, 두려움, 피해의식, 분노의 해석은 무엇이었습니까?",
      "③ [말씀 분별] 내 인간적인 해석을 내려놓고 하나님의 시선으로 볼 때, 이 사건을 통해 내게 물으시는 질문은 무엇입니까?",
      "④ [반응 전환] 혈기나 인본주의적 방법을 멈추고 성령의 다스림을 따라 선택할 바른 반응은 무엇입니까?"
    ],
    weeklyMission: "이번 주 갈등이나 답답한 순간이 올 때 3분간 침묵하며 ‘사실’과 ‘내 해석’을 나누어 적어보는 훈련 실천하기",
    matchKeywords: ["인본주의", "분별", "혈기", "내 힘", "마음지킴"]
  },
  {
    w: 4,
    phase: "제2기 · 섭리와 고난의 재해석 (4~6주)",
    title: "감사의 근원을 회복하기",
    desc: "환경과 사람 탓을 넘어 ‘하나님 한 분만으로’ 드리는 절대 감사",
    doctrine: "하나님의 특별 섭리와 언약적 신실하심",
    keyVerse: "출애굽기 25:9-16 / 시편 18:16-29",
    keyVerseText: "그들이 조각목으로 궤를 짜되... 순금으로 싸고 그 위 속죄소에서 내가 너와 만나리라",
    biblicalModel: "광야의 거칠고 볼품없는 조각목이 다듬어지고 순금으로 입혀져 언약궤가 되는 은혜 (출애굽기 25:9-16)",
    academicContext: "우리의 본성은 광야의 뒤틀린 가시나무(조각목)와 같아서 스스로는 성전의 기구가 될 수 없습니다. 그러나 하나님의 섭리와 십자가의 순금 은혜가 우리를 감싸 안으셨기에, 우리는 조건이 아닌 ‘구원받은 정체성’ 자체로 감사할 수 있습니다.",
    practicePrinciple: "환경이 바뀌기를 기다리지 않고, 조각목 같은 나를 자녀 삼으시고 함께하시는 임마누엘 하나님 한 분 때문에 감사를 선포합니다.",
    diagnostics: [
      "기도 응답이 내가 원하는 시간과 방식으로 오지 않으면 하나님을 향한 신뢰가 흔들린다.",
      "가정과 일터의 어려움을 환경과 타인의 탓으로만 돌리며 피해자 의식에 머물러 있다.",
      "내가 조각목처럼 다듬어져야 할 죄인임을 잊고, 나는 꽤 괜찮은 사람이라고 여긴다.",
      "고난의 터널을 지날 때 앞서 행하시는 주님의 손길을 보지 못하고 두려움에 빠진다."
    ],
    stepPrompts: [
      "① [정체성 고백] 광야의 조각목처럼 거칠고 자격 없던 나를 하나님이 어떻게 찾아와 건져주셨습니까?",
      "② [원망 해체] 그동안 내가 ‘환경과 사람 때문’이라고 탓하며 감사를 유보했던 영역은 어디입니까?",
      "③ [하나님 감사] 상황이 하나도 바뀌지 않았을지라도, 오직 하나님의 성품과 약속 때문에 감사할 제목은 무엇입니까?",
      "④ [예배의 결단] 실패와 낙심의 자리를 털고 일어나 오늘 기쁨으로 회복해야 할 예배와 기도의 자리는 어디입니까?"
    ],
    weeklyMission: "가장 감사하기 힘든 상황이나 사람 한 명을 놓고, 그 너머에서 일하시는 하나님의 주권을 인정하며 5단계 감사문 작성하기",
    matchKeywords: ["조각목", "언약궤", "반석", "신실", "동행", "찬양"]
  },
  {
    w: 5,
    phase: "제2기 · 섭리와 고난의 재해석 (4~6주)",
    title: "고난의 구속사적 의미",
    desc: "내 인생 고난 지도를 그리고 영혼을 살리는 축복의 약재로 바라보기",
    doctrine: "고난을 통한 성도의 연단과 구속 섭리",
    keyVerse: "마가복음 10:32-45 / 시편 119:71",
    keyVerseText: "고난 당한 것이 내게 유익이라 이로 말미암아 내가 주의 율례들을 배우게 되었나이다",
    biblicalModel: "예루살렘 십자가 고난의 길을 제자들보다 앞서 걸어가시는 예수님 (마가복음 10:32-45)",
    academicContext: "성도에게 임하는 고난은 우연이나 불운이 아니라, 교만한 자아를 깨뜨리고 하나님의 말씀을 들을 수 있는 귀를 열어주는(에바다) 구속사적 통로입니다. 주님은 우리가 지나는 고난의 터널을 이미 앞서 걸어가셨습니다.",
    practicePrinciple: "고난을 ‘빨리 치워버려야 할 장애물’로만 보지 않고, 나를 정결케 하고 하나님께 집중하게 만드는 ‘생명의 약재’로 받아들입니다.",
    diagnostics: [
      "고난이 찾아오면 ‘왜 하필 나에게 이런 일이 생기는가’라는 억울함에 사로잡힌다.",
      "평안할 때는 기도와 말씀을 멀리하다가, 위기가 닥쳐서야 비로소 하나님을 찾는다.",
      "내 인생의 과거 상처와 고난을 부끄러운 흉터로만 여겨 숨기기에 급급하다.",
      "고난을 통해 내게 말씀하시는 영적 교훈을 배우기보다 당장의 문제 해결만 구한다."
    ],
    stepPrompts: [
      "① [고난 지도] 내 인생에서 가장 아팠던 고난의 사건 2~3가지를 돌아보고, 그때 나의 영적 상태는 어떠했는지 적어보십시오.",
      "② [유익 발견] 만약 그 고난의 브레이크가 없었다면, 지금 나는 얼마나 더 교만하고 하나님과 멀어져 있었겠습니까?",
      "③ [앞서가시는 주님] 내가 홀로 버려진 줄 알았던 그 시간 속에서도 나를 붙들고 계셨던 주님의 흔적은 무엇입니까?",
      "④ [집중의 결단] 지금 지나고 있는 위기 속에서 세상 방법을 내려놓고 온전히 주님께만 집중할 기도의 제목은 무엇입니까?"
    ],
    weeklyMission: "내 인생의 고난 연대표를 작성해 보고, 각 고난 옆에 ‘그때 하나님이 내게 주신 영적 유익’을 한 줄씩 기록하기",
    matchKeywords: ["고난", "터널", "위기", "에바다", "약함", "십자가"]
  },
  {
    w: 6,
    phase: "제2기 · 섭리와 고난의 재해석 (4~6주)",
    title: "고난에 대한 잘못된 해석 깨뜨리기",
    desc: "정죄와 부성적 징계의 신학적 구분 및 인과응보적 왜곡 극복",
    doctrine: "칭의의 영원한 안전함과 아버지의 사랑의 징계(성화)",
    keyVerse: "사무엘하 12:10-17 / 로마서 8:1",
    keyVerseText: "그러므로 이제 그리스도 예수 안에 있는 자에게는 결코 정죄함이 없나니",
    biblicalModel: "죄 사함의 은총(정죄 없음)과 삶 속에서 겪는 아버지의 사랑의 매(징계)를 함께 통과한 다윗 (사무엘하 12:10-17)",
    academicContext: "그리스도의 십자가 대속으로 말미암아 성도에게는 영원한 형벌적 ‘정죄(Condemnation)’가 완전히 사라졌습니다. 다만 하나님 아버지께서는 자녀를 거룩하게 빚으시기 위해 사랑의 ‘징계(Chastisement/훈육)’를 허락하십니다. 이 둘을 혼동하면 죄책감에 무너지거나 반대로 방종에 빠집니다.",
    practicePrinciple: "고난 앞에서 ‘내가 저주받았다’는 사탄의 참소(정죄)를 단호히 거절하되, 나를 거룩한 자녀로 빚으시는 아버지의 손길 앞에는 겸손히 순복합니다.",
    diagnostics: [
      "어려운 일을 겪으면 ‘하나님이 나를 미워하셔서 벌을 주신다’는 정죄감에 눌린다.",
      "반대로 ‘이미 구원받았으니 대충 살아도 괜찮다’며 죄의 결과와 징계를 가볍게 여긴다.",
      "타인이 겪는 고난을 보며 속으로 ‘저 사람이 무슨 죄를 지어서 저럴까’라고 쉽게 판단한다.",
      "고난의 책임을 회피하거나 자기 연민에 빠져 하나님께 나아가는 기도의 문을 닫는다."
    ],
    stepPrompts: [
      "① [왜곡 점검] 고난 앞에서 나를 참소하고 무너뜨리려 했던 잘못된 생각(저주, 버림받음, 운명론)은 무엇입니까?",
      "② [교리적 분별] 십자가 보혈로 이미 ‘정죄함은 완전히 사라졌다’는 복음의 선언이 내게 주는 확신은 무엇입니까?",
      "③ [훈육의 수용] 동시에 아버지께서 나를 더 정결하고 거룩하게 빚으시려고 이 사건을 통해 다듬으시는 부분은 어디입니까?",
      "④ [소망의 기도] 정죄감을 떨쳐버리고 사랑의 아버지 품으로 담대히 나아가 아뢸 탄식과 소망의 기도를 적으십시오."
    ],
    weeklyMission: "고난 왜곡 방지 8대 필터(§ Ⅱ 탭)를 하나씩 체크하며 내 안의 율법적 정죄감과 인과응보적 판단 내려놓기",
    matchKeywords: ["정죄", "징계", "성화", "원죄", "보혈", "유월절"]
  },
  {
    w: 7,
    phase: "제3기 · 십자가 회개와 공동체 성화 (7~9주)",
    title: "고난 속에서 내 죄와 우상 발견하기",
    desc: "선지자의 직언 앞에 자기기만을 벗고 ‘내가 바로 그 사람’임을 고백하기",
    doctrine: "성령의 책망과 자기기만의 해체",
    keyVerse: "사무엘하 12:7-13",
    keyVerseText: "나단이 다윗에게 이르되 당신이 그 사람이라... 다윗이 나단에게 이르되 내가 여호와께 죄를 범하였노라 하매",
    biblicalModel: "나단 선지자의 직언(‘당신이 그 사람이라’) 앞에 변명 없이 자신의 죄를 직면한 다윗 (사무엘하 12:1-9)",
    academicContext: "인간의 가장 무서운 영적 질병은 남의 티끌에는 분노하면서도 자신의 들보는 보지 못하는 ‘자기기만’입니다. 참된 영적 부흥은 말씀의 검이 내 심령을 찌를 때 핑계를 멈추고 ‘내가 바로 그 죄인입니다’라고 정직히 고백하는 자리에서 시작됩니다.",
    practicePrinciple: "내게 아픈 권면이나 갈등 상황을 주실 때 자기방어 기제를 내려놓고, 내 안에 숨겨둔 인정욕구·통제욕·영적 나태함의 우상을 찾아냅니다.",
    diagnostics: [
      "누군가 내 잘못이나 약점을 짚어주면 즉시 화가 나고 변명거리부터 찾는다.",
      "영적 긴장감을 놓치고 마땅히 있어야 할 사명과 기도의 자리(전장)를 비우곤 한다.",
      "겉으로는 경건해 보이지만 내면에는 음란, 탐심, 시기, 미움의 죄를 은밀히 품고 있다.",
      "갈등이 생기면 상대방의 잘못 99%만 크게 보이고 내 잘못 1%는 인정하기 싫다."
    ],
    stepPrompts: [
      "① [직언 수용] 최근 말씀이나 주변 사람(배우자, 자녀, 동역자)을 통해 내 양심을 찔렀던 아픈 말은 무엇입니까?",
      "② [우상 폭로] 내가 끝까지 놓지 못하고 하나님보다 더 의지하며 지켜내려 했던 내 마음의 우상(자존심, 물질, 자녀, 평판)은 무엇입니까?",
      "③ [정직한 고백] 남 탓과 환경 탓을 완전히 지우고, ‘내가 여호와께 죄를 범하였나이다’라고 고백할 나의 진짜 죄목은 무엇입니까?",
      "④ [영적 각성] 영적 나태함을 끊고 다시 깨어 있어야 할 나의 영적 전장(예배, 새벽, 가정)은 어디입니까?"
    ],
    weeklyMission: "이번 주 내 마음을 불편하게 했던 사람의 말 속에서 ‘하나님이 내게 들려주시는 나단의 소리’를 찾아 회개 일지 쓰기",
    matchKeywords: ["나단", "직언", "자기기만", "전장", "영적나태", "우상"]
  },
  {
    w: 8,
    phase: "제3기 · 십자가 회개와 공동체 성화 (7~9주)",
    title: "생명에 이르는 회개와 구체적 순종",
    desc: "단순한 감정적 후회(회심의 자리)를 넘어 값을 치르는 삶의 돌이킴으로",
    doctrine: "참된 회개의 열매와 대가를 치르는 순종",
    keyVerse: "마태복음 26:75 / 사무엘하 24:24",
    keyVerseText: "이에 베드로가 예수의 말씀이 생각나서 밖에 나가서 심히 통곡하니라... 값없이는 내 하나님 여호와께 번제를 드리지 아니하리라",
    biblicalModel: "자기 후회에 갇혀 무너진 유다와 달리 말씀이 생각나 통곡하며 돌이킨 베드로, 값을 치르고 아라우나의 제단을 쌓은 다윗",
    academicContext: "스스로 자책하며 절망에 빠지는 ‘세상 근심(후회)’과 하나님께로 방향을 완전히 돌이키는 ‘회개’는 전혀 다릅니다. 참된 회개는 주님의 사랑 앞에서 흘리는 통곡이며, 반드시 나의 시간·물질·자존심이라는 구체적인 값을 치르는 순종의 제단으로 열매 맺습니다.",
    practicePrinciple: "말로만 ‘잘못했다’고 끝내지 않고, 내가 끊어내야 할 죄악된 습관을 끊고 손해와 수고를 감수하는 구체적 행동으로 나아갑니다.",
    diagnostics: [
      "잘못을 한 뒤 혼자 자책하고 우울해할 뿐, 하나님 앞에 나아가 새롭게 돌이키지 못한다.",
      "회개 기도는 자주 하지만 실제 삶의 태도나 말투, 습관은 몇 년째 그대로이다.",
      "희생이나 손해가 따르는 순종 앞에서는 계산기를 두드리며 적당히 타협한다.",
      "용서받지 못할 것 같은 두려움 때문에 정작 주님의 십자가 앞으로 나아가지 못한다."
    ],
    stepPrompts: [
      "① [후회와 회개 분별] 나는 실패했을 때 내 체면이 깎여 자책(후회)합니까, 아니면 주님의 마음을 아프게 한 것 때문에 애통(회개)합니까?",
      "② [말씀의 기억] 베드로를 다시 일으킨 주님의 눈빛과 말씀처럼, 실패한 나를 다시 부르시는 약속의 말씀은 무엇입니까?",
      "③ [값을 치르는 제단] 값없는 제사를 거절했던 다윗처럼, 이번 주 내가 자존심·시간·물질의 손해를 감수하며 드릴 순종은 무엇입니까?",
      "④ [구체적 실천] 언제, 어디서, 누구에게, 어떻게 행할지 측정 가능한 한 가지 회개의 열매(행동 과제)를 확정하십시오."
    ],
    weeklyMission: "미루어 두었던 화해의 연락, 사과, 혹은 구체적인 수고(시간·물질 나눔) 한 가지를 이번 주 안에 실제로 실행하기",
    matchKeywords: ["베드로", "통곡", "회개", "아라우나", "제단", "순종"]
  },
  {
    w: 9,
    phase: "제3기 · 십자가 회개와 공동체 성화 (7~9주)",
    title: "허물이 드러나도 공동체에 붙어 있기",
    desc: "자기 의의 가면을 벗고 구원 공동체 안에서 투명하게 나누며 함께 세워지기",
    doctrine: "성도의 교제와 몸 된 교회의 거룩한 연합",
    keyVerse: "에스라 2:59-70 / 갈라디아서 6:2",
    keyVerseText: "너희가 짐을 서로 지라 그리하여 그리스도의 법을 성취하라",
    biblicalModel: "자신의 계보와 허물이 드러난 수치 속에서도 언약 공동체를 떠나지 않고 끝까지 붙어 있어 회복을 입은 귀환 공동체 (에스라 2:59-70)",
    academicContext: "사탄은 우리의 약점과 수치가 드러날 때 수치심을 자극해 공동체에서 스스로 고립되게 만듭니다. 그러나 교회는 완벽한 사람들의 박물관이 아니라, 죄인들이 십자가 보혈을 의지해 서로의 허물을 덮어주고 짐을 나눠 지는 영적 병원입니다.",
    practicePrinciple: "내 가정과 삶의 연약함이 드러나도 공동체를 떠나거나 숨지 않고, 먼저 내 죄와 아픔을 정직히 오픈하여 지체들의 중보기도를 받습니다.",
    diagnostics: [
      "모임에서 내 약점이나 가정의 아픔은 철저히 숨기고 좋은 모습만 포장해서 말한다.",
      "공동체 안에서 서운한 일이 생기면 대화를 피하고 모임에서 멀어지려 한다.",
      "다른 지체의 나눔을 들을 때 함께 아파하기보다 속으로 평가하거나 조언하려 한다.",
      "나 혼자 조용히 신앙생활하면 충분하다고 생각하며 공동체의 묶임을 부담스러워한다."
    ],
    stepPrompts: [
      "① [가면 벗기] 내가 공동체 사람들 앞에서 들키고 싶지 않아 애써 포장해 왔던 ‘자기 의’와 체면은 무엇입니까?",
      "② [붙어 있음의 은혜] 마음이 상하거나 부끄러운 순간에도 공동체에 붙어 있었기 때문에 지켜진 영적 유익은 무엇입니까?",
      "③ [투명한 나눔] 이번 주 소그룹(목장) 모임에서 내 자랑이나 타인 험담이 아닌, ‘나의 연약함과 기도제목’으로 나눌 한 가지는 무엇입니까?",
      "④ [짐을 지는 사랑] 지금 우리 공동체 안에서 허물이나 아픔으로 위축되어 있어 내가 따뜻하게 품고 중보해야 할 지체는 누구입니까?"
    ],
    weeklyMission: "이번 주 모임에서 내 연약함 1가지를 솔직하게 나누어 중보기도를 요청하고, 지체 1명에게 격려 메시지 보내기",
    matchKeywords: ["공동체", "허물", "귀환", "분열", "화해", "동역자"]
  },
  {
    w: 10,
    phase: "제4기 · 구속사적 사명과 제자 재생산 (10~12주)",
    title: "고난에서 구속사의 말씀을 발견하다",
    desc: "성경 인물들의 고난과 회복 서사를 통해 내 삶의 구속사적 위치 확인하기",
    doctrine: "구속사적 성경 해석과 언약의 연속성",
    keyVerse: "사무엘하 7:12-16 / 신명기 4:31",
    keyVerseText: "네 집과 네 나라가 내 앞에서 영원히 보전되고 네 왕위가 영원히 견고하리라... 네 하나님 여호와는 자비하신 하나님이심이라",
    biblicalModel: "광야와 반역의 세월을 지나 마침내 언약을 성취하시는 하나님을 바라본 모세와 다윗, 에스라의 구속사적 안목",
    academicContext: "성경의 모든 인물(요셉, 모세, 다윗, 에스라, 바울)은 개인적 고난을 통과하며 자신의 작은 이야기가 하나님의 거대한 구속사(하나님 나라 건설) 안에 편입되어 있음을 깨달았습니다. 말씀이 내 삶을 뚫고 지나갈 때 내 인생도 성경대로 이루어지는 구속사의 한 페이지가 됩니다.",
    practicePrinciple: "눈앞의 일희일비에 갇히지 않고, 성경의 구속사 렌즈를 통해 오늘 내 가정과 일터에서 일하시는 하나님의 큰 그림을 신뢰합니다.",
    diagnostics: [
      "성경 인물들의 이야기가 옛날 남의 이야기처럼 느껴지고 내 삶과 연결되지 않는다.",
      "하나님의 크신 언약과 계획보다 당장 내 눈앞의 손익계산에 마음이 흔들린다.",
      "가정의 신앙 계승(다음 세대 양육)보다 세상적인 성공과 안락함을 더 우선시한다.",
      "지나온 내 삶을 돌아볼 때 하나님의 인도하심보다 내 후회와 아쉬움이 먼저 남는다."
    ],
    stepPrompts: [
      "① [인물 투영] 성경 속 인물(다윗, 에스라, 요셉, 베드로 등) 중 지금 나의 상황과 가장 닮아 있는 인물은 누구이며 그 이유는 무엇입니까?",
      "② [언약 확인] 사람의 실패와 계획보다 크신 구원으로 마침내 언약을 이루시는 하나님을 내 삶 어디에서 경험하셨습니까?",
      "③ [성전 재건] 무너진 예루살렘 성전을 다시 건축했던 귀환 백성들처럼, 오늘 내 삶과 가정에서 다시 일으켜 세워야 할 영적 영역은 어디입니까?",
      "④ [신앙 계승] 우리 가정과 다음 세대에게 물려주어야 할 가장 중요한 언약의 유산(신앙고백)은 무엇입니까?"
    ],
    weeklyMission: "가정예배나 가족 식사 자리에서 하나님이 그동안 우리 가정을 어떻게 인도해 오셨는지 구속사적 간증 나누기",
    matchKeywords: ["성취", "주권", "재건", "쉐마", "기업", "다윗"]
  },
  {
    w: 11,
    phase: "제4기 · 구속사적 사명과 제자 재생산 (10~12주)",
    title: "내 고난을 살리는 간증으로 바꾸기",
    desc: "‘내가 얼마나 힘들었는가’를 넘어 ‘하나님이 무엇을 하셨는가’를 증거하는 삶",
    doctrine: "그리스도의 증인 됨과 무명의 충성(청지기 직분)",
    keyVerse: "사무엘하 19:31-39 / 마태복음 25:40",
    keyVerseText: "내 내생이 얼마나 길겠사오니 어찌 왕과 함께 예루살렘으로 올라가리이까... 지극히 작은 자 하나에게 한 것이 곧 내게 한 것이니라",
    biblicalModel: "다윗 왕이 가장 비참한 피난길에 올랐을 때 대가를 바라지 않고 무명의 자리에서 공개적으로 섬긴 바르실래 (사무엘하 19:31-39)",
    academicContext: "성숙한 제자의 간증은 자신의 고통이나 업적을 과시하는 무대가 아닙니다. 오직 나의 죄를 덮으신 십자가 은혜와 나를 변화시키신 하나님의 주권만을 높이는 신앙고백입니다. 또한 그 은혜를 아는 자는 바르실래처럼 보상 없는 무명의 자리에서 공동체와 이웃을 기꺼이 섬깁니다.",
    practicePrinciple: "내 아픔을 통과하며 얻은 위로를 가지고, 지금 같은 고난의 터널을 지나고 있는 한 영혼을 찾아가 생색 없이 섬기고 격려합니다.",
    diagnostics: [
      "간증을 할 때 하나님의 은혜보다 내가 얼마나 고생했고 잘 참았는지를 더 강조한다.",
      "누군가를 도울 때 내 이름이 드러나기를 원하고, 알아주지 않으면 섬김을 멈춘다.",
      "내 문제에만 매몰되어 있어 주변에 신음하는 지체나 이웃의 아픔이 보이지 않는다.",
      "복음을 전하거나 간증하는 일이 부끄럽고 부담스러워 입을 닫고 지낸다."
    ],
    stepPrompts: [
      "① [간증의 중심 이동] 내 지난 고난 이야기를 ‘내가 겪은 고통’ 중심에서 ‘나를 찾아오신 하나님의 일하심’ 중심으로 한 문단으로 다시 써보십시오.",
      "② [바르실래의 섬김] 대가나 보상을 바라지 않고 교회와 공동체의 보이지 않는 곳에서 내가 감당할 수 있는 무명의 섬김은 무엇입니까?",
      "③ [공감과 위로] 내가 겪은 것과 비슷한 아픔(가정, 질병, 관계, 재정)을 겪고 있어 내 간증이 약재가 될 수 있는 주변의 한 사람은 누구입니까?",
      "④ [증인의 입술] 그 영혼에게 정죄나 훈계가 아닌, ‘나도 그런 죄인이었는데 주님이 살려주셨다’고 전할 사랑의 고백을 적어보십시오."
    ],
    weeklyMission: "내 삶 전체를 관통하는 8단계 표준 구속사 간증문을 완성하고, 보이지 않는 곳에서 공동체 섬김 1회 실천하기",
    matchKeywords: ["바르실래", "무명", "섬김", "증인", "이타주의", "보응"]
  },
  {
    w: 12,
    phase: "제4기 · 구속사적 사명과 제자 재생산 (10~12주)",
    title: "감사하는 제자로 살고 제자를 세우기",
    desc: "묵상 ➔ 자기발견 ➔ 회개 ➔ 순종 ➔ 공동체 나눔과 재생산의 평생 규율화",
    doctrine: "대위임령의 성취와 제자 재생산(영적 아비의 마음)",
    keyVerse: "마태복음 28:18-20 / 사무엘하 21:15-22",
    keyVerseText: "그러므로 너희는 가서 모든 민족을 제자로 삼아... 내가 세상 끝날까지 너희와 항상 함께 있으리라",
    biblicalModel: "다윗이 지쳤을 때 함께 싸워 이스라엘의 등불이 꺼지지 않게 한 동역자들과 너그러운 아비의 마음 (사무엘하 18:1-5, 21:15-22)",
    academicContext: "제자훈련의 최종 목적지는 수료증을 받는 것이 아니라, 나 자신이 말씀으로 사는 제자가 되어 또 다른 한 영혼을 말씀 앞에 세우는 ‘영적 재생산(아비의 마음)’에 있습니다. 함께한 동역자들이 있을 때 공동체의 등불은 결코 꺼지지 않습니다.",
    practicePrinciple: "12주간 체화한 ‘말씀묵상-자기발견-회개-순종-공동체 나눔’의 영적 호흡을 평생의 삶의 규율로 삼고, 내게 맡겨진 한 영혼을 끝까지 품습니다.",
    diagnostics: [
      "훈련 기간이 끝나면 다시 예전의 나태한 생활 습관으로 돌아갈까 봐 두렵다.",
      "내 신앙 하나 지키기도 벅차다며 다른 영혼을 돌보고 세우는 일에는 선을 긋는다.",
      "연약한 지체가 더디 변할 때 아비의 마음으로 기다려주기보다 답답해하고 포기한다.",
      "삶의 모든 영역(가정, 직장, 교회)을 선교지이자 제자도의 현장으로 바라보지 못한다."
    ],
    stepPrompts: [
      "① [12주 총결산] 지난 12주의 여정을 통해 내 시선과 성품, 삶의 태도에서 일어난 가장 큰 영적 변화는 무엇입니까?",
      "② [평생의 규율] 훈련 수료 후에도 등불이 꺼지지 않도록 내가 매일·매주 반드시 사수할 영적 루틴(새벽/말씀/기도/나눔)은 무엇입니까?",
      "③ [아비의 마음] 주님이 내게 맡기신 한 사람(태신자, 초신자, 자녀, 목장 식구)을 어떤 아비의 마음으로 품고 기다려 주겠습니까?",
      "④ [사명 선언] 나를 구원하시고 제자로 부르신 주님 앞에 향후 90일간 실천할 영혼 구원과 섬김의 서약을 기록하십시오."
    ],
    weeklyMission: "향후 90일 영적 성장 및 한 영혼 품기 실행 계획을 수립하고, 12주 수료 인준 서약 완료하기",
    matchKeywords: ["대위임령", "제자", "사명", "아비", "등불", "전파"]
  }
];

// 6대 필수 양육 과제 항목 정의
const SIX_CORE_ASSIGNMENTS = [
  { id: 'topic_qt', label: '주제 묵상', desc: '주차별 핵심 본문 4단 묵상' },
  { id: 'daily_qt', label: '매일 루틴', desc: '주 5회 이상 개인 말씀묵상' },
  { id: 'sermon_note', label: '설교 요약', desc: '대지 구분 및 내 삶에 적용' },
  { id: 'life_hw', label: '생활 숙제', desc: '성령으로 감정 다스린 순종' },
  { id: 'book_reflection', label: '신앙 성찰', desc: '교리·신앙서적 및 구속사 정리' },
  { id: 'service', label: '공동체 섬김', desc: '모임 세팅·중보·이웃 돌봄' }
];

export default function TrainingCurriculum({ t, isDarkMode, setActiveScreen }) {
  const isDark = Boolean(t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode);

  // 상단 6대 탭 체계 보존
  const [activeTab, setActiveTab] = useState('path'); // 'path' | 'overview' | 'protocols' | 'curriculum' | 'gimpo' | 'appendix'
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sermonTypeFilter, setSermonTypeFilter] = useState('ALL');
  const [sermonWeekFilter, setSermonWeekFilter] = useState('ALL');
  const [selectedSermonModal, setSelectedSermonModal] = useState(null);

  // 📱 모바일 전용: 지표 패널 접기/펼치기 아코디언 상태
  const [isMobileStatsOpen, setIsMobileStatsOpen] = useState(false);

  // 로컬스토리지 상태 (기존 키 100% 무손실 보존)
  const [checks, setChecks] = useState(() => getLocal('tc_final_checks_v7', {}));
  const [forms, setForms] = useState(() => getLocal('tc_final_forms_v7', {}));
  const [weeklyCheck, setWeeklyCheck] = useState(() => getLocal('tc_final_weekly_v7', {}));
  const [rubrics, setRubrics] = useState(() => getLocal('tc_final_rubrics_v7', { word: 3, reflect: 3, apply: 3, community: 3, reproduce: 3 }));
  const [gameNotes, setGameNotes] = useState(() => getLocal('diary_curriculum_notes', {}));
  const [showCertificate, setShowCertificate] = useState(false);

  // 🌐 설교 코퍼스(99+편) 실시간 전체 데이터 동기화 상태
  const [liveSermonList, setLiveSermonList] = useState(SERMON_DATA);

  useEffect(() => {
    fetch('/sermon_summary.json')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data) return;
        const extracted = [];
        const seenKeys = new Set();

        const pushUniqueSermon = (item, fallbackVerse = '') => {
          if (!item || typeof item !== 'object') return;
          const title = (item.title || item.sermonTitle || '').trim();
          const date = (item.date || '').trim();
          const verse = (item.verse || item.reference || item.ref || fallbackVerse || '').trim();
          if (!title && !verse) return;

          const dedupKey = `${date}_${title || verse}`;
          if (seenKeys.has(dedupKey)) return;
          seenKeys.add(dedupKey);

          const kwRaw = item.keywords || item.tags || item.theme || '';
          const keywords = Array.isArray(kwRaw) ? kwRaw.join(', ') : String(kwRaw || '');
          const summary = item.summary || item.oneLineSummary || item.content || item.exegesis || '';
          const applyQ = Array.isArray(item.applyQuestions)
            ? item.applyQuestions.join(' / ')
            : (item.applyQuestion || item.application || '');

          let sType = item.type || item.serviceType || '';
          if (!sType) {
            if (title.includes('수요')) sType = '수요예배';
            else if (title.includes('금요')) sType = '금요예배';
            else if (title.includes('새벽') || title.includes('기상')) sType = '기상오기';
            else sType = '주일예배';
          }

          extracted.push({
            date: date || '상시묵상',
            type: sType,
            title: title || `${verse} 강해`,
            verse: verse || '성경 본문',
            keywords: keywords || '말씀, 구속사, 회개, 적용',
            summary: String(summary).trim(),
            applyQuestion: String(applyQ).trim()
          });
        };

        if (Array.isArray(data)) {
          data.forEach(s => pushUniqueSermon(s));
        } else {
          if (Array.isArray(data.sermons)) {
            data.sermons.forEach(s => pushUniqueSermon(s));
          }
          if (Array.isArray(data.items)) {
            data.items.forEach(s => pushUniqueSermon(s));
          }
          if (data.index && typeof data.index === 'object') {
            Object.entries(data.index).forEach(([refKey, val]) => {
              if (Array.isArray(val)) {
                val.forEach(s => pushUniqueSermon(s, refKey));
              } else if (val && typeof val === 'object') {
                pushUniqueSermon(val, refKey);
              }
            });
          }
        }

        // 기존 SERMON_DATA와 병합하여 누락 없이 전체 코퍼스 완성
        SERMON_DATA.forEach(s => pushUniqueSermon(s));

        extracted.sort((a, b) => String(b.date).localeCompare(String(a.date)));
        if (extracted.length > 0) {
          setLiveSermonList(extracted);
        }
      })
      .catch(() => {});
  }, []);

  const liveSermonCount = liveSermonList.length;

  // 완주 주차 계산 (통합 성찰 일지 10자 이상 또는 주차별 4단 가이드 2문항 이상 작성 시 인정)
  const completedWeeks = useMemo(() => {
    const completed = [];
    for (let i = 1; i <= 12; i++) {
      const noteLen = (gameNotes[i] || '').trim().length;
      const stepCount = [0, 1, 2, 3].filter(idx => (forms[`w${i}_step_${idx}`] || '').trim().length >= 5).length;
      if (noteLen > 10 || stepCount >= 2) {
        completed.push(i);
      }
    }
    return completed;
  }, [gameNotes, forms]);

  useEffect(() => setLocal('tc_final_checks_v7', checks), [checks]);
  useEffect(() => setLocal('tc_final_forms_v7', forms), [forms]);
  useEffect(() => setLocal('tc_final_weekly_v7', weeklyCheck), [weeklyCheck]);
  useEffect(() => setLocal('tc_final_rubrics_v7', rubrics), [rubrics]);

  const toggleCheck = (k) => setChecks(p => ({ ...p, [k]: !p[k] }));
  const toggleWeekly = (k) => setWeeklyCheck(p => ({ ...p, [k]: !p[k] }));
  const handleForm = (k, v) => setForms(p => ({ ...p, [k]: v }));
  const handleRubric = (k, v) => setRubrics(p => ({ ...p, [k]: parseInt(v, 10) }));

  const handleSaveGameNote = (w, content) => {
    const nextNotes = { ...gameNotes, [w]: content };
    setGameNotes(nextNotes);
    setLocal('diary_curriculum_notes', nextNotes);
    if (content.trim().length > 10 && w === 12 && localStorage.getItem('curriculum_cert_shown') !== 'true') {
      setTimeout(() => setShowCertificate(true), 400);
    }
  };

  // 4단계 가이드 작성 내용을 통합 성찰 일지로 원클릭 병합하는 함수
  const compileGuidedStepsToJournal = (w) => {
    const meta = GAMIFIED_PATH_DATA.find(item => item.w === w) || GAMIFIED_PATH_DATA[0];
    const parts = meta.stepPrompts.map((prompt, idx) => {
      const ans = (forms[`w${w}_step_${idx}`] || '').trim();
      const shortTitle = prompt.split(']')[0] + ']';
      return ans ? `${shortTitle} ${ans}` : null;
    }).filter(Boolean);

    if (parts.length === 0) {
      return alert('먼저 위의 4단계 성찰 질문 중 최소 1개 이상을 작성해 주세요.');
    }
    const compiledText = `[${w}주차: ${meta.title}]\n` + parts.join('\n\n');
    handleSaveGameNote(w, compiledText);
    alert(`${w}주차 4단계 성찰 내용이 통합 훈련 일지에 병합·승인되었습니다!`);
  };

  const getPlantIcon = (w, isCompleted) => {
    if (!isCompleted) return <IconLock />;
    if (w <= 3) return <SeedIcon />;
    if (w <= 6) return <SproutIcon />;
    if (w <= 9) return <SaplingIcon />;
    return <TreeIcon />;
  };

  // 📊 실시간 영적 성장 5대 밸런스 동적 산출 엔진 (기존 하드코딩 개선)
  const dynamicBalances = useMemo(() => {
    const checkCount = Object.values(checks).filter(Boolean).length;
    const formCount = Object.values(forms).filter(v => String(v || '').trim().length > 0).length;
    const weeklyCount = Object.values(weeklyCheck).filter(Boolean).length;

    const calcPct = (baseScore, rubricKey, bonus) => {
      const rVal = (rubrics[rubricKey] || 3) * 14;
      return Math.min(100, Math.max(15, Math.round(baseScore + rVal + bonus)));
    };

    return [
      { label: '말씀 (Word)', pct: calcPct(20, 'word', completedWeeks.length * 4 + checkCount) },
      { label: '기도 (Prayer)', pct: calcPct(18, 'reflect', weeklyCount * 2 + formCount) },
      { label: '예배 (Worship)', pct: calcPct(15, 'apply', completedWeeks.length * 3 + weeklyCount) },
      { label: '교제 (Fellowship)', pct: calcPct(18, 'community', checkCount * 2 + formCount) },
      { label: '사역 (Ministry)', pct: calcPct(12, 'reproduce', completedWeeks.length * 3 + checkCount) }
    ];
  }, [checks, forms, weeklyCheck, rubrics, completedWeeks.length]);

  // 📖 로고스 학술 & 엔터프라이즈 SaaS 테마 팔레트
  const bgMain = isDark ? 'bg-[#121519]' : 'bg-[#FAF8F5]';
  const textHead = isDark ? 'text-[#E6EDF3]' : 'text-[#1B2430]';
  const textBody = isDark ? 'text-[#C5CDD7]' : 'text-[#334155]';
  const textMuted = isDark ? 'text-[#848E9B]' : 'text-[#64748B]';

  const borderRule = isDark ? 'border-[#262C36]' : 'border-[#E2DDD5]';
  const cardBox = isDark 
    ? 'bg-[#191E25] border border-[#2B323D] rounded-none shadow-xs' 
    : 'bg-[#FFFFFF] border border-[#DDD5C7] rounded-none shadow-[0_1px_3px_rgba(0,0,0,0.03)]';
  const subBox = isDark 
    ? 'bg-[#15181E] border border-[#262C36] rounded-none' 
    : 'bg-[#F6F3EC] border border-[#E5DEC7] rounded-none';
  const inputStyle = isDark 
    ? 'bg-[#0E1014] border border-[#2D3542] text-[#E6EDF3] focus:border-[#7A2E26] placeholder:text-[#525B6A] rounded-none' 
    : 'bg-[#FFFFFF] border border-[#CFC5B2] text-[#1A202C] focus:border-[#7A2E26] placeholder:text-[#A0AEC0] rounded-none';

  const fontSerif = { fontFamily: "'KoPubWorld Batang', 'Nanum Myeongjo', 'Batang', serif" };
  const fontSans = { fontFamily: "'Pretendard', -apple-system, sans-serif" };

  // 5대 영적 파이프라인 연동 함수 (홈 화면 5종 세트 및 기도/적용 트래커 100% 연동)
  const syncToPipeline = (type, payload) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      if (type === 'prayer') {
        if (!payload || !payload.trim()) return alert('전송할 기도/감사 내용이 없습니다. 먼저 내용을 작성해 주세요.');
        const saved = JSON.parse(localStorage.getItem('globalPrayers') || '[]');
        saved.push({ id: Date.now(), text: payload.trim(), status: 'praying' });
        localStorage.setItem('globalPrayers', JSON.stringify(saved));
        alert('🙏 기도 보관함에 새로운 기도제목으로 등록되었습니다!');
      } else if (type === 'apply') {
        if (!payload || !payload.trim()) return alert('전송할 순종 결단 내용이 없습니다. 먼저 내용을 작성해 주세요.');
        const saved = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
        saved.push({ id: `tc_${Date.now()}`, date: today, source: 'tc', text: payload.trim(), completed: false });
        localStorage.setItem('apply_tracker_items', JSON.stringify(saved));
        alert('🎯 적용 트래커에 실천 행동 과제로 등록되었습니다!');
      } else if (type === 'weekly_checks') {
        const dailyData = JSON.parse(localStorage.getItem('qt_daily') || '{}');
        if (!dailyData[today]) dailyData[today] = { checks: {} };
        const dChecks = dailyData[today].checks || {};
        const dayMap = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
        const todayStr = dayMap[new Date().getDay()];

        if (weeklyCheck[`w_QT_${todayStr}`]) dChecks['QTin'] = true;
        if (weeklyCheck[`w_기도_${todayStr}`]) dChecks['기도하기'] = true;
        if (weeklyCheck[`w_감사_${todayStr}`]) dChecks['감사'] = true;

        dailyData[today].checks = dChecks;
        localStorage.setItem('qt_daily', JSON.stringify(dailyData));
        alert('🔥 체크한 내역이 오늘의 영적 5종 세트 루틴과 동기화되었습니다!');
      }
    } catch (e) {
      alert('연동 중 오류가 발생했습니다.');
    }
  };

  // 성경 본문 구절 클릭 시 성경 페이지로 즉시 이동하는 헬퍼
  const handleJumpToBibleVerse = (verseRefStr) => {
    if (!verseRefStr || !setActiveScreen) return;
    try {
      const firstRef = verseRefStr.split('/')[0].trim();
      localStorage.setItem('bible_search_query', firstRef);
      setActiveScreen('bible');
    } catch (_) {}
  };

  const TABS = [
    { id: 'path', code: '§ 0', label: '12주 순례자의 길' },
    { id: 'overview', code: '§ Ⅰ', label: '제자훈련 신학개관' },
    { id: 'protocols', code: '§ Ⅱ', label: '해석 프로토콜' },
    { id: 'curriculum', code: '§ Ⅲ', label: '주차별 실천 과제' },
    { id: 'gimpo', code: '§ Ⅳ', label: `${liveSermonCount}편 설교 코퍼스` },
    { id: 'appendix', code: '§ Ⅴ', label: '종합 실전 양식' }
  ];

  const currentWeekMeta = GAMIFIED_PATH_DATA.find(w => w.w === selectedWeek) || GAMIFIED_PATH_DATA[0];

  // 현재 선택된 주차의 주제 키워드와 매칭되는 설교 코퍼스 자동 추천
  const matchedWeekSermons = useMemo(() => {
    const kws = currentWeekMeta.matchKeywords || [];
    const matched = liveSermonList.filter(s =>
      kws.some(kw => (s.title || '').includes(kw) || (s.keywords || '').includes(kw) || (s.verse || '').includes(kw))
    );
    return matched.length > 0 ? matched.slice(0, 4) : liveSermonList.slice(0, 3);
  }, [currentWeekMeta, liveSermonList]);

  // § Ⅳ. 설교 코퍼스 탭 필터링 목록
  const filteredCorpusSermons = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let targetKws = null;
    if (sermonWeekFilter !== 'ALL') {
      const wkObj = GAMIFIED_PATH_DATA.find(w => String(w.w) === String(sermonWeekFilter));
      if (wkObj) targetKws = wkObj.matchKeywords;
    }

    return liveSermonList.filter(s => {
      if (sermonTypeFilter !== 'ALL' && s.type !== sermonTypeFilter) return false;
      if (targetKws && !targetKws.some(kw => (s.title || '').includes(kw) || (s.keywords || '').includes(kw) || (s.verse || '').includes(kw))) {
        return false;
      }
      if (!q) return true;
      return (
        (s.title || '').toLowerCase().includes(q) ||
        (s.verse || '').toLowerCase().includes(q) ||
        (s.keywords || '').toLowerCase().includes(q) ||
        (s.summary || '').toLowerCase().includes(q)
      );
    });
  }, [liveSermonList, searchTerm, sermonTypeFilter, sermonWeekFilter]);

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden select-none relative ${bgMain} w-full`}>
      
      {/* ── 1. 학술 툴바 헤더 (Command Ribbon — 모바일 깨짐 0% 보장) ── */}
      <header className={`relative z-20 px-2.5 sm:px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b shrink-0 ${borderRule} ${isDark ? 'bg-[#161A20]' : 'bg-[#EFECE4]'}`}>
        <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
          <button 
            onClick={() => setActiveScreen && setActiveScreen('home')} 
            className={`p-1.5 rounded-sm transition-colors cursor-pointer shrink-0 border ${
              isDark ? 'border-[#2D333F] text-[#C5CDD7] hover:bg-[#20252E]' : 'border-[#D8D0C3] text-[#4A5568] hover:bg-[#E5E0D5]'
            }`}
            title="홈 화면"
          >
            <IconArrowLeft />
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className={`text-[9.5px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-none font-mono shrink-0 ${
              isDark ? 'bg-[#7A2E26]/30 text-[#FCA5A5] border border-[#7A2E26]' : 'bg-[#7A2E26] text-white'
            }`}>
              CURRICULUM
            </span>
            <div className="flex flex-col min-w-0 flex-1">
              <h1 className={`text-[12.5px] sm:text-[14px] font-bold tracking-tight truncate ${textHead}`} style={fontSans}>
                구속사적 제자양육 아카이브
              </h1>
              <span className={`hidden sm:block text-[9.5px] font-mono tracking-wider uppercase truncate ${textMuted}`}>
                REDEMPTIVE DISCIPLESHIP FORMATION SYSTEM
              </span>
            </div>
          </div>
        </div>

        {/* 상단 6대 탭 바인더 */}
        <div className="flex items-center border border-inherit bg-transparent p-0.5 overflow-x-auto hide-scrollbar w-full sm:w-auto shrink-0" style={fontSans}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-[11.5px] font-bold cursor-pointer whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? (isDark ? 'bg-[#7A2E26] text-white' : 'bg-[#1B365D] text-white shadow-xs')
                  : (isDark ? 'text-[#848E9B] hover:text-white' : 'text-[#5A6578] hover:text-black')
              }`}
            >
              <span className="font-mono text-[9.5px] opacity-70 mr-1">{tab.code}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── 2. 메인 워크스페이스 프레임 ── */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row w-full max-w-7xl mx-auto min-w-0">

        {/* 📱 [모바일 전용 컴팩트 툴바]: 1줄 가로 주차 슬라이더 + 지표 아코디언 토글 */}
        <div className={`md:hidden shrink-0 border-b ${borderRule} p-2 flex flex-col gap-1.5 ${isDark ? 'bg-[#14181E]' : 'bg-[#F5F2EB]'}`}>
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar touch-pan-x py-0.5">
            <span className="text-[10px] font-bold text-slate-400 shrink-0 mr-1">주차:</span>
            {GAMIFIED_PATH_DATA.map(item => {
              const isSelected = selectedWeek === item.w;
              const isDone = completedWeeks.includes(item.w);
              return (
                <button
                  key={item.w}
                  onClick={() => {
                    setSelectedWeek(item.w);
                    setActiveTab('path');
                  }}
                  className={`px-2.5 py-1 text-[11px] font-bold shrink-0 border transition-all cursor-pointer relative ${
                    isSelected
                      ? (isDark ? 'bg-[#7A2E26] text-white border-[#7A2E26]' : 'bg-[#1B365D] text-white border-[#1B365D]')
                      : (isDark ? 'bg-[#191E25] text-[#848E9B] border-[#2B323D]' : 'bg-[#FFFFFF] text-[#4A5568] border-[#DDD5C7]')
                  }`}
                  style={fontSans}
                >
                  {item.w}주
                  {isDone && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-inherit">
            <button
              onClick={() => setIsMobileStatsOpen(prev => !prev)}
              className={`text-[11px] font-bold flex items-center gap-1 cursor-pointer ${textHead}`}
              style={fontSans}
            >
              <span>📊 영적 지표 및 5대 밸런스 ({completedWeeks.length}/12주)</span>
              {isMobileStatsOpen ? <IconChevronUp /> : <IconChevronDown />}
            </button>
            <button
              onClick={() => setActiveScreen && setActiveScreen('trainingSubPages')}
              className={`text-[10.5px] font-bold px-2 py-0.5 border cursor-pointer ${isDark ? 'bg-[#202630] text-[#93C5FD] border-[#364052]' : 'bg-[#EBF3FA] text-[#0F4C81] border-[#C6DCF0]'}`}
              style={fontSans}
            >
              4주 심화 워크북 📖
            </button>
          </div>

          {isMobileStatsOpen && (
            <div className="pt-2 flex flex-col gap-2 border-t border-inherit animate-fade-in">
              <div className="grid grid-cols-4 gap-1 text-[10px]" style={fontSans}>
                {[
                  { label: '완주 주차', val: `${completedWeeks.length} / 12` },
                  { label: '점검 체크', val: `${Object.values(checks).filter(Boolean).length}개` },
                  { label: '설교 코퍼스', val: `${liveSermonCount}편` },
                  { label: '실천 기록', val: `${Object.values(forms).filter(Boolean).length}건` }
                ].map(stat => (
                  <div key={stat.label} className={`p-1 border text-center ${cardBox}`}>
                    <span className="block opacity-60 scale-90">{stat.label}</span>
                    <strong className="text-[12px]">{stat.val}</strong>
                  </div>
                ))}
              </div>
              <div className={`p-2 border ${cardBox} space-y-1 text-[10px]`} style={fontSans}>
                {dynamicBalances.map(b => (
                  <div key={b.label} className="flex items-center gap-2">
                    <span className="w-24 shrink-0 text-slate-500">{b.label}</span>
                    <div className="flex-1 h-1.5 bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div style={{ width: `${b.pct}%` }} className={`h-full transition-all duration-500 ${isDark ? 'bg-[#7A2E26]' : 'bg-[#1B365D]'}`} />
                    </div>
                    <span className="w-8 font-mono font-bold text-right text-[#7A2E26] dark:text-[#F87171]">{b.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 💻 [데스크톱 전용 좌측 사이드바 패널] */}
        <aside className={`hidden md:flex w-72 shrink-0 border-r ${borderRule} p-3 overflow-y-auto hide-scrollbar flex-col gap-3 ${isDark ? 'bg-[#14181E]' : 'bg-[#F5F2EB]'}`}>
          <div className="flex items-center justify-between pb-1 border-b border-inherit">
            <span className={`text-[12.5px] font-bold ${textHead}`} style={fontSans}>제자양육 성숙 지표</span>
            <span className={`text-[10px] px-1.5 py-0.5 border flex items-center gap-1 font-mono ${subBox}`}>
              <IconSparkles /> 상시 훈련
            </span>
          </div>

          {/* 12주차 마스터 선택 그리드 */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1.5" style={fontSans}>
              <span className={`font-bold ${textMuted}`}>12주차 마스터 코스</span>
              <span className="font-bold text-[#7A2E26] dark:text-[#F87171]">{selectedWeek}주차 진행중</span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-[11.5px] font-bold text-center" style={fontSans}>
              {GAMIFIED_PATH_DATA.map(item => {
                const isSelected = selectedWeek === item.w;
                const isDone = completedWeeks.includes(item.w);
                return (
                  <button
                    key={item.w}
                    onClick={() => {
                      setSelectedWeek(item.w);
                      setActiveTab('path');
                    }}
                    className={`py-1.5 border transition-all cursor-pointer relative ${
                      isSelected
                        ? (isDark ? 'bg-[#7A2E26] text-white border-[#7A2E26]' : 'bg-[#1B365D] text-white border-[#1B365D] shadow-xs')
                        : (isDark ? 'bg-[#191E25] text-[#848E9B] border-[#2B323D] hover:bg-[#202630]' : 'bg-[#FFFFFF] text-[#4A5568] border-[#DDD5C7] hover:bg-[#EFECE4]')
                    }`}
                  >
                    {item.w}주
                    {isDone && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 영적 아카이브 누적 4대 지표 */}
          <div>
            <span className={`text-[11px] font-bold block mb-1.5 ${textMuted}`} style={fontSans}>영적 아카이브 누적</span>
            <div className="grid grid-cols-2 gap-1 text-[11px]" style={fontSans}>
              {[
                { label: '완주 주차', val: `${completedWeeks.length} / 12` },
                { label: '점검 체크', val: `${Object.values(checks).filter(Boolean).length}개` },
                { label: '설교 코퍼스', val: `${liveSermonCount}편` },
                { label: '실천 기록', val: `${Object.values(forms).filter(Boolean).length}건` }
              ].map(stat => (
                <div key={stat.label} className={`p-2 border text-center ${cardBox}`}>
                  <span className={`block text-[10px] ${textMuted}`}>{stat.label}</span>
                  <strong className={`text-[13px] ${textHead}`}>{stat.val}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* 영적 성장 5대 밸런스 (실시간 계산 반영) */}
          <div className={`p-2.5 border ${cardBox}`}>
            <div className="flex items-center justify-between mb-2" style={fontSans}>
              <span className={`text-[11px] font-bold ${textHead}`}>영적 성장 5대 밸런스</span>
              <span className="text-[9.5px] font-mono text-emerald-500">실시간 연동</span>
            </div>
            <div className="space-y-1.5 text-[11px]" style={fontSans}>
              {dynamicBalances.map(b => (
                <div key={b.label}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className={textMuted}>{b.label}</span>
                    <span className="font-mono font-bold text-[#7A2E26] dark:text-[#F87171]">{b.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div 
                      style={{ width: `${b.pct}%` }} 
                      className={`h-full transition-all duration-500 ${isDark ? 'bg-[#7A2E26]' : 'bg-[#1B365D]'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 이번 주 6대 필수 과제 빠른 점검 */}
          <div className={`p-2.5 border ${cardBox}`}>
            <span className={`text-[11px] font-bold block mb-1.5 ${textHead}`} style={fontSans}>
              {selectedWeek}주차 6대 양육 과제 체크
            </span>
            <div className="grid grid-cols-2 gap-1 text-[10.5px]" style={fontSans}>
              {SIX_CORE_ASSIGNMENTS.map(task => {
                const key = `w${selectedWeek}_task_${task.id}`;
                const isDone = Boolean(checks[key]);
                return (
                  <button
                    key={task.id}
                    onClick={() => toggleCheck(key)}
                    className={`p-1.5 border text-left flex items-center gap-1.5 cursor-pointer transition-all ${
                      isDone
                        ? (isDark ? 'bg-[#1C2430] border-[#3E526D] text-white font-bold' : 'bg-[#F0F5FA] border-[#1B365D] text-[#1B365D] font-bold')
                        : `${subBox} ${textMuted}`
                    }`}
                  >
                    <span className={`w-3 h-3 border shrink-0 flex items-center justify-center ${isDone ? 'bg-[#7A2E26] border-[#7A2E26] text-white' : 'border-slate-400'}`}>
                      {isDone && <IconCheck />}
                    </span>
                    <span className="truncate">{task.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setActiveScreen && setActiveScreen('trainingSubPages')}
            className={`w-full py-2.5 text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
              isDark ? 'bg-[#202630] text-[#93C5FD] border-[#364052]' : 'bg-[#EBF3FA] text-[#0F4C81] border-[#C6DCF0]'
            }`}
            style={fontSans}
          >
            <IconBook /> 4주 심화 워크북 열기
          </button>
        </aside>

        {/* ── [우측 메인 캔버스: 읽고 · 체크하고 · 따라 쓰고 · 적용하고 · 찾아가는 LMS 워크스테이션] ── */}
        <section className="flex-1 overflow-y-auto hide-scrollbar p-3 sm:p-5 flex flex-col gap-3.5 pb-36">

          {/* ════════ § 0. 12주 순례자의 길 (5단계 양방향 양육 워크스테이션) ════════ */}
          {activeTab === 'path' && (
            <div className="flex flex-col gap-3.5">
              
              {/* 상단 주차 헤더 & 기수 배지 */}
              <div className="pb-2.5 border-b border-inherit flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10.5px] font-bold text-[#7A2E26] dark:text-[#F87171] uppercase" style={fontSans}>
                      DISCIPLESHIP FORMATION • WEEK {currentWeekMeta.w}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 border ${subBox} ${textHead}`} style={fontSans}>
                      {currentWeekMeta.phase}
                    </span>
                  </div>
                  <h2 className={`text-[18px] sm:text-[21px] font-bold tracking-tight mt-1 ${textHead}`} style={fontSerif}>
                    제{currentWeekMeta.w}주. {currentWeekMeta.title}
                  </h2>
                  <div className="flex items-center gap-1.5 text-[12px] text-slate-500 mt-1" style={fontSans}>
                    <IconBook />
                    <span className="font-medium">{currentWeekMeta.desc}</span>
                  </div>
                </div>

                {/* 이전/다음 주차 빠른 이동 */}
                <div className="flex items-center gap-1 shrink-0" style={fontSans}>
                  <button
                    disabled={selectedWeek <= 1}
                    onClick={() => setSelectedWeek(w => Math.max(1, w - 1))}
                    className={`px-2.5 py-1 text-[11px] font-bold border cursor-pointer disabled:opacity-30 ${cardBox} ${textHead}`}
                  >
                    ◀ 이전 주
                  </button>
                  <button
                    disabled={selectedWeek >= 12}
                    onClick={() => setSelectedWeek(w => Math.min(12, w + 1))}
                    className={`px-2.5 py-1 text-[11px] font-bold border cursor-pointer disabled:opacity-30 ${cardBox} ${textHead}`}
                  >
                    다음 주 ▶
                  </button>
                </div>
              </div>

              {/* STEP 1. [읽고 묵상하기] 핵심 성경 본문 & 정통 교리 기둥 & 성경 인물 모델 */}
              <div className={`p-3.5 border-l-4 border-l-[#7A2E26] ${cardBox} space-y-2`}>
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-[#7A2E26] text-white">STEP 1 · 말씀과 교리 직면</span>
                    <strong className={`text-[12.5px] font-bold ${textHead}`} style={fontSans}>
                      📖 핵심 본문: {currentWeekMeta.keyVerse}
                    </strong>
                  </div>
                  <button
                    onClick={() => handleJumpToBibleVerse(currentWeekMeta.keyVerse)}
                    className="text-[10.5px] font-bold text-[#7A2E26] dark:text-[#F87171] hover:underline cursor-pointer"
                    style={fontSans}
                  >
                    성경 본문 전체 찾아가기 ↗
                  </button>
                </div>
                <p className={`text-[13px] leading-relaxed italic ${textHead} p-2.5 border ${subBox} break-keep`} style={fontSerif}>
                  "{currentWeekMeta.keyVerseText}"
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] pt-0.5" style={fontSans}>
                  <span><strong className="text-[#7A2E26] dark:text-[#F87171]">🏛️ 교리적 기초:</strong> <span className={textBody}>{currentWeekMeta.doctrine}</span></span>
                  <span><strong className="text-[#1B365D] dark:text-[#93C5FD]">🔍 성경적 모델:</strong> <span className={textBody}>{currentWeekMeta.biblicalModel}</span></span>
                </div>
              </div>

              {/* 신학적 배경 & 실천 원리 2단 콘텍스트 카드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className={`p-3 border ${subBox}`}>
                  <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider block mb-1 text-[#7A2E26] dark:text-[#F87171]" style={fontSans}>
                    THEOLOGICAL & REDEMPTIVE LENS (신학적·구속사적 통찰)
                  </span>
                  <p className={`text-[12px] leading-relaxed ${textBody} break-keep`} style={fontSerif}>
                    {currentWeekMeta.academicContext}
                  </p>
                </div>
                <div className={`p-3 border ${subBox}`}>
                  <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider block mb-1 text-[#1B365D] dark:text-[#93C5FD]" style={fontSans}>
                    PRACTICE & OBEDIENCE PRINCIPLE (삶의 적용과 성화 원리)
                  </span>
                  <p className={`text-[12px] leading-relaxed ${textBody} break-keep`} style={fontSerif}>
                    {currentWeekMeta.practicePrinciple}
                  </p>
                </div>
              </div>

              {/* STEP 2. [체크하고 점검하기] 주차별 영적 자기진단 체크리스트 & 6대 과제 점검 */}
              <div className={`p-3.5 border ${cardBox}`}>
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-inherit" style={fontSans}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-[#1B365D] text-white">STEP 2 · 자기 점검</span>
                    <span className={`text-[12px] font-bold ${textHead}`}>
                      말씀의 거울 앞 영적 현주소 체크리스트 (클릭하여 점검)
                    </span>
                  </div>
                  <span className={`text-[10.5px] font-mono ${textMuted}`}>
                    {currentWeekMeta.diagnostics.filter((_, idx) => checks[`w${selectedWeek}_diag_${idx}`]).length} / 4 점검됨
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {currentWeekMeta.diagnostics.map((diagText, idx) => {
                    const dKey = `w${selectedWeek}_diag_${idx}`;
                    const isChecked = Boolean(checks[dKey]);
                    return (
                      <div
                        key={dKey}
                        onClick={() => toggleCheck(dKey)}
                        className={`p-2 border cursor-pointer flex items-start gap-2 transition-all ${
                          isChecked
                            ? (isDark ? 'bg-[#2A171A] border-[#7A2E26]' : 'bg-[#FFF5F5] border-[#7A2E26]')
                            : subBox
                        }`}
                      >
                        <div className={`w-4 h-4 border shrink-0 flex items-center justify-center mt-0.5 ${
                          isChecked ? 'bg-[#7A2E26] border-[#7A2E26] text-white' : 'border-slate-400'
                        }`}>
                          {isChecked && <IconCheck />}
                        </div>
                        <span className={`text-[12px] leading-snug break-keep ${isChecked ? `${textHead} font-bold` : textBody}`} style={fontSerif}>
                          {diagText}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 모바일에서도 볼 수 있는 이번 주 6대 필수 과제 체크 바 */}
                <div className="mt-3 pt-2.5 border-t border-inherit">
                  <span className={`text-[11px] font-bold block mb-1.5 ${textMuted}`} style={fontSans}>
                    📌 이번 주 6대 필수 양육 과제 수행 점검
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-1" style={fontSans}>
                    {SIX_CORE_ASSIGNMENTS.map(task => {
                      const tKey = `w${selectedWeek}_task_${task.id}`;
                      const isDone = Boolean(checks[tKey]);
                      return (
                        <button
                          key={task.id}
                          onClick={() => toggleCheck(tKey)}
                          className={`p-1.5 border text-left cursor-pointer transition-all ${
                            isDone
                              ? (isDark ? 'bg-[#1C2430] border-[#3E526D] text-white' : 'bg-[#F0F5FA] border-[#1B365D] text-[#1B365D]')
                              : subBox
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span>{task.label}</span>
                            <span className={`w-3.5 h-3.5 border flex items-center justify-center ${isDone ? 'bg-[#1B365D] border-[#1B365D] text-white' : 'border-slate-400'}`}>
                              {isDone && <IconCheck />}
                            </span>
                          </div>
                          <span className={`text-[9.5px] block truncate mt-0.5 ${textMuted}`}>{task.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* STEP 3. [따라하며 작성하기] 4단계 구속사 묵상·회개·적용 가이드 워크시트 */}
              <div className={`p-3.5 border ${cardBox}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2.5 border-b border-inherit" style={fontSans}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-[#7A2E26] text-white">STEP 3 · 따라 쓰기</span>
                    <span className={`text-[12px] font-bold ${textHead}`}>
                      4단계 제자도 심층 묵상 & 회개·적용 워크시트
                    </span>
                  </div>
                  <button
                    onClick={() => compileGuidedStepsToJournal(selectedWeek)}
                    className={`px-2.5 py-1 text-[11px] font-bold border cursor-pointer ${
                      isDark ? 'bg-[#7A2E26] text-white border-[#7A2E26]' : 'bg-[#1B365D] text-white border-[#1B365D]'
                    }`}
                  >
                    ✍️ 아래 4단 작성 내용을 종합 성찰 일지로 병합·승인
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentWeekMeta.stepPrompts.map((promptText, idx) => {
                    const stepKey = `w${selectedWeek}_step_${idx}`;
                    return (
                      <div key={stepKey} className={`p-2.5 border ${subBox} flex flex-col justify-between gap-1.5`}>
                        <label className={`text-[11.5px] font-bold leading-snug ${textHead} break-keep`} style={fontSans}>
                          {promptText}
                        </label>
                        <textarea
                          value={forms[stepKey] || ''}
                          onChange={e => handleForm(stepKey, e.target.value)}
                          placeholder="질문을 따라 정직하게 내 삶과 마음을 기록하십시오 (자동 저장)..."
                          className={`w-full p-2 h-20 text-[12px] leading-relaxed resize-none outline-none ${inputStyle}`}
                          style={fontSerif}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STEP 4. [적용하고 전송하기] 주간 실천 미션 & 통합 훈련 성찰 일지 */}
              <div className={`p-3.5 border ${cardBox} space-y-2.5`}>
                <div className={`p-2.5 border-l-4 border-l-emerald-600 ${subBox} flex flex-col sm:flex-row sm:items-center justify-between gap-2`}>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase block" style={fontSans}>
                      STEP 4 · WEEKLY OBEDIENCE MISSION (이번 주 실천 과제)
                    </span>
                    <p className={`text-[12.5px] font-bold ${textHead} mt-0.5 break-keep`} style={fontSerif}>
                      🎯 {currentWeekMeta.weeklyMission}
                    </p>
                  </div>
                  <button
                    onClick={() => syncToPipeline('apply', forms[`w${selectedWeek}_step_3`] || currentWeekMeta.weeklyMission)}
                    className={`px-3 py-1.5 text-[11px] font-bold border shrink-0 cursor-pointer flex items-center gap-1 ${
                      isDark ? 'bg-[#202630] text-[#93C5FD] border-[#364052]' : 'bg-[#EBF3FA] text-[#0F4C81] border-[#C6DCF0]'
                    }`}
                    style={fontSans}
                  >
                    <IconTarget /> 적용 트래커에 등록
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-inherit" style={fontSans}>
                    <span className={`text-[12px] font-bold ${textHead}`}>
                      📝 {selectedWeek}주차 종합 훈련 성찰 일지 & 공동체 나눔 원고
                    </span>
                    <span className={`text-[10.5px] font-mono ${completedWeeks.includes(selectedWeek) ? 'text-emerald-500 font-bold' : textMuted}`}>
                      {completedWeeks.includes(selectedWeek) ? '✓ 주차 이수 승인됨' : '10자 이상 작성 또는 4단 워크시트 작성 시 이수 승인'}
                    </span>
                  </div>
                  <textarea
                    value={gameNotes[selectedWeek] || ''}
                    onChange={(e) => handleSaveGameNote(selectedWeek, e.target.value)}
                    placeholder="이번 주차 훈련을 통해 깨달은 죄와 하나님의 은혜, 구체적인 순종 결단과 소그룹에서 나눌 간증을 종합하여 기록하세요..."
                    className={`w-full p-2.5 h-32 text-[12.5px] leading-relaxed resize-y outline-none ${inputStyle}`}
                    style={fontSerif}
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2" style={fontSans}>
                    <button
                      onClick={() => syncToPipeline('prayer', gameNotes[selectedWeek] || forms[`w${selectedWeek}_step_2`])}
                      className={`px-3 py-1.5 text-[11px] font-bold border cursor-pointer flex items-center gap-1 ${subBox} ${textHead}`}
                    >
                      <IconSend /> 기도 보관함으로 전송
                    </button>
                    <button
                      onClick={() => {
                        const textToCopy = gameNotes[selectedWeek] || '';
                        if (!textToCopy.trim()) return alert('복사할 일지 내용이 없습니다.');
                        navigator.clipboard.writeText(textToCopy);
                        alert('소그룹 나눔용으로 클립보드에 복사되었습니다!');
                      }}
                      className={`px-3 py-1.5 text-[11px] font-bold border cursor-pointer flex items-center gap-1 ${subBox} ${textHead}`}
                    >
                      📋 소그룹 나눔용 복사
                    </button>
                  </div>
                </div>
              </div>

              {/* STEP 5. [찾아가는 페이지] 이번 주차 주제와 직결된 설교 코퍼스 추천 */}
              <div className={`p-3.5 border ${cardBox}`}>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-inherit" style={fontSans}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-[#1B365D] text-white">STEP 5 · 강해 코퍼스 연동</span>
                    <span className={`text-[12px] font-bold ${textHead}`}>
                      📚 {selectedWeek}주차 주제({currentWeekMeta.title}) 심화 추천 설교
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSermonWeekFilter(String(selectedWeek));
                      setActiveTab('gimpo');
                    }}
                    className="text-[11px] font-bold text-[#7A2E26] dark:text-[#F87171] hover:underline cursor-pointer"
                  >
                    전체 {liveSermonCount}편 코퍼스에서 더 찾기 ➔
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {matchedWeekSermons.map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedSermonModal(s)}
                      className={`p-2.5 border ${subBox} hover:border-[#7A2E26] cursor-pointer transition-all flex flex-col justify-between gap-1`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono" style={fontSans}>
                        <span className={textMuted}>{s.date} • {s.type}</span>
                        <span className="text-[#7A2E26] dark:text-[#F87171] font-bold">요약 열람 ▶</span>
                      </div>
                      <strong className={`text-[12.5px] font-bold ${textHead} truncate`} style={fontSerif}>
                        {s.title}
                      </strong>
                      <div className="flex items-center justify-between text-[11px]" style={fontSans}>
                        <span className={textBody}>{s.verse}</span>
                        <span className={`text-[10px] truncate max-w-[140px] ${textMuted}`}>{s.keywords}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 12주 전체 타임라인 미니 바인더 */}
              <div className={`p-3 border ${cardBox}`}>
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-inherit" style={fontSans}>
                  <span className={`text-[11.5px] font-bold ${textHead}`}>12주 제자도 형성 타임라인 현황</span>
                  <span className="text-[10.5px] font-mono text-[#7A2E26] dark:text-[#F87171] font-bold">
                    ({completedWeeks.length} / 12 완료)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {GAMIFIED_PATH_DATA.map(item => {
                    const isDone = completedWeeks.includes(item.w);
                    const isSelected = selectedWeek === item.w;
                    return (
                      <div 
                        key={item.w} 
                        onClick={() => setSelectedWeek(item.w)}
                        className={`p-2 border flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? (isDark ? 'bg-[#1C2430] border-[#3E526D]' : 'bg-[#F0F5FA] border-[#BDD0E4]') : subBox
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-5 h-5 border shrink-0 flex items-center justify-center text-white ${isDone ? 'bg-[#7A2E26] border-[#7A2E26]' : 'bg-transparent text-slate-400'}`}>
                            {getPlantIcon(item.w, isDone)}
                          </div>
                          <span className={`text-[12px] truncate ${textHead}`} style={fontSerif}>
                            Week {item.w}. {item.title}
                          </span>
                        </div>
                        <span className={`text-[9.5px] font-mono px-1.5 py-0.5 border shrink-0 ${isDone ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold' : 'text-slate-400 border-transparent'}`}>
                          {isDone ? 'DONE' : 'OPEN'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ════════ § Ⅰ. 제자훈련 신학개관 (정통 개혁교리와 구속사적 양육 체계) ════════ */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-3">
              <div className="pb-2 border-b border-inherit">
                <span className="font-mono text-[10.5px] font-bold text-[#7A2E26] dark:text-[#F87171] uppercase" style={fontSans}>
                  CANONICAL & THEOLOGICAL FOUNDATION • § Ⅰ
                </span>
                <h2 className={`text-[17px] sm:text-[19px] font-bold tracking-tight mt-0.5 ${textHead}`} style={fontSerif}>
                  구속사적 제자훈련의 신학적 기초 및 15대 핵심 원리
                </h2>
              </div>

              {/* 5단계 제자양육 아키텍처 로드맵 */}
              <div className={`p-3 border ${cardBox}`}>
                <span className={`text-[11.5px] font-bold block mb-2 ${textHead}`} style={fontSans}>
                  1. 단계별 제자양육 성장 아키텍처 (5단계 재생산 사다리)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5" style={fontSans}>
                  {[
                    { step: "STAGE 1", name: "새가족 입문 (1주)", desc: "구원의 확신과 언약 공동체 소속감 확립" },
                    { step: "STAGE 2", name: "기초 교리·묵상 (6주)", desc: "성경·하나님·구속·예배·기도의 뼈대 세우기" },
                    { step: "STAGE 3", name: "제자 양육 심화 (12주)", desc: "사건의 구속사적 해석, 회개와 순종 체화" },
                    { step: "STAGE 4", name: "양육 교사 훈련 (10주)", desc: "말씀으로 영혼을 분별하고 안내하는 교사" },
                    { step: "STAGE 5", name: "소그룹 목자 리더십 (20주)", desc: "아비의 마음으로 생명을 낳고 기르는 재생산" }
                  ].map((st, idx) => (
                    <div key={idx} className={`p-2 border ${subBox}`}>
                      <span className="font-mono text-[9.5px] font-bold text-[#7A2E26] dark:text-[#F87171] block">{st.step}</span>
                      <strong className={`text-[11.5px] ${textHead} block my-0.5`}>{st.name}</strong>
                      <p className={`text-[10.5px] ${textMuted} leading-snug`} style={fontSerif}>{st.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 15대 핵심 양육 규정 카드 그리드 */}
              <div className={`p-3 border ${cardBox}`}>
                <span className={`text-[11.5px] font-bold block mb-2 ${textHead}`} style={fontSans}>
                  2. 성숙한 제자도 형성을 위한 15대 핵심 양육 원리
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {[
                    "01. 제자양육의 제일 되는 목적은 성도가 하나님을 영화롭게 하고 그분을 영원토록 즐거워하도록 세우는 것이다.",
                    "02. 단순한 성경 지식의 축적이 아니라, 말씀 앞에서 자신의 죄를 발견하고 그리스도의 형상을 본받는 성화 훈련이다.",
                    "03. 인도자 1명과 동반자 소그룹이 6대 핵심 과제(주제묵상·신앙성찰·생활순종·설교요약·매일루틴·공동체섬김)를 함께 완수한다.",
                    "04. 주제 묵상은 [본문 요약 ➔ 말씀 직면 질문 ➔ 내 죄와 우상 묵상 ➔ 구체적 적용 ➔ 언약 기도]의 5단 구조로 진행한다.",
                    "05. 생활 숙제는 구속사적 간증문 작성, 청지기적 시간 관리, 성령의 도우심으로 감정을 다스린 순종 경험을 요구한다.",
                    "06. 설교 노트는 선포된 말씀의 문맥과 대지를 정확히 구분하고, 내 삶의 사건에 대입하여 순종 과제를 도출한다.",
                    "07. 매일 말씀묵상(QT)은 새벽과 일상의 첫 시간을 구별하여 은혜의 방도(말씀과 기도) 앞에 규칙적으로 서는 훈련이다.",
                    "08. 공동체 섬김은 예배와 모임의 보이지 않는 자리를 자발적으로 세팅하고 섬기며 바르실래의 무명 충성을 배우는 과정이다.",
                    "09. 신학적 균형을 위해 ‘영원한 칭의(정죄 없음)’와 ‘하나님 아버지의 사랑의 훈육(성화의 징계)’을 명확히 구별한다.",
                    "10. 구약의 역사·언약 본문(신명기·사무엘하·에스라 등)과 신약의 복음·교리 본문(복음서·로마서 등)을 구속사적으로 통합한다.",
                    "11. 핵심 교리 축은 [신앙고백 ➔ 청지기 시간관리 ➔ 말씀묵상 ➔ 기도 ➔ 삼위일체 하나님 ➔ 중생과 칭의 ➔ 성화 ➔ 영혼구원]으로 이어진다.",
                    "12. 모든 고난과 갈등 사건에서 ‘객관적 사실’과 ‘내 욕망이 만든 해석’을 분리하여 말씀의 빛 아래 재해석한다.",
                    "13. 참된 회개는 가룟 유다식의 자기 연민과 후회를 넘어, 베드로의 통곡과 다윗의 값을 치르는 제단처럼 구체적 행동을 동반한다.",
                    "14. 수치가 드러나도 공동체를 떠나지 않고 투명하게 고백할 때, 서로의 짐을 지는 거룩한 공교회의 치유가 일어난다.",
                    "15. 양육의 최종 열매는 내 고난이 누군가를 살리는 약재(간증)가 되어 또 다른 한 영혼을 제자로 세우는 재생산이다."
                  ].map((r, i) => (
                    <div key={i} className={`p-2 border ${subBox} flex items-start gap-1.5`}>
                      <span className="font-mono text-[10px] font-bold text-[#7A2E26] dark:text-[#F87171] shrink-0 mt-0.5">[{r.slice(0, 2)}]</span>
                      <p className={`text-[12px] leading-relaxed ${textBody} break-keep`} style={fontSerif}>{r.slice(4)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 수료자 15대 제자도 자격 검증표 */}
              <div className={`p-3 border ${cardBox}`}>
                <div className="flex items-center justify-between mb-2" style={fontSans}>
                  <span className={`text-[11.5px] font-bold ${textHead}`}>
                    3. 최종 제자도 성숙 15대 자격 검증표 (클릭하여 자가 점검)
                  </span>
                  <span className="text-[11px] font-mono font-bold text-[#7A2E26] dark:text-[#F87171]">
                    달성도: {Math.round(([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].filter(n => checks[`m${n}`]).length / 15) * 100)}%
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {[
                    {k:'m1', t:'십자가 대속과 칭의·성화의 복음을 성경적으로 설명할 수 있다.'},
                    {k:'m2', t:'흔들리지 않는 나의 구속사적 신앙고백을 말할 수 있다.'},
                    {k:'m3', t:'성경을 아전인수로 쓰지 않고 정경적 문맥 속에서 읽는다.'},
                    {k:'m4', t:'매일 말씀묵상과 기도의 은혜의 방도를 지속한다.'},
                    {k:'m5', t:'일어난 사건(Fact)과 내 욕망이 붙인 해석을 구별한다.'},
                    {k:'m6', t:'갈등 속에서 상대의 허물보다 내 안의 죄와 우상을 먼저 본다.'},
                    {k:'m7', t:'감정적 후회에 머물지 않고 값을 치르는 순종으로 회개한다.'},
                    {k:'m8', t:'타인의 고난을 인과응보로 함부로 판단하거나 정죄하지 않는다.'},
                    {k:'m9', t:'감사의 이유가 환경적 결과가 아니라 하나님 한 분을 향한다.'},
                    {k:'m10', t:'공동체 안에서 자기 의의 가면을 벗고 연약함을 나눌 수 있다.'},
                    {k:'m11', t:'아비의 마음으로 연약한 지체를 정죄 없이 기다리고 돌본다.'},
                    {k:'m12', t:'보상 없는 무명의 자리(바르실래의 영성)에서 실제로 섬긴다.'},
                    {k:'m13', t:'내 고난을 구속사적 간증으로 바꾸어 영혼 구원에 쓰임 받는다.'},
                    {k:'m14', t:'말씀과 기도로 또 다른 한 사람을 제자로 세울 수 있다.'},
                    {k:'m15', t:'내가 보이지 않아도 말씀 공동체의 재생산이 이어지도록 돕는다.'}
                  ].map(c => {
                    const isChecked = Boolean(checks[c.k]);
                    return (
                      <div 
                        key={c.k} 
                        onClick={() => toggleCheck(c.k)}
                        className={`p-1.5 border cursor-pointer flex items-center gap-2 ${
                          isChecked ? (isDark ? 'bg-[#1C2430] border-[#3E526D]' : 'bg-[#F0F5FA] border-[#BDD0E4]') : subBox
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 border shrink-0 flex items-center justify-center ${isChecked ? 'bg-[#7A2E26] border-[#7A2E26] text-white' : 'border-slate-400'}`}>
                          {isChecked && <IconCheck />}
                        </div>
                        <span className={`text-[12px] ${isChecked ? `${textHead} font-bold` : textBody}`} style={fontSerif}>{c.t}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 양육 인도자 서약 선언 */}
              <div className={`p-3 border-l-2 border-[#7A2E26] ${subBox} text-[12.5px] leading-relaxed italic ${textBody}`} style={fontSerif}>
                "나는 동반자에게 내 인간적인 답을 주는 사람이 아니라, 성도가 말씀 앞에서 살아계신 하나님을 직접 만나도록 돕는 청지기이다. 나는 지체의 고난을 함부로 재단하지 않으며, 고백된 죄와 아픔을 십자가 보혈 아래 안전하게 지킨다. 나는 말씀을 삶으로 살아내며 끝까지 한 영혼을 품는다."
              </div>
            </div>
          )}

          {/* ════════ § Ⅱ. 해석 프로토콜 (인터랙티브 12단계 워크숍 & 5단계 감사) ════════ */}
          {activeTab === 'protocols' && (
            <div className="flex flex-col gap-3">
              <div className="pb-2 border-b border-inherit">
                <span className="font-mono text-[10.5px] font-bold text-[#7A2E26] dark:text-[#F87171] uppercase" style={fontSans}>
                  HERMENEUTICS & PROTOCOL • § Ⅱ
                </span>
                <h2 className={`text-[17px] sm:text-[19px] font-bold tracking-tight mt-0.5 ${textHead}`} style={fontSerif}>
                  구속사적 고난 해석 12단계 및 감사의 5단계 프로토콜
                </h2>
              </div>

              {/* 고난 해석 12단계 인터랙티브 스텝 체크 */}
              <div className={`p-3 border ${cardBox}`}>
                <div className="flex items-center justify-between mb-2" style={fontSans}>
                  <span className={`text-[11.5px] font-bold ${textHead}`}>
                    1. 고난 해석 12단계 실습 프로토콜 (각 단계를 클릭하여 적용 완료 체크)
                  </span>
                  <span className="text-[10.5px] font-mono text-[#7A2E26] dark:text-[#F87171] font-bold">
                    {['01','02','03','04','05','06','07','08','09','10','11','12'].filter(s => checks[`proto12_${s}`]).length} / 12 단계 통과
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {[
                    { s: '01', t: '객관적 사실 기록', d: '감정을 빼고 일어난 사건의 사실만 기록한다.' },
                    { s: '02', t: '실존적 감정 직면', d: '하나님 앞에 숨김없이 아픔과 감정을 토로한다.' },
                    { s: '03', t: '나의 기존 해석 분리', d: '사건에 내가 임의로 붙인 억측과 해석을 적는다.' },
                    { s: '04', t: '상실의 두려움 점검', d: '이 사건으로 잃었다고 여기는 것이 무엇인지 찾는다.' },
                    { s: '05', t: '내면의 우상 폭로', d: '반드시 가져야만 한다는 통제욕·인정욕을 찾는다.' },
                    { s: '06', t: '약속의 말씀 직면', d: '내 욕망과 두려움을 성경 말씀의 빛 앞에 세운다.' },
                    { s: '07', t: '하나님의 성품 확인', d: '실수가 없으신 하나님의 주권과 선하심을 확인한다.' },
                    { s: '08', t: '십자가 복음 확증', d: '정죄를 없애신 그리스도의 대속 은혜를 붙든다.' },
                    { s: '09', t: '죄와 비책임 분별', d: '내가 회개할 죄와 하나님께 맡길 영역을 구별한다.' },
                    { s: '10', t: '구체적 순종 결단', d: '값을 치르며 오늘 실천할 한 가지 행동을 정한다.' },
                    { s: '11', t: '공동체 중보 요청', d: '가면을 벗고 소그룹 지체에게 나눔과 기도를 청한다.' },
                    { s: '12', t: '구속사적 간증 재편집', d: '내 고난을 다른 영혼을 살리는 간증으로 재해석한다.' }
                  ].map(item => {
                    const pKey = `proto12_${item.s}`;
                    const isDone = Boolean(checks[pKey]);
                    return (
                      <div
                        key={item.s}
                        onClick={() => toggleCheck(pKey)}
                        className={`p-2 border cursor-pointer transition-all ${
                          isDone ? (isDark ? 'bg-[#1C2430] border-[#3E526D]' : 'bg-[#F0F5FA] border-[#1B365D]') : subBox
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-mono text-[9.5px] font-bold text-[#7A2E26] dark:text-[#F87171]">STEP {item.s}</span>
                          <div className="flex items-center gap-1">
                            <strong className={`text-[11.5px] ${textHead}`} style={fontSans}>{item.t}</strong>
                            <span className={`w-3.5 h-3.5 border flex items-center justify-center ${isDone ? 'bg-[#7A2E26] border-[#7A2E26] text-white' : 'border-slate-400'}`}>
                              {isDone && <IconCheck />}
                            </span>
                          </div>
                        </div>
                        <p className={`text-[11px] ${textMuted}`} style={fontSerif}>{item.d}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 감사의 5단계 훈련 실습 */}
              <div className={`p-3 border ${cardBox}`}>
                <span className={`text-[11.5px] font-bold block mb-2 ${textHead}`} style={fontSans}>
                  2. 감사의 5단계 성숙 실습 대장 (조건부 감사에서 구속사적 감사로)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                  {[
                    '1단계. 사실 감사 (일상에서 실제로 허락하신 일반은총)',
                    '2단계. 구원 은혜 감사 (자격 없는 죄인에게 베푸신 십자가 은혜)',
                    '3단계. 성품 감사 (변함없이 신실하신 하나님의 주권과 인자하심)',
                    '4단계. 고난 속 감사 (원치 않는 연단을 통해 내 죄를 보게 하심)',
                    '5단계. 순종의 감사 (말씀에 순종하여 영혼을 섬길 수 있는 특권)'
                  ].map((step, i) => (
                    <div key={i} className={`p-1.5 border ${subBox}`}>
                      <label className={`text-[11px] font-bold ${textHead} block mb-0.5`} style={fontSans}>{step}</label>
                      <input 
                        type="text" 
                        value={forms[`thk_${i}`] || ''} 
                        onChange={e => handleForm(`thk_${i}`, e.target.value)} 
                        placeholder="구체적인 감사의 고백을 기록하십시오..." 
                        className={`w-full p-1.5 text-[11.5px] outline-none ${inputStyle}`}
                        style={fontSerif}
                      />
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => syncToPipeline('prayer', forms['thk_4'] || forms['thk_3'] || forms['thk_0'] || '5단계 감사 실습 고백')}
                  className={`w-full py-2 text-[12px] font-bold flex items-center justify-center gap-1 cursor-pointer border ${
                    isDark ? 'bg-[#202630] text-[#E6EDF3] border-[#364052]' : 'bg-[#EDE8DC] text-[#1A202C] border-[#CBC1AD]'
                  }`}
                  style={fontSans}
                >
                  <IconSend /> 작성한 감사 고백을 기도 보관함으로 전송
                </button>
              </div>

              {/* 고난 왜곡 방지 8대 필터 */}
              <div className={`p-3 border ${cardBox}`}>
                <span className={`text-[11.5px] font-bold block mb-2 text-[#B91C1C] dark:text-[#F87171]`} style={fontSans}>
                  3. 고난 왜곡 방지 8대 교리·영성 필터 점검표
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {[
                    {k:'f1', t:'하나님의 깊은 섭리를 다 안다고 욥의 친구들처럼 단정하지 않는가?'},
                    {k:'f2', t:'내 죄는 가리고 상대방의 죄만 내 해석으로 정죄하지 않는가?'},
                    {k:'f3', t:'사랑의 아버지를 단지 벌주시는 심판관으로만 오해하지 않는가?'},
                    {k:'f4', t:'상황과 가족을 내 뜻대로 조종하려는 통제욕이 숨어 있지 않은가?'},
                    {k:'f5', t:'사람들에게 인정받고 생색내려는 자기 의가 숨어 있지 않은가?'},
                    {k:'f6', t:'성경 본문을 문맥 없이 내 욕망을 정당화하는 데 끼워 맞추지 않는가?'},
                    {k:'f7', t:'영적 교만에 빠져 공동체와 실제적 치료·도움을 거부하지 않는가?'},
                    {k:'f8', t:'시편 기자처럼 하나님 앞에 정직히 탄식하며 나아갈 길을 막지 않는가?'}
                  ].map(f => (
                    <div 
                      key={f.k} 
                      onClick={() => toggleCheck(f.k)}
                      className={`p-1.5 border cursor-pointer flex items-center gap-2 ${
                        checks[f.k] ? (isDark ? 'bg-[#2A171A] border-[#55272F]' : 'bg-[#FFF0F0] border-[#FCA5A5]') : subBox
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 border shrink-0 flex items-center justify-center ${
                        checks[f.k] ? 'bg-[#B91C1C] border-[#B91C1C] text-white' : 'border-slate-400'
                      }`}>
                        {checks[f.k] && <IconCheck />}
                      </div>
                      <span className={`text-[11.5px] break-keep ${checks[f.k] ? 'text-[#B91C1C] dark:text-[#F87171] font-bold' : textBody}`} style={fontSerif}>
                        {f.t}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════ § Ⅲ. 주차별 실천 과제 & 주간 규율 & 루브릭 ════════ */}
          {activeTab === 'curriculum' && (
            <div className="flex flex-col gap-3">
              <div className="pb-2 border-b border-inherit">
                <span className="font-mono text-[10.5px] font-bold text-[#7A2E26] dark:text-[#F87171] uppercase" style={fontSans}>
                  PRACTICAL ASSIGNMENT & RUBRICS • § Ⅲ
                </span>
                <h2 className={`text-[17px] sm:text-[19px] font-bold tracking-tight mt-0.5 ${textHead}`} style={fontSerif}>
                  4기 12주 핵심 교과 요람 및 주간 8대 영적 규율 점검
                </h2>
              </div>

              {/* 4기 12주 집중과정 요람 */}
              <div className={`p-3 border ${cardBox}`}>
                <span className={`text-[11.5px] font-bold block mb-2 ${textHead}`} style={fontSans}>
                  1. 4기 12주 통합 제자양육 교과 요람 (클릭 시 해당 주차 워크스테이션으로 이동)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { w: 1, phase: '제1기 (1~3주): 말씀과 자기직면', t: '복음·성경의 권위와 사실·해석 분리', k: '창조주 주권, 베드로의 죄인 발견, 인본주의 해체', p: '당연한 은혜 찾기, 매일 말씀묵상, 사실/해석 분리표', a: '주 5회 묵상, 자기직면 일지 3편, 불평 멈추기' },
                    { w: 4, phase: '제2기 (4~6주): 섭리와 고난 재해석', t: '조각목의 연단과 정죄·징계의 구별', k: '절대 감사, 앞서가시는 주님, 칭의의 안전함과 성화', p: '5단계 감사 대장, 인생 고난 지도, 8대 왜곡 필터', a: '고난 연대표 작성, 정죄감 극복 기도문, 예배 회복' },
                    { w: 7, phase: '제3기 (7~9주): 십자가 회개와 공동체', t: '나단의 직언, 값을 치르는 제단, 공동체 연합', k: '자기기만 타파, 베드로의 통곡, 아라우나 제단, 지체 의식', p: '내 안의 우상 폭로, 손해 감수 순종, 투명한 연약함 나눔', a: '구체적 화해/순종 1회, 소그룹 중보 나눔, 허물 덮어주기' },
                    { w: 10, phase: '제4기 (10~12주): 구속사 사명과 재생산', t: '성전 재건, 바르실래의 섬김, 영적 아비의 마음', k: '언약 성취, 무명의 충성, 살리는 간증, 대위임령 재생산', p: '가정 구속사 나눔, 8단 표준 간증문, 한 영혼 품기', a: '표준 간증문 1편 완성, 무명 봉사 1회, 90일 제자화 계획' }
                  ].map(item => (
                    <div
                      key={item.w}
                      onClick={() => {
                        setSelectedWeek(item.w);
                        setActiveTab('path');
                      }}
                      className={`p-2.5 border ${subBox} hover:border-[#7A2E26] cursor-pointer transition-all`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-[12.5px] text-[#7A2E26] dark:text-[#F87171]" style={fontSans}>{item.phase}</strong>
                        <span className="text-[10px] font-mono text-slate-400">이동 ▶</span>
                      </div>
                      <div className="space-y-0.5 text-[11.5px]" style={fontSerif}>
                        <p><strong className={textHead}>주제:</strong> {item.t}</p>
                        <p><strong className={textMuted}>교리·핵심:</strong> {item.k}</p>
                        <p><strong className={textMuted}>실습:</strong> {item.p}</p>
                        <p><strong className={textHead}>필수과제:</strong> {item.a}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 주간 8대 영적 규율 실천표 */}
              <div className={`p-3 border ${cardBox}`}>
                <span className={`text-[11.5px] font-bold block mb-2 ${textHead}`} style={fontSans}>
                  2. 주간 8대 영적 규율 실천 점검표 (월~일 체크 시 영적 밸런스 및 홈 루틴 반영)
                </span>
                <div className="overflow-x-auto hide-scrollbar border border-inherit">
                  <table className="w-full text-center text-[12px] min-w-[440px]" style={fontSans}>
                    <thead>
                      <tr className={`${isDark ? 'bg-[#121519]' : 'bg-[#EAE5DC]'} border-b ${borderRule}`}>
                        <th className={`p-1.5 font-bold ${textHead} border-r ${borderRule}`}>규율 항목</th>
                        {['월','화','수','목','금','토','일'].map(d => <th key={d} className={`p-1.5 font-bold ${textHead} border-r last:border-r-0 ${borderRule}`}>{d}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-inherit">
                      {['QT', '기도', '감사', '회개', '적용', '섬김', '관계회복', '복음'].map(item => (
                        <tr key={item}>
                          <td className={`p-1.5 font-bold border-r ${borderRule} ${textHead}`}>{item}</td>
                          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => {
                            const key = `w_${item}_${day}`;
                            const isChecked = Boolean(weeklyCheck[key]);
                            return (
                              <td key={day} className={`p-1.5 border-r last:border-r-0 ${borderRule}`}>
                                <div 
                                  onClick={() => toggleWeekly(key)}
                                  className={`w-4 h-4 mx-auto border flex items-center justify-center cursor-pointer ${
                                    isChecked ? 'bg-[#7A2E26] border-[#7A2E26] text-white' : 'border-slate-400'
                                  }`}
                                >
                                  {isChecked && <IconCheck />}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button 
                  onClick={() => syncToPipeline('weekly_checks')}
                  className={`w-full mt-2 py-2 text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                    isDark ? 'bg-[#202630] text-[#E6EDF3] border-[#364052]' : 'bg-[#EDE8DC] text-[#1A202C] border-[#CBC1AD]'
                  }`}
                  style={fontSans}
                >
                  <IconSend /> 위 체크 내역을 오늘의 '영적 5종 세트' 루틴에 즉시 동기화
                </button>
              </div>

              {/* 성숙도 평가 루브릭 */}
              <div className={`p-3 border ${cardBox}`}>
                <span className={`text-[11.5px] font-bold block mb-2 ${textHead}`} style={fontSans}>
                  3. 제자도 5대 영역 성숙 루브릭 평가 (조절 시 좌측 영적 5대 밸런스에 즉시 연동)
                </span>
                <div className="space-y-1.5">
                  {[
                    { id: 'word', label: '말씀 이해 (단편적 지식 ➔ 구속사적 문맥과 십자가 복음 연결)' },
                    { id: 'reflect', label: '자기 성찰 (환경·타인 탓 ➔ 말씀 앞에서 내 죄와 우상 먼저 직면)' },
                    { id: 'apply', label: '순종 적용 (추상적 다짐 ➔ 값을 치르는 구체적·측정 가능한 순종)' },
                    { id: 'community', label: '공동체성 (자기 포장·고립 ➔ 투명한 고백과 경청·지체 돌봄)' },
                    { id: 'reproduce', label: '영적 재생산 (수동적 참여 ➔ 아비의 마음으로 한 영혼을 세움)' }
                  ].map(r => (
                    <div key={r.id} className={`p-2 border flex items-center justify-between gap-2 ${subBox}`}>
                      <span className={`text-[12px] font-bold ${textHead}`} style={fontSans}>{r.label}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono text-[12px] font-bold text-[#7A2E26] dark:text-[#F87171]">{rubrics[r.id]}점</span>
                        <input 
                          type="range" min="1" max="5" step="1" 
                          value={rubrics[r.id] || 3} 
                          onChange={e => handleRubric(r.id, e.target.value)} 
                          className="w-20 sm:w-28 h-1 accent-[#7A2E26] cursor-pointer" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════ § Ⅳ. 설교 코퍼스 심층 분석 (99+편 실시간 동기화 & 인터랙티브 리더) ════════ */}
          {activeTab === 'gimpo' && (
            <div className="flex flex-col gap-3">
              <div className="pb-2 border-b border-inherit">
                <span className="font-mono text-[10.5px] font-bold text-[#7A2E26] dark:text-[#F87171] uppercase" style={fontSans}>
                  HOMILETIC & EXPOSITORY CORPUS • § Ⅳ
                </span>
                <h2 className={`text-[17px] sm:text-[19px] font-bold tracking-tight mt-0.5 ${textHead}`} style={fontSerif}>
                  {liveSermonCount}편 강해 설교 코퍼스 통합 데이터베이스 & 양육 매핑
                </h2>
              </div>

              {/* 정경 강해 & 실존적 묵상 통합 해석 프레임워크 */}
              <div className={`p-3 border ${cardBox}`}>
                <span className={`text-[11.5px] font-bold block mb-2 ${textHead}`} style={fontSans}>
                  1. 본 양육 과정의 3중 통합 말씀 해석 프레임워크
                </span>
                <div className="w-full overflow-x-auto hide-scrollbar border border-inherit">
                  <table className="w-full text-left text-[11.5px] min-w-[500px]" style={fontSans}>
                    <thead>
                      <tr className={`${isDark ? 'bg-[#121519]' : 'bg-[#EAE5DC]'} border-b ${borderRule}`}>
                        <th className={`p-1.5 font-bold ${textHead} w-28 border-r ${borderRule}`}>해석 차원</th>
                        <th className={`p-1.5 font-bold ${textHead} w-48 border-r ${borderRule}`}>정경적·교리적 강해 (신학의 뼈대)</th>
                        <th className={`p-1.5 font-bold ${textHead}`}>실존적·구속사적 적용 (삶의 체화)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-inherit">
                      <tr>
                        <td className={`p-1.5 font-bold ${textHead} border-r ${borderRule}`}>본문 접근</td>
                        <td className={`p-1.5 border-r ${borderRule} ${textBody}`} style={fontSerif}>성경 각 권의 연속 강해(Lectio Continua)와 구속사적 문맥 파악</td>
                        <td className={`p-1.5 ${textBody}`} style={fontSerif}>오늘 나의 사건 속에서 내 죄와 우상을 비추는 거울로 직면</td>
                      </tr>
                      <tr>
                        <td className={`p-1.5 font-bold ${textHead} border-r ${borderRule}`}>교리 분별</td>
                        <td className={`p-1.5 border-r ${borderRule} ${textBody}`} style={fontSerif}>원죄와 자범죄, 칭의(정죄 없음)와 성화(사랑의 징계)의 정밀한 구분</td>
                        <td className={`p-1.5 ${textBody}`} style={fontSerif}>고난을 저주로 오해하지 않고 영혼을 살리는 약재로 재해석</td>
                      </tr>
                      <tr>
                        <td className={`p-1.5 font-bold ${textHead} border-r ${borderRule}`}>실천 열매</td>
                        <td className={`p-1.5 border-r ${borderRule} ${textBody}`} style={fontSerif}>언약 공동체의 회복, 값을 치르는 제단, 무명의 청지기직 확립</td>
                        <td className={`p-1.5 ${textBody}`} style={fontSerif}>5단계 감사와 12단계 고난 프로토콜을 통한 구체적 순종과 간증</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 99+편 설교 DB 다중 필터 & 검색기 */}
              <div className={`p-3 border ${cardBox}`}>
                <div className="flex flex-col gap-2 pb-2 mb-2 border-b border-inherit" style={fontSans}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className={`text-[12.5px] font-bold ${textHead}`}>
                      2. 실시간 설교 코퍼스 아카이브 ({filteredCorpusSermons.length} / {liveSermonCount}편 표시중 — 클릭 시 요약 열람)
                    </h3>
                    <div className={`flex items-center gap-1.5 px-2 py-1 border ${inputStyle}`}>
                      <IconSearch />
                      <input 
                        type="text" 
                        placeholder="본문, 제목, 키워드, 요약 검색..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-transparent outline-none text-[12px] w-48"
                      />
                      {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="text-[10px] opacity-60 cursor-pointer">✕</button>
                      )}
                    </div>
                  </div>

                  {/* 예배 구분 필터 & 12주차 주제 연동 필터 */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
                      {['ALL', '주일예배', '수요예배', '금요예배', '기상오기'].map(tp => (
                        <button
                          key={tp}
                          onClick={() => setSermonTypeFilter(tp)}
                          className={`px-2 py-0.5 text-[10.5px] font-bold border cursor-pointer ${
                            sermonTypeFilter === tp
                              ? (isDark ? 'bg-[#7A2E26] text-white border-[#7A2E26]' : 'bg-[#1B365D] text-white border-[#1B365D]')
                              : `${subBox} ${textMuted}`
                          }`}
                        >
                          {tp === 'ALL' ? '전체 예배' : tp === '기상오기' ? '새벽·기상오기' : tp}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10.5px] font-bold ${textMuted}`}>양육 주차별 필터:</span>
                      <select
                        value={sermonWeekFilter}
                        onChange={e => setSermonWeekFilter(e.target.value)}
                        className={`px-2 py-0.5 text-[11px] font-bold outline-none border ${inputStyle}`}
                      >
                        <option value="ALL">전체 1~12주 코퍼스</option>
                        {GAMIFIED_PATH_DATA.map(w => (
                          <option key={w.w} value={String(w.w)}>{w.w}주차: {w.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 설교 코퍼스 테이블 (행 클릭 시 상세 요약 모달 오픈) */}
                <div className="max-h-96 overflow-y-auto hide-scrollbar border border-inherit">
                  <table className="w-full text-left text-[11.5px]" style={fontSans}>
                    <thead>
                      <tr className={`${isDark ? 'bg-[#121519]' : 'bg-[#EAE5DC]'} border-b ${borderRule} sticky top-0 z-10`}>
                        <th className={`p-1.5 font-bold ${textHead} w-24 border-r ${borderRule}`}>일자</th>
                        <th className={`p-1.5 font-bold ${textHead} w-20 border-r ${borderRule}`}>구분</th>
                        <th className={`p-1.5 font-bold ${textHead} border-r ${borderRule}`}>설교 제목 (클릭하여 요약 보기)</th>
                        <th className={`p-1.5 font-bold ${textHead} w-36 border-r ${borderRule}`}>성경 본문</th>
                        <th className={`p-1.5 font-bold ${textHead} w-40`}>핵심 키워드</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-inherit">
                      {filteredCorpusSermons.map((s, i) => (
                        <tr
                          key={i}
                          onClick={() => setSelectedSermonModal(s)}
                          className="hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <td className={`p-1.5 font-mono text-[11px] border-r ${borderRule} ${textMuted}`}>{s.date}</td>
                          <td className={`p-1.5 font-bold border-r ${borderRule} ${textHead}`}>{s.type}</td>
                          <td className={`p-1.5 font-bold border-r ${borderRule} ${textHead}`} style={fontSerif}>
                            <span>{s.title}</span>
                            {s.summary && <span className="ml-1.5 text-[9.5px] font-mono text-[#7A2E26] dark:text-[#F87171]">[요약본]</span>}
                          </td>
                          <td className={`p-1.5 border-r ${borderRule} ${textMuted}`}>{s.verse}</td>
                          <td className={`p-1.5 text-[11px] ${textMuted}`} style={fontSerif}>{s.keywords}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════ § Ⅴ. 종합 실전 양식 (고난 해석 1페이지 & 나단과 다윗의 참회 4주) ════════ */}
          {activeTab === 'appendix' && (
            <div className="flex flex-col gap-3">
              <div className="pb-2 border-b border-inherit">
                <span className="font-mono text-[10.5px] font-bold text-[#7A2E26] dark:text-[#F87171] uppercase" style={fontSans}>
                  WORKSHEET & APPENDICES • § Ⅴ
                </span>
                <h2 className={`text-[17px] sm:text-[19px] font-bold tracking-tight mt-0.5 ${textHead}`} style={fontSerif}>
                  고난 해석 1페이지 표준 양식 & 다윗의 참회 4주 심화 강독
                </h2>
              </div>

              {/* 고난 해석 1페이지 실습지 (12개 입력필드) */}
              <div className={`p-3 border ${cardBox}`}>
                <div className="flex items-center justify-between mb-2" style={fontSans}>
                  <span className={`text-[11.5px] font-bold ${textHead}`}>
                    1. 고난 해석 1페이지 표준 실습 기록지 (12문항)
                  </span>
                  <span className="text-[10.5px] font-mono text-[#7A2E26] dark:text-[#F87171] font-bold">
                    작성 완료: {['suf_fact','suf_emotion','suf_desire','suf_fear','suf_interpretation','suf_word','suf_character','suf_gospel','suf_repent','suf_thanks','suf_action','suf_community'].filter(id => (forms[id] || '').trim().length > 0).length} / 12 문항
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {[
                    { id: 'suf_fact', label: '01. 사실 (발생한 사건을 감정 없이 객관적으로 기록)' },
                    { id: 'suf_emotion', label: '02. 감정 (그때 느낀 나의 솔직하고 실존적인 감정)' },
                    { id: 'suf_desire', label: '03. 내 안의 우상 (내가 놓지 못하는 통제욕·인정욕)' },
                    { id: 'suf_fear', label: '04. 상실의 두려움 (이 일로 잃을까 봐 두려워하는 것)' },
                    { id: 'suf_interpretation', label: '05. 나의 기존 해석 (내가 임의로 붙였던 원망과 억측)' },
                    { id: 'suf_word', label: '06. 비추어 본 말씀 (이 사건에 빛을 비추는 성경 구절)' },
                    { id: 'suf_character', label: '07. 하나님의 성품 (말씀 속에서 확인한 주님의 신실하심)' },
                    { id: 'suf_gospel', label: '08. 십자가 복음 (정죄를 없애신 대속 은혜의 확증)' },
                    { id: 'suf_repent', label: '09. 나의 회개 제목 (남 탓을 멈추고 고백할 나의 죄)' },
                    { id: 'suf_thanks', label: '10. 사건 속의 감사 (고난을 약재로 바꾸신 하나님께 감사)' },
                    { id: 'suf_action', label: '11. 값을 치르는 순종 (오늘 즉시 실행할 한 가지 행동)' },
                    { id: 'suf_community', label: '12. 공동체 나눔 (소그룹 지체에게 요청할 중보기도)' }
                  ].map(f => (
                    <div key={f.id} className={`p-1.5 border ${subBox}`}>
                      <label className={`text-[11px] font-bold ${textHead} block mb-0.5`} style={fontSans}>{f.label}</label>
                      <textarea 
                        value={forms[f.id] || ''} 
                        onChange={e => handleForm(f.id, e.target.value)}
                        className={`w-full p-1.5 text-[11.5px] leading-relaxed resize-none h-14 outline-none ${inputStyle}`}
                        placeholder="말씀 앞에서 정직하게 기록하십시오..."
                        style={fontSerif}
                      />
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => syncToPipeline('apply', forms['suf_action'] || '고난 해석 11번 순종 결단 과제')}
                  className={`w-full mt-2 py-2 text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                    isDark ? 'bg-[#202630] text-[#E6EDF3] border-[#364052]' : 'bg-[#EDE8DC] text-[#1A202C] border-[#CBC1AD]'
                  }`}
                  style={fontSans}
                >
                  <IconTarget /> 위 11번 순종 결단을 적용 트래커 플래너로 즉시 전송
                </button>
              </div>

              {/* 다윗의 회개 4주 소그룹 강독 */}
              <div className={`p-3 border ${cardBox}`}>
                <span className={`text-[11.5px] font-bold block mb-2 ${textHead}`} style={fontSans}>
                  2. 심화 강독 모듈: "다윗의 참회와 회복 4주" 기록장 (사무엘하 12장)
                </span>
                <div className="space-y-1.5">
                  {[
                    { w: 1, title: '당신이 그 사람이라 (삼하 12:1-9)', q: '나에게 영적 직언을 해주는 말씀과 동역자가 있는가?', desc: '잠언 12:15을 묵상하며, 최근 내 자존심 때문에 흘려들었던 하나님의 경고와 권면을 기록하십시오.' },
                    { w: 2, title: '정죄는 없으나 징계는 있다 (삼하 12:10-17)', q: '십자가 사죄의 은총과 성화의 연단을 함께 붙들고 있는가?', desc: '죄 사함의 평안(정죄 없음)을 누리되, 내 삶의 열매를 다듬으시는 아버지의 훈육 앞에 순복할 태도를 적으십시오.' },
                    { w: 3, title: '회개할 때 주시는 회복 (삼하 12:18-23)', q: '원치 않는 상실 앞에서 원망하는가, 주권을 인정하는가?', desc: '내 뜻이 거절되었을 때 자리를 털고 일어나 다시 예배와 일상의 자리로 복귀할 결단을 적으십시오.' },
                    { w: 4, title: '여디디야, 하나님의 사랑 (삼하 12:24-32)', q: '참된 회개 후 누구의 아픔이 내 눈에 보이기 시작했는가?', desc: '자기 연민에서 벗어나 상처 입은 가족과 지체를 위로하고 살리는 이타적 섬김의 계획을 적으십시오.' }
                  ].map(wk => (
                    <div key={wk.w} className={`p-2.5 border ${subBox}`}>
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-0.5">
                        <strong className="text-[12px] text-[#7A2E26] dark:text-[#F87171]" style={fontSans}>MODULE {wk.w}. {wk.title}</strong>
                        <span className="text-[10.5px] font-bold text-slate-500" style={fontSans}>점검 질문: {wk.q}</span>
                      </div>
                      <p className={`text-[11px] ${textMuted} mb-1.5`} style={fontSerif}>{wk.desc}</p>
                      <textarea 
                        value={forms[`modA_${wk.w}`] || ''}
                        onChange={(e) => handleForm(`modA_${wk.w}`, e.target.value)}
                        className={`w-full p-1.5 text-[11.5px] leading-relaxed resize-none h-16 outline-none ${inputStyle}`}
                        placeholder="본문을 묵상하고 나의 고백과 구체적인 적용을 기록하십시오..."
                        style={fontSerif}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </section>

      </main>

      {/* ── 3. 설교 코퍼스 상세 요약 열람 & 양육 일지 연동 모달 ── */}
      {selectedSermonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs select-none">
          <div className={`w-full max-w-lg border p-4 sm:p-5 shadow-2xl flex flex-col gap-3 max-h-[85vh] overflow-y-auto ${cardBox}`}>
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-inherit" style={fontSans}>
              <div>
                <span className="text-[10px] font-mono font-bold text-[#7A2E26] dark:text-[#F87171] block">
                  {selectedSermonModal.date} • {selectedSermonModal.type}
                </span>
                <h3 className={`text-[16px] font-bold mt-0.5 ${textHead}`} style={fontSerif}>
                  {selectedSermonModal.title}
                </h3>
                <span className={`text-[11.5px] font-bold ${textMuted}`}>
                  📖 본문: {selectedSermonModal.verse}
                </span>
              </div>
              <button
                onClick={() => setSelectedSermonModal(null)}
                className={`px-2 py-1 text-[11px] font-bold border cursor-pointer ${subBox} ${textHead}`}
              >
                ✕ 닫기
              </button>
            </div>

            <div className={`p-3 border ${subBox} space-y-2`}>
              <span className="text-[10px] font-mono font-bold text-[#1B365D] dark:text-[#93C5FD] uppercase block" style={fontSans}>
                SERMON EXEGESIS & SUMMARY (강해 핵심 요약)
              </span>
              <p className={`text-[12.5px] leading-relaxed whitespace-pre-wrap break-keep ${textBody}`} style={fontSerif}>
                {selectedSermonModal.summary || `이 말씀(${selectedSermonModal.verse})은 [${selectedSermonModal.keywords}]의 구속사적 주제를 통해 성도가 말씀 앞에서 자신의 죄와 한계를 직면하고, 하나님의 주권적인 은혜를 붙들어 삶의 현장에서 구체적인 순종으로 나아가도록 인도합니다.`}
              </p>
              {selectedSermonModal.applyQuestion && (
                <div className="pt-2 border-t border-inherit">
                  <span className="text-[10.5px] font-bold text-[#7A2E26] dark:text-[#F87171] block mb-0.5" style={fontSans}>
                    💡 삶의 적용 질문
                  </span>
                  <p className={`text-[12px] font-bold ${textHead}`} style={fontSerif}>
                    {selectedSermonModal.applyQuestion}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1" style={fontSans}>
              <button
                onClick={() => {
                  const prevNote = gameNotes[selectedWeek] || '';
                  const snippet = `\n[연관 설교 묵상: ${selectedSermonModal.title} (${selectedSermonModal.verse})]\n• 핵심키워드: ${selectedSermonModal.keywords}\n• 나의 적용: `;
                  handleSaveGameNote(selectedWeek, (prevNote + snippet).trimStart());
                  setSelectedSermonModal(null);
                  setActiveTab('path');
                  alert(`${selectedWeek}주차 훈련 성찰 일지에 설교 묵상 틀이 삽입되었습니다!`);
                }}
                className={`flex-1 py-2 text-[11.5px] font-bold border cursor-pointer ${
                  isDark ? 'bg-[#7A2E26] text-white border-[#7A2E26]' : 'bg-[#1B365D] text-white border-[#1B365D]'
                }`}
              >
                ✍️ {selectedWeek}주차 훈련 일지로 가져오기
              </button>
              <button
                onClick={() => {
                  const targetV = selectedSermonModal.verse;
                  setSelectedSermonModal(null);
                  handleJumpToBibleVerse(targetV);
                }}
                className={`px-3 py-2 text-[11.5px] font-bold border cursor-pointer ${subBox} ${textHead}`}
              >
                📖 성경 본문 열기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. 정식 수료 인준서 모달 (Testimonium Disciplinae) ── */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-[#FFFDF8] border-4 border-[#7A2E26] p-6 text-center text-[#1A202C] shadow-2xl relative">
            <div className="border border-[#7A2E26]/40 p-5 space-y-3">
              <div className="text-[10px] font-mono tracking-[0.25em] text-[#7A2E26] font-bold uppercase">
                TESTIMONIUM FORMATIONIS THEOLOGICAE
              </div>
              <h1 className="text-[20px] font-bold text-[#1A202C] tracking-tight" style={fontSerif}>
                구속사 제자양육 12주 과정 수료 증서
              </h1>
              <div className="w-12 h-0.5 bg-[#7A2E26] mx-auto" />
              <p className="text-[12.5px] leading-[1.8] text-[#334155] break-keep font-normal" style={fontSerif}>
                귀하는 12주간의 제자양육 여정 동안 성경 말씀 앞에 정직히 자신을 세우고, 고난 속에서 하나님의 선하신 주권을 발견하며, 회개와 감사의 순종을 통해 영혼을 섬기는 제자의 도를 성실히 이수하였으므로 본 증서를 수여합니다.
              </p>
              <button 
                onClick={() => {
                  setShowCertificate(false);
                  localStorage.setItem('curriculum_cert_shown', 'true');
                }}
                className="w-full py-2 bg-[#7A2E26] hover:bg-[#682720] text-white text-[12px] font-bold cursor-pointer"
                style={fontSans}
              >
                평생 제자도 인준 확인 및 서약
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
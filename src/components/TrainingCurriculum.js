import React, { useState, useEffect } from 'react';

// =====================================================================
// 로컬 스토리지 헬퍼 (모든 입력 데이터 영구 저장 100% 유지)
// =====================================================================
const getLocal = (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const setLocal = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// =====================================================================
// 모던 라인 아이콘 세트 & 식물 진화 SVG
// =====================================================================
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>;
const IconMenu = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="3.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const IconSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconChart = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const IconTarget = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const IconSend = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;
const IconLock = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconStar = () => <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;

// 🌱 신앙의 씨앗 진화 단계 SVG
const SeedIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 22c5.523 0 10-4.477 10-10 0-4.5-4-9-10-10C6 3 2 7.5 2 12c0 5.523 4.477 10 10 10z"/></svg>;
const SproutIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 22V12"/><path d="M12 12C7 12 4 7 4 7c0 5 3 9 8 9z"/><path d="M12 12c5 0 8-5 8-5 0 5-3 9-8 9z"/></svg>;
const SaplingIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 22V8"/><path d="M12 14c-4 0-6-3-6-3 0 4 2 6 6 6z"/><path d="M12 10c4 0 6-3 6-3 0 4-2 6-6 6z"/><path d="M12 8c-2 0-3-2-3-2 0 2 1 4 3 4z"/><path d="M12 8c2 0 3-2 3-2 0 2-1 4-3 4z"/></svg>;
const TreeIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M17 5c0-2.8-2.2-5-5-5S7 2.2 7 5c0 1.3.5 2.5 1.4 3.4C6.1 9.6 4 11.8 4 14.5 4 17.5 6.5 20 9.5 20h5c3 0 5.5-2.5 5.5-5.5 0-2.7-2.1-4.9-4.4-6.1C16.5 7.5 17 6.3 17 5z"/><path d="M11 20h2v4h-2z" fill="#78716C"/></svg>;

// =====================================================================
// 79편 설교 코퍼스 데이터 (전수 100% 무손실 보존)
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

const VERBATIM_TEXT = {
  tab1: `[0. 이번 2판에서 새롭게 확인한 핵심]
1. 우리들교회의 현재 공식 T스쿨은 새가족 1주 → THINK 기초양육 6주 → THINK 양육 10주 → THINK 양육교사 10주 → 예비목자양육 20주라는 단계적 구조를 공개하고 있다.
2. THINK 양육은 단순 성경지식 전달 과정이 아니라 서로의 삶을 나누고 예수 그리스도를 본받는 훈련으로 공식 설명된다.
3. THINK 양육은 양육자 1명과 동반자 2~3명으로 구성되며 10주 동안 주제큐티·독후감·생활숙제·설교말씀 요약·매일큐티·세팅봉사를 수행한다.
4. 주제큐티에는 제목 → 본문요약 → 질문 → 질문 중심 묵상 → 적용 → 말씀으로 기도가 포함된다.
5. 생활숙제는 간증문, 시간관리, 성령의 능력으로 죄를 이기고 감정을 다스린 경험 등 실제 삶의 변화를 요구한다.
6. 설교과제는 단순 요약이 아니라 설교의 대지를 구분하고 가능한 한 설교내용을 옮긴 뒤 느낀점을 기록하도록 안내한다.
7. 큐티요약은 QTin을 활용하여 매일 큐티하고 느낀점을 기록하는 방식이다.
8. 세팅봉사는 훈련기간 중 예배 세팅·청소·분리수거 등에 자발적으로 참여하도록 구성되어 있다.
9. THINK 양육 수료자는 다시 10주 THINK 양육교사 심화과정으로 들어가 동반자를 섬기고 나눔을 인도하는 방법을 훈련받는다.
10. 이후 예비목자양육 I·II 총 20주를 통해 목장 리더를 세우는 구조가 공개되어 있다.
11. 2026년 상반기 THINK 양육교사 공지에서는 커리큘럼 개정이 있었고, 4·8·10과가 빠지고 새 3강의가 추가되었다고 공식 공지한다.
12. QTM의 2026년 THINK 양육 개정증보판은 10주 구조를 유지하면서 4과·8과·10과의 본문을 각각 사무엘하 7:18-29, 로마서 3:9-20, 로마서 9:1-13으로 변경했다고 공개한다.
13. 2026년 개정판의 목차는 신앙고백과 간증, 시간관리, 큐티, 기도, 하나님, 예수 그리스도, 성령님, 거듭남, 믿음, 영혼구원으로 구성된다.
14. QTM은 THINK의 목표를 구속사로 성경을 읽고 삶의 사건을 해석하며 “말씀대로 믿고 살고 누리는 그리스도인”으로 살아가도록 돕는 훈련이라고 설명한다.
15. 공식 자료는 “생각(think)을 바르게 하면 어떤 환경에서도 감사(thank)가 나오고, 큐티의 궁극적인 목적인 영혼 구원의 사명을 발견”한다고 설명한다.
이 15개 항목은 1판보다 훨씬 중요한 발견이다. 왜냐하면 우리들교회의 제자훈련을 단순히 “QT를 열심히 하는 프로그램”으로 이해하는 것이 아니라 단계적 형성 → 실제 과제 → 관계적 양육 → 양육자 재생산 → 목자 양성이라는 시스템으로 볼 수 있기 때문이다.

[1. 연구자료 등급]
A — 직접 확인된 공식자료: 우리들교회 공식 홈페이지, T스쿨, 공식 공지, QTM 홈페이지/교재 안내, 공식 유튜브
B — 공식기관이 안내한 외부자료: 공식 유튜브 링크, 공식 세미나/인터뷰 안내
C — 신학·교육학 연구자료: 웨스트민스터 신앙고백, 장로교 신학, 학술/전문문헌
D — 연구자가 재구성한 교육모델: 본 문서의 4주 모델, 평가표, 체크리스트, 프로토콜 등. (D항목을 공식 교재 내용이라고 표현하지 않는다.)

[2. 우리들교회 양육 시스템의 현재 공개 구조]
전체 로드맵: 새가족 양육 → THINK 기초양육 6주 → THINK 양육 10주 → THINK 양육교사 10주 → 예비목자양육 I 10주 → 목자 세움 → 예비목자양육 II 10주 → 목장 공동체 리더십. 새가족 양육 후 목장으로 인도되고, 목장예배는 목자 인도 아래 주 1회 열린다.

[3. 제자훈련의 핵심 원리]
원리 1 — 입문과 심화를 분리한다. 기초교리를 배우는 과정과 삶을 나누는 제자훈련을 구분한다.
기초양육: 하나님 → 예수 그리스도의 구속 → 믿음 → 예배 → 말씀묵상과 기도 → 성령의 공동체
THINK 양육: 신앙고백 → 시간 → 큐티 → 기도 → 하나님 → 예수 그리스도 → 성령 → 거듭남 → 믿음 → 영혼구원
교육적으로 매우 중요한 차이: “무엇을 믿는가?”를 배우는 단계와 “그 믿음으로 어떻게 사는가?”를 훈련하는 단계를 분리한다.

[4~14. THINK 양육 과제와 철학]
4. 실제 교육구조: 지식 → 말씀 → 삶의 나눔 → 자기 발견 → 회개 → 실제 적용 → 관계 변화 → 섬김 → 양육자 형성 → 재생산.
5. 주제큐티: Observation → Question → Reflection → Application → Prayer의 반복.
6. 설교과제: 무엇을 말씀하셨는가? → 깨달았는가? → 회개해야 하는가? → 해야 하는가?
7. 생활숙제: 강의 → 말씀 → 기록 → 생활실험 → 나눔 → 피드백 → 재적용이 핵심.
8. 세팅봉사: 제자는 섬김을 배우는 것뿐 아니라 실제로 섬겨 본다.
9. 양육교사 구조: 동반자 → 삶을 나누는 사람 → 양육자 → 나눔을 인도하는 사람 → 영적 리더.
10. 7가지 능력: 듣기, 질문, 본문 연결, 자기성찰 촉진, 적용, 돌봄, 재생산.
11. 양육교사와 상담자의 차이: 진단/치료/단정 금지. 안전한 목회교육 원칙.
12. 2026년 개정: 삼하7, 롬3, 롬9 본문 변경. 목차 유지.
13. 전체 신학적 이동: 최종 목적이 "지식을 아는 사람"이 아니라 "자신의 삶을 복음과 구속사 안에서 해석하고 사명을 발견하는 사람"으로 이동.
14. 감사와의 관계: 생각을 바르게 하면 어떤 환경에서도 감사가 나온다.

[46. 가장 중요한 발견]
우리들교회의 공개 양육은 “강의를 많이 듣는 시스템”이 아니다. 오히려 말씀을 배우고 → 자기 삶을 말하고 → 과제를 수행하고 → 실제 생활에서 적용하고 → 공동체에서 나누고 → 양육자로 성장하고 → 다시 다른 사람을 세우는 시스템에 가깝다.

[47. 본 가이드의 최종 철학]
제자훈련은 5개의 이동이다.
① 지식 → 확신 (무엇을 믿는가?)
② 확신 → 해석 (말씀으로 삶을 어떻게 보는가?)
③ 해석 → 순종 (오늘 무엇을 할 것인가?)
④ 순종 → 성품 (나는 어떤 사람으로 변하고 있는가?)
⑤ 성품 → 재생산 (다른 사람을 어떻게 세우는가?)

[48. 최종 제자도 평가]
수료자가 다음 질문에 “예”라고 대답할 수 있는지를 본다.
- 복음을 설명할 수 있다 / 자신의 신앙고백을 할 수 있다 / 성경을 문맥 속에서 읽는다 / QT를 지속한다 / 사건과 자기 해석을 구별한다 / 자신의 죄를 볼 수 있다 / 회개를 행동으로 연결한다 / 고난을 함부로 단정하지 않는다 / 감사가 결과가 아니라 하나님을 향하도록 훈련한다 / 공동체에 자신의 삶을 나눌 수 있다 / 다른 사람을 돌볼 수 있다 / 실제로 섬긴다 / 영혼구원의 사명을 이해한다 / 한 사람을 제자로 세울 수 있다 / 자신이 없어져도 제자화가 계속되도록 다른 사람을 세운다.

[49. 지도자 선언]
나는 성도에게 내 답을 주는 사람이 아니라 성도가 말씀 앞에서 하나님을 만나도록 돕는 사람이다. 나는 성도의 고난을 함부로 해석하지 않는다. 나는 성도의 죄를 이용하지 않는다. 나는 성도의 고백을 안전하게 다룬다. 나는 말씀을 삶에 연결한다. 나는 적용을 구체화한다. 나는 섬김을 직접 보여준다. 나는 제자를 나에게 묶어두지 않는다. 나는 그리스도께 연결한다. 그리고 그 사람이 또 다른 사람을 세우도록 돕는다.

[50~52. 참고자료 및 한계]
50. 공식 링크: 홈페이지, T스쿨, QTM, 2026 상반기 OT 공지 등.
51. 참고문헌: 웨스트민스터 신앙고백, 로버트 콜먼, 달라스 윌라드 등.
52. 한계: 2판은 김양재 목사 중심. 다음 단계에서 이성현 목사 코퍼스를 분석·통합하여 3판 커리큘럼을 만든다.

[53. 2판의 결론]
이 제자훈련의 목표는 좋은 교인 만들기가 아니다. 성경지식이 많은 사람 만들기도 아니다. 훈련과제를 잘 제출하는 사람 만들기도 아니다. 최종 목표는 다음이다.
"복음을 알고, 말씀으로 자신의 삶을 해석하며, 회개하고 감사하고 순종하며, 고난 속에서도 하나님을 붙들고, 공동체 안에서 사랑으로 섬기며, 자신이 받은 복음을 또 다른 사람에게 전하고, 결국 다른 제자를 세울 수 있는 그리스도의 사람을 만드는 것."
가장 중요한 질문: “이번 주 말씀 때문에 내 삶에서 실제로 무엇이 달라졌는가?”`,
  
  tab2: `[15. 감사의 5단계 훈련]
1단계 — 사실 감사: “오늘 실제로 받은 것은 무엇인가?”
2단계 — 은혜 감사: “이것이 왜 나에게 은혜인가?”
3단계 — 하나님 감사: “이 은혜를 주시는 하나님은 어떤 분인가?”
4단계 — 고난 속 감사: “원하는 결과가 없어도 붙들 수 있는 하나님의 성품은 무엇인가?”
5단계 — 순종의 감사: “감사한다면 이번 주 무엇을 순종할 것인가?”

[16. 고난 해석 프로토콜]
고난이 발생하면 성도는 다음 순서를 따른다.
STEP 1: 사실만 기록한다.
STEP 2: 감정을 기록한다.
STEP 3: 내 해석을 기록한다.
STEP 4: 내가 무엇을 잃었다고 생각하는지 찾는다.
STEP 5: 내가 무엇을 반드시 가져야 한다고 생각하는지 찾는다.
STEP 6: 그 욕망과 두려움을 말씀 앞에 놓는다.
STEP 7: 하나님의 성품을 확인한다.
STEP 8: 복음을 확인한다.
STEP 9: 회개할 부분과 회개하지 않아도 되는 부분을 구별한다.
STEP 10: 오늘 순종할 것을 하나만 정한다.
STEP 11: 공동체에 도움을 요청한다.
STEP 12: 시간을 두고 다시 해석 편집한다.

[17. 고난을 잘못 해석하지 않기 위한 8개 필터]
□ 이 사건의 원인을 내가 안다고 착각하고 있지 않은가?
□ 상대방의 죄를 내 해석으로 단정하고 있지 않은가?
□ 하나님을 벌 주는 분으로만 이해하고 있지 않은가?
□ 나의 통제욕이 숨어 있지 않은가?
□ 내 인정욕구가 숨어 있지 않은가?
□ 성경본문을 억지로 끼워 맞추고 있지 않은가?
□ 실제적인 도움을 거부하고 있지 않은가?
□ 하나님께 탄식할 권리를 스스로 막고 있지 않은가?

[18. QT를 ‘제대로’ 하는 교육모델]
우리들교회 공식 사이트는 QT 소개와 “QT는 이렇게”, “QT 제대로 하기”라는 별도 영역을 제공한다. 본 과정에서는 QT를 다음과 같이 훈련한다.
- 관찰: 본문에 실제로 있는 것은?
- 해석: 본문은 무엇을 의미하는가?
- 구속사: 이 본문은 성경 전체의 구원 역사와 어떻게 연결되는가?
- 자기성찰: 이 말씀 앞에서 나는 누구인가?
- 복음: 그리스도 안에서 나에게 주어진 은혜는 무엇인가?
- 적용: 오늘 무엇을 해야 하는가?
- 기도: 말씀대로 어떻게 기도할 것인가?
- 나눔: 공동체와 무엇을 나눌 것인가?

[25. 간증훈련의 기본 구조]
BEFORE: 나는 어떤 사람이었는가?
EVENT: 무슨 사건이 있었는가?
WORD: 말씀을 통해 무엇을 깨달았는가?
RESPONSE: 무엇을 회개하고 순종했는가?
AFTER: 무엇이 달라졌는가?
GOSPEL: 그 과정에서 복음이 무엇을 보여주었는가?
MISSION: 이 이야기가 누구를 살리고 세울 수 있는가?

[26. 간증에서 반드시 제거할 것]
- 자기 자랑
- 성공담만 강조
- 문제 해결만 강조
- 다른 사람 비난
- 특정인의 개인정보
- 검증되지 않은 영적 체험을 교리처럼 말하기
- “하나님이 반드시 이렇게 하신다”는 식의 단정

[27. 공동체의 고백을 안전하게 만드는 원칙]
원칙 1 강요하지 않는다. 원칙 2 말한 내용을 외부로 유출하지 않는다. 원칙 3 공동체 권력관계를 고려한다. 원칙 4 성도의 약점을 리더십 확보에 이용하지 않는다. 원칙 5 심각한 문제는 전문 도움으로 연결한다.

[36. 신학적 검증 체크리스트]
어떤 교육내용을 교재에 넣기 전에 다음을 확인한다.
□ 성경 본문이 실제로 그렇게 말하는가?
□ 본문 문맥에 맞는가?
□ 특정 구절을 지나치게 확대하지 않았는가?
□ 웨스트민스터 신앙고백과 충돌하지 않는가?
□ 장로교 신학과 양립 가능한가?
□ 특정 목회자의 개인적 해석을 교리화하지 않았는가?
□ 심리학적 개념을 성경의 진리와 동일시하지 않았는가?
□ 개인 경험을 하나님의 보편적 뜻으로 만들지 않았는가?

[37. 특히 주의해야 할 신학적 오류]
오류 A: “하나님이 이 사건을 주신 이유를 내가 안다.” → 근거가 없으면 단정하지 않는다.
오류 B: “고난이 있으니 반드시 숨은 죄가 있다.” → 욥기 전체를 무시하는 위험이 있다.
오류 C: “감사하면 하나님이 문제를 해결해 주신다.” → 감사를 거래로 만든다.
오류 D: “QT에서 떠오른 생각이 곧 하나님의 음성이다.” → 성경의 권위와 개인적 묵상을 혼동할 수 있다.
오류 E: “좋은 적용 = 본문 해석” → 적용은 본문 해석에서 나와야 한다.
오히려 훈련해야 할 질문은 “이 사건의 하나님의 뜻을 내가 함부로 단정하지 않고, 말씀 앞에서 오늘 내가 순종할 것은 무엇인가?”이다. 이것은 매우 중요한 신학적 안전장치이다.`,

  tab3: `[19. 4주 집중과정 — 2판 개정안]
WEEK 1 복음과 제자
- 핵심: 복음, 칭의, 성화, 제자, 신앙고백 / 실습: 나의 신앙고백, 나의 출애굽, 구원 간증 초안 / 과제: 복음 요약, QT 3회, 간증 1회
WEEK 2 말씀과 삶의 해석
- 핵심: 성경, QT, 구속사, 사건과 해석, 적용 / 실습: 주제큐티, 설교분석, 사건 해석표 / 과제: QT 5회, 설교 1편 분석, 생활적용 1개
WEEK 3 기도·감사·고난·회개
- 핵심: 말씀대로 기도, 감사, 고난, 회개, 성령의 역사 / 실습: 감사일지, 고난해석 보고서, 회개와 적용 / 과제: 7일 감사훈련, 고난사건 1개 재해석, 기도문 작성
WEEK 4 공동체·섬김·영혼구원·재생산
- 핵심: 교회, 공동체, 섬김, 영혼구원, 제자화 / 실습: 한 사람 돌봄, 실제 봉사, 제자화 계획 / 과제: 한 사람을 위한 30일 기도, 섬김 1회 이상, 90일 제자화 계획

[20. 10주 확장과정]
1주 신앙고백과 간증 — “하나님께서 나의 인생에서 어떻게 일하셨는가?”
2주 시간관리 — “나는 무엇을 중요하다고 말하면서 실제로는 무엇에 시간을 쓰는가?”
3주 큐티 — “나는 말씀을 읽는가, 말씀으로 삶을 해석하는가?”
4주 기도 — “나는 하나님께 무엇을 요구하는가?”
5주 하나님 — “나는 하나님을 어떤 분으로 믿고 있는가?”
6주 예수 그리스도 — “십자가가 나의 삶을 어떻게 바꾸는가?”
7주 성령님 — “갈등 속에서 성령을 따라 사는 것은 무엇인가?”
8주 거듭남 — “나는 정말 복음으로 변화된 사람인가?”
9주 믿음 — “믿음이란 내가 원하는 결과를 얻는 것인가?”
10주 영혼구원 — “내 인생의 목적은 무엇인가?”

[21. 양육교사 10주 확장과정]
1주 양육교사의 정체성 / 2주 경청 / 3주 좋은 질문 / 4주 본문과 삶 연결 / 5주 고백과 간증 다루기 / 6주 갈등과 감정 / 7주 적용을 돕는 법 / 8주 기도와 돌봄 / 9주 양육자의 자기관리 / 10주 제자 재생산과 리더십

[22. 양육교사 실제 모임 매뉴얼]
시작(5분 기도) → 말씀(10분 본문) → 나눔(30분 삶) → 질문(15분 연결) → 적용(10분 한가지) → 기도(10분 서로위해) → 기록(5분 다음약속). 총 85분.

[23. 양육교사의 질문은행]
사실 질문: “무슨 일이 있었나요?” / 감정 질문: “그때 어떤 마음이었나요?” / 욕망 질문: “그때 무엇을 원했나요?” / 두려움 질문: “무엇이 가장 두려웠나요?” / 신앙 질문: “그 상황에서 하나님을 어떻게 생각했나요?” / 말씀 질문: “이 상황을 비춰볼 수 있는 말씀이 있나요?” / 회개 질문: “내가 먼저 돌아봐야 할 부분은 무엇일까요?” / 감사 질문: “이 상황에서도 하나님께 감사할 수 있는 것은 무엇일까요?” / 적용 질문: “이번 주에 실제로 무엇을 하겠습니까?”

[24. 양육교사의 금지 질문]
“왜 그렇게 했어요?” “그건 믿음이 부족해서 그런 것 아닌가요?” “하나님이 벌 주신 것 같네요.” “제가 보기에는 답이 뻔한데요.” “그 사람을 용서해야죠.” “감사하면 다 해결됩니다.” (상대방의 자기성찰을 닫는 질문들)

[28. 예비목자 단계와 연결]
성도 → 훈련생 → 양육자 → 양육교사 → 예비리더 → 목자 → 다음 리더를 세우는 리더

[29. 4주 집중과정과 10주 양육, 10주 양육교사의 관계]
4주: 영적 기초 집중훈련. / 10주: 삶을 나누며 형성. / 양육교사 10주: 다른 사람의 성장을 돕는 능력 형성. / 예비목자 20주: 공동체 리더십과 재생산.

[30. 제자훈련의 최종 구조]
복음 → 말씀 → 삶의 해석 / QT → 회개 & 감사 → 순종 → 성화 → 공동체 → 섬김 → 영혼구원 → 제자화 → 재생산

[31. 30일 감사훈련 (매일)]
1. 오늘 있었던 사건 3개 / 2. 그 사건에 대한 나의 해석 / 3. 감정 / 4. 욕망 / 5. 말씀 / 6. 하나님에 대한 발견 / 7. 감사 / 8. 순종

[32. 30일 고난훈련]
1주차: 사실과 감정 구분 / 2주차: 나의 해석과 욕망 발견 / 3주차: 말씀과 복음으로 재해석 / 4주차: 실제 순종과 공동체 나눔

[33. 주간 체크리스트]
월화수목금토일 별로 점검: QT, 기도, 감사, 회개, 적용, 섬김, 관계회복, 복음/제자화

[34. 제자도 성숙도 평가]
Level 1 참석자: 교회에 출석한다.
Level 2 학습자: 말씀을 배운다.
Level 3 실천자: 말씀을 삶에 적용한다.
Level 4 나눔자: 자신의 삶을 공동체에 나눈다.
Level 5 양육자: 다른 사람의 성장을 돕는다.
Level 6 양육교사: 나눔을 인도한다.
Level 7 리더: 공동체를 섬긴다.
Level 8 재생산자: 다른 리더를 세운다.

[35. 지도자 평가 루브릭]
말씀: 1(지식없음) ~ 5(문맥/복음연결)
자기성찰: 1(타인탓) ~ 5(말씀앞에 자신부터)
적용: 1(추상적결심) ~ 5(구체적/측정가능 행동)
공동체: 1(자기얘기만) ~ 5(듣고돌보고세움)
재생산: 1(훈련만받음) ~ 5(다른사람을제자로)

[38. 대학/신대원 강의 구성]
강의 1. 한국교회의 제자훈련 모델 / 2. 제자도의 성경신학 / 3. 칭의와 성화 / 4. WCF와 제자도 / 5. QT와 성경해석 / 6. 삶의 해석과 목회적 적용 / 7. 고난과 섭리 / 8. 회개와 감사 / 9. 공동체와 영적 돌봄 / 10. 양육교사와 재생산

[39. 대학원 세미나 토론]
주제 1: 제자훈련은 교리교육인가 성품형성인가?
주제 2: QT의 개인적 적용은 어디까지 정당한가?
주제 3: 고난을 섭리로 해석하는 것과 원인을 단정하는 것은 어떻게 다른가?
주제 4: 간증과 자기노출은 언제 유익이 되고 언제 위험이 되는가?
주제 5: 양육교사는 목회자 연장선인가 평신도 리더인가?
주제 6: 제자훈련의 성공을 무엇으로 측정해야 하는가?

[40. 최종 프로젝트: 나의 90일 제자도 형성 프로젝트]
포함사항: 1. 나의 신앙 상태 2. 반복되는 죄 3. 반복되는 욕망 4. 감사가 어려운 영역 5. 고난의 영역 6. 말씀생활 7. 기도생활 8. 공동체 9. 섬김 10. 한 사람 제자화 11. 90일 행동계획 12. 90일 후 평가방법

[41. 90일 제자화 프로젝트]
1~30일: 나 자신을 말씀 앞에 세운다.
31~60일: 한 사람을 지속적으로 돌본다.
61~90일: 그 사람과 함께 말씀·기도·적용을 반복한다.
최종 질문: “이 사람은 나에게 의존하고 있는가? 아니면 이 사람도 또 다른 사람을 세울 수 있게 되었는가?” 후자가 재생산적 제자훈련이다.`,

  tab4: `[54. 3판 서문 — 이성현 목사 설교 코퍼스의 통합]
투입 자료: sermon_summary.json은 김포좋은나무교회의 설교 요약 아카이브로, 2026년 2월 1일부터 8월 23일까지 약 30주에 걸쳐 작성된 79편의 설교 요약을 담고 있다. STT 녹취를 성경 원문과 대조 검증한 후 정리한 자료다.
3판의 원칙: 공개된 공식자료에서 확인되는 사실을 먼저 제시하고, 그 사실을 신학·교육학적으로 재구성한 부분은 별도로 표시한다. 이성현 목사 개인의 신학적 특징을 코딩할 때는 반드시 그의 설교로 확인/추정되는 자료만 사용하며, 다른 협동목사의 설교는 별도로 표시하여 혼동을 방지한다.

[55. 연구자료 등급 확장 — E등급 신설]
E1 — 설교자 명시 확인 (45편): 본문 안에 이성현 목사 표기가 명시된 설교.
E2 — 이성현 목사 설교로 추정 (21편): 연속 강해 흐름, 통상 담임목사 인도 예배(주일/기상오기) 등에 근거하여 합리적으로 추정되는 설교.
E3 — 김포좋은나무교회 협동목사단 설교 (13편, 참고자료): 방희곤 목사(7편), 최수경 목사(4편), 임효식 목사(2편). 이성현 개인 신학 코딩 제외, 통계는 포함.

[56. 이성현 목사 설교 코퍼스 개관]
기본 통계: 전체 79편. 이성현 목사 코퍼스(E1+E2) 66편.
예배 유형별 분포: 주일예배 28편, 기상오기(특새) 23편, 금요예배 11편, 수요예배 4편. 주일예배와 기상오기는 담임목사가 전담하고, 수요예배는 협동목사단이 다수를 담당하는 뚜렷한 구조.
"기상오기": 기적이 상식이 되는 5일간의 기도. 매월 1회 5일 연속. 주일/수요 강해 시리즈와 동일한 본문을 이어받아 5일간 압축 심화. "완만한 주간 강해 + 월례 집중 새벽기도" 이중 트랙.
성경 책별 분포: 마가복음(16편) → 에스라(8편) → 사무엘하(27편) → 신명기(7편)로 이어지는 연속 강해설교(lectio continua) 흐름.

[57. 설교별 신학 코딩 — 대표 표본 7편 심층분석]
2.1 마25(복 받을 자로 살아가라): 공동체, 생색 없는 섬김, 종말론적 심판.
4.26 요1(영접하는 자): 전도, 변증(파스칼), 간증.
5.17 스10(죄를 드러낼 때): 공동체적 회개, 다윗-사울 대조.
6.9 삼하12(당신이 그 사람이에요): 죄의 자기기만, 권면, 공동체적 직언.
6.10 삼하12(정죄는 없으나 징계는 있다): 원죄/형사죄 구분, 칭의와 성화의 균형.
6.11 삼하12(회복의 은혜): 회개의 열매(이타주의), 고난 중 소망.
8.2/8.9 마28/신4: 창조-대위임령 서사 연결, 우상론, 말씀훈련.

[58. 코퍼스 전체 키워드·주제 분포 분석 (원거리 읽기)]
어휘 빈도표 최상위: 말씀(1,209), 죄(811), 기도(499), 믿음(351), 은혜(274), 공동체(272).
해석: 최상위 어휘는 이 사역이 본문 강해와 기도를 두 축으로 삼음을 확인. "죄"의 압도적 빈도는 사무엘하 다윗 서사 강해의 정직한 결과. "목장" 어휘 공존은 한국 교회 소그룹 언어 공유. "간증" 비중은 신앙 전달의 정규 통로화.

[59. 반복 주제 분석 — 이성현 목사 설교의 신학적 특징]
특징 1. 죄의 이중구조: 원죄(본질죄)와 형사죄(현상죄)의 구분.
특징 2. 정죄와 징계의 신학적 분리.
특징 3. 회개의 열매로서의 이타주의 전환.
특징 4. 주권의식과 주인의식의 균형.
특징 5. 공동체에 "붙어 있음"의 신학과 직언의 통로 (나단).
특징 6. 다윗-사울 대조를 반복 사용하는 회개 예화 체계.
특징 7. 정경적 서사 연결을 통한 강해 설계.
특징 8. 체험적 예화와 시의적 간증의 결합.
특징 9. 말씀암송·새벽기도(기상오기) 중심의 영성 훈련 인프라.
종합: "죄를 신학적으로 정밀하게 구분하면서도, 그 구분을 공동체적 관계의 언어와 체험적 예화로 번역하여, 매달 반복되는 집중 기도 훈련을 통해 성도의 삶에 정착시키는 강해설교 목회다."

[60. 김양재 목사(우리들교회)와 이성현 목사(김포좋은나무교회) 비교 연구]
공통분모: 1. 말씀 중심성 2. 목장 중심성 3. 회개를 관계적 전환으로 이해 4. 다윗 내러티브(삼하12장)의 표준 교재화 5. 간증의 정규 통로화.
차이점(우리들 vs 김포):
- 교육공학: 절차화된 프로토콜(5단계/12단계) vs 정경적 서사 연결(연속강해)
- 리듬: 10주 기수제 vs 월례 5일 집중(기상오기)
- 언어: 실존적 언어 vs 조직신학적 언어(원죄/정죄/징계)
- 재생산 체계: 명문화된 4단계(양육자~목자) vs 담임목사/협동목사 강단 분업

[61. 웨스트민스터 신앙고백/장로교 신학과의 대조]
체크리스트 적용 결과: 이성현 목사의 죄론(원죄/형사죄)과 구원론(정죄 없음/징계 있음)은 WCF 6장, 11장, 13장의 구도와 완벽히 정합적이며, 37장의 5개 오류를 피하고 있다. 단, 영아 구원 논제(삼하 12:23)는 목회적 절제를 보였으나 신학적 논쟁 주제로 신중히 다뤄야 한다.

[62~64. 통합 교육원리 재구성]
제자훈련이란, 본문(말씀)에서 출발하여 한 한 사람의 죄와 회개를 정직하게 직면하게 하고(정죄 없이, 그러나 징계는 있음을 알게 하며), 그 직면이 반드시 공동체(목장) 안에서 나눔·직언·기도로 이어지게 하고, 그 나눔이 이타적 섬김의 습관으로 굳어지게 하여, 마침내 그 사람이 또 다른 사람에게 같은 과정을 시작해 줄 수 있는 사람이 되게 하는 것이다.

[68. 3판 결론 및 다음 단계]
무엇이 완료되었는가: 코퍼스 확보 → 신학 코딩 → 반복 주제 분석 → 비교 연구 → WCF 대조 → 공통분모/차이점 → 원리 재구성 → 커리큘럼 완료.
3판의 한계: 66편 완전 개별 코딩 미실시, E3 독립 연구 미실시, 김포 공식 양육 커리큘럼 자료 미확보(설교 요약만 존재).
결론: 서로 다른 교단적 배경과 설교 전통을 가진 두 교회가 각각의 강단에서 독립적으로 확인한 것은 결국 하나였다 — 말씀(본문)에서 출발하여 죄를 정직하게 직면하게 하고, 공동체 안에서 그 직면을 나누게 하며, 오직 그리스도의 은혜로 정죄함이 없다는 확신 위에서 순종의 열매를 맺게 하는 것.`,

  tab5: `[65. 3판 커리큘럼 — 부교재 모듈]
65.1 부교재 모듈 A — "다윗의 회개 4주" (사무엘하 12장 기반)
이성현 목사의 기상오기 6월 시리즈(삼하 12장 4편)를 4주형 소그룹 모임으로 재구성.
WEEK 1 — 당신이 그 사람이에요 (삼하 12:1-9)
핵심 질문: "나에게 '당신이 그 사람이다'라고 말해 주는 사람이 있는가? 나는 그 말을 들을 준비가 되어 있는가?"
WEEK 2 — 정죄는 없으나 징계는 있다 (삼하 12:10-17)
핵심 질문: "나는 용서받았다는 사실과, 그럼에도 결과가 따른다는 사실을 동시에 붙들고 있는가?"
WEEK 3 — 회복의 은혜 (삼하 12:18-23)
핵심 질문: "돌이킬 수 없는 상실 앞에서, 나는 원망을 반복하고 있는가, 하나님의 주권을 인정하고 있는가?"
WEEK 4 — 하나님의 사랑 (삼하 12:24-32)
핵심 질문: "회개 이후 나의 삶에서 누구의 아픔이 새롭게 보이기 시작했는가?"

65.2 대학 강의 11 신설
"연속 강해설교와 큐티 중심 목회의 비교 — 김포좋은나무교회 이성현 목사 설교를 중심으로"

65.3 대학원 세미나 토론 주제 7 신설
"같은 다윗-나단 본문(삼하 12장)을 두 목회자가 각각 어떻게 다루는가 — 사건 중심 해석과 조직신학적 구분 중심 해석의 교육적 효과 차이는 무엇인가?"

65.4 이성현 목사 필수 설교 10선 (연구자 제안)
1. 복 받을 자로 살아가라 (마 25) / 2. 감추인 천국 (마 4) / 3. 영접하는 자 (요 1) / 4. 죄를 드러낼 때 (스 10) / 5. 당신이 그 사람이에요 (삼하 12) / 6. 정죄는 없으나 징계는 있다 (삼하 12) / 7. 회복의 은혜 (삼하 12) / 8. 바르실래처럼 (삼하 19) / 9. 제자삼는 사명 (마 28) / 10. 언약을 잊지 않으려면 (신 4).

65.5 기상오기형 집중훈련 응용 제안
[제안] THINK 양육 10주(매주 1회) + 월중 1회 "집중 QT의 날"(5일 연속 매일QT 몰아하기, 기상오기 방식 응용)

[66. 부록 5 — 이성현 목사 설교 코퍼스 인덱스]
sermon_summary.json 79편 전체를 날짜순 정렬한 인덱스 (날짜, 등급, 예배, 본문, 제목 전수 수록됨).

[67. 부록 6 — 설교 신학 코딩 표 (부록 4 양식)]
대표 7편의 하나님론, 죄론, 회개론, 반복주제 코딩 테이블 (57장의 표본 심층분석을 부록 4 양식에 맞추어 압축).

[부록 1] 10주 과제표: 주차, 주제, 주제QT, 독서, 생활숙제, 설교, 매일QT, 섬김 체크.
[부록 2] 고난 해석 1페이지 양식: 사건, 사실, 감정, 원하는것, 두려워하는것, 나의 해석, 말씀, 성품, 복음, 회개, 감사, 오늘 순종, 공동체 도움.
[부록 3] 양육교사 모임 기록: 양육자, 동반자, 날짜, 본문, 나눈 핵심, 들은 것, 질문한 것, 말씀 연결, 적용, 기도제목, 다음 만남.
[부록 4] 연구자용 설교 코딩 템플릿: 설교자, 날짜, 본문, 제목, 12대 조직신학 항목, 반복주제, 명시적주장 등.`
};

// 🌟 12주 순례자의 길 게이미피케이션 커리큘럼 데이터
const GAMIFIED_PATH_DATA = [
  { w: 1, title: '나는 왜 감사하지 못하는가?', desc: '감사에 대한 오해, 불평의 구조 파악' },
  { w: 2, title: '말씀 앞에 나를 세우기', desc: 'QT 구조 이해 (관찰-묵상-적용-기도)' },
  { w: 3, title: '사건과 해석을 분리하기', desc: '사건 ≠ 내가 붙인 의미' },
  { w: 4, title: '감사의 근원을 찾기', desc: '환경, 사람 탓을 넘어 "하나님 때문에" 하는 감사' },
  { w: 5, title: '고난은 무엇인가?', desc: '내 인생 고난 지도를 그리고 축복의 약재로 보기' },
  { w: 6, title: '고난을 잘못 해석하고 있지는 않은가?', desc: '저주받았다 등 잘못된 해석 부수기' },
  { w: 7, title: '고난 속에서 나를 발견하기', desc: '내게 보게 하시는 나의 모습 찾기' },
  { w: 8, title: '회개와 적용', desc: '단순 후회가 아닌 구체적 수고 동반' },
  { w: 9, title: '고난을 공동체에서 나누기', desc: '어디까지 말해야 하는가, 자기 의를 내려놓는 법' },
  { w: 10, title: '고난에서 말씀을 발견하다', desc: '성경 인물(요셉, 다윗, 욥, 바울) 연구' },
  { w: 11, title: '내 고난을 간증으로 바꾸기', desc: '내가 얼마나 힘들었는가가 아니라 "하나님이 무엇을 하셨는가"' },
  { w: 12, title: '감사하는 제자로 살아가기', desc: '묵상→자기발견→회개→순종→공동체 간증 패턴화' }
];

// =====================================================================
// 글래스 UI 전용 컴포넌트
// =====================================================================
const SectionHeader = ({ num, title, ui }) => (
  <h2 className={`text-[18px] md:text-[20px] font-black ${ui.textMain} mt-10 mb-4 pb-3 border-b-2 border-black/10 dark:border-white/10 break-keep leading-[1.4]`}>
    <span className={ui.primary}>{num}.</span> {title}
  </h2>
);

const TextBlock = ({ children, ui }) => (
  <p className={`text-[14px] md:text-[15px] font-medium leading-[1.8] ${ui.textSub} mb-5 break-keep whitespace-pre-wrap`}>
    {children}
  </p>
);

const InteractiveCheckbox = ({ id, label, isError = false, ui, checked, onToggle }) => (
  <label 
    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(id); }}
    className={`flex items-start gap-3 py-3.5 px-4 cursor-pointer rounded-2xl w-full border transition-colors shadow-sm ${checked ? (isError ? 'bg-rose-500/10 border-rose-500/30' : 'bg-sky-500/10 border-sky-500/30') : `bg-black/5 dark:bg-white/5 border-transparent`}`}
  >
    <div className={`mt-0.5 w-[20px] h-[20px] border-2 flex items-center justify-center shrink-0 rounded-md transition-all ${checked ? (isError ? 'bg-rose-500 border-rose-500 text-white' : 'bg-sky-500 border-sky-500 text-white') : `bg-transparent ${ui.border}`}`}>
      {checked && <IconCheck />}
    </div>
    <span className={`text-[14.5px] leading-[1.6] select-none flex-1 break-keep ${checked ? (isError ? 'text-rose-500 font-bold' : `${ui.textSub} font-medium line-through`) : `${ui.textMain} font-bold`}`}>
      {label}
    </span>
  </label>
);

// =====================================================================
// 메인 컴포넌트
// =====================================================================
export default function TrainingCurriculum({ t, isDarkMode, setActiveScreen, isSidebarOpen, setIsSidebarOpen }) {
  // 🌟 첫 번째 기본 활성 탭을 '게이미피케이션 로드맵(path)'으로 설정
  const [activeTab, setActiveTab] = useState('path');
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [checks, setChecks] = useState(() => getLocal('tc_final_checks', {}));
  const [forms, setForms] = useState(() => getLocal('tc_final_forms', {}));
  const [weeklyCheck, setWeeklyCheck] = useState(() => getLocal('tc_final_weekly', {}));
  const [rubrics, setRubrics] = useState(() => getLocal('tc_final_rubrics', { word:3, reflect:3, apply:3, community:3, reproduce:3 }));

  // 🌟 게이미피케이션 상태 관리
  const [completedWeeks, setCompletedWeeks] = useState([]);
  const [gameNotes, setGameNotes] = useState(() => getLocal('diary_curriculum_notes', {}));
  const [activeGameModal, setActiveGameModal] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const completed = [];
    for (let i = 1; i <= 12; i++) {
      if (gameNotes[i] && gameNotes[i].trim().length > 10) {
        completed.push(i);
      }
    }
    setCompletedWeeks(completed);
  }, [gameNotes]);

  useEffect(() => setLocal('tc_final_checks', checks), [checks]);
  useEffect(() => setLocal('tc_final_forms', forms), [forms]);
  useEffect(() => setLocal('tc_final_weekly', weeklyCheck), [weeklyCheck]);
  useEffect(() => setLocal('tc_final_rubrics', rubrics), [rubrics]);

  if (!isMounted) return null;

  const toggleCheck = (key) => setChecks(p => ({ ...p, [key]: !p[key] }));
  const toggleWeekly = (key) => setWeeklyCheck(p => ({ ...p, [key]: !p[key] }));
  const handleForm = (key, val) => setForms(p => ({ ...p, [key]: val }));
  const handleRubric = (key, val) => setRubrics(p => ({ ...p, [key]: parseInt(val) }));

  // 게이미피케이션 일지 저장 함수
  const handleSaveGameNote = (week, content) => {
    const nextNotes = { ...gameNotes, [week]: content };
    setGameNotes(nextNotes);
    setLocal('diary_curriculum_notes', nextNotes);

    if (content.trim().length > 10) {
      if (!completedWeeks.includes(week)) {
        const nextCompleted = [...completedWeeks, week];
        setCompletedWeeks(nextCompleted);
        if (week === 12 && localStorage.getItem('curriculum_cert_shown') !== 'true') {
          setTimeout(() => setShowCertificate(true), 600);
        }
      }
    } else {
      setCompletedWeeks(completedWeeks.filter(w => w !== week));
    }
  };

  const getPlantIcon = (week, isCompleted) => {
    if (!isCompleted) return <IconLock />;
    if (week <= 3) return <SeedIcon />;
    if (week <= 6) return <SproutIcon />;
    if (week <= 9) return <SaplingIcon />;
    return <TreeIcon />;
  };

  const getPlantColor = (week, isCompleted, isActive) => {
    if (!isCompleted && !isActive) return isDark ? 'bg-zinc-800 text-zinc-500 border-zinc-700' : 'bg-zinc-100 text-zinc-400 border-zinc-300';
    if (isActive) return isDark ? 'bg-sky-600 text-white border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.5)] animate-pulse' : 'bg-sky-500 text-white border-sky-300 shadow-[0_0_20px_rgba(14,165,233,0.5)] animate-pulse';
    
    if (week <= 3) return 'bg-[#8B5A2B] text-white border-[#A0522D]';
    if (week <= 6) return 'bg-[#84CC16] text-white border-[#65A30D]';
    if (week <= 9) return 'bg-[#10B981] text-white border-[#059669]';
    return 'bg-[#0EA5E9] text-white border-[#0284C7]';
  };

  const isDark = t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode;
  const ui = {
    bgBody: isDark ? 'bg-[#0F1115]' : 'bg-[#F8F9FA]',
    textMain: isDark ? 'text-white' : 'text-slate-900',
    textSub: isDark ? 'text-slate-400' : 'text-slate-600',
    border: isDark ? 'border-white/10' : 'border-white/60',
    inputBg: isDark ? 'bg-black/40 border-white/10 text-white focus:border-sky-400 placeholder:text-slate-600' : 'bg-white/50 border-white/60 text-slate-900 focus:border-sky-500 placeholder:text-slate-500',
    primary: isDark ? 'text-sky-400' : 'text-sky-600',
    btnPrimary: isDark ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30' : 'bg-sky-500/10 text-sky-700 hover:bg-sky-500/20 border border-sky-400/30'
  };

  const syncToPipeline = (type, payload) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (type === 'prayer') {
        if(!payload || !payload.trim()) return alert('작성된 내용이 없습니다.');
        const saved = JSON.parse(localStorage.getItem('globalPrayers') || '[]');
        saved.push({ id: Date.now(), text: payload.trim(), status: 'praying' });
        localStorage.setItem('globalPrayers', JSON.stringify(saved));
        alert('기도 보관함으로 등록되었습니다!');
      } 
      else if (type === 'apply') {
        if(!payload || !payload.trim()) return alert('작성된 내용이 없습니다.');
        const saved = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
        saved.push({ id: `tc_${Date.now()}`, date: today, source: 'tc', text: payload.trim(), completed: false });
        localStorage.setItem('apply_tracker_items', JSON.stringify(saved));
        alert('적용 트래커에 행동 과제로 등록되었습니다!');
      }
      else if (type === 'weekly_checks') {
        const dailyData = JSON.parse(localStorage.getItem('qt_daily') || '{}');
        if(!dailyData[today]) dailyData[today] = { checks: {} };
        const dChecks = dailyData[today].checks || {};
        
        const dayMap = { 0:'Sun', 1:'Mon', 2:'Tue', 3:'Wed', 4:'Thu', 5:'Fri', 6:'Sat' };
        const todayStr = dayMap[new Date().getDay()];

        if (weeklyCheck[`w_QT_${todayStr}`]) dChecks['QTin'] = true;
        if (weeklyCheck[`w_기도_${todayStr}`]) dChecks['기도하기'] = true;
        if (weeklyCheck[`w_감사_${todayStr}`]) dChecks['감사'] = true;

        dailyData[today].checks = dChecks;
        localStorage.setItem('qt_daily', JSON.stringify(dailyData));
        alert('체크한 내역이 오늘의 영적 5종 세트 루틴과 동기화되었습니다!');
      }
    } catch(e) { alert('연동 중 오류가 발생했습니다.'); }
  };

  // 🌟 게이미피케이션 로드맵 탭이 1순위로 통합된 6대 탭 메뉴
  const tabs = [
    { id: 'path', label: '🌟 0. 순례자의 길 (성장 로드맵)' },
    { id: 'overview', label: 'Ⅰ. 제자훈련 개관' },
    { id: 'protocols', label: 'Ⅱ. 해석 프로토콜' },
    { id: 'curriculum', label: 'Ⅲ. 주차별 양육 실천' },
    { id: 'gimpo', label: 'Ⅳ. 코퍼스 심층분석' },
    { id: 'appendix', label: 'Ⅴ. 종합 실전 양식' }
  ];

  return (
    <div className={`flex-1 flex flex-col h-full relative overflow-hidden font-sans select-none animate-fade-in ${ui.bgBody} w-full min-w-0 max-w-full`}>
      
      {/* 라이트모드/다크모드 리퀴드 오로라 배경 */}
      <div className={`absolute inset-0 z-0 pointer-events-none overflow-hidden ${isDark ? 'opacity-30 mix-blend-lighten' : 'opacity-80'}`}>
        <div className="absolute -top-[5%] -left-[10%] w-[70vw] h-[70vw] rounded-full animate-pulse" style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, transparent 70%)', filter: 'blur(90px)' }} />
        <div className="absolute top-[30%] -right-[20%] w-[80vw] h-[80vw] rounded-full animate-pulse" style={{ background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)', filter: 'blur(100px)', animationDelay: '1s' }} />
        <div className="absolute -bottom-[10%] left-[10%] w-[75vw] h-[75vw] rounded-full animate-pulse" style={{ background: 'radial-gradient(circle, rgba(244, 114, 182, 0.25) 0%, transparent 70%)', filter: 'blur(100px)', animationDelay: '2s' }} />
      </div>

      {/* 상단 헤더 */}
      <div className={`px-4 sm:px-6 py-3.5 flex items-center justify-between border-b z-20 backdrop-blur-2xl shrink-0 w-full min-w-0 ${isDark ? 'border-white/10 bg-[#0F1115]/60' : 'border-white/60 bg-white/40'}`}>
        <div className="flex items-center gap-3">
           <button onPointerDown={(e) => { e.preventDefault(); setActiveScreen('home'); }} className={`p-1.5 -ml-1.5 rounded-full transition-colors ${ui.textMain} hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer`}><IconArrowLeft /></button>
           <div className="flex flex-col">
              <h1 className={`text-[16px] font-black tracking-tight ${ui.textMain}`}>영적 양육 커리큘럼</h1>
              <p className={`text-[10.5px] font-bold ${ui.primary} mt-0.5 tracking-widest uppercase`}>실천신학형 제자훈련 가이드</p>
           </div>
        </div>
        <button onPointerDown={(e) => { e.preventDefault(); setIsSidebarOpen(!isSidebarOpen); }} className={`p-1.5 rounded-full transition-colors ${ui.textMain} hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer`}><IconMenu /></button>
      </div>

      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden w-full relative z-10 min-w-0 max-w-full">
        
        {/* 네비게이션 탭 (모바일 플랫 가로 스크롤 & PC 사이드 탭) */}
        <div className={`xl:w-[290px] shrink-0 flex xl:flex-col overflow-x-auto hide-scrollbar border-b xl:border-b-0 xl:border-r backdrop-blur-xl touch-pan-x w-full min-w-0 ${isDark ? 'border-white/10 bg-[#1C1C1E]/40' : 'border-white/60 bg-white/30'}`}>
          <div className="flex xl:flex-col w-full min-w-0">
            {tabs.map(tab => (
              <button 
                key={tab.id} 
                onPointerDown={(e) => { e.preventDefault(); setActiveTab(tab.id); }}
                className={`text-left px-5 py-3.5 text-[13px] font-black border-b-[3px] xl:border-b-0 xl:border-l-[4px] transition-all shrink-0 cursor-pointer shadow-sm whitespace-nowrap
                  ${activeTab === tab.id ? `border-sky-500 text-sky-500 bg-white/60 dark:bg-white/5` : `border-transparent ${ui.textSub} hover:bg-black/5 dark:hover:bg-white/5`}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="px-5 py-6 bg-transparent hidden xl:block">
            <button 
              onPointerDown={(e) => { e.preventDefault(); setActiveScreen('trainingSubPages'); }}
              className="w-full p-4 rounded-2xl border border-sky-400 bg-gradient-to-r from-sky-500 to-blue-500 text-white font-black text-[14.5px] text-center shadow-lg hover:opacity-90 transition-opacity"
            >
              📖 4주 심화 워크북 기록장 열기
            </button>
          </div>
        </div>

        <div className="px-4 py-3 bg-transparent xl:hidden shrink-0 w-full min-w-0">
          <button 
            onPointerDown={(e) => { e.preventDefault(); setActiveScreen('trainingSubPages'); }}
            className={`w-full p-3.5 rounded-xl border font-black text-[13.5px] text-center shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-transform ${isDark ? 'border-sky-500 bg-sky-500/20 text-sky-400' : 'border-sky-400 bg-white/60 text-sky-700'}`}
          >
            <IconBook /> 4주 심화 워크북으로 실전 기록하기
          </button>
        </div>

        {/* 메인 콘텐츠 뷰어 영역 */}
        <div className="flex-1 overflow-y-auto hide-scrollbar w-full bg-transparent px-3 sm:px-6 xl:px-10 py-5 sm:py-8 pb-32 min-w-0">
          <div className={`w-full max-w-[900px] mx-auto p-4 sm:p-8 rounded-[24px] border shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-3xl min-w-0 ${isDark ? 'bg-[#1C1C1E]/50 border-white/10' : 'bg-white/40 border-white/60'}`}>

            {/* 🌟 TAB 0: 순례자의 길 게이미피케이션 (듀오링고 스타일 로드맵) */}
            {activeTab === 'path' && (
              <div className="animate-fade-in w-full min-w-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 mb-8 border-black/10 dark:border-white/10 gap-3">
                  <div>
                    <h2 className={`text-[19px] font-black ${ui.textMain} tracking-tight`}>
                      순례자의 길 <span className={ui.primary}>(Pilgrim's Journey)</span>
                    </h2>
                    <p className={`text-[12.5px] font-medium ${ui.textSub} mt-1`}>
                      12주간 묵상 일지를 작성하며 신앙의 씨앗을 아름다운 거목으로 키워보세요.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-600 dark:text-sky-400 font-mono font-bold text-[13px]">
                    진도율: {completedWeeks.length} / 12 ({Math.round((completedWeeks.length / 12) * 100)}%)
                  </div>
                </div>

                {/* 굽이치는 맵 레이아웃 */}
                <div className="py-6 px-2 flex flex-col items-center relative">
                  
                  {/* 중앙 경로선 */}
                  <div className={`absolute top-10 bottom-20 w-[3px] left-1/2 -translate-x-1/2 z-0 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                  <div 
                    className="absolute top-10 w-[3px] left-1/2 -translate-x-1/2 z-0 rounded-full bg-sky-500 transition-all duration-1000 ease-out" 
                    style={{ height: `calc(${Math.min(11, completedWeeks.length)} * 110px)` }} 
                  />

                  {GAMIFIED_PATH_DATA.map((item, index) => {
                    const isCompleted = completedWeeks.includes(item.w);
                    const isUnlocked = item.w === 1 || completedWeeks.includes(item.w - 1);
                    const isActive = isUnlocked && !isCompleted;
                    // 🌟 모바일에서는 좌우 진폭을 줄여 화면 뚫림 방지 (-translate-x-6 sm:-translate-x-12)
                    const xOffset = index % 2 === 0 ? '-translate-x-6 sm:-translate-x-10' : 'translate-x-6 sm:translate-x-10';

                    return (
                      <div key={item.w} className="relative z-10 w-full flex flex-col items-center justify-center h-[105px]">
                        <div className={`relative flex items-center justify-center transition-all duration-300 ${xOffset} ${isActive ? 'scale-105' : 'hover:scale-105'}`}>
                          
                          {/* 🌟 모바일 반응형 말풍선: 너비 제한(max-w-[130px] sm:w-[180px])과 글자 줄임 처리 */}
                          {(isActive || isCompleted) && (
                            <div className={`absolute ${index % 2 === 0 ? 'left-[64px] sm:left-[74px] text-left' : 'right-[64px] sm:right-[74px] text-right'} top-1/2 -translate-y-1/2 w-[130px] sm:w-[180px] pointer-events-none transition-opacity z-20`}>
                              <div className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-sm border backdrop-blur-md ${isDark ? 'bg-[#18181B]/95 border-white/10' : 'bg-white/95 border-slate-200'}`}>
                                <span className={`block text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isActive ? 'text-sky-500' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>Week {item.w}</span>
                                <h4 className={`text-[11px] sm:text-[12.5px] font-black leading-snug truncate ${ui.textMain}`}>{item.title}</h4>
                              </div>
                            </div>
                          )}

                          {/* 노드 버튼 (모바일 52px / PC 60px) */}
                          <button
                            type="button"
                            onClick={() => {
                              if (isUnlocked) setActiveGameModal(item);
                              else alert('이전 주차의 훈련 일지를 10자 이상 작성해야 해금됩니다.');
                            }}
                            className={`w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] rounded-full border-[3px] flex items-center justify-center transition-all cursor-pointer z-10 ${getPlantColor(item.w, isCompleted, isActive)}`}
                          >
                            {getPlantIcon(item.w, isCompleted)}
                          </button>

                          {/* 완료 체크 뱃지 */}
                          {isCompleted && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border-2 border-emerald-500 text-emerald-500 flex items-center justify-center z-20 shadow-xs">
                              <IconCheck />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* 완주 지점 골인점 */}
                  <div className="relative z-10 w-full flex flex-col items-center justify-center h-[140px] mt-4">
                    <div 
                      onClick={() => { if(completedWeeks.length === 12) setShowCertificate(true); }}
                      className={`w-20 h-20 rounded-full border-4 flex items-center justify-center shadow-2xl transition-all duration-1000 cursor-pointer ${completedWeeks.length === 12 ? 'bg-gradient-to-br from-amber-300 to-amber-500 border-amber-200 text-white animate-bounce' : (isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-600' : 'bg-zinc-100 border-zinc-200 text-zinc-400')}`}
                    >
                      <IconStar />
                    </div>
                    <span className={`mt-3 text-[12.5px] font-bold tracking-widest uppercase ${completedWeeks.length === 12 ? 'text-amber-500 font-black' : ui.textSub}`}>
                      Glorious Finish
                    </span>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 1: 철학과 개관 */}
            {activeTab === 'overview' && (
              <div className="animate-fade-in w-full min-w-0">
                <SectionHeader num="0" title="이번 2판에서 새롭게 확인한 핵심" ui={ui} />
                <TextBlock ui={ui}>
                  1. 우리들교회의 현재 공식 T스쿨은 새가족 1주 → THINK 기초양육 6주 → THINK 양육 10주 → THINK 양육교사 10주 → 예비목자양육 20주라는 단계적 구조를 공개하고 있다.<br/>
                  2. THINK 양육은 단순 성경지식 전달 과정이 아니라 서로의 삶을 나누고 예수 그리스도를 본받는 훈련으로 공식 설명된다.<br/>
                  3. THINK 양육은 양육자 1명과 동반자 2~3명으로 구성되며 10주 동안 주제큐티·독후감·생활숙제·설교말씀 요약·매일큐티·세팅봉사를 수행한다.<br/>
                  4. 주제큐티에는 제목 → 본문요약 → 질문 → 질문 중심 묵상 → 적용 → 말씀으로 기도가 포함된다.<br/>
                  5. 생활숙제는 간증문, 시간관리, 성령의 능력으로 죄를 이기고 감정을 다스린 경험 등 실제 삶의 변화를 요구한다.<br/>
                  6. 설교과제는 단순 요약이 아니라 설교의 대지를 구분하고 가능한 한 설교내용을 옮긴 뒤 느낀점을 기록하도록 안내한다.<br/>
                  7. 큐티요약은 QTin을 활용하여 매일 큐티하고 느낀점을 기록하는 방식이다.<br/>
                  8. 세팅봉사는 훈련기간 중 예배 세팅·청소·분리수거 등에 자발적으로 참여하도록 구성되어 있다.<br/>
                  9. THINK 양육 수료자는 다시 10주 THINK 양육교사 심화과정으로 들어가 동반자를 섬기고 나눔을 인도하는 방법을 훈련받는다.<br/>
                  10. 이후 예비목자양육 I·II 총 20주를 통해 목장 리더를 세우는 구조가 공개되어 있다.<br/>
                  11. 2026년 상반기 THINK 양육교사 공지에서는 커리큘럼 개정이 있었고, 4·8·10과가 빠지고 새 3강의가 추가되었다고 공식 공지한다.<br/>
                  12. QTM의 2026년 THINK 양육 개정증보판은 10주 구조를 유지하면서 4과·8과·10과의 본문을 각각 사무엘하 7:18-29, 로마서 3:9-20, 로마서 9:1-13으로 변경했다고 공개한다.<br/>
                  13. 2026년 개정판의 목차는 신앙고백과 간증, 시간관리, 큐티, 기도, 하나님, 예수 그리스도, 성령님, 거듭남, 믿음, 영혼구원으로 구성된다.<br/>
                  14. QTM은 THINK의 목표를 구속사로 성경을 읽고 삶의 사건을 해석하며 “말씀대로 믿고 살고 누리는 그리스도인”으로 살아가도록 돕는 훈련이라고 설명한다.<br/>
                  15. 공식 자료는 “생각(think)을 바르게 하면 어떤 환경에서도 감사(thank)가 나오고, 큐티의 궁극적인 목적인 영혼 구원의 사명을 발견”한다고 설명한다.<br/><br/>
                  <strong className="block mt-4 p-4 rounded-xl border-l-4 border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[13.5px]">
                    이 15개 항목은 1판보다 훨씬 중요한 발견이다. 왜냐하면 우리들교회의 제자훈련을 단순히 “QT를 열심히 하는 프로그램”으로 이해하는 것이 아니라 단계적 형성 → 실제 과제 → 관계적 양육 → 양육자 재생산 → 목자 양성이라는 시스템으로 볼 수 있기 때문이다.
                  </strong>
                </TextBlock>

                <SectionHeader num="1" title="연구자료 등급" ui={ui} />
                <TextBlock ui={ui}>
                  <strong className={ui.textMain}>A — 직접 확인된 공식자료</strong><br/>우리들교회 공식 홈페이지, T스쿨, 공식 공지, QTM 홈페이지/교재 안내, 공식 유튜브<br/><br/>
                  <strong className={ui.textMain}>B — 공식기관이 안내한 외부자료</strong><br/>공식 유튜브 링크, 공식 세미나/인터뷰 안내<br/><br/>
                  <strong className={ui.textMain}>C — 신학·교육학 연구자료</strong><br/>웨스트민스터 신앙고백, 장로교 신학, 학술/전문문헌<br/><br/>
                  <strong className={ui.textMain}>D — 연구자가 재구성한 교육모델</strong><br/>본 문서의 4주 모델, 평가표, 체크리스트, 고난해석 프로토콜 등. (D항목을 공식 교재 내용이라고 표현하지 않는다.)
                </TextBlock>

                <SectionHeader num="2" title="우리들교회 양육 시스템의 현재 공개 구조" ui={ui} />
                <TextBlock ui={ui}>
                  전체 로드맵: 새가족 양육 → THINK 기초양육 6주 → THINK 양육 10주 → THINK 양육교사 10주 → 예비목자양육 I 10주 → 목자 세움 → 예비목자양육 II 10주 → 목장 공동체 리더십. 새가족 양육 후 목장으로 인도되고, 목장예배는 목자 인도 아래 주 1회 열린다.
                </TextBlock>

                <SectionHeader num="3" title="제자훈련의 핵심 원리" ui={ui} />
                <TextBlock ui={ui}>
                  <strong>원리 1 — 입문과 심화를 분리한다.</strong> 기초교리를 배우는 과정과 삶을 나누는 제자훈련을 구분한다.<br/>
                  - 기초양육: 하나님 → 예수 그리스도의 구속 → 믿음 → 예배 → 말씀묵상과 기도 → 성령의 공동체<br/>
                  - THINK 양육: 신앙고백 → 시간 → 큐티 → 기도 → 하나님 → 예수 그리스도 → 성령 → 거듭남 → 믿음 → 영혼구원<br/>
                  <strong className="block mt-4 text-sky-600 dark:text-sky-400">
                    교육적으로 매우 중요한 차이: “무엇을 믿는가?”를 배우는 단계와 “그 믿음으로 어떻게 사는가?”를 훈련하는 단계를 분리한다.
                  </strong>
                </TextBlock>

                <SectionHeader num="4~14" title="THINK 양육 과제와 철학" ui={ui} />
                <TextBlock ui={ui}>
                  4. 실제 교육구조: 지식 → 말씀 → 삶의 나눔 → 자기 발견 → 회개 → 실제 적용 → 관계 변화 → 섬김 → 양육자 형성 → 재생산.<br/>
                  5. 주제큐티: Observation → Question → Reflection → Application → Prayer의 반복.<br/>
                  6. 설교과제: 무엇을 말씀하셨는가? → 깨달았는가? → 회개해야 하는가? → 해야 하는가?<br/>
                  7. 생활숙제: 강의 → 말씀 → 기록 → 생활실험 → 나눔 → 피드백 → 재적용이 핵심.<br/>
                  8. 세팅봉사: 제자는 섬김을 배우는 것뿐 아니라 실제로 섬겨 본다.<br/>
                  9. 양육교사 구조: 동반자 → 삶을 나누는 사람 → 양육자 → 나눔을 인도하는 사람 → 영적 리더.<br/>
                  10. 7가지 능력: 듣기, 질문, 본문 연결, 자기성찰 촉진, 적용, 돌봄, 재생산.<br/>
                  11. 양육교사와 상담자의 차이: 진단/치료/단정 금지. 안전한 목회교육 원칙.<br/>
                  12. 2026년 개정: 삼하7, 롬3, 롬9 본문 변경. 목차 유지.<br/>
                  13. 전체 신학적 이동: 최종 목적이 "지식을 아는 사람"이 아니라 "자신의 삶을 복음과 구속사 안에서 해석하고 사명을 발견하는 사람"으로 이동.<br/>
                  14. 감사와의 관계: 생각을 바르게 하면 어떤 환경에서도 감사가 나온다.
                </TextBlock>

                <SectionHeader num="46" title="가장 중요한 발견" ui={ui} />
                <TextBlock ui={ui}>
                  우리들교회의 공개 양육은 “강의를 많이 듣는 시스템”이 아니다. 오히려 <strong>말씀을 배우고 → 자기 삶을 말하고 → 과제를 수행하고 → 실제 생활에서 적용하고 → 공동체에서 나누고 → 양육자로 성장하고 → 다시 다른 사람을 세우는 시스템</strong>에 가깝다.
                </TextBlock>

                <SectionHeader num="47" title="본 가이드의 최종 철학" ui={ui} />
                <TextBlock ui={ui}>
                  제자훈련은 5개의 이동이다.<br/>
                  ① 지식 → 확신 (무엇을 믿는가?)<br/>
                  ② 확신 → 해석 (말씀으로 삶을 어떻게 보는가?)<br/>
                  ③ 해석 → 순종 (오늘 무엇을 할 것인가?)<br/>
                  ④ 순종 → 성품 (나는 어떤 사람으로 변하고 있는가?)<br/>
                  ⑤ 성품 → 재생산 (다른 사람을 어떻게 세우는가?)
                </TextBlock>

                <SectionHeader num="48" title="최종 제자도 평가" ui={ui} />
                <TextBlock ui={ui}>
                  수료자가 다음 질문에 “예”라고 대답할 수 있는지를 본다.
                </TextBlock>
                <div className={`flex flex-col gap-2 mb-8 py-5 border-y ${ui.border}`}>
                  {[
                    {k:'m1', t:'복음을 설명할 수 있다.'}, {k:'m2', t:'자신의 신앙고백을 할 수 있다.'},
                    {k:'m3', t:'성경을 문맥 속에서 읽는다.'}, {k:'m4', t:'QT를 지속한다.'},
                    {k:'m5', t:'사건과 자기 해석을 구별한다.'}, {k:'m6', t:'자신의 죄를 볼 수 있다.'},
                    {k:'m7', t:'회개를 행동으로 연결한다.'}, {k:'m8', t:'고난을 함부로 단정하지 않는다.'},
                    {k:'m9', t:'감사가 결과가 아니라 하나님을 향하도록 훈련한다.'}, {k:'m10', t:'공동체에 자신의 삶을 나눌 수 있다.'},
                    {k:'m11', t:'다른 사람을 돌볼 수 있다.'}, {k:'m12', t:'실제로 섬긴다.'},
                    {k:'m13', t:'영혼구원의 사명을 이해한다.'}, {k:'m14', t:'한 사람을 제자로 세울 수 있다.'},
                    {k:'m15', t:'자신이 없어져도 제자화가 계속되도록 다른 사람을 세운다.'}
                  ].map(c => (
                    <InteractiveCheckbox key={c.k} id={c.k} label={c.t} ui={ui} checked={checks[c.k]} onToggle={toggleCheck} />
                  ))}
                </div>

                <SectionHeader num="49" title="지도자 선언" ui={ui} />
                <TextBlock ui={ui}>
                  나는 성도에게 내 답을 주는 사람이 아니라 성도가 말씀 앞에서 하나님을 만나도록 돕는 사람이다. 나는 성도의 고난을 함부로 해석하지 않는다. 나는 성도의 죄를 이용하지 않는다. 나는 성도의 고백을 안전하게 다룬다. 나는 말씀을 삶에 연결한다. 나는 적용을 구체화한다. 나는 섬김을 직접 보여준다. 나는 제자를 나에게 묶어두지 않는다. 나는 그리스도께 연결한다. 그리고 그 사람이 또 다른 사람을 세우도록 돕는다.
                </TextBlock>

                <SectionHeader num="50~52" title="참고자료 및 한계" ui={ui} />
                <TextBlock ui={ui}>
                  50. 공식 링크: 홈페이지, T스쿨, QTM, 2026 상반기 OT 공지 등.<br/>
                  51. 참고문헌: 웨스트민스터 신앙고백, 로버트 콜먼, 달라스 윌라드 등.<br/>
                  52. 한계: 2판은 김양재 목사 중심. 다음 단계에서 이성현 목사 코퍼스를 분석·통합하여 3판 커리큘럼을 만든다.
                </TextBlock>

                <SectionHeader num="53" title="2판의 결론" ui={ui} />
                <TextBlock ui={ui}>
                  이 제자훈련의 목표는 좋은 교인 만들기가 아니다. 성경지식이 많은 사람 만들기도 아니다. 훈련과제를 잘 제출하는 사람 만들기도 아니다. 최종 목표는 다음이다.<br/><br/>
                  <strong className={ui.textMain}>"복음을 알고, 말씀으로 자신의 삶을 해석하며, 회개하고 감사하고 순종하며, 고난 속에서도 하나님을 붙들고, 공동체 안에서 사랑으로 섬기며, 자신이 받은 복음을 또 다른 사람에게 전하고, 결국 다른 제자를 세울 수 있는 그리스도의 사람을 만드는 것."</strong><br/><br/>
                  가장 중요한 질문: <strong>“이번 주 말씀 때문에 내 삶에서 실제로 무엇이 달라졌는가?”</strong>
                </TextBlock>
              </div>
            )}

            {/* TAB 2: 해석 프로토콜 */}
            {activeTab === 'protocols' && (
              <div className="animate-fade-in w-full min-w-0">
                <SectionHeader num="15" title="감사의 5단계 훈련" ui={ui} />
                <TextBlock ui={ui}>
                  1단계 — 사실 감사: “오늘 실제로 받은 것은 무엇인가?”<br/>
                  2단계 — 은혜 감사: “이것이 왜 나에게 은혜인가?”<br/>
                  3단계 — 하나님 감사: “이 은혜를 주시는 하나님은 어떤 분인가?”<br/>
                  4단계 — 고난 속 감사: “원하는 결과가 없어도 붙들 수 있는 하나님의 성품은 무엇인가?”<br/>
                  5단계 — 순종의 감사: “감사한다면 이번 주 무엇을 순종할 것인가?”
                </TextBlock>
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 border-y ${ui.border} py-6`}>
                  {['1단계. 사실 감사', '2단계. 은혜 감사', '3단계. 하나님 감사', '4단계. 고난 속 감사', '5단계. 순종의 감사'].map((step, i) => (
                    <div key={i} className="flex flex-col">
                      <label className={`text-[13px] font-black ${ui.textSub} mb-1.5`}>{step}</label>
                      <input type="text" value={forms[`thk_${i}`]||''} onChange={e => handleForm(`thk_${i}`, e.target.value)} placeholder="기록하십시오..." className={`w-full p-3.5 rounded-xl text-[14px] outline-none border transition-all ${ui.inputBg}`} />
                    </div>
                  ))}
                </div>
                <button 
                  onPointerDown={(e) => { e.preventDefault(); syncToPipeline('gratitude', '감사의 5단계 훈련 완료'); }}
                  className={`w-full py-3.5 rounded-xl text-[13.5px] font-black flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-sm mb-12 ${ui.btnPrimary}`}
                >
                  <IconSend /> 작성 내역을 나의 감사 일기장으로 전송
                </button>

                <SectionHeader num="16" title="고난 해석 프로토콜" ui={ui} />
                <TextBlock ui={ui}>
                  고난이 발생하면 성도는 다음 순서를 따른다.<br/>
                  STEP 1: 사실만 기록한다. / STEP 2: 감정을 기록한다. / STEP 3: 내 해석을 기록한다. / STEP 4: 내가 무엇을 잃었다고 생각하는지 찾는다. / STEP 5: 내가 무엇을 반드시 가져야 한다고 생각하는지 찾는다. / STEP 6: 그 욕망과 두려움을 말씀 앞에 놓는다. / STEP 7: 하나님의 성품을 확인한다. / STEP 8: 복음을 확인한다. / STEP 9: 회개할 부분과 회개하지 않아도 되는 부분을 구별한다. / STEP 10: 오늘 순종할 것을 하나만 정한다. / STEP 11: 공동체에 도움을 요청한다. / STEP 12: 시간을 두고 다시 해석 편집한다.
                </TextBlock>

                <SectionHeader num="17" title="고난을 잘못 해석하지 않기 위한 8개 필터" ui={ui} />
                <TextBlock ui={ui}>해석을 확정하기 전 스스로를 점검하십시오.</TextBlock>
                <div className="flex flex-col gap-2 mb-12 py-5">
                  {[
                    {k:'f1', t:'이 사건의 원인을 내가 안다고 착각하고 있지 않은가?'}, {k:'f2', t:'상대방의 죄를 내 해석으로 단정하고 있지 않은가?'},
                    {k:'f3', t:'하나님을 벌 주는 분으로만 이해하고 있지 않은가?'}, {k:'f4', t:'나의 통제욕이 숨어 있지 않은가?'},
                    {k:'f5', t:'내 인정욕구가 숨어 있지 않은가?'}, {k:'f6', t:'성경본문을 억지로 끼워 맞추고 있지 않은가?'},
                    {k:'f7', t:'실제적인 도움을 거부하고 있지 않은가?'}, {k:'f8', t:'하나님께 탄식할 권리를 스스로 막고 있지 않은가?'}
                  ].map(f => (
                    <InteractiveCheckbox key={f.k} id={f.k} label={f.t} isError={true} ui={ui} checked={checks[f.k]} onToggle={toggleCheck} />
                  ))}
                </div>

                <SectionHeader num="18" title="QT를 ‘제대로’ 하는 교육모델" ui={ui} />
                <TextBlock ui={ui}>
                  우리들교회 공식 사이트는 QT 소개와 “QT는 이렇게”, “QT 제대로 하기”라는 별도 영역을 제공한다. 본 과정에서는 QT를 다음과 같이 훈련한다.<br/>
                  - 관찰: 본문에 실제로 있는 것은?<br/>
                  - 해석: 본문은 무엇을 의미하는가?<br/>
                  - 구속사: 이 본문은 성경 전체의 구원 역사와 어떻게 연결되는가?<br/>
                  - 자기성찰: 이 말씀 앞에서 나는 누구인가?<br/>
                  - 복음: 그리스도 안에서 나에게 주어진 은혜는 무엇인가?<br/>
                  - 적용: 오늘 무엇을 해야 하는가?<br/>
                  - 기도: 말씀대로 어떻게 기도할 것인가?<br/>
                  - 나눔: 공동체와 무엇을 나눌 것인가?
                </TextBlock>

                <SectionHeader num="25" title="간증훈련의 기본 구조" ui={ui} />
                <TextBlock ui={ui}>
                  BEFORE: 나는 어떤 사람이었는가?<br/>
                  EVENT: 무슨 사건이 있었는가?<br/>
                  WORD: 말씀을 통해 무엇을 깨달았는가?<br/>
                  RESPONSE: 무엇을 회개하고 순종했는가?<br/>
                  AFTER: 무엇이 달라졌는가?<br/>
                  GOSPEL: 그 과정에서 복음이 무엇을 보여주었는가?<br/>
                  MISSION: 이 이야기가 누구를 살리고 세울 수 있는가?
                </TextBlock>

                <SectionHeader num="26~27" title="간증 및 나눔의 원칙" ui={ui} />
                <TextBlock ui={ui}>
                  <strong>26. 간증에서 반드시 제거할 것:</strong><br/>
                  - 자기 자랑 / 성공담만 강조 / 문제 해결만 강조 / 다른 사람 비난 / 특정인의 개인정보 / 검증되지 않은 영적 체험을 교리처럼 말하기 / “하나님이 반드시 이렇게 하신다”는 식의 단정<br/><br/>
                  <strong>27. 공동체의 고백을 안전하게 만드는 원칙:</strong><br/>
                  원칙 1 강요하지 않는다. 원칙 2 말한 내용을 외부로 유출하지 않는다. 원칙 3 공동체 권력관계를 고려한다. 원칙 4 성도의 약점을 리더십 확보에 이용하지 않는다. 원칙 5 심각한 문제는 전문 도움으로 연결한다.
                </TextBlock>

                <SectionHeader num="36" title="신학적 검증 체크리스트" ui={ui} />
                <TextBlock ui={ui}>어떤 교육내용을 교재에 넣기 전에 다음을 확인한다.</TextBlock>
                <div className="flex flex-col gap-2 mb-8 py-4">
                  {[
                    {k:'t1', t:'성경 본문이 실제로 그렇게 말하는가?'}, {k:'t2', t:'본문 문맥에 맞는가?'},
                    {k:'t3', t:'특정 구절을 지나치게 확대하지 않았는가?'}, {k:'t4', t:'웨스트민스터 신앙고백과 충돌하지 않는가?'},
                    {k:'t5', t:'장로교 신학과 양립 가능한가?'}, {k:'t6', t:'특정 목회자의 개인적 해석을 교리화하지 않았는가?'},
                    {k:'t7', t:'심리학적 개념을 성경의 진리와 동일시하지 않았는가?'}, {k:'t8', t:'개인 경험을 하나님의 보편적 뜻으로 만들지 않았는가?'}
                  ].map(c => (
                    <InteractiveCheckbox key={c.k} id={c.k} label={c.t} isError={true} ui={ui} checked={checks[c.k]} onToggle={toggleCheck} />
                  ))}
                </div>

                <SectionHeader num="37" title="특히 주의해야 할 신학적 오류 5가지" ui={ui} />
                <TextBlock ui={ui}>
                  오류 A: “하나님이 이 사건을 주신 이유를 내가 안다.” → 근거가 없으면 단정하지 않는다.<br/>
                  오류 B: “고난이 있으니 반드시 숨은 죄가 있다.” → 욥기 전체를 무시하는 위험이 있다.<br/>
                  오류 C: “감사하면 하나님이 문제를 해결해 주신다.” → 감사를 거래로 만든다.<br/>
                  오류 D: “QT에서 떠오른 생각이 곧 하나님의 음성이다.” → 성경의 권위와 개인적 묵상을 혼동할 수 있다.<br/>
                  오류 E: “좋은 적용 = 본문 해석” → 적용은 본문 해석에서 나와야 한다.<br/><br/>
                  <strong className="block mt-4 p-4 rounded-xl border-l-4 border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[13.5px]">
                    오히려 훈련해야 할 질문은 “이 사건의 하나님의 뜻을 내가 함부로 단정하지 않고, 말씀 앞에서 오늘 내가 순종할 것은 무엇인가?”이다. 이것은 매우 중요한 신학적 안전장치이다.
                  </strong>
                </TextBlock>

              </div>
            )}

            {/* TAB 3: 주차별 양육 실천 */}
            {activeTab === 'curriculum' && (
              <div className="animate-fade-in w-full min-w-0">
                
                <SectionHeader num="19" title="4주 집중과정 — 2판 개정안" ui={ui} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
                  {[
                    { w: 1, t: '복음과 제자', k: '복음, 칭의, 성화, 신앙고백', p: '나의 신앙고백, 구원 간증', a: '복음요약, QT 3회, 간증' },
                    { w: 2, t: '말씀과 삶의 해석', k: '성경, 구속사, 사건과 해석', p: '주제큐티, 사건 해석표', a: 'QT 5회, 설교분석, 생활적용' },
                    { w: 3, t: '기도·감사·고난·회개', k: '말씀대로 기도, 고난, 회개', p: '감사일지, 고난해석 보고서', a: '7일 감사훈련, 고난사건 재해석' },
                    { w: 4, t: '공동체·섬김·영혼구원', k: '교회, 섬김, 영혼구원, 제자화', p: '한 사람 돌봄, 실제 봉사', a: '30일 기도, 섬김 1회 이상' }
                  ].map(wk => (
                    <div key={wk.w} className={`flex flex-col p-5 rounded-2xl border shadow-sm ${isDark ? 'bg-black/40 border-white/5' : 'bg-white/50 border-white/80'}`}>
                      <h3 className={`font-black text-[15.5px] ${ui.textMain} mb-3`}><span className={ui.primary}>WEEK {wk.w}</span> {wk.t}</h3>
                      <div className="space-y-1.5 mb-3">
                        <p className={`text-[13px] ${ui.textSub} break-keep`}><strong className={ui.textMain}>핵심:</strong> {wk.k}</p>
                        <p className={`text-[13px] ${ui.textSub} break-keep`}><strong className={ui.textMain}>실습:</strong> {wk.p}</p>
                        <p className={`text-[13px] ${ui.textSub} break-keep`}><strong className={ui.textMain}>과제:</strong> {wk.a}</p>
                      </div>
                      <textarea 
                        placeholder={`${wk.w}주차 과제 실행 결과를 기록하십시오.`} 
                        value={forms[`mod4_${wk.w}`]||''} onChange={e => handleForm(`mod4_${wk.w}`, e.target.value)}
                        className={`w-full p-3.5 mt-auto text-[13px] outline-none border rounded-xl resize-none h-20 transition-all ${ui.inputBg}`} 
                      />
                    </div>
                  ))}
                </div>

                <SectionHeader num="20" title="10주 확장과정 (THINK 양육) 실습장" ui={ui} />
                <TextBlock ui={ui}>4주 집중과정을 실제 THINK 양육 구조에 가깝게 확장한다.</TextBlock>
                <div className="flex flex-col gap-4 mb-12 py-4">
                  {[
                    { week: 1, title: '신앙고백과 간증', q: '“하나님께서 나의 인생에서 어떻게 일하셨는가?”', task: '신앙고백, 간증' },
                    { week: 2, title: '시간관리', q: '“나는 무엇을 중요하다고 말하면서 실제로는 무엇에 시간을 쓰는가?”', task: '7일 Time Schedule, 우선순위 분석' },
                    { week: 3, title: '큐티', q: '“나는 말씀을 읽는가, 말씀으로 삶을 해석하는가?”', task: '주제큐티, 매일 QT' },
                    { week: 4, title: '기도', q: '“나는 하나님께 무엇을 요구하는가?”', task: '기도생활 분석, 말씀으로 기도문 작성' },
                    { week: 5, title: '하나님', q: '“나는 하나님을 어떤 분으로 믿고 있는가?”', task: '하나님의 성품 연구, 나의 하나님관 점검' },
                    { week: 6, title: '예수 그리스도', q: '“십자가가 나의 삶을 어떻게 바꾸는가?”', task: '십자가와 자기부인, 관계 적용' },
                    { week: 7, title: '성령님', q: '“갈등 속에서 성령을 따라 사는 것은 무엇인가?”', task: '갈등사례 분석, 감정관리 기록' },
                    { week: 8, title: '거듭남', q: '“나는 정말 복음으로 변화된 사람인가?”', task: '죄의 패턴 분석, 회개와 방향전환' },
                    { week: 9, title: '믿음', q: '“믿음이란 내가 원하는 결과를 얻는 것인가?”', task: '믿음의 사건 기록, 하나님의 옳으심을 인정하는 훈련' },
                    { week: 10, title: '영혼구원', q: '“내 인생의 목적은 무엇인가?”', task: '한 사람 선정, 30일 기도, 복음적 관계 형성, 제자화 계획' }
                  ].map(wk => (
                    <div key={wk.week} className={`flex flex-col p-4.5 rounded-2xl border shadow-sm ${isDark ? 'bg-black/30 border-white/5' : 'bg-white/50 border-white/60'}`}>
                      <span className={`text-[14.5px] font-black ${ui.textMain} mb-1.5`}>{wk.week}주. {wk.title}</span>
                      <p className="text-[13.5px] font-bold text-sky-600 dark:text-sky-400 mb-2.5 break-keep">Q. {wk.q}</p>
                      <textarea 
                        placeholder={`과제: ${wk.task}`} 
                        value={forms[`ext10_${wk.week}`]||''} onChange={e => handleForm(`ext10_${wk.week}`, e.target.value)}
                        className={`w-full p-3.5 text-[13px] outline-none border rounded-xl resize-y min-h-[80px] transition-all ${ui.inputBg}`} 
                      />
                    </div>
                  ))}
                </div>

                <SectionHeader num="21~24, 28~30" title="양육교사 및 재생산 구조" ui={ui} />
                <TextBlock ui={ui}>
                  <strong>21. 양육교사 10주 확장과정:</strong> 정체성, 경청, 좋은 질문, 본문과 삶 연결, 고백과 간증 다루기, 갈등과 감정, 적용을 돕는 법, 기도와 돌봄, 양육자의 자기관리, 제자 재생산과 리더십.<br/><br/>
                  <strong>22. 양육교사 실제 모임 매뉴얼:</strong> 시작(5분 기도) → 말씀(10분 본문) → 나눔(30분 삶) → 질문(15분 연결) → 적용(10분 한가지) → 기도(10분 서로위해) → 기록(5분 다음약속). 총 85분.<br/><br/>
                  <strong>23. 양육교사의 질문은행:</strong> 사실 질문: “무슨 일이 있었나요?” / 감정 질문: “그때 어떤 마음이었나요?” / 욕망 질문: “그때 무엇을 원했나요?” / 두려움 질문: “무엇이 가장 두려웠나요?” / 신앙 질문: “그 상황에서 하나님을 어떻게 생각했나요?” / 말씀 질문: “이 상황을 비춰볼 수 있는 말씀이 있나요?” / 회개 질문: “내가 먼저 돌아봐야 할 부분은 무엇일까요?” / 감사 질문: “이 상황에서도 하나님께 감사할 수 있는 것은 무엇일까요?” / 적용 질문: “이번 주에 실제로 무엇을 하겠습니까?”<br/><br/>
                  <strong>24. 양육교사의 금지 질문:</strong> “왜 그렇게 했어요?” “그건 믿음이 부족해서 그런 것 아닌가요?” “하나님이 벌 주신 것 같네요.” “제가 보기에는 답이 뻔한데요.” “그 사람을 용서해야죠.” “감사하면 다 해결됩니다.” (상대방의 자기성찰을 닫는 질문들)<br/><br/>
                  <strong>28. 예비목자 단계와 연결:</strong> 성도 → 훈련생 → 양육자 → 양육교사 → 예비리더 → 목자 → 다음 리더를 세우는 리더<br/><br/>
                  <strong>29. 4주 집중과정과 10주 양육, 10주 양육교사의 관계:</strong> 4주: 영적 기초 집중훈련. / 10주: 삶을 나누며 형성. / 양육교사 10주: 다른 사람의 성장을 돕는 능력 형성. / 예비목자 20주: 공동체 리더십과 재생산.<br/><br/>
                  <strong>30. 제자훈련의 최종 구조:</strong> 복음 → 말씀 → 삶의 해석 / QT → 회개 & 감사 → 순종 → 성화 → 공동체 → 섬김 → 영혼구원 → 제자화 → 재생산
                </TextBlock>

                <SectionHeader num="31~33" title="30일 연속 훈련 및 주간 체크리스트" ui={ui} />
                <TextBlock ui={ui}>
                  <strong>31. 30일 감사훈련 (매일):</strong> 1. 오늘 있었던 사건 3개 / 2. 그 사건에 대한 나의 해석 / 3. 감정 / 4. 욕망 / 5. 말씀 / 6. 하나님에 대한 발견 / 7. 감사 / 8. 순종<br/><br/>
                  <strong>32. 30일 고난훈련:</strong> 1주차: 사실과 감정 구분 / 2주차: 나의 해석과 욕망 발견 / 3주차: 말씀과 복음으로 재해석 / 4주차: 실제 순종과 공동체 나눔<br/><br/>
                  <strong>33. 주간 체크리스트:</strong> 월화수목금토일 별로 점검: QT, 기도, 감사, 회개, 적용, 섬김, 관계회복, 복음/제자화
                </TextBlock>
                <div className={`overflow-hidden border-2 rounded-2xl ${ui.border} mb-4 shadow-sm`}>
                  <div className="overflow-x-auto hide-scrollbar touch-pan-x w-full">
                    <table className="w-full text-center text-[13px] min-w-[500px]">
                      <thead>
                        <tr>
                          <th className={`p-3 border-b-2 border-r ${ui.border} ${ui.textSub} font-black bg-black/5 dark:bg-white/5`}>항목</th>
                          {['월','화','수','목','금','토','일'].map(d => <th key={d} className={`p-3 border-b-2 border-r last:border-r-0 ${ui.border} ${ui.textMain} font-black bg-black/5 dark:bg-white/5`}>{d}</th>)}
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${ui.border}`}>
                        {['QT', '기도', '감사', '회개', '적용', '섬김', '관계회복', '복음'].map(item => (
                          <tr key={item}>
                            <td className={`p-3 border-r font-bold ${ui.border} ${ui.textMain} whitespace-nowrap`}>{item}</td>
                            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => {
                              const key = `w_${item}_${day}`;
                              return (
                                <td key={day} className={`p-2 border-r last:border-r-0 ${ui.border}`}>
                                  <div 
                                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); toggleWeekly(key); }} 
                                    className={`w-7 h-7 mx-auto rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${weeklyCheck[key] ? 'bg-sky-500 border-sky-500 text-white' : `bg-transparent ${ui.border}`}`}
                                  >
                                    {weeklyCheck[key] && <IconCheck />}
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <button 
                  onPointerDown={(e) => { e.preventDefault(); syncToPipeline('weekly_checks'); }}
                  className={`w-full py-3.5 rounded-xl text-[13.5px] font-black flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-sm mb-12 ${ui.btnPrimary}`}
                >
                  <IconSend /> 위 체크 항목을 오늘의 '영적 5종 세트'에 자동 동기화
                </button>

                <SectionHeader num="34~35" title="제자도 성숙도 평가 및 지도자 루브릭" ui={ui} />
                <div className="flex flex-col gap-10 mb-12">
                  <div className={`p-5 rounded-2xl border ${isDark ? 'bg-black/30 border-white/5' : 'bg-white/50 border-white/60'}`}>
                    <h3 className={`text-[15px] font-black ${ui.textMain} mb-4`}>34. 제자도 성숙도 평가</h3>
                    <ul className={`text-[13px] leading-[2.0] ${ui.textSub} font-medium break-keep`}>
                      <li className="flex gap-2"><strong className={`${ui.textMain} w-24 shrink-0`}>Level 1 참석자:</strong> 교회에 출석한다.</li>
                      <li className="flex gap-2"><strong className={`${ui.textMain} w-24 shrink-0`}>Level 2 학습자:</strong> 말씀을 배운다.</li>
                      <li className="flex gap-2"><strong className={`${ui.textMain} w-24 shrink-0`}>Level 3 실천자:</strong> 말씀을 삶에 적용한다.</li>
                      <li className="flex gap-2"><strong className={`${ui.textMain} w-24 shrink-0`}>Level 4 나눔자:</strong> 자신의 삶을 공동체에 나눈다.</li>
                      <li className="flex gap-2"><strong className={`${ui.textMain} w-24 shrink-0`}>Level 5 양육자:</strong> 다른 사람의 성장을 돕는다.</li>
                      <li className="flex gap-2"><strong className={`${ui.textMain} w-24 shrink-0`}>Level 6 양육교사:</strong> 나눔을 인도한다.</li>
                      <li className="flex gap-2"><strong className={`${ui.textMain} w-24 shrink-0`}>Level 7 리더:</strong> 공동체를 섬긴다.</li>
                      <li className="flex gap-2"><strong className={`${ui.textMain} w-24 shrink-0`}>Level 8 재생산자:</strong> 다른 리더를 세운다.</li>
                    </ul>
                  </div>
                  
                  <div className={`p-5 rounded-2xl border ${isDark ? 'bg-black/30 border-white/5' : 'bg-white/50 border-white/60'}`}>
                    <h3 className={`text-[15px] font-black ${ui.textMain} mb-5`}>35. 지도자 평가 루브릭 (직접 평가)</h3>
                    <div className="space-y-6">
                      {[
                        { id: 'word', label: '말씀 (지식 ~ 복음연결)' },
                        { id: 'reflect', label: '자기성찰 (타인탓 ~ 자신먼저)' },
                        { id: 'apply', label: '적용 (추상적 ~ 구체적)' },
                        { id: 'community', label: '공동체 (자기얘기 ~ 듣고돌봄)' },
                        { id: 'reproduce', label: '재생산 (받음 ~ 제자양육)' }
                      ].map(r => (
                        <div key={r.id} className="flex flex-col gap-2">
                          <div className={`text-[13.5px] font-bold ${ui.textMain} flex justify-between`}>
                             <span>{r.label}</span>
                             <span className="font-black text-sky-600 dark:text-sky-400">{rubrics[r.id]}점</span>
                          </div>
                          <input type="range" min="1" max="5" step="1" value={rubrics[r.id]||3} onChange={e => handleRubric(r.id, e.target.value)} className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-sky-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <SectionHeader num="38~41" title="대학 강의 구성 및 90일 제자화 프로젝트" ui={ui} />
                <TextBlock ui={ui}>
                  <strong>38. 대학/신대원 강의 구성:</strong> 1. 제자훈련 모델 2. 제자도의 성경신학 3. 칭의와 성화 4. WCF와 제자도 5. QT와 성경해석 6. 삶의 해석과 목회적 적용 7. 고난과 섭리 8. 회개와 감사 9. 공동체와 영적 돌봄 10. 양육교사와 재생산.<br/><br/>
                  <strong>39. 대학원 세미나 토론:</strong> 주제 1: 제자훈련은 교리교육인가 성품형성인가? 주제 2: QT의 개인적 적용은 어디까지 정당한가? 주제 3: 고난을 섭리로 해석하는 것과 원인을 단정하는 것은 어떻게 다른가? 주제 4: 간증과 자기노출은 언제 유익이 되고 언제 위험이 되는가? 주제 5: 양육교사는 목회자 연장선인가 평신도 리더인가? 주제 6: 제자훈련의 성공을 무엇으로 측정해야 하는가?<br/><br/>
                  <strong>41. 90일 제자화 프로젝트:</strong> 1~30일: 나 자신을 말씀 앞에 세운다. 31~60일: 한 사람을 지속적으로 돌본다. 61~90일: 그 사람과 함께 말씀·기도·적용을 반복한다. 최종 질문: “이 사람은 나에게 의존하고 있는가? 아니면 이 사람도 또 다른 사람을 세울 수 있게 되었는가?” 후자가 재생산적 제자훈련이다.
                </TextBlock>
                
                <h3 className="font-black text-[17px] text-sky-600 dark:text-sky-400 mt-10 mb-5 border-b-2 border-current pb-2">40. 나의 90일 제자도 형성 프로젝트 워크북</h3>
                <div className="flex flex-col gap-4">
                  {[
                    { id: 'p1', label: '1. 나의 신앙 상태' }, { id: 'p2', label: '2. 반복되는 죄' }, { id: 'p3', label: '3. 반복되는 욕망' },
                    { id: 'p4', label: '4. 감사가 어려운 영역' }, { id: 'p5', label: '5. 고난의 영역' }, { id: 'p6', label: '6. 말씀생활' },
                    { id: 'p7', label: '7. 기도생활' }, { id: 'p8', label: '8. 공동체' }, { id: 'p9', label: '9. 섬김' },
                    { id: 'p10', label: '10. 한 사람 제자화' }, { id: 'p11', label: '11. 90일 행동계획' }, { id: 'p12', label: '12. 90일 후 평가방법' }
                  ].map(f => (
                    <div key={f.id} className={`flex flex-col p-4 rounded-2xl border shadow-sm ${isDark ? 'bg-black/30 border-white/5' : 'bg-white/50 border-white/60'}`}>
                      <label className={`text-[13.5px] font-black ${ui.textMain} mb-2.5`}>{f.label}</label>
                      <textarea 
                        value={forms[f.id]||''} onChange={e => handleForm(f.id, e.target.value)} 
                        placeholder="상태와 계획을 구체적으로 기록하세요." 
                        className={`w-full p-3.5 text-[13px] font-medium border rounded-xl outline-none resize-y min-h-[80px] transition-all shadow-inner ${ui.inputBg}`} 
                      />
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* TAB 4: 김포좋은나무교회 심층분석 */}
            {activeTab === 'gimpo' && (
              <div className="flex flex-col xl:flex-row gap-8 xl:gap-10 h-full animate-fade-in w-full min-w-0">
                
                {/* 패널 A: 원문 뷰어 */}
                <div className="flex flex-col h-[50vh] xl:h-[70vh] xl:w-[40%] min-w-0">
                  <div className="py-4 border-b-2 border-black/10 dark:border-white/10 shrink-0 bg-transparent">
                     <h2 className={`text-[16px] font-black ${ui.textMain} flex items-center gap-2`}><IconBook/> 논문 원문 뷰어</h2>
                     <p className={`text-[12px] font-bold ${ui.textSub} mt-1.5`}>Ch 54~64, 68 전수 파트</p>
                  </div>
                  <div className="flex-1 overflow-y-auto py-4 hide-scrollbar">
                     <pre className={`whitespace-pre-wrap text-[13px] leading-[1.8] font-medium ${ui.textSub} font-sans break-keep`}>
                        {VERBATIM_TEXT.tab4}
                     </pre>
                  </div>
                </div>

                {/* 패널 B: 데이터 시각화 대시보드 */}
                <div className="flex flex-col flex-1 h-[70vh] overflow-y-auto hide-scrollbar min-w-0 border-t xl:border-t-0 xl:border-l border-slate-200 dark:border-white/10 xl:pl-8 pt-6 xl:pt-0">
                  <div className="py-4 border-b-2 border-black/10 dark:border-white/10 shrink-0 sticky top-0 bg-transparent backdrop-blur-md z-10">
                     <h2 className={`text-[16px] font-black ${ui.textMain} flex items-center gap-2`}><IconChart/> 코퍼스 시각화 대시보드</h2>
                  </div>
                  
                  <div className="py-6 space-y-12">
                    
                    {/* 데이터 1: 자료 분류 */}
                    <div>
                       <h3 className={`text-[15px] font-black ${ui.textMain} mb-4 border-l-4 border-sky-500 pl-3`}>56. 코퍼스 자료 분류 (총 79편)</h3>
                       <div className="flex h-10 rounded-xl overflow-hidden w-full shadow-sm">
                          <div style={{width: '57%'}} className="bg-sky-500 flex items-center justify-center text-[13px] font-black text-white">E1 (45편)</div>
                          <div style={{width: '26%'}} className="bg-sky-400 flex items-center justify-center text-[13px] font-black text-white">E2 (21)</div>
                          <div style={{width: '17%'}} className="bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-[11px] font-black text-slate-700 dark:text-white">E3(13)</div>
                       </div>
                       <div className={`flex flex-wrap gap-3 text-[12px] mt-3 font-medium ${ui.textSub}`}>
                          <span><strong className={ui.textMain}>E1:</strong> 명시적 표기</span>
                          <span><strong className={ui.textMain}>E2:</strong> 설교자 추정</span>
                          <span><strong className={ui.textMain}>E3:</strong> 협동목사단</span>
                       </div>
                    </div>

                    {/* 가독성 극대화된 79편 데이터 그리드 */}
                    <div className={`flex flex-col h-[500px] border ${ui.border} rounded-[20px] overflow-hidden shadow-sm`}>
                      <div className={`p-4 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${isDark ? 'bg-black/40' : 'bg-white/50'}`}>
                        <h3 className={`text-[14px] font-black ${ui.textMain}`}>79편 설교 요약 DB 검색</h3>
                        <div className={`flex items-center gap-2 px-3 py-2 border rounded-xl w-full sm:w-64 focus-within:border-sky-500 ${isDark ? 'bg-black/30 border-white/10' : 'bg-white/80 border-slate-300'}`}>
                          <IconSearch />
                          <input 
                            type="text" placeholder="검색어 (십자가, 마가복음 등)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full bg-transparent outline-none text-[13px] font-bold ${ui.textMain}`}
                          />
                        </div>
                      </div>
                      <div className={`flex-1 overflow-y-auto hide-scrollbar ${isDark ? 'bg-transparent' : 'bg-white/40'}`}>
                        <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/5">
                          {SERMON_DATA.filter(s => s.title.includes(searchTerm) || s.verse.includes(searchTerm) || s.keywords.includes(searchTerm)).map((s, i) => (
                            <div key={i} className="flex flex-col p-4 gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                              <div className="flex justify-between items-start gap-2">
                                <h4 className={`text-[14.5px] font-black ${ui.textMain} leading-tight break-keep`}>{s.title}</h4>
                                <span className={`shrink-0 px-2 py-1 rounded border text-[11px] font-black ${isDark ? 'bg-white/5 border-white/10 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600'}`}>{s.type}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[12px] font-bold text-slate-500">{s.verse}</span>
                                <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
                                <span className="text-[12px] text-slate-400 font-mono">{s.date}</span>
                              </div>
                              <p className={`text-[12px] font-medium ${ui.textSub} truncate`}>키워드: {s.keywords}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 데이터 4: 최상위 신학 어휘 빈도 분석 */}
                    <div>
                       <h3 className={`text-[15px] font-black ${ui.textMain} mb-5 border-l-4 border-sky-500 pl-3`}>58. 신학 어휘 빈도 분석</h3>
                       <div className="space-y-4">
                          {[
                             { w: '말씀', f: 1209, p: 100 }, { w: '죄', f: 811, p: 67 },
                             { w: '기도', f: 499, p: 41 }, { w: '믿음', f: 351, p: 29 },
                             { w: '은혜', f: 274, p: 22 }, { w: '공동체', f: 272, p: 22 }
                          ].map((k, i) => (
                             <div key={i} className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center text-[12.5px] font-bold">
                                   <span className={ui.textMain}>{k.w}</span>
                                   <span className={ui.textSub}>{k.f}회</span>
                                </div>
                                <div className="w-full h-2.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                                   <div style={{width: `${k.p}%`}} className="h-full bg-sky-500 rounded-full"></div>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* TAB 5: 부록 및 실전 양식 */}
            {activeTab === 'appendix' && (
              <div className="flex flex-col xl:flex-row gap-8 xl:gap-10 h-full animate-fade-in w-full min-w-0">
                
                {/* 패널 A: 원문 뷰어 */}
                <div className="flex flex-col h-[40vh] xl:h-[70vh] xl:w-[40%] min-w-0">
                  <div className="py-4 border-b-2 border-black/10 dark:border-white/10 shrink-0 bg-transparent">
                     <h2 className={`text-[16px] font-black ${ui.textMain} flex items-center gap-2`}><IconBook/> 부록 원문 뷰어</h2>
                  </div>
                  <div className="flex-1 overflow-y-auto py-4 hide-scrollbar">
                     <pre className={`whitespace-pre-wrap text-[12.5px] leading-[1.8] font-medium ${ui.textSub} font-sans break-keep`}>
                        {VERBATIM_TEXT.tab5}
                     </pre>
                  </div>
                </div>

                {/* 패널 B: 종합 실전 양식 폼 */}
                <div className="flex flex-col flex-1 h-[70vh] overflow-y-auto hide-scrollbar min-w-0 border-t xl:border-t-0 xl:border-l border-slate-200 dark:border-white/10 xl:pl-8 pt-6 xl:pt-0">
                  <div className="py-4 border-b-2 border-black/10 dark:border-white/10 shrink-0 sticky top-0 bg-transparent backdrop-blur-md z-10">
                     <h2 className={`text-[16px] font-black ${ui.textMain} flex items-center gap-2`}>종합 실전 훈련 양식</h2>
                  </div>
                  
                  <div className="py-6 space-y-12 w-full min-w-0">
                    
                    {/* 부록 2: 고난 해석 1페이지 양식 */}
                    <div>
                      <h3 className={`text-[15px] font-black ${ui.textMain} mb-4 border-l-4 border-sky-500 pl-3`}>고난 해석 1페이지 양식 (프로토콜 실전)</h3>
                      <div className="flex flex-col gap-4">
                        {[
                          { id: 'suf_fact', label: '사실 (무슨 일인가)' }, { id: 'suf_emotion', label: '감정' },
                          { id: 'suf_desire', label: '내가 원하는 것' }, { id: 'suf_fear', label: '내가 두려워하는 것' },
                          { id: 'suf_interpretation', label: '나의 해석' }, { id: 'suf_word', label: '말씀' },
                          { id: 'suf_character', label: '하나님의 성품' }, { id: 'suf_gospel', label: '복음' },
                          { id: 'suf_repent', label: '회개' }, { id: 'suf_thanks', label: '감사' },
                          { id: 'suf_action', label: '오늘의 순종' }, { id: 'suf_community', label: '공동체 도움' }
                        ].map(f => (
                          <div key={f.id} className={`flex flex-col p-4 rounded-[16px] border shadow-sm ${isDark ? 'bg-black/30 border-white/5' : 'bg-white/50 border-white/60'}`}>
                            <label className={`text-[13.5px] font-black ${ui.textMain} mb-2.5`}>{f.label}</label>
                            <textarea 
                              value={forms[f.id] || ''} onChange={e => handleForm(f.id, e.target.value)}
                              className={`w-full p-3.5 rounded-xl text-[13px] font-medium resize-none h-20 outline-none border transition-all shadow-inner ${ui.inputBg}`} 
                              placeholder="기록하십시오..."
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 65.1 부교재 모듈 A */}
                    <div>
                      <h3 className={`text-[15px] font-black ${ui.textMain} mb-3 border-l-4 border-sky-500 pl-3`}>65.1 "다윗의 회개 4주" 심층 기록장</h3>
                      <p className={`text-[13px] font-medium mb-5 ${ui.textSub} leading-[1.7] break-keep`}>이성현 목사의 사무엘하 12장 연속 강해를 소그룹 모임용으로 재구성한 실습 모듈입니다.</p>

                      <div className="flex flex-col gap-4 w-full min-w-0">
                        {[
                          { w: 1, title: '당신이 그 사람이에요 (삼하 12:1-9)', q: '나에게 직언해 주는 사람이 있는가?', desc: '잠언 12:15, 19:20, 27:17을 읽고, 최근 1개월 내 흘려들은 권면을 기록하세요.' },
                          { w: 2, title: '정죄는 없으나 징계는 있다 (삼하 12:10-17)', q: '용서와 결과를 동시에 붙들고 있는가?', desc: '오류 C(감사하면 다 해결된다)를 경계하며 용서와 징계를 혼동하지 않는 연습을 적으세요.' },
                          { w: 3, title: '회복의 은혜 (삼하 12:18-23)', q: '상실 앞에서 원망하는가, 주권을 인정하는가?', desc: '주권의식과 주인의식을 나의 구체적 상황에 대입해 보세요.' },
                          { w: 4, title: '하나님의 사랑 (삼하 12:24-32)', q: '회개 후 누구의 아픔이 보이기 시작했는가?', desc: '이기주의에서 이타주의로의 전환. 이번 주 실천할 섬김을 적으세요.' }
                        ].map(wk => (
                          <div key={wk.w} className={`flex flex-col p-4.5 rounded-[16px] border shadow-sm w-full min-w-0 ${isDark ? 'bg-black/30 border-white/5' : 'bg-white/50 border-white/60'}`}>
                            <h4 className={`text-[14.5px] font-black ${ui.textMain} mb-1`}><span className={ui.primary}>WEEK {wk.w}</span> {wk.title}</h4>
                            <p className="text-[13px] font-bold text-sky-600 dark:text-sky-400 mb-1.5 break-keep">Q. {wk.q}</p>
                            <p className={`text-[12.5px] font-medium ${ui.textSub} mb-3 break-keep`}>{wk.desc}</p>
                            <textarea 
                              value={forms[`modA_${wk.w}`] || ''}
                              onChange={(e) => handleForm(`modA_${wk.w}`, e.target.value)}
                              className={`w-full p-4 rounded-xl border text-[13px] font-medium leading-[1.8] resize-y min-h-[100px] outline-none transition-all shadow-inner ${ui.inputBg}`}
                              placeholder="본문을 묵상하고 나의 고백과 결단을 적으십시오."
                            />
                            <button 
                              onPointerDown={(e) => { e.preventDefault(); syncToPipeline('apply', forms[`modA_${wk.w}`]); }}
                              className={`mt-3 self-end px-3.5 py-2 rounded-lg text-[12px] font-bold shadow-sm transition-transform active:scale-95 flex items-center gap-1.5 ${ui.btnPrimary}`}
                            >
                              <IconTarget /> 결단 내용을 적용 트래커로 전송
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>

      {/* 📝 주차별 훈련 일지 작성 팝업 모달 */}
      {activeGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in pointer-events-auto">
          <div className={`w-full max-w-md rounded-[32px] border p-6 flex flex-col shadow-2xl animate-fade-in-up ${isDark ? 'bg-[#121214] border-white/10' : 'bg-white border-zinc-200'}`}>
            <div className="flex justify-between items-start border-b pb-4 mb-4 border-dashed border-current opacity-60">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold tracking-widest uppercase text-sky-500 mb-1">Week {activeGameModal.w}</span>
                <h3 className={`text-[18px] font-black tracking-tight leading-snug break-keep ${ui.textMain}`}>{activeGameModal.title}</h3>
                <p className={`text-[12.5px] font-medium mt-1.5 ${ui.textSub}`}>{activeGameModal.desc}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-6">
              <label className={`text-[13px] font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>나의 깨달음과 삶의 결단</label>
              <textarea 
                value={gameNotes[activeGameModal.w] || ''}
                onChange={e => handleSaveGameNote(activeGameModal.w, e.target.value)}
                placeholder="이번 주차 강의를 듣고 내 삶에 어떻게 적용할 것인지 진실되게 기록하세요. (10자 이상 작성 시 완료 처리됩니다)"
                className={`w-full p-4 h-40 resize-none outline-none rounded-2xl text-[14px] font-medium leading-relaxed border transition-colors shadow-inner ${ui.inputBg}`}
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setActiveGameModal(null)} className={`flex-1 py-3.5 rounded-xl font-bold text-[13.5px] transition-colors ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}>
                닫기
              </button>
              <button 
                onClick={() => {
                  if ((gameNotes[activeGameModal.w] || '').trim().length > 10) {
                    setActiveGameModal(null);
                  } else {
                    alert('10자 이상 성실하게 기록해주셔야 훈련이 완료됩니다.');
                  }
                }} 
                className="flex-[2] py-3.5 rounded-xl font-bold text-[13.5px] bg-sky-600 hover:bg-sky-700 text-white shadow-md active:scale-95 transition-all"
              >
                훈련 일지 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🏆 12주 완주 수료증 및 축하 팝업 */}
      {showCertificate && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-fade-in pointer-events-auto">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <div className="w-[120vw] h-[120vw] bg-amber-500/20 blur-[100px] animate-pulse rounded-full" />
            <div className="absolute w-[80vw] h-[80vw] bg-yellow-300/20 blur-[80px] animate-spin-slow rounded-full" style={{ animationDuration: '10s' }} />
          </div>

          <div className="relative z-10 w-full max-w-sm bg-[#FFFDF7] rounded-[32px] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.5)] border-4 border-amber-200 flex flex-col items-center text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full flex items-center justify-center text-white border-4 border-white shadow-xl -mt-16 mb-5">
              <IconStar />
            </div>
            
            <h2 className="text-[12px] font-black text-amber-600 tracking-[0.3em] uppercase mb-2">Certificate of Completion</h2>
            <h1 className="text-[26px] font-black text-stone-900 leading-tight mb-4 font-serif">
              순례자의 길<br/>수료를 축하합니다!
            </h1>
            
            <div className="w-12 h-1 bg-amber-300 rounded-full mb-6" />

            <p className="text-[14px] font-medium text-stone-600 leading-[1.8] break-keep mb-8 font-serif">
              12주간의 긴 여정 동안 말씀 앞에 자신을 비추고, 감사의 훈련을 마친 귀하의 영적 성장을 진심으로 축하합니다.<br/><br/>
              이제 당신의 삶이 세상 속에서 거대한 숲을 이루는 축복의 씨앗이 되기를 기도합니다.
            </p>

            <div className="w-full bg-stone-50 border border-stone-200 p-4 rounded-2xl mb-6 text-left">
              <span className="text-[11px] font-bold text-stone-400 block mb-1">담임목사님의 메시지</span>
              <p className="text-[13px] font-bold text-stone-800 leading-relaxed italic">
                "끝까지 포기하지 않고 훈련의 자리를 지켜주셔서 감사합니다. 이제 배운 것을 공동체와 나누며 제자의 길을 힘차게 걸어가십시오!"
              </p>
            </div>

            <button 
              onClick={() => {
                setShowCertificate(false);
                localStorage.setItem('curriculum_cert_shown', 'true');
              }}
              className="w-full py-4 rounded-full bg-stone-900 hover:bg-black text-white font-bold text-[14.5px] shadow-lg active:scale-95 transition-transform"
            >
              감사함으로 받기
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
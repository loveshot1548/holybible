// src/pages/TrainingCurriculum.js
import React, { useState, useEffect } from 'react';

// =====================================================================
// 로컬 스토리지 헬퍼 (모든 입력 데이터 영구 저장 100% 무손실 보존)
// =====================================================================
const getLocal = (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const setLocal = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// =====================================================================
// ✒️ 전문 학술 툴바 정밀 헤어라인 SVG 아이콘 세트
// =====================================================================
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><polyline points="15 18 9 12 15 6" /></svg>;
const IconMenu = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const IconSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconChart = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const IconTarget = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const IconSend = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;
const IconLock = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><rect x="3" y="11" width="18" height="11" rx="1" ry="1"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconDiploma = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg>;

// 🌱 영적 성장 4단계 인장 아이콘 (Plant Seals)
const SeedIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 22c5.523 0 10-4.477 10-10 0-4.5-4-9-10-10C6 3 2 7.5 2 12c0 5.523 4.477 10 10 10z"/></svg>;
const SproutIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 22V12"/><path d="M12 12C7 12 4 7 4 7c0 5 3 9 8 9z"/><path d="M12 12c5 0 8-5 8-5 0 5-3 9-8 9z"/></svg>;
const SaplingIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 22V8"/><path d="M12 14c-4 0-6-3-6-3 0 4 2 6 6 6z"/><path d="M12 10c4 0 6-3 6-3 0 4-2 6-6 6z"/></svg>;
const TreeIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17 5c0-2.8-2.2-5-5-5S7 2.2 7 5c0 1.3.5 2.5 1.4 3.4C6.1 9.6 4 11.8 4 14.5 4 17.5 6.5 20 9.5 20h5c3 0 5.5-2.5 5.5-5.5 0-2.7-2.1-4.9-4.4-6.1C16.5 7.5 17 6.3 17 5z"/><path d="M11 20h2v4h-2z" fill="currentColor"/></svg>;

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

// 12주 순례자의 길 성장 로드맵 데이터
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

export default function TrainingCurriculum({ t, isDarkMode, setActiveScreen }) {
  // 🌟 에러 완치: 단일 불리언 isDark 선언 (_isDark 완전 소멸)
  const isDark = Boolean(t?.appBg?.includes('dark') || t?.appBg?.includes('121212') || isDarkMode);

  // 상단 6대 원본 탭 체계 100% 보존
  const [activeTab, setActiveTab] = useState('path'); // 'path' | 'overview' | 'protocols' | 'curriculum' | 'gimpo' | 'appendix'
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // 12주 순례자의 길 및 모든 작성 폼 로컬스토리지 상태 보존
  const [checks, setChecks] = useState(() => getLocal('tc_final_checks_v6', {}));
  const [forms, setForms] = useState(() => getLocal('tc_final_forms_v6', {}));
  const [weeklyCheck, setWeeklyCheck] = useState(() => getLocal('tc_final_weekly_v6', {}));
  const [rubrics, setRubrics] = useState(() => getLocal('tc_final_rubrics_v6', { word: 3, reflect: 3, apply: 3, community: 3, reproduce: 3 }));

  const [completedWeeks, setCompletedWeeks] = useState([]);
  const [gameNotes, setGameNotes] = useState(() => getLocal('diary_curriculum_notes', {}));
  const [activeGameModal, setActiveGameModal] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    const completed = [];
    for (let i = 1; i <= 12; i++) {
      if (gameNotes[i] && gameNotes[i].trim().length > 10) completed.push(i);
    }
    setCompletedWeeks(completed);
  }, [gameNotes]);

  useEffect(() => setLocal('tc_final_checks_v6', checks), [checks]);
  useEffect(() => setLocal('tc_final_forms_v6', forms), [forms]);
  useEffect(() => setLocal('tc_final_weekly_v6', weeklyCheck), [weeklyCheck]);
  useEffect(() => setLocal('tc_final_rubrics_v6', rubrics), [rubrics]);

  const toggleCheck = (k) => setChecks(p => ({ ...p, [k]: !p[k] }));
  const toggleWeekly = (k) => setWeeklyCheck(p => ({ ...p, [k]: !p[k] }));
  const handleForm = (k, v) => setForms(p => ({ ...p, [k]: v }));
  const handleRubric = (k, v) => setRubrics(p => ({ ...p, [k]: parseInt(v) }));

  const handleSaveGameNote = (w, content) => {
    const nextNotes = { ...gameNotes, [w]: content };
    setGameNotes(nextNotes);
    setLocal('diary_curriculum_notes', nextNotes);
    if (content.trim().length > 10) {
      if (!completedWeeks.includes(w)) {
        const nextCompleted = [...completedWeeks, w];
        setCompletedWeeks(nextCompleted);
        if (w === 12 && localStorage.getItem('curriculum_cert_shown') !== 'true') {
          setTimeout(() => setShowCertificate(true), 400);
        }
      }
    } else {
      setCompletedWeeks(completedWeeks.filter(item => item !== w));
    }
  };

  const getPlantIcon = (w, isCompleted) => {
    if (!isCompleted) return <IconLock />;
    if (w <= 3) return <SeedIcon />;
    if (w <= 6) return <SproutIcon />;
    if (w <= 9) return <SaplingIcon />;
    return <TreeIcon />;
  };

  // 📖 로고스 학술 테마 톤앤매너 팔레트 (설교분석 스크린샷 톤 일치)
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

  // 5대 영적 파이프라인 연동 함수 (100% 무손실 보존)
  const syncToPipeline = (type, payload) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      if (type === 'prayer') {
        if(!payload || !payload.trim()) return alert('작성된 내용이 없습니다.');
        const saved = JSON.parse(localStorage.getItem('globalPrayers') || '[]');
        saved.push({ id: Date.now(), text: payload.trim(), status: 'praying' });
        localStorage.setItem('globalPrayers', JSON.stringify(saved));
        alert('기도 보관함으로 등록되었습니다!');
      } else if (type === 'apply') {
        if(!payload || !payload.trim()) return alert('작성된 내용이 없습니다.');
        const saved = JSON.parse(localStorage.getItem('apply_tracker_items') || '[]');
        saved.push({ id: `tc_${Date.now()}`, date: today, source: 'tc', text: payload.trim(), completed: false });
        localStorage.setItem('apply_tracker_items', JSON.stringify(saved));
        alert('적용 트래커에 행동 과제로 등록되었습니다!');
      } else if (type === 'weekly_checks') {
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

  // 상단 6대 탭 바인더 정의
  const TABS = [
    { id: 'path', code: '§ 0', label: '12주 순례자의 길' },
    { id: 'overview', code: '§ Ⅰ', label: '제자훈련 신학개관' },
    { id: 'protocols', code: '§ Ⅱ', label: '해석 프로토콜' },
    { id: 'curriculum', code: '§ Ⅲ', label: '주차별 실천 과제' },
    { id: 'gimpo', code: '§ Ⅳ', label: '79편 설교 코퍼스' },
    { id: 'appendix', code: '§ Ⅴ', label: '종합 실전 양식' }
  ];

  const currentWeekMeta = GAMIFIED_PATH_DATA.find(w => w.w === selectedWeek) || GAMIFIED_PATH_DATA[0];

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden select-none relative ${bgMain} w-full`}>
      
      {/* ── 1. 학술 헤더 바 (Logos Command Strip) ── */}
      <header className={`relative z-20 px-3 sm:px-4 py-2 flex items-center justify-between border-b shrink-0 ${borderRule} ${isDark ? 'bg-[#161A20]' : 'bg-[#EFECE4]'}`}>
        <div className="flex items-center gap-2 min-w-0">
          <button 
            onClick={() => setActiveScreen && setActiveScreen('home')} 
            className={`p-1 rounded-sm transition-colors cursor-pointer shrink-0 border ${
              isDark ? 'border-[#2D333F] text-[#C5CDD7] hover:bg-[#20252E]' : 'border-[#D8D0C3] text-[#4A5568] hover:bg-[#E5E0D5]'
            }`}
            title="홈 화면"
          >
            <IconArrowLeft />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-none font-mono ${
              isDark ? 'bg-[#7A2E26]/30 text-[#FCA5A5] border border-[#7A2E26]' : 'bg-[#7A2E26] text-white'
            }`}>
              CURRICULUM
            </span>
            <div className="flex flex-col min-w-0">
              <h1 className={`text-[13px] sm:text-[14px] font-bold tracking-tight truncate ${textHead}`} style={fontSans}>
                실천신학 제자훈련 커리큘럼 아카이브
              </h1>
              <span className={`text-[9.5px] font-mono tracking-wider uppercase ${textMuted}`}>
                DISCIPLESHIP MONOGRAPH ARCHIVE
              </span>
            </div>
          </div>
        </div>

        {/* 상단 6대 원본 탭 바인더 */}
        <div className="flex items-center border border-inherit bg-transparent p-0.5 overflow-x-auto hide-scrollbar" style={fontSans}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 sm:px-3 py-1 text-[11.5px] font-bold cursor-pointer whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? (isDark ? 'bg-[#7A2E26] text-white' : 'bg-[#1B365D] text-white shadow-xs')
                  : (isDark ? 'text-[#848E9B] hover:text-white' : 'text-[#5A6578] hover:text-black')
              }`}
            >
              <span className="font-mono text-[10px] opacity-70 mr-1">{tab.code}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── 2. 메인 워크스페이스 프레임 (설교분석 2열 레이아웃 완벽 차용) ── */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row w-full max-w-7xl mx-auto min-w-0">

        {/* ── [좌측 패널: 설교분석의 제자훈련 지표 사이드바 스타일 차용] ── */}
        <aside className={`w-full md:w-72 shrink-0 border-b md:border-b-0 md:border-r ${borderRule} p-3 overflow-y-auto hide-scrollbar flex flex-col gap-3 ${isDark ? 'bg-[#14181E]' : 'bg-[#F5F2EB]'}`}>
          
          <div className="flex items-center justify-between pb-1 border-b border-inherit">
            <span className={`text-[12.5px] font-bold ${textHead}`} style={fontSans}>제자훈련 지표</span>
            <span className={`text-[10px] px-1.5 py-0.5 border flex items-center gap-1 font-mono ${subBox}`}>
              <IconLock /> 일반 모드
            </span>
          </div>

          {/* 12주차 순례자의 길 마스터 선택 그리드 */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1.5" style={fontSans}>
              <span className={`font-bold ${textMuted}`}>12주차 마스터 코스</span>
              <span className="font-bold text-[#7A2E26] dark:text-[#F87171]">{selectedWeek}주차 선택됨</span>
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
                { label: '평가 체크', val: `${Object.values(checks).filter(Boolean).length}개` },
                { label: '설교 코퍼스', val: `${SERMON_DATA.length}편` },
                { label: '실천 일지', val: `${Object.values(forms).filter(Boolean).length}건` }
              ].map(stat => (
                <div key={stat.label} className={`p-2 border text-center ${cardBox}`}>
                  <span className={`block text-[10px] ${textMuted}`}>{stat.label}</span>
                  <strong className={`text-[13px] ${textHead}`}>{stat.val}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* 영적 성장 5대 밸런스 */}
          <div className={`p-2.5 border ${cardBox}`}>
            <span className={`text-[11px] font-bold block mb-2 ${textHead}`} style={fontSans}>영적 성장 5대 밸런스</span>
            <div className="space-y-1.5 text-[11px]" style={fontSans}>
              {[
                { label: '말씀 (Word)', pct: 100 },
                { label: '기도 (Prayer)', pct: 80 },
                { label: '예배 (Worship)', pct: 5 },
                { label: '교제 (Fellowship)', pct: 100 },
                { label: '사역 (Ministry)', pct: 5 }
              ].map(b => (
                <div key={b.label}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className={textMuted}>{b.label}</span>
                    <span className="font-mono font-bold text-[#7A2E26] dark:text-[#F87171]">{b.pct}%</span>
                  </div>
                  <div className="w-full h-1 bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div 
                      style={{ width: `${b.pct}%` }} 
                      className={`h-full ${isDark ? 'bg-[#7A2E26]' : 'bg-[#1B365D]'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4주 심화 워크북 이동 버튼 */}
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

        {/* ── [우측 캔버스: 설교분석의 에디토리얼 워크스페이스 스타일 차용] ── */}
        <section className="flex-1 overflow-y-auto hide-scrollbar p-3 sm:p-5 flex flex-col gap-3.5">

          {/* ════════ § 0. 12주 순례자의 길 ════════ */}
          {activeTab === 'path' && (
            <div className="flex flex-col gap-3">
              <div className="pb-2 border-b border-inherit">
                <span className="font-mono text-[10.5px] font-bold text-[#7A2E26] dark:text-[#F87171] uppercase" style={fontSans}>
                  DISCIPLESHIP FORMATION • WEEK {currentWeekMeta.w}
                </span>
                <h2 className={`text-[17px] sm:text-[19px] font-bold tracking-tight mt-0.5 ${textHead}`} style={fontSerif}>
                  {currentWeekMeta.title}
                </h2>
                <div className="flex items-center gap-1.5 text-[12px] text-slate-500 mt-1" style={fontSans}>
                  <IconBook />
                  <span className="font-medium">{currentWeekMeta.desc}</span>
                </div>
              </div>

              {/* 설교분석 스타일 2단 콘텍스트 카드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className={`p-3 border ${subBox}`}>
                  <span className={`text-[9.5px] font-mono font-bold uppercase tracking-wider block mb-1 text-[#7A2E26] dark:text-[#F87171]`} style={fontSans}>
                    ACADEMIC CONTEXT
                  </span>
                  <p className={`text-[12px] leading-relaxed ${textBody} break-keep`} style={fontSerif}>
                    {selectedWeek <= 3 && "제자도의 시작은 감사의 왜곡과 불평의 구조를 파악하고, 말씀의 거울 앞에 정직히 서는 관찰 훈련입니다."}
                    {selectedWeek > 3 && selectedWeek <= 6 && "사건과 내 해석을 분리하며, 내 인생 고난 지도를 그리고 축복의 약재로 재해석하는 단계입니다."}
                    {selectedWeek > 6 && selectedWeek <= 9 && "고난 속에서 내 죄와 우상을 직면하고, 공동체 안에서 정직하게 고백하며 회개의 열매를 맺습니다."}
                    {selectedWeek > 9 && "성경 인물(다윗, 욥, 바울)을 통해 고난을 간증으로 바꾸고, 다른 사람을 세우는 감사하는 제자로 살아갑니다."}
                  </p>
                </div>
                <div className={`p-3 border ${subBox}`}>
                  <span className={`text-[9.5px] font-mono font-bold uppercase tracking-wider block mb-1 text-[#1B365D] dark:text-[#93C5FD]`} style={fontSans}>
                    PRACTICE PRINCIPLE
                  </span>
                  <p className={`text-[12px] leading-relaxed ${textBody} break-keep`} style={fontSerif}>
                    환경과 사람 탓을 멈추고 "하나님 때문에" 감사하며, 묵상 → 자기발견 → 회개 → 순종 → 공동체 나눔의 패턴을 체화합니다.
                  </p>
                </div>
              </div>

              {/* 제자도 핵심 점검 질문 */}
              <div className={`p-3 border ${cardBox}`}>
                <span className={`text-[11.5px] font-bold block mb-2 ${textHead}`} style={fontSans}>
                  제자도 핵심 점검 질문
                </span>
                <div className="space-y-1.5">
                  <div className={`p-2 border flex items-start gap-2 ${subBox}`}>
                    <span className="w-4 h-4 border shrink-0 flex items-center justify-center font-mono text-[10px] font-bold bg-[#7A2E26] text-white mt-0.5">1</span>
                    <p className={`text-[12px] leading-relaxed ${textBody} break-keep`} style={fontSerif}>
                      {selectedWeek}주차 주제({currentWeekMeta.title}) 앞에서 내가 인정하기 싫은 나의 연약함과 죄는 무엇입니까?
                    </p>
                  </div>
                  <div className={`p-2 border flex items-start gap-2 ${subBox}`}>
                    <span className="w-4 h-4 border shrink-0 flex items-center justify-center font-mono text-[10px] font-bold bg-[#7A2E26] text-white mt-0.5">2</span>
                    <p className={`text-[12px] leading-relaxed ${textBody} break-keep`} style={fontSerif}>
                      이번 주 말씀에 근거하여 오늘 즉시 실천할 수 있는 구체적인 한 가지 순종 행동은 무엇입니까?
                    </p>
                  </div>
                </div>
              </div>

              {/* 주차별 심층 신학 논고 / 일지 작성기 (자동 저장) */}
              <div className={`p-3 border ${cardBox}`}>
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-inherit" style={fontSans}>
                  <span className={`text-[11.5px] font-bold ${textHead}`}>주차별 훈련 성찰 일지</span>
                  <span className={`text-[10px] font-mono ${completedWeeks.includes(selectedWeek) ? 'text-emerald-500 font-bold' : textMuted}`}>
                    {completedWeeks.includes(selectedWeek) ? '✓ 완료 승인됨' : '10자 이상 작성 시 완료 승인'}
                  </span>
                </div>
                <textarea
                  value={gameNotes[selectedWeek] || ''}
                  onChange={(e) => handleSaveGameNote(selectedWeek, e.target.value)}
                  placeholder="이번 주차 훈련을 통해 깨달은 죄와 하나님의 은혜, 그리고 구체적인 결단을 기록하세요..."
                  className={`w-full p-2.5 h-32 text-[12.5px] leading-relaxed resize-y outline-none ${inputStyle}`}
                  style={fontSerif}
                />
              </div>

              {/* 12주 전체 타임라인 미니 바인더 */}
              <div className={`p-3 border ${cardBox}`}>
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-inherit" style={fontSans}>
                  <span className={`text-[11.5px] font-bold ${textHead}`}>12주 형성 타임라인 현황</span>
                  <span className="text-[10.5px] font-mono text-[#7A2E26] dark:text-[#F87171] font-bold">
                    ({completedWeeks.length} / 12 완료)
                  </span>
                </div>
                <div className="space-y-1">
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
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 border ${isDone ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold' : 'text-slate-400 border-transparent'}`}>
                          {isDone ? 'DONE' : 'OPEN'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ════════ § Ⅰ. 제자훈련 신학개관 ════════ */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-3">
              <div className="pb-2 border-b border-inherit">
                <span className="font-mono text-[10.5px] font-bold text-[#7A2E26] dark:text-[#F87171] uppercase" style={fontSans}>
                  CANONICAL FOUNDATION • § Ⅰ
                </span>
                <h2 className={`text-[17px] sm:text-[19px] font-bold tracking-tight mt-0.5 ${textHead}`} style={fontSerif}>
                  제자훈련 신학개관 및 15대 핵심 발견 규정
                </h2>
              </div>

              {/* 15대 신규 핵심 발견 카드 그리드 */}
              <div className={`p-3 border ${cardBox}`}>
                <span className={`text-[11.5px] font-bold block mb-2 ${textHead}`} style={fontSans}>
                  0. 이번 2판에서 새롭게 확인한 핵심 (15대 규정)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {[
                    "1. 공식 T스쿨 단계: 새가족 1주 → THINK 기초 6주 → THINK 양육 10주 → THINK 교사 10주 → 예비목자 20주.",
                    "2. 단순 성경지식 전달이 아니라 서로 삶을 나누고 그리스도를 본받는 훈련.",
                    "3. 양육자 1명과 동반자 2~3명으로 10주간 6대 과제(주제큐티·독후감·생활숙제·설교요약·매일큐티·세팅봉사) 수행.",
                    "4. 주제큐티는 제목 → 요약 → 질문 → 묵상 → 적용 → 기도로 구성.",
                    "5. 생활숙제는 간증문, 시간관리, 성령으로 감정 다스린 경험 요구.",
                    "6. 설교과제는 대지를 구분하고 설교내용을 옮긴 뒤 느낀점 기록.",
                    "7. 큐티요약은 QTin을 활용하여 매일 큐티하고 기록.",
                    "8. 세팅봉사는 훈련기간 중 예배 세팅과 청소 등에 자발적 참여.",
                    "9. 수료자는 10주 THINK 양육교사 심화과정으로 진입.",
                    "10. 예비목자양육 I·II 총 20주를 통해 목장 리더를 세우는 재생산 구조.",
                    "11. 2026년 상반기 공지: 4·8·10과 교체 및 신규 3강의 추가.",
                    "12. 2026년 개정판 본문: 4과 삼하7장, 8과 롬3장, 10과 롬9장 변경.",
                    "13. 2026년 개정 목차: 신앙고백, 시간관리, 큐티, 기도, 하나님, 예수님, 성령님, 거듭남, 믿음, 영혼구원.",
                    "14. THINK 목표: 사건을 해석하여 '말씀대로 믿고 살고 누리는 성도' 형성.",
                    "15. 생각을 바르게 하면 감사가 나오고 영혼구원 사명 발견."
                  ].map((r, i) => (
                    <div key={i} className={`p-2 border ${subBox} flex items-start gap-1.5`}>
                      <span className="font-mono text-[10px] font-bold text-[#7A2E26] dark:text-[#F87171] shrink-0 mt-0.5">[{String(i+1).padStart(2,'0')}]</span>
                      <p className={`text-[12px] leading-relaxed ${textBody} break-keep`} style={fontSerif}>{r.slice(r.indexOf('.') + 2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 연구자료 등급 & 양육 시스템 구조표 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className={`p-3 border ${subBox}`}>
                  <span className={`text-[9.5px] font-mono font-bold uppercase tracking-wider block mb-1 text-[#7A2E26] dark:text-[#F87171]`} style={fontSans}>1. 연구자료 등급 (A~D)</span>
                  <div className="space-y-1 text-[11.5px]" style={fontSans}>
                    <p><strong>A:</strong> 공식 홈페이지, T스쿨, QTM 교재, 공식 유튜브</p>
                    <p><strong>B:</strong> 공식기관 안내 외부자료, 세미나/인터뷰 안내</p>
                    <p><strong>C:</strong> 웨스트민스터 신앙고백, 장로교 신학문헌</p>
                    <p><strong>D:</strong> 연구자 재구성 교육모델 (본 문서 모델/프로토콜)</p>
                  </div>
                </div>
                <div className={`p-3 border ${subBox}`}>
                  <span className={`text-[9.5px] font-mono font-bold uppercase tracking-wider block mb-1 text-[#1B365D] dark:text-[#93C5FD]`} style={fontSans}>2. 양육 시스템 로드맵 & 핵심원리</span>
                  <div className="space-y-1 text-[11.5px]" style={fontSerif}>
                    <p><strong>기초양육(무엇을 믿는가?):</strong> 하나님 → 구속 → 믿음 → 예배 → 말씀/기도 → 공동체</p>
                    <p><strong>THINK양육(어떻게 사는가?):</strong> 고백 → 시간 → 큐티 → 기도 → 성령 → 거듭남 → 사명</p>
                  </div>
                </div>
              </div>

              {/* 수료자 15대 제자도 자격 검증표 */}
              <div className={`p-3 border ${cardBox}`}>
                <span className={`text-[11.5px] font-bold block mb-2 ${textHead}`} style={fontSans}>
                  48. 최종 제자도 자격 검증표 (클릭하여 체크)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {[
                    {k:'m1', t:'복음을 설명할 수 있다.'}, {k:'m2', t:'자신의 신앙고백을 할 수 있다.'},
                    {k:'m3', t:'성경을 문맥 속에서 읽는다.'}, {k:'m4', t:'QT를 지속한다.'},
                    {k:'m5', t:'사건과 자기 해석을 구별한다.'}, {k:'m6', t:'자신의 죄를 볼 수 있다.'},
                    {k:'m7', t:'회개를 행동으로 연결한다.'}, {k:'m8', t:'고난을 함부로 단정하지 않는다.'},
                    {k:'m9', t:'감사가 결과가 아니라 하나님을 향한다.'}, {k:'m10', t:'공동체에 삶을 나눌 수 있다.'},
                    {k:'m11', t:'다른 사람을 돌볼 수 있다.'}, {k:'m12', t:'실제로 섬긴다.'},
                    {k:'m13', t:'영혼구원의 사명을 이해한다.'}, {k:'m14', t:'한 사람을 제자로 세울 수 있다.'},
                    {k:'m15', t:'자신이 없어져도 제자화가 계속되도록 세운다.'}
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

              {/* 49. 지도자 선언 */}
              <div className={`p-3 border-l-2 border-[#7A2E26] ${subBox} text-[12.5px] leading-relaxed italic ${textBody}`} style={fontSerif}>
                "나는 성도에게 내 답을 주는 사람이 아니라 성도가 말씀 앞에서 하나님을 만나도록 돕는 사람이다. 나는 성도의 고난을 함부로 해석하지 않는다. 나는 성도의 죄를 이용하지 않는다. 나는 성도의 고백을 안전하게 다룬다. 나는 말씀을 삶에 연결하며 적용을 구체화한다."
              </div>
            </div>
          )}

          {/* ════════ § Ⅱ. 해석 프로토콜 ════════ */}
          {activeTab === 'protocols' && (
            <div className="flex flex-col gap-3">
              <div className="pb-2 border-b border-inherit">
                <span className="font-mono text-[10.5px] font-bold text-[#7A2E26] dark:text-[#F87171] uppercase" style={fontSans}>
                  HERMENEUTICS & PROTOCOL • § Ⅱ
                </span>
                <h2 className={`text-[17px] sm:text-[19px] font-bold tracking-tight mt-0.5 ${textHead}`} style={fontSerif}>
                  고난 해석 12단계 및 감사의 5단계 프로토콜
                </h2>
              </div>

              {/* 16. 고난 해석 12단계 순서도 */}
              <div className={`p-3 border ${cardBox}`}>
                <span className={`text-[11.5px] font-bold block mb-2 ${textHead}`} style={fontSans}>
                  16. 고난 해석 12단계 프로토콜 (Protocol 16)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {[
                    { s: '01', t: '사실 기록', d: '사건의 사실만 기록한다.' },
                    { s: '02', t: '감정 기록', d: '실존적 고통과 감정을 기록한다.' },
                    { s: '03', t: '내 해석', d: '내가 붙인 해석을 기록한다.' },
                    { s: '04', t: '상실 점검', d: '잃었다고 생각하는 것을 찾는다.' },
                    { s: '05', t: '우상 점검', d: '가져야 한다는 욕망을 찾는다.' },
                    { s: '06', t: '말씀 직면', d: '욕망과 두려움을 말씀 앞에 둔다.' },
                    { s: '07', t: '성품 확인', d: '하나님의 선하신 성품을 확인한다.' },
                    { s: '08', t: '복음 확인', d: '십자가 대속의 복음을 확인한다.' },
                    { s: '09', t: '죄 분별', d: '회개할 죄와 비책임을 구별한다.' },
                    { s: '10', t: '순종 결단', d: '오늘 순종할 한 가지를 정한다.' },
                    { s: '11', t: '공동체 도움', d: '목장에 도움을 요청하고 나눈다.' },
                    { s: '12', t: '해석 편집', d: '시간을 두고 다시 재편집한다.' }
                  ].map(item => (
                    <div key={item.s} className={`p-2 border ${subBox}`}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-mono text-[9.5px] font-bold text-[#7A2E26] dark:text-[#F87171]">STEP {item.s}</span>
                        <strong className={`text-[12px] ${textHead}`} style={fontSans}>{item.t}</strong>
                      </div>
                      <p className={`text-[11.5px] ${textMuted}`} style={fontSerif}>{item.d}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 15. 감사의 5단계 훈련 실습 */}
              <div className={`p-3 border ${cardBox}`}>
                <span className={`text-[11.5px] font-bold block mb-2 ${textHead}`} style={fontSans}>
                  15. 감사의 5단계 훈련 실습 대장
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                  {['1단계. 사실 감사 (실제로 받은 것)', '2단계. 은혜 감사 (왜 나에게 은혜인가)', '3단계. 하나님 감사 (하나님의 성품)', '4단계. 고난 속 감사 (원치 않는 결과 속 감사)', '5단계. 순종의 감사 (이번 주 순종 결단)'].map((step, i) => (
                    <div key={i} className={`p-1.5 border ${subBox}`}>
                      <label className={`text-[11px] font-bold ${textHead} block mb-0.5`} style={fontSans}>{step}</label>
                      <input 
                        type="text" 
                        value={forms[`thk_${i}`]||''} 
                        onChange={e => handleForm(`thk_${i}`, e.target.value)} 
                        placeholder="기록하십시오..." 
                        className={`w-full p-1 text-[11.5px] outline-none ${inputStyle}`}
                        style={fontSerif}
                      />
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => syncToPipeline('prayer', forms['thk_4'] || forms['thk_3'] || '감사 실습 내용')}
                  className={`w-full py-2 text-[12px] font-bold flex items-center justify-center gap-1 cursor-pointer border ${
                    isDark ? 'bg-[#202630] text-[#E6EDF3] border-[#364052]' : 'bg-[#EDE8DC] text-[#1A202C] border-[#CBC1AD]'
                  }`}
                  style={fontSans}
                >
                  <IconSend /> 작성 내역을 기도 보관함으로 전송
                </button>
              </div>

              {/* 17. 고난 왜곡 방지 8대 필터 */}
              <div className={`p-3 border ${cardBox}`}>
                <span className={`text-[11.5px] font-bold block mb-2 text-[#B91C1C] dark:text-[#F87171]`} style={fontSans}>
                  17. 고난 왜곡 방지 8대 필터 점검표
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {[
                    {k:'f1', t:'사건 원인을 내가 안다고 착각하지 않는가?'},
                    {k:'f2', t:'상대방 죄를 내 해석으로 단정하지 않는가?'},
                    {k:'f3', t:'하나님을 벌 주는 분으로만 보지 않는가?'},
                    {k:'f4', t:'나의 통제욕이 숨어 있지 않은가?'},
                    {k:'f5', t:'내 인정욕구가 숨어 있지 않은가?'},
                    {k:'f6', t:'성경본문을 억지로 끼워 맞추지 않는가?'},
                    {k:'f7', t:'실제적 도움과 치료를 거부하지 않는가?'},
                    {k:'f8', t:'하나님께 탄식할 권리를 막지 않는가?'}
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

          {/* ════════ § Ⅲ. 주차별 실천 과제 ════════ */}
          {activeTab === 'curriculum' && (
            <div className="flex flex-col gap-3">
              <div className="pb-2 border-b border-inherit">
                <span className="font-mono text-[10.5px] font-bold text-[#7A2E26] dark:text-[#F87171] uppercase" style={fontSans}>
                  PRACTICAL ASSIGNMENT • § Ⅲ
                </span>
                <h2 className={`text-[17px] sm:text-[19px] font-bold tracking-tight mt-0.5 ${textHead}`} style={fontSerif}>
                  주차별 실천 과제 및 루브릭 평가
                </h2>
              </div>

              {/* 19. 4주 집중과정 요람 */}
              <div className={`p-3 border ${cardBox}`}>
                <span className={`text-[11.5px] font-bold block mb-2 ${textHead}`} style={fontSans}>
                  19. 4주 집중과정 교과 요람
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { w: 1, t: '복음과 제자', k: '복음, 칭의, 성화, 신앙고백', p: '나의 신앙고백, 출애굽 간증 초안', a: '복음 요약, QT 3회, 간증 1편' },
                    { w: 2, t: '말씀과 삶의 해석', k: '성경, 구속사, 사건과 해석, 적용', p: '주제큐티, 설교분석, 사건 해석표', a: 'QT 5회, 설교 1편 분석, 생활적용 1개' },
                    { w: 3, t: '기도·감사·고난·회개', k: '말씀대로 기도, 감사, 고난, 회개', p: '감사일지, 고난해석 보고서, 회개', a: '7일 감사훈련, 고난사건 재해석, 기도문' },
                    { w: 4, t: '공동체·섬김·영혼구원', k: '교회, 섬김, 영혼구원, 제자화', p: '한 사람 돌봄, 실제 봉사, 제자화', a: '30일 중보기도, 섬김 1회, 90일 계획' }
                  ].map(item => (
                    <div key={item.w} className={`p-2.5 border ${subBox}`}>
                      <strong className={`text-[13px] text-[#7A2E26] dark:text-[#F87171] block mb-1`} style={fontSans}>WEEK {item.w}. {item.t}</strong>
                      <div className="space-y-0.5 text-[12px]" style={fontSerif}>
                        <p><strong className={textMuted}>핵심:</strong> {item.k}</p>
                        <p><strong className={textMuted}>실습:</strong> {item.p}</p>
                        <p><strong className={textHead}>과제:</strong> {item.a}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 33. 주간 8대 영적 규율 실천표 */}
              <div className={`p-3 border ${cardBox}`}>
                <span className={`text-[11.5px] font-bold block mb-2 ${textHead}`} style={fontSans}>
                  33. 주간 8대 영적 규율 실천 점검표 (월~일)
                </span>
                <div className="overflow-x-auto hide-scrollbar border border-inherit">
                  <table className="w-full text-center text-[12px] min-w-[440px]" style={fontSans}>
                    <thead>
                      <tr className={`${isDark ? 'bg-[#121519]' : 'bg-[#EAE5DC]'} border-b ${borderRule}`}>
                        <th className={`p-1 font-bold ${textHead} border-r ${borderRule}`}>항목</th>
                        {['월','화','수','목','금','토','일'].map(d => <th key={d} className={`p-1 font-bold ${textHead} border-r last:border-r-0 ${borderRule}`}>{d}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-inherit">
                      {['QT', '기도', '감사', '회개', '적용', '섬김', '관계회복', '복음'].map(item => (
                        <tr key={item}>
                          <td className={`p-1 font-bold border-r ${borderRule} ${textHead}`}>{item}</td>
                          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => {
                            const key = `w_${item}_${day}`;
                            const isChecked = Boolean(weeklyCheck[key]);
                            return (
                              <td key={day} className={`p-1 border-r last:border-r-0 ${borderRule}`}>
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
                  <IconSend /> 위 체크 내역을 오늘의 '영적 5종 세트'에 즉시 동기화
                </button>
              </div>

              {/* 35. 지도자 평가 루브릭 */}
              <div className={`p-3 border ${cardBox}`}>
                <span className={`text-[11.5px] font-bold block mb-2 ${textHead}`} style={fontSans}>
                  35. 지도자 평가 루브릭 5영역 (직접 평가)
                </span>
                <div className="space-y-1.5">
                  {[
                    { id: 'word', label: '말씀 (지식 없음 ~ 문맥/복음 연결)' },
                    { id: 'reflect', label: '자기성찰 (타인 탓 ~ 자신 먼저 직면)' },
                    { id: 'apply', label: '적용 (추상적 결심 ~ 구체적/측정가능 행동)' },
                    { id: 'community', label: '공동체 (자기 얘기만 ~ 경청/돌봄/세움)' },
                    { id: 'reproduce', label: '재생산 (훈련만 받음 ~ 다른 사람 제자화)' }
                  ].map(r => (
                    <div key={r.id} className={`p-2 border flex items-center justify-between gap-2 ${subBox}`}>
                      <span className={`text-[12px] font-bold ${textHead}`} style={fontSans}>{r.label}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono text-[12px] font-bold text-[#7A2E26] dark:text-[#F87171]">{rubrics[r.id]}점</span>
                        <input 
                          type="range" min="1" max="5" step="1" 
                          value={rubrics[r.id]||3} 
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

          {/* ════════ § Ⅳ. 코퍼스 심층분석 (79편 설교) ════════ */}
          {activeTab === 'gimpo' && (
            <div className="flex flex-col gap-3">
              <div className="pb-2 border-b border-inherit">
                <span className="font-mono text-[10.5px] font-bold text-[#7A2E26] dark:text-[#F87171] uppercase" style={fontSans}>
                  HOMILETIC CORPUS • § Ⅳ
                </span>
                <h2 className={`text-[17px] sm:text-[19px] font-bold tracking-tight mt-0.5 ${textHead}`} style={fontSerif}>
                  79편 설교 코퍼스 심층 분석 & 이성현 목사 목회신학
                </h2>
              </div>

              {/* 비교 연구 매트릭스 */}
              <div className={`p-3 border ${cardBox}`}>
                <span className={`text-[11.5px] font-bold block mb-2 ${textHead}`} style={fontSans}>
                  60. 김양재 목사(우리들) vs 이성현 목사(김포) 비교 연구 (Thesis 60)
                </span>
                <div className="w-full overflow-x-auto hide-scrollbar border border-inherit mb-2">
                  <table className="w-full text-left text-[11.5px] min-w-[500px]" style={fontSans}>
                    <thead>
                      <tr className={`${isDark ? 'bg-[#121519]' : 'bg-[#EAE5DC]'} border-b ${borderRule}`}>
                        <th className={`p-1.5 font-bold ${textHead} w-24 border-r ${borderRule}`}>차원</th>
                        <th className={`p-1.5 font-bold ${textHead} w-44 border-r ${borderRule}`}>김양재 목사 (우리들교회)</th>
                        <th className={`p-1.5 font-bold ${textHead}`}>이성현 목사 (김포좋은나무교회)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-inherit">
                      <tr>
                        <td className={`p-1.5 font-bold ${textHead} border-r ${borderRule}`}>교육공학</td>
                        <td className={`p-1.5 border-r ${borderRule} ${textBody}`} style={fontSerif}>절차화된 프로토콜 (5단계 감사 / 12단계 고난)</td>
                        <td className={`p-1.5 ${textBody}`} style={fontSerif}>정경적 서사 연결 (Lectio Continua 연속 강해)</td>
                      </tr>
                      <tr>
                        <td className={`p-1.5 font-bold ${textHead} border-r ${borderRule}`}>훈련 리듬</td>
                        <td className={`p-1.5 border-r ${borderRule} ${textBody}`} style={fontSerif}>10주 기수제 양육학교 (T스쿨)</td>
                        <td className={`p-1.5 ${textBody}`} style={fontSerif}>월례 5일 집중 기상오기 (특새 집중 훈련)</td>
                      </tr>
                      <tr>
                        <td className={`p-1.5 font-bold ${textHead} border-r ${borderRule}`}>신학 언어</td>
                        <td className={`p-1.5 border-r ${borderRule} ${textBody}`} style={fontSerif}>실존적·관계적 언어 ("내 죄 보기")</td>
                        <td className={`p-1.5 ${textBody}`} style={fontSerif}>조직신학적 언어 (원죄/형사죄, 정죄/징계 구분)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 79편 설교 DB 검색기 */}
              <div className={`p-3 border ${cardBox}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1.5 mb-2 border-b border-inherit" style={fontSans}>
                  <h3 className={`text-[12.5px] font-bold ${textHead}`}>79편 설교 아카이브 데이터베이스 검색</h3>
                  <div className={`flex items-center gap-1.5 px-2 py-1 border ${inputStyle}`}>
                    <IconSearch />
                    <input 
                      type="text" 
                      placeholder="본문, 제목, 키워드 검색..." 
                      value={searchTerm} 
                      onChange={e => setSearchTerm(e.target.value)}
                      className="bg-transparent outline-none text-[12px] w-44"
                    />
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto hide-scrollbar border border-inherit">
                  <table className="w-full text-left text-[11.5px]" style={fontSans}>
                    <thead>
                      <tr className={`${isDark ? 'bg-[#121519]' : 'bg-[#EAE5DC]'} border-b ${borderRule} sticky top-0`}>
                        <th className={`p-1.5 font-bold ${textHead} w-20 border-r ${borderRule}`}>일자</th>
                        <th className={`p-1.5 font-bold ${textHead} w-16 border-r ${borderRule}`}>구분</th>
                        <th className={`p-1.5 font-bold ${textHead} w-44 border-r ${borderRule}`}>설교 제목</th>
                        <th className={`p-1.5 font-bold ${textHead} w-32 border-r ${borderRule}`}>성경 본문</th>
                        <th className={`p-1.5 font-bold ${textHead}`}>핵심 키워드</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-inherit">
                      {SERMON_DATA.filter(s => s.title.includes(searchTerm) || s.verse.includes(searchTerm) || s.keywords.includes(searchTerm)).map((s, i) => (
                        <tr key={i} className="hover:bg-black/5 dark:hover:bg-white/5">
                          <td className={`p-1.5 font-mono text-[11px] border-r ${borderRule} ${textMuted}`}>{s.date}</td>
                          <td className={`p-1.5 font-bold border-r ${borderRule} ${textHead}`}>{s.type}</td>
                          <td className={`p-1.5 font-bold border-r ${borderRule} ${textHead}`} style={fontSerif}>{s.title}</td>
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

          {/* ════════ § Ⅴ. 종합 실전 양식 ════════ */}
          {activeTab === 'appendix' && (
            <div className="flex flex-col gap-3">
              <div className="pb-2 border-b border-inherit">
                <span className="font-mono text-[10.5px] font-bold text-[#7A2E26] dark:text-[#F87171] uppercase" style={fontSans}>
                  WORKSHEET & APPENDICES • § Ⅴ
                </span>
                <h2 className={`text-[17px] sm:text-[19px] font-bold tracking-tight mt-0.5 ${textHead}`} style={fontSerif}>
                  고난 해석 1페이지 양식 & 다윗의 회개 4주
                </h2>
              </div>

              {/* 고난 해석 1페이지 실습지 (12개 입력필드) */}
              <div className={`p-3 border ${cardBox}`}>
                <span className={`text-[11.5px] font-bold block mb-2 ${textHead}`} style={fontSans}>
                  부록 2. 고난 해석 1페이지 표준 실습 기록지 (12문항)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {[
                    { id: 'suf_fact', label: '1. 사실 (발생한 사건 객관적 기록)' },
                    { id: 'suf_emotion', label: '2. 감정 (당시 나의 실존적 감정)' },
                    { id: 'suf_desire', label: '3. 내가 원하는 것 (통제욕/인정욕)' },
                    { id: 'suf_fear', label: '4. 내가 두려워하는 것' },
                    { id: 'suf_interpretation', label: '5. 나의 기존 해석' },
                    { id: 'suf_word', label: '6. 비추어 본 성경 말씀' },
                    { id: 'suf_character', label: '7. 확인한 하나님의 성품' },
                    { id: 'suf_gospel', label: '8. 십자가 복음의 은혜' },
                    { id: 'suf_repent', label: '9. 나의 회개 제목' },
                    { id: 'suf_thanks', label: '10. 사건 속 하나님의 감사' },
                    { id: 'suf_action', label: '11. 오늘 순종할 한 가지 행동' },
                    { id: 'suf_community', label: '12. 공동체에 요청할 도움' }
                  ].map(f => (
                    <div key={f.id} className={`p-1.5 border ${subBox}`}>
                      <label className={`text-[11px] font-bold ${textHead} block mb-0.5`} style={fontSans}>{f.label}</label>
                      <textarea 
                        value={forms[f.id] || ''} 
                        onChange={e => handleForm(f.id, e.target.value)}
                        className={`w-full p-1 text-[11.5px] leading-relaxed resize-none h-12 outline-none ${inputStyle}`}
                        placeholder="기록하십시오..."
                        style={fontSerif}
                      />
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => syncToPipeline('apply', forms['suf_action'] || '고난 해석 순종 과제')}
                  className={`w-full mt-2 py-2 text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border ${
                    isDark ? 'bg-[#202630] text-[#E6EDF3] border-[#364052]' : 'bg-[#EDE8DC] text-[#1A202C] border-[#CBC1AD]'
                  }`}
                  style={fontSans}
                >
                  <IconTarget /> 위 11번 순종 결단을 적용 트래커 플래너로 전송
                </button>
              </div>

              {/* 다윗의 회개 4주 소그룹 강독 */}
              <div className={`p-3 border ${cardBox}`}>
                <span className={`text-[11.5px] font-bold block mb-2 ${textHead}`} style={fontSans}>
                  65.1 부교재 모듈 A: "다윗의 회개 4주" 심층 기록장 (삼하 12장)
                </span>
                <div className="space-y-1.5">
                  {[
                    { w: 1, title: '당신이 그 사람이에요 (삼하 12:1-9)', q: '나에게 직언해 주는 사람이 있는가?', desc: '잠 12:15를 읽고, 최근 흘려들은 권면을 기록하세요.' },
                    { w: 2, title: '정죄는 없으나 징계는 있다 (삼하 12:10-17)', q: '용서와 결과를 동시에 붙들고 있는가?', desc: '용서와 징계를 혼동하지 않는 연습을 적으세요.' },
                    { w: 3, title: '회복의 은혜 (삼하 12:18-23)', q: '상실 앞에서 원망하는가, 주권을 인정하는가?', desc: '주권의식과 주인의식을 대입해 보세요.' },
                    { w: 4, title: '하나님의 사랑 (삼하 12:24-32)', q: '회개 후 누구의 아픔이 보이기 시작했는가?', desc: '이타주의로의 전환. 실천할 섬김을 적으세요.' }
                  ].map(wk => (
                    <div key={wk.w} className={`p-2 border ${subBox}`}>
                      <div className="flex items-center justify-between mb-0.5">
                        <strong className={`text-[12px] text-[#7A2E26] dark:text-[#F87171]`} style={fontSans}>WEEK {wk.w}. {wk.title}</strong>
                        <span className="text-[10.5px] text-slate-500" style={fontSans}>Q. {wk.q}</span>
                      </div>
                      <p className={`text-[11px] ${textMuted} mb-1`} style={fontSerif}>{wk.desc}</p>
                      <textarea 
                        value={forms[`modA_${wk.w}`] || ''}
                        onChange={(e) => handleForm(`modA_${wk.w}`, e.target.value)}
                        className={`w-full p-1.5 text-[11.5px] leading-relaxed resize-none h-14 outline-none ${inputStyle}`}
                        placeholder="본문을 묵상하고 나의 고백과 결단을 적으십시오."
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

      {/* ── 3. 정식 수료 인준서 모달 (Testimonium Disciplinae) ── */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-[#FFFDF8] border-4 border-[#7A2E26] p-6 text-center text-[#1A202C] shadow-2xl relative">
            <div className="border border-[#7A2E26]/40 p-5 space-y-3">
              <div className="text-[10px] font-mono tracking-[0.25em] text-[#7A2E26] font-bold uppercase">
                TESTIMONIUM FORMATIONIS THEOLOGICAE
              </div>
              <h1 className="text-[20px] font-bold text-[#1A202C] tracking-tight" style={fontSerif}>
                제자도 형성 연대기 수료 증서
              </h1>
              <div className="w-12 h-0.5 bg-[#7A2E26] mx-auto" />
              <p className="text-[12.5px] leading-[1.8] text-[#334155] break-keep font-normal" style={fontSerif}>
                귀하는 12주간의 긴 여정 동안 말씀 앞에 자신을 세우고, 사건 속에서 하나님의 성품을 발견하며 감사의 실천 훈련을 성실히 이수하였으므로 본 증서를 수여합니다.
              </p>
              <button 
                onClick={() => {
                  setShowCertificate(false);
                  localStorage.setItem('curriculum_cert_shown', 'true');
                }}
                className="w-full py-2 bg-[#7A2E26] hover:bg-[#682720] text-white text-[12px] font-bold cursor-pointer"
                style={fontSans}
              >
                인준 확인 및 서약
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
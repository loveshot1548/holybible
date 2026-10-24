// src/components/AppGuidebook.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';

// =====================================================================
// 🎨 모던 아카데믹 & 시청각 시스템 벡터 아이콘 세트
// =====================================================================
const StrokeW = "1.8";
const IconArrowLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const IconMenu = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
const IconBook = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const IconTarget = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
const IconUsers = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconSparkles = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>;
const IconChevronRight = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5"><polyline points="9 18 15 12 9 6" /></svg>;
const IconCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12" /></svg>;
const IconMic = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>;
const IconActivity = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
const IconMessage = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.269z" /></svg>;
const IconCompass = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>;
const IconShield = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
const IconBriefcase = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const IconCalculator = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01"/></svg>;
const IconWand = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>;
const IconAcademic = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={StrokeW} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-5.25 6.557c1.77.65 3.65 1.05 5.25 1.18" /></svg>;
const IconVolume = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>;

// =====================================================================
// 📋 12대 가이드 탭 마스터 정의 (지식 은하계 신규 추가 + 기존 11개 탭 100% 보존)
// =====================================================================
const GUIDE_TABS = [
  {
    id: 'galaxyGuide',
    shortLabel: '🌌 지식 은하계 & 아크',
    label: '🌌 지식 은하계 & 구속사 아크 바이블',
    badge: 'NEW 4-MODE',
    targetScreen: 'galaxy',
    targetBtnLabel: '지식 은하계 바로 열기',
    easySummary: '성경 66권(1,189장)이 예수님 안에서 어떻게 하나로 연결되는지 무지개 다리(아크)와 우주 별자리(2D·3D)로 눈으로 보고, 터치 한 번에 그 성경 구절로 이동하는 입체 성경 지도입니다.',
    ttsScript: '지식 은하계와 구속사 아크 안내입니다. 성경 66권이 예수님 안에서 어떻게 연결되는지 무지개 선으로 보여줍니다. 선이나 하단 구절 카드를 누르면 해당 성경 본문으로 즉시 이동하며, 내가 쓴 큐티와 설교 노트도 별자리처럼 실시간으로 떠오릅니다.',
    missions: [
      { id: 'm_gal_1', text: '지식 은하계에서 [🌈 아크] 모드의 황금색 무지개 선 하나를 손가락으로 터치해 보기', screen: 'galaxy' },
      { id: 'm_gal_2', text: '하단 양피지 카드에서 [열기➔] 또는 [팝업] 버튼을 눌러 성경 말씀 직접 읽어보기', screen: 'galaxy' },
      { id: 'm_gal_3', text: '상단 [🌌 2D] 또는 [🪐 3D]를 눌러 내 QT와 설교 별자리 돌려보기', screen: 'galaxy' }
    ]
  },
  {
    id: 'interlinearSuite',
    shortLabel: '🏛️ 원어성경 10-Core',
    label: '🏛️ 원어성경 연구 10-Core 바이블',
    badge: 'BHS · NA28',
    targetScreen: 'interlinear',
    targetBtnLabel: '원어 연구실 바로 열기',
    easySummary: '성경이 처음 기록된 히브리어와 헬라어 단어 뜻을 하나씩 쉽게 풀어주고, 버튼 하나로 내 큐티 노트에 쏙 넣어주는 성경 돋보기입니다.',
    ttsScript: '원어 성경 연구실 안내입니다. 성경통독이나 맥체인을 읽다가 구절 끝의 원어 버튼을 누르면, 히브리어와 헬라어 단어 뜻과 발음을 쉽게 알려줍니다. 하단의 큐티 삽입 버튼을 누르면 내 노트에 자동으로 기록됩니다.',
    missions: [
      { id: 'm_int_1', text: '성경통독이나 원어 연구실에서 궁금한 단어 카드를 한 번 터치해 뜻과 발음 확인하기', screen: 'interlinear' },
      { id: 'm_int_2', text: '상단 [모음부호 / 발음독음] 버튼을 눌러 원어 발음 들어보기', screen: 'interlinear' },
      { id: 'm_int_3', text: '단어 상세창 하단의 [🌿 QT 묵상에 삽입] 버튼 눌러보기', screen: 'interlinear' }
    ]
  },
  {
    id: 'reelsStudioGuide',
    shortLabel: '🎬 릴스 스튜디오 Pro',
    label: '🎬 릴스 스튜디오 Pro 완벽 바이블',
    badge: '9:16 NLE',
    targetScreen: 'reelsStudio',
    targetBtnLabel: '릴스 스튜디오 열기',
    easySummary: '교회 행사 사진이나 말씀 영상을 넣으면 자막, 배경음악, 화면 분할까지 방송국처럼 멋지게 만들어주는 숏폼 영상 제작실입니다.',
    ttsScript: '릴스 스튜디오 안내입니다. 스마트폰 세로 화면에 맞춘 말씀 영상과 교회 소식 영상을 쉽게 만들 수 있습니다. 목소리가 나올 때 배경음악 소리를 자동으로 줄여주는 기능과 대본 프롬프터가 들어 있습니다.',
    missions: [
      { id: 'm_reel_1', text: '릴스 스튜디오에서 사진이나 영상을 타임라인 V1 트랙에 올려보기', screen: 'reelsStudio' },
      { id: 'm_reel_2', text: 'T1 자막 트랙에 오늘 은혜받은 성경 구절 자막 넣어보기', screen: 'reelsStudio' },
      { id: 'm_reel_3', text: '[AI 마법봉] 버튼을 눌러 자동으로 릴스 스타일 완성해 보기', screen: 'reelsStudio' }
    ]
  },
  {
    id: 'oneStream',
    shortLabel: '🚀 원스트림 연동',
    label: '🚀 원스트림(One-Stream) 연동',
    badge: '0-CLICK',
    targetScreen: 'qt',
    targetBtnLabel: '매일 QT에서 체험하기',
    easySummary: '큐티를 쓰면서 다른 화면으로 이동하지 않고도 그 자리에서 바로 실천 약속, 기도 제목, 목사님 상담 요청까지 한 번에 끝내는 지름길 기능입니다.',
    ttsScript: '원스트림 연동 안내입니다. 매일 큐티를 적고 나서 화면을 이동할 필요 없이, 바로 아래에 있는 버튼 하나로 실천 트래커와 기도 보관함에 저장하고 일대일 상담도 신청할 수 있습니다.',
    missions: [
      { id: 'm_one_1', text: '매일 QT 하단의 [🌿 트래커에 실천 심기] 버튼 눌러보기', screen: 'qt' },
      { id: 'm_one_2', text: '매일 QT 상단 우측의 [🙏 기도함] 서랍 버튼을 열어 내 기도제목 확인하기', screen: 'qt' },
      { id: 'm_one_3', text: '오늘의 QT 완료 체크하고 영적 5종 세트 불 켜기', screen: 'qt' }
    ]
  },
  {
    id: 'erpSuite',
    shortLabel: '🏛️ 목회 4종 ERP',
    label: '🏛️ 목회 4종 ERP 상세 매뉴얼',
    badge: 'GOVERNANCE',
    targetScreen: 'adminConsole',
    targetBtnLabel: '관리자 ERP 열기',
    easySummary: '교회 재정 장부, 연간 사역 일정표, 당회·위원회 회의록, 성도님들의 기도 제목을 투명하고 정확하게 관리하는 교회 살림 센터입니다.',
    ttsScript: '교회 행정 및 재정 4종 이알피 매뉴얼입니다. 차변과 대변이 정확히 일치하는 복식부기 재무원장, 마우스로 일정을 조절하는 사역 타임라인, 전자 직인이 찍히는 회의록과 목회 기도 아카이브를 제공합니다.',
    missions: [
      { id: 'm_erp_1', text: '관리자 콘솔 [재무 및 예산 원장]에서 재무상태표와 수지운영표 확인하기', screen: 'adminConsole' },
      { id: 'm_erp_2', text: '[사역 타임라인]에서 교회 주요 행사 공정 확인하기', screen: 'adminConsole' },
      { id: 'm_erp_3', text: '[회의록 아카이브]에서 전자 직인 및 실행 보드 살펴보기', screen: 'adminConsole' }
    ]
  },
  {
    id: 'qtCommunity',
    shortLabel: '📖 공동체 QT 광장',
    label: '📖 공동체 QT & 목사님 나눔',
    badge: 'COMMUNITY',
    targetScreen: 'qt',
    targetBtnLabel: '공동체 QT 나눔터 열기',
    easySummary: '오늘 같은 말씀을 읽은 우리 교회 성도님들의 은혜 나눔을 읽어보고, 어려운 구절을 질문하면 목사님의 해설과 권면을 만날 수 있는 사랑방입니다.',
    ttsScript: '공동체 큐티 나눔터 안내입니다. 혼자 묵상하다가 어려운 구절이 있으면 질문을 남기고, 목사님의 말씀 해설과 성도님들의 따뜻한 댓글로 함께 은혜를 나눌 수 있습니다.',
    missions: [
      { id: 'm_qtc_1', text: '매일 QT 상단의 [공동체 QT 나눔터] 탭 눌러서 성도님들 글 읽어보기', screen: 'qt' },
      { id: 'm_qtc_2', text: '지체의 묵상 글에 따뜻한 [은혜와 공감 ❤️] 또는 댓글 달아주기', screen: 'qt' },
      { id: 'm_qtc_3', text: '[나의 묵상 올리기]를 눌러 오늘 깨달은 한 줄 은혜 나누기', screen: 'qt' }
    ]
  },
  {
    id: 'pilgrimage',
    shortLabel: '🕊️ 오늘의 묵상 여정',
    label: '🕊️ 오늘의 묵상 여정 (5단계 리터지)',
    badge: 'LITURGY',
    targetScreen: 'meditationPilgrimage',
    targetBtnLabel: '묵상 여정 시작하기',
    easySummary: '마음이 복잡하고 기도가 잘 나오지 않을 때, 잔잔한 피아노 반주를 들으며 1분 침묵부터 말씀·골방기도·중보기도까지 차근차근 따라가는 마음의 예배당입니다.',
    ttsScript: '오늘의 묵상 여정 안내입니다. 잔잔한 피아노 찬양을 들으며 60초 동안 마음을 가라앉히고, 오늘 나에게 주시는 말씀과 골방 기도를 따라가며 평안을 회복하는 5단계 여정입니다.',
    missions: [
      { id: 'm_pil_1', text: '[오늘의 묵상 여정]에 들어가 피아노 선율 속에서 60초 침묵 호흡하기', screen: 'meditationPilgrimage' },
      { id: 'm_pil_2', text: '오늘 나에게 주시는 랜덤 성경 말씀을 소리 내어 3번 읽기', screen: 'meditationPilgrimage' },
      { id: 'm_pil_3', text: '골방 기도를 적고 [기도를 주님 손에 올려드립니다] 버튼 누르기', screen: 'meditationPilgrimage' }
    ]
  },
  {
    id: 'cellManual',
    shortLabel: '👥 목장 & 7일 자동요약',
    label: '👥 목장 모임 & 7일 오토풀링',
    badge: 'AUTO-PULL',
    targetScreen: 'cell',
    targetBtnLabel: '내 목장 모임지 열기',
    easySummary: '목장 모임 날 무엇을 나눌지 고민하지 않도록, 지난 일주일 동안 내가 쓴 큐티·감사·기도제목을 버튼 하나로 모임지에 자동 채워주는 효자 기능입니다.',
    ttsScript: '스마트 목장 모임 안내입니다. 목장 모임 때 일주일 동안 적었던 큐티와 감사일기를 일일이 다시 찾을 필요 없이, 자동 완성 버튼 하나만 누르면 나눔지가 멋지게 완성됩니다.',
    missions: [
      { id: 'm_cell_1', text: '목장 나눔 화면에서 [🚀 7일 은혜로 나눔지 자동 완성] 버튼 눌러보기', screen: 'cell' },
      { id: 'm_cell_2', text: '목장 식구들의 기도제목을 읽고 함께 중보기도 하기', screen: 'cell' },
      { id: 'm_cell_3', text: '작성한 나눔지를 [제출하기] 눌러 목자님께 전달하기', screen: 'cell' }
    ]
  },
  {
    id: 'roadmap',
    shortLabel: '🌱 영적 성장 파이프라인',
    label: '🌱 영적 성장 3단계 파이프라인',
    badge: '3-PHASE',
    targetScreen: 'fiveSetMenu',
    targetBtnLabel: '영적 5종 세트 현황 보기',
    easySummary: '아침에 읽은 말씀(1단계)이 낮 동안 내 삶을 변화시키고(2단계), 저녁에는 가정과 목장 식구들을 살리는 간증(3단계)으로 이어지는 신앙 성장 지도입니다.',
    ttsScript: '영적 성장 파이프라인 안내입니다. 매일의 말씀 기록이 내 삶을 변화시키는 실천이 되고, 목장 식구들과 나누는 간증으로 이어지는 3단계 성장 과정을 보여줍니다.',
    missions: [
      { id: 'm_road_1', text: 'PHASE 1: 오늘의 QT 또는 성경 1장 읽고 기록 남기기', screen: 'qt' },
      { id: 'm_road_2', text: 'PHASE 2: 적용 질문 트래커에서 오늘 실천할 순종 1가지 체크하기', screen: 'applyTracker' },
      { id: 'm_road_3', text: 'PHASE 3: 공동체 게시판에 오늘 감사한 일 1가지 올리기', screen: 'board' }
    ]
  },
  {
    id: 'context',
    shortLabel: '🎯 상황별 맞춤 처방',
    label: '🎯 상황별 성도 맞춤 처방 솔루션',
    badge: 'SOLUTION',
    targetScreen: 'prayer',
    targetBtnLabel: '나의 기도 보관함 열기',
    easySummary: '말씀이 어려울 때, 마음이 답답할 때, 신앙이 슬럼프에 빠졌을 때 지금 내 마음 상태에 딱 맞는 기능을 골라주는 신앙 응급상자입니다.',
    ttsScript: '상황별 맞춤 처방 안내입니다. 말씀이 어렵거나 마음이 답답할 때, 현재 내 상황에 맞는 카드를 누르면 가장 알맞은 기도와 말씀 화면으로 바로 안내해 드립니다.',
    missions: [
      { id: 'm_ctx_1', text: '아래 4가지 상황 카드 중 지금 내 마음과 가장 가까운 카드 1개 고르기', screen: 'meditationPilgrimage' },
      { id: 'm_ctx_2', text: '카드 안의 [권장 순종 액션 3단계]를 천천히 읽고 따라해 보기', screen: 'qt' },
      { id: 'm_ctx_3', text: '카드 하단의 [바로가기] 버튼을 눌러 실제로 실천해 보기', screen: 'prayer' }
    ]
  },
  {
    id: 'controlHub',
    shortLabel: '🏢 컨트롤허브 & 신앙상담실',
    label: '🏢 컨트롤허브 & 신앙상담실(Jira·OCR)',
    badge: 'PASTORAL CARE',
    targetScreen: 'adminConsole',
    targetBtnLabel: '컨트롤허브 & 상담실 열기',
    easySummary: '목사님·전도사님·목자님들이 목원들의 출석과 5단계 신앙 위험도를 돌보고, 종이 상담카드를 사진 찍어(OCR) 자동 입력하며, 목사님의 권면 오더와 피드백을 주고받는 목양 종합 상황실입니다.',
    ttsScript: '컨트롤허브 및 신앙 상담실 사용법입니다. 목자님은 각 목원의 상담을 5단계 위험도로 기록하여 목자방과 목사님 모음함에 보고할 수 있습니다. 특히 표준 상담카드를 인쇄해 손글씨로 적은 뒤 휴대폰 카메라로 찍으면 글자가 자동으로 인식되어 입력되며, 목사님은 후속 심방 오더와 권면을 내릴 수 있습니다.',
    missions: [
      { id: 'm_adm_1', text: '컨트롤허브 [신앙 상담실]에서 5단 드래그앤드롭 칸반보드와 목장별 분리뷰 확인하기', screen: 'adminConsole' },
      { id: 'm_adm_2', text: '[🖨️ 표준카드 양식/인쇄]를 눌러 A4 고정 상담양식 확인 후 [📷 OCR 스캔] 체험하기', screen: 'adminConsole' },
      { id: 'm_adm_3', text: '상담카드를 [📥 사역자 모음함]에 제출하고 [👑 목사님 권면·오더] 피드백 남겨보기', screen: 'adminConsole' }
    ]
  },
  {
    id: 'tips',
    shortLabel: '💡 스마트 꿀팁 모음',
    label: '💡 전 세대 스마트 꿀팁 & 홈화면 편집',
    badge: 'PRO TIPS',
    targetScreen: 'home',
    targetBtnLabel: '홈 화면으로 가서 해보기',
    easySummary: '홈 화면 메뉴를 아이폰처럼 꾹 눌러 내 마음대로 순서를 바꾸는 법, 목소리로 설교 노트 적는 법 등 알아두면 정말 편한 알짜배기 비법 모음입니다.',
    ttsScript: '스마트 꿀팁 안내입니다. 홈 화면 하단의 메뉴 카드를 손가락으로 0.5초 동안 꾹 누르면 아이폰처럼 카드가 흔들리며 내가 자주 쓰는 순서대로 위치를 바꿀 수 있습니다. 목소리로 설교를 받아적는 마이크 기능과 예루살렘 2.5D 성읍 건설 게임도 함께 즐겨보세요.',
    missions: [
      { id: 'm_tip_1', text: '홈 화면 하단 [성경 연구 & 추가 메뉴] 카드를 0.5초 꾹 눌러 순서 바꿔보기', screen: 'home' },
      { id: 'm_tip_2', text: '자유 말씀 노트에서 [창세기 1:1] 입력 후 스페이스바 눌러 본문 자동완성 해보기', screen: 'generalNote' },
      { id: 'm_tip_3', text: '오늘의 말씀 카드 우측 하단 [카드저장]을 눌러 카카오톡으로 가족에게 공유하기', screen: 'home' }
    ]
  }
];

export default function AppGuidebook({ isDarkMode, setActiveScreen, isSidebarOpen, setIsSidebarOpen }) {
  const isDark = isDarkMode;
  const [activeTab, setActiveTab] = useState('galaxyGuide');

  // 🔍 90대 어르신 & 시니어를 위한 ‘큰글씨 효도 모드’ 상태 (로컬스토리지 유지)
  const [isLargeText, setIsLargeText] = useState(() => {
    try {
      return localStorage.getItem('gt_guide_large_text') === 'true';
    } catch {
      return false;
    }
  });

  // 🔊 시청각 오디오 보이스 가이드(TTS) 상태
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ✅ 읽기에 그치지 않고 직접 행동하는 ‘실천 미션 체크리스트’ 상태
  const [completedMissions, setCompletedMissions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gt_guide_missions_v2') || '{}');
    } catch {
      return {};
    }
  });

  // 🌌 지식 은하계 시청각 인터랙티브 시뮬레이터 상태
  const [demoArcIdx, setDemoArcIdx] = useState(0);

  const toggleLargeText = () => {
    const next = !isLargeText;
    setIsLargeText(next);
    try { localStorage.setItem('gt_guide_large_text', String(next)); } catch (_) {}
  };

  const toggleMissionCheck = (missionId) => {
    setCompletedMissions(prev => {
      const next = { ...prev, [missionId]: !prev[missionId] };
      try { localStorage.setItem('gt_guide_missions_v2', JSON.stringify(next)); } catch (_) {}
      return next;
    });
  };

  const currentTabMeta = useMemo(
    () => GUIDE_TABS.find(t => t.id === activeTab) || GUIDE_TABS[0],
    [activeTab]
  );

  // 🔊 음성 안내 낭독기 (탭 전환 시 자동 정지 및 클린업)
  const handleToggleSpeech = useCallback((textToRead) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('이 기기에서는 음성 안내 기능을 지원하지 않습니다.');
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(textToRead || currentTabMeta.ttsScript);
    utter.lang = 'ko-KR';
    utter.rate = 0.95; // 어르신들도 또렷하게 들으실 수 있는 편안한 속도
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utter);
  }, [isSpeaking, currentTabMeta]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeTab]);

  // 전체 미션 달성률 계산
  const missionStats = useMemo(() => {
    const allMissions = GUIDE_TABS.flatMap(t => t.missions || []);
    const total = allMissions.length || 1;
    const done = allMissions.filter(m => completedMissions[m.id]).length;
    return { total, done, rate: Math.round((done / total) * 100) };
  }, [completedMissions]);

  // 🎨 라이트 / 다크모드 & 큰글씨 완벽 대응 스타일 토큰 (박스 겹침 원천 차단)
  const ui = {
    bgBody: isDark ? 'bg-[#090C12] text-slate-100' : 'bg-[#F4F6FA] text-stone-900',
    cardBg: isDark
      ? 'bg-[#131722]/95 border border-white/10 backdrop-blur-xl text-white shadow-lg'
      : 'bg-white border border-stone-200/90 backdrop-blur-xl text-stone-900 shadow-[0_4px_20px_rgba(0,0,0,0.04)]',
    innerCard: isDark
      ? 'bg-[#1C2230]/80 border border-white/10 text-slate-200'
      : 'bg-stone-50/90 border border-stone-200/80 text-stone-800',
    textMain: isDark ? 'text-white' : 'text-stone-900',
    textSub: isDark ? 'text-slate-300' : 'text-stone-600',
    border: isDark ? 'border-white/10' : 'border-stone-200/90',
    primaryBg: isDark
      ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
      : 'bg-stone-900 text-white hover:bg-black',
    secondaryBg: isDark
      ? 'bg-white/10 text-white hover:bg-white/15 border border-white/10'
      : 'bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-200',
    titleSize: isLargeText ? 'text-[18px] sm:text-[21px]' : 'text-[16px] sm:text-[18px]',
    bodySize: isLargeText ? 'text-[14.5px] sm:text-[15.5px] leading-[1.85]' : 'text-[12.5px] sm:text-[13px] leading-[1.7]',
    subSize: isLargeText ? 'text-[13.5px] leading-[1.75]' : 'text-[11.5px] sm:text-[12px] leading-[1.65]'
  };

  // 영적 성장 파이프라인 데이터 (100% 보존 + 은하계 연동 보강)
  const roadmapSteps = [
    {
      step: 'PHASE 01',
      title: '일일 영적 데이터 구축 (Daily Input)',
      subtitle: '흩어지는 생각과 감정을 체계적인 신앙 데이터로 축적',
      desc: '매일 아침 QT와 주일 설교를 단순한 소비로 끝내지 않고, 앱 내 에디터에 기록하여 나만의 평생 영적 아카이브와 지식 은하계 별자리에 영구 저장합니다.',
      icon: <IconBook />,
      tagColor: 'bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-stone-300 border border-stone-200 dark:border-white/10',
      pipeline: [
        { name: '매일 QT', role: '말씀 묵상 & 구속사적 적용 질문 도출', link: 'qt' },
        { name: '예배 노트', role: '주일 설교 음성/텍스트 필기 및 핵심 요약', link: 'sermon' },
        { name: '맥체인 & 통독', role: '성경 본문 자동 연결 및 주간 실시간 완독 체크', link: 'mcheyne' }
      ],
      flowOutput: '축적된 일일 묵상과 설교 적용 질문이 [신앙 아카이브] 및 [지식 은하계]로 실시간 인덱싱됨',
      actions: [{ label: '매일 QT 쓰기', id: 'qt' }, { label: '예배 노트 쓰기', id: 'sermon' }, { label: '맥체인 성경 읽기', id: 'mcheyne' }]
    },
    {
      step: 'PHASE 02',
      title: '구속사적 삶의 해석 (Analyze & Align)',
      subtitle: '기록된 말씀과 내 삶의 갈등 사건을 1:1로 매핑',
      desc: '내 힘으로 풀리지 않는 일상의 고난과 질문을 아카이브와 지식 은하계로 끌어와 말씀으로 내 죄와 우상을 직면하고 하나님의 섭리로 재해석합니다.',
      icon: <IconTarget />,
      tagColor: 'bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-stone-300 border border-stone-200 dark:border-white/10',
      pipeline: [
        { name: '지식 은하계 & 아크', role: '31,102절 실증 교차참조 아크 및 내 QT·설교 궤도 연결', link: 'galaxy' },
        { name: '설교 심층 아카이브', role: '본문 구절별 설교 요약 및 목회자 큐티노트 색인 조회', link: 'sermonArchiveAdvanced' },
        { name: '적용 질문 트래커', role: '미해결된 질문을 실제 삶의 실천 과제로 전환', link: 'applyTracker' },
        { name: '성경 위키 & 원어', role: '지리, 역사, 원어 어근을 대조하는 입체적 성경 연구', link: 'interlinear' }
      ],
      flowOutput: '해석된 사건과 순종의 결단이 [간증문 8단계 서식]으로 자동 정렬됨',
      actions: [{ label: '지식 은하계 열기', id: 'galaxy' }, { label: '원어 성경 연구', id: 'interlinear' }, { label: '삶의 적용과 실천', id: 'sermonArchiveAdvanced' }, { label: '적용 트래커 확인', id: 'applyTracker' }]
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

  // 스마트 팁 데이터 (기존 5개 + 신규 고도화 기능 4개 완벽 통합)
  const smartTips = [
    { title: '📱 아이폰식 홈화면 메뉴 꾹 눌러 순서 변경', desc: '홈 화면 하단 [성경 연구 & 추가 메뉴] 카드를 손가락으로 0.5초간 꾹 누르면 카드들이 흔들리며 내가 자주 쓰는 메뉴를 맨 앞으로 옮길 수 있습니다.', icon: <IconSparkles />, link: 'home' },
    { title: '🌌 구속사 아크에서 성경 본문 0.1초 직행', desc: '지식 은하계 하단 양피지 카드에서 [열기➔]를 누르면 66권 목록을 거치지 않고 곧바로 해당 성경 장·절 본문으로 들어가며, [팝업]을 누르면 그 자리에서 장 전체를 읽을 수 있습니다.', icon: <IconCompass />, link: 'galaxy' },
    { title: '📷 종이 상담카드 사진 찍어 OCR 자동 입력', desc: '신앙 상담실에서 표준 상담카드를 A4로 인쇄해 수기로 적은 뒤, 휴대폰 카메라로 찍거나 아이폰 [텍스트 스캔]을 쓰면 성도명·위험도·기도제목이 칸에 맞춰 자동 입력됩니다.', icon: <IconShield />, link: 'adminConsole' },
    { title: '🏰 2.5D 예루살렘 성읍 건설 타이쿤', desc: '시온산 고지대 대성전과 갈릴리 호수 절벽이 입체 디오라마로 구현된 예루살렘 타이쿤에서 마태복음 퀘스트를 따라 성읍을 건설해 보세요.', icon: <IconWand />, link: 'jerusalem_tycoon' },
    { title: '원어 묵상 1-클릭 QT & 설교 삽입', desc: '단어 카드 모달 하단의 [🌿 QT 묵상에 삽입] 또는 [📖 설교노트에 삽입]을 누르면 원어 표제어, Strongs 번호, 형태론, 구속사 문법 주석이 오늘 묵상 일지에 자동 기록됩니다.', icon: <IconAcademic />, link: 'interlinear' },
    { title: '성경 본문 스페이스바 자동완성', desc: 'QT 질문란이나 말씀 노트에서 [신명기 22:13]처럼 장:절을 적고 스페이스바를 누르면 성경 말씀 본문이 그 자리에 자동으로 쏙 들어옵니다.', icon: <IconActivity />, link: 'generalNote' },
    { title: '공동체 QT 대댓글 토론', desc: '지체들의 나눔 글 아래 [답글] 버튼을 누르면 해당 성도에게 직접 연결되는 대댓글이 생성되어 깊은 영적 나눔이 가능합니다.', icon: <IconMessage />, link: 'qt' },
    { title: '음성으로 설교 필기하기', desc: '예배 노트와 자유 노트에서 마이크 아이콘을 누르면, 스마트폰이 설교 음성을 듣고 자동으로 텍스트 변환해 줍니다.', icon: <IconMic />, link: 'sermon' },
    { title: '자동 간증문 맵핑', desc: '기록한 일상의 예배를 "간증문으로 피워내기" 버튼만 누르면, 8단계 구속사 서식에 맞게 내용이 스스로 정렬됩니다.', icon: <IconBook />, link: 'diary' }
  ];

  // 은하계 시청각 시뮬레이터용 샘플 아크
  const DEMO_ARCS = [
    {
      badge: '직접 인용 (LXX)',
      title: '나무에 달린 자마다 저주 아래에 있는 자라 — 십자가 대속 성취',
      from: '신명기 21:23',
      fromText: '그 시체를 나무 위에 밤새도록 두지 말고 당일에 장사하여... 나무에 달린 자는 하나님께 저주를 받았음이니라',
      to: '갈라디아서 3:13',
      toText: '그리스도께서 우리를 위하여 저주를 받은 바 되사 율법의 저주에서 우리를 속량하셨으니 기록된 바 나무에 달린 자마다 저주 아래에 있는 자라 하였음이라'
    },
    {
      badge: '예언 · 성취',
      title: '여자의 후손 원시복음 언약과 때가 차매 오신 그리스도',
      from: '창세기 3:15',
      fromText: '내가 너로 여자와 원수가 되게 하고 네 후손도 여자의 후손과 원수가 되게 하리니 여자의 후손은 네 머리를 상하게 할 것이요',
      to: '갈라디아서 4:4',
      toText: '때가 차매 하나님이 그 아들을 보내사 여자에게서 나게 하시고 율법 아래에 나게 하신 것은'
    },
    {
      badge: '모형 · 그림자',
      title: '에덴의 생명나무에서 새 예루살렘 생명나무로의 완성',
      from: '창세기 2:9',
      fromText: '여호와 하나님이 그 땅에서 보기에 아름답고 먹기에 좋은 나무가 나게 하시니 동산 가운데에는 생명나무와 선악을 알게 하는 나무도 있더라',
      to: '요한계시록 22:2',
      toText: '길 가운데로 흐르더라 강 좌우에 생명나무가 있어 열두 가지 열매를 맺되 달마다 그 열매를 맺고 그 나무 잎사귀들은 만국을 치료하기 위하여 있더라'
    }
  ];

  return (
    <div className={`flex-1 flex flex-col h-full w-full pointer-events-auto font-sans relative ${ui.bgBody} overflow-hidden select-none`}>
      
      {/* 앰비언트 배경 글로우 */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-50 dark:opacity-25">
        <div
          className="absolute -top-[15%] -left-[10%] w-[85vw] max-w-[520px] h-[85vw] max-h-[520px] rounded-full blur-[110px]"
          style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-[15%] -right-[10%] w-[80vw] max-w-[480px] h-[80vw] max-h-[480px] rounded-full blur-[110px]"
          style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 70%)' }}
        />
      </div>

      {/* ── 1. 상단 글로벌 헤더 (음성 안내 낭독기 & 큰글씨 효도 모드 탑재) ── */}
      <header className={`w-full max-w-full overflow-hidden px-3.5 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b ${ui.border} backdrop-blur-xl shrink-0 relative z-20 bg-white/90 dark:bg-[#090C12]/90`}>
        <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto sm:flex-1">
          <button
            onClick={() => setActiveScreen && setActiveScreen('home')}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer text-stone-700 dark:text-stone-200"
            title="홈으로 돌아가기"
          >
            <IconArrowLeft />
          </button>

          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-emerald-500 flex items-center justify-center shrink-0 text-white font-black shadow-xs">
            <IconAcademic />
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className={`text-[14px] sm:text-[16.5px] font-black ${ui.textMain} tracking-tight leading-snug break-keep`}>
                좋은나무 전 세대 시청각 실천 가이드북
              </h2>
              <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 dark:bg-indigo-950/90 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 shrink-0">
                실천 달성 {missionStats.rate}%
              </span>
            </div>
            <p className="text-[10.5px] sm:text-[11px] font-medium text-stone-500 dark:text-slate-400 leading-snug break-keep mt-0.5">
              10대 아이부터 90대 어르신까지 듣고·보고·누르며 바로 따라하는 행동 매뉴얼
            </p>
          </div>
        </div>

        {/* 우측: 🔊 음성 낭독 버튼 & 🔍 큰글씨 효도 모드 토글 (모바일에서 줄바꿈 안 되게 가로 정렬) */}
        <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-stone-200 dark:border-white/10">
          <button
            type="button"
            onClick={() => handleToggleSpeech(currentTabMeta.ttsScript)}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer border ${
              isSpeaking
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-md'
                : 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800 hover:bg-indigo-100'
            }`}
          >
            <IconVolume />
            <span>{isSpeaking ? '정지' : '소리로 듣기'}</span>
          </button>

          <button
            type="button"
            onClick={toggleLargeText}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer border ${
              isLargeText
                ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-md'
                : 'bg-stone-100 text-stone-800 border-stone-200 dark:bg-white/10 dark:text-slate-200 dark:border-white/15'
            }`}
          >
            {isLargeText ? '🔍 큰글씨 켜짐' : '가+ 큰글씨 모드'}
          </button>
        </div>
      </header>

      {/* ── 2. 모바일·태블릿용 가로 스크롤 탭 바 ── */}
      <nav className={`lg:hidden flex w-full px-3.5 sm:px-6 overflow-x-auto hide-scrollbar border-b ${ui.border} shrink-0 relative z-20 backdrop-blur-md gap-2 bg-white/70 dark:bg-black/30 py-2`}>
        {GUIDE_TABS.map(tab => {
          const isAct = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-[11.5px] sm:text-[12px] font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                isAct
                  ? 'bg-indigo-600 text-white border-indigo-500 font-black shadow-xs'
                  : 'bg-white/80 dark:bg-white/5 text-stone-600 dark:text-slate-300 border-stone-200/80 dark:border-white/10'
              }`}
            >
              {tab.shortLabel}
            </button>
          );
        })}
      </nav>

      {/* ── 3. 메인 바디 (PC·태블릿 대화면 2단 분할: 좌측 목차 사이드바 + 우측 본문 뷰포트) ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative z-10 max-w-[1440px] w-full mx-auto">
        
        {/* 💻 PC·태블릿 대화면(lg 이상) 전용 좌측 고정 목차 & 실천 달성률 사이드바 */}
        <aside className={`hidden lg:flex w-[270px] xl:w-[290px] shrink-0 border-r ${ui.border} bg-white/60 dark:bg-[#0D111A]/80 backdrop-blur-md flex-col p-4 overflow-y-auto hide-scrollbar gap-4`}>
          <div className={`p-3.5 rounded-2xl border ${ui.innerCard} space-y-2`}>
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-mono font-black uppercase text-indigo-600 dark:text-indigo-400">
                ACTION PROGRESS
              </span>
              <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                {missionStats.done} / {missionStats.total} 완료
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${missionStats.rate}%` }}
              />
            </div>
            <p className="text-[11px] font-medium text-stone-500 dark:text-slate-400 leading-snug">
              읽는 데서 그치지 않고 각 챕터의 3가지 실천 미션을 직접 체크해 보세요!
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-stone-400 px-2 block mb-1.5">
              12대 가이드북 전체 목차
            </span>
            {GUIDE_TABS.map((tab) => {
              const isAct = activeTab === tab.id;
              const tabMissions = tab.missions || [];
              const doneInTab = tabMissions.filter(m => completedMissions[m.id]).length;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isAct
                      ? 'bg-indigo-600 text-white font-black shadow-sm'
                      : 'text-stone-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 font-bold'
                  }`}
                >
                  <span className="text-[12.5px] truncate">{tab.shortLabel}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                    isAct
                      ? 'bg-white/20 text-white'
                      : doneInTab === tabMissions.length && tabMissions.length > 0
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-stone-200/70 dark:bg-white/10 text-stone-600 dark:text-slate-400'
                  }`}>
                    {doneInTab}/{tabMissions.length}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* 📖 우측 메인 스크롤 콘텐츠 뷰포트 */}
        <main className="flex-1 overflow-y-auto w-full hide-scrollbar pb-32 px-3.5 sm:px-6 py-4 sm:py-6">
          <div className="w-full max-w-5xl mx-auto flex flex-col gap-5 sm:gap-6 animate-fade-in">
            
            {/* ── 모든 탭 공통 상단: 💡 쉬운 요약 & 🎯 따라하기 실천 미션 (모바일 겹침 방지 최적화) ── */}
            <div className={`w-full max-w-full overflow-hidden p-4 sm:p-6 rounded-3xl border-2 border-amber-400/70 dark:border-amber-500/40 ${ui.cardBg} flex flex-col gap-3.5 shadow-md box-border`}>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b pb-3 border-stone-200/80 dark:border-white/10 w-full">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 text-[10.5px] font-black shrink-0">
                    💡 쉬운 설명
                  </span>
                  <h3 className={`font-black ${ui.titleSize} ${ui.textMain} break-keep`}>
                    {currentTabMeta.label}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveScreen && setActiveScreen(currentTabMeta.targetScreen)}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11.5px] sm:text-xs font-black flex items-center justify-center gap-1 shadow-sm cursor-pointer active:scale-95 transition-all"
                  >
                    <span>🚀 {currentTabMeta.targetBtnLabel}</span>
                    <IconChevronRight />
                  </button>
                </div>
              </div>

              {/* 전 세대 쉬운 요약 본문 */}
              <div className={`p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 ${ui.bodySize} font-bold text-stone-900 dark:text-amber-100 break-keep w-full box-border`}>
                "{currentTabMeta.easySummary}"
              </div>

              {/* 🎯 따라하기 실천 미션 3단계 */}
              {currentTabMeta.missions && currentTabMeta.missions.length > 0 && (
                <div className="space-y-2 pt-1 w-full">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="text-[11px] sm:text-xs font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                      <span>✅</span>
                      <span className="break-keep">지금 바로 눌러서 따라해 보세요! (실천 체크리스트)</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-stone-500 dark:text-slate-400 shrink-0">
                      터치 시 체크 완료
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 w-full">
                    {currentTabMeta.missions.map((m, idx) => {
                      const isDone = !!completedMissions[m.id];
                      return (
                        <div
                          key={m.id}
                          onClick={() => toggleMissionCheck(m.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 min-w-0 box-border ${
                            isDone
                              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600'
                              : `${ui.innerCard} hover:border-indigo-400`
                          }`}
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <div className={`w-4.5 h-4.5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                              isDone
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-white dark:bg-black/40 border-stone-300 dark:border-white/20'
                            }`}>
                              {isDone && <IconCheck />}
                            </div>
                            <span className={`${ui.subSize} font-bold break-keep ${isDone ? 'line-through opacity-75' : ''}`}>
                              <b className="text-indigo-600 dark:text-indigo-400 mr-1">실천{idx + 1}.</b>
                              {m.text}
                            </span>
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMissionCheck(m.id);
                                if (setActiveScreen && m.screen) setActiveScreen(m.screen);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/10 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 text-[10.5px] font-black border border-indigo-200 dark:border-white/10 transition-colors cursor-pointer"
                            >
                              지금 해보기 ➔
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* 🌌 [탭 0 - 신규] 지식 은하계 & 구속사 아크 (BibleKnowledgeGalaxy) 완벽 가이드 */}
            {/* ========================================================================= */}
            {activeTab === 'galaxyGuide' && (
              <div className="flex flex-col gap-5 sm:gap-6">
                
                {/* 시청각 인터랙티브 아크 & 은하계 시뮬레이터 */}
                <div className="p-5 sm:p-6 rounded-3xl bg-[#070B14] text-white border-2 border-cyan-500/40 shadow-xl flex flex-col gap-4 overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest block">
                        INTERACTIVE VISUAL PREVIEW (미리 눌러보세요!)
                      </span>
                      <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                        🌈 성경 66권 구속사 교차참조 아크 & 2D·3D 별자리 체험판
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {DEMO_ARCS.map((da, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setDemoArcIdx(idx)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all ${
                            demoArcIdx === idx
                              ? 'bg-amber-400 text-slate-950 scale-105'
                              : 'bg-white/10 text-slate-300 hover:bg-white/20'
                          }`}
                        >
                          예시 {idx + 1}: {da.badge}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 미니 구속사 무지개 아크 SVG 시각화 */}
                  <div className="relative w-full h-40 sm:h-48 bg-[#05080F] rounded-2xl border border-white/10 flex flex-col justify-end p-4 overflow-hidden">
                    <svg viewBox="0 0 600 180" className="w-full h-full overflow-visible">
                      {/* 배경 다중 아크 */}
                      <path d="M 40 150 A 240 120 0 0 1 520 150" fill="none" stroke="rgba(139,92,246,0.22)" strokeWidth="1.5" />
                      <path d="M 80 150 A 190 95 0 0 1 460 150" fill="none" stroke="rgba(56,189,248,0.22)" strokeWidth="1.5" />
                      <path d="M 140 150 A 160 80 0 0 1 550 150" fill="none" stroke="rgba(45,212,191,0.22)" strokeWidth="1.5" />
                      {/* 선택된 황금 하이라이트 아크 */}
                      <path
                        d={demoArcIdx === 0 ? "M 110 150 A 185 110 0 0 1 480 150" : demoArcIdx === 1 ? "M 45 150 A 215 125 0 0 1 475 150" : "M 35 150 A 265 135 0 0 1 565 150"}
                        fill="none"
                        stroke="#FACC15"
                        strokeWidth="3.5"
                      />
                      {/* 베이스라인 */}
                      <line x1="20" y1="150" x2="410" y2="150" stroke="#94A3B8" strokeWidth="3" />
                      <line x1="416" y1="150" x2="580" y2="150" stroke="#F59E0B" strokeWidth="3" />
                      <text x="215" y="170" fill="#CBD5E1" fontSize="11" fontWeight="bold" textAnchor="middle">구약 (39권 · 929장)</text>
                      <text x="498" y="170" fill="#FBBF24" fontSize="11" fontWeight="bold" textAnchor="middle">신약 (27권 · 260장)</text>
                    </svg>
                  </div>

                  {/* 양피지 구절 대조 미리보기 카드 */}
                  <div className="p-3.5 rounded-2xl bg-[#DCD5C5] text-stone-900 border-2 border-amber-300 space-y-2">
                    <div className="flex items-center justify-between border-b border-stone-400/50 pb-1.5">
                      <span className="px-2 py-0.5 rounded bg-stone-900 text-amber-300 text-[10.5px] font-black">
                        {DEMO_ARCS[demoArcIdx].badge}
                      </span>
                      <span className="text-xs font-black truncate px-2">{DEMO_ARCS[demoArcIdx].title}</span>
                      <button
                        type="button"
                        onClick={() => setActiveScreen && setActiveScreen('galaxy')}
                        className="px-2.5 py-1 rounded-lg bg-indigo-900 text-white text-[10.5px] font-black shrink-0 cursor-pointer"
                      >
                        실제 화면 열기 ➔
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white/90 border border-stone-300">
                        <div className="font-black text-amber-900 mb-0.5">📜 구약 출발: {DEMO_ARCS[demoArcIdx].from}</div>
                        <p className="text-[11.5px] text-stone-800 leading-snug">{DEMO_ARCS[demoArcIdx].fromText}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/90 border border-stone-300">
                        <div className="font-black text-indigo-900 mb-0.5">✝️ 신약 성취: {DEMO_ARCS[demoArcIdx].to}</div>
                        <p className="text-[11.5px] text-stone-800 leading-snug">{DEMO_ARCS[demoArcIdx].toText}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CHAPTER 01: 4대 뷰 모드 (아크 / 2D / 3D / 나열) 완벽 가이드 */}
                <div className={`p-5 sm:p-6 rounded-3xl border ${ui.cardBg} flex flex-col gap-4`}>
                  <div className="flex items-center gap-3 border-b pb-3.5 border-stone-200/80 dark:border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-black shrink-0">
                      🪐
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className={`font-black ${ui.titleSize} ${ui.textMain}`}>
                        CHAPTER 01. 상단 4가지 보기 버튼 (🌈아크 · 🌌2D · 🪐3D · 📋나열) 사용법
                      </h4>
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                        어르신과 아이들도 상단 버튼 4개만 누르면 성경 우주를 자유자재로 여행할 수 있습니다
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className={`p-4 rounded-2xl border ${ui.innerCard} flex flex-col gap-2`}>
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                        1. [🌈 아크] 모드 — 구약과 신약을 잇는 황금 무지개 다리
                      </span>
                      <p className={ui.subSize}>
                        창세기 1장부터 요한계시록 22장까지 총 1,189장이 가로선 위에 놓여 있고, 서로 연결된 구절들이 무지개 다리처럼 이어집니다. <b>무지개 선이나 아래 구약/신약 막대바를 손가락으로 문지르면(스크러빙)</b> 연결된 두 말씀이 즉시 하단 카드에 나타납니다.
                      </p>
                    </div>

                    <div className={`p-4 rounded-2xl border ${ui.innerCard} flex flex-col gap-2`}>
                      <span className="text-xs font-black text-cyan-600 dark:text-cyan-400">
                        2. [🌌 2D] & [🪐 3D] 모드 — 예수님 중심 성경 별자리
                      </span>
                      <p className={ui.subSize}>
                        정중앙의 <b>‘예수 그리스도 코어’</b>를 중심으로 성경 66권, 목사님 설교, 내가 쓴 QT, 히브리어·헬라어 원어가 5중 궤도로 공전합니다. 손가락 두 개로 확대/축소하거나 3D 행성을 지구본처럼 돌려볼 수 있으며, 화면이 벗어났을 땐 <b>[🎯 맞춤]</b> 버튼을 누르면 중앙으로 딱 맞춰집니다.
                      </p>
                    </div>

                    <div className={`p-4 rounded-2xl border ${ui.innerCard} flex flex-col gap-2`}>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        3. 2열 분리 탭 바 — 원하는 보물만 골라 보기
                      </span>
                      <p className={ui.subSize}>
                        2D·3D·나열 모드에서는 상단 2열에 <b>[전체 | 📖 성경 66권 | 🎙️ 설교 아카이브 | 🔥 나의 QT·예배노트 | 🏛️ 히브리·헬라 원어]</b> 분리 탭이 나타납니다. 보고 싶은 탭만 누르면 해당 별자리만 환하게 켜집니다.
                      </p>
                    </div>

                    <div className={`p-4 rounded-2xl border ${ui.innerCard} flex flex-col gap-2`}>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                        4. [열기➔] 본문 직행 & [팝업] 그 자리에서 장 전체 읽기
                      </span>
                      <p className={ui.subSize}>
                        하단 양피지 카드에서 <b>[열기➔]</b>를 누르면 성경 66권 목록을 거치지 않고 <b>곧바로 해당 성경 장·절 본문으로 직행</b>합니다. 은하계를 떠나지 않고 읽고 싶을 땐 <b>[팝업]</b> 버튼을 누르면 그 자리에서 장 전체가 열리고 해당 절이 노란색으로 하이라이트됩니다.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CHAPTER 02: 실시간 동기화 & 나만의 아크 등록 */}
                <div className={`p-5 sm:p-6 rounded-3xl border ${ui.cardBg} flex flex-col gap-4`}>
                  <div className="flex items-center gap-3 border-b pb-3.5 border-stone-200/80 dark:border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-black shrink-0">
                      🔄
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className={`font-black ${ui.titleSize} ${ui.textMain}`}>
                        CHAPTER 02. 내 QT·설교 실시간 반영 & 나만의 황금 아크 추가하기
                      </h4>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        내가 오늘 적은 큐티와 예배 노트가 은하계의 새로운 별과 아크로 즉시 탄생합니다
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={`p-3.5 rounded-2xl border ${ui.innerCard}`}>
                      <b className="text-rose-600 dark:text-rose-400 block mb-1 text-xs">1. 자동 실시간 연동</b>
                      <p className={ui.subSize}>
                        매일 QT, 주일 예배 노트, 성경 묵상 노트를 작성하면 별도 작업 없이도 <b>[🔥 나의 QT·설교 연결]</b> 아크와 2D·3D 궤도 별자리에 실시간으로 반영됩니다.
                      </p>
                    </div>
                    <div className={`p-3.5 rounded-2xl border ${ui.innerCard}`}>
                      <b className="text-amber-600 dark:text-amber-400 block mb-1 text-xs">2. [➕] 나만의 아크 연결</b>
                      <p className={ui.subSize}>
                        상단 노란색 <b>[➕]</b> 버튼을 누르면 내가 성경을 읽다 발견한 짝꿍 구절(출발 성경 ➔ 도착 성경)을 나만의 황금 아크로 영구 등록할 수 있습니다.
                      </p>
                    </div>
                    <div className={`p-3.5 rounded-2xl border ${ui.innerCard}`}>
                      <b className="text-cyan-600 dark:text-cyan-400 block mb-1 text-xs">3. [🧭 목록/필터] 66권 핀셋 검색</b>
                      <p className={ui.subSize}>
                        우측 인스펙터(모바일은 상단 <b>[🧭 목록]</b> 버튼)에서 출발 성경(예: 창세기)과 도착 성경(예: 요한계시록)을 고르면 두 성경 사이의 연결선만 핀셋처럼 골라 보여줍니다.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* 🏛️ [탭 1] 원어 성경 연구 (Interlinear Exegetical Suite) 바이블 (100% 보존) */}
            {/* ========================================================================= */}
            {activeTab === 'interlinearSuite' && (
              <div className="flex flex-col gap-5 sm:gap-6">
                
                {/* CHAPTER 01: 6대 핵심 조작 마스터 */}
                <div className={`p-5 sm:p-6 rounded-3xl border ${ui.cardBg} flex flex-col gap-4 shadow-xs`}>
                  <div className="flex items-center gap-3 border-b pb-4 border-stone-200/80 dark:border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xl font-black shrink-0">📜</div>
                    <div className="min-w-0 flex-1">
                      <h4 className={`font-black ${ui.titleSize} ${ui.textMain} tracking-tight leading-snug break-keep`}>
                        CHAPTER 01. 원어 인터페이스 6대 핵심 조작 마스터
                      </h4>
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-0.5 truncate">
                        원어 어순 직역, 4단 조판 모드, 1:1 형태론 뱃지, WEB 영한사전 활용법
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${ui.innerCard}`}>
                      <div className="flex justify-between items-center gap-1 flex-wrap">
                        <span className="text-[12.5px] font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          1. 원어 어순 1:1 직역 (Literal Interlinear)
                        </span>
                        <span className="text-[9.5px] font-mono bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
                          정통 인터리니어
                        </span>
                      </div>
                      <p className={`${ui.subSize} font-medium break-keep`}>
                        한국어 성경의 의역된 어순이 아닌, <b>히브리어/헬라어 원문 어순 그대로 1:1 직독직해</b>를 제공합니다.
                      </p>
                      <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-[11px] font-mono leading-relaxed text-emerald-950 dark:text-emerald-200">
                        <code>in beginning created God the heavens and the earth</code>
                        <br /><span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-sans">↳ 성경 기자가 성령의 감동으로 단어를 배치한 강조의 우선순위가 그대로 드러납니다.</span>
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${ui.innerCard}`}>
                      <div className="flex justify-between items-center gap-1 flex-wrap">
                        <span className="text-[12.5px] font-black text-blue-700 dark:text-sky-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          2. 마소라 4단 조판 스위처 (Typography)
                        </span>
                        <span className="text-[9.5px] font-mono bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-sky-300 px-2 py-0.5 rounded font-bold">
                          BHS RTL
                        </span>
                      </div>
                      <p className={`${ui.subSize} font-medium break-keep`}>
                        원문 상단 토글 캡슐을 통해 본문 표기 방식을 자유자재로 변경합니다:
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-mono">
                        <div className="p-2 bg-white dark:bg-black/40 rounded-lg border border-stone-200 dark:border-white/5">
                          <b className="text-blue-600 dark:text-sky-400 block">[모음부호]</b> 마소라 Niqqud 표준 모음
                        </div>
                        <div className="p-2 bg-white dark:bg-black/40 rounded-lg border border-stone-200 dark:border-white/5">
                          <b className="text-amber-600 dark:text-amber-400 block">[자음만]</b> 고대 사본 순수 자음 텍스트
                        </div>
                        <div className="p-2 bg-white dark:bg-black/40 rounded-lg border border-stone-200 dark:border-white/5">
                          <b className="text-purple-600 dark:text-purple-400 block">[악센트]</b> 낭송 및 구문론 대휴지 보존
                        </div>
                        <div className="p-2 bg-white dark:bg-black/40 rounded-lg border border-stone-200 dark:border-white/5">
                          <b className="text-emerald-600 dark:text-emerald-400 block">[발음독음]</b> 원어민 한글 음역 낭독 스트림
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${ui.innerCard}`}>
                      <div className="flex justify-between items-center gap-1 flex-wrap">
                        <span className="text-[12.5px] font-black text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          3. 단어별 1:1 분해 & 형태론 뱃지 (Morphology)
                        </span>
                        <span className="text-[9.5px] font-mono bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-bold">
                          Strongs 1:1
                        </span>
                      </div>
                      <p className={`${ui.subSize} font-medium break-keep`}>
                        어절 카드를 누르면 <b>원문 어형(Inflected)</b>과 <b>사전 원형(Lemma)</b>, <b>Strong's 번호</b>, <b>문맥 번역어</b>, 그리고 성·수·격 뱃지가 나타납니다. 뱃지를 클릭하면 문법 대백과 사전이 열립니다.
                      </p>
                      <div className="p-2.5 rounded-lg bg-stone-100 dark:bg-black/40 border border-stone-200 dark:border-white/5 text-[11px] font-medium text-stone-600 dark:text-slate-300">
                        💡 원형과 문맥 번역어가 다를 때만 <code>(원형뜻)</code>을 병기하여 화면의 텍스트 중복 피로도를 완전히 해소했습니다.
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${ui.innerCard}`}>
                      <div className="flex justify-between items-center gap-1 flex-wrap">
                        <span className="text-[12.5px] font-black text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-500" />
                          4. 히브리어 7대 어간(Binyan) & 헬라어 시제 신학
                        </span>
                        <span className="text-[9.5px] font-mono bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded font-bold">
                          Theology
                        </span>
                      </div>
                      <p className={`${ui.subSize} font-medium break-keep`}>
                        동사의 문법 코드를 단순 기호로 넘기지 않고 영적 신학 통찰로 자동 해석합니다:
                      </p>
                      <ul className="text-[11px] font-mono space-y-1 text-stone-700 dark:text-slate-300">
                        <li>• <b>Qal(단순능동)</b> vs <b>Piel(강조능동)</b> vs <b>Hiphil(사역능동)</b></li>
                        <li>• <b>Niphal(신적 수동태)</b>: 하나님이 직접 이루시는 불가항력적 구원</li>
                        <li>• <b>Aorist(부정과거)</b>: 십자가 대속과 같이 영단번에 완성된 단회적 사건</li>
                        <li>• <b>Perfect(완료)</b>: 영구히 유효한 은혜의 법적 상태 선언</li>
                      </ul>
                    </div>

                    <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${ui.innerCard}`}>
                      <div className="flex justify-between items-center gap-1 flex-wrap">
                        <span className="text-[12.5px] font-black text-cyan-700 dark:text-cyan-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-500" />
                          5. WEB 인터랙티브 영단어 터치 사전
                        </span>
                        <span className="text-[9.5px] font-mono bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded font-bold">
                          Lexicon + Audio
                        </span>
                      </div>
                      <p className={`${ui.subSize} font-medium break-keep`}>
                        WEB 성경에서 밑줄 점선이 그어진 영단어를 터치하면 하단 시트가 호출되어 <b>한글 품사, 성경적 구속사 정의, 미국식 원어민 음성(`en-US`)</b>을 실시간 제공합니다.
                      </p>
                    </div>

                    <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${ui.innerCard}`}>
                      <div className="flex justify-between items-center gap-1 flex-wrap">
                        <span className="text-[12.5px] font-black text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          6. 1-클릭 QT & 설교노트 원어 주석 주입
                        </span>
                        <span className="text-[9.5px] font-mono bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-bold">
                          0-Click Export
                        </span>
                      </div>
                      <p className={`${ui.subSize} font-medium break-keep`}>
                        단어 상세 카드 하단의 <code>[🌿 QT 묵상에 삽입]</code> 또는 <code>[📖 설교노트에 삽입]</code>을 클릭하면 표제어, Strongs, 원형, 문법 주석, 연구자 메모가 당일 일지로 자동 전송됩니다.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CHAPTER 02: 3대 본문 뷰어 상호 연동 파이프라인 (박스 겹침 없는 반응형 시각 다이어그램) */}
                <div className={`p-5 sm:p-6 rounded-3xl border ${ui.cardBg} flex flex-col gap-4 shadow-xs`}>
                  <div className="flex items-center gap-3 border-b pb-4 border-stone-200/80 dark:border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-xl font-black shrink-0">🔄</div>
                    <div className="min-w-0 flex-1">
                      <h4 className={`font-black ${ui.titleSize} ${ui.textMain} tracking-tight leading-snug break-keep`}>
                        CHAPTER 02. 성경통독 365 ⇄ 맥체인 ⇄ 원어 연구실 직결 파이프라인
                      </h4>
                      <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 mt-0.5 truncate">
                        본문 끝 [📖 원어] 클릭으로 0.1초 만에 연구실 텔레포트
                      </p>
                    </div>
                  </div>

                  {/* 모바일·태블릿·PC 어디서든 절대 잘리거나 겹치지 않는 3단계 시각 플로우 카드 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-indigo-950/90 text-white border border-indigo-500/40 flex flex-col justify-between gap-2">
                      <span className="text-[10px] font-mono text-indigo-300 font-black">STEP 01. 말씀 읽기</span>
                      <div className="font-black text-sm">📖 성경통독 365 & 맥체인</div>
                      <p className="text-xs text-indigo-100/90 leading-relaxed">
                        성경을 읽다가 깊이 알고 싶은 구절 끝의 <b>[📖 원어]</b> 버튼을 터치합니다.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900 text-white border border-cyan-500/40 flex flex-col justify-between gap-2">
                      <span className="text-[10px] font-mono text-cyan-300 font-black">STEP 02. 인라인 대조</span>
                      <div className="font-black text-sm">🔍 3대 역본 & 1:1 원어 인스펙터</div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        개역개정·쉬운성경·WEB 영문성경 3단 대조와 단어별 원어 뜻을 즉시 확인하고 <b>[🔬 원어연구실 ➔]</b>을 누릅니다.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-950/90 text-white border border-emerald-500/40 flex flex-col justify-between gap-2">
                      <span className="text-[10px] font-mono text-emerald-300 font-black">STEP 03. 심층 주석 & 노트 삽입</span>
                      <div className="font-black text-sm">🏛️ 10대 학술 코퍼스 & QT 전송</div>
                      <p className="text-xs text-emerald-100/90 leading-relaxed">
                        TSK, 70인역, 매튜 헨리 주석을 열람한 뒤 <b>[🌿 QT 묵상에 삽입]</b>으로 내 노트에 쏙 담습니다.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CHAPTER 03: 10대 정밀 학술 코퍼스 완벽 활용 매뉴얼 */}
                <div className={`p-5 sm:p-6 rounded-3xl border ${ui.cardBg} flex flex-col gap-4 shadow-xs`}>
                  <div className="flex items-center gap-3 border-b pb-4 border-stone-200/80 dark:border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-400 flex items-center justify-center text-xl font-black shrink-0">🏛️</div>
                    <div className="min-w-0 flex-1">
                      <h4 className={`font-black ${ui.titleSize} ${ui.textMain} tracking-tight leading-snug break-keep`}>
                        CHAPTER 03. 10대 글로벌 정밀 학술 코퍼스 활용 매뉴얼
                      </h4>
                      <p className="text-xs font-bold text-sky-700 dark:text-sky-400 mt-0.5 truncate">
                        성경이 성경을 해석하는 아카데믹 주석과 역사문헌 총람
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { title: '🔗 1. TSK 상호교차참조', badge: '34만 구절', desc: "종교개혁자들의 '성경으로 성경을 푸는' 원칙에 따라, 구절 배지를 누르면 해당 성경으로 즉시 이동합니다." },
                      { title: '📜 2. BHS 히브리어 구문론 끊어읽기', badge: 'Atnach 대휴지', desc: '마소라 악센트의 핵심인 Atnach(대휴지) 기호를 기준으로 문장을 전반부와 후반부로 양분하여 구문적 역할을 명확히 해석합니다.' },
                      { title: '🏛️ 3. 70인역(LXX) 3단 원전 대조', badge: 'GNT · LXX · MT', desc: '신약 저자들이 구약을 인용할 때 사용한 70인역 헬라어 본문과 히브리어 마소라 본문의 차이 및 신학적 의도를 비교합니다.' },
                      { title: '🏺 4. 고대 아람어 타르굼 & 시리아 페시타', badge: 'Semitic Texts', desc: '초대 셈족 언어권 원전과 한국어 번역을 나란히 제공하여 1세기 회당 낭독 전통과 초대교회 이본 전승을 고찰합니다.' },
                      { title: '📜 5. 요세푸스 1세기 유대 고대사/전쟁사', badge: '1st Century', desc: '헤롯 대왕의 가계도, 로마 총독들의 통치, 성전 파괴 사건 등 복음서와 사도행전의 역사적 현장을 생생히 증언합니다.' },
                      { title: '🗺️ 6. 역사 지리학 & OpenBible GPS', badge: 'Google Satellite', desc: '유적지의 정밀 GPS 좌표를 기반으로 [📍 지도 위성 보기 ↗]를 지원하여 지형적·군사적 맥락을 입체 파악합니다.' },
                      { title: '📖 7. 반즈 & JFB 역사문법 강해 주석', badge: '단락별 번역', desc: '원어 문맥 주해와 교리적 의미를 단락 단위로 분할하여 [🌐 한국어 번역] 토글로 매끄럽게 열람합니다.' },
                      { title: '🌿 8. 매튜 헨리 구속사적 묵상 강해', badge: '청교도 표준', desc: '청교도 대가 매튜 헨리의 영적 통찰과 삶의 실천 권면을 단락 분할로 출력하여 깊은 은혜를 누립니다.' },
                      { title: '🔍 9. NET Bible 본문비평 사본학 각주', badge: 'Textual Notes', desc: '최고의 복음주의 학자들이 기록한 번역상 난제, 문법적 이견, 사본학적 차이를 투명하게 밝혀줍니다.' },
                      { title: "📚 10. 이스톤 성경 백과사전 (Easton's)", badge: 'Encyclopedia', desc: '본문에 등장하는 고대 인물, 지명, 제도, 동식물, 고고학적 유물의 의미를 체계적으로 정리합니다.' }
                    ].map((item, i) => (
                      <div key={i} className={`p-3.5 rounded-2xl border ${ui.innerCard} flex flex-col gap-1.5 min-w-0`}>
                        <div className="flex justify-between items-center gap-2 flex-wrap">
                          <span className={`font-black text-[12.5px] ${ui.textMain}`}>{item.title}</span>
                          <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold shrink-0">
                            {item.badge}
                          </span>
                        </div>
                        <p className={`${ui.subSize} font-medium break-keep`}>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CHAPTER 04 & 05 */}
                <div className={`p-5 sm:p-6 rounded-3xl border ${ui.cardBg} flex flex-col gap-4 shadow-xs`}>
                  <div className="flex items-center gap-3 border-b pb-4 border-stone-200/80 dark:border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xl font-black shrink-0">💡</div>
                    <div className="min-w-0 flex-1">
                      <h4 className={`font-black ${ui.titleSize} ${ui.textMain} tracking-tight leading-snug break-keep`}>
                        CHAPTER 04. 실전 원어 강해 4단계 워크플로우 & 단축키
                      </h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className={`p-3.5 rounded-2xl border ${ui.innerCard}`}>
                      <span className="font-bold text-amber-700 dark:text-amber-300 block mb-1 text-xs">1단계: 원어 어순 직역 확인</span>
                      <p className={ui.subSize}>성령께서 단어를 배치하신 원문 어순을 통해 강조점을 파악합니다.</p>
                    </div>
                    <div className={`p-3.5 rounded-2xl border ${ui.innerCard}`}>
                      <span className="font-bold text-blue-700 dark:text-blue-300 block mb-1 text-xs">2단계: 핵심 동사 어간 분해</span>
                      <p className={ui.subSize}>바라(Bara, H1254) 등 핵심 단어를 터치해 칼(Qal) 완료형 등 신학적 의미를 확인합니다.</p>
                    </div>
                    <div className={`p-3.5 rounded-2xl border ${ui.innerCard}`}>
                      <span className="font-bold text-purple-700 dark:text-purple-300 block mb-1 text-xs">3단계: 10대 코퍼스 교차 검증</span>
                      <p className={ui.subSize}>TSK 교차참조와 매튜 헨리·반즈 주석을 통해 해석의 깊이를 더합니다.</p>
                    </div>
                    <div className={`p-3.5 rounded-2xl border ${ui.innerCard}`}>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 block mb-1 text-xs">4단계: 내 QT·설교 노트로 전송</span>
                      <p className={ui.subSize}><code>[🌿 QT 묵상에 삽입]</code> 버튼 하나로 오늘 일지에 자동 기록합니다.</p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* 🎬 [탭 2] 릴스 스튜디오 Pro 완벽 바이블 (100% 보존)                         */}
            {/* ========================================================================= */}
            {activeTab === 'reelsStudioGuide' && (
              <div className="flex flex-col gap-5 sm:gap-6">
                <div className={`p-5 sm:p-6 rounded-3xl border ${ui.cardBg} flex flex-col gap-4 shadow-sm`}>
                  <div className="flex items-center gap-3 border-b pb-4 border-stone-200/80 dark:border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 flex items-center justify-center text-xl font-black shrink-0">🎞️</div>
                    <div className="min-w-0 flex-1">
                      <h4 className={`font-black ${ui.titleSize} ${ui.textMain}`}>
                        CHAPTER 01. V / T / A 엄격 분리 트랙 매트릭스 & 자석 스냅
                      </h4>
                      <p className="text-xs font-bold text-sky-700 dark:text-sky-400 mt-0.5">
                        영상(V1~V4) · 자막(T1~T2) · 오디오(A1~A3) 전용 트랙 분리로 꼬임 없는 편집
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className={`p-3.5 rounded-2xl border ${ui.innerCard}`}>
                      <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-600 dark:text-sky-300 font-mono font-black text-[10.5px]">V1 ~ V4</span>
                      <h5 className="font-black mt-1.5 mb-1">🎬 비디오·사진 트랙</h5>
                      <p className={ui.subSize}>영상, 사진 레이어 적층 및 2분할·4분할 비디오월 멀티 매트릭스 전용 트랙입니다.</p>
                    </div>
                    <div className={`p-3.5 rounded-2xl border ${ui.innerCard}`}>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 font-mono font-black text-[10.5px]">T1 ~ T2</span>
                      <h5 className="font-black mt-1.5 mb-1">💬 성경구절·키네틱 자막 트랙</h5>
                      <p className={ui.subSize}>성경 구절 자동 완성, 타이프라이터·바운스 팝인 모션 자막 전용 트랙입니다.</p>
                    </div>
                    <div className={`p-3.5 rounded-2xl border ${ui.innerCard}`}>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-mono font-black text-[10.5px]">A1 ~ A3</span>
                      <h5 className="font-black mt-1.5 mb-1">🎵 스마트 오디오 더킹 트랙</h5>
                      <p className={ui.subSize}>목소리(A1)가 나올 때 배경음악(A2) 볼륨을 자동으로 -18dB 줄여주는 Fairlight DSP 트랙입니다.</p>
                    </div>
                  </div>
                </div>

                <div className={`p-5 sm:p-6 rounded-3xl border ${ui.cardBg} grid grid-cols-1 md:grid-cols-3 gap-4`}>
                  <div className={`p-4 rounded-2xl ${ui.innerCard} space-y-1.5`}>
                    <span className="text-xs font-black text-purple-600 dark:text-purple-400">📐 1-클릭 비디오월</span>
                    <p className={ui.subSize}>상하 2분할 릴스, 3단 시네마틱, 2x2 쿼드 비디오월, PIP 화면속화면을 버튼 하나로 자동 배치합니다.</p>
                  </div>
                  <div className={`p-4 rounded-2xl ${ui.innerCard} space-y-1.5`}>
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400">🎙️ 음성인식 텔레프롬프터</span>
                    <p className={ui.subSize}>촬영 중 대본을 읽어주며 내 목소리를 인식해 타임라인 자막으로 자동 배치합니다.</p>
                  </div>
                  <div className={`p-4 rounded-2xl ${ui.innerCard} space-y-1.5`}>
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400">✨ AI 마법봉 디렉터</span>
                    <p className={ui.subSize}>9:16 리프레이밍, 3초 후크 줌인, 필름 LUT 색보정을 원클릭으로 자동 완성합니다.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 🚀 [탭 3] 원스트림(One-Stream) 연동 가이드 (100% 보존)                       */}
            {/* ========================================================================= */}
            {activeTab === 'oneStream' && (
              <div className="flex flex-col gap-4">
                <div className={`p-5 rounded-3xl border ${ui.cardBg} space-y-3`}>
                  <h4 className={`font-black ${ui.titleSize} ${ui.textMain}`}>
                    1. 인라인 액션 허브 (QT·설교 작성창 하단 3대 직통 버튼)
                  </h4>
                  <p className={ui.bodySize}>
                    매일 QT와 주일 예배노트 작성창 바로 아래에는 화면을 이동하지 않고도 다른 메뉴로 은혜를 즉시 심어주는 3개의 직통 버튼이 있습니다:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={`p-3.5 rounded-2xl border ${ui.innerCard}`}>
                      <b className="text-emerald-600 dark:text-emerald-400 block mb-1">🌿 트래커에 실천 심기</b>
                      <p className={ui.subSize}>오늘 결단한 행동 목표가 [적용 트래커]에 즉시 심겨 체크할 수 있습니다.</p>
                    </div>
                    <div className={`p-3.5 rounded-2xl border ${ui.innerCard}`}>
                      <b className="text-indigo-600 dark:text-indigo-400 block mb-1">🙏 나의 기도함에 저장</b>
                      <p className={ui.subSize}>묵상 중 떠오른 기도가 [기도 보관함]으로 즉시 전송되어 평생 보관됩니다.</p>
                    </div>
                    <div className={`p-3.5 rounded-2xl border ${ui.innerCard}`}>
                      <b className="text-rose-600 dark:text-rose-400 block mb-1">💌 1:1 심층상담 요청</b>
                      <p className={ui.subSize}>어려운 구절이나 신앙 고민이 담당 사역자 상담실로 비공개 접수됩니다.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-5 rounded-3xl border ${ui.cardBg} space-y-2`}>
                    <h4 className="font-black text-sm">2. 글로벌 사이드시트 서랍장 (화면 이탈 ZERO)</h4>
                    <p className={ui.subSize}>
                      매일 QT와 예배노트 우측 상단의 <code>🌿 트래커</code>, <code>🙏 기도함</code> 버튼을 누르면, 읽던 성경을 닫지 않고도 우측에서 서랍처럼 열려 바로 확인하고 돌아올 수 있습니다.
                    </p>
                  </div>
                  <div className={`p-5 rounded-3xl border ${ui.cardBg} space-y-2`}>
                    <h4 className="font-black text-sm">3. Q·M·T 3대 루틴 자동 출석 점등</h4>
                    <p className={ui.subSize}>
                      성도가 <b>QT(Q)</b>, <b>맥체인(M)</b>, <b>감사(T)</b>를 기록하면 목장 주간 체크표와 관리자 관제판에 자동으로 출석 불빛이 켜집니다.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 🏛️ [탭 4] 목회 4종 ERP 상세 매뉴얼 (100% 보존)                             */}
            {/* ========================================================================= */}
            {activeTab === 'erpSuite' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-5 rounded-3xl border ${ui.cardBg} space-y-2.5`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    <h4 className="font-black text-base">1. 재무·예산 원장 (복식부기 코어)</h4>
                  </div>
                  <p className={ui.subSize}>
                    • <b>대차평균의 원리</b>: 차변 합계와 대변 합계가 1원 단위까지 일치해야 전표가 발행됩니다.<br/>
                    • <b>역분개(Audit Trail)</b>: 임의 삭제 대신 마이너스 역분개 전표를 발행해 투명한 회계 감사를 보장합니다.
                  </p>
                </div>

                <div className={`p-5 rounded-3xl border ${ui.cardBg} space-y-2.5`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📅</span>
                    <h4 className="font-black text-base">2. 전사 사역 공정 관제 (Gantt & Kanban)</h4>
                  </div>
                  <p className={ui.subSize}>
                    • <b>인터랙티브 간트</b>: 막대를 드래그해 일정을 이동·연장하면 후행 일정이 도미노처럼 자동 조정됩니다.<br/>
                    • <b>WBS 체크리스트</b>: 세부 과제를 체크할 때마다 전체 사역 달성률(%)이 자동 상승합니다.
                  </p>
                </div>

                <div className={`p-5 rounded-3xl border ${ui.cardBg} space-y-2.5`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📝</span>
                    <h4 className="font-black text-base">3. 회의록 아카이브 & 전자 직인</h4>
                  </div>
                  <p className={ui.subSize}>
                    • 위원회별 찬성/반대/기권 가결률을 자동 집계하며, <b>[공식 전자 직인 날인]</b>으로 결재 무결성을 확증합니다.
                  </p>
                </div>

                <div className={`p-5 rounded-3xl border ${ui.cardBg} space-y-2.5`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📖</span>
                    <h4 className="font-black text-base">4. 목회 기도·감사 (Pastoral CRM)</h4>
                  </div>
                  <p className={ui.subSize}>
                    • 전교인의 기도 보관함 데이터와 감사 일기를 통합 타임라인으로 모아 심방 전 사전 진단을 돕습니다.
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 📖 [탭 5] 공동체 QT & 목사님 나눔 (100% 보존)                              */}
            {/* ========================================================================= */}
            {activeTab === 'qtCommunity' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-5 rounded-3xl border ${ui.cardBg} space-y-2`}>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black">STEP 1</span>
                  <h4 className="font-black text-base">나의 묵상 & 질문 올리기</h4>
                  <p className={ui.subSize}>
                    그날의 본문을 읽으며 깨달은 은혜는 <b>[나의 묵상 나눔]</b>에, 해석이 어려운 구절은 <b>[이 부분이 어려워요]</b>에 적어 올립니다.
                  </p>
                </div>
                <div className={`p-5 rounded-3xl border ${ui.cardBg} space-y-2`}>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black">STEP 2</span>
                  <h4 className="font-black text-base">목사님 상단 고정 해설</h4>
                  <p className={ui.subSize}>
                    목사님께서 직접 작성하시는 <b>[오늘의 QT 해석과 권면]</b>이 나눔터 최상단에 고정되어 성도님들의 바른 말씀 이해를 돕습니다.
                  </p>
                </div>
                <div className={`p-5 rounded-3xl border ${ui.cardBg} space-y-2`}>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black">STEP 3</span>
                  <h4 className="font-black text-base">공감 하트 & 대댓글 교제</h4>
                  <p className={ui.subSize}>
                    성도님들의 글에 <b>[은혜와 공감]</b>을 누르고 <b>[답글]</b>로 서로를 위로하며 온라인에서도 따뜻한 영적 가족을 경험합니다.
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 🕊️ [탭 6] 오늘의 묵상 여정 5단계 리터지 예배 (100% 보존)                    */}
            {/* ========================================================================= */}
            {activeTab === 'pilgrimage' && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-center">
                  {[
                    { num: '01', title: '침묵과 정돈', desc: '60초 호흡 침묵' },
                    { num: '02', title: '말씀 직면', desc: '랜덤 성경 말씀' },
                    { num: '03', title: '골방 기도', desc: '연약함 토설과 결단' },
                    { num: '04', title: '중보의 연대', desc: '공동체 중보 릴레이' },
                    { num: '05', title: '안식과 파송', desc: '삶의 자리로 전진' }
                  ].map((st, i) => (
                    <div key={i} className={`p-4 rounded-2xl border flex flex-col gap-1 ${ui.cardBg}`}>
                      <span className="text-xs font-mono font-black text-indigo-500">{st.num}</span>
                      <span className="text-sm font-black">{st.title}</span>
                      <span className="text-xs opacity-75 font-medium">{st.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 👥 [탭 7] 목장 모임 & Today-7일 오토풀링 (100% 보존)                        */}
            {/* ========================================================================= */}
            {activeTab === 'cellManual' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-5 rounded-3xl border ${ui.cardBg} space-y-2`}>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">✨ Today - 7일 오토풀링(Auto-Pulling)</span>
                  <h4 className="font-black text-base">일주일치 내 큐티·감사·기도가 1초 만에 채워집니다</h4>
                  <p className={ui.subSize}>
                    목장 탭에서 <b>[🚀 이 내용으로 나눔지 자동 완성하기]</b> 버튼만 누르면 지난 7일 동안 내가 앱에 기록한 말씀 묵상, 감사 일기, 기도 제목이 나눔지 양식에 자동으로 들어옵니다.
                  </p>
                </div>
                <div className={`p-5 rounded-3xl border ${ui.cardBg} space-y-2`}>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">📤 목원 제출 ➔ 목자 주간 보고서 직결</span>
                  <h4 className="font-black text-base">목원 나눔이 목자 보고서로 자동 취합됩니다</h4>
                  <p className={ui.subSize}>
                    목원들이 <b>[나눔지 제출]</b>을 누르면 목자님의 화면에 식구들의 나눔이 하나로 모이며, 목자님이 <b>[주간 목장 보고서 제출]</b>을 누르면 암호화되어 교역자 관제실로 전달됩니다.
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 🌱 [탭 8] 영적 성장 파이프라인 (100% 보존)                                 */}
            {/* ========================================================================= */}
            {activeTab === 'roadmap' && (
              <div className="flex flex-col gap-4">
                {roadmapSteps.map((step, idx) => (
                  <div key={idx} className={`p-5 rounded-3xl border ${ui.cardBg} flex flex-col gap-3`}>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-stone-200 dark:border-white/10">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">{step.step}</span>
                        <h4 className={`font-black ${ui.titleSize}`}>{step.title}</h4>
                      </div>
                      <span className="text-xs opacity-70 font-bold">{step.subtitle}</span>
                    </div>
                    <p className={ui.bodySize}>{step.desc}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {step.pipeline.map((p, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => setActiveScreen && setActiveScreen(p.link)}
                          className={`p-3 rounded-xl border ${ui.innerCard} cursor-pointer hover:border-indigo-500 transition-all`}
                        >
                          <div className="font-black text-xs mb-1 flex items-center justify-between">
                            <span>{p.name}</span>
                            <span>↗</span>
                          </div>
                          <p className="text-[11px] opacity-80 leading-snug">{p.role}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ========================================================================= */}
            {/* 🎯 [탭 9] 상황별 성도 맞춤 처방 솔루션 (100% 보존)                         */}
            {/* ========================================================================= */}
            {activeTab === 'context' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contextCurations.map((item, idx) => (
                  <div key={idx} className={`p-5 rounded-3xl border flex flex-col justify-between gap-3.5 ${ui.cardBg}`}>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black">
                          {item.tag}
                        </span>
                        <span className="text-xs font-bold opacity-60">{item.subtitle}</span>
                      </div>
                      <h4 className={`font-black ${ui.titleSize} leading-snug`}>"{item.situation}"</h4>
                      <p className={ui.subSize}>{item.prescription}</p>
                      <div className={`p-3 rounded-2xl border ${ui.innerCard} space-y-1`}>
                        {item.steps.map((st, sIdx) => (
                          <div key={sIdx} className="text-xs font-bold flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center shrink-0">
                              {sIdx + 1}
                            </span>
                            <span>{st}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveScreen && setActiveScreen(item.id)}
                      className={`w-full py-2.5 rounded-xl text-xs font-black ${ui.primaryBg} cursor-pointer flex items-center justify-center gap-1.5`}
                    >
                      <span>{item.targetFeature} 바로가기</span>
                      <IconChevronRight />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ========================================================================= */}
            {/* 🏢 [탭 10] 컨트롤허브(Admin) & 신앙상담실(Jira·Confluence·OCR) 완벽 가이드   */}
            {/* ========================================================================= */}
            {activeTab === 'controlHub' && (
              <div className="flex flex-col gap-4">
                
                {/* 신앙 상담실 5단계 워크플로우 집중 조명 */}
                <div className={`p-5 sm:p-6 rounded-3xl border-2 border-indigo-500/40 ${ui.cardBg} space-y-4`}>
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b pb-3 border-stone-200 dark:border-white/10">
                    <div>
                      <span className="text-[10px] font-mono font-black text-indigo-600 dark:text-indigo-400 uppercase block">
                        NEW PASTORAL COUNSELING SUITE (JIRA + CONFLUENCE + OCR)
                      </span>
                      <h4 className={`font-black ${ui.titleSize}`}>
                        🛡️ 신앙 상담실: 목장 상담 ➔ 사역자 모음함 ➔ 목사님 권면 오더 ➔ OCR 스캔
                      </h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-black">
                      🔐 AES-256 기본 암호화
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className={`p-4 rounded-2xl border ${ui.innerCard} space-y-1.5`}>
                      <span className="text-xs font-black text-rose-600 dark:text-rose-400">1. 5단계 신앙 위험도 & 카테고리</span>
                      <p className={ui.subSize}>
                        상담 시 <b>Lv.1 평안 ~ Lv.5 위기·긴급심방</b> 5단계 위험도와 6대 주제(기본신앙, 영적시험, 건강, 가정, 직장, 새가족)로 정밀 분류합니다.
                      </p>
                    </div>
                    <div className={`p-4 rounded-2xl border ${ui.innerCard} space-y-1.5`}>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">2. 목자방 공유 & 사역자 보고 모음함</span>
                      <p className={ui.subSize}>
                        목자는 자기 목장 식구를 상담한 뒤 <b>[🌿 목자방 공유]</b>로 동역 목자들과 중보를 요청하거나, <b>[📥 사역자 보고]</b>로 전도사·목사님 모음함에 제출합니다.
                      </p>
                    </div>
                    <div className={`p-4 rounded-2xl border ${ui.innerCard} space-y-1.5`}>
                      <span className="text-xs font-black text-sky-600 dark:text-sky-400">3. 5단 드래그앤드롭 칸반 & 목장 분리뷰</span>
                      <p className={ui.subSize}>
                        PC/태블릿에서는 <b>[상담예정 ➔ 대기·진행 ➔ 집중중보 ➔ 권면·오더 ➔ 상담완료]</b> 5단 칸반보드로 카드를 끌어다 놓으며, 목장별 스윔레인 분리뷰도 지원합니다.
                      </p>
                    </div>
                    <div className={`p-4 rounded-2xl border ${ui.innerCard} space-y-1.5`}>
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400">4. 👑 목사님 권면·조언 및 후속 오더</span>
                      <p className={ui.subSize}>
                        목사님이 상담 내역을 보고 <b>[대면심방 / 전도사권면 / 중보기도단 상정 / 목자 2차케어]</b> 오더를 내리면 목자에게 알림이 뜨고, 목자가 조치 후 피드백을 기록합니다.
                      </p>
                    </div>
                    <div className={`p-4 rounded-2xl border ${ui.innerCard} space-y-1.5`}>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">5. 🖨️ A4 고정형 표준 상담카드 인쇄</span>
                      <p className={ui.subSize}>
                        <b>[🖨️ 표준카드 양식/인쇄]</b>를 누르면 모든 사역자와 목자가 동일한 규격으로 쓰는 A4 표준 상담기록카드(빈 양식 또는 작성본)를 즉시 인쇄할 수 있습니다.
                      </p>
                    </div>
                    <div className={`p-4 rounded-2xl border ${ui.innerCard} space-y-1.5`}>
                      <span className="text-xs font-black text-purple-600 dark:text-purple-400">6. 📷 카메라 OCR & 아이폰 텍스트 스캔</span>
                      <p className={ui.subSize}>
                        종이 상담카드에 손글씨로 상담한 뒤 <b>[📷 OCR 스캔]</b>으로 사진을 찍거나 아이폰 라이브 텍스트로 스캔하면 정규식이 항목별로 자동 분류해 칸을 채워줍니다.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 기존 컨트롤허브 3대 핵심 기능 보존 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div className={`p-4 rounded-2xl border ${ui.cardBg} space-y-1.5`}>
                    <h5 className="font-black text-sm">📊 목장 총괄 관제실 & Q/M/T</h5>
                    <p className={ui.subSize}>전체 목장의 주간 보고서 열람 및 목원별 7일간 큐티(Q)·맥체인(M)·감사(T) 달성표를 실시간 점검합니다.</p>
                  </div>
                  <div className={`p-4 rounded-2xl border ${ui.cardBg} space-y-1.5`}>
                    <h5 className="font-black text-sm">📢 리더십 타겟 공지 배포</h5>
                    <p className={ui.subSize}>전체 성도, 핵심 리더십(목자), 특정 목장, 개별 성도를 지정하여 맞춤형 앱 푸시 공지를 즉시 발송합니다.</p>
                  </div>
                  <div className={`p-4 rounded-2xl border ${ui.cardBg} space-y-1.5`}>
                    <h5 className="font-black text-sm">📱 모바일 목자 전용 출석패드</h5>
                    <p className={ui.subSize}>스마트폰으로 접속한 목자님에게는 주일·수요·금요·목장 출석을 1초 만에 체크하는 모바일 전용 출석부가 열립니다.</p>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* 💡 [탭 11] 스마트 꿀팁 모음 (기존 + 신규 꿀팁 통합)                         */}
            {/* ========================================================================= */}
            {activeTab === 'tips' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {smartTips.map((tip, i) => (
                  <div
                    key={i}
                    onClick={() => tip.link && setActiveScreen && setActiveScreen(tip.link)}
                    className={`p-4 rounded-2xl border ${ui.cardBg} flex flex-col justify-between gap-3 cursor-pointer hover:border-indigo-500 transition-all`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                          {tip.icon}
                        </div>
                        <span className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400">바로 체험 ➔</span>
                      </div>
                      <h3 className="text-sm font-black">{tip.title}</h3>
                      <p className={`${ui.subSize} font-medium break-keep`}>{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </main>
      </div>

    </div>
  );
}
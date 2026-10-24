// src/components/admin/AdminCounselingTab.js
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import CryptoJS from 'crypto-js';
import { supabase } from '../../lib/supabase';

// =====================================================================
// 🔐 1. 군사급 AES-256 기본 암호화/복호화 및 정규식(Regex) 검증 엔진
// =====================================================================
const CHAT_SECRET_KEY = process.env.REACT_APP_CHAT_SECRET || 'tree-secret-key-2026';
const ENC_PREFIX_V2 = 'ENC_GTC_v2::';
const ENC_PREFIX_V1 = 'ENC_GTC_v1::';

const REGEX_PATTERNS = {
  ENCRYPTED_V2: /^ENC_GTC_v2::[A-Za-z0-9+/=]+$/,
  ENCRYPTED_V1: /^ENC_GTC_v1::[A-Za-z0-9+/=]+$/,
  TICKET_ID: /^CSL-\d{8}-\d{3,4}$/,
  DATE_NORMALIZE: /(\d{4})\s*[-./년]\s*(\d{1,2})\s*[-./월]\s*(\d{1,2})\s*일?/,
  DATE_SHORT: /(\d{1,2})\s*월\s*(\d{1,2})\s*일/,
  MEMBER_NAME: /(?:^|\n)\s*(?:[•\-*▪■□]\s*)?(?:성\s*도\s*명|대상\s*성도|성\s*명|이\s*름)\s*[:：]\s*([가-힣a-zA-Z]{2,12})(?:\s*\(([^)]+)\))?/i,
  CELL_NAME: /(?:^|\n)\s*(?:[•\-*▪■□]\s*)?(?:소\s*속\s*목\s*장|목\s*장\s*명|목\s*장)\s*[:：]\s*([가-힣a-zA-Z0-9\s]{2,15})/i,
  RISK_LEVEL: /(?:위험도|단계|레벨|Lv\.?)\s*[:：]?\s*([1-5])|(긴급|위기|시험|경계|주의|관심|평안|안정)/i,
  CATEGORY: /(?:카테고리|분류|주제)\s*[:：]\s*(기본신앙|기본|영적시험|시험|갈등|건강|질병|가정|자녀|직장|재정|새가족|정착)/i,
  SECTION_SPLIT: /(?:^|\n)\s*(?:[1-5]\s*[.)]|\[[^\]]+\]|[•\-*▪■]\s*)(?=\s*(?:핵심\s*요약|영적\s*상태|영적\s*현황|상담\s*내용|상담\s*상세|나눈\s*말씀|기도\s*제목|중보\s*기도|목자\s*소견|사역자\s*소견|건의\s*사항))/g
};

const encryptField = (plainText) => {
  if (plainText === null || plainText === undefined) return '';
  const str = String(plainText).trim();
  if (!str) return '';
  if (REGEX_PATTERNS.ENCRYPTED_V2.test(str)) return str;
  try {
    return ENC_PREFIX_V2 + CryptoJS.AES.encrypt(str, CHAT_SECRET_KEY).toString();
  } catch {
    return str;
  }
};

const decryptField = (cipherText) => {
  if (!cipherText || typeof cipherText !== 'string') return cipherText || '';
  if (cipherText.startsWith(ENC_PREFIX_V2)) {
    try {
      const rawCipher = cipherText.replace(ENC_PREFIX_V2, '');
      const bytes = CryptoJS.AES.decrypt(rawCipher, CHAT_SECRET_KEY);
      const original = bytes.toString(CryptoJS.enc.Utf8);
      return original || cipherText;
    } catch {
      return cipherText;
    }
  }
  if (cipherText.startsWith(ENC_PREFIX_V1)) {
    try {
      const payload = cipherText.replace(ENC_PREFIX_V1, '');
      return decodeURIComponent(atob(payload));
    } catch {
      return cipherText;
    }
  }
  return cipherText;
};

// DB 저장용 레코드 전체 암호화 변환기
const encryptRecordForDB = (card) => {
  const encryptedOrders = (card.pastorOrders || []).map(ord => ({
    ...ord,
    directive: encryptField(ord.directive),
    feedbackNote: encryptField(ord.feedbackNote || '')
  }));

  return {
    id: card.id,
    member_name: (card.memberName || '').trim(),
    member_office: card.memberOffice || '성도',
    cell_id: card.cellId || null,
    cell_name: card.cellName || '미배정',
    counselor_name: card.counselorName || '목자',
    counselor_role: card.counselorRole || '목자',
    counseling_date: card.date || new Date().toISOString().slice(0, 10),
    method: card.method || '대면심방',
    stage: card.stage || 'waiting',
    risk_level: Number(card.riskLevel) || 2,
    category: card.category || 'basic',
    is_shared_shepherds: !!card.isSharedWithShepherds,
    is_submitted_pastor: !!card.isSubmittedToPastor,
    submitted_at: card.submittedAt ? new Date(card.submittedAt).toISOString() : null,
    has_unread_order: !!card.hasUnreadOrder,
    title: encryptField(card.title),
    spiritual_state: encryptField(card.spiritualState),
    content: encryptField(card.content),
    prayer_topics: encryptField(card.prayerTopics),
    shepherd_opinion: encryptField(card.shepherdOpinion),
    pastor_orders: encryptedOrders,
    updated_at: new Date().toISOString()
  };
};

// DB 조회용 레코드 전체 복호화 변환기
const decryptRecordFromDB = (row) => {
  const rawOrders = Array.isArray(row.pastor_orders)
    ? row.pastor_orders
    : Array.isArray(row.pastorOrders)
    ? row.pastorOrders
    : [];

  const decryptedOrders = rawOrders.map(ord => ({
    ...ord,
    directive: decryptField(ord.directive),
    feedbackNote: decryptField(ord.feedbackNote || '')
  }));

  return {
    id: row.id,
    memberName: row.member_name ?? row.memberName ?? '',
    memberOffice: row.member_office ?? row.memberOffice ?? '성도',
    cellId: row.cell_id ?? row.cellId ?? null,
    cellName: row.cell_name ?? row.cellName ?? '미배정',
    counselorName: row.counselor_name ?? row.counselorName ?? '',
    counselorRole: row.counselor_role ?? row.counselorRole ?? '목자',
    date: (row.counseling_date ?? row.date ?? new Date().toISOString()).slice(0, 10),
    method: row.method || '대면심방',
    stage: row.stage || 'waiting',
    riskLevel: Number(row.risk_level ?? row.riskLevel ?? 2),
    category: row.category || 'basic',
    isSharedWithShepherds: Boolean(row.is_shared_shepherds ?? row.isSharedWithShepherds),
    isSubmittedToPastor: Boolean(row.is_submitted_pastor ?? row.isSubmittedToPastor ?? row.isSubmittedToPool),
    submittedAt: row.submitted_at ?? row.submittedAt ?? null,
    hasUnreadOrder: Boolean(row.has_unread_order ?? row.hasUnreadOrder),
    title: decryptField(row.title),
    spiritualState: decryptField(row.spiritual_state ?? row.spiritualState ?? ''),
    content: decryptField(row.content),
    prayerTopics: decryptField(row.prayer_topics ?? row.prayerTopics ?? ''),
    shepherdOpinion: decryptField(row.shepherd_opinion ?? row.shepherdOpinion ?? ''),
    pastorOrders: decryptedOrders,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString()
  };
};

// =====================================================================
// 📊 2. 지라(Jira) 5단 파이프라인 / 5단계 신앙 위험도 / 6대 카테고리
// =====================================================================
const KANBAN_STAGES = [
  { id: 'scheduled', label: '📅 상담 예정', short: '상담예정', badgeCls: 'bg-slate-100 text-slate-700 border-slate-300', dotColor: '#64748B', desc: '심방·상담 일정이 예약된 성도' },
  { id: 'waiting', label: '⏳ 상담 대기·진행', short: '대기·진행', badgeCls: 'bg-sky-50 text-sky-700 border-sky-200', dotColor: '#0284C7', desc: '목자 1차 상담 기록 및 교역자 검토 대기' },
  { id: 'intercession', label: '🙏 집중 중보', short: '집중중보', badgeCls: 'bg-purple-50 text-purple-700 border-purple-200', dotColor: '#9333EA', desc: '목자방·교역자 중보기도단에 상정된 카드' },
  { id: 'admonition', label: '👑 목회 권면·오더', short: '권면·오더', badgeCls: 'bg-amber-50 text-amber-800 border-amber-300', dotColor: '#D97706', desc: '목사님 권면 및 후속 조치 오더 이행 중' },
  { id: 'completed', label: '✅ 상담 완료', short: '상담완료', badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotColor: '#10B981', desc: '후속 피드백까지 종결된 상담 아카이브' }
];

const RISK_LEVELS = [
  { level: 1, label: 'Lv.1 평안·안정', short: 'Lv.1 평안', color: '#10B981', bgCls: 'bg-emerald-50 text-emerald-700 border-emerald-200', ringCls: 'ring-emerald-500' },
  { level: 2, label: 'Lv.2 관심·안부', short: 'Lv.2 관심', color: '#0EA5E9', bgCls: 'bg-sky-50 text-sky-700 border-sky-200', ringCls: 'ring-sky-500' },
  { level: 3, label: 'Lv.3 주의·권면', short: 'Lv.3 주의', color: '#F59E0B', bgCls: 'bg-amber-50 text-amber-800 border-amber-200', ringCls: 'ring-amber-500' },
  { level: 4, label: 'Lv.4 경계·시험', short: 'Lv.4 시험', color: '#F97316', bgCls: 'bg-orange-50 text-orange-800 border-orange-300 font-bold', ringCls: 'ring-orange-500' },
  { level: 5, label: 'Lv.5 위기·긴급심방', short: 'Lv.5 긴급', color: '#EF4444', bgCls: 'bg-rose-50 text-rose-700 border-rose-300 font-black', ringCls: 'ring-rose-600' }
];

const COUNSELING_CATEGORIES = [
  { id: 'basic', label: '📖 기본신앙', desc: '예배·QT·기도·말씀 점검' },
  { id: 'trial', label: '⚡ 영적시험·갈등', desc: '신앙 회의·관계 상처·낙심' },
  { id: 'health', label: '🏥 건강·질병', desc: '입원·수술·육체적 연약함' },
  { id: 'family', label: '🏠 가정·자녀', desc: '부부·자녀양육·가족구원' },
  { id: 'career', label: '💼 직장·재정', desc: '이직·사업·경제적 환난' },
  { id: 'settle', label: '🌱 새가족·정착', desc: '목장 적응·양육·직분' }
];

const PASTOR_ORDER_TYPES = [
  '담임목사 대면심방 및 안수기도',
  '담당교역자(전도사) 심방·말씀권면',
  '금요기도회·교역자 집중중보 상정',
  '담당목자 2차 밀착케어 및 안부연락',
  '양육과정·말씀처방 연결',
  '환우·경조사 교회 차원 위로/지원'
];

const LOCAL_ENC_CACHE_KEY = 'goodtree_counseling_encrypted_v2';

// =====================================================================
// 🔍 3. 정밀 정규식(Regex) 기반 OCR 텍스트 자동 추출 파서
// =====================================================================
function parseCounselingTextByRegex(rawText, defaultCell = '', defaultMember = '') {
  const clean = String(rawText || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  const result = {
    memberName: defaultMember,
    memberOffice: '',
    cellName: defaultCell,
    date: '',
    riskLevel: null,
    category: '',
    title: '',
    spiritualState: '',
    content: '',
    prayerTopics: '',
    shepherdOpinion: ''
  };

  if (!clean) return result;

  // 1) 성도명 & 직분 추출
  const nameMatch = clean.match(REGEX_PATTERNS.MEMBER_NAME);
  if (nameMatch) {
    result.memberName = nameMatch[1].trim();
    if (nameMatch[2]) result.memberOffice = nameMatch[2].trim();
  }

  // 2) 소속 목장 추출
  const cellMatch = clean.match(REGEX_PATTERNS.CELL_NAME);
  if (cellMatch) {
    const rawCell = cellMatch[1].trim();
    result.cellName = rawCell.endsWith('목장') ? rawCell : `${rawCell} 목장`;
  }

  // 3) 상담 일자 정규화 추출 (YYYY-MM-DD)
  const dateFullMatch = clean.match(REGEX_PATTERNS.DATE_NORMALIZE);
  if (dateFullMatch) {
    result.date = `${dateFullMatch[1]}-${String(dateFullMatch[2]).padStart(2, '0')}-${String(dateFullMatch[3]).padStart(2, '0')}`;
  } else {
    const dateShortMatch = clean.match(REGEX_PATTERNS.DATE_SHORT);
    if (dateShortMatch) {
      const yr = new Date().getFullYear();
      result.date = `${yr}-${String(dateShortMatch[1]).padStart(2, '0')}-${String(dateShortMatch[2]).padStart(2, '0')}`;
    }
  }

  // 4) 신앙 위험도(1~5단계) 추출
  const riskMatch = clean.match(REGEX_PATTERNS.RISK_LEVEL);
  if (riskMatch) {
    if (riskMatch[1]) {
      result.riskLevel = Number(riskMatch[1]);
    } else if (riskMatch[2]) {
      const kw = riskMatch[2];
      if (kw === '긴급' || kw === '위기') result.riskLevel = 5;
      else if (kw === '시험' || kw === '경계') result.riskLevel = 4;
      else if (kw === '주의') result.riskLevel = 3;
      else if (kw === '관심') result.riskLevel = 2;
      else result.riskLevel = 1;
    }
  }

  // 5) 카테고리 추출
  const catMatch = clean.match(REGEX_PATTERNS.CATEGORY);
  if (catMatch) {
    const cKw = catMatch[1];
    if (cKw.includes('시험') || cKw.includes('갈등')) result.category = 'trial';
    else if (cKw.includes('건강') || cKw.includes('질병')) result.category = 'health';
    else if (cKw.includes('가정') || cKw.includes('자녀')) result.category = 'family';
    else if (cKw.includes('직장') || cKw.includes('재정')) result.category = 'career';
    else if (cKw.includes('새가족') || cKw.includes('정착')) result.category = 'settle';
    else result.category = 'basic';
  }

  // 6) 섹션별 블록 정밀 분리 (1. 영적상태 / 2. 상담내용 / 3. 기도제목 / 4. 목자소견)
  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
  let currentBucket = 'content';
  const buckets = { state: [], content: [], prayer: [], opinion: [] };

  lines.forEach((line) => {
    // 메타데이터 줄은 본문 중복에서 제외
    if (
      /^(?:[•\-*▪■□]\s*)?(?:성\s*도\s*명|소\s*속\s*목\s*장|상\s*담\s*일\s*자|위\s*험\s*도|카\s*테\s*고\s*리)\s*[:：]/.test(line)
    ) {
      return;
    }

    if (/(?:영적\s*상태|영적\s*현황|예배\s*진단|1\.\s*상담\s*핵심)/.test(line)) {
      currentBucket = 'state';
      const stripped = line.replace(/^(?:[1-5]\s*[.)]|\[[^\]]+\]|[•\-*▪■])\s*(?:영적\s*상태|영적\s*현황|예배\s*진단|상담\s*핵심[^:：]*)\s*[:：]?/, '').trim();
      if (stripped) buckets.state.push(stripped);
      return;
    }
    if (/(?:상담\s*내용|상담\s*상세|심층\s*상담|나눈\s*말씀|2\.\s*상담)/.test(line)) {
      currentBucket = 'content';
      const stripped = line.replace(/^(?:[1-5]\s*[.)]|\[[^\]]+\]|[•\-*▪■])\s*(?:상담\s*내용|상담\s*상세|심층\s*상담|나눈\s*말씀)\s*[:：]?/, '').trim();
      if (stripped) buckets.content.push(stripped);
      return;
    }
    if (/(?:기도\s*제목|중보\s*기도|3\.\s*집중\s*중보)/.test(line)) {
      currentBucket = 'prayer';
      const stripped = line.replace(/^(?:[1-5]\s*[.)]|\[[^\]]+\]|[•\-*▪■])\s*(?:집중\s*)?(?:기도\s*제목|중보\s*기도)\s*[:：]?/, '').trim();
      if (stripped) buckets.prayer.push(stripped);
      return;
    }
    if (/(?:목자\s*소견|사역자\s*소견|담당\s*목자|건의\s*사항|4\.\s*담당)/.test(line)) {
      currentBucket = 'opinion';
      const stripped = line.replace(/^(?:[1-5]\s*[.)]|\[[^\]]+\]|[•\-*▪■])\s*(?:담당\s*)?(?:목자\s*소견|사역자\s*소견|건의\s*사항)\s*[:：]?/, '').trim();
      if (stripped) buckets.opinion.push(stripped);
      return;
    }

    buckets[currentBucket].push(line);
  });

  result.spiritualState = buckets.state.join('\n').trim();
  result.content = buckets.content.join('\n').trim() || clean;
  result.prayerTopics = buckets.prayer.join('\n').trim();
  result.shepherdOpinion = buckets.opinion.join('\n').trim();

  const firstMeaningfulLine = (buckets.state[0] || buckets.content[0] || clean.split('\n')[0] || '').replace(/^[•\-*1-9.)\s]+/, '');
  result.title = firstMeaningfulLine.slice(0, 48);

  return result;
}

// 📷 이미지 Canvas 고대비 전처리(Binarization) + Tesseract.js 한국어 OCR 엔진 로더
async function runPrecisionImageOcr(imageDataUrl, onProgress) {
  // 1) 이미지 해상도 및 흑백 대비 향상 전처리
  const processedDataUrl = await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 1800;
      const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          // 대비(Contrast) 강화로 흐릿한 볼펜/연필 글씨 선명화
          const contrasted = gray < 165 ? Math.max(0, gray * 0.55) : Math.min(255, gray * 1.15);
          d[i] = d[i + 1] = d[i + 2] = contrasted;
        }
        ctx.putImageData(imgData, 0, 0);
      } catch (_) {}
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(imageDataUrl);
    img.src = imageDataUrl;
  });

  // 2) 브라우저 네이티브 TextDetector API 지원 시 우선 활용
  if ('TextDetector' in window) {
    try {
      onProgress && onProgress(45);
      const img = new Image();
      img.src = processedDataUrl;
      await new Promise((r) => { img.onload = r; });
      const detector = new window.TextDetector();
      const blocks = await detector.detect(img);
      const nativeText = blocks.map(b => b.rawValue).join('\n').trim();
      if (nativeText.length > 5) {
        onProgress && onProgress(100);
        return nativeText;
      }
    } catch (_) {}
  }

  // 3) Tesseract.js 동적 로드 후 한국어+영어 정밀 OCR 수행
  if (!window.Tesseract) {
    onProgress && onProgress(25);
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  if (window.Tesseract) {
    const res = await window.Tesseract.recognize(processedDataUrl, 'kor+eng', {
      logger: (m) => {
        if (m.status === 'recognizing text' && typeof m.progress === 'number') {
          onProgress && onProgress(Math.min(98, Math.round(30 + m.progress * 68)));
        }
      }
    });
    onProgress && onProgress(100);
    return (res?.data?.text || '').trim();
  }

  return '';
}

export default function AdminCounselingTab({
  authUser = {},
  users = [],
  cells = [],
  cellMembers = [],
  counselingList = []
}) {
  // ── 1. 접속자 권한 및 담당 목장 정밀 분석 (목사 / 전도사 / 목자) ──
  const currentUserInfo = useMemo(() => {
    let u = authUser;
    if (!u || !u.name) {
      try {
        u = JSON.parse(localStorage.getItem('church_auth_user') || '{}');
      } catch {
        u = {};
      }
    }
    const name = (u?.name || localStorage.getItem('login_user_name') || '').trim();
    const role = (u?.role || '').trim();
    const office = (u?.office || '').trim();
    const group = (u?.group || u?.shepherdName || u?.cell_name || '').trim();

    const isPastor =
      name === '정신동' ||
      name === '관리자' ||
      role.includes('목사') ||
      role.includes('운영자') ||
      role.includes('관리자') ||
      office.includes('목사') ||
      !!u?.isAdmin;

    const isEvangelist =
      role.includes('전도사') ||
      role.includes('교역자') ||
      role.includes('사역자') ||
      office.includes('전도사') ||
      office.includes('교역자');

    // 실제 cells 테이블에서 본인이 담당 목자로 지정된 목장들 탐색
    const myLedCells = (cells || []).filter(
      c => (c.shepherd_name || '').trim() === name || (group && c.name === group)
    );

    const isShepherd =
      myLedCells.length > 0 ||
      role.includes('목자') ||
      role.includes('부목자') ||
      role.includes('리더') ||
      name.includes('목자');

    const hasAccess = isPastor || isEvangelist || isShepherd;
    const roleTier = isPastor ? 'PASTOR' : isEvangelist ? 'EVANGELIST' : isShepherd ? 'SHEPHERD' : 'MEMBER';

    return {
      name: name || '담당사역자',
      role: role || (isPastor ? '목사' : isEvangelist ? '전도사' : '목자'),
      office,
      group: myLedCells[0]?.name || group || '',
      myLedCellNames: myLedCells.map(c => c.name),
      isPastor,
      isEvangelist,
      isShepherd,
      hasAccess,
      roleTier
    };
  }, [authUser, cells]);

  // ── 2. 성도 <-> 소속 목장 매핑 사전 (실제 DB 데이터 기반) ──
  const memberToCellMap = useMemo(() => {
    const map = new Map();
    (cellMembers || []).forEach(cm => {
      const foundCell = (cells || []).find(c => String(c.id) === String(cm.cell_id));
      if (foundCell && cm.user_name) {
        map.set(cm.user_name.trim(), { cellId: foundCell.id, cellName: foundCell.name, shepherdName: foundCell.shepherd_name });
      }
    });
    (users || []).forEach(u => {
      if (u.name && !map.has(u.name.trim()) && (u.cell_name || u.group)) {
        map.set(u.name.trim(), { cellId: null, cellName: u.cell_name || u.group, shepherdName: u.shepherd_name || '' });
      }
    });
    return map;
  }, [cells, cellMembers, users]);

  // 실제 개설된 목장 목록만 추출 (목업 목장명 배제)
  const realCellList = useMemo(() => {
    const names = new Set();
    (cells || []).forEach(c => { if (c?.name) names.add(c.name); });
    if (currentUserInfo.group) names.add(currentUserInfo.group);
    return Array.from(names);
  }, [cells, currentUserInfo.group]);

  // ── 3. 워크스페이스 뷰 및 필터 상태 ──
  // 'kanban' (Jira 5단 칸반) | 'confluence' (Confluence 3단 문서·오더) | 'pastor_pool' (교역자 보고 모음함) | 'shepherd_room' (목자방 공유함)
  const [workspaceView, setWorkspaceView] = useState('kanban');
  const [groupByCellSwimlane, setGroupByCellSwimlane] = useState(false); // 대화면 목장별 스윔레인 그룹핑 토글
  const [selectedCellFilter, setSelectedCellFilter] = useState(() => {
    if (currentUserInfo.roleTier === 'SHEPHERD' && currentUserInfo.group) {
      return currentUserInfo.group;
    }
    return 'ALL';
  });
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // ── 4. 상담 기록카드 상태 (목업 데이터 0% — 실제 Supabase + 암호화 캐시 연동) ──
  const [records, setRecords] = useState(() => {
    try {
      // 이전 버전 목업 데이터 키 완전 삭제
      localStorage.removeItem('goodtree_counseling_standardized_v1');
      const saved = localStorage.getItem(LOCAL_ENC_CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map(decryptRecordFromDB);
      }
    } catch (_) {}
    return [];
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbSyncStatus, setDbSyncStatus] = useState('准备'); // 'LIVE' | 'LOCAL_ENCRYPTED'

  // Supabase 실시간 로드 및 양방향 동기화
  const fetchCounselingRecordsFromDB = useCallback(async () => {
    setIsSyncing(true);
    try {
      let loadedRecords = [];
      let tableExists = false;

      if (supabase) {
        const { data, error } = await supabase
          .from('pastoral_counseling_records')
          .select('*')
          .order('counseling_date', { ascending: false });

        if (!error && Array.isArray(data)) {
          tableExists = true;
          loadedRecords = data.map(decryptRecordFromDB);
          setDbSyncStatus('LIVE');
        }
      }

      // 만약 신규 테이블 생성 전이면 암호화 로컬 캐시 데이터를 유지
      if (!tableExists) {
        setDbSyncStatus('LOCAL_ENCRYPTED');
        try {
          const cached = JSON.parse(localStorage.getItem(LOCAL_ENC_CACHE_KEY) || '[]');
          loadedRecords = cached.map(decryptRecordFromDB);
        } catch (_) {}
      }

      // 기존 counseling_qna 테이블에 접수된 실제 성도 상담이 있으면 누락 없이 병합
      if (Array.isArray(counselingList) && counselingList.length > 0) {
        const existingIds = new Set(loadedRecords.map(r => String(r.id)));
        counselingList.forEach(qna => {
          const qnaId = `QNA-${qna.id}`;
          if (!existingIds.has(qnaId)) {
            const mInfo = memberToCellMap.get((qna.user_name || '').trim());
            loadedRecords.push({
              id: qnaId,
              rawQnaId: qna.id,
              memberName: qna.user_name || '성도',
              memberOffice: '성도',
              cellName: qna.cell_name || mInfo?.cellName || '미배정',
              counselorName: qna.replied_by || mInfo?.shepherdName || '담당사역자',
              counselorRole: '교역자',
              date: (qna.created_at || new Date().toISOString()).slice(0, 10),
              method: '앱 1:1 상담',
              stage: qna.status === 'answered' ? 'completed' : 'waiting',
              riskLevel: 3,
              category: 'basic',
              isSharedWithShepherds: false,
              isSubmittedToPastor: true,
              submittedAt: (qna.created_at || '').slice(0, 16).replace('T', ' '),
              hasUnreadOrder: false,
              title: decryptField(qna.title) || '앱 1:1 신앙 상담 요청',
              spiritualState: '',
              content: decryptField(qna.content) || '',
              prayerTopics: '',
              shepherdOpinion: qna.reply ? `[회신] ${decryptField(qna.reply)}` : '',
              pastorOrders: []
            });
          }
        });
      }

      setRecords(loadedRecords);
      try {
        const encryptedForCache = loadedRecords.map(encryptRecordForDB);
        localStorage.setItem(LOCAL_ENC_CACHE_KEY, JSON.stringify(encryptedForCache));
      } catch (_) {}
    } finally {
      setIsSyncing(false);
    }
  }, [counselingList, memberToCellMap]);

  useEffect(() => {
    fetchCounselingRecordsFromDB();
    if (!supabase) return;

    const channel = supabase
      .channel('pastoral_counseling_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pastoral_counseling_records' }, () => {
        fetchCounselingRecordsFromDB();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCounselingRecordsFromDB]);

  // 개별 상담카드 암호화 저장 (Supabase Upsert + 암호화 로컬 캐시 동시 반영)
  const upsertSingleCard = useCallback(async (cardObj) => {
    const encryptedRow = encryptRecordForDB(cardObj);
    const decryptedCard = decryptRecordFromDB(encryptedRow);

    setRecords(prev => {
      const exists = prev.some(r => r.id === decryptedCard.id);
      const next = exists
        ? prev.map(r => (r.id === decryptedCard.id ? decryptedCard : r))
        : [decryptedCard, ...prev];
      try {
        localStorage.setItem(LOCAL_ENC_CACHE_KEY, JSON.stringify(next.map(encryptRecordForDB)));
      } catch (_) {}
      return next;
    });

    if (supabase) {
      try {
        const { error } = await supabase
          .from('pastoral_counseling_records')
          .upsert([encryptedRow], { onConflict: 'id' });
        if (!error) setDbSyncStatus('LIVE');
      } catch (_) {}
    }
  }, []);

  // ── 5. 모달 / 팝업 / 선택 상태 ──
  const [activeCardId, setActiveCardId] = useState(null);
  const [isCardPopupOpen, setIsCardPopupOpen] = useState(false);
  const [mobilePopupTab, setMobilePopupTab] = useState('detail'); // 'detail' | 'orders' | 'history'
  const [isStandardFormOpen, setIsStandardFormOpen] = useState(false);
  const [printModeType, setPrintModeType] = useState(null); // null | 'blank' | 'filled'
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

  // 칸반 드래그앤드롭 상태
  const [draggedCardId, setDraggedCardId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  // 목사님 권면 및 후속 오더 입력 상태
  const [newOrderType, setNewOrderType] = useState(PASTOR_ORDER_TYPES[0]);
  const [newOrderDirective, setNewOrderDirective] = useState('');
  const [newOrderDueDate, setNewOrderDueDate] = useState(() => new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));

  // 표준 상담기록카드 작성 폼 상태
  const createEmptyForm = useCallback(() => ({
    id: null,
    memberName: '',
    memberOffice: '성도',
    cellName:
      selectedCellFilter !== 'ALL'
        ? selectedCellFilter
        : currentUserInfo.group || realCellList[0] || '미배정',
    counselorName: currentUserInfo.name,
    counselorRole: currentUserInfo.isPastor ? '목사' : currentUserInfo.isEvangelist ? '전도사' : '목자',
    date: new Date().toISOString().slice(0, 10),
    method: '대면심방',
    stage: 'waiting',
    riskLevel: 2,
    category: 'basic',
    isSharedWithShepherds: false,
    isSubmittedToPastor: false,
    title: '',
    spiritualState: '',
    content: '',
    prayerTopics: '',
    shepherdOpinion: ''
  }), [selectedCellFilter, currentUserInfo, realCellList]);

  const [cardForm, setCardForm] = useState(createEmptyForm);

  // 성도명 선택 시 소속 목장 및 직분 자동 매칭
  const handleSelectMemberInForm = (inputName) => {
    const trimmed = inputName.trim();
    const userObj = (users || []).find(u => (u.name || '').trim() === trimmed);
    const cellInfo = memberToCellMap.get(trimmed);
    setCardForm(prev => ({
      ...prev,
      memberName: inputName,
      memberOffice: userObj?.office || prev.memberOffice || '성도',
      cellName: cellInfo?.cellName || prev.cellName
    }));
  };

  // 📷 OCR 스캐너 상태
  const [ocrImagePreview, setOcrImagePreview] = useState(null);
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrExtractedText, setOcrExtractedText] = useState('');
  const fileInputRef = useRef(null);

  // ── 6. 권한별·목장별·뷰별 정밀 필터링 ──
  const accessibleRecords = useMemo(() => {
    return records.filter(r => {
      // 목자 권한일 경우: 본인 담당 목장 카드 OR 본인 작성 카드 OR 목자방에 공유된 카드만 열람 가능 (타 목장 비공개 상담 철저 보호)
      if (currentUserInfo.roleTier === 'SHEPHERD') {
        const isMyCell =
          currentUserInfo.myLedCellNames.includes(r.cellName) ||
          (currentUserInfo.group && r.cellName === currentUserInfo.group);
        const isMyOwn = r.counselorName === currentUserInfo.name;
        if (!isMyCell && !isMyOwn && !r.isSharedWithShepherds) return false;
      }
      return true;
    });
  }, [records, currentUserInfo]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return accessibleRecords.filter(r => {
      if (workspaceView === 'pastor_pool' && !r.isSubmittedToPastor) return false;
      if (workspaceView === 'shepherd_room' && !r.isSharedWithShepherds) return false;

      if (selectedCellFilter !== 'ALL' && r.cellName !== selectedCellFilter) return false;
      if (selectedRiskFilter !== 'ALL' && Number(r.riskLevel) !== Number(selectedRiskFilter)) return false;
      if (selectedCategoryFilter !== 'ALL' && r.category !== selectedCategoryFilter) return false;

      if (!q) return true;
      return (
        (r.memberName || '').toLowerCase().includes(q) ||
        (r.cellName || '').toLowerCase().includes(q) ||
        (r.counselorName || '').toLowerCase().includes(q) ||
        (r.title || '').toLowerCase().includes(q) ||
        (r.content || '').toLowerCase().includes(q) ||
        (r.prayerTopics || '').toLowerCase().includes(q)
      );
    });
  }, [accessibleRecords, workspaceView, selectedCellFilter, selectedRiskFilter, selectedCategoryFilter, searchQuery]);

  const activeCard = useMemo(() => {
    return accessibleRecords.find(r => r.id === activeCardId) || filteredRecords[0] || null;
  }, [accessibleRecords, activeCardId, filteredRecords]);

  // 현재 선택된 성도의 과거 누적 상담 이력
  const selectedMemberHistory = useMemo(() => {
    if (!activeCard?.memberName) return [];
    return accessibleRecords
      .filter(r => r.memberName === activeCard.memberName)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [accessibleRecords, activeCard?.memberName]);

  // ── 7. KPI 통계 및 미확인 오더 알림 집계 ──
  const stats = useMemo(() => {
    const total = accessibleRecords.length;
    const highRisk = accessibleRecords.filter(r => r.riskLevel >= 4 && r.stage !== 'completed').length;
    const pastorPoolCount = accessibleRecords.filter(r => r.isSubmittedToPastor).length;
    const shepherdRoomCount = accessibleRecords.filter(r => r.isSharedWithShepherds).length;
    const unreadOrdersForMe = accessibleRecords.filter(r => r.hasUnreadOrder).length;
    return { total, highRisk, pastorPoolCount, shepherdRoomCount, unreadOrdersForMe };
  }, [accessibleRecords]);

  // ── 8. 핵심 비즈니스 액션 핸들러 ──
  const handleStageChange = async (cardId, nextStage) => {
    const target = records.find(r => r.id === cardId);
    if (!target) return;
    await upsertSingleCard({ ...target, stage: nextStage });
  };

  const handleRiskChange = async (cardId, nextRisk) => {
    const target = records.find(r => r.id === cardId);
    if (!target) return;
    await upsertSingleCard({ ...target, riskLevel: Number(nextRisk) });
  };

  // [목자방 공유] 토글 (목자들 간 중보 및 상담 사례 공유)
  const handleToggleShareShepherds = async (card) => {
    await upsertSingleCard({
      ...card,
      isSharedWithShepherds: !card.isSharedWithShepherds
    });
  };

  // [사역자 모음함 보고 제출] 토글 (목자 ➔ 전도사·담임목사 보고)
  const handleToggleSubmitPastor = async (card) => {
    const nextState = !card.isSubmittedToPastor;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    await upsertSingleCard({
      ...card,
      isSubmittedToPastor: nextState,
      submittedAt: nextState ? nowStr : null
    });
  };

  // 👑 [목사님 권면·조언 및 후속 조치 오더 발령] (목사 ➔ 담당 목장 목자에게 실시간 하달)
  const handleIssuePastorOrder = async () => {
    if (!activeCard) return;
    if (!newOrderDirective.trim()) return alert('권면 말씀 또는 후속 조치 오더 내용을 입력해 주세요.');

    const newOrder = {
      id: `ord_${Date.now()}`,
      pastorName: currentUserInfo.name,
      pastorRole: currentUserInfo.isPastor ? '담임목사' : '담당교역자',
      orderType: newOrderType,
      directive: newOrderDirective.trim(),
      dueDate: newOrderDueDate,
      status: 'pending', // 'pending'(접수대기) | 'in_progress'(조치중) | 'done'(피드백완료)
      feedbackNote: '',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    const updatedCard = {
      ...activeCard,
      stage: activeCard.stage === 'scheduled' || activeCard.stage === 'waiting' ? 'admonition' : activeCard.stage,
      hasUnreadOrder: true, // 담당 목자에게 신규 오더 알림 배지 점등
      pastorOrders: [newOrder, ...(activeCard.pastorOrders || [])]
    };

    await upsertSingleCard(updatedCard);
    setNewOrderDirective('');
  };

  // 🌿 [담당 목자의 후속 조치 이행 상태 & 피드백 보고] (목자 ➔ 목사님께 피드백 완료 보고)
  const handleUpdateOrderFeedback = async (cardId, orderId, nextStatus, feedbackNote) => {
    const target = records.find(r => r.id === cardId);
    if (!target) return;

    const nextOrders = (target.pastorOrders || []).map(o =>
      o.id === orderId
        ? {
            ...o,
            status: nextStatus ?? o.status,
            feedbackNote: feedbackNote !== undefined ? feedbackNote : o.feedbackNote,
            updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
          }
        : o
    );

    const allDone = nextOrders.length > 0 && nextOrders.every(o => o.status === 'done');

    await upsertSingleCard({
      ...target,
      hasUnreadOrder: false,
      stage: allDone && target.stage === 'admonition' ? 'completed' : target.stage,
      pastorOrders: nextOrders
    });
  };

  // 📝 표준 상담기록카드 저장
  const handleSaveStandardCard = async (e) => {
    if (e) e.preventDefault();
    if (!cardForm.memberName.trim()) return alert('상담 대상 성도명을 입력해 주세요.');
    if (!cardForm.title.trim()) return alert('상담 핵심 한줄 요약을 입력해 주세요.');

    const dateCompact = (cardForm.date || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
    const generatedId = cardForm.id || `CSL-${dateCompact}-${String(records.length + 1).padStart(3, '0')}`;

    const finalCard = {
      ...cardForm,
      id: generatedId,
      submittedAt: cardForm.isSubmittedToPastor ? (cardForm.submittedAt || new Date().toISOString().slice(0, 16).replace('T', ' ')) : null,
      pastorOrders: cardForm.pastorOrders || []
    };

    await upsertSingleCard(finalCard);
    setActiveCardId(generatedId);
    setIsStandardFormOpen(false);
  };

  const openEditStandardForm = (card = null) => {
    if (card) {
      setCardForm({ ...card });
    } else {
      setCardForm(createEmptyForm());
    }
    setIsStandardFormOpen(true);
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('이 상담 기록카드를 영구 삭제하시겠습니까?')) return;
    setRecords(prev => {
      const next = prev.filter(r => r.id !== cardId);
      try {
        localStorage.setItem(LOCAL_ENC_CACHE_KEY, JSON.stringify(next.map(encryptRecordForDB)));
      } catch (_) {}
      return next;
    });
    if (supabase) {
      try {
        await supabase.from('pastoral_counseling_records').delete().eq('id', cardId);
      } catch (_) {}
    }
    setIsCardPopupOpen(false);
  };

  // ── 9. 📷 정밀 OCR 이미지 스캔 및 정규식 자동 파싱 ──
  const handleImageFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setOcrImagePreview(dataUrl);
      setIsOcrScanning(true);
      setOcrProgress(10);

      try {
        const extracted = await runPrecisionImageOcr(dataUrl, (prog) => setOcrProgress(prog));
        setOcrExtractedText(extracted);
      } catch (_) {
        setOcrProgress(100);
      } finally {
        setIsOcrScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyOcrToStandardForm = () => {
    if (!ocrExtractedText.trim()) return alert('인식되거나 붙여넣은 상담 텍스트가 없습니다.');

    const parsed = parseCounselingTextByRegex(
      ocrExtractedText,
      cardForm.cellName,
      cardForm.memberName
    );

    const matchedCell = parsed.memberName ? memberToCellMap.get(parsed.memberName) : null;

    setCardForm(prev => ({
      ...prev,
      memberName: parsed.memberName || prev.memberName,
      memberOffice: parsed.memberOffice || prev.memberOffice,
      cellName: matchedCell?.cellName || parsed.cellName || prev.cellName,
      date: parsed.date || prev.date,
      riskLevel: parsed.riskLevel || prev.riskLevel,
      category: parsed.category || prev.category,
      title: parsed.title || prev.title || '수기 상담카드 OCR 스캔 기록',
      spiritualState: [prev.spiritualState, parsed.spiritualState].filter(Boolean).join('\n'),
      content: [prev.content, parsed.content].filter(Boolean).join('\n\n'),
      prayerTopics: [prev.prayerTopics, parsed.prayerTopics].filter(Boolean).join('\n'),
      shepherdOpinion: [prev.shepherdOpinion, parsed.shepherdOpinion].filter(Boolean).join('\n')
    }));

    setIsOcrModalOpen(false);
    setIsStandardFormOpen(true);
  };

  const getRiskMeta = (lvl) => RISK_LEVELS.find(r => r.level === Number(lvl)) || RISK_LEVELS[1];
  const getCatMeta = (catId) => COUNSELING_CATEGORIES.find(c => c.id === catId) || COUNSELING_CATEGORIES[0];
  const getStageMeta = (stId) => KANBAN_STAGES.find(s => s.id === stId) || KANBAN_STAGES[1];

  // 권한 미달 차단 게이트
  if (!currentUserInfo.hasAccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-xl border border-zinc-200 p-8 text-center select-none">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center text-2xl mb-4 shadow-xs">
          🔒
        </div>
        <h3 className="text-lg font-black text-zinc-900 tracking-tight">교역자(목사·전도사) 및 목자 전용 보안 구역</h3>
        <p className="text-xs font-medium text-zinc-500 max-w-md mt-2 leading-relaxed">
          신앙 상담실은 AES-256 종단간 암호화로 보호되며, 담임목사·전도사·각 목장 목자 권한을 부여받은 리더십만 접근할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden font-sans select-none text-zinc-900 relative">
      
      {/* 🖨️ A4 고정 폼 인쇄 전용 CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #gt-printable-counseling-sheet, #gt-printable-counseling-sheet * {
            visibility: visible !important;
          }
          #gt-printable-counseling-sheet {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 12mm !important;
            margin: 0 !important;
            background: #FFFFFF !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 99999 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* =========================================================================
          [1] 상단 엔터프라이즈 헤더 (권한·암호화 상태 + OCR 스캔 + 표준양식 인쇄 + 새 상담카드)
          ========================================================================= */}
      <div className="shrink-0 bg-zinc-50/90 border-b border-zinc-200 px-3.5 sm:px-5 py-3 flex flex-col gap-2.5">
        
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-[11px] font-black tracking-tight flex items-center gap-1.5 shrink-0">
              <span>🛡️</span>
              <span>
                {currentUserInfo.roleTier === 'PASTOR' ? '목회자(목사) 통합관제' :
                 currentUserInfo.roleTier === 'EVANGELIST' ? '교역자(전도사) 관제' :
                 `${currentUserInfo.group || '담당목장'} 목자 권한`}
              </span>
            </span>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-[14.5px] sm:text-[15.5px] font-black text-zinc-900 tracking-tight truncate">
                  신앙 상담실 (Pastoral Jira & Confluence)
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-mono font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  🔐 AES-256 암호화 · {dbSyncStatus === 'LIVE' ? 'DB 실시간 동기화' : '로컬 보안 동기화'}
                </span>
              </div>
              <p className="text-[10.5px] text-zinc-500 font-medium truncate mt-0.5">
                목장별 상담 분리 ➔ 목자방 공유 및 교역자 모음함 보고 ➔ 목사님 권면·오더 발령 ➔ 목자 후속 피드백
              </p>
            </div>
          </div>

          {/* 우측 액션 버튼 그룹 */}
          <div className="flex items-center gap-1.5 flex-wrap ml-auto">
            {stats.unreadOrdersForMe > 0 && (
              <button
                type="button"
                onClick={() => setWorkspaceView('confluence')}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-zinc-950 text-[11px] font-black flex items-center gap-1 animate-pulse cursor-pointer shadow-xs"
              >
                <span>🔔 목사님 신규 오더 {stats.unreadOrdersForMe}건</span>
              </button>
            )}

            <button
              type="button"
              onClick={fetchCounselingRecordsFromDB}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 text-[11px] font-bold cursor-pointer shadow-2xs"
              title="DB 최신 상태 동기화"
            >
              {isSyncing ? '🔄 동기화중...' : '🔄 새로고침'}
            </button>

            <button
              type="button"
              onClick={() => {
                setOcrImagePreview(null);
                setOcrExtractedText('');
                setIsOcrModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-black flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 transition-all"
            >
              <span>📷</span>
              <span>OCR 스캔</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintModeType('blank')}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 transition-all"
            >
              <span>🖨️</span>
              <span className="hidden sm:inline">표준카드 양식/인쇄</span>
              <span className="sm:hidden">인쇄</span>
            </button>

            <button
              type="button"
              onClick={() => openEditStandardForm(null)}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-black flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 transition-all"
            >
              <span>＋</span>
              <span>상담카드 작성</span>
            </button>
          </div>
        </div>

        {/* 2열: 4대 워크스페이스 탭 + 목장별 스윔레인 토글 + 정밀 필터 */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200/80">
          
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
            <div className="flex bg-zinc-200/70 p-0.5 rounded-lg border border-zinc-300/60 text-[11px] font-bold shrink-0">
              <button
                type="button"
                onClick={() => setWorkspaceView('kanban')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                  workspaceView === 'kanban' ? 'bg-white text-zinc-900 shadow-2xs font-black' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <span>📋</span> <span>Jira 칸반보드 ({accessibleRecords.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceView('confluence')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                  workspaceView === 'confluence' ? 'bg-white text-zinc-900 shadow-2xs font-black' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <span>📑</span> <span>Confluence 상담문서·오더</span>
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceView('pastor_pool')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                  workspaceView === 'pastor_pool' ? 'bg-white text-indigo-700 shadow-2xs font-black' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <span>📥</span> <span>사역자 보고 모음함 ({stats.pastorPoolCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceView('shepherd_room')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                  workspaceView === 'shepherd_room' ? 'bg-white text-emerald-700 shadow-2xs font-black' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <span>🌿</span> <span>목자방 공유함 ({stats.shepherdRoomCount})</span>
              </button>
            </div>

            {workspaceView === 'kanban' && (
              <button
                type="button"
                onClick={() => setGroupByCellSwimlane(!groupByCellSwimlane)}
                className={`hidden md:inline-flex px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer shrink-0 ${
                  groupByCellSwimlane
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                }`}
                title="PC/태블릿 대화면에서 목장별로 행(Swimlane)을 나누어 비교합니다"
              >
                {groupByCellSwimlane ? '✓ 목장별 스윔레인 분리뷰' : '⊞ 목장별 분리뷰 전환'}
              </button>
            )}
          </div>

          {/* 우측 필터 바 (목장 / 5단계 위험도 / 6대 카테고리 / 검색) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <select
              value={selectedCellFilter}
              onChange={(e) => setSelectedCellFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-zinc-200 text-[11px] font-bold text-zinc-800 outline-none cursor-pointer shadow-2xs"
            >
              <option value="ALL">전체 목장 ({realCellList.length}개)</option>
              {realCellList.map(cName => (
                <option key={cName} value={cName}>{cName}</option>
              ))}
            </select>

            <select
              value={selectedRiskFilter}
              onChange={(e) => setSelectedRiskFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-zinc-200 text-[11px] font-bold text-zinc-800 outline-none cursor-pointer shadow-2xs"
            >
              <option value="ALL">위험도 (전체 1~5단계)</option>
              {RISK_LEVELS.map(rk => (
                <option key={rk.level} value={rk.level}>{rk.label}</option>
              ))}
            </select>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-zinc-200 text-[11px] font-bold text-zinc-800 outline-none cursor-pointer shadow-2xs"
            >
              <option value="ALL">전체 카테고리</option>
              {COUNSELING_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>

            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="성도, 목장, 상담키워드..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-3 pr-6 py-1.5 rounded-lg bg-white border border-zinc-200 text-[11px] font-bold text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-800 w-36 sm:w-44 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-[10px] text-zinc-400 hover:text-zinc-800 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          [2] 메인 워크스페이스 바디 (PC/태블릿 대화면 & 모바일 최적화)
          ========================================================================= */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-zinc-100/60">
        
        {/* 등록된 상담카드가 하나도 없을 때의 안내 화면 (목업 0%) */}
        {filteredRecords.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 shadow-2xs flex items-center justify-center text-xl mb-3">
              📋
            </div>
            <h3 className="text-sm font-black text-zinc-900">
              {workspaceView === 'pastor_pool'
                ? '사역자 보고 모음함에 제출된 상담카드가 없습니다.'
                : workspaceView === 'shepherd_room'
                ? '목자방에 공유된 상담카드가 없습니다.'
                : '조건에 해당하는 신앙 상담 기록카드가 없습니다.'}
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-md leading-relaxed">
              우측 상단의 <b>[＋ 상담카드 작성]</b> 버튼을 눌러 목원 상담을 기록하거나, <b>[📷 OCR 스캔]</b>으로 수기 상담지를 촬영해 등록하세요.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => openEditStandardForm(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-black cursor-pointer shadow-xs"
              >
                ＋ 첫 상담카드 작성하기
              </button>
              <button
                type="button"
                onClick={() => setPrintModeType('blank')}
                className="px-4 py-2 rounded-xl bg-white border border-zinc-300 text-zinc-800 text-xs font-bold cursor-pointer"
              >
                🖨️ 수기용 빈 양식 인쇄
              </button>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            VIEW 1: Jira 5단 드래그앤드롭 칸반 보드 (일반 칸반 vs 목장별 스윔레인 뷰)
           ------------------------------------------------------------------- */}
        {filteredRecords.length > 0 && workspaceView === 'kanban' && !groupByCellSwimlane && (
          <div className="flex-1 overflow-x-auto overflow-y-auto p-3 sm:p-4 hide-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 min-w-0 md:min-w-[1080px] xl:min-w-full h-full items-start">
              {KANBAN_STAGES.map(stage => {
                const stageCards = filteredRecords.filter(r => r.stage === stage.id);
                const isDragOver = dragOverStage === stage.id;

                return (
                  <div
                    key={stage.id}
                    onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.id); }}
                    onDragLeave={() => setDragOverStage(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverStage(null);
                      const droppedId = e.dataTransfer.getData('text/plain') || draggedCardId;
                      if (droppedId) handleStageChange(droppedId, stage.id);
                    }}
                    className={`rounded-xl border flex flex-col max-h-full transition-all ${
                      isDragOver
                        ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-300/60'
                        : 'bg-zinc-100/90 border-zinc-200/90'
                    }`}
                  >
                    <div className="p-3 bg-white rounded-t-xl border-b border-zinc-200/80 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.dotColor }} />
                        <span className="text-[12.5px] font-black text-zinc-900">{stage.label}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-black bg-zinc-100 text-zinc-700 border border-zinc-200">
                        {stageCards.length}
                      </span>
                    </div>

                    <div className="p-2.5 space-y-2.5 overflow-y-auto hide-scrollbar max-h-[calc(100vh-245px)]">
                      {stageCards.map(card => {
                        const rk = getRiskMeta(card.riskLevel);
                        const cat = getCatMeta(card.category);
                        const pendingOrders = (card.pastorOrders || []).filter(o => o.status !== 'done').length;

                        return (
                          <div
                            key={card.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', card.id);
                              setDraggedCardId(card.id);
                            }}
                            onDragEnd={() => { setDraggedCardId(null); setDragOverStage(null); }}
                            onClick={() => {
                              setActiveCardId(card.id);
                              setMobilePopupTab('detail');
                              setIsCardPopupOpen(true);
                            }}
                            className={`p-3.5 rounded-xl bg-white border border-zinc-200 hover:border-zinc-400 shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing flex flex-col gap-2 relative ${
                              draggedCardId === card.id ? 'opacity-40 scale-95' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${rk.bgCls}`}>
                                {rk.short}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                                {cat.label}
                              </span>
                              <div className="flex items-center gap-1 ml-auto">
                                {card.isSharedWithShepherds && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200" title="목자방 공유됨">
                                    🌿목자방
                                  </span>
                                )}
                                {card.isSubmittedToPastor && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200" title="사역자 모음함 보고됨">
                                    📥사역자보고
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-0.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[13.5px] font-black text-zinc-900 truncate">{card.memberName}</span>
                                <span className="text-[10.5px] font-bold text-zinc-500 shrink-0">{card.memberOffice}</span>
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50/80 px-1.5 py-0.2 rounded border border-indigo-100 shrink-0">
                                  {card.cellName}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-zinc-400 shrink-0">{card.date}</span>
                            </div>

                            <h4 className="text-[12px] font-extrabold text-zinc-800 leading-snug line-clamp-2">
                              {card.title}
                            </h4>
                            <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                              {card.content}
                            </p>

                            {card.pastorOrders && card.pastorOrders.length > 0 && (
                              <div className={`px-2.5 py-1.5 rounded-lg border text-[10.5px] font-bold flex items-center justify-between ${
                                pendingOrders > 0
                                  ? 'bg-amber-50/95 border-amber-300 text-amber-900'
                                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                              }`}>
                                <span className="truncate">
                                  👑 {card.pastorOrders[0].orderType}
                                </span>
                                <span className="font-mono text-[9.5px] shrink-0 ml-1 font-black">
                                  {pendingOrders > 0 ? `오더 ${pendingOrders}건` : '피드백완료'}
                                </span>
                              </div>
                            )}

                            <div
                              className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-500"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="font-bold truncate">
                                ✍️ {card.counselorName} ({card.counselorRole})
                              </span>
                              <select
                                value={card.stage}
                                onChange={(e) => handleStageChange(card.id, e.target.value)}
                                className="px-1.5 py-0.5 rounded bg-zinc-50 border border-zinc-200 text-[10px] font-bold text-zinc-700 outline-none cursor-pointer"
                              >
                                {KANBAN_STAGES.map(st => (
                                  <option key={st.id} value={st.id}>{st.short}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            VIEW 1-B: 대화면 전용 ‘목장별 스윔레인(Swimlane) 분리 칸반 뷰’
           ------------------------------------------------------------------- */}
        {filteredRecords.length > 0 && workspaceView === 'kanban' && groupByCellSwimlane && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
            {Array.from(new Set(filteredRecords.map(r => r.cellName))).map(cName => {
              const cellCards = filteredRecords.filter(r => r.cellName === cName);
              return (
                <div key={cName} className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
                  <div className="px-4 py-2.5 bg-zinc-900 text-white flex items-center justify-between">
                    <span className="text-xs font-black">🌿 {cName} 상담 파이프라인 ({cellCards.length}건)</span>
                    <span className="text-[10.5px] font-mono text-zinc-300">
                      긴급/시험 {cellCards.filter(c => c.riskLevel >= 4).length}건 · 목사님오더 {cellCards.reduce((a, c) => a + (c.pastorOrders?.length || 0), 0)}건
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-zinc-200">
                    {KANBAN_STAGES.map(st => {
                      const list = cellCards.filter(c => c.stage === st.id);
                      return (
                        <div key={st.id} className="p-2.5 min-h-[140px] bg-zinc-50/40 space-y-2">
                          <div className="text-[10.5px] font-black text-zinc-500 flex justify-between">
                            <span>{st.label}</span>
                            <span className="font-mono">{list.length}</span>
                          </div>
                          {list.map(card => (
                            <div
                              key={card.id}
                              onClick={() => { setActiveCardId(card.id); setIsCardPopupOpen(true); }}
                              className="p-2.5 rounded-lg bg-white border border-zinc-200 hover:border-zinc-400 cursor-pointer shadow-2xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-xs text-zinc-900">{card.memberName}</span>
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getRiskMeta(card.riskLevel).bgCls}`}>
                                  {getRiskMeta(card.riskLevel).short}
                                </span>
                              </div>
                              <p className="text-[11px] font-bold text-zinc-700 truncate">{card.title}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* -------------------------------------------------------------------
            VIEW 2, 3, 4: Confluence 3단 와이드 문서·오더 워크스페이스 (PC/태블릿 대화면 최적화)
           ------------------------------------------------------------------- */}
        {filteredRecords.length > 0 && workspaceView !== 'kanban' && (
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden bg-white">
            
            {/* [좌측 패널] 목장별 상담 문서 디렉토리 */}
            <div className="w-full lg:w-[320px] xl:w-[350px] border-b lg:border-b-0 lg:border-r border-zinc-200 flex flex-col min-h-0 bg-zinc-50/60 shrink-0">
              <div className="px-4 py-3 bg-white border-b border-zinc-200 flex items-center justify-between">
                <span className="text-[12px] font-black text-zinc-900">
                  {workspaceView === 'pastor_pool'
                    ? '📥 사역자(목사·전도사) 보고 모음함'
                    : workspaceView === 'shepherd_room'
                    ? '🌿 목자방(동역 목자) 공유 모음함'
                    : '📑 목장별 상담 문서 디렉토리'}
                </span>
                <span className="text-[10.5px] font-mono font-bold text-zinc-500">{filteredRecords.length}건</span>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-2 hide-scrollbar">
                {filteredRecords.map(card => {
                  const isSel = activeCard?.id === card.id;
                  const rk = getRiskMeta(card.riskLevel);
                  const st = getStageMeta(card.stage);

                  return (
                    <div
                      key={card.id}
                      onClick={() => {
                        setActiveCardId(card.id);
                        if (window.innerWidth < 1024) {
                          setMobilePopupTab('detail');
                          setIsCardPopupOpen(true);
                        }
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                        isSel
                          ? 'bg-zinc-900 border-zinc-900 text-white shadow-md'
                          : 'bg-white border-zinc-200 hover:border-zinc-400 text-zinc-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold border shrink-0 ${rk.bgCls}`}>
                            {rk.short}
                          </span>
                          <span className={`text-[13px] font-black truncate ${isSel ? 'text-white' : 'text-zinc-900'}`}>
                            {card.memberName}
                          </span>
                          <span className={`text-[10.5px] font-bold shrink-0 ${isSel ? 'text-zinc-300' : 'text-zinc-500'}`}>
                            ({card.cellName})
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 shrink-0">{card.date}</span>
                      </div>

                      <p className={`text-[12px] font-bold truncate ${isSel ? 'text-zinc-100' : 'text-zinc-800'}`}>
                        {card.title}
                      </p>

                      <div className="flex items-center justify-between text-[10px] pt-1">
                        <span className={isSel ? 'text-zinc-400' : 'text-zinc-500'}>
                          ✍️ {card.counselorName} ({card.counselorRole})
                        </span>
                        <span className={`px-1.5 py-0.2 rounded border text-[9.5px] font-bold ${st.badgeCls}`}>
                          {st.short}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* [중앙 패널] Confluence 표준 상담 문서 원문 & 공유/보고 라우팅 컨트롤 */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 hide-scrollbar bg-white min-w-0">
              {activeCard && (
                <div className="max-w-3xl mx-auto space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-zinc-200">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10.5px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                        {activeCard.id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${getRiskMeta(activeCard.riskLevel).bgCls}`}>
                        {getRiskMeta(activeCard.riskLevel).label}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                        {getCatMeta(activeCard.category).label}
                      </span>
                    </div>

                    {/* 공유 및 인쇄·수정 버튼 */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleToggleShareShepherds(activeCard)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black border cursor-pointer transition-all ${
                          activeCard.isSharedWithShepherds
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        {activeCard.isSharedWithShepherds ? '🌿 목자방 공유중' : '🌿 목자방 공유'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleSubmitPastor(activeCard)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black border cursor-pointer transition-all ${
                          activeCard.isSubmittedToPastor
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50'
                        }`}
                      >
                        {activeCard.isSubmittedToPastor ? '📥 사역자 모음함 보고됨' : '📤 사역자(목사·전도사) 보고'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setPrintModeType('filled')}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-bold border border-zinc-200 cursor-pointer"
                      >
                        🖨️ 인쇄
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditStandardForm(activeCard)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-bold cursor-pointer"
                      >
                        ✏️ 수정
                      </button>
                    </div>
                  </div>

                  {/* 표준 상담 문서 본문 */}
                  <div className="p-5 rounded-2xl bg-zinc-50/70 border border-zinc-200 space-y-4">
                    <h3 className="text-lg font-black text-zinc-900 leading-snug">{activeCard.title}</h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-zinc-200">
                        <span className="text-[10px] font-bold text-zinc-400 block">상담 대상 성도</span>
                        <span className="font-black text-zinc-900">{activeCard.memberName} ({activeCard.memberOffice})</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-zinc-200">
                        <span className="text-[10px] font-bold text-zinc-400 block">소속 목장</span>
                        <span className="font-black text-indigo-700">{activeCard.cellName}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-zinc-200">
                        <span className="text-[10px] font-bold text-zinc-400 block">상담자 (직책)</span>
                        <span className="font-black text-zinc-900">{activeCard.counselorName} ({activeCard.counselorRole})</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-zinc-200">
                        <span className="text-[10px] font-bold text-zinc-400 block">상담 일자 · 방식</span>
                        <span className="font-black text-zinc-900">{activeCard.date} · {activeCard.method}</span>
                      </div>
                    </div>

                    {activeCard.spiritualState && (
                      <div className="p-3.5 rounded-xl bg-white border border-zinc-200 space-y-1">
                        <span className="text-[10.5px] font-black text-zinc-500 uppercase">1. 현재 영적 상태 및 예배·QT 진단</span>
                        <p className="text-[12.5px] font-medium text-zinc-800 leading-relaxed whitespace-pre-wrap">{activeCard.spiritualState}</p>
                      </div>
                    )}

                    <div className="p-3.5 rounded-xl bg-white border border-zinc-200 space-y-1">
                      <span className="text-[10.5px] font-black text-zinc-500 uppercase">2. 심층 상담 내용 및 나눈 말씀</span>
                      <p className="text-[12.5px] font-medium text-zinc-800 leading-relaxed whitespace-pre-wrap">{activeCard.content}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200 space-y-1">
                        <span className="text-[10.5px] font-black text-purple-800 uppercase">3. 집중 중보기도 제목</span>
                        <p className="text-[12px] font-medium text-zinc-800 leading-relaxed whitespace-pre-wrap">{activeCard.prayerTopics || '-'}</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-200 space-y-1">
                        <span className="text-[10.5px] font-black text-sky-800 uppercase">4. 담당 목자 소견 및 건의사항</span>
                        <p className="text-[12px] font-medium text-zinc-800 leading-relaxed whitespace-pre-wrap">{activeCard.shepherdOpinion || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* 👑 목사님 권면·조언 및 후속 조치 오더 & 목자 피드백 루프 */}
                  <div className="p-5 rounded-2xl bg-amber-50/40 border-2 border-amber-300/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-black text-amber-800 uppercase">PASTORAL DIRECTIVE & SHEPHERD FEEDBACK</span>
                        <h4 className="text-[14.5px] font-black text-zinc-900">👑 목사님 권면·조언 및 후속 조치 오더</h4>
                      </div>
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                        오더 {(activeCard.pastorOrders || []).length}건
                      </span>
                    </div>

                    {/* 교역자(목사·전도사) 전용 오더 발령 폼 */}
                    {(currentUserInfo.isPastor || currentUserInfo.isEvangelist) && (
                      <div className="p-3.5 rounded-xl bg-white border border-amber-200 space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-zinc-500 block mb-1">후속 조치 오더 구분</label>
                            <select
                              value={newOrderType}
                              onChange={(e) => setNewOrderType(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-900 outline-none"
                            >
                              {PASTOR_ORDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-zinc-500 block mb-1">권고 기한</label>
                            <input
                              type="date"
                              value={newOrderDueDate}
                              onChange={(e) => setNewOrderDueDate(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-900 outline-none"
                            />
                          </div>
                        </div>

                        <textarea
                          rows={2}
                          value={newOrderDirective}
                          onChange={(e) => setNewOrderDirective(e.target.value)}
                          placeholder="담당 목자님께 전달할 목회 권면, 심방 지시, 말씀 처방 오더를 입력하세요..."
                          className="w-full p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-medium text-zinc-900 outline-none resize-none"
                        />

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleIssuePastorOrder}
                            className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-black cursor-pointer shadow-xs"
                          >
                            ⚡ 담당 목자에게 후속 오더 하달하기
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 오더 내역 및 목자 이행 피드백 */}
                    <div className="space-y-2.5">
                      {(activeCard.pastorOrders || []).length === 0 ? (
                        <div className="py-6 text-center text-xs font-bold text-amber-800/60">
                          발령된 목사님 후속 조치 오더가 없습니다.
                        </div>
                      ) : (
                        (activeCard.pastorOrders || []).map(ord => (
                          <div key={ord.id} className="p-3.5 rounded-xl bg-white border border-amber-200 shadow-2xs space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10.5px] font-black">
                                  {ord.orderType}
                                </span>
                                <span className="text-[11px] font-bold text-zinc-700">
                                  발령: {ord.pastorName} ({ord.createdAt})
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[10.5px] font-mono text-zinc-500">기한: {ord.dueDate}</span>
                                <select
                                  value={ord.status}
                                  onChange={(e) => handleUpdateOrderFeedback(activeCard.id, ord.id, e.target.value, undefined)}
                                  className={`px-2 py-0.5 rounded text-[10.5px] font-black border outline-none cursor-pointer ${
                                    ord.status === 'done'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                      : ord.status === 'in_progress'
                                      ? 'bg-sky-50 text-sky-700 border-sky-300'
                                      : 'bg-rose-50 text-rose-700 border-rose-300'
                                  }`}
                                >
                                  <option value="pending">🔴 오더 접수대기</option>
                                  <option value="in_progress">🔵 목자 조치중</option>
                                  <option value="done">🟢 피드백 완료</option>
                                </select>
                              </div>
                            </div>

                            <p className="text-xs font-bold text-zinc-800 leading-relaxed bg-amber-50/40 p-2.5 rounded-lg border border-amber-100">
                              "{ord.directive}"
                            </p>

                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-[10.5px] font-black text-zinc-500 shrink-0">💬 목자 이행 피드백:</span>
                              <input
                                type="text"
                                value={ord.feedbackNote || ''}
                                onChange={(e) => handleUpdateOrderFeedback(activeCard.id, ord.id, undefined, e.target.value)}
                                placeholder="목자님께서 오더를 이행한 후 결과/피드백을 입력하면 목사님께 실시간 보고됩니다..."
                                className="flex-1 px-2.5 py-1 rounded-md bg-zinc-50 border border-zinc-200 text-[11.5px] font-medium text-zinc-800 outline-none focus:bg-white focus:border-zinc-500"
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* [우측 3단 패널 - 대화면 XL 전용] 선택된 성도의 누적 상담 히스토리 타임라인 */}
            {activeCard && (
              <div className="hidden xl:flex w-[280px] border-l border-zinc-200 bg-zinc-50/70 p-4 flex-col gap-3 shrink-0 overflow-y-auto hide-scrollbar">
                <div className="border-b border-zinc-200 pb-2.5">
                  <span className="text-[10px] font-mono font-black uppercase text-zinc-400 block">MEMBER CARE HISTORY</span>
                  <h4 className="text-sm font-black text-zinc-900 mt-0.5">
                    📜 {activeCard.memberName} 성도 누적 상담 ({selectedMemberHistory.length}건)
                  </h4>
                </div>
                <div className="space-y-2">
                  {selectedMemberHistory.map(h => (
                    <div
                      key={h.id}
                      onClick={() => setActiveCardId(h.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        h.id === activeCard.id
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-white text-zinc-800 border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] opacity-75">{h.date}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getRiskMeta(h.riskLevel).bgCls}`}>
                          {getRiskMeta(h.riskLevel).short}
                        </span>
                      </div>
                      <p className="font-bold line-clamp-2 leading-snug">{h.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* =========================================================================
          [3] 📱 모바일 & 태블릿 정밀 ‘성도별 신앙 상담 카드 팝업’ (3탭 구조)
          - 탭 1: 📝 상담 기록 원문 & 공유/위험도 즉시 변경
          - 탭 2: 👑 목사님 권면·오더 & 목자 피드백 등록
          - 탭 3: 📜 이 성도의 누적 상담 히스토리
          ========================================================================= */}
      {isCardPopupOpen && activeCard && (
        <div
          className="fixed inset-0 z-[320] bg-zinc-950/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setIsCardPopupOpen(false)}
        >
          <div
            className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl border border-zinc-200 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 팝업 헤더 */}
            <div className="px-5 py-3.5 bg-zinc-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${getRiskMeta(activeCard.riskLevel).bgCls}`}>
                  {getRiskMeta(activeCard.riskLevel).short}
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-black truncate">
                    {activeCard.memberName} ({activeCard.memberOffice} · {activeCard.cellName})
                  </h3>
                  <span className="text-[10px] text-zinc-400 font-mono block">
                    {activeCard.id} • 상담자: {activeCard.counselorName}({activeCard.counselorRole})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCardPopupOpen(false)}
                className="text-zinc-400 hover:text-white text-sm font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 팝업 내부 3단 탭 스위처 */}
            <div className="px-4 pt-2.5 bg-zinc-100 border-b border-zinc-200 flex gap-1.5 shrink-0">
              {[
                { id: 'detail', label: '📝 상담기록 카드' },
                { id: 'orders', label: `👑 목사님 권면·오더 (${(activeCard.pastorOrders || []).length})` },
                { id: 'history', label: `📜 성도 누적 이력 (${selectedMemberHistory.length})` }
              ].map(tItem => (
                <button
                  key={tItem.id}
                  type="button"
                  onClick={() => setMobilePopupTab(tItem.id)}
                  className={`px-3 py-2 rounded-t-xl text-xs font-black border-t border-x transition-all cursor-pointer ${
                    mobilePopupTab === tItem.id
                      ? 'bg-white text-zinc-900 border-zinc-200'
                      : 'bg-transparent text-zinc-500 border-transparent hover:text-zinc-800'
                  }`}
                >
                  {tItem.label}
                </button>
              ))}
            </div>

            {/* 팝업 바디 */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 hide-scrollbar text-xs">
              {mobilePopupTab === 'detail' && (
                <>
                  {/* 상태·위험도·공유 원터치 컨트롤 바 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1">칸반 단계</label>
                      <select
                        value={activeCard.stage}
                        onChange={(e) => handleStageChange(activeCard.id, e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border border-zinc-300 font-black text-zinc-900 text-[11px] outline-none"
                      >
                        {KANBAN_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 block mb-1">신앙 위험도</label>
                      <select
                        value={activeCard.riskLevel}
                        onChange={(e) => handleRiskChange(activeCard.id, e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border border-zinc-300 font-black text-zinc-900 text-[11px] outline-none"
                      >
                        {RISK_LEVELS.map(r => <option key={r.level} value={r.level}>{r.label}</option>)}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => handleToggleShareShepherds(activeCard)}
                        className={`w-full py-1.5 px-2 rounded-lg font-black text-[11px] border cursor-pointer ${
                          activeCard.isSharedWithShepherds
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-emerald-700 border-emerald-300'
                        }`}
                      >
                        {activeCard.isSharedWithShepherds ? '🌿 목자방 공유중' : '🌿 목자방 공유'}
                      </button>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => handleToggleSubmitPastor(activeCard)}
                        className={`w-full py-1.5 px-2 rounded-lg font-black text-[11px] border cursor-pointer ${
                          activeCard.isSubmittedToPastor
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-indigo-700 border-indigo-300'
                        }`}
                      >
                        {activeCard.isSubmittedToPastor ? '📥 사역자 보고됨' : '📤 사역자 보고'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-zinc-400 block">
                      {activeCard.date} • {activeCard.method} • {getCatMeta(activeCard.category).label}
                    </span>
                    <h4 className="text-base font-black text-zinc-900 mt-0.5">{activeCard.title}</h4>
                  </div>

                  {activeCard.spiritualState && (
                    <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                      <span className="text-[10px] font-black text-zinc-500">1. 영적 상태 및 예배·QT 진단</span>
                      <p className="text-zinc-800 font-medium leading-relaxed whitespace-pre-wrap">{activeCard.spiritualState}</p>
                    </div>
                  )}

                  <div className="p-3.5 rounded-xl bg-white border border-zinc-200 space-y-1">
                    <span className="text-[10px] font-black text-zinc-500">2. 심층 상담 상세 기록</span>
                    <p className="text-zinc-800 font-medium leading-relaxed whitespace-pre-wrap">{activeCard.content}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200 space-y-1">
                      <span className="text-[10px] font-black text-purple-800">3. 집중 중보기도 제목</span>
                      <p className="text-zinc-800 font-medium leading-relaxed whitespace-pre-wrap">{activeCard.prayerTopics || '-'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-200 space-y-1">
                      <span className="text-[10px] font-black text-sky-800">4. 담당 목자 소견</span>
                      <p className="text-zinc-800 font-medium leading-relaxed whitespace-pre-wrap">{activeCard.shepherdOpinion || '-'}</p>
                    </div>
                  </div>
                </>
              )}

              {mobilePopupTab === 'orders' && (
                <div className="space-y-3">
                  {(currentUserInfo.isPastor || currentUserInfo.isEvangelist) && (
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-300 space-y-2.5">
                      <span className="text-[11px] font-black text-amber-900 block">👑 목사님 권면 및 후속 조치 오더 발령</span>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={newOrderType}
                          onChange={(e) => setNewOrderType(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-bold"
                        >
                          {PASTOR_ORDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input
                          type="date"
                          value={newOrderDueDate}
                          onChange={(e) => setNewOrderDueDate(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-bold"
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={newOrderDirective}
                        onChange={(e) => setNewOrderDirective(e.target.value)}
                        placeholder="권면 말씀 및 후속 조치 지시사항..."
                        className="w-full p-2.5 rounded-lg bg-white border border-amber-300 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleIssuePastorOrder}
                        className="w-full py-2 rounded-lg bg-amber-600 text-white font-black text-xs cursor-pointer"
                      >
                        ⚡ 후속 조치 오더 등록
                      </button>
                    </div>
                  )}

                  {(activeCard.pastorOrders || []).length === 0 ? (
                    <div className="py-12 text-center text-zinc-400 font-bold">
                      등록된 목사님 권면·후속 오더가 없습니다.
                    </div>
                  ) : (
                    (activeCard.pastorOrders || []).map(ord => (
                      <div key={ord.id} className="p-3.5 rounded-xl bg-white border border-amber-300 space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-black text-[11px]">
                            {ord.orderType}
                          </span>
                          <select
                            value={ord.status}
                            onChange={(e) => handleUpdateOrderFeedback(activeCard.id, ord.id, e.target.value, undefined)}
                            className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-300 text-[10.5px] font-black"
                          >
                            <option value="pending">🔴 접수대기</option>
                            <option value="in_progress">🔵 조치이행중</option>
                            <option value="done">🟢 피드백완료</option>
                          </select>
                        </div>
                        <p className="text-zinc-900 font-bold leading-relaxed">"{ord.directive}"</p>
                        <input
                          type="text"
                          value={ord.feedbackNote || ''}
                          onChange={(e) => handleUpdateOrderFeedback(activeCard.id, ord.id, undefined, e.target.value)}
                          placeholder="담당 목자 이행 결과 및 후속 피드백 입력..."
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs"
                        />
                      </div>
                    ))
                  )}
                </div>
              )}

              {mobilePopupTab === 'history' && (
                <div className="space-y-2">
                  {selectedMemberHistory.map(h => (
                    <div
                      key={h.id}
                      onClick={() => {
                        setActiveCardId(h.id);
                        setMobilePopupTab('detail');
                      }}
                      className={`p-3 rounded-xl border cursor-pointer ${
                        h.id === activeCard.id ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 text-zinc-900 border-zinc-200'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-[10.5px]">{h.date} ({h.method})</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold border ${getRiskMeta(h.riskLevel).bgCls}`}>
                          {getRiskMeta(h.riskLevel).short}
                        </span>
                      </div>
                      <div className="font-black text-xs">{h.title}</div>
                      <p className="text-[11px] opacity-80 line-clamp-2 mt-0.5">{h.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 팝업 하단 액션 바 */}
            <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleDeleteCard(activeCard.id)}
                className="px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer"
              >
                삭제
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCardPopupOpen(false);
                    setPrintModeType('filled');
                  }}
                  className="px-3.5 py-2 rounded-lg bg-white border border-zinc-300 text-zinc-800 text-xs font-bold cursor-pointer"
                >
                  🖨️ 카드 인쇄
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCardPopupOpen(false);
                    openEditStandardForm(activeCard);
                  }}
                  className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-black cursor-pointer"
                >
                  ✏️ 내용 수정
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          [4] 📝 고정형 ‘표준 신앙상담 기록카드’ 작성/수정 모달 (모바일 화면 고정 완료)
          ========================================================================= */}
      {isStandardFormOpen && (
        <div className="fixed inset-0 z-[340] w-full max-w-full overflow-hidden bg-zinc-950/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in touch-pan-y">
          <form
            onSubmit={handleSaveStandardCard}
            className="w-full max-w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl border border-zinc-200 shadow-2xl max-h-[92dvh] flex flex-col overflow-hidden box-border"
          >
            {/* 모달 상단 헤더 */}
            <div className="px-4 sm:px-5 py-3 bg-zinc-900 text-white flex items-center justify-between gap-2 shrink-0 w-full box-border">
              <div className="min-w-0 flex-1">
                <span className="text-[9.5px] font-mono text-amber-400 uppercase block truncate">
                  AES-256 ENCRYPTED STANDARD COUNSELING FORM
                </span>
                <h3 className="text-[13.5px] sm:text-sm font-black truncate mt-0.5">
                  {cardForm.id ? '✏️ 표준 신앙상담 기록카드 수정' : '📝 표준 신앙상담 기록카드 작성'}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsStandardFormOpen(false);
                    setIsOcrModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black cursor-pointer whitespace-nowrap"
                >
                  📷 OCR 스캔 입력
                </button>
                <button
                  type="button"
                  onClick={() => setIsStandardFormOpen(false)}
                  className="text-zinc-400 hover:text-white text-sm font-bold px-1.5 py-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 모달 본문 (가로 스크롤 원천 차단: overflow-x-hidden & min-w-0) */}
            <div className="p-4 sm:p-5 overflow-y-auto overflow-x-hidden touch-pan-y space-y-4 flex-1 hide-scrollbar text-xs w-full max-w-full box-border">
              
              {/* 성도명 / 직분 / 소속 목장 / 상담 일자 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
                <div className="min-w-0">
                  <label className="text-[10.5px] font-black text-zinc-600 block mb-1 truncate">성도명 (자동완성) *</label>
                  <input
                    type="text"
                    list="gt-real-members-datalist"
                    value={cardForm.memberName}
                    onChange={(e) => handleSelectMemberInForm(e.target.value)}
                    placeholder="성도 이름 입력"
                    className="w-full min-w-0 px-2.5 py-2 rounded-lg bg-zinc-50 border border-zinc-300 font-bold text-zinc-900 outline-none focus:bg-white focus:border-zinc-900 box-border"
                    required
                  />
                  <datalist id="gt-real-members-datalist">
                    {(users || []).map(u => (
                      <option key={u.name} value={u.name}>
                        {memberToCellMap.get(u.name)?.cellName || u.office || '성도'}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div className="min-w-0">
                  <label className="text-[10.5px] font-black text-zinc-600 block mb-1 truncate">직분</label>
                  <select
                    value={cardForm.memberOffice}
                    onChange={(e) => setCardForm({ ...cardForm, memberOffice: e.target.value })}
                    className="w-full min-w-0 px-2.5 py-2 rounded-lg bg-zinc-50 border border-zinc-300 font-bold text-zinc-900 outline-none box-border"
                  >
                    {['성도', '서리집사', '안수집사', '권사', '장로', '청년', '새가족'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div className="min-w-0">
                  <label className="text-[10.5px] font-black text-zinc-600 block mb-1 truncate">소속 목장</label>
                  <input
                    type="text"
                    list="gt-real-cells-datalist"
                    value={cardForm.cellName}
                    onChange={(e) => setCardForm({ ...cardForm, cellName: e.target.value })}
                    placeholder="소속 목장명"
                    className="w-full min-w-0 px-2.5 py-2 rounded-lg bg-zinc-50 border border-zinc-300 font-bold text-zinc-900 outline-none box-border"
                  />
                  <datalist id="gt-real-cells-datalist">
                    {realCellList.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                <div className="min-w-0">
                  <label className="text-[10.5px] font-black text-zinc-600 block mb-1 truncate">상담 일자</label>
                  <input
                    type="date"
                    value={cardForm.date}
                    onChange={(e) => setCardForm({ ...cardForm, date: e.target.value })}
                    className="w-full min-w-0 max-w-full px-2 py-2 rounded-lg bg-zinc-50 border border-zinc-300 font-bold text-zinc-900 outline-none box-border appearance-none"
                  />
                </div>
              </div>

              {/* 신앙 위험도 5단계 분류 (좁은 모바일에서도 오른쪽 잘림 없이 5등분 정렬) */}
              <div className="w-full min-w-0">
                <label className="text-[10.5px] font-black text-zinc-600 block mb-1.5">신앙 위험도 5단계 분류 *</label>
                <div className="grid grid-cols-5 gap-1 sm:gap-1.5 w-full">
                  {RISK_LEVELS.map(rk => {
                    const isSelected = Number(cardForm.riskLevel) === rk.level;
                    return (
                      <button
                        key={rk.level}
                        type="button"
                        onClick={() => setCardForm({ ...cardForm, riskLevel: rk.level })}
                        className={`min-w-0 py-2 px-0.5 rounded-xl border text-center transition-all cursor-pointer truncate ${
                          isSelected
                            ? `${rk.bgCls} ring-2${rk.ringCls} font-black`
                            : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                        }`}
                      >
                        <span className="text-[10px] sm:text-[11px] font-black block truncate">{rk.short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 주제별 카테고리 / 상담 방식 / 칸반 단계 (모바일에서 넘치지 않도록 min-w-0 적용) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                <div className="min-w-0">
                  <label className="text-[10.5px] font-black text-zinc-600 block mb-1">주제별 카테고리</label>
                  <select
                    value={cardForm.category}
                    onChange={(e) => setCardForm({ ...cardForm, category: e.target.value })}
                    className="w-full min-w-0 px-2.5 py-2 rounded-lg bg-zinc-50 border border-zinc-300 font-bold text-zinc-900 outline-none box-border"
                  >
                    {COUNSELING_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div className="min-w-0">
                  <label className="text-[10.5px] font-black text-zinc-600 block mb-1">상담 방식</label>
                  <select
                    value={cardForm.method}
                    onChange={(e) => setCardForm({ ...cardForm, method: e.target.value })}
                    className="w-full min-w-0 px-2.5 py-2 rounded-lg bg-zinc-50 border border-zinc-300 font-bold text-zinc-900 outline-none box-border"
                  >
                    {['대면심방', '전화상담', '목장나눔', '성전상담', '카톡/문서'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="min-w-0">
                  <label className="text-[10.5px] font-black text-zinc-600 block mb-1">칸반 단계</label>
                  <select
                    value={cardForm.stage}
                    onChange={(e) => setCardForm({ ...cardForm, stage: e.target.value })}
                    className="w-full min-w-0 px-2.5 py-2 rounded-lg bg-zinc-50 border border-zinc-300 font-bold text-zinc-900 outline-none box-border"
                  >
                    {KANBAN_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="w-full min-w-0">
                <label className="text-[10.5px] font-black text-zinc-600 block mb-1">상담 핵심 한줄 요약 *</label>
                <input
                  type="text"
                  value={cardForm.title}
                  onChange={(e) => setCardForm({ ...cardForm, title: e.target.value })}
                  placeholder="예: 가정 및 직장 문제를 두고 나눈 말씀과 심방 상담"
                  className="w-full min-w-0 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-300 font-bold text-zinc-900 outline-none focus:bg-white focus:border-zinc-900 box-border"
                  required
                />
              </div>

              <div className="w-full min-w-0">
                <label className="text-[10.5px] font-black text-zinc-600 block mb-1">1. 영적 현황 및 예배·QT 진단</label>
                <input
                  type="text"
                  value={cardForm.spiritualState}
                  onChange={(e) => setCardForm({ ...cardForm, spiritualState: e.target.value })}
                  placeholder="예배 참석, 큐티, 기도 생활 등 현재 영적 상태 요약"
                  className="w-full min-w-0 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-300 font-medium text-zinc-900 outline-none focus:bg-white box-border"
                />
              </div>

              <div className="w-full min-w-0">
                <label className="text-[10.5px] font-black text-zinc-600 block mb-1">2. 상담 상세 기록 (사건 · 나눈 말씀 · 권면 내용)</label>
                <textarea
                  rows={4}
                  value={cardForm.content}
                  onChange={(e) => setCardForm({ ...cardForm, content: e.target.value })}
                  placeholder="상담한 구체적인 내용과 함께 나눈 말씀을 기록하세요 (AES-256 자동 암호화 저장)..."
                  className="w-full min-w-0 p-3 rounded-lg bg-zinc-50 border border-zinc-300 font-medium text-zinc-900 outline-none focus:bg-white resize-none leading-relaxed box-border"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                <div className="min-w-0">
                  <label className="text-[10.5px] font-black text-purple-800 block mb-1">3. 집중 중보기도 제목</label>
                  <textarea
                    rows={3}
                    value={cardForm.prayerTopics}
                    onChange={(e) => setCardForm({ ...cardForm, prayerTopics: e.target.value })}
                    placeholder="1) 기도제목...\n2) 기도제목..."
                    className="w-full min-w-0 p-2.5 rounded-lg bg-purple-50/40 border border-purple-200 font-medium text-zinc-900 outline-none resize-none box-border"
                  />
                </div>
                <div className="min-w-0">
                  <label className="text-[10.5px] font-black text-sky-800 block mb-1">4. 목자 소견 및 목사님께 건의사항</label>
                  <textarea
                    rows={3}
                    value={cardForm.shepherdOpinion}
                    onChange={(e) => setCardForm({ ...cardForm, shepherdOpinion: e.target.value })}
                    placeholder="목자 소견 및 교역자 심방/안수기도 요청 사항..."
                    className="w-full min-w-0 p-2.5 rounded-lg bg-sky-50/40 border border-sky-200 font-medium text-zinc-900 outline-none resize-none box-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                <label className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 cursor-pointer min-w-0">
                  <input
                    type="checkbox"
                    checked={cardForm.isSharedWithShepherds}
                    onChange={(e) => setCardForm({ ...cardForm, isSharedWithShepherds: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer shrink-0"
                  />
                  <span className="text-[11px] font-black text-emerald-900 truncate">
                    🌿 [목자방 공유] 동역 목자들과 중보기도 공유
                  </span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 cursor-pointer min-w-0">
                  <input
                    type="checkbox"
                    checked={cardForm.isSubmittedToPastor}
                    onChange={(e) => setCardForm({ ...cardForm, isSubmittedToPastor: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer shrink-0"
                  />
                  <span className="text-[11px] font-black text-indigo-900 truncate">
                    📥 [사역자 모음함 제출] 전도사·담임목사님께 보고
                  </span>
                </label>
              </div>
            </div>

            {/* 모달 하단 저장 버튼 바 */}
            <div className="px-4 sm:px-5 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-end gap-2 shrink-0 w-full box-border">
              <button
                type="button"
                onClick={() => setIsStandardFormOpen(false)}
                className="px-4 py-2 rounded-lg bg-white border border-zinc-300 text-zinc-700 text-xs font-bold cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-black cursor-pointer shadow-md"
              >
                🔐 암호화 저장 및 동기화
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          [5] 📷 정밀 정규식 기반 OCR 스캔 & 아이폰 Live Text 통합 모달
          ========================================================================= */}
      {isOcrModalOpen && (
        <div className="fixed inset-0 z-[360] bg-zinc-950/75 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 bg-indigo-950 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-indigo-300 uppercase block">REGEX OCR PARSER & iOS LIVE TEXT</span>
                <h3 className="text-sm font-black">📷 수기 상담기록카드 OCR 스캔 & 정규식 자동 분류</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOcrModalOpen(false)}
                className="text-indigo-200 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 hide-scrollbar text-xs">
              <div className="p-4 rounded-2xl bg-indigo-50/60 border-2 border-dashed border-indigo-300 text-center space-y-2.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageFileSelect}
                  className="hidden"
                />
                <div className="text-2xl">📸</div>
                <h4 className="font-black text-indigo-950 text-[13px]">
                  수기 상담기록카드 사진을 촬영하거나 업로드하세요
                </h4>
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  고대비 영상 전처리 후 한글/영문 OCR 엔진과 정규식 파서가 <b>성도명·목장·위험도·영적상태·상담내용·기도제목·목자소견</b>을 자동 분리 추출합니다.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md cursor-pointer active:scale-95 transition-all"
                >
                  📷 카메라 촬영 / 상담지 이미지 선택
                </button>
              </div>

              {ocrImagePreview && (
                <div className="relative rounded-xl overflow-hidden border border-zinc-300 bg-black max-h-48 flex items-center justify-center">
                  <img src={ocrImagePreview} alt="Scanned Counseling Sheet" className="max-h-48 object-contain opacity-90" />
                  {isOcrScanning && (
                    <div className="absolute inset-0 bg-indigo-950/70 flex flex-col items-center justify-center text-white gap-2">
                      <span className="text-xs font-black animate-pulse">🔍 고대비 전처리 및 한글 OCR 정규식 분석 중... ({ocrProgress}%)</span>
                      <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 transition-all duration-200" style={{ width: `${ocrProgress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-zinc-800">
                    📱 추출된 원문 (아이폰 카메라 [텍스트 스캔] 또는 복사본 붙여넣기 지원)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.readText?.()
                        .then(clip => { if (clip) setOcrExtractedText(prev => prev ? `${prev}\n${clip}` : clip); })
                        .catch(() => {});
                    }}
                    className="text-[10.5px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    📋 클립보드 붙여넣기
                  </button>
                </div>
                <textarea
                  rows={7}
                  value={ocrExtractedText}
                  onChange={(e) => setOcrExtractedText(e.target.value)}
                  placeholder={`정규식 자동 분류 지원 항목 예시:\n성도명: 홍길동 (집사)\n소속목장: 믿음 목장\n위험도: Lv.3 주의\n1. 영적상태: ...\n2. 상담내용: ...\n3. 기도제목: ...\n4. 목자소견: ...`}
                  className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-300 font-medium text-zinc-900 leading-relaxed outline-none focus:bg-white focus:border-indigo-600 resize-none"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOcrModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-white border border-zinc-300 text-zinc-700 text-xs font-bold cursor-pointer"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleApplyOcrToStandardForm}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer shadow-md"
              >
                ✨ 정규식 파싱 후 상담카드에 자동 채우기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          [6] 🖨️ A4 고정형 표준 신앙상담 기록카드 인쇄 모달
          ========================================================================= */}
      {printModeType && (
        <div className="fixed inset-0 z-[380] bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
            <div className="no-print px-5 py-3.5 bg-zinc-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black">🖨️ 표준 신앙상담 기록카드 (A4 규격 고정 폼)</span>
                <div className="flex bg-zinc-800 p-0.5 rounded-lg text-[11px] font-bold ml-2">
                  <button
                    type="button"
                    onClick={() => setPrintModeType('blank')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${printModeType === 'blank' ? 'bg-amber-400 text-zinc-950 font-black' : 'text-zinc-300'}`}
                  >
                    📄 수기 상담용 빈 양식
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintModeType('filled')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${printModeType === 'filled' ? 'bg-amber-400 text-zinc-950 font-black' : 'text-zinc-300'}`}
                  >
                    📋 선택된 상담카드 채움
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs cursor-pointer shadow"
                >
                  🖨️ A4 인쇄 / PDF 저장
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModeType(null)}
                  className="text-zinc-400 hover:text-white text-sm font-bold px-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-zinc-200/60 flex justify-center">
              <div
                id="gt-printable-counseling-sheet"
                className="w-full max-w-[740px] bg-white p-8 border-2 border-zinc-900 shadow-lg text-zinc-900 relative space-y-5"
              >
                <span className="absolute top-3 left-3 text-lg font-black leading-none select-none">┏</span>
                <span className="absolute top-3 right-3 text-lg font-black leading-none select-none">┓</span>
                <span className="absolute bottom-3 left-3 text-lg font-black leading-none select-none">┗</span>
                <span className="absolute bottom-3 right-3 text-lg font-black leading-none select-none">┛</span>

                <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-black tracking-widest uppercase text-zinc-500 block">
                      GOOD TREE CHURCH PASTORAL COUNSELING STANDARD SHEET
                    </span>
                    <h1 className="text-2xl font-black tracking-tight mt-1">
                      표준 신앙상담 기록카드
                    </h1>
                    <span className="text-xs font-bold text-zinc-600 mt-1 block">
                      * 수기 작성 후 [OCR 스캔]으로 촬영하면 항목별 정규식이 인식하여 보드에 자동 입력됩니다.
                    </span>
                  </div>

                  <table className="border-collapse border border-zinc-800 text-[11px] text-center">
                    <thead>
                      <tr className="bg-zinc-100 font-black">
                        <th className="border border-zinc-800 px-3 py-1">담당목자</th>
                        <th className="border border-zinc-800 px-3 py-1">담당교역자</th>
                        <th className="border border-zinc-800 px-3 py-1">담임목사</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-zinc-800 h-10 w-16 font-bold">
                          {printModeType === 'filled' ? activeCard?.counselorName : ''}
                        </td>
                        <td className="border border-zinc-800 h-10 w-16"></td>
                        <td className="border border-zinc-800 h-10 w-16"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <table className="w-full border-collapse border border-zinc-800 text-xs">
                  <tbody>
                    <tr>
                      <th className="border border-zinc-800 bg-zinc-100 px-3 py-2 text-left font-black w-24">성도명</th>
                      <td className="border border-zinc-800 px-3 py-2 font-bold w-44">
                        {printModeType === 'filled' && activeCard ? `${activeCard.memberName} (${activeCard.memberOffice})` : ''}
                      </td>
                      <th className="border border-zinc-800 bg-zinc-100 px-3 py-2 text-left font-black w-24">소속목장</th>
                      <td className="border border-zinc-800 px-3 py-2 font-bold">
                        {printModeType === 'filled' && activeCard ? activeCard.cellName : ''}
                      </td>
                    </tr>
                    <tr>
                      <th className="border border-zinc-800 bg-zinc-100 px-3 py-2 text-left font-black">상담일자</th>
                      <td className="border border-zinc-800 px-3 py-2 font-mono font-bold">
                        {printModeType === 'filled' && activeCard ? activeCard.date : '2026-    -    '}
                      </td>
                      <th className="border border-zinc-800 bg-zinc-100 px-3 py-2 text-left font-black">상담자 / 방식</th>
                      <td className="border border-zinc-800 px-3 py-2 font-bold">
                        {printModeType === 'filled' && activeCard ? `${activeCard.counselorName} (${activeCard.method})` : '□대면심방  □전화  □목장  □성전'}
                      </td>
                    </tr>
                    <tr>
                      <th className="border border-zinc-800 bg-zinc-100 px-3 py-2 text-left font-black">위험도</th>
                      <td colSpan={3} className="border border-zinc-800 px-3 py-2 font-bold">
                        {RISK_LEVELS.map(rk => (
                          <span key={rk.level} className="mr-4 inline-flex items-center gap-1">
                            <span>{printModeType === 'filled' && Number(activeCard?.riskLevel) === rk.level ? '■' : '□'}</span>
                            <span>{rk.label}</span>
                          </span>
                        ))}
                      </td>
                    </tr>
                    <tr>
                      <th className="border border-zinc-800 bg-zinc-100 px-3 py-2 text-left font-black">카테고리</th>
                      <td colSpan={3} className="border border-zinc-800 px-3 py-2 font-bold">
                        {COUNSELING_CATEGORIES.map(cat => (
                          <span key={cat.id} className="mr-4 inline-flex items-center gap-1">
                            <span>{printModeType === 'filled' && activeCard?.category === cat.id ? '■' : '□'}</span>
                            <span>{cat.label.replace(/^[^\s]+\s/, '')}</span>
                          </span>
                        ))}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="border border-zinc-800 p-3 space-y-1.5">
                  <div className="text-xs font-black border-b border-zinc-300 pb-1">
                    1. 영적상태: (상담 핵심 요약 및 예배 · QT · 목장 진단)
                  </div>
                  <div className="min-h-[48px] text-xs leading-relaxed whitespace-pre-wrap pt-1">
                    {printModeType === 'filled' && activeCard
                      ? `[${activeCard.title}]\n${activeCard.spiritualState || ''}`
                      : ''}
                  </div>
                </div>

                <div className="border border-zinc-800 p-3 space-y-1.5">
                  <div className="text-xs font-black border-b border-zinc-300 pb-1">
                    2. 상담내용: (삶의 사건 · 함께 나눈 말씀 · 영적 권면)
                  </div>
                  <div className="min-h-[160px] text-xs leading-relaxed whitespace-pre-wrap pt-1">
                    {printModeType === 'filled' && activeCard ? activeCard.content : ''}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-zinc-800 p-3 space-y-1.5">
                    <div className="text-xs font-black border-b border-zinc-300 pb-1">
                      3. 기도제목: (집중 중보기도)
                    </div>
                    <div className="min-h-[95px] text-xs leading-relaxed whitespace-pre-wrap pt-1">
                      {printModeType === 'filled' && activeCard ? activeCard.prayerTopics : ''}
                    </div>
                  </div>
                  <div className="border border-zinc-800 p-3 space-y-1.5">
                    <div className="text-xs font-black border-b border-zinc-300 pb-1">
                      4. 목자소견: (담당 목자 의견 및 건의사항)
                    </div>
                    <div className="min-h-[95px] text-xs leading-relaxed whitespace-pre-wrap pt-1">
                      {printModeType === 'filled' && activeCard ? activeCard.shepherdOpinion : ''}
                    </div>
                  </div>
                </div>

                <div className="border-2 border-zinc-900 p-3.5 bg-zinc-50/50 space-y-1.5">
                  <div className="text-xs font-black border-b border-zinc-400 pb-1 flex justify-between">
                    <span>5. 담임목사 / 담당교역자 권면·조언 및 후속 조치 오더</span>
                    <span className="font-normal text-[10.5px]">□대면심방  □전도사권면  □중보기도단  □목자케어</span>
                  </div>
                  <div className="min-h-[75px] text-xs leading-relaxed whitespace-pre-wrap pt-1">
                    {printModeType === 'filled' && activeCard?.pastorOrders?.length > 0
                      ? activeCard.pastorOrders.map(o => `• [${o.orderType}] ${o.directive} (기한: ${o.dueDate} / 피드백: ${o.feedbackNote || '이행중'})`).join('\n')
                      : ''}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
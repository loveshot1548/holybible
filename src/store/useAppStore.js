// src/store/useAppStore.js
import create from 'zustand';

// 기존 로컬스토리지 파싱 함수들 (여기서 직접 관리합니다)
const safeParse = (key, def) => { 
  try { 
    const val = localStorage.getItem(key); 
    if (!val) return def; 
    const parsed = JSON.parse(val); 
    return parsed !== null ? parsed : def; 
  } catch(e) { return def; } 
};
const safeSetItem = (key, value) => { 
  try { localStorage.setItem(key, value); } 
  catch (e) { console.warn(`[용량 초과 방어] ${key} 저장 실패`); } 
};

export const useAppStore = create((set, get) => ({
  // 1. Auth 및 UI 상태
  authUser: safeParse('qt_auth_user', null),
  setAuthUser: (user) => {
    if (user) {
      safeSetItem('qt_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('qt_auth_user');
    }
    // 🌟 [수정] 로그인 성공 시 흰 화면 없이 곧바로 '오늘의 묵상 여정'으로 진입
    set({ authUser: user, activeScreen: user ? 'meditationPilgrimage' : 'login' });
  },

  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

  // 🌟 [수정] 스토어 최초 생성 시 이미 로그인된 사용자는 'meditationPilgrimage'를 즉시 초기값으로 할당
  activeScreen: safeParse('qt_auth_user', null) ? 'meditationPilgrimage' : 'login',
  setActiveScreen: (screen) => set({ activeScreen: screen }),

  // 2. 핵심 사용자 데이터 (자동 저장 연동)
  dailyData: safeParse('qt_daily', {}),
  updateDay: (date, data) => set((state) => {
    const next = { ...state.dailyData, [date]: { ...(state.dailyData[date] || {}), ...data } };
    safeSetItem('qt_daily', JSON.stringify(next));
    return { dailyData: next };
  }),

  readVerses: safeParse('qt_read_verses', {}),
  setReadVerses: (updater) => set((state) => {
    const next = typeof updater === 'function' ? updater(state.readVerses) : { ...state.readVerses, ...updater };
    safeSetItem('qt_read_verses', JSON.stringify(next));
    return { readVerses: next };
  }),

  bibleNotes: safeParse('qt_bible_notes', []),
  setBibleNotes: (updater) => set((state) => {
    const next = typeof updater === 'function' ? updater(state.bibleNotes) : updater;
    safeSetItem('qt_bible_notes', JSON.stringify(next));
    return { bibleNotes: next };
  }),

  bibleHighlights: safeParse('qt_bible_highlights', {}),
  setBibleHighlights: (updater) => set((state) => {
    const next = typeof updater === 'function' ? updater(state.bibleHighlights) : updater;
    safeSetItem('qt_bible_highlights', JSON.stringify(next));
    return { bibleHighlights: next };
  }),

  readChallengeStart: safeParse('qt_read_start', new Date().toISOString().split('T')[0]),
  setReadChallengeStart: (dateStr) => {
    safeSetItem('qt_read_start', dateStr);
    set({ readChallengeStart: dateStr });
  },

  globalPrayers: safeParse('qt_global_prayers', []),
  setGlobalPrayers: (updater) => set((state) => {
    const next = typeof updater === 'function' ? updater(state.globalPrayers) : updater;
    safeSetItem('qt_global_prayers', JSON.stringify(next));
    return { globalPrayers: next };
  }),

  globalIntercessions: safeParse('qt_global_intercessions', []),
  setGlobalIntercessions: (updater) => set((state) => {
    const next = typeof updater === 'function' ? updater(state.globalIntercessions) : updater;
    safeSetItem('qt_global_intercessions', JSON.stringify(next));
    return { globalIntercessions: next };
  }),

  generalNotes: safeParse('qt_general_notes', []),
  setGeneralNotes: (updater) => set((state) => {
    const next = typeof updater === 'function' ? updater(state.generalNotes) : updater;
    safeSetItem('qt_general_notes', JSON.stringify(next));
    return { generalNotes: next };
  }),
}));
// src/lib/tskHelper.js
let cachedTskMap = null;

// TSK 딕셔너리 로드 (최초 1회 캐싱)
export const loadTskDatabase = async () => {
  if (cachedTskMap) return cachedTskMap;
  try {
    const res = await fetch('/data/tsk.json');
    if (!res.ok) return {};
    cachedTskMap = await res.json();
    return cachedTskMap;
  } catch (err) {
    console.error("TSK 로드 실패:", err);
    return {};
  }
};

// 현재 구절의 상호참조 즉시 인출 (예: '창세기-1-1')
export const getCrossReferences = async (bookKo, chapter, verse) => {
  const tskMap = await loadTskDatabase();
  const key = `${bookKo}-${chapter}-${verse}`;
  return tskMap[key] || [];
};
// src/hooks/useVerseInspector.js
import { useRef, useCallback } from 'react';

export function useVerseInspector(onTrigger) {
  const timerRef = useRef(null);
  const isLongPressRef = useRef(false);

  // 모바일 터치 시작 (500ms 이상 길게 누를 시 트리거)
  const handleTouchStart = useCallback((verseData) => (e) => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (onTrigger) onTrigger(verseData);
      if (window.navigator?.vibrate) window.navigator.vibrate(40); // 햅틱 피드백
    }, 500);
  }, [onTrigger]);

  const handleTouchEnd = useCallback(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleTouchMove = useCallback(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // PC 마우스 우클릭
  const handleContextMenu = useCallback((verseData) => (e) => {
    e.preventDefault();
    if (onTrigger) onTrigger(verseData);
  }, [onTrigger]);

  return {
    bindVerse: (verseData) => ({
      onTouchStart: handleTouchStart(verseData),
      onTouchEnd: handleTouchEnd(),
      onTouchMove: handleTouchMove(),
      onContextMenu: handleContextMenu(verseData)
    })
  };
}
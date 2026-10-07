import { useState, useEffect } from 'react';

export function useLocalDatabase() {
  const [dailyData, setDailyData] = useState(() => {
    const saved = localStorage.getItem('bw_daily_data');
    return saved ? JSON.parse(saved) : {};
  });

  const [actions, setActions] = useState(() => {
    const saved = localStorage.getItem('bw_action_items');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('bw_daily_data', JSON.stringify(dailyData));
  }, [dailyData]);

  useEffect(() => {
    localStorage.setItem('bw_action_items', JSON.stringify(actions));
  }, [actions]);

  // 아카이브에서 트래커로 액션 단방향 전송 (Send to Tracker)
  const sendToTracker = (sermonTitle, questionText) => {
    const newItem = {
      id: `act-${Date.now()}`,
      source: sermonTitle,
      text: questionText,
      isCompleted: false,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    setActions(prev => [newItem, ...prev]);
  };

  const toggleAction = (id) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, isCompleted: !a.isCompleted } : a));
  };

  return { dailyData, setDailyData, actions, sendToTracker, toggleAction };
}
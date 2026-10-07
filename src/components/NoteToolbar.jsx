import React, { useState } from 'react';

export default function NoteToolbar({ onCommand, t }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#fbbf24');

  const colorPalette = ['#1e293b', '#ef4444', '#f97316', '#fbbf24', '#10b981', '#3b82f6', '#8b5cf6'];

  return (
    <div className="sticky top-2 z-20 px-3 py-1 flex justify-center w-full pointer-events-auto">
      <div className={`transition-all duration-300 ease-in-out bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-lg rounded-2xl flex items-center gap-2 px-3.5 py-2 max-w-full overflow-x-auto`}>
        
        {/* 접기/펼치기 토글 */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 shrink-0"
        >
          <svg className={`w-4 h-4 transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
        </button>

        {!isCollapsed && (
          <>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

            {/* 서식 도구 */}
            <button onClick={() => onCommand('bold')} className="px-2 py-1 font-black text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">B</button>
            <button onClick={() => onCommand('underline')} className="px-2 py-1 font-bold underline text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">U</button>
            
            {/* 팔레트 색상 픽커 (이미지 4 스타일) */}
            <div className="flex items-center gap-1 shrink-0 px-1">
              {colorPalette.map(color => (
                <button
                  key={color}
                  onClick={() => {
                    setSelectedColor(color);
                    onCommand('foreColor', color);
                  }}
                  className={`w-4 h-4 rounded-full transition-transform ${selectedColor === color ? 'scale-125 ring-2 ring-offset-1 ring-blue-500' : 'opacity-80'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

            {/* 펜/형광펜/도구 */}
            <button onClick={() => onCommand('pen')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs" title="볼펜">✏️</button>
            <button onClick={() => onCommand('highlighter')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs" title="형광펜">🖊️</button>
            <button onClick={() => onCommand('eraser')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs" title="지우개">🧹</button>
          </>
        )}
      </div>
    </div>
  );
}
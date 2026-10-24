import React from 'react';

// 엔터프라이즈 모노크롬 SVG
const SvgCalendar = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-zinc-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const SvgClock = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-zinc-400"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>;

export default function AdminEventModal({
  editingEventId, formEventTitle, setFormEventTitle, formEventDate, setFormEventDate,
  formEventEndDate, setFormEventEndDate, formEventStartTime, setFormEventStartTime,
  formEventEndTime, setFormEventEndTime, formEventIsAllDay, setFormEventIsAllDay,
  formEventRepeat, setFormEventRepeat, formEventRoom, setFormEventRoom,
  formEventTarget, setFormEventTarget, formEventColor, setFormEventColor,
  formEventMemo, setFormEventMemo, handleSaveChurchEvent, setShowEventModal
}) {
  return (
    <div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center sm:p-4 bg-zinc-900/40 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-md bg-[#F4F4F5] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-fade-in-up border border-zinc-200">
        
        <div className="px-5 py-4 bg-white/95 backdrop-blur-md border-b border-zinc-200 flex items-center justify-between shrink-0 z-10">
          <button onClick={() => setShowEventModal(false)} className="text-[14px] font-bold text-zinc-400 hover:text-zinc-800 transition-colors cursor-pointer">
            취소
          </button>
          <h3 className="text-[15.5px] font-black text-zinc-900 tracking-tight">
            {editingEventId ? '일정 수정' : '새로운 일정 추가'}
          </h3>
          <button onClick={handleSaveChurchEvent} className="text-[14px] font-black text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer">
            {editingEventId ? '저장' : '추가'}
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto hide-scrollbar flex-1 bg-[#F4F4F5]">
          
          {/* 제목 섹션 */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <input 
              type="text" 
              value={formEventTitle} 
              onChange={e => setFormEventTitle(e.target.value)} 
              placeholder="일정 제목" 
              className="w-full px-4 py-3.5 text-[14.5px] font-black bg-transparent outline-none placeholder:text-zinc-300 placeholder:font-medium text-zinc-900 transition-all focus:bg-zinc-50" 
            />
          </div>

          {/* 시간 섹션 */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm divide-y divide-zinc-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[13.5px] font-bold text-zinc-900">하루 종일</span>
              <input 
                type="checkbox" 
                checked={formEventIsAllDay} 
                onChange={e => setFormEventIsAllDay(e.target.checked)} 
                className="w-5 h-5 rounded text-indigo-600 accent-indigo-600 cursor-pointer" 
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[13.5px] font-bold text-zinc-900">시작</span>
              <div className="flex items-center gap-2">
                <div className="relative flex items-center bg-zinc-50 hover:bg-zinc-100 rounded-md border border-zinc-200 px-2 py-1 transition-colors cursor-pointer">
                  <input type="date" value={formEventDate} onChange={e => setFormEventDate(e.target.value)} className="text-[12px] font-bold text-zinc-700 bg-transparent outline-none cursor-pointer w-[90px] sm:w-28 appearance-none" />
                  <SvgCalendar />
                </div>
                {!formEventIsAllDay && (
                  <div className="relative flex items-center bg-zinc-50 hover:bg-zinc-100 rounded-md border border-zinc-200 px-2 py-1 transition-colors cursor-pointer">
                    <input type="time" value={formEventStartTime} onChange={e => setFormEventStartTime(e.target.value)} className="text-[12px] font-bold text-zinc-700 bg-transparent outline-none cursor-pointer w-[65px] sm:w-[76px] appearance-none" />
                    <SvgClock />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[13.5px] font-bold text-zinc-900">종료</span>
              <div className="flex items-center gap-2">
                <div className="relative flex items-center bg-zinc-50 hover:bg-zinc-100 rounded-md border border-zinc-200 px-2 py-1 transition-colors cursor-pointer">
                  <input type="date" value={formEventEndDate} onChange={e => setFormEventEndDate(e.target.value)} className="text-[12px] font-bold text-zinc-700 bg-transparent outline-none cursor-pointer w-[90px] sm:w-28 appearance-none" />
                  <SvgCalendar />
                </div>
                {!formEventIsAllDay && (
                  <div className="relative flex items-center bg-zinc-50 hover:bg-zinc-100 rounded-md border border-zinc-200 px-2 py-1 transition-colors cursor-pointer">
                    <input type="time" value={formEventEndTime} onChange={e => setFormEventEndTime(e.target.value)} className="text-[12px] font-bold text-zinc-700 bg-transparent outline-none cursor-pointer w-[65px] sm:w-[76px] appearance-none" />
                    <SvgClock />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 반복, 장소, 메모 섹션 */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm divide-y divide-zinc-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[13.5px] font-bold text-zinc-900">반복 주기</span>
              <select value={formEventRepeat} onChange={e => setFormEventRepeat(e.target.value)} className="text-[13px] font-bold text-zinc-500 bg-transparent outline-none cursor-pointer text-right appearance-none px-1">
                <option value="안 함">안 함</option>
                <option value="매일">매일</option>
                <option value="주중(월-금)">주중(월-금)</option>
                <option value="매주 (주일)">매주 (주일)</option>
                <option value="매월">매월</option>
              </select>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[13.5px] font-bold text-zinc-900">장소 및 대상</span>
              <div className="flex gap-1.5 justify-end">
                <input type="text" value={formEventRoom} onChange={e => setFormEventRoom(e.target.value)} placeholder="장소" className="w-20 sm:w-24 text-right text-[12.5px] font-bold text-zinc-500 bg-transparent outline-none placeholder:text-zinc-300 placeholder:font-medium" />
                <span className="text-zinc-300">|</span>
                <input type="text" value={formEventTarget} onChange={e => setFormEventTarget(e.target.value)} placeholder="대상" className="w-20 sm:w-24 text-right text-[12.5px] font-bold text-zinc-500 bg-transparent outline-none placeholder:text-zinc-300 placeholder:font-medium" />
              </div>
            </div>
            
            <div className="p-4 bg-zinc-50/50">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1.5">간단 코멘트</span>
              <textarea 
                rows={2} 
                placeholder="일정에 대한 메모를 남기세요..." 
                value={formEventMemo} 
                onChange={e => setFormEventMemo(e.target.value)} 
                className="w-full text-[12.5px] font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md outline-none resize-none placeholder:text-zinc-300 p-2 focus:border-zinc-400 transition-all"
              />
            </div>
          </div>

          {/* 색상 선택 섹션 */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-2.5">라벨 색상 지정</span>
            <div className="flex items-center justify-between gap-1.5 overflow-x-auto hide-scrollbar py-1">
              {['#71717A', '#6366F1', '#0EA5E9', '#10B981', '#84CC16', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#18181B'].map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormEventColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full transition-transform shrink-0 cursor-pointer ${formEventColor === color ? 'scale-110 ring-[3px] ring-white ring-offset-[2px] sm:ring-offset-[3px] ring-offset-zinc-200 shadow-sm' : 'opacity-90 hover:scale-105'}`}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
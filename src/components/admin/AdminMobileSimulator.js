import React, { useState } from 'react';

// 엔터프라이즈 모노크롬 SVG 세트
const SvgMobile = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><rect x="5" y="2" width="14" height="20" rx="3" /><line x1="12" y1="18" x2="12.01" y2="18" strokeWidth={3} strokeLinecap="round" /></svg>;
const SvgClose = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const SvgUsers = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
const SvgMegaphone = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>;
const SvgSend = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IconChevronLeft = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><polyline points="15 18 9 12 15 6" /></svg>;
const IconChevronRight = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><polyline points="9 18 15 12 9 6" /></svg>;

export default function AdminMobileSimulator({
  currentWeek, users = [], attendance = [], noticeList = [], cells = [], cellMembers = [],
  setNoticeList, handleToggleAttendance, setSelectedWeekOffset, setSelectedUserProfile, onClose
}) {
  const [simTab, setSimTab] = useState('attendance');
  const [simNoticeTitle, setSimNoticeTitle] = useState('');
  const [simNoticeBody, setSimNoticeBody] = useState('');

  const handleWeeklyToggle = (userName, cellName, type, currentStatus) => {
    const targetDate = type === '수요' ? currentWeek.wedStr : type === '금요' ? currentWeek.friStr : currentWeek.sunStr;
    handleToggleAttendance(targetDate, userName, cellName, type, currentStatus);
  };

  const handleSimCellNoticeSend = () => {
    if (!simNoticeTitle.trim() || !simNoticeBody.trim()) return alert('공지 제목과 상세 내용을 입력해주세요.');
    const targetCell = cells[0]?.name || '임시 목장';
    const fullText = `[공지] ${simNoticeTitle.trim()}\n${simNoticeBody.trim()}`;
    const newNotice = {
      id: Date.now(), scope: `${targetCell} 공지`, title: simNoticeTitle.trim(), content: simNoticeBody.trim(),
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    
    setNoticeList(prev => [newNotice, ...prev]);
    localStorage.setItem('admin_notices', JSON.stringify([newNotice, ...noticeList]));
    localStorage.setItem(`cell_notice_${targetCell}`, fullText);
    window.dispatchEvent(new Event('storage'));
    setSimNoticeTitle(''); setSimNoticeBody('');
    alert(`공지가 성공적으로 전송되었습니다.`);
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-50 select-none overflow-hidden relative">
      <div className="w-full h-full flex flex-col overflow-hidden relative">
        
        <header className="px-4 py-3.5 border-b border-zinc-200 bg-white text-zinc-900 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-0.5">
              <SvgMobile />
              <span className="text-[14.5px] font-black tracking-tight">모바일 현장 지원실</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded w-fit">
              {currentWeek.rangeShort}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-800 cursor-pointer rounded-md hover:bg-zinc-100 transition-colors border border-transparent hover:border-zinc-200">
            <SvgClose />
          </button>
        </header>

        <div className="flex px-2 pt-2 bg-white border-b border-zinc-200 shrink-0 shadow-sm z-10">
          <button onClick={() => setSimTab('attendance')} className={`flex-1 py-2.5 text-[12.5px] font-bold transition-all border-b-[2.5px] cursor-pointer ${simTab === 'attendance' ? 'text-zinc-900 border-zinc-900 font-black' : 'text-zinc-400 border-transparent hover:text-zinc-600'}`}>출석부</button>
          <button onClick={() => setSimTab('notices')} className={`flex-1 py-2.5 text-[12.5px] font-bold transition-all border-b-[2.5px] cursor-pointer ${simTab === 'notices' ? 'text-zinc-900 border-zinc-900 font-black' : 'text-zinc-400 border-transparent hover:text-zinc-600'}`}>공지함</button>
          <button onClick={() => setSimTab('sendNotice')} className={`flex-1 py-2.5 text-[12.5px] font-bold transition-all border-b-[2.5px] cursor-pointer ${simTab === 'sendNotice' ? 'text-zinc-900 border-zinc-900 font-black' : 'text-zinc-400 border-transparent hover:text-zinc-600'}`}>발송</button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3 hide-scrollbar pb-10 bg-zinc-50/50">
          {simTab === 'attendance' && (
            <>
              <div className="p-3.5 bg-white rounded-xl border border-zinc-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center text-[12.5px] font-black text-zinc-800">
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setSelectedWeekOffset && setSelectedWeekOffset(prev => prev - 1)} className="p-1.5 rounded-md bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 cursor-pointer"><IconChevronLeft /></button>
                    <span className="px-2">{currentWeek.rangeShort}</span>
                    <button type="button" onClick={() => setSelectedWeekOffset && setSelectedWeekOffset(prev => prev + 1)} className="p-1.5 rounded-md bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 cursor-pointer"><IconChevronRight /></button>
                  </div>
                  <span className="text-zinc-600 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-md font-bold text-[10.5px]">주간 누적 관리</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5 pt-1.5 border-t border-zinc-100">
                  {currentWeek.dates.map(d => (
                    <div key={d.full} className={`py-1.5 rounded-lg flex flex-col items-center select-none border ${d.isToday ? 'bg-zinc-900 border-zinc-900 text-white shadow-sm' : 'bg-white border-transparent text-zinc-600'}`}>
                      <span className={`text-[9px] font-bold ${d.dayName === '일' && !d.isToday ? 'text-rose-500' : ''}`}>{d.dayName}</span>
                      <span className="text-[12.5px] font-mono font-black mt-0.5">{d.dayNum}</span>
                    </div>
                  ))}
                </div>
              </div>

              {users.length === 0 ? (
                <div className="py-20 flex flex-col items-center gap-3 text-zinc-400 text-[13px] font-medium">
                  <SvgUsers /> 배정된 목장 성도가 없습니다.
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-zinc-200 p-2 divide-y divide-zinc-100 shadow-sm">
                  {users.map(u => {
                    const userCellMember = cellMembers.find(m => m.user_name === u.name);
                    const userCell = cells.find(c => c.id === userCellMember?.cell_id);
                    const realCellName = userCell?.name || (cells[0]?.name || '목장');

                    const stWed = attendance.find(a => a.user_name === u.name && a.date === currentWeek.wedStr && a.type === '수요')?.status || '결석';
                    const stFri = attendance.find(a => a.user_name === u.name && a.date === currentWeek.friStr && a.type === '금요')?.status || '결석';
                    const stSun = attendance.find(a => a.user_name === u.name && a.date === currentWeek.sunStr && (a.type === '주일' || a.type === '주일예배'))?.status || '결석';
                    const stCell = attendance.find(a => a.user_name === u.name && (a.type === '목장' || a.type === '목장모임') && (a.date === currentWeek.sunStr || currentWeek.dates.some(d => d.full === a.date)))?.status || '결석';

                    return (
                      <div key={u.name} className="py-2.5 px-2 flex flex-col gap-2 hover:bg-zinc-50/50 transition-colors rounded-lg">
                        <div className="flex items-center justify-between">
                          <span onClick={() => setSelectedUserProfile(u)} className="font-black text-[14px] text-zinc-900 cursor-pointer flex items-center gap-2 leading-none">
                            {u.name}
                            <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded leading-none">{u.office || '성도'} · {u.role}</span>
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: '수요', st: stWed, targetDate: currentWeek.wedStr, type: '수요', col: 'bg-zinc-900 text-white shadow-sm border-zinc-900' },
                            { label: '금요', st: stFri, targetDate: currentWeek.friStr, type: '금요', col: 'bg-zinc-900 text-white shadow-sm border-zinc-900' },
                            { label: '주일', st: stSun, targetDate: currentWeek.sunStr, type: '주일', col: 'bg-indigo-600 text-white shadow-sm border-indigo-600' },
                            { label: '목장', st: stCell, targetDate: currentWeek.sunStr, type: '목장', col: 'bg-emerald-600 text-white shadow-sm border-emerald-600' }
                          ].map(btn => (
                            <button key={btn.label} type="button" onClick={() => handleToggleAttendance(btn.targetDate, u.name, realCellName, btn.type, btn.st)} className={`py-1.5 rounded-md text-[11px] font-black transition-all cursor-pointer text-center border ${btn.st === '출석' ? btn.col : 'bg-zinc-50 text-zinc-400 border-zinc-200 hover:bg-zinc-100'}`}>
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {simTab === 'notices' && (
            <div className="space-y-3">
              <h3 className="text-[14px] font-black text-zinc-900 mb-2 pl-1">공지사항 수신함</h3>
              {noticeList.length === 0 ? (
                <div className="py-20 flex flex-col items-center gap-2 text-zinc-400 text-[13px] font-medium bg-white rounded-xl border border-zinc-200">
                  <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100"><SvgMegaphone /></div>
                  수신된 공지가 없습니다.
                </div>
              ) : (
                noticeList.map(n => (
                  <div key={n.id} className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border bg-zinc-50 border-zinc-200 text-zinc-600">{n.scope}</span>
                      <span className="text-[10px] font-mono font-bold text-zinc-400">{n.created_at}</span>
                    </div>
                    <h4 className="text-[14px] font-black text-zinc-900 tracking-tight leading-snug">{n.title}</h4>
                    <p className="text-[12.5px] text-zinc-500 leading-relaxed whitespace-pre-wrap font-medium">{n.content}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {simTab === 'sendNotice' && (
            <div className="space-y-3">
              <h3 className="text-[14px] font-black text-zinc-900 mb-2 pl-1">현장 알림 발송</h3>
              <div className="space-y-3.5 p-4 bg-white rounded-xl border border-zinc-200 shadow-sm">
                <div>
                  <label className="text-[10.5px] font-black uppercase tracking-wider text-zinc-400 block mb-1.5">알림 제목</label>
                  <input type="text" placeholder="명확한 제목 입력..." value={simNoticeTitle} onChange={e => setSimNoticeTitle(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 text-[13px] font-bold bg-zinc-50 focus:bg-white focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 outline-none transition-all placeholder:font-medium placeholder:text-zinc-400" />
                </div>
                <div>
                  <label className="text-[10.5px] font-black uppercase tracking-wider text-zinc-400 block mb-1.5">상세 내용</label>
                  <textarea rows={6} placeholder="전달할 내용을 작성하세요..." value={simNoticeBody} onChange={e => setSimNoticeBody(e.target.value)} className="w-full p-3.5 rounded-lg border border-zinc-200 text-[13px] font-medium bg-zinc-50 focus:bg-white focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 outline-none leading-relaxed resize-none transition-all placeholder:text-zinc-400" />
                </div>
                <button type="button" onClick={handleSimCellNoticeSend} className="w-full py-3 mt-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-black text-[13px] shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2">
                  <SvgSend /> 즉시 배포
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
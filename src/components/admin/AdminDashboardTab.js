import React, { useState, useMemo } from 'react';

// 엔터프라이즈 모노크롬 SVG 세트
const SvgUsers = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
const SvgDownload = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const IconClose = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

export default function AdminDashboardTab({
  cells = [], cellMembers = [], attendance = [], currentWeek, users = [], realStats,
  exportAttendanceCSV, setSelectedWeekOffset, setSelectedUserProfile, setActiveReportCell, getReportForCell, handleToggleRoutineCheck
}) {
  const [activeChecklistCell, setActiveChecklistCell] = useState(null);

  const activeCellMemberList = useMemo(() => {
    if (!activeChecklistCell) return [];
    const memberNames = (cellMembers || []).filter(m => m.cell_id === activeChecklistCell.id).map(m => m.user_name);
    if (activeChecklistCell.shepherd_name && !memberNames.includes(activeChecklistCell.shepherd_name)) {
      memberNames.unshift(activeChecklistCell.shepherd_name);
    }
    return memberNames;
  }, [activeChecklistCell, cellMembers]);

  return (
    <div className="h-full flex flex-col gap-3 min-h-0 overflow-hidden box-border font-sans select-none text-zinc-900">
      
      {/* 상단 통계 카드 */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0 divide-x divide-zinc-100">
        <div className="px-3">
          <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block mb-0.5">운영 중인 목장</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[26px] font-black font-mono text-zinc-900 leading-none">{cells.length}</span>
            <span className="text-[12px] font-bold text-zinc-500">개</span>
          </div>
        </div>
        <div className="px-5">
          <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block mb-0.5">전체 성도 수</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[26px] font-black font-mono text-indigo-600 leading-none">{realStats.totalSaints}</span>
            <span className="text-[12px] font-bold text-zinc-500">명</span>
          </div>
        </div>
        <div className="px-5">
          <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block mb-0.5">주일 출석 인원</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[26px] font-black font-mono text-emerald-600 leading-none">{realStats.todayAttCount}</span>
            <span className="text-[12px] font-bold text-zinc-500">명</span>
          </div>
        </div>
        <div className="px-5">
          <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block mb-0.5">주간 출석률</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[26px] font-black font-mono text-zinc-900 leading-none">{realStats.totalAttRate}</span>
            <span className="text-[12px] font-bold text-zinc-500">%</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-xl border border-zinc-200 shadow-sm">
        
        {/* 그리드 툴바 */}
        <div className="px-5 py-3 border-b border-zinc-200 bg-zinc-50/50 flex justify-between items-center shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-[14.5px] font-black text-zinc-900 tracking-tight">목장 편성 및 출결 현황</h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-white border-zinc-200 text-zinc-500 shadow-sm">
              {currentWeek.range}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportAttendanceCSV} className="px-3 py-1.5 text-[11.5px] font-bold rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors active:scale-95">
              <SvgDownload /> CSV 추출
            </button>
            <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 shadow-inner">
              <button onClick={() => setSelectedWeekOffset(prev => prev - 1)} className="px-2.5 py-1 text-[11px] font-bold text-zinc-600 hover:bg-white rounded transition-colors cursor-pointer">이전 주</button>
              <button onClick={() => setSelectedWeekOffset(0)} className={`px-3 py-1 text-[11px] font-black rounded transition-colors cursor-pointer ${currentWeek.isCurrentWeek ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:bg-white'}`}>이번 주</button>
              <button onClick={() => setSelectedWeekOffset(prev => prev + 1)} className="px-2.5 py-1 text-[11px] font-bold text-zinc-600 hover:bg-white rounded transition-colors cursor-pointer">다음 주</button>
            </div>
          </div>
        </div>

        {/* 🌟 메인 목장 리스트 고밀도 그리드 */}
        <div className="flex-1 w-full overflow-x-auto overflow-y-auto hide-scrollbar bg-white">
          <table className="w-full text-left border-collapse text-[12.5px] min-w-[850px]">
            <colgroup>
              <col className="w-12 text-center" />
              <col className="w-36" />
              <col className="w-32" />
              <col className="w-20 text-center" />
              <col className="w-auto" />
              <col className="w-24 text-center" />
              <col className="w-24 text-center" />
            </colgroup>
            <thead className="bg-zinc-50 text-zinc-400 text-[10px] font-black uppercase tracking-wider border-b border-zinc-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="py-2.5 px-4 text-center">번호</th>
                <th className="py-2.5 px-3">목장명</th>
                <th className="py-2.5 px-3">담당 목자</th>
                <th className="py-2.5 px-2 text-center">인원</th>
                <th className="py-2.5 px-3">소속 목원 (주일성수)</th>
                <th className="py-2.5 px-3 text-center">주간 보고서</th>
                <th className="py-2.5 px-3 text-center">루틴 관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium">
              {cells.length === 0 ? (
                <tr><td colSpan="7" className="py-16 text-center text-zinc-400 font-bold"><SvgUsers className="inline-block mb-1" /><br/>편성된 목장이 없습니다.</td></tr>
              ) : (
                cells.map((c, idx) => {
                  const members = cellMembers.filter(m => m.cell_id === c.id);
                  const report = getReportForCell(c);

                  return (
                    <tr key={c.id} className="hover:bg-zinc-50/70 transition-colors group">
                      <td className="py-2.5 px-4 text-center text-zinc-400 font-mono text-[11px]">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-2.5 px-3 font-black text-zinc-900">{c.name}</td>
                      <td className="py-2.5 px-3 text-zinc-700 font-bold">{c.shepherd_name || <span className="text-zinc-300 italic font-medium">미지정</span>}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-zinc-500 bg-zinc-50">{members.length}</td>
                      
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1 text-[11px]">
                          {members.length === 0 ? (
                            <span className="text-zinc-300 italic">비어있음</span>
                          ) : (
                            members.map(m => {
                              const isAtt = attendance.some(a => a.user_name === m.user_name && a.status === '출석' && (a.type === '주일' || a.type === '주일예배') && a.date === currentWeek.sunStr);
                              const userRecord = users.find(u => u.name === m.user_name) || { name: m.user_name, role: '목원' };
                              return (
                                <span 
                                  key={m.id || m.user_name} 
                                  onClick={() => setSelectedUserProfile(userRecord)}
                                  className={`font-bold cursor-pointer px-1.5 py-0.5 rounded border transition-colors ${isAtt ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400 hover:text-zinc-800'}`}
                                >
                                  {m.user_name}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => {
                            setActiveReportCell({
                              ...c,
                              reportData: report || { word_sharing: '미제출 (작성된 데이터가 없습니다.)', thanks_sharing: '미제출 (작성된 데이터가 없습니다.)', prayer_requests: '미제출 (작성된 데이터가 없습니다.)' }
                            });
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold cursor-pointer transition-all border ${
                            report ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-sm' : 'bg-zinc-50 border-transparent text-zinc-400 hover:bg-zinc-100'
                          }`}
                        >
                          {report ? '제출됨' : '미제출'}
                        </button>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setActiveChecklistCell(c)}
                          className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-[10.5px] font-black cursor-pointer shadow-sm transition-all"
                        >
                          Q/M/T
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🌟 실시간 Q/M/T 주간 체크표 인스펙터 모달 */}
      {activeChecklistCell && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-4xl bg-white rounded-2xl p-5 shadow-2xl border border-zinc-200 flex flex-col gap-4 max-h-[90vh]">
            
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                <h3 className="text-[16px] font-black text-zinc-900">
                  {activeChecklistCell.name} 루틴 현황
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">{currentWeek.dates[0]?.month}월</span>
                <button onClick={() => setActiveChecklistCell(null)} className="text-zinc-400 hover:text-zinc-800 font-bold text-lg cursor-pointer"><IconClose /></button>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto hide-scrollbar border border-zinc-200 rounded-xl bg-white">
              
              <div className="grid grid-cols-[70px_repeat(7,minmax(0,1fr))] sm:grid-cols-[85px_repeat(7,minmax(0,1fr))] items-center bg-zinc-50 border-b border-zinc-200 sticky top-0 z-10 shadow-sm">
                <div className="text-left font-black text-[10px] text-zinc-400 uppercase tracking-wider pl-3 border-r border-zinc-100 py-3">성도명</div>
                {currentWeek.dates.map(d => (
                  <div key={d.full} className={`flex flex-col items-center justify-center py-2 border-r border-zinc-100 last:border-0 ${d.isToday ? 'bg-zinc-900 text-white' : 'text-zinc-600'}`}>
                    <span className={`text-[10px] font-bold ${d.dayName === '일' && !d.isToday ? 'text-rose-500' : ''}`}>{d.dayName}</span>
                    <span className={`text-[12px] font-mono font-black mt-0.5 ${d.isToday ? 'text-white' : 'text-zinc-800'}`}>{d.dayNum}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col divide-y divide-zinc-100 bg-white">
                {activeCellMemberList.length === 0 ? (
                  <div className="py-16 text-zinc-400 text-center font-medium text-[12.5px]">목장에 등록된 성도가 없습니다.</div>
                ) : (
                  activeCellMemberList.map(name => (
                    <div key={name} className="grid grid-cols-[70px_repeat(7,minmax(0,1fr))] sm:grid-cols-[85px_repeat(7,minmax(0,1fr))] items-center hover:bg-zinc-50 transition-colors">
                      <div className="flex items-center min-w-0 px-3 py-3 border-r border-zinc-100 bg-white">
                        <span className="font-bold text-[12px] text-zinc-900 truncate">{name}</span>
                      </div>
                      {currentWeek.dates.map(d => {
                        const isQ = (attendance || []).some(a => a.user_name === name && a.date === d.full && (a.type === 'QT' || a.type === '큐티') && a.status === '출석');
                        const isM = (attendance || []).some(a => a.user_name === name && a.date === d.full && (a.type === '맥체인' || a.type === '성경') && a.status === '출석');
                        const isT = (attendance || []).some(a => a.user_name === name && a.date === d.full && (a.type === '감사' || a.type === '목장') && a.status === '출석');

                        return (
                          <div key={d.full} className="flex items-center justify-center gap-1 border-r border-zinc-100 last:border-0 py-2">
                            <button type="button" onClick={() => handleToggleRoutineCheck && handleToggleRoutineCheck(name, d.full, 'Q')} className={`w-4.5 h-4.5 rounded text-[9px] font-black flex items-center justify-center transition-all cursor-pointer border ${isQ ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-zinc-300 border-zinc-200 hover:border-zinc-300 hover:text-zinc-500'}`}>Q</button>
                            <button type="button" onClick={() => handleToggleRoutineCheck && handleToggleRoutineCheck(name, d.full, 'M')} className={`w-4.5 h-4.5 rounded text-[9px] font-black flex items-center justify-center transition-all cursor-pointer border ${isM ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-zinc-300 border-zinc-200 hover:border-zinc-300 hover:text-zinc-500'}`}>M</button>
                            <button type="button" onClick={() => handleToggleRoutineCheck && handleToggleRoutineCheck(name, d.full, 'T')} className={`w-4.5 h-4.5 rounded text-[9px] font-black flex items-center justify-center transition-all cursor-pointer border ${isT ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-zinc-300 border-zinc-200 hover:border-zinc-300 hover:text-zinc-500'}`}>T</button>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[10.5px] font-bold text-zinc-400 pl-1">* Q: QT / M: 맥체인 / T: 감사 (클릭 시 토글 체크)</span>
              <button onClick={() => setActiveChecklistCell(null)} className="px-5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[12px] cursor-pointer shadow-sm active:scale-95 transition-all">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
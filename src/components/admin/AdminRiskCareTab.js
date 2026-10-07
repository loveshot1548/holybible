// src/components/admin/AdminRiskCareTab.js
import React, { useState, useMemo } from 'react';

// 엔터프라이즈 모노크롬 SVG 세트
const SvgSearch = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const SvgPhone = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>;
const SvgCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const SvgFileText = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const SvgShieldCheck = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-8 h-8 text-emerald-600"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>;

export default function AdminRiskCareTab({
  visibleUsers = [],
  attendance = [],
  memberHealthStatus = {},
  handleCycleHealthStatus,
  setCareTargetUser
}) {
  const [viewMode, setViewMode] = useState('triage'); // 'triage' | 'table'
  const [severityFilter, setSeverityFilter] = useState('ALL'); // 'ALL' | 'RED' | 'YELLOW'
  const [searchQuery, setSearchQuery] = useState('');

  // 1. 최근 주일 날짜 배열 산출 (최근 8주 역추적)
  const recentSundays = useMemo(() => {
    const sundays = [];
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const kst = new Date(utc + (9 * 3600000));
    const day = kst.getDay();
    const baseSunday = new Date(kst);
    baseSunday.setDate(kst.getDate() - day + (day === 0 ? 0 : 7)); // 직전 주일

    for (let i = 0; i < 8; i++) {
      const targetSun = new Date(baseSunday);
      targetSun.setDate(baseSunday.getDate() - (i * 7));
      const dateStr = `${targetSun.getFullYear()}-${String(targetSun.getMonth() + 1).padStart(2, '0')}-${String(targetSun.getDate()).padStart(2, '0')}`;
      sundays.push(dateStr);
    }
    return sundays;
  }, []);

  // 2. 🌟 출석 기록 기반 연속 결석 및 상태 자동 연동 (3주차부터 주의)
  const userAbsenceAnalysis = useMemo(() => {
    const analysisMap = new Map();

    visibleUsers.forEach(u => {
      const uName = (u.name || '').trim();
      let consecutiveCount = 0;
      let lastAttendedDate = null;

      // 최근 주일부터 거꾸로 탐색하여 연속 미출석 계산
      for (const sunDate of recentSundays) {
        const isAttended = (attendance || []).some(a => 
          (a.user_name || '').trim() === uName &&
          a.date === sunDate &&
          (a.type === '주일' || a.type === '주일예배') &&
          a.status === '출석'
        );

        if (isAttended) {
          if (!lastAttendedDate) lastAttendedDate = sunDate;
          break; // 최근 출석 확인 시 카운트 종료
        } else {
          consecutiveCount++;
        }
      }

      // 수동 지정 상태가 있으면 우선 존중하되, 없으면 결석 주수로 자동 판정
      const manualTag = memberHealthStatus[u.name];
      let finalStatus = 'green';
      let reason = '주일 성수 안정권';

      if (manualTag) {
        finalStatus = manualTag;
        if (manualTag === 'red') reason = `${consecutiveCount > 0 ? `${consecutiveCount}주 결석 · ` : ''}관리자 지정 긴급`;
        else if (manualTag === 'yellow') reason = `${consecutiveCount > 0 ? `${consecutiveCount}주 결석 · ` : ''}관리자 지정 주의`;
      } else {
        if (consecutiveCount >= 4) {
          finalStatus = 'red';
          reason = `${consecutiveCount}주 연속 결석 (긴급 심방)`;
        } else if (consecutiveCount === 3) {
          // 🌟 [핵심 변경] 3주차 결석부터 주의(Yellow)로 배정
          finalStatus = 'yellow';
          reason = '3주 연속 결석 (안부 확인)';
        } else if (consecutiveCount > 0) {
          finalStatus = 'green';
          reason = `${consecutiveCount}주 결석 (단기 관찰)`;
        }
      }

      analysisMap.set(u.name, {
        consecutiveCount,
        lastAttendedDate: lastAttendedDate || '기록 없음',
        status: finalStatus,
        reason
      });
    });

    return analysisMap;
  }, [visibleUsers, attendance, recentSundays, memberHealthStatus]);

  // 3. 통계 집계
  const { redUsers, yellowUsers, healthyCount } = useMemo(() => {
    const red = [];
    const yellow = [];
    let healthy = 0;

    visibleUsers.forEach(u => {
      const info = userAbsenceAnalysis.get(u.name);
      const st = info?.status || 'green';
      if (st === 'red') red.push(u);
      else if (st === 'yellow') yellow.push(u);
      else healthy++;
    });

    return { redUsers: red, yellowUsers: yellow, healthyCount: healthy };
  }, [visibleUsers, userAbsenceAnalysis]);

  const totalAtRisk = redUsers.length + yellowUsers.length;

  // 4. 필터링된 성도 목록
  const filteredUsers = useMemo(() => {
    return visibleUsers.filter(u => {
      const info = userAbsenceAnalysis.get(u.name);
      const st = info?.status || 'green';
      
      if (st === 'green') return false; 
      if (severityFilter === 'RED' && st !== 'red') return false;
      if (severityFilter === 'YELLOW' && st !== 'yellow') return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        (u.office || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q)
      );
    });
  }, [visibleUsers, userAbsenceAnalysis, severityFilter, searchQuery]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl border border-zinc-200/90 shadow-2xs overflow-hidden font-sans select-none text-zinc-900">
      
      {/* =========================================================================
          [1] 모노크롬 지표 요약 바
          ========================================================================= */}
      <div className="shrink-0 bg-zinc-50/70 border-b border-zinc-200 px-5 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        <div className="p-3 bg-white border border-zinc-200 rounded-lg flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">케어 대상 성도</span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          </div>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-[20px] font-black font-mono text-zinc-900 leading-none">{totalAtRisk}</span>
            <span className="text-[11px] font-mono text-zinc-400">/ {visibleUsers.length}명</span>
          </div>
        </div>

        <div className="p-3 bg-white border border-zinc-200 rounded-lg flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              긴급 심방 (4주+)
            </span>
            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
              즉시 조치
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-[20px] font-black font-mono text-rose-600 leading-none">{redUsers.length}</span>
            <span className="text-[11px] font-bold text-zinc-400">명</span>
          </div>
        </div>

        <div className="p-3 bg-white border border-zinc-200 rounded-lg flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              주의 관찰 (3주)
            </span>
            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
              안부 확인
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-[20px] font-black font-mono text-amber-700 leading-none">{yellowUsers.length}</span>
            <span className="text-[11px] font-bold text-zinc-400">명</span>
          </div>
        </div>

        <div className="p-3 bg-white border border-zinc-200 rounded-lg flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              정상 성수군
            </span>
            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              안정
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-[20px] font-black font-mono text-zinc-800 leading-none">{healthyCount}</span>
            <span className="text-[11px] font-bold text-zinc-400">명</span>
          </div>
        </div>

      </div>

      {/* =========================================================================
          [2] 액션 툴바 & 정밀 필터
          ========================================================================= */}
      <div className="shrink-0 bg-white border-b border-zinc-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-[11px] font-bold shadow-inner">
            <button 
              onClick={() => setSeverityFilter('ALL')} 
              className={`px-3 py-1 rounded-md transition-all ${severityFilter === 'ALL' ? 'bg-white text-zinc-900 shadow-2xs font-black' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              전체 ({totalAtRisk})
            </button>
            <button 
              onClick={() => setSeverityFilter('RED')} 
              className={`px-3 py-1 rounded-md transition-all ${severityFilter === 'RED' ? 'bg-white text-rose-700 shadow-2xs font-black' : 'text-zinc-500 hover:text-rose-700'}`}
            >
              긴급 ({redUsers.length})
            </button>
            <button 
              onClick={() => setSeverityFilter('YELLOW')} 
              className={`px-3 py-1 rounded-md transition-all ${severityFilter === 'YELLOW' ? 'bg-white text-amber-800 shadow-2xs font-black' : 'text-zinc-500 hover:text-amber-800'}`}
            >
              주의 ({yellowUsers.length})
            </button>
          </div>

          <div className="relative flex items-center">
            <span className="absolute left-2.5 text-zinc-400 pointer-events-none"><SvgSearch /></span>
            <input 
              type="text" 
              placeholder="성도명, 직분 검색..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="pl-8 pr-3 py-1.5 text-[11.5px] bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:bg-white focus:border-zinc-800 text-zinc-900 font-bold placeholder:text-zinc-400 placeholder:font-medium w-44 sm:w-56 transition-colors shadow-2xs" 
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-[10.5px] font-bold shadow-inner">
            <button 
              onClick={() => setViewMode('triage')} 
              className={`px-2.5 py-1 rounded-md transition-all ${viewMode === 'triage' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              케어 보드
            </button>
            <button 
              onClick={() => setViewMode('table')} 
              className={`px-2.5 py-1 rounded-md transition-all ${viewMode === 'table' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              테이블 뷰
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          [3] 메인 콘텐츠: Triage Board vs Table View
          ========================================================================= */}
      <div className="flex-1 overflow-y-auto p-5 min-h-0 hide-scrollbar bg-zinc-50/40 pb-16">
        {totalAtRisk === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-20 gap-3">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 shadow-2xs">
              <SvgShieldCheck />
            </div>
            <h4 className="text-[15px] font-black text-zinc-900 tracking-tight">전체 성도가 주일 예배에 정상 성수 중입니다</h4>
            <p className="text-[11.5px] font-medium text-zinc-500 max-w-sm leading-relaxed">
              최근 주일 결석이 감지되면 연속 결석 주차(3주: 주의, 4주 이상: 긴급)에 따라 케어 큐에 자동 등록됩니다.
            </p>
          </div>
        ) : viewMode === 'triage' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            
            {/* 🔴 긴급 심방 대상 큐 (4주 이상 결석) */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="font-black text-[13px] text-zinc-900 tracking-tight">긴급 케어 큐 (4주+ 장기 결석)</span>
                </div>
                <span className="text-[10px] font-mono font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                  {redUsers.length}명
                </span>
              </div>

              <div className="space-y-2">
                {redUsers.length === 0 ? (
                  <div className="py-8 text-center text-zinc-400 text-[11.5px] font-medium bg-zinc-50/50 rounded-lg border border-dashed border-zinc-200">
                    긴급 조치 대상 성도가 없습니다.
                  </div>
                ) : (
                  redUsers.map(u => {
                    const info = userAbsenceAnalysis.get(u.name);
                    return (
                      <div 
                        key={u.name} 
                        className="p-3.5 rounded-lg bg-white border border-zinc-200 hover:border-zinc-400 transition-all flex flex-col gap-2.5 shadow-2xs"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <button 
                              type="button" 
                              onClick={(e) => handleCycleHealthStatus(u.name, e)} 
                              title="상태 수동 변경" 
                              className="w-3.5 h-3.5 rounded-full bg-rose-500 shrink-0 ring-2 ring-rose-100 hover:scale-110 transition-transform cursor-pointer" 
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-[13.5px] text-zinc-900">{u.name}</span>
                                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200">{u.office || '성도'}</span>
                                <span className="text-[10px] font-bold text-zinc-400">{u.role}</span>
                              </div>
                              <span className="text-[11px] text-rose-700 font-bold mt-0.5 block font-mono">
                                • {info?.reason}
                              </span>
                            </div>
                          </div>

                          {u.phone && (
                            <a 
                              href={`tel:${u.phone}`} 
                              className="p-1.5 rounded-md bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border border-zinc-200 transition-colors"
                              title="전화 걸기"
                            >
                              <SvgPhone />
                            </a>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-[10.5px]">
                          <span className="text-zinc-400 font-mono">
                            최근 출석: <b className="text-zinc-600">{info?.lastAttendedDate}</b>
                          </span>
                          <button 
                            type="button" 
                            onClick={() => setCareTargetUser(u)} 
                            className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[11px] shadow-2xs cursor-pointer active:scale-95 transition-all flex items-center gap-1"
                          >
                            <SvgFileText /> 케어 기록
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 🟡 주의 관찰 대상 큐 (3주 결석) */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-black text-[13px] text-zinc-900 tracking-tight">주의 관찰 큐 (3주 결석)</span>
                </div>
                <span className="text-[10px] font-mono font-black text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  {yellowUsers.length}명
                </span>
              </div>

              <div className="space-y-2">
                {yellowUsers.length === 0 ? (
                  <div className="py-8 text-center text-zinc-400 text-[11.5px] font-medium bg-zinc-50/50 rounded-lg border border-dashed border-zinc-200">
                    주의 대상 성도가 없습니다.
                  </div>
                ) : (
                  yellowUsers.map(u => {
                    const info = userAbsenceAnalysis.get(u.name);
                    return (
                      <div 
                        key={u.name} 
                        className="p-3.5 rounded-lg bg-white border border-zinc-200 hover:border-zinc-400 transition-all flex flex-col gap-2.5 shadow-2xs"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <button 
                              type="button" 
                              onClick={(e) => handleCycleHealthStatus(u.name, e)} 
                              title="상태 수동 변경" 
                              className="w-3.5 h-3.5 rounded-full bg-amber-400 shrink-0 ring-2 ring-amber-100 hover:scale-110 transition-transform cursor-pointer" 
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-[13.5px] text-zinc-900">{u.name}</span>
                                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200">{u.office || '성도'}</span>
                                <span className="text-[10px] font-bold text-zinc-400">{u.role}</span>
                              </div>
                              <span className="text-[11px] text-amber-800 font-bold mt-0.5 block font-mono">
                                • {info?.reason}
                              </span>
                            </div>
                          </div>

                          {u.phone && (
                            <a 
                              href={`tel:${u.phone}`} 
                              className="p-1.5 rounded-md bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border border-zinc-200 transition-colors"
                              title="전화 걸기"
                            >
                              <SvgPhone />
                            </a>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-[10.5px]">
                          <span className="text-zinc-400 font-mono">
                            최근 출석: <b className="text-zinc-600">{info?.lastAttendedDate}</b>
                          </span>
                          <button 
                            type="button" 
                            onClick={() => setCareTargetUser(u)} 
                            className="px-2.5 py-1 rounded-md bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold text-[11px] shadow-2xs cursor-pointer active:scale-95 transition-all flex items-center gap-1"
                          >
                            <SvgFileText /> 안부 기록
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        ) : (
          /* =========================================================================
              [테이블 뷰] Dense Data Grid Table View
             ========================================================================= */
          <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left border-collapse text-[12px] min-w-[650px]">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[10px] font-black text-zinc-400 uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-2.5 px-4 w-14 text-center">상태</th>
                  <th className="py-2.5 px-3 w-32">성도명</th>
                  <th className="py-2.5 px-3 w-36">직분 / 직책</th>
                  <th className="py-2.5 px-3">연속 결석 현황 및 원인</th>
                  <th className="py-2.5 px-3 w-28 font-mono">최근 출석</th>
                  <th className="py-2.5 px-4 w-28 text-right">케어 액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {filteredUsers.map(u => {
                  const info = userAbsenceAnalysis.get(u.name);
                  const isRed = info?.status === 'red';

                  return (
                    <tr key={u.name} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-2.5 px-4 text-center">
                        <button 
                          type="button" 
                          onClick={(e) => handleCycleHealthStatus(u.name, e)} 
                          title="상태 수동 전환" 
                          className={`w-3 h-3 rounded-full inline-block cursor-pointer transition-transform hover:scale-125 ${isRed ? 'bg-rose-500 ring-2 ring-rose-100' : 'bg-amber-400 ring-2 ring-amber-100'}`} 
                        />
                      </td>
                      <td className="py-2.5 px-3 font-black text-zinc-900">{u.name}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-zinc-700 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200 text-[10.5px] mr-1.5">{u.office || '성도'}</span>
                        <span className="text-[11px] text-zinc-500 font-bold">{u.role}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1.5 font-bold text-[11px] ${isRed ? 'text-rose-700' : 'text-amber-800'}`}>
                          {info?.reason}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-500">
                        {info?.lastAttendedDate}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button 
                          type="button" 
                          onClick={() => setCareTargetUser(u)} 
                          className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-[10.5px] font-bold shadow-2xs cursor-pointer active:scale-95 transition-all"
                        >
                          일지 작성
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
// src/components/admin/AdminEventModal.js
import React, { useEffect, useMemo } from 'react';

// =====================================================================
// ✒️ 엔터프라이즈 모노크롬 SVG 아이콘 세트 (Linear / Cron SaaS 규격)
// =====================================================================
const SvgCalendar = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-zinc-400 shrink-0">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const SvgClock = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-zinc-400 shrink-0">
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
  </svg>
);
const SvgMapPin = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-zinc-400 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);
const SvgUsers = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-zinc-400 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);
const SvgRepeat = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-zinc-400 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);
const SvgCheck = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);
const SvgClose = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.3} stroke="currentColor" className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// =====================================================================
// 📋 교회 사역 원클릭 프리셋 & 장소/대상/컬러 상수
// =====================================================================
const MINISTRY_EVENT_PRESETS = [
  {
    label: '주일 대예배',
    title: '주일 대예배',
    startTime: '11:00',
    endTime: '12:30',
    isAllDay: false,
    repeat: '매주 (주일)',
    room: '본당',
    target: '전교인',
    color: '#18181B'
  },
  {
    label: '수요예배',
    title: '수요 말씀 예배',
    startTime: '19:30',
    endTime: '21:00',
    isAllDay: false,
    repeat: '매주',
    room: '본당',
    target: '전교인',
    color: '#6366F1'
  },
  {
    label: '금요기도회',
    title: '금요 성령 기도회',
    startTime: '20:30',
    endTime: '22:00',
    isAllDay: false,
    repeat: '매주',
    room: '본당',
    target: '전교인',
    color: '#F59E0B'
  },
  {
    label: '새벽기도',
    title: '새벽기도회',
    startTime: '05:30',
    endTime: '06:30',
    isAllDay: false,
    repeat: '주중(월-금)',
    room: '소예배실',
    target: '전교인',
    color: '#0EA5E9'
  },
  {
    label: '목자모임',
    title: '목자 리더십 모임',
    startTime: '13:30',
    endTime: '15:00',
    isAllDay: false,
    repeat: '안 함',
    room: '교육관',
    target: '목자·리더십',
    color: '#10B981'
  },
  {
    label: '특별집회/수련회',
    title: '전교인 특별 부흥집회',
    startTime: '09:00',
    endTime: '18:00',
    isAllDay: true,
    repeat: '안 함',
    room: '본당',
    target: '전교인',
    color: '#EF4444'
  }
];

const QUICK_ROOMS = ['본당', '교육관', '소예배실', '친교실', '목양실', '온라인'];
const QUICK_TARGETS = ['전교인', '목자·리더십', '제직회', '청년부', '주일학교', '새가족'];

const COLOR_PALETTE = [
  { hex: '#18181B', name: '오닉스 블랙' },
  { hex: '#6366F1', name: '인디고' },
  { hex: '#0EA5E9', name: '스카이 블루' },
  { hex: '#10B981', name: '에메랄드' },
  { hex: '#84CC16', name: '라임' },
  { hex: '#F59E0B', name: '앰버 골드' },
  { hex: '#EF4444', name: '크림슨 레드' },
  { hex: '#EC4899', name: '로즈 핑크' },
  { hex: '#8B5CF6', name: '바이올렛' },
  { hex: '#71717A', name: '징크 그레이' }
];

export default function AdminEventModal({
  editingEventId,
  formEventTitle,
  setFormEventTitle,
  formEventDate,
  setFormEventDate,
  formEventEndDate,
  setFormEventEndDate,
  formEventStartTime,
  setFormEventStartTime,
  formEventEndTime,
  setFormEventEndTime,
  formEventIsAllDay,
  setFormEventIsAllDay,
  formEventRepeat,
  setFormEventRepeat,
  formEventRoom,
  setFormEventRoom,
  formEventTarget,
  setFormEventTarget,
  formEventColor,
  setFormEventColor,
  formEventMemo,
  setFormEventMemo,
  handleSaveChurchEvent,
  setShowEventModal
}) {
  // ESC 키로 모달 닫기 지원
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowEventModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShowEventModal]);

  // 시작일 변경 시 종료일이 시작일보다 과거이면 자동으로 시작일과 동기화
  const handleStartDateChange = (nextStart) => {
    setFormEventDate(nextStart);
    if (!formEventEndDate || nextStart > formEventEndDate) {
      setFormEventEndDate(nextStart);
    }
  };

  // 시작 시간 기준으로 종료 시간 빠르게 더하기 (+30분, +60분, +90분, +120분)
  const handleAddDurationMinutes = (minutesToAdd) => {
    const base = formEventStartTime || '11:00';
    const [hh, mm] = base.split(':').map(Number);
    if (isNaN(hh) || isNaN(mm)) return;
    const totalMinutes = (hh * 60 + mm + minutesToAdd) % (24 * 60);
    const nextH = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const nextM = String(totalMinutes % 60).padStart(2, '0');
    setFormEventEndTime(`${nextH}:${nextM}`);
  };

  // 프리셋 원클릭 적용
  const handleApplyPreset = (preset) => {
    setFormEventTitle(preset.title);
    setFormEventStartTime(preset.startTime);
    setFormEventEndTime(preset.endTime);
    setFormEventIsAllDay(preset.isAllDay);
    setFormEventRepeat(preset.repeat);
    setFormEventRoom(preset.room);
    setFormEventTarget(preset.target);
    setFormEventColor(preset.color);
  };

  // 실시간 기간 및 소요 시간 계산
  const durationSummary = useMemo(() => {
    let daySpan = 1;
    if (formEventDate && formEventEndDate) {
      const s = new Date(`${formEventDate}T00:00:00`).getTime();
      const e = new Date(`${formEventEndDate}T00:00:00`).getTime();
      if (!isNaN(s) && !isNaN(e) && e >= s) {
        daySpan = Math.round((e - s) / 86400000) + 1;
      }
    }

    if (formEventIsAllDay) {
      return `${daySpan}일간 · 종일 일정`;
    }

    if (formEventStartTime && formEventEndTime) {
      const [sh, sm] = formEventStartTime.split(':').map(Number);
      const [eh, em] = formEventEndTime.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff > 0) {
        const hrs = Math.floor(diff / 60);
        const mins = diff % 60;
        const timeLabel = `${hrs > 0 ? `${hrs}시간 ` : ''}${mins > 0 ? `${mins}분` : ''}`.trim();
        return `${daySpan}일간 · ${timeLabel} 소요`;
      }
    }
    return `${daySpan}일간`;
  }, [formEventDate, formEventEndDate, formEventIsAllDay, formEventStartTime, formEventEndTime]);

  const activeColorHex = formEventColor || '#18181B';
  const activeColorName = COLOR_PALETTE.find(c => c.hex === activeColorHex)?.name || '커스텀 컬러';

  return (
    <div
      className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in select-none font-sans text-zinc-900"
      onClick={() => setShowEventModal(false)}
    >
      <div
        className="w-full max-w-lg bg-[#FAFAFA] rounded-t-3xl sm:rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.28)] flex flex-col max-h-[92dvh] overflow-hidden border border-zinc-200/90"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===================================================================== */}
        {/* 1. 상단 엔터프라이즈 헤더 (줄바꿈 0% 보장)                             */}
        {/* ===================================================================== */}
        <div className="px-5 py-3.5 bg-zinc-900 text-white flex items-center justify-between gap-2 shrink-0 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              style={{ backgroundColor: activeColorHex }}
              className="w-3 h-3 rounded-full ring-2 ring-white/30 shrink-0"
            />
            <div className="min-w-0">
              <span className="text-[9.5px] font-mono text-zinc-400 uppercase tracking-widest block whitespace-nowrap">
                MINISTRY SCHEDULE & EVENT COMPOSER
              </span>
              <h3 className="text-[14.5px] font-black tracking-tight text-white truncate">
                {editingEventId ? '사역 일정 상세 수정' : '신규 사역 일정 등록'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="hidden sm:inline-block text-[10.5px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-zinc-200 whitespace-nowrap tabular-nums">
              {durationSummary}
            </span>
            <button
              type="button"
              onClick={() => setShowEventModal(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="닫기 (ESC)"
            >
              <SvgClose />
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 2. 모달 본문 스크롤 영역                                               */}
        {/* ===================================================================== */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto hide-scrollbar flex-1">
          
          {/* 실시간 캘린더 바 프리뷰 & 원클릭 사역 프리셋 바 */}
          <div className="bg-white rounded-xl border border-zinc-200/90 p-3 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between gap-2 whitespace-nowrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                CALENDAR CHIP PREVIEW (달력 표시 미리보기)
              </span>
              <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
                {formEventDate || '날짜 미지정'}
                {formEventEndDate && formEventEndDate !== formEventDate ? ` ~ ${formEventEndDate}` : ''}
              </span>
            </div>

            {/* 실제 캘린더에 표시될 스트립 미리보기 */}
            <div
              style={{
                backgroundColor: `${activeColorHex}15`,
                borderLeftColor: activeColorHex,
                borderLeftWidth: '4px'
              }}
              className="px-3 py-2 rounded-lg border border-zinc-200/80 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[12.5px] font-black truncate" style={{ color: activeColorHex }}>
                  {formEventTitle || '일정 제목을 입력하세요'}
                </span>
                {formEventRoom && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/90 text-zinc-700 border border-zinc-200 whitespace-nowrap shrink-0">
                    {formEventRoom}
                  </span>
                )}
              </div>
              <span
                className="text-[10.5px] font-mono font-bold whitespace-nowrap shrink-0 tabular-nums"
                style={{ color: activeColorHex }}
              >
                {formEventIsAllDay ? '종일' : `${formEventStartTime || '11:00'}~${formEventEndTime || '12:30'}`}
              </span>
            </div>

            {/* 원클릭 사역 템플릿 프리셋 칩 */}
            <div className="pt-1 border-t border-zinc-100">
              <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar py-0.5">
                <span className="text-[10px] font-bold text-zinc-400 mr-1 whitespace-nowrap shrink-0">
                  빠른 프리셋:
                </span>
                {MINISTRY_EVENT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2 py-1 rounded-md text-[10.5px] font-bold bg-zinc-50 hover:bg-zinc-900 hover:text-white text-zinc-700 border border-zinc-200/90 transition-all whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 일정 제목 입력 카드 */}
          <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-3.5 space-y-1.5">
            <div className="flex items-center justify-between whitespace-nowrap">
              <label className="text-[10.5px] font-black uppercase tracking-wider text-zinc-500">
                사역 일정 제목 *
              </label>
              {formEventTitle && (
                <button
                  type="button"
                  onClick={() => setFormEventTitle('')}
                  className="text-[10px] font-bold text-zinc-400 hover:text-zinc-800 cursor-pointer"
                >
                  지우기
                </button>
              )}
            </div>
            <input
              type="text"
              value={formEventTitle}
              onChange={(e) => setFormEventTitle(e.target.value)}
              placeholder="예: 주일 대예배, 목자 모임, 전교인 수련회..."
              className="w-full px-3 py-2 text-[14px] font-black bg-zinc-50/70 border border-zinc-200 rounded-lg outline-none placeholder:text-zinc-400 placeholder:font-medium text-zinc-900 transition-all focus:bg-white focus:border-zinc-900"
              autoFocus
            />
          </div>

          {/* 일시 및 소요 시간 설정 카드 */}
          <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs divide-y divide-zinc-100 overflow-hidden">
            {/* 종일 토글 & 소요시간 배지 */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50/50 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <span className="text-[12.5px] font-black text-zinc-900">하루 종일 일정</span>
                <span className="text-[10px] font-mono font-bold text-zinc-500 bg-white px-2 py-0.5 rounded border border-zinc-200 tabular-nums">
                  {durationSummary}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formEventIsAllDay}
                  onChange={(e) => setFormEventIsAllDay(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900" />
              </label>
            </div>

            {/* 시작 일시 */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 whitespace-nowrap">
              <span className="text-[12.5px] font-bold text-zinc-700">시작 일시</span>
              <div className="flex items-center gap-1.5 ml-auto">
                <div className="flex items-center gap-1.5 bg-zinc-50 hover:bg-zinc-100/80 rounded-lg border border-zinc-200 px-2.5 py-1.5 transition-colors">
                  <SvgCalendar />
                  <input
                    type="date"
                    value={formEventDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="text-[12px] font-mono font-bold text-zinc-900 bg-transparent outline-none cursor-pointer tabular-nums"
                  />
                </div>
                {!formEventIsAllDay && (
                  <div className="flex items-center gap-1.5 bg-zinc-50 hover:bg-zinc-100/80 rounded-lg border border-zinc-200 px-2.5 py-1.5 transition-colors">
                    <SvgClock />
                    <input
                      type="time"
                      value={formEventStartTime}
                      onChange={(e) => setFormEventStartTime(e.target.value)}
                      className="text-[12px] font-mono font-bold text-zinc-900 bg-transparent outline-none cursor-pointer tabular-nums"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 종료 일시 + 소요시간 퀵 가산 버튼 */}
            <div className="px-4 py-2.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 whitespace-nowrap">
                <span className="text-[12.5px] font-bold text-zinc-700">종료 일시</span>
                <div className="flex items-center gap-1.5 ml-auto">
                  <div className="flex items-center gap-1.5 bg-zinc-50 hover:bg-zinc-100/80 rounded-lg border border-zinc-200 px-2.5 py-1.5 transition-colors">
                    <SvgCalendar />
                    <input
                      type="date"
                      value={formEventEndDate}
                      min={formEventDate}
                      onChange={(e) => setFormEventEndDate(e.target.value)}
                      className="text-[12px] font-mono font-bold text-zinc-900 bg-transparent outline-none cursor-pointer tabular-nums"
                    />
                  </div>
                  {!formEventIsAllDay && (
                    <div className="flex items-center gap-1.5 bg-zinc-50 hover:bg-zinc-100/80 rounded-lg border border-zinc-200 px-2.5 py-1.5 transition-colors">
                      <SvgClock />
                      <input
                        type="time"
                        value={formEventEndTime}
                        onChange={(e) => setFormEventEndTime(e.target.value)}
                        className="text-[12px] font-mono font-bold text-zinc-900 bg-transparent outline-none cursor-pointer tabular-nums"
                      />
                    </div>
                  )}
                </div>
              </div>

              {!formEventIsAllDay && (
                <div className="flex items-center justify-end gap-1 pt-0.5 overflow-x-auto hide-scrollbar">
                  <span className="text-[10px] font-bold text-zinc-400 mr-1 whitespace-nowrap">소요시간 빠른설정:</span>
                  {[
                    { label: '+30분', mins: 30 },
                    { label: '+1시간', mins: 60 },
                    { label: '+1시간 30분', mins: 90 },
                    { label: '+2시간', mins: 120 }
                  ].map(dBtn => (
                    <button
                      key={dBtn.mins}
                      type="button"
                      onClick={() => handleAddDurationMinutes(dBtn.mins)}
                      className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-700 text-[10px] font-mono font-bold transition-colors whitespace-nowrap cursor-pointer tabular-nums"
                    >
                      {dBtn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 반복 주기 */}
            <div className="flex items-center justify-between px-4 py-2.5 whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <SvgRepeat />
                <span className="text-[12.5px] font-bold text-zinc-700">반복 주기</span>
              </div>
              <select
                value={formEventRepeat}
                onChange={(e) => setFormEventRepeat(e.target.value)}
                className="px-2.5 py-1 rounded-lg text-[12px] font-bold text-zinc-800 bg-zinc-50 border border-zinc-200 outline-none cursor-pointer focus:border-zinc-900"
              >
                <option value="안 함">반복 안 함 (단일 일정)</option>
                <option value="매일">매일 반복</option>
                <option value="주중(월-금)">주중 반복 (월~금)</option>
                <option value="매주 (주일)">매주 (주일마다)</option>
                <option value="매주">매주 (해당 요일마다)</option>
                <option value="매월">매월 (해당 일자마다)</option>
              </select>
            </div>
          </div>

          {/* 장소 · 참석 대상 · 메모 섹션 */}
          <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs divide-y divide-zinc-100 overflow-hidden">
            
            {/* 장소 설정 + 퀵 칩 */}
            <div className="p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <SvgMapPin />
                  <span className="text-[12px] font-black text-zinc-800">사역 장소</span>
                </div>
                <input
                  type="text"
                  value={formEventRoom}
                  onChange={(e) => setFormEventRoom(e.target.value)}
                  placeholder="장소 직접 입력 (예: 본당)"
                  className="w-40 sm:w-48 px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200 text-right text-[12px] font-bold text-zinc-900 outline-none focus:bg-white focus:border-zinc-900"
                />
              </div>
              <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
                {QUICK_ROOMS.map(rm => (
                  <button
                    key={rm}
                    type="button"
                    onClick={() => setFormEventRoom(rm)}
                    className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border transition-all whitespace-nowrap cursor-pointer ${
                      formEventRoom === rm
                        ? 'bg-zinc-900 text-white border-zinc-900 font-black'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    {rm}
                  </button>
                ))}
              </div>
            </div>

            {/* 참석 대상 설정 + 퀵 칩 */}
            <div className="p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <SvgUsers />
                  <span className="text-[12px] font-black text-zinc-800">참석 대상</span>
                </div>
                <input
                  type="text"
                  value={formEventTarget}
                  onChange={(e) => setFormEventTarget(e.target.value)}
                  placeholder="대상 직접 입력 (예: 전교인)"
                  className="w-40 sm:w-48 px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200 text-right text-[12px] font-bold text-zinc-900 outline-none focus:bg-white focus:border-zinc-900"
                />
              </div>
              <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
                {QUICK_TARGETS.map(tg => (
                  <button
                    key={tg}
                    type="button"
                    onClick={() => setFormEventTarget(tg)}
                    className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border transition-all whitespace-nowrap cursor-pointer ${
                      formEventTarget === tg
                        ? 'bg-zinc-900 text-white border-zinc-900 font-black'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    {tg}
                  </button>
                ))}
              </div>
            </div>

            {/* 상세 코멘트 및 준비사항 메모 */}
            <div className="p-3.5 bg-zinc-50/40 space-y-1.5">
              <div className="flex items-center justify-between whitespace-nowrap">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-zinc-500">
                  사역 메모 및 준비사항
                </span>
                <span className="text-[10px] font-mono text-zinc-400 tabular-nums">
                  {(formEventMemo || '').length}자
                </span>
              </div>
              <textarea
                rows={2}
                placeholder="설교 본문, 담당 사역자, 준비물 등 참고 메모를 기록하세요..."
                value={formEventMemo}
                onChange={(e) => setFormEventMemo(e.target.value)}
                className="w-full text-[12.5px] font-medium text-zinc-800 bg-white border border-zinc-200 rounded-lg outline-none resize-none placeholder:text-zinc-400 p-2.5 focus:border-zinc-900 transition-all leading-relaxed"
              />
            </div>
          </div>

          {/* 캘린더 라벨 색상 지정 섹션 */}
          <div className="bg-white rounded-xl border border-zinc-200/90 shadow-2xs p-3.5 space-y-2.5">
            <div className="flex items-center justify-between whitespace-nowrap">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-zinc-500">
                캘린더 라벨 색상
              </span>
              <span className="text-[10.5px] font-bold text-zinc-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: activeColorHex }} />
                {activeColorName}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1.5 overflow-x-auto hide-scrollbar py-1 px-0.5">
              {COLOR_PALETTE.map((cObj) => {
                const isSelected = activeColorHex === cObj.hex;
                return (
                  <button
                    key={cObj.hex}
                    type="button"
                    onClick={() => setFormEventColor(cObj.hex)}
                    style={{ backgroundColor: cObj.hex }}
                    title={cObj.name}
                    className={`w-7 h-7 rounded-full transition-all shrink-0 cursor-pointer flex items-center justify-center text-white ${
                      isSelected
                        ? 'scale-110 ring-2 ring-zinc-900 ring-offset-2 shadow-sm'
                        : 'opacity-80 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    {isSelected && <SvgCheck />}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* ===================================================================== */}
        {/* 3. 하단 액션 푸터 바 (취소 & 저장 버튼)                                 */}
        {/* ===================================================================== */}
        <div className="px-5 py-3.5 bg-white border-t border-zinc-200/90 flex items-center justify-between gap-2.5 shrink-0 whitespace-nowrap">
          <button
            type="button"
            onClick={() => setShowEventModal(false)}
            className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[12.5px] font-bold transition-colors cursor-pointer"
          >
            취소
          </button>

          <button
            type="button"
            onClick={handleSaveChurchEvent}
            className="flex-1 py-2.5 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-[12.5px] font-black shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <SvgCheck />
            <span>{editingEventId ? '변경사항 저장하기' : '사역 일정 등록하기'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
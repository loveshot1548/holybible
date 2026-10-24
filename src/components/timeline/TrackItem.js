// src/components/timeline/TrackItem.js
import React, { useMemo, memo } from 'react';
import { useNLEStore } from '../../store/useNLEStore';

// 엔터프라이즈 모노크롬 SVG 아이콘
const SvgEye = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const SvgEyeSlash = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const SvgLock = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const SvgLockOpen = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

function TrackItemComponent({
  track,
  clips = [],
  pxPerSec = 70,
  isHovered = false,
  trackState = {},
  onToggleTrackState = () => {},
  onClipPointerDown = () => {},
  onTrimPointerDown = () => {},
  speechIntervals = []
}) {
  const { selectedClipId } = useNLEStore();

  const isVideo = track.type === 'video' || track.id.startsWith('V');
  const isText = track.type === 'text' || track.id.startsWith('T');
  const isAudio = track.type === 'audio' || track.id.startsWith('A');

  // 트랙 타입별 테마 컬러 및 인디케이터
  const trackTheme = useMemo(() => {
    if (isVideo) {
      return {
        dot: 'bg-sky-400',
        clipBg: 'bg-[#0B253A] border-[#0284C7]',
        text: 'text-sky-100',
        label: 'VIDEO'
      };
    }
    if (isText) {
      return {
        dot: 'bg-amber-400',
        clipBg: 'bg-[#38200B] border-[#D97706]',
        text: 'text-amber-100',
        label: 'TEXT'
      };
    }
    return {
      dot: 'bg-emerald-400',
      clipBg: 'bg-[#062D23] border-[#059669]',
      text: 'text-emerald-100',
      label: 'AUDIO'
    };
  }, [isVideo, isText]);

  // 트랙 숨김 처리 시 블라인드 스트라이프 오버레이
  if (trackState.hidden) {
    return (
      <div
        data-track-row-id={track.id}
        className="h-11 border-b border-white/5 relative flex items-center bg-[#07080B] opacity-40 select-none overflow-hidden"
      >
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#12141c,#12141c_10px,#090a0f_10px,#090a0f_20px)] flex items-center px-4">
          <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">
            {track.name || track.id} (MUTED / HIDDEN)
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      data-track-row-id={track.id}
      className={`h-11 border-b border-white/5 relative flex items-center transition-colors ${
        trackState.locked ? 'opacity-50 pointer-events-none' : ''
      } ${
        isHovered
          ? 'bg-[#152433] ring-1 ring-[#00E5FF] ring-inset'
          : 'bg-[#090A0E] hover:bg-[#0D0F14]'
      }`}
    >
      {/* 🎬 트랙 내 클립 렌더링 목록 */}
      {clips.map((clip) => {
        if (!clip) return null;
        const isSelected = selectedClipId === clip.id;
        const startSec = clip.start || 0;
        const durationSec = clip.duration || 3.5;
        const left = startSec * pxPerSec;
        const width = Math.max(28, durationSec * pxPerSec);

        // A2 트랙 실시간 오디오 더킹(Ducking) 감쇠 구간 판정
        const isDucked =
          isAudio &&
          (track.id === 'A2' || clip.trackId === 'A2') &&
          speechIntervals.some(
            (s) => startSec < s.end && startSec + durationSec > s.start
          );

        return (
          <div
            key={clip.id}
            onMouseDown={(e) => onClipPointerDown(e, clip)}
            onTouchStart={(e) => onClipPointerDown(e, clip)}
            style={{
              left: `${left}px`,
              width: `${width}px`
            }}
            className={`absolute top-[3px] bottom-[3px] rounded-lg border flex items-center justify-between px-1.5 cursor-grab active:cursor-grabbing overflow-hidden shadow-md select-none group transition-all ${
              trackTheme.clipBg
            } ${
              isSelected
                ? 'ring-2 ring-white border-white brightness-125 z-20 shadow-[0_0_14px_rgba(255,255,255,0.45)]'
                : 'hover:brightness-110 opacity-95'
            }`}
          >
            {/* 👈 좌측 트리밍 핸들 (이벤트 버블링 차단 & 모바일 터치 히트박스 완비) */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                onTrimPointerDown(e, clip, true);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                onTrimPointerDown(e, clip, true);
              }}
              className="absolute left-0 top-0 bottom-0 w-4 -ml-1 hover:bg-white/40 active:bg-white cursor-ew-resize shrink-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              title="시작 지점 조절 (Trim Left)"
            >
              <div className="w-0.5 h-3.5 bg-white/90 rounded-full shadow-sm" />
            </div>

            {/* 비디오/이미지 썸네일 미리보기 필름스트립 */}
            {(clip.type === 'video' || clip.type === 'image') && clip.url && (
              <img
                src={clip.url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
              />
            )}

            {/* 🎵 페어라이트급 고밀도 오디오 파형 시각화 */}
            {isAudio && (
              <div className="absolute inset-0 opacity-45 flex items-center justify-between px-1 pointer-events-none overflow-hidden">
                {Array.from({ length: Math.min(100, Math.floor(durationSec * (pxPerSec / 8))) }).map((_, idx) => {
                  const seed = ((clip.id?.charCodeAt(idx % clip.id.length) || 1) * (idx + 1)) % 100;
                  const heightPct = 18 + ((seed * 37) % 64);
                  return (
                    <div
                      key={idx}
                      className="w-[1.5px] bg-emerald-400 rounded-t-sm"
                      style={{ height: `${heightPct}%` }}
                    />
                  );
                })}
              </div>
            )}

            {/* 🎛️ 실시간 오디오 더킹 감쇠 라인 오버레이 */}
            {isDucked && (
              <div className="absolute inset-x-0 bottom-0 h-2.5 bg-emerald-950/90 border-t border-dashed border-emerald-400 flex items-center justify-center pointer-events-none z-10">
                <span className="text-[7.5px] font-mono text-emerald-300 font-bold tracking-tighter">
                  -18dB DUCKED
                </span>
              </div>
            )}

            {/* 클립 명칭 & 트랜지션/효과 미니 뱃지 */}
            <div className="flex items-center gap-1 z-10 pointer-events-none truncate drop-shadow-md">
              {clip.beatImpact && (
                <span className="text-[7.5px] bg-amber-500/90 text-black px-1 rounded-xs font-black">
                  BEAT
                </span>
              )}
              {clip.transition && clip.transition !== 'none' && (
                <span className="text-[7.5px] bg-indigo-500/90 text-white px-1 rounded-xs font-mono font-bold">
                  {clip.transition}
                </span>
              )}
              <span className="text-[10px] font-bold truncate leading-none">
                {clip.name || clip.content || track.name || track.id}
              </span>
            </div>

            {/* 재생 시간 표기 */}
            <span className="text-[8.5px] font-mono font-bold text-zinc-300/80 pointer-events-none pl-1 shrink-0 z-10">
              {durationSec.toFixed(1)}s
            </span>

            {/* 👉 우측 트리밍 핸들 (이벤트 버블링 차단 & 모바일 터치 히트박스 완비) */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                onTrimPointerDown(e, clip, false);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                onTrimPointerDown(e, clip, false);
              }}
              className="absolute right-0 top-0 bottom-0 w-4 -mr-1 hover:bg-white/40 active:bg-white cursor-ew-resize shrink-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              title="끝 지점 조절 (Trim Right)"
            >
              <div className="w-0.5 h-3.5 bg-white/90 rounded-full shadow-sm" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 🏷 좌측 트랙 헤더 독립 컴포넌트 (Index Column용)
function TrackHeaderItemComponent({
  track,
  isHovered = false,
  trackState = {},
  onToggleTrackState = () => {}
}) {
  const isVideo = track.type === 'video' || track.id.startsWith('V');
  const isText = track.type === 'text' || track.id.startsWith('T');

  return (
    <div
      className={`h-11 border-b border-[#181B24] px-2 flex items-center justify-between transition-colors ${
        isHovered ? 'bg-[#182330] border-[#00E5FF]' : 'bg-[#0E1016]'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            isVideo ? 'bg-sky-400' : isText ? 'bg-amber-400' : 'bg-emerald-400'
          }`}
        />
        <span className="font-mono text-xs font-black text-white">{track.name || track.id}</span>
      </div>

      <div className="flex items-center gap-1 text-[9px] font-mono text-zinc-500">
        <button
          onClick={() => onToggleTrackState(track.id, 'locked')}
          className={`p-1 rounded cursor-pointer ${
            trackState.locked ? 'text-amber-400 bg-amber-950/40' : 'hover:text-zinc-300'
          }`}
          title={trackState.locked ? '트랙 잠금 해제' : '트랙 잠금'}
        >
          {trackState.locked ? <SvgLock /> : <SvgLockOpen />}
        </button>
        <button
          onClick={() => onToggleTrackState(track.id, 'hidden')}
          className={`p-1 rounded cursor-pointer ${
            trackState.hidden ? 'text-rose-400 bg-rose-950/40' : 'hover:text-zinc-300'
          }`}
          title={trackState.hidden ? '트랙 보이기' : '트랙 숨기기'}
        >
          {trackState.hidden ? <SvgEyeSlash /> : <SvgEye />}
        </button>
      </div>
    </div>
  );
}

// 🌟 React.memo를 통한 60FPS 타임라인 렌더링 성능 최적화
export default memo(TrackItemComponent);
export const TrackHeaderItem = memo(TrackHeaderItemComponent);
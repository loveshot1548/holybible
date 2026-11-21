// src/store/useNLEStore.js
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const MAX_HISTORY_STEPS = 50;

export const useNLEStore = create(
  immer((set, get) => {
    const captureSnapshot = (state) => ({
      entities: JSON.parse(JSON.stringify(state.entities)),
      trackList: [...state.trackList],
      projectDuration: state.projectDuration,
      selectedClipId: state.selectedClipId
    });

    const recalcProjectDuration = (state) => {
      let maxEnd = 10;
      Object.values(state.entities.clips).forEach((c) => {
        const end = (c.start || 0) + (c.duration || 0);
        if (end > maxEnd) maxEnd = end;
      });
      state.projectDuration = Math.max(10, Math.ceil(maxEnd));
    };

    return {
      // 1. 프로젝트 기본 메타데이터
      projectDuration: 30,
      playhead: 0,
      isPlaying: false,
      playbackRate: 1.0,
      isMagnetic: true,
      zoomScale: 50,
      selectedClipId: null,

      // 2. 실행 취소 / 다시 실행 히스토리 스택
      historyIndex: 0,
      past: [],
      future: [],

      // 3. BeatSyncEngine 연동 비트 마커
      beatMarkers: [],

      // 4. 다빈치 리졸브 규격 트랙 계층 구조 (V 상단 -> T 자막 -> A 오디오 하단)
      trackList: ['V4', 'V3', 'V2', 'V1', 'T2', 'T1', 'A1', 'A2'],

      entities: {
        tracks: {
          V4: { id: 'V4', type: 'video', label: 'V4', clipIds: [], muted: false, locked: false, hidden: false },
          V3: { id: 'V3', type: 'video', label: 'V3', clipIds: [], muted: false, locked: false, hidden: false },
          V2: { id: 'V2', type: 'video', label: 'V2', clipIds: [], muted: false, locked: false, hidden: false },
          V1: { id: 'V1', type: 'video', label: 'V1', clipIds: [], muted: false, locked: false, hidden: false },
          T2: { id: 'T2', type: 'text', label: 'T2', clipIds: [], muted: false, locked: false, hidden: false },
          T1: { id: 'T1', type: 'text', label: 'T1', clipIds: [], muted: false, locked: false, hidden: false },
          A1: { id: 'A1', type: 'audio', label: 'A1', clipIds: [], muted: false, locked: false, hidden: false },
          A2: { id: 'A2', type: 'audio', label: 'A2', clipIds: [], muted: false, locked: false, hidden: false }
        },
        clips: {}
      },

      mediaPool: [],

      // =======================================================================
      // 히스토리 엔진
      // =======================================================================
      recordHistory: () => set((state) => {
        const snap = captureSnapshot(state);
        state.past.push(snap);
        if (state.past.length > MAX_HISTORY_STEPS) state.past.shift();
        state.future = [];
        state.historyIndex = state.past.length;
      }),

      undo: () => set((state) => {
        if (state.past.length === 0) return;
        state.future.unshift(captureSnapshot(state));
        const previousSnap = state.past.pop();
        if (previousSnap) {
          state.entities = previousSnap.entities;
          state.trackList = previousSnap.trackList;
          state.projectDuration = previousSnap.projectDuration;
          state.selectedClipId = previousSnap.selectedClipId;
        }
        state.historyIndex = state.past.length;
      }),

      redo: () => set((state) => {
        if (state.future.length === 0) return;
        state.past.push(captureSnapshot(state));
        const nextSnap = state.future.shift();
        if (nextSnap) {
          state.entities = nextSnap.entities;
          state.trackList = nextSnap.trackList;
          state.projectDuration = nextSnap.projectDuration;
          state.selectedClipId = nextSnap.selectedClipId;
        }
        state.historyIndex = state.past.length;
      }),

      // =======================================================================
      // 재생 · 줌 · 셔틀 제어
      // =======================================================================
      setPlayhead: (time) => set((state) => {
        state.playhead = Math.max(0, Number(time) || 0);
      }),

      setIsPlaying: (val) => set((state) => {
        state.isPlaying = Boolean(val);
        if (!val) state.playbackRate = 1.0;
      }),

      setPlaybackRate: (rate) => set((state) => {
        state.playbackRate = Math.max(-4, Math.min(4, Number(rate) || 1.0));
      }),

      setZoomScale: (zoom) => set((state) => {
        state.zoomScale = Math.max(20, Math.min(250, Number(zoom) || 50));
      }),

      toggleMagnetic: () => set((state) => {
        state.isMagnetic = !state.isMagnetic;
      }),

      selectClip: (id) => set((state) => {
        state.selectedClipId = id;
      }),

      setBeatMarkers: (markers) => set((state) => {
        state.beatMarkers = Array.isArray(markers) ? markers : [];
      }),

      addMedia: (mediaArray) => set((state) => {
        if (Array.isArray(mediaArray)) state.mediaPool.push(...mediaArray);
      }),

      // =======================================================================
      // 트랙 관리 (추가 · 뮤트 · 잠금 · 숨김)
      // =======================================================================
      addTrack: (type) => set((state) => {
        get().recordHistory();
        const prefix = type === 'video' ? 'V' : type === 'audio' ? 'A' : 'T';
        const existing = state.trackList.filter((id) => id.startsWith(prefix));
        const newTrackId = `${prefix}${existing.length + 1}`;

        state.entities.tracks[newTrackId] = {
          id: newTrackId,
          type,
          label: newTrackId,
          clipIds: [],
          muted: false,
          locked: false,
          hidden: false
        };

        if (type === 'video') state.trackList.unshift(newTrackId);
        else state.trackList.push(newTrackId);
      }),

      toggleTrackFlag: (trackId, flag) => set((state) => {
        const track = state.entities.tracks[trackId];
        if (track && ['muted', 'locked', 'hidden'].includes(flag)) {
          track[flag] = !track[flag];
        }
      }),

      getAvailableTrackId: (type, start, duration) => {
        const state = get();
        const prefix = type === 'video' ? 'V' : type === 'audio' ? 'A' : 'T';
        const candidateTracks = state.trackList.filter((id) => id.startsWith(prefix));

        for (const tId of candidateTracks) {
          const track = state.entities.tracks[tId];
          if (!track || track.locked) continue;

          const hasCollision = (track.clipIds || []).some((cId) => {
            const c = state.entities.clips[cId];
            if (!c) return false;
            const cStart = c.start || 0;
            const cDur = c.duration || 0.1;
            return !(start + duration <= cStart || start >= cStart + cDur);
          });

          if (!hasCollision) return tId;
        }
        return candidateTracks[0] || `${prefix}1`;
      },

      // =======================================================================
      // 클립 생성 · 조정 레이어 · 이동 · 트림 · 분할 · 삭제
      // =======================================================================
      addClipToTrack: (targetTrackId, clipData) => set((state) => {
        get().recordHistory();

        const clipId = clipData.id || `clip_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newClip = {
          id: clipId,
          trackId: targetTrackId,
          start: clipData.start ?? state.playhead,
          duration: clipData.duration ?? 4,
          speed: 1.0,
          scaling: 'fill',
          scale: 100,
          positionX: 0,
          positionY: 0,
          rotation: 0,
          opacity: 100,
          keyframes: {},
          ...clipData
        };

        state.entities.clips[clipId] = newClip;

        if (!state.entities.tracks[targetTrackId]) {
          state.entities.tracks[targetTrackId] = {
            id: targetTrackId,
            type: clipData.type === 'audio' ? 'audio' : clipData.type === 'text' ? 'text' : 'video',
            label: targetTrackId,
            clipIds: [],
            muted: false,
            locked: false,
            hidden: false
          };
          state.trackList.push(targetTrackId);
        }

        if (!state.entities.tracks[targetTrackId].clipIds) {
          state.entities.tracks[targetTrackId].clipIds = [];
        }
        state.entities.tracks[targetTrackId].clipIds.push(clipId);

        const clipEnd = newClip.start + newClip.duration;
        if (clipEnd > state.projectDuration) {
          state.projectDuration = Math.ceil(clipEnd + 2);
        }
        state.selectedClipId = clipId;
      }),

      addAdjustmentLayer: (start = null, duration = 5) => {
        const state = get();
        const targetStart = start ?? state.playhead;
        const targetTrack = state.getAvailableTrackId('video', targetStart, duration) || 'V4';
        state.addClipToTrack(targetTrack, {
          type: 'adjustment',
          name: '조정 레이어 (색보정/효과)',
          start: targetStart,
          duration,
          filterPreset: 'tealAndOrange',
          color: { lift: 0, gamma: 105, gain: 105, saturation: 115, temperature: 6500, tint: 0 },
          fx: { blur: 0, halation: false, letterbox: false }
        });
      },

      moveClip: (clipId, newStart, newTrackId = null) => set((state) => {
        const clip = state.entities.clips[clipId];
        if (!clip) return;
        if (state.entities.tracks[clip.trackId]?.locked) return;

        get().recordHistory();
        clip.start = Math.max(0, Number(newStart) || 0);

        if (newTrackId && newTrackId !== clip.trackId && state.entities.tracks[newTrackId]) {
          const currentTrack = state.entities.tracks[clip.trackId];
          const targetTrack = state.entities.tracks[newTrackId];
          if (currentTrack && targetTrack && !targetTrack.locked && currentTrack.type === targetTrack.type) {
            currentTrack.clipIds = (currentTrack.clipIds || []).filter((id) => id !== clipId);
            if (!targetTrack.clipIds) targetTrack.clipIds = [];
            targetTrack.clipIds.push(clipId);
            clip.trackId = newTrackId;
          }
        }
        recalcProjectDuration(state);
      }),

      trimClip: (clipId, newDuration) => set((state) => {
        const clip = state.entities.clips[clipId];
        if (!clip || state.entities.tracks[clip.trackId]?.locked) return;

        get().recordHistory();
        clip.duration = Math.max(0.3, Number(newDuration) || 0.3);
        recalcProjectDuration(state);
      }),

      moveAndTrimClip: (clipId, newTrackId, newStart, newDuration) => set((state) => {
        const clip = state.entities.clips[clipId];
        if (!clip || state.entities.tracks[clip.trackId]?.locked) return;

        if (newStart !== undefined && newStart !== null) {
          clip.start = Math.max(0, Number(newStart) || 0);
        }
        if (newDuration !== undefined && newDuration !== null) {
          clip.duration = Math.max(0.3, Number(newDuration) || 0.3);
        }
        if (newTrackId && newTrackId !== clip.trackId && state.entities.tracks[newTrackId]) {
          const curTrack = state.entities.tracks[clip.trackId];
          const dstTrack = state.entities.tracks[newTrackId];
          if (curTrack && dstTrack && !dstTrack.locked && curTrack.type === dstTrack.type) {
            curTrack.clipIds = (curTrack.clipIds || []).filter((id) => id !== clipId);
            dstTrack.clipIds.push(clipId);
            clip.trackId = newTrackId;
          }
        }
        recalcProjectDuration(state);
      }),

      updateClip: (clipId, updates) => set((state) => {
        const clip = state.entities.clips[clipId];
        if (!clip || state.entities.tracks[clip.trackId]?.locked) return;
        Object.assign(clip, updates);
        if (updates.duration !== undefined || updates.start !== undefined) {
          recalcProjectDuration(state);
        }
      }),

      // =======================================================================
      // 애프터 이펙트급 키프레임 엔진 액션
      // =======================================================================
      setKeyframe: (clipId, property, localTime, value, easing = 'easeInOut') => set((state) => {
        const clip = state.entities.clips[clipId];
        if (!clip) return;
        if (!clip.keyframes) clip.keyframes = {};
        if (!clip.keyframes[property]) clip.keyframes[property] = [];

        const t = Math.max(0, Number(localTime.toFixed(2)));
        const existingIdx = clip.keyframes[property].findIndex((k) => Math.abs(k.time - t) < 0.05);

        if (existingIdx !== -1) {
          clip.keyframes[property][existingIdx] = { time: t, value, easing };
        } else {
          clip.keyframes[property].push({ time: t, value, easing });
          clip.keyframes[property].sort((a, b) => a.time - b.time);
        }
      }),

      removeKeyframe: (clipId, property, time) => set((state) => {
        const clip = state.entities.clips[clipId];
        if (!clip?.keyframes?.[property]) return;
        clip.keyframes[property] = clip.keyframes[property].filter((k) => Math.abs(k.time - time) >= 0.05);
      }),

      clearKeyframes: (clipId, property = null) => set((state) => {
        const clip = state.entities.clips[clipId];
        if (!clip?.keyframes) return;
        if (property) delete clip.keyframes[property];
        else clip.keyframes = {};
      }),

      deleteClip: (clipId) => set((state) => {
        if (!clipId || !state.entities.clips[clipId]) return;
        const clip = state.entities.clips[clipId];
        if (state.entities.tracks[clip.trackId]?.locked) return;

        get().recordHistory();
        const trackId = clip.trackId;
        const deletedStart = clip.start || 0;
        const deletedDuration = clip.duration || 0;

        if (state.entities.tracks[trackId]) {
          state.entities.tracks[trackId].clipIds = (state.entities.tracks[trackId].clipIds || []).filter((id) => id !== clipId);
        }
        delete state.entities.clips[clipId];

        if (state.isMagnetic && trackId === 'V1') {
          const v1Clips = (state.entities.tracks['V1']?.clipIds || [])
            .map((id) => state.entities.clips[id])
            .filter(Boolean);
          v1Clips.forEach((c) => {
            if ((c.start || 0) > deletedStart) {
              c.start = Math.max(0, (c.start || 0) - deletedDuration);
            }
          });
        }

        if (state.selectedClipId === clipId) state.selectedClipId = null;
        recalcProjectDuration(state);
      }),

      splitClip: () => set((state) => {
        const curId = state.selectedClipId;
        if (!curId || !state.entities.clips[curId]) return;

        const clip = state.entities.clips[curId];
        if (state.entities.tracks[clip.trackId]?.locked) return;
        const ph = state.playhead;
        if (ph <= clip.start || ph >= clip.start + clip.duration) return;

        get().recordHistory();
        const origDuration = clip.duration;
        const leftDuration = Number((ph - clip.start).toFixed(3));
        const rightDuration = Number((origDuration - leftDuration).toFixed(3));

        clip.duration = leftDuration;

        const newClipId = `clip_${Date.now()}_split`;
        state.entities.clips[newClipId] = {
          ...JSON.parse(JSON.stringify(clip)),
          id: newClipId,
          start: ph,
          duration: rightDuration,
          mediaOffset: (clip.mediaOffset || 0) + leftDuration
        };

        if (!state.entities.tracks[clip.trackId].clipIds) {
          state.entities.tracks[clip.trackId].clipIds = [];
        }
        state.entities.tracks[clip.trackId].clipIds.push(newClipId);
        state.selectedClipId = newClipId;
      })
    };
  })
);
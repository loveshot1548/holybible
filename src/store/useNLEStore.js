// src/store/useNLEStore.js
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const MAX_HISTORY_STEPS = 50;

export const useNLEStore = create(
  immer((set, get) => {
    // 내부 헬퍼: 히스토리 복원용 상태 직렬화 스냅샷 추출
    const captureSnapshot = (state) => ({
      entities: JSON.parse(JSON.stringify(state.entities)),
      trackList: [...state.trackList],
      projectDuration: state.projectDuration,
      selectedClipId: state.selectedClipId
    });

    return {
      // 1. 프로젝트 기본 메타데이터
      projectDuration: 30,
      playhead: 0,
      isPlaying: false,
      isMagnetic: true,
      selectedClipId: null,

      // 2. 실행 취소 / 다시 실행 히스토리 스택
      historyIndex: 0,
      past: [],
      future: [],

      // 3. BeatSyncEngine 연동 옐로우 비트 마커 타임스탬프
      beatMarkers: [],

      // 4. 다빈치 리졸브 규격 트랙 계층 구조 (V 레이어 상단 -> T 자막 -> A 오디오 하단)
      trackList: ['V4', 'V3', 'V2', 'V1', 'T2', 'T1', 'A1', 'A2'],

      entities: {
        tracks: {
          V4: { id: 'V4', type: 'video', label: 'V4', clipIds: [] },
          V3: { id: 'V3', type: 'video', label: 'V3', clipIds: [] },
          V2: { id: 'V2', type: 'video', label: 'V2', clipIds: [] },
          V1: { id: 'V1', type: 'video', label: 'V1', clipIds: [] },
          T2: { id: 'T2', type: 'text', label: 'T2', clipIds: [] },
          T1: { id: 'T1', type: 'text', label: 'T1', clipIds: [] },
          A1: { id: 'A1', type: 'audio', label: 'A1', clipIds: [] },
          A2: { id: 'A2', type: 'audio', label: 'A2', clipIds: [] }
        },
        clips: {}
      },

      mediaPool: [],

      // =======================================================================
      // 🌟 [히스토리 엔진] 상태 변경 전 스냅샷 저장
      // =======================================================================
      recordHistory: () => set((state) => {
        const snap = captureSnapshot(state);
        state.past.push(snap);
        if (state.past.length > MAX_HISTORY_STEPS) {
          state.past.shift();
        }
        state.future = [];
        state.historyIndex = state.past.length;
      }),

      // 실행 취소 (Undo)
      undo: () => set((state) => {
        if (state.past.length === 0) return;

        const currentSnap = captureSnapshot(state);
        state.future.unshift(currentSnap);

        const previousSnap = state.past.pop();
        if (previousSnap) {
          state.entities = previousSnap.entities;
          state.trackList = previousSnap.trackList;
          state.projectDuration = previousSnap.projectDuration;
          state.selectedClipId = previousSnap.selectedClipId;
        }

        state.historyIndex = state.past.length;
      }),

      // 다시 실행 (Redo)
      redo: () => set((state) => {
        if (state.future.length === 0) return;

        const currentSnap = captureSnapshot(state);
        state.past.push(currentSnap);

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
      // 기본 재생 및 탐색 제어
      // =======================================================================
      setPlayhead: (time) => set((state) => { 
        state.playhead = Math.max(0, Number(time) || 0); 
      }),
      
      setIsPlaying: (val) => set((state) => { 
        state.isPlaying = Boolean(val); 
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

      // 미디어 풀 등록
      addMedia: (mediaArray) => set((state) => {
        if (Array.isArray(mediaArray)) {
          state.mediaPool.push(...mediaArray);
        }
      }),

      // 트랙 추가 (+V, +A, +T)
      addTrack: (type) => set((state) => {
        get().recordHistory();

        const prefix = type === 'video' ? 'V' : type === 'audio' ? 'A' : 'T';
        const existing = state.trackList.filter(id => id.startsWith(prefix));
        const nextNum = existing.length + 1;
        const newTrackId = `${prefix}${nextNum}`;

        state.entities.tracks[newTrackId] = {
          id: newTrackId,
          type,
          label: newTrackId,
          clipIds: []
        };

        if (type === 'video') {
          state.trackList.unshift(newTrackId);
        } else {
          state.trackList.push(newTrackId);
        }
      }),

      // 🌟 스마트 가용 트랙 자동 탐색기 (시간 겹침 방지 및 층간 적층)
      getAvailableTrackId: (type, start, duration) => {
        const state = get();
        const prefix = type === 'video' ? 'V' : type === 'audio' ? 'A' : 'T';
        const candidateTracks = state.trackList.filter(id => id.startsWith(prefix));

        for (const tId of candidateTracks) {
          const track = state.entities.tracks[tId];
          if (!track) continue;

          const hasCollision = (track.clipIds || []).some(cId => {
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
      // 클립 생성, 배치, 이동 및 트림
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
          ...clipData
        };

        state.entities.clips[clipId] = newClip;

        if (!state.entities.tracks[targetTrackId]) {
          state.entities.tracks[targetTrackId] = {
            id: targetTrackId,
            type: clipData.type || 'video',
            label: targetTrackId,
            clipIds: []
          };
          state.trackList.push(targetTrackId);
        }

        if (!state.entities.tracks[targetTrackId].clipIds) {
          state.entities.tracks[targetTrackId].clipIds = [];
        }

        state.entities.tracks[targetTrackId].clipIds.push(clipId);

        // 전체 프로젝트 길이 자동 확장
        const clipEnd = newClip.start + newClip.duration;
        if (clipEnd > state.projectDuration) {
          state.projectDuration = Math.ceil(clipEnd + 2);
        }

        state.selectedClipId = clipId;
      }),

      // 🌟 2차원 클립 이동 (X축 타임라인 이동 + Y축 트랙 변경)
      moveClip: (clipId, newStart, newTrackId = null) => set((state) => {
        const clip = state.entities.clips[clipId];
        if (!clip) return;

        get().recordHistory();

        clip.start = Math.max(0, Number(newStart) || 0);

        if (newTrackId && newTrackId !== clip.trackId && state.entities.tracks[newTrackId]) {
          const currentTrack = state.entities.tracks[clip.trackId];
          const targetTrack = state.entities.tracks[newTrackId];

          if (currentTrack && targetTrack && currentTrack.type === targetTrack.type) {
            currentTrack.clipIds = (currentTrack.clipIds || []).filter(id => id !== clipId);
            if (!targetTrack.clipIds) targetTrack.clipIds = [];
            targetTrack.clipIds.push(clipId);
            clip.trackId = newTrackId;
          }
        }

        let maxEnd = 10;
        Object.values(state.entities.clips).forEach(c => {
          const end = (c.start || 0) + (c.duration || 0);
          if (end > maxEnd) maxEnd = end;
        });
        state.projectDuration = Math.max(10, Math.ceil(maxEnd));
      }),

      // 클립 듀레이션 트림
      trimClip: (clipId, newDuration) => set((state) => {
        const clip = state.entities.clips[clipId];
        if (!clip) return;

        get().recordHistory();
        clip.duration = Math.max(0.3, Number(newDuration) || 0.3);

        let maxEnd = 10;
        Object.values(state.entities.clips).forEach(c => {
          const end = (c.start || 0) + (c.duration || 0);
          if (end > maxEnd) maxEnd = end;
        });
        state.projectDuration = Math.max(10, Math.ceil(maxEnd));
      }),

      // 클립 속성 실시간 갱신
      updateClip: (clipId, updates) => set((state) => {
        if (state.entities.clips[clipId]) {
          Object.assign(state.entities.clips[clipId], updates);

          // 길이 변경 시 프로젝트 전체 길이 동기화
          if (updates.duration !== undefined || updates.start !== undefined) {
            let maxEnd = 10;
            Object.values(state.entities.clips).forEach(c => {
              const end = (c.start || 0) + (c.duration || 0);
              if (end > maxEnd) maxEnd = end;
            });
            state.projectDuration = Math.max(10, Math.ceil(maxEnd));
          }
        }
      }),

      // 🌟 클립 삭제 (리플 마그네틱 흡착 안전망 포함)
      deleteClip: (clipId) => set((state) => {
        if (!clipId || !state.entities.clips[clipId]) return;
        get().recordHistory();

        const clip = state.entities.clips[clipId];
        const trackId = clip.trackId;
        const deletedStart = clip.start || 0;
        const deletedDuration = clip.duration || 0;

        // 트랙에서 ID 제거
        if (state.entities.tracks[trackId]) {
          state.entities.tracks[trackId].clipIds = (state.entities.tracks[trackId].clipIds || []).filter(id => id !== clipId);
        }
        delete state.entities.clips[clipId];

        // 자석 모드(isMagnetic) 활성화 시 V1 트랙 뒤쪽 클립들을 앞쪽으로 밀착 (블랙아웃 방지)
        if (state.isMagnetic && trackId === 'V1') {
          const v1Clips = (state.entities.tracks['V1']?.clipIds || [])
            .map(id => state.entities.clips[id])
            .filter(Boolean);

          v1Clips.forEach(c => {
            if ((c.start || 0) > deletedStart) {
              c.start = Math.max(0, (c.start || 0) - deletedDuration);
            }
          });
        }

        if (state.selectedClipId === clipId) {
          state.selectedClipId = null;
        }

        let maxEnd = 10;
        Object.values(state.entities.clips).forEach(c => {
          const end = (c.start || 0) + (c.duration || 0);
          if (end > maxEnd) maxEnd = end;
        });
        state.projectDuration = Math.max(10, Math.ceil(maxEnd));
      }),

      // 🌟 클립 스마트 면도칼 분할 (Razor Split)
      splitClip: () => set((state) => {
        const curId = state.selectedClipId;
        if (!curId || !state.entities.clips[curId]) return;

        const clip = state.entities.clips[curId];
        const ph = state.playhead;

        if (ph <= clip.start || ph >= clip.start + clip.duration) return;

        get().recordHistory();

        const origDuration = clip.duration;
        const leftDuration = Number((ph - clip.start).toFixed(3));
        const rightDuration = Number((origDuration - leftDuration).toFixed(3));

        clip.duration = leftDuration;

        const newClipId = `clip_${Date.now()}_split`;
        state.entities.clips[newClipId] = {
          ...clip,
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
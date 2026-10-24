// src/engine/ProjectSerializer.js
import { useNLEStore } from '../store/useNLEStore';
import { storageEngine } from './StorageEngine';

// 브라우저 영구 IndexedDB 헬퍼 (OPFS 미지원 브라우저용 2차 방어선)
const DB_NAME = 'GTC_STUDIO_STORAGE';
const STORE_NAME = 'media_blobs';

function openMediaDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

async function persistMediaBlob(id, blob) {
  try {
    const db = await openMediaDB();
    if (!db) return false;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(blob, id);
    return new Promise((res) => { tx.oncomplete = () => res(true); tx.onerror = () => res(false); });
  } catch (e) {
    return false;
  }
}

async function getPersistedMediaBlob(id) {
  try {
    const db = await openMediaDB();
    if (!db) return null;
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    return new Promise((res) => { 
      req.onsuccess = () => res(req.result || null);
      req.onerror = () => res(null);
    });
  } catch (e) {
    return null;
  }
}

export const ProjectSerializer = {
  // 🌟 1. 다빈치/프리미어 규격 프로젝트 파일(.gtc) 무손실 내보내기
  exportProject: async () => {
    try {
      const state = useNLEStore.getState();
      const mediaPool = state.mediaPool || [];

      // 1. 미디어 풀 안전 영구 백업 (OPFS 1차, IndexedDB 2차)
      for (const m of mediaPool) {
        if (!m || !m.id) continue;
        try {
          let blobData = null;
          if (m.file instanceof Blob) {
            blobData = m.file;
          } else if (m.url && m.url.startsWith('blob:')) {
            const resp = await fetch(m.url);
            blobData = await resp.blob();
          }

          if (blobData) {
            // OPFS 고속 디스크 저장 시도
            if (storageEngine && storageEngine.isSupported) {
              await storageEngine.saveMedia(blobData, m.id).catch(() => {});
            }
            // IndexedDB 백업 동시 기록
            await persistMediaBlob(m.id, blobData);
          }
        } catch (err) {
          console.warn(`[ProjectSerializer] 미디어 캐시 건너뜀 (${m.name}):`, err);
        }
      }

      // 2. 프로젝트 완전 구조체 패키징 (트랜스폼, 색보정, 더킹, 그리드 설정 보존)
      const projectPackage = {
        format: 'GTC_STUDIO_PROJECT',
        version: '4.0.0',
        savedAt: new Date().toISOString(),
        projectDuration: state.projectDuration || 10,
        trackList: state.trackList || ['V4', 'V3', 'V2', 'V1', 'T2', 'T1', 'A2', 'A1'],
        entities: {
          tracks: state.entities?.tracks || {},
          clips: state.entities?.clips || {},
          media: state.entities?.media || {}
        },
        mediaMeta: mediaPool.map(m => ({
          id: m.id,
          name: m.name || '미디어',
          type: m.type || 'video',
          duration: m.duration || 3.5,
          url: m.url?.startsWith('http') ? m.url : null // 외부 웹 URL인 경우만 보존
        }))
      };

      const jsonString = JSON.stringify(projectPackage, null, 2);
      const fileBlob = new Blob([jsonString], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(fileBlob);

      // 다운로드 파일명 (GTC_PROJECT_YYYYMMDD_HHMM.gtc)
      const a = document.createElement('a');
      a.href = downloadUrl;
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      a.download = `GTC_PROJECT_${dateStr}_${timeStr}.gtc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      // 3. 브라우저 로컬 자동 저장소 갱신 (QuotaExceededError 방어)
      try {
        localStorage.setItem('GTC_AUTOSAVE_BACKUP', jsonString);
      } catch (quotaErr) {
        console.warn('[ProjectSerializer] 프로젝트 크기가 5MB를 초과하여 로컬스토리지 백업을 건너뛰었습니다 (파일 다운로드는 정상 완료됨).');
      }

      alert('💾 프로젝트 파일(.gtc)이 안전하게 저장되었습니다!');
    } catch (err) {
      console.error('[ProjectSerializer] 프로젝트 저장 실패:', err);
      alert('프로젝트 저장 중 오류가 발생했습니다: ' + err.message);
    }
  },

  // 🌟 2. 프로젝트 파일(.gtc) 가져오기 및 완벽 하이드레이션 (Re-hydration)
  importProject: (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const pkg = JSON.parse(e.target.result);
        if (!pkg.entities || !pkg.entities.tracks) {
          throw new Error('유효한 GTC 프로젝트 파일 구조가 아닙니다.');
        }

        const restoredMediaPool = [];
        const mediaUrlMap = new Map();
        let offlineMediaCount = 0;

        // 1. 미디어 리소스 복원 (OPFS ➔ IndexedDB ➔ 외부 URL 순차 탐색)
        for (const meta of (pkg.mediaMeta || [])) {
          let resolvedUrl = meta.url; // 외부 웹 URL 우선 검토

          // 로컬 IndexedDB 바이너리 조회
          if (!resolvedUrl) {
            const cachedBlob = await getPersistedMediaBlob(meta.id);
            if (cachedBlob) {
              resolvedUrl = URL.createObjectURL(cachedBlob);
            }
          }

          // OPFS 캐시 조회 폴백
          if (!resolvedUrl && storageEngine && storageEngine.isSupported) {
            const opfsPool = await storageEngine.restoreMediaPool().catch(() => []);
            const foundInOpfs = opfsPool.find(m => m.id === meta.id);
            if (foundInOpfs?.url) {
              resolvedUrl = foundInOpfs.url;
            }
          }

          if (resolvedUrl) {
            restoredMediaPool.push({ ...meta, url: resolvedUrl });
            mediaUrlMap.set(meta.id, resolvedUrl);
          } else {
            // 다른 컴퓨터에서 열어 바이너리가 없는 경우: 안전한 미싱 미디어 플레이스홀더 주입
            offlineMediaCount++;
            const placeholderUrl = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=80';
            restoredMediaPool.push({ ...meta, url: placeholderUrl, isOffline: true });
            mediaUrlMap.set(meta.id, placeholderUrl);
          }
        }

        // 2. 타임라인 클립 내 URL 재연결 및 누락 트랜스폼 데이터 보정
        const updatedClips = { ...(pkg.entities.clips || {}) };
        Object.keys(updatedClips).forEach((clipId) => {
          const c = updatedClips[clipId];
          if (c.mediaId && mediaUrlMap.has(c.mediaId)) {
            c.url = mediaUrlMap.get(c.mediaId);
          }
          // transform 객체 부재 시 런타임 크래시 방지 보정
          if (!c.transform) {
            c.transform = { x: c.positionX || 0, y: c.positionY || 0, scale: c.scale || 100, rotate: c.rotation || 0 };
          }
        });

        // 3. Zustand 스토어 완전 복원 및 실행 취소(History) 스택 동기화 리셋
        useNLEStore.setState({
          trackList: pkg.trackList || ['V4', 'V3', 'V2', 'V1', 'T2', 'T1', 'A2', 'A1'],
          entities: {
            tracks: pkg.entities.tracks,
            clips: updatedClips,
            media: pkg.entities.media || {}
          },
          mediaPool: restoredMediaPool,
          projectDuration: pkg.projectDuration || 10,
          playhead: 0,
          selectedClipId: null,
          isPlaying: false,
          historyIndex: 0 // 이전 프로젝트 히스토리 초기화로 Ctrl+Z 증발 원천 방지
        });

        if (offlineMediaCount > 0) {
          alert(`✨ 프로젝트를 불러왔습니다.\n(알림: 다른 기기에서 생성되어 로컬 파일이 없는 미디어 ${offlineMediaCount}개는 임시 배경으로 대체되었습니다.)`);
        } else {
          alert('✨ 프로젝트를 성공적으로 불러왔습니다!');
        }
      } catch (err) {
        console.error('[ProjectSerializer] 불러오기 오류:', err);
        alert('프로젝트 복원 실패: ' + err.message);
      }
    };

    reader.readAsText(file);
  }
};
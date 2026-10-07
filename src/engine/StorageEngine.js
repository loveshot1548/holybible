// src/engine/StorageEngine.js
// 🚀 OPFS (Origin Private File System) 기반 초고속 무손실 미디어 엔진

export class StorageEngine {
  constructor() {
    this.root = null;
    this.mediaDir = null;
    this.isSupported = typeof window !== 'undefined' && 'navigator' in window && 'storage' in navigator && 'getDirectory' in navigator.storage;
    this.activeObjectUrls = new Map(); // 메모리 누수 방지용 URL 트래커
  }

  // 1. 엔진 초기화 및 브라우저 영구 보존(Persistent Storage) 락 획득
  async init() {
    if (!this.isSupported) {
      console.warn("[StorageEngine] 브라우저가 OPFS를 지원하지 않아 메모리 폴백 모드로 기동합니다.");
      return false;
    }

    try {
      // 브라우저 캐시 정리 시 파일 임의 삭제 방지 (영구 보존 요청)
      if (navigator.storage.persist) {
        const isPersisted = await navigator.storage.persist();
        if (!isPersisted) {
          console.info("[StorageEngine] 영구 저장소 권한이 기본 승인 모드로 동작합니다.");
        }
      }

      this.root = await navigator.storage.getDirectory();
      this.mediaDir = await this.root.getDirectoryHandle('gtc_media', { create: true });
      return true;
    } catch (e) {
      console.error("[StorageEngine] OPFS 루트 디렉터리 획득 실패:", e);
      return false;
    }
  }

  // 2. 미디어 실제 재생 길이 정밀 비동기 분석기
  async extractMediaDuration(file, type) {
    if (type === 'image') return 3.5; // 사진 기본 노출시간

    return new Promise((resolve) => {
      const tempUrl = URL.createObjectURL(file);
      if (type === 'video') {
        const v = document.createElement('video');
        v.preload = 'metadata';
        v.onloadedmetadata = () => {
          const dur = v.duration;
          URL.revokeObjectURL(tempUrl);
          resolve(Number.isFinite(dur) && dur > 0 ? dur : 5.0);
        };
        v.onerror = () => {
          URL.revokeObjectURL(tempUrl);
          resolve(5.0);
        };
        v.src = tempUrl;
      } else if (type === 'audio') {
        const a = document.createElement('audio');
        a.preload = 'metadata';
        a.onloadedmetadata = () => {
          const dur = a.duration;
          URL.revokeObjectURL(tempUrl);
          resolve(Number.isFinite(dur) && dur > 0 ? dur : 5.0);
        };
        a.onerror = () => {
          URL.revokeObjectURL(tempUrl);
          resolve(5.0);
        };
        a.src = tempUrl;
      } else {
        URL.revokeObjectURL(tempUrl);
        resolve(3.5);
      }
    });
  }

  // 3. 미디어 및 메타데이터 원자적(Atomic) 고속 저장
  async saveMedia(file, mediaId) {
    const isVideo = file.type.startsWith('video');
    const isAudio = file.type.startsWith('audio');
    const type = isVideo ? 'video' : isAudio ? 'audio' : 'image';

    if (!this.root || !this.mediaDir) {
      const fallbackUrl = URL.createObjectURL(file);
      this.activeObjectUrls.set(mediaId, fallbackUrl);
      const measuredDuration = await this.extractMediaDuration(file, type);
      return { url: fallbackUrl, duration: measuredDuration, type };
    }

    try {
      const measuredDuration = await this.extractMediaDuration(file, type);

      // 파일명 분리 (다중 점 파일명 완벽 보존)
      const lastDotIndex = file.name.lastIndexOf('.');
      const ext = lastDotIndex !== -1 ? file.name.substring(lastDotIndex + 1) : (isVideo ? 'mp4' : isAudio ? 'mp3' : 'png');
      const payloadFileName = `${mediaId}.${ext}`;
      const metaFileName = `${mediaId}.meta.json`;

      // [A] 바이너리 데이터 스트리밍 기록
      const fileHandle = await this.mediaDir.getFileHandle(payloadFileName, { create: true });
      const writable = await fileHandle.createWritable({ keepExistingData: false });
      await writable.write(file);
      await writable.close();

      // [B] 원본 파일명 및 실제 측정 길이 메타데이터 JSON 동시 저장
      const metaHandle = await this.mediaDir.getFileHandle(metaFileName, { create: true });
      const metaWritable = await metaHandle.createWritable({ keepExistingData: false });
      const metaContent = JSON.stringify({
        id: mediaId,
        originalName: file.name,
        type,
        duration: measuredDuration,
        size: file.size,
        lastModified: file.lastModified,
        ext
      });
      await metaWritable.write(new Blob([metaContent], { type: 'application/json' }));
      await metaWritable.close();

      // [C] 샌드박스 파일로부터 안정적 Blob URL 발행 및 캐싱 등록
      const savedFile = await fileHandle.getFile();
      const objectUrl = URL.createObjectURL(savedFile);
      this.activeObjectUrls.set(mediaId, objectUrl);

      return {
        url: objectUrl,
        duration: measuredDuration,
        type,
        name: file.name
      };
    } catch (e) {
      console.error("[StorageEngine] 파일 저장 실패, 폴백 전환:", e);
      const fallbackUrl = URL.createObjectURL(file);
      this.activeObjectUrls.set(mediaId, fallbackUrl);
      return { url: fallbackUrl, duration: 5.0, type, name: file.name };
    }
  }

  // 4. 앱 재시작/새로고침 시 원본 미디어 풀 및 메타데이터 100% 무손실 복구
  async restoreMediaPool() {
    if (!this.root || !this.mediaDir) return [];

    const mediaPool = [];
    const metaMap = new Map();
    const fileEntries = [];

    try {
      // 1차 패스: 모든 엔트리를 읽어 메타데이터와 파일로 분리
      for await (const [name, handle] of this.mediaDir.entries()) {
        if (handle.kind === 'file') {
          if (name.endsWith('.meta.json')) {
            const metaFile = await handle.getFile();
            const text = await metaFile.text();
            try {
              const parsed = JSON.parse(text);
              metaMap.set(parsed.id, parsed);
            } catch (_) {}
          } else {
            fileEntries.push({ name, handle });
          }
        }
      }

      // 2차 패스: 메타데이터와 실제 바이너리를 매칭하여 미디어 풀 구축
      for (const { name, handle } of fileEntries) {
        const dotIndex = name.indexOf('.');
        const mediaId = dotIndex !== -1 ? name.substring(0, dotIndex) : name;
        const meta = metaMap.get(mediaId);

        const file = await handle.getFile();
        const objectUrl = URL.createObjectURL(file);
        this.activeObjectUrls.set(mediaId, objectUrl);

        const type = meta?.type || (file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image');
        const duration = meta?.duration || (type === 'image' ? 3.5 : 5.0);
        const originalName = meta?.originalName || name;

        mediaPool.push({
          id: mediaId,
          file,
          url: objectUrl,
          name: originalName,
          type,
          duration
        });
      }

      return mediaPool;
    } catch (e) {
      console.error("[StorageEngine] 미디어 풀 복구 중 예외 발생:", e);
      return [];
    }
  }

  // 5. 단일 미디어 삭제 및 메모리/디스크 즉각 회수
  async deleteMedia(mediaId) {
    if (!mediaId) return;

    // URL 메모리 해제
    if (this.activeObjectUrls.has(mediaId)) {
      URL.revokeObjectURL(this.activeObjectUrls.get(mediaId));
      this.activeObjectUrls.delete(mediaId);
    }

    if (!this.root || !this.mediaDir) return;

    try {
      for await (const name of this.mediaDir.keys()) {
        if (name.startsWith(`${mediaId}.`)) {
          await this.mediaDir.removeEntry(name).catch(() => {});
        }
      }
    } catch (e) {
      console.warn(`[StorageEngine] 파일 삭제 실패 (${mediaId}):`, e);
    }
  }

  // 6. 스토리지 사용량 및 잔여 쿼터 실시간 조회 (대용량 영상 업로드 방어선)
  async getStorageEstimate() {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      const { quota = 0, usage = 0 } = await navigator.storage.estimate();
      return {
        usageMb: Math.round(usage / (1024 * 1024)),
        quotaMb: Math.round(quota / (1024 * 1024)),
        usageRatio: quota > 0 ? (usage / quota) : 0
      };
    }
    return { usageMb: 0, quotaMb: 0, usageRatio: 0 };
  }

  // 7. 전체 캐시 및 메모리 완전 소각
  async clearCache() {
    this.activeObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.activeObjectUrls.clear();

    if (!this.root || !this.mediaDir) return;

    try {
      for await (const name of this.mediaDir.keys()) {
        await this.mediaDir.removeEntry(name).catch(() => {});
      }
    } catch (e) {
      console.error("[StorageEngine] 전체 캐시 정리 실패:", e);
    }
  }
}

export const storageEngine = new StorageEngine();
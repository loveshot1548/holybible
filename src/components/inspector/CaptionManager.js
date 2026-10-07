// src/components/inspector/CaptionManager.js
import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useNLEStore } from '../../store/useNLEStore';
import { checkAndFetchScripture } from '../../engine/AutoScripture';

// ==========================================
// 🎨 정밀 엔터프라이즈 모노크롬 SVG 아이콘 세트
// ==========================================
const SvgSearch = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);
const SvgPlus = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);
const SvgUpload = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);
const SvgTrash = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);
const SvgSplit = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887m0 0l1.536.887M9.384 9.137L5.062 16.62M9.384 9.137l5.232-9.062M14.616 9.137l1.536-.887m0 0l1.536-.887M16.152 8.25l4.322 7.483M16.152 8.25l-5.232-9.062" />
  </svg>
);
const SvgMerge = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l-3.75-3.75M12 19.5l3.75-3.75M4.5 12h15" />
  </svg>
);
const SvgMic = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);
const SvgMagnet = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);
const SvgPlayMini = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const QUICK_SCRIPTURES = [
  { label: '요 3:16', code: '요 3:16', text: '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라' },
  { label: '시 23:1', code: '시 23:1', text: '여호와는 나의 목자시니 내게 부족함이 없으리로다' },
  { label: '빌 4:13', code: '빌 4:13', text: '내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라' },
  { label: '롬 8:28', code: '롬 8:28', text: '우리가 알거니와 하나님을 사랑하는 자 곧 그의 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라' },
  { label: '마 6:33', code: '마 6:33', text: '그런즉 너희는 먼저 그의 나라와 그의 의를 구하라 그리하면 이 모든 것을 너희에게 더하시리라' },
  { label: '사 41:10', code: '사 41:10', text: '두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라' }
];

// 🌟 src 폴더 폰트 패밀리 직결
const STUDIO_FONTS = [
  { id: 'sans-serif', name: '기본 고딕' },
  { id: 'MaruBuri', name: '마루부리 명조' },
  { id: 'KyoboHandwriting', name: '교보손글씨 2025' },
  { id: 'NanumPen', name: '나눔손글씨 펜' },
  { id: 'NanumMyeongjo', name: '나눔명조' },
  { id: 'MYArirangGothic', name: '밀양아리랑 고딕' }
];

export default function CaptionManager() {
  const {
    entities,
    updateClip,
    setPlayhead,
    deleteClip,
    playhead,
    addClipToTrack,
    setIsPlaying
  } = useNLEStore();

  // 트랙 필터 상태: 'ALL' | 'T1' | 'T2'
  const [filterTrack, setFilterTrack] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState(''); // 🌟 자막 실시간 검색 필터

  // 일괄 서식 설정 상태
  const [globalFontSize, setGlobalFontSize] = useState(24);
  const [globalPreset, setGlobalPreset] = useState('sermon_badge');
  const [globalFontFamily, setGlobalFontFamily] = useState('MaruBuri');

  // 단어 찾기 및 바꾸기 모달 토글
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [findWord, setFindWord] = useState('');
  const [replaceWord, setReplaceWord] = useState('');

  // 🌟 인앱 플로팅 토스트 상태
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((msg, duration = 2200) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), duration);
  }, []);

  const triggerHaptic = useCallback((ms = 15) => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (_) {}
    }
  }, []);

  // 음성인식 STT 상태
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  // 멀티트랙 스캔 및 시간순 정렬 (검색어 필터 포함)
  const captionClips = useMemo(() => {
    const allClips = Object.values(entities?.clips || {});
    return allClips
      .filter((clip) => {
        if (!clip) return false;
        const isTextType = clip.type === 'text';
        const isTrackMatch =
          filterTrack === 'ALL'
            ? clip.trackId?.startsWith('T') || isTextType
            : clip.trackId === filterTrack;
        const isSearchMatch = searchKeyword
          ? (clip.content || '').toLowerCase().includes(searchKeyword.toLowerCase())
          : true;
        return isTextType && isTrackMatch && isSearchMatch;
      })
      .sort((a, b) => (a.start || 0) - (b.start || 0));
  }, [entities?.clips, filterTrack, searchKeyword]);

  // 초 단위를 00:00:00 타임코드로 변환
  const formatSecToTC = (sec = 0) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    const f = Math.floor((sec % 1) * 30).toString().padStart(2, '0');
    return `${m}:${s}:${f}`;
  };

  const formatSecToSRT = (sec = 0) => {
    const hrs = Math.floor(sec / 3600).toString().padStart(2, '0');
    const mins = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const secs = Math.floor(sec % 60).toString().padStart(2, '0');
    const ms = Math.floor((sec % 1) * 1000).toString().padStart(3, '0');
    return `${hrs}:${mins}:${secs},${ms}`;
  };

  const formatSecToVTT = (sec = 0) => {
    const hrs = Math.floor(sec / 3600).toString().padStart(2, '0');
    const mins = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const secs = Math.floor(sec % 60).toString().padStart(2, '0');
    const ms = Math.floor((sec % 1) * 1000).toString().padStart(3, '0');
    return `${hrs}:${mins}:${secs}.${ms}`;
  };

  // 1. 전체 자막 서식 일괄 적용 (스크린샷 14번 뱃지 폼 + 폰트 직결)
  const handleApplyGlobalStyle = (size, preset, font) => {
    setGlobalFontSize(Number(size));
    setGlobalPreset(preset);
    setGlobalFontFamily(font);
    triggerHaptic(20);

    captionClips.forEach((clip) => {
      const curStyle = clip.style || {};
      let updatedStyle = { 
        ...curStyle, 
        fontSize: Number(size),
        fontFamily: font
      };

      if (preset === 'sermon_badge') {
        updatedStyle = {
          ...updatedStyle,
          preset: 'sermon-badge',
          badgeText: curStyle.badgeText || '적용질문',
          color: '#FFFFFF',
          strokeWidth: 0,
          backgroundColor: 'transparent'
        };
      } else if (preset === 'reels_bold') {
        updatedStyle = {
          ...updatedStyle,
          preset: 'standard',
          color: '#FFFFFF',
          strokeWidth: 2.5,
          strokeColor: '#000000',
          backgroundColor: 'rgba(0,0,0,0.65)'
        };
      } else if (preset === 'cinematic_minimal') {
        updatedStyle = {
          ...updatedStyle,
          preset: 'standard',
          color: '#F3F4F6',
          strokeWidth: 0,
          backgroundColor: 'transparent'
        };
      } else if (preset === 'viral_yellow') {
        updatedStyle = {
          ...updatedStyle,
          preset: 'standard',
          color: '#FFE600',
          strokeWidth: 2.5,
          strokeColor: '#000000',
          backgroundColor: 'transparent'
        };
      }

      updateClip(clip.id, { style: updatedStyle });
    });

    showToast(`전체 자막에 [${preset}] 서식과 [${font}] 폰트가 적용되었습니다.`);
  };

  // 2. 현재 플레이헤드 위치에 신규 자막 큐 추가
  const handleAddCaptionAtPlayhead = async (defaultText = '새 자막 내용을 입력하세요', badge = '적용질문') => {
    triggerHaptic(15);
    const targetTrack = filterTrack === 'T2' ? 'T2' : 'T1';
    const newId = `caption_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    let finalContent = defaultText;
    try {
      if (typeof checkAndFetchScripture === 'function') {
        finalContent = await checkAndFetchScripture(defaultText);
      }
    } catch (_) {}

    addClipToTrack(targetTrack, {
      id: newId,
      content: finalContent,
      type: 'text',
      start: playhead,
      duration: 3.0,
      trackId: targetTrack,
      style: {
        fontSize: globalFontSize,
        fontFamily: globalFontFamily,
        preset: globalPreset === 'sermon_badge' ? 'sermon-badge' : 'standard',
        badgeText: badge,
        color: '#FFFFFF',
        strokeWidth: globalPreset === 'sermon_badge' ? 0 : 2,
        strokeColor: '#000000',
        backgroundColor: globalPreset === 'sermon_badge' ? 'transparent' : 'rgba(0,0,0,0.6)',
        align: 'center'
      },
      animation: 'popIn'
    });

    showToast('새 자막 큐가 타임라인에 생성되었습니다.');
  };

  // 3. 자막 큐 반으로 분할 (Split Cue)
  const handleSplitCue = (clip) => {
    triggerHaptic(15);
    const text = clip.content || '';
    if (text.length < 2) return showToast('분할할 텍스트 길이가 너무 짧습니다.');

    const midIdx = Math.floor(text.length / 2);
    const firstHalf = text.substring(0, midIdx).trim();
    const secondHalf = text.substring(midIdx).trim();

    const origDur = clip.duration || 3.0;
    const halfDur = Math.max(0.6, origDur / 2);

    updateClip(clip.id, { content: firstHalf, duration: halfDur });

    const newId = `caption_${Date.now()}_split`;
    addClipToTrack(clip.trackId || 'T1', {
      ...clip,
      id: newId,
      content: secondHalf,
      start: (clip.start || 0) + halfDur,
      duration: halfDur
    });
    showToast('자막 큐가 둘로 분할되었습니다.');
  };

  // 4. 다음 자막 큐와 하나로 병합 (Merge Next Cue)
  const handleMergeNextCue = (currentClip, nextClip) => {
    if (!nextClip) return showToast('병합할 다음 자막 큐가 없습니다.');
    triggerHaptic(15);
    const mergedText = `${(currentClip.content || '').trim()} ${(nextClip.content || '').trim()}`;
    const newDuration = ((nextClip.start || 0) + (nextClip.duration || 3.0)) - (currentClip.start || 0);

    updateClip(currentClip.id, {
      content: mergedText,
      duration: Math.max(currentClip.duration || 3.0, newDuration)
    });
    deleteClip(nextClip.id);
    showToast('다음 자막 큐와 병합되었습니다.');
  };

  // 5. 이전 자막 끝점에 딱 붙이기 (Ripple Magnet Snap)
  const handleSnapToPrevCue = (currentClip, prevClip) => {
    if (!prevClip) return;
    triggerHaptic(10);
    const targetStart = (prevClip.start || 0) + (prevClip.duration || 3.0);
    updateClip(currentClip.id, { start: targetStart });
    showToast('이전 자막 끝점으로 자석 스냅되었습니다.');
  };

  // 6. 자막 시간 미세 조정 (-0.2s / +0.2s)
  const handleNudgeTiming = (clipId, deltaStart, deltaDur) => {
    triggerHaptic(10);
    const clip = entities.clips[clipId];
    if (!clip) return;
    const nextStart = Math.max(0, (clip.start || 0) + deltaStart);
    const nextDur = Math.max(0.4, (clip.duration || 3.0) + deltaDur);
    updateClip(clipId, { start: nextStart, duration: nextDur });
  };

  // 🌟 [역제안] 전체 자막 타임코드 일괄 시프트 (Bulk Time Offset)
  const handleBulkTimeShift = (offsetSec) => {
    if (captionClips.length === 0) return showToast('시프트할 자막이 없습니다.');
    triggerHaptic(25);
    captionClips.forEach(clip => {
      const nextStart = Math.max(0, (clip.start || 0) + offsetSec);
      updateClip(clip.id, { start: nextStart });
    });
    showToast(`전체 자막이 ${offsetSec > 0 ? `+${offsetSec}` : offsetSec}초 일괄 이동되었습니다.`);
  };

  // 7. 찾기 및 바꾸기 (Find & Replace)
  const handleExecuteReplace = () => {
    if (!findWord.trim()) return showToast('찾을 단어를 입력하세요.');
    let replacedCount = 0;

    captionClips.forEach((clip) => {
      if (clip.content && clip.content.includes(findWord)) {
        const nextContent = clip.content.replaceAll(findWord, replaceWord);
        updateClip(clip.id, { content: nextContent });
        replacedCount++;
      }
    });

    showToast(`총 ${replacedCount}개의 자막에서 단어를 치환했습니다.`);
    setShowReplaceModal(false);
    setFindWord('');
    setReplaceWord('');
  };

  // 8. 음성-텍스트 변환 (Web Speech API STT)
  const handleToggleSTT = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return showToast('현재 브라우저에서는 음성 인식(STT)을 지원하지 않습니다. Chrome을 권장합니다.');
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      triggerHaptic(20);
      setIsListening(true);
      showToast('음성을 듣고 있습니다. 마이크에 말씀하세요...');
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        handleAddCaptionAtPlayhead(transcript);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  // 9. 표준 SRT 및 VTT 파일 내보내기
  const handleExportSubtitle = (format = 'srt') => {
    if (captionClips.length === 0) return showToast('내보낼 자막이 없습니다.');

    let textData = format === 'vtt' ? 'WEBVTT\n\n' : '';

    captionClips.forEach((clip, index) => {
      const startTC = format === 'vtt' ? formatSecToVTT(clip.start || 0) : formatSecToSRT(clip.start || 0);
      const endTC = format === 'vtt' ? formatSecToVTT((clip.start || 0) + (clip.duration || 3.0)) : formatSecToSRT((clip.start || 0) + (clip.duration || 3.0));

      if (format === 'srt') {
        textData += `${index + 1}\n`;
      }
      textData += `${startTC} --> ${endTC}\n`;
      textData += `${clip.content || ''}\n\n`;
    });

    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reels_captions_${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`.${format.toUpperCase()} 자막 파일이 저장되었습니다.`);
  };

  // 10. 외부 SRT/VTT 파일 파싱 및 임포트
  const handleImportSubtitle = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text !== 'string') return;

      const cleanText = text.replace('WEBVTT', '').trim().replace(/\r\n/g, '\n');
      const blocks = cleanText.split(/\n\s*\n/);
      let count = 0;

      blocks.forEach((block) => {
        const lines = block.split('\n');
        if (lines.length >= 2) {
          const timeLine = lines[1].includes('-->') ? lines[1] : lines[0];
          const textLines = lines.slice(lines[1].includes('-->') ? 2 : 1).join('\n');

          const match = timeLine.match(
            /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
          );
          if (match) {
            const startSec =
              parseInt(match[1]) * 3600 +
              parseInt(match[2]) * 60 +
              parseInt(match[3]) +
              parseInt(match[4]) / 1000;
            const endSec =
              parseInt(match[5]) * 3600 +
              parseInt(match[6]) * 60 +
              parseInt(match[7]) +
              parseInt(match[8]) / 1000;
            const duration = Math.max(0.5, endSec - startSec);

            const newId = `sub_${Date.now()}_${count}`;
            addClipToTrack('T1', {
              id: newId,
              content: textLines.trim(),
              type: 'text',
              start: startSec,
              duration,
              trackId: 'T1',
              style: {
                fontSize: globalFontSize,
                fontFamily: globalFontFamily,
                preset: 'standard',
                color: '#FFFFFF',
                strokeWidth: 2,
                strokeColor: '#000000',
                backgroundColor: 'rgba(0,0,0,0.6)',
                align: 'center'
              },
              animation: 'popIn'
            });
            count++;
          }
        }
      });

      showToast(`성공적으로 ${count}개의 자막을 타임라인으로 가져왔습니다.`);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 11. 특정 큐 1초 재생 미리보기
  const handlePreviewCue = (startSec) => {
    triggerHaptic(10);
    setPlayhead(startSec);
    setIsPlaying(true);
    setTimeout(() => {
      setIsPlaying(false);
    }, 1800);
  };

  return (
    <div 
      className="flex flex-col bg-[#12141C] border border-white/10 rounded-2xl overflow-hidden select-none text-zinc-300 font-sans shadow-xl text-xs relative"
      onClick={(e) => e.stopPropagation()}
    >
      
      {/* 🌟 인앱 플로팅 토스트 */}
      {toastMessage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 px-3 py-1 bg-black/90 text-white font-bold text-[11px] rounded-full border border-[#00E5FF]/40 shadow-xl pointer-events-none animate-fade-in flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          [1] 마스터 헤더: 트랙 필터, 검색창, STT 음성인식
          ========================================================================= */}
      <div className="h-11 border-b border-white/10 bg-[#151822] flex items-center px-3.5 justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
          <span className="text-xs font-black text-white uppercase tracking-wider font-mono">
            CAPTION STUDIO PRO
          </span>

          {/* T1 / T2 트랙 필터 */}
          <div className="flex bg-[#0A0B0E] border border-white/10 rounded-lg p-0.5 ml-1">
            {['ALL', 'T1', 'T2'].map((t) => (
              <button
                key={t}
                onClick={() => { triggerHaptic(10); setFilterTrack(t); }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  filterTrack === t
                    ? 'bg-[#00E5FF] text-black font-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* 음성인식 STT 토글 */}
          <button
            onClick={handleToggleSTT}
            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
              isListening
                ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-md'
                : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'
            }`}
            title="실시간 음성인식으로 자막 큐 생성"
          >
            <SvgMic /> {isListening ? '듣는 중...' : 'STT 인식'}
          </button>

          <span className="text-[10px] font-mono text-[#00E5FF] font-bold bg-[#00E5FF]/10 px-2 py-0.5 rounded-full border border-[#00E5FF]/20">
            {captionClips.length} CUES
          </span>
        </div>
      </div>

      {/* =========================================================================
          [2] 2차 기능 툴바: 생성, 스타일 프리셋, 폰트 셀렉터, SRT/VTT
          ========================================================================= */}
      <div className="p-2.5 bg-[#0D0F15] border-b border-white/5 flex flex-wrap items-center justify-between gap-2">
        
        {/* 생성, 폰트, 프리셋 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleAddCaptionAtPlayhead()}
            className="px-2.5 py-1 rounded-lg bg-[#00E5FF] hover:bg-[#00cce6] text-black font-black text-[11px] flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
            title="현재 재생 위치에 자막 큐 생성"
          >
            <SvgPlus /> 자막 생성
          </button>

          {/* 🌟 폰트 패밀리 선택기 */}
          <select
            value={globalFontFamily}
            onChange={(e) => handleApplyGlobalStyle(globalFontSize, globalPreset, e.target.value)}
            className="bg-[#151822] border border-white/10 text-[#00E5FF] text-[10.5px] font-bold rounded-lg px-2 py-1 outline-none cursor-pointer"
            title="전체 자막 서체(폰트) 일괄 적용"
          >
            {STUDIO_FONTS.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          {/* 스타일 프리셋 (설교 뱃지 폼 포함) */}
          <select
            value={globalPreset}
            onChange={(e) => handleApplyGlobalStyle(globalFontSize, e.target.value, globalFontFamily)}
            className="bg-[#151822] border border-white/10 text-white text-[10.5px] font-bold rounded-lg px-2 py-1 outline-none cursor-pointer"
            title="전체 자막 스타일 프리셋 일괄 적용"
          >
            <option value="sermon_badge">🏷️ 설교 적용질문 뱃지 폼</option>
            <option value="reels_bold">릴스 볼드</option>
            <option value="viral_yellow">바이럴 옐로우</option>
            <option value="cinematic_minimal">시네마틱 미니멀</option>
          </select>

          <select
            value={globalFontSize}
            onChange={(e) => handleApplyGlobalStyle(e.target.value, globalPreset, globalFontFamily)}
            className="bg-[#151822] border border-white/10 text-white text-[10.5px] font-bold rounded-lg px-2 py-1 outline-none cursor-pointer"
            title="전체 자막 폰트 크기 일괄 적용"
          >
            <option value="18">18px</option>
            <option value="22">22px (기본)</option>
            <option value="26">26px</option>
            <option value="32">32px (볼드)</option>
          </select>
        </div>

        {/* 찾기/치환 및 SRT/VTT 파일 입출력 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowReplaceModal(!showReplaceModal)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 cursor-pointer"
            title="단어 찾기 및 일괄 치환"
          >
            <SvgSearch />
          </button>

          <button
            onClick={() => handleExportSubtitle('srt')}
            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-[10px] font-mono font-bold cursor-pointer"
            title="SRT 자막 파일로 내보내기"
          >
            .SRT
          </button>

          <button
            onClick={() => handleExportSubtitle('vtt')}
            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-[10px] font-mono font-bold cursor-pointer"
            title="WebVTT 자막 파일로 내보내기"
          >
            .VTT
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".srt,.vtt"
            onChange={handleImportSubtitle}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 cursor-pointer"
            title="SRT / VTT 자막 파일 가져오기"
          >
            <SvgUpload />
          </button>
        </div>
      </div>

      {/* =========================================================================
          🌟 [역제안] 일괄 타임코드 시프트 (Bulk Time Offset Bar) & 자막 실시간 검색
          ========================================================================= */}
      <div className="px-3 py-1.5 bg-[#090A0E] border-b border-white/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono text-zinc-500 font-bold">전체 싱크 이동:</span>
          <button 
            onClick={() => handleBulkTimeShift(-0.5)} 
            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 font-mono text-[9.5px] cursor-pointer"
          >
            -0.5s
          </button>
          <button 
            onClick={() => handleBulkTimeShift(0.5)} 
            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 font-mono text-[9.5px] cursor-pointer"
          >
            +0.5s
          </button>
          <button 
            onClick={() => handleBulkTimeShift(1.0)} 
            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 font-mono text-[9.5px] cursor-pointer"
          >
            +1.0s
          </button>
        </div>

        {/* 자막 실시간 검색 필터 */}
        <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-lg border border-white/10 max-w-[150px]">
          <SvgSearch />
          <input
            type="text"
            placeholder="자막 내용 검색..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="bg-transparent border-none outline-none text-[10px] text-white w-full placeholder-zinc-600"
          />
          {searchKeyword && (
            <button onClick={() => setSearchKeyword('')} className="text-zinc-500 hover:text-white text-[10px]">✕</button>
          )}
        </div>
      </div>

      {/* =========================================================================
          [3] 원터치 성경 구절 퀵 프리셋 칩
          ========================================================================= */}
      <div className="px-3 py-1.5 bg-[#0A0B0E] border-b border-white/5 flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
        <span className="text-[10px] text-zinc-500 font-mono font-bold shrink-0">QUICK SCRIPTURE:</span>
        {QUICK_SCRIPTURES.map((qs) => (
          <button
            key={qs.label}
            type="button"
            onClick={() => handleAddCaptionAtPlayhead(qs.text, qs.label)}
            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 text-[#00E5FF] text-[10px] font-bold border border-white/10 shrink-0 cursor-pointer transition-colors active:scale-95"
          >
            {qs.label}
          </button>
        ))}
      </div>

      {/* =========================================================================
          [4] 단어 찾기 및 바꾸기 인라인 모달
          ========================================================================= */}
      {showReplaceModal && (
        <div className="p-3 bg-[#151822] border-b border-white/10 flex flex-col gap-2 animate-fade-in">
          <span className="text-[10px] font-mono text-[#00E5FF] font-black uppercase">
            FIND & REPLACE (단어 일괄 치환)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="찾을 단어..."
              value={findWord}
              onChange={(e) => setFindWord(e.target.value)}
              className="bg-[#0A0B0E] border border-white/10 rounded-lg px-2.5 py-1 text-white text-[11px] outline-none focus:border-[#00E5FF]"
            />
            <input
              type="text"
              placeholder="바꿀 단어..."
              value={replaceWord}
              onChange={(e) => setReplaceWord(e.target.value)}
              className="bg-[#0A0B0E] border border-white/10 rounded-lg px-2.5 py-1 text-white text-[11px] outline-none focus:border-[#00E5FF]"
            />
          </div>
          <div className="flex justify-end gap-1.5 pt-1">
            <button
              onClick={() => setShowReplaceModal(false)}
              className="px-2.5 py-1 rounded bg-white/5 text-zinc-400 text-[10px] font-bold cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={handleExecuteReplace}
              className="px-3 py-1 rounded bg-[#00E5FF] text-black font-black text-[10px] cursor-pointer shadow-sm active:scale-95"
            >
              전체 바꾸기
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          [5] 자막 큐 뷰포트 (CPS 가독성 진단, 뱃지 텍스트 튜닝, 퀵 프리뷰 탑재)
          ========================================================================= */}
      {captionClips.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-white/10 rounded-xl m-3 bg-[#0A0B0E]/60 select-none">
          <span className="text-xs text-zinc-300 font-bold block mb-1">
            등록된 자막이 없습니다
          </span>
          <span className="text-[11px] text-zinc-500 block mb-3">
            상단 [자막 생성] 버튼을 누르거나 SRT/VTT 파일을 불러오세요.
          </span>
          <button
            onClick={() => handleAddCaptionAtPlayhead()}
            className="px-4 py-1.5 rounded-full bg-[#00E5FF] hover:bg-[#00cce6] text-black font-black text-xs cursor-pointer shadow-md inline-flex items-center gap-1 active:scale-95"
          >
            <SvgPlus /> 자막 추가하기
          </button>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto p-2.5 space-y-2 hide-scrollbar">
          {captionClips.map((clip, idx) => {
            const startSec = clip.start || 0;
            const durSec = clip.duration || 3.0;
            const endSec = startSec + durSec;
            const isCurrentlyPlaying = playhead >= startSec && playhead <= endSec;

            const nextClip = captionClips[idx + 1] || null;
            const prevClip = captionClips[idx - 1] || null;

            const charCount = (clip.content || '').length;
            const cps = durSec > 0 ? (charCount / durSec).toFixed(1) : 0; // 🌟 초당 글자수 (Characters Per Second)
            const isTooFast = Number(cps) > 12; // 초당 12자 초과 시 가독성 저하 경고
            const isBadgeStyle = clip.style?.preset === 'sermon-badge';

            return (
              <div
                key={clip.id}
                className={`flex flex-col gap-2 p-3 rounded-xl border transition-all ${
                  isCurrentlyPlaying
                    ? 'bg-[#14232C] border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                    : 'bg-[#0E1017] border-white/5 hover:border-white/15'
                }`}
              >
                {/* 상단 큐 메타 라인 */}
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-black text-zinc-400">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/5 text-[#00E5FF] border border-white/10">
                      {clip.trackId || 'T1'}
                    </span>
                    
                    {/* 🌟 1초 퀵 재생 미리보기 버튼 */}
                    <button
                      onClick={() => handlePreviewCue(startSec)}
                      className="p-1 rounded bg-[#00E5FF]/20 text-[#00E5FF] hover:bg-[#00E5FF]/30 cursor-pointer active:scale-90"
                      title="해당 자막 구간 1초 재생"
                    >
                      <SvgPlayMini />
                    </button>

                    {isCurrentlyPlaying && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-ping" />
                    )}

                    {/* 🌟 가독성 위험 진단 뱃지 */}
                    {isTooFast && (
                      <span className="text-[8.5px] font-mono text-rose-300 bg-rose-950/70 border border-rose-800 px-1 rounded font-bold" title="재생 시간 대비 글자 수가 너무 많습니다">
                        속도 빠름 ({cps}자/s)
                      </span>
                    )}
                  </div>

                  {/* 타임코드 네비게이터 & 점프 */}
                  <div
                    onClick={() => { triggerHaptic(10); setPlayhead(startSec); }}
                    className="flex items-center gap-1.5 cursor-pointer group"
                    title="클릭 시 해당 시간으로 플레이헤드 이동"
                  >
                    <span className="font-mono text-[11px] font-bold text-white group-hover:text-[#00E5FF] transition-colors">
                      {formatSecToTC(startSec)}
                    </span>
                    <span className="text-zinc-600 font-mono">~</span>
                    <span className="font-mono text-[10px] text-zinc-400">
                      {formatSecToTC(endSec)}
                    </span>
                    <span className="font-mono text-[9.5px] text-[#00E5FF] font-bold ml-1">
                      ({durSec.toFixed(1)}s)
                    </span>
                  </div>

                  {/* 큐 컨트롤 버튼 (스냅, 병합, 분할, 삭제) */}
                  <div className="flex items-center gap-1">
                    {prevClip && (
                      <button
                        onClick={() => handleSnapToPrevCue(clip, prevClip)}
                        className="p-1 rounded bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white cursor-pointer active:scale-90"
                        title="이전 자막 끝점에 흡착 (Snap)"
                      >
                        <SvgMagnet />
                      </button>
                    )}
                    {nextClip && (
                      <button
                        onClick={() => handleMergeNextCue(clip, nextClip)}
                        className="p-1 rounded bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white cursor-pointer active:scale-90"
                        title="다음 자막과 병합 (Merge)"
                      >
                        <SvgMerge />
                      </button>
                    )}
                    <button
                      onClick={() => handleSplitCue(clip)}
                      className="p-1 rounded bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white cursor-pointer active:scale-90"
                      title="텍스트 절반 분할"
                    >
                      <SvgSplit />
                    </button>
                    <button
                      onClick={() => { triggerHaptic(20); deleteClip(clip.id); }}
                      className="p-1 rounded bg-rose-950/40 hover:bg-rose-900 border border-rose-800 text-rose-300 cursor-pointer active:scale-90"
                      title="자막 큐 삭제"
                    >
                      <SvgTrash />
                    </button>
                  </div>
                </div>

                {/* 🌟 설교 적용질문 뱃지 텍스트 튜닝창 (뱃지 스타일 폼 활성 시 노출) */}
                {isBadgeStyle && (
                  <div className="flex items-center gap-1.5 bg-[#070D18] px-2 py-1 rounded-lg border border-sky-500/30">
                    <span className="text-[9.5px] font-bold text-sky-400 shrink-0">상단 뱃지:</span>
                    <input
                      type="text"
                      value={clip.style?.badgeText || '적용질문'}
                      onChange={(e) => updateClip(clip.id, { style: { ...(clip.style || {}), badgeText: e.target.value } })}
                      className="bg-transparent border-none outline-none text-[10.5px] text-white font-bold w-full"
                      placeholder="적용질문"
                    />
                  </div>
                )}

                {/* 중앙 자막 본문 편집 텍스트에어리어 */}
                <div className="relative">
                  <textarea
                    value={clip.content || ''}
                    onChange={(e) => updateClip(clip.id, { content: e.target.value })}
                    className="w-full bg-[#07080B] border border-white/5 focus:border-[#00E5FF] rounded-lg p-2 text-xs text-white font-bold outline-none resize-none leading-relaxed transition-colors pb-5"
                    style={{ fontFamily: clip.style?.fontFamily || globalFontFamily }}
                    rows={2}
                    placeholder="자막 내용을 입력하세요..."
                  />
                  <div className="absolute bottom-1.5 right-2 flex items-center gap-1 text-[9px] font-mono text-zinc-500 font-bold">
                    <span>{charCount}자</span>
                    <span>•</span>
                    <span className={isTooFast ? 'text-rose-400' : 'text-zinc-400'}>{cps}자/s</span>
                  </div>
                </div>

                {/* 하단 미세 타임라인 넛지 툴바 (-0.2s / +0.2s) */}
                <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[9px] text-zinc-500">시작:</span>
                    <button
                      onClick={() => handleNudgeTiming(clip.id, -0.2, 0)}
                      className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 font-mono font-bold cursor-pointer active:scale-90"
                    >
                      -0.2s
                    </button>
                    <button
                      onClick={() => handleNudgeTiming(clip.id, 0.2, 0)}
                      className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 font-mono font-bold cursor-pointer active:scale-90"
                    >
                      +0.2s
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[9px] text-zinc-500">길이:</span>
                    <button
                      onClick={() => handleNudgeTiming(clip.id, 0, -0.2)}
                      className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 font-mono font-bold cursor-pointer active:scale-90"
                    >
                      -0.2s
                    </button>
                    <button
                      onClick={() => handleNudgeTiming(clip.id, 0, 0.2)}
                      className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 font-mono font-bold cursor-pointer active:scale-90"
                    >
                      +0.2s
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
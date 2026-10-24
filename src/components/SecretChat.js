import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import CryptoJS from 'crypto-js';

const CHAT_SECRET_KEY = process.env.REACT_APP_CHAT_SECRET || 'tree-secret-key-2026';

// AES-256 종단간 암호화 / 복호화
const encryptText = (text) => {
  if (!text) return '';
  try {
    return CryptoJS.AES.encrypt(text, CHAT_SECRET_KEY).toString();
  } catch (e) {
    return text;
  }
};

const decryptText = (cipherText) => {
  if (!cipherText) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, CHAT_SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText || cipherText;
  } catch (e) {
    return cipherText;
  }
};

const decodePayload = (content) => {
  const decrypted = decryptText(content);
  try {
    const parsed = JSON.parse(decrypted);
    if (parsed && typeof parsed === 'object' && parsed.text !== undefined) {
      return parsed;
    }
  } catch (e) {}
  return { text: decrypted, isWhisper: false, burnSec: 0 };
};

const triggerHaptic = (pattern) => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(pattern); } catch (e) {}
  }
};

// 고스트 위장 텍스트
const GHOST_SCRIPTURE = "여호와는 나의 목자시니 내게 부족함이 없으리로다 그가 나를 푸른 풀밭에 누이시며 쉴 만한 물 가로 인도하시는도다 내 영혼을 소생시키시고 자기 이름을 위하여 의의 길로 인도하시는도다";

// --- [위장 뷰] 패닉 락 (맥체인 성경 통독표) ---
function CamouflageBibleView({ onUnlock }) {
  const [clickCount, setClickCount] = useState(0);

  const handleTitleClick = () => {
    if (clickCount + 1 >= 3) {
      triggerHaptic([30, 50, 30]);
      onUnlock();
    } else {
      setClickCount(prev => prev + 1);
      setTimeout(() => setClickCount(0), 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] bg-[#f8fafc] text-slate-800 flex flex-col font-sans select-none overflow-y-auto">
      <header className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2 cursor-pointer" onClick={handleTitleClick}>
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
          <h2 className="text-[14px] font-black tracking-tight text-slate-900">
            2026 맥체인 성경 통독 묵상표
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400">사역 관리 본부</span>
      </header>
      <main className="p-4 space-y-3 flex-1 max-w-lg mx-auto w-full text-[12px]">
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg space-y-2 shadow-2xs">
          <span className="text-[10.5px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">오늘의 통독 본문</span>
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="font-bold">창세기 26장</span>
              <span className="text-slate-400 text-[11px]">이삭의 그랄 언약과 우물</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="font-bold">마태복음 25장</span>
              <span className="text-slate-400 text-[11px]">열 처녀 비유와 달란트</span>
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-400 pt-6">
          * 상단 타이틀을 빠르게 세 번 탭하면 복귀합니다.
        </p>
      </main>
    </div>
  );
}

// --- [도파민 클라이맥스 네온 폭죽 팝업 오버레이] ---
function DopamineNeonPopup({ data, onClose }) {
  useEffect(() => {
    triggerHaptic([80, 40, 120, 40, 250, 60, 400]);
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[350] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer overflow-hidden animate-fade-in select-none"
    >
      <div className="absolute w-[320px] h-[320px] rounded-full bg-rose-600/25 blur-3xl animate-ping pointer-events-none" />
      <div className="absolute w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-rose-900/40 via-fuchsia-900/30 to-amber-600/20 blur-2xl animate-pulse pointer-events-none" />

      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {[...Array(16)].map((_, i) => (
          <div 
            key={i} 
            className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-rose-400 to-amber-300 shadow-[0_0_12px_#ff0055]"
            style={{
              transform: `rotate(${i * 22.5}deg) translateY(-140px)`,
              opacity: 0.85,
              animation: 'bounce 1.5s infinite alternate'
            }}
          />
        ))}
      </div>

      <div 
        onClick={e => e.stopPropagation()} 
        className="relative z-10 w-full max-w-sm bg-black/95 border-2 border-rose-500 rounded-2xl p-6 text-center space-y-4 shadow-[0_0_50px_rgba(244,63,94,0.6)] transform scale-100 animate-in zoom-in-95 duration-300"
      >
        <div className="inline-block px-3 py-1 rounded-full bg-rose-950 border border-rose-500/60 text-rose-300 font-mono text-[11px] tracking-widest uppercase shadow-[0_0_15px_#f43f5e] animate-pulse">
          ⚡ CLIMAX DOPAMINE RUSH ⚡
        </div>

        <h2 className="text-[23px] sm:text-[25px] font-black text-white tracking-tight drop-shadow-[0_0_20px_#ff0055] leading-tight">
          {data.title || "너한테 완전히 미쳐버릴 것 같아"}
        </h2>

        <p className="text-[13.5px] text-rose-200/90 leading-relaxed font-medium drop-shadow-sm whitespace-pre-wrap">
          {data.subtitle || "지금 온몸의 감각이 전부 너를 원하고 있어.\n숨소리 하나까지 전부 내 걸로 만들고 싶어."}
        </p>

        <div className="pt-2">
          <button 
            onClick={onClose}
            className="w-full py-2.5 bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 text-white font-bold rounded-xl text-[13px] shadow-[0_0_20px_rgba(225,29,72,0.8)] active:scale-95 transition-all cursor-pointer"
          >
            본능에 집중하기 (닫기)
          </button>
        </div>
      </div>
    </div>
  );
}

// --- [양방향 돌발 미션 카드 모달 (둘이 함께 푸는 게임)] ---
function InteractiveMissionCardModal({ card, currentUserName, onSubmitAnswer, onClose }) {
  const [textInput, setTextInput] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef(null);

  const isMeSindong = currentUserName === '정신동';
  const myDone = isMeSindong ? card.sindongDone : card.hanaDone;
  const peerDone = isMeSindong ? card.hanaDone : card.sindongDone;
  const peerName = isMeSindong ? '하나' : '신동';

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (card.requireType === 'text' && !textInput.trim()) {
      return alert('답변을 입력해주세요!');
    }
    if (card.requireType === 'photo' && !photoFile && !photoPreview) {
      return alert('인증 사진을 첨부해주세요!');
    }

    setIsSubmitting(true);
    let finalAnswer = textInput.trim();

    if (card.requireType === 'photo' && photoFile) {
      try {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `mission_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`;
        const { error: upErr } = await supabase.storage.from('chat_attachments').upload(fileName, photoFile);
        if (!upErr) {
          const { data: pUrl } = supabase.storage.from('chat_attachments').getPublicUrl(fileName);
          finalAnswer = pUrl.publicUrl;
        }
      } catch (e) {}
    }

    await onSubmitAnswer(finalAnswer);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[360] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-sm bg-[#111116] border-2 border-amber-500/80 rounded-2xl p-5 text-center space-y-4 shadow-[0_0_40px_rgba(245,158,11,0.4)]">
        
        {/* 상단 뱃지 & 닫기 */}
        <div className="flex justify-between items-center border-b border-white/10 pb-2">
          <span className="text-[10.5px] font-mono font-black text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2.5 py-0.5 rounded-full animate-pulse">
            🎲 둘만의 즉흥 돌발 미션 🎲
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer">✕</button>
        </div>

        {/* 미션 타이틀 & 설명 */}
        <div className="space-y-1.5">
          <h3 className="text-[18px] font-black text-white drop-shadow-[0_0_10px_#f59e0b] leading-tight">
            {card.title}
          </h3>
          <p className="text-[12.5px] text-amber-100/90 leading-relaxed font-medium">
            {card.description}
          </p>
        </div>

        {/* 양방향 달성 상태 인디케이터 */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-black/40 border border-white/10 text-[11px] font-mono">
          <div className={`p-1.5 rounded-lg border ${card.sindongDone ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold' : 'bg-white/5 border-white/10 text-slate-400'}`}>
            <span>정신동: {card.sindongDone ? "완료 ✓" : "대기 중..."}</span>
          </div>
          <div className={`p-1.5 rounded-lg border ${card.hanaDone ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold' : 'bg-white/5 border-white/10 text-slate-400'}`}>
            <span>모하나: {card.hanaDone ? "완료 ✓" : "대기 중..."}</span>
          </div>
        </div>

        {/* 제출 폼 */}
        {!myDone ? (
          <div className="space-y-3 pt-1">
            {card.requireType === 'text' ? (
              <textarea
                rows={3}
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="미션에 대한 당신의 솔직한 고백을 적어주세요..."
                className="w-full p-2.5 rounded-xl bg-[#1c1c24] border border-white/20 text-[13px] text-white outline-none resize-none focus:border-amber-400"
              />
            ) : (
              <div className="space-y-2">
                <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-3 border-2 border-dashed border-amber-500/60 rounded-xl bg-white/5 text-[12px] font-bold text-amber-200 hover:bg-white/10 cursor-pointer"
                >
                  {photoPreview ? "📷 인증 사진 변경하기" : "📷 인증 사진 촬영 / 첨부하기"}
                </button>
                {photoPreview && (
                  <img src={photoPreview} alt="미션 인증" className="w-full h-32 object-cover rounded-xl border border-white/20" />
                )}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-2.5 bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 text-white font-bold rounded-xl text-[13px] shadow-[0_0_20px_rgba(245,158,11,0.6)] cursor-pointer active:scale-95 transition-all"
            >
              {isSubmitting ? "인증 업로드 중..." : "미션 클리어 제출하기"}
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 text-[12px] font-bold space-y-1 animate-pulse">
            <div>나의 미션 제출 완료! ✓</div>
            <div className="text-[10.5px] text-slate-400 font-normal">
              {peerDone ? "두 사람 모두 완료하여 사랑 게이지가 상승했습니다!" : `${peerName}의 응답을 기다리고 있습니다...`}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// --- [신동 전용 통합 마스터 커스텀 스튜디오] ---
function MasterSecretConfigModal({
  currentConfig,
  sindongMissions,
  hanaMissions,
  wordDict,
  missionCards,
  onSave,
  onTriggerMissionCard,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('missions'); // 'missions' | 'words' | 'cards' | 'keywords'

  // 1. 키워드 설정
  const [keywords, setKeywords] = useState(currentConfig.keywords.join(', '));
  const [title, setTitle] = useState(currentConfig.title);
  const [subtitle, setSubtitle] = useState(currentConfig.subtitle);

  // 2. 주사위 미션
  const [sMissionsText, setSMissionsText] = useState(sindongMissions.join('\n'));
  const [hMissionsText, setHMissionsText] = useState(hanaMissions.join('\n'));

  // 3. LV.3 은밀한 단어사전
  const [wordsText, setWordsText] = useState(wordDict.join(', '));

  // 4. 돌발 미션 카드 추가용
  const [cardTitle, setCardTitle] = useState('');
  const [cardDesc, setCardDesc] = useState('');
  const [cardType, setCardType] = useState('text');

  const handleSaveAll = () => {
    const kwArr = keywords.split(',').map(s => s.trim()).filter(Boolean);
    const sArr = sMissionsText.split('\n').map(s => s.trim()).filter(Boolean);
    const hArr = hMissionsText.split('\n').map(s => s.trim()).filter(Boolean);
    const wArr = wordsText.split(',').map(s => s.trim()).filter(Boolean);

    onSave({
      config: {
        keywords: kwArr.length ? kwArr : currentConfig.keywords,
        title: title.trim() || currentConfig.title,
        subtitle: subtitle.trim() || currentConfig.subtitle
      },
      sindongMissions: sArr.length ? sArr : sindongMissions,
      hanaMissions: hArr.length ? hArr : hanaMissions,
      wordDict: wArr,
      newCard: cardTitle ? { id: Date.now(), title: cardTitle, description: cardDesc, requireType: cardType } : null
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[400] bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 select-none">
      <div className="w-full max-w-lg bg-[#121217] border border-amber-500/50 rounded-2xl p-5 shadow-2xl text-slate-100 font-sans space-y-4 max-h-[90vh] flex flex-col">
        
        {/* 헤더 */}
        <div className="flex justify-between items-center border-b border-white/10 pb-2.5 shrink-0">
          <div>
            <h3 className="text-[15px] font-black text-amber-300">신동 전용 시크릿 스튜디오 (Master)</h3>
            <p className="text-[10px] text-slate-400">하나 폰에는 노출되지 않는 신동님만의 전용 통제실입니다.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-base cursor-pointer">✕</button>
        </div>

        {/* 서브 탭 */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl text-[11px] font-bold shrink-0">
          <button 
            onClick={() => setActiveTab('missions')} 
            className={`flex-1 py-1.5 rounded-lg cursor-pointer ${activeTab === 'missions' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            🎲 개별 미션
          </button>
          <button 
            onClick={() => setActiveTab('words')} 
            className={`flex-1 py-1.5 rounded-lg cursor-pointer ${activeTab === 'words' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            📖 단어사전
          </button>
          <button 
            onClick={() => setActiveTab('cards')} 
            className={`flex-1 py-1.5 rounded-lg cursor-pointer ${activeTab === 'cards' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            🃏 미션카드 게임
          </button>
          <button 
            onClick={() => setActiveTab('keywords')} 
            className={`flex-1 py-1.5 rounded-lg cursor-pointer ${activeTab === 'keywords' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            ⚡ 도파민 팝업
          </button>
        </div>

        {/* 탭 본문 (스크롤) */}
        <div className="flex-1 overflow-y-auto space-y-3 text-[11.5px] pr-1 hide-scrollbar">
          
          {/* TAB 1: 개별 미션 주사위 */}
          {activeTab === 'missions' && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-rose-300 mb-1">
                  1. 신동 $\rightarrow$ 하나에게 시키는 미션 (줄바꿈 구분)
                </label>
                <textarea
                  rows={4}
                  value={sMissionsText}
                  onChange={e => setSMissionsText(e.target.value)}
                  className="w-full bg-[#1c1c24] border border-white/15 p-2.5 rounded-lg text-white outline-none resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-purple-300 mb-1">
                  2. 하나 $\rightarrow$ 신동에게 시키는 미션 (줄바꿈 구분)
                </label>
                <textarea
                  rows={4}
                  value={hMissionsText}
                  onChange={e => setHMissionsText(e.target.value)}
                  className="w-full bg-[#1c1c24] border border-white/15 p-2.5 rounded-lg text-white outline-none resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 2: LV.3 단어사전 & 오토채팅 드롭 */}
          {activeTab === 'words' && (
            <div className="space-y-2">
              <label className="block font-bold text-amber-300">
                LV.3 클라이맥스 전용 단어사전 (쉼표로 구분)
              </label>
              <p className="text-[10px] text-slate-400 leading-normal">
                현재 빈칸으로 시작하거나 자유롭게 등록하세요. 대화가 LV.3에 도달하면 이 단어들이 둘의 대화 도중 몽환적인 오토 채팅으로 불특정하게 화면에 드롭됩니다.
              </p>
              <textarea
                rows={5}
                value={wordsText}
                onChange={e => setWordsText(e.target.value)}
                placeholder="예: 입맞춤, 살결, 침대, 떨림, 숨결, 너의향기, 뜨거워, 녹아내려"
                className="w-full bg-[#1c1c24] border border-white/15 p-2.5 rounded-lg text-amber-200 outline-none resize-none leading-relaxed"
              />
            </div>
          )}

          {/* TAB 3: 미션카드 게임 & 발동 */}
          {activeTab === 'cards' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2">
                <span className="font-bold text-amber-300 block">새로운 즉흥 미션카드 생성</span>
                <input
                  type="text"
                  placeholder="미션 제목 (예: 지금 침대 위에서 보내는 은밀한 인증)"
                  value={cardTitle}
                  onChange={e => setCardTitle(e.target.value)}
                  className="w-full bg-[#1c1c24] border border-white/15 p-2 rounded-lg text-white outline-none"
                />
                <textarea
                  rows={2}
                  placeholder="미션 설명 (예: 지금 입고 있는 잠옷이나 이불 속 다리 사진 찍어 보내기)"
                  value={cardDesc}
                  onChange={e => setCardDesc(e.target.value)}
                  className="w-full bg-[#1c1c24] border border-white/15 p-2 rounded-lg text-white outline-none resize-none"
                />
                <div className="flex gap-2 items-center">
                  <span className="text-slate-400 text-[10.5px]">클리어 조건:</span>
                  <select 
                    value={cardType} 
                    onChange={e => setCardType(e.target.value)}
                    className="bg-[#1c1c24] border border-white/20 px-2 py-1 rounded text-white font-bold"
                  >
                    <option value="text">텍스트 답변 제출</option>
                    <option value="photo">사진 인증 업로드</option>
                  </select>
                </div>
              </div>

              {/* 현재 등록된 카드 목록 및 즉시 발동 버튼 */}
              <div className="space-y-1.5 pt-1">
                <span className="font-bold text-slate-300 block">등록된 미션 카드 (탭하면 즉시 발동)</span>
                {missionCards.map((c, i) => (
                  <div key={c.id || i} className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-amber-200 block">{c.title}</span>
                      <span className="text-[9.5px] text-slate-400">{c.requireType === 'photo' ? '📷 사진인증' : '✍️ 텍스트답변'}</span>
                    </div>
                    <button
                      onClick={() => onTriggerMissionCard(c)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-[10.5px] cursor-pointer shadow"
                    >
                      지금 발동 ⚡
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: 도파민 팝업 키워드 */}
          {activeTab === 'keywords' && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-rose-300 mb-1">트리거 키워드 (쉼표 구분)</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  className="w-full bg-[#1c1c24] border border-white/15 px-3 py-2 rounded-lg text-rose-100 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-rose-300 mb-1">팝업 메인 타이틀</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-[#1c1c24] border border-white/15 px-3 py-2 rounded-lg text-white font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-rose-300 mb-1">팝업 상세 메시지</label>
                <textarea
                  rows={3}
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  className="w-full bg-[#1c1c24] border border-white/15 px-3 py-2 rounded-lg text-slate-200 outline-none resize-none font-normal"
                />
              </div>
            </div>
          )}

        </div>

        {/* 푸터 저장 버튼 */}
        <div className="flex justify-end gap-2 pt-2 border-t border-white/10 shrink-0">
          <button onClick={onClose} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg font-bold cursor-pointer">
            닫기
          </button>
          <button onClick={handleSaveAll} className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-rose-600 text-white font-bold rounded-lg shadow-md cursor-pointer">
            설정 저장 적용
          </button>
        </div>

      </div>
    </div>
  );
}

// --- [메인 시크릿챗 룸] ---
export default function SecretChat({ currentUser, setActiveScreen }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isPeerOnline, setIsPeerOnline] = useState(false);
  
  // 텐션 레벨
  const [intimacyLevel, setIntimacyLevel] = useState(1);

  // 사랑의 게이지 (Love Gauge: 0 ~ 100)
  const [loveGauge, setLoveGauge] = useState(() => {
    try {
      const saved = localStorage.getItem('secret_love_gauge');
      return saved ? Number(saved) : 69;
    } catch { return 69; }
  });

  // 속삭임 및 자폭 타이머
  const [isWhisperMode, setIsWhisperMode] = useState(false);
  const [activeRevealId, setActiveRevealId] = useState(null);
  const [burnTimers, setBurnTimers] = useState({});

  // 살결 터치 동기화
  const [peerTouch, setPeerTouch] = useState(null);
  const [isHeartbeating, setIsHeartbeating] = useState(false);

  // 패닉 락
  const [isPanicLocked, setIsPanicLocked] = useState(false);

  // 부재중 베일
  const [veiledMessageIds, setVeiledMessageIds] = useState(new Set());
  const [hasVeilBanner, setHasVeilBanner] = useState(false);

  // 손잡기 & 숨결 & 고스트
  const [isHoldingHand, setIsHoldingHand] = useState(false);
  const [isPeerHoldingHand, setIsPeerHoldingHand] = useState(false);
  const [bodyTemp, setBodyTemp] = useState(36.5);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [isGhostTyping, setIsGhostTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // 도파민 팝업
  const [activeDopaminePopup, setActiveDopaminePopup] = useState(null);
  const [showMasterConfig, setShowMasterConfig] = useState(false);

  // 🌟 [신규] 돌발 미션 카드 상태
  const [activeMissionCard, setActiveMissionCard] = useState(null);

  // 1. 도파민 팝업 설정
  const [triggerConfig, setTriggerConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('secret_dopamine_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      keywords: ['안아줘', '만져줘', '미치겠어', '침대', '보고싶어', '벗겨줘', '클라이맥스'],
      title: "너한테 완전히 미쳐버릴 것 같아",
      subtitle: "지금 온몸의 감각이 전부 너를 원하고 있어.\n숨소리 하나까지 전부 내 걸로 만들고 싶어."
    };
  });

  // 2. 신동 $\rightarrow$ 하나 개별 미션 풀
  const [sindongMissions, setSindongMissions] = useState(() => {
    try {
      const s = localStorage.getItem('secret_sindong_missions');
      if (s) return JSON.parse(s);
    } catch (e) {}
    return [
      "지금 입고 있는 옷 살짝만 젖혀서 셀카 하나 보내줘",
      "오늘 밤 나랑 둘만 있을 때 가장 하고 싶은 거 비밀 속삭임으로 말해봐",
      "내 볼에 뽀뽀 3번 해준다고 약속해줘",
      "지금 당장 침대에 누워서 내 생각 10초간 하기",
      "숨소리 녹음해서 5초만 보내줄 수 있어?"
    ];
  });

  // 3. 하나 $\rightarrow$ 신동 개별 미션 풀
  const [hanaMissions, setHanaMissions] = useState(() => {
    try {
      const s = localStorage.getItem('secret_hana_missions');
      if (s) return JSON.parse(s);
    } catch (e) {}
    return [
      "신동 오빠, 지금 당장 안아주고 싶다고 3번 속삭여줘",
      "오빠 하트 심박동 버튼 5초 동안 꾹 눌러서 전송해봐",
      "오늘 내가 제일 사랑스러웠던 순간 하나만 비밀 글로 보내",
      "오빠 지금 내 생각하면서 심장 얼마나 뛰는지 말해줘",
      "나만을 위한 뜨거운 고백 한마디 남겨주기"
    ];
  });

  // 4. LV.3 은밀한 단어사전 (초기엔 빈 배열 또는 자유 입력 가능)
  const [wordDict, setWordDict] = useState(() => {
    try {
      const s = localStorage.getItem('secret_word_dict');
      if (s) return JSON.parse(s);
    } catch (e) {}
    return ['입맞춤', '살결', '떨림', '숨결', '너의향기', '뜨거워', '녹아내려', '침대'];
  });

  // 5. 돌발 미션 카드 풀
  const [missionCards, setMissionCards] = useState(() => {
    try {
      const s = localStorage.getItem('secret_mission_cards');
      if (s) return JSON.parse(s);
    } catch (e) {}
    return [
      {
        id: 1,
        title: "🔥 둘만의 침대 위 10초 아이컨택 미션",
        description: "각자 편안한 곳에 누워 서로의 눈빛을 상상하며 지금 가장 원하는 것을 솔직하게 적어 제출하세요.",
        requireType: 'text'
      },
      {
        id: 2,
        title: "📷 살결 온도 100% 인증 미션",
        description: "지금 손이나 발, 또는 가장 편안한 침대 위 모습을 사진으로 찍어 서로에게 인증하세요.",
        requireType: 'photo'
      }
    ];
  });

  const recentMsgTimesRef = useRef([]);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const broadcastChannelRef = useRef(null);

  const isMoHana = currentUser?.name === '모하나';
  const isJungSinDong = currentUser?.name === '정신동';
  const currentUserName = currentUser?.name || currentUser || '';
  const targetPeerName = isMoHana ? '정신동' : '모하나';

  const scrollToBottom = useCallback((isInstant = false) => {
    if (!chatContainerRef.current) return;
    const el = chatContainerRef.current;
    if (isInstant) el.scrollTop = el.scrollHeight;
    else el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, []);

  // 텐션 승급
  const triggerAutoIntimacyElevation = useCallback((reason) => {
    setIntimacyLevel(prevLevel => {
      let targetLevel = prevLevel;
      if (reason === 'whisper' && prevLevel < 2) targetLevel = 2;
      if (reason === 'tempo' && prevLevel < 3) targetLevel = 3;
      if (reason === 'touch_collision' || reason === 'fever_climax') targetLevel = 3;

      if (targetLevel !== prevLevel) {
        triggerHaptic(targetLevel === 3 ? [60, 80, 120] : [40, 60]);
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.send({
            type: 'broadcast',
            event: 'intimacy_level',
            payload: { user: currentUserName, level: targetLevel }
          });
        }
      }
      return targetLevel;
    });
  }, [currentUserName]);

  // 도파민 팝업 발동
  const triggerDopamineClimax = useCallback((customPayload = null) => {
    const payload = customPayload || {
      title: triggerConfig.title,
      subtitle: triggerConfig.subtitle,
      from: currentUserName
    };

    setActiveDopaminePopup(payload);

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'dopamine_trigger',
        payload
      });
    }
  }, [triggerConfig, currentUserName]);

  // 🌟 [신규] 돌발 미션 카드 양방향 발동 브로드캐스트
  const triggerMissionCardGame = useCallback((cardTemplate) => {
    const cardInstance = {
      ...cardTemplate,
      instanceId: Date.now(),
      sindongDone: false,
      hanaDone: false,
      sindongAnswer: '',
      hanaAnswer: ''
    };

    setActiveMissionCard(cardInstance);
    triggerHaptic([50, 80, 100]);

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'mission_card_start',
        payload: cardInstance
      });
    }
  }, []);

  // 🌟 [신규] 돌발 미션 카드 답변 제출 처리
  const handleAnswerMissionCard = async (answer) => {
    if (!activeMissionCard) return;

    const isSindong = currentUserName === '정신동';
    const updated = {
      ...activeMissionCard,
      sindongDone: isSindong ? true : activeMissionCard.sindongDone,
      hanaDone: !isSindong ? true : activeMissionCard.hanaDone,
      sindongAnswer: isSindong ? answer : activeMissionCard.sindongAnswer,
      hanaAnswer: !isSindong ? answer : activeMissionCard.hanaAnswer,
      fromUser: currentUserName
    };

    setActiveMissionCard(updated);

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'mission_card_progress',
        payload: updated
      });
    }

    // 둘 다 완료 시 클리어 처리
    if (updated.sindongDone && updated.hanaDone) {
      const nextGauge = Math.min(100, loveGauge + 7);
      setLoveGauge(nextGauge);
      localStorage.setItem('secret_love_gauge', String(nextGauge));

      triggerDopamineClimax({
        title: "🎉 미션 완벽 클리어! 사랑 게이지 상승! 🎉",
        subtitle: `두 사람의 마음이 완벽히 통했습니다.\n현재 사랑의 게이지: ${nextGauge}%`
      });

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.send({
          type: 'broadcast',
          event: 'mission_card_cleared',
          payload: { loveGauge: nextGauge }
        });
      }
    }
  };

  // 체온 동기화
  useEffect(() => {
    let tempTimer;
    if (isHoldingHand && isPeerHoldingHand) {
      triggerHaptic([30, 40]);
      tempTimer = setInterval(() => {
        setBodyTemp(prev => {
          const next = +(prev + 0.15).toFixed(1);
          triggerHaptic(20);
          if (next >= 39.0) {
            triggerAutoIntimacyElevation('fever_climax');
            triggerDopamineClimax({
              title: "🔥 두 사람의 체온이 39.0°C에 도달했습니다 🔥",
              subtitle: "살결이 맞닿아 이성이 전부 녹아내렸습니다.\n완전한 열기 속에 서로에게 몰입하세요."
            });
            return 39.0;
          }
          return next;
        });
      }, 200);
    } else {
      setBodyTemp(36.5);
    }
    return () => clearInterval(tempTimer);
  }, [isHoldingHand, isPeerHoldingHand, triggerAutoIntimacyElevation, triggerDopamineClimax]);

  // 자폭 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      setBurnTimers(prev => {
        const next = { ...prev };
        let hasChanges = false;
        Object.keys(next).forEach(msgId => {
          if (next[msgId] > 1) {
            next[msgId] -= 1;
            hasChanges = true;
          } else if (next[msgId] === 1) {
            delete next[msgId];
            hasChanges = true;
            setMessages(mList => mList.filter(m => String(m.id) !== String(msgId)));
            supabase.from('secret_chat').delete().eq('id', msgId).then();
            triggerHaptic([40, 40]);
          }
        });
        return hasChanges ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Supabase 실시간 브로드캐스트 & DB 연동
  useEffect(() => {
    if (!isMoHana && !isJungSinDong) {
      setActiveScreen('home');
      return;
    }

    let isMounted = true;

    const fetchHistory = async () => {
      try {
        const { data } = await supabase.from('secret_chat').select('*').order('created_at', { ascending: true });
        if (data && isMounted) {
          setMessages(data);
          
          const unreadFromPeer = data.filter(m => m.sender_name !== currentUserName && !m.is_read);
          if (unreadFromPeer.length > 0) {
            const veilIds = new Set(unreadFromPeer.map(m => m.id));
            setVeiledMessageIds(veilIds);
            setHasVeilBanner(true);
            triggerHaptic([30, 40, 30]);
          } else {
            supabase.from('secret_chat')
              .update({ is_read: true })
              .neq('sender_name', currentUserName)
              .eq('is_read', false)
              .then();
          }

          setTimeout(() => scrollToBottom(true), 60);
        }
      } catch (e) {}
    };
    fetchHistory();

    const roomChannel = supabase.channel('secret_intimacy_room', {
      config: { presence: { key: currentUserName } }
    });
    broadcastChannelRef.current = roomChannel;

    roomChannel
      .on('presence', { event: 'sync' }, () => {
        if (!isMounted) return;
        const state = roomChannel.presenceState();
        setIsPeerOnline(Object.keys(state).includes(targetPeerName));
      })
      .on('broadcast', { event: 'touch_move' }, payload => {
        if (!isMounted || payload.payload.user === currentUserName) return;
        setPeerTouch(payload.payload.coords);
      })
      .on('broadcast', { event: 'touch_end' }, () => {
        if (!isMounted) return;
        setPeerTouch(null);
      })
      .on('broadcast', { event: 'heartbeat_pulse' }, payload => {
        if (!isMounted || payload.payload.user === currentUserName) return;
        triggerHaptic([60, 80, 60, 100, 150]);
        setIsHeartbeating(true);
        setTimeout(() => setIsHeartbeating(false), 900);
      })
      .on('broadcast', { event: 'intimacy_level' }, payload => {
        if (!isMounted || payload.payload.user === currentUserName) return;
        setIntimacyLevel(payload.payload.level);
        triggerHaptic([80, 50, 80]);
      })
      .on('broadcast', { event: 'dopamine_trigger' }, payload => {
        if (!isMounted) return;
        setActiveDopaminePopup(payload.payload);
      })
      .on('broadcast', { event: 'hand_holding' }, payload => {
        if (!isMounted || payload.payload.user === currentUserName) return;
        setIsPeerHoldingHand(payload.payload.isHolding);
      })
      .on('broadcast', { event: 'typing_breath' }, payload => {
        if (!isMounted || payload.payload.user === currentUserName) return;
        setIsPeerTyping(true);
        triggerHaptic(10);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsPeerTyping(false), 2500);
      })
      // 🌟 돌발 미션 카드 브로드캐스트 수신
      .on('broadcast', { event: 'mission_card_start' }, payload => {
        if (!isMounted) return;
        setActiveMissionCard(payload.payload);
        triggerHaptic([60, 90, 120]);
      })
      .on('broadcast', { event: 'mission_card_progress' }, payload => {
        if (!isMounted) return;
        setActiveMissionCard(payload.payload);
        triggerHaptic([40, 60]);
      })
      .on('broadcast', { event: 'mission_card_cleared' }, payload => {
        if (!isMounted) return;
        setLoveGauge(payload.payload.loveGauge);
        triggerHaptic([80, 120, 200]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'secret_chat' }, payload => {
        if (!isMounted) return;
        setMessages(prev => [...prev, payload.new]);
        setTimeout(() => scrollToBottom(), 50);

        const now = Date.now();
        recentMsgTimesRef.current = [...recentMsgTimesRef.current.filter(t => now - t < 30000), now];
        if (recentMsgTimesRef.current.length >= 3) {
          triggerAutoIntimacyElevation('tempo');
        }

        if (payload.new.sender_name !== currentUserName) {
          triggerHaptic([60, 90, 60]);
          supabase.from('secret_chat').update({ is_read: true }).eq('id', payload.new.id).then();
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'secret_chat' }, payload => {
        if (!isMounted) return;
        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await roomChannel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(roomChannel);
    };
  }, [currentUser, setActiveScreen, isMoHana, isJungSinDong, currentUserName, targetPeerName, scrollToBottom, triggerAutoIntimacyElevation]);

  // 베일 해제
  const handleUnlockAllVeils = () => {
    triggerHaptic([40, 60, 80]);
    setVeiledMessageIds(new Set());
    setHasVeilBanner(false);

    supabase.from('secret_chat')
      .update({ is_read: true })
      .neq('sender_name', currentUserName)
      .eq('is_read', false)
      .then();
  };

  const handleUnlockSingleVeil = (msgId) => {
    triggerHaptic([30, 40]);
    setVeiledMessageIds(prev => {
      const next = new Set(prev);
      next.delete(msgId);
      if (next.size === 0) setHasVeilBanner(false);
      return next;
    });

    supabase.from('secret_chat').update({ is_read: true }).eq('id', msgId).then();
  };

  // 살결 터치
  const handleTouchMove = (e) => {
    if (!broadcastChannelRef.current) return;
    const touch = e.touches ? e.touches[0] : e;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((touch.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((touch.clientY - rect.top) / rect.height) * 100);

    broadcastChannelRef.current.send({
      type: 'broadcast',
      event: 'touch_move',
      payload: { user: currentUserName, coords: { x, y } }
    });

    if (peerTouch) {
      const dist = Math.hypot(peerTouch.x - x, peerTouch.y - y);
      if (dist < 8) {
        triggerHaptic([40, 60, 80, 100, 150]);
        triggerAutoIntimacyElevation('touch_collision');
      }
    }
  };

  const handleTouchEnd = () => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'touch_end',
        payload: { user: currentUserName }
      });
    }
  };

  const startHeartbeat = () => {
    triggerHaptic([50, 70, 50, 90]);
    setIsHeartbeating(true);
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'heartbeat_pulse',
        payload: { user: currentUserName }
      });
    }
    setTimeout(() => setIsHeartbeating(false), 800);
  };

  const handleStartHoldHand = () => {
    setIsHoldingHand(true);
    triggerHaptic(40);
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'hand_holding',
        payload: { user: currentUserName, isHolding: true }
      });
    }
  };

  const handleEndHoldHand = () => {
    setIsHoldingHand(false);
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'hand_holding',
        payload: { user: currentUserName, isHolding: false }
      });
    }
  };

  const handleTextareaInput = (e) => {
    const val = e.target.value;
    setInputText(val);

    e.target.style.height = '40px';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'typing_breath',
        payload: { user: currentUserName }
      });
    }
  };

  // 🌟 [핵심 1] 송신자 맞춤형 개별 미션 주사위 굴리기
  const handleRollMissionDice = async () => {
    triggerHaptic([40, 60, 80]);
    
    // 내가 신동이면 신동의 미션 목록에서, 하나면 하나의 미션 목록에서 추출!
    const missionPool = isJungSinDong ? sindongMissions : hanaMissions;
    const randomMission = missionPool[Math.floor(Math.random() * missionPool.length)];

    const payloadObj = {
      text: randomMission,
      isWhisper: isWhisperMode,
      burnSec: isWhisperMode ? 15 : 0,
      isMission: true,
      missionTarget: isJungSinDong ? '하나' : '신동'
    };

    const newMsg = {
      sender_name: currentUserName,
      message_type: 'text',
      content: encryptText(JSON.stringify(payloadObj)),
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('secret_chat').insert([newMsg]);
    if (error) alert('미션 전송 실패: ' + error.message);
  };

  // 🌟 [핵심 2] LV.3 클라이맥스 은밀한 단어사전 오토 드롭 로직
  const checkAndAutoDropWord = useCallback(async () => {
    if (intimacyLevel === 3 && wordDict.length > 0) {
      // 25% 확률로 단어사전에서 단어 하나를 몽환적인 오토 속삭임으로 드롭!
      if (Math.random() < 0.25) {
        const randomWord = wordDict[Math.floor(Math.random() * wordDict.length)];
        const autoPayload = {
          text: `✨ [본능의 속삭임] "...${randomWord}..."`,
          isWhisper: true,
          burnSec: 10,
          isAutoDrop: true
        };

        const autoMsg = {
          sender_name: 'SECRET_PULSE',
          message_type: 'text',
          content: encryptText(JSON.stringify(autoPayload)),
          is_read: false,
          created_at: new Date().toISOString()
        };

        await supabase.from('secret_chat').insert([autoMsg]);
        triggerHaptic([30, 50]);
      }
    }
  }, [intimacyLevel, wordDict]);

  const handleLevelChange = (level) => {
    setIntimacyLevel(level);
    triggerHaptic(level === 3 ? [80, 80, 120] : [50, 50]);
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'intimacy_level',
        payload: { user: currentUserName, level }
      });
    }
  };

  // 메시지 전송
  const sendMessage = async (type = 'text', rawContent = inputText) => {
    if (!rawContent.trim() && type === 'text') return;

    triggerHaptic(40);
    const messageText = rawContent.trim();

    if (type === 'text' && triggerConfig.keywords.some(k => messageText.includes(k))) {
      triggerDopamineClimax();
    }

    if (isWhisperMode) {
      triggerAutoIntimacyElevation('whisper');
    }

    const payloadObj = {
      text: messageText,
      isWhisper: isWhisperMode,
      burnSec: isWhisperMode ? 15 : 0
    };

    const finalContent = encryptText(JSON.stringify(payloadObj));

    const newMsg = {
      sender_name: currentUserName,
      message_type: type,
      content: finalContent,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    if (type === 'text') {
      setInputText('');
      if (textareaRef.current) textareaRef.current.style.height = '40px';
    }

    const { error } = await supabase.from('secret_chat').insert([newMsg]);
    if (error) alert('전송 실패: ' + error.message);
    else {
      // 메시지 전송 후 LV.3 오토 단어 드롭 체크
      checkAndAutoDropWord();
    }
  };

  // 미디어 업로드
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_SIZE_MB = 48;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`선택한 파일이 ${Math.round(file.size / (1024 * 1024))}MB로 너무 큽니다.\nSupabase 스토리지 제한(50MB 이하)에 맞춰 15~30초 이내의 클립으로 전송해주세요.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setTimeout(() => scrollToBottom(), 50);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('chat_attachments').upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('chat_attachments').getPublicUrl(fileName);
      const isVideo = file.type.startsWith('video/');
      await sendMessage(isVideo ? 'video' : 'image', publicUrlData.publicUrl);
    } catch (err) {
      alert('미디어 업로드 실패: ' + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRevealStart = (msgId, isWhisper) => {
    setActiveRevealId(msgId);
    triggerHaptic(20);
    if (isWhisper && !burnTimers[msgId]) {
      setBurnTimers(prev => ({ ...prev, [msgId]: 15 }));
    }
  };

  const handleRevealEnd = () => {
    setActiveRevealId(null);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? '오후' : '오전';
    hours = hours % 12 || 12;
    return `${ampm} ${hours}:${minutes}`;
  };

  if (isPanicLocked) {
    return <CamouflageBibleView onUnlock={() => setIsPanicLocked(false)} />;
  }

  const tensionBg = 
    intimacyLevel === 3 ? 'bg-gradient-to-b from-[#1c0208] via-[#090003] to-[#040001]' :
    intimacyLevel === 2 ? 'bg-gradient-to-b from-[#140508] via-[#0a0507] to-[#050304]' :
    'bg-gradient-to-b from-[#0e0e11] via-[#0a0a0c] to-[#060608]';

  const displayInputText = isGhostTyping && inputText 
    ? GHOST_SCRIPTURE.slice(0, inputText.length) 
    : inputText;

  return (
    <div 
      className={`fixed inset-0 z-[180] flex flex-col w-full select-none overflow-hidden text-slate-100 ${tensionBg} transition-colors duration-700`}
      style={{ height: '100dvh' }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseMove={handleTouchMove}
    >
      {/* 도파민 네온 폭죽 팝업 오버레이 */}
      {activeDopaminePopup && (
        <DopamineNeonPopup 
          data={activeDopaminePopup} 
          onClose={() => setActiveDopaminePopup(null)} 
        />
      )}

      {/* 🌟 양방향 돌발 미션 카드 모달 */}
      {activeMissionCard && (
        <InteractiveMissionCardModal
          card={activeMissionCard}
          currentUserName={currentUserName}
          onSubmitAnswer={handleAnswerMissionCard}
          onClose={() => setActiveMissionCard(null)}
        />
      )}

      {/* 신동 전용 통합 마스터 설정 모달 */}
      {showMasterConfig && (
        <MasterSecretConfigModal 
          currentConfig={triggerConfig}
          sindongMissions={sindongMissions}
          hanaMissions={hanaMissions}
          wordDict={wordDict}
          missionCards={missionCards}
          onSave={({ config, sindongMissions: sm, hanaMissions: hm, wordDict: wd, newCard }) => {
            setTriggerConfig(config);
            setSindongMissions(sm);
            setHanaMissions(hm);
            setWordDict(wd);
            if (newCard) {
              const updatedCards = [newCard, ...missionCards];
              setMissionCards(updatedCards);
              localStorage.setItem('secret_mission_cards', JSON.stringify(updatedCards));
            }
            localStorage.setItem('secret_dopamine_config', JSON.stringify(config));
            localStorage.setItem('secret_sindong_missions', JSON.stringify(sm));
            localStorage.setItem('secret_hana_missions', JSON.stringify(hm));
            localStorage.setItem('secret_word_dict', JSON.stringify(wd));
            triggerHaptic([40, 60]);
          }}
          onTriggerMissionCard={(card) => {
            setShowMasterConfig(false);
            triggerMissionCardGame(card);
          }}
          onClose={() => setShowMasterConfig(false)} 
        />
      )}

      {/* 상대방 살결 터치 라이트 */}
      {peerTouch && (
        <div 
          className="pointer-events-none fixed z-[220] -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
          style={{ left: `${peerTouch.x}%`, top: `${peerTouch.y}%` }}
        >
          <div className="w-16 h-16 rounded-full bg-rose-500/30 blur-md animate-ping" />
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 to-amber-300 blur-xs shadow-[0_0_20px_#e11d48]" />
        </div>
      )}

      {/* 심박수 전체화면 펄스 */}
      {isHeartbeating && (
        <div className="pointer-events-none fixed inset-0 z-[210] border-4 border-rose-600/70 shadow-[inset_0_0_60px_rgba(225,29,72,0.4)] animate-pulse" />
      )}

      {/* 손잡기 체온 동기화 풀스크린 열기 펄스 */}
      {isHoldingHand && isPeerHoldingHand && (
        <div className="pointer-events-none fixed inset-0 z-[230] border-2 border-amber-500/80 shadow-[inset_0_0_80px_rgba(245,158,11,0.5)] animate-pulse flex items-center justify-center">
          <div className="bg-black/85 border border-amber-500/80 px-4 py-2 rounded-full text-center shadow-[0_0_30px_#f59e0b] animate-bounce">
            <span className="text-[11px] font-mono text-amber-300 block font-bold">♥ 둘의 살결이 맞닿았습니다 ♥</span>
            <span className="text-[20px] font-mono font-black text-rose-500 tracking-wider">
              {bodyTemp}°C {bodyTemp >= 38.5 ? "🔥 FEVER" : "WARMING"}
            </span>
          </div>
        </div>
      )}

      {/* 1. 상단 다크 헤더 바 */}
      <header className="relative z-10 flex items-center justify-between px-3 h-[54px] bg-black/60 backdrop-blur-xl border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveScreen('home')} className="p-1.5 -ml-1 text-slate-400 hover:text-white active:scale-95 cursor-pointer">
            ←
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[14.5px] font-black tracking-tight text-rose-100">
                {isMoHana ? '신동' : '모하나'}
              </span>
              <span className={`w-2 h-2 rounded-full ${isPeerOnline ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-slate-600'}`} />
            </div>
            
            {/* 🌟 사랑의 게이지 인디케이터 */}
            <div className="flex items-center gap-1">
              <span className="text-[8.5px] font-mono text-amber-400 font-bold">LOVE {loveGauge}%</span>
              <div className="w-10 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500" style={{ width: `${loveGauge}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex bg-white/5 p-0.5 rounded border border-white/10 text-[9.5px] font-mono">
            {[1, 2, 3].map(lvl => (
              <button
                key={lvl}
                onClick={() => handleLevelChange(lvl)}
                className={`px-2 py-0.5 rounded-xs font-bold cursor-pointer transition-all ${
                  intimacyLevel === lvl ? 'bg-rose-900/90 text-rose-200 border border-rose-500/40 shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                LV.{lvl}
              </button>
            ))}
          </div>

          <button
            onMouseDown={startHeartbeat}
            onTouchStart={startHeartbeat}
            className="w-8 h-8 rounded-full bg-rose-950/80 border border-rose-600/40 text-rose-300 flex items-center justify-center text-[13px] active:scale-90 transition-all cursor-pointer shadow-xs"
            title="심박동 햅틱 전달"
          >
            ♥
          </button>

          {/* 🌟 신동 전용 마스터 스튜디오 버튼 */}
          {isJungSinDong && (
            <button
              onClick={() => setShowMasterConfig(true)}
              className="p-1.5 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 rounded-xs text-[11px] cursor-pointer"
              title="신동 마스터 설정"
            >
              ⚙
            </button>
          )}

          <button
            onClick={() => { triggerHaptic([50]); setIsPanicLocked(true); }}
            className="px-2 py-1 bg-white/10 hover:bg-white/20 border border-white/10 text-slate-300 text-[10px] font-bold rounded-xs cursor-pointer"
          >
            위장
          </button>
        </div>
      </header>

      {/* 2. 부재중 은밀한 메시지 베일 배너 */}
      {hasVeilBanner && (
        <div className="relative z-20 bg-rose-950/90 border-b border-rose-800/60 px-3.5 py-2 flex items-center justify-between shadow-lg backdrop-blur-md animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-[14px]">💌</span>
            <div className="text-[11px] leading-tight">
              <span className="font-bold text-rose-100">{targetPeerName}의 부재중 고백 {veiledMessageIds.size}건</span>
              <span className="block text-[9.5px] text-rose-300">주변 시선이 없는 안전한 곳에서 열람하세요</span>
            </div>
          </div>
          <button
            onClick={handleUnlockAllVeils}
            className="px-3 py-1 bg-rose-700 hover:bg-rose-600 text-white font-bold text-[10.5px] rounded-xs shadow-xs cursor-pointer active:scale-95"
          >
            모두 열람
          </button>
        </div>
      )}

      {/* 3. 대화 피드 */}
      <main 
        ref={chatContainerRef}
        className="relative z-10 flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5 overscroll-contain no-scrollbar"
      >
        {messages.map((msg, idx) => {
          const isMe = msg.sender_name === currentUserName;
          const isPulseAuto = msg.sender_name === 'SECRET_PULSE';
          const payload = decodePayload(msg.content);
          const isBurnActive = burnTimers[msg.id] !== undefined;
          const isRevealing = activeRevealId === msg.id;
          const isVeiled = veiledMessageIds.has(msg.id);
          // ✅ [추가할 코드]
          const mediaUrl = payload.text || decryptText(msg.content) || msg.content;

          // 🌟 LV.3 단어사전 오토 드롭 메시지 렌더링
          if (isPulseAuto) {
            return (
              <div key={msg.id || idx} className="w-full flex justify-center my-1 animate-pulse select-none">
                <div className="px-3 py-1.5 rounded-full bg-rose-950/60 border border-rose-500/30 text-rose-300 font-serif italic text-[11.5px] shadow-[0_0_12px_rgba(244,63,94,0.3)]">
                  {payload.text}
                </div>
              </div>
            );
          }

          return (
            <div 
              key={msg.id || idx} 
              className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className={`flex gap-1.5 max-w-[85%] sm:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                
                {isVeiled ? (
                  <div 
                    onClick={() => handleUnlockSingleVeil(msg.id)}
                    className="p-3 rounded-xs border border-rose-800/80 bg-rose-950/60 text-rose-200 cursor-pointer shadow-lg hover:bg-rose-900/50 transition-all flex items-center gap-2 select-none"
                  >
                    <span className="text-base animate-pulse">🔒</span>
                    <div>
                      <span className="font-bold text-[12px] block text-rose-100">봉인된 비밀 고백</span>
                      <span className="text-[9.5px] text-rose-300/80">탭하여 마음의 준비 후 열람하기</span>
                    </div>
                  </div>
                ) : (
                  <div 
                    onMouseDown={() => handleRevealStart(msg.id, payload.isWhisper)}
                    onMouseUp={handleRevealEnd}
                    onTouchStart={() => handleRevealStart(msg.id, payload.isWhisper)}
                    onTouchEnd={handleRevealEnd}
                    className={`relative p-2.5 sm:p-3 rounded-xs border break-words cursor-pointer select-none transition-all ${
                      payload.isMission
                        ? 'bg-gradient-to-r from-rose-950 via-purple-950 to-black border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] text-rose-100'
                        : isMe 
                        ? 'bg-rose-950/70 border-rose-800/50 text-rose-100 shadow-[0_2px_12px_rgba(225,29,72,0.15)]' 
                        : 'bg-[#18181b]/90 border-white/10 text-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.3)]'
                    } ${payload.isWhisper && !isRevealing ? 'border-dashed border-rose-500/70' : ''}`}
                  >
                    {/* 미션 카드 헤더 (송신자별 타겟 표기) */}
                    {payload.isMission && (
                      <div className="flex items-center gap-1.5 pb-1 mb-1 border-b border-amber-500/30 text-[10px] font-mono text-amber-300 font-bold">
                        <span>🎲 {payload.missionTarget ? `${payload.missionTarget}를 향한 돌발 미션` : "은밀한 돌발 미션"}</span>
                      </div>
                    )}

                    {payload.isWhisper && (
                      <div className="flex items-center justify-between gap-2 pb-1 mb-1 border-b border-white/10 text-[9px] font-mono text-rose-300">
                        <span>속삭임 (15초 후 영구 파기)</span>
                        {isBurnActive && (
                          <span className="font-bold text-rose-400 bg-rose-950/90 px-1 rounded animate-pulse">
                            {burnTimers[msg.id]}s
                          </span>
                        )}
                      </div>
                    )}

                    {msg.message_type === 'text' && (
                      <div className="relative">
                        <p className={`text-[13.5px] leading-relaxed font-normal whitespace-pre-wrap ${
                          payload.isWhisper && !isRevealing ? 'blur-md select-none' : ''
                        } transition-all duration-200`}>
                          {payload.text}
                        </p>
                        {payload.isWhisper && !isRevealing && (
                          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-rose-300 pointer-events-none drop-shadow-md">
                            길게 눌러서 확인
                          </span>
                        )}
                      </div>
                    )}
                    
{msg.message_type === 'image' && (
  <div className="relative">
    <img 
      src={mediaUrl} 
      alt="미디어" 
      onLoad={() => scrollToBottom()}
      className={`max-w-[220px] sm:max-w-[280px] max-h-[300px] object-cover rounded-xs mt-1 ${
        !isRevealing ? 'blur-lg scale-95' : 'blur-none scale-100'
      } transition-all duration-300`} 
    />
    {!isRevealing && (
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-rose-200 bg-black/40 pointer-events-none">
        꾹 눌러서 리빌
      </div>
    )}
  </div>
)}

{msg.message_type === 'video' && (
  <video 
    src={mediaUrl} 
    controls 
    playsInline
    onLoadedData={() => scrollToBottom()}
    className="max-w-[240px] sm:max-w-[300px] rounded-xs mt-1" 
  />
)}
                  </div>
                )}

                <div className={`flex flex-col mb-0.5 text-[9.5px] font-mono text-slate-500 leading-none ${isMe ? 'items-end' : 'items-start'}`}>
                  {isMe && !msg.is_read && (
                    <span className="text-rose-400 font-bold mb-0.5 drop-shadow-[0_0_4px_#e11d48]">
                      1
                    </span>
                  )}
                  <span>{formatTime(msg.created_at)}</span>
                </div>

              </div>
            </div>
          );
        })}

        {isUploading && (
          <div className="flex w-full justify-end animate-pulse">
            <div className="bg-rose-950/80 border border-rose-800/60 p-2.5 rounded-xs text-rose-200 text-[11.5px] flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></span>
              암호화 미디어 전송 중 (최대 50MB)...
            </div>
          </div>
        )}
      </main>

      {/* 상대방 실시간 숨결 인디케이터 */}
      {isPeerTyping && (
        <div className="relative z-20 px-3 py-1 bg-rose-950/60 border-t border-rose-500/30 flex items-center justify-between text-[10px] font-mono text-rose-300 animate-pulse">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>{targetPeerName}가 숨죽여 글을 적는 중... ♥</span>
          </div>
          <span className="opacity-60">BREATHING</span>
        </div>
      )}

      {/* 4. 하단 컨트롤 바 */}
      <footer className="relative z-10 w-full bg-black/70 backdrop-blur-xl border-t border-white/[0.08] flex flex-col shrink-0">
        
        <div className="px-3 py-1 bg-white/[0.03] border-b border-white/[0.05] flex items-center justify-between text-[10.5px]">
          <div className="flex items-center gap-1.5">
            <input 
              type="checkbox" 
              id="whisperToggle"
              checked={isWhisperMode} 
              onChange={e => {
                triggerHaptic(30);
                setIsWhisperMode(e.target.checked);
              }}
              className="accent-rose-600 cursor-pointer"
            />
            <label htmlFor="whisperToggle" className="text-rose-200 font-bold cursor-pointer">
              속삭임 모드 (전송 시 LV.2 승급 · 15초 폭파)
            </label>
          </div>

          {/* 손잡기 터치패드 */}
          <button
            onMouseDown={handleStartHoldHand}
            onMouseUp={handleEndHoldHand}
            onTouchStart={handleStartHoldHand}
            onTouchEnd={handleEndHoldHand}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
              isHoldingHand 
                ? 'bg-amber-600 text-white border-amber-400 shadow-[0_0_12px_#f59e0b]' 
                : 'bg-white/5 border-white/10 text-rose-200 hover:bg-white/10'
            }`}
          >
            {isHoldingHand ? `맞잡는 중 (${bodyTemp}°C)` : "손잡기 (누르고 있기)"}
          </button>
        </div>

        <div className="flex items-end px-2.5 py-2 gap-1.5 min-h-[48px]">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading}
            className="p-2 mb-0.5 text-slate-400 hover:text-rose-300 active:scale-90 transition-all cursor-pointer shrink-0"
            title="미디어 첨부 (최대 50MB)"
          >
            +
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />

          {/* 원터치 도파민 번개 */}
          <button
            onClick={() => triggerDopamineClimax()}
            className="p-2 mb-0.5 text-amber-300 hover:text-rose-400 active:scale-90 transition-all cursor-pointer shrink-0 text-base drop-shadow-[0_0_8px_#f59e0b]"
            title="도파민 네온 폭죽 즉시 발동"
          >
            ⚡
          </button>

          {/* 🌟 [개별 미션 주사위] */}
          <button
            onClick={handleRollMissionDice}
            className="p-2 mb-0.5 text-rose-400 hover:text-amber-300 active:scale-90 transition-all cursor-pointer shrink-0 text-base drop-shadow-[0_0_8px_#e11d48]"
            title={isJungSinDong ? "하나에게 주는 돌발 미션 던지기" : "신동에게 주는 돌발 미션 던지기"}
          >
            🎲
          </button>

          {/* 고스트 성경 위장 타이핑 토글 */}
          <button
            onClick={() => {
              triggerHaptic(20);
              setIsGhostTyping(!isGhostTyping);
            }}
            className={`p-2 mb-0.5 transition-all cursor-pointer shrink-0 text-base ${
              isGhostTyping ? 'text-emerald-400 drop-shadow-[0_0_8px_#10b981]' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="고스트 성경 위장 타이핑"
          >
            {isGhostTyping ? "🕶️" : "👁️"}
          </button>

          <textarea
            ref={textareaRef}
            value={displayInputText}
            onChange={handleTextareaInput}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage('text');
              }
            }}
            placeholder={
              isGhostTyping 
                ? "성경 구절로 위장 타이핑 중..." 
                : isWhisperMode 
                ? "15초 후 파기될 속삭임을 입력하세요..." 
                : "메시지를 입력하세요 (트리거 단어 작동중)..."
            }
            disabled={isUploading}
            className="flex-1 bg-[#18181b] border border-white/10 rounded-xs px-3 py-2 text-[13px] text-slate-100 outline-none resize-none no-scrollbar mb-0.5 focus:border-rose-700/80 leading-snug"
            style={{ height: '40px', minHeight: '40px' }}
          />

          <button 
            onClick={() => sendMessage('text')} 
            disabled={!inputText.trim() || isUploading}
            className={`px-3 py-2 mb-0.5 rounded-xs font-bold text-[11.5px] transition-all shrink-0 cursor-pointer ${
              inputText.trim() && !isUploading 
                ? 'bg-rose-900 text-rose-100 hover:bg-rose-800 shadow-[0_0_12px_rgba(225,29,72,0.4)]' 
                : 'bg-white/5 text-slate-600 pointer-events-none'
            }`}
          >
            전송
          </button>
        </div>

        <div style={{ height: 'max(8px, env(safe-area-inset-bottom))', width: '100%' }}></div>
      </footer>

    </div>
  );
}
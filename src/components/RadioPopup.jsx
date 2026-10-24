import React, { useState, useEffect } from 'react';

export default function RadioPopup({ supabase, isAdmin }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingMode, setIsSettingMode] = useState(false);
  
  const [liveUrl, setLiveUrl] = useState("");
  const [tempUrl, setTempUrl] = useState("");

  const checkShouldOpen = () => {
    const now = new Date();
    const month = now.getMonth() + 1; 
    const date = now.getDate();     

    // 8월 3일 ~ 4일 동안은 시간 무관하게 항상 띄우기
    if (month === 8 && (date === 3 || date === 4)) {
      return true;
    }

    // 다음 주부터는 매주 화요일 06:50 ~ 08:10 에만 띄우기
    const day = now.getDay(); 
    if (day !== 2) return false; 

    const hours = now.getHours();
    const mins = now.getMinutes();
    const totalMins = hours * 60 + mins;
    const startMins = 6 * 60 + 50; // 06:50
    const endMins = 8 * 60 + 10;   // 08:10

    return totalMins >= startMins && totalMins <= endMins;
  };

  useEffect(() => {
    const fetchGlobalLink = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings') 
          .select('value')
          .eq('key', 'radio_live_url')
          .single();
        
        if (data && data.value) {
          setLiveUrl(data.value);
          setTempUrl(data.value);
        }
      } catch (error) {
        console.error("라디오 링크를 불러오는데 실패했습니다.", error);
      }
    };

    if (checkShouldOpen()) {
      setIsOpen(true);
      fetchGlobalLink();
    }
  }, [supabase]);

  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('/embed/')) return url;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|v\/|live\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
  };

  const handleSave = async () => {
    const finalUrl = getEmbedUrl(tempUrl);
    
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'radio_live_url', value: finalUrl });

      if (error) throw error;

      setLiveUrl(finalUrl);
      setTempUrl(finalUrl);
      setIsSettingMode(false);
      alert('방송 링크가 전체 성도님 앱에 업데이트되었습니다.');
    } catch (error) {
      console.error(error);
      alert('링크 저장에 실패했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col">
        
        <div className="flex items-center justify-between px-5 py-3 bg-blue-600 text-white">
          <div>
            <h3 className="text-[15px] font-black tracking-tight flex items-center gap-2">
              📻 극동방송 보이는 라디오 <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">106.9 MHz</span>
            </h3>
            <p className="text-[11px] text-blue-100 mt-0.5">좋은 아침입니다</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button 
                onClick={() => setIsSettingMode(!isSettingMode)}
                className="w-7 h-7 flex items-center justify-center rounded-md bg-white/20 hover:bg-white/30 transition-colors text-xs"
                title="관리자 전용 링크 설정"
              >
                ⚙️
              </button>
            )}
            <button 
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-md bg-black/20 hover:bg-black/40 text-white font-bold transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {isAdmin && isSettingMode && (
          <div className="p-3 bg-blue-50 dark:bg-slate-800 border-b border-blue-100 dark:border-slate-700 flex gap-2 items-center">
            <input 
              type="text" 
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              placeholder="유튜브 라이브 링크를 붙여넣으세요..."
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-blue-200 dark:border-slate-600 outline-none dark:bg-slate-900 dark:text-white"
            />
            <button 
              onClick={handleSave}
              className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-700"
            >
              전체 적용
            </button>
          </div>
        )}

        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          {liveUrl ? (
            <iframe 
              className="w-full h-full"
              src={liveUrl} 
              title="극동방송 보이는 라디오"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="text-center">
              <p className="text-gray-400 text-sm font-bold mb-2">아직 시작된 방송이 없습니다.</p>
              {isAdmin && (
                <button 
                  onClick={() => setIsSettingMode(true)}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg text-xs font-bold hover:bg-white/20"
                >
                  ⚙️ 라이브 링크 등록하기 (관리자용)
                </button>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-2.5 bg-gray-50 dark:bg-gray-800 flex justify-between items-center text-[11px] text-gray-500 dark:text-gray-400">
          <span>주파수 FM 106.9 MHz</span>
          <button 
            onClick={() => setIsOpen(false)}
            className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold rounded-md transition-colors"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
}
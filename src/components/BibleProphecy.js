import React, { useState, useEffect } from 'react';
// supabase 클라이언트 임포트 경로에 맞춰 수정해주세요
// import { supabase } from '../utils/supabaseClient'; 

export default function BibleProphecy({ t }) {
  const [prophecies, setProphecies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 임시 테스트 데이터 (Supabase 연결 전이라면 이걸로 먼저 확인 가능합니다)
    const dummyData = [
      {
        id: 1,
        theme: '임마누엘 (동정녀 탄생)',
        ot_verse: '이사야 7:14',
        ot_text: '보라 처녀가 잉태하여 아들을 날 것이요 그의 이름을 임마누엘이라 하리라',
        nt_verse: '마태복음 1:23',
        nt_text: '보라 처녀가 잉태하여 아들을 날 것이요 그의 이름은 임마누엘이라 하리라 하셨으니'
      }
    ];
    
    // TODO: Supabase 연동 시 아래 주석 해제
    /*
    async function fetchProphecies() {
      const { data, error } = await supabase.from('prophecy_links').select('*');
      if (!error) setProphecies(data);
      setLoading(false);
    }
    fetchProphecies();
    */

    setProphecies(dummyData);
    setLoading(false);
  }, []);

  if (loading) return <div className="p-4 text-center">불러오는 중...</div>;

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h2 className={`text-lg font-bold ${t?.textMain || 'text-slate-900'} mb-2`}>
        📖 구약 예언 & 신약 성취 연계
      </h2>

      {prophecies.map((item) => (
        <div key={item.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-3">
          
          {/* 주제 뱃지 */}
          <div className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg">
            ✨ {item.theme}
          </div>

          {/* 구약 예언 박스 */}
          <div className="p-3 bg-amber-50/50 dark:bg-slate-900/50 rounded-xl border border-amber-100 dark:border-slate-700">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block mb-1">
              📜 구약 예언 ({item.ot_verse})
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              "{item.ot_text}"
            </p>
          </div>

          {/* 연결 화살표 아이콘 */}
          <div className="text-center text-slate-400 text-sm">
            ⬇️ 신약에서 성취
          </div>

          {/* 신약 성취 박스 */}
          <div className="p-3 bg-indigo-50/50 dark:bg-slate-900/50 rounded-xl border border-indigo-100 dark:border-slate-700">
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
              ✝️ 신약 성취 ({item.nt_verse})
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              "{item.nt_text}"
            </p>
          </div>

        </div>
      ))}
    </div>
  );
}
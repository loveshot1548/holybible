import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

function VersePopup({ verse, keyword, authUser }) {
  const [sermonRecords, setSermonRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 💡 [이슬비 작전] 비밀 메모 데이터 연결
  const [secretMemo, setSecretMemo] = useState(null);
  const isMoHana = (authUser?.name || authUser) === '모하나';

  useEffect(() => {
    if (!isMoHana) return;
    const fetchMemo = async () => {
      const { data } = await supabase.from('secret_injections')
        .select('*')
        .eq('type', 'memory_card')
        .order('created_at', { ascending: false })
        .limit(1);
      if (data && data.length > 0) setSecretMemo(data[0].content);
    };
    fetchMemo();
  }, [isMoHana]);

  useEffect(() => {
    fetch("/sermon_summary.json")
      .then(res => res.json())
      .then(data => {
        if (!data || !data.index) {
          setLoading(false);
          return;
        }

        let records = [];
        if (keyword) {
          const key = `${verse}:${keyword}`;
          records = data.keyword_index[key] || [];
        } else {
          records = data.index[verse] || [];
          if (records.length === 0 && verse) {
            const targetClean = String(verse).replace(/\s+/g, '').toLowerCase();
            const allKeys = Object.keys(data.index);
            for (const k of allKeys) {
              const kClean = k.replace(/\s+/g, '').toLowerCase();
              if (kClean === targetClean || kClean.includes(targetClean) || targetClean.includes(kClean)) {
                records = data.index[k] || [];
                break;
              }
            }
          }
        }
        setSermonRecords(records);
        setLoading(false);
      })
      .catch(err => {
        setLoading(false);
      });
  }, [verse, keyword]);

  if (loading) return <div className="popup p-4">설교 데이터를 불러오는 중...</div>;

  return (
    <div className="popup-container p-4 bg-white dark:bg-[#2C2C2E] rounded-xl shadow-lg max-h-[80vh] overflow-y-auto">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
        📖 {verse} {keyword && <span className="text-blue-500">#{keyword}</span>}
      </h3>
      <hr className="mb-4 border-slate-200 dark:border-slate-700" />

      {/* 💡 [이슬비 작전] 비밀 메모 렌더링 영역 */}
      {isMoHana && secretMemo && (
        <div className="mb-5 p-4 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 shadow-sm animate-fade-in">
          <span className="text-[11px] font-bold text-pink-400 block mb-1">💌 누군가 남긴 비밀 메모</span>
          <p className="text-[13px] font-bold text-pink-700 dark:text-pink-300 leading-snug break-keep">{secretMemo}</p>
        </div>
      )}

      {sermonRecords.length === 0 ? (
        <p className="text-sm text-slate-500">이 구절과 관련된 설교 아카이브가 없습니다.</p>
      ) : (
        sermonRecords.map((record, index) => (
          <div key={index} className="mb-6 p-4 bg-slate-50 dark:bg-[#1C1C1E] rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              📅 <strong>{record.date}</strong> | 🎤 {record.preacher} ({record.service_type})
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">
              📌 {record.title}
            </div>
            {record.outline && record.outline.length > 0 && (
              <div className="mb-3">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block mb-1">📝 본문 대지 및 요약</span>
                {record.outline.map((out, idx) => (
                  <div key={idx} className="text-sm text-slate-700 dark:text-slate-300 mb-1">
                    <strong className="block text-xs text-slate-600 dark:text-slate-400">{out.title}</strong>
                    <ul className="list-disc pl-5 mt-0.5">
                      {out.content.map((c, cIdx) => (
                        <li key={cIdx} className="text-xs leading-relaxed">{c}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {record.applications && record.applications.length > 0 && (
              <div className="mb-3 p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 block mb-1">💡 묵상 및 적용 질문</span>
                <ul className="list-decimal pl-4 text-xs text-slate-700 dark:text-slate-300">
                  {record.applications.map((app, aIdx) => (
                    <li key={aIdx} className="mb-1">{app}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {record.tags && record.tags.map((tag, tIdx) => (
                <span key={tIdx} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default VersePopup;
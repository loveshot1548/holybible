import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

const bookNamesKo = {
  "Genesis":"창세기","Exodus":"출애굽기","Leviticus":"레위기","Numbers":"민수기","Deuteronomy":"신명기",
  "Joshua":"여호수아","Judges":"사사기","Ruth":"룻기","1 Samuel":"사무엘상","2 Samuel":"사무엘하",
  "1 Kings":"열왕기상","2 Kings":"열왕기하","1 Chronicles":"역대상","2 Chronicles":"역대하","Ezra":"에스라",
  "Nehemiah":"느헤미야","Esther":"에스더","Job":"욥기","Psalms":"시편","Proverbs":"잠언",
  "Ecclesiastes":"전도서","Song of Solomon":"아가","Isaiah":"이사야","Jeremiah":"예레미야","Lamentations":"예레미야애가",
  "Ezekiel":"에스겔","Daniel":"다니엘","Hosea":"호세아","Joel":"요엘","Amos":"아모스",
  "Obadiah":"오바댜","Jonah":"요나","Micah":"미가","Nahum":"나훔","Habakkuk":"하박국",
  "Zephaniah":"스바냐","Haggai":"학개","Zechariah":"스가랴","Malachi":"말라기","Matthew":"마태복음",
  "Mark":"마가복음","Luke":"누가복음","John":"요한복음","Acts":"사도행전","Romans":"로마서",
  "1 Corinthians":"고린도전서","2 Corinthians":"고린도후서","Galatians":"갈라디아서","Ephesians":"에베소서",
  "Philippians":"빌립보서","Colossians":"골로새서","1 Thessalonians":"데살로니가전서","2 Thessalonians":"데살로니가후서",
  "1 Timothy":"디모데전서","2 Timothy":"디모데후서","Titus":"디도서","Philemon":"빌레몬서",
  "Hebrews":"히브리서","James":"야고보서","1 Peter":"베드로전서","2 Peter":"베드로후서",
  "1 John":"요한일서","2 John":"요한이서","3 John":"요한삼서","Jude":"유다서","Revelation":"요한계시록"
};

const getKoName = (n) => bookNamesKo[n] || n;

export default function BibleReadNoteSplit({ t, bibles, currentChapId, setCurrentChapId, onBack }) {
  const { bibleNotes, setBibleNotes, isDarkMode } = useAppStore();
  const [selectedTool, setSelectedTool] = useState('pen'); 
  const [selectedColor, setSelectedColor] = useState('#1e293b');
  const [penSize, setPenSize] = useState(2);
  const [activeTab, setActiveTab] = useState('readNote'); 

  // 💡 성경통독용 묵상 로컬 State
  const [noteContent, setNoteContent] = useState('');
  const [graceLine, setGraceLine] = useState('');
  const [actionItem, setActionItem] = useState('');

  const [bookName, chapNumStr] = (currentChapId || 'Genesis-1').split('-');
  const chapNum = parseInt(chapNumStr, 10);
  
  const currentBook = bibles?.find(b => b.name === bookName) || bibles?.[0];
  const currentChapterVerses = currentBook?.chapters?.[chapNum - 1] || [];
  const koBookName = getKoName(currentBook?.name);

  // 💡 저장 시 트래커 연동을 위해 bibleNotes 배열에 Push
  const handleSaveNote = () => {
    if (!noteContent.trim() && !actionItem.trim() && !graceLine.trim()) return alert("내용이나 실천 목표를 입력해주세요.");
    
    const newNote = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      title: `${koBookName} ${chapNum}장 통독 묵상`,
      verses: [{ ref: `${koBookName} ${chapNum}장`, text: "성경 통독 묵상" }],
      note: noteContent,
      graceLine: graceLine,
      actionItem: actionItem,
      actionCompleted: false
    };
    
    setBibleNotes([...(bibleNotes || []), newNote]);
    alert("묵상과 실천 목표가 저장되어 아카이브에 등록되었습니다.");
    setNoteContent('');
    setGraceLine('');
    setActionItem('');
  };

  const colors = ['#1e293b', '#ef4444', '#f97316', '#fbbf24', '#10b981', '#3b82f6', '#8b5cf6'];

  return (
    <div className={`flex flex-col h-full ${t.pageBg} pointer-events-auto overflow-hidden animate-fade-in-up`}>
      <div className={`px-4 py-2 ${t.cardBg} border-b ${t.border} flex flex-wrap items-center justify-between shrink-0 shadow-xs z-10 gap-2`}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className={`p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 ${t.textMain}`}>
            &larr;
          </button>
          <span className={`text-sm font-black ${t.textMain}`}>{koBookName} {chapNum}장</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          <div className="flex gap-1 border-r border-slate-300 dark:border-slate-700 pr-2">
            <button onClick={() => setSelectedTool('pen')} className={`p-1.5 rounded-xl text-xs font-bold transition-all ${selectedTool === 'pen' ? 'bg-white dark:bg-slate-700 shadow-xs text-blue-600' : 'text-slate-400'}`} title="볼펜">🖊️ 펜</button>
            <button onClick={() => setSelectedTool('highlighter')} className={`p-1.5 rounded-xl text-xs font-bold transition-all ${selectedTool === 'highlighter' ? 'bg-white dark:bg-slate-700 shadow-xs text-yellow-500' : 'text-slate-400'}`} title="형광펜">🖍️ 형광펜</button>
            <button onClick={() => setSelectedTool('eraser')} className={`p-1.5 rounded-xl text-xs font-bold transition-all ${selectedTool === 'eraser' ? 'bg-white dark:bg-slate-700 shadow-xs text-red-500' : 'text-slate-400'}`} title="지우개">🧹 지우개</button>
          </div>

          <input type="range" min="1" max="10" value={penSize} onChange={(e) => setPenSize(e.target.value)} className="w-12 accent-blue-600" />

          <div className="flex items-center gap-1 pl-1">
            {colors.map(c => (
              <button key={c} onClick={() => setSelectedColor(c)} className={`w-4 h-4 rounded-full transition-transform ${selectedColor === c ? 'scale-125 ring-2 ring-blue-500 ring-offset-1' : 'opacity-70'}`} style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
          <button onClick={() => setActiveTab('readNote')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeTab === 'readNote' ? 'bg-white dark:bg-slate-700 shadow-xs text-blue-600' : 'text-slate-500'}`}>📖 2단 필사노트</button>
          <button onClick={() => setActiveTab('index')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeTab === 'index' ? 'bg-white dark:bg-slate-700 shadow-xs text-blue-600' : 'text-slate-500'}`}>📊 성경 목록표</button>
        </div>
      </div>

      {activeTab === 'readNote' ? (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          
          <div className="md:col-span-7 overflow-y-auto p-6 md:p-8 space-y-4 hide-scrollbar">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">365 BIBLE READING</span>
              <h1 className={`text-xl md:text-2xl font-black ${t.textMain} mt-1`}>{koBookName} 제 {chapNum} 장</h1>
            </div>

            <div className="space-y-3 text-sm md:text-base leading-loose font-medium">
              {currentChapterVerses.map((verseText, idx) => (
                <div key={idx} className="p-2 rounded-xl hover:bg-slate-100/50 dark:hover:bg-slate-800/40 flex items-start gap-3">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1 min-w-[20px]">{idx + 1}</span>
                  <p className={`flex-1 ${t.textMain} leading-relaxed`}>{verseText}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-5 overflow-y-auto p-6 md:p-8 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col gap-3 hide-scrollbar">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className={`text-xs font-bold text-slate-500 uppercase tracking-wider`}>📝 필사 & 묵상 노트</h3>
              <span className="text-[10px] text-slate-400">선택한 펜/형광펜으로 기록</span>
            </div>

            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="여기에 말씀을 손으로 필사하거나 묵상을 적으세요..."
              className={`w-full flex-1 min-h-[300px] p-4 bg-transparent outline-none resize-none text-sm ${t.textMain} leading-[38px] note-lines font-medium border-none`}
              style={{ color: selectedTool === 'highlighter' ? '#eab308' : selectedColor }}
            />

            {/* 💡 새로 추가된 은혜와 결단 입력 블록 */}
            <div className={`p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-900/10 mt-4`}>
                 <h3 className={`text-[13px] font-extrabold ${t.textMain} mb-3 flex items-center gap-1.5`}><span className="text-indigo-500">✨</span> 은혜와 결단</h3>
                 <div className="space-y-3">
                    <input type="text" value={graceLine} onChange={(e) => setGraceLine(e.target.value)} placeholder="오늘의 한 줄 은혜" className={`w-full px-3 py-2.5 rounded-lg text-[13px] outline-none border border-indigo-200 dark:border-indigo-800 ${isDarkMode ? 'bg-[#1C1C1E]' : 'bg-white'} ${t.textMain}`} />
                    <input type="text" value={actionItem} onChange={(e) => setActionItem(e.target.value)} placeholder="🎯 오늘의 실천 목표 (트래커 연동)" className={`w-full px-3 py-2.5 rounded-lg text-[13px] font-bold outline-none border border-pink-200 dark:border-pink-900/50 ${isDarkMode ? 'bg-[#1C1C1E]' : 'bg-white'} ${t.textMain}`} />
                 </div>
            </div>

            <button onClick={handleSaveNote} className="w-full py-3.5 bg-[#007AFF] text-white rounded-xl font-bold text-[13px] shadow-sm hover:opacity-90 transition-opacity mt-2">
               저장 및 등록하기
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-6 hide-scrollbar">
          <div className="text-center space-y-1">
            <h2 className={`text-lg font-extrabold ${t.textMain}`}>전체 성경 통독 표</h2>
            <p className="text-xs text-slate-400">장을 클릭하여 읽기/필사 모드로 이동하세요.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {bibles?.map((book) => {
              const bookKo = getKoName(book.name);
              return (
                <div key={book.name} className={`p-3.5 rounded-2xl border ${t.border} ${t.cardBg} shadow-xs space-y-2`}>
                  <span className={`text-xs font-bold ${t.textMain}`}>{bookKo}</span>
                  <div className="flex flex-wrap gap-1">
                    {book.chapters.map((_, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => {
                          setCurrentChapId(`${book.name}-${cIdx + 1}`);
                          setActiveTab('readNote');
                        }}
                        className={`w-6 h-6 rounded-md text-[10px] font-bold border transition-colors ${
                          (bookName === book.name && chapNum === cIdx + 1)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent hover:bg-slate-200'
                        }`}
                      >
                        {cIdx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
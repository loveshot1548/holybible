import React, { useRef, useEffect, useState, useMemo, forwardRef, useImperativeHandle } from 'react';

// 💡 1. 영어 이름을 한글로 자동 번역해주는 마법의 사전
const ENG_TO_KO = {
    "Genesis": "창세기", "Exodus": "출애굽기", "Leviticus": "레위기", "Numbers": "민수기", "Deuteronomy": "신명기",
    "Joshua": "여호수아", "Judges": "사사기", "Ruth": "룻기", "1 Samuel": "사무엘상", "2 Samuel": "사무엘하",
    "1 Kings": "열왕기상", "2 Kings": "열왕기하", "1 Chronicles": "역대상", "2 Chronicles": "역대하",
    "Ezra": "에스라", "Nehemiah": "느헤미야", "Esther": "에스더", "Job": "욥기", "Psalms": "시편", "Psalm": "시편",
    "Proverbs": "잠언", "Ecclesiastes": "전도서", "Song of Solomon": "아가", "Song of Songs": "아가",
    "Isaiah": "이사야", "Jeremiah": "예레미야", "Lamentations": "예레미야애가", "Ezekiel": "에스겔", "Daniel": "다니엘",
    "Hosea": "호세아", "Joel": "요엘", "Amos": "아모스", "Obadiah": "오바댜", "Jonah": "요나",
    "Micah": "미가", "Nahum": "나훔", "Habakkuk": "하박국", "Zephaniah": "스바냐", "Haggai": "학개",
    "Zechariah": "스가랴", "Malachi": "말라기",
    "Matthew": "마태복음", "Mark": "마가복음", "Luke": "누가복음", "John": "요한복음",
    "Acts": "사도행전", "Romans": "로마서", "1 Corinthians": "고린도전서", "2 Corinthians": "고린도후서",
    "Galatians": "갈라디아서", "Ephesians": "에베소서", "Philippians": "빌립보서", "Colossians": "골로새서",
    "1 Thessalonians": "데살로니가전서", "2 Thessalonians": "데살로니가후서",
    "1 Timothy": "디모데전서", "2 Timothy": "디모데후서", "Titus": "디도서", "Philemon": "빌레몬서",
    "Hebrews": "히브리서", "James": "야고보서", "1 Peter": "베드로전서", "2 Peter": "베드로후서",
    "1 John": "요한1서", "2 John": "요한2서", "3 John": "요한3서", "Jude": "유다서", "Revelation": "요한계시록"
};

// 💡 2. 줄임말(창, 롬, 고전 등)을 정식 명칭으로 바꿔주는 사전
const SHORT_TO_FULL = {
    "창": "창세기", "출": "출애굽기", "레": "레위기", "민": "민수기", "신": "신명기",
    "수": "여호수아", "삿": "사사기", "룻": "룻기", "삼상": "사무엘상", "삼하": "사무엘하",
    "왕상": "열왕기상", "왕하": "열왕기하", "대상": "역대상", "대하": "역대하",
    "스": "에스라", "느": "느헤미야", "에": "에스더", "욥": "욥기", "시": "시편",
    "잠": "잠언", "전": "전도서", "아": "아가",
    "사": "이사야", "렘": "예레미야", "애": "예레미야애가", "겔": "에스겔", "단": "다니엘",
    "호": "호세아", "욜": "요엘", "암": "아모스", "옵": "오바댜", "욘": "요나",
    "미": "미가", "나": "나훔", "합": "하박국", "습": "스바냐", "학": "학개",
    "슥": "스가랴", "말": "말라기",
    "마": "마태복음", "막": "마가복음", "눅": "누가복음", "요": "요한복음",
    "행": "사도행전", "롬": "로마서", "고전": "고린도전서", "고후": "고린도후서",
    "갈": "갈라디아서", "엡": "에베소서", "빌": "빌립보서", "골": "골로새서",
    "살전": "데살로니가전서", "살후": "데살로니가후서",
    "딤전": "디모데전서", "딤후": "디모데후서", "딛": "디도서", "몬": "빌레몬서",
    "히": "히브리서", "약": "야고보서", "벧전": "베드로전서", "벧후": "베드로후서",
    "요일": "요한1서", "요이": "요한2서", "요삼": "요한3서", 
    "요한일서": "요한1서", "요한이서": "요한2서", "요한삼서": "요한3서",
    "유": "유다서", "계": "요한계시록"
};

const RichTextEditor = forwardRef(function RichTextEditor({ value = '', onChange = () => {}, placeholder = '', t = {}, isSp = false, bibles = [] }, ref) {
    const editorRef = useRef(null);
    const [popup, setPopup] = useState({ isOpen: false, x: 0, y: 0, results: [], range: null });

    // 부모 컴포넌트의 ref와 내부 editorRef 연결
    useImperativeHandle(ref, () => editorRef.current);

    const flatBibles = useMemo(() => {
        try {
            if (!bibles) return [];
            const flat = [];
            const bArray = Array.isArray(bibles) ? bibles : Object.values(bibles);
            
            bArray.forEach(b => {
                if (!b || !b.chapters || !Array.isArray(b.chapters)) return;
                const bookName = b.ko_name || ENG_TO_KO[b.name] || b.name || '성경';
                
                b.chapters.forEach((c, cIdx) => {
                    if (Array.isArray(c)) {
                        c.forEach((v, vIdx) => {
                            const text = typeof v === 'string' ? v : (v && (v.text || v.content) || '');
                            if (text) flat.push({ book: bookName, chapter: cIdx + 1, verse: vIdx + 1, text });
                        });
                    } else if (typeof c === 'object' && c !== null) {
                        Object.keys(c).forEach(vKey => {
                            const text = typeof c[vKey] === 'string' ? c[vKey] : (c[vKey] && (c[vKey].text || c[vKey].content) || '');
                            if (text) flat.push({ book: bookName, chapter: cIdx + 1, verse: Number(vKey), text });
                        });
                    }
                });
            });
            return flat;
        } catch (err) {
            console.error("성경 데이터 파싱 에러:", err);
            return [];
        }
    }, [bibles]);

    useEffect(() => { 
        const s = value || ''; 
        if (editorRef.current && document.activeElement !== editorRef.current) {
            if (editorRef.current.innerHTML !== s) {
                editorRef.current.innerHTML = s; 
            }
        }
    }, [value]);

    const handleInput = () => { if (editorRef.current) onChange(editorRef.current.innerHTML); };
    const exec = (cmd, val = null) => { document.execCommand(cmd, false, val); editorRef.current.focus(); handleInput(); };

    const handleKeyUp = (e) => {
        if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') {
            checkBibleMatch();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') setPopup(p => ({ ...p, isOpen: false }));
    };

    const checkBibleMatch = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        const node = range.startContainer;

        if (node.nodeType !== Node.TEXT_NODE) return;

        const textBeforeCaret = node.textContent.slice(0, range.startOffset);
        const phrases = textBeforeCaret.split(/[.?!,\n\t]/);
        const lastPhrase = phrases[phrases.length - 1]; 
        
        if (!lastPhrase || lastPhrase.trim().length < 2) {
            setPopup(p => ({ ...p, isOpen: false }));
            return;
        }

        const refRegex = /([가-힣0-9\s]+)\s*(\d+)[장편:\-]\s*(\d+)(?:\s*[-~]\s*(\d+))?절?\s*$/;
        const refMatch = lastPhrase.match(refRegex);

        let matchedResults = [];
        let matchLength = 0;

        if (refMatch) {
            const rawBook = refMatch[1].replace(/\s+/g, '');
            const searchBook = SHORT_TO_FULL[rawBook] || rawBook;
            const chap = parseInt(refMatch[2], 10);
            const startVerse = parseInt(refMatch[3], 10);
            const endVerse = refMatch[4] ? parseInt(refMatch[4], 10) : startVerse;
            matchLength = refMatch[0].length; 
            
            matchedResults = flatBibles.filter(v => 
                v.book.replace(/\s+/g,'').includes(searchBook) && 
                v.chapter === chap && 
                v.verse >= startVerse && 
                v.verse <= endVerse
            );
        } else {
            const cleanPhrase = lastPhrase.replace(/\s+/g, ''); 
            if (cleanPhrase.length >= 3) { 
                matchedResults = flatBibles.filter(v => 
                    v.text.replace(/\s+/g, '').includes(cleanPhrase)
                );
                matchLength = lastPhrase.length;
            }
        }

        if (matchedResults.length > 0) {
            const rect = range.getBoundingClientRect();
            const editorRect = editorRef.current.getBoundingClientRect();
            
            const replaceRange = document.createRange();
            replaceRange.setStart(node, Math.max(0, range.startOffset - matchLength));
            replaceRange.setEnd(node, range.startOffset);
            
            let popX = rect.left - editorRect.left;
            let popY = rect.bottom - editorRect.top + 10;
            if (popX + 300 > editorRect.width) popX = editorRect.width - 320;
            if (popX < 0) popX = 10;

            setPopup({
                isOpen: true,
                x: popX,
                y: popY,
                results: matchedResults.slice(0, 15),
                range: replaceRange
            });
        } else {
            setPopup(p => ({ ...p, isOpen: false }));
        }
    };

   const insertVerse = (verseData) => {
        if (popup.range) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(popup.range);
            
            // 💡 외부 CSS 및 블록 레이아웃의 간섭을 완전히 차단하기 위해 display:inline 과 clear 스타일을 직접 주입
            const html = `<span style="display:inline !important; background:rgba(0,122,255,0.06) !important; padding:1px 4px !important; border-radius:4px !important; margin:0 2px !important;"><strong contenteditable="false" style="display:inline !important; color:#007AFF !important; font-size:0.85em !important; user-select:none !important; margin-right:4px !important;">[${verseData.book} ${verseData.chapter}:${verseData.verse}]</strong><span style="display:inline !important;">${verseData.text}</span></span> `;
            
            document.execCommand('insertHTML', false, html);
            setPopup({ isOpen: false, x: 0, y: 0, results: [], range: null });
            handleInput();
        }
    };
    
    return(
        // 💡 핵심 수정: 바깥쪽 패딩(기존 p-5)을 대폭 줄여서(p-2 또는 p-3) 불필요한 외곽 여백과 공간 낭비를 없앰
        <div className={`flex flex-col border rounded-xl overflow-hidden w-full relative ${isSp ? 'bg-white/90 border-white/40' : `${t?.appBg || ''} ${t?.border || ''}`} shadow-inner min-h-[300px] h-full`}>
            
            <div className={`flex flex-wrap gap-1 px-2 py-1.5 border-b ${isSp ? 'border-white/40 bg-white/50' : `${t?.border || ''} ${t?.cardBg || ''}`} items-center sticky top-0 z-10`}>
                <button onClick={()=>exec('bold')} className={`px-2 py-1 font-extrabold rounded ${t?.textMain || ''} hover:bg-black/5 text-xs`}>B</button>
                <button onClick={()=>exec('underline')} className={`px-2 py-1 underline font-bold rounded ${t?.textMain || ''} hover:bg-black/5 text-xs`}>U</button>
                <select onChange={(e)=>exec('fontSize', e.target.value)} className={`px-2 py-1 text-xs font-bold rounded border outline-none ${t?.inputBg || ''} ${t?.textMain || ''}`}><option value="3">본문</option><option value="6">제목</option></select>
            </div>
            
            <div 
                ref={editorRef} 
                contentEditable={true} 
                onInput={handleInput} 
                onKeyUp={handleKeyUp} 
                onKeyDown={handleKeyDown} 
                className={`p-3 flex-1 outline-none text-[15px] overflow-y-auto ${isSp?'text-slate-800':(t?.textMain || '')} break-words note-lines`} 
                placeholder={placeholder} 
                style={{ minHeight: '300px' }} 
            />

            {popup.isOpen && popup.results.length > 0 && (
                <div 
                    className="absolute z-[999] bg-white dark:bg-[#2C2C2E] shadow-2xl border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-w-[320px] w-full flex flex-col"
                    style={{ top: popup.y, left: popup.x, maxHeight: '250px' }}
                >
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800 flex justify-between items-center">
                        <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">📖 발견된 말씀 (클릭 시 삽입)</span>
                        <button onClick={() => setPopup(p => ({ ...p, isOpen: false }))} className="text-slate-400 hover:text-red-500 font-bold text-sm px-1">&times;</button>
                    </div>
                    <div className="overflow-y-auto flex-1 p-1">
                        {popup.results.map((r, i) => (
                            <button 
                                key={i} 
                                onClick={(e) => { e.preventDefault(); insertVerse(r); }} 
                                className="w-full text-left p-2 hover:bg-slate-100 dark:hover:bg-black/20 cursor-pointer text-[13px] border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
                            >
                                <span className="font-extrabold text-blue-500 block mb-0.5">[{r.book} {r.chapter}:${r.verse}]</span> 
                                <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{r.text}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});

export default RichTextEditor;
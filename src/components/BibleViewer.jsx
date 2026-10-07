import React, { useState, useEffect } from 'react';
import { useBible } from '../context/BibleContext';
import VersePopup from './components/VersePopup';

function BibleViewer() {
  const { bibleData, setBibleData, searchResults, performSearch } = useBible();
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState(null);
  const [isSermonOpen, setIsSermonOpen] = useState(false);
  // 뷰어 상태
  const [testament, setTestament] = useState('ot');
  const [book, setBook] = useState('');
  const [chapter, setChapter] = useState('');
  const [verse, setVerse] = useState('');
  const [query, setQuery] = useState('');

  // 1. 데이터 로딩
  useEffect(() => {
    const fetchBibleData = async () => {
      try {
        const [otResponse, ntResponse] = await Promise.all([
          fetch('/data/ot_parsed.json'),
          fetch('/data/nt_parsed.json')
        ]);
        const ot = await otResponse.json();
        const nt = await ntResponse.json();
        
        setBibleData({ ot, nt });
        
        // 초기값 설정
        const firstBook = Object.keys(ot)[0];
        setBook(firstBook);
        setChapter(Object.keys(ot[firstBook])[0]);
        setVerse(Object.keys(ot[firstBook][Object.keys(ot[firstBook])[0]])[0]);
        setLoading(false);
      } catch (err) {
        console.error("데이터 로딩 실패:", err);
        setLoading(false);
      }
    };
    fetchBibleData();
  }, [setBibleData]);

  // 데이터 접근용 변수
  const currentData = bibleData[testament] || {};
  const books = Object.keys(currentData);
  const chapters = (book && currentData[book]) ? Object.keys(currentData[book]) : [];
  const verses = (chapter && currentData[book] && currentData[book][chapter]) ? Object.keys(currentData[book][chapter]) : [];
  const wordsToRender = (book && chapter && verse && currentData[book][chapter][verse]) ? currentData[book][chapter][verse] : [];

  if (loading) return <div>성경 데이터를 불러오는 중입니다...</div>;

  return (
    <div style={styles.container}>
      {/* 상단 컨트롤바 */}
      <header style={styles.header}>
        <div style={styles.topRow}>
          <h1 style={styles.title}>Blossom Bible Study</h1>
          <div style={styles.searchContainer}>
            // BibleViewer.jsx 헤더 부분 수정
<input 
  type="text" 
  placeholder="단어 검색 후 엔터를 누르세요..." 
  value={query}
  onChange={(e) => setQuery(e.target.value)} // 글자만 입력받음
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      performSearch(query); // 엔터 쳤을 때만 검색 실행
    }
  }}
  style={styles.searchInput}
/>
            {searchResults.length > 0 && (
              <div style={styles.resultsDropdown}>
                {searchResults.map((res, i) => (
                  <div key={i} style={styles.resultItem} onClick={() => alert(`${res.book} ${res.chapter}장으로 이동합니다.`)}>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>{res.book} {res.chapter}:{res.verse}</span>
                    <p style={{ margin: '5px 0' }}>{res.fullVerse.substring(0, 40)}...</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={styles.navBar}>
          <select style={styles.select} value={testament} onChange={(e) => { setTestament(e.target.value); setBook(Object.keys(bibleData[e.target.value])[0]); }}>
            <option value="ot">구약 (OT)</option>
            <option value="nt">신약 (NT)</option>
          </select>
          <select style={styles.select} value={book} onChange={(e) => setBook(e.target.value)}>{books.map(b => <option key={b} value={b}>{b}</option>)}</select>
          <select style={styles.select} value={chapter} onChange={(e) => setChapter(e.target.value)}>{chapters.map(c => <option key={c} value={c}>{c}장</option>)}</select>
          <select style={styles.select} value={verse} onChange={(e) => setVerse(e.target.value)}>{verses.map(v => <option key={v} value={v}>{v}절</option>)}</select>
        </div>
      </header>

      {/* 본문 */}
      <main style={styles.bibleContainer}>
        <div style={styles.textWrapper}>
          {wordsToRender.map((word, index) => (
            <span 
              key={index}
              onClick={() => setSelectedWord(word)}
              style={styles.wordItem}
            >
              {word.text}
            </span>
          ))}
        </div>
      </main>

      {/* 모달 */}
      {selectedWord && (
        <div style={styles.modalOverlay} onClick={() => setSelectedWord(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>{selectedWord.text}</h2>
            <div style={styles.modalBody}>
              <p><strong>Strong:</strong> {selectedWord.strong}</p>
              <p><strong>Meaning:</strong> {selectedWord.meaning}</p>
              <p><strong>Morphology:</strong> {selectedWord.morph}</p>
            </div>
            <button style={styles.closeBtn} onClick={() => setSelectedWord(null)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '900px', margin: '40px auto', padding: '0 20px', fontFamily: "'Noto Serif KR', serif" },
  header: { marginBottom: '40px', borderBottom: '1px solid #eee', paddingBottom: '20px' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { fontSize: '1.5rem', color: '#2c3e50', margin: 0 },
  searchContainer: { position: 'relative', width: '300px' },
  searchInput: { width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd' },
  resultsDropdown: { position: 'absolute', top: '110%', left: 0, width: '100%', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '5px', maxHeight: '300px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  resultItem: { padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer' },
  navBar: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  select: { padding: '8px 12px', borderRadius: '5px', border: '1px solid #ddd', cursor: 'pointer' },
  bibleContainer: { backgroundColor: '#fdfcf8', padding: '40px', borderRadius: '15px', border: '1px solid #eceae0', minHeight: '300px' },
  textWrapper: { fontSize: '1.8rem', lineHeight: '2.2', textAlign: 'left' },
  wordItem: { cursor: 'pointer', margin: '0 4px', color: '#333', transition: 'color 0.2s', padding: '2px 4px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
  modalBody: { textAlign: 'left', lineHeight: '1.6' },
  closeBtn: { width: '100%', marginTop: '20px', padding: '10px', cursor: 'pointer', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px' }
};

export default BibleViewer;
import React, { createContext, useState, useContext } from 'react';

const BibleContext = createContext();

export const BibleProvider = ({ children }) => {
  const [bibleData, setBibleData] = useState({ ot: {}, nt: {} });
  const [searchResults, setSearchResults] = useState([]);

  const performSearch = (query) => {
    if (!query || query.length < 1) {
      setSearchResults([]);
      return;
    }

    const results = [];
    
    // 데이터 구조에 따라 검색 로직을 순회합니다
    const searchIn = (testament, book, chapter, verse, words) => {
      words.forEach((word, index) => {
        const searchText = word.text ? word.text.toLowerCase() : "";
        const searchMeaning = word.meaning ? word.meaning.toLowerCase() : "";
        const queryLower = query.toLowerCase();

        if (searchText.includes(queryLower) || searchMeaning.includes(queryLower)) {
          results.push({ 
            testament, book, chapter, verse, 
            text: word.text, 
            meaning: word.meaning,
            fullVerse: words.map(w => w.text).join(' ') 
          });
        }
      });
    };

    Object.keys(bibleData).forEach(testament => {
      if (!bibleData[testament]) return;
      Object.keys(bibleData[testament]).forEach(book => {
        Object.keys(bibleData[testament][book]).forEach(chapter => {
          Object.keys(bibleData[testament][book][chapter]).forEach(verse => {
            searchIn(testament, book, chapter, verse, bibleData[testament][book][chapter][verse]);
          });
        });
      });
    });

    setSearchResults(results.slice(0, 20));
  };

  // return 문이 BibleProvider 함수 안에 잘 들어와 있는지 확인하세요!
  return (
    <BibleContext.Provider value={{ bibleData, setBibleData, searchResults, performSearch }}>
      {children}
    </BibleContext.Provider>
  );
}; // <-- 여기가 BibleProvider 함수를 닫는 곳입니다.

export const useBible = () => useContext(BibleContext);
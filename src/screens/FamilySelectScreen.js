import React from 'react';
import { SubPageHeader } from '../components/Shared';
import { SmileFaceIcon, HeartIcon } from '../utils/icons';

export default function FamilySelectScreen({ t, setActiveScreen, isSidebarOpen, setIsSidebarOpen }) {
  return (
    // justify-center를 빼서 상단바가 위로 딱 붙게 수정
    <div className={`flex-1 flex flex-col h-full ${t.pageBg} animate-fade-in-up`}>
      <SubPageHeader 
        title="가정 예배 준비" 
        onBack={() => setActiveScreen('home')} 
        t={t} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      
      {/* 내용물만 화면 중앙에 위치하도록 별도의 div로 감싸기 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 w-full max-w-sm mx-auto pb-20">
          <div onClick={() => setActiveScreen('familyPublic')} className={`${t.cardBg} w-full p-8 rounded-3xl cursor-pointer shadow-lg border ${t.border} flex flex-col items-center justify-center hover:-translate-y-2 transition-transform`}>
            <SmileFaceIcon className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className={`text-lg font-black ${t.textMain}`}>공개 가정예배</h3>
          </div>
          
          <div onClick={() => setActiveScreen('familyPrivateLogin')} className={`${t.cardBg} w-full p-8 rounded-3xl cursor-pointer shadow-lg border ${t.border} flex flex-col items-center justify-center hover:-translate-y-2 transition-transform`}>
            <HeartIcon className="w-12 h-12 text-pink-500 mb-4" />
            <h3 className={`text-lg font-black ${t.textMain}`}>우리 가족 가정예배</h3>
          </div>
      </div>
    </div>
  );
}
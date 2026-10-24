import React from 'react';
import { SubPageHeader } from '../components/Shared';

export default function BoardScreen({
  t, setActiveScreen, isSidebarOpen, setIsSidebarOpen,
  boardPosts, newPostText, setNewPostText, isLoadingPosts, handleAddPost
}) {
  return (
    <div className={`flex-1 flex flex-col h-full ${t.pageBg} animate-fade-in-up`}>
      <SubPageHeader title="나눔 게시판" onBack={() => setActiveScreen('home')} t={t} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex-1 overflow-y-auto p-5 pb-40 space-y-4">
        <div className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm`}>
           <h3 className={`font-extrabold text-sm mb-3 ${t.textMain}`}>📝 말씀 묵상 / 나눔 작성</h3>
           <textarea value={newPostText} onChange={e=>setNewPostText(e.target.value)} className={`w-full p-4 rounded-xl ${t.inputBg} ${t.textMain} border outline-none resize-none h-24`} placeholder="함께 나눌 은혜나 기도제목을 적어보세요..." />
           <button onClick={handleAddPost} className="w-full mt-3 h-12 bg-blue-500 text-white font-bold rounded-xl shadow-md hover:bg-blue-600">등록하기</button>
        </div>
        <div className="space-y-4 mt-6">
          {isLoadingPosts ? <div className={`text-center py-10 ${t.textSub}`}>불러오는 중...</div> :
           boardPosts.length === 0 ? <div className={`text-center py-10 ${t.textSub}`}>아직 작성된 글이 없습니다.</div> :
           boardPosts.map(post => (
             <div key={post.id} className={`${t.cardBg} p-5 rounded-2xl border ${t.border} shadow-sm`}>
               <div className="flex justify-between items-center mb-2"><span className={`text-[10px] font-bold ${t.textSub}`}>{new Date(post.created_at).toLocaleString()}</span></div>
               <p className={`text-sm ${t.textMain} leading-relaxed whitespace-pre-wrap`}>{post.content}</p>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
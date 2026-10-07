import React from 'react';

export default function SubPageHeader({ title, onBack, t, isSp=false, spTitle="", spDesc="", toggleSidebar }) {
  return (
    <div className={`${t.cardBg} px-5 py-4 z-30 shrink-0 flex items-center gap-3 relative border-b ${t.border} shadow-sm`}>
      <button onClick={toggleSidebar} className={`p-1 text-2xl mr-1 hover:text-blue-500 transition-colors ${t.textMain}`}>☰</button>
      <button onClick={onBack} className={`${t.textMain} text-2xl font-black p-1 hover:-translate-x-1 transition-transform pointer-events-auto`}>&larr;</button>
      <div className="flex flex-col">
        <h1 className={`text-lg font-extrabold ${t.textMain} tracking-tight`}>{isSp ? spTitle : title}</h1>
        {isSp && <p className="text-[11px] text-blue-400 font-semibold leading-none mt-0.5">{spDesc}</p>}
      </div>
    </div>
  );
}
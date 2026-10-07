// src/components/Icons.js
import React from 'react';

const S = (p, d) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p} dangerouslySetInnerHTML={{__html:d}}/>
);

export const BibleIcon = ({isDark, ...p}) => S(p,'<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M12 7v6M9 10h6"/>');
export const YoutubeIcon = ({isDark, ...p}) => S(p,'<rect x="2" y="5" width="20" height="14" rx="4"/><polygon points="10 9 15 12 10 15 10 9"/>');
export const DiaryIcon = ({isDark, ...p}) => S(p,'<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19v20H6.5a2.5 2.5 0 0 1 0-5H19"/><rect x="13" y="10" width="4" height="4" rx="1"/>');
export const NotebookIcon = ({isDark, ...p}) => S(p,'<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z"/><path d="M4 8h16M4 12h16M4 16h16"/>');
export const PrayingHandsIcon = ({isDark, ...p}) => S(p,'<path d="M12 4L9 8v9M12 4l3 4v9M9 17l-3 3M15 17l3 3"/><line x1="12" y1="4" x2="12" y2="17"/>');
export const ChurchIcon = ({isDark, ...p}) => S(p,'<path d="M12 2v5M9 4h6M4 22V10l8-4 8 4v12M10 22v-6h4v6M4 14h16"/>');
export const ReportIcon = ({isDark, ...p}) => S(p,'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M16 13H8M16 17H8"/>');
export const FireIcon = ({isDark, ...p}) => S(p,'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>');
export const HeartIcon = ({isDark, ...p}) => S(p,'<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>');
export const UserFaceIcon = ({isDark, ...p}) => S(p,'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>');
export const SmileFaceIcon = ({isDark, ...p}) => S(p,'<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>');
export const BoardIcon = ({isDark, ...p}) => S(p,'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>');
export const HeadphonesIcon = ({isDark, ...p}) => S(p,'<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>');
export const SunIcon = ({isDark, ...p}) => S(p,'<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>');
export const MoonIcon = ({isDark, ...p}) => S(p,'<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>');
export const SunflowerIcon = ({isDark, ...p}) => S(p,'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/>');
export const MicIcon = ({isDark, ...p}) => S(p,'<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/>');
export const MenuIcon = ({isDark, ...p}) => S(p,'<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>');
export const MapIcon = ({isDark, ...p}) => S(p,'<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>');
export const SearchIcon = ({isDark, ...p}) => S(p,'<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>');

export const getSvgUri = (path, w=24, h=24) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`)}`;
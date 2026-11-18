import React from 'react';

const iconMap = {
  "flame": <path d="M12 3 C10 7 15 8 13 12 C12 14 9 14 9 11 C5 15 4 18 6 21 C8 24 15 24 18 21 C22 17 19 12 17 9 C17 12 15 13 15 9 C15 6 13 4 12 3 Z" />,
  "book-open": <path d="M3 5 Q8 3 12 6 Q16 3 21 5 L21 20 Q16 18 12 21 Q8 18 3 20 Z M12 6 V21" />,
  "bible": <path d="M5 3 H17 L20 6 V21 H5 Q3 20 3 18 V5 Q3 3 5 3 Z M8 9 H16 M12 6 V12 M7 16 H16" />,
  "cross": <path d="M12 3 V21 M5 9 H19" />,
  "prayer-hands": <path d="M7 13 L4 10 Q2 8 4 6 L9 11 M17 13 L20 10 Q22 8 20 6 L15 11 M9 12 L12 9 L15 12 L18 15 Q19 17 17 19 L12 22 L7 19 Q5 17 7 15 Z" />,
  "heart": <path d="M12 21 C9 18 3 13 3 8.5 C3 4 8 3 12 7 C16 3 21 4 21 8.5 C21 13 15 18 12 21 Z" />,
  "heart-double": <path d="M8 20 C5 17 1 13 1 9 C1 5 5 4 8 7 C11 4 15 5 15 9 C15 12 11 17 8 20 Z M16 7 C18 5 21 6 22 8 C23 12 19 16 17 18" />,
  "people": <path d="M8 11 A3.5 3.5 0 1 0 8 4 A3.5 3.5 0 0 0 8 11 Z M17 10 A3 3 0 1 0 17 4 M2 21 Q2 15 8 15 Q14 15 14 21 M15 15 Q21 14 22 20" />,
  "user": <path d="M12 11 A4 4 0 1 0 12 3 A4 4 0 0 0 12 11 Z M4 21 Q4 15 12 15 Q20 15 20 21" />,
  "church": <path d="M3 21 V10 L12 3 L21 10 V21 Z M9 21 V15 H15 V21 M12 6 V10 M10 8 H14" />,
  "home": <path d="M3 11 L12 3 L21 11 V21 H5 V11 M9 21 V15 H15 V21" />,
  "calendar": <path d="M4 5 H20 V21 H4 Z M8 3 V7 M16 3 V7 M4 10 H20 M8 13 H10 M13 13 H15 M8 17 H10" />,
  "clock": <path d="M12 3 A9 9 0 1 0 12 21 A9 9 0 0 0 12 3 Z M12 6 V12 L16 14" />,
  "bell": <path d="M5 17 H19 L17 14 V9 A5 5 0 0 0 7 9 V14 Z M10 20 Q12 22 14 20" />,
  "message": <path d="M4 4 H20 V16 H11 L6 20 V16 H4 Z M8 8 H16 M8 12 H14" />,
  "mail": <path d="M3 6 H21 V19 H3 Z M3 7 L12 14 L21 7" />,
  "pencil": <path d="M4 20 L8 19 L19 8 L16 5 L5 16 Z M14 7 L17 10" />,
  "notebook": <path d="M5 3 H19 V21 H5 Z M8 7 H16 M8 11 H16 M8 15 H14 M3 6 V18" />,
  "clipboard": <path d="M8 4 H16 V7 H19 V21 H5 V7 H8 Z M9 11 H15 M9 15 H15" />,
  "bookmark": <path d="M6 3 H18 V21 L12 17 L6 21 Z" />,
  "folder": <path d="M3 7 H10 L12 9 H21 V20 H3 Z M3 7 V5 H10 L12 7" />,
  "search": <path d="M10 3 A7 7 0 1 0 10 17 A7 7 0 0 0 10 3 Z M15 15 L21 21" />,
  "settings": <path d="M12 8 A4 4 0 1 0 12 16 A4 4 0 0 0 12 8 Z M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22 M5 5 L7 7 M17 17 L19 19 M5 19 L7 17 M17 7 L19 5" />,
  "sliders": <path d="M4 6 H20 M4 12 H20 M4 18 H20 M8 4 V8 M15 10 V14 M11 16 V20" />,
  "chart": <path d="M4 20 V4 M4 20 H21 M8 16 V11 M13 16 V7 M18 16 V4" />,
  "pie-chart": <path d="M12 3 A9 9 0 1 0 21 12 H12 Z M15 3.5 A8 8 0 0 1 20.5 9 H15 Z" />,
  "user-add": <path d="M9 11 A4 4 0 1 0 9 3 A4 4 0 0 0 9 11 Z M2 21 Q2 15 9 15 Q14 15 15 18 M18 8 V14 M15 11 H21" />,
  "group": <path d="M8 11 A3.5 3.5 0 1 0 8 4 A3.5 3.5 0 0 0 8 11 Z M17 10 A3 3 0 1 0 17 4 M2 21 Q2 15 8 15 Q14 15 14 21 M15 15 Q21 15 22 20" />,
  "shield": <path d="M12 3 L20 6 V12 Q19 18 12 21 Q5 18 4 12 V6 Z M8 12 L11 15 L16 9" />,
  "lock": <path d="M5 10 H19 V21 H5 Z M8 10 V7 A4 4 0 0 1 16 7 V10 M12 14 V17" />,
  "pin": <path d="M12 21 Q4 13 5 8 A7 7 0 1 1 19 8 Q20 13 12 21 Z M12 8 A2 2 0 1 0 12 12 A2 2 0 0 0 12 8 Z" />,
  "globe": <path d="M12 3 A9 9 0 1 0 12 21 A9 9 0 0 0 12 3 Z M3 12 H21 M12 3 Q7 7 7 12 Q7 17 12 21 M12 3 Q17 7 17 12 Q17 17 12 21" />,
  "share": <path d="M6 12 L18 5 M6 12 L18 19 M5 15 A3 3 0 1 0 5 9 A3 3 0 0 0 5 15 Z M19 8 A3 3 0 1 0 19 2 A3 3 0 0 0 19 8 Z M19 22 A3 3 0 1 0 19 16 A3 3 0 0 0 19 22 Z" />,
  "external-link": <path d="M4 8 V20 H16 V16 M10 4 H20 V14 M20 4 L10 14" />,
  "download": <path d="M12 3 V16 M7 11 L12 16 L17 11 M4 18 V21 H20 V18" />,
  "upload": <path d="M12 17 V4 M7 9 L12 4 L17 9 M4 18 V21 H20 V18" />,
  "trash": <path d="M5 7 H19 M9 7 V4 H15 V7 M7 7 L8 20 H16 L17 7 M10 10 V17 M14 10 V17" />,
  "star": <path d="M12 3 L14.7 8.5 L21 9.4 L16.5 13.8 L17.6 20 L12 17 L6.4 20 L7.5 13.8 L3 9.4 L9.3 8.5 Z" />,
  "heart-plus": <path d="M12 20 C9 17 3 12 3 8 C3 4 8 3 12 7 C16 3 21 4 21 8 C21 11 18 15 15 17 M17 17 V22 M14.5 19.5 H19.5" />,
  "trophy": <path d="M7 4 H17 V10 Q17 15 12 15 Q7 15 7 10 Z M7 7 H3 V9 Q3 13 8 13 M17 7 H21 V9 Q21 13 16 13 M12 15 V19 M8 21 H16 M9 19 H15" />,
  "gift": <path d="M4 10 H20 V21 H4 Z M3 7 H21 V10 H3 Z M12 7 V21 M12 7 C8 7 5 6 6 4 C7 2 10 4 12 7 C14 4 17 2 18 4 C19 6 16 7 12 7" />,
  "sprout": <path d="M12 21 V12 M12 12 Q6 12 4 6 Q10 4 12 12 Q14 5 20 5 Q19 11 12 12 M12 16 Q7 15 6 12" />,
  "leaf": <path d="M4 20 Q4 5 20 4 Q20 19 4 20 Z M4 20 L14 10" />,
  "microphone": <path d="M9 4 A3 3 0 0 1 15 4 V12 A3 3 0 0 1 9 12 Z M5 10 V12 A7 7 0 0 0 19 12 V10 M12 19 V22 M8 22 H16" />,
  "compass": <path d="M12 3 A9 9 0 1 0 12 21 A9 9 0 0 0 12 3 Z M15 8 L9 15 L15 8 Z M9 15 L15 8" />,
  "check": <path d="M4 12 L9 17 L20 6" />,
  "hand-heart": <path d="M3 14 L7 12 L10 14 H14 Q16 14 16 16 Q16 18 14 18 H9 L7 17 M11 12 C9 10 7 8 7 6 C7 4 10 4 11 6 C13 4 15 5 15 7 C15 9 13 11 11 12" />,
  "church-home": <path d="M3 21 V10 L12 3 L21 10 V21 Z M9 21 V15 H15 V21 M12 6 V10 M10 8 H14" />,
};

export default function SketchIcon({ name, size = 32, color = 'currentColor', strokeWidth = 2.35, className, style = {} }) {
  const shape = iconMap[name];
  if (!shape) return null;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{display:'inline-block',verticalAlign:'middle',...style}} role="img" aria-label={name}>
      {React.cloneElement(shape, {opacity: .96})}
    </svg>
  );
}
export { iconMap };

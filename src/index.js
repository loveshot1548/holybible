import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// React 앱을 HTML 화면에 연결해 주는 핵심 코드입니다.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
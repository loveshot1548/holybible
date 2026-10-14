// src/pages/BibleKnowledgeGalaxy.js
import React, { useState, useEffect, useRef, useCallback } from 'react';

// =====================================================================
// 🎨 테마 팔레트 (스크린샷 우측 테마 셀렉터 매칭)
// =====================================================================
const GALAXY_THEMES = {
  oceano: {
    id: 'oceano',
    name: 'Oceano (딥 네이비)',
    bg: '#060A13',
    coreGlow: 'rgba(56, 189, 248, 0.35)',
    orbitLine: 'rgba(56, 189, 248, 0.12)',
    textMain: '#F0F9FF',
    textSub: '#7DD3FC',
    panelBg: 'rgba(12, 19, 34, 0.88)',
    panelBorder: 'rgba(56, 189, 248, 0.25)'
  },
  neon: {
    id: 'neon',
    name: 'Neon Cyber (사이버)',
    bg: '#050508',
    coreGlow: 'rgba(236, 72, 153, 0.4)',
    orbitLine: 'rgba(244, 114, 182, 0.15)',
    textMain: '#FDF2F8',
    textSub: '#F472B6',
    panelBg: 'rgba(20, 10, 25, 0.9)',
    panelBorder: 'rgba(236, 72, 153, 0.3)'
  },
  traktor: {
    id: 'traktor',
    name: 'Metálico (골드 앰버)',
    bg: '#0A0806',
    coreGlow: 'rgba(245, 158, 11, 0.35)',
    orbitLine: 'rgba(245, 158, 11, 0.12)',
    textMain: '#FFFBEB',
    textSub: '#FCD34D',
    panelBg: 'rgba(25, 18, 12, 0.9)',
    panelBorder: 'rgba(245, 158, 11, 0.3)'
  }
};

export default function BibleKnowledgeGalaxy({ setActiveScreen }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // 1. 은하계 데이터 상태
  const [galaxyData, setGalaxyData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 2. 궤도 파라미터 (스크린샷 우측 슬라이더 컨트롤러)
  const [rotationSpeed, setRotationSpeed] = useState(0.2); // 회전 속도
  const [orbitSpacing, setOrbitSpacing] = useState(1.0);  // 궤도 간격 배율
  const [nodeScale, setNodeScale] = useState(1.0);       // 노드 크기 배율
  const [currentTheme, setCurrentTheme] = useState('oceano');

  // 3. 카메라 조작 (팬 & 줌)
  const cameraRef = useRef({ x: 0, y: 0, zoom: 0.95 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const globalRotationRef = useRef(0);

  // 데이터 로드
  useEffect(() => {
    fetch('/data/bible_knowledge_galaxy.json')
      .then(res => res.json())
      .then(data => setGalaxyData(data))
      .catch(() => {
        console.warn('은하계 데이터 로드 실패');
      });
  }, []);

  const theme = GALAXY_THEMES[currentTheme] || GALAXY_THEMES.oceano;

  // 60FPS 캔버스 렌더링 루프
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !galaxyData) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      // 1. 배경 클리어
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, width, height);

      // 2. 카메라 변환 적용
      ctx.save();
      ctx.translate(width / 2 + cameraRef.current.x, height / 2 + cameraRef.current.y);
      ctx.scale(cameraRef.current.zoom, cameraRef.current.zoom);

      // 회전 각도 갱신
      globalRotationRef.current += (rotationSpeed * 0.003);
      const rot = globalRotationRef.current;

      // 3. 동심원 궤도 가이드 링 그리기 (4대 동심원)
      const ORBITS = [140, 260, 390, 490].map(r => r * orbitSpacing);
      ORBITS.forEach((r, idx) => {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = theme.orbitLine;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 궤도 라벨
        ctx.font = '9px monospace';
        ctx.fillStyle = theme.textSub;
        ctx.globalAlpha = 0.35;
        ctx.fillText(`ORBIT ${idx + 1} • R${Math.round(r)}`, 10, -r + 12);
        ctx.globalAlpha = 1.0;
      });

      // 4. 노드 극좌표 ➔ 직교좌표(x, y) 실시간 계산
      const nodePosMap = new Map();
      galaxyData.nodes.forEach(node => {
        const adjustedRadius = node.radius * orbitSpacing;
        // 코어(level 0)는 회전하지 않고, 외곽 노드들만 은은하게 공전
        const angleRad = ((node.angle + (node.level > 0 ? (rot * 180 / Math.PI * (1 / Math.sqrt(node.level))) : 0)) * Math.PI) / 180;
        const nx = adjustedRadius * Math.cos(angleRad);
        const ny = adjustedRadius * Math.sin(angleRad);
        nodePosMap.set(node.id, { x: nx, y: ny, ...node });
      });

      // 5. 연결선 (Links) 렌더링
      galaxyData.links.forEach(link => {
        const src = nodePosMap.get(link.source);
        const tgt = nodePosMap.get(link.target);
        if (!src || !tgt) return;

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);

        // 부드러운 베지에 곡선으로 은하 성간 필라멘트 표현
        const midX = (src.x + tgt.x) / 2;
        const midY = (src.y + tgt.y) / 2;
        ctx.quadraticCurveTo(midX * 0.85, midY * 0.85, tgt.x, tgt.y);

        ctx.strokeStyle = link.color || theme.orbitLine;
        ctx.globalAlpha = link.alpha || 0.2;
        ctx.lineWidth = link.dashed ? 0.8 : 1.2;
        if (link.dashed) ctx.setLineDash([2, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;
      });

      // 6. 노드 (Particles & Auras) 렌더링
      const isSearchActive = searchQuery.trim().length > 0;
      const lowerQuery = searchQuery.toLowerCase().trim();

      nodePosMap.forEach(node => {
        const isMatched = isSearchActive && (
          node.label.toLowerCase().includes(lowerQuery) ||
          (node.summary && node.summary.toLowerCase().includes(lowerQuery)) ||
          (node.ref && node.ref.toLowerCase().includes(lowerQuery))
        );
        const isSelected = selectedNode?.id === node.id;
        const effectiveSize = (node.size || 10) * nodeScale * (isMatched ? 1.4 : isSelected ? 1.3 : 1.0);

        // 외곽 오라 글로우 (Glow)
        ctx.beginPath();
        ctx.arc(node.x, node.y, effectiveSize * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = node.color || '#38BDF8';
        ctx.globalAlpha = isMatched ? 0.6 : isSelected ? 0.5 : 0.15;
        ctx.fill();

        // 노드 본체 원형
        ctx.beginPath();
        ctx.arc(node.x, node.y, effectiveSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = isMatched ? '#FDE047' : (node.color || '#FFFFFF');
        ctx.globalAlpha = isSearchActive && !isMatched ? 0.25 : 1.0;
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#FFFFFF' : '#000000';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // 노드 라벨 텍스트 (레벨 0~2이거나, 검색 매칭되거나, 선택된 노드만 표시)
        if (node.level <= 2 || isMatched || isSelected || cameraRef.current.zoom > 1.4) {
          ctx.font = `${node.level === 0 ? 'bold 12px' : node.level === 1 ? 'bold 10px' : '9px'} sans-serif`;
          ctx.fillStyle = isMatched ? '#FDE047' : isSelected ? '#FFFFFF' : theme.textMain;
          ctx.textAlign = 'center';
          ctx.fillText(node.label, node.x, node.y + effectiveSize / 2 + 10);
        }
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [galaxyData, rotationSpeed, orbitSpacing, nodeScale, currentTheme, searchQuery, selectedNode, theme]);

  // 리사이즈 처리
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // 마우스/터치 드래그 & 휠 줌
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    cameraRef.current.zoom = Math.min(3.5, Math.max(0.4, cameraRef.current.zoom * zoomFactor));
  };

  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    cameraRef.current.x += dx / cameraRef.current.zoom;
    cameraRef.current.y += dy / cameraRef.current.zoom;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e) => {
    isDraggingRef.current = false;

    // 클릭 판정: 드래그가 거의 없었으면 노드 선택 체크
    const canvas = canvasRef.current;
    if (!canvas || !galaxyData) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    // 월드 좌표 역산
    const worldX = (clickX - (width / 2 + cameraRef.current.x)) / cameraRef.current.zoom;
    const worldY = (clickY - (height / 2 + cameraRef.current.y)) / cameraRef.current.zoom;

    // 가장 가까운 노드 탐색
    const rot = globalRotationRef.current;
    let closestNode = null;
    let minDist = 22; // 클릭 감지 반경

    galaxyData.nodes.forEach(node => {
      const adjustedRadius = node.radius * orbitSpacing;
      const angleRad = ((node.angle + (node.level > 0 ? (rot * 180 / Math.PI * (1 / Math.sqrt(node.level))) : 0)) * Math.PI) / 180;
      const nx = adjustedRadius * Math.cos(angleRad);
      const ny = adjustedRadius * Math.sin(angleRad);
      const dist = Math.hypot(worldX - nx, worldY - ny);
      if (dist < minDist) {
        minDist = dist;
        closestNode = node;
      }
    });

    if (closestNode) setSelectedNode(closestNode);
  };

  return (
    <div ref={containerRef} className="flex-1 w-full h-full relative overflow-hidden select-none font-sans" style={{ backgroundColor: theme.bg }}>
      
      {/* ── 1. 메인 60FPS WebGL/Canvas 은하 뷰포트 ── */}
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none"
      />

      {/* ── 2. 좌측 상단 헤더 & 나가기 ── */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-3">
        <button
          onClick={() => setActiveScreen('home')}
          className="px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-1.5"
          style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder, color: theme.textMain }}
        >
          ◀ 뒤로
        </button>
        <div>
          <h1 className="text-sm font-black tracking-wider uppercase flex items-center gap-1.5" style={{ color: theme.textMain }}>
            <span>🌌</span> 성경 & 설교 지식 은하계 (Second Brain)
          </h1>
          <span className="text-[10px] font-mono opacity-60 block" style={{ color: theme.textSub }}>
            RADIAL KNOWLEDGE GRAPH • {galaxyData?.meta?.totalNodes || 0} NODES
          </span>
        </div>
      </div>

      {/* ── 3. 우측 컨트롤 대시보드 HUD (스크린샷 정확 구현) ── */}
      <div 
        className="absolute top-4 right-4 z-30 w-72 p-3.5 rounded-2xl border backdrop-blur-md shadow-2xl space-y-3.5 text-xs text-left"
        style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder, color: theme.textMain }}
      >
        {/* 검색 인풋 */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono tracking-wider opacity-60 uppercase block">Buscar Arquivos / 검색</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="본문, 설교, 키워드 검색..."
            className="w-full px-3 py-1.5 rounded-xl text-xs font-medium border outline-none bg-black/40 text-white placeholder:opacity-40"
            style={{ borderColor: theme.panelBorder }}
          />
        </div>

        {/* 궤도 회전 슬라이더 (Giro dos Anéis) */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="opacity-70">GIRO DOS ANÉIS (공전 속도)</span>
            <span>{rotationSpeed.toFixed(2)}x</span>
          </div>
          <input
            type="range" min="0" max="1" step="0.05"
            value={rotationSpeed}
            onChange={(e) => setRotationSpeed(Number(e.target.value))}
            className="w-full h-1.5 accent-cyan-400 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>

        {/* 궤도 간격 슬라이더 */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="opacity-70">RAIO DOS ANÉIS (궤도 간격)</span>
            <span>{orbitSpacing.toFixed(2)}x</span>
          </div>
          <input
            type="range" min="0.6" max="1.6" step="0.05"
            value={orbitSpacing}
            onChange={(e) => setOrbitSpacing(Number(e.target.value))}
            className="w-full h-1.5 accent-cyan-400 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>

        {/* 노드 크기 슬라이더 (Tamanho) */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="opacity-70">TAMANHO (노드 크기)</span>
            <span>{nodeScale.toFixed(2)}x</span>
          </div>
          <input
            type="range" min="0.6" max="2.0" step="0.1"
            value={nodeScale}
            onChange={(e) => setNodeScale(Number(e.target.value))}
            className="w-full h-1.5 accent-cyan-400 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>

        {/* 테마 셀렉터 (Tema) */}
        <div className="space-y-1.5 pt-1 border-t" style={{ borderColor: theme.panelBorder }}>
          <span className="text-[10px] font-mono tracking-wider opacity-60 uppercase block">TEMA (테마 팔레트)</span>
          <div className="grid grid-cols-3 gap-1.5">
            {Object.values(GALAXY_THEMES).map(th => (
              <button
                key={th.id}
                onClick={() => setCurrentTheme(th.id)}
                className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer truncate ${
                  currentTheme === th.id ? 'ring-2 ring-cyan-400 bg-white/15' : 'bg-black/30 opacity-70 hover:opacity-100'
                }`}
                style={{ borderColor: th.panelBorder, color: th.textMain }}
              >
                {th.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* 카메라 리셋 */}
        <div className="pt-1 flex gap-1.5">
          <button
            onClick={() => { cameraRef.current = { x: 0, y: 0, zoom: 0.95 }; }}
            className="flex-1 py-1.5 rounded-xl text-[10.5px] font-bold border bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            style={{ borderColor: theme.panelBorder }}
          >
            중심 리셋
          </button>
          <button
            onClick={() => setSelectedNode(null)}
            className="px-3 py-1.5 rounded-xl text-[10.5px] font-bold border bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            style={{ borderColor: theme.panelBorder }}
          >
            선택 해제
          </button>
        </div>
      </div>

      {/* ── 4. 노드 상세 인스펙터 카드 (노드 클릭 시 하단에 표시) ── */}
      {selectedNode && (
        <div 
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92vw] max-w-lg p-4 rounded-2xl border backdrop-blur-md shadow-2xl space-y-2.5 animate-fade-in text-left"
          style={{ backgroundColor: theme.panelBg, borderColor: theme.panelBorder, color: theme.textMain }}
        >
          <div className="flex justify-between items-start border-b pb-2" style={{ borderColor: theme.panelBorder }}>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: selectedNode.color }} />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider opacity-60 block">
                  {selectedNode.type} • LEVEL {selectedNode.level}
                </span>
                <h3 className="text-sm font-black">{selectedNode.label}</h3>
              </div>
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-xs opacity-60 hover:opacity-100 cursor-pointer p-1">✕</button>
          </div>

          {selectedNode.type === 'sermon' && (
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-[11px] opacity-80 font-mono">
                <span>📖 본문: <b>{selectedNode.ref}</b></span>
                <span>• {selectedNode.preacher}</span>
              </div>
              <p className="text-[12px] leading-relaxed p-2.5 rounded-xl bg-black/40 border border-white/5 break-keep">
                "{selectedNode.summary}"
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setActiveScreen('bible')}
                  className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all cursor-pointer text-center"
                >
                  📖 성경 본문 읽기로 이동
                </button>
              </div>
            </div>
          )}

          {selectedNode.type === 'book' && (
            <div className="space-y-1.5 text-xs">
              <p className="text-[11.5px] opacity-80">
                정경 분류: <b>{selectedNode.sector}</b>
              </p>
              <button
                onClick={() => setActiveScreen('bible')}
                className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all cursor-pointer text-center"
              >
                📖 {selectedNode.bookName} 읽기
              </button>
            </div>
          )}

          {selectedNode.type === 'theology' && (
            <div className="space-y-1 text-xs">
              <p className="text-[12px] leading-relaxed opacity-90 p-2 rounded-xl bg-black/40">
                {selectedNode.desc}
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
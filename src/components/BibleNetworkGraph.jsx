import React, { useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
// 💡 경로 수정 완료 (../data/ 위치 적용)
import { wikiData } from '../data/bibleWikiData'; 

export default function BibleNetworkGraph({ t, isDarkMode }) {
  const graphRef = useRef();
  const graphData = wikiData?.network || { nodes: [], links: [] };

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force('charge').strength(-250); 
      graphRef.current.d3Force('link').distance(90);     
    }
  }, []);

  return (
    <div className={`w-full h-full ${t?.pageBg || 'bg-slate-900'} relative pointer-events-auto`}>
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel={(node) => `${node.id} (${node.group})`}
        nodeColor={(node) => {
          if (node.group === '사건' || node.group === '사물') return '#f59e0b';
          if (node.group === '신') return '#ec4899';
          return '#3b82f6';
        }}
        nodeRelSize={6}
        linkLabel={(link) => link.label || link.relation}
        linkColor={() => isDarkMode ? '#475569' : '#cbd5e1'}
        linkWidth={1.5}
        linkDirectionalParticles={2} 
        linkDirectionalParticleSpeed={0.005}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.id;
          const fontSize = 12 / globalScale;
          ctx.font = `bold ${fontSize}px Sans-Serif`;
          
          ctx.beginPath();
          ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.group === '사건' ? '#f59e0b' : node.group === '신' ? '#ec4899' : '#3b82f6';
          ctx.fill();

          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = isDarkMode ? '#f8fafc' : '#0f172a';
          ctx.fillText(label, node.x, node.y + 6);
        }}
      />
    </div>
  );
}
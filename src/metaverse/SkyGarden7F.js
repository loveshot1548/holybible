// src/metaverse/SkyGarden7F.js
import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Html, ContactShadows } from '@react-three/drei';

// 1. 블렌더에서 추출한 3D 모델 로드 컴포넌트
function SceneModel({ onInteract }) {
  // public/models/SkyGarden7F.glb 파일을 로드합니다.
  const { scene } = useGLTF('/models/SkyGarden7F.glb');

  return (
    <group>
      <primitive object={scene} />
      
      {/* 사진 속 갈색 문(옥상 입구) 3D 좌표 위에 HTML UI(말풍선) 띄우기 */}
      <Html position={[-0.5, 1.2, -2.8]} center distanceFactor={8}>
        <div 
          onClick={() => onInteract('door')}
          className="bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-2xl border-2 border-emerald-400 shadow-2xl cursor-pointer hover:bg-emerald-600 transition-colors animate-bounce flex items-center gap-2"
        >
          <span className="bg-emerald-500 text-black font-black px-2 py-0.5 rounded-lg text-xs">E</span>
          <span className="font-bold text-sm whitespace-nowrap">하늘정원 나가기</span>
        </div>
      </Html>

      {/* 사진 속 화환(좋은나무교회) 위치에 정보 아이콘 띄우기 */}
      <Html position={[1.8, 1.8, -1.5]} center distanceFactor={10}>
        <div 
          onClick={() => onInteract('wreath')}
          className="w-8 h-8 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-white font-black cursor-pointer hover:scale-110 transition-transform shadow-lg"
        >
          i
        </div>
      </Html>
    </group>
  );
}

// 2. 메인 3D 메타버스 뷰어
export default function SkyGarden7F({ setActiveScreen }) {
  const [activeModal, setActiveModal] = useState(null);

  const handleInteract = (target) => {
    if (target === 'door') {
      setActiveModal({
        title: '7층 옥상 하늘정원',
        desc: '문을 열고 나가시면 교회 성도님들의 쉼터인 야외 하늘정원이 펼쳐집니다. (다음 업데이트에 야외 3D 맵이 추가됩니다.)'
      });
    } else if (target === 'wreath') {
      setActiveModal({
        title: '축하 화환 및 비품 적재소',
        desc: '행사 때 사용된 화환과 선풍기, 비품 박스들이 임시로 정리되어 있는 공간입니다.'
      });
    }
  };

  return (
    <div className="w-full h-screen bg-slate-950 flex flex-col relative font-sans select-none">
      {/* 상단 3D 공간 네비게이션 헤더 */}
      <header className="absolute top-0 left-0 w-full p-4 z-20 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <button 
            onClick={() => setActiveScreen('home')}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-sm border border-white/20 transition-colors shadow-lg"
          >
            ◀ 로비로 돌아가기
          </button>
        </div>
        <div className="bg-emerald-500/20 border border-emerald-400/50 backdrop-blur-md px-4 py-2 rounded-2xl text-emerald-400 font-bold text-sm shadow-xl text-right pointer-events-auto">
          <div className="flex items-center justify-end gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            7F 하늘정원 입구 (Real 3D)
          </div>
          <div className="text-xs text-emerald-300/70 font-medium mt-1">
            화면을 드래그하여 시점을 회전하고 휠로 확대해보세요.
          </div>
        </div>
      </header>

      {/* 3D R3F 캔버스 영역 */}
      <Canvas shadows camera={{ position: [5, 4, 6], fov: 45 }}>
        {/* 환경광 및 부드러운 스튜디오 조명 (블렌더 수준의 렌더링 퀄리티) */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[5, 10, 2]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize={1024} 
        />
        <Environment preset="city" />

        {/* 모델 로딩 중 폴백(Fallback) */}
        <Suspense fallback={<Html center className="text-white font-bold">3D 공간 로딩 중...</Html>}>
          <SceneModel onInteract={handleInteract} />
          {/* 바닥 밀착 그림자 (리얼리티 증가) */}
          <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={10} blur={2} far={4} />
        </Suspense>

        {/* 3D 카메라 컨트롤러 (마우스 회전, 줌인/아웃 지원) */}
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true}
          maxPolarAngle={Math.PI / 2 + 0.1} // 바닥 아래로 카메라가 내려가지 않도록 제한
          minDistance={2}
          maxDistance={15}
        />
      </Canvas>

      {/* 인터랙션 팝업 모달 (HTML 오버레이) */}
      {activeModal && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 p-6 rounded-3xl w-full max-w-sm text-white shadow-2xl">
            <h3 className="text-xl font-black text-emerald-400 mb-2">{activeModal.title}</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              {activeModal.desc}
            </p>
            <button 
              onClick={() => setActiveModal(null)}
              className="w-full py-3 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-200 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ⚠️ 모델을 사전에 캐싱하여 로딩 속도를 높입니다.
useGLTF.preload('/models/SkyGarden7F.glb');
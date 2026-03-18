import { useSupplyChain } from './hooks/useSupplyChain';
import Sidebar from './components/Sidebar';
import WorldMap from './components/WorldMap';
import InfoPanel from './components/InfoPanel';
import { useState, useEffect } from 'react';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

function App() {
  const state = useSupplyChain();
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'map' | 'info'

  // 품목 선택 시 지도로 이동
  async function handleSelectItem(id) {
    await state.selectItem(id);
    if (isMobile) setMobileView('map');
  }

  // 국가 선택 시 정보 패널로 이동
  function handleSelectCountry(name) {
    state.selectCountry(name);
    if (isMobile) setMobileView('info');
  }

  if (isMobile) {
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
        {/* 상단 헤더 */}
        <div style={{ padding:'10px 16px', borderBottom:'0.5px solid #ddd', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', background:'white' }}>
          <h1 style={{ fontSize:'14px', fontWeight:'500' }}>실물 경제 공급망 탐색기</h1>
          <div style={{ display:'flex', border:'0.5px solid #ddd', borderRadius:'7px', overflow:'hidden' }}>
            {[['production','생산'],['consumption','소비'],['net','알짜']].map(([v, label]) => (
              <button key={v} onClick={() => state.setViewMode(v)}
                style={{ padding:'4px 8px', border:'none', fontSize:'11px', background: state.viewMode===v ? '#1a1a1a' : 'transparent', color: state.viewMode===v ? '#fff' : '#666', cursor:'pointer' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div style={{ flex:1, overflow:'hidden', position:'relative' }}>
          {/* 목록 화면 */}
          <div style={{ position:'absolute', inset:0, background:'white', transform: mobileView==='list' ? 'translateX(0)' : 'translateX(-100%)', transition:'transform .25s', overflow:'auto' }}>
            <Sidebar
              filteredItems={state.filteredItems}
              curItem={state.curItem}
              curCat={state.curCat}
              setCurCat={state.setCurCat}
              selectItem={handleSelectItem}
              mobile={true}
            />
          </div>

          {/* 지도 화면 */}
          <div style={{ position:'absolute', inset:0, transform: mobileView==='map' ? 'translateX(0)' : mobileView==='list' ? 'translateX(100%)' : 'translateX(-100%)', transition:'transform .25s' }}>
            <WorldMap
              curItem={state.curItem}
              curCountry={state.curCountry}
              viewMode={state.viewMode}
              activeTab={state.activeTab}
              onSelectCountry={handleSelectCountry}
            />
          </div>

          {/* 정보 화면 */}
          <div style={{ position:'absolute', inset:0, background:'white', transform: mobileView==='info' ? 'translateX(0)' : 'translateX(100%)', transition:'transform .25s', overflow:'auto', display:'flex', flexDirection:'column' }}>
            <InfoPanel
              curItem={state.curItem}
              curCountry={state.curCountry}
              activeTab={state.activeTab}
              setActiveTab={state.setActiveTab}
            />
          </div>
        </div>

        {/* 하단 탭바 */}
        <div style={{ display:'flex', borderTop:'0.5px solid #ddd', background:'white', flexShrink:0 }}>
          {[
            ['list',  '📋', '목록'],
            ['map',   '🗺', '지도'],
            ['info',  'ℹ️', '정보'],
          ].map(([view, icon, label]) => (
            <button key={view} onClick={() => setMobileView(view)}
              style={{ flex:1, padding:'10px 0 8px', border:'none', background:'transparent', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
              <span style={{ fontSize:'18px' }}>{icon}</span>
              <span style={{ fontSize:'10px', color: mobileView===view ? '#1a1a1a' : '#888', fontWeight: mobileView===view ? '500' : 'normal' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 데스크탑 레이아웃 (기존 그대로)
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <div style={{ padding:'10px 18px', borderBottom:'0.5px solid #ddd', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h1 style={{ fontSize:'15px', fontWeight:'500' }}>실물 경제 공급망 탐색기</h1>
        <div style={{ display:'flex', border:'0.5px solid #ddd', borderRadius:'7px', overflow:'hidden' }}>
          {[['production','생산량'],['consumption','소비량'],['net','알짜 생산량']].map(([v, label]) => (
            <button key={v} onClick={() => state.setViewMode(v)}
              style={{ padding:'4px 11px', border:'none', fontSize:'12px', background: state.viewMode===v ? '#1a1a1a' : 'transparent', color: state.viewMode===v ? '#fff' : '#666', cursor:'pointer' }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', flex:1, minHeight:0 }}>
        <Sidebar
          filteredItems={state.filteredItems}
          curItem={state.curItem}
          curCat={state.curCat}
          setCurCat={state.setCurCat}
          selectItem={state.selectItem}
        />
        <WorldMap
          curItem={state.curItem}
          curCountry={state.curCountry}
          viewMode={state.viewMode}
          activeTab={state.activeTab}
          onSelectCountry={state.selectCountry}
        />
        <InfoPanel
          curItem={state.curItem}
          curCountry={state.curCountry}
          activeTab={state.activeTab}
          setActiveTab={state.setActiveTab}
        />
      </div>
    </div>
  );
}

export default App;
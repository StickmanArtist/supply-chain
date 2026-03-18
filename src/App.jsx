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
      <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'white' }}>
        {/* 상단 헤더 */}
        <div style={{ padding:'10px 16px 8px', borderBottom:'0.5px solid #ddd', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h1 style={{ fontSize:'13px', fontWeight:'500' }}>실물 경제 공급망 탐색기</h1>
          <div style={{ display:'flex', border:'0.5px solid #ddd', borderRadius:'6px', overflow:'hidden' }}>
            {[['production','생산'],['consumption','소비'],['net','알짜']].map(([v, label]) => (
              <button key={v} onClick={() => state.setViewMode(v)}
                style={{ padding:'3px 8px', border:'none', fontSize:'11px', background: state.viewMode===v ? '#1a1a1a' : 'transparent', color: state.viewMode===v ? '#fff' : '#666', cursor:'pointer' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 품목 선택 바 (가로 스크롤) */}
        <div style={{ flexShrink:0, borderBottom:'0.5px solid #ddd' }}>
          {/* 카테고리 */}
          <div style={{ display:'flex', gap:'6px', padding:'6px 12px', overflowX:'auto', borderBottom:'0.5px solid #eee' }}>
            {[['all','전체'],['raw','⛏ 원자재'],['agri','🌾 농산물'],['mfg','🏭 제조품']].map(([cat, label]) => (
              <button key={cat} onClick={() => state.setCurCat(cat)}
                style={{ flexShrink:0, padding:'3px 10px', borderRadius:'14px', border:'0.5px solid #ddd', background: state.curCat===cat ? '#1a1a1a' : 'transparent', color: state.curCat===cat ? '#fff' : '#666', fontSize:'11px', cursor:'pointer', whiteSpace:'nowrap' }}>
                {label}
              </button>
            ))}
          </div>
          {/* 품목 가로 스크롤 */}
          <div style={{ display:'flex', gap:'6px', padding:'6px 12px', overflowX:'auto' }}>
            {state.filteredItems.map(item => (
              <button key={item.id} onClick={() => handleSelectItem(item.id)}
                style={{ flexShrink:0, padding:'4px 10px', borderRadius:'14px', border:'0.5px solid #ddd', background: state.curItem?.id===item.id ? '#1a1a1a' : 'transparent', color: state.curItem?.id===item.id ? '#fff' : '#333', fontSize:'12px', cursor:'pointer', whiteSpace:'nowrap' }}>
                {item.icon} {item.name}
              </button>
            ))}
          </div>
        </div>

        {/* 지도 (상단 50%) */}
        <div style={{ flex:'0 0 45vh', position:'relative', overflow:'hidden' }}>
          <WorldMap
            curItem={state.curItem}
            curCountry={state.curCountry}
            viewMode={state.viewMode}
            activeTab={state.activeTab}
            onSelectCountry={handleSelectCountry}
          />
        </div>

        {/* 정보 패널 (하단 스크롤) */}
        <div style={{ flex:1, overflow:'auto', borderTop:'0.5px solid #ddd', display:'flex', flexDirection:'column', minHeight:0 }}>
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
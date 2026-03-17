import { useSupplyChain } from './hooks/useSupplyChain';
import Sidebar from './components/Sidebar';
import WorldMap from './components/WorldMap';
import InfoPanel from './components/InfoPanel';

function App() {
  const state = useSupplyChain();

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      {/* 상단 헤더 */}
      <div style={{ padding:'10px 18px', borderBottom:'0.5px solid #ddd', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h1 style={{ fontSize:'15px', fontWeight:'500' }}>실물 경제 공급망 탐색기</h1>

        {/* 보기 토글 */}
        <div style={{ display:'flex', border:'0.5px solid #ddd', borderRadius:'7px', overflow:'hidden' }}>
          {[['production','생산량'],['consumption','소비량'],['net','알짜 생산량']].map(([v, label]) => (
            <button
              key={v}
              onClick={() => state.setViewMode(v)}
              style={{
                padding:'4px 11px', border:'none', fontSize:'12px',
                background: state.viewMode === v ? '#1a1a1a' : 'transparent',
                color: state.viewMode === v ? '#fff' : '#666',
                cursor:'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 메인 영역 */}
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
const CAT_LABELS = {
  all: '전체',
  raw: '⛏ 원자재',
  agri: '🌾 농산물',
  mfg: '🏭 제조품',
};

export default function Sidebar({ filteredItems, curItem, curCat, setCurCat, selectItem }) {
  return (
    <div style={{
      width: '160px',
      minWidth: '160px',
      borderRight: '0.5px solid #ddd',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* 카테고리 탭 */}
      <div style={{ padding: '8px 6px', borderBottom: '0.5px solid #ddd' }}>
        {Object.entries(CAT_LABELS).map(([cat, label]) => (
          <button
            key={cat}
            onClick={() => setCurCat(cat)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '5px 8px',
              marginBottom: '2px',
              borderRadius: '6px',
              border: 'none',
              background: curCat === cat ? '#1a1a1a' : 'transparent',
              color: curCat === cat ? '#fff' : '#555',
              fontSize: '12px',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 품목 리스트 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
        {filteredItems.map(item => (
          <button
            key={item.id}
            onClick={() => selectItem(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              width: '100%',
              padding: '7px 9px',
              borderRadius: '7px',
              border: 'none',
              background: curItem?.id === item.id ? '#eee' : 'transparent',
              fontWeight: curItem?.id === item.id ? '500' : 'normal',
              fontSize: '12px',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: '15px' }}>{item.icon}</span>
            <span>{item.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
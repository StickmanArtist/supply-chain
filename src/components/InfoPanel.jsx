import { useState, useEffect } from 'react';

const TABS = [
  { id: 'overview', label: '개요' },
  { id: 'imports',  label: '수입 출처' },
  { id: 'exports',  label: '수출 대상' },
  { id: 'data',     label: '수급' },
  { id: 'news',     label: '뉴스' },
  { id: 'ai',       label: 'AI' },
];

export default function InfoPanel({ curItem, curCountry, activeTab, setActiveTab }) {
  return (
    <div style={{
      width: '275px',
      minWidth: '255px',
      borderLeft: '0.5px solid #ddd',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* 헤더 */}
      <div style={{ padding: '11px 14px 9px', borderBottom: '0.5px solid #ddd' }}>
        <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '2px' }}>
          {curItem
            ? (curCountry
                ? `🌍 ${curCountry} · ${curItem.icon} ${curItem.name}`
                : `${curItem.icon} ${curItem.name}`)
            : <span style={{ color: '#888', fontSize: '13px' }}>품목을 선택하세요</span>
          }
        </div>
        {curItem && (
          <div style={{ fontSize: '11px', color: '#888' }}>
            {{ raw:'원자재', agri:'농산물', mfg:'제조품' }[curItem.cat]}
            {' · '}{curItem.unit}
          </div>
        )}
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid #ddd' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '7px 2px',
              textAlign: 'center',
              fontSize: '11px',
              border: 'none',
              background: 'transparent',
              color: activeTab === tab.id ? '#1a1a1a' : '#888',
              fontWeight: activeTab === tab.id ? '500' : 'normal',
              borderBottom: activeTab === tab.id ? '2px solid #1a1a1a' : '2px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <TabContent curItem={curItem} curCountry={curCountry} activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}

function TabContent({ curItem, curCountry, activeTab, setActiveTab }) {
  // 품목 미선택 + 수입/수출 탭
  if (!curItem && (activeTab === 'imports' || activeTab === 'exports')) {
    return <NoItemPrompt label={activeTab === 'imports' ? '수입 출처' : '수출 대상'} />;
  }

  // 품목 미선택
  if (!curItem) {
    return (
      <div style={{ padding: '24px 14px', textAlign: 'center', color: '#888', fontSize: '12px', marginTop: '20px' }}>
        왼쪽 품목을 선택하거나<br />지도에서 국가를 클릭하세요
      </div>
    );
  }

  if (activeTab === 'overview') return <OverviewTab curItem={curItem} curCountry={curCountry} setActiveTab={setActiveTab} />;
  if (activeTab === 'imports')  return <TradeTab curItem={curItem} curCountry={curCountry} direction="import" />;
  if (activeTab === 'exports')  return <TradeTab curItem={curItem} curCountry={curCountry} direction="export" />;
  if (activeTab === 'data')     return <DataTab curItem={curItem} curCountry={curCountry} />;
  if (activeTab === 'news')     return <NewsTab curItem={curItem} curCountry={curCountry} />;
  if (activeTab === 'ai')       return <AITab curItem={curItem} curCountry={curCountry} />;
  return null;
}

/* ── 품목 미선택 안내 ── */
function NoItemPrompt({ label }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px', textAlign:'center', gap:'12px' }}>
      <div style={{ fontSize: '28px' }}>📦</div>
      <div style={{ fontSize: '12px', lineHeight: '1.7', color: '#888' }}>
        <strong>{label}</strong>를 보려면<br />먼저 품목을 선택해 주세요
      </div>
    </div>
  );
}

/* ── 개요 탭 ── */
function OverviewTab({ curItem, curCountry, setActiveTab }) {
  const maxP = Math.max(...curItem.regions.map(r => r.prod));
  const maxC = Math.max(...curItem.regions.map(r => r.cons));

  if (curCountry) {
    const r = curItem.regions.find(r => r.name === curCountry);
    if (!r) return <div style={{ padding: '20px', color: '#888', fontSize: '12px', textAlign: 'center' }}>이 품목의 데이터 없음</div>;
    const net = r.prod - r.cons;
    const prodRank = [...curItem.regions].sort((a,b) => b.prod - a.prod).findIndex(rr => rr.name === curCountry) + 1;
    const consRank = [...curItem.regions].sort((a,b) => b.cons - a.cons).findIndex(rr => rr.name === curCountry) + 1;
    const allProd = curItem.regions.reduce((a, rr) => a + rr.prod, 0);
    const allCons = curItem.regions.reduce((a, rr) => a + rr.cons, 0);

    return (
      <div>
        <Section>
          <div style={{ display: 'flex', gap: '7px', marginBottom: '10px' }}>
            {[['생산량', r.prod, '#E8593C'], ['소비량', r.cons, '#3B8BD4'], ['알짜', net, net >= 0 ? '#2AAB6E' : '#D85A30']].map(([k, v, c]) => (
              <div key={k} style={{ flex:1, background:'#f2f2f0', padding:'9px 6px', borderRadius:'8px', textAlign:'center' }}>
                <div style={{ fontSize:'10px', color:'#888', marginBottom:'3px' }}>{k}</div>
                <div style={{ fontSize:'16px', fontWeight:'500', color: c }}>{v.toFixed(2)}</div>
              </div>
            ))}
          </div>
          <Row label="생산 순위" value={`${prodRank}위 / ${curItem.regions.length}개국`} />
          <Row label="소비 순위" value={`${consRank}위 / ${curItem.regions.length}개국`} />
          <Row label="수급 상태" value={net > 0 ? '순 수출국' : '순 수입국'} valueColor={net >= 0 ? '#2AAB6E' : '#D85A30'} />
          <Row label="생산 비중" value={`${(r.prod / allProd * 100).toFixed(1)}%`} />
          <Row label="소비 비중" value={`${(r.cons / allCons * 100).toFixed(1)}%`} />
        </Section>
        <Section>
          <SectionLabel color="#F2A623" text="핵심 기업" />
          <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
            {curItem.companies.map(c => <Tag key={c}>{c}</Tag>)}
          </div>
        </Section>
        <div style={{ display:'flex', gap:'6px', padding:'10px 14px' }}>
          <SmallBtn onClick={() => setActiveTab('imports')}>수입 출처 →</SmallBtn>
          <SmallBtn onClick={() => setActiveTab('exports')}>수출 대상 →</SmallBtn>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Section>
        <SectionLabel color="#E8593C" text="생산 상위국" />
        {[...curItem.regions].sort((a,b) => b.prod - a.prod).slice(0,4).map(r => (
          <BarRow key={r.name} label={r.name} value={r.prod} max={maxP} color="#E8593C" unit={curItem.unit} />
        ))}
      </Section>
      <Section>
        <SectionLabel color="#3B8BD4" text="소비 상위국" />
        {[...curItem.regions].sort((a,b) => b.cons - a.cons).slice(0,4).map(r => (
          <BarRow key={r.name} label={r.name} value={r.cons} max={maxC} color="#3B8BD4" unit={curItem.unit} />
        ))}
      </Section>
      <Section>
        <SectionLabel color="#F2A623" text="핵심 기업" />
        <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
          {curItem.companies.map(c => <Tag key={c}>{c}</Tag>)}
        </div>
      </Section>
    </div>
  );
}

/* ── 수입/수출 탭 ── */
function TradeTab({ curItem, curCountry, direction }) {
  const isImp = direction === 'import';
  const color = isImp ? '#3B8BD4' : '#E8593C';
  const label = isImp ? '수입 출처' : '수출 대상';

  if (curCountry) {
    const r = curItem.regions.find(r => r.name === curCountry);
    if (!r) return <div style={{ padding:'20px', color:'#888', fontSize:'12px', textAlign:'center' }}>데이터 없음</div>;
    const entries = isImp ? r.imports : r.exports;

    if (!entries || !entries.length) {
      return (
        <div style={{ padding:'24px 16px', textAlign:'center', color:'#888', fontSize:'12px', lineHeight:'1.8' }}>
          {curCountry}는 {curItem.name}의 주요 {isImp ? '수출국' : '수입국'}이거나<br />해당 데이터가 없습니다
        </div>
      );
    }

    const maxPct = Math.max(...entries.map(e => e.pct));
    return (
      <div>
        <Section>
          <SectionLabel color={color} text={`${curCountry}의 ${curItem.name} ${label}`} />
          <div style={{ fontSize:'10px', color:'#888', marginBottom:'9px' }}>지도에 점선 화살표로 표시됩니다</div>
          {entries.map(e => {
            const partner = isImp ? e.from : e.to;
            return (
              <div key={partner} style={{ display:'flex', alignItems:'center', padding:'6px 0', borderBottom:'0.5px solid #eee' }}>
                <span style={{ fontSize:'12px', minWidth:'78px' }}>{partner}</span>
                <div style={{ flex:1, margin:'0 8px', height:'4px', background:'#eee', borderRadius:'2px', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${(e.pct / maxPct * 100).toFixed(0)}%`, background: color, borderRadius:'2px' }} />
                </div>
                <span style={{ fontSize:'11px', fontWeight:'500', color, minWidth:'32px', textAlign:'right' }}>{e.pct}%</span>
              </div>
            );
          })}
        </Section>
      </div>
    );
  }

  const withData = curItem.regions.filter(r => (isImp ? r.imports : r.exports)?.length > 0);
  return (
    <div>
      <Section>
        <SectionLabel color={color} text={`${label} 데이터 보유국`} />
        <div style={{ fontSize:'11px', color:'#888', marginBottom:'8px' }}>국가 클릭 시 지도에 흐름 표시</div>
        {withData.map(r => {
          const entries = isImp ? r.imports : r.exports;
          return (
            <div key={r.name} style={{ padding:'6px 0', borderBottom:'0.5px solid #eee' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'3px' }}>
                <span style={{ fontSize:'12px', fontWeight:'500' }}>{r.name}</span>
                <span style={{ fontSize:'11px', color:'#888' }}>{entries.length}개국 {isImp ? '에서 수입' : '에 수출'}</span>
              </div>
              <div style={{ fontSize:'11px', color:'#888' }}>
                {entries.map(e => `${isImp ? e.from : e.to} ${e.pct}%`).join(' · ')}
              </div>
            </div>
          );
        })}
      </Section>
    </div>
  );
}

/* ── 수급 데이터 탭 ── */
function DataTab({ curItem, curCountry }) {
  const regions = [...curItem.regions].sort((a,b) => (b.prod - b.cons) - (a.prod - a.cons));
  const maxAbs = Math.max(...regions.map(r => Math.abs(r.prod - r.cons)));

  return (
    <div>
      <Section>
        <SectionLabel color="#2AAB6E" text="알짜 생산량 (생산 − 소비)" />
        <div style={{ fontSize:'10px', color:'#888', marginBottom:'8px' }}>양수 = 순수출 가능, 음수 = 순수입 필요</div>
        {regions.map(r => {
          const net = r.prod - r.cons;
          const isPos = net >= 0;
          const pct = maxAbs > 0 ? Math.abs(net) / maxAbs * 44 : 0;
          const hl = curCountry && r.name === curCountry;
          return (
            <div key={r.name} style={{ marginBottom:'5px', background: hl ? '#f2f2f0' : 'transparent', borderRadius:'5px', padding: hl ? '2px 4px' : '0' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#888', marginBottom:'2px' }}>
                <span>{hl ? '▶ ' : ''}{r.name}</span>
                <span style={{ color: isPos ? '#2AAB6E' : '#D85A30', fontWeight:'500' }}>{isPos ? '+' : ''}{net.toFixed(2)}</span>
              </div>
              <div style={{ height:'5px', background:'#eee', borderRadius:'3px', position:'relative' }}>
                <div style={{ position:'absolute', top:'-3px', bottom:'-3px', left:'50%', width:'1px', background:'#ccc' }} />
                <div style={{ position:'absolute', height:'100%', borderRadius:'3px', background: isPos ? '#E8593C' : '#3B8BD4', width:`${pct}%`, [isPos ? 'left' : 'right']: '50%' }} />
              </div>
            </div>
          );
        })}
      </Section>
    </div>
  );
}

/* ── 뉴스 탭 ── */
function NewsTab({ curItem, curCountry }) {
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setNews(null);
    const controller = new AbortController();

    const url = `http://${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/news/${curItem.id}${
      curCountry ? `?country=${encodeURIComponent(curCountry)}` : ''
    }`;

    fetch(url, { signal: controller.signal })
      .then(r => r.json())
      .then(data => { setNews(data); setLoading(false); })
      .catch(err => {
        if (err.name !== 'AbortError') setLoading(false);
      });

    return () => controller.abort();
  }, [curItem.id, curCountry]);

  if (loading) return (
    <div style={{ padding:'20px', textAlign:'center', color:'#888', fontSize:'12px' }}>
      뉴스 검색 중...
    </div>
  );
  if (!news?.length) return (
    <div style={{ padding:'20px', textAlign:'center', color:'#888', fontSize:'12px' }}>
      뉴스를 찾을 수 없습니다
    </div>
  );

  return (
    <div>
      {news.map((n, i) => (
        <div
          key={i}
          onClick={() => n.url && window.open(n.url, '_blank')}
          style={{ padding:'9px 14px', borderBottom:'0.5px solid #eee', cursor: n.url ? 'pointer' : 'default' }}
        >
          <div style={{ fontSize:'10px', color:'#888', marginBottom:'3px' }}>{n.source} · {n.time}</div>
          <div style={{ fontSize:'12px', lineHeight:'1.45', marginBottom:'3px' }}>{n.title}</div>
          <div style={{ fontSize:'11px', color:'#888', lineHeight:'1.5' }}>{n.summary}</div>
        </div>
      ))}
    </div>
  );
}

/* ── AI 분석 탭 ── */
function AITab({ curItem, curCountry }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setResult(null);
    const controller = new AbortController();

    fetch(`http://${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/ai/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        itemId: curItem.id,
        itemName: curItem.name,
        country: curCountry || '',
      }),
    })
      .then(r => r.json())
      .then(data => { setResult(data); setLoading(false); })
      .catch(err => {
        if (err.name !== 'AbortError') setLoading(false);
      });

    return () => controller.abort();
  }, [curItem.id, curCountry]);

  const LABELS = {
    raw_materials: '원료 구성', logistics: '물류 경로',
    risk_factors: '공급망 리스크', market_size: '시장 규모',
    position: '공급망 역할', key_policy: '핵심 정책',
    geopolitics: '지정학', outlook: '전망',
  };

  if (loading) return (
    <div style={{ padding:'20px', textAlign:'center', color:'#888', fontSize:'12px' }}>
      분석 중...
    </div>
  );
  if (!result) return (
    <div style={{ padding:'20px', textAlign:'center', color:'#888', fontSize:'12px' }}>
      분석 불가
    </div>
  );

  return (
    <div>
      <Section>
        {Object.entries(result).map(([k, v]) => (
          <div key={k} style={{ marginBottom:'10px' }}>
            <div style={{ fontSize:'10px', fontWeight:'500', textTransform:'uppercase', letterSpacing:'.05em', color:'#888', marginBottom:'3px' }}>
              {LABELS[k] || k}
            </div>
            <div style={{ fontSize:'12px', lineHeight:'1.55' }}>{v}</div>
          </div>
        ))}
      </Section>
    </div>
  );
}

/* ── 공통 UI 조각들 ── */
function Section({ children }) {
  return <div style={{ padding:'10px 14px', borderBottom:'0.5px solid #eee' }}>{children}</div>;
}

function SectionLabel({ color, text }) {
  return (
    <div style={{ fontSize:'10px', fontWeight:'500', textTransform:'uppercase', letterSpacing:'.07em', color:'#888', marginBottom:'7px', display:'flex', alignItems:'center', gap:'5px' }}>
      <div style={{ width:'5px', height:'5px', borderRadius:'50%', background: color, flexShrink:0 }} />
      {text}
    </div>
  );
}

function Row({ label, value, valueColor }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px' }}>
      <span style={{ fontSize:'12px', color:'#888' }}>{label}</span>
      <span style={{ fontSize:'12px', fontWeight:'500', color: valueColor || '#1a1a1a' }}>{value}</span>
    </div>
  );
}

function BarRow({ label, value, max, color, unit }) {
  return (
    <div style={{ marginBottom:'5px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#888', marginBottom:'2px' }}>
        <span>{label}</span><span>{value}</span>
      </div>
      <div style={{ height:'4px', background:'#eee', borderRadius:'2px', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${(value / max * 100).toFixed(0)}%`, background: color, borderRadius:'2px' }} />
      </div>
    </div>
  );
}

function Tag({ children }) {
  return (
    <span style={{ fontSize:'11px', padding:'2px 7px', borderRadius:'12px', border:'0.5px solid #ddd', color:'#666' }}>
      {children}
    </span>
  );
}

function SmallBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ flex:1, padding:'7px', borderRadius:'7px', border:'0.5px solid #ddd', background:'transparent', fontSize:'11px', cursor:'pointer' }}>
      {children}
    </button>
  );
}
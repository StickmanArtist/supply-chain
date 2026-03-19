import { useState, useEffect, useRef } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function PriceChart({ curItem }) {
  const [range, setRange]     = useState('1mo');
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!curItem) return;
    setLoading(true);
    setData(null);
    const controller = new AbortController();

    fetch(`${API}/prices/${curItem.id}?range=${range}`, { signal: controller.signal })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(err => { if (err.name !== 'AbortError') setLoading(false); });

    return () => controller.abort();
  }, [curItem?.id, range]);

  useEffect(() => {
    if (!data?.available || !data.prices?.length || !canvasRef.current) return;
    drawChart(canvasRef.current, data.prices, data.changePct >= 0);
  }, [data]);

  if (loading) return (
    <div style={{ padding:'20px', textAlign:'center', color:'#888', fontSize:'12px' }}>
      시세 데이터 불러오는 중...
    </div>
  );

  if (!data?.available) return (
    <div style={{ padding:'20px', textAlign:'center', color:'#888', fontSize:'12px', lineHeight:'1.8' }}>
      {data?.message || '시세 데이터 없음'}
    </div>
  );

  const isUp  = data.changePct >= 0;
  const color = isUp ? '#2AAB6E' : '#D85A30';

  return (
    <div>
      {/* 현재가 헤더 */}
      <div style={{ padding:'12px 14px', borderBottom:'0.5px solid #eee' }}>
        <div style={{ fontSize:'11px', color:'#888', marginBottom:'4px' }}>
          {data.name} ({data.ticker}) · {data.currency}
        </div>
        <div style={{ display:'flex', alignItems:'baseline', gap:'10px' }}>
          <div style={{ fontSize:'24px', fontWeight:'500' }}>
            {data.currentPrice?.toLocaleString()}
          </div>
          <div style={{ fontSize:'13px', color, fontWeight:'500' }}>
            {isUp ? '▲' : '▼'} {Math.abs(data.change)} ({isUp ? '+' : ''}{data.changePct}%)
          </div>
        </div>
        <div style={{ fontSize:'10px', color:'#aaa', marginTop:'2px' }}>
          전일 종가 {data.previousClose?.toLocaleString()}
        </div>
      </div>

      {/* 기간 탭 */}
      <div style={{ display:'flex', borderBottom:'0.5px solid #eee' }}>
        {[['1mo','1개월'],['1y','1년']].map(([val, label]) => (
          <button key={val} onClick={() => setRange(val)}
            style={{
              flex:1, padding:'6px', border:'none', background:'transparent',
              fontSize:'12px', cursor:'pointer', fontFamily:'inherit',
              color: range===val ? '#1a1a1a' : '#888',
              fontWeight: range===val ? '500' : 'normal',
              borderBottom: range===val ? '2px solid #1a1a1a' : '2px solid transparent',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* 캔버스 차트 */}
      <div style={{ padding:'12px 14px' }}>
        <canvas ref={canvasRef} width={240} height={120}
          style={{ width:'100%', height:'120px' }}/>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', color:'#aaa', marginTop:'4px' }}>
          <span>{data.prices[0]?.date}</span>
          <span>{data.prices[data.prices.length-1]?.date}</span>
        </div>
      </div>

      {/* 최고/최저/시작 */}
      <div style={{ display:'flex', gap:'8px', padding:'0 14px 12px' }}>
        {[
          ['최고', Math.max(...data.prices.map(p => p.price))],
          ['최저', Math.min(...data.prices.map(p => p.price))],
          ['시작', data.prices[0]?.price],
        ].map(([label, val]) => (
          <div key={label} style={{ flex:1, background:'#f8f8f6', padding:'6px 8px', borderRadius:'6px', textAlign:'center' }}>
            <div style={{ fontSize:'10px', color:'#888', marginBottom:'2px' }}>{label}</div>
            <div style={{ fontSize:'12px', fontWeight:'500' }}>{val?.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function drawChart(canvas, prices, isUp) {
  const ctx = canvas.getContext('2d');
  const W   = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const vals  = prices.map(p => p.price);
  const min   = Math.min(...vals);
  const max   = Math.max(...vals);
  const range = max - min || 1;
  const color = isUp ? '#2AAB6E' : '#D85A30';
  const pad   = { top:8, bottom:8, left:4, right:4 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top  - pad.bottom;

  const x = i => pad.left  + (i / (vals.length-1)) * chartW;
  const y = v => pad.top   + chartH - ((v-min) / range) * chartH;

  // 그라데이션
  const grad = ctx.createLinearGradient(0, pad.top, 0, H);
  grad.addColorStop(0, color + '33');
  grad.addColorStop(1, color + '00');

  ctx.beginPath();
  ctx.moveTo(x(0), y(vals[0]));
  vals.forEach((v, i) => { if (i>0) ctx.lineTo(x(i), y(v)); });
  ctx.lineTo(x(vals.length-1), H);
  ctx.lineTo(x(0), H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // 라인
  ctx.beginPath();
  ctx.moveTo(x(0), y(vals[0]));
  vals.forEach((v, i) => { if (i>0) ctx.lineTo(x(i), y(v)); });
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.5;
  ctx.stroke();
}
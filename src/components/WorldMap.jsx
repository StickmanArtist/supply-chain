import { useState, useEffect, useRef, useCallback } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import { EXTRA_COORDS } from '../data/commodities';

const W = 900, H = 500;
const proj = geoNaturalEarth1().scale(140).translate([W / 2, H / 2]);
const pathGen = geoPath(proj);

function ll2xy(lat, lng) {
  const p = proj([lng, lat]);
  return p ? { x: p[0], y: p[1] } : null;
}
function ll2pct(lat, lng) {
  const p = proj([lng, lat]);
  return p ? { x: (p[0] / W) * 100, y: (p[1] / H) * 100 } : null;
}
function getCoords(name, regions) {
  const r = regions?.find(r => r.name === name);
  if (r) return { lat: r.lat, lng: r.lng };
  return EXTRA_COORDS[name] || null;
}
function nodeSize(val, max) {
  if (!max) return 7;
  return 5 + Math.sqrt(val / max) * 24;
}

const NAME_TO_ISO = {
  '미국': 840, '캐나다': 124, '멕시코': 484,
  '브라질': 76, '아르헨티나': 32, '칠레': 152, '콜롬비아': 170,
  '영국': 826, '프랑스': 250, '독일': 276, '이탈리아': 380,
  '스페인': 724, '네덜란드': 528, '벨기에': 56,
  '스웨덴': 752, '노르웨이': 578, '폴란드': 616,
  '러시아': 643, '터키': 792, '우크라이나': 804,
  '카자흐스탄': 398,
  '사우디아라비아': 682, '이란': 364, '이라크': 368,
  '이집트': 818, 'UAE': 784, '카타르': 634, '쿠웨이트': 414,
  '이스라엘': 376,
  '나이지리아': 566, '남아프리카': 710, 'DR콩고': 180,
  '인도': 356, '중국': 156, '일본': 392, '한국': 410,
  '대만': 158, '베트남': 704, '인도네시아': 360,
  '태국': 764, '말레이시아': 458, '필리핀': 608,
  '방글라데시': 50, '파키스탄': 586,
  '호주': 36,
};
const ISO_TO_NAME = Object.fromEntries(
  Object.entries(NAME_TO_ISO).map(([name, iso]) => [iso, name])
);

export default function WorldMap({ curItem, curCountry, viewMode, activeTab, onSelectCountry }) {
  const [countries, setCountries] = useState([]);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const svgRef = useRef(null);

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then(topo => {
        const land = feature(topo, topo.objects.countries);
        setCountries(land.features);
      })
      .catch(err => console.error('지도 로드 실패:', err));
  }, []);
// 터치 이벤트용
  const lastTouchRef = useRef(null);
  const lastPinchDistRef = useRef(null);
  // 휠 줌
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.85 : 1.18;
    setTransform(t => {
      const newK = Math.min(Math.max(t.k * delta, 1), 8);
      // 마우스 위치 기준으로 줌
      const rect = svgRef.current.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width  * W;
      const my = (e.clientY - rect.top)  / rect.height * H;
      const newX = mx - (mx - t.x) * (newK / t.k);
      const newY = my - (my - t.y) * (newK / t.k);
      return { k: newK, x: newX, y: newY };
    });
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);



  // 드래그 패닝
  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
  };
  const onMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const dx = (e.clientX - dragStart.current.x) * scaleX;
    const dy = (e.clientY - dragStart.current.y) * scaleY;
    setTransform(t => ({ ...t, x: dragStart.current.tx + dx, y: dragStart.current.ty + dy }));
  }, []);
  const onMouseUp = () => { isDragging.current = false; };
  // 터치 핸들러
  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      dragStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        tx: transform.x,
        ty: transform.y,
      };
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isDragging.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDistRef.current = Math.sqrt(dx*dx + dy*dy);
    }
  };

  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const dx = (e.touches[0].clientX - dragStart.current.x) * scaleX;
      const dy = (e.touches[0].clientY - dragStart.current.y) * scaleY;
      setTransform(t => ({ ...t, x: dragStart.current.tx + dx, y: dragStart.current.ty + dy }));
    } else if (e.touches.length === 2 && lastPinchDistRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const delta = dist / lastPinchDistRef.current;
      lastPinchDistRef.current = dist;

      // 두 손가락 중심점 기준으로 줌
      const rect = svgRef.current.getBoundingClientRect();
      const mx = ((e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left) / rect.width * W;
      const my = ((e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top) / rect.height * H;

      setTransform(t => {
        const newK = Math.min(Math.max(t.k * delta, 1), 8);
        const newX = mx - (mx - t.x) * (newK / t.k);
        const newY = my - (my - t.y) * (newK / t.k);
        return { k: newK, x: newX, y: newY };
      });
    }
  }, []);
  useEffect(() => {
  const el = svgRef.current;
  if (!el) return;
  el.addEventListener('touchmove', onTouchMove, { passive: false });
  return () => el.removeEventListener('touchmove', onTouchMove);
}, [onTouchMove]);

  const onTouchEnd = () => {
    isDragging.current = false;
    lastPinchDistRef.current = null;
  };

  // 리셋
  const resetView = () => setTransform({ x: 0, y: 0, k: 1 });

  // 노드 역변환: 줌/패닝과 무관하게 고정 크기 유지
  const inverseScale = 1 / transform.k;

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#D6EAF5' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: '100%', cursor: isDragging.current ? 'grabbing' : 'grab', touchAction: 'none' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <defs>
          <marker id="a-imp" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="#3B8BD4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
          <marker id="a-exp" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="#E8593C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
          <marker id="a-bg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
          <style>{`
            .ta { stroke-dasharray: 5 4; animation: da 1.4s linear infinite; }
            @keyframes da { to { stroke-dashoffset: -18; } }
          `}</style>
        </defs>

        <rect width={W} height={H} fill="#D6EAF5" />

        {/* 줌/패닝 그룹 — 지도 면 + 화살표만 변환 */}
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
          {countries.map(f => {
            const iso  = Number(f.id);
            const name = ISO_TO_NAME[iso];
            const isSel = name && curCountry === name;
            const isDim = curCountry && name && curCountry !== name;
            return (
              <path
                key={f.id}
                d={pathGen(f)}
                fill={isSel ? '#9DC89A' : '#C2D4BA'}
                stroke="white"
                strokeWidth={0.5 / transform.k}
                opacity={isDim ? 0.3 : 1}
                style={{ cursor: name ? 'pointer' : 'default', transition: 'opacity .2s, fill .2s' }}
                onClick={(e) => { e.stopPropagation(); name && onSelectCountry(name); }}
              />
            );
          })}

          {curItem && <BgArrows curItem={curItem} strokeScale={inverseScale} />}

      {curItem && curCountry && (activeTab === 'imports' || activeTab === 'exports') &&
      curItem.regions.some(r => r.name === curCountry) && (
      <TradeArrows
        curItem={curItem}
        curCountry={curCountry}
        direction={activeTab === 'imports' ? 'import' : 'export'}
        strokeScale={inverseScale}
      />
      )}
        </g>

        {/* 노드 — 변환 그룹 밖에서 렌더링해서 크기 고정 */}
        {curItem && (
          <NodeLayer
            curItem={curItem}
            curCountry={curCountry}
            viewMode={viewMode}
            onSelectCountry={onSelectCountry}
            mapTransform={transform}
          />
        )}
      </svg>

      {!curItem && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#aaa', pointerEvents: 'none' }}>
          <div style={{ fontSize: 36 }}>🗺</div>
          <p style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.6 }}>품목을 선택하거나<br />지도의 국가를 클릭하세요</p>
        </div>
      )}

      {/* 줌 컨트롤 */}
      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[
          { label: '+', action: () => setTransform(t => ({ ...t, k: Math.min(t.k * 1.4, 8) })) },
          { label: '−', action: () => setTransform(t => ({ ...t, k: Math.max(t.k / 1.4, 1) })) },
          { label: '⌂', action: resetView },
        ].map(({ label, action }) => (
          <button key={label} onClick={action} style={{
            width: 28, height: 28, borderRadius: 6,
            border: '0.5px solid #ccc', background: 'rgba(255,255,255,.9)',
            fontSize: label === '⌂' ? 14 : 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '300', color: '#444',
          }}>{label}</button>
        ))}
      </div>

      <Legend viewMode={viewMode} />
    </div>
  );
}

/* ── 배경 흐름 화살표 ── */
function BgArrows({ curItem, strokeScale }) {
  const exporters = [...curItem.regions].map(r => ({ ...r, net: r.prod - r.cons })).filter(r => r.net > 0).sort((a, b) => b.net - a.net).slice(0, 3);
  const importers = [...curItem.regions].map(r => ({ ...r, net: r.prod - r.cons })).filter(r => r.net < 0).sort((a, b) => a.net - b.net).slice(0, 3);
  return (
    <>
      {exporters.flatMap(exp => importers.map(imp => {
        const p = ll2xy(exp.lat, exp.lng), c = ll2xy(imp.lat, imp.lng);
        if (!p || !c) return null;
        const mx = (p.x + c.x) / 2, my = Math.min(p.y, c.y) - 50;
        return (
          <path key={`${exp.name}-${imp.name}`}
            d={`M${p.x},${p.y} Q${mx},${my} ${c.x},${c.y}`}
            fill="none" stroke="#aaa" strokeWidth={0.5 * strokeScale}
            strokeDasharray={`${5 * strokeScale} ${4 * strokeScale}`}
            opacity="0.2" markerEnd="url(#a-bg)" className="ta"
          />
        );
      }))}
    </>
  );
}

/* ── 수입/수출 화살표 ── */
function TradeArrows({ curItem, curCountry, direction, strokeScale }) {
  const isImp = direction === 'import';
  const focal = curItem.regions.find(r => r.name === curCountry);
  if (!focal) return null;
  const entries = isImp ? focal.imports : focal.exports;
  if (!entries?.length) return null;
  const fp = ll2xy(focal.lat, focal.lng);
  if (!fp) return null;

  return (
    <>
      {entries.map(entry => {
        const partnerName = isImp ? entry.from : entry.to;
        const coords = getCoords(partnerName, curItem.regions);
        if (!coords) return null;
        const sp = ll2xy(coords.lat, coords.lng);
        if (!sp) return null;
        const [ax, ay] = isImp ? [sp.x, sp.y] : [fp.x, fp.y];
        const [bx, by] = isImp ? [fp.x, fp.y] : [sp.x, sp.y];
        const mx = (ax + bx) / 2;
        const my = Math.min(ay, by) - 45;
        const w = (0.5 + Math.pow(entry.pct / 100, 0.5) * 10) * strokeScale;
        const color  = isImp ? '#3B8BD4' : '#E8593C';
        const marker = isImp ? 'url(#a-imp)' : 'url(#a-exp)';

        // 파트너 국가가 지도 노드에 있는지 확인 (없으면 화살표에 이름 표시)
        const isInRegions = curItem.regions.some(r => r.name === partnerName);
        const labelX = (ax + mx) / 2;
        const labelY = (ay + my) / 2 - 6 * strokeScale;

        return (
          <g key={partnerName}>
            <path
              d={`M${ax},${ay} Q${mx},${my} ${bx},${by}`}
              fill="none" stroke={color} strokeWidth={w}
              strokeDasharray={`${5 * strokeScale} ${4 * strokeScale}`}
              opacity="0.75" className="ta" markerEnd={marker}
            />
            {/* 파트너 국가가 노드로 안 보일 때만 이름 표시 */}
            {!isInRegions && (
              <>
                <rect
                  x={labelX - partnerName.length * 3.5 * strokeScale}
                  y={labelY - 8 * strokeScale}
                  width={partnerName.length * 7 * strokeScale}
                  height={14 * strokeScale}
                  rx={3 * strokeScale}
                  fill="white" opacity="0.85"
                />
                <text
                  x={labelX} y={labelY + 2 * strokeScale}
                  textAnchor="middle"
                  fontSize={10 * strokeScale}
                  fontWeight="500"
                  fill={color}
                  style={{ pointerEvents: 'none' }}
                >
                  {partnerName}
                </text>
              </>
            )}
          </g>
        );
      })}
    </>
  );
}

/* ── 노드 레이어 (줌 변환 밖 → 크기 고정) ── */
function NodeLayer({ curItem, curCountry, viewMode, onSelectCountry, mapTransform }) {
  const maxP = Math.max(...curItem.regions.map(r => r.prod));
  const maxC = Math.max(...curItem.regions.map(r => r.cons));
  const maxN = Math.max(...curItem.regions.map(r => Math.abs(r.prod - r.cons)));
  const { x: tx, y: ty, k } = mapTransform;

  return (
    <>
      {curItem.regions.map(region => {
        const net = region.prod - region.cons;
        const color = net > 0.001 ? '#E8593C' : net < -0.001 ? '#3B8BD4' : '#2AAB6E';
        let val, mx;
        if (viewMode === 'production')       { val = region.prod; mx = maxP; }
        else if (viewMode === 'consumption') { val = region.cons; mx = maxC; }
        else                                 { val = Math.abs(net); mx = maxN; }

        const size = nodeSize(val, mx);
        const r2   = size / 2;

        // 원래 SVG 좌표에 줌/패닝 변환 적용
        const raw = ll2xy(region.lat, region.lng);
        if (!raw) return null;
        const cx = raw.x * k + tx;
        const cy = raw.y * k + ty;
        const isSel = curCountry === region.name;

        return (
          <g key={region.name} onClick={() => onSelectCountry(region.name)} style={{ cursor: 'pointer' }}>
            {isSel && (
              <circle cx={cx} cy={cy} r={r2 + 5}
                fill="none" stroke={color} strokeWidth="2" opacity="0.4" />
            )}
            <circle cx={cx} cy={cy} r={r2}
              fill={color} stroke="white" strokeWidth="2" />
            {isSel && (
              <text x={cx} y={cy + r2 + 13}
                textAnchor="middle" fontSize="11" fontWeight="500" fill="#1a1a1a"
                style={{ pointerEvents: 'none' }}>
                {region.name}
              </text>
            )}
          </g>
        );
      })}
    </>
  );
}
/* ── 범례 ── */
function Legend({ viewMode }) {
  const modeLabel = { production: '생산량', consumption: '소비량', net: '알짜 생산량' }[viewMode];
  return (
    <div style={{
      position: 'absolute', bottom: 8, left: 8,
      display: 'flex', gap: 10, flexWrap: 'wrap',
      background: 'rgba(255,255,255,.88)',
      padding: '5px 10px', borderRadius: 6,
      fontSize: 10, color: '#666',
    }}>
      {[['#E8593C', '순 수출국'], ['#3B8BD4', '순 수입국'], ['#2AAB6E', '균형국']].map(([c, l]) => (
        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
          {l}
        </div>
      ))}
      <div style={{ marginLeft: 4, color: '#888' }}>현재: <strong>{modeLabel}</strong></div>
    </div>
  );
}
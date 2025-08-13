'use client';

import { useState } from 'react';

export default function ScaleImpactPanel({ projectId }: { projectId: string }) {
  const [orgs, setOrgs] = useState(3);
  const [adoption, setAdoption] = useState(0.7);
  const [s, setS] = useState(0.9);
  const [mode, setMode] = useState<'hours'|'percent_linear'|'percent_geometric'|'fixed_discount'>('hours');
  const [hourlyRate, setHourlyRate] = useState(900);
  const [baseHours, setBaseHours] = useState(120);
  const [margHours, setMargHours] = useState(40);
  const [percentPerOrg, setPercentPerOrg] = useState(0.1);
  const [floorPct, setFloorPct] = useState(0.2);
  const [fixedDiscount, setFixedDiscount] = useState(100_000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const compute = async () => {
    setLoading(true);
    try {
      const scaling: any = {
        orgs,
        adoptionRatePct: adoption * 100,
        scalabilityCoefficient: s,
        replication: { mode }
      };
      if (mode === 'hours') Object.assign(scaling.replication, { baseReplicationHours: baseHours, hourlyRate, marginalHoursPerOrg: margHours });
      if (mode === 'percent_linear' || mode === 'percent_geometric') Object.assign(scaling.replication, { percentPerOrg, floorPct });
      if (mode === 'fixed_discount') Object.assign(scaling.replication, { fixedDiscountPerOrg: fixedDiscount });

      const res = await fetch('/api/impact/compute', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, scaling })
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121F2B] rounded-lg p-6 border border-gray-700">
      <h3 className="text-xl font-bold text-[#fecb00] mb-4">Aggregera effekt</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm mb-1">Antal organisationer</label>
          <input type="number" className="w-full p-2 bg-[#0e1722] border border-gray-700 rounded" value={orgs} onChange={e=>setOrgs(parseInt(e.target.value||'0'))} />
        </div>
        <div>
          <label className="block text-sm mb-1">Adoptionsgrad (%)</label>
          <input type="number" className="w-full p-2 bg-[#0e1722] border border-gray-700 rounded" value={Math.round(adoption*100)} onChange={e=>setAdoption(Math.max(0,Math.min(1,(parseInt(e.target.value||'0')/100))))} />
        </div>
        <div>
          <label className="block text-sm mb-1">Scalability coefficient (0.6–1.0)</label>
          <input type="number" step="0.05" className="w-full p-2 bg-[#0e1722] border border-gray-700 rounded" value={s} onChange={e=>setS(parseFloat(e.target.value||'1'))} />
        </div>
        <div>
          <label className="block text-sm mb-1">Replikeringsläge</label>
          <select className="w-full p-2 bg-[#0e1722] border border-gray-700 rounded" value={mode} onChange={e=>setMode(e.target.value as any)}>
            <option value="hours">Timmar × timpris</option>
            <option value="percent_linear">Procentuellt avdrag (linjärt)</option>
            <option value="percent_geometric">Procentuellt avdrag (geometriskt)</option>
            <option value="fixed_discount">Fast rabatt per org</option>
          </select>
        </div>
        {mode==='hours' && (
          <>
            <div>
              <label className="block text-sm mb-1">Basreplication (timmar, första extra org)</label>
              <input type="number" className="w-full p-2 bg-[#0e1722] border border-gray-700 rounded" value={baseHours} onChange={e=>setBaseHours(parseInt(e.target.value||'0'))} />
            </div>
            <div>
              <label className="block text-sm mb-1">Marginal timmar/org</label>
              <input type="number" className="w-full p-2 bg-[#0e1722] border border-gray-700 rounded" value={margHours} onChange={e=>setMargHours(parseInt(e.target.value||'0'))} />
            </div>
            <div>
              <label className="block text-sm mb-1">Timpris (SEK)</label>
              <input type="number" className="w-full p-2 bg-[#0e1722] border border-gray-700 rounded" value={hourlyRate} onChange={e=>setHourlyRate(parseInt(e.target.value||'0'))} />
            </div>
          </>
        )}
        {(mode==='percent_linear' || mode==='percent_geometric') && (
          <>
            <div>
              <label className="block text-sm mb-1">Procentuellt avdrag per org (0–1)</label>
              <input type="number" step="0.01" className="w-full p-2 bg-[#0e1722] border border-gray-700 rounded" value={percentPerOrg} onChange={e=>setPercentPerOrg(parseFloat(e.target.value||'0'))} />
            </div>
            <div>
              <label className="block text-sm mb-1">Lägsta andel av baskostnad (0–1)</label>
              <input type="number" step="0.05" className="w-full p-2 bg-[#0e1722] border border-gray-700 rounded" value={floorPct} onChange={e=>setFloorPct(parseFloat(e.target.value||'0'))} />
            </div>
          </>
        )}
        {mode==='fixed_discount' && (
          <div>
            <label className="block text-sm mb-1">Fast rabatt per extra org (SEK)</label>
            <input type="number" className="w-full p-2 bg-[#0e1722] border border-gray-700 rounded" value={fixedDiscount} onChange={e=>setFixedDiscount(parseInt(e.target.value||'0'))} />
          </div>
        )}
      </div>
      <button onClick={compute} disabled={loading} className="px-4 py-2 bg-[#fecb00] text-[#121F2B] font-semibold rounded">{loading? 'Beräknar…':'Beräkna'}</button>
      {result && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-[#fecb00]">{Math.round(result.kpis.totalBenefit).toLocaleString('sv-SE')} SEK</div>
            <div className="text-gray-400 text-xs">Total nytta</div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#fecb00]">{Math.round(result.kpis.totalCost).toLocaleString('sv-SE')} SEK</div>
            <div className="text-gray-400 text-xs">Total kostnad</div>
          </div>
          <div>
            <div className="text-xl font-bold" style={{color: result.kpis.economicROI>=0?'#10B981':'#EF4444'}}>{result.kpis.economicROI.toFixed(1)}%</div>
            <div className="text-gray-400 text-xs">ROI</div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#fecb00]">{isFinite(result.kpis.paybackYears)? result.kpis.paybackYears.toFixed(1): '—'}</div>
            <div className="text-gray-400 text-xs">Återbetalningstid (år)</div>
          </div>
        </div>
      )}
    </div>
  );
}


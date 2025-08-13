'use client';

import React from 'react';
import { useEffect, useState } from 'react';

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
  const [showInfo, setShowInfo] = useState(false);
  const [normEnabled, setNormEnabled] = useState(false);
  const [baseMetric, setBaseMetric] = useState<number>(1);
  const [targetMetric, setTargetMetric] = useState<number>(1);
  const [exponent, setExponent] = useState<number>(1);
  const [series, setSeries] = useState<Array<{ n: number; roi: number; benefit: number }>>([]);
  const [benefitUncPct, setBenefitUncPct] = useState<number>(20);
  const [costUncPct, setCostUncPct] = useState<number>(15);
  const [ci, setCi] = useState<{ p10: number; p50: number; p90: number } | null>(null);
  const [tornado, setTornado] = useState<Array<{ name: string; low: number; high: number; impact: number }>>([]);
  const [fieldText, setFieldText] = useState<Record<string, string>>({});

  // helpers for user-friendly numeric input that allows clearing
  const bindNum = (name: string, value: number, setter: (n: number)=>void, opts?: { step?: string; min?: number; max?: number; className?: string }) => {
    const display = fieldText[name] ?? String(value);
    return {
      value: display,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setFieldText(prev => ({ ...prev, [name]: e.target.value }));
      },
      onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
        const raw = e.target.value.trim();
        const num = raw === '' ? NaN : Number(raw);
        if (!isNaN(num)) {
          setter(num);
          setFieldText(prev => ({ ...prev, [name]: String(num) }));
        } else {
          // restore last valid
          setFieldText(prev => ({ ...prev, [name]: String(value) }));
        }
      },
      step: opts?.step,
      min: opts?.min,
      max: opts?.max,
      className: opts?.className ?? 'w-full p-2 bg-[#0e1722] border border-gray-700 rounded'
    } as any;
  };

  const bindPercent = (name: string, value01: number, setter01: (n01: number)=>void, opts?: { step?: string; className?: string }) => {
    const percent = Math.round(value01 * 100);
    const display = fieldText[name] ?? String(percent);
    return {
      value: display,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setFieldText(prev => ({ ...prev, [name]: e.target.value }));
      },
      onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
        const raw = e.target.value.trim();
        const num = raw === '' ? NaN : Number(raw);
        if (!isNaN(num)) {
          setter01(Math.max(0, Math.min(1, num / 100)));
          setFieldText(prev => ({ ...prev, [name]: String(Math.round(Math.max(0, Math.min(100, num)))) }));
        } else {
          setFieldText(prev => ({ ...prev, [name]: String(percent) }));
        }
      },
      step: opts?.step,
      className: opts?.className ?? 'w-full p-2 bg-[#0e1722] border border-gray-700 rounded'
    } as any;
  };

  // load persisted inputs per project
  useEffect(() => {
    try {
      const keyState = `scaleImpactState:${projectId}`;
      const rawState = localStorage.getItem(keyState);
      const keyInputs = `scaleImpactInputs:${projectId}`;
      const rawInputs = localStorage.getItem(keyInputs);
      const saved = rawState ? JSON.parse(rawState) : (rawInputs ? JSON.parse(rawInputs) : null);
      if (saved) {
        if (typeof saved.orgs === 'number') setOrgs(saved.orgs);
        if (typeof saved.adoption === 'number') setAdoption(saved.adoption);
        if (typeof saved.s === 'number') setS(saved.s);
        if (saved.mode) setMode(saved.mode);
        if (typeof saved.hourlyRate === 'number') setHourlyRate(saved.hourlyRate);
        if (typeof saved.baseHours === 'number') setBaseHours(saved.baseHours);
        if (typeof saved.margHours === 'number') setMargHours(saved.margHours);
        if (typeof saved.percentPerOrg === 'number') setPercentPerOrg(saved.percentPerOrg);
        if (typeof saved.floorPct === 'number') setFloorPct(saved.floorPct);
        if (typeof saved.fixedDiscount === 'number') setFixedDiscount(saved.fixedDiscount);
        if (typeof saved.normEnabled === 'boolean') setNormEnabled(saved.normEnabled);
        if (typeof saved.baseMetric === 'number') setBaseMetric(saved.baseMetric);
        if (typeof saved.targetMetric === 'number') setTargetMetric(saved.targetMetric);
        if (typeof saved.exponent === 'number') setExponent(saved.exponent);
        if (typeof saved.benefitUncPct === 'number') setBenefitUncPct(saved.benefitUncPct);
        if (typeof saved.costUncPct === 'number') setCostUncPct(saved.costUncPct);
        if (saved.result) setResult(saved.result);
        if (Array.isArray(saved.series)) setSeries(saved.series);
        if (saved.ci) setCi(saved.ci);
        if (Array.isArray(saved.tornado)) setTornado(saved.tornado);
        // seed text fields from loaded numbers
        setFieldText({
          orgs: String(saved.orgs ?? orgs),
          adoptionPct: String(Math.round((saved.adoption ?? adoption) * 100)),
          s: String(saved.s ?? s),
          hourlyRate: String(saved.hourlyRate ?? hourlyRate),
          baseHours: String(saved.baseHours ?? baseHours),
          margHours: String(saved.margHours ?? margHours),
          percentPerOrg: String(saved.percentPerOrg ?? percentPerOrg),
          floorPct: String(saved.floorPct ?? floorPct),
          fixedDiscount: String(saved.fixedDiscount ?? fixedDiscount),
          baseMetric: String(saved.baseMetric ?? baseMetric),
          targetMetric: String(saved.targetMetric ?? targetMetric),
          exponent: String(saved.exponent ?? exponent),
          benefitUncPct: String(saved.benefitUncPct ?? benefitUncPct),
          costUncPct: String(saved.costUncPct ?? costUncPct)
        });
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const compute = async () => {
    setLoading(true);
    try {
      const scaling: any = {
        orgs,
        adoptionRatePct: adoption * 100,
        scalabilityCoefficient: s,
        replication: { mode }
      };
      if (normEnabled) {
        scaling.normalization = { enabled: true, baseMetric, targetAvgMetric: targetMetric, exponent };
      }
      if (mode === 'hours') Object.assign(scaling.replication, { baseReplicationHours: baseHours, hourlyRate, marginalHoursPerOrg: margHours });
      if (mode === 'percent_linear' || mode === 'percent_geometric') Object.assign(scaling.replication, { percentPerOrg, floorPct, baseUnitCost: hourlyRate > 0 && baseHours > 0 ? 0 : undefined });
      if (mode === 'fixed_discount') Object.assign(scaling.replication, { fixedDiscountPerOrg: fixedDiscount });

      const res = await fetch('/api/impact/compute', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, scaling })
      });
      const data = await res.json();
      setResult(data);
      // persist latest inputs
      try {
        const key = `scaleImpactState:${projectId}`;
        const payload = { orgs, adoption, s, mode, hourlyRate, baseHours, margHours, percentPerOrg, floorPct, fixedDiscount, normEnabled, baseMetric, targetMetric, exponent, benefitUncPct, costUncPct };
        // Placeholders for outputs; will be completed below after series/ci/tornado are computed
        localStorage.setItem(key, JSON.stringify({ ...payload }));
      } catch {}
      // Build ROI vs N series (1..orgs)
      const seq: Array<{ n: number; roi: number; benefit: number }> = [];
      for (let i = 1; i <= Math.max(1, orgs); i++) {
        const s2 = JSON.parse(JSON.stringify(scaling));
        s2.orgs = i;
        const r = await fetch('/api/impact/compute', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, scaling: s2 })
        }).then(r => r.json());
        seq.push({ n: i, roi: Number(r?.kpis?.economicROI || 0), benefit: Number(r?.kpis?.totalBenefit || 0) });
      }
      setSeries(seq);

      // Compute simple P10/P50/P90 band based on uncertainty sliders
      const baseBenefit = Number(data?.kpis?.totalBenefit || 0);
      const baseCost = Number(data?.kpis?.totalCost || 0);
      const p50 = Number(data?.kpis?.economicROI || 0);
      const bU = Math.max(0, benefitUncPct) / 100;
      const cU = Math.max(0, costUncPct) / 100;
      const pessBenefit = baseBenefit * (1 - bU);
      const pessCost = baseCost * (1 + cU);
      const optBenefit = baseBenefit * (1 + bU);
      const optCost = baseCost * (1 - cU);
      const p10 = pessCost > 0 ? ((pessBenefit - pessCost) / pessCost) * 100 : 0;
      const p90 = optCost > 0 ? ((optBenefit - optCost) / optCost) * 100 : 0;
      setCi({ p10, p50, p90 });

      // Tornado: vary key drivers ±10%
      const variations: Array<{ name: string; apply: (x: any, dir: 1 | -1) => void }> = [
        { name: 'Adoptionsgrad', apply: (x, dir) => { x.adoptionRatePct = Math.max(0, Math.min(100, x.adoptionRatePct * (1 + 0.1 * dir))); } },
        { name: 'Scalability', apply: (x, dir) => { x.scalabilityCoefficient = Math.max(0.5, Math.min(1.2, x.scalabilityCoefficient * (1 + 0.1 * dir))); } },
        { name: 'Replikeringskostnad', apply: (x, dir) => {
          if (x.replication?.mode === 'hours') {
            x.replication.hourlyRate = Math.max(1, x.replication.hourlyRate * (1 + 0.1 * dir));
          } else if (x.replication?.mode === 'percent_linear' || x.replication?.mode === 'percent_geometric') {
              // vary the discount a bit och floor i samma riktning; baseUnitCost lämnas oförändrad
              x.replication.percentPerOrg = Math.max(0, Math.min(0.9, x.replication.percentPerOrg + 0.02 * dir));
              x.replication.floorPct = Math.max(0, Math.min(1, (x.replication.floorPct ?? 0.2) + 0.02 * dir));
          } else if (x.replication?.mode === 'fixed_discount') {
            x.replication.fixedDiscountPerOrg = Math.max(0, x.replication.fixedDiscountPerOrg * (1 + 0.1 * dir));
          }
        } }
      ];
      const baseROI = p50;
      const rows: Array<{ name: string; low: number; high: number; impact: number }> = [];
      for (const v of variations) {
        const sLow = JSON.parse(JSON.stringify(scaling)); v.apply(sLow, -1);
        const low = await fetch('/api/impact/compute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, scaling: sLow }) }).then(r => r.json());
        const roiLow = Number(low?.kpis?.economicROI || 0);
        const sHigh = JSON.parse(JSON.stringify(scaling)); v.apply(sHigh, +1);
        const high = await fetch('/api/impact/compute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, scaling: sHigh }) }).then(r => r.json());
        const roiHigh = Number(high?.kpis?.economicROI || 0);
        const impact = Math.max(Math.abs(roiLow - baseROI), Math.abs(roiHigh - baseROI));
        rows.push({ name: v.name, low: roiLow, high: roiHigh, impact });
      }
      rows.sort((a, b) => b.impact - a.impact);
      setTornado(rows);

      // persist outputs as well
      try {
        const key = `scaleImpactState:${projectId}`;
        const payloadOutputs = {
          orgs, adoption, s, mode, hourlyRate, baseHours, margHours, percentPerOrg, floorPct, fixedDiscount,
          normEnabled, baseMetric, targetMetric, exponent, benefitUncPct, costUncPct,
          result: data, series: seq, ci: { p10, p50, p90 }, tornado: rows
        };
        localStorage.setItem(key, JSON.stringify(payloadOutputs));
      } catch {}

      // save to server so portfolio can use latest scaled result
      try {
        await fetch('/api/impact/save', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, scalingInput: scaling, result: data })
        });
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121F2B] rounded-lg p-6 border border-gray-700">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-xl font-bold text-[#fecb00] mb-4">Aggregera effekt</h3>
        <button onClick={()=>setShowInfo(true)} className="px-3 py-1 rounded bg-[#0e1722] border border-gray-700 text-sm text-[#fffefa] hover:bg-[#1a2a36]">Info</button>
      </div>

      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setShowInfo(false)}></div>
          <div className="relative bg-[#121F2B] border border-gray-700 rounded-xl p-0 w-full max-w-3xl shadow-xl overflow-hidden">
            <div className="max-h-[85vh] overflow-y-auto p-6">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-lg font-bold text-[#fecb00]">Hur beräknas detta?</h4>
                <button onClick={()=>setShowInfo(false)} className="text-gray-300 hover:text-[#fffefa]">×</button>
              </div>
              <div className="text-sm text-gray-300 space-y-3">
                <p>Vi skalar upp ett projekts faktiska nytta och kostnad till flera organisationer och beräknar ROI enligt samma principer som i projektets ROI.</p>
                <div>
                  <div className="font-semibold text-[#fffefa] mb-1">1) Ingångsvärden</div>
                  <ul className="list-disc ml-5 space-y-1">
                    <li><span className="text-[#fecb00]">Antal organisationer (N)</span>: hur många som inför.</li>
                    <li><span className="text-[#fecb00]">Adoptionsgrad</span>: andel av N som faktiskt går live. Effektiv N = N × adoption.</li>
                    <li><span className="text-[#fecb00]">Scalability</span>: dämpning (0.6–1.0) av nytta per extra org p.g.a. avtagande marginalnytta.</li>
                    <li><span className="text-[#fecb00]">Replikeringskostnad</span>: välj modell:
                      <ul className="list-[circle] ml-6">
                        <li>Timmar × timpris (bas + marginal per org)</li>
                        <li>Procentuellt avdrag (linjärt eller geometriskt) mot basens kostnad</li>
                        <li>Fast rabatt per extra org</li>
                      </ul>
                    </li>
                    <li><span className="text-[#fecb00]">Normalisering</span> (valfritt): justera nytta per org efter en driver (t.ex. befolkning). Vi skalar med (mål/bas)<sup>exponent</sup>. Exponent 1.0 = proportionellt.</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-[#fffefa] mb-1">2) Resultat</div>
                  <ul className="list-disc ml-5 space-y-1">
                    <li><span className="text-[#fecb00]">Total nytta</span> och <span className="text-[#fecb00]">Total kostnad</span> för Effektiv N.</li>
                    <li><span className="text-[#fecb00]">ROI</span> = ((Total nytta − Total kostnad) / Total kostnad) × 100.</li>
                    <li><span className="text-[#fecb00]">Återbetalningstid</span> beräknas från basprojektets årliga nytta och skalar proportionerligt.</li>
                    <li><span className="text-[#fecb00]">Nytta per värdedimension</span> visar var nyttan uppstår.</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-[#fffefa] mb-1">2b) Beräkningsflöde (formler)</div>
                  <ul className="list-disc ml-5 space-y-1">
                    <li><span className="text-[#fecb00]">Bas-ROI (projekt)</span>: ROI<sub>bas</sub> = ((Nytta<sub>bas</sub> − Kostnad<sub>bas</sub>) / Kostnad<sub>bas</sub>) × 100.</li>
                    <li><span className="text-[#fecb00]">Effektiv N</span>: N<sub>eff</sub> = round(N × adoptionRate), min 1 om adoptionRate &gt; 0.</li>
                    <li><span className="text-[#fecb00]">Normalisering</span>: Nytta<sub>org</sub> = Nytta<sub>bas</sub> × (Mål/Bas)<sup>exponent</sup>.</li>
                    <li><span className="text-[#fecb00]">Avtagande nytta</span>: Total nytta = Σ Nytta<sub>org</sub> × s<sup>i</sup>, i = 0..(N<sub>eff</sub>−1).</li>
                    <li><span className="text-[#fecb00]">Replikeringskostnad</span> (extra för org i≥2):
                      <ul className="list-[circle] ml-6">
                        <li>Timmar: extra<sub>i</sub> = (basRep för i=2 + marginal) × timpris</li>
                        <li>Linjär procent: extra<sub>i</sub> = Kostnad<sub>bas</sub> × max(golv, 1 − pct×(i−1))</li>
                        <li>Geometrisk procent: extra<sub>i</sub> = Kostnad<sub>bas</sub> × max(golv, (1 − pct)<sup>(i−1)</sup>)</li>
                        <li>Fast rabatt: extra<sub>i</sub> = max(0, Kostnad<sub>bas</sub> − rabatt×(i−1))</li>
                      </ul>
                    </li>
                    <li><span className="text-[#fecb00]">Total kostnad</span>: Kostnad<sub>tot</sub> = Kostnad<sub>bas</sub> + Σ extra<sub>i</sub>.</li>
                    <li><span className="text-[#fecb00]">Skalad ROI</span>: ROI = ((Nytta<sub>tot</sub> − Kostnad<sub>tot</sub>) / Kostnad<sub>tot</sub>) × 100.</li>
                    <li><span className="text-[#fecb00]">Återbetalningstid</span>: 
                      Årlig nytta<sub>bas</sub> = Kostnad<sub>bas</sub>/Payback<sub>bas</sub>,  
                      Årlig nytta<sub>sk</sub> = Årlig nytta<sub>bas</sub> × (Nytta<sub>tot</sub>/Nytta<sub>bas</sub>),  
                      Payback<sub>sk</sub> = Kostnad<sub>tot</sub>/Årlig nytta<sub>sk</sub>.
                    </li>
                    <li><span className="text-[#fecb00]">Osäkerhet</span>: P10/P90 beräknas genom Nytta ± u<sub>nytta</sub>%, Kostnad ∓ u<sub>kost</sub>%.</li>
                    <li><span className="text-[#fecb00]">Tornado</span>: ändra en parameter ±10% och jämför ROI mot bas.</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-[#fffefa] mb-1">3) Osäkerhet och känslighet</div>
                  <ul className="list-disc ml-5 space-y-1">
                    <li><span className="text-[#fecb00]">Intervall (P10–P90)</span>: vi visar ett spann genom att sänka/höja nytta och höja/sänka kostnad med valda osäkerheter.</li>
                    <li><span className="text-[#fecb00]">Tornado</span>: visar vilka parametrar (adoption, scalability, replikering) som påverkar ROI mest (±10%).</li>
                  </ul>
                </div>
                <div className="text-xs text-gray-400">Notera: Detta är en beslutsstödande modell, inga statistiska garantier. Ange rimliga normaliserings- och osäkerhetsnivåer för ert sammanhang.</div>
              </div>
              <div className="mt-4 text-right sticky bottom-0 pt-3 bg-[#121F2B]">
                <button onClick={()=>setShowInfo(false)} className="px-4 py-2 bg-[#fecb00] text-[#121F2B] font-semibold rounded">Stäng</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm mb-1">Antal organisationer</label>
          <input type="number" {...bindNum('orgs', orgs, setOrgs)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Adoptionsgrad (%)</label>
          <input type="number" {...bindPercent('adoptionPct', adoption, setAdoption)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Scalability coefficient (0.6–1.0)</label>
          <input type="number" {...bindNum('s', s, setS, { step: '0.05' })} />
        </div>
        <div className="md:col-span-2 bg-[#0e1722] border border-gray-700 rounded p-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={normEnabled} onChange={e=>setNormEnabled(e.target.checked)} />
            Aktivera normalisering efter driver (t.ex. befolkning)
          </label>
          {normEnabled && (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="block text-xs mb-1">Basvärde (referensorg)</label>
                <input type="number" {...bindNum('baseMetric', baseMetric, setBaseMetric, { className: 'w-full p-2 bg-[#121F2B] border border-gray-700 rounded' })} />
              </div>
              <div>
                <label className="block text-xs mb-1">Snittvärde (målorg)</label>
                <input type="number" {...bindNum('targetMetric', targetMetric, setTargetMetric, { className: 'w-full p-2 bg-[#121F2B] border border-gray-700 rounded' })} />
              </div>
              <div>
                <label className="block text-xs mb-1">Exponent (känslighet)</label>
                <input type="number" {...bindNum('exponent', exponent, setExponent, { step: '0.05', className: 'w-full p-2 bg-[#121F2B] border border-gray-700 rounded' })} />
              </div>
            </div>
          )}
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
              <input type="number" {...bindNum('baseHours', baseHours, setBaseHours)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Marginal timmar/org</label>
              <input type="number" {...bindNum('margHours', margHours, setMargHours)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Timpris (SEK)</label>
              <input type="number" {...bindNum('hourlyRate', hourlyRate, setHourlyRate)} />
            </div>
          </>
        )}
        {(mode==='percent_linear' || mode==='percent_geometric') && (
          <>
            <div>
              <label className="block text-sm mb-1">Procentuellt avdrag per org (0–1)</label>
              <input type="number" {...bindNum('percentPerOrg', percentPerOrg, setPercentPerOrg, { step: '0.01' })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Lägsta andel av baskostnad (0–1)</label>
              <input type="number" {...bindNum('floorPct', floorPct, setFloorPct, { step: '0.05' })} />
            </div>
          </>
        )}
        {mode==='fixed_discount' && (
          <div>
            <label className="block text-sm mb-1">Fast rabatt per extra org (SEK)</label>
            <input type="number" {...bindNum('fixedDiscount', fixedDiscount, setFixedDiscount)} />
          </div>
        )}
      </div>
      <button onClick={compute} disabled={loading} className="px-4 py-2 bg-[#fecb00] text-[#121F2B] font-semibold rounded">{loading? 'Beräknar…':'Beräkna'}</button>
      {result && (
        <div className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-4">
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
          {result.breakdown?.byValueDimension && (
            <div className="mt-2">
              <h4 className="text-sm font-semibold text-[#fffefa] mb-2">Nytta per värdedimension</h4>
              <div className="space-y-2 text-xs">
                {Object.entries(result.breakdown.byValueDimension).map(([dim, v]: any) => (
                  <div key={dim} className="flex items-center justify-between">
                    <span className="text-gray-300">{dim}</span>
                    <span className="text-[#fecb00] font-semibold">{Math.round(v.totalValue).toLocaleString('sv-SE')} SEK</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {series.length > 1 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-[#fffefa] mb-2">ROI vs antal organisationer</h4>
              <div className="text-xs text-gray-400 mb-2">Visar hur ROI förändras när lösningen införs i fler organisationer (N=1 motsvarar projektets bas-ROI).</div>
              <RoiLine series={series} />
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0e1722] border border-gray-700 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-[#fffefa]">Osäkerhet (P10–P90)</h4>
                <div className="text-xs text-gray-400">Nytta ±{benefitUncPct}%, Kostnad ±{costUncPct}%</div>
              </div>
              <div className="text-xs text-gray-400 mb-2">P10/P90 räknas genom att minska/öka nytta och öka/minska kostnad med angivna osäkerheter.</div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <label className="block mb-1">Nytta osäkerhet (%)</label>
                  <input type="number" {...bindNum('benefitUncPct', benefitUncPct, setBenefitUncPct, { className: 'w-full p-2 bg-[#121F2B] border border-gray-700 rounded' })} />
                </div>
                <div>
                  <label className="block mb-1">Kostnad osäkerhet (%)</label>
                  <input type="number" {...bindNum('costUncPct', costUncPct, setCostUncPct, { className: 'w-full p-2 bg-[#121F2B] border border-gray-700 rounded' })} />
                </div>
              </div>
              {ci && (
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-300">
                    <span>P10</span><span className="text-[#fecb00] font-semibold">{ci.p10.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-300">
                    <span>P50</span><span className="text-[#fecb00] font-semibold">{ci.p50.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-300">
                    <span>P90</span><span className="text-[#fecb00] font-semibold">{ci.p90.toFixed(1)}%</span>
                  </div>
                  <CiBar p10={ci.p10} p50={ci.p50} p90={ci.p90} />
                </div>
              )}
            </div>
            <div className="bg-[#0e1722] border border-gray-700 rounded p-3">
              <h4 className="text-sm font-semibold text-[#fffefa] mb-2">Känslighet (Tornado)</h4>
              <div className="text-xs text-gray-400 mb-2">Visar hur ROI påverkas när en parameter varieras ±10% (övriga hålls konstanta). Låga/höga stapeländar visar ROI-min/max.</div>
              <TornadoChart rows={tornado} base={result.kpis.economicROI} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RoiLine({ series }: { series: Array<{ n:number; roi:number }> }){
  const width = 520; const height = 160; const pad = 24;
  const xs = series.map(d=>d.n); const ys = series.map(d=>d.roi);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(0, Math.min(...ys)); const yMax = Math.max(...ys);
  const x = (v:number)=> pad + (width-2*pad) * ((v - xMin) / Math.max(1,(xMax - xMin)));
  const y = (v:number)=> height - pad - (height-2*pad) * ((v - yMin) / Math.max(1,(yMax - yMin)));
  const d = series.map((p,i)=> `${i===0?'M':'L'} ${x(p.n)} ${y(p.roi)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 bg-[#0e1722] border border-gray-700 rounded">
      <line x1={pad} y1={y(0)} x2={width-pad} y2={y(0)} stroke="#374151" strokeDasharray="4 4" />
      <line x1={pad} y1={pad} x2={pad} y2={height-pad} stroke="#374151" />
      <path d={d} fill="none" stroke="#fecb00" strokeWidth={2} />
      {series.map((p,i)=> (
        <circle key={i} cx={x(p.n)} cy={y(p.roi)} r={2.5} fill="#fecb00" />
      ))}
      {series.map((p,i)=> (
        <text key={'xl'+i} x={x(p.n)} y={height-6} fontSize="10" textAnchor="middle" fill="#9CA3AF">{p.n}</text>
      ))}
      {[yMin, (yMin+yMax)/2, yMax].map((v,i)=> (
        <text key={'yl'+i} x={4} y={y(v)+3} fontSize="10" fill="#9CA3AF">{v.toFixed(0)}%</text>
      ))}
    </svg>
  );
}

function CiBar({ p10, p50, p90 }: { p10:number; p50:number; p90:number }){
  const width = 520; const height = 60; const pad = 24;
  const min = Math.min(p10, 0); const max = Math.max(p90, 0);
  const x = (v:number)=> pad + (width-2*pad) * ((v - min) / Math.max(1,(max - min)));
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16 bg-[#0e1722] border border-gray-700 rounded mt-2">
      <line x1={x(0)} y1={12} x2={x(0)} y2={height-12} stroke="#374151" />
      <rect x={Math.min(x(p10),x(p90))} y={height/2-6} width={Math.abs(x(p90)-x(p10))} height={12} fill="#1f2937" />
      <line x1={x(p50)} y1={height/2-10} x2={x(p50)} y2={height/2+10} stroke="#fecb00" strokeWidth={2} />
      {[p10,p50,p90].map((v,i)=> (
        <text key={i} x={x(v)} y={height-6} fontSize="10" textAnchor="middle" fill="#9CA3AF">{v.toFixed(0)}%</text>
      ))}
    </svg>
  );
}

function TornadoChart({ rows, base }: { rows: Array<{ name:string; low:number; high:number }>; base:number }){
  const width = 520; const barH = 22; const pad = 36; const height = Math.max(100, rows.length * (barH+16) + 36);
  // Symmetric domain around base so inte en parameter dominerar och baslinjen ligger i mitten
  const extremes = rows.flatMap(r => [r.low, r.high]);
  const maxDelta = Math.max(1, ...extremes.map(v => Math.abs(v - base)));
  const domainPad = maxDelta * 0.1; // 10% luft
  const min = base - maxDelta - domainPad;
  const max = base + maxDelta + domainPad;
  const xRaw = (v:number)=> pad + (width-2*pad) * ((v - min) / Math.max(1,(max - min)));
  const clamp = (px:number)=> Math.max(pad+4, Math.min(width - pad - 4, px));
  const x = (v:number)=> clamp(xRaw(v));
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full bg-[#0e1722] border border-gray-700 rounded">
      <line x1={x(base)} y1={14} x2={x(base)} y2={height-14} stroke="#374151" />
      {rows.map((r, i)=> {
        const y = 18 + i*(barH+16);
        const xL = x(r.low); const xH = x(r.high);
        const x0 = Math.min(xL, xH), w = Math.abs(xH - xL);
        return (
          <g key={r.name}>
            <text x={8} y={y+barH-6} fontSize="11" fill="#9CA3AF">{r.name}</text>
            <rect x={x0} y={y} width={w} height={barH} fill="#1f2937" rx="4" ry="4" />
            <line x1={xL} y1={y} x2={xL} y2={y+barH} stroke="#EF4444" />
            <line x1={xH} y1={y} x2={xH} y2={y+barH} stroke="#10B981" />
            <circle cx={xL} cy={y+barH/2} r={3} fill="#EF4444" />
            <circle cx={xH} cy={y+barH/2} r={3} fill="#10B981" />
            <text x={xL-6} y={y-2} fontSize="10" textAnchor="end" fill="#EF4444">{r.low.toFixed(0)}%</text>
            <text x={xH+6} y={y-2} fontSize="10" textAnchor="start" fill="#10B981">{r.high.toFixed(0)}%</text>
          </g>
        );
      })}
      <text x={x(base)} y={16} fontSize="10" textAnchor="middle" fill="#9CA3AF">Bas {base.toFixed(0)}%</text>
    </svg>
  );
}

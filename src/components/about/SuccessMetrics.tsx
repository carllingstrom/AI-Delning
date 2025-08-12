'use client';

import { useEffect, useState } from 'react';

type Analytics = {
  summary?: {
    totalProjects?: number;
    averageROI?: number;
  };
  effectsAnalysis?: {
    roiByValueDimension?: Record<string, any>;
  };
  breakdowns?: {
    byArea?: Record<string, any>;
    byValueDimension?: Record<string, any>;
  };
  projects?: Array<{
    calculatedMetrics?: {
      roi?: number | null;
    };
  }>;
};

export default function SuccessMetrics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/analytics', { cache: 'no-store' });
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (_e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const totalProjects = analytics?.summary?.totalProjects;

  // Robust average ROI: prefer computed from projects when available
  const derivedAverageROI = (() => {
    const rois = (analytics?.projects || [])
      .map((p) => (p?.calculatedMetrics?.roi as number) ?? NaN)
      .filter((v) => Number.isFinite(v));
    if (rois.length > 0) {
      const avg = rois.reduce((sum, v) => sum + Number(v), 0) / rois.length;
      return avg;
    }
    const apiAvg = analytics?.summary?.averageROI;
    return typeof apiAvg === 'number' && Number.isFinite(apiAvg) ? apiAvg : undefined;
  })();

  // Dimensions with ROI data: prefer ROI-by-dimension keys; fallback to plain breakdowns
  const valueDims = (() => {
    const withROI = analytics?.effectsAnalysis?.roiByValueDimension;
    if (withROI && Object.keys(withROI).length > 0) return Object.keys(withROI).length;
    const plain = analytics?.breakdowns?.byValueDimension;
    return plain ? Object.keys(plain).length : undefined;
  })();

  const areas = analytics?.breakdowns?.byArea ? Object.keys(analytics.breakdowns.byArea).length : undefined;

  const renderValue = (v?: number, suffix = '') =>
    typeof v === 'number' && Number.isFinite(v) ? `${v}${suffix}` : '—';

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 text-center">
      <div>
        <div className="text-3xl font-bold text-[#fecb00] mb-2">{renderValue(totalProjects)}</div>
        <div className="text-gray-400">Projekt i portalen</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-[#fecb00] mb-2">
          {typeof derivedAverageROI === 'number' && Number.isFinite(derivedAverageROI)
            ? `${derivedAverageROI.toFixed(1)}%`
            : '—'}
        </div>
        <div className="text-gray-400">Genomsnittlig ROI</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-[#fecb00] mb-2">{renderValue(valueDims)}</div>
        <div className="text-gray-400">Värdedimensioner med ROI-data</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-[#fecb00] mb-2">{renderValue(areas)}</div>
        <div className="text-gray-400">Verksamhetsområden täckta</div>
      </div>
      {loading && (
        <div className="col-span-full text-xs text-gray-500">Laddar framgångsmått…</div>
      )}
    </div>
  );
}


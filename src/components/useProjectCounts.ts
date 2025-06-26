// /src/components/useProjectCounts.ts
'use client';
import { useEffect, useState } from 'react';
// Hook for fetching project counts per municipality

export default function useProjectCounts(
  aiOn: Record<string, boolean>,
  valOn: Record<string, boolean>
) {
  const [map, setMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const ai  = Object.keys(aiOn).filter(k => aiOn[k]).join(',');
    const val = Object.keys(valOn).filter(k => valOn[k]).join(',');
    fetch(`/api/counts?ai=${encodeURIComponent(ai)}&val=${encodeURIComponent(val)}`)
      .then(r => r.json())
      .then((rows: { name: string; project_count: number }[]) => {
        const obj: Record<string, number> = {};
        // Ensure rows is an array before calling forEach
        if (Array.isArray(rows)) {
          rows.forEach(r => (obj[r.name] = r.project_count));
        }
        setMap(obj);
      })
      .catch(error => {
        console.error('Error fetching project counts:', error);
        setMap({});
      });
  }, [aiOn, valOn]);

  return map;
}

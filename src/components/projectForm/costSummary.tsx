import React from 'react';

type CostEntry = {
  costType?: string;
  costHours?: number;
  costRate?: number;
  costFixed?: number;
};

export const renderCostSummary = (items: CostEntry[] = []) => {
  const totalsByType: Record<string, number> = {};

  (items || []).forEach(item => {
    if (!item) return;

    const hours = Number(item.costHours) || 0;
    const rate = Number(item.costRate) || 0;
    const fixed = Number(item.costFixed) || 0;
    const entryTotal = (hours * rate) + fixed;

    if (entryTotal > 0) {
      const type = item.costType || 'Okategoriserad';
      if (!totalsByType[type]) {
        totalsByType[type] = 0;
      }
      totalsByType[type] += entryTotal;
    }
  });

  const grandTotal = Object.values(totalsByType).reduce((acc, total) => acc + total, 0);

  if (grandTotal === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-[#23272A] rounded-lg">
      <h4 className="font-semibold text-lg text-white mb-3">Kostnadssammanställning</h4>
      
      {Object.keys(totalsByType).length > 0 && (
        <ul className="space-y-1 text-gray-300 mb-3 border-b border-gray-600 pb-3">
          {Object.entries(totalsByType).map(([type, total]) => (
            <li key={type} className="flex justify-between items-center text-sm">
              <span>{type}</span>
              <span className="font-medium text-white">{total.toLocaleString('sv-SE')} SEK</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-between items-center">
        <p className="font-semibold text-base text-white">Total beräknad kostnad:</p>
        <p className="font-bold text-xl text-[#FFD600]">
          {grandTotal.toLocaleString('sv-SE')} SEK
        </p>
      </div>
    </div>
  );
}; 
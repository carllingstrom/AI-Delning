import React from 'react';

type CostEntry = {
  costType?: string;
  costUnit?: 'hours' | 'fixed' | 'monthly' | 'yearly';
  costLabel?: string;
  // Nested field structures
  hoursDetails?: {
    hours?: number;
    hourlyRate?: number;
  };
  fixedDetails?: {
    fixedAmount?: number;
  };
  monthlyDetails?: {
    monthlyAmount?: number;
    monthlyDuration?: number;
  };
  yearlyDetails?: {
    yearlyAmount?: number;
    yearlyDuration?: number;
  };
};

export const renderCostSummary = (items: CostEntry[] = []) => {

  const totalsByType: Record<string, number> = {};

  (items || []).forEach(item => {
    if (!item) return;


    let entryTotal = 0;

    // Calculate total based on unit type
    switch (item.costUnit) {
      case 'hours':
        const hours = Number(item.hoursDetails?.hours) || 0;
        const rate = Number(item.hoursDetails?.hourlyRate) || 0;
        entryTotal = hours * rate;
        break;
      
      case 'fixed':
        entryTotal = Number(item.fixedDetails?.fixedAmount) || 0;
        break;
      
      case 'monthly':
        const monthlyAmount = Number(item.monthlyDetails?.monthlyAmount) || 0;
        const monthlyDuration = Number(item.monthlyDetails?.monthlyDuration) || 1;
        entryTotal = monthlyAmount * monthlyDuration;
        break;
      
      case 'yearly':
        const yearlyAmount = Number(item.yearlyDetails?.yearlyAmount) || 0;
        const yearlyDuration = Number(item.yearlyDetails?.yearlyDuration) || 1;
        entryTotal = yearlyAmount * yearlyDuration;
        break;
      
      default:
        entryTotal = 0;
    }


    if (entryTotal > 0) {
      const type = item.costType || 'Okategoriserad';
      if (!totalsByType[type]) {
        totalsByType[type] = 0;
      }
      totalsByType[type] += entryTotal;

    }
  });

  const grandTotal = Object.values(totalsByType).reduce((acc, total) => acc + total, 0);

  return (
    <div className="mt-4 p-4 bg-[#23272A] rounded-lg">
      <h4 className="font-semibold text-lg text-white mb-3">Kostnadssammanställning</h4>
      
      {Object.keys(totalsByType).length > 0 ? (
        <>
        <ul className="space-y-1 text-gray-300 mb-3 border-b border-gray-600 pb-3">
          {Object.entries(totalsByType).map(([type, total]) => (
            <li key={type} className="flex justify-between items-center text-sm">
              <span>{type}</span>
              <span className="font-medium text-white">{total.toLocaleString('sv-SE')} SEK</span>
            </li>
          ))}
        </ul>
      <div className="flex justify-between items-center">
        <p className="font-semibold text-base text-white">Total beräknad kostnad:</p>
        <p className="font-bold text-xl text-[#FFD600]">
          {grandTotal.toLocaleString('sv-SE')} SEK
        </p>
      </div>
        </>
      ) : (
        <div className="text-gray-400 text-sm">
          <p>Inga kostnadsposter tillagda ännu.</p>
          <p>Lägg till kostnadsposter för att se sammanställning.</p>
        </div>
      )}
    </div>
  );
}; 
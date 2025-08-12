import React, { useState, useMemo } from 'react';
import { getROIColor, formatCurrency, formatPercentage } from '@/lib/utils';
import ROIInfoModal from './ROIInfoModal';
import { computeROIMetrics } from '@/services/roi/roi.service';
import type { EffectEntry } from '@/domain';

interface ROISummaryProps {
  effectEntries: EffectEntry[];
  costEntries: any[];
  budgetAmount?: number | string | null;
}

export default function ROISummary({ effectEntries, costEntries, budgetAmount }: ROISummaryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const roiMetrics = useMemo(() => {
    return computeROIMetrics({ effectEntries: effectEntries || [], costEntries, budgetAmount });
  }, [effectEntries, costEntries, budgetAmount]);

  return (
    <div className="bg-[#224556] rounded-lg p-6 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-[#121F2B] p-4 rounded">
          <div className="text-sm text-gray-400">Finansiell ROI</div>
          <div className={`text-lg font-bold ${getROIColor(roiMetrics.economicROI)}`}>
            {formatPercentage(roiMetrics.economicROI)}
          </div>
        </div>
        
        <div className="bg-[#121F2B] p-4 rounded">
          <div className="text-sm text-gray-400">Kvalitativ effekt</div>
          <div className={`text-lg font-bold ${getROIColor(roiMetrics.qualitativeROI)}`}>
            {formatPercentage(roiMetrics.qualitativeROI)}
          </div>
        </div>
        
        <div className="bg-[#121F2B] p-4 rounded">
          <div className="text-sm text-gray-400">Kombinerad effekt</div>
          <div className={`text-lg font-bold ${getROIColor(roiMetrics.combinedROI)}`}>
            {formatPercentage(roiMetrics.combinedROI)}
          </div>
        </div>
        
        <div className="bg-[#121F2B] p-4 rounded">
          <div className="text-sm text-gray-400">Återbetalningstid</div>
          <div className="text-lg font-bold text-[#fffefa]">
            {roiMetrics.paybackPeriod.toFixed(1)} år
          </div>
        </div>
        
        <div className="bg-[#121F2B] p-4 rounded">
          <div className="text-sm text-gray-400">Total monetär nytta</div>
          <div className="text-lg font-bold text-[#fffefa]">
            {formatCurrency(roiMetrics.totalMonetaryValue)}
          </div>
        </div>
        
        <div className="bg-[#121F2B] p-4 rounded">
          <div className="text-sm text-gray-400">Antal effekter</div>
          <div className="text-lg font-bold text-[#fffefa]">
            {roiMetrics.summary.totalEffects}
          </div>
          <div className="text-xs text-gray-400">
            {roiMetrics.summary.financialCount} finansiella, {roiMetrics.summary.redistributionCount} omdistribuerade, {roiMetrics.summary.qualitativeCount} kvalitativa
          </div>
        </div>
      </div>
      
      <div className="bg-[#121F2B] p-4 rounded">
        <div className="text-sm text-gray-400">Värdedimensioner</div>
        <div className="text-lg font-bold text-[#fffefa]">
          {roiMetrics.summary.dimensionsCovered.length}
        </div>
      </div>

      <ROIInfoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
} 
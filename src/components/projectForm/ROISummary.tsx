import React, { useState, useMemo, useEffect } from 'react';
import { calculateROI, createEmptyROIMetrics } from '@/lib/roiCalculator';
import { formatRatio, getROIColor, getROIStatus, formatCurrency, formatPercentage } from '@/lib/utils';
import type { EffectEntry } from '@/lib/roiCalculator';
import ROIInfoModal from './ROIInfoModal';

interface ROISummaryProps {
  effectEntries: EffectEntry[];
  costEntries: any[];
}

export default function ROISummary({ effectEntries, costEntries }: ROISummaryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  // Calculate total investment from cost entries or budget
  const totalInvestment = useMemo(() => {
    if (costEntries && costEntries.length > 0) {
      // Use cost entries if available
      return costEntries.reduce((total, entry) => {
        const amount = entry.costUnit ? parseFloat(entry.costUnit) : 
                      entry.costType ? parseFloat(entry.costType) : 0;
        return total + (isNaN(amount) ? 0 : amount);
      }, 0);
    } else {
      // For idea projects, try to get budget from form data
      const formData = (window as any).__FORM_DATA__ || {};
      const budgetAmount = formData.budgetDetails?.budgetAmount || 
                          formData.cost_data?.budgetDetails?.budgetAmount;
      return budgetAmount ? parseFloat(budgetAmount) : 0;
    }
  }, [costEntries]);

  // Calculate ROI metrics
  const roiMetrics = useMemo(() => {
    try {
      return calculateROI({
        effectEntries: effectEntries || [],
        totalProjectInvestment: totalInvestment
      });
    } catch (error) {
      console.error('Error calculating ROI:', error);
      return createEmptyROIMetrics();
    }
  }, [effectEntries, totalInvestment]);

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
    </div>
  );
} 
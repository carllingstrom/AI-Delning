import React, { useState, useEffect } from 'react';
import { calculateROI, formatROIMetrics } from '@/lib/roiCalculator';
import type { EffectEntry } from '@/lib/roiCalculator';
import ROIInfoModal from './ROIInfoModal';

interface ROISummaryProps {
  effectEntries: EffectEntry[];
  costEntries?: any[];
}

export default function ROISummary({ effectEntries, costEntries }: ROISummaryProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  console.log('ROISummary rendered with effectEntries:', effectEntries);
  console.log('ROISummary rendered with costEntries:', costEntries);
  
  useEffect(() => {
    const handleOpenROIInfo = () => {
      console.log('Opening ROI info modal');
      setShowInfoModal(true);
    };

    window.addEventListener('openROIInfo', handleOpenROIInfo);
    
    return () => {
      window.removeEventListener('openROIInfo', handleOpenROIInfo);
    };
  }, []);
  
  // Always render the modal listener, even if no effects yet
  const hasEffects = effectEntries && effectEntries.length > 0;

  // Calculate total investment from cost entries (watch from parent form context)
  const calculateTotalInvestment = (costEntries: any[]) => {
    if (!costEntries || costEntries.length === 0) return 0;
    
    return costEntries.reduce((total, entry) => {
      if (!entry) return total;
      
      let entryTotal = 0;
      
      // Calculate total based on unit type (same logic as costSummary.tsx)
      switch (entry.costUnit) {
        case 'hours':
          const hours = Number(entry.hoursDetails?.hours) || 0;
          const rate = Number(entry.hoursDetails?.hourlyRate) || 0;
          entryTotal = hours * rate;
          break;
        
        case 'fixed':
          entryTotal = Number(entry.fixedDetails?.fixedAmount) || 0;
          break;
        
        case 'monthly':
          const monthlyAmount = Number(entry.monthlyDetails?.monthlyAmount) || 0;
          const monthlyDuration = Number(entry.monthlyDetails?.monthlyDuration) || 1;
          entryTotal = monthlyAmount * monthlyDuration;
          break;
        
        case 'yearly':
          const yearlyAmount = Number(entry.yearlyDetails?.yearlyAmount) || 0;
          const yearlyDuration = Number(entry.yearlyDetails?.yearlyDuration) || 1;
          entryTotal = yearlyAmount * yearlyDuration;
          break;
        
        default:
          entryTotal = 0;
      }
      
      return total + entryTotal;
    }, 0);
  };

  // Calculate total investment and pass to ROI calculator
  const totalInvestment = calculateTotalInvestment(costEntries || []);
  console.log('Calculated total investment:', totalInvestment);
  console.log('Cost entries for calculation:', costEntries);
  
  // Debug each cost entry calculation
  if (costEntries && costEntries.length > 0) {
    costEntries.forEach((entry, index) => {
      console.log(`Cost entry ${index}:`, entry);
      if (entry) {
        console.log(`  - costUnit: ${entry.costUnit}`);
        console.log(`  - costType: ${entry.costType}`);
        console.log(`  - costLabel: ${entry.costLabel}`);
        console.log(`  - hoursDetails:`, entry.hoursDetails);
        console.log(`  - fixedDetails:`, entry.fixedDetails);
        console.log(`  - monthlyDetails:`, entry.monthlyDetails);
        console.log(`  - yearlyDetails:`, entry.yearlyDetails);
      }
    });
  }
  
  const roi = calculateROI({ 
    effectEntries, 
    totalProjectInvestment: totalInvestment 
  });
  const formatted = formatROIMetrics(roi);

  return (
    <>
      {hasEffects && (
        <div className="bg-[#1E293B] rounded-lg p-4 mt-6 text-white border border-[#FFD600]">
          <h3 className="text-lg font-bold text-[#FFD600] mb-3">ROI-sammanfattning</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#2a3a4a] p-3 rounded">
              <div className="font-semibold text-sm text-gray-300">Finansiell ROI</div>
              <div className="text-xl font-bold text-green-400">{formatted.economicROI}</div>
              <div className="text-xs text-gray-400">Ratio: {roi.economicROI.toFixed(3)}</div>
            </div>
            
            <div className="bg-[#2a3a4a] p-3 rounded">
              <div className="font-semibold text-sm text-gray-300">Kvalitativ effekt</div>
              <div className="text-xl font-bold text-blue-400">{formatted.qualitativeROI}</div>
              <div className="text-xs text-gray-400">Ratio: {(roi.qualitativeROI / 100).toFixed(3)}</div>
            </div>
            
            <div className="bg-[#2a3a4a] p-3 rounded">
              <div className="font-semibold text-sm text-gray-300">Kombinerad effekt</div>
              <div className="text-xl font-bold text-[#FFD600]">{formatted.combinedROI}</div>
            </div>
            
            <div className="bg-[#2a3a4a] p-3 rounded">
              <div className="font-semibold text-sm text-gray-300">Återbetalningstid</div>
              <div className="text-xl font-bold text-purple-400">{formatted.paybackPeriod}</div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-semibold text-gray-300">Total monetär nytta</div>
              <div className="text-lg font-bold">{formatted.totalMonetaryValue}</div>
            </div>
            
            <div>
              <div className="font-semibold text-gray-300">Antal effekter</div>
              <div className="text-lg font-bold">{formatted.totalEffects}</div>
              <div className="text-xs text-gray-400">
                {formatted.financialCount} finansiella, {formatted.redistributionCount} omdistribuerade, {formatted.qualitativeCount} kvalitativa
              </div>
            </div>
            
            <div>
              <div className="font-semibold text-gray-300">Värdedimensioner</div>
              <div className="text-lg font-bold">{roi.summary.dimensionsCovered.length}</div>
            </div>
          </div>
        </div>
      )}
      
      <ROIInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
    </>
  );
} 
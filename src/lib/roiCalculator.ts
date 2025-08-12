// ROI Calculator Utility
// Handles calculation of ROI metrics from effects data using the new framework

import { 
  formatCurrency, 
  formatPercentage, 
  percentageToRatio, 
  ratioToPercentage, 
  formatRatio, 
  getROIColor, 
  getROIStatus,
  calculateAnnualValue,
  calculateSavedAmount
} from './utils';
import type { EffectEntry } from '@/domain';
import type { ROIInput, ROIMetrics } from '@/services/roi/roi.types';

export function calculateROI(input: ROIInput): ROIMetrics {
  try {
    const { effectEntries, totalProjectInvestment } = input;
  
    if (!effectEntries || effectEntries.length === 0) {
      return createEmptyROIMetrics();
    }
  
    let totalInvestment = totalProjectInvestment || 0;
    let totalMonetaryValue = 0;
    let totalAnnualMonetaryValue = 0; // NEW: for payback period
    let totalFinancialEffects = 0;
    let totalRedistributionEffects = 0;
    let totalQualitativeEffects = 0;
    
    const financialEffects: ROIMetrics['financialEffects'] = [];
    const redistributionEffects: ROIMetrics['redistributionEffects'] = [];
    const qualitativeEffects: ROIMetrics['qualitativeEffects'] = [];
    const dimensionBreakdown: Record<string, { totalValue: number; totalInvestment: number; economicROI: number; qualitativeROI: number; effectCount: number }> = {};
    const dimensionsCovered = new Set<string>();
  
    // Count only entries that actually have effects
    let actualEffectsCount = 0;
  
    // Process each effect entry
    effectEntries.forEach(entry => {
      const dimension = entry.valueDimension;
      
      // Check if this entry actually has any effects reported
      const hasQualitative = (entry.hasQualitative === true) && 
        entry.qualitativeDetails && 
        Object.keys(entry.qualitativeDetails).length > 0 &&
        entry.qualitativeDetails.factor && 
        entry.qualitativeDetails.currentRating !== null && 
        entry.qualitativeDetails.targetRating !== null;
      
      const hasQuantitative = (entry.hasQuantitative === true) && 
        entry.quantitativeDetails && 
        Object.keys(entry.quantitativeDetails).length > 0;
      
      // Skip this entry if it has no effects
      if (!hasQualitative && !hasQuantitative) {
        return;
      }
      
      // This entry has actual effects, count it
      actualEffectsCount++;
      dimensionsCovered.add(dimension);
      
      // Initialize dimension breakdown if not exists
      if (!dimensionBreakdown[dimension]) {
        dimensionBreakdown[dimension] = { totalValue: 0, totalInvestment: 0, economicROI: 0, qualitativeROI: 0, effectCount: 0 };
      }
      dimensionBreakdown[dimension].effectCount++;
  
      // Process qualitative effects
      if (hasQualitative) {
        const qual = entry.qualitativeDetails!;
        const improvement = qual.targetRating - qual.currentRating;
        const improvementPercentage = qual.currentRating > 0 ? (improvement / qual.currentRating) * 100 : 0;
        
        // Calculate annual and total values
        const annualValue = qual.monetaryEstimate || 0;
        const totalValue = annualValue * qual.annualizationYears;
        
        if (qual.monetaryEstimate) {
          totalMonetaryValue += totalValue;
          totalAnnualMonetaryValue += annualValue;
          totalQualitativeEffects += totalValue;
        }
        
        const roi = totalInvestment > 0 ? (totalValue / totalInvestment) * 100 : 0;
        
        qualitativeEffects.push({
          dimension,
          factor: qual.factor,
          improvement,
          improvementPercentage,
          annualValue,
          totalValue,
          roi
        });
        
        // Add to dimension breakdown
        dimensionBreakdown[dimension].totalValue += totalValue;
        dimensionBreakdown[dimension].qualitativeROI = improvementPercentage;
      }
  
      // Process quantitative effects
      if (hasQuantitative) {
        const quant = entry.quantitativeDetails!;
        
        if (quant.effectType === 'financial' && quant.financialDetails) {
          const fin = quant.financialDetails;
          const annualValue = calculateAnnualValue(fin, fin.valueUnit);
          const totalValue = annualValue * fin.annualizationYears;
          
          totalMonetaryValue += totalValue;
          totalAnnualMonetaryValue += annualValue;
          totalFinancialEffects += totalValue;
          
          const roi = totalInvestment > 0 ? (totalValue / totalInvestment) * 100 : 0;
          
          financialEffects.push({
            dimension,
            details: fin,
            annualValue,
            totalValue,
            roi
          });
          
          // Add to dimension breakdown
          dimensionBreakdown[dimension].totalValue += totalValue;
        }
        
        if (quant.effectType === 'redistribution' && quant.redistributionDetails) {
          const red = quant.redistributionDetails;
          const annualSaved = calculateSavedAmount(red, red.valueUnit);
          const totalValue = annualSaved * red.annualizationYears;
          const annualValue = annualSaved;
          
          totalMonetaryValue += totalValue;
          totalAnnualMonetaryValue += annualValue;
          totalRedistributionEffects += totalValue;
          
          const roi = totalInvestment > 0 ? (totalValue / totalInvestment) * 100 : 0;
          
          redistributionEffects.push({
            dimension,
            details: red,
            annualValue,
            totalValue,
            roi
          });
          
          // Add to dimension breakdown
          dimensionBreakdown[dimension].totalValue += totalValue;
        }
      }
    });
  
    // ROI: (benefit - cost) / cost
    const economicROI = totalInvestment > 0 ? ((totalMonetaryValue - totalInvestment) / totalInvestment) * 100 : 0;
    
    // Qualitative ROI as average improvement percentage
    const qualitativeDimensions = Object.values(dimensionBreakdown).filter(d => d.qualitativeROI > 0);
    const qualitativeROI = qualitativeDimensions.length > 0
      ? qualitativeDimensions.reduce((sum, d) => sum + d.qualitativeROI, 0) / qualitativeDimensions.length
      : 0;
    
    // Combined ROI
    const combinedROI = economicROI > 0 && qualitativeROI > 0
      ? (economicROI + qualitativeROI) / 2
      : (economicROI || qualitativeROI);
    
    // Payback period (years)
    const paybackPeriod = (totalAnnualMonetaryValue > 0 && totalInvestment > 0)
      ? totalInvestment / totalAnnualMonetaryValue
      : 0;
    
    const summary = {
      totalEffects: actualEffectsCount,
      financialCount: financialEffects.length,
      redistributionCount: redistributionEffects.length,
      qualitativeCount: qualitativeEffects.length,
      dimensionsCovered: Array.from(dimensionsCovered),
      averageEconomicROI: economicROI,
      averageQualitativeROI: qualitativeROI,
      highestROI: Math.max(economicROI, qualitativeROI, combinedROI),
      lowestROI: Math.min(economicROI, qualitativeROI, combinedROI)
    };
    
    return {
      totalInvestment,
      totalMonetaryValue,
      totalFinancialEffects,
      totalRedistributionEffects,
      totalQualitativeEffects,
      economicROI,
      qualitativeROI,
      combinedROI,
      paybackPeriod,
      financialEffects,
      redistributionEffects,
      qualitativeEffects,
      dimensionBreakdown,
      summary
    };
  } catch (error) {
    console.error('Error calculating ROI:', error);
    return createEmptyROIMetrics();
  }
}

export function createEmptyROIMetrics(): ROIMetrics {
  return {
    totalInvestment: 0,
    totalMonetaryValue: 0,
    totalFinancialEffects: 0,
    totalRedistributionEffects: 0,
    totalQualitativeEffects: 0,
    economicROI: 0,
    qualitativeROI: 0,
    combinedROI: 0,
    paybackPeriod: 0,
    financialEffects: [],
    redistributionEffects: [],
    qualitativeEffects: [],
    dimensionBreakdown: {},
    summary: {
      totalEffects: 0,
      financialCount: 0,
      redistributionCount: 0,
      qualitativeCount: 0,
      dimensionsCovered: [],
      averageEconomicROI: 0,
      averageQualitativeROI: 0,
      highestROI: 0,
      lowestROI: 0
    }
  };
}

export { 
  formatCurrency, 
  formatPercentage, 
  percentageToRatio, 
  ratioToPercentage, 
  formatRatio, 
  getROIColor, 
  getROIStatus 
}; 
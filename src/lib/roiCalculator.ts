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

export interface EffectEntry {
  valueDimension: string;
  hasQualitative: boolean | string;
  hasQuantitative: boolean | string;
  qualitativeDetails?: {
    factor: string;
    currentRating: number;
    targetRating: number;
    annualizationYears: number;
    monetaryEstimate?: number;
  };
  quantitativeDetails?: {
    effectType: 'financial' | 'redistribution';
    financialDetails?: {
      measurementName: string;
      valueUnit: 'hours' | 'currency' | 'percentage' | 'count' | 'other';
      // Hours-based
      hoursDetails?: {
        affectedPeople?: number;
        timePerPerson?: number;
        timescale?: string;
        hourlyRate?: number;
        // Legacy fields for backward compatibility
        hours?: number;
      };
      // Currency-based
      currencyDetails?: {
        amount?: number;
        timescale?: string;
      };
      // Percentage-based
      percentageDetails?: {
        percentage?: number;
        baseValue?: number;
        timescale?: string;
      };
      // Count-based
      countDetails?: {
        count?: number;
        valuePerUnit?: number;
        timescale?: string;
      };
      // Other
      otherDetails?: {
        customUnit?: string;
        amount?: number;
        valuePerUnit?: number;
        timescale?: string;
      };
      annualizationYears: number;
    };
    redistributionDetails?: {
      resourceType: string;
      valueUnit: 'hours' | 'currency' | 'percentage' | 'count' | 'other';
      // Hours-based
      hoursDetails?: {
        affectedPeople?: number;
        currentTimePerPerson?: number;
        newTimePerPerson?: number;
        timescale?: string;
        hourlyRate?: number;
        // Legacy fields for backward compatibility
        currentHours?: number;
        newHours?: number;
      };
      // Currency-based
      currencyDetails?: {
        currentAmount?: number;
        newAmount?: number;
        timescale?: string;
      };
      // Percentage-based
      percentageDetails?: {
        currentPercentage?: number;
        newPercentage?: number;
        baseValue?: number;
      };
      // Count-based
      countDetails?: {
        currentCount?: number;
        newCount?: number;
        valuePerUnit?: number;
        timescale?: string;
      };
      // Other
      otherDetails?: {
        customUnit?: string;
        currentAmount?: number;
        newAmount?: number;
        valuePerUnit?: number;
        timescale?: string;
      };
      annualizationYears: number;
    };
  };
  effectComment?: string;
}

export interface ROIMetrics {
  // Total financial metrics
  totalInvestment: number;
  totalMonetaryValue: number;
  totalFinancialEffects: number;
  totalRedistributionEffects: number;
  totalQualitativeEffects: number;
  
  // ROI calculations
  economicROI: number;
  qualitativeROI: number;
  combinedROI: number;
  paybackPeriod: number;
  
  // Effect breakdowns
  financialEffects: Array<{
    dimension: string;
    measurement: string;
    annualValue: number;
    totalValue: number;
    roi: number;
  }>;
  
  redistributionEffects: Array<{
    dimension: string;
    resourceType: string;
    savedAmount: number;
    annualValue: number;
    totalValue: number;
    roi: number;
  }>;
  
  qualitativeEffects: Array<{
    dimension: string;
    factor: string;
    improvement: number;
    improvementPercentage: number;
    annualValue: number;
    totalValue: number;
    roi: number;
  }>;
  
  // Dimension breakdown
  dimensionBreakdown: Record<string, {
    totalValue: number;
    totalInvestment: number;
    economicROI: number;
    qualitativeROI: number;
    effectCount: number;
  }>;
  
  // Summary statistics
  summary: {
    totalEffects: number;
    financialCount: number;
    redistributionCount: number;
    qualitativeCount: number;
    dimensionsCovered: string[];
    averageEconomicROI: number;
    averageQualitativeROI: number;
    highestROI: number;
    lowestROI: number;
  };
}

export interface ROIInput {
  effectEntries: EffectEntry[];
  roiInterpretation?: string;
  totalProjectInvestment?: number; // Optional override for total investment
}

/**
 * Calculate comprehensive ROI metrics from effects data using new framework
 */
export function calculateROI(input: ROIInput): ROIMetrics {
  try {
  const { effectEntries, totalProjectInvestment } = input;
  
  if (!effectEntries || effectEntries.length === 0) {
    return createEmptyROIMetrics();
  }

  let totalInvestment = totalProjectInvestment || 0;
  let totalMonetaryValue = 0;
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
    const hasQualitative = (entry.hasQualitative === true || entry.hasQualitative === 'true') && 
      entry.qualitativeDetails && 
      Object.keys(entry.qualitativeDetails).length > 0 &&
      entry.qualitativeDetails.factor && 
      entry.qualitativeDetails.currentRating !== null && 
      entry.qualitativeDetails.targetRating !== null;
    
    const hasQuantitative = (entry.hasQuantitative === true || entry.hasQuantitative === 'true') && 
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

    // Process qualitative effects (handle both boolean and string values)
    if (hasQualitative) {
      const qual = entry.qualitativeDetails!;
      const improvement = qual.targetRating - qual.currentRating;
      const improvementPercentage = qual.currentRating > 0 ? (improvement / qual.currentRating) * 100 : 0;
      
      // Calculate annual and total values
      const annualValue = qual.monetaryEstimate || 0;
      const totalValue = annualValue * qual.annualizationYears;
      
      if (qual.monetaryEstimate) {
        totalMonetaryValue += totalValue;
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

    // Process quantitative effects (handle both boolean and string values)
    if (hasQuantitative) {
      const quant = entry.quantitativeDetails!;
      
      if (quant.effectType === 'financial' && quant.financialDetails) {
        const fin = quant.financialDetails;
        const annualValue = calculateAnnualValue(fin, fin.valueUnit);
        const totalValue = annualValue * fin.annualizationYears;
        
        totalMonetaryValue += totalValue;
        totalFinancialEffects += totalValue;
        
        const roi = totalInvestment > 0 ? (totalValue / totalInvestment) * 100 : 0;
        
        financialEffects.push({
          dimension,
          measurement: fin.measurementName,
          annualValue,
          totalValue,
          roi
        });
        
        // Add to dimension breakdown
        dimensionBreakdown[dimension].totalValue += totalValue;
        dimensionBreakdown[dimension].economicROI = roi;
        
      } else if (quant.effectType === 'redistribution' && quant.redistributionDetails) {
        const redist = quant.redistributionDetails;
        const savedAmount = calculateSavedAmount(redist, redist.valueUnit);
        const annualValue = savedAmount;
        const totalValue = annualValue * redist.annualizationYears;
        
        totalMonetaryValue += totalValue;
        totalRedistributionEffects += totalValue;
        
        const roi = totalInvestment > 0 ? (totalValue / totalInvestment) * 100 : 0;
        
        redistributionEffects.push({
          dimension,
          resourceType: redist.resourceType,
          savedAmount,
          annualValue,
          totalValue,
          roi
        });
        
        // Add to dimension breakdown
        dimensionBreakdown[dimension].totalValue += totalValue;
        dimensionBreakdown[dimension].economicROI = roi;
      }
    }
  });

  // If no actual effects were found, return empty metrics
  if (actualEffectsCount === 0) {
    return createEmptyROIMetrics();
  }

  // Calculate ROI metrics
  const economicROI = totalInvestment > 0 ? ((totalMonetaryValue - totalInvestment) / totalInvestment) * 100 : 0;
  const qualitativeROI = totalQualitativeEffects > 0 ? 
    (totalQualitativeEffects / totalInvestment) * 100 : 0;
  const combinedROI = (economicROI + qualitativeROI) / 2;
  const paybackPeriod = calculatePaybackPeriod(totalInvestment, totalMonetaryValue);

  // Calculate summary statistics
  const allROIs = [
    ...financialEffects.map(f => f.roi),
    ...redistributionEffects.map(r => r.roi),
    ...qualitativeEffects.map(q => q.roi)
  ];

  const summary = {
    totalEffects: actualEffectsCount,
    financialCount: financialEffects.length,
    redistributionCount: redistributionEffects.length,
    qualitativeCount: qualitativeEffects.length,
    dimensionsCovered: Array.from(dimensionsCovered),
    averageEconomicROI: allROIs.length > 0 ? allROIs.reduce((a, b) => a + b, 0) / allROIs.length : 0,
    averageQualitativeROI: qualitativeEffects.length > 0 ? 
      qualitativeEffects.reduce((sum, q) => sum + q.improvementPercentage, 0) / qualitativeEffects.length : 0,
    highestROI: allROIs.length > 0 ? Math.max(...allROIs) : 0,
    lowestROI: allROIs.length > 0 ? Math.min(...allROIs) : 0
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

function calculatePaybackPeriod(investment: number, annualValue: number): number {
  if (annualValue <= 0) return 0;
  return investment / annualValue;
}

function createEmptyROIMetrics(): ROIMetrics {
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

export { createEmptyROIMetrics };

export function formatROIMetrics(metrics: ROIMetrics) {
  return {
    totalInvestment: formatCurrency(metrics.totalInvestment),
    totalMonetaryValue: formatCurrency(metrics.totalMonetaryValue),
    totalFinancialEffects: formatCurrency(metrics.totalFinancialEffects),
    totalRedistributionEffects: formatCurrency(metrics.totalRedistributionEffects),
    totalQualitativeEffects: formatCurrency(metrics.totalQualitativeEffects),
    economicROI: formatPercentage(metrics.economicROI),
    qualitativeROI: formatPercentage(metrics.qualitativeROI),
    combinedROI: formatPercentage(metrics.combinedROI),
    paybackPeriod: `${metrics.paybackPeriod.toFixed(1)} år`
  };
}

export function getROIInsights(metrics: ROIMetrics): {
  insights: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
} {
  const insights: string[] = [];
  const recommendations: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';

  // Analyze ROI performance
  if (metrics.combinedROI >= 100) {
    insights.push('Utmärkt ROI - projektet förväntas ge mer än dubbelt så mycket värde som investeringen');
    riskLevel = 'low';
  } else if (metrics.combinedROI >= 50) {
    insights.push('Bra ROI - projektet förväntas ge betydande värde');
    riskLevel = 'low';
  } else if (metrics.combinedROI >= 0) {
    insights.push('Positiv ROI - projektet förväntas ge värde men kan optimeras');
    riskLevel = 'medium';
  } else {
    insights.push('Negativ ROI - projektet behöver omvärderas');
    riskLevel = 'high';
  }

  // Analyze payback period
  if (metrics.paybackPeriod <= 1) {
    insights.push('Snabb återbetalningstid - investeringen återbetalas inom ett år');
  } else if (metrics.paybackPeriod <= 3) {
    insights.push('Acceptabel återbetalningstid - investeringen återbetalas inom 3 år');
  } else {
    insights.push('Lång återbetalningstid - överväg att optimera projektet');
  }

  // Analyze effect distribution
  if (metrics.summary.financialCount > 0 && metrics.summary.qualitativeCount > 0) {
    insights.push('Balanserad effektmix - både ekonomiska och kvalitativa effekter');
  } else if (metrics.summary.financialCount > 0) {
    insights.push('Fokus på ekonomiska effekter - överväg att inkludera kvalitativa mätningar');
  } else if (metrics.summary.qualitativeCount > 0) {
    insights.push('Fokus på kvalitativa effekter - överväg att kvantifiera ekonomiska värden');
  }

  // Generate recommendations
  if (metrics.combinedROI < 50) {
    recommendations.push('Optimera projektkostnader för att förbättra ROI');
    recommendations.push('Utforska ytterligare effektmöjligheter');
  }

  if (metrics.paybackPeriod > 3) {
    recommendations.push('Förkorta återbetalningstiden genom att öka årliga besparingar');
  }

  if (metrics.summary.totalEffects < 3) {
    recommendations.push('Lägg till fler effektmätningar för mer komplett analys');
  }

  if (metrics.summary.dimensionsCovered.length < 2) {
    recommendations.push('Utforska effekter inom fler värdedimensioner');
  }

  return { insights, recommendations, riskLevel };
}

// Re-export utility functions for backward compatibility
export { 
  formatCurrency, 
  formatPercentage, 
  percentageToRatio, 
  ratioToPercentage, 
  formatRatio, 
  getROIColor, 
  getROIStatus 
}; 
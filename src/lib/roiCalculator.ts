// ROI Calculator Utility
// Handles calculation of ROI metrics from effects data using the new framework

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
        hours?: number;
        timescale?: string;
        hourlyRate?: number;
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
        currentHours?: number;
        newHours?: number;
        timescale?: string;
        hourlyRate?: number;
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
 * Calculate annual value based on unit type and timescale
 */
function calculateAnnualValue(details: any, unitType: string): number {
  let baseValue = 0;
  let multiplier = 1;

  switch (unitType) {
    case 'hours':
      const hours = Number(details.hoursDetails?.hours) || 0;
      const hourlyRate = Number(details.hoursDetails?.hourlyRate) || 0;
      baseValue = hours * hourlyRate;
      
      // Convert to annual based on timescale
      switch (details.hoursDetails?.timescale) {
        case 'per_hour': multiplier = 8760; break; // 24 * 365
        case 'per_day': multiplier = 365; break;
        case 'per_week': multiplier = 52; break;
        case 'per_month': multiplier = 12; break;
        case 'per_year': multiplier = 1; break;
        default: multiplier = 1;
      }
      break;

    case 'currency':
      baseValue = Number(details.currencyDetails?.amount) || 0;
      switch (details.currencyDetails?.timescale) {
        case 'one_time': multiplier = 0; break; // One-time, no annual value
        case 'per_month': multiplier = 12; break;
        case 'per_year': multiplier = 1; break;
        default: multiplier = 1;
      }
      break;

    case 'percentage':
      const percentage = Number(details.percentageDetails?.percentage) || 0;
      const baseValueForPercentage = Number(details.percentageDetails?.baseValue) || 0;
      baseValue = (percentage / 100) * baseValueForPercentage;
      switch (details.percentageDetails?.timescale) {
        case 'one_time': multiplier = 0; break;
        case 'per_month': multiplier = 12; break;
        case 'per_year': multiplier = 1; break;
        default: multiplier = 1;
      }
      break;

    case 'count':
      const count = Number(details.countDetails?.count) || 0;
      const valuePerUnit = Number(details.countDetails?.valuePerUnit) || 0;
      baseValue = count * valuePerUnit;
      switch (details.countDetails?.timescale) {
        case 'one_time': multiplier = 0; break;
        case 'per_month': multiplier = 12; break;
        case 'per_year': multiplier = 1; break;
        default: multiplier = 1;
      }
      break;

    case 'other':
      const amount = Number(details.otherDetails?.amount) || 0;
      const otherValuePerUnit = Number(details.otherDetails?.valuePerUnit) || 0;
      baseValue = amount * otherValuePerUnit;
      switch (details.otherDetails?.timescale) {
        case 'one_time': multiplier = 0; break;
        case 'per_month': multiplier = 12; break;
        case 'per_year': multiplier = 1; break;
        default: multiplier = 1;
      }
      break;

    default:
      return 0;
  }

  return baseValue * multiplier;
}

/**
 * Calculate saved amount for redistribution effects
 */
function calculateSavedAmount(details: any, unitType: string): number {
  switch (unitType) {
    case 'hours':
      const currentHours = Number(details.hoursDetails?.currentHours) || 0;
      const newHours = Number(details.hoursDetails?.newHours) || 0;
      return currentHours - newHours;

    case 'currency':
      const currentAmount = Number(details.currencyDetails?.currentAmount) || 0;
      const newAmount = Number(details.currencyDetails?.newAmount) || 0;
      return currentAmount - newAmount;

    case 'percentage':
      const currentPercentage = Number(details.percentageDetails?.currentPercentage) || 0;
      const newPercentage = Number(details.percentageDetails?.newPercentage) || 0;
      const baseValue = Number(details.percentageDetails?.baseValue) || 0;
      return ((currentPercentage - newPercentage) / 100) * baseValue;

    case 'count':
      const currentCount = Number(details.countDetails?.currentCount) || 0;
      const newCount = Number(details.countDetails?.newCount) || 0;
      return currentCount - newCount;

    case 'other':
      const currentOtherAmount = Number(details.otherDetails?.currentAmount) || 0;
      const newOtherAmount = Number(details.otherDetails?.newAmount) || 0;
      return currentOtherAmount - newOtherAmount;

    default:
      return 0;
  }
}

/**
 * Calculate comprehensive ROI metrics from effects data using new framework
 */
export function calculateROI(input: ROIInput): ROIMetrics {
  const { effectEntries, totalProjectInvestment } = input;
  
  console.log('ROI Calculator received effect entries:', effectEntries);
  
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

  // Process each effect entry
  effectEntries.forEach(entry => {
    console.log('Processing effect entry:', entry);
    console.log('Entry keys:', Object.keys(entry));
    console.log('Qualitative details:', entry.qualitativeDetails);
    console.log('Quantitative details:', entry.quantitativeDetails);
    const dimension = entry.valueDimension;
    dimensionsCovered.add(dimension);
    
    // Initialize dimension breakdown if not exists
    if (!dimensionBreakdown[dimension]) {
      dimensionBreakdown[dimension] = { totalValue: 0, totalInvestment: 0, economicROI: 0, qualitativeROI: 0, effectCount: 0 };
    }
    dimensionBreakdown[dimension].effectCount++;

    // Process qualitative effects (handle both boolean and string values)
    if ((entry.hasQualitative === true || entry.hasQualitative === 'true') && entry.qualitativeDetails) {
      const qual = entry.qualitativeDetails;
      const improvement = qual.targetRating - qual.currentRating;
      const improvementPercentage = qual.currentRating > 0 ? (improvement / qual.currentRating) * 100 : 0;
      
      // Calculate annual and total values
      const annualValue = qual.monetaryEstimate || 0;
      const totalValue = annualValue * qual.annualizationYears;
      
      if (qual.monetaryEstimate) {
        totalMonetaryValue += totalValue;
        totalQualitativeEffects += totalValue;
      }
      
      const roi = totalInvestment > 0 ? (totalValue - totalInvestment) / totalInvestment : 0;
      
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
    if ((entry.hasQuantitative === true || entry.hasQuantitative === 'true') && entry.quantitativeDetails) {
      const quant = entry.quantitativeDetails;
      
      // Process financial effects
      if (quant.effectType === 'financial' && quant.financialDetails) {
        const fin = quant.financialDetails;
        const annualValue = calculateAnnualValue(fin, fin.valueUnit);
        const totalValue = annualValue * fin.annualizationYears;
        
        totalMonetaryValue += totalValue;
        totalFinancialEffects += totalValue;
        
        const roi = totalInvestment > 0 ? (totalValue - totalInvestment) / totalInvestment : 0;
        
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
      }

      // Process redistribution effects
      if (quant.effectType === 'redistribution' && quant.redistributionDetails) {
        const redist = quant.redistributionDetails;
        const savedAmount = calculateSavedAmount(redist, redist.valueUnit);
        
        // Calculate annual value based on unit type
        let annualValue = 0;
        if (redist.valueUnit === 'hours' && redist.hoursDetails?.hourlyRate) {
          annualValue = savedAmount * Number(redist.hoursDetails.hourlyRate);
          // Apply timescale multiplier
          switch (redist.hoursDetails.timescale) {
            case 'per_hour': annualValue *= 8760; break;
            case 'per_day': annualValue *= 365; break;
            case 'per_week': annualValue *= 52; break;
            case 'per_month': annualValue *= 12; break;
            case 'per_year': break; // Already annual
          }
        } else if (redist.valueUnit === 'currency') {
          annualValue = savedAmount;
          switch (redist.currencyDetails?.timescale) {
            case 'one_time': annualValue = 0; break;
            case 'per_month': annualValue *= 12; break;
            case 'per_year': break; // Already annual
          }
        } else if (redist.valueUnit === 'count' && redist.countDetails?.valuePerUnit) {
          annualValue = savedAmount * Number(redist.countDetails.valuePerUnit);
          switch (redist.countDetails.timescale) {
            case 'one_time': annualValue = 0; break;
            case 'per_month': annualValue *= 12; break;
            case 'per_year': break; // Already annual
          }
        } else if (redist.valueUnit === 'other' && redist.otherDetails?.valuePerUnit) {
          annualValue = savedAmount * Number(redist.otherDetails.valuePerUnit);
          switch (redist.otherDetails.timescale) {
            case 'one_time': annualValue = 0; break;
            case 'per_month': annualValue *= 12; break;
            case 'per_year': break; // Already annual
          }
        }
        
        const totalValue = annualValue * redist.annualizationYears;
        
        if (annualValue > 0) {
          totalMonetaryValue += totalValue;
          totalRedistributionEffects += totalValue;
        }
        
        const roi = totalInvestment > 0 ? (totalValue - totalInvestment) / totalInvestment : 0;
        
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

  // Calculate overall ROI metrics
  const economicROI = totalInvestment > 0 ? (totalMonetaryValue - totalInvestment) / totalInvestment : 0;
  
  // Calculate qualitative ROI as average improvement percentage
  const qualitativeImprovements = qualitativeEffects.map(e => e.improvementPercentage);
  const qualitativeROI = qualitativeImprovements.length > 0 
    ? qualitativeImprovements.reduce((a, b) => a + b, 0) / qualitativeImprovements.length 
    : 0;
  
  // Combined ROI (economic + qualitative)
  const combinedROI = economicROI + (qualitativeROI / 100); // Convert percentage to decimal for combination
  
  const paybackPeriod = calculatePaybackPeriod(totalInvestment, totalMonetaryValue);

  // Calculate summary statistics
  const allEconomicROIs = [...financialEffects, ...redistributionEffects].map(e => e.roi).filter(r => !isNaN(r) && isFinite(r));
  const averageEconomicROI = allEconomicROIs.length > 0 ? allEconomicROIs.reduce((a, b) => a + b, 0) / allEconomicROIs.length : 0;
  const averageQualitativeROI = qualitativeROI;
  const allROIs = [...allEconomicROIs, qualitativeROI];
  const highestROI = allROIs.length > 0 ? Math.max(...allROIs) : 0;
  const lowestROI = allROIs.length > 0 ? Math.min(...allROIs) : 0;

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
    summary: {
      totalEffects: effectEntries.length,
      financialCount: financialEffects.length,
      redistributionCount: redistributionEffects.length,
      qualitativeCount: qualitativeEffects.length,
      dimensionsCovered: Array.from(dimensionsCovered),
      averageEconomicROI,
      averageQualitativeROI,
      highestROI,
      lowestROI
    }
  };
}

/**
 * Calculate payback period in years
 */
function calculatePaybackPeriod(investment: number, annualValue: number): number {
  if (annualValue <= 0) return Infinity;
  return investment / annualValue;
}

/**
 * Create empty ROI metrics structure
 */
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

/**
 * Format ROI metrics for display
 */
export function formatROIMetrics(metrics: ROIMetrics) {
  return {
    totalInvestment: formatCurrency(metrics.totalInvestment),
    totalMonetaryValue: formatCurrency(metrics.totalMonetaryValue),
    economicROI: `${(metrics.economicROI * 100).toFixed(1)}%`,
    qualitativeROI: `${metrics.qualitativeROI.toFixed(1)}%`,
    combinedROI: `${(metrics.combinedROI * 100).toFixed(1)}%`,
    paybackPeriod: metrics.paybackPeriod === Infinity ? 'N/A' : `${metrics.paybackPeriod.toFixed(1)} år`,
    totalEffects: metrics.summary.totalEffects,
    financialCount: metrics.summary.financialCount,
    redistributionCount: metrics.summary.redistributionCount,
    qualitativeCount: metrics.summary.qualitativeCount
  };
}

/**
 * Format currency values
 */
function formatCurrency(value: number): string {
  if (value === 0) return '0 SEK';
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M SEK`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K SEK`;
  } else {
    return `${value.toFixed(0)} SEK`;
  }
}

/**
 * Generate insights and recommendations based on ROI metrics
 */
export function getROIInsights(metrics: ROIMetrics): {
  insights: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
} {
  const insights: string[] = [];
  const recommendations: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';

  // Economic ROI insights
  if (metrics.economicROI > 1) {
    insights.push('Utmärkt ekonomisk ROI över 100%');
    riskLevel = 'low';
  } else if (metrics.economicROI > 0.5) {
    insights.push('Bra ekonomisk ROI över 50%');
    riskLevel = 'low';
  } else if (metrics.economicROI > 0) {
    insights.push('Positiv ekonomisk ROI');
    riskLevel = 'medium';
  } else {
    insights.push('Negativ ekonomisk ROI - kräver noggrannare analys');
    riskLevel = 'high';
  }

  // Qualitative ROI insights
  if (metrics.qualitativeROI > 50) {
    insights.push('Höga kvalitativa förbättringar');
  } else if (metrics.qualitativeROI > 20) {
    insights.push('Måttliga kvalitativa förbättringar');
  } else if (metrics.qualitativeROI > 0) {
    insights.push('Låga kvalitativa förbättringar');
  }

  // Effect distribution insights
  if (metrics.summary.financialCount > 0 && metrics.summary.qualitativeCount > 0) {
    insights.push('Balanserad mix av ekonomiska och kvalitativa effekter');
  } else if (metrics.summary.financialCount > 0) {
    insights.push('Fokus på ekonomiska effekter');
  } else if (metrics.summary.qualitativeCount > 0) {
    insights.push('Fokus på kvalitativa effekter');
  }

  // Payback period insights
  if (metrics.paybackPeriod < 1) {
    insights.push('Snabb återbetalningstid under 1 år');
  } else if (metrics.paybackPeriod < 3) {
    insights.push('Måttlig återbetalningstid 1-3 år');
  } else {
    insights.push('Lång återbetalningstid över 3 år');
  }

  // Recommendations
  if (metrics.economicROI < 0) {
    recommendations.push('Överväg att justera projektets omfattning eller kostnader');
  }
  
  if (metrics.summary.qualitativeCount === 0) {
    recommendations.push('Överväg att inkludera kvalitativa effektmätningar');
  }
  
  if (metrics.paybackPeriod > 5) {
    recommendations.push('Överväg att dela upp projektet i mindre faser');
  }

  return { insights, recommendations, riskLevel };
} 
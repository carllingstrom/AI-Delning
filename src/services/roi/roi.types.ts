import { EffectEntry } from '@/domain';

export interface ROIInput {
  effectEntries: EffectEntry[];
  totalProjectInvestment: number;
}

export interface ROIByDimension {
  totalValue: number;
  totalInvestment: number;
  economicROI: number;
  qualitativeROI: number;
  effectCount: number;
}

export interface ROIMetrics {
  totalInvestment: number;
  totalMonetaryValue: number;
  totalFinancialEffects: number;
  totalRedistributionEffects: number;
  totalQualitativeEffects: number;
  economicROI: number;
  qualitativeROI: number;
  combinedROI: number;
  paybackPeriod: number;
  financialEffects: any[];
  redistributionEffects: any[];
  qualitativeEffects: any[];
  dimensionBreakdown: Record<string, ROIByDimension>;
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
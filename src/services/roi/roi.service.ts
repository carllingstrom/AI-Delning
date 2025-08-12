import type { EffectEntry } from '@/domain';
import type { ROIInput, ROIMetrics } from './roi.types';
import { calculateROI } from '@/lib/roiCalculator';

export function normalizeEffectEntries(entries: any[]): EffectEntry[] {
  if (!entries) return [] as EffectEntry[];
  return entries.map((e) => ({
    ...e,
    hasQualitative: e.hasQualitative === true || e.hasQualitative === 'true',
    hasQuantitative: e.hasQuantitative === true || e.hasQuantitative === 'true',
  }));
}

export function computeTotalInvestment(
  costEntries: any[] | undefined,
  budgetAmount?: number | string | null
): number {
  // If cost entries exist, prefer them
  if (Array.isArray(costEntries) && costEntries.length > 0) {
    return costEntries.reduce((total, entry) => {
      let v = 0;
      switch (entry?.costUnit) {
        case 'hours':
          v = (Number(entry.hoursDetails?.hours) || 0) * (Number(entry.hoursDetails?.hourlyRate) || 0);
          break;
        case 'fixed':
          v = Number(entry.fixedDetails?.fixedAmount) || 0;
          break;
        case 'monthly':
          v = (Number(entry.monthlyDetails?.monthlyAmount) || 0) * (Number(entry.monthlyDetails?.monthlyDuration) || 1);
          break;
        case 'yearly':
          v = (Number(entry.yearlyDetails?.yearlyAmount) || 0) * (Number(entry.yearlyDetails?.yearlyDuration) || 1);
          break;
        default:
          v = 0;
      }
      return total + v;
    }, 0);
  }
  // Fallback to budget (idea projects)
  if (budgetAmount !== undefined && budgetAmount !== null && budgetAmount !== '') {
    const n = typeof budgetAmount === 'string' ? parseFloat(budgetAmount) : Number(budgetAmount);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

export function computeROIMetrics(params: {
  effectEntries: any[];
  costEntries?: any[];
  budgetAmount?: number | string | null;
}): ROIMetrics {
  const normalized = normalizeEffectEntries(params.effectEntries);
  const total = computeTotalInvestment(params.costEntries, params.budgetAmount);
  return calculateROI({ effectEntries: normalized, totalProjectInvestment: total } as ROIInput);
}
import { computeROIMetrics } from '@/services/roi/roi.service';

type ScalingInput = {
  orgs: number;
  adoptionRatePct: number; // 0-100
  scalabilityCoefficient?: number; // 0.6 - 1.0
  replication?: {
    mode: 'hours' | 'percent_linear' | 'percent_geometric' | 'fixed_discount';
    baseReplicationHours?: number;
    hourlyRate?: number;
    marginalHoursPerOrg?: number;
    percentPerOrg?: number; // for percent modes
    floorPct?: number; // 0-1 minimal percent of base cost
    fixedDiscountPerOrg?: number; // SEK per extra org
  };
  normalization?: {
    enabled?: boolean;
    baseMetric?: number;
    targetAvgMetric?: number;
    exponent?: number; // sensitivity 0.8-1.2
  };
};

export function computeScaledImpact(project: any, input: ScalingInput) {
  const effects = project?.effects_data?.effectDetails || [];
  const costs = project?.cost_data?.actualCostDetails?.costEntries || [];
  const budget = project?.cost_data?.budgetDetails?.budgetAmount || null;

  const base = computeROIMetrics({ effectEntries: effects, costEntries: costs, budgetAmount: budget });
  const orgs = Math.max(1, Math.floor(Number(input.orgs || 1)));
  const adoptionRate = Math.max(0, Math.min(1, Number(input.adoptionRatePct || 100) / 100));
  const adopted = adoptionRate <= 0
    ? 0
    : Math.min(orgs, Math.max(1, Math.round(orgs * adoptionRate)));
  const s = input.scalabilityCoefficient ?? 1;

  // Normalize benefit per org if enabled
  const normalize = input.normalization?.enabled;
  // Base per-organisation benefit (normalized if enabled). For the first org we
  // use full base benefit without dampening, and apply diminishing returns only
  // to additional organisations beyond the first.
  let benefitPerOrg = base.totalMonetaryValue;
  if (normalize) {
    const baseMetric = Number(input.normalization?.baseMetric || 1);
    const targetMetric = Number(input.normalization?.targetAvgMetric || baseMetric);
    const exponent = Number(input.normalization?.exponent || 1);
    const ratio = baseMetric > 0 ? (targetMetric / baseMetric) : 1;
    benefitPerOrg = benefitPerOrg * Math.pow(ratio, exponent);
  }
  // Total benefit with diminishing returns across organisations
  let totalBenefit = 0;
  for (let i = 0; i < adopted; i++) {
    totalBenefit += benefitPerOrg * Math.pow(s, i);
  }

  // Replication cost model
  let totalCost = base.totalInvestment; // include base reference cost
  const rep = input.replication;
  if (rep && adopted > 1) {
    for (let i = 2; i <= adopted; i++) {
      let extra = 0;
      switch (rep.mode) {
        case 'hours': {
          const hours = Number(rep.marginalHoursPerOrg || 0) + (i === 2 ? Number(rep.baseReplicationHours || 0) : 0);
          extra = hours * Number(rep.hourlyRate || 0);
          break;
        }
        case 'percent_geometric': {
          const pct = Math.max(0, Math.min(1, Number(rep.percentPerOrg || 0))); // 0.02 => 2% billigare per ny org
          const floor = Math.max(0, Math.min(1, Number(rep.floorPct || 0)));
          // Kräver explicit kostnadsbas; ingen default. Om saknas blir extra=0.
          const baseUnit = Number((rep as any).baseUnitCost) > 0 ? Number((rep as any).baseUnitCost) : 0;
          const factor = Math.max(floor, Math.pow(1 - pct, i - 2)); // i=2 startar på 100% av baseUnit
          const thisCost = baseUnit * factor;
          extra = thisCost;
          break;
        }
        case 'percent_linear': {
          const pct = Math.max(0, Math.min(1, Number(rep.percentPerOrg || 0)));
          const floor = Math.max(0, Math.min(1, Number(rep.floorPct || 0)));
          const baseUnit = Number((rep as any).baseUnitCost) > 0 ? Number((rep as any).baseUnitCost) : 0;
          const thisPct = Math.max(floor, 1 - pct * (i - 2)); // i=2 startar på 100% av baseUnit
          extra = baseUnit * thisPct;
          break;
        }
        case 'fixed_discount': {
          const discount = Number(rep.fixedDiscountPerOrg || 0) * (i - 1);
          extra = Math.max(0, base.totalInvestment - discount);
          break;
        }
        default:
          extra = 0;
      }
      totalCost += extra;
    }
  }

  const economicROI = totalCost > 0 ? ((totalBenefit - totalCost) / totalCost) * 100 : 0;
  // Derive an annual benefit baseline from base payback definition: payback = cost / annualBenefit
  const baseAnnualBenefit = base.paybackPeriod > 0 ? (base.totalInvestment / base.paybackPeriod) : 0;
  // Assume annual benefit scales proportionally with total benefit
  const scaledAnnualBenefit = base.totalMonetaryValue > 0
    ? baseAnnualBenefit * (totalBenefit / base.totalMonetaryValue)
    : baseAnnualBenefit;
  const paybackYears = scaledAnnualBenefit > 0 ? (totalCost / scaledAnnualBenefit) : 0;

  return {
    base,
    input: { orgs, adopted, adoptionRate, s },
    kpis: {
      totalBenefit,
      totalCost,
      economicROI,
      paybackYears,
      benefitPerOrg
    },
    breakdown: (() => {
      const scaleFactor = base.totalMonetaryValue > 0 ? (totalBenefit / base.totalMonetaryValue) : 0;
      const map: Record<string, { totalValue: number }> = {};
      Object.entries(base.dimensionBreakdown || {}).forEach(([k, v]: any) => {
        map[k] = { totalValue: (v.totalValue || 0) * scaleFactor };
      });
      return { byValueDimension: map, scaleFactor };
    })()
  };
}


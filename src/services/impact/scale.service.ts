import { computeROIMetrics } from '@/services/roi/roi.service';

type ScalingInput = {
  orgs: number;
  adoptionRatePct: number; // 0-100
  scalabilityCoefficient?: number; // 0.6 - 1.0
  replication?: {
    mode: 'hours_per_org' | 'cost_per_org' | 'economies_of_scale' | 'complexity_increase';
    
    // Method 1: Hours-based (most accurate)
    // What it costs in hours to implement for ONE organization
    hoursPerOrg?: number;
    hourlyRate?: number;
    
    // Method 2: Direct cost per organization
    // What it costs in SEK to implement for ONE organization  
    costPerOrg?: number;
    
    // Method 3: Base cost with economies of scale
    // Start with a base cost per org, then apply discounts as more orgs join
    baseCostPerOrg?: number;
    scaleDiscountPct?: number; // Discount per additional org (0-1)
    minCostPerOrg?: number; // Floor cost per org
    
    // Method 4: Base cost with complexity increase
    // Start with a base cost per org, but costs increase due to coordination etc.
    complexityIncreasePct?: number; // Additional cost per org (0-1)
  };
  normalization?: {
    enabled?: boolean;
    driverType?: 'population' | 'users' | 'employees' | 'area' | 'custom';
    baseMetric?: number;
    targetAvgMetric?: number;
    exponent?: number; // sensitivity 0.5-1.5, default 1.0
  };
  validation?: {
    maxROI?: number; // Cap unrealistic ROI values
    minCostPerOrg?: number; // Minimum realistic cost per org
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

  // Improved normalization with better validation
  const normalize = input.normalization?.enabled;
  let benefitPerOrg = base.totalMonetaryValue;
  
  if (normalize) {
    const baseMetric = Number(input.normalization?.baseMetric || 1);
    const targetMetric = Number(input.normalization?.targetAvgMetric || baseMetric);
    const exponent = Math.max(0.5, Math.min(1.5, Number(input.normalization?.exponent || 1)));
    const driverType = input.normalization?.driverType || 'custom';
    
    // Validate normalization inputs
    if (baseMetric <= 0) {
      console.warn('Invalid base metric for normalization, using no adjustment');
    } else {
      const ratio = targetMetric / baseMetric;
      
      // Apply reasonable bounds to prevent extreme scaling
      const boundedRatio = Math.max(0.1, Math.min(10, ratio)); // 10x max scaling
      
      // Apply driver-specific logic
      let scalingFactor = Math.pow(boundedRatio, exponent);
      
      // Additional validation based on driver type
      if (driverType === 'population' && boundedRatio > 5) {
        // Large population differences should have diminishing returns
        scalingFactor = Math.pow(boundedRatio, Math.min(exponent, 0.8));
      } else if (driverType === 'users' && boundedRatio > 3) {
        // User-based scaling should be more linear
        scalingFactor = Math.pow(boundedRatio, Math.max(exponent, 0.9));
      }
      
      benefitPerOrg = benefitPerOrg * scalingFactor;
    }
  }
  // Total benefit with diminishing returns across organisations
  let totalBenefit = 0;
  for (let i = 0; i < adopted; i++) {
    totalBenefit += benefitPerOrg * Math.pow(s, i);
  }

  // Correct cost model: Start with cost PER organization, then scale
  let totalCost = base.totalInvestment; // Original project cost (organization #1)
  const rep = input.replication;
  const validation = input.validation || {};
  const minCostPerOrg = validation.minCostPerOrg || 50000; // Min 50k SEK per org
  
  if (rep && adopted > 1) {
    // Calculate cost for organizations 2, 3, 4, ... up to adopted
    for (let orgNumber = 2; orgNumber <= adopted; orgNumber++) {
      let costForThisOrg = 0;
      
      switch (rep.mode) {
        case 'hours_per_org': {
          // Method 1: Hours * rate per organization
          const hours = Number(rep.hoursPerOrg || 0);
          const rate = Number(rep.hourlyRate || 0);
          costForThisOrg = hours * rate;
          break;
        }
        
        case 'cost_per_org': {
          // Method 2: Fixed cost per organization (simple)
          costForThisOrg = Number(rep.costPerOrg || 0);
          break;
        }
        
        case 'economies_of_scale': {
          // Method 3: Base cost per org, but gets cheaper as more join
          const baseCost = Number(rep.baseCostPerOrg || 0);
          const discountPct = Number(rep.scaleDiscountPct || 0); // e.g., 0.05 = 5% cheaper per additional org
          const minCost = Number(rep.minCostPerOrg || minCostPerOrg);
          
          // Each additional org gets a cumulative discount
          const discountFactor = Math.max(0, 1 - (discountPct * (orgNumber - 2)));
          costForThisOrg = Math.max(minCost, baseCost * discountFactor);
          break;
        }
        
        case 'complexity_increase': {
          // Method 4: Base cost per org, but gets more expensive due to coordination
          const baseCost = Number(rep.baseCostPerOrg || 0);
          const increasePct = Number(rep.complexityIncreasePct || 0); // e.g., 0.03 = 3% more per additional org
          
          // Each additional org costs more due to complexity
          const increaseFactor = 1 + (increasePct * (orgNumber - 2));
          costForThisOrg = baseCost * increaseFactor;
          break;
        }
        
        default:
          costForThisOrg = minCostPerOrg;
      }
      
      // Apply minimum cost validation
      costForThisOrg = Math.max(minCostPerOrg, costForThisOrg);
      totalCost += costForThisOrg;
    }
  }

  // Calculate ROI with validation
  let economicROI = totalCost > 0 ? ((totalBenefit - totalCost) / totalCost) * 100 : 0;
  
  // Apply realistic ROI caps if specified
  const maxROI = validation.maxROI || 1000; // Max 1000% ROI as sanity check
  if (Math.abs(economicROI) > maxROI) {
    console.warn(`ROI capped at ${maxROI}% (was ${economicROI.toFixed(1)}%)`);
    economicROI = economicROI > 0 ? maxROI : -maxROI;
  }
  
  // Improved payback calculation
  let paybackYears = 0;
  if (base.paybackPeriod > 0 && base.totalInvestment > 0) {
    // Base annual benefit from original project
    const baseAnnualBenefit = base.totalInvestment / base.paybackPeriod;
    
    // Scale annual benefit proportionally, but account for implementation timeline
    // Assume benefits ramp up over time as more orgs come online
    const implementationYears = Math.max(1, Math.ceil(adopted / 5)); // Assume 5 orgs per year max
    const averageAnnualBenefit = totalBenefit / implementationYears;
    
    paybackYears = averageAnnualBenefit > 0 ? (totalCost / averageAnnualBenefit) : 0;
  } else if (totalBenefit > totalCost && totalBenefit > 0) {
    // Fallback: assume benefits realized over 3 years for scaled projects
    const assumedAnnualBenefit = totalBenefit / 3;
    paybackYears = totalCost / assumedAnnualBenefit;
  }
  
  // Cap payback period at reasonable maximum
  paybackYears = Math.min(20, paybackYears);

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
    })(),
    validation: {
      warnings: generateValidationWarnings(input, { totalBenefit, totalCost, economicROI, paybackYears }),
      costPerOrg: adopted > 0 ? totalCost / adopted : 0,
      benefitPerOrg: adopted > 0 ? totalBenefit / adopted : 0,
      isRealistic: economicROI < (validation.maxROI || 1000) && paybackYears < 20
    }
  };
}

function generateValidationWarnings(input: ScalingInput, results: any): string[] {
  const warnings: string[] = [];
  
  if (results.economicROI > 500) {
    warnings.push('Mycket hög ROI - kontrollera antaganden');
  }
  
  if (results.paybackYears > 10) {
    warnings.push('Lång återbetalningstid - överväg om projektet är lönsamt');
  }
  
  if (input.normalization?.enabled) {
    const ratio = (input.normalization.targetAvgMetric || 1) / (input.normalization.baseMetric || 1);
    if (ratio > 5) {
      warnings.push('Stor normalisering - kontrollera att driver-metriken är rimlig');
    }
  }
  
  const costPerOrg = results.costPerOrg || 0;
  if (costPerOrg < 50000) {
    warnings.push('Låg kostnad per organisation - kontrollera att implementeringskostnader är realistiska');
  }
  
  if (input.orgs > 50) {
    warnings.push('Många organisationer - överväg geografiska och administrativa begränsningar');
  }
  
  return warnings;
}


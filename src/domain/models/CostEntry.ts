export type CostUnit = 'hours' | 'fixed' | 'monthly' | 'yearly';

export interface HoursCostDetails {
  hours?: number; // legacy
  hourlyRate?: number;
}

export interface MonthlyCostDetails {
  monthlyAmount?: number;
  monthlyDuration?: number;
}

export interface YearlyCostDetails {
  yearlyAmount?: number;
  yearlyDuration?: number;
}

export interface FixedCostDetails {
  fixedAmount?: number;
}

export interface CostEntry {
  costUnit: CostUnit;
  hoursDetails?: HoursCostDetails;
  monthlyDetails?: MonthlyCostDetails;
  yearlyDetails?: YearlyCostDetails;
  fixedDetails?: FixedCostDetails;
  costLabel?: string;
  costType?: string; // legacy
}
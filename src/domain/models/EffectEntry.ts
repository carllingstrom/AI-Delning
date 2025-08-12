export type ValueUnit = 'hours' | 'currency' | 'percentage' | 'count' | 'other';

export interface QualitativeDetails {
  factor: string;
  currentRating: number;
  targetRating: number;
  annualizationYears: number;
  monetaryEstimate?: number;
}

export interface FinancialHoursDetails {
  affectedPeople?: number;
  timePerPerson?: number;
  timescale?: string;
  hourlyRate?: number;
  // Legacy fields
  hours?: number;
}

export interface FinancialCurrencyDetails {
  amount?: number;
  timescale?: string;
}

export interface FinancialPercentageDetails {
  percentage?: number;
  baseValue?: number;
  timescale?: string;
}

export interface FinancialCountDetails {
  count?: number;
  valuePerUnit?: number;
  timescale?: string;
}

export interface FinancialOtherDetails {
  customUnit?: string;
  amount?: number;
  valuePerUnit?: number;
  timescale?: string;
}

export interface FinancialDetails {
  measurementName: string;
  valueUnit: ValueUnit;
  hoursDetails?: FinancialHoursDetails;
  currencyDetails?: FinancialCurrencyDetails;
  percentageDetails?: FinancialPercentageDetails;
  countDetails?: FinancialCountDetails;
  otherDetails?: FinancialOtherDetails;
  annualizationYears: number;
}

export interface RedistributionHoursDetails {
  affectedPeople?: number;
  currentTimePerPerson?: number;
  newTimePerPerson?: number;
  timescale?: string;
  hourlyRate?: number;
  // Legacy fields
  currentHours?: number;
  newHours?: number;
}

export interface RedistributionCurrencyDetails {
  currentAmount?: number;
  newAmount?: number;
  timescale?: string;
}

export interface RedistributionPercentageDetails {
  currentPercentage?: number;
  newPercentage?: number;
  baseValue?: number;
}

export interface RedistributionCountDetails {
  currentCount?: number;
  newCount?: number;
  valuePerUnit?: number;
  timescale?: string;
}

export interface RedistributionOtherDetails {
  customUnit?: string;
  currentAmount?: number;
  newAmount?: number;
  valuePerUnit?: number;
  timescale?: string;
}

export interface RedistributionDetails {
  resourceType: string;
  valueUnit: ValueUnit;
  hoursDetails?: RedistributionHoursDetails;
  currencyDetails?: RedistributionCurrencyDetails;
  percentageDetails?: RedistributionPercentageDetails;
  countDetails?: RedistributionCountDetails;
  otherDetails?: RedistributionOtherDetails;
  annualizationYears: number;
}

export interface QuantitativeDetails {
  effectType: 'financial' | 'redistribution';
  financialDetails?: FinancialDetails;
  redistributionDetails?: RedistributionDetails;
}

export interface EffectEntry {
  valueDimension: string;
  hasQualitative: boolean;
  hasQuantitative: boolean;
  qualitativeDetails?: QualitativeDetails;
  quantitativeDetails?: QuantitativeDetails;
  effectComment?: string;
}
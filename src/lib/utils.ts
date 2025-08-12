/**
 * Shared utility functions used across the application
 */

/**
 * Format a number as Swedish currency (SEK)
 */
export function formatCurrency(amount: number): string {
  if (amount === 0) return '0 kr';
  
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number as percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Convert percentage to ratio (e.g., 50% -> 0.5)
 */
export function percentageToRatio(percentage: number): number {
  return percentage / 100;
}

/**
 * Convert ratio to percentage (e.g., 0.5 -> 50)
 */
export function ratioToPercentage(ratio: number): number {
  return ratio * 100;
}

/**
 * Format a ratio with specified decimal places
 */
export function formatRatio(value: number, decimals: number = 3): string {
  return value.toFixed(decimals);
}

/**
 * Get color class based on ROI value
 */
export function getROIColor(roi: number): string {
  if (roi >= 100) return 'text-green-400';
  if (roi >= 50) return 'text-yellow-400';
  if (roi >= 0) return 'text-orange-400';
  return 'text-red-400';
}

/**
 * Get status text based on ROI value
 */
export function getROIStatus(roi: number): string {
  if (roi >= 100) return 'Excellent';
  if (roi >= 50) return 'Good';
  if (roi >= 0) return 'Fair';
  return 'Poor';
}

/**
 * Calculate annual value from various detail types
 */
export function calculateAnnualValue(details: any, unitType: string): number {
  if (!details) return 0;
  
  let annualValue = 0;
  
  switch (unitType) {
    case 'hours': {
      const hours = details.hoursDetails?.hours ??
                   ((details.hoursDetails?.timePerPerson || 0) * (details.hoursDetails?.affectedPeople || 0));
      const hourlyRate = details.hoursDetails?.hourlyRate || 0;
      const timescale = details.hoursDetails?.timescale || 'per_year';
      const multiplier = getTimescaleMultiplier(timescale);
      // If hours is a total (no explicit per_*), multiplier will be 1 (per_year) which is fine
      annualValue = (hours || 0) * hourlyRate * multiplier;
      break;
    }
    case 'currency': {
      const amount = details.currencyDetails?.amount || 0;
      const currencyTimescale = details.currencyDetails?.timescale || 'per_year';
      // One-time amounts should not be annualized across a year; treat as yearly equivalent (no extra factor)
      if (currencyTimescale === 'one_time') {
        annualValue = amount;
      } else {
        const currencyMultiplier = getTimescaleMultiplier(currencyTimescale);
        annualValue = amount * currencyMultiplier;
      }
      break;
    }
    case 'percentage': {
      const percentage = details.percentageDetails?.percentage || 0;
      const baseValue = details.percentageDetails?.baseValue || 0;
      const percentageTimescale = details.percentageDetails?.timescale || 'per_year';
      const percentageMultiplier = getTimescaleMultiplier(percentageTimescale);
      annualValue = (percentage / 100) * baseValue * percentageMultiplier;
      break;
    }
    case 'count': {
      const count = details.countDetails?.count || 0;
      const valuePerUnit = details.countDetails?.valuePerUnit || 0;
      const countTimescale = details.countDetails?.timescale || 'per_year';
      const countMultiplier = getTimescaleMultiplier(countTimescale);
      annualValue = count * valuePerUnit * countMultiplier;
      break;
    }
    case 'other': {
      const otherAmount = details.otherDetails?.amount || 0;
      const otherValuePerUnit = details.otherDetails?.valuePerUnit || 0;
      const otherTimescale = details.otherDetails?.timescale || 'per_year';
      const otherMultiplier = getTimescaleMultiplier(otherTimescale);
      annualValue = otherAmount * otherValuePerUnit * otherMultiplier;
      break;
    }
  }
  
  return annualValue;
}

/**
 * Calculate saved amount from redistribution details
 */
export function calculateSavedAmount(details: any, unitType: string): number {
  if (!details) return 0;
  
  let savedAmount = 0;
  
  switch (unitType) {
    case 'hours':
      // Prioritize timePerPerson * affectedPeople over direct hours when both exist
      const hasTimePerPerson = details.hoursDetails?.currentTimePerPerson && details.hoursDetails?.newTimePerPerson && details.hoursDetails?.affectedPeople;
      const currentHours = hasTimePerPerson ? 
                          (details.hoursDetails.currentTimePerPerson * details.hoursDetails.affectedPeople) :
                          (details.hoursDetails?.currentHours || 0);
      const newHours = hasTimePerPerson ? 
                      (details.hoursDetails.newTimePerPerson * details.hoursDetails.affectedPeople) :
                      (details.hoursDetails?.newHours || 0);
      const hourlyRate = details.hoursDetails?.hourlyRate || 0;
      const timescale = details.hoursDetails?.timescale || 'week';
      const multiplier = getTimescaleMultiplier(timescale);
      savedAmount = (currentHours - newHours) * hourlyRate * multiplier;
      break;
      
    case 'currency':
      const currentAmount = details.currencyDetails?.currentAmount || 0;
      const newAmount = details.currencyDetails?.newAmount || 0;
      const currencyTimescale = details.currencyDetails?.timescale || 'year';
      const currencyMultiplier = getTimescaleMultiplier(currencyTimescale);
      savedAmount = (currentAmount - newAmount) * currencyMultiplier;
      break;
      
    case 'percentage':
      const currentPercentage = details.percentageDetails?.currentPercentage || 0;
      const newPercentage = details.percentageDetails?.newPercentage || 0;
      const baseValue = details.percentageDetails?.baseValue || 0;
      savedAmount = ((currentPercentage - newPercentage) / 100) * baseValue;
      break;
      
    case 'count':
      const currentCount = details.countDetails?.currentCount || 0;
      const newCount = details.countDetails?.newCount || 0;
      const valuePerUnit = details.countDetails?.valuePerUnit || 0;
      const countTimescale = details.countDetails?.timescale || 'year';
      const countMultiplier = getTimescaleMultiplier(countTimescale);
      savedAmount = (currentCount - newCount) * valuePerUnit * countMultiplier;
      break;
      
    case 'other':
      const currentOtherAmount = details.otherDetails?.currentAmount || 0;
      const newOtherAmount = details.otherDetails?.newAmount || 0;
      const otherValuePerUnit = details.otherDetails?.valuePerUnit || 0;
      const otherTimescale = details.otherDetails?.timescale || 'year';
      const otherMultiplier = getTimescaleMultiplier(otherTimescale);
      savedAmount = (currentOtherAmount - newOtherAmount) * otherValuePerUnit * otherMultiplier;
      break;
  }
  
  return savedAmount;
}

/**
 * Get multiplier for different timescales
 */
function getTimescaleMultiplier(timescale: string): number {
  switch ((timescale || '').toLowerCase()) {
    case 'hour':
    case 'timme':
      return 1880; // 40 h/week * 47 work weeks
    case 'day':
    case 'dag':
      return 235; // 5 days/week * 47 weeks
    case 'week':
    case 'vecka':
    case 'per_week':
      return 47;
    case 'month':
    case 'månad':
    case 'per_month':
      return 12;
    case 'year':
    case 'år':
    case 'per_year':
      return 1;
    case 'one_time':
      return 1; // handled specially for currency to avoid multi-year scaling
    default:
      return 1;
  }
} 
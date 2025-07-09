// Project Completeness Scoring System
// Gamifies project data entry by rewarding valuable information

export interface ProjectScore {
  totalScore: number;
  maxScore: number;
  percentage: number;
  breakdown: {
    basic: { score: number; max: number; label: string };
    financial: { score: number; max: number; label: string };
    effects: { score: number; max: number; label: string };
    technical: { score: number; max: number; label: string };
    governance: { score: number; max: number; label: string };
    bonus: { score: number; max: number; label: string };
  };
  level: 'Grundläggande' | 'Utvecklad' | 'Avancerad' | 'Komplett' | 'Exemplarisk';
  missingHighValue: string[];
}

export function calculateProjectScore(project: any): ProjectScore {
  let totalScore = 0;
  const breakdown = {
    basic: { score: 0, max: 15, label: 'Grundinfo' },
    financial: { score: 0, max: 25, label: 'Budget & Kostnad' },
    effects: { score: 0, max: 35, label: 'Effekter & ROI' },
    technical: { score: 0, max: 15, label: 'Teknik & Data' },
    governance: { score: 0, max: 10, label: 'Organisation & Juridik' },
    bonus: { score: 0, max: 0, label: 'Bonuspoäng' }
  };
  
  const missingHighValue: string[] = [];

  // === BASIC INFORMATION (15 points max) ===
  if (project.title?.trim()) breakdown.basic.score += 2;
  if (project.intro?.trim()) breakdown.basic.score += 2;
  if (project.problem?.trim()) breakdown.basic.score += 2;
  if (project.opportunity?.trim()) breakdown.basic.score += 2;
  if (project.responsible?.trim()) breakdown.basic.score += 2;
  if (project.areas?.length > 0) breakdown.basic.score += 3;
  if (project.value_dimensions?.length > 0) breakdown.basic.score += 1;
  if (project.municipality_ids?.length > 0) breakdown.basic.score += 1;

  // === FINANCIAL DATA (25 points max) ===
  const costData = project.cost_data || {};
  
  // Budget planning (8 points) - REQUIRED for any meaningful score
  if (costData.hasDedicatedBudget !== undefined) {
    breakdown.financial.score += 3;
    if (costData.budgetDetails?.budgetAmount) {
      breakdown.financial.score += 5;
    }
  } else {
    missingHighValue.push('Budget information');
  }
  
  // Actual cost entries (17 points - ESSENTIAL)
  const costEntries = costData.actualCostDetails?.costEntries || [];
  if (costEntries.length > 0) {
    breakdown.financial.score += 7; // Base points for having cost entries
    
    // Detailed cost entries required for full points
    const detailedEntries = costEntries.filter((entry: any) => {
      if (entry?.costUnit === 'hours' && entry?.hoursDetails?.hours && entry?.hoursDetails?.hourlyRate) return true;
      if (entry?.costUnit === 'fixed' && entry?.fixedDetails?.fixedAmount) return true;
      if (entry?.costUnit === 'monthly' && entry?.monthlyDetails?.monthlyAmount) return true;
      if (entry?.costUnit === 'yearly' && entry?.yearlyDetails?.yearlyAmount) return true;
      return false;
    });
    
    breakdown.financial.score += Math.min(10, detailedEntries.length * 5);
  } else {
    missingHighValue.push('Detailed cost breakdown');
  }

  // === EFFECTS & ROI (35 points max - CRITICAL SECTION) ===
  const effectsData = project.effects_data || {};
  const effectEntries = effectsData.effectDetails || [];
  
  if (effectEntries.length === 0) {
    missingHighValue.push('Effect analysis');
    // NO POINTS without effects - this is essential
  } else {
    // Must have at least one properly completed effect entry to get ANY points
    let hasCompleteEffect = false;
    let quantitativePoints = 0;
    let qualitativePoints = 0;
    let monetaryPoints = 0;
    
    // Count different types of complete effects
    let completeQuantitativeEffects = 0;
    let completeQualitativeEffects = 0;
    let detailedMonetaryEffects = 0;
    
    effectEntries.forEach((effect: any) => {
      let effectComplete = false;
      
      // Check for quantitative effects with current schema
      if ((effect.hasQuantitative === true || effect.hasQuantitative === 'true') && effect.quantitativeDetails) {
        const qDetails = effect.quantitativeDetails;
        
        // Financial effects validation
        if (qDetails.effectType === 'financial' && qDetails.financialDetails) {
          const fin = qDetails.financialDetails;
          if (fin.measurementName && fin.valueUnit && fin.annualizationYears) {
            completeQuantitativeEffects++;
            effectComplete = true;
            
            // Check for detailed financial data
            if ((fin.valueUnit === 'hours' && fin.hoursDetails?.hours && fin.hoursDetails?.hourlyRate) ||
                (fin.valueUnit === 'currency' && fin.currencyDetails?.amount) ||
                (fin.valueUnit === 'count' && fin.countDetails?.count && fin.countDetails?.valuePerUnit) ||
                (fin.valueUnit === 'percentage' && fin.percentageDetails?.percentage && fin.percentageDetails?.baseValue) ||
                (fin.valueUnit === 'other' && fin.otherDetails?.amount && fin.otherDetails?.valuePerUnit)) {
              detailedMonetaryEffects++;
            }
          }
        }
        
        // Redistribution effects validation
        if (qDetails.effectType === 'redistribution' && qDetails.redistributionDetails) {
          const redist = qDetails.redistributionDetails;
          if (redist.resourceType && redist.valueUnit && redist.annualizationYears) {
            completeQuantitativeEffects++;
            effectComplete = true;
            
            // Check for detailed redistribution data
            if ((redist.valueUnit === 'hours' && redist.hoursDetails?.currentHours && redist.hoursDetails?.newHours) ||
                (redist.valueUnit === 'currency' && redist.currencyDetails?.currentAmount && redist.currencyDetails?.newAmount) ||
                (redist.valueUnit === 'count' && redist.countDetails?.currentCount && redist.countDetails?.newCount) ||
                (redist.valueUnit === 'other' && redist.otherDetails?.currentAmount && redist.otherDetails?.newAmount)) {
              detailedMonetaryEffects++;
            }
          }
        }
      }
      
      // Check for qualitative effects with current schema
      if ((effect.hasQualitative === true || effect.hasQualitative === 'true') && effect.qualitativeDetails) {
        const qualDetails = effect.qualitativeDetails;
        if (qualDetails.factor && qualDetails.currentRating && qualDetails.targetRating && qualDetails.annualizationYears) {
          completeQualitativeEffects++;
          effectComplete = true;
        }
      }
      
      if (effectComplete) {
        hasCompleteEffect = true;
      }
    });
    
    // Calculate controlled point allocation
    quantitativePoints = Math.min(12, completeQuantitativeEffects * 6); // Max 12 points
    qualitativePoints = Math.min(8, completeQualitativeEffects * 4); // Max 8 points  
    monetaryPoints = Math.min(5, detailedMonetaryEffects * 2); // Max 5 points
    
    if (hasCompleteEffect) {
      // Base points for having effects (8 points)
      breakdown.effects.score += 8;
      
      // Points for quantitative analysis (max 12)
      breakdown.effects.score += Math.min(12, quantitativePoints);
      
      // Points for qualitative analysis (max 8) 
      breakdown.effects.score += Math.min(8, qualitativePoints);
      
      // Points for monetary estimates (max 5)
      breakdown.effects.score += Math.min(5, monetaryPoints);
      
      // Bonus for having both quantitative AND qualitative effects (2 points)
      if (quantitativePoints > 0 && qualitativePoints > 0) {
        breakdown.effects.score += 2;
      }
      
      // ENSURE WE NEVER EXCEED MAX (35 points total)
      breakdown.effects.score = Math.min(35, breakdown.effects.score);
    } else {
      missingHighValue.push('Complete effect details');
    }
  }

  // === TECHNICAL DATA (15 points max) - REQUIRED FOR HIGH SCORES ===
  const techData = project.technical_data || {};
  
  // Core technical information needed
  if (techData.system_name?.trim()) breakdown.technical.score += 3;
  if (techData.ai_methodology?.trim()) breakdown.technical.score += 4;
  if (techData.deployment_environment?.trim()) breakdown.technical.score += 3;
  if (techData.data_types?.length > 0) breakdown.technical.score += 3;
  if (techData.data_sources?.length > 0) breakdown.technical.score += 2;
  
  // Missing technical data is a high-value missing item
  if (Object.keys(techData).length === 0 || 
      (!techData.system_name && !techData.ai_methodology)) {
    missingHighValue.push('Technical information');
  }

  // === GOVERNANCE (10 points max) - ESSENTIAL FOR COMPLETION ===
  const leadershipData = project.leadership_data || {};
  const legalData = project.legal_data || {};
  
  // Leadership/organization info (5 points)
  if (Object.keys(leadershipData).length > 0) {
    breakdown.governance.score += 5;
  } else {
    missingHighValue.push('Leadership information');
  }
  
  // Legal compliance info (5 points)  
  if (Object.keys(legalData).length > 0) {
    breakdown.governance.score += 5;
  } else {
    missingHighValue.push('Legal compliance information');
  }

  // Ensure all categories are within their max limits
  breakdown.basic.score = Math.min(breakdown.basic.max, breakdown.basic.score);
  breakdown.financial.score = Math.min(breakdown.financial.max, breakdown.financial.score);
  breakdown.effects.score = Math.min(breakdown.effects.max, breakdown.effects.score);
  breakdown.technical.score = Math.min(breakdown.technical.max, breakdown.technical.score);
  breakdown.governance.score = Math.min(breakdown.governance.max, breakdown.governance.score);
  breakdown.bonus.score = Math.min(breakdown.bonus.max, breakdown.bonus.score);

  // Calculate totals
  totalScore = Object.values(breakdown).reduce((sum, category) => sum + category.score, 0);
  const maxScore = Object.values(breakdown).reduce((sum, category) => sum + category.max, 0);
  
  // Ensure percentage never exceeds 100%
  const percentage = Math.min(100, Math.round((totalScore / maxScore) * 100));

  // Determine level with much stricter thresholds
  let level: ProjectScore['level'];
  if (percentage >= 95) level = 'Exemplarisk';
  else if (percentage >= 85) level = 'Komplett';
  else if (percentage >= 70) level = 'Avancerad';
  else if (percentage >= 50) level = 'Utvecklad';
  else level = 'Grundläggande';

  return {
    totalScore,
    maxScore,
    percentage,
    breakdown,
    level,
    missingHighValue
  };
}

export function getScoreColor(percentage: number): string {
  // Red to green gradient for text
  if (percentage >= 80) return 'text-green-400';
  if (percentage >= 60) return 'text-yellow-400';
  if (percentage >= 40) return 'text-orange-400';
  return 'text-red-400';
}

export function getScoreBarColor(percentage: number): string {
  // Generate RGB values for red-to-green gradient
  const red = Math.max(0, Math.min(255, Math.round(255 * (100 - percentage) / 100)));
  const green = Math.max(0, Math.min(255, Math.round(255 * percentage / 100)));
  const blue = 0;
  
  return `rgb(${red}, ${green}, ${blue})`;
} 
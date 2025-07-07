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
    
    effectEntries.forEach((effect: any) => {
      let effectComplete = false;
      
      // Check for quantitative effects with proper details
      if (effect.hasQuantitative && effect.quantitativeDetails) {
        const qDetails = effect.quantitativeDetails;
        if (qDetails.expectedValue && qDetails.timeframe && qDetails.measurementMethod) {
          quantitativePoints += 8;
          effectComplete = true;
          
          // Bonus for financial or redistribution details
          if (qDetails.financialDetails || qDetails.redistributionDetails) {
            monetaryPoints += 4;
          }
        }
      }
      
      // Check for qualitative effects with proper details  
      if (effect.hasQualitative && effect.qualitativeDetails) {
        const qualDetails = effect.qualitativeDetails;
        if (qualDetails.description && qualDetails.targetGroup && qualDetails.expectedImpact) {
          qualitativePoints += 6;
          effectComplete = true;
          
          // Bonus for monetary estimate
          if (qualDetails.monetaryEstimate) {
            monetaryPoints += 4;
          }
        }
      }
      
      if (effectComplete) {
        hasCompleteEffect = true;
      }
    });
    
    if (hasCompleteEffect) {
      // Base points for having complete effects
      breakdown.effects.score += 8;
      
      // Points for quantitative analysis (max 16)
      breakdown.effects.score += Math.min(16, quantitativePoints);
      
      // Points for qualitative analysis (max 12) 
      breakdown.effects.score += Math.min(12, qualitativePoints);
      
      // Points for monetary estimates (max 8)
      breakdown.effects.score += Math.min(8, monetaryPoints);
      
      // Bonus for having both quantitative AND qualitative effects
      if (quantitativePoints > 0 && qualitativePoints > 0) {
        breakdown.effects.score += 3;
      }
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

  // Calculate totals
  totalScore = Object.values(breakdown).reduce((sum, category) => sum + category.score, 0);
  const maxScore = Object.values(breakdown).reduce((sum, category) => sum + category.max, 0);
  const percentage = Math.round((totalScore / maxScore) * 100);

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
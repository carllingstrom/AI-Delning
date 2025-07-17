'use client';

import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import DataDrivenOnePager from './DataDrivenOnePager';
import TextFocusedOnePager from './TextFocusedOnePager';
import { generateAISummary, prepareTextForAI } from './ai-summary-generator';
import { calculateROI } from '@/lib/roiCalculator';
import { calculateProjectScore } from '@/lib/projectScore';

interface OnePagerControllerProps {
  project: any;
  children?: (props: { 
    loading: boolean; 
    generatePDF: () => void;
  }) => React.ReactNode;
}

function hasKeyFigures(project: any) {
  // Data-driven if we have meaningful project data
  // Check for any of these indicators of a substantial project
  
  // 1. Has cost data
  if (project.cost_data?.actualCostDetails?.costEntries?.length > 0) {
    return true;
  }
  
  // 2. Has effects data with values
  if (project.effects_data?.effectDetails?.some((effect: any) => {
    if (effect.hasQuantitative && effect.quantitativeDetails) {
      if (effect.quantitativeDetails.financialDetails?.value) return true;
      if (effect.quantitativeDetails.redistributionDetails?.value) return true;
    }
    return false;
  })) {
    return true;
  }
  
  // 3. Has budget information
  if (project.budget && project.budget > 0) {
    return true;
  }
  
  // 4. Has substantial project information (title, description, etc.)
  if (project.title && (project.intro || project.description)) {
    return true;
  }
  
  // Default to data-driven for most projects
  return true;
}

function transformProjectForPDF(project: any) {
  if (!project) return null;

  // Extract municipalities from project_municipalities relationship
  const municipalities = project.project_municipalities?.map((pm: any) => pm.municipalities?.name).filter(Boolean) || [];
  
  // Extract counties from overview_details.county_codes
  const countyCodes = project.overview_details?.county_codes || [];
  const counties = countyCodes.map((code: string) => {
    // Map county codes to names - remove "län" suffix
    const countyMap: { [key: string]: string } = {
      '01': 'Stockholms',
      '03': 'Uppsala',
      '04': 'Södermanlands',
      '05': 'Östergötlands',
      '06': 'Jönköpings',
      '07': 'Kronobergs',
      '08': 'Kalmar',
      '09': 'Gotlands',
      '10': 'Blekinge',
      '12': 'Skåne',
      '13': 'Hallands',
      '14': 'Västra Götalands',
      '17': 'Värmlands',
      '18': 'Örebro',
      '19': 'Västmanlands',
      '20': 'Dalarnas',
      '21': 'Gävleborgs',
      '22': 'Västernorrlands',
      '23': 'Jämtlands',
      '24': 'Västerbottens',
      '25': 'Norrbottens'
    };
    return countyMap[code] || `Region ${code}`;
  });
  
  // Combine municipalities and counties for location display
  const locations = [...municipalities, ...counties];
  const location = locations.join(', ') || 'Ej specificerat';

  // Extract areas
  const areas = project.project_areas?.map((pa: any) => pa.areas?.name).filter(Boolean) || project.areas || [];

  // Extract value dimensions
  const valueDimensions = project.project_value_dimensions?.map((pvd: any) => pvd.value_dimensions?.name).filter(Boolean) || project.value_dimensions || [];

  // Calculate budget and costs using the same logic as the project page
  let budget = 0;
  let totalCost = 0;
  
  // Calculate total cost from cost entries (same as project page)
  if (project.cost_data?.actualCostDetails?.costEntries?.length > 0) {
    project.cost_data.actualCostDetails.costEntries.forEach((entry: any) => {
      if (!entry) return;
      
      let entryTotal = 0;
      try {
        switch (entry?.costUnit) {
          case 'hours':
            const hours = Number(entry.hoursDetails?.hours) || 0;
            const hourlyRate = Number(entry.hoursDetails?.hourlyRate) || 0;
            entryTotal = hours * hourlyRate;
            break;
          case 'fixed':
            entryTotal = Number(entry.fixedDetails?.fixedAmount) || 0;
            break;
          case 'monthly':
            const monthlyAmount = Number(entry.monthlyDetails?.monthlyAmount) || 0;
            const monthlyDuration = Number(entry.monthlyDetails?.monthlyDuration) || 1;
            entryTotal = monthlyAmount * monthlyDuration;
            break;
          case 'yearly':
            const yearlyAmount = Number(entry.yearlyDetails?.yearlyAmount) || 0;
            const yearlyDuration = Number(entry.yearlyDetails?.yearlyDuration) || 1;
            entryTotal = yearlyAmount * yearlyDuration;
            break;
        }
      } catch (error) {
        console.warn('Error calculating cost entry:', error);
      }
      totalCost += entryTotal;
    });
  }
  
  // Use total cost as budget, or fallback to budget details
  budget = totalCost;
  if (budget === 0 && project.cost_data?.budgetDetails?.budgetAmount) {
    budget = Number(project.cost_data.budgetDetails.budgetAmount) || 0;
  }

  // Calculate effects using the same logic as the project page
  const effects: Array<{label: string, val: number}> = [];
  const effectEntries = project.effects_data?.effectDetails || [];
  
  if (effectEntries.length > 0) {
    effectEntries.forEach((effect: any, index: number) => {
      if (!effect) return;
      
      let value = 0;
      
      try {
        // Handle new structure with quantitativeDetails
        if (effect.hasQuantitative && effect.quantitativeDetails) {
          if (effect.quantitativeDetails.financialDetails) {
            const financialData = parseFinancialDetails(effect.quantitativeDetails.financialDetails);
            if (financialData) value = financialData.value;
          } else if (effect.quantitativeDetails.redistributionDetails) {
            const redistributionData = parseRedistributionDetails(effect.quantitativeDetails.redistributionDetails);
            if (redistributionData) value = redistributionData.value;
          }
        }
      } catch (error) {
        console.warn('Error extracting effect value:', error);
      }
      
      // Use effect name or fallback to index
      const label = effect.effectName || 
                   effect.qualitativeDetails?.factor || 
                   effect.quantitativeDetails?.factor ||
                   `Effekt ${index + 1}`;
      
      effects.push({
        label,
        val: value
      });
    });
  }

  // Use the same ROI calculator as the project page
  let roiMetrics = null;
  let totalBenefit = 0;
  let roi = 0;
  let paybackPeriod = 0;
  let sharingScore = 0;
  
  if (effectEntries.length > 0 && totalCost > 0) {
    try {
      roiMetrics = calculateROI({ effectEntries, totalProjectInvestment: totalCost });
      totalBenefit = roiMetrics.totalMonetaryValue;
      roi = roiMetrics.combinedROI;
      paybackPeriod = roiMetrics.paybackPeriod;
    } catch (error) {
      console.warn('Error calculating ROI:', error);
      // Fallback to simple calculation
      totalBenefit = effects.reduce((sum, effect) => sum + effect.val, 0);
      roi = totalCost > 0 ? ((totalBenefit - totalCost) / totalCost) * 100 : 0;
      paybackPeriod = totalCost > 0 && totalBenefit > 0 ? (totalCost / (totalBenefit / 12)) / 12 : 0;
    }
  } else {
    // Fallback to simple calculation when no ROI calculator data
    totalBenefit = effects.reduce((sum, effect) => sum + effect.val, 0);
    roi = totalCost > 0 ? ((totalBenefit - totalCost) / totalCost) * 100 : 0;
    paybackPeriod = totalCost > 0 && totalBenefit > 0 ? (totalCost / (totalBenefit / 12)) / 12 : 0;
  }

  // Calculate sharing score using the same function as the project page
  try {
    const projectScore = calculateProjectScore(project);
    sharingScore = projectScore.percentage;
  } catch (error) {
    console.warn('Error calculating project score:', error);
    // Fallback to simple calculation
    sharingScore = totalCost > 0 && totalBenefit > 0 ? Math.min(100, Math.max(0, Math.round((totalBenefit / totalCost) * 50))) : 0;
  }

  // Create tech array from technical_data
  const tech = [];
  if (project.technical_data) {
    if (project.technical_data.technology) {
      tech.push(`Teknologi: ${project.technical_data.technology}`);
    }
    if (project.technical_data.implementation) {
      tech.push(`Implementation: ${project.technical_data.implementation}`);
    }
    if (project.technical_data.integration) {
      tech.push(`Integration: ${project.technical_data.integration}`);
    }
  }

  // Determine risk based on legal_data
  let risk = 'Låg';
  if (project.legal_data?.gdprRisk === 'high' || project.legal_data?.aiRisk === 'high') {
    risk = 'Hög';
  } else if (project.legal_data?.gdprRisk === 'medium' || project.legal_data?.aiRisk === 'medium') {
    risk = 'Medel';
  }

  // Determine phaseIndex based on phase
  const phaseMap: { [key: string]: number } = {
    'idé': 0,
    'pilot': 1,
    'produktion': 2
  };
  const phaseIndex = phaseMap[project.phase?.toLowerCase()] || 0;

  return {
    id: project.id,
    title: project.title || 'Ej namngivet projekt',
    intro: project.intro || '',
    problem: project.problem || '',
    opportunity: project.opportunity || '',
    responsible: project.responsible || 'Ej specificerat',
    phase: project.phase || 'Ej specificerat',
    phaseIndex,
    municipality: location, // Use combined location
    areas,
    value_dimensions: valueDimensions,
    budget,
    totalCost, // Add calculated total cost
    totalBenefit, // Add calculated total benefit
    roi, // Add calculated ROI
    paybackPeriod, // Add calculated payback period
    sharingScore, // Add calculated sharing score
    effects,
    tech,
    risk,
    email: project.responsible || 'Ej specificerat',
    summary: project.intro || project.description || '',
    description: project.intro || project.description || '',
    // Include technical and legal data for comprehensive project information
    technical_data: project.technical_data || {},
    legal_data: project.legal_data || {},
    leadership_data: project.leadership_data || {},
    // Include raw data for future diagrams and analytics
    cost_data: project.cost_data || {},
    effects_data: project.effects_data || {},
    overview_details: project.overview_details || {}
  };
}

// Helper functions from the project page
function parseFinancialDetails(details: any) {
  if (!details) return null;
  
  try {
    const valueUnit = details.valueUnit;
    let value = 0;
    let description = '';
    
    switch (valueUnit) {
      case 'hours':
        const hours = Number(details.hoursDetails?.hours) || 0;
        const hourlyRate = Number(details.hoursDetails?.hourlyRate) || 0;
        const affectedPeople = Number(details.hoursDetails?.affectedPeople) || 1;
        const timePerPerson = Number(details.hoursDetails?.timePerPerson) || 0;
        value = hours * hourlyRate * affectedPeople * timePerPerson;
        description = `${hours} timmar × ${formatCurrency(hourlyRate)}/tim × ${affectedPeople} personer × ${timePerPerson} timmar/person`;
        break;
        
      case 'currency':
        value = Number(details.currencyDetails?.amount) || 0;
        description = `Direkt finansiell effekt`;
        break;
        
      case 'percentage':
        const percentage = Number(details.percentageDetails?.percentage) || 0;
        const baseValue = Number(details.percentageDetails?.baseValue) || 0;
        value = (percentage / 100) * baseValue;
        description = `${percentage}% av ${formatCurrency(baseValue)}`;
        break;
        
      case 'count':
        const count = Number(details.countDetails?.count) || 0;
        const valuePerUnit = Number(details.countDetails?.valuePerUnit) || 0;
        value = count * valuePerUnit;
        description = `${count} enheter × ${formatCurrency(valuePerUnit)}/enhet`;
        break;
        
      case 'other':
        const amount = Number(details.otherDetails?.amount) || 0;
        const customValuePerUnit = Number(details.otherDetails?.valuePerUnit) || 0;
        value = amount * customValuePerUnit;
        description = `${amount} ${details.otherDetails?.customUnit || 'enheter'} × ${formatCurrency(customValuePerUnit)}/enhet`;
        break;
    }
    
    // Apply annualization if specified
    const annualizationYears = Number(details.annualizationYears) || 1;
    if (annualizationYears > 1) {
      value = value * annualizationYears;
      description += ` (${annualizationYears} år)`;
    }
    
    return { value, description };
  } catch (error) {
    console.warn('Error parsing financial details:', error);
    return null;
  }
}

function parseRedistributionDetails(details: any) {
  if (!details) return null;
  
  try {
    const valueUnit = details.valueUnit;
    let value = 0;
    let description = '';
    
    switch (valueUnit) {
      case 'hours':
        const currentTimePerPerson = Number(details.hoursDetails?.currentTimePerPerson) || 0;
        const newTimePerPerson = Number(details.hoursDetails?.newTimePerPerson) || 0;
        const hourlyRate = Number(details.hoursDetails?.hourlyRate) || 0;
        const affectedPeople = Number(details.hoursDetails?.affectedPeople) || 1;
        const timescale = details.hoursDetails?.timescale || 'per_week';
        
        // Calculate time savings
        const timeSaved = currentTimePerPerson - newTimePerPerson;
        if (timeSaved > 0) {
          // Convert to annual value based on timescale
          let annualMultiplier = 1;
          switch (timescale) {
            case 'per_week': annualMultiplier = 52; break;
            case 'per_month': annualMultiplier = 12; break;
            case 'per_year': annualMultiplier = 1; break;
            case 'one_time': annualMultiplier = 1; break;
          }
          
          value = timeSaved * hourlyRate * affectedPeople * annualMultiplier;
          description = `${timeSaved} timmar/vecka × ${formatCurrency(hourlyRate)}/tim × ${affectedPeople} personer × ${annualMultiplier} veckor/år`;
        }
        break;
        
      case 'currency':
        value = Number(details.currencyDetails?.amount) || 0;
        description = `Omfördelningsvärde`;
        break;
        
      case 'percentage':
        const percentage = Number(details.percentageDetails?.percentage) || 0;
        const baseValue = Number(details.percentageDetails?.baseValue) || 0;
        value = (percentage / 100) * baseValue;
        description = `${percentage}% av ${formatCurrency(baseValue)}`;
        break;
        
      case 'count':
        const currentCount = Number(details.countDetails?.currentCount) || 0;
        const newCount = Number(details.countDetails?.newCount) || 0;
        const valuePerUnit = Number(details.countDetails?.valuePerUnit) || 0;
        const countTimescale = details.countDetails?.timescale || 'per_year';
        
        // Calculate value based on count change
        const countChange = Math.abs(currentCount - newCount);
        if (countChange > 0) {
          // Convert to annual value based on timescale
          let annualMultiplier = 1;
          switch (countTimescale) {
            case 'per_week': annualMultiplier = 52; break;
            case 'per_month': annualMultiplier = 12; break;
            case 'per_year': annualMultiplier = 1; break;
            case 'one_time': annualMultiplier = 1; break;
          }
          
          value = countChange * valuePerUnit * annualMultiplier;
          description = `${countChange} enheter × ${formatCurrency(valuePerUnit)}/enhet × ${annualMultiplier} gånger/år`;
        }
        break;
        
      case 'other':
        const amount = Number(details.otherDetails?.amount) || 0;
        const customValuePerUnit = Number(details.otherDetails?.valuePerUnit) || 0;
        value = amount * customValuePerUnit;
        description = `${amount} ${details.otherDetails?.customUnit || 'enheter'} × ${formatCurrency(customValuePerUnit)}/enhet`;
        break;
    }
    
    // Apply annualization if specified
    const annualizationYears = Number(details.annualizationYears) || 1;
    if (annualizationYears > 1) {
      value = value * annualizationYears;
      description += ` (${annualizationYears} år)`;
    }
    
    return { value, description };
  } catch (error) {
    console.warn('Error parsing redistribution details:', error);
    return null;
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function OnePagerController({ project, children }: OnePagerControllerProps) {
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImprovedFallback = (intro: string, problem: string, opportunity: string): string => {
    // Create a much more natural summary without awkward concatenation
    let summary = '';
    
    // Start with the intro if available
    if (intro && intro.trim()) {
      summary = intro.trim();
    }
    
    // Add problem context if available - but more naturally
    if (problem && problem.trim()) {
      if (summary) {
        // If we have an intro, connect it naturally without awkward phrases
        if (problem.toLowerCase().includes('dålig')) {
          summary += '. Den nuvarande funktionaliteten är begränsad och behöver förbättras.';
        } else if (problem.toLowerCase().includes('problem')) {
          summary += '. Projektet adresserar befintliga utmaningar inom området.';
        } else {
          summary += '. Projektet fokuserar på att lösa ' + problem.toLowerCase();
        }
      } else {
        // No intro, start with problem
        if (problem.toLowerCase().includes('dålig')) {
          summary = 'Projektet fokuserar på att förbättra befintlig funktionalitet.';
        } else {
          summary = 'Projektet fokuserar på att lösa ' + problem.toLowerCase();
        }
      }
    }
    
    // Add opportunity/solution if available - but more naturally
    if (opportunity && opportunity.trim()) {
      if (summary) {
        if (opportunity.toLowerCase().includes('förbättra')) {
          summary += '. Genom förbättringar skapas bättre användarupplevelser och effektivitet.';
        } else if (opportunity.toLowerCase().includes('lösning')) {
          summary += '. Projektet erbjuder innovativa lösningar för att möta behoven.';
        } else {
          summary += '. Projektet syftar till att ' + opportunity.toLowerCase();
        }
      } else {
        // No previous content, start with opportunity
        if (opportunity.toLowerCase().includes('förbättra')) {
          summary = 'Projektet syftar till att förbättra befintliga processer och system.';
        } else {
          summary = 'Projektet syftar till att ' + opportunity.toLowerCase();
        }
      }
    }
    
    // If we still don't have enough content, add some context
    if (!summary || summary.length < 100) {
      if (summary) {
        summary += ' Projektet skapar värde genom innovation och digitalisering.';
      } else {
        summary = 'Projektet syftar till att skapa värde genom innovation och digitalisering av offentliga tjänster.';
      }
    }
    
    // Clean up any awkward phrases
    summary = summary
      .replace(/^(Problemet|Möjligheten|Intro):\s*/gi, '')
      .replace(/\s+(Problemet|Möjligheten|Intro):\s*/gi, ' ')
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\.\.+/g, '.') // Fix double dots
      .replace(/\s+\./g, '.') // Remove spaces before periods
      .trim();
    
    // Ensure proper sentence structure
    if (!summary.endsWith('.') && !summary.endsWith('!') && !summary.endsWith('?')) {
      summary += '.';
    }
    
    // Ensure it fits our target length
    if (summary.length > 320) {
      // Simple truncation at sentence boundary
      const truncated = summary.substring(0, 320);
      const lastPeriod = truncated.lastIndexOf('.');
      return lastPeriod > 280 ? truncated.substring(0, lastPeriod + 1) : truncated + '...';
    } else if (summary.length < 200) {
      // Add some relevant context to reach minimum length
      summary += ' Projektet förbättrar effektiviteten och användarupplevelsen.';
    }
    
    return summary;
  };

  const generatePDF = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const transformedProject = transformProjectForPDF(project);
      if (!transformedProject) throw new Error('Kunde inte transformera projektdata');
      
      console.log('DEBUG: Starting AI summary generation...');
      console.log('DEBUG: Input intro:', transformedProject.intro);
      console.log('DEBUG: Input problem:', transformedProject.problem);
      console.log('DEBUG: Input opportunity:', transformedProject.opportunity);
      
      const intro = prepareTextForAI(transformedProject.intro || '');
      const problem = prepareTextForAI(transformedProject.problem || '');
      const opportunity = prepareTextForAI(transformedProject.opportunity || '');
      
      console.log('DEBUG: Prepared intro:', intro);
      console.log('DEBUG: Prepared problem:', problem);
      console.log('DEBUG: Prepared opportunity:', opportunity);
      
      let summary = '';
      try {
        console.log('DEBUG: Calling generateAISummary...');
        summary = await generateAISummary(intro, problem, opportunity);
        console.log('DEBUG: Raw AI summary received:', summary);
        
        if (!summary || summary.length < 10) {
          console.warn('DEBUG: AI summary too short or empty, using fallback');
          throw new Error('Empty AI summary');
        }
        
        // Check if the summary is just repeating the input
        const isRepeating = summary.toLowerCase().includes(intro.toLowerCase()) && 
                           summary.toLowerCase().includes(problem.toLowerCase()) && 
                           summary.toLowerCase().includes(opportunity.toLowerCase());
        
        // Also check for awkward concatenation patterns
        const hasAwkwardPatterns = summary.includes('Utmaningen är att dålig') || 
                                  summary.includes('Lösningen erbjuder förbättra') ||
                                  summary.includes('Problemet:') ||
                                  summary.includes('Möjligheten:');
        
        if (isRepeating || hasAwkwardPatterns) {
          console.warn('DEBUG: AI summary appears to be just repeating input or has awkward patterns, using improved fallback...');
          // Use an improved fallback instead of trying again
          summary = generateImprovedFallback(intro, problem, opportunity);
          console.log('DEBUG: Using improved fallback summary:', summary);
        }
        
      } catch (err) {
        console.error('DEBUG: AI summary generation failed:', err);
        summary = transformedProject.intro || transformedProject.description || 'Ingen sammanfattning tillgänglig för detta projekt.';
      }
      
      console.log('DEBUG: Final summary for PDF:', summary);
      setAiSummary(summary);

      // Decide which version to use
      const useDataDriven = hasKeyFigures(project);
      const doc = useDataDriven
        ? <DataDrivenOnePager project={transformedProject} aiSummary={summary} />
        : <TextFocusedOnePager project={transformedProject} aiSummary={summary} />;

      // Generate PDF and trigger download
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${transformedProject.title?.replaceAll(' ', '_') || 'projekt'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Kunde inte generera PDF. Försök igen.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (children) {
    return children({ loading: isGenerating, generatePDF });
  }

  // No UI, just controller
  return null;
} 
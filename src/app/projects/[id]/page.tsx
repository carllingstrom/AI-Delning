'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ProjectScoreBar from '@/components/ProjectScoreBar';
import { calculateProjectScore } from '@/lib/projectScore';

interface Project {
  id: string;
  title: string;
  intro: string;
  problem: string;
  opportunity: string;
  responsible: string;
  phase: string;
  areas: string[];
  value_dimensions: string[];
  overview_details: any;
  cost_data: any;
  effects_data: any;
  technical_data: any;
  leadership_data: any;
  legal_data: any;
  created_at: string;
  updated_at: string;
  project_municipalities?: Array<{
    municipalities: {
      id: number;
      name: string;
      county: string;
    };
  }>;
  project_areas?: Array<{
    areas: {
      id: number;
      name: string;
    };
  }>;
  project_value_dimensions?: Array<{
    value_dimensions: {
      id: number;
      name: string;
    };
  }>;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string);
    }
  }, [params.id]);

  const fetchProject = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) {
        throw new Error('Project not found');
      }
      const data = await response.json();
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async () => {
    if (!project || !confirm('Är du säker på att du vill ta bort detta projekt? Denna åtgärd kan inte ångras.')) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      // Redirect to projects page after successful deletion
      router.push('/projects');
    } catch (err) {
      alert('Ett fel uppstod när projektet skulle tas bort. Försök igen.');
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'idea': return 'Idé';
      case 'pilot': return 'Pilot';
      case 'implemented': return 'Implementerat';
      default: return phase;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'idea': return 'bg-blue-500';
      case 'pilot': return 'bg-orange-500';
      case 'implemented': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  const renderSection = (title: string, content: React.ReactNode, isEmpty = false) => {
    if (isEmpty) return null;
    
    return (
      <div className="bg-[#1E3A4A] p-6 rounded-lg">
        <h3 className="text-xl font-bold text-[#FECB00] mb-4">{title}</h3>
        {content}
      </div>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Helper function to get meaningful effect names
  const getEffectName = (effect: any, index: number) => {
    try {
      // Check if it's a quantitative effect with financial details
      if (effect.hasQuantitative && effect.quantitativeDetails) {
        const quantDetails = effect.quantitativeDetails;
        
        // For financial effects, use measurementName
        if (quantDetails.effectType === 'financial' && quantDetails.financialDetails?.measurementName) {
          return quantDetails.financialDetails.measurementName;
        }
        
        // For redistribution effects, use resourceType
        if (quantDetails.effectType === 'redistribution' && quantDetails.redistributionDetails?.resourceType) {
          return quantDetails.redistributionDetails.resourceType;
        }
      }
      
      // Check if it's a qualitative effect with a factor name
      if (effect.hasQualitative && effect.qualitativeDetails?.factor) {
        return effect.qualitativeDetails.factor;
      }
      
      // Use value dimension if available
      if (effect.valueDimension) {
        // If value dimension is "Annat" and there's a custom description, use that
        if (effect.valueDimension === 'Annat' && effect.customValueDimension) {
          return effect.customValueDimension;
        }
        return effect.valueDimension;
      }
      
      // Fall back to generic name
      return `Effekt ${index + 1}`;
    } catch (error) {
      return `Effekt ${index + 1}`;
    }
  };

  const parseFinancialDetails = (details: any) => {
    if (!details || typeof details !== 'object') return null;
    
    const { valueUnit, countDetails, hoursDetails, otherDetails, measurementName, annualizationYears, currencyDetails, percentageDetails } = details;
    
    let value = 0;
    let description = '';
    
    if (valueUnit === 'count' && countDetails) {
      value = (countDetails.count || 0) * (countDetails.valuePerUnit || 0);
      const timescale = countDetails.timescale === 'per_month' ? '/månad' : countDetails.timescale === 'per_year' ? '/år' : '';
      description = `${countDetails.count} enheter ${timescale} × ${formatCurrency(countDetails.valuePerUnit || 0)}`;
      if (annualizationYears) {
        value *= (annualizationYears * (countDetails.timescale === 'per_month' ? 12 : 1));
        description += ` under ${annualizationYears} år`;
      }
    } else if (valueUnit === 'hours' && hoursDetails) {
      // New format: affectedPeople × timePerPerson
      const affectedPeople = hoursDetails.affectedPeople || 0;
      const timePerPerson = hoursDetails.timePerPerson || 0;
      const hourlyRate = hoursDetails.hourlyRate || 0;
      
      // Calculate total hours using new person-based approach
      let totalHours = 0;
      let peopleDescription = '';
      
      if (affectedPeople > 0 && timePerPerson > 0) {
        // New format - realistic calculation using work constants
        const WORK_DAYS_PER_YEAR = 235;
        const WORK_HOURS_PER_DAY = 8;
        
        const timescale = hoursDetails.timescale;
        if (timescale === 'per_day') {
          totalHours = affectedPeople * timePerPerson * WORK_DAYS_PER_YEAR;
          peopleDescription = `${affectedPeople} personer × ${timePerPerson} timmar/dag`;
        } else if (timescale === 'per_week') {
          totalHours = affectedPeople * timePerPerson * 47; // 47 work weeks per year
          peopleDescription = `${affectedPeople} personer × ${timePerPerson} timmar/vecka`;
        } else if (timescale === 'per_month') {
          totalHours = affectedPeople * timePerPerson * 12;
          peopleDescription = `${affectedPeople} personer × ${timePerPerson} timmar/månad`;
        } else if (timescale === 'per_year') {
          totalHours = affectedPeople * timePerPerson;
          peopleDescription = `${affectedPeople} personer × ${timePerPerson} timmar/år`;
        } else {
          // One-time calculation
          totalHours = affectedPeople * timePerPerson;
          peopleDescription = `${affectedPeople} personer × ${timePerPerson} timmar (engångsbesparing)`;
        }
      } else {
        // Fallback to legacy format for backward compatibility
        totalHours = hoursDetails.hours || 0;
        const timescale = hoursDetails.timescale === 'per_month' ? '/månad' : hoursDetails.timescale === 'per_year' ? '/år' : '';
        peopleDescription = `${totalHours} timmar ${timescale}`;
      }
      
      value = totalHours * hourlyRate;
      description = `${peopleDescription} × ${formatCurrency(hourlyRate)}/timme = ${totalHours.toFixed(0)} timmar totalt`;
      
      if (annualizationYears && annualizationYears > 1) {
        value *= annualizationYears;
        description += ` under ${annualizationYears} år`;
      }
    } else if (valueUnit === 'currency' && details.currencyDetails) {
      const currDetails = details.currencyDetails;
      value = currDetails.amount || 0;
      const timescale = currDetails.timescale === 'per_month' ? '/månad' : currDetails.timescale === 'per_year' ? '/år' : currDetails.timescale === 'one_time' ? ' (engångsbelopp)' : '';
      description = `${formatCurrency(currDetails.amount || 0)} ${timescale}`;
      if (annualizationYears && currDetails.timescale !== 'one_time') {
        value *= (annualizationYears * (currDetails.timescale === 'per_month' ? 12 : 1));
        description += ` under ${annualizationYears} år`;
      }
    } else if (valueUnit === 'percentage' && details.percentageDetails) {
      const percDetails = details.percentageDetails;
      value = (percDetails.percentage || 0) * (percDetails.baseValue || 0) / 100;
      const timescale = percDetails.timescale === 'per_month' ? '/månad' : percDetails.timescale === 'per_year' ? '/år' : '';
      description = `${percDetails.percentage}% av ${formatCurrency(percDetails.baseValue || 0)} ${timescale}`;
      if (annualizationYears) {
        value *= (annualizationYears * (percDetails.timescale === 'per_month' ? 12 : 1));
        description += ` under ${annualizationYears} år`;
      }
    } else if (valueUnit === 'other' && otherDetails) {
      value = (otherDetails.amount || 0) * (otherDetails.valuePerUnit || 0);
      const unit = otherDetails.customUnit || 'enheter';
      const timescale = otherDetails.timescale === 'per_month' ? '/månad' : otherDetails.timescale === 'per_year' ? '/år' : '';
      description = `${otherDetails.amount || 0} ${unit} ${timescale} × ${formatCurrency(otherDetails.valuePerUnit || 0)}`;
      if (annualizationYears) {
        value *= (annualizationYears * (otherDetails.timescale === 'per_month' ? 12 : 1));
        description += ` under ${annualizationYears} år`;
      }
    }
    
    return { value, description, measurementName };
  };

  const parseRedistributionDetails = (details: any) => {
    if (!details || typeof details !== 'object') return null;
    
    const { valueUnit, resourceType, annualizationYears, hoursDetails, currencyDetails, countDetails, otherDetails } = details;
    
    let value = 0;
    let description = '';
    let savedAmount = 0;
    
    if (valueUnit === 'hours' && hoursDetails) {
      const affectedPeople = hoursDetails.affectedPeople || 0;
      const currentTimePerPerson = hoursDetails.currentTimePerPerson || 0;
      const newTimePerPerson = hoursDetails.newTimePerPerson || 0;
      const hourlyRate = hoursDetails.hourlyRate || 0;
      
      let currentTotalHours = 0;
      let newTotalHours = 0;
      let peopleDescription = '';
      
      if (affectedPeople > 0 && (currentTimePerPerson > 0 || newTimePerPerson > 0)) {
        // New format - realistic calculation using work constants
        const WORK_DAYS_PER_YEAR = 235;
        const WORK_HOURS_PER_DAY = 8;
        
        const timescale = hoursDetails.timescale;
        if (timescale === 'per_day') {
          currentTotalHours = affectedPeople * currentTimePerPerson * WORK_DAYS_PER_YEAR;
          newTotalHours = affectedPeople * newTimePerPerson * WORK_DAYS_PER_YEAR;
          peopleDescription = `${affectedPeople} personer: ${currentTimePerPerson} → ${newTimePerPerson} timmar/dag`;
        } else if (timescale === 'per_week') {
          currentTotalHours = affectedPeople * currentTimePerPerson * 47; // 47 work weeks per year
          newTotalHours = affectedPeople * newTimePerPerson * 47;
          peopleDescription = `${affectedPeople} personer: ${currentTimePerPerson} → ${newTimePerPerson} timmar/vecka`;
        } else if (timescale === 'per_month') {
          currentTotalHours = affectedPeople * currentTimePerPerson * 12;
          newTotalHours = affectedPeople * newTimePerPerson * 12;
          peopleDescription = `${affectedPeople} personer: ${currentTimePerPerson} → ${newTimePerPerson} timmar/månad`;
        } else if (timescale === 'per_year') {
          currentTotalHours = affectedPeople * currentTimePerPerson;
          newTotalHours = affectedPeople * newTimePerPerson;
          peopleDescription = `${affectedPeople} personer: ${currentTimePerPerson} → ${newTimePerPerson} timmar/år`;
        } else {
          // One-time calculation
          currentTotalHours = affectedPeople * currentTimePerPerson;
          newTotalHours = affectedPeople * newTimePerPerson;
          peopleDescription = `${affectedPeople} personer: ${currentTimePerPerson} → ${newTimePerPerson} timmar (engångsförändring)`;
        }
      } else {
        // Fallback to legacy format for backward compatibility
        currentTotalHours = hoursDetails.currentHours || 0;
        newTotalHours = hoursDetails.newHours || 0;
        const timescale = hoursDetails.timescale === 'per_month' ? '/månad' : hoursDetails.timescale === 'per_year' ? '/år' : '';
        peopleDescription = `${currentTotalHours} → ${newTotalHours} timmar ${timescale}`;
      }
      
      savedAmount = currentTotalHours - newTotalHours;
      value = Math.abs(savedAmount) * hourlyRate;
      
      description = `${peopleDescription} = ${Math.abs(savedAmount).toFixed(0)} ${savedAmount > 0 ? 'besparade' : 'extra'} timmar`;
      if (hourlyRate > 0) {
        description += ` × ${formatCurrency(hourlyRate)}/timme`;
      }
      
      if (annualizationYears && annualizationYears > 1) {
        value *= annualizationYears;
        description += ` under ${annualizationYears} år`;
      }
    } else if (valueUnit === 'currency' && currencyDetails) {
      const currentAmount = currencyDetails.currentAmount || 0;
      const newAmount = currencyDetails.newAmount || 0;
      savedAmount = currentAmount - newAmount;
      value = Math.abs(savedAmount);
      
      const timescale = currencyDetails.timescale === 'per_month' ? '/månad' : currencyDetails.timescale === 'per_year' ? '/år' : '';
      description = `${formatCurrency(Math.abs(savedAmount))} ${savedAmount > 0 ? 'besparade' : 'extra kostnad'} ${timescale}`;
      
      if (annualizationYears) {
        value *= (annualizationYears * (currencyDetails.timescale === 'per_month' ? 12 : 1));
        description += ` under ${annualizationYears} år`;
      }
    } else if (valueUnit === 'count' && countDetails) {
      const currentCount = countDetails.currentCount || 0;
      const newCount = countDetails.newCount || 0;
      savedAmount = currentCount - newCount;
      const valuePerUnit = countDetails.valuePerUnit || 0;
      value = Math.abs(savedAmount) * valuePerUnit;
      
      const timescale = countDetails.timescale === 'per_month' ? '/månad' : countDetails.timescale === 'per_year' ? '/år' : '';
      description = `${Math.abs(savedAmount)} ${savedAmount > 0 ? 'färre' : 'fler'} enheter ${timescale}`;
      if (valuePerUnit > 0) {
        description += ` × ${formatCurrency(valuePerUnit)}/enhet`;
      }
      
      if (annualizationYears) {
        value *= (annualizationYears * (countDetails.timescale === 'per_month' ? 12 : 1));
        description += ` under ${annualizationYears} år`;
      }
    } else if (valueUnit === 'other' && otherDetails) {
      const currentAmount = otherDetails.currentAmount || 0;
      const newAmount = otherDetails.newAmount || 0;
      savedAmount = currentAmount - newAmount;
      const valuePerUnit = otherDetails.valuePerUnit || 0;
      value = Math.abs(savedAmount) * valuePerUnit;
      const unit = otherDetails.customUnit || 'enheter';
      
      const timescale = otherDetails.timescale === 'per_month' ? '/månad' : otherDetails.timescale === 'per_year' ? '/år' : '';
      description = `${Math.abs(savedAmount)} ${savedAmount > 0 ? 'färre' : 'fler'} ${unit} ${timescale}`;
      if (valuePerUnit > 0) {
        description += ` × ${formatCurrency(valuePerUnit)}/${unit}`;
      }
      
      if (annualizationYears) {
        value *= (annualizationYears * (otherDetails.timescale === 'per_month' ? 12 : 1));
        description += ` under ${annualizationYears} år`;
      }
    }
    
    return { value, description, resourceType, savedAmount };
  };

  const renderEffectsData = (effectsData: any, projectCostData?: any) => {
    const effectEntries = effectsData?.effectDetails || [];
    if (effectEntries.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">Inga effekter registrerade</div>
          <div className="text-sm text-gray-500">Lägg till effektanalys för att se potentiella fördelar</div>
        </div>
      );
    }

    let totalQuantitativeValue = 0;
    let totalQualitativeEffects = 0;

    // Calculate totals and insights
    effectEntries.forEach((effect: any) => {
      if (effect.hasQuantitative && effect.quantitativeDetails) {
        const financialData = parseFinancialDetails(effect.quantitativeDetails.financialDetails);
        const redistributionData = parseRedistributionDetails(effect.quantitativeDetails.redistributionDetails);
        if (financialData) totalQuantitativeValue += financialData.value;
        if (redistributionData) totalQuantitativeValue += redistributionData.value;
      }
      if (effect.hasQualitative && effect.qualitativeDetails?.factor) {
        totalQualitativeEffects++;
      }
    });

    return (
      <div className="space-y-8">
        {/* Effects Summary */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Sammanfattning</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-3 text-[#FECB00] font-medium">Effekt</th>
                  <th className="text-left py-3 text-[#FECB00] font-medium">Typ</th>
                  <th className="text-left py-3 text-[#FECB00] font-medium">Beskrivning</th>
                  <th className="text-right py-3 text-[#FECB00] font-medium">Monetärt värde</th>
                </tr>
              </thead>
              <tbody>
                {effectEntries.map((effect: any, index: number) => {
                  const rows: any[] = [];
                  
                  if (effect.hasQuantitative && effect.quantitativeDetails) {
                    const financialData = parseFinancialDetails(effect.quantitativeDetails.financialDetails);
                    const redistributionData = parseRedistributionDetails(effect.quantitativeDetails.redistributionDetails);
                    
                    if (financialData) {
                      rows.push({
                        name: getEffectName(effect, index),
                        type: 'Kvantitativ (Finansiell)',
                        description: financialData.description,
                        value: financialData.value
                      });
                    }
                    
                    if (redistributionData) {
                      rows.push({
                        name: getEffectName(effect, index),
                        type: 'Kvantitativ (Omfördelning)',
                        description: redistributionData.description,
                        value: redistributionData.value
                      });
                    }
                  }
                  
                  // Kvalitativa effekter visas inte i monetära tabellen - endast i detaljerad analys
                  
                  return rows.map((row, rowIndex) => (
                    <tr key={`${index}-${rowIndex}`} className="border-b border-gray-700">
                      <td className="py-3 text-white">{row.name}</td>
                      <td className="py-3 text-gray-300">{row.type}</td>
                      <td className="py-3 text-gray-300">{row.description}</td>
                      <td className="py-3 text-right text-white font-medium">
                        {row.value !== null ? formatCurrency(row.value) : '—'}
                      </td>
                    </tr>
                  ));
                })}
                {totalQuantitativeValue > 0 && (
                  <tr className="border-t-2 border-[#FECB00] font-semibold">
                    <td className="py-3 text-[#FECB00]" colSpan={3}>Total kvantifierat monetärt värde</td>
                    <td className="py-3 text-right text-[#FECB00] font-bold">{formatCurrency(totalQuantitativeValue)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Insights */}
        {(totalQuantitativeValue > 0 || totalQualitativeEffects > 0) && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Nyckelinsikter</h3>
            <div className="space-y-3">
              {totalQuantitativeValue > 0 && (
                <div className="border-l-4 border-gray-600 pl-4">
                  <div className="text-white font-medium">Monetär nytta</div>
                  <div className="text-gray-300">
                    Projektet förväntas generera <span className="text-white font-semibold">{formatCurrency(totalQuantitativeValue)}</span> i 
                    kvantifierbara värden genom tidsbesparingar, kostnadsreduceringar och effektiviseringar.
                  </div>
                </div>
              )}
              
              {totalQualitativeEffects > 0 && (
                <div className="border-l-4 border-gray-600 pl-4">
                  <div className="text-white font-medium">Kvalitativa effekter</div>
                  <div className="text-gray-300">
                    <span className="text-white font-semibold">{totalQualitativeEffects}</span> kvalitativa effekter identifierade:
                    <div className="mt-2">
                      {effectEntries.filter((effect: any) => 
                        effect.hasQualitative && effect.qualitativeDetails?.factor
                      ).map((effect: any, idx: number) => {
                        const qual = effect.qualitativeDetails;
                        const improvement = qual.targetRating - qual.currentRating;
                        const improvementPercent = qual.currentRating > 0 ? ((improvement / qual.currentRating) * 100).toFixed(1) : '0';
                        
                        return (
                          <div key={idx} className="text-sm mt-1">
                            • <span className="text-white font-medium">{qual.factor}</span>: 
                            {improvement > 0 ? (
                              <span className="text-green-400"> +{improvementPercent}% förbättring</span>
                            ) : (
                              <span className="text-gray-400"> ingen förändring</span>
                            )} över {qual.annualizationYears} år
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {(() => {
                try {
                  const { calculateROI } = require('@/lib/roiCalculator');
                  const costEntries = projectCostData?.actualCostDetails?.costEntries || [];
                  let totalCost = 0;
                  costEntries.forEach((entry: any) => {
                    switch (entry?.costUnit) {
                      case 'hours':
                        totalCost += (Number(entry.hoursDetails?.hours) || 0) * (Number(entry.hoursDetails?.hourlyRate) || 0);
                        break;
                      case 'fixed':
                        totalCost += Number(entry.fixedDetails?.fixedAmount) || 0;
                        break;
                      case 'monthly':
                        totalCost += (Number(entry.monthlyDetails?.monthlyAmount) || 0) * (Number(entry.monthlyDetails?.monthlyDuration) || 1);
                        break;
                      case 'yearly':
                        totalCost += (Number(entry.yearlyDetails?.yearlyAmount) || 0) * (Number(entry.yearlyDetails?.yearlyDuration) || 1);
                        break;
                    }
                  });

                  // Check if project actually has measurable effects
                  const hasActualEffects = effectEntries.some((effect: any) => {
                    const hasQuantitative = (effect.hasQuantitative === true || effect.hasQuantitative === 'true') && 
                                            effect.quantitativeDetails && 
                                            (effect.quantitativeDetails.financialDetails || effect.quantitativeDetails.redistributionDetails);
                    
                    const hasQualitative = (effect.hasQualitative === true || effect.hasQualitative === 'true') && 
                                           effect.qualitativeDetails && 
                                           effect.qualitativeDetails.factor;
                    
                    return hasQuantitative || hasQualitative;
                  });

                  if (totalCost > 0 && effectEntries.length > 0 && hasActualEffects) {
                    const roiMetrics = calculateROI({ effectEntries, totalProjectInvestment: totalCost });
                    
                    return (
                      <div className="border-l-4 border-gray-600 pl-4">
                        <div className="text-white font-medium">Investeringsanalys</div>
                        <div className="text-gray-300">
                          Investeringen på <span className="text-white font-semibold">{formatCurrency(totalCost)}</span> förväntas 
                          betala tillbaka sig på <span className="text-white font-semibold">{roiMetrics.paybackPeriod.toFixed(1)} år</span> med 
                          en total ROI på <span className={`font-semibold ${roiMetrics.combinedROI > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {roiMetrics.combinedROI.toFixed(1)}%
                          </span>.
                        </div>
                      </div>
                    );
                  }
                } catch (error) {
                  return null;
                }
                return null;
              })()}
            </div>
          </div>
        )}

        {/* Detailed Effects */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Detaljerad analys</h3>
          <div className="space-y-6">
            {effectEntries.map((effect: any, index: number) => (
              <div key={index} className="border-l-4 border-[#FECB00] pl-6">
                <h4 className="text-white font-semibold mb-3">{getEffectName(effect, index)}</h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {effect.hasQuantitative && effect.quantitativeDetails && (
                    <div>
                      <h5 className="text-[#FECB00] font-medium mb-3">Kvantifierbara effekter</h5>
                      <div className="space-y-3 text-sm">
                        {effect.quantitativeDetails.effectType && (
                          <div>
                            <span className="text-gray-400">Typ av effekt: </span>
                            <span className="text-white">
                              {effect.quantitativeDetails.effectType === 'financial' ? 'Finansiell effekt' : 'Omfördelad resurs'}
                            </span>
                          </div>
                        )}
                        
                        {effect.quantitativeDetails.financialDetails && (
                          <div className="pt-2 border-t border-gray-600">
                            <div className="text-white font-medium mb-1">Finansiella effekter</div>
                            <div className="space-y-2">
                              {effect.quantitativeDetails.financialDetails.measurementName && (
                                <div>
                                  <span className="text-gray-400">Vad mäts: </span>
                                  <span className="text-white">{effect.quantitativeDetails.financialDetails.measurementName}</span>
                                </div>
                              )}
                              {effect.quantitativeDetails.financialDetails.valueUnit && (
                                <div>
                                  <span className="text-gray-400">Enhet: </span>
                                  <span className="text-white">{effect.quantitativeDetails.financialDetails.valueUnit}</span>
                                </div>
                              )}
                              {(() => {
                                const data = parseFinancialDetails(effect.quantitativeDetails.financialDetails);
                                return data ? (
                                  <div>
                                    <div className="text-gray-300">{data.description}</div>
                                    <div className="text-white font-semibold">Värde: {formatCurrency(data.value)}</div>
                                  </div>
                                ) : <div className="text-gray-400">Ingen finansiell data tillgänglig</div>;
                              })()}
                            </div>
                          </div>
                        )}
                        
                        {effect.quantitativeDetails.redistributionDetails && (
                          <div className="pt-2 border-t border-gray-600">
                            <div className="text-white font-medium mb-1">Omfördelningseffekter</div>
                            <div className="space-y-2">
                              {effect.quantitativeDetails.redistributionDetails.resourceType && (
                                <div>
                                  <span className="text-gray-400">Resurstyp: </span>
                                  <span className="text-white">{effect.quantitativeDetails.redistributionDetails.resourceType}</span>
                                </div>
                              )}
                              {effect.quantitativeDetails.redistributionDetails.valueUnit && (
                                <div>
                                  <span className="text-gray-400">Enhet: </span>
                                  <span className="text-white">{effect.quantitativeDetails.redistributionDetails.valueUnit}</span>
                                </div>
                              )}
                              {(() => {
                                const data = parseRedistributionDetails(effect.quantitativeDetails.redistributionDetails);
                                return data ? (
                                  <div>
                                    <div className="text-gray-300">{data.description}</div>
                                    <div className="text-white font-semibold">Värde: {formatCurrency(data.value)}</div>
                                  </div>
                                ) : <div className="text-gray-400">Ingen omfördelningsdata tillgänglig</div>;
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {effect.hasQualitative && effect.qualitativeDetails && (
                    <div>
                      <h5 className="text-[#FECB00] font-medium mb-3">Kvalitativa effekter</h5>
                      <div className="space-y-3 text-sm">
                        {effect.qualitativeDetails.factor && (
                          <div>
                            <span className="text-gray-400">Faktor som mäts: </span>
                            <span className="text-white">{effect.qualitativeDetails.factor}</span>
                          </div>
                        )}
                        {effect.qualitativeDetails.currentRating && effect.qualitativeDetails.targetRating && (
                          <div>
                            <span className="text-gray-400">Förbättring: </span>
                            <span className="text-white">
                              från {effect.qualitativeDetails.currentRating} till {effect.qualitativeDetails.targetRating}
                              {(() => {
                                const improvement = effect.qualitativeDetails.targetRating - effect.qualitativeDetails.currentRating;
                                const improvementPercent = effect.qualitativeDetails.currentRating > 0 
                                  ? ((improvement / effect.qualitativeDetails.currentRating) * 100).toFixed(1) 
                                  : '0';
                                return improvement > 0 
                                  ? <span className="text-green-400 ml-1">(+{improvementPercent}%)</span>
                                  : <span className="text-gray-400 ml-1">(ingen förbättring)</span>;
                              })()}
                            </span>
                          </div>
                        )}
                        {effect.qualitativeDetails.annualizationYears && (
                          <div>
                            <span className="text-gray-400">Tidsperiod: </span>
                            <span className="text-white">{effect.qualitativeDetails.annualizationYears} år</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCostData = (costData: any) => {
    if (!costData || Object.keys(costData).length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">Ingen kostnadsdata registrerad</div>
          <div className="text-sm text-gray-500">Lägg till kostnadsanalys för att visa budgetinformation</div>
        </div>
      );
    }

    const costEntries = costData.actualCostDetails?.costEntries || [];
    let totalActualCost = 0;

    // Calculate total actual costs
    costEntries.forEach((entry: any) => {
      let entryTotal = 0;
      switch (entry?.costUnit) {
        case 'hours':
          entryTotal = (Number(entry.hoursDetails?.hours) || 0) * (Number(entry.hoursDetails?.hourlyRate) || 0);
          break;
        case 'fixed':
          entryTotal = Number(entry.fixedDetails?.fixedAmount) || 0;
          break;
        case 'monthly':
          entryTotal = (Number(entry.monthlyDetails?.monthlyAmount) || 0) * (Number(entry.monthlyDetails?.monthlyDuration) || 1);
          break;
        case 'yearly':
          entryTotal = (Number(entry.yearlyDetails?.yearlyAmount) || 0) * (Number(entry.yearlyDetails?.yearlyDuration) || 1);
          break;
      }
      totalActualCost += entryTotal;
    });

    const budgetAmount = Number(costData.budgetDetails?.budgetAmount) || 0;
    const budgetUsagePercent = budgetAmount > 0 ? (totalActualCost / budgetAmount) * 100 : 0;

    return (
      <div className="space-y-8">
        {/* Cost Summary */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Sammanfattning</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-600 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-[#FECB00] mb-1">
                {budgetAmount > 0 ? formatCurrency(budgetAmount) : '—'}
              </div>
              <div className="text-gray-400 text-sm">Planerad budget</div>
              <div className="text-xs text-gray-500 mt-1">
                {costData.hasDedicatedBudget ? 'Dedikerad budget' : 'Ingen dedikerad budget'}
              </div>
            </div>
            
            <div className="border border-gray-600 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-[#FECB00] mb-1">
                {totalActualCost > 0 ? formatCurrency(totalActualCost) : '—'}
              </div>
              <div className="text-gray-400 text-sm">Faktisk kostnad</div>
              <div className="text-xs text-gray-500 mt-1">
                {costEntries.length} kostnadsposter
              </div>
            </div>
            
            <div className="border border-gray-600 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold mb-1">
                {budgetAmount > 0 && totalActualCost > 0 ? (
                  <span className={budgetUsagePercent <= 100 ? 'text-green-400' : 'text-red-400'}>
                    {budgetUsagePercent.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>
              <div className="text-gray-400 text-sm">Budgetanvändning</div>
              <div className="text-xs text-gray-500 mt-1">
                {budgetAmount > 0 && totalActualCost > 0 
                  ? (budgetUsagePercent <= 100 ? 'Inom budget' : 'Över budget')
                  : 'Ej beräknad'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Cost Analysis Insights */}
        {(totalActualCost > 0 || budgetAmount > 0) && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Kostnadsinsikter</h3>
            <div className="space-y-3">
              {budgetAmount > 0 && totalActualCost > 0 && (
                <div className="border-l-4 border-gray-600 pl-4">
                  <div className="text-white font-medium">Budgetanalys</div>
                  <div className="text-gray-300">
                    {budgetUsagePercent <= 100 ? (
                      <>Projektet håller sig inom budget med <span className="text-white font-semibold">{(100 - budgetUsagePercent).toFixed(1)}%</span> marginal kvar.</>
                    ) : (
                      <>Projektet överskrider budget med <span className="text-white font-semibold">{formatCurrency(totalActualCost - budgetAmount)}</span> ({(budgetUsagePercent - 100).toFixed(1)}% över).</>
                    )}
                    {costEntries.length > 0 && (() => {
                      // Check if there are any "annat" entries with custom descriptions
                      const annatEntries = costEntries.filter((entry: any) => 
                        entry?.costType === 'Annat' || entry?.costType === 'annat'
                      );
                      
                      if (annatEntries.length > 0) {
                        // Try costComment first, then costLabel for custom description
                        const customDescription = annatEntries[0]?.costComment || annatEntries[0]?.costLabel;
                        if (customDescription && customDescription.trim() !== '') {
                          return (
                            <span> Budgeten täcker kostnader för {customDescription.toLowerCase()}.</span>
                          );
                        }
                      }

                      // Extract cost categories and types
                      const costCategories = costEntries
                        .map((entry: any) => {
                          if (entry?.costType) return entry.costType;
                          if (entry?.costLabel) return entry.costLabel;
                          switch (entry?.costUnit) {
                            case 'hours': return 'Personalkostnader';
                            case 'fixed': return 'Fasta kostnader';
                            case 'monthly': return 'Månadsavgifter';
                            case 'yearly': return 'Årliga avgifter';
                            default: return 'Övriga kostnader';
                          }
                        })
                        .filter((category: string, index: number, array: string[]) => array.indexOf(category) === index) // Remove duplicates
                        .slice(0, 4); // Limit to 4 categories for readability

                      if (costCategories.length === 0) return null;

                      const categoryText = costCategories.length === 1 
                        ? costCategories[0].toLowerCase()
                        : costCategories.length === 2
                          ? `${costCategories.slice(0, -1).join(', ').toLowerCase()} och ${costCategories.slice(-1)[0].toLowerCase()}`
                          : `${costCategories.slice(0, -1).join(', ').toLowerCase()} och ${costCategories.slice(-1)[0].toLowerCase()}`;

                      return (
                        <span> Budgeten täcker kostnader för {categoryText}{costEntries.length > 4 && ` med ${costEntries.length - 4} ytterligare poster`}.</span>
                      );
                    })()}
                  </div>
                </div>
              )}
              
              {costEntries.length > 0 && (
                <div className="border-l-4 border-gray-600 pl-4">
                  <div className="text-white font-medium">Kostnadsstruktur</div>
                  <div className="text-gray-300">
                    Kostnaden består av <span className="text-white font-semibold">{costEntries.length}</span> olika poster 
                    med en genomsnittlig kostnad på <span className="text-white font-semibold">{formatCurrency(totalActualCost / costEntries.length)}</span> per post.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detailed Cost Breakdown */}
        {costEntries.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Detaljerad kostnadsfördelning</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-3 text-[#FECB00] font-medium">Typ</th>
                    <th className="text-left py-3 text-[#FECB00] font-medium">Beskrivning</th>
                    <th className="text-right py-3 text-[#FECB00] font-medium">Belopp</th>
                    <th className="text-right py-3 text-[#FECB00] font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {costEntries.map((entry: any, index: number) => {
                    let description = '';
                    let amount = '';
                    let total = 0;

                    switch (entry?.costUnit) {
                      case 'hours':
                        const hours = Number(entry.hoursDetails?.hours) || 0;
                        const rate = Number(entry.hoursDetails?.hourlyRate) || 0;
                        total = hours * rate;
                        description = entry.costLabel || `${hours} timmar`;
                        amount = `${formatCurrency(rate)}/tim`;
                        break;
                      case 'fixed':
                        total = Number(entry.fixedDetails?.fixedAmount) || 0;
                        description = entry.costLabel || 'Fast kostnad';
                        amount = formatCurrency(total);
                        break;
                      case 'monthly':
                        const monthlyAmount = Number(entry.monthlyDetails?.monthlyAmount) || 0;
                        const monthlyDuration = Number(entry.monthlyDetails?.monthlyDuration) || 1;
                        total = monthlyAmount * monthlyDuration;
                        description = entry.costLabel || `${monthlyDuration} månader`;
                        amount = `${formatCurrency(monthlyAmount)}/mån`;
                        break;
                      case 'yearly':
                        const yearlyAmount = Number(entry.yearlyDetails?.yearlyAmount) || 0;
                        const yearlyDuration = Number(entry.yearlyDetails?.yearlyDuration) || 1;
                        total = yearlyAmount * yearlyDuration;
                        description = entry.costLabel || `${yearlyDuration} år`;
                        amount = `${formatCurrency(yearlyAmount)}/år`;
                        break;
                    }

                    return (
                      <tr key={index} className="border-b border-gray-700">
                        <td className="py-3 text-white font-medium capitalize">
                          {entry.costUnit === 'hours' ? 'Timmar' :
                           entry.costUnit === 'fixed' ? 'Fast' :
                           entry.costUnit === 'monthly' ? 'Månadsvis' :
                           entry.costUnit === 'yearly' ? 'Årsvis' : entry.costUnit}
                        </td>
                        <td className="py-3 text-gray-300">{description}</td>
                        <td className="py-3 text-right text-gray-300">{amount}</td>
                        <td className="py-3 text-right text-white font-semibold">
                          {formatCurrency(total)}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-[#FECB00] font-bold">
                    <td className="py-3 text-[#FECB00]" colSpan={3}>Total kostnad</td>
                    <td className="py-3 text-right text-[#FECB00] font-bold text-lg">
                      {formatCurrency(totalActualCost)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLeadershipData = (leadershipData: any) => {
    if (!leadershipData || Object.keys(leadershipData).length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">Ingen ledarskapsdata registrerad</div>
          <div className="text-sm text-gray-500">Lägg till information om organisation och styrning för att visa ledarskapsinsikter</div>
        </div>
      );
    }

    // Calculate leadership and organizational metrics
    const calculateLeadershipMetrics = () => {
      let changeReadiness = 0;
      let stakeholderEngagement = 0;
      let strategicAlignment = 0;
      let organizationalMaturity = 0;

      // Ensure organizationalChange is always an array
      const organizationalChangeArray = Array.isArray(leadershipData.organizationalChange) 
        ? leadershipData.organizationalChange 
        : leadershipData.organizationalChange 
          ? [leadershipData.organizationalChange] 
          : [];

      // Ensure sdgAlignment is always an array
      const sdgAlignmentArray = Array.isArray(leadershipData.sdgAlignment) 
        ? leadershipData.sdgAlignment 
        : leadershipData.sdgAlignment 
          ? [leadershipData.sdgAlignment] 
          : [];

      // Change Readiness scoring
      if (leadershipData.staffInvolvement === 'early') changeReadiness += 40;
      else if (leadershipData.staffInvolvement === 'later') changeReadiness += 25;
      else if (leadershipData.staffInvolvement === 'no') changeReadiness += 0;
      
      if (leadershipData.changeManagementEfforts) changeReadiness += 30;
      if (organizationalChangeArray.length > 0) changeReadiness += 20;
      if (leadershipData.lessonsLearned) changeReadiness += 10;

      // Stakeholder Engagement scoring
      if (leadershipData.projectOwnership === 'joint') stakeholderEngagement += 40;
      else if (leadershipData.projectOwnership === 'operations') stakeholderEngagement += 35;
      else if (leadershipData.projectOwnership === 'it') stakeholderEngagement += 25;
      
      if (leadershipData.staffInvolvement === 'early') stakeholderEngagement += 30;
      else if (leadershipData.staffInvolvement === 'later') stakeholderEngagement += 15;
      
      if (leadershipData.changeManagementEfforts) stakeholderEngagement += 20;
      if (organizationalChangeArray.includes('Nytt tvärfunktionellt samarbete')) stakeholderEngagement += 10;

      // Strategic Alignment scoring  
      if (sdgAlignmentArray.length > 0 && !sdgAlignmentArray.includes('Vet ej')) strategicAlignment += 40;
      if (leadershipData.sdgDescription) strategicAlignment += 20;
      if (leadershipData.nextSteps) strategicAlignment += 30;
      if (leadershipData.lessonsLearned) strategicAlignment += 10;

      // Organizational Maturity scoring
      if (leadershipData.projectOwnership) organizationalMaturity += 20;
      if (organizationalChangeArray.length > 0 && !organizationalChangeArray.includes('Inga större förändringar')) organizationalMaturity += 25;
      if (leadershipData.changeManagementEfforts) organizationalMaturity += 25;
      if (leadershipData.nextSteps) organizationalMaturity += 15;
      if (leadershipData.lessonsLearned) organizationalMaturity += 15;

      return {
        changeReadiness: Math.min(100, changeReadiness),
        stakeholderEngagement: Math.min(100, stakeholderEngagement),
        strategicAlignment: Math.min(100, strategicAlignment),
        organizationalMaturity: Math.min(100, organizationalMaturity)
      };
    };

    const getOwnershipInsight = (ownership: string) => {
      switch(ownership) {
        case 'it': return {
          label: 'IT-ledd implementation',
          insight: 'Teknisk fokus med risk för begränsad användaracceptans',
          strength: 'Teknisk expertis',
          challenge: 'Verksamhetsförankring',
          risk: 'Medel'
        };
        case 'operations': return {
          label: 'Verksamhetsledd förändring', 
          insight: 'Stark användarförankring men potentiella tekniska utmaningar',
          strength: 'Användaracceptans',
          challenge: 'Teknisk implementation',
          risk: 'Låg'
        };
        case 'joint': return {
          label: 'Gemensam styrning',
          insight: 'Optimal balans mellan teknisk expertis och verksamhetsbehov',
          strength: 'Helhetsperspektiv',
          challenge: 'Koordination',
          risk: 'Låg'
        };
        case 'other': return {
          label: 'Alternativ styrning',
          insight: 'Unik organisationsmodell som kan kräva särskild uppmärksamhet',
          strength: 'Flexibilitet',
          challenge: 'Tydlighet',
          risk: 'Medel'
        };
        default: return {
          label: 'Okänt ägarskap',
          insight: 'Styrningsmodell behöver förtydligas',
          strength: 'Okänt',
          challenge: 'Tydlighet',
          risk: 'Hög'
        };
      }
    };

    const getChangeComplexity = () => {
      const changes = Array.isArray(leadershipData.organizationalChange) 
        ? leadershipData.organizationalChange 
        : leadershipData.organizationalChange 
          ? [leadershipData.organizationalChange] 
          : [];
      if (changes.includes('Inga större förändringar')) return { level: 'Minimal', color: 'text-green-400' };
      if (changes.length >= 3) return { level: 'Hög komplexitet', color: 'text-orange-400' };
      if (changes.length >= 2) return { level: 'Medel komplexitet', color: 'text-yellow-400' };
      if (changes.length >= 1) return { level: 'Låg komplexitet', color: 'text-green-400' };
      return { level: 'Okänd', color: 'text-gray-400' };
    };

         const getSDGImpact = () => {
       const sdgAlignment = Array.isArray(leadershipData.sdgAlignment) 
         ? leadershipData.sdgAlignment 
         : leadershipData.sdgAlignment 
           ? [leadershipData.sdgAlignment] 
           : [];
       const sdgCount = sdgAlignment.filter((goal: string) => goal !== 'Vet ej').length || 0;
      if (sdgCount >= 4) return { level: 'Bred påverkan', color: 'text-green-400', score: 90 };
      if (sdgCount >= 2) return { level: 'Måttlig påverkan', color: 'text-yellow-400', score: 70 };
      if (sdgCount >= 1) return { level: 'Begränsad påverkan', color: 'text-orange-400', score: 50 };
      return { level: 'Ingen koppling', color: 'text-gray-400', score: 0 };
    };

    const metrics = calculateLeadershipMetrics();

    return (
      <div className="space-y-8">
        {/* Leadership Summary Cards */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Ledarskap & Organisationsanalys</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="border border-gray-600 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-[#FECB00] mb-1">
                {metrics.changeReadiness}%
              </div>
              <div className="text-gray-400 text-sm">Förändringsberedskap</div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.changeReadiness >= 80 ? 'Excellent' :
                 metrics.changeReadiness >= 60 ? 'God beredskap' :
                 metrics.changeReadiness >= 40 ? 'Grundläggande' : 'Utvecklingsområde'}
              </div>
            </div>
            
            <div className="border border-gray-600 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-[#FECB00] mb-1">
                {metrics.stakeholderEngagement}%
              </div>
              <div className="text-gray-400 text-sm">Intressent&shy;engagemang</div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.stakeholderEngagement >= 80 ? 'Högt engagemang' :
                 metrics.stakeholderEngagement >= 60 ? 'God involvering' :
                 metrics.stakeholderEngagement >= 40 ? 'Måttlig' : 'Begränsat'}
              </div>
            </div>
            
            <div className="border border-gray-600 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-[#FECB00] mb-1">
                {metrics.strategicAlignment}%
              </div>
              <div className="text-gray-400 text-sm">Strategisk koppling</div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.strategicAlignment >= 80 ? 'Stark koppling' :
                 metrics.strategicAlignment >= 60 ? 'God koppling' :
                 metrics.strategicAlignment >= 40 ? 'Viss koppling' : 'Svag koppling'}
              </div>
            </div>
            
            <div className="border border-gray-600 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold mb-1">
                <span className={getSDGImpact().color}>
                  {(() => {
                    const sdgAlignment = Array.isArray(leadershipData.sdgAlignment) 
                      ? leadershipData.sdgAlignment 
                      : leadershipData.sdgAlignment 
                        ? [leadershipData.sdgAlignment] 
                        : [];
                    return sdgAlignment.filter((goal: string) => goal !== 'Vet ej').length || 0;
                  })()}
                </span>
              </div>
              <div className="text-gray-400 text-sm">SDG-mål</div>
              <div className="text-xs text-gray-500 mt-1">
                {getSDGImpact().level}
              </div>
            </div>
          </div>
        </div>

        {/* Key Leadership Insights */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Styrningsinsikter</h3>
          <div className="space-y-3">
            {leadershipData.projectOwnership && (
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="text-white font-medium">Ägarskapsanalys</div>
                <div className="text-gray-300">
                  <span className="font-semibold">{getOwnershipInsight(leadershipData.projectOwnership).label}</span> - {getOwnershipInsight(leadershipData.projectOwnership).insight}.
                  Styrka: <span className="text-white">{getOwnershipInsight(leadershipData.projectOwnership).strength}</span>, 
                  Utmaning: <span className="text-white">{getOwnershipInsight(leadershipData.projectOwnership).challenge}</span>.
                </div>
              </div>
            )}

            {(() => {
              const organizationalChangeArray = Array.isArray(leadershipData.organizationalChange) 
                ? leadershipData.organizationalChange 
                : leadershipData.organizationalChange 
                  ? [leadershipData.organizationalChange] 
                  : [];
              return organizationalChangeArray.length > 0 && (
                <div className="border-l-4 border-gray-600 pl-4">
                  <div className="text-white font-medium">Förändringsanalys</div>
                  <div className="text-gray-300">
                    Projektet medför <span className={`font-semibold ${getChangeComplexity().color}`}>{getChangeComplexity().level.toLowerCase()}</span>{' '}
                    med <span className="text-white font-semibold">{organizationalChangeArray.length}</span> identifierade förändringsområden.
                    {leadershipData.changeManagementEfforts ? 
                      ' Förändringsledning är aktivt adresserat.' : 
                      ' Förändringsledning kan behöva stärkas.'}
                  </div>
                </div>
              );
            })()}

            {leadershipData.staffInvolvement && (
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="text-white font-medium">Medarbetarengagemangsanalys</div>
                <div className="text-gray-300">
                  {leadershipData.staffInvolvement === 'early' ? (
                    <>Optimal strategi med <span className="text-green-400 font-semibold">tidig medarbetarinvolvering</span>{' '}
                    som minskar motstånd och ökar användaracceptans.</>
                  ) : leadershipData.staffInvolvement === 'later' ? (
                    <>Försenad involvering kan ha <span className="text-yellow-400 font-semibold">begränsat användaracceptans</span>.{' '}
                    Kompensatoriska åtgärder kan behövas.</>
                  ) : (
                    <>Begränsad medarbetarinvolvering utgör en <span className="text-red-400 font-semibold">betydande risk</span>{' '}
                    för projektframgång och användaracceptans.</>
                  )}
                </div>
              </div>
            )}

            {leadershipData.sdgAlignment?.length > 0 && !leadershipData.sdgAlignment.includes('Vet ej') && (
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="text-white font-medium">Hållbarhetsanalys</div>
                <div className="text-gray-300">
                  Projektet stödjer <span className="text-white font-semibold">{leadershipData.sdgAlignment.filter((goal: string) => goal !== 'Vet ej').length}</span> av 
                  Agenda 2030:s mål, vilket visar på <span className={`font-semibold ${getSDGImpact().color}`}>{getSDGImpact().level.toLowerCase()}</span>{' '}
                  på samhällsutvecklingen och strategisk medvetenhet.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Leadership Information */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Detaljerad organisationsinformation</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-3 text-[#FECB00] font-medium">Aspekt</th>
                  <th className="text-left py-3 text-[#FECB00] font-medium">Status</th>
                  <th className="text-left py-3 text-[#FECB00] font-medium">Analys</th>
                </tr>
              </thead>
              <tbody>
                {leadershipData.projectOwnership && (
                  <tr className="border-b border-gray-700">
                    <td className="py-3 text-white font-medium">Projektägarskap</td>
                    <td className="py-3 text-gray-300">{getOwnershipInsight(leadershipData.projectOwnership).label}</td>
                    <td className="py-3 text-gray-300">{getOwnershipInsight(leadershipData.projectOwnership).risk} risk</td>
                  </tr>
                )}
                {leadershipData.organizationalChange?.length > 0 && (
                  <tr className="border-b border-gray-700">
                    <td className="py-3 text-white font-medium">Organisationsförändringar</td>
                    <td className="py-3 text-gray-300">{leadershipData.organizationalChange.length} områden</td>
                    <td className={`py-3 ${getChangeComplexity().color}`}>{getChangeComplexity().level}</td>
                  </tr>
                )}
                {leadershipData.staffInvolvement && (
                  <tr className="border-b border-gray-700">
                    <td className="py-3 text-white font-medium">Medarbetarinvolvering</td>
                    <td className="py-3 text-gray-300">
                      {leadershipData.staffInvolvement === 'early' ? 'Från start' :
                       leadershipData.staffInvolvement === 'later' ? 'Senare fas' : 'Ingen involvering'}
                    </td>
                    <td className={`py-3 ${
                      leadershipData.staffInvolvement === 'early' ? 'text-green-400' :
                      leadershipData.staffInvolvement === 'later' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {leadershipData.staffInvolvement === 'early' ? 'Optimal' :
                       leadershipData.staffInvolvement === 'later' ? 'Acceptabel' : 'Riskfylld'}
                    </td>
                  </tr>
                )}
                {leadershipData.changeManagementEfforts && (
                  <tr className="border-b border-gray-700">
                    <td className="py-3 text-white font-medium">Förändringsledning</td>
                    <td className="py-3 text-gray-300">Aktivt arbete</td>
                    <td className="py-3 text-green-400">Dokumenterat</td>
                  </tr>
                )}
                {leadershipData.sdgAlignment?.length > 0 && (
                  <tr className="border-b border-gray-700">
                    <td className="py-3 text-white font-medium">SDG-koppling</td>
                    <td className="py-3 text-gray-300">{leadershipData.sdgAlignment.filter((goal: string) => goal !== 'Vet ej').length} mål</td>
                    <td className={`py-3 ${getSDGImpact().color}`}>{getSDGImpact().level}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Strategic Direction & Sustainability */}
        {(leadershipData.sdgAlignment?.length > 0 || leadershipData.nextSteps || leadershipData.lessonsLearned) && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Strategisk riktning & Hållbarhet</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* SDG Goals and Description */}
              {leadershipData.sdgAlignment?.length > 0 && !leadershipData.sdgAlignment.includes('Vet ej') && (
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="text-blue-400 font-medium mb-2">Agenda 2030-koppling</h4>
                  <div className="text-gray-300 text-sm mb-2">
                    {leadershipData.sdgAlignment.filter((goal: string) => goal !== 'Vet ej').join(', ')}
                  </div>
                  {leadershipData.sdgDescription && (
                    <div className="text-gray-400 text-xs">{leadershipData.sdgDescription}</div>
                  )}
                </div>
              )}

              {/* Next Steps */}
              {leadershipData.nextSteps && (
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="text-green-400 font-medium mb-2">Nästa steg & Utveckling</h4>
                  <div className="text-gray-300 text-sm">{leadershipData.nextSteps}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Change Management & Lessons */}
        {(leadershipData.changeManagementEfforts || leadershipData.lessonsLearned) && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Förändringsledning & Lärdomar</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Change Management */}
              {leadershipData.changeManagementEfforts && (
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="text-purple-400 font-medium mb-2">Förändringsledningsinsatser</h4>
                  <div className="text-gray-300 text-sm">{leadershipData.changeManagementEfforts}</div>
                </div>
              )}

              {/* Lessons Learned */}
              {leadershipData.lessonsLearned && (
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="text-orange-400 font-medium mb-2">Lärdomar & Utmaningar</h4>
                  <div className="text-gray-300 text-sm">{leadershipData.lessonsLearned}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Organizational Changes Detail */}
        {leadershipData.organizationalChange?.length > 0 && !leadershipData.organizationalChange.includes('Inga större förändringar') && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Organisationsförändringar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leadershipData.organizationalChange.map((change: string, index: number) => (
                <div key={index} className="border border-gray-600 p-4 rounded-lg">
                  <div className="text-white font-medium text-sm mb-1">{change}</div>
                  <div className="text-gray-400 text-xs">
                    {change.includes('roller') ? 'Påverkar ansvarsfördelning' :
                     change.includes('rutiner') ? 'Förändrar arbetssätt' :
                     change.includes('organisation') ? 'Strukturell förändring' :
                     change.includes('samarbete') ? 'Förbättrar koordination' :
                     'Organisatorisk utveckling'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLegalData = (legalData: any) => {
    if (!legalData || Object.keys(legalData).length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">Ingen juridisk data registrerad</div>
          <div className="text-sm text-gray-500">Lägg till juridisk och etisk information för att visa compliance-analys</div>
        </div>
      );
    }

    // Calculate legal compliance and risk metrics
    const calculateLegalMetrics = () => {
      let gdprCompliance = 0;
      let aiRegulationCompliance = 0;
      let procurementMaturity = 0;
      let securityLevel = 0;

      // GDPR Compliance scoring
      if (legalData.processes_personal_data === 'Nej') gdprCompliance = 100;
      else if (legalData.processes_personal_data === 'Ja') {
        if (legalData.legal_basis) gdprCompliance += 25;
        if (legalData.dpia_done === 'Ja') gdprCompliance += 25;
        if (legalData.data_controller) gdprCompliance += 20;
        if (legalData.processor_agreement === 'Ja' || legalData.processor_agreement === 'Ej relevant') gdprCompliance += 15;
        if (legalData.data_categories?.length > 0) gdprCompliance += 15;
      } else {
        gdprCompliance = 30; // 'Vet ej' - needs attention
      }

      // AI Regulation Compliance scoring
      if (legalData.high_risk_ai === 'Nej') aiRegulationCompliance = 90;
      else if (legalData.high_risk_ai === 'Ja') {
        if (legalData.ce_marked === 'Ja') aiRegulationCompliance += 40;
        if (legalData.fundamental_rights_assessment === 'Ja') aiRegulationCompliance += 40;
        if (legalData.ce_marked === 'Ej tillämpligt') aiRegulationCompliance += 20;
      } else {
        aiRegulationCompliance = 40; // 'Vet ej' - needs risk assessment
      }

      // Procurement Maturity scoring
      if (legalData.procurement_type?.length > 0 && !legalData.procurement_type.includes('Ej upphandlad ännu')) {
        procurementMaturity += 40;
        if (legalData.supplier_contract_clauses) procurementMaturity += 30;
        if (legalData.reusable_contract === 'Ja') procurementMaturity += 20;
        if (legalData.procurement_type.includes('Gemensam upphandling')) procurementMaturity += 10;
      }

      // Security Level scoring
      if (legalData.security_measures) securityLevel += 30;
      if (legalData.data_access_rights) securityLevel += 25;
      if (legalData.is_open_source === 'Ja') securityLevel += 10;
      if (legalData.is_open_source === 'Nej') securityLevel += 10; // Both open/closed can be secure

      return {
        gdprCompliance: Math.min(100, gdprCompliance),
        aiRegulationCompliance: Math.min(100, aiRegulationCompliance),
        procurementMaturity: Math.min(100, procurementMaturity),
        securityLevel: Math.min(100, securityLevel)
      };
    };

    const getGDPRRiskLevel = () => {
      if (legalData.processes_personal_data === 'Nej') return { level: 'Ingen risk', color: 'text-green-400', score: 0 };
      if (legalData.processes_personal_data === 'Vet ej') return { level: 'Okänd risk', color: 'text-gray-400', score: 50 };
      
      const sensitiveData = legalData.data_categories?.some((cat: string) => 
        ['Hälsouppgifter', 'Etnicitet eller religion', 'Personnummer'].includes(cat)
      );
      
      if (sensitiveData && legalData.dpia_done !== 'Ja') return { level: 'Hög risk', color: 'text-red-400', score: 80 };
      if (sensitiveData && legalData.dpia_done === 'Ja') return { level: 'Medel risk', color: 'text-yellow-400', score: 40 };
      if (!sensitiveData && legalData.legal_basis) return { level: 'Låg risk', color: 'text-green-400', score: 20 };
      
      return { level: 'Medel risk', color: 'text-yellow-400', score: 50 };
    };

    const getAIRiskLevel = () => {
      if (legalData.high_risk_ai === 'Nej') return { level: 'Låg AI-risk', color: 'text-green-400' };
      if (legalData.high_risk_ai === 'Ja' && legalData.ce_marked === 'Ja') return { level: 'Kontrollerad risk', color: 'text-yellow-400' };
      if (legalData.high_risk_ai === 'Ja' && legalData.ce_marked !== 'Ja') return { level: 'Hög AI-risk', color: 'text-red-400' };
      return { level: 'Okänd AI-risk', color: 'text-gray-400' };
    };

    const getProcurementInsight = () => {
      if (legalData.procurement_type?.includes('Ej upphandlad ännu')) return { status: 'Pågående', insight: 'Upphandling inte slutförd', color: 'text-yellow-400' };
      if (legalData.procurement_type?.includes('Gemensam upphandling')) return { status: 'Optimerad', insight: 'Kostnadseffektiv gemensam lösning', color: 'text-green-400' };
      if (legalData.procurement_type?.includes('Ramavtal')) return { status: 'Strukturerad', insight: 'Etablerad avtalsstruktur', color: 'text-blue-400' };
      if (legalData.procurement_type?.length > 0) return { status: 'Genomförd', insight: 'Formell upphandling slutförd', color: 'text-green-400' };
      return { status: 'Okänd', insight: 'Upphandlingsstatus behöver förtydligas', color: 'text-gray-400' };
    };

    const getOpenSourceInsight = () => {
      if (legalData.is_open_source === 'Ja') return { benefit: 'Transparens & samarbete', risk: 'Säkerhetsansvar' };
      if (legalData.is_open_source === 'Nej') return { benefit: 'Skyddad IP', risk: 'Leverantörsberoende' };
      return { benefit: 'Okänd', risk: 'Okänd' };
    };

    const metrics = calculateLegalMetrics();

    return (
      <div className="space-y-8">
        {/* Legal Compliance Cards */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Juridisk compliance & riskanalys</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="border border-gray-600 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-[#FECB00] mb-1">
                {metrics.gdprCompliance}%
              </div>
              <div className="text-gray-400 text-sm">GDPR-compliance</div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.gdprCompliance >= 80 ? 'Hög compliance' :
                 metrics.gdprCompliance >= 60 ? 'God compliance' :
                 metrics.gdprCompliance >= 40 ? 'Grundläggande' : 'Behöver förbättring'}
              </div>
            </div>
            
            <div className="border border-gray-600 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold mb-1">
                <span className={getAIRiskLevel().color}>
                  {legalData.high_risk_ai === 'Ja' ? 'Hög' :
                   legalData.high_risk_ai === 'Nej' ? 'Låg' : '?'}
                </span>
              </div>
              <div className="text-gray-400 text-sm">AI-risknivå</div>
              <div className="text-xs text-gray-500 mt-1">
                {getAIRiskLevel().level}
              </div>
            </div>
            
            <div className="border border-gray-600 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-[#FECB00] mb-1">
                {metrics.procurementMaturity}%
              </div>
              <div className="text-gray-400 text-sm">Upphandlings&shy;mognad</div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.procurementMaturity >= 80 ? 'Mogen process' :
                 metrics.procurementMaturity >= 60 ? 'God struktur' :
                 metrics.procurementMaturity >= 40 ? 'Grundläggande' : 'Utvecklingsområde'}
              </div>
            </div>
            
            <div className="border border-gray-600 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-[#FECB00] mb-1">
                {metrics.securityLevel}%
              </div>
              <div className="text-gray-400 text-sm">Säkerhetsnivå</div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.securityLevel >= 80 ? 'Hög säkerhet' :
                 metrics.securityLevel >= 60 ? 'God säkerhet' :
                 metrics.securityLevel >= 40 ? 'Grundläggande' : 'Begränsad'}
              </div>
            </div>
          </div>
        </div>

        {/* Key Legal Insights */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Juridiska insikter</h3>
          <div className="space-y-3">
            {legalData.processes_personal_data && (
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="text-white font-medium">GDPR-riskbedömning</div>
                <div className="text-gray-300">
                  Projektet {legalData.processes_personal_data === 'Ja' ? 'hanterar personuppgifter' : 
                           legalData.processes_personal_data === 'Nej' ? 'hanterar inte personuppgifter' : 
                           'har oklar personuppgiftshantering'} och bedöms ha 
                  <span className={`font-semibold ml-1 ${getGDPRRiskLevel().color}`}>{getGDPRRiskLevel().level.toLowerCase()}</span> 
                  för GDPR-relaterade problem.
                  {legalData.processes_personal_data === 'Ja' && legalData.dpia_done !== 'Ja' && 
                   getGDPRRiskLevel().score > 40 && ' Konsekvensbedömning (DPIA) rekommenderas starkt.'}
                </div>
              </div>
            )}

            {legalData.high_risk_ai && (
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="text-white font-medium">AI-förordningsanalys</div>
                <div className="text-gray-300">
                  Lösningen klassificeras som <span className={`font-semibold ${getAIRiskLevel().color}`}>
                  {getAIRiskLevel().level.toLowerCase()}</span> enligt AI-förordningen.
                  {legalData.high_risk_ai === 'Ja' && legalData.ce_marked !== 'Ja' && 
                   ' CE-märkning och konformitetsbedömning krävs för högrisk-AI.'}
                  {legalData.high_risk_ai === 'Nej' && ' Begränsade regulatoriska krav gäller.'}
                </div>
              </div>
            )}

            {legalData.procurement_type?.length > 0 && (
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="text-white font-medium">Upphandlingsanalys</div>
                <div className="text-gray-300">
                  <span className={`font-semibold ${getProcurementInsight().color}`}>{getProcurementInsight().status}</span> upphandling - {getProcurementInsight().insight}.
                  {legalData.reusable_contract === 'Ja' && ' Avropsmöjlighet för andra kommuner skapar skalfördelar.'}
                  {legalData.supplier_contract_clauses && ' Särskilda avtalsvillkor dokumenterade för AI/transparens.'}
                </div>
              </div>
            )}

            {legalData.is_open_source && (
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="text-white font-medium">Öppen källkod-analys</div>
                <div className="text-gray-300">
                  {legalData.is_open_source === 'Ja' ? 'Öppen källkod används' : 
                   legalData.is_open_source === 'Nej' ? 'Proprietär lösning används' : 'Oklart om öppen källkod används'}.
                  Fördelar: <span className="text-white font-semibold">{getOpenSourceInsight().benefit}</span>, 
                  Överväganden: <span className="text-white font-semibold">{getOpenSourceInsight().risk}</span>.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Legal Information */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Detaljerad juridisk information</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-3 text-[#FECB00] font-medium">Juridisk aspekt</th>
                  <th className="text-left py-3 text-[#FECB00] font-medium">Status</th>
                  <th className="text-left py-3 text-[#FECB00] font-medium">Compliance</th>
                </tr>
              </thead>
              <tbody>
                {legalData.processes_personal_data && (
                  <tr className="border-b border-gray-700">
                    <td className="py-3 text-white font-medium">Personuppgiftsbehandling</td>
                    <td className="py-3 text-gray-300">{legalData.processes_personal_data}</td>
                    <td className={`py-3 ${getGDPRRiskLevel().color}`}>{getGDPRRiskLevel().level}</td>
                  </tr>
                )}
                {legalData.legal_basis && (
                  <tr className="border-b border-gray-700">
                    <td className="py-3 text-white font-medium">Rättslig grund</td>
                    <td className="py-3 text-gray-300">{legalData.legal_basis}</td>
                    <td className="py-3 text-green-400">Dokumenterad</td>
                  </tr>
                )}
                {legalData.high_risk_ai && (
                  <tr className="border-b border-gray-700">
                    <td className="py-3 text-white font-medium">AI-riskklassificering</td>
                    <td className="py-3 text-gray-300">{legalData.high_risk_ai} risk</td>
                    <td className={`py-3 ${getAIRiskLevel().color}`}>{getAIRiskLevel().level}</td>
                  </tr>
                )}
                {legalData.procurement_type?.length > 0 && (
                  <tr className="border-b border-gray-700">
                    <td className="py-3 text-white font-medium">Upphandlingsform</td>
                    <td className="py-3 text-gray-300">{legalData.procurement_type.join(', ')}</td>
                    <td className={`py-3 ${getProcurementInsight().color}`}>{getProcurementInsight().status}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* GDPR Compliance Details */}
        {legalData.processes_personal_data === 'Ja' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">GDPR-compliance detaljer</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Data Categories */}
              {legalData.data_categories?.length > 0 && (
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="text-blue-400 font-medium mb-2">Personuppgiftskategorier</h4>
                  <div className="text-gray-300 text-sm mb-2">
                    {legalData.data_categories.filter((cat: string) => cat !== 'Vet ej').join(', ')}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {legalData.data_categories.some((cat: string) => 
                      ['Hälsouppgifter', 'Etnicitet eller religion'].includes(cat)
                    ) ? 'Innehåller känsliga personuppgifter' : 'Standard personuppgifter'}
                  </div>
                </div>
              )}

              {/* Legal Basis and Controller */}
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="text-green-400 font-medium mb-2">Behandlingsgrunder</h4>
                <div className="space-y-1 text-sm">
                  {legalData.legal_basis && (
                    <div className="text-gray-300">Rättslig grund: <span className="text-white">{legalData.legal_basis}</span></div>
                  )}
                  {legalData.data_controller && (
                    <div className="text-gray-300">Ansvarig: <span className="text-white">{legalData.data_controller}</span></div>
                  )}
                  {legalData.dpia_done && (
                    <div className="text-gray-300">DPIA: <span className={`${legalData.dpia_done === 'Ja' ? 'text-green-400' : 'text-red-400'}`}>
                      {legalData.dpia_done}
                    </span></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security and Access */}
        {(legalData.security_measures || legalData.data_access_rights) && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Säkerhet & åtkomst</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Security Measures */}
              {legalData.security_measures && (
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="text-purple-400 font-medium mb-2">Säkerhetsåtgärder</h4>
                  <div className="text-gray-300 text-sm">{legalData.security_measures}</div>
                </div>
              )}

              {/* Data Access Rights */}
              {legalData.data_access_rights && (
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="text-orange-400 font-medium mb-2">Dataägande & åtkomst</h4>
                  <div className="text-gray-300 text-sm">{legalData.data_access_rights}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Procurement and Contract Details */}
        {(legalData.supplier_contract_clauses || legalData.open_source_link) && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Avtal & leverantörsvillkor</h3>
            <div className="space-y-4">
              
              {legalData.supplier_contract_clauses && (
                <div className="border-l-4 border-gray-600 pl-4">
                  <div className="text-white font-medium">Avtalsvillkor & klausuler</div>
                  <div className="text-gray-300">{legalData.supplier_contract_clauses}</div>
                </div>
              )}

              {legalData.open_source_link && (
                <div className="border-l-4 border-gray-600 pl-4">
                  <div className="text-white font-medium">Öppen källkod-referens</div>
                  <div className="text-gray-300">
                    <a href={legalData.open_source_link} target="_blank" rel="noopener noreferrer" className="text-[#FECB00] underline">
                      {legalData.open_source_link}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTechnicalData = (techData: any) => {
    if (!techData || Object.keys(techData).length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">Ingen teknisk data registrerad</div>
          <div className="text-sm text-gray-500">Lägg till teknisk information för att visa systemdetaljer</div>
        </div>
      );
    }

    // Calculate technical metrics and insights
    const calculateTechnicalMetrics = () => {
      let complexity = 0;
      let security = 0;
      let maturity = 0;
      let integrationScore = 0;

      // Complexity scoring
      if (techData.ai_methodology) complexity += 20;
      if (techData.integration_capabilities?.length > 0) complexity += techData.integration_capabilities.length * 10;
      if (techData.data_types?.length > 2) complexity += 15;
      if (techData.technical_obstacles) complexity += 25;

      // Security scoring
      switch(techData.data_sensitivity_level) {
        case 'Ej känslig': security = 90; break;
        case 'Innehåller personuppgifter': security = 60; break;
        case 'Känsliga personuppgifter': security = 30; break;
        case 'Skyddsklassad information': security = 10; break;
        default: security = 50;
      }

      // Maturity scoring
      if (techData.system_name) maturity += 30;
      if (techData.deployment_environment) maturity += 25;
      if (techData.data_quality === 'Verifierad') maturity += 20;
      if (techData.data_freshness) maturity += 15;
      if (techData.technical_solutions) maturity += 10;

      // Integration scoring
      if (techData.integration_capabilities?.length > 0) {
        integrationScore = Math.min(100, techData.integration_capabilities.length * 25);
      }

      return {
        complexity: Math.min(100, complexity),
        security,
        maturity,
        integration: integrationScore
      };
    };

    const getDeploymentInsight = (env: string) => {
      switch(env) {
        case 'Self-hostad (on-prem)': return { 
          insight: 'Fullt kontroll över data och säkerhet, men kräver intern infrastruktur',
          cost: 'Hög initial kostnad', 
          control: 'Maximal kontroll',
          complexity: 'Hög komplexitet'
        };
        case 'Molnbaserad': return { 
          insight: 'Skalbar och kostnadseffektiv, förlitar sig på extern leverantör',
          cost: 'Låg initial kostnad',
          control: 'Begränsad kontroll',
          complexity: 'Låg komplexitet'
        };
        case 'Säker svensk hosting': return { 
          insight: 'Molnbaserad lösning med svensk jurisdiktion och dataskydd',
          cost: 'Medel kostnad',
          control: 'God kontroll',
          complexity: 'Medel komplexitet'
        };
        case 'Hybridlösning': return { 
          insight: 'Balanserar kontroll och flexibilitet, komplex arkitektur',
          cost: 'Hög kostnad',
          control: 'Flexibel kontroll',
          complexity: 'Mycket hög komplexitet'
        };
        default: return { 
          insight: 'Driftmiljö behöver utredas för säkerhets- och kostnadsbedömning',
          cost: 'Okänd kostnad',
          control: 'Okänd kontroll',
          complexity: 'Okänd komplexitet'
        };
      }
    };

    const getSensitivityInsight = (level: string) => {
      switch(level) {
        case 'Innehåller personuppgifter': return { color: 'text-yellow-400', risk: 'Medel', requirement: 'GDPR-compliance krävs', score: 60 };
        case 'Känsliga personuppgifter': return { color: 'text-orange-400', risk: 'Hög', requirement: 'Särskilda säkerhetsåtgärder krävs', score: 30 };
        case 'Skyddsklassad information': return { color: 'text-red-400', risk: 'Kritisk', requirement: 'Säkerhetsgodkännande krävs', score: 10 };
        case 'Ej känslig': return { color: 'text-green-400', risk: 'Låg', requirement: 'Grundläggande säkerhet', score: 90 };
        default: return { color: 'text-gray-400', risk: 'Okänd', requirement: 'Riskbedömning behövs', score: 50 };
      }
    };

    const metrics = calculateTechnicalMetrics();

    return (
      <div className="space-y-8">
        {/* Technical Summary Cards */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Teknisk sammanfattning</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="border border-gray-600 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-[#FECB00] mb-1">
                {metrics.maturity}%
              </div>
              <div className="text-gray-400 text-sm">Teknikmognad</div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.maturity >= 80 ? 'Mogen lösning' : 
                 metrics.maturity >= 60 ? 'Utvecklad lösning' :
                 metrics.maturity >= 40 ? 'Grundläggande' : 'Tidig fas'}
              </div>
            </div>
            
            <div className="border border-gray-600 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold mb-1">
                <span className={
                  metrics.security >= 80 ? 'text-green-400' :
                  metrics.security >= 60 ? 'text-yellow-400' :
                  metrics.security >= 40 ? 'text-orange-400' : 'text-red-400'
                }>
                  {getSensitivityInsight(techData.data_sensitivity_level).risk}
                </span>
              </div>
              <div className="text-gray-400 text-sm">Säkerhetsrisk</div>
              <div className="text-xs text-gray-500 mt-1">
                {getSensitivityInsight(techData.data_sensitivity_level).requirement}
              </div>
            </div>
            
            <div className="border border-gray-600 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-[#FECB00] mb-1">
                {metrics.complexity}%
              </div>
              <div className="text-gray-400 text-sm">Komplexitet</div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.complexity >= 80 ? 'Mycket komplex' :
                 metrics.complexity >= 60 ? 'Komplex' :
                 metrics.complexity >= 40 ? 'Medel' : 'Enkel'}
              </div>
            </div>
            
            <div className="border border-gray-600 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-[#FECB00] mb-1">
                {techData.integration_capabilities?.length || 0}
              </div>
              <div className="text-gray-400 text-sm">Integrationer</div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.integration >= 75 ? 'Hög flexibilitet' :
                 metrics.integration >= 50 ? 'God flexibilitet' :
                 metrics.integration >= 25 ? 'Begränsad' : 'Minimal'}
              </div>
            </div>
          </div>
        </div>

        {/* Key Technical Insights */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Tekniska insikter</h3>
          <div className="space-y-3">
            {techData.deployment_environment && (
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="text-white font-medium">Arkitekturanalys</div>
                <div className="text-gray-300">
                  <span className="font-semibold">{techData.deployment_environment}</span> ger {getDeploymentInsight(techData.deployment_environment).insight.toLowerCase()}.
                  Kostnadsprofil: <span className="text-white">{getDeploymentInsight(techData.deployment_environment).cost}</span>, 
                  Komplexitet: <span className="text-white">{getDeploymentInsight(techData.deployment_environment).complexity}</span>.
                </div>
              </div>
            )}

            {techData.ai_methodology && (
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="text-white font-medium">AI-teknologianalys</div>
                <div className="text-gray-300">
                  Systemet använder <span className="text-white font-semibold">{techData.ai_methodology}</span> för sina AI-funktioner.
                  {techData.data_types?.length > 0 && (
                    <> Hanterar <span className="text-white font-semibold">{techData.data_types.length}</span> olika datatyper 
                    ({techData.data_types.join(', ')}).</>
                  )}
                </div>
              </div>
            )}

            {techData.data_sensitivity_level && (
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="text-white font-medium">Säkerhetsriskanalys</div>
                <div className="text-gray-300">
                  Data klassificeras som <span className={`font-semibold ${getSensitivityInsight(techData.data_sensitivity_level).color}`}>
                  {getSensitivityInsight(techData.data_sensitivity_level).risk} risk</span>. 
                  {getSensitivityInsight(techData.data_sensitivity_level).requirement} för att säkerställa compliance och dataskydd.
                </div>
              </div>
            )}

            {(techData.technical_obstacles || techData.technical_solutions) && (
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="text-white font-medium">Implementeringsanalys</div>
                <div className="text-gray-300">
                  {techData.technical_obstacles && techData.technical_solutions ? (
                    <>Identifierade tekniska utmaningar har adresserats med konkreta lösningsstrategier, 
                    vilket tyder på en genomtänkt implementeringsplan.</>
                  ) : techData.technical_obstacles ? (
                    <>Tekniska utmaningar identifierade som kräver uppmärksamhet för framgångsrik implementation.</>
                  ) : (
                    <>Lösningsstrategier dokumenterade för att hantera potentiella tekniska utmaningar.</>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Technical Information */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Detaljerad teknisk information</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-3 text-[#FECB00] font-medium">Kategori</th>
                  <th className="text-left py-3 text-[#FECB00] font-medium">Specifikation</th>
                  <th className="text-left py-3 text-[#FECB00] font-medium">Detaljer</th>
                </tr>
              </thead>
              <tbody>
                {techData.system_name && (
                  <tr className="border-b border-gray-700">
                    <td className="py-3 text-white font-medium">AI-System</td>
                    <td className="py-3 text-gray-300">{techData.system_name}</td>
                    <td className="py-3 text-gray-300">{techData.ai_methodology || '—'}</td>
                  </tr>
                )}
                {techData.deployment_environment && (
                  <tr className="border-b border-gray-700">
                    <td className="py-3 text-white font-medium">Driftmiljö</td>
                    <td className="py-3 text-gray-300">{techData.deployment_environment}</td>
                    <td className="py-3 text-gray-300">{getDeploymentInsight(techData.deployment_environment).cost}</td>
                  </tr>
                )}
                {techData.data_types?.length > 0 && (
                  <tr className="border-b border-gray-700">
                    <td className="py-3 text-white font-medium">Datatyper</td>
                    <td className="py-3 text-gray-300">{techData.data_types.length} typer</td>
                    <td className="py-3 text-gray-300">{techData.data_types.join(', ')}</td>
                  </tr>
                )}
                {techData.data_sources?.length > 0 && (
                  <tr className="border-b border-gray-700">
                    <td className="py-3 text-white font-medium">Datakällor</td>
                    <td className="py-3 text-gray-300">{techData.data_sources.length} källor</td>
                    <td className="py-3 text-gray-300">{techData.data_sources.join(', ')}</td>
                  </tr>
                )}
                {techData.data_sensitivity_level && (
                  <tr className="border-b border-gray-700">
                    <td className="py-3 text-white font-medium">Säkerhetsnivå</td>
                    <td className="py-3 text-gray-300">{techData.data_sensitivity_level}</td>
                    <td className={`py-3 ${getSensitivityInsight(techData.data_sensitivity_level).color}`}>
                      {getSensitivityInsight(techData.data_sensitivity_level).risk} risk
                    </td>
                  </tr>
                )}
                {techData.data_quality && (
                  <tr className="border-b border-gray-700">
                    <td className="py-3 text-white font-medium">Datakvalitet</td>
                    <td className="py-3 text-gray-300">{techData.data_quality}</td>
                    <td className="py-3 text-gray-300">{techData.data_freshness || 'Ej specificerad'}</td>
                  </tr>
                )}
                {techData.integration_capabilities?.length > 0 && (
                  <tr className="border-b border-gray-700">
                    <td className="py-3 text-white font-medium">Integrationer</td>
                    <td className="py-3 text-gray-300">{techData.integration_capabilities.length} metoder</td>
                    <td className="py-3 text-gray-300">{techData.integration_capabilities.join(', ')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Implementation Challenges & Solutions */}
        {(techData.technical_obstacles || techData.technical_solutions) && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Implementation & Lösningar</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {techData.technical_obstacles && (
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="text-red-400 font-medium mb-2">Identifierade utmaningar</h4>
                  <div className="text-gray-300 text-sm">{techData.technical_obstacles}</div>
                </div>
              )}
              {techData.technical_solutions && (
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="text-green-400 font-medium mb-2">Planerade lösningar</h4>
                  <div className="text-gray-300 text-sm">{techData.technical_solutions}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Technical Details */}
        {(techData.data_description_free || techData.data_license_link || techData.data_type_other || techData.data_source_other) && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Övrig teknisk information</h3>
            <div className="space-y-4">
              {techData.data_description_free && (
                <div className="border-l-4 border-gray-600 pl-4">
                  <div className="text-white font-medium">Databeskrivning</div>
                  <div className="text-gray-300">{techData.data_description_free}</div>
                </div>
              )}
              {techData.data_license_link && (
                <div className="border-l-4 border-gray-600 pl-4">
                  <div className="text-white font-medium">Licensinformation</div>
                  <div className="text-gray-300">
                    <a href={techData.data_license_link} target="_blank" rel="noopener noreferrer" className="text-[#FECB00] underline">
                      {techData.data_license_link}
                    </a>
                  </div>
                </div>
              )}
              {(techData.data_type_other || techData.data_source_other) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {techData.data_type_other && (
                    <div className="border-l-4 border-gray-600 pl-4">
                      <div className="text-white font-medium">Övriga datatyper</div>
                      <div className="text-gray-300">{techData.data_type_other}</div>
                    </div>
                  )}
                  {techData.data_source_other && (
                    <div className="border-l-4 border-gray-600 pl-4">
                      <div className="text-white font-medium">Övriga datakällor</div>
                      <div className="text-gray-300">{techData.data_source_other}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] text-white">
        <Header />
        <div className="max-w-7xl mx-auto p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-[#1E3A4A] rounded mb-4"></div>
            <div className="h-4 bg-[#1E3A4A] rounded mb-8 w-3/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-[#1E3A4A] p-6 rounded-lg h-48"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] text-white">
        <Header />
        <div className="max-w-7xl mx-auto p-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              {error || 'Projektet kunde inte hittas'}
            </h1>
            <button
              onClick={() => router.push('/projects')}
              className="px-6 py-3 bg-[#FECB00] text-[#0D1B2A] font-semibold rounded-lg hover:bg-[#e0b400] transition-colors"
            >
              Tillbaka till projektlistan
            </button>
          </div>
        </div>
      </div>
    );
  }

  const score = calculateProjectScore(project);

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white">
      <Header />
      
      <div className="max-w-7xl mx-auto p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/projects')}
              className="flex items-center text-[#FECB00] hover:text-[#e0b400] transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Tillbaka till projekt
            </button>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-4xl font-extrabold text-[#FECB00]">{project.title}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getPhaseColor(project.phase)}`}>
              {getPhaseLabel(project.phase)}
            </span>
          </div>
          {project.intro && (
            <p className="text-xl text-gray-300 mb-6">{project.intro}</p>
          )}
          
          <div className="flex items-center justify-between text-sm text-gray-400 mb-8">
            <div>
              Skapad: {formatDate(project.created_at)}
              {project.updated_at !== project.created_at && (
                <span className="ml-4">
                  Uppdaterad: {formatDate(project.updated_at)}
                </span>
              )}
            </div>
            {project.responsible && (
              <div>Ansvarig: {project.responsible}</div>
            )}
          </div>

          {/* Project Profile */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Projektprofil</h2>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 shadow-sm mb-6">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${score.percentage}%`,
                  backgroundColor: (() => {
                    const { getScoreBarColor } = require('@/lib/projectScore');
                    return getScoreBarColor(score.percentage);
                  })()
                }}
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-2xl font-bold mb-1" style={{
                  color: (() => {
                    const { getScoreBarColor } = require('@/lib/projectScore');
                    return getScoreBarColor(score.percentage);
                  })()
                }}>
                  {score.percentage}%
                </div>
                <div className="text-gray-400 text-sm">Delningspoäng</div>
              </div>

              <div>
                <div className="text-2xl font-bold text-[#FECB00] mb-1">
                  {(() => {
                    try {
                      const { calculateROI } = require('@/lib/roiCalculator');
                      const costEntries = project.cost_data?.actualCostDetails?.costEntries || [];
                      const effectEntries = project.effects_data?.effectDetails || [];
                      
                      // Check if project actually has measurable effects
                      const hasActualEffects = effectEntries.some((effect: any) => {
                        const hasQuantitative = (effect.hasQuantitative === true || effect.hasQuantitative === 'true') && 
                                                effect.quantitativeDetails && 
                                                (effect.quantitativeDetails.financialDetails || effect.quantitativeDetails.redistributionDetails);
                        
                        const hasQualitative = (effect.hasQualitative === true || effect.hasQualitative === 'true') && 
                                               effect.qualitativeDetails && 
                                               effect.qualitativeDetails.factor;
                        
                        return hasQuantitative || hasQualitative;
                      });
                      
                      if (costEntries.length > 0 && effectEntries.length > 0 && hasActualEffects) {
                        const totalInvestment = costEntries.reduce((total: number, entry: any) => {
                          let entryTotal = 0;
                          switch (entry?.costUnit) {
                            case 'hours':
                              entryTotal = (Number(entry.hoursDetails?.hours) || 0) * (Number(entry.hoursDetails?.hourlyRate) || 0);
                              break;
                            case 'fixed':
                              entryTotal = Number(entry.fixedDetails?.fixedAmount) || 0;
                              break;
                            case 'monthly':
                              entryTotal = (Number(entry.monthlyDetails?.monthlyAmount) || 0) * (Number(entry.monthlyDetails?.monthlyDuration) || 1);
                              break;
                            case 'yearly':
                              entryTotal = (Number(entry.yearlyDetails?.yearlyAmount) || 0) * (Number(entry.yearlyDetails?.yearlyDuration) || 1);
                              break;
                          }
                          return total + entryTotal;
                        }, 0);
                        
                        if (totalInvestment > 0) {
                          const roiMetrics = calculateROI({ effectEntries, totalProjectInvestment: totalInvestment });
                          return `${roiMetrics.combinedROI.toFixed(1)}%`;
                        }
                      }
                      return '—';
                    } catch (error) {
                      return '—';
                    }
                  })()}
                </div>
                <div className="text-gray-400 text-sm">Total ROI</div>
              </div>

              <div>
                <div className="text-2xl font-bold text-[#FECB00] mb-1">
                  {(() => {
                    const effectEntries = project.effects_data?.effectDetails || [];
                    let totalQuantitativeValue = 0;
                    
                    effectEntries.forEach((effect: any) => {
                      if (effect.hasQuantitative && effect.quantitativeDetails) {
                        const financialData = parseFinancialDetails(effect.quantitativeDetails.financialDetails);
                        const redistributionData = parseRedistributionDetails(effect.quantitativeDetails.redistributionDetails);
                        if (financialData) totalQuantitativeValue += financialData.value;
                        if (redistributionData) totalQuantitativeValue += redistributionData.value;
                      }
                    });
                    
                    return totalQuantitativeValue > 0 ? formatCurrency(totalQuantitativeValue) : '—';
                  })()}
                </div>
                <div className="text-gray-400 text-sm">Total nytta</div>
              </div>

              <div>
                <div className="text-2xl font-bold text-[#FECB00] mb-1">
                  {(() => {
                    const isCountyProject = project.overview_details?.location_type === 'county';
                    const countyCodes = project.overview_details?.county_codes || [];
                    const municipalityCount = project.project_municipalities?.length || 0;
                    
                    return isCountyProject ? countyCodes.length : municipalityCount;
                  })()}
                </div>
                <div className="text-gray-400 text-sm">
                  {project.overview_details?.location_type === 'county' ? 'Län' : 'Kommuner'}
                </div>
              </div>
            </div>
          </div>

          {/* Project Description */}
          {(project.problem || project.opportunity) && (
            <div className="mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {project.problem && (
                  <div>
                    <h3 className="text-lg font-semibold text-[#FECB00] mb-3">Problem & Utmaning</h3>
                    <p className="text-gray-300 leading-relaxed">{project.problem}</p>
                  </div>
                )}
                {project.opportunity && (
                  <div>
                    <h3 className="text-lg font-semibold text-[#FECB00] mb-3">Möjlighet & Potential</h3>
                    <p className="text-gray-300 leading-relaxed">{project.opportunity}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8 border-b border-gray-600">
            {(() => {
              const isCountyProject = project.overview_details?.location_type === 'county';
              const countyCodes = project.overview_details?.county_codes || [];
              const hasLocation = isCountyProject ? countyCodes.length > 0 : (project.project_municipalities?.length || 0) > 0;
              
              // County lookup function
              const getCountyName = (code: string) => {
                const counties: Record<string, string> = {
                  '01': 'Stockholm', '03': 'Uppsala', '04': 'Södermanland', '05': 'Östergötland',
                  '06': 'Jönköping', '07': 'Kronoberg', '08': 'Kalmar', '09': 'Gotland',
                  '10': 'Blekinge', '12': 'Skåne', '13': 'Halland', '14': 'Västra Götaland',
                  '17': 'Värmland', '18': 'Örebro', '19': 'Västmanland', '20': 'Dalarna',
                  '21': 'Gävleborg', '22': 'Västernorrland', '23': 'Jämtland', '24': 'Västerbotten', '25': 'Norrbotten'
                };
                return counties[code] || code;
              };
              
              return hasLocation && (
                <div>
                  <h4 className="font-semibold text-[#FECB00] mb-3">
                    {isCountyProject 
                      ? `Län (${countyCodes.length})`
                      : `Kommuner (${project.project_municipalities?.length})`
                    }
                  </h4>
                  <div className="space-y-2">
                    {isCountyProject 
                      ? countyCodes.map((code: string, index: number) => (
                          <div key={index} className="text-white">
                            <span className="font-medium">{getCountyName(code)}</span>
                            <span className="text-gray-400 ml-2 text-sm">({code})</span>
                          </div>
                        ))
                      : project.project_municipalities?.map((pm, index) => (
                          <div key={index} className="text-white">
                            <span className="font-medium">{pm.municipalities.name}</span>
                            <span className="text-gray-400 ml-2 text-sm">({pm.municipalities.county})</span>
                          </div>
                        ))
                    }
                  </div>
                </div>
              );
            })()}

            {((project.project_areas?.length || 0) > 0 || (project.areas?.length || 0) > 0) && (
              <div>
                <h4 className="font-semibold text-[#FECB00] mb-3">Verksamhetsområden</h4>
                <div className="space-y-1">
                  {(project.project_areas?.length || 0) > 0 
                    ? project.project_areas?.map((pa, index) => (
                        <div key={index} className="text-white">{pa.areas.name}</div>
                      ))
                    : project.areas?.map((area, index) => (
                        <div key={index} className="text-white">{area}</div>
                      ))
                  }
                </div>
              </div>
            )}

            {((project.project_value_dimensions?.length || 0) > 0 || (project.value_dimensions?.length || 0) > 0) && (
              <div>
                <h4 className="font-semibold text-[#FECB00] mb-3">Värdedimensioner</h4>
                <div className="space-y-1">
                  {(project.project_value_dimensions?.length || 0) > 0
                    ? project.project_value_dimensions?.map((pvd, index) => (
                        <div key={index} className="text-white">{pvd.value_dimensions.name}</div>
                      ))
                    : project.value_dimensions?.map((dimension, index) => (
                        <div key={index} className="text-white">{dimension}</div>
                      ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-12">
          
          {/* Cost Analysis Section */}
          <section>
            <h2 className="text-2xl font-bold text-[#FECB00] mb-6">Kostnadsanalys</h2>
            {renderCostData(project.cost_data)}
          </section>

          {/* Effects Analysis Section */}
          <section>
            <h2 className="text-2xl font-bold text-[#FECB00] mb-6">Effektanalys</h2>
            {renderEffectsData(project!.effects_data, project!.cost_data)}
          </section>

          {/* Technical Information Section */}
          <section>
            <h2 className="text-2xl font-bold text-[#FECB00] mb-6">Teknisk information</h2>
            {renderTechnicalData(project.technical_data)}
          </section>

          {/* Leadership Section */}
          {project.leadership_data && Object.keys(project.leadership_data).length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-[#FECB00] mb-6">Organisation & Ledarskap</h2>
              {renderLeadershipData(project.leadership_data)}
            </section>
          )}

          {/* Legal & Compliance Section */}
          {project.legal_data && Object.keys(project.legal_data).length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-[#FECB00] mb-6">Juridisk & Etisk analys</h2>
              {renderLegalData(project.legal_data)}
            </section>
          )}
        </div>

        {/* Additional Actions */}
        <div className="mt-12 flex justify-center space-x-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/map')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
            >
              Visa på kartan
            </button>
            <button
              onClick={() => router.push(`/projects/new?edit=${project.id}`)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
            >
              Redigera projekt
            </button>
            <button
              onClick={deleteProject}
              disabled={isDeleting}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              {isDeleting ? 'Tar bort...' : 'Ta bort projekt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
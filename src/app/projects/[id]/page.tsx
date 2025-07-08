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
    
    const { valueUnit, countDetails, hoursDetails, otherDetails, measurementName, annualizationYears } = details;
    
    let value = 0;
    let description = '';
    
    if (valueUnit === 'count' && countDetails) {
      value = (countDetails.count || 0) * (countDetails.valuePerUnit || 0);
      const timescale = countDetails.timescale === 'per_month' ? '/månad' : countDetails.timescale === 'per_year' ? '/år' : '';
      description = `${countDetails.count} ${measurementName || 'enheter'} ${timescale} × ${formatCurrency(countDetails.valuePerUnit || 0)}`;
      if (annualizationYears) {
        value *= (annualizationYears * (countDetails.timescale === 'per_month' ? 12 : 1));
        description += ` under ${annualizationYears} år`;
      }
    } else if (valueUnit === 'hours' && hoursDetails) {
      value = (hoursDetails.hours || 0) * (hoursDetails.hourlyRate || 0);
      description = `${hoursDetails.hours} timmar × ${formatCurrency(hoursDetails.hourlyRate || 0)}/timme`;
    } else if (valueUnit === 'other' && otherDetails) {
      const current = otherDetails.currentAmount || 0;
      const newAmount = otherDetails.newAmount || 0;
      const diff = newAmount - current;
      value = Math.abs(diff) * (otherDetails.valuePerUnit || 0);
      const timescale = otherDetails.timescale === 'per_month' ? '/månad' : otherDetails.timescale === 'per_year' ? '/år' : '';
      description = `${diff > 0 ? 'Ökning' : 'Minskning'} med ${Math.abs(diff)} ${otherDetails.customUnit || 'enheter'} ${timescale}`;
      if (annualizationYears) {
        value *= (annualizationYears * (otherDetails.timescale === 'per_month' ? 12 : 1));
        description += ` under ${annualizationYears} år`;
      }
    }
    
    return { value, description, measurementName };
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
        const redistributionData = parseFinancialDetails(effect.quantitativeDetails.redistributionDetails);
        if (financialData) totalQuantitativeValue += financialData.value;
        if (redistributionData) totalQuantitativeValue += redistributionData.value;
      }
      if (effect.hasQualitative && effect.qualitativeDetails?.description) {
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
                    const redistributionData = parseFinancialDetails(effect.quantitativeDetails.redistributionDetails);
                    
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
                  
                  if (effect.hasQualitative && effect.qualitativeDetails?.description) {
                    rows.push({
                      name: getEffectName(effect, index),
                      type: 'Kvalitativ effekt',
                      description: effect.qualitativeDetails.description,
                      value: effect.qualitativeDetails.monetaryEstimate ? 
                        parseFinancialDetails(effect.qualitativeDetails.monetaryEstimate)?.value || 0 : null
                    });
                  }
                  
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
                    <span className="text-white font-semibold">{totalQualitativeEffects}</span> kvalitativa effekter identifierade 
                    som bidrar till förbättrad service, ökad tillgänglighet och bättre användarupplevelse.
                  </div>
                </div>
              )}

              {(() => {
                try {
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

                  if (totalCost > 0 && totalQuantitativeValue > 0) {
                    const paybackMonths = Math.round((totalCost / (totalQuantitativeValue / 12)) * 10) / 10;
                    const roi = ((totalQuantitativeValue - totalCost) / totalCost * 100);
                    
                    return (
                      <div className="border-l-4 border-gray-600 pl-4">
                        <div className="text-white font-medium">Investeringsanalys</div>
                        <div className="text-gray-300">
                          Investeringen på <span className="text-white font-semibold">{formatCurrency(totalCost)}</span> förväntas 
                          betala tillbaka sig på <span className="text-white font-semibold">{paybackMonths} månader</span> med 
                          en total ROI på <span className={`font-semibold ${roi > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {roi.toFixed(1)}%
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
                        {effect.quantitativeDetails.expectedValue && (
                          <div>
                            <span className="text-gray-400">Förväntat värde: </span>
                            <span className="text-white">{effect.quantitativeDetails.expectedValue}</span>
                          </div>
                        )}
                        {effect.quantitativeDetails.timeframe && (
                          <div>
                            <span className="text-gray-400">Tidsram: </span>
                            <span className="text-white">{effect.quantitativeDetails.timeframe}</span>
                          </div>
                        )}
                        {effect.quantitativeDetails.measurementMethod && (
                          <div>
                            <span className="text-gray-400">Mätmetod: </span>
                            <span className="text-white">{effect.quantitativeDetails.measurementMethod}</span>
                          </div>
                        )}
                        
                        {effect.quantitativeDetails.financialDetails && (
                          <div className="pt-2 border-t border-gray-600">
                            <div className="text-white font-medium mb-1">Finansiella effekter</div>
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
                        )}
                        
                        {effect.quantitativeDetails.redistributionDetails && (
                          <div className="pt-2 border-t border-gray-600">
                            <div className="text-white font-medium mb-1">Omfördelningseffekter</div>
                            {(() => {
                              const data = parseFinancialDetails(effect.quantitativeDetails.redistributionDetails);
                              return data ? (
                                <div>
                                  <div className="text-gray-300">{data.description}</div>
                                  <div className="text-white font-semibold">Värde: {formatCurrency(data.value)}</div>
                                </div>
                              ) : <div className="text-gray-400">Ingen omfördelningsdata tillgänglig</div>;
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {effect.hasQualitative && effect.qualitativeDetails && (
                    <div>
                      <h5 className="text-[#FECB00] font-medium mb-3">Kvalitativa effekter</h5>
                      <div className="space-y-3 text-sm">
                        {effect.qualitativeDetails.description && (
                          <div>
                            <span className="text-gray-400">Beskrivning: </span>
                            <span className="text-white">{effect.qualitativeDetails.description}</span>
                          </div>
                        )}
                        {effect.qualitativeDetails.targetGroup && (
                          <div>
                            <span className="text-gray-400">Målgrupp: </span>
                            <span className="text-white">{effect.qualitativeDetails.targetGroup}</span>
                          </div>
                        )}
                        {effect.qualitativeDetails.expectedImpact && (
                          <div>
                            <span className="text-gray-400">Förväntad påverkan: </span>
                            <span className="text-white">{effect.qualitativeDetails.expectedImpact}</span>
                          </div>
                        )}
                        
                        {effect.qualitativeDetails.monetaryEstimate && (
                          <div className="pt-2 border-t border-gray-600">
                            <div className="text-white font-medium mb-1">Monetär uppskattning</div>
                            {(() => {
                              const data = parseFinancialDetails(effect.qualitativeDetails.monetaryEstimate);
                              return data ? (
                                <div>
                                  <div className="text-gray-300">{data.description}</div>
                                  <div className="text-white font-semibold">Uppskattat värde: {formatCurrency(data.value)}</div>
                                </div>
                              ) : <div className="text-gray-400">Ingen monetär uppskattning tillgänglig</div>;
                            })()}
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

  const renderTechnicalData = (techData: any) => {
    if (!techData || Object.keys(techData).length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">Ingen teknisk data registrerad</div>
          <div className="text-sm text-gray-500">Lägg till teknisk information för att visa systemdetaljer</div>
        </div>
      );
    }

    const technicalFields = [
      { key: 'system_name', label: 'Systemnamn' },
      { key: 'ai_methodology', label: 'AI-metodik' },
      { key: 'deployment_environment', label: 'Driftmiljö' },
      { key: 'data_types', label: 'Datatyper' },
      { key: 'data_sources', label: 'Datakällor' },
      { key: 'integration_capabilities', label: 'Integrationsmöjligheter' },
      { key: 'data_sensitivity_level', label: 'Känslighetsnivå' },
      { key: 'data_freshness', label: 'Aktualitet' },
      { key: 'data_quality', label: 'Datakvalitet' },
      { key: 'data_license', label: 'Datalicens' },
    ];

    return (
      <div className="space-y-8">
        {/* Technical Specification */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Teknisk specifikation</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-3 text-[#FECB00] font-medium">Kategori</th>
                  <th className="text-left py-3 text-[#FECB00] font-medium">Information</th>
                </tr>
              </thead>
              <tbody>
                {technicalFields.map((field) => {
                  const value = techData[field.key];
                  if (!value) return null;
                  
                  const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
                  
                  return (
                    <tr key={field.key} className="border-b border-gray-700">
                      <td className="py-3 text-gray-300 font-medium">{field.label}</td>
                      <td className="py-3 text-white">{displayValue}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Data Analysis */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Dataanalys</h3>
          <div className="space-y-4">
            
            {/* Data Description */}
            {techData.data_description_free && (
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="text-white font-medium">Databeskrivning</div>
                <div className="text-gray-300">{techData.data_description_free}</div>
              </div>
            )}

            {/* Data License Details */}
            {techData.data_license_link && (
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="text-white font-medium">Licensreferens</div>
                <div className="text-gray-300">
                  <a href={techData.data_license_link} target="_blank" rel="noopener noreferrer" className="text-[#FECB00] underline">
                    {techData.data_license_link}
                  </a>
                </div>
              </div>
            )}

            {/* Technical Challenges */}
            {techData.technical_obstacles && (
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="text-white font-medium">Tekniska hinder</div>
                <div className="text-gray-300">{techData.technical_obstacles}</div>
              </div>
            )}

            {/* Technical Solutions */}
            {techData.technical_solutions && (
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="text-white font-medium">Tekniska lösningar</div>
                <div className="text-gray-300">{techData.technical_solutions}</div>
              </div>
            )}

            {/* Deployment Environment Details */}
            {techData.deployment_environment_description && (
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="text-white font-medium">Beskrivning av driftmiljö</div>
                <div className="text-gray-300">{techData.deployment_environment_description}</div>
              </div>
            )}

            {/* Integration Details */}
            {techData.integration_capabilities_text && (
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="text-white font-medium">Övriga integrationsmöjligheter</div>
                <div className="text-gray-300">{techData.integration_capabilities_text}</div>
              </div>
            )}

            {/* Other Data Types */}
            {techData.data_type_other && (
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="text-white font-medium">Övriga datatyper</div>
                <div className="text-gray-300">{techData.data_type_other}</div>
              </div>
            )}

            {/* Other Data Sources */}
            {techData.data_source_other && (
              <div className="border-l-4 border-gray-600 pl-4">
                <div className="text-white font-medium">Övriga datakällor</div>
                <div className="text-gray-300">{techData.data_source_other}</div>
              </div>
            )}
          </div>
        </div>

        {/* Data Sources and Types (if arrays) */}
        {(techData.data_sources?.length > 0 || techData.data_types?.length > 0) && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Datahantering</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {techData.data_sources?.length > 0 && (
                <div>
                  <h4 className="font-medium text-[#FECB00] mb-3">Datakällor ({techData.data_sources.length})</h4>
                  <div className="space-y-2">
                    {techData.data_sources.map((source: string, index: number) => (
                      <div key={index} className="border-l-4 border-gray-600 pl-3 text-gray-300 text-sm">
                        {source}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {techData.data_types?.length > 0 && (
                <div>
                  <h4 className="font-medium text-[#FECB00] mb-3">Datatyper ({techData.data_types.length})</h4>
                  <div className="space-y-2">
                    {techData.data_types.map((type: string, index: number) => (
                      <div key={index} className="border-l-4 border-gray-600 pl-3 text-gray-300 text-sm">
                        {type}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Integration Capabilities */}
        {techData.integration_capabilities?.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Integrationsmöjligheter</h3>
            <div className="border-l-4 border-gray-600 pl-4">
              <div className="text-white font-medium mb-2">Tillgängliga integrationer</div>
              <div className="text-gray-300">
                Systemet stöder <span className="text-white font-semibold">{techData.integration_capabilities.length}</span> olika 
                integrationsmetoder: {techData.integration_capabilities.join(', ')}.
              </div>
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
                      
                      if (costEntries.length > 0 && effectEntries.length > 0) {
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
                          return `${roiMetrics.economicROI.toFixed(1)}%`;
                        }
                      }
                      return '—';
                    } catch (error) {
                      return '—';
                    }
                  })()}
                </div>
                <div className="text-gray-400 text-sm">Monetär ROI</div>
              </div>

              <div>
                <div className="text-2xl font-bold text-[#FECB00] mb-1">
                  {(() => {
                    const effectEntries = project.effects_data?.effectDetails || [];
                    let totalQuantitativeValue = 0;
                    
                    effectEntries.forEach((effect: any) => {
                      if (effect.hasQuantitative && effect.quantitativeDetails) {
                        const financialData = parseFinancialDetails(effect.quantitativeDetails.financialDetails);
                        const redistributionData = parseFinancialDetails(effect.quantitativeDetails.redistributionDetails);
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
                  {(project.project_municipalities?.length || 0)}
                </div>
                <div className="text-gray-400 text-sm">Kommuner</div>
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
            {(project.project_municipalities?.length || 0) > 0 && (
              <div>
                <h4 className="font-semibold text-[#FECB00] mb-3">Kommuner ({project.project_municipalities?.length})</h4>
                <div className="space-y-2">
                  {project.project_municipalities?.map((pm, index) => (
                    <div key={index} className="text-white">
                      <span className="font-medium">{pm.municipalities.name}</span>
                      <span className="text-gray-400 ml-2 text-sm">({pm.municipalities.county})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

          {/* Governance Section */}
          {(project.leadership_data && Object.keys(project.leadership_data).length > 0) || 
           (project.legal_data && Object.keys(project.legal_data).length > 0) ? (
            <section>
              <h2 className="text-2xl font-bold text-[#FECB00] mb-6">Styrning & Juridik</h2>
              
              <div className="space-y-8">
                {/* Leadership Information */}
                {project.leadership_data && Object.keys(project.leadership_data).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Organisation & Ledarskap</h3>
                    <div className="space-y-4">
                      {/* Leadership Involvement */}
                      {project.leadership_data.leadershipInvolved && (
                        <div className="border-l-4 border-gray-600 pl-4">
                          <div className="text-white font-medium">Ledningsstöd</div>
                          <div className="text-gray-300">
                            {project.leadership_data.leadershipInvolved === 'yes' ? 'Ja, projektet har haft stöd från ledningen' : 'Nej, begränsat stöd från ledningen'}
                          </div>
                        </div>
                      )}

                      {/* Strategy Alignment */}
                      {project.leadership_data.strategyAlignment && (
                        <div className="border-l-4 border-gray-600 pl-4">
                          <div className="text-white font-medium">Strategisk förankring</div>
                          <div className="text-gray-300">
                            {project.leadership_data.strategyAlignment === 'explicit' && 'Uttryckligen förankrat i kommunens strategier'}
                            {project.leadership_data.strategyAlignment === 'indirect' && 'Indirekt stöd i strategierna'}
                            {project.leadership_data.strategyAlignment === 'no' && 'Ej strategiskt förankrat'}
                          </div>
                        </div>
                      )}

                      {/* Competence Needs */}
                      {project.leadership_data.competenceNeeds && (
                        <div className="border-l-4 border-gray-600 pl-4">
                          <div className="text-white font-medium">Kompetenssäkring</div>
                          <div className="text-gray-300">
                            {Array.isArray(project.leadership_data.competenceNeeds) 
                              ? project.leadership_data.competenceNeeds.map((need: string) => {
                                  switch(need) {
                                    case 'internal_development': return 'Intern kompetensutveckling';
                                    case 'recruitment': return 'Rekrytering av AI-kompetens';
                                    case 'consultants': return 'Anlitade konsulter/partners';
                                    case 'no_new_needs': return 'Inga nya behov';
                                    default: return need;
                                  }
                                }).join(', ')
                              : String(project.leadership_data.competenceNeeds)
                            }
                          </div>
                        </div>
                      )}

                      {/* Strategic Alignment Details */}
                      {project.leadership_data.strategicAlignment && (
                        <div className="border-l-4 border-gray-600 pl-4">
                          <div className="text-white font-medium">Strategisk beskrivning</div>
                          <div className="text-gray-300">{project.leadership_data.strategicAlignment}</div>
                        </div>
                      )}

                      {/* Management Support Details */}
                      {project.leadership_data.managementSupport && (
                        <div className="border-l-4 border-gray-600 pl-4">
                          <div className="text-white font-medium">Ledningens stöd</div>
                          <div className="text-gray-300">{project.leadership_data.managementSupport}</div>
                        </div>
                      )}

                      {/* Next Steps */}
                      {project.leadership_data.nextSteps && (
                        <div className="border-l-4 border-gray-600 pl-4">
                          <div className="text-white font-medium">Nästa steg</div>
                          <div className="text-gray-300">{project.leadership_data.nextSteps}</div>
                        </div>
                      )}

                      {/* Lessons Learned */}
                      {project.leadership_data.lessonsLearned && (
                        <div className="border-l-4 border-gray-600 pl-4">
                          <div className="text-white font-medium">Lärdomar & utmaningar</div>
                          <div className="text-gray-300">{project.leadership_data.lessonsLearned}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Legal Information */}
                {project.legal_data && Object.keys(project.legal_data).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Juridisk & Etisk analys</h3>
                    <div className="space-y-6">
                      
                      {/* GDPR Section */}
                      <div>
                        <h4 className="text-white font-medium mb-3">Behandling av personuppgifter (GDPR)</h4>
                        <div className="space-y-3">
                          {project.legal_data.processes_personal_data && (
                            <div className="border-l-4 border-gray-600 pl-4">
                              <div className="text-white font-medium">Behandlar personuppgifter</div>
                              <div className="text-gray-300">{project.legal_data.processes_personal_data}</div>
                            </div>
                          )}

                          {project.legal_data.data_categories && (
                            <div className="border-l-4 border-gray-600 pl-4">
                              <div className="text-white font-medium">Typer av personuppgifter</div>
                              <div className="text-gray-300">
                                {Array.isArray(project.legal_data.data_categories) 
                                  ? project.legal_data.data_categories.join(', ')
                                  : String(project.legal_data.data_categories)
                                }
                              </div>
                            </div>
                          )}

                          {project.legal_data.legal_basis && (
                            <div className="border-l-4 border-gray-600 pl-4">
                              <div className="text-white font-medium">Rättslig grund</div>
                              <div className="text-gray-300">{project.legal_data.legal_basis}</div>
                            </div>
                          )}

                          {project.legal_data.dpia_done && (
                            <div className="border-l-4 border-gray-600 pl-4">
                              <div className="text-white font-medium">Konsekvensbedömning (DPIA)</div>
                              <div className="text-gray-300">{project.legal_data.dpia_done}</div>
                            </div>
                          )}

                          {project.legal_data.data_controller && (
                            <div className="border-l-4 border-gray-600 pl-4">
                              <div className="text-white font-medium">Personuppgiftsansvarig</div>
                              <div className="text-gray-300">{project.legal_data.data_controller}</div>
                            </div>
                          )}

                          {project.legal_data.processor_agreement && (
                            <div className="border-l-4 border-gray-600 pl-4">
                              <div className="text-white font-medium">Personuppgiftsbiträdesavtal (PUB)</div>
                              <div className="text-gray-300">{project.legal_data.processor_agreement}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Procurement Section */}
                      <div>
                        <h4 className="text-white font-medium mb-3">Offentlig upphandling och avtal</h4>
                        <div className="space-y-3">
                          {project.legal_data.procurement_type && (
                            <div className="border-l-4 border-gray-600 pl-4">
                              <div className="text-white font-medium">Upphandlingstyp</div>
                              <div className="text-gray-300">
                                {Array.isArray(project.legal_data.procurement_type) 
                                  ? project.legal_data.procurement_type.join(', ')
                                  : String(project.legal_data.procurement_type)
                                }
                              </div>
                            </div>
                          )}

                          {project.legal_data.reusable_contract && (
                            <div className="border-l-4 border-gray-600 pl-4">
                              <div className="text-white font-medium">Återanvändbart avtal</div>
                              <div className="text-gray-300">{project.legal_data.reusable_contract}</div>
                            </div>
                          )}

                          {project.legal_data.supplier_contract_clauses && (
                            <div className="border-l-4 border-gray-600 pl-4">
                              <div className="text-white font-medium">Särskilda avtalsklausuler</div>
                              <div className="text-gray-300">{project.legal_data.supplier_contract_clauses}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI Regulation Section */}
                      <div>
                        <h4 className="text-white font-medium mb-3">AI-förordningen och riskbedömning</h4>
                        <div className="space-y-3">
                          {project.legal_data.high_risk_ai && (
                            <div className="border-l-4 border-gray-600 pl-4">
                              <div className="text-white font-medium">Högrisk-AI enligt EU-förordning</div>
                              <div className="text-gray-300">{project.legal_data.high_risk_ai}</div>
                            </div>
                          )}

                          {project.legal_data.ce_marked && (
                            <div className="border-l-4 border-gray-600 pl-4">
                              <div className="text-white font-medium">CE-märkning</div>
                              <div className="text-gray-300">{project.legal_data.ce_marked}</div>
                            </div>
                          )}

                          {project.legal_data.fundamental_rights_assessment && (
                            <div className="border-l-4 border-gray-600 pl-4">
                              <div className="text-white font-medium">Konsekvensbedömning grundläggande rättigheter</div>
                              <div className="text-gray-300">{project.legal_data.fundamental_rights_assessment}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Access and Ownership Section */}
                      <div>
                        <h4 className="text-white font-medium mb-3">Åtkomst, ägande och tillgänglighet</h4>
                        <div className="space-y-3">
                          {project.legal_data.data_access_rights && (
                            <div className="border-l-4 border-gray-600 pl-4">
                              <div className="text-white font-medium">Dataägande och åtkomst</div>
                              <div className="text-gray-300">{project.legal_data.data_access_rights}</div>
                            </div>
                          )}

                          {project.legal_data.is_open_source && (
                            <div className="border-l-4 border-gray-600 pl-4">
                              <div className="text-white font-medium">Öppen källkod</div>
                              <div className="text-gray-300">{project.legal_data.is_open_source}</div>
                              {project.legal_data.open_source_link && (
                                <div className="text-gray-300 mt-1">
                                  Länk: <a href={project.legal_data.open_source_link} target="_blank" rel="noopener noreferrer" className="text-[#FECB00] underline">
                                    {project.legal_data.open_source_link}
                                  </a>
                                </div>
                              )}
                            </div>
                          )}

                          {project.legal_data.accessibility && (
                            <div className="border-l-4 border-gray-600 pl-4">
                              <div className="text-white font-medium">Tillgänglighetsdirektiv (WCAG)</div>
                              <div className="text-gray-300">{project.legal_data.accessibility}</div>
                            </div>
                          )}

                          {project.legal_data.security_measures && (
                            <div className="border-l-4 border-gray-600 pl-4">
                              <div className="text-white font-medium">Säkerhetsåtgärder</div>
                              <div className="text-gray-300">{project.legal_data.security_measures}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          ) : null}
        </div>

        {/* Additional Actions */}
        <div className="mt-12 flex justify-center space-x-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/map')}
              className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <span className="mr-2"></span>
              Visa på kartan
            </button>
            <button
              onClick={() => router.push(`/projects/${project.id}/edit`)}
              className="flex items-center px-4 py-2 bg-[#FECB00] hover:bg-[#e6b800] text-black rounded-lg transition-colors"
            >
              <span className="mr-2"></span>
              Redigera projekt
            </button>
            <button
              onClick={deleteProject}
              disabled={isDeleting}
              className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <span className="mr-2"></span>
              {isDeleting ? 'Tar bort...' : 'Ta bort projekt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  summary: {
    totalProjects: number;
    totalBudget: number;
    averageBudget: number;
    totalROI: number;
    averageROI: number;
  };
  breakdowns: {
    byPhase: Record<string, number>;
    byCounty: Record<string, number>;
    byArea: Record<string, number>;
    byValueDimension: Record<string, number>;
    byBudgetRange: Record<string, number>;
    byTechnology: Record<string, number>;
    byAffectedGroups: Record<string, number>;
  };
  costAnalysis: {
    byCostType: Record<string, { count: number; totalCost: number }>;
    budgetVsActual: Array<{
      projectId: string;
      title: string;
      budget: number;
      actualCost: number;
      variance: number;
    }>;
    costPerHour: {
      average: number;
      min: number;
      max: number;
      median: number;
    };
  };
  effectsAnalysis: {
    byEffectType: Record<string, number>;
    quantifiableEffects: {
      withQuantifiable: number;
      withoutQuantifiable: number;
      percentage: number;
    };
    monetaryValue: number;
    affectedPopulation: {
      breakdown: Record<string, number>;
      totalAffected: number;
      averageGroupsPerProject: number;
    };
  };
  technologyInsights: {
    mostUsedTechnologies: [string, number][];
    deploymentEnvironments: Record<string, number>;
    dataTypes: Record<string, number>;
    integrationPatterns: Record<string, number>;
    technicalChallenges: {
      totalChallenges: number;
      totalSolutions: number;
      resolutionRate: number;
      challenges: string[];
      solutions: string[];
    };
  };
  topPerformers: {
    highestROI: any[];
    largestBudget: any[];
    mostAffectedGroups: any[];
    mostInnovative: any[];
  };
  projects: any[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    phase: '',
    county: '',
    area: '',
    valueDimension: '',
    minBudget: '',
    maxBudget: '',
    hasROI: '',
    technology: '',
    affectedGroups: ''
  });

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/analytics?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if the response has an error property
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Validate that we have the expected structure
      if (!data.summary || typeof data.summary.totalProjects === 'undefined') {
        console.error('Invalid analytics data structure:', data);
        throw new Error('Invalid data structure received from API');
      }
      
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Ensure Chart.js scales registered (for SSR hydration issues)
  useEffect(() => {
    import('chart.js/auto');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121F2B] p-8 text-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-[#FFD600] mb-8">Projektanalys</h1>
          <div className="animate-pulse">Laddar data...</div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-[#121F2B] p-8 text-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-[#FFD600] mb-8">Projektanalys</h1>
          <div className="text-red-400">Kunde inte ladda analysdata</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121F2B] p-8 text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[#FFD600] mb-8">Projektanalys & Insikter</h1>

        {/* Filter Controls */}
        <div className="bg-[#1E3A4A] p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold text-[#FFD600] mb-4">Filter</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Projektfas</label>
              <select
                value={filters.phase}
                onChange={(e) => setFilters({...filters, phase: e.target.value})}
                className="w-full p-2 bg-[#121F2B] border border-gray-600 rounded text-white"
              >
                <option value="">Alla</option>
                <option value="idea">Idé</option>
                <option value="planning">Planering</option>
                <option value="implementation">Genomförande</option>
                <option value="completed">Avslutat</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Minsta budget (SEK)</label>
              <input
                type="number"
                value={filters.minBudget}
                onChange={(e) => setFilters({...filters, minBudget: e.target.value})}
                className="w-full p-2 bg-[#121F2B] border border-gray-600 rounded text-white"
                placeholder="t.ex. 100000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Största budget (SEK)</label>
              <input
                type="number"
                value={filters.maxBudget}
                onChange={(e) => setFilters({...filters, maxBudget: e.target.value})}
                className="w-full p-2 bg-[#121F2B] border border-gray-600 rounded text-white"
                placeholder="t.ex. 1000000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Teknik</label>
              <input
                type="text"
                value={filters.technology}
                onChange={(e) => setFilters({...filters, technology: e.target.value})}
                className="w-full p-2 bg-[#121F2B] border border-gray-600 rounded text-white"
                placeholder="t.ex. AI, Copilot"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Påverkade grupper</label>
              <select
                value={filters.affectedGroups}
                onChange={(e) => setFilters({...filters, affectedGroups: e.target.value})}
                className="w-full p-2 bg-[#121F2B] border border-gray-600 rounded text-white"
              >
                <option value="">Alla</option>
                <option value="Medborgare">Medborgare</option>
                <option value="Anställda">Anställda</option>
                <option value="Förvaltning/avdelning">Förvaltning/avdelning</option>
                <option value="Externa aktörer">Externa aktörer</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hasROI === 'true'}
                  onChange={(e) => setFilters({...filters, hasROI: e.target.checked ? 'true' : ''})}
                  className="mr-2"
                />
                Endast projekt med positiv ROI
              </label>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-[#FFD600] mb-2">Totalt Projekt</h3>
            <p className="text-3xl font-bold">{analytics?.summary?.totalProjects || 0}</p>
          </div>
          
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-[#FFD600] mb-2">Total Budget</h3>
            <p className="text-2xl font-bold">{formatCurrency(analytics?.summary?.totalBudget || 0)}</p>
          </div>
          
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-[#FFD600] mb-2">Genomsnittlig Budget</h3>
            <p className="text-2xl font-bold">{formatCurrency(analytics?.summary?.averageBudget || 0)}</p>
          </div>
          
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-[#FFD600] mb-2">Total ROI</h3>
            <p className="text-2xl font-bold">{formatPercent(analytics?.summary?.totalROI || 0)}</p>
          </div>
          
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-[#FFD600] mb-2">Genomsnittlig ROI</h3>
            <p className="text-2xl font-bold">{formatPercent(analytics?.summary?.averageROI || 0)}</p>
          </div>
        </div>

        {/* Charts and Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Projects by Phase */}
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-xl font-bold text-[#FFD600] mb-4">Projekt per Fas</h3>
            <div className="space-y-3">
              {Object.entries(analytics?.breakdowns?.byPhase || {}).map(([phase, count]) => (
                <div key={phase} className="flex justify-between items-center">
                  <span className="capitalize">{phase}</span>
                  <span className="text-[#FFD600] font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Ranges */}
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-xl font-bold text-[#FFD600] mb-4">Budgetfördelning</h3>
            <div className="space-y-3">
              {Object.entries(analytics?.breakdowns?.byBudgetRange || {}).map(([range, count]) => (
                <div key={range} className="flex justify-between items-center">
                  <span>{range}</span>
                  <span className="text-[#FFD600] font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Technology Usage */}
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-xl font-bold text-[#FFD600] mb-4">Mest Använda Teknologier</h3>
            <div className="space-y-3">
              {(analytics?.technologyInsights?.mostUsedTechnologies || []).slice(0, 8).map(([tech, count]) => (
                <div key={tech} className="flex justify-between items-center">
                  <span className="truncate mr-4">{tech}</span>
                  <span className="text-[#FFD600] font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Affected Groups */}
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-xl font-bold text-[#FFD600] mb-4">Påverkade Grupper</h3>
            <div className="space-y-3">
              {Object.entries(analytics?.breakdowns?.byAffectedGroups || {}).map(([group, count]) => (
                <div key={group} className="flex justify-between items-center">
                  <span>{group}</span>
                  <span className="text-[#FFD600] font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cost Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-xl font-bold text-[#FFD600] mb-4">Kostnadstyper</h3>
            <div className="space-y-3">
              {Object.entries(analytics?.costAnalysis?.byCostType || {}).map(([type, data]) => (
                <div key={type}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm truncate mr-2">{type}</span>
                    <span className="text-[#FFD600] font-semibold">{data.count}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatCurrency(data.totalCost)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-xl font-bold text-[#FFD600] mb-4">Kostnad per Timme</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Genomsnitt:</span>
                <span className="text-[#FFD600] font-semibold">
                  {formatCurrency(analytics?.costAnalysis?.costPerHour?.average || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Median:</span>
                <span className="text-[#FFD600] font-semibold">
                  {formatCurrency(analytics?.costAnalysis?.costPerHour?.median || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Min:</span>
                <span className="text-gray-300">
                  {formatCurrency(analytics?.costAnalysis?.costPerHour?.min || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Max:</span>
                <span className="text-gray-300">
                  {formatCurrency(analytics?.costAnalysis?.costPerHour?.max || 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-xl font-bold text-[#FFD600] mb-4">Effektanalys</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Med kvantifierbara mått:</span>
                <span className="text-[#FFD600] font-semibold">
                  {analytics?.effectsAnalysis?.quantifiableEffects?.withQuantifiable || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Utan kvantifierbara mått:</span>
                <span className="text-gray-300">
                  {analytics?.effectsAnalysis?.quantifiableEffects?.withoutQuantifiable || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Kvantifieringsgrad:</span>
                <span className="text-[#FFD600] font-semibold">
                  {formatPercent(analytics?.effectsAnalysis?.quantifiableEffects?.percentage || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Totalt monetärt värde:</span>
                <span className="text-[#FFD600] font-semibold">
                  {formatCurrency(analytics?.effectsAnalysis?.monetaryValue || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Insights */}
        <div className="bg-[#1E3A4A] p-6 rounded-lg mb-8">
          <h3 className="text-xl font-bold text-[#FFD600] mb-4">Tekniska Utmaningar & Lösningar</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Statistik</h4>
              <div className="space-y-2 text-sm">
                <div>Totalt utmaningar: <span className="text-[#FFD600]">{analytics?.technologyInsights?.technicalChallenges?.totalChallenges || 0}</span></div>
                <div>Totalt lösningar: <span className="text-[#FFD600]">{analytics?.technologyInsights?.technicalChallenges?.totalSolutions || 0}</span></div>
                <div>Lösningsgrad: <span className="text-[#FFD600]">{formatPercent(analytics?.technologyInsights?.technicalChallenges?.resolutionRate || 0)}</span></div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Exempel på Utmaningar</h4>
              <div className="space-y-1 text-sm text-gray-300">
                {(analytics?.technologyInsights?.technicalChallenges?.challenges || []).slice(0, 3).map((challenge, index) => (
                  <div key={index} className="truncate">{challenge}</div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Exempel på Lösningar</h4>
              <div className="space-y-1 text-sm text-gray-300">
                {(analytics?.technologyInsights?.technicalChallenges?.solutions || []).slice(0, 3).map((solution, index) => (
                  <div key={index} className="truncate">{solution}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* NEW ANALYTICS SECTIONS */}
        
        {/* Service Level Radar */}
        {analytics?.serviceLevelRadarData && analytics.serviceLevelRadarData.length > 0 && (
          <div className="bg-[#1E3A4A] p-6 rounded-lg mb-8">
            <h3 className="text-xl font-bold text-[#FFD600] mb-4">Service Level-radar (KPI-analys)</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analytics.serviceLevelRadarData.slice(0, 4).map((project, index) => (
                <div key={project.projectId} className="bg-[#121F2B] p-4 rounded">
                  <h4 className="font-semibold mb-3 text-sm">{project.title}</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Kvalitet:</span>
                      <span className="text-[#FFD600]">{project.kpis.quality}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medborgarnöjdhet:</span>
                      <span className="text-[#FFD600]">{project.kpis.citizenSatisfaction}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Innovation:</span>
                      <span className="text-[#FFD600]">{project.kpis.innovation}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Effektivitet:</span>
                      <span className="text-[#FFD600]">{project.kpis.efficiency}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hållbarhet:</span>
                      <span className="text-[#FFD600]">{project.kpis.sustainability}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tillgänglighet:</span>
                      <span className="text-[#FFD600]">{project.kpis.accessibility}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SDG Mapping */}
        {analytics?.sdgMappingData && analytics.sdgMappingData.length > 0 && (
          <div className="bg-[#1E3A4A] p-6 rounded-lg mb-8">
            <h3 className="text-xl font-bold text-[#FFD600] mb-4">FN:s hållbarhetsmål-kartläggning</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {analytics.sdgMappingData.slice(0, 6).map((project, index) => (
                <div key={project.projectId} className="bg-[#121F2B] p-4 rounded">
                  <h4 className="font-semibold mb-2 text-sm">{project.title}</h4>
                  <div className="mb-2">
                    <span className="text-xs text-gray-400">SDG-mål:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {project.sdgs.map((sdg: string, sdgIndex: number) => (
                        <span key={sdgIndex} className="px-2 py-1 bg-[#FFD600] text-black text-xs rounded">
                          {sdg}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Områden: {project.areas.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Municipality AI Heatmap */}
        {analytics?.municipalityAIHeatmapData && analytics.municipalityAIHeatmapData.length > 0 && (
          <div className="bg-[#1E3A4A] p-6 rounded-lg mb-8">
            <h3 className="text-xl font-bold text-[#FFD600] mb-4">Kommuner vs AI-områden (Heatmap)</h3>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-1 gap-4">
                {analytics.municipalityAIHeatmapData
                  .filter((item: any) => item.count > 0)
                  .slice(0, 20)
                  .map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-[#121F2B] p-3 rounded">
                      <div className="flex-1">
                        <span className="font-medium">{item.municipality}</span>
                        <span className="text-gray-400 mx-2">→</span>
                        <span className="text-sm">{item.area}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#FFD600] font-semibold">{item.count}</span>
                        <div 
                          className="w-4 h-4 rounded"
                          style={{
                            backgroundColor: `rgba(255, 214, 0, ${Math.min(item.count / 5, 1)})`
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Project Timeline */}
        {analytics?.projectTimelineData && analytics.projectTimelineData.length > 0 && (
          <div className="bg-[#1E3A4A] p-6 rounded-lg mb-8">
            <h3 className="text-xl font-bold text-[#FFD600] mb-4">Tidslinje över projekt</h3>
            <div className="space-y-4">
              {analytics.projectTimelineData.slice(0, 10).map((project: any, index: number) => (
                <div key={project.id} className="bg-[#121F2B] p-4 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm">{project.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded ${
                      project.phase === 'Genomförd' ? 'bg-green-600' :
                      project.phase === 'Pågående' ? 'bg-blue-600' :
                      project.phase === 'Budgeterad' ? 'bg-yellow-600' : 'bg-gray-600'
                    }`}>
                      {project.phase}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>Kommun: {project.municipality}</div>
                    {project.startDate && (
                      <div>Start: {new Date(project.startDate).toLocaleDateString('sv-SE')}</div>
                    )}
                    {project.duration && (
                      <div>Varaktighet: {project.duration} dagar</div>
                    )}
                    <div>Kostnad: {formatCurrency(project.totalCost)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk vs Benefit Matrix */}
        {analytics?.riskBenefitMatrixData && analytics.riskBenefitMatrixData.length > 0 && (
          <div className="bg-[#1E3A4A] p-6 rounded-lg mb-8">
            <h3 className="text-xl font-bold text-[#FFD600] mb-4">Risk vs nytta-matris</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analytics.riskBenefitMatrixData.slice(0, 8).map((project: any, index: number) => (
                <div key={project.projectId} className="bg-[#121F2B] p-4 rounded">
                  <h4 className="font-semibold mb-3 text-sm">{project.title}</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Risk:</span>
                        <span className="text-[#FFD600]">{project.riskScore}%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${project.riskScore}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Nytta:</span>
                        <span className="text-[#FFD600]">{project.benefitScore}%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${project.benefitScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs">
                    <span className={`px-2 py-1 rounded ${
                      project.quadrant === 'High Risk, High Reward' ? 'bg-yellow-600' :
                      project.quadrant === 'High Risk, Low Reward' ? 'bg-red-600' :
                      project.quadrant === 'Low Risk, High Reward' ? 'bg-green-600' : 'bg-gray-600'
                    }`}>
                      {project.quadrant}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skill Gap Analysis */}
        {analytics?.skillGapAnalysisData && analytics.skillGapAnalysisData.gaps && (
          <div className="bg-[#1E3A4A] p-6 rounded-lg mb-8">
            <h3 className="text-xl font-bold text-[#FFD600] mb-4">Kompetensgap-analys</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Kompetensgap per kategori</h4>
                <div className="space-y-3">
                  {analytics.skillGapAnalysisData.gaps.slice(0, 5).map((gap: any, index: number) => (
                    <div key={gap.category} className="bg-[#121F2B] p-3 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">{gap.category}</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          gap.status === 'Critical Gap' ? 'bg-red-600' :
                          gap.status === 'Surplus' ? 'bg-green-600' : 'bg-yellow-600'
                        }`}>
                          {gap.status}
                        </span>
                      </div>
                      <div className="text-xs space-y-1">
                        <div>Krävs: {gap.required}</div>
                        <div>Tillgängligt: {gap.available}</div>
                        <div>Gap: {gap.gap}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Mest efterfrågade kompetenser</h4>
                <div className="space-y-2">
                  {analytics.skillGapAnalysisData.required.slice(0, 5).map((skill: any, index: number) => (
                    <div key={skill.category} className="flex justify-between items-center bg-[#121F2B] p-2 rounded">
                      <span className="text-sm">{skill.category}</span>
                      <span className="text-[#FFD600] font-semibold">{skill.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Future Trends Forecast */}
        {analytics?.futureTrendsForecastData && (
          <div className="bg-[#1E3A4A] p-6 rounded-lg mb-8">
            <h3 className="text-xl font-bold text-[#FFD600] mb-4">Framtida trender-prognos</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Teknologitrender</h4>
                <div className="space-y-2">
                  {analytics.futureTrendsForecastData.technologyTrends.slice(0, 5).map((trend: any, index: number) => (
                    <div key={trend.technology} className="bg-[#121F2B] p-3 rounded">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{trend.technology}</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          trend.trend === 'Rising' ? 'bg-green-600' :
                          trend.trend === 'Stable' ? 'bg-yellow-600' : 'bg-red-600'
                        }`}>
                          {trend.trend}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Tillväxt: +{trend.growthRate}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Områdestrender</h4>
                <div className="space-y-2">
                  {analytics.futureTrendsForecastData.areaTrends.slice(0, 5).map((trend: any, index: number) => (
                    <div key={trend.area} className="bg-[#121F2B] p-3 rounded">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{trend.area}</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          trend.trend === 'Rising' ? 'bg-green-600' :
                          trend.trend === 'Stable' ? 'bg-yellow-600' : 'bg-red-600'
                        }`}>
                          {trend.trend}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Tillväxt: +{trend.growthRate}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Övergripande adoption</h4>
                <div className="bg-[#121F2B] p-4 rounded">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Nuvarande projekt:</span>
                      <span className="text-[#FFD600]">{analytics.futureTrendsForecastData.adoptionTrends.currentTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tillväxt senaste året:</span>
                      <span className="text-[#FFD600]">{analytics.futureTrendsForecastData.adoptionTrends.recentGrowth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tillväxttakt:</span>
                      <span className="text-[#FFD600]">{analytics.futureTrendsForecastData.adoptionTrends.growthRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prognos (2 år):</span>
                      <span className="text-[#FFD600]">{analytics.futureTrendsForecastData.adoptionTrends.projectedTotal}</span>
                    </div>
                    <div className="mt-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        analytics.futureTrendsForecastData.adoptionTrends.trend === 'Strong Growth' ? 'bg-green-600' :
                        analytics.futureTrendsForecastData.adoptionTrends.trend === 'Moderate Growth' ? 'bg-yellow-600' :
                        analytics.futureTrendsForecastData.adoptionTrends.trend === 'Slow Growth' ? 'bg-blue-600' : 'bg-red-600'
                      }`}>
                        {analytics.futureTrendsForecastData.adoptionTrends.trend}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Quality Analysis */}
        <div className="bg-[#1E3A4A] p-6 rounded-lg mb-8">
          <h3 className="text-xl font-bold text-[#FFD600] mb-4">Data Quality Analysis</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Data Completeness</h4>
              <div className="space-y-3">
                <div className="bg-[#121F2B] p-3 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Basic Information</span>
                    <span className="text-[#FFD600] font-semibold">100%</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    All projects have title and intro
                  </div>
                </div>
                
                <div className="bg-[#121F2B] p-3 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Cost Data</span>
                    <span className="text-yellow-500 font-semibold">33%</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Only 1/3 projects have budget information
                  </div>
                </div>
                
                <div className="bg-[#121F2B] p-3 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Effects Data</span>
                    <span className="text-red-500 font-semibold">33%</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Only 1/3 projects have quantitative effects
                  </div>
                </div>
                
                <div className="bg-[#121F2B] p-3 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Technical Data</span>
                    <span className="text-yellow-500 font-semibold">33%</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Only 1/3 projects have AI methodology
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Recommendations</h4>
              <div className="space-y-2">
                <div className="bg-[#121F2B] p-3 rounded border-l-4 border-red-500">
                  <div className="text-sm font-medium">Prioritize Budget Collection</div>
                  <div className="text-xs text-gray-400 mt-1">
                    67% of projects are missing budget information
                  </div>
                </div>
                
                <div className="bg-[#121F2B] p-3 rounded border-l-4 border-yellow-500">
                  <div className="text-sm font-medium">Improve Effects Measurement</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Encourage quantitative effect measurements
                  </div>
                </div>
                
                <div className="bg-[#121F2B] p-3 rounded border-l-4 border-blue-500">
                  <div className="text-sm font-medium">Document AI Methodologies</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Require AI methodology for all AI projects
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-[#121F2B] rounded">
                <div className="text-sm font-medium text-[#FFD600]">Current Data Status</div>
                <div className="text-xs text-gray-400 mt-1">
                  Based on {analytics?.summary?.totalProjects || 0} projects in the system
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* National Savings Simulation Card */}
        <div className="bg-[#1E3A4A] p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-bold text-[#FFD600] mb-2">Nationell besparingssimulering</h2>
          <p className="mb-4 text-gray-300">Simulerad besparing om alla Sveriges 290 kommuner implementerar motsvarande projekt.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-lg text-gray-400">Totalt simulerad besparing</div>
              <div className="text-3xl font-bold text-[#FFD600]">{formatCurrency(analytics.nationalSavingsSimulation.totalSimulatedSavings || 0)}</div>
            </div>
            <div>
              <div className="text-lg text-gray-400">Besparing per invånare</div>
              <div className="text-3xl font-bold text-[#FFD600]">{analytics.nationalSavingsSimulation.savingsPerInhabitant || 0} kr</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            Baserat på {analytics.nationalSavingsSimulation.usedMunicipalityCount} kommuner i datasetet och en uppskattad befolkning på {analytics.nationalSavingsSimulation.usedPopulation.toLocaleString('sv-SE')} personer.
          </div>
        </div>

        {/* Budgetfördelning Sankey Card */}
        <div className="bg-[#1E3A4A] p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-bold text-[#FFD600] mb-2">Budgetfördelning Sankey</h2>
          <p className="mb-4 text-gray-300">Visualisering av flödet från kostnadstyper till projekt och vidare till kommuner.</p>
          {analytics.budgetSankeyData && analytics.budgetSankeyData.nodes.length > 0 && analytics.budgetSankeyData.links.length > 0 ? (
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer width="100%" height={400}>
                <Sankey
                  data={{
                    nodes: analytics.budgetSankeyData.nodes.map((node, index) => ({ ...node, key: index })),
                    links: analytics.budgetSankeyData.links
                  }}
                  nodePadding={24}
                  margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  link={{ stroke: '#FFD600', strokeOpacity: 0.4 }}
                  node={{ stroke: '#FFD600', fill: '#FFD600', fillOpacity: 0.8 }}
                >
                  <SankeyTooltip />
                </Sankey>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-gray-400">Ingen budgetfördelningsdata tillgänglig för nuvarande filter.</div>
          )}
        </div>

        {/* Kostnad vs. Effekt-heatmap Card */}
        <div className="bg-[#1E3A4A] p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-bold text-[#FFD600] mb-2">Kostnad vs. Effekt-heatmap</h2>
          <p className="mb-4 text-gray-300">Fyrfältare där X = faktisk kostnad och Y = monetär effekt per projekt.</p>
          {analytics.costEffectHeatmapData && analytics.costEffectHeatmapData.length > 0 ? (
            <div style={{ width: '100%', height: 400 }}>
              <ChartResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" dataKey="x" name="Kostnad" tickFormatter={formatCurrency} stroke="#FFD600">
                    <Label value="Faktisk kostnad (SEK)" offset={-10} position="insideBottom" fill="#FFD600" />
                  </XAxis>
                  <YAxis type="number" dataKey="y" name="Effekt" tickFormatter={formatCurrency} stroke="#FFD600">
                    <Label value="Monetär effekt (SEK)" angle={-90} position="insideLeft" fill="#FFD600" />
                  </YAxis>
                  <ChartTooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: number) => formatCurrency(v)} />
                  <Scatter name="Projekt" data={analytics.costEffectHeatmapData} fill="#FFD600" />
                </ScatterChart>
              </ChartResponsiveContainer>
            </div>
          ) : (
            <div className="text-gray-400">Ingen heatmap-data tillgänglig för nuvarande filter.</div>
          )}
        </div>

        {/* Break-even-tid Card */}
        <div className="bg-[#1E3A4A] p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-bold text-[#FFD600] mb-2">Break-even-tid</h2>
          <p className="mb-4 text-gray-300">Antal månader tills projektet når break-even (ROI = 0), baserat på periodiserad kostnad och effekt.</p>
          {analytics.breakEvenData && analytics.breakEvenData.length > 0 ? (
            <div className="space-y-2">
              {analytics.breakEvenData.map((item: any) => (
                <div key={item.projectId} className="flex justify-between items-center border-b border-gray-700 py-2">
                  <span className="truncate font-semibold">{item.title}</span>
                  <span className="text-[#FFD600] font-mono">
                    {item.breakEvenMonths ? `${item.breakEvenMonths} mån` : 'Ej uppnådd'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400">Ingen break-even-data tillgänglig för nuvarande filter.</div>
          )}
        </div>

        {/* Top-10 kvalitativa effekter (wordcloud) Card */}
        <div className="bg-[#1E3A4A] p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-bold text-[#FFD600] mb-2">Top-10 kvalitativa effekter</h2>
          <p className="mb-4 text-gray-300">Frekvensanalys av de vanligaste orden i projektens effektbeskrivningar.</p>
          {analytics.topQualitativeEffectsWordcloud && analytics.topQualitativeEffectsWordcloud.length > 0 ? (
            <SimpleWordcloud words={analytics.topQualitativeEffectsWordcloud} />
          ) : (
            <div className="text-gray-400">Ingen wordcloud-data tillgänglig för nuvarande filter.</div>
          )}
        </div>

        {/* Effekt-spridning (bubble chart) Card */}
        <div className="bg-[#1E3A4A] p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-bold text-[#FFD600] mb-2">Effekt-spridning</h2>
          <p className="mb-4 text-gray-300">Antal påverkade grupper × monetärt värde per projekt (bubbel­diagram).</p>
          {analytics.effectSpreadBubbleData && analytics.effectSpreadBubbleData.length > 0 ? (
            <div style={{ width: '100%', height: 400 }}>
              <ChartResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" dataKey="numGroups" name="Grupper" stroke="#FFD600">
                    <Label value="Antal påverkade grupper" offset={-10} position="insideBottom" fill="#FFD600" />
                  </XAxis>
                  <YAxis type="number" dataKey="monetaryValue" name="Värde" tickFormatter={formatCurrency} stroke="#FFD600">
                    <Label value="Monetärt värde (SEK)" angle={-90} position="insideLeft" fill="#FFD600" />
                  </YAxis>
                  <ChartTooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: number) => formatCurrency(v)} />
                  <Scatter name="Projekt" data={analytics.effectSpreadBubbleData} fill="#FFD600" shape="circle" />
                </ScatterChart>
              </ChartResponsiveContainer>
            </div>
          ) : (
            <div className="text-gray-400">Ingen effekt-spridningsdata tillgänglig för nuvarande filter.</div>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center text-gray-400 text-sm">
          Analysdata baserad på {analytics?.summary?.totalProjects || 0} projekt. 
          Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
        </div>
      </div>
    </div>
  );
} 
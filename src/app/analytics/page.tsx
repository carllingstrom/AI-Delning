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
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
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
            <p className="text-3xl font-bold">{analytics.summary.totalProjects}</p>
          </div>
          
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-[#FFD600] mb-2">Total Budget</h3>
            <p className="text-2xl font-bold">{formatCurrency(analytics.summary.totalBudget)}</p>
          </div>
          
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-[#FFD600] mb-2">Genomsnittlig Budget</h3>
            <p className="text-2xl font-bold">{formatCurrency(analytics.summary.averageBudget)}</p>
          </div>
          
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-[#FFD600] mb-2">Total ROI</h3>
            <p className="text-2xl font-bold">{formatPercent(analytics.summary.totalROI)}</p>
          </div>
          
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-[#FFD600] mb-2">Genomsnittlig ROI</h3>
            <p className="text-2xl font-bold">{formatPercent(analytics.summary.averageROI)}</p>
          </div>
        </div>

        {/* Charts and Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Projects by Phase */}
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-xl font-bold text-[#FFD600] mb-4">Projekt per Fas</h3>
            <div className="space-y-3">
              {Object.entries(analytics.breakdowns.byPhase).map(([phase, count]) => (
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
              {Object.entries(analytics.breakdowns.byBudgetRange).map(([range, count]) => (
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
              {analytics.technologyInsights.mostUsedTechnologies.slice(0, 8).map(([tech, count]) => (
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
              {Object.entries(analytics.breakdowns.byAffectedGroups).map(([group, count]) => (
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
              {Object.entries(analytics.costAnalysis.byCostType).map(([type, data]) => (
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
                  {formatCurrency(analytics.costAnalysis.costPerHour.average)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Median:</span>
                <span className="text-[#FFD600] font-semibold">
                  {formatCurrency(analytics.costAnalysis.costPerHour.median)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Min:</span>
                <span className="text-gray-300">
                  {formatCurrency(analytics.costAnalysis.costPerHour.min)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Max:</span>
                <span className="text-gray-300">
                  {formatCurrency(analytics.costAnalysis.costPerHour.max)}
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
                  {analytics.effectsAnalysis.quantifiableEffects.withQuantifiable}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Utan kvantifierbara mått:</span>
                <span className="text-gray-300">
                  {analytics.effectsAnalysis.quantifiableEffects.withoutQuantifiable}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Kvantifieringsgrad:</span>
                <span className="text-[#FFD600] font-semibold">
                  {formatPercent(analytics.effectsAnalysis.quantifiableEffects.percentage)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Totalt monetärt värde:</span>
                <span className="text-[#FFD600] font-semibold">
                  {formatCurrency(analytics.effectsAnalysis.monetaryValue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-xl font-bold text-[#FFD600] mb-4">Högsta ROI</h3>
            <div className="space-y-3">
              {analytics.topPerformers.highestROI.map((project) => (
                <div key={project.id} className="border-b border-gray-600 pb-2">
                  <div className="font-semibold truncate">{project.title}</div>
                  <div className="text-sm text-gray-400">
                    ROI: <span className="text-[#FFD600]">{formatPercent(project.roi)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-xl font-bold text-[#FFD600] mb-4">Största Budget</h3>
            <div className="space-y-3">
              {analytics.topPerformers.largestBudget.map((project) => (
                <div key={project.id} className="border-b border-gray-600 pb-2">
                  <div className="font-semibold truncate">{project.title}</div>
                  <div className="text-sm text-gray-400">
                    Budget: <span className="text-[#FFD600]">{formatCurrency(project.budget)}</span>
                  </div>
                </div>
              ))}
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
                <div>Totalt utmaningar: <span className="text-[#FFD600]">{analytics.technologyInsights.technicalChallenges.totalChallenges}</span></div>
                <div>Totalt lösningar: <span className="text-[#FFD600]">{analytics.technologyInsights.technicalChallenges.totalSolutions}</span></div>
                <div>Lösningsgrad: <span className="text-[#FFD600]">{formatPercent(analytics.technologyInsights.technicalChallenges.resolutionRate)}</span></div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Exempel på Utmaningar</h4>
              <div className="space-y-1 text-sm text-gray-300">
                {analytics.technologyInsights.technicalChallenges.challenges.slice(0, 3).map((challenge, index) => (
                  <div key={index} className="truncate">{challenge}</div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Exempel på Lösningar</h4>
              <div className="space-y-1 text-sm text-gray-300">
                {analytics.technologyInsights.technicalChallenges.solutions.slice(0, 3).map((solution, index) => (
                  <div key={index} className="truncate">{solution}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-gray-400 text-sm">
          Analysdata baserad på {analytics.summary.totalProjects} projekt. 
          Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
        </div>
      </div>
    </div>
  );
} 
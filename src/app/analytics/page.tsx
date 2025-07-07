'use client';

import { useState, useEffect } from 'react';
import AdvancedROIAnalysis from '@/components/analytics/AdvancedROIAnalysis';
import SimpleWordcloud from '@/components/SimpleWordcloud';
import {
  ResponsiveContainer,
  Sankey,
  ScatterChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Scatter,
  Tooltip as ChartTooltip,
  Label
} from 'recharts';

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
      
      if (data.error) {
        throw new Error(data.error);
      }
      
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
                <option value="pilot">Pilot</option>
                <option value="implemented">Implementerat</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Minsta budget (SEK)</label>
              <input
                type="number"
                value={filters.minBudget}
                onChange={(e) => setFilters({...filters, minBudget: e.target.value})}
                className="w-full p-2 bg-[#121F2B] border border-gray-600 rounded text-white"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Största budget (SEK)</label>
              <input
                type="number"
                value={filters.maxBudget}
                onChange={(e) => setFilters({...filters, maxBudget: e.target.value})}
                className="w-full p-2 bg-[#121F2B] border border-gray-600 rounded text-white"
                placeholder="∞"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Har ROI-data</label>
              <select
                value={filters.hasROI}
                onChange={(e) => setFilters({...filters, hasROI: e.target.value})}
                className="w-full p-2 bg-[#121F2B] border border-gray-600 rounded text-white"
              >
                <option value="">Alla</option>
                <option value="true">Ja</option>
                <option value="false">Nej</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-[#FFD600] mb-2">Totalt antal projekt</h3>
            <div className="text-3xl font-bold text-white">{analytics.summary.totalProjects}</div>
          </div>
          
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-[#FFD600] mb-2">Total budget</h3>
            <div className="text-3xl font-bold text-white">{formatCurrency(analytics.summary.totalBudget)}</div>
          </div>
          
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-[#FFD600] mb-2">Genomsnittlig budget</h3>
            <div className="text-3xl font-bold text-white">{formatCurrency(analytics.summary.averageBudget)}</div>
          </div>
          
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-[#FFD600] mb-2">Genomsnittlig ROI</h3>
            <div className="text-3xl font-bold text-white">{formatPercent(analytics.summary.averageROI)}</div>
          </div>
        </div>

        {/* Advanced ROI Analysis */}
        <AdvancedROIAnalysis projects={analytics.projects} />

        {/* Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Phase Breakdown */}
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h2 className="text-xl font-bold text-[#FFD600] mb-4">Fördelning per fas</h2>
            <div className="space-y-3">
              {analytics.breakdowns?.byPhase && Object.entries(analytics.breakdowns.byPhase).map(([phase, count]) => (
                <div key={phase} className="flex justify-between items-center">
                  <span className="text-white">{phase}</span>
                  <span className="text-[#FFD600] font-semibold">{count}</span>
                </div>
              )) || (
                <div className="text-gray-400 text-sm">Ingen fasdata tillgänglig</div>
              )}
            </div>
          </div>

          {/* County Breakdown */}
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h2 className="text-xl font-bold text-[#FFD600] mb-4">Fördelning per län</h2>
            <div className="space-y-3">
              {analytics.breakdowns?.byCounty && Object.entries(analytics.breakdowns.byCounty).map(([county, count]) => (
                <div key={county} className="flex justify-between items-center">
                  <span className="text-white">{county}</span>
                  <span className="text-[#FFD600] font-semibold">{count}</span>
                </div>
              )) || (
                <div className="text-gray-400 text-sm">Ingen ländata tillgänglig</div>
              )}
            </div>
          </div>
        </div>

        {/* Technology Insights */}
        <div className="bg-[#1E3A4A] p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold text-[#FFD600] mb-4">Teknologi-insikter</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Mest använda teknologier</h3>
              <div className="space-y-2">
                {analytics.technologyInsights?.mostUsedTechnologies?.slice(0, 5).map(([tech, count]) => (
                  <div key={tech} className="flex justify-between items-center">
                    <span className="text-white">{tech}</span>
                    <span className="text-[#FFD600] font-semibold">{count}</span>
                  </div>
                )) || (
                  <div className="text-gray-400 text-sm">Ingen teknologidata tillgänglig</div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Deployment-miljöer</h3>
              <div className="space-y-2">
                {analytics.technologyInsights?.deploymentEnvironments && Object.entries(analytics.technologyInsights.deploymentEnvironments).map(([env, count]) => (
                  <div key={env} className="flex justify-between items-center">
                    <span className="text-white">{env}</span>
                    <span className="text-[#FFD600] font-semibold">{count}</span>
                  </div>
                )) || (
                  <div className="text-gray-400 text-sm">Ingen deployment-data tillgänglig</div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Datatyper</h3>
              <div className="space-y-2">
                {analytics.technologyInsights?.dataTypes && Object.entries(analytics.technologyInsights.dataTypes).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-white">{type}</span>
                    <span className="text-[#FFD600] font-semibold">{count}</span>
                  </div>
                )) || (
                  <div className="text-gray-400 text-sm">Ingen datatypdata tillgänglig</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h2 className="text-xl font-bold text-[#FFD600] mb-4">Högsta ROI</h2>
            <div className="space-y-3">
              {analytics.topPerformers?.highestROI?.slice(0, 5).map((project: any) => (
                <div key={project.id} className="flex justify-between items-center">
                  <span className="text-white truncate">{project.title}</span>
                  <span className="text-[#FFD600] font-semibold">{formatPercent(project.roi)}</span>
                </div>
              )) || (
                <div className="text-gray-400 text-sm">Ingen ROI-data tillgänglig</div>
              )}
            </div>
          </div>
          
          <div className="bg-[#1E3A4A] p-6 rounded-lg">
            <h2 className="text-xl font-bold text-[#FFD600] mb-4">Största budgetar</h2>
            <div className="space-y-3">
              {analytics.topPerformers?.largestBudget?.slice(0, 5).map((project: any) => (
                <div key={project.id} className="flex justify-between items-center">
                  <span className="text-white truncate">{project.title}</span>
                  <span className="text-[#FFD600] font-semibold">{formatCurrency(project.budget)}</span>
                </div>
              )) || (
                <div className="text-gray-400 text-sm">Ingen budgetdata tillgänglig</div>
              )}
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
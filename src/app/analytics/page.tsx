'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface AnalyticsData {
  summary: {
    totalProjects: number;
    totalBudget: number;
    averageBudget: number;
    totalROI: number;
    averageROI: number;
    averageSharingScore: number;
    averageActualCost: number;
    averageBudgetUsage: number;
    averageEffectsCount: number;
    averageEffectsValue: number;
    averageAffectedGroups: number;
    averageTechnologies: number;
    projectsWithQuantifiableEffects: { count: number; percentage: number };
    projectsWithCostData: { count: number; percentage: number };
    projectsWithEffectData: { count: number; percentage: number };
    totalMonetaryValue: number;
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
    roiByValueDimension: Record<string, { count: number; totalROI: number; averageROI: number }>;
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
  const [selectedChart, setSelectedChart] = useState<string>('overview');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBarChart = (data: Record<string, number>, title: string, color: string = '#fecb00') => {
    const maxValue = Math.max(...Object.values(data));
    return (
      <div className="bg-[#224556] p-6 rounded-lg">
        <h3 className="text-xl font-bold text-[#fecb00] mb-4">{title}</h3>
        <div className="space-y-3">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-3">
              <div className="w-32 text-sm text-gray-300 truncate">{key}</div>
              <div className="flex-1 bg-gray-700 rounded-full h-4">
                <div 
                  className="h-4 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(value / maxValue) * 100}%`,
                    backgroundColor: color
                  }}
                />
              </div>
              <div className="w-16 text-right text-sm font-semibold text-[#fecb00]">
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const createPieChart = (data: Record<string, number>, title: string) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    // Using the design system colorscale
    const colors = [
      '#fecb00', // Primary yellow
      '#007399', // Light blue
      '#004d66', // Blue
      '#34af8f', // Accent green
      '#ff153b', // Accent red
      '#224556', // Blue-gray
      '#f4f2e6', // Off-white
      '#fffefa', // White
      // Additional colors for more variety
      '#fecb00', // Primary yellow (repeated)
      '#007399', // Light blue (repeated)
      '#004d66', // Blue (repeated)
      '#34af8f', // Accent green (repeated)
      '#ff153b', // Accent red (repeated)
      '#224556', // Blue-gray (repeated)
      '#f4f2e6', // Off-white (repeated)
      '#fffefa'  // White (repeated)
    ];
    
    return (
      <div className="bg-[#224556] p-6 rounded-lg">
        <h3 className="text-xl font-bold text-[#fecb00] mb-4">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative w-48 h-48 mx-auto">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {Object.entries(data).map(([key, value], index) => {
                const percentage = (value / total) * 100;
                const startAngle = index === 0 ? 0 : 
                  Object.entries(data).slice(0, index).reduce((sum, [, val]) => sum + (val / total) * 360, 0);
                const endAngle = startAngle + (percentage * 360 / 100);
                
                const x1 = 50 + 40 * Math.cos(startAngle * Math.PI / 180);
                const y1 = 50 + 40 * Math.sin(startAngle * Math.PI / 180);
                const x2 = 50 + 40 * Math.cos(endAngle * Math.PI / 180);
                const y2 = 50 + 40 * Math.sin(endAngle * Math.PI / 180);
                
                const largeArcFlag = percentage > 50 ? 1 : 0;
                
                return (
                  <path
                    key={key}
                    d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={colors[index % colors.length]}
                    className="hover:opacity-80 transition-opacity"
                  />
                );
              })}
            </svg>
          </div>
          <div className="space-y-2">
            {Object.entries(data).map(([key, value], index) => (
              <div key={key} className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-sm text-gray-300">{key}</span>
                <span className="text-sm font-semibold text-[#fecb00]">
                  {formatPercentage((value / total) * 100)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const createLineChart = (data: Array<{ x: string; y: number }>, title: string) => {
    const maxY = Math.max(...data.map(d => d.y));
    const minY = Math.min(...data.map(d => d.y));
    const range = maxY - minY;
    
    return (
      <div className="bg-[#224556] p-6 rounded-lg">
        <h3 className="text-xl font-bold text-[#fecb00] mb-4">{title}</h3>
        <div className="relative h-64">
          <svg className="w-full h-full" viewBox={`0 0 ${data.length * 60} 200`}>
            <polyline
              fill="none"
              stroke="#fecb00"
              strokeWidth="3"
              points={data.map((d, i) => 
                `${i * 60 + 30},${200 - ((d.y - minY) / range) * 180}`
              ).join(' ')}
            />
            {data.map((d, i) => (
              <circle
                key={i}
                cx={i * 60 + 30}
                cy={200 - ((d.y - minY) / range) * 180}
                r="4"
                fill="#fecb00"
              />
            ))}
          </svg>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121f2b] text-[#fffefa]">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-xl mb-4 text-[#fecb00]">Laddar avancerad analys...</div>
            <div className="w-8 h-8 border-2 border-[#fecb00] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121f2b] text-[#fffefa]">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#fecb00] mb-2">Avancerad Analys</h1>
          <p className="text-gray-300">Experimentell sida för djupare insikter och visualiseringar</p>
        </div>

        {/* Chart Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { key: 'overview', label: 'Översikt' },
            { key: 'costs', label: 'Kostnader' },
            { key: 'effects', label: 'Effekter' },
            { key: 'technology', label: 'Teknologi' },
            { key: 'performance', label: 'Prestation' }
          ].map((chart) => (
            <button
              key={chart.key}
              onClick={() => setSelectedChart(chart.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedChart === chart.key
                  ? 'bg-[#fecb00] text-[#121f2b]'
                  : 'bg-[#224556] text-gray-300 hover:text-[#fffefa]'
              }`}
            >
              {chart.label}
            </button>
          ))}
        </div>

        {/* Chart Content */}
        {selectedChart === 'overview' && analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {createPieChart(analytics.breakdowns.byPhase, 'Projekt per Fas')}
            {createBarChart(analytics.breakdowns.byArea, 'Projekt per Område')}
            {createPieChart(analytics.breakdowns.byValueDimension, 'Värdedimensioner')}
            {createBarChart(analytics.breakdowns.byCounty, 'Projekt per Län')}
          </div>
        )}

        {selectedChart === 'costs' && analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {createBarChart(
              Object.fromEntries(
                Object.entries(analytics.costAnalysis.byCostType).map(([key, value]) => [
                  key, 
                  value.count
                ])
              ),
              'Kostnadstyper (Antal Projekt)'
            )}
            {createPieChart(
              Object.fromEntries(
                Object.entries(analytics.costAnalysis.byCostType).map(([key, value]) => [
                  key, 
                  value.totalCost
                ])
              ),
              'Total Kostnad per Typ'
            )}
            <div className="bg-[#224556] p-6 rounded-lg">
              <h3 className="text-xl font-bold text-[#fecb00] mb-4">Kostnadsstatistik</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Genomsnittlig timkostnad:</span>
                  <span className="text-[#fecb00] font-semibold">
                    {formatCurrency(analytics.costAnalysis.costPerHour.average)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Median timkostnad:</span>
                  <span className="text-[#fecb00] font-semibold">
                    {formatCurrency(analytics.costAnalysis.costPerHour.median)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Lägsta timkostnad:</span>
                  <span className="text-gray-300">
                    {formatCurrency(analytics.costAnalysis.costPerHour.min)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Högsta timkostnad:</span>
                  <span className="text-gray-300">
                    {formatCurrency(analytics.costAnalysis.costPerHour.max)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedChart === 'effects' && analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {createPieChart(
              analytics.effectsAnalysis.byEffectType,
              'Effekttyper'
            )}
            {createBarChart(
              Object.fromEntries(
                Object.entries(analytics.effectsAnalysis.roiByValueDimension).map(([key, value]) => [
                  key, 
                  value.averageROI
                ])
              ),
              'Genomsnittlig ROI per Värdedimension'
            )}
            <div className="bg-[#224556] p-6 rounded-lg">
              <h3 className="text-xl font-bold text-[#fecb00] mb-4">Effektstatistik</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Projekt med kvantifierbara effekter:</span>
                  <span className="text-[#fecb00] font-semibold">
                    {analytics.effectsAnalysis.quantifiableEffects.withQuantifiable}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Kvantifieringsgrad:</span>
                  <span className="text-[#fecb00] font-semibold">
                    {formatPercentage(analytics.effectsAnalysis.quantifiableEffects.percentage)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total monetärt värde:</span>
                  <span className="text-[#fecb00] font-semibold">
                    {formatCurrency(analytics.effectsAnalysis.monetaryValue)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedChart === 'technology' && analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {createBarChart(
              Object.fromEntries(analytics.technologyInsights.mostUsedTechnologies),
              'Mest Använda Teknologier'
            )}
            {createPieChart(
              analytics.technologyInsights.deploymentEnvironments,
              'Deployment-miljöer'
            )}
            {createBarChart(
              analytics.technologyInsights.dataTypes,
              'Datatyper'
            )}
            <div className="bg-[#224556] p-6 rounded-lg">
              <h3 className="text-xl font-bold text-[#fecb00] mb-4">Tekniska Utmaningar</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Totalt utmaningar:</span>
                  <span className="text-[#fecb00] font-semibold">
                    {analytics.technologyInsights.technicalChallenges.totalChallenges}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Totalt lösningar:</span>
                  <span className="text-[#fecb00] font-semibold">
                    {analytics.technologyInsights.technicalChallenges.totalSolutions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Lösningsgrad:</span>
                  <span className="text-[#fecb00] font-semibold">
                    {formatPercentage(analytics.technologyInsights.technicalChallenges.resolutionRate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedChart === 'performance' && analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#224556] p-6 rounded-lg">
              <h3 className="text-xl font-bold text-[#fecb00] mb-4">Top ROI-projekt</h3>
              <div className="space-y-3">
                {analytics.topPerformers.highestROI.slice(0, 5).map((project, index) => (
                  <div key={project.id} className="flex justify-between items-center">
                    <span className="text-sm truncate">{index + 1}. {project.title}</span>
                    <span className="text-[#fecb00] font-semibold">
                      {formatPercentage(project.roi)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-[#224556] p-6 rounded-lg">
              <h3 className="text-xl font-bold text-[#fecb00] mb-4">Största Budget-projekt</h3>
              <div className="space-y-3">
                {analytics.topPerformers.largestBudget.slice(0, 5).map((project, index) => (
                  <div key={project.id} className="flex justify-between items-center">
                    <span className="text-sm truncate">{index + 1}. {project.title}</span>
                    <span className="text-[#fecb00] font-semibold">
                      {formatCurrency(project.budget)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Back to main pages */}
        <div className="mt-12 text-center">
          <Link 
            href="/projects" 
            className="px-6 py-3 bg-[#fecb00] text-[#121f2b] font-bold rounded-lg hover:bg-[#fecb00] transition-colors"
          >
            Tillbaka till Projektportalen
          </Link>
        </div>
      </div>
    </div>
  );
} 
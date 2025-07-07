'use client';

import React, { useEffect, useRef } from 'react';
import { calculateROI, getROIInsights, type EffectEntry } from '@/lib/roiCalculator';

interface Project {
  id: string;
  title: string;
  effects_data?: {
    effectDetails?: EffectEntry[];
  };
  cost_data?: {
    costEntries?: any[];
  };
}

interface AdvancedROIAnalysisProps {
  projects: Project[];
}

interface ROIAnalysisData {
  totalProjects: number;
  projectsWithEffects: number;
  totalInvestment: number;
  totalMonetaryValue: number;
  totalQualitativeValue: number;
  averageROI: number;
  medianROI: number;
  roiDistribution: {
    negative: number;
    low: number;
    medium: number;
    high: number;
    veryHigh: number;
  };
  dimensionBreakdown: Record<string, {
    count: number;
    totalValue: number;
    totalInvestment: number;
    averageROI: number;
  }>;
  topPerformers: Array<{
    projectId: string;
    title: string;
    roi: number;
    monetaryValue: number;
    investment: number;
  }>;
  insights: string[];
  recommendations: string[];
}

export default function AdvancedROIAnalysis({ projects }: AdvancedROIAnalysisProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  const analyzeROI = (): ROIAnalysisData => {
    const projectsWithEffects = projects.filter(p => p.effects_data?.effectDetails?.length > 0);
    
    if (projectsWithEffects.length === 0) {
      return {
        totalProjects: projects.length,
        projectsWithEffects: 0,
        totalInvestment: 0,
        totalMonetaryValue: 0,
        totalQualitativeValue: 0,
        averageROI: 0,
        medianROI: 0,
        roiDistribution: { negative: 0, low: 0, medium: 0, high: 0, veryHigh: 0 },
        dimensionBreakdown: {},
        topPerformers: [],
        insights: ['Inga projekt med effektdata hittades'],
        recommendations: ['Lägg till effektdata i projekten för att se ROI-analys']
      };
    }

    let totalInvestment = 0;
    let totalMonetaryValue = 0;
    let totalQualitativeValue = 0;
    const allROIs: number[] = [];
    const dimensionData: Record<string, { count: number; totalValue: number; totalInvestment: number; rois: number[] }> = {};
    const projectROIs: Array<{ projectId: string; title: string; roi: number; monetaryValue: number; investment: number }> = [];

    // Analyze each project
    projectsWithEffects.forEach(project => {
      const effectEntries = project.effects_data?.effectDetails || [];
      if (effectEntries.length === 0) return;

      const roiMetrics = calculateROI({ effectEntries });
      const qualitativeValue = roiMetrics.qualitativeEffects.reduce((sum, q) => sum + q.weightedValue, 0);
      
      totalInvestment += roiMetrics.totalInvestment;
      totalMonetaryValue += roiMetrics.totalMonetaryValue;
      totalQualitativeValue += qualitativeValue;

      const projectROI = roiMetrics.percentageROI;
      if (!isNaN(projectROI) && isFinite(projectROI)) {
        allROIs.push(projectROI);
        projectROIs.push({
          projectId: project.id,
          title: project.title,
          roi: projectROI,
          monetaryValue: roiMetrics.totalMonetaryValue,
          investment: roiMetrics.totalInvestment
        });
      }

      // Aggregate by dimension
      Object.entries(roiMetrics.dimensionBreakdown).forEach(([dimension, data]) => {
        if (!dimensionData[dimension]) {
          dimensionData[dimension] = { count: 0, totalValue: 0, totalInvestment: 0, rois: [] };
        }
        dimensionData[dimension].count++;
        dimensionData[dimension].totalValue += data.totalValue;
        dimensionData[dimension].totalInvestment += data.totalInvestment;
        if (data.roi && !isNaN(data.roi) && isFinite(data.roi)) {
          dimensionData[dimension].rois.push(data.roi);
        }
      });
    });

    // Calculate ROI distribution
    const roiDistribution = {
      negative: allROIs.filter(r => r < 0).length,
      low: allROIs.filter(r => r >= 0 && r < 50).length,
      medium: allROIs.filter(r => r >= 50 && r < 200).length,
      high: allROIs.filter(r => r >= 200 && r < 500).length,
      veryHigh: allROIs.filter(r => r >= 500).length
    };

    // Calculate dimension averages
    const dimensionBreakdown: Record<string, { count: number; totalValue: number; totalInvestment: number; averageROI: number }> = {};
    Object.entries(dimensionData).forEach(([dimension, data]) => {
      dimensionBreakdown[dimension] = {
        count: data.count,
        totalValue: data.totalValue,
        totalInvestment: data.totalInvestment,
        averageROI: data.rois.length > 0 ? data.rois.reduce((a, b) => a + b, 0) / data.rois.length : 0
      };
    });

    // Get top performers
    const topPerformers = projectROIs
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 5);

    // Generate insights
    const insights: string[] = [];
    const recommendations: string[] = [];

    if (allROIs.length > 0) {
      const avgROI = allROIs.reduce((a, b) => a + b, 0) / allROIs.length;
      const medianROI = allROIs.sort((a, b) => a - b)[Math.floor(allROIs.length / 2)];

      if (avgROI > 100) {
        insights.push(`Genomsnittlig ROI är ${avgROI.toFixed(1)}% - mycket stark prestanda`);
      } else if (avgROI > 0) {
        insights.push(`Genomsnittlig ROI är ${avgROI.toFixed(1)}% - positiv avkastning`);
      } else {
        insights.push(`Genomsnittlig ROI är ${avgROI.toFixed(1)}% - behöver förbättring`);
      }

      if (roiDistribution.negative > allROIs.length * 0.3) {
        recommendations.push('Många projekt har negativ ROI - överväg kvalitativa fördelar');
      }

      if (totalQualitativeValue > totalMonetaryValue) {
        insights.push('Kvalitativa effekter dominerar - fokus på mätbara resultat kan förbättra ROI');
      }
    }

    return {
      totalProjects: projects.length,
      projectsWithEffects: projectsWithEffects.length,
      totalInvestment,
      totalMonetaryValue,
      totalQualitativeValue,
      averageROI: allROIs.length > 0 ? allROIs.reduce((a, b) => a + b, 0) / allROIs.length : 0,
      medianROI: allROIs.length > 0 ? allROIs.sort((a, b) => a - b)[Math.floor(allROIs.length / 2)] : 0,
      roiDistribution,
      dimensionBreakdown,
      topPerformers,
      insights,
      recommendations
    };
  };

  const data = analyzeROI();

  // Chart functionality temporarily disabled to fix ResponsiveContainer issues
  // useEffect(() => {
  //   const createChart = async () => {
  //     if (!chartRef.current || data.projectsWithEffects === 0) return;
  //     // Chart creation logic will be re-enabled later
  //   };
  //   createChart();
  //   return () => {
  //     if (chartInstance.current) {
  //       chartInstance.current.destroy();
  //     }
  //   };
  // }, [data]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (data.projectsWithEffects === 0) {
    return (
      <div className="bg-[#1E3A4A] rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-[#FFD600] mb-4">Avancerad ROI-analys</h2>
        <div className="text-gray-300">
          <p>Inga projekt med effektdata hittades.</p>
          <p className="mt-2">För att se ROI-analys, lägg till effektdata i projekten.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1E3A4A] rounded-lg p-6 mb-8">
      <h2 className="text-xl font-bold text-[#FFD600] mb-6">Avancerad ROI-analys</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#121F2B] p-4 rounded-lg">
          <div className="text-sm text-gray-400">Total investering</div>
          <div className="text-xl font-bold text-white">{formatCurrency(data.totalInvestment)}</div>
        </div>
        <div className="bg-[#121F2B] p-4 rounded-lg">
          <div className="text-sm text-gray-400">Total monetär effekt</div>
          <div className="text-xl font-bold text-white">{formatCurrency(data.totalMonetaryValue)}</div>
        </div>
        <div className="bg-[#121F2B] p-4 rounded-lg">
          <div className="text-sm text-gray-400">Genomsnittlig ROI</div>
          <div className="text-xl font-bold text-white">{data.averageROI.toFixed(1)}%</div>
        </div>
        <div className="bg-[#121F2B] p-4 rounded-lg">
          <div className="text-sm text-gray-400">Projekt med effekter</div>
          <div className="text-xl font-bold text-white">{data.projectsWithEffects}/{data.totalProjects}</div>
        </div>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* ROI Distribution Chart */}
        <div className="bg-[#121F2B] p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">ROI-fördelning</h3>
          <div className="h-[300px] flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-lg mb-2">Chart temporarily disabled</div>
              <div className="text-sm">ROI distribution visualization will be restored soon</div>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-[#121F2B] p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Topp 5 ROI-projekt</h3>
          <div className="space-y-2">
            {data.topPerformers.map((project, index) => (
              <div key={project.projectId} className="flex justify-between items-center p-2 bg-[#1E3A4A] rounded">
                <div>
                  <div className="font-medium text-white">{index + 1}. {project.title}</div>
                  <div className="text-sm text-gray-400">{formatCurrency(project.investment)} investering</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-400">{project.roi.toFixed(1)}%</div>
                  <div className="text-sm text-gray-400">{formatCurrency(project.monetaryValue)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dimension Breakdown */}
      <div className="bg-[#121F2B] p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">ROI per värdedimension</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(data.dimensionBreakdown).map(([dimension, stats]) => (
            <div key={dimension} className="p-3 bg-[#1E3A4A] rounded">
              <div className="font-medium text-white">{dimension}</div>
              <div className="text-sm text-gray-400">
                {stats.count} projekt • {formatCurrency(stats.totalValue)} totalt värde
              </div>
              <div className="text-lg font-bold text-green-400">
                {stats.averageROI.toFixed(1)}% genomsnittlig ROI
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#121F2B] p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-[#FFD600] mb-3">Insikter</h3>
          <ul className="space-y-2">
            {data.insights.map((insight, index) => (
              <li key={index} className="text-white text-sm flex items-start">
                <span className="text-[#FFD600] mr-2">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#121F2B] p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-[#FFD600] mb-3">Rekommendationer</h3>
          <ul className="space-y-2">
            {data.recommendations.map((rec, index) => (
              <li key={index} className="text-white text-sm flex items-start">
                <span className="text-[#FFD600] mr-2">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 
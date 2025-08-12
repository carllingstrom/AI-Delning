'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProjectScoreBar from '@/components/ProjectScoreBar';
import { calculateProjectScore } from '@/lib/projectScore';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface AnalyticsData {
  summary: {
    totalProjects: number;
    totalBudget: number;
    averageBudget: number;
    totalROI: number;
    averageROI: number;
    averageSharingScore: number;
    // New comprehensive metrics
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

interface Project {
  id: string;
  title: string;
  intro: string;
  phase: string;
  areas: string[];
  value_dimensions: string[];
  project_municipalities: Array<{
    municipalities: {
      name: string;
      county: string;
    };
  }>;
  calculatedMetrics?: {
    budget: number | null;
    actualCost: number;
    roi: number | null;
    affectedGroups: string[];
    technologies: string[];
  };
}

export default function ProjectsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'insights'>('overview');
  const [filters, setFilters] = useState({
    phase: '',
    county: '',
    area: '',
    valueDimension: '',
    minBudget: '',
    maxBudget: '',
    hasROI: '',
    search: '',
    scoreLevel: ''
  });
  // Automatically refetch when filters change
  useEffect(() => {
    fetchData(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Lightweight chart helpers (matching analytics theme)
  const createBarChart = (data: Record<string, number>, title: string, color: string = '#fecb00') => {
    const values = Object.values(data);
    if (!values.length) return null;
    const maxValue = Math.max(...values);
    return (
      <div className="p-6 rounded-lg border border-gray-700 bg-transparent">
        <h3 className="text-xl font-bold text-[#fecb00] mb-4">{title}</h3>
        <div className="space-y-3">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-3">
              <div className="w-32 text-sm text-gray-300 truncate">{key}</div>
              <div className="flex-1 bg-gray-800 rounded-full h-4">
                <div 
                  className="h-4 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%`,
                    backgroundColor: color
                  }}
                />
              </div>
              <div className="w-20 text-right text-sm font-semibold text-[#fecb00]">
                {Number.isFinite(value) ? value.toFixed(1) : value}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const createPieChart = (data: Record<string, number>, title: string) => {
    const entries = Object.entries(data);
    if (!entries.length) return null;
    const sorted = entries.sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0));
    const total = sorted.reduce((sum, [, val]) => sum + (Number(val) || 0), 0);
    if (total <= 0) return null;
    const colors = [
      '#fecb00','#007399','#004d66','#34af8f','#ff153b','#224556','#f4f2e6','#fffefa',
      '#fecb00','#007399','#004d66','#34af8f','#ff153b','#224556','#f4f2e6','#fffefa'
    ];
    return (
      <div className="p-6 rounded-lg border border-gray-700 bg-transparent">
        <h3 className="text-xl font-bold text-[#fecb00] mb-4">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative w-48 h-48 mx-auto">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {sorted.map(([key, value], index) => {
                const portion = (Number(value) || 0) / total;
                const startAngle = index === 0 ? 0 : sorted.slice(0, index).reduce((sum, [, v]) => sum + ((Number(v) || 0) / total) * 360, 0);
                const endAngle = startAngle + portion * 360;
                const x1 = 50 + 40 * Math.cos(startAngle * Math.PI / 180);
                const y1 = 50 + 40 * Math.sin(startAngle * Math.PI / 180);
                const x2 = 50 + 40 * Math.cos(endAngle * Math.PI / 180);
                const y2 = 50 + 40 * Math.sin(endAngle * Math.PI / 180);
                const largeArcFlag = portion > 0.5 ? 1 : 0;
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
            {sorted.map(([key, value], index) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-block w-3 h-3 rounded"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-sm text-[#fffefa] truncate">{key}</span>
                </div>
                <div className="text-sm text-[#fecb00] font-semibold ml-3 whitespace-nowrap">
                  {Number(value)} ({((Number(value) / total) * 100).toFixed(1)}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Generic text normalization (no hardcoded terms)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/å/g, 'a')
      .replace(/ä/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  // Enhanced Levenshtein with better handling of insertions/deletions
  const advancedLevenshtein = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + cost, // substitution
          matrix[j][i - 1] + 1,        // insertion
          matrix[j - 1][i] + 1         // deletion
        );
        
        // Transposition (Damerau-Levenshtein improvement)
        if (i > 1 && j > 1 && 
            str1[i - 1] === str2[j - 2] && 
            str1[i - 2] === str2[j - 1]) {
          matrix[j][i] = Math.min(matrix[j][i], matrix[j - 2][i - 2] + cost);
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // Generic compound word analysis
  const analyzeWordBoundaries = (query: string, target: string): number => {
    const normalizedQuery = normalizeText(query);
    const normalizedTarget = normalizeText(target);
    
    // Direct substring match
    if (normalizedTarget.includes(normalizedQuery) || normalizedQuery.includes(normalizedTarget)) {
      return 0.95;
    }
    
    const queryWords = normalizedQuery.split(/\s+/);
    const targetWords = normalizedTarget.split(/\s+/);
    
    let bestScore = 0;
    
    // Try combining adjacent words in target to match query
    if (queryWords.length === 1 && targetWords.length > 1) {
      for (let i = 0; i < targetWords.length - 1; i++) {
        const combined = targetWords[i] + targetWords[i + 1];
        const similarity = 1 - (advancedLevenshtein(normalizedQuery, combined) / Math.max(normalizedQuery.length, combined.length));
        bestScore = Math.max(bestScore, similarity);
        
        // Also try with minimal space
        const combinedWithSpace = targetWords[i] + ' ' + targetWords[i + 1];
        const spaceSimilarity = 1 - (advancedLevenshtein(normalizedQuery, combinedWithSpace) / Math.max(normalizedQuery.length, combinedWithSpace.length));
        bestScore = Math.max(bestScore, spaceSimilarity);
      }
    }
    
    // Try splitting query to match multiple target words
    if (targetWords.length === 1 && queryWords.length > 1) {
      const combinedQuery = queryWords.join('');
      const similarity = 1 - (advancedLevenshtein(combinedQuery, normalizedTarget) / Math.max(combinedQuery.length, normalizedTarget.length));
      bestScore = Math.max(bestScore, similarity);
    }
    
    // Cross-word partial matching for compound scenarios
    for (const queryWord of queryWords) {
      for (const targetWord of targetWords) {
        if (queryWord.length >= 4 && targetWord.length >= 4) {
          // Check prefix/suffix overlap
          const prefixOverlap = Math.max(
            getLongestCommonPrefix(queryWord, targetWord).length,
            getLongestCommonSuffix(queryWord, targetWord).length
          );
          
          if (prefixOverlap >= 3) {
            const overlapScore = prefixOverlap / Math.max(queryWord.length, targetWord.length);
            bestScore = Math.max(bestScore, overlapScore * 0.8);
          }
        }
      }
    }
    
    return bestScore;
  };

  // Helper functions for prefix/suffix analysis
  const getLongestCommonPrefix = (str1: string, str2: string): string => {
    let i = 0;
    while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
      i++;
    }
    return str1.substring(0, i);
  };

  const getLongestCommonSuffix = (str1: string, str2: string): string => {
    let i = 0;
    while (i < str1.length && i < str2.length && 
           str1[str1.length - 1 - i] === str2[str2.length - 1 - i]) {
      i++;
    }
    return str1.substring(str1.length - i);
  };

  const calculateSimilarity = (query: string, text: string): number => {
    if (!query || !text) return 0;
    
    const normalizedQuery = normalizeText(query);
    const normalizedText = normalizeText(text);
    
    // Exact match gets highest score
    if (normalizedText.includes(normalizedQuery)) return 1.0;
    
    // Check compound word scenarios
    const compoundScore = analyzeWordBoundaries(query, text);
    if (compoundScore > 0.75) return compoundScore;
    
    // Split into words for word-level matching
    const queryWords = normalizedQuery.split(/\s+/);
    const textWords = normalizedText.split(/\s+/);
    
    let totalScore = 0;
    let maxPossibleScore = queryWords.length;
    
    for (const queryWord of queryWords) {
      let bestWordScore = 0;
      
      for (const textWord of textWords) {
        // Substring match
        if (textWord.includes(queryWord) || queryWord.includes(textWord)) {
          const substringScore = Math.min(queryWord.length, textWord.length) / Math.max(queryWord.length, textWord.length);
          if (substringScore > 0.6) {
            bestWordScore = Math.max(bestWordScore, substringScore * 0.9);
            continue;
          }
        }
        
        // Advanced fuzzy character-level matching
        const distance = advancedLevenshtein(queryWord, textWord);
        const maxLength = Math.max(queryWord.length, textWord.length);
        
        if (maxLength === 0) continue;
        
        const similarity = 1 - (distance / maxLength);
        
        // Dynamic threshold based on word length
        const threshold = Math.max(0.7, 1 - (2 / Math.max(queryWord.length, textWord.length)));
        
        if (similarity > threshold) {
          bestWordScore = Math.max(bestWordScore, similarity * 0.8);
        }
      }
      
      totalScore += bestWordScore;
    }
    
    return Math.max(totalScore / maxPossibleScore, compoundScore);
  };

  const enhancedFuzzyMatch = (query: string, target: string): boolean => {
    const similarity = calculateSimilarity(query, target);
    
    // Dynamic threshold based on query length and complexity
    let threshold = 0.6;
    
    // Shorter queries need higher precision
    if (query.length <= 3) threshold = 0.8;
    else if (query.length <= 6) threshold = 0.7;
    
    // Multiple words can be more forgiving
    if (query.split(/\s+/).length > 1) threshold -= 0.1;
    
    return similarity > threshold;
  };

  const fuzzySearchProjects = (projectsData: Project[], searchQuery: string): Project[] => {
    if (!searchQuery.trim()) return projectsData;
    
    const normalizedQuery = searchQuery.toLowerCase().trim();
    
    const scoredProjects = projectsData.map(project => {
      let hasMatch = false;
      let bestScore = 0;
      
      // Check for direct matches first (highest priority)
      const allText = [
        project.title,
        project.intro || '',
        ...(project.areas || []),
        ...(project.value_dimensions || []),
        ...(project.calculatedMetrics?.technologies || []),
        ...(project.project_municipalities?.map(pm => pm.municipalities?.name || '') || []),
        ...(project.project_municipalities?.map(pm => pm.municipalities?.county || '') || [])
      ].join(' ').toLowerCase();
      
      // Direct substring match (highest priority)
      if (allText.includes(normalizedQuery)) {
        hasMatch = true;
        bestScore = Math.max(bestScore, 0.9);
      }
      
      // Check individual fields for direct matches
      if (project.title.toLowerCase().includes(normalizedQuery)) {
        hasMatch = true;
        bestScore = Math.max(bestScore, 0.95);
      }
      
      if (project.intro && project.intro.toLowerCase().includes(normalizedQuery)) {
        hasMatch = true;
        bestScore = Math.max(bestScore, 0.8);
      }
      
      // Check municipalities
      if (project.project_municipalities) {
        for (const pm of project.project_municipalities) {
          const municipalityName = pm.municipalities?.name?.toLowerCase() || '';
          const countyName = pm.municipalities?.county?.toLowerCase() || '';
          
          if (municipalityName.includes(normalizedQuery) || countyName.includes(normalizedQuery)) {
            hasMatch = true;
            bestScore = Math.max(bestScore, 0.85);
            break;
          }
        }
      }
      
      // Check areas
      if (project.areas) {
        for (const area of project.areas) {
          if (area.toLowerCase().includes(normalizedQuery)) {
            hasMatch = true;
            bestScore = Math.max(bestScore, 0.8);
            break;
          }
        }
      }
      
      // Check value dimensions
      if (project.value_dimensions) {
        for (const dimension of project.value_dimensions) {
          if (dimension.toLowerCase().includes(normalizedQuery)) {
            hasMatch = true;
            bestScore = Math.max(bestScore, 0.75);
            break;
          }
        }
      }
      
      // Check technologies
      if (project.calculatedMetrics?.technologies) {
        for (const tech of project.calculatedMetrics.technologies) {
          if (tech.toLowerCase().includes(normalizedQuery)) {
            hasMatch = true;
            bestScore = Math.max(bestScore, 0.7);
            break;
          }
        }
      }
      
      // If no direct matches, try fuzzy matching with stricter thresholds
      if (!hasMatch) {
        const titleScore = calculateSimilarity(normalizedQuery, project.title.toLowerCase()) * 2;
        const introScore = calculateSimilarity(normalizedQuery, (project.intro || '').toLowerCase()) * 1.5;
        
        const municipalityScore = project.project_municipalities ? 
          Math.max(...project.project_municipalities.map(pm => 
            calculateSimilarity(normalizedQuery, (pm.municipalities?.name || '').toLowerCase())
          )) * 0.8 : 0;
        
        const areaScore = project.areas ? 
          Math.max(...project.areas.map(area => 
            calculateSimilarity(normalizedQuery, area.toLowerCase())
          )) : 0;
        
        const valueDimensionScore = project.value_dimensions ? 
          Math.max(...project.value_dimensions.map(dimension => 
            calculateSimilarity(normalizedQuery, dimension.toLowerCase())
          )) * 0.8 : 0;
        
        const techScore = project.calculatedMetrics?.technologies ? 
          Math.max(...project.calculatedMetrics.technologies.map(tech => 
            calculateSimilarity(normalizedQuery, tech.toLowerCase())
          )) * 0.6 : 0;
        
        bestScore = Math.max(titleScore, introScore, municipalityScore, areaScore, valueDimensionScore, techScore);
        
        // Only include if fuzzy match is very good (0.6+ threshold)
        if (bestScore >= 0.6) {
          hasMatch = true;
        }
      }
      
      return {
        project,
        score: bestScore,
        hasMatch
      };
    });
    
    // Only return projects that have matches and meet the score threshold
    return scoredProjects
      .filter(item => item.hasMatch && item.score >= 0.6)
      .sort((a, b) => b.score - a.score)
      .map(item => item.project);
  };

  const fuzzyMatchString = (query: string, target: string): boolean => {
    return calculateSimilarity(query, target) > 0.7; // Tighter threshold
  };

  // Swedish-specific fuzzy matching improvements
  const normalizeSwedishText = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/å/g, 'a')
      .replace(/ä/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/artificial intelligence/g, 'ai')
      .replace(/maskininlärning/g, 'ai')
      .replace(/artificiell intelligens/g, 'ai')
      .replace(/kommun/g, 'kommun')
      .replace(/digitalisering/g, 'digital')
      .replace(/automation/g, 'auto')
      .replace(/medborgar/g, 'medborgare')
      // Handle common chatbot misspellings and variations
      .replace(/chat\s*bo[ot]t?s?/g, 'chatbot')
      .replace(/chat\s*boot/g, 'chatbot')
      .replace(/chattbot/g, 'chatbot')
      .replace(/chatbott/g, 'chatbot')
      .replace(/chatt\s*bot/g, 'chatbot')
      .trim();
  };

  // Enhanced matching for compound words and common misspellings
  const checkCompoundWordMatch = (query: string, target: string): boolean => {
    const normalizedQuery = normalizeSwedishText(query);
    const normalizedTarget = normalizeSwedishText(target);
    
    // Direct match after normalization
    if (normalizedTarget.includes(normalizedQuery)) return true;
    
    // Handle compound word splitting (e.g., "chatbott" vs "chat boot")
    const queryWords = normalizedQuery.split(/\s+/);
    const targetWords = normalizedTarget.split(/\s+/);
    
    // Check if query could be a compound version of separate words in target
    if (queryWords.length === 1 && targetWords.length > 1) {
      const combinedTarget = targetWords.join('');
      if (calculateSimilarity(normalizedQuery, combinedTarget) > 0.75) return true;
      
      // Check if query matches start of consecutive words
      for (let i = 0; i < targetWords.length - 1; i++) {
        const combined = targetWords[i] + targetWords[i + 1];
        if (calculateSimilarity(normalizedQuery, combined) > 0.75) return true;
      }
    }
    
    // Check if target could be a compound version of separate words in query
    if (targetWords.length === 1 && queryWords.length > 1) {
      const combinedQuery = queryWords.join('');
      if (calculateSimilarity(combinedQuery, normalizedTarget) > 0.75) return true;
    }
    
    // Check for partial word matches in compound scenarios
    for (const queryWord of queryWords) {
      for (const targetWord of targetWords) {
        if (queryWord.length > 3 && targetWord.length > 3) {
          // Check if one word contains most of the other
          if (queryWord.includes(targetWord.substring(0, Math.min(targetWord.length, 4))) ||
              targetWord.includes(queryWord.substring(0, Math.min(queryWord.length, 4)))) {
            return true;
          }
        }
      }
    }
    
    return false;
  };

  // Initial data fetch on component mount
  useEffect(() => {
    fetchData();
  }, []); // Remove filters dependency

  const fetchData = async (searchFilters?: typeof filters) => {
    const filtersToUse = searchFilters || filters;
    setSearching(true);
    
    try {
      // Fetch analytics data
      const analyticsParams = new URLSearchParams();
      Object.entries(filtersToUse).forEach(([key, value]) => {
        if (value && key !== 'search') analyticsParams.append(key, value);
      });

      const [analyticsResponse, projectsResponse] = await Promise.all([
        fetch(`/api/analytics?${analyticsParams}`),
        fetch('/api/projects')
      ]);

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        if (!analyticsData.error && analyticsData.summary) {
          setAnalytics(analyticsData);
        }
      }

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        let filteredProjects = projectsData;
        
        // Apply client-side filtering
        if (filtersToUse.search) {
          filteredProjects = fuzzySearchProjects(projectsData, filtersToUse.search);
        }

        if (filtersToUse.phase) {
          filteredProjects = filteredProjects.filter((project: Project) =>
            project.phase === filtersToUse.phase ||
            enhancedFuzzyMatch(filtersToUse.phase, project.phase || '') ||
            enhancedFuzzyMatch(filtersToUse.phase, getPhaseLabel(project.phase || ''))
          );
        }

        if (filtersToUse.area) {
          filteredProjects = filteredProjects.filter((project: Project) =>
            project.areas && project.areas.some(area =>
              area === filtersToUse.area ||
              enhancedFuzzyMatch(filtersToUse.area, area)
            )
          );
        }

        if (filtersToUse.valueDimension) {
          filteredProjects = filteredProjects.filter((project: Project) =>
            project.value_dimensions && project.value_dimensions.some(dimension =>
              dimension === filtersToUse.valueDimension ||
              enhancedFuzzyMatch(filtersToUse.valueDimension, dimension)
            )
          );
        }

        if (filtersToUse.county) {
          filteredProjects = filteredProjects.filter((project: Project) =>
            project.project_municipalities && project.project_municipalities.some(pm =>
              pm.municipalities?.county === filtersToUse.county ||
              enhancedFuzzyMatch(filtersToUse.county, pm.municipalities?.county || '')
            )
          );
        }

        if (filtersToUse.minBudget) {
          const minBudget = parseFloat(filtersToUse.minBudget);
          filteredProjects = filteredProjects.filter((project: Project) =>
            project.calculatedMetrics?.budget && project.calculatedMetrics.budget >= minBudget
          );
        }

        if (filtersToUse.maxBudget) {
          const maxBudget = parseFloat(filtersToUse.maxBudget);
          filteredProjects = filteredProjects.filter((project: Project) =>
            project.calculatedMetrics?.budget && project.calculatedMetrics.budget <= maxBudget
          );
        }

        if (filtersToUse.hasROI === 'true') {
          filteredProjects = filteredProjects.filter((project: Project) => {
            const roi = project.calculatedMetrics?.roi;
            return roi !== null && roi !== undefined && roi > 0;
          });
        }

        if (filtersToUse.scoreLevel) {
          filteredProjects = filteredProjects.filter((project: Project) => {
            const score = calculateProjectScore(project);
            return score.level === filtersToUse.scoreLevel;
          });
        }
        
        // Default sorting: sharing score (higher first)
        filteredProjects.sort((a: Project, b: Project) => {
          const scoreA = calculateProjectScore(a);
          const scoreB = calculateProjectScore(b);
          return scoreB.percentage - scoreA.percentage;
        });
        
        setProjects(filteredProjects);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleSearch = () => {
    fetchData(filters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      phase: '', county: '', area: '', valueDimension: '',
      minBudget: '', maxBudget: '', hasROI: '', search: '', scoreLevel: ''
    };
    setFilters(clearedFilters);
    fetchData(clearedFilters);
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'idea': return 'bg-blue-500';
      case 'pilot': return 'bg-orange-500';
      case 'implemented': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'idea': return 'Idé';
      case 'pilot': return 'Pilot';
      case 'implemented': return 'Implementerat';
      default: return phase;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121F2B] text-[#fffefa]">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-xl mb-4 text-[#fecb00]">Laddar projektportalen...</div>
            <div className="w-8 h-8 border-2 border-[#fecb00] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121F2B] min-h-screen text-[#fffefa]">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-[#fecb00] mb-2">Projektportalen</h1>
              <p className="text-gray-300">Översikt och analys av AI-projekt</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/projects/new')}
                className="px-4 py-2 rounded bg-[#fecb00] text-[#121F2B] font-semibold hover:bg-[#fecb00]"
              >
                + Lägg till projekt
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex w-full space-x-1 bg-[#0e1722] border border-gray-700 rounded-lg p-1 mt-6 overflow-hidden">
          {[
            { key: 'overview', label: 'Översikt', icon: 'chart' },
            { key: 'projects', label: 'Projekt', icon: 'folder' },
            { key: 'insights', label: 'Analys', icon: 'search' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-md font-medium transition-all duration-300 ${
                activeTab === tab.key
                  ? 'bg-[#fecb00] text-[#121F2B]'
                  : 'text-gray-300 hover:text-[#fffefa] hover:bg-[#1a2a36]'
              } ${activeTab === tab.key ? 'basis-1/2' : 'basis-1/4'}`}
            >
              {tab.icon === 'chart' && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              )}
              {tab.icon === 'folder' && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
              )}
              {tab.icon === 'search' && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              )}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {analytics ? (
              <>
                {/* Key Metrics Section */}
                <div className="p-8 rounded-lg border border-gray-700">
                  <h2 className="text-2xl font-bold text-[#fecb00] mb-6">Översikt</h2>
                  
                  {/* Primary metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="border border-gray-700 p-4 rounded-lg text-center bg-transparent">
                      <div className="text-2xl font-bold text-[#fecb00] mb-1">
                        {Number(analytics?.summary?.totalProjects) || 0}
                      </div>
                      <div className="text-gray-400 text-sm">Totalt projekt</div>
                    </div>
                    
                    <div className="border border-gray-700 p-4 rounded-lg text-center bg-transparent">
                      <div className="text-2xl font-bold mb-1" style={{
                        color: (() => {
                          const score = Number(analytics?.summary?.averageSharingScore) || 0;
                          if (score >= 80) return '#10B981'; // green-500
                          if (score >= 60) return '#F59E0B'; // amber-500  
                          if (score >= 40) return '#EF4444'; // red-500
                          return '#6B7280'; // gray-500
                        })()
                      }}>
                        {Number(analytics?.summary?.averageSharingScore) || 0}%
                      </div>
                      <div className="text-gray-400 text-sm">Ø Delningspoäng</div>
                    </div>
                    
                    <div className="border border-gray-700 p-4 rounded-lg text-center bg-transparent">
                      <div className="text-2xl font-bold text-[#fecb00] mb-1">
                        {formatPercentage(Number(analytics?.summary?.averageROI) || 0)}
                      </div>
                      <div className="text-gray-400 text-sm">Ø ROI</div>
                    </div>

                    <div className="border border-gray-700 p-4 rounded-lg text-center bg-transparent">
                      <div className="text-2xl font-bold text-[#fecb00] mb-1">
                        {formatCurrency(Number(analytics?.summary?.totalMonetaryValue) || 0)}
                      </div>
                      <div className="text-gray-400 text-sm">Total nytta</div>
                    </div>
                  </div>

                  {/* Budget & Cost metrics */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-[#fffefa] mb-4">Budget & Kostnader</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="border border-gray-700 p-4 rounded-lg text-center bg-transparent">
                        <div className="text-xl font-bold text-[#fecb00] mb-1">
                          {formatCurrency(Number(analytics?.summary?.averageBudget) || 0)}
                        </div>
                        <div className="text-gray-400 text-sm">Ø Budget/projekt</div>
                      </div>

                      <div className="border border-gray-700 p-4 rounded-lg text-center bg-transparent">
                        <div className="text-xl font-bold text-[#fecb00] mb-1">
                          {formatCurrency(Number(analytics?.summary?.averageActualCost) || 0)}
                        </div>
                        <div className="text-gray-400 text-sm">Ø Faktisk kostnad</div>
                      </div>

                      <div className="border border-gray-700 p-4 rounded-lg text-center bg-transparent">
                        <div className="text-xl font-bold mb-1" style={{
                          color: (() => {
                            const usage = Number(analytics?.summary?.averageBudgetUsage) || 0;
                            if (usage <= 100) return '#10B981'; // green-500 - inom budget
                            if (usage <= 120) return '#F59E0B'; // amber-500 - lätt överskriden
                            return '#EF4444'; // red-500 - kraftigt överskriden
                          })()
                        }}>
                          {Number(analytics?.summary?.averageBudgetUsage).toFixed(1) || 0}%
                        </div>
                        <div className="text-gray-400 text-sm">Ø Budgetanvändning</div>
                      </div>

                      <div className="border border-gray-700 p-4 rounded-lg text-center bg-transparent">
                        <div className="text-xl font-bold text-[#fecb00] mb-1">
                          {analytics?.summary?.projectsWithCostData?.count || 0} / {analytics?.summary?.totalProjects || 0}
                        </div>
                        <div className="text-gray-400 text-sm">Projekt med kostnadsdata</div>
                        <div className="text-xs text-gray-500 mt-1">
                          ({Number(analytics?.summary?.projectsWithCostData?.percentage).toFixed(1) || 0}%)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Effects & Value metrics */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-[#fffefa] mb-4">Effekter & Värde</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="border border-gray-700 p-4 rounded-lg text-center bg-transparent">
                        <div className="text-xl font-bold text-[#fecb00] mb-1">
                          {Number(analytics?.summary?.averageEffectsCount).toFixed(1) || 0}
                        </div>
                        <div className="text-gray-400 text-sm">Ø Effekter/projekt</div>
                      </div>

                      <div className="border border-gray-700 p-4 rounded-lg text-center bg-transparent">
                        <div className="text-xl font-bold text-[#fecb00] mb-1">
                          {formatCurrency(Number(analytics?.summary?.averageEffectsValue) || 0)}
                        </div>
                        <div className="text-gray-400 text-sm">Ø Effektvärde/projekt</div>
                      </div>

                      <div className="border border-gray-700 p-4 rounded-lg text-center bg-transparent">
                        <div className="text-xl font-bold text-[#fecb00] mb-1">
                          {analytics?.summary?.projectsWithQuantifiableEffects?.count || 0} / {analytics?.summary?.totalProjects || 0}
                        </div>
                        <div className="text-gray-400 text-sm">Kvantifierbara effekter</div>
                        <div className="text-xs text-gray-500 mt-1">
                          ({Number(analytics?.summary?.projectsWithQuantifiableEffects?.percentage).toFixed(1) || 0}%)
                        </div>
                      </div>

                      <div className="border border-gray-700 p-4 rounded-lg text-center bg-transparent">
                        <div className="text-xl font-bold text-[#fecb00] mb-1">
                          {analytics?.summary?.projectsWithEffectData?.count || 0} / {analytics?.summary?.totalProjects || 0}
                        </div>
                        <div className="text-gray-400 text-sm">Projekt med effektdata</div>
                        <div className="text-xs text-gray-500 mt-1">
                          ({Number(analytics?.summary?.projectsWithEffectData?.percentage).toFixed(1) || 0}%)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Technology & Impact metrics */}
                  <div>
                    <h3 className="text-xl font-bold text-[#fffefa] mb-4">Teknologi & Påverkan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="border border-gray-700 p-4 rounded-lg text-center bg-transparent">
                        <div className="text-xl font-bold text-[#fecb00] mb-1">
                          {Number(analytics?.summary?.averageTechnologies).toFixed(1) || 0}
                        </div>
                        <div className="text-gray-400 text-sm">Ø Tekniker/projekt</div>
                      </div>

                      <div className="border border-gray-700 p-4 rounded-lg text-center bg-transparent">
                        <div className="text-xl font-bold text-[#fecb00] mb-1">
                          {Number(analytics?.summary?.averageAffectedGroups).toFixed(1) || 0}
                        </div>
                        <div className="text-gray-400 text-sm">Ø Målgrupper/projekt</div>
                      </div>

                      <div className="border border-gray-700 p-4 rounded-lg text-center bg-transparent">
                        <div className="text-xl font-bold text-[#fecb00] mb-1">
                          {formatCurrency(Number(analytics?.summary?.totalBudget) || 0)}
                        </div>
                        <div className="text-gray-400 text-sm">Total projektbudget</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Note about detailed analysis moved */}
                <div className="p-6 rounded-lg border border-gray-700 text-sm text-gray-300">
                  För djupare insikter om kostnader, effekter, teknologier och fördelning – öppna fliken <span className="text-[#fecb00] font-semibold">Analys</span>.
                </div>
              </>
            ) : (
              <div className="p-8 rounded-lg border border-gray-700 text-center">
                <h3 className="text-xl font-bold text-[#fecb00] mb-4">Laddar översiktsdata...</h3>
                <p className="text-gray-300 mb-6">Samlar projektstatistik och analysdata</p>
                <div className="animate-pulse">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-gray-800 h-24 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Filters Section - Only show in projects tab */}
            <div className="p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold text-[#fecb00] mb-4">Filter & Sök</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="md:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium mb-2">Sök projekt</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => {
                        setFilters({...filters, search: e.target.value});
                        // Auto-search after 500ms delay
                        clearTimeout((window as any).searchTimeout);
                        (window as any).searchTimeout = setTimeout(() => {
                          if (e.target.value.trim()) {
                            handleSearch();
                          }
                        }, 500);
                      }}
                      className="w-full p-2 pr-10 bg-[#0e1722] border border-gray-700 rounded text-[#fffefa]"
                      placeholder="Sök på titel, beskrivning, kommun..."
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                      onClick={handleSearch}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#fecb00]"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Projektfas</label>
                  <select
                    value={filters.phase}
                    onChange={(e) => {
                      setFilters({...filters, phase: e.target.value});
                      // Auto-search when filter changes
                      setTimeout(() => handleSearch(), 100);
                    }}
                    className="w-full p-2 bg-[#0e1722] border border-gray-700 rounded text-[#fffefa]"
                  >
                    <option value="">Alla faser</option>
                    <option value="idea">Idé</option>
                    <option value="pilot">Pilot</option>
                    <option value="implemented">Implementerat</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Område</label>
                  <select
                    value={filters.area}
                    onChange={(e) => {
                      setFilters({...filters, area: e.target.value});
                      // Auto-search when filter changes
                      setTimeout(() => handleSearch(), 100);
                    }}
                    className="w-full p-2 bg-[#0e1722] border border-gray-700 rounded text-[#fffefa]"
                  >
                    <option value="">Alla områden</option>
                    <option value="Utbildning och skola">Utbildning och skola</option>
                    <option value="Primärvård & e-hälsa">Primärvård & e-hälsa</option>
                    <option value="Miljö & klimat">Miljö & klimat</option>
                    <option value="Transport & infrastruktur">Transport & infrastruktur</option>
                    <option value="Socialtjänst">Socialtjänst</option>
                    <option value="Äldre- & funktionsstöd">Äldre- & funktionsstöd</option>
                    <option value="Kultur & fritid">Kultur & fritid</option>
                    <option value="Samhällsbyggnad & stadsplanering">Samhällsbyggnad & stadsplanering</option>
                    <option value="Säkerhet & krisberedskap">Säkerhet & krisberedskap</option>
                    <option value="Ledning och styrning">Ledning och styrning</option>
                    <option value="Intern administration">Intern administration</option>
                    <option value="Medborgarservice & kommunikation">Medborgarservice & kommunikation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Värdedimension</label>
                  <select
                    value={filters.valueDimension}
                    onChange={(e) => {
                      setFilters({...filters, valueDimension: e.target.value});
                      // Auto-search when filter changes
                      setTimeout(() => handleSearch(), 100);
                    }}
                    className="w-full p-2 bg-[#0e1722] border border-gray-700 rounded text-[#fffefa]"
                  >
                    <option value="">Alla värdedimensioner</option>
                    <option value="Innovation (nya tjänster)">Innovation (nya tjänster)</option>
                    <option value="Etik, hållbarhet & ansvarsfull AI">Etik, hållbarhet & ansvarsfull AI</option>
                    <option value="Kostnadsbesparing">Kostnadsbesparing</option>
                    <option value="Tidsbesparing">Tidsbesparing</option>
                    <option value="Kvalitet / noggrannhet">Kvalitet / noggrannhet</option>
                    <option value="Medborgarnytta, upplevelse & service">Medborgarnytta, upplevelse & service</option>
                    <option value="Kompetens & lärande">Kompetens & lärande</option>
                    <option value="Riskreduktion & säkerhet">Riskreduktion & säkerhet</option>
                    <option value="Ökade intäkter">Ökade intäkter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Delningspoäng</label>
                  <select
                    value={filters.scoreLevel}
                    onChange={(e) => {
                      setFilters({...filters, scoreLevel: e.target.value});
                      // Auto-search when filter changes
                      setTimeout(() => handleSearch(), 100);
                    }}
                    className="w-full p-2 bg-[#0e1722] border border-gray-700 rounded text-[#fffefa]"
                  >
                    <option value="">Alla nivåer</option>
                    <option value="Exemplarisk">95%+ (Exemplarisk)</option>
                    <option value="Komplett">85-94% (Komplett)</option>
                    <option value="Avancerad">70-84% (Avancerad)</option>
                    <option value="Utvecklad">50-69% (Utvecklad)</option>
                    <option value="Grundläggande">&lt;50% (Grundläggande)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Minsta budget (SEK)</label>
                  <input
                    type="number"
                    value={filters.minBudget}
                    onChange={(e) => {
                      setFilters({...filters, minBudget: e.target.value});
                      // Auto-search when filter changes
                      setTimeout(() => handleSearch(), 100);
                    }}
                    className="w-full p-2 bg-[#0e1722] border border-gray-700 rounded text-[#fffefa]"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Största budget (SEK)</label>
                  <input
                    type="number"
                    value={filters.maxBudget}
                    onChange={(e) => {
                      setFilters({...filters, maxBudget: e.target.value});
                      // Auto-search when filter changes
                      setTimeout(() => handleSearch(), 100);
                    }}
                    className="w-full p-2 bg-[#0e1722] border border-gray-700 rounded text-[#fffefa]"
                    placeholder="∞"
                  />
                </div>



                <div className="flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.hasROI === 'true'}
                      onChange={(e) => {
                        const newHasROI = e.target.checked ? 'true' : '';
                        setFilters({...filters, hasROI: newHasROI});
                        // Auto-search when filter changes
                        setTimeout(() => {
                          fetchData({...filters, hasROI: newHasROI});
                        }, 100);
                      }}
                      className="mr-2"
                    />
                    Endast projekt med positiv ROI
                  </label>
                </div>
              </div>

              {/* Search and Clear buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="px-6 py-2 bg-[#fecb00] text-[#121F2B] font-bold rounded hover:bg-[#fecb00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {searching ? 'Söker...' : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                      <span className="font-bold">Sök projekt</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-[#0e1722] text-[#fffefa] rounded border border-gray-700 hover:bg-[#1a2a36] transition-colors"
                >
                  Rensa filter
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[#fecb00]">
                Projekt ({projects.length})
                {searching && <span className="text-sm font-normal text-gray-400 ml-2">Söker...</span>}
              </h2>
            </div>
            
            {searching ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-[#121F2B] border border-gray-600 p-6 rounded-lg animate-pulse shadow">
                  <div className="h-6 bg-[#1a2a36] rounded mb-3"></div>
                  <div className="h-4 bg-[#1a2a36] rounded mb-2"></div>
                  <div className="h-4 bg-[#1a2a36] rounded mb-4 w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-[#1a2a36] rounded w-1/2"></div>
                      <div className="h-3 bg-[#1a2a36] rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {projects.map((project) => (
                      <div key={project.id} className="bg-[#121F2B] border border-gray-700 p-4 md:p-6 rounded-lg hover:bg-[#1a2a36] transition-colors cursor-pointer group shadow"
                         onClick={() => window.location.href = `/projects/${project.id}`}>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-base md:text-lg font-semibold text-[#fffefa] truncate pr-4 group-hover:text-[#fecb00] transition-colors">{project.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium text-[#fffefa] flex-shrink-0 ${getPhaseColor(project.phase)}`}>
                          {getPhaseLabel(project.phase)}
                        </span>
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-4 line-clamp-3">{project.intro}</p>
                      
                      <div className="space-y-2 text-sm">
                        {project.project_municipalities?.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[#fecb00] font-medium text-xs">Organisation: </span>
                            <span className="text-gray-300 text-xs">
                              {project.project_municipalities.map(pm => pm.municipalities.name).join(', ')}
                            </span>
                          </div>
                        )}
                        
                        {project.areas?.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[#fecb00] font-medium text-xs">Områden: </span>
                            <span className="text-gray-300 text-xs">{project.areas.slice(0, 2).join(', ')}</span>
                            {project.areas.length > 2 && <span className="text-gray-400 text-xs"> +{project.areas.length - 2}</span>}
                          </div>
                        )}
                        
                        {project.calculatedMetrics?.budget && (
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[#fecb00] font-medium text-xs">Budget: </span>
                            <span className="text-gray-300 text-xs">{formatCurrency(Number(project.calculatedMetrics.budget))}</span>
                          </div>
                        )}
                        
                        {project.calculatedMetrics?.roi && (
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[#fecb00] font-medium text-xs">ROI: </span>
                            <span className={`font-semibold text-xs ${project.calculatedMetrics.roi > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatPercentage(project.calculatedMetrics.roi)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <ProjectScoreBar project={project} />
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-2">
                        <span className="text-[#fecb00] hover:text-[#ffe066] font-medium text-sm group-hover:text-[#ffe066] transition-colors">
                          Se detaljer →
                        </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/map?project=${project.id}`;
                            }}
                            className="text-gray-400 hover:text-[#fecb00] text-sm transition-colors"
                          >
                            Visa på karta
                          </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {projects.length === 0 && !searching && (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-lg">Inga projekt matchar dina filter</p>
                    <button
                      onClick={handleClearFilters}
                      className="mt-4 text-[#fecb00] hover:text-[#ffe066] font-medium"
                    >
                      Rensa alla filter
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-8">
            {analytics ? (
              <>
                {/* Cost Analysis Section (moved from Översikt) */}
                <div className="p-8 rounded-lg border border-gray-700">
                  <h2 className="text-2xl font-bold text-[#fecb00] mb-6">Kostnadsanalys</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div>
                      <h3 className="text-xl font-bold text-[#fecb00] mb-4">Kostnadstyper (genomsnitt/projekt)</h3>
                    <div className="space-y-3">
                        {analytics?.costAnalysis?.byCostType && Object.entries(analytics.costAnalysis.byCostType).map(([type, data]) => {
                          const avgCostPerProject = data.count > 0 ? data.totalCost / data.count : 0;
                          return (
                            <div key={type}>
                              <div className="flex justify-between items-center">
                                <span className="text-sm truncate mr-2">{type}</span>
                                <span className="text-[#fecb00] font-semibold">{formatCurrency(avgCostPerProject)}</span>
                          </div>
                              <div className="text-xs text-gray-400">
                                {Number(data.count)} projekt • {formatCurrency(Number(data.totalCost))} totalt
                        </div>
                            </div>
                          );
                        }) || (
                          <div className="text-gray-400 text-sm">Ingen kostnadsdata tillgänglig</div>
                        )}
                    </div>
                  </div>

                    <div>
                      <h3 className="text-xl font-bold text-[#fecb00] mb-4">Kostnad per timme</h3>
                    <div className="space-y-3">
                        {analytics?.costAnalysis?.costPerHour ? (
                          <>
                            <div className="flex justify-between">
                              <span>Genomsnitt:</span>
                              <span className="text-[#fecb00] font-semibold">
                                {formatCurrency(Number(analytics.costAnalysis.costPerHour.average) || 0)}
                              </span>
                          </div>
                            <div className="flex justify-between">
                              <span>Median:</span>
                              <span className="text-[#fecb00] font-semibold">
                                {formatCurrency(Number(analytics.costAnalysis.costPerHour.median) || 0)}
                              </span>
                        </div>
                            <div className="flex justify-between">
                              <span>Min:</span>
                              <span className="text-gray-300">
                                {formatCurrency(Number(analytics.costAnalysis.costPerHour.min) || 0)}
                              </span>
                    </div>
                            <div className="flex justify-between">
                              <span>Max:</span>
                              <span className="text-gray-300">
                                {formatCurrency(Number(analytics.costAnalysis.costPerHour.max) || 0)}
                              </span>
                  </div>
                          </>
                        ) : (
                          <div className="text-gray-400 text-sm">Ingen timkostnadsdata tillgänglig</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-[#fecb00] mb-4">Kostnadstakeaways</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Total budget:</span>
                          <span className="text-[#fecb00] font-semibold">
                            {formatCurrency(Number(analytics?.summary?.totalBudget) || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Genomsnittlig projektkostnad:</span>
                          <span className="text-[#fecb00] font-semibold">
                            {analytics?.costAnalysis?.byCostType ? 
                              formatCurrency(
                                Object.values(analytics.costAnalysis.byCostType).reduce((sum, data) => sum + data.totalCost, 0) / 
                                Math.max(analytics.summary.totalProjects, 1)
                              ) : 
                              formatCurrency(0)
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Projekt med kostnadsdata:</span>
                          <span className="text-[#fecb00] font-semibold">
                            {analytics?.costAnalysis?.byCostType ? 
                              Object.values(analytics.costAnalysis.byCostType).reduce((sum, data) => sum + data.count, 0) : 
                              0
                            } / {analytics?.summary?.totalProjects || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Effects Analysis Section (moved from Översikt) */}
                <div className="p-8 rounded-lg border border-gray-700">
                  <h2 className="text-2xl font-bold text-[#fecb00] mb-6">Effektanalys</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div>
                      <h3 className="text-xl font-bold text-[#fecb00] mb-4">Kvalitativa effekter</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Med kvantifierbara mått:</span>
                          <span className="text-[#fecb00] font-semibold">
                            {Number(analytics?.effectsAnalysis?.quantifiableEffects?.withQuantifiable) || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Utan kvantifierbara mått:</span>
                          <span className="text-gray-300">
                            {Number(analytics?.effectsAnalysis?.quantifiableEffects?.withoutQuantifiable) || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Kvantifieringsgrad:</span>
                          <span className="text-[#fecb00] font-semibold">
                            {formatPercentage(Number(analytics?.effectsAnalysis?.quantifiableEffects?.percentage) || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-[#fecb00] mb-4">Effektstatistik</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Projekt med uppmätta effekter:</span>
                          <span className="text-[#fecb00] font-semibold">
                            {Number(analytics?.effectsAnalysis?.quantifiableEffects?.withQuantifiable) || 0} / {analytics?.summary?.totalProjects || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total monetär effekt:</span>
                          <span className="text-[#fecb00] font-semibold">
                            {formatCurrency(Number(analytics?.effectsAnalysis?.monetaryValue) || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Genomsnittlig ROI:</span>
                          <span className="text-[#fecb00] font-semibold">
                            {formatPercentage(Number(analytics?.summary?.averageROI) || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-lg border border-gray-700">
                      <h3 className="text-xl font-bold text-[#fecb00] mb-4">Effekt/värdedimension</h3>
                      <div className="space-y-3">
                        {analytics?.effectsAnalysis?.roiByValueDimension && Object.entries(analytics.effectsAnalysis.roiByValueDimension).slice(0, 5).map(([dimension, data]) => (
                          <div key={dimension} className="flex justify-between items-center">
                            <span className="text-[#fffefa] text-sm">{dimension}</span>
                            <div className="text-right">
                              <div className="text-[#fecb00] font-semibold">{formatPercentage(data.averageROI)}</div>
                              <div className="text-xs text-gray-400">{data.count} projekt</div>
                            </div>
                          </div>
                        )) || (
                          <div className="text-gray-400 text-sm">Ingen ROI-data tillgänglig</div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 rounded-lg border border-gray-700">
                      <h3 className="text-xl font-bold text-[#fecb00] mb-4">Top 5 effekt-projekt</h3>
                      <div className="space-y-3">
                        {analytics?.topPerformers?.highestROI?.slice(0, 5).map((project: any, index: number) => (
                          <div key={project.id} className="flex justify-between items-center">
                            <span className="text-[#fffefa] text-sm">{index + 1}. {project.title}</span>
                            <div className="text-right">
                              <div className="text-[#fecb00] font-semibold">{formatPercentage(project.roi)}</div>
                              <div className="text-xs text-gray-400">{formatCurrency(project.budget)} kostnad</div>
                            </div>
                          </div>
                        )) || (
                          <div className="text-gray-400 text-sm">Ingen ROI-data tillgänglig</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ROI per värdedimension (visual) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {createBarChart(
                    Object.fromEntries(
                      Object.entries(analytics?.effectsAnalysis?.roiByValueDimension || {}).map(([key, value]) => [
                        key,
                        Number(value?.averageROI) || 0
                      ])
                    ),
                    'Genomsnittlig ROI per värdedimension'
                  )}

                  {createPieChart(
                    analytics?.technologyInsights?.deploymentEnvironments || {},
                    'Deployment-miljöer'
                  )}
                </div>

                {/* Best per value dimension */}
                <div className="p-6 rounded-lg border border-gray-700 shadow">
                  <h3 className="text-xl font-bold text-[#fecb00] mb-4">Bäst per värdedimension</h3>
                  {(() => {
                    const dims = Object.keys(analytics?.breakdowns?.byValueDimension || {});
                    const list = (analytics?.projects || []) as any[];
                    if (!dims.length || !list.length) return <div className="text-gray-400 text-sm">Ingen data</div>;

                    const getROI = (p: any) => {
                      const v = Number(p?.calculatedMetrics?.roi);
                      return isFinite(v) ? v : NaN;
                    };
                    const getDims = (p: any): string[] => {
                      const vd = (p?.project_value_dimensions || []).map((x: any) => x?.value_dimensions?.name).filter(Boolean);
                      const vd2 = Array.isArray(p?.value_dimensions) ? p.value_dimensions : [];
                      return Array.from(new Set([...(vd || []), ...(vd2 || [])]));
                    };

                    const rows = dims.map(dim => {
                      const candidates = list.filter(p => getDims(p).includes(dim) && getROI(p) > 0);
                      if (!candidates.length) return null;
                      const best = candidates.reduce((a, b) => (getROI(a) > getROI(b) ? a : b));
                      return (
                        <div key={dim} className="flex justify-between items-center border-b border-gray-700 py-2">
                          <div className="text-[#fffefa] text-sm truncate pr-2">{dim}</div>
                          <button
                            className="text-right text-sm"
                            onClick={() => (window.location.href = `/projects/${best.id}`)}
                          >
                            <span className="text-[#fffefa] truncate inline-block max-w-[260px] align-middle mr-2">{best.title}</span>
                            <span className="text-[#fecb00] font-semibold align-middle">{formatPercentage(getROI(best))}</span>
                          </button>
                        </div>
                      );
                    }).filter(Boolean);

                    return rows.length ? rows : <div className="text-gray-400 text-sm">Ingen data</div>;
                  })()}
                </div>

                {/* Best per phase */}
                <div className="p-6 rounded-lg border border-gray-700 shadow">
                  <h3 className="text-xl font-bold text-[#fecb00] mb-4">Bäst per fas</h3>
                  {(() => {
                    const list = (analytics?.projects || []) as any[];
                    if (!list.length) return <div className="text-gray-400 text-sm">Ingen data</div>;
                    const phases = ['idea', 'pilot', 'implemented'];
                    const label = (ph: string) => ph === 'idea' ? 'Idé' : ph === 'pilot' ? 'Pilot' : ph === 'implemented' ? 'Implementerat' : ph;
                    const getROI = (p: any) => {
                      const v = Number(p?.calculatedMetrics?.roi);
                      return isFinite(v) ? v : NaN;
                    };

                    const rows = phases.map(ph => {
                      const candidates = list.filter(p => (p?.phase === ph) && getROI(p) > 0);
                      if (!candidates.length) return null;
                      const best = candidates.reduce((a, b) => (getROI(a) > getROI(b) ? a : b));
                      return (
                        <div key={ph} className="flex justify-between items-center border-b border-gray-700 py-2">
                          <div className="text-[#fffefa] text-sm truncate pr-2">{label(ph)}</div>
                          <button
                            className="text-right text-sm"
                            onClick={() => (window.location.href = `/projects/${best.id}`)}
                          >
                            <span className="text-[#fffefa] truncate inline-block max-w-[260px] align-middle mr-2">{best.title}</span>
                            <span className="text-[#fecb00] font-semibold align-middle">{formatPercentage(getROI(best))}</span>
                          </button>
                        </div>
                      );
                    }).filter(Boolean);

                    return rows.length ? rows : <div className="text-gray-400 text-sm">Ingen data</div>;
                  })()}
                </div>

                {/* Technology Insights Section (moved from Översikt) */}
                <div className="p-8 rounded-lg border border-gray-700 shadow">
                  <h2 className="text-2xl font-bold text-[#fecb00] mb-6">Teknologi-insikter</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-[#fffefa] mb-3">Mest använda teknologier</h3>
                      <div className="space-y-2">
                        {analytics?.technologyInsights?.mostUsedTechnologies?.slice(0, 5).map(([tech, count]) => (
                          <div key={tech} className="flex justify-between items-center">
                            <span className="text-[#fffefa] text-sm">{tech}</span>
                            <span className="text-[#fecb00] font-semibold">{Number(count)}</span>
                          </div>
                        )) || (
                          <div className="text-gray-400 text-sm">Ingen teknologidata tillgänglig</div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-[#fffefa] mb-3">Deployment-miljöer</h3>
                      <div className="space-y-2">
                        {analytics?.technologyInsights?.deploymentEnvironments && Object.entries(analytics.technologyInsights.deploymentEnvironments).map(([env, count]) => (
                          <div key={env} className="flex justify-between items-center">
                            <span className="text-[#fffefa] text-sm">{env}</span>
                            <span className="text-[#fecb00] font-semibold">{Number(count)}</span>
                          </div>
                        )) || (
                          <div className="text-gray-400 text-sm">Ingen deployment-data tillgänglig</div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-[#fffefa] mb-3">Datatyper</h3>
                      <div className="space-y-2">
                        {analytics?.technologyInsights?.dataTypes && Object.entries(analytics.technologyInsights.dataTypes).map(([type, count]) => (
                          <div key={type} className="flex justify-between items-center">
                            <span className="text-[#fffefa] text-sm">{type}</span>
                            <span className="text-[#fecb00] font-semibold">{Number(count)}</span>
                          </div>
                        )) || (
                          <div className="text-gray-400 text-sm">Ingen datatypdata tillgänglig</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Distribution Overview (moved from Översikt) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {createPieChart(
                    analytics?.breakdowns?.byPhase || {},
                    'Projekt per fas'
                  )}

                  {createBarChart(
                    analytics?.breakdowns?.byArea || {},
                    'Projekt per område'
                  )}

                  {createPieChart(
                    analytics?.breakdowns?.byValueDimension || {},
                    'Projekt per värdedimension'
                  )}
                </div>
                {/* Best-in-class Highlights */}
                <div className="p-6 rounded-lg border border-gray-700 shadow">
                  <h3 className="text-2xl font-bold text-[#fecb00] mb-6">Bäst i klassen</h3>
                  {(() => {
                    const list = (analytics?.projects || []) as any[];
                    const withMetric = (value: any) => value !== null && value !== undefined && !isNaN(value);

                    const topBy = (selector: (p: any) => number, preferHigh = true) => {
                      const items = list
                        .map(p => ({ p, v: selector(p) }))
                        .filter(item => withMetric(item.v));
                      if (items.length === 0) return null;
                      items.sort((a, b) => preferHigh ? (b.v - a.v) : (a.v - b.v));
                      return items[0];
                    };

                    const topROI = topBy(p => Number(p?.calculatedMetrics?.roi) || 0, true);
                    const topMonetary = topBy(p => Number(p?.calculatedMetrics?.totalMonetaryValue) || 0, true);
                    const topSharing = topBy(p => Number(p?.calculatedMetrics?.sharingScore) || 0, true);
                    const topValuePerSEK = topBy(p => {
                      const v = Number(p?.calculatedMetrics?.totalMonetaryValue) || 0;
                      const c = Number(p?.calculatedMetrics?.actualCost) || 0;
                      return c > 0 ? v / c : NaN;
                    }, true);
                    const topTech = topBy(p => (p?.calculatedMetrics?.technologies?.length || 0), true);
                    const bestBudgetPrecision = (() => {
                      const items = list.map(p => {
                        const b = Number(p?.calculatedMetrics?.budget) || 0;
                        const a = Number(p?.calculatedMetrics?.actualCost) || 0;
                        if (b <= 0 || a <= 0) return null;
                        const usage = (a / b) * 100; // %
                        const distance = Math.abs(100 - usage);
                        return { p, v: distance, usage };
                      }).filter(Boolean) as Array<{ p: any; v: number; usage: number }>;
                      if (items.length === 0) return null;
                      // Prefer within budget; if none, pick closest overall
                      const within = items.filter(i => i.usage <= 100);
                      const pool = within.length > 0 ? within : items;
                      pool.sort((a, b) => a.v - b.v);
                      return pool[0];
                    })();

                    const Card = ({ title, primary, secondary, onClick }: { title: string; primary: React.ReactNode; secondary?: React.ReactNode; onClick?: () => void }) => (
                      <div className="p-4 bg-[#1E3A4A] rounded-lg border border-gray-700 hover:border-gray-500 transition-colors cursor-pointer" onClick={onClick}>
                        <div className="text-sm text-gray-400 mb-1">{title}</div>
                        <div className="text-lg font-semibold text-[#fffefa]">{primary}</div>
                        {secondary && <div className="text-xs text-gray-400 mt-1">{secondary}</div>}
                      </div>
                    );

                    const go = (id?: string) => id && (window.location.href = `/projects/${id}`);

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {topROI && (
                          <Card
                            title="Högsta ROI"
                            primary={<>
                              <span className="text-[#fecb00] mr-2">{formatPercentage(topROI.v)}</span>
                              <span className="truncate inline-block align-middle max-w-[60%]">{topROI.p.title}</span>
                            </>}
                            secondary={`Investering: ${formatCurrency(Number(topROI.p?.calculatedMetrics?.actualCost) || 0)}`}
                            onClick={() => go(topROI.p?.id)}
                          />
                        )}

                        {topMonetary && (
                          <Card
                            title="Störst monetär nytta"
                            primary={<>
                              <span className="text-[#fecb00] mr-2">{formatCurrency(topMonetary.v)}</span>
                              <span className="truncate inline-block align-middle max-w-[60%]">{topMonetary.p.title}</span>
                            </>}
                            secondary={`ROI: ${formatPercentage(Number(topMonetary.p?.calculatedMetrics?.roi) || 0)}`}
                            onClick={() => go(topMonetary.p?.id)}
                          />
                        )}

                        {topValuePerSEK && (
                          <Card
                            title="Mest kostnadseffektiv (värde/SEK)"
                            primary={<>
                              <span className="text-[#fecb00] mr-2">{(topValuePerSEK.v).toFixed(2)}x</span>
                              <span className="truncate inline-block align-middle max-w-[60%]">{topValuePerSEK.p.title}</span>
                            </>}
                            secondary={`Nytta: ${formatCurrency(Number(topValuePerSEK.p?.calculatedMetrics?.totalMonetaryValue) || 0)} • Kostnad: ${formatCurrency(Number(topValuePerSEK.p?.calculatedMetrics?.actualCost) || 0)}`}
                            onClick={() => go(topValuePerSEK.p?.id)}
                          />
                        )}

                        {topSharing && (
                          <Card
                            title="Högst delningspoäng"
                            primary={<>
                              <span className="text-[#fecb00] mr-2">{Number(topSharing.v).toFixed(0)}%</span>
                              <span className="truncate inline-block align-middle max-w-[60%]">{topSharing.p.title}</span>
                            </>}
                            secondary={`Fas: ${topSharing.p?.phase || ''}`}
                            onClick={() => go(topSharing.p?.id)}
                          />
                        )}

                        {topTech && (
                          <Card
                            title="Bredast teknikstack"
                            primary={<>
                              <span className="text-[#fecb00] mr-2">{Number(topTech.v)}</span>
                              <span className="truncate inline-block align-middle max-w-[60%]">{topTech.p.title}</span>
                            </>}
                            secondary={(topTech.p?.calculatedMetrics?.technologies || []).join(', ').slice(0, 60)}
                            onClick={() => go(topTech.p?.id)}
                          />
                        )}

                        {bestBudgetPrecision && (
                          <Card
                            title="Bäst budgetprecision"
                            primary={<>
                              <span className="text-[#fecb00] mr-2">{(bestBudgetPrecision.usage).toFixed(1)}%</span>
                              <span className="truncate inline-block align-middle max-w-[60%]">{bestBudgetPrecision.p.title}</span>
                            </>}
                            secondary={`Budget: ${formatCurrency(Number(bestBudgetPrecision.p?.calculatedMetrics?.budget) || 0)} • Utfall: ${formatCurrency(Number(bestBudgetPrecision.p?.calculatedMetrics?.actualCost) || 0)}`}
                            onClick={() => go(bestBudgetPrecision.p?.id)}
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Technical Insights */}
                <div className="p-6 rounded-lg border border-gray-700 shadow">
                  <h3 className="text-xl font-bold text-[#fecb00] mb-4">Tekniska Utmaningar & Lösningar</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Statistik</h4>
                      <div className="space-y-2 text-sm">
                        <div>Totalt utmaningar: <span className="text-[#fecb00]">{Number(analytics?.technologyInsights?.technicalChallenges?.totalChallenges) || 0}</span></div>
                        <div>Totalt lösningar: <span className="text-[#fecb00]">{Number(analytics?.technologyInsights?.technicalChallenges?.totalSolutions) || 0}</span></div>
                        <div>Lösningsgrad: <span className="text-[#fecb00]">{formatPercentage(Number(analytics?.technologyInsights?.technicalChallenges?.resolutionRate) || 0)}</span></div>
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
              </>
            ) : (
              <div className="p-8 rounded-lg text-center shadow">
                <h3 className="text-xl font-bold text-[#fecb00] mb-4">Laddar analysdata...</h3>
                <p className="text-gray-300 mb-6">Bearbetar kostnadsanalys, ROI-data och tekniska insikter</p>
                <div className="animate-pulse">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-[#224556] h-48 rounded"></div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="bg-[#224556] h-32 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="text-center text-gray-400 text-sm mt-12 pt-8 border-t border-gray-600">
          Analysdata baserad på {Number(analytics?.summary?.totalProjects) || 0} projekt. 
          Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
        </div>
      </div>


    </div>
  );
} 
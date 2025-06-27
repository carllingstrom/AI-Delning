'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

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
    technology: '',
    affectedGroups: '',
    search: ''
  });

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
    
    const scoredProjects = projectsData.map(project => {
      // Calculate similarity scores for different fields with enhanced matching
      const titleScore = Math.max(
        calculateSimilarity(searchQuery, project.title),
        enhancedFuzzyMatch(searchQuery, project.title) ? 0.8 : 0
      ) * 2; // Weight title higher
      
      const introScore = Math.max(
        calculateSimilarity(searchQuery, project.intro || ''),
        enhancedFuzzyMatch(searchQuery, project.intro || '') ? 0.7 : 0
      ) * 1.5;
      
      const areaScore = project.areas ? Math.max(...project.areas.map(area => 
        Math.max(
          calculateSimilarity(searchQuery, area),
          enhancedFuzzyMatch(searchQuery, area) ? 0.6 : 0
        )
      ), 0) : 0;
      
      const municipalityScore = project.project_municipalities ? Math.max(...project.project_municipalities.map(pm => 
        Math.max(
          calculateSimilarity(searchQuery, pm.municipalities?.name || ''),
          enhancedFuzzyMatch(searchQuery, pm.municipalities?.name || '') ? 0.6 : 0
        )
      ), 0) * 0.8 : 0;
      
      const techScore = project.calculatedMetrics?.technologies ? Math.max(...project.calculatedMetrics.technologies.map(tech => 
        Math.max(
          calculateSimilarity(searchQuery, tech),
          enhancedFuzzyMatch(searchQuery, tech) ? 0.7 : 0
        )
      ), 0) * 0.6 : 0;
      
      // Combine scores with weights
      const totalScore = Math.max(titleScore, introScore, areaScore, municipalityScore, techScore);
      
      return {
        project,
        score: totalScore
      };
    });
    
    // Filter projects with score > 0.4 (much tighter threshold) and sort by score
    return scoredProjects
      .filter(item => item.score > 0.4)
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

        if (filtersToUse.technology) {
          filteredProjects = filteredProjects.filter((project: Project) =>
            project.calculatedMetrics?.technologies?.some(tech =>
              tech.toLowerCase().includes(filtersToUse.technology.toLowerCase()) ||
              enhancedFuzzyMatch(filtersToUse.technology, tech)
            )
          );
        }

        if (filtersToUse.affectedGroups) {
          filteredProjects = filteredProjects.filter((project: Project) =>
            project.calculatedMetrics?.affectedGroups?.some(group =>
              group.toLowerCase().includes(filtersToUse.affectedGroups.toLowerCase()) ||
              enhancedFuzzyMatch(filtersToUse.affectedGroups, group)
            )
          );
        }

        if (filtersToUse.hasROI === 'true') {
          filteredProjects = filteredProjects.filter((project: Project) =>
            project.calculatedMetrics?.roi && project.calculatedMetrics.roi > 0
          );
        }
        
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
      minBudget: '', maxBudget: '', hasROI: '', technology: '',
      affectedGroups: '', search: ''
    };
    setFilters(clearedFilters);
    fetchData(clearedFilters);
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

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'idea': return 'bg-blue-500';
      case 'planning': return 'bg-yellow-500';
      case 'pilot': return 'bg-orange-500';
      case 'implementation': return 'bg-purple-500';
      case 'implemented': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'idea': return 'Idé';
      case 'planning': return 'Planering';
      case 'pilot': return 'Pilot';
      case 'implementation': return 'Genomförande';
      case 'implemented': return 'Genomförd';
      case 'completed': return 'Avslutat';
      default: return phase;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] text-white">
        <Header />
        <div className="max-w-7xl mx-auto p-8">
          <div className="animate-pulse">Laddar projektportalen...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white">
      <Header />
      
      <div className="max-w-7xl mx-auto p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-4xl font-extrabold text-[#FECB00] mb-2">Projektportal</h1>
              <p className="text-gray-300">Hantera, analysera och jämför AI-projekt från svenska kommuner</p>
            </div>
            <Link 
              href="/projects/new" 
              className="mt-4 md:mt-0 px-6 py-3 rounded-lg bg-[#FECB00] text-[#0D1B2A] font-semibold hover:bg-[#e0b400] transition-colors"
            >
              + Lägg till projekt
            </Link>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-[#1E3A4A] rounded-lg p-1">
            {[
              { key: 'overview', label: 'Översikt', icon: '📊' },
              { key: 'projects', label: 'Projekt', icon: '📁' },
              { key: 'insights', label: 'Analys', icon: '🔍' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-[#FECB00] text-[#0D1B2A]'
                    : 'text-gray-300 hover:text-white hover:bg-[#2A4A5A]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-[#1E3A4A] p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold text-[#FECB00] mb-4">Filter & Sök</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Sök projekt</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full p-2 bg-[#0D1B2A] border border-gray-600 rounded text-white"
                placeholder="AI, kommun, teknik... (fuzzy search)"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Projektfas</label>
              <select
                value={filters.phase}
                onChange={(e) => setFilters({...filters, phase: e.target.value})}
                className="w-full p-2 bg-[#0D1B2A] border border-gray-600 rounded text-white"
              >
                <option value="">Alla faser</option>
                <option value="idea">Idé</option>
                <option value="planning">Planering</option>
                <option value="pilot">Pilot</option>
                <option value="implementation">Genomförande</option>
                <option value="implemented">Genomförd</option>
                <option value="completed">Avslutat</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Minsta budget (SEK)</label>
              <input
                type="number"
                value={filters.minBudget}
                onChange={(e) => setFilters({...filters, minBudget: e.target.value})}
                className="w-full p-2 bg-[#0D1B2A] border border-gray-600 rounded text-white"
                placeholder="t.ex. 100000"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Största budget (SEK)</label>
              <input
                type="number"
                value={filters.maxBudget}
                onChange={(e) => setFilters({...filters, maxBudget: e.target.value})}
                className="w-full p-2 bg-[#0D1B2A] border border-gray-600 rounded text-white"
                placeholder="t.ex. 1000000"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Teknik</label>
              <input
                type="text"
                value={filters.technology}
                onChange={(e) => setFilters({...filters, technology: e.target.value})}
                className="w-full p-2 bg-[#0D1B2A] border border-gray-600 rounded text-white"
                placeholder="AI, maskinlärning, ChatGPT... (fuzzy)"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Påverkade grupper</label>
              <select
                value={filters.affectedGroups}
                onChange={(e) => setFilters({...filters, affectedGroups: e.target.value})}
                className="w-full p-2 bg-[#0D1B2A] border border-gray-600 rounded text-white"
              >
                <option value="">Alla grupper</option>
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

            <div className="flex items-end">
              {/* Empty div for spacing */}
            </div>
          </div>

          {/* Search and Clear buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-6 py-2 bg-[#FECB00] text-[#0D1B2A] font-semibold rounded hover:bg-[#e0b400] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searching ? 'Söker...' : '🔍 Sök projekt'}
            </button>
            
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Rensa filter
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {analytics ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="bg-[#1E3A4A] p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-[#FECB00] mb-2">Totalt Projekt</h3>
                    <p className="text-3xl font-bold">{analytics?.summary?.totalProjects || 0}</p>
                  </div>
                  
                  <div className="bg-[#1E3A4A] p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-[#FECB00] mb-2">Total Budget</h3>
                    <p className="text-2xl font-bold">{formatCurrency(analytics?.summary?.totalBudget || 0)}</p>
                  </div>
                  
                  <div className="bg-[#1E3A4A] p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-[#FECB00] mb-2">Genomsnittlig Budget</h3>
                    <p className="text-2xl font-bold">{formatCurrency(analytics?.summary?.averageBudget || 0)}</p>
                  </div>
                  
                  <div className="bg-[#1E3A4A] p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-[#FECB00] mb-2">Total ROI</h3>
                    <p className="text-2xl font-bold">{formatPercent(analytics?.summary?.totalROI || 0)}</p>
                  </div>
                  
                  <div className="bg-[#1E3A4A] p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-[#FECB00] mb-2">Genomsnittlig ROI</h3>
                    <p className="text-2xl font-bold">{formatPercent(analytics?.summary?.averageROI || 0)}</p>
                  </div>
                </div>

                {/* Quick Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="bg-[#1E3A4A] p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-[#FECB00] mb-4">Projekt per Fas</h3>
                    <div className="space-y-3">
                      {Object.entries(analytics?.breakdowns?.byPhase || {}).map(([phase, count]) => (
                        <div key={phase} className="flex justify-between items-center">
                          <span className="capitalize">{getPhaseLabel(phase)}</span>
                          <span className="text-[#FECB00] font-semibold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#1E3A4A] p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-[#FECB00] mb-4">Mest Använda Teknologier</h3>
                    <div className="space-y-3">
                      {(analytics?.technologyInsights?.mostUsedTechnologies || []).slice(0, 5).map(([tech, count]) => (
                        <div key={tech} className="flex justify-between items-center">
                          <span className="truncate mr-4">{tech}</span>
                          <span className="text-[#FECB00] font-semibold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#1E3A4A] p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-[#FECB00] mb-4">Påverkade Grupper</h3>
                    <div className="space-y-3">
                      {Object.entries(analytics?.breakdowns?.byAffectedGroups || {}).map(([group, count]) => (
                        <div key={group} className="flex justify-between items-center">
                          <span>{group}</span>
                          <span className="text-[#FECB00] font-semibold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-[#1E3A4A] p-8 rounded-lg text-center">
                <h3 className="text-xl font-bold text-[#FECB00] mb-4">Laddar översiktsdata...</h3>
                <p className="text-gray-300 mb-6">Samlar projektstatistik och analysdata</p>
                <div className="animate-pulse">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="bg-[#2A4A5A] h-24 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[#FECB00]">
                Projekt ({projects.length})
                {searching && <span className="text-sm font-normal text-gray-400 ml-2">Söker...</span>}
              </h2>
            </div>
            
            {searching ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-[#1E3A4A] p-6 rounded-lg animate-pulse">
                    <div className="h-6 bg-[#2A4A5A] rounded mb-3"></div>
                    <div className="h-4 bg-[#2A4A5A] rounded mb-2"></div>
                    <div className="h-4 bg-[#2A4A5A] rounded mb-4 w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-[#2A4A5A] rounded w-1/2"></div>
                      <div className="h-3 bg-[#2A4A5A] rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <div key={project.id} className="bg-[#1E3A4A] p-6 rounded-lg hover:bg-[#2A4A5A] transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-white truncate pr-4">{project.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getPhaseColor(project.phase)}`}>
                          {getPhaseLabel(project.phase)}
                        </span>
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-4 line-clamp-3">{project.intro}</p>
                      
                      <div className="space-y-2 text-sm">
                        {project.project_municipalities?.length > 0 && (
                          <div>
                            <span className="text-[#FECB00] font-medium">Kommun: </span>
                            <span className="text-gray-300">
                              {project.project_municipalities.map(pm => pm.municipalities.name).join(', ')}
                            </span>
                          </div>
                        )}
                        
                        {project.areas?.length > 0 && (
                          <div>
                            <span className="text-[#FECB00] font-medium">Områden: </span>
                            <span className="text-gray-300">{project.areas.slice(0, 2).join(', ')}</span>
                            {project.areas.length > 2 && <span className="text-gray-400"> +{project.areas.length - 2}</span>}
                          </div>
                        )}
                        
                        {project.calculatedMetrics?.budget && (
                          <div>
                            <span className="text-[#FECB00] font-medium">Budget: </span>
                            <span className="text-gray-300">{formatCurrency(project.calculatedMetrics.budget)}</span>
                          </div>
                        )}
                        
                        {project.calculatedMetrics?.roi && (
                          <div>
                            <span className="text-[#FECB00] font-medium">ROI: </span>
                            <span className={`font-semibold ${project.calculatedMetrics.roi > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatPercent(project.calculatedMetrics.roi)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <Link 
                        href={`/map?project=${project.id}`}
                        className="inline-block mt-4 text-[#FECB00] hover:text-[#e0b400] font-medium text-sm"
                      >
                        Visa på kartan →
                      </Link>
                    </div>
                  ))}
                </div>
                
                {projects.length === 0 && !searching && (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-lg">Inga projekt matchar dina filter</p>
                    <button
                      onClick={handleClearFilters}
                      className="mt-4 text-[#FECB00] hover:text-[#e0b400] font-medium"
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
                {/* Cost Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="bg-[#1E3A4A] p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-[#FECB00] mb-4">Kostnadstyper</h3>
                    <div className="space-y-3">
                      {Object.entries(analytics?.costAnalysis?.byCostType || {}).map(([type, data]) => (
                        <div key={type}>
                          <div className="flex justify-between items-center">
                            <span className="text-sm truncate mr-2">{type}</span>
                            <span className="text-[#FECB00] font-semibold">{data.count}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatCurrency(data.totalCost)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#1E3A4A] p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-[#FECB00] mb-4">Kostnad per Timme</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Genomsnitt:</span>
                        <span className="text-[#FECB00] font-semibold">
                          {formatCurrency(analytics?.costAnalysis?.costPerHour?.average || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Median:</span>
                        <span className="text-[#FECB00] font-semibold">
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
                    <h3 className="text-xl font-bold text-[#FECB00] mb-4">Effektanalys</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Med kvantifierbara mått:</span>
                        <span className="text-[#FECB00] font-semibold">
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
                        <span className="text-[#FECB00] font-semibold">
                          {formatPercent(analytics?.effectsAnalysis?.quantifiableEffects?.percentage || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Totalt monetärt värde:</span>
                        <span className="text-[#FECB00] font-semibold">
                          {formatCurrency(analytics?.effectsAnalysis?.monetaryValue || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Performers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-[#1E3A4A] p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-[#FECB00] mb-4">Högsta ROI</h3>
                    <div className="space-y-3">
                      {(analytics?.topPerformers?.highestROI || []).map((project) => (
                        <div key={project.id} className="border-b border-gray-600 pb-2">
                          <div className="font-semibold truncate">{project.title}</div>
                          <div className="text-sm text-gray-400">
                            ROI: <span className="text-[#FECB00]">{formatPercent(project.roi)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#1E3A4A] p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-[#FECB00] mb-4">Största Budget</h3>
                    <div className="space-y-3">
                      {(analytics?.topPerformers?.largestBudget || []).map((project) => (
                        <div key={project.id} className="border-b border-gray-600 pb-2">
                          <div className="font-semibold truncate">{project.title}</div>
                          <div className="text-sm text-gray-400">
                            Budget: <span className="text-[#FECB00]">{formatCurrency(project.budget)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Technical Insights */}
                <div className="bg-[#1E3A4A] p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-[#FECB00] mb-4">Tekniska Utmaningar & Lösningar</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Statistik</h4>
                      <div className="space-y-2 text-sm">
                        <div>Totalt utmaningar: <span className="text-[#FECB00]">{analytics?.technologyInsights?.technicalChallenges?.totalChallenges || 0}</span></div>
                        <div>Totalt lösningar: <span className="text-[#FECB00]">{analytics?.technologyInsights?.technicalChallenges?.totalSolutions || 0}</span></div>
                        <div>Lösningsgrad: <span className="text-[#FECB00]">{formatPercent(analytics?.technologyInsights?.technicalChallenges?.resolutionRate || 0)}</span></div>
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
              <div className="bg-[#1E3A4A] p-8 rounded-lg text-center">
                <h3 className="text-xl font-bold text-[#FECB00] mb-4">Laddar analysdata...</h3>
                <p className="text-gray-300 mb-6">Bearbetar kostnadsanalys, ROI-data och tekniska insikter</p>
                <div className="animate-pulse">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-[#2A4A5A] h-48 rounded"></div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="bg-[#2A4A5A] h-32 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="text-center text-gray-400 text-sm mt-12 pt-8 border-t border-gray-600">
          Analysdata baserad på {analytics?.summary?.totalProjects || 0} projekt. 
          Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
        </div>
      </div>
    </div>
  );
} 
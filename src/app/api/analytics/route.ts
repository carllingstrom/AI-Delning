import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function serverSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}

// GET /api/analytics - Comprehensive project analytics
export async function GET(req: NextRequest) {
  const sb = serverSupabase();
  const url = new URL(req.url);
  
  // Filter parameters
  const phase = url.searchParams.get('phase');
  const minBudget = url.searchParams.get('minBudget');
  const maxBudget = url.searchParams.get('maxBudget');
  const hasROI = url.searchParams.get('hasROI');
  const technology = url.searchParams.get('technology');
  const affectedGroups = url.searchParams.get('affectedGroups');

  try {
    // Get all projects with relationships
    let query = sb
      .from('projects')
      .select(`
        *,
        project_municipalities(municipality_id, municipalities(name, county)),
        project_areas(area_id, areas(name)),
        project_value_dimensions(value_dimension_id, value_dimensions(name))
      `);

    if (phase) {
      query = query.eq('phase', phase);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error('Analytics fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Apply additional filters and analyze
    const filteredProjects = (projects || []).filter(project => {
      // Budget filter
      const budget = extractBudgetAmount(project);
      if (minBudget && (!budget || budget < parseFloat(minBudget))) return false;
      if (maxBudget && (!budget || budget > parseFloat(maxBudget))) return false;

      // ROI filter
      if (hasROI === 'true') {
        const roi = calculateROI(project);
        if (!roi || roi <= 0) return false;
      }

      // Technology filter
      if (technology) {
        const technologies = extractTechnologies(project);
        if (!technologies.some(tech => 
          tech.toLowerCase().includes(technology.toLowerCase())
        )) return false;
      }

      // Affected groups filter
      if (affectedGroups) {
        const groups = extractAffectedGroups(project);
        if (!groups.includes(affectedGroups)) return false;
      }

      return true;
    });

    const analytics = {
      summary: {
        totalProjects: filteredProjects.length,
        totalBudget: calculateTotalBudget(filteredProjects),
        averageBudget: calculateAverageBudget(filteredProjects),
        totalROI: calculateTotalROI(filteredProjects),
        averageROI: calculateAverageROI(filteredProjects),
      },
      breakdowns: {
        byPhase: groupBy(filteredProjects, 'phase'),
        byCounty: analyzeByCounty(filteredProjects),
        byArea: analyzeByArea(filteredProjects),
        byValueDimension: analyzeByValueDimension(filteredProjects),
        byBudgetRange: analyzeByBudgetRange(filteredProjects),
        byTechnology: analyzeByTechnology(filteredProjects),
        byAffectedGroups: analyzeByAffectedGroups(filteredProjects),
      },
      costAnalysis: {
        byCostType: analyzeCostTypes(filteredProjects),
        budgetVsActual: analyzeBudgetVsActual(filteredProjects),
        costPerHour: analyzeCostPerHour(filteredProjects),
      },
      effectsAnalysis: {
        byEffectType: analyzeEffectTypes(filteredProjects),
        quantifiableEffects: analyzeQuantifiableEffects(filteredProjects),
        monetaryValue: calculateTotalMonetaryValue(filteredProjects),
        affectedPopulation: analyzeAffectedPopulation(filteredProjects),
      },
      technologyInsights: {
        mostUsedTechnologies: getMostUsedTechnologies(filteredProjects),
        deploymentEnvironments: analyzeDeploymentEnvironments(filteredProjects),
        dataTypes: analyzeDataTypes(filteredProjects),
        integrationPatterns: analyzeIntegrationPatterns(filteredProjects),
        technicalChallenges: analyzeTechnicalChallenges(filteredProjects),
      },
      // National impact simulation: assume each project implementeras i 290 kommuner
      nationalImpact: calculateNationalImpact(filteredProjects),
      // Data completeness per field
      dataCompleteness: analyzeDataCompleteness(filteredProjects),
      topPerformers: {
        highestROI: getTopProjectsByROI(filteredProjects, 5),
        largestBudget: getTopProjectsByBudget(filteredProjects, 5),
        mostAffectedGroups: getProjectsByAffectedGroups(filteredProjects, 5),
        mostInnovative: getMostInnovativeProjects(filteredProjects, 5),
      },
      projects: filteredProjects.map(project => ({
        ...project,
        calculatedMetrics: {
          budget: extractBudgetAmount(project),
          actualCost: calculateActualCost(project),
          roi: calculateROI(project),
          affectedGroups: extractAffectedGroups(project),
          technologies: extractTechnologies(project),
          effects: extractEffectsSummary(project),
        }
      }))
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions
function extractBudgetAmount(project: any): number | null {
  const costData = project.cost_data || {};
  return costData.budgetDetails?.budgetAmount || null;
}

function calculateActualCost(project: any): number {
  const costData = project.cost_data || {};
  const costEntries = costData.actualCostDetails?.costEntries || [];
  
  return costEntries.reduce((total: number, entry: any) => {
    const hourCost = (entry.costHours || 0) * (entry.costRate || 0);
    const fixedCost = entry.costFixed || 0;
    return total + hourCost + fixedCost;
  }, 0);
}

function calculateROI(project: any): number | null {
  const actualCost = calculateActualCost(project);
  const monetaryValue = calculateProjectMonetaryValue(project);
  
  if (!actualCost || actualCost === 0) return null;
  if (!monetaryValue || monetaryValue === 0) return null;
  
  return ((monetaryValue - actualCost) / actualCost) * 100;
}

function calculateProjectMonetaryValue(project: any): number {
  const effectsData = project.effects_data || {};
  const effectDetails = effectsData.effectDetails || [];
  
  let totalValue = 0;
  
  effectDetails.forEach((effect: any) => {
    const measurements = effect.impactMeasurement?.measurements || [];
    measurements.forEach((measurement: any) => {
      if (measurement.monetaryEstimate) {
        totalValue += parseFloat(measurement.monetaryEstimate);
      }
    });
  });
  
  return totalValue;
}

function extractAffectedGroups(project: any): string[] {
  const effectsData = project.effects_data || {};
  const effectDetails = effectsData.effectDetails || [];
  const groups = new Set<string>();
  
  effectDetails.forEach((effect: any) => {
    const measurements = effect.impactMeasurement?.measurements || [];
    measurements.forEach((measurement: any) => {
      if (measurement.affectedGroups) {
        measurement.affectedGroups.forEach((group: string) => groups.add(group));
      }
    });
  });
  
  return Array.from(groups);
}

function extractTechnologies(project: any): string[] {
  const techData = project.technical_data || {};
  const technologies = [];
  
  if (techData.system_name) technologies.push(techData.system_name);
  if (techData.ai_methodology) technologies.push(techData.ai_methodology);
  if (techData.deployment_environment) technologies.push(techData.deployment_environment);
  
  return technologies;
}

function extractEffectsSummary(project: any): any {
  const effectsData = project.effects_data || {};
  const effectDetails = effectsData.effectDetails || [];
  
  let totalMeasurements = 0;
  let totalMonetaryValue = 0;
  const effectTypes = new Set<string>();
  
  effectDetails.forEach((effect: any) => {
    const measurements = effect.impactMeasurement?.measurements || [];
    totalMeasurements += measurements.length;
    
    measurements.forEach((measurement: any) => {
      if (measurement.effectChangeType) {
        effectTypes.add(measurement.effectChangeType);
      }
      if (measurement.monetaryEstimate) {
        totalMonetaryValue += parseFloat(measurement.monetaryEstimate);
      }
    });
  });
  
  return {
    totalMeasurements,
    totalMonetaryValue,
    effectTypes: Array.from(effectTypes)
  };
}

function calculateTotalBudget(projects: any[]): number {
  return projects.reduce((total, project) => {
    const budget = extractBudgetAmount(project);
    return total + (budget || 0);
  }, 0);
}

function calculateAverageBudget(projects: any[]): number {
  const projectsWithBudget = projects.filter(p => extractBudgetAmount(p));
  if (projectsWithBudget.length === 0) return 0;
  return calculateTotalBudget(projectsWithBudget) / projectsWithBudget.length;
}

function calculateTotalROI(projects: any[]): number {
  return projects.reduce((total, project) => {
    const roi = calculateROI(project);
    return total + (roi || 0);
  }, 0);
}

function calculateAverageROI(projects: any[]): number {
  const projectsWithROI = projects.filter(p => calculateROI(p) !== null);
  if (projectsWithROI.length === 0) return 0;
  return calculateTotalROI(projectsWithROI) / projectsWithROI.length;
}

function groupBy(array: any[], key: string) {
  return array.reduce((result, item) => {
    const value = item[key] || 'Unknown';
    result[value] = (result[value] || 0) + 1;
    return result;
  }, {});
}

function analyzeByCounty(projects: any[]) {
  const result: Record<string, number> = {};
  projects.forEach(project => {
    project.project_municipalities?.forEach((pm: any) => {
      const county = pm.municipalities?.county;
      if (county) {
        result[county] = (result[county] || 0) + 1;
      }
    });
  });
  return result;
}

function analyzeByArea(projects: any[]) {
  const result: Record<string, number> = {};
  projects.forEach(project => {
    project.project_areas?.forEach((pa: any) => {
      const area = pa.areas?.name;
      if (area) {
        result[area] = (result[area] || 0) + 1;
      }
    });
  });
  return result;
}

function analyzeByValueDimension(projects: any[]) {
  const result: Record<string, number> = {};
  projects.forEach(project => {
    project.project_value_dimensions?.forEach((pvd: any) => {
      const dimension = pvd.value_dimensions?.name;
      if (dimension) {
        result[dimension] = (result[dimension] || 0) + 1;
      }
    });
  });
  return result;
}

function analyzeByBudgetRange(projects: any[]) {
  const ranges = {
    '0-100k': 0,
    '100k-500k': 0,
    '500k-1M': 0,
    '1M-5M': 0,
    '5M+': 0,
    'Unknown': 0
  };
  
  projects.forEach(project => {
    const budget = extractBudgetAmount(project);
    if (!budget) {
      ranges['Unknown']++;
    } else if (budget < 100000) {
      ranges['0-100k']++;
    } else if (budget < 500000) {
      ranges['100k-500k']++;
    } else if (budget < 1000000) {
      ranges['500k-1M']++;
    } else if (budget < 5000000) {
      ranges['1M-5M']++;
    } else {
      ranges['5M+']++;
    }
  });
  
  return ranges;
}

function analyzeByTechnology(projects: any[]) {
  const result: Record<string, number> = {};
  projects.forEach(project => {
    const technologies = extractTechnologies(project);
    technologies.forEach(tech => {
      result[tech] = (result[tech] || 0) + 1;
    });
  });
  return result;
}

function analyzeByAffectedGroups(projects: any[]) {
  const result: Record<string, number> = {};
  projects.forEach(project => {
    const groups = extractAffectedGroups(project);
    groups.forEach(group => {
      result[group] = (result[group] || 0) + 1;
    });
  });
  return result;
}

function analyzeCostTypes(projects: any[]) {
  const result: Record<string, { count: number, totalCost: number }> = {};
  
  projects.forEach(project => {
    const costData = project.cost_data || {};
    const costEntries = costData.actualCostDetails?.costEntries || [];
    
    costEntries.forEach((entry: any) => {
      const type = entry.costType || 'Unknown';
      const rate = parseFloat(entry.costRate) || 0;
      const hours = parseFloat(entry.costHours) || 0;
      const fixed = parseFloat(entry.costFixed) || 0;
      const cost = (hours * rate) + fixed;
      
      if (!result[type]) {
        result[type] = { count: 0, totalCost: 0 };
      }
      result[type].count++;
      result[type].totalCost = (result[type].totalCost || 0) + cost;
    });
  });
  
  return result;
}

function analyzeBudgetVsActual(projects: any[]) {
  return projects.map(project => ({
    projectId: project.id,
    title: project.title,
    budget: extractBudgetAmount(project),
    actualCost: calculateActualCost(project),
    variance: calculateActualCost(project) - (extractBudgetAmount(project) || 0)
  })).filter(p => p.budget && p.actualCost);
}

function analyzeCostPerHour(projects: any[]) {
  const rates: number[] = [];
  
  projects.forEach(project => {
    const costData = project.cost_data || {};
    const costEntries = costData.actualCostDetails?.costEntries || [];
    
    costEntries.forEach((entry: any) => {
      if (entry.costRate) {
        rates.push(parseFloat(entry.costRate));
      }
    });
  });
  
  if (rates.length === 0) return { average: 0, min: 0, max: 0, median: 0 };
  
  rates.sort((a, b) => a - b);
  return {
    average: rates.reduce((a, b) => a + b, 0) / rates.length,
    min: rates[0],
    max: rates[rates.length - 1],
    median: rates[Math.floor(rates.length / 2)]
  };
}

function analyzeEffectTypes(projects: any[]) {
  const result: Record<string, number> = {};
  
  projects.forEach(project => {
    const effects = extractEffectsSummary(project);
    effects.effectTypes.forEach((type: string) => {
      result[type] = (result[type] || 0) + 1;
    });
  });
  
  return result;
}

function analyzeQuantifiableEffects(projects: any[]) {
  let totalWithQuantifiable = 0;
  let totalWithoutQuantifiable = 0;
  
  projects.forEach(project => {
    const effectsData = project.effects_data || {};
    const effectDetails = effectsData.effectDetails || [];
    
    let hasQuantifiable = false;
    effectDetails.forEach((effect: any) => {
      if (effect.hasQuantitative === true) {
        hasQuantifiable = true;
      }
    });
    
    if (hasQuantifiable) {
      totalWithQuantifiable++;
    } else {
      totalWithoutQuantifiable++;
    }
  });
  
  const total = totalWithQuantifiable + totalWithoutQuantifiable;
  return {
    withQuantifiable: totalWithQuantifiable,
    withoutQuantifiable: totalWithoutQuantifiable,
    percentage: total > 0 ? (totalWithQuantifiable / total) * 100 : 0
  };
}

function calculateTotalMonetaryValue(projects: any[]): number {
  return projects.reduce((total, project) => {
    return total + calculateProjectMonetaryValue(project);
  }, 0);
}

function analyzeAffectedPopulation(projects: any[]) {
  const groups = analyzeByAffectedGroups(projects);
  const total = Object.values(groups).reduce((sum: number, count) => sum + (count as number), 0);
  
  return {
    breakdown: groups,
    totalAffected: total,
    averageGroupsPerProject: projects.length > 0 ? total / projects.length : 0
  };
}

function getMostUsedTechnologies(projects: any[]) {
  const techCounts = analyzeByTechnology(projects);
  return Object.entries(techCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10);
}

function analyzeDeploymentEnvironments(projects: any[]) {
  const result: Record<string, number> = {};
  projects.forEach(project => {
    const techData = project.technical_data || {};
    const env = techData.deployment_environment || 'Unknown';
    result[env] = (result[env] || 0) + 1;
  });
  return result;
}

function analyzeDataTypes(projects: any[]) {
  const result: Record<string, number> = {};
  projects.forEach(project => {
    const techData = project.technical_data || {};
    const dataTypes = techData.data_types || [];
    dataTypes.forEach((type: string) => {
      result[type] = (result[type] || 0) + 1;
    });
  });
  return result;
}

function analyzeIntegrationPatterns(projects: any[]) {
  const result: Record<string, number> = {};
  projects.forEach(project => {
    const techData = project.technical_data || {};
    const integrations = techData.integration_capabilities || [];
    integrations.forEach((integration: string) => {
      result[integration] = (result[integration] || 0) + 1;
    });
  });
  return result;
}

function analyzeTechnicalChallenges(projects: any[]) {
  const challenges: string[] = [];
  const solutions: string[] = [];
  
  projects.forEach(project => {
    const techData = project.technical_data || {};
    if (techData.technical_obstacles) {
      challenges.push(techData.technical_obstacles);
    }
    if (techData.technical_solutions) {
      solutions.push(techData.technical_solutions);
    }
  });
  
  return {
    totalChallenges: challenges.length,
    totalSolutions: solutions.length,
    resolutionRate: challenges.length > 0 ? (solutions.length / challenges.length) * 100 : 0,
    challenges: challenges.slice(0, 10),
    solutions: solutions.slice(0, 10)
  };
}

function getTopProjectsByROI(projects: any[], limit: number) {
  return projects
    .map(project => ({
      ...project,
      roi: calculateROI(project)
    }))
    .filter(p => p.roi !== null)
    .sort((a, b) => (b.roi || 0) - (a.roi || 0))
    .slice(0, limit);
}

function getTopProjectsByBudget(projects: any[], limit: number) {
  return projects
    .map(project => ({
      ...project,
      budget: extractBudgetAmount(project)
    }))
    .filter(p => p.budget)
    .sort((a, b) => (b.budget || 0) - (a.budget || 0))
    .slice(0, limit);
}

function getProjectsByAffectedGroups(projects: any[], limit: number) {
  return projects
    .map(project => ({
      ...project,
      affectedGroups: extractAffectedGroups(project)
    }))
    .sort((a, b) => b.affectedGroups.length - a.affectedGroups.length)
    .slice(0, limit);
}

function getMostInnovativeProjects(projects: any[], limit: number) {
  return projects
    .map(project => {
      const technologies = extractTechnologies(project);
      const techData = project.technical_data || {};
      const hasAI = techData.ai_methodology || technologies.some((t: string) => 
        t.toLowerCase().includes('ai') || t.toLowerCase().includes('machine learning')
      );
      const innovationScore = technologies.length + (hasAI ? 2 : 0);
      
      return {
        ...project,
        innovationScore,
        technologies
      };
    })
    .sort((a, b) => b.innovationScore - a.innovationScore)
    .slice(0, limit);
}

function calculateNationalImpact(projects: any[]): any {
  if (!projects || projects.length === 0) {
    return { totalSavings: 0, savingsPerCitizen: 0 };
  }

  // Calculate total monetary savings for the projects we have
  let totalSavingsObserved = 0;
  const municipalitySet = new Set<number>();

  projects.forEach((p: any) => {
    const actualCost = calculateActualCost(p);
    const monetaryValue = calculateProjectMonetaryValue(p);
    if (monetaryValue && actualCost && monetaryValue > actualCost) {
      totalSavingsObserved += (monetaryValue - actualCost);
    }
    // Count municipalities linked to this project
    (p.project_municipalities || []).forEach((pm: any) => municipalitySet.add(pm.municipality_id));
  });

  const observedMunicipalities = municipalitySet.size || 1; // avoid div/0
  const scaleFactor = 290 / observedMunicipalities; // Sweden has 290 municipalities
  const nationalSavings = totalSavingsObserved * scaleFactor;
  const savingsPerCitizen = nationalSavings / 10400000; // ~10.4 M inhabitants

  return {
    observedMunicipalities,
    totalSavingsObserved,
    nationalSavings,
    savingsPerCitizen,
  };
}

function analyzeDataCompleteness(projects: any[]): any {
  if (!projects || projects.length === 0) return {};

  const fields = [
    'cost_data',
    'effects_data',
    'technical_data',
    'leadership_data',
    'legal_data',
    'areas',
    'value_dimensions',
  ];

  const completeness: Record<string, number> = {};
  fields.forEach((field) => {
    const filled = projects.filter((p: any) => {
      const val = p[field];
      if (Array.isArray(val)) return val.length > 0;
      if (typeof val === 'object') return val && Object.keys(val).length > 0;
      return !!val;
    }).length;
    completeness[field] = parseFloat(((filled / projects.length) * 100).toFixed(1));
  });
  return completeness;
}
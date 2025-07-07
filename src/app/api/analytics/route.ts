import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

function serverSupabase() {
  return createServerSupabaseClient();
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
      try {
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
          if (!technologies.some((tech: string) => 
            tech.toLowerCase().includes(technology.toLowerCase())
          )) return false;
        }

        // Affected groups filter
        if (affectedGroups) {
          const groups = extractAffectedGroups(project);
          if (!groups.includes(affectedGroups)) return false;
        }

        return true;
      } catch (err) {
        console.error('Error filtering project:', project.id, err);
        return false;
      }
    });



    // --- National Savings Simulation ---
    let simulatedSavings = 0;
    let savingsPerInhabitant = 0;
    let usedMunicipalityCount = 1;
    let usedPopulation = 10500000;
    
    try {
      // Calculate project savings (monetary value - actual cost)
      const projectSavings = filteredProjects.map(project => {
        const actualCost = calculateActualCost(project) || 0;
        const monetaryValue = calculateProjectMonetaryValue(project) || 0;
        return monetaryValue - actualCost;
      });
      const totalProjectSavings = projectSavings.reduce((sum, s) => sum + s, 0);
      // Count unique municipalities in the dataset
      const allMunicipalityIds = new Set();
      filteredProjects.forEach(project => {
        (project.project_municipalities || []).forEach((pm: any) => {
          if (pm.municipality_id) allMunicipalityIds.add(pm.municipality_id);
        });
      });
      usedMunicipalityCount = allMunicipalityIds.size || 1;
      simulatedSavings = usedMunicipalityCount > 0
        ? totalProjectSavings * (290 / usedMunicipalityCount)
        : 0;
      savingsPerInhabitant = usedPopulation > 0 ? simulatedSavings / usedPopulation : 0;
    } catch (err) {
      console.error('Error calculating national savings:', err);
    }

    // --- Budgetfördelning Sankey ---
    let nodes: any[] = [];
    let links: any[] = [];
    
    try {
      // 1. Gather all unique cost types, project titles, and municipality names
      const costTypeSet = new Set<string>();
      const projectTitleSet = new Set<string>();
      const municipalityNameSet = new Set<string>();
      filteredProjects.forEach(project => {
        projectTitleSet.add(project.title);
        (project.cost_data?.actualCostDetails?.costEntries || []).forEach((entry: any) => {
          if (entry.costType) costTypeSet.add(entry.costType);
        });
        (project.project_municipalities || []).forEach((pm: any) => {
          if (pm.municipalities?.name) municipalityNameSet.add(pm.municipalities.name);
        });
      });
      const costTypes = Array.from(costTypeSet);
      const projectTitles = Array.from(projectTitleSet);
      const municipalityNames = Array.from(municipalityNameSet);
      // 2. Build nodes array
      nodes = [
        ...costTypes.map(name => ({ name })),
        ...projectTitles.map(name => ({ name })),
        ...municipalityNames.map(name => ({ name }))
      ];
      // 3. Build links array
      links = [];
      // Cost type → project
      filteredProjects.forEach(project => {
        const projectIdx = costTypes.length + projectTitles.indexOf(project.title);
        const costEntries = project.cost_data?.actualCostDetails?.costEntries || [];
        costEntries.forEach((entry: any) => {
          if (entry.costType) {
            const costTypeIdx = costTypes.indexOf(entry.costType);
            const value = (entry.costHours || 0) * (entry.costRate || 0) + (entry.costFixed || 0);
            if (value > 0) {
              links.push({ source: costTypeIdx, target: projectIdx, value });
            }
          }
        });
      });
      // Project → municipality
      filteredProjects.forEach(project => {
        const projectIdx = costTypes.length + projectTitles.indexOf(project.title);
        const totalProjectCost = (project.cost_data?.budgetDetails?.budgetAmount || 0);
        (project.project_municipalities || []).forEach((pm: any) => {
          if (pm.municipalities?.name) {
            const muniIdx = costTypes.length + projectTitles.length + municipalityNames.indexOf(pm.municipalities.name);
            links.push({ source: projectIdx, target: muniIdx, value: totalProjectCost });
          }
        });
      });
    } catch (err) {
      console.error('Error calculating Sankey data:', err);
    }

    // --- Kostnad vs. Effekt-heatmap ---
    let costEffectHeatmapData: any[] = [];
    
    try {
      costEffectHeatmapData = filteredProjects
        .map(project => {
          const x = calculateActualCost(project) || 0;
          const y = calculateProjectMonetaryValue(project) || 0;
          return { x, y, label: project.title };
        })
        .filter(d => d.x > 0 && d.y > 0);
    } catch (err) {
      console.error('Error calculating heatmap data:', err);
    }

    // --- Break-even-tid ---
    let breakEvenData: any[] = [];
    
    try {
      breakEvenData = filteredProjects.map(project => {
        const periodizedCost = project.cost_data?.periodizedCost || [];
        const periodizedEffect = project.effects_data?.periodizedEffect || [];
        if (!Array.isArray(periodizedCost) || !Array.isArray(periodizedEffect) || periodizedCost.length === 0 || periodizedEffect.length === 0) {
          return null;
        }
        // Build cumulative arrays by month
        let months = Math.max(periodizedCost.length, periodizedEffect.length);
        let cumCost = 0;
        let cumEffect = 0;
        let breakEven = null;
        for (let i = 0; i < months; i++) {
          cumCost += periodizedCost[i]?.value || 0;
          cumEffect += periodizedEffect[i]?.value || 0;
          if (breakEven === null && cumEffect >= cumCost) {
            breakEven = i + 1; // months are 1-indexed
          }
        }
        return {
          projectId: project.id,
          title: project.title,
          breakEvenMonths: breakEven
        };
      }).filter(Boolean);
    } catch (err) {
      console.error('Error calculating break-even data:', err);
    }

    // --- Top-10 kvalitativa effekter (wordcloud) ---
    let topQualitativeEffectsWordcloud: any[] = [];
    
    try {
      const wordCounts: Record<string, number> = {};
      filteredProjects.forEach(project => {
        const effectDetails = project.effects_data?.effectDetails || [];
        effectDetails.forEach((effect: any) => {
          const desc = effect.effectDescription || effect.effectText || '';
          desc
            .toLowerCase()
            .replace(/[^a-zåäö0-9\s]/gi, '')
            .split(/\s+/)
            .filter((word: string) => word.length >= 3)
            .forEach((word: string) => {
              wordCounts[word] = (wordCounts[word] || 0) + 1;
            });
        });
      });
      topQualitativeEffectsWordcloud = Object.entries(wordCounts)
        .map(([text, value]) => ({ text, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 30);
    } catch (err) {
      console.error('Error calculating wordcloud data:', err);
    }

    // --- Effekt-spridning (bubble chart) ---
    let effectSpreadBubbleData: any[] = [];
    
    try {
      effectSpreadBubbleData = filteredProjects.map(project => {
        // Gather all unique affected groups
        const effectDetails = project.effects_data?.effectDetails || [];
        const groupSet = new Set<string>();
        effectDetails.forEach((effect: any) => {
          const measurements = effect.impactMeasurement?.measurements || [];
          measurements.forEach((m: any) => {
            (m.affectedGroups || []).forEach((g: string) => groupSet.add(g));
          });
        });
        const numGroups = groupSet.size;
        const monetaryValue = calculateProjectMonetaryValue(project) || 0;
        return { numGroups, monetaryValue, label: project.title };
      }).filter(d => d.numGroups > 0 && d.monetaryValue > 0);
    } catch (err) {
      console.error('Error calculating bubble chart data:', err);
    }

    // --- Service Level-radar (qualitative KPIs) ---
    let serviceLevelRadarData: any[] = [];
    
    try {
      serviceLevelRadarData = filteredProjects.map(project => {
        const kpis = {
          quality: 0,
          citizenSatisfaction: 0,
          innovation: 0,
          efficiency: 0,
          sustainability: 0,
          accessibility: 0
        };
        
        // Quality score based on effect details and measurements
        const effectDetails = project.effects_data?.effectDetails || [];
        if (effectDetails.length > 0) {
          kpis.quality = Math.min(100, effectDetails.length * 20);
        }
        
        // Citizen satisfaction based on affected groups
        const affectedGroups = extractAffectedGroups(project);
        if (affectedGroups.includes('Medborgare')) {
          kpis.citizenSatisfaction = 80;
        } else if (affectedGroups.length > 0) {
          kpis.citizenSatisfaction = 40;
        }
        
        // Innovation score based on value dimensions and technical complexity
        const valueDimensions = project.value_dimensions || [];
        if (valueDimensions.some((vd: string) => vd.includes('Innovation'))) {
          kpis.innovation = 90;
        } else if (valueDimensions.length > 0) {
          kpis.innovation = 50;
        }
        
        // Efficiency based on ROI and cost-effectiveness
        const roi = calculateROI(project);
        if (roi && roi > 100) {
          kpis.efficiency = 90;
        } else if (roi && roi > 0) {
          kpis.efficiency = 60;
        } else {
          kpis.efficiency = 30;
        }
        
        // Sustainability based on areas and value dimensions
        const areas = project.areas || [];
        if (areas.some((area: string) => area.includes('Miljö') || area.includes('Hållbar'))) {
          kpis.sustainability = 85;
        } else if (valueDimensions.some((vd: string) => vd.includes('Hållbar'))) {
          kpis.sustainability = 60;
        }
        
        // Accessibility based on affected groups diversity
        if (affectedGroups.length >= 3) {
          kpis.accessibility = 80;
        } else if (affectedGroups.length >= 2) {
          kpis.accessibility = 60;
        } else if (affectedGroups.length >= 1) {
          kpis.accessibility = 40;
        }
        
        return {
          projectId: project.id,
          title: project.title,
          kpis
        };
      });
    } catch (err) {
      console.error('Error calculating service level radar data:', err);
    }

    // --- FN:s hållbarhetsmål-kartläggning (SDG mapping) ---
    let sdgMappingData: any[] = [];
    
    try {
      // SDG mapping based on project areas and value dimensions
      const sdgMapping = {
        'Utbildning och skola': ['SDG4'],
        'Primärvård & e-hälsa': ['SDG3'],
        'Miljö & klimat': ['SDG13', 'SDG7'],
        'Transport & infrastruktur': ['SDG9', 'SDG11'],
        'Socialtjänst': ['SDG1', 'SDG10'],
        'Äldre- & funktionsstöd': ['SDG3', 'SDG10'],
        'Kultur & fritid': ['SDG11'],
        'Samhällsbyggnad & stadsplanering': ['SDG11', 'SDG9'],
        'Säkerhet & krisberedskap': ['SDG16'],
        'Ledning och styrning': ['SDG16'],
        'Intern administration': ['SDG16'],
        'Medborgarservice & kommunikation': ['SDG16', 'SDG11']
      };
      
      const valueDimensionSDGMapping = {
        'Innovation (nya tjänster)': ['SDG9'],
        'Etik, hållbarhet & ansvarsfull AI': ['SDG12', 'SDG13'],
        'Kostnadsbesparing': ['SDG12'],
        'Tidsbesparing': ['SDG8'],
        'Kvalitet / noggrannhet': ['SDG9'],
        'Medborgarnytta, upplevelse & service': ['SDG11'],
        'Kompetens & lärande': ['SDG4'],
        'Riskreduktion & säkerhet': ['SDG16'],
        'Ökade intäkter': ['SDG8']
      };
      
      sdgMappingData = filteredProjects.map(project => {
        const projectSDGs = new Set<string>();
        
        // Map based on areas
        (project.areas || []).forEach((area: string) => {
          const sdgs = (sdgMapping as any)[area] || [];
          sdgs.forEach((sdg: string) => projectSDGs.add(sdg));
        });
        
        // Map based on value dimensions
        (project.value_dimensions || []).forEach((vd: string) => {
          const sdgs = (valueDimensionSDGMapping as any)[vd] || [];
          sdgs.forEach((sdg: string) => projectSDGs.add(sdg));
        });
        
        return {
          projectId: project.id,
          title: project.title,
          sdgs: Array.from(projectSDGs),
          areas: project.areas || [],
          valueDimensions: project.value_dimensions || []
        };
      });
    } catch (err) {
      console.error('Error calculating SDG mapping data:', err);
    }

    // --- Tech stack-nätverk (force graph) ---
    let techStackNetworkData: any = { nodes: [], links: [] };
    
    try {
      // Collect all technologies and their co-occurrences
      const techCounts: Record<string, number> = {};
      const techCooccurrences: Record<string, Record<string, number>> = {};
      
      filteredProjects.forEach(project => {
        const technologies = extractTechnologies(project);
        
        // Count individual technologies
        technologies.forEach(tech => {
          techCounts[tech] = (techCounts[tech] || 0) + 1;
          if (!techCooccurrences[tech]) {
            techCooccurrences[tech] = {};
          }
        });
        
        // Count co-occurrences
        for (let i = 0; i < technologies.length; i++) {
          for (let j = i + 1; j < technologies.length; j++) {
            const tech1 = technologies[i];
            const tech2 = technologies[j];
            
            if (!techCooccurrences[tech1][tech2]) {
              techCooccurrences[tech1][tech2] = 0;
            }
            if (!techCooccurrences[tech2][tech1]) {
              techCooccurrences[tech2][tech1] = 0;
            }
            
            techCooccurrences[tech1][tech2]++;
            techCooccurrences[tech2][tech1]++;
          }
        }
      });
      
      // Create nodes
      const nodes = Object.entries(techCounts).map(([tech, count], index) => ({
        id: tech,
        name: tech,
        value: count,
        group: Math.floor(index / 3) + 1 // Simple grouping for visualization
      }));
      
      // Create links
      const links: any[] = [];
      Object.entries(techCooccurrences).forEach(([tech1, cooccurrences]) => {
        Object.entries(cooccurrences).forEach(([tech2, weight]) => {
          if (weight > 0 && tech1 < tech2) { // Avoid duplicate links
            links.push({
              source: tech1,
              target: tech2,
              value: weight
            });
          }
        });
      });
      
      techStackNetworkData = { nodes, links };
    } catch (err) {
      console.error('Error calculating tech stack network data:', err);
    }

    // --- Kommuner vs AI-områden (heatmap) ---
    let municipalityAIHeatmapData: any[] = [];
    
    try {
      // Get unique municipalities and AI areas
      const municipalities = [...new Set(filteredProjects.map(p => p.municipality).filter(Boolean))];
      const aiAreas = [...new Set(filteredProjects.flatMap(p => p.areas || []).filter(Boolean))];
      
      // Create heatmap data
      municipalityAIHeatmapData = municipalities.flatMap(municipality => 
        aiAreas.map(area => {
          const count = filteredProjects.filter(project => 
            project.municipality === municipality && 
            (project.areas || []).includes(area)
          ).length;
          
          return {
            municipality,
            area,
            count,
            // Add some derived metrics for better visualization
            totalProjects: filteredProjects.filter(p => p.municipality === municipality).length,
            areaPercentage: count > 0 ? (count / filteredProjects.filter(p => p.municipality === municipality).length) * 100 : 0
          };
        })
      );
    } catch (err) {
      console.error('Error calculating municipality AI heatmap data:', err);
    }

    // --- Tidslinje över projekt (timeline) ---
    let projectTimelineData: any[] = [];
    
    try {
      projectTimelineData = filteredProjects
        .filter(project => project.created_at || project.updated_at)
        .map(project => {
          const createdDate = project.created_at ? new Date(project.created_at) : null;
          const updatedDate = project.updated_at ? new Date(project.updated_at) : null;
          
          // Determine project status/phase based on available data
          let phase = 'Planering';
          if (project.status === 'completed') {
            phase = 'Genomförd';
          } else if (project.status === 'in_progress') {
            phase = 'Pågående';
          } else if (project.costs_data?.totalCost && project.costs_data.totalCost > 0) {
            phase = 'Budgeterad';
          }
          
          return {
            id: project.id,
            title: project.title,
            municipality: project.municipality,
            phase,
            startDate: createdDate,
            endDate: updatedDate,
            // Add derived timeline data
            duration: createdDate && updatedDate ? 
              Math.ceil((updatedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) : null,
            totalCost: project.costs_data?.totalCost || 0,
            areas: project.areas || []
          };
        })
        .sort((a, b) => {
          // Sort by start date, then by title
          if (a.startDate && b.startDate) {
            return a.startDate.getTime() - b.startDate.getTime();
          }
          return (a.title || '').localeCompare(b.title || '');
        });
    } catch (err) {
      console.error('Error calculating project timeline data:', err);
    }

    // --- Risk vs nytta-matris (scatter plot) ---
    let riskBenefitMatrixData: any[] = [];
    
    try {
      riskBenefitMatrixData = filteredProjects.map(project => {
        // Calculate risk score based on various factors
        let riskScore = 0;
        
        // Technology complexity risk
        const technologies = extractTechnologies(project);
        if (technologies.some(tech => tech.toLowerCase().includes('ai') || tech.toLowerCase().includes('maskininlärning'))) {
          riskScore += 30;
        }
        if (technologies.some(tech => tech.toLowerCase().includes('blockchain') || tech.toLowerCase().includes('iot'))) {
          riskScore += 20;
        }
        
        // Cost risk
        const totalCost = project.costs_data?.totalCost || 0;
        if (totalCost > 1000000) {
          riskScore += 25;
        } else if (totalCost > 500000) {
          riskScore += 15;
        } else if (totalCost > 100000) {
          riskScore += 10;
        }
        
        // Legal/ethical risk
        const legalData = project.legal_data;
        if (legalData?.dataProtection || legalData?.aiEthics || legalData?.transparency) {
          riskScore += 15;
        }
        
        // Calculate benefit score
        let benefitScore = 0;
        
        // ROI benefit
        const roi = calculateROI(project);
        if (roi && roi > 200) {
          benefitScore += 40;
        } else if (roi && roi > 100) {
          benefitScore += 30;
        } else if (roi && roi > 0) {
          benefitScore += 20;
        }
        
        // Citizen impact benefit
        const affectedGroups = extractAffectedGroups(project);
        if (affectedGroups.includes('Medborgare')) {
          benefitScore += 25;
        }
        if (affectedGroups.length > 2) {
          benefitScore += 15;
        }
        
        // Innovation benefit
        const valueDimensions = project.value_dimensions || [];
        if (valueDimensions.some((vd: string) => vd.includes('Innovation'))) {
          benefitScore += 20;
        }
        
        // Normalize scores to 0-100
        riskScore = Math.min(100, riskScore);
        benefitScore = Math.min(100, benefitScore);
        
        return {
          projectId: project.id,
          title: project.title,
          municipality: project.municipality,
          riskScore,
          benefitScore,
          totalCost,
          roi,
          affectedGroups,
          areas: project.areas || [],
          // Add quadrant classification
          quadrant: riskScore > 50 && benefitScore > 50 ? 'High Risk, High Reward' :
                   riskScore > 50 && benefitScore <= 50 ? 'High Risk, Low Reward' :
                   riskScore <= 50 && benefitScore > 50 ? 'Low Risk, High Reward' : 'Low Risk, Low Reward'
        };
      });
    } catch (err) {
      console.error('Error calculating risk benefit matrix data:', err);
    }

    // --- Kompetensgap-analys (skill gap analysis) ---
    let skillGapAnalysisData: any = { required: [], available: [], gaps: [] };
    
    try {
      // Define skill categories and their associated technologies/requirements
      const skillCategories = {
        'AI/ML': ['AI', 'Machine Learning', 'Deep Learning', 'Neural Networks', 'Natural Language Processing'],
        'Data Engineering': ['Data Processing', 'ETL', 'Data Warehousing', 'Big Data', 'Data Pipeline'],
        'Software Development': ['Web Development', 'Mobile Development', 'API Development', 'Database Design'],
        'DevOps': ['CI/CD', 'Cloud Infrastructure', 'Containerization', 'Monitoring', 'Security'],
        'Business Analysis': ['Process Analysis', 'Requirements Gathering', 'Stakeholder Management', 'Change Management'],
        'Legal & Ethics': ['Data Protection', 'AI Ethics', 'Compliance', 'Transparency', 'Privacy'],
        'Project Management': ['Agile', 'Scrum', 'Risk Management', 'Budget Management', 'Stakeholder Communication']
      };
      
      // Analyze required skills from projects
      const requiredSkills: Record<string, number> = {};
      const availableSkills: Record<string, number> = {};
      
      filteredProjects.forEach(project => {
        const technologies = extractTechnologies(project);
        const areas = project.areas || [];
        const valueDimensions = project.value_dimensions || [];
        
        // Map technologies and areas to skill categories
        Object.entries(skillCategories).forEach(([category, skills]) => {
          const relevance = skills.reduce((score, skill) => {
            const techMatch = technologies.some(tech => 
              tech.toLowerCase().includes(skill.toLowerCase())
            );
            const areaMatch = areas.some((area: string) => 
              area.toLowerCase().includes(skill.toLowerCase())
            );
            return score + (techMatch ? 1 : 0) + (areaMatch ? 1 : 0);
          }, 0);
          
          if (relevance > 0) {
            requiredSkills[category] = (requiredSkills[category] || 0) + relevance;
          }
        });
        
        // Estimate available skills based on project success and complexity
        const projectComplexity = technologies.length + areas.length;
        if (projectComplexity > 0) {
          Object.keys(skillCategories).forEach(category => {
            availableSkills[category] = (availableSkills[category] || 0) + Math.min(projectComplexity, 3);
          });
        }
      });
      
      // Calculate skill gaps
      const gaps = Object.keys(skillCategories).map(category => {
        const required = requiredSkills[category] || 0;
        const available = availableSkills[category] || 0;
        const gap = required - available;
        
        return {
          category,
          required,
          available,
          gap,
          gapPercentage: required > 0 ? (gap / required) * 100 : 0,
          status: gap > 0 ? 'Critical Gap' : gap < 0 ? 'Surplus' : 'Balanced'
        };
      });
      
      skillGapAnalysisData = {
        required: Object.entries(requiredSkills).map(([category, count]) => ({ category, count })),
        available: Object.entries(availableSkills).map(([category, count]) => ({ category, count })),
        gaps
      };
    } catch (err) {
      console.error('Error calculating skill gap analysis data:', err);
    }

    // --- Framtida trender-prognos (trend forecasting) ---
    let futureTrendsForecastData: any = { technologyTrends: [], areaTrends: [], adoptionTrends: [] };
    
    try {
      // Analyze technology adoption trends
      const techAdoptionTrends: Record<string, number> = {};
      const areaAdoptionTrends: Record<string, number> = {};
      
      filteredProjects.forEach(project => {
        const technologies = extractTechnologies(project);
        const areas = project.areas || [];
        const createdDate = project.created_at ? new Date(project.created_at) : null;
        
        // Weight by recency (newer projects have more weight)
        const recencyWeight = createdDate ? 
          Math.max(0.5, (createdDate.getTime() - new Date('2020-01-01').getTime()) / (Date.now() - new Date('2020-01-01').getTime())) : 1;
        
        technologies.forEach(tech => {
          techAdoptionTrends[tech] = (techAdoptionTrends[tech] || 0) + recencyWeight;
        });
        
        areas.forEach((area: string) => {
          areaAdoptionTrends[area] = (areaAdoptionTrends[area] || 0) + recencyWeight;
        });
      });
      
      // Project future trends (next 2 years)
      const technologyTrends = Object.entries(techAdoptionTrends)
        .map(([tech, currentAdoption]) => {
          const growthRate = currentAdoption > 0 ? Math.min(2.5, 1 + (currentAdoption / 10)) : 1.2;
          const projectedAdoption = currentAdoption * growthRate;
          
          return {
            technology: tech,
            currentAdoption,
            projectedAdoption: Math.round(projectedAdoption * 100) / 100,
            growthRate: Math.round((growthRate - 1) * 100),
            trend: growthRate > 1.5 ? 'Rising' : growthRate > 1.2 ? 'Stable' : 'Declining'
          };
        })
        .sort((a, b) => b.projectedAdoption - a.projectedAdoption)
        .slice(0, 10);
      
      const areaTrends = Object.entries(areaAdoptionTrends)
        .map(([area, currentAdoption]) => {
          const growthRate = currentAdoption > 0 ? Math.min(2.0, 1 + (currentAdoption / 15)) : 1.15;
          const projectedAdoption = currentAdoption * growthRate;
          
          return {
            area,
            currentAdoption,
            projectedAdoption: Math.round(projectedAdoption * 100) / 100,
            growthRate: Math.round((growthRate - 1) * 100),
            trend: growthRate > 1.3 ? 'Rising' : growthRate > 1.1 ? 'Stable' : 'Declining'
          };
        })
        .sort((a, b) => b.projectedAdoption - a.projectedAdoption);
      
      // Overall adoption trend
      const totalProjects = filteredProjects.length;
      const recentProjects = filteredProjects.filter(p => 
        p.created_at && new Date(p.created_at) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      ).length;
      
      const adoptionGrowthRate = totalProjects > 0 ? (recentProjects / totalProjects) * 4 : 0; // Annualized rate
      const projectedTotalProjects = Math.round(totalProjects * (1 + adoptionGrowthRate));
      
      const adoptionTrends = {
        currentTotal: totalProjects,
        recentGrowth: recentProjects,
        growthRate: Math.round(adoptionGrowthRate * 100),
        projectedTotal: projectedTotalProjects,
        trend: adoptionGrowthRate > 0.5 ? 'Strong Growth' : 
               adoptionGrowthRate > 0.2 ? 'Moderate Growth' : 
               adoptionGrowthRate > 0 ? 'Slow Growth' : 'Declining'
      };
      
      futureTrendsForecastData = {
        technologyTrends,
        areaTrends,
        adoptionTrends
      };
    } catch (err) {
      console.error('Error calculating future trends forecast data:', err);
    }



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
        roiByValueDimension: analyzeROIByValueDimension(filteredProjects),
      },
      technologyInsights: {
        mostUsedTechnologies: getMostUsedTechnologies(filteredProjects),
        deploymentEnvironments: analyzeDeploymentEnvironments(filteredProjects),
        dataTypes: analyzeDataTypes(filteredProjects),
        integrationPatterns: analyzeIntegrationPatterns(filteredProjects),
        technicalChallenges: analyzeTechnicalChallenges(filteredProjects),
      },
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
      })),
      nationalSavingsSimulation: {
        totalSimulatedSavings: Math.round(simulatedSavings),
        savingsPerInhabitant: Math.round(savingsPerInhabitant),
        usedPopulation,
        usedMunicipalityCount
      },
      budgetSankeyData: {
        nodes,
        links
      },
      costEffectHeatmapData,
      breakEvenData,
      topQualitativeEffectsWordcloud,
      effectSpreadBubbleData,
      serviceLevelRadarData,
      sdgMappingData,
      techStackNetworkData,
      municipalityAIHeatmapData,
      projectTimelineData,
      riskBenefitMatrixData,
      skillGapAnalysisData,
      futureTrendsForecastData,
    };



    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Unexpected error in analytics API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions
function extractBudgetAmount(project: any): number | null {
  try {
    const costData = project?.cost_data || {};
    const budgetAmount = costData.budgetDetails?.budgetAmount;
    
    // Ensure we return a number, not a string
    if (budgetAmount === null || budgetAmount === undefined) {
      return null;
    }
    
    // Convert string to number if needed
    const numericBudget = typeof budgetAmount === 'string' ? parseFloat(budgetAmount) : budgetAmount;
    
    // Return null if conversion failed or result is NaN
    return isNaN(numericBudget) ? null : numericBudget;
  } catch (err) {
    console.error('Error extracting budget amount:', err);
    return null;
  }
}

function calculateActualCost(project: any): number {
  try {
    const costData = project?.cost_data || {};
    const costEntries = costData.actualCostDetails?.costEntries || [];
    
    return costEntries.reduce((total: number, entry: any) => {
      if (!entry) return total;
      
      let entryTotal = 0;
      
      // Use new cost structure
      switch (entry.costUnit) {
        case 'hours':
          const hours = Number(entry.hoursDetails?.hours) || 0;
          const rate = Number(entry.hoursDetails?.hourlyRate) || 0;
          entryTotal = hours * rate;
          break;
        case 'fixed':
          entryTotal = Number(entry.fixedDetails?.fixedAmount) || 0;
          break;
        case 'monthly':
          const monthlyAmount = Number(entry.monthlyDetails?.monthlyAmount) || 0;
          const monthlyDuration = Number(entry.monthlyDetails?.monthlyDuration) || 1;
          entryTotal = monthlyAmount * monthlyDuration;
          break;
        case 'yearly':
          const yearlyAmount = Number(entry.yearlyDetails?.yearlyAmount) || 0;
          const yearlyDuration = Number(entry.yearlyDetails?.yearlyDuration) || 1;
          entryTotal = yearlyAmount * yearlyDuration;
          break;
        default:
          // Fallback to old structure for legacy data
          const hours_old = typeof entry?.costHours === 'string' ? parseFloat(entry.costHours) || 0 : (entry?.costHours || 0);
          const rate_old = typeof entry?.costRate === 'string' ? parseFloat(entry.costRate) || 0 : (entry?.costRate || 0);
          const fixed_old = typeof entry?.costFixed === 'string' ? parseFloat(entry.costFixed) || 0 : (entry?.costFixed || 0);
          
          if (hours_old >= 0 && rate_old >= 0 && fixed_old >= 0) {
            entryTotal = (hours_old * rate_old) + fixed_old;
          }
      }
      
      return total + entryTotal;
    }, 0);
  } catch (err) {
    console.error('Error calculating actual cost:', err);
    return 0;
  }
}

function calculateROI(project: any): number | null {
  try {
    // Use the new comprehensive ROI calculator
    const { calculateROI: newCalculateROI } = require('@/lib/roiCalculator');
    
    const effectEntries = project.effects_data?.effectDetails || [];
    const costEntries = project.cost_data?.actualCostDetails?.costEntries || [];
    
    if (effectEntries.length === 0) return null;
    
    // Calculate total investment from cost entries
    const totalInvestment = costEntries.reduce((total: number, entry: any) => {
      if (!entry) return total;
      
      let entryTotal = 0;
      
      switch (entry.costUnit) {
        case 'hours':
          const hours = Number(entry.hoursDetails?.hours) || 0;
          const rate = Number(entry.hoursDetails?.hourlyRate) || 0;
          entryTotal = hours * rate;
          break;
        case 'fixed':
          entryTotal = Number(entry.fixedDetails?.fixedAmount) || 0;
          break;
        case 'monthly':
          const monthlyAmount = Number(entry.monthlyDetails?.monthlyAmount) || 0;
          const monthlyDuration = Number(entry.monthlyDetails?.monthlyDuration) || 1;
          entryTotal = monthlyAmount * monthlyDuration;
          break;
        case 'yearly':
          const yearlyAmount = Number(entry.yearlyDetails?.yearlyAmount) || 0;
          const yearlyDuration = Number(entry.yearlyDetails?.yearlyDuration) || 1;
          entryTotal = yearlyAmount * yearlyDuration;
          break;
        default:
          entryTotal = 0;
      }
      
      return total + entryTotal;
    }, 0);
    
    const roiMetrics = newCalculateROI({ 
      effectEntries, 
      totalProjectInvestment: totalInvestment 
    });
    
    return roiMetrics.economicROI * 100; // Convert to percentage
  } catch (err) {
    console.error('Error calculating ROI:', err);
    return null;
  }
}

function calculateProjectMonetaryValue(project: any): number {
  try {
    // Use the new comprehensive ROI calculator to get total monetary value
    const { calculateROI: newCalculateROI } = require('@/lib/roiCalculator');
    
    const effectEntries = project.effects_data?.effectDetails || [];
    const costEntries = project.cost_data?.actualCostDetails?.costEntries || [];
    
    if (effectEntries.length === 0) return 0;
    
    // Calculate total investment from cost entries
    const totalInvestment = costEntries.reduce((total: number, entry: any) => {
      if (!entry) return total;
      
      let entryTotal = 0;
      
      switch (entry.costUnit) {
        case 'hours':
          const hours = Number(entry.hoursDetails?.hours) || 0;
          const rate = Number(entry.hoursDetails?.hourlyRate) || 0;
          entryTotal = hours * rate;
          break;
        case 'fixed':
          entryTotal = Number(entry.fixedDetails?.fixedAmount) || 0;
          break;
        case 'monthly':
          const monthlyAmount = Number(entry.monthlyDetails?.monthlyAmount) || 0;
          const monthlyDuration = Number(entry.monthlyDetails?.monthlyDuration) || 1;
          entryTotal = monthlyAmount * monthlyDuration;
          break;
        case 'yearly':
          const yearlyAmount = Number(entry.yearlyDetails?.yearlyAmount) || 0;
          const yearlyDuration = Number(entry.yearlyDetails?.yearlyDuration) || 1;
          entryTotal = yearlyAmount * yearlyDuration;
          break;
        default:
          entryTotal = 0;
      }
      
      return total + entryTotal;
    }, 0);
    
    const roiMetrics = newCalculateROI({ 
      effectEntries, 
      totalProjectInvestment: totalInvestment 
    });
    
    return roiMetrics.totalMonetaryValue || 0;
  } catch (err) {
    console.error('Error calculating project monetary value:', err);
    
    // Fallback to old calculation method
    try {
      const effectsData = project?.effects_data || {};
      const effectDetails = effectsData.effectDetails || [];
      
      let totalValue = 0;
      
      effectDetails.forEach((effect: any) => {
        const measurements = effect?.impactMeasurement?.measurements || [];
        measurements.forEach((measurement: any) => {
          if (measurement?.monetaryEstimate) {
            totalValue += parseFloat(measurement.monetaryEstimate) || 0;
          }
        });
      });
      
      return totalValue;
    } catch (fallbackErr) {
      console.error('Error in fallback monetary value calculation:', fallbackErr);
      return 0;
    }
  }
}

function extractAffectedGroups(project: any): string[] {
  try {
    const effectsData = project?.effects_data || {};
    const effectDetails = effectsData.effectDetails || [];
    const groups = new Set<string>();
    
    effectDetails.forEach((effect: any) => {
      const measurements = effect?.impactMeasurement?.measurements || [];
      measurements.forEach((measurement: any) => {
        if (measurement?.affectedGroups) {
          measurement.affectedGroups.forEach((group: string) => groups.add(group));
        }
      });
    });
    
    return Array.from(groups);
  } catch (err) {
    console.error('Error extracting affected groups:', err);
    return [];
  }
}

function extractTechnologies(project: any): string[] {
  try {
    const techData = project?.technical_data || {};
    const technologies = [];
    
    if (techData.system_name && techData.system_name.trim() !== '') {
      technologies.push(techData.system_name);
    }
    if (techData.ai_methodology && techData.ai_methodology.trim() !== '') {
      technologies.push(techData.ai_methodology);
    }
    if (techData.deployment_environment && techData.deployment_environment.trim() !== '') {
      technologies.push(techData.deployment_environment);
    }
    if (techData.data_types && Array.isArray(techData.data_types)) {
      technologies.push(...techData.data_types.filter((type: string) => type && type.trim() !== ''));
    }
    if (techData.data_license_link && techData.data_license_link.trim() !== '') {
      technologies.push(techData.data_license_link);
    }
    
    return technologies;
  } catch (err) {
    console.error('Error extracting technologies:', err);
    return [];
  }
}

function extractEffectsSummary(project: any): any {
  try {
    const effectsData = project?.effects_data || {};
    const effectDetails = effectsData.effectDetails || [];
    
    let totalMeasurements = 0;
    let totalMonetaryValue = 0;
    const effectTypes = new Set<string>();
    
    effectDetails.forEach((effect: any) => {
      const measurements = effect?.impactMeasurement?.measurements || [];
      totalMeasurements += measurements.length;
      
      measurements.forEach((measurement: any) => {
        if (measurement?.effectChangeType) {
          effectTypes.add(measurement.effectChangeType);
        }
        if (measurement?.monetaryEstimate) {
          totalMonetaryValue += parseFloat(measurement.monetaryEstimate) || 0;
        }
      });
    });
    
    return {
      totalMeasurements,
      totalMonetaryValue,
      effectTypes: Array.from(effectTypes)
    };
  } catch (err) {
    console.error('Error extracting effects summary:', err);
    return { totalMeasurements: 0, totalMonetaryValue: 0, effectTypes: [] };
  }
}

function calculateTotalBudget(projects: any[]): number {
  try {
    const total = projects.reduce((total, project) => {
      const budget = extractBudgetAmount(project);
      return total + (budget || 0);
    }, 0);
    

    return total;
  } catch (err) {
    console.error('Error calculating total budget:', err);
    return 0;
  }
}

function calculateAverageBudget(projects: any[]): number {
  try {
    const total = calculateTotalBudget(projects);
    const average = projects.length > 0 ? total / projects.length : 0;
    

    return average;
  } catch (err) {
    console.error('Error calculating average budget:', err);
    return 0;
  }
}

function calculateTotalROI(projects: any[]): number {
  try {
    // Only include projects with valid ROI (non-null, non-zero, finite numbers)
    const rois = projects
      .map(project => calculateROI(project))
      .filter((roi): roi is number => roi !== null && roi !== 0 && isFinite(roi as number));
    return rois.length > 0 ? rois.reduce((sum, roi) => sum + roi, 0) : 0;
  } catch (err) {
    console.error('Error calculating total ROI:', err);
    return 0;
  }
}

function calculateAverageROI(projects: any[]): number {
  try {
    // Only include projects with valid ROI (non-null, non-zero, finite numbers)
    const rois = projects
      .map(project => calculateROI(project))
      .filter((roi): roi is number => roi !== null && roi !== 0 && isFinite(roi as number));
    return rois.length > 0 ? rois.reduce((sum, roi) => sum + roi, 0) / rois.length : 0;
  } catch (err) {
    console.error('Error calculating average ROI:', err);
    return 0;
  }
}

function groupBy(array: any[], key: string) {
  try {
    return array.reduce((groups, item) => {
      const value = item[key];
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {});
  } catch (err) {
    console.error('Error in groupBy:', err);
    return {};
  }
}

function analyzeByCounty(projects: any[]) {
  try {
    const countyCounts: Record<string, number> = {};
    projects.forEach(project => {
      (project.project_municipalities || []).forEach((pm: any) => {
        const county = pm.municipalities?.county;
        if (county) {
          countyCounts[county] = (countyCounts[county] || 0) + 1;
        }
      });
    });
    return countyCounts;
  } catch (err) {
    console.error('Error analyzing by county:', err);
    return {};
  }
}

function analyzeByArea(projects: any[]) {
  try {
    const areaCounts: Record<string, number> = {};
    projects.forEach(project => {
      (project.project_areas || []).forEach((pa: any) => {
        const area = pa.areas?.name;
        if (area) {
          areaCounts[area] = (areaCounts[area] || 0) + 1;
        }
      });
    });
    return areaCounts;
  } catch (err) {
    console.error('Error analyzing by area:', err);
    return {};
  }
}

function analyzeByValueDimension(projects: any[]) {
  try {
    const dimensionCounts: Record<string, number> = {};
    projects.forEach(project => {
      (project.project_value_dimensions || []).forEach((pvd: any) => {
        const dimension = pvd.value_dimensions?.name;
        if (dimension) {
          dimensionCounts[dimension] = (dimensionCounts[dimension] || 0) + 1;
        }
      });
    });
    return dimensionCounts;
  } catch (err) {
    console.error('Error analyzing by value dimension:', err);
    return {};
  }
}

function analyzeByBudgetRange(projects: any[]) {
  try {
    const ranges: Record<string, number> = {
      '0-100k': 0,
      '100k-500k': 0,
      '500k-1M': 0,
      '1M-5M': 0,
      '5M+': 0
    };
    
    projects.forEach(project => {
      const budget = extractBudgetAmount(project) || 0;
      if (budget <= 100000) ranges['0-100k']++;
      else if (budget <= 500000) ranges['100k-500k']++;
      else if (budget <= 1000000) ranges['500k-1M']++;
      else if (budget <= 5000000) ranges['1M-5M']++;
      else ranges['5M+']++;
    });
    
    return ranges;
  } catch (err) {
    console.error('Error analyzing by budget range:', err);
    return {};
  }
}

function analyzeByTechnology(projects: any[]) {
  try {
    const techCounts: Record<string, number> = {};
    projects.forEach(project => {
      const technologies = extractTechnologies(project);
      technologies.forEach(tech => {
        techCounts[tech] = (techCounts[tech] || 0) + 1;
      });
    });
    return techCounts;
  } catch (err) {
    console.error('Error analyzing by technology:', err);
    return {};
  }
}

function analyzeByAffectedGroups(projects: any[]) {
  try {
    const groupCounts: Record<string, number> = {};
    projects.forEach(project => {
      const groups = extractAffectedGroups(project);
      groups.forEach(group => {
        groupCounts[group] = (groupCounts[group] || 0) + 1;
      });
    });
    return groupCounts;
  } catch (err) {
    console.error('Error analyzing by affected groups:', err);
    return {};
  }
}

function analyzeCostTypes(projects: any[]) {
  try {
    const costTypeData: Record<string, { count: number; totalCost: number }> = {};
    
    projects.forEach(project => {
      const costEntries = project.cost_data?.actualCostDetails?.costEntries || [];
      costEntries.forEach((entry: any) => {
        let costType = entry?.costType;
        let cost = 0;
        
        // Use new cost structure
        if (entry?.costUnit) {
          costType = entry.costType || entry.costUnit; // Use costUnit if costType is not available
          
          switch (entry.costUnit) {
            case 'hours':
              const hours = Number(entry.hoursDetails?.hours) || 0;
              const rate = Number(entry.hoursDetails?.hourlyRate) || 0;
              cost = hours * rate;
              break;
            case 'fixed':
              cost = Number(entry.fixedDetails?.fixedAmount) || 0;
              break;
            case 'monthly':
              const monthlyAmount = Number(entry.monthlyDetails?.monthlyAmount) || 0;
              const monthlyDuration = Number(entry.monthlyDetails?.monthlyDuration) || 1;
              cost = monthlyAmount * monthlyDuration;
              break;
            case 'yearly':
              const yearlyAmount = Number(entry.yearlyDetails?.yearlyAmount) || 0;
              const yearlyDuration = Number(entry.yearlyDetails?.yearlyDuration) || 1;
              cost = yearlyAmount * yearlyDuration;
              break;
          }
        } else if (entry?.costType) {
          // Fallback to old structure
          const hours = typeof entry.costHours === 'string' ? parseFloat(entry.costHours) || 0 : (entry.costHours || 0);
          const rate = typeof entry.costRate === 'string' ? parseFloat(entry.costRate) || 0 : (entry.costRate || 0);
          const fixed = typeof entry.costFixed === 'string' ? parseFloat(entry.costFixed) || 0 : (entry.costFixed || 0);
          cost = hours * rate + fixed;
        }
        
        if (costType && cost > 0) {
          if (!costTypeData[costType]) {
            costTypeData[costType] = { count: 0, totalCost: 0 };
          }
          costTypeData[costType].count++;
          costTypeData[costType].totalCost += cost;
        }
      });
    });
    
    return costTypeData;
  } catch (err) {
    console.error('Error analyzing cost types:', err);
    return {};
  }
}

function analyzeBudgetVsActual(projects: any[]) {
  try {
    return projects.map(project => {
      const budget = extractBudgetAmount(project) || 0;
      const actualCost = calculateActualCost(project);
      return {
        projectId: project.id,
        title: project.title,
        budget,
        actualCost,
        variance: actualCost - budget
      };
    });
  } catch (err) {
    console.error('Error analyzing budget vs actual:', err);
    return [];
  }
}

function analyzeCostPerHour(projects: any[]) {
  try {
    const rates: number[] = [];
    
    projects.forEach(project => {
      const costEntries = project.cost_data?.actualCostDetails?.costEntries || [];
      costEntries.forEach((entry: any) => {
        let rate = 0;
        
        // Use new cost structure
        if (entry?.costUnit === 'hours' && entry?.hoursDetails?.hourlyRate) {
          rate = Number(entry.hoursDetails.hourlyRate) || 0;
        } else if (entry?.costRate) {
          // Fallback to old structure
          rate = typeof entry.costRate === 'string' ? parseFloat(entry.costRate) || 0 : (entry.costRate || 0);
        }
        
        if (rate > 0) {
          rates.push(rate);
        }
      });
    });
    
    if (rates.length === 0) {
      return { average: 0, min: 0, max: 0, median: 0 };
    }
    
    const sortedRates = rates.sort((a, b) => a - b);
    const median = sortedRates[Math.floor(sortedRates.length / 2)];
    
    return {
      average: rates.reduce((sum, rate) => sum + rate, 0) / rates.length,
      min: Math.min(...rates),
      max: Math.max(...rates),
      median
    };
  } catch (err) {
    console.error('Error analyzing cost per hour:', err);
    return { average: 0, min: 0, max: 0, median: 0 };
  }
}

function analyzeEffectTypes(projects: any[]) {
  try {
    const effectTypeCounts: Record<string, number> = {};
    
    projects.forEach(project => {
      const effectDetails = project.effects_data?.effectDetails || [];
      effectDetails.forEach((effect: any) => {
        const measurements = effect?.impactMeasurement?.measurements || [];
        measurements.forEach((measurement: any) => {
          if (measurement?.effectChangeType) {
            effectTypeCounts[measurement.effectChangeType] = (effectTypeCounts[measurement.effectChangeType] || 0) + 1;
          }
        });
      });
    });
    
    return effectTypeCounts;
  } catch (err) {
    console.error('Error analyzing effect types:', err);
    return {};
  }
}

function analyzeQuantifiableEffects(projects: any[]) {
  try {
    let withQuantifiable = 0;
    let withoutQuantifiable = 0;
    
    projects.forEach(project => {
      const effectDetails = project.effects_data?.effectDetails || [];
      let hasQuantifiable = false;
      
      effectDetails.forEach((effect: any) => {
        if (effect?.hasQuantitative) {
          hasQuantifiable = true;
        }
      });
      
      if (hasQuantifiable) {
        withQuantifiable++;
      } else {
        withoutQuantifiable++;
      }
    });
    
    const total = withQuantifiable + withoutQuantifiable;
    const percentage = total > 0 ? (withQuantifiable / total) * 100 : 0;
    
    return {
      withQuantifiable,
      withoutQuantifiable,
      percentage
    };
  } catch (err) {
    console.error('Error analyzing quantifiable effects:', err);
    return { withQuantifiable: 0, withoutQuantifiable: 0, percentage: 0 };
  }
}

function calculateTotalMonetaryValue(projects: any[]): number {
  try {
    return projects.reduce((total, project) => {
      return total + calculateProjectMonetaryValue(project);
    }, 0);
  } catch (err) {
    console.error('Error calculating total monetary value:', err);
    return 0;
  }
}

function analyzeAffectedPopulation(projects: any[]) {
  try {
    const groupBreakdown: Record<string, number> = {};
    let totalAffected = 0;
    let totalGroups = 0;
    
    projects.forEach(project => {
      const groups = extractAffectedGroups(project);
      totalGroups += groups.length;
      
      groups.forEach(group => {
        groupBreakdown[group] = (groupBreakdown[group] || 0) + 1;
        totalAffected++;
      });
    });
    
    return {
      breakdown: groupBreakdown,
      totalAffected,
      averageGroupsPerProject: projects.length > 0 ? totalGroups / projects.length : 0
    };
  } catch (err) {
    console.error('Error analyzing affected population:', err);
    return { breakdown: {}, totalAffected: 0, averageGroupsPerProject: 0 };
  }
}

function getMostUsedTechnologies(projects: any[]) {
  try {
    const techCounts: Record<string, number> = {};
    
    projects.forEach(project => {
      const technologies = extractTechnologies(project);
      technologies.forEach(tech => {
        techCounts[tech] = (techCounts[tech] || 0) + 1;
      });
    });
    
    return Object.entries(techCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  } catch (err) {
    console.error('Error getting most used technologies:', err);
    return [];
  }
}

function analyzeDeploymentEnvironments(projects: any[]) {
  try {
    const envCounts: Record<string, number> = {};
    
    projects.forEach(project => {
      const env = project.technical_data?.deployment_environment;
      if (env) {
        envCounts[env] = (envCounts[env] || 0) + 1;
      }
    });
    
    return envCounts;
  } catch (err) {
    console.error('Error analyzing deployment environments:', err);
    return {};
  }
}

function analyzeDataTypes(projects: any[]) {
  try {
    const dataTypeCounts: Record<string, number> = {};
    
    projects.forEach(project => {
      const dataTypes = project.technical_data?.data_types || [];
      dataTypes.forEach((type: string) => {
        dataTypeCounts[type] = (dataTypeCounts[type] || 0) + 1;
      });
    });
    
    return dataTypeCounts;
  } catch (err) {
    console.error('Error analyzing data types:', err);
    return {};
  }
}

function analyzeIntegrationPatterns(projects: any[]) {
  try {
    const patternCounts: Record<string, number> = {};
    
    projects.forEach(project => {
      const patterns = project.technical_data?.integration_patterns || [];
      patterns.forEach((pattern: string) => {
        patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
      });
    });
    
    return patternCounts;
  } catch (err) {
    console.error('Error analyzing integration patterns:', err);
    return {};
  }
}

function analyzeTechnicalChallenges(projects: any[]) {
  try {
    const challenges: string[] = [];
    const solutions: string[] = [];
    
    projects.forEach(project => {
      const techData = project.technical_data || {};
      if (techData.challenges) {
        challenges.push(...(Array.isArray(techData.challenges) ? techData.challenges : [techData.challenges]));
      }
      if (techData.solutions) {
        solutions.push(...(Array.isArray(techData.solutions) ? techData.solutions : [techData.solutions]));
      }
    });
    
    return {
      totalChallenges: challenges.length,
      totalSolutions: solutions.length,
      resolutionRate: challenges.length > 0 ? (solutions.length / challenges.length) * 100 : 0,
      challenges: challenges.slice(0, 10),
      solutions: solutions.slice(0, 10)
    };
  } catch (err) {
    console.error('Error analyzing technical challenges:', err);
    return { totalChallenges: 0, totalSolutions: 0, resolutionRate: 0, challenges: [], solutions: [] };
  }
}

function getTopProjectsByROI(projects: any[], limit: number) {
  try {
    return projects
      .map(project => {
        const roi = calculateROI(project);
        const actualCost = calculateActualCost(project);
        return {
          id: project.id,
          title: project.title,
          roi: roi,
          budget: actualCost
        };
      })
      .filter((project): project is { id: string; title: string; roi: number; budget: number } => 
        project.roi !== null && project.roi !== 0 && isFinite(project.roi))
      .sort((a, b) => b.roi - a.roi)
      .slice(0, limit);
  } catch (err) {
    console.error('Error getting top projects by ROI:', err);
    return [];
  }
}

function getTopProjectsByBudget(projects: any[], limit: number) {
  try {
    return projects
      .map(project => ({
        id: project.id,
        title: project.title,
        budget: extractBudgetAmount(project) || 0
      }))
      .sort((a, b) => b.budget - a.budget)
      .slice(0, limit);
  } catch (err) {
    console.error('Error getting top projects by budget:', err);
    return [];
  }
}

function getProjectsByAffectedGroups(projects: any[], limit: number) {
  try {
    return projects
      .map(project => ({
        id: project.id,
        title: project.title,
        affectedGroups: extractAffectedGroups(project)
      }))
      .sort((a, b) => b.affectedGroups.length - a.affectedGroups.length)
      .slice(0, limit);
  } catch (err) {
    console.error('Error getting projects by affected groups:', err);
    return [];
  }
}

function getMostInnovativeProjects(projects: any[], limit: number) {
  try {
    return projects
      .filter(project => {
        const valueDimensions = project.value_dimensions || [];
        return valueDimensions.some((vd: string) => vd.includes('Innovation'));
      })
      .map(project => ({
        id: project.id,
        title: project.title,
        valueDimensions: project.value_dimensions || []
      }))
      .slice(0, limit);
  } catch (err) {
    console.error('Error getting most innovative projects:', err);
    return [];
  }
}

function analyzeROIByValueDimension(projects: any[]) {
  try {
    const dimensionROI: Record<string, { count: number; totalROI: number; averageROI: number }> = {};
    
    projects.forEach(project => {
      const roi = calculateROI(project);
      // Only include projects with valid, non-zero ROI
      if (roi !== null && roi !== 0 && isFinite(roi)) {
        // Use the value_dimensions array directly from the project
        const valueDimensions = project.value_dimensions || [];
        valueDimensions.forEach((dimensionName: string) => {
          if (!dimensionROI[dimensionName]) {
            dimensionROI[dimensionName] = { count: 0, totalROI: 0, averageROI: 0 };
          }
          dimensionROI[dimensionName].count++;
          dimensionROI[dimensionName].totalROI += roi;
        });
      }
    });
    
    // Calculate averages and sort by average ROI
    Object.keys(dimensionROI).forEach(dimension => {
      const data = dimensionROI[dimension];
      data.averageROI = data.count > 0 ? data.totalROI / data.count : 0;
    });
    
    // Return only top 5 dimensions by average ROI
    const sortedDimensions = Object.entries(dimensionROI)
      .sort(([,a], [,b]) => b.averageROI - a.averageROI)
      .slice(0, 5)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, { count: number; totalROI: number; averageROI: number }>);
    
    return sortedDimensions;
  } catch (err) {
    console.error('Error analyzing ROI by value dimension:', err);
    return {};
  }
}
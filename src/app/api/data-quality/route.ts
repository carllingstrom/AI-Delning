import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function serverSupabase() {
  return createServerClient(
    'https://tgtgbxfegpwrehfqtwmk.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRndGdieGZlZ3B3cmVoZnF0d21rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE2OTYyMywiZXhwIjoyMDY1NzQ1NjIzfQ.aXKpOGujJz2G1p0d12DsuEyk5ylC-tsEDDkMY6GSXHk',
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}

export async function GET() {
  const sb = serverSupabase();
  
  try {
    const { data: projects, error } = await sb
      .from('projects')
      .select('*');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const qualityReport = {
      totalProjects: projects?.length || 0,
      dataCompleteness: {
        basicInfo: {
          title: 0,
          intro: 0,
          problem: 0,
          opportunity: 0,
          responsible: 0
        },
        costData: {
          hasBudget: 0,
          hasActualCosts: 0,
          hasValidCostEntries: 0
        },
        effectsData: {
          hasQuantitativeEffects: 0,
          hasMonetaryEstimates: 0,
          hasQualitativeEffects: 0
        },
        technicalData: {
          hasSystemName: 0,
          hasAIMethodology: 0,
          hasDeploymentEnvironment: 0,
          hasDataTypes: 0
        },
        relationships: {
          hasMunicipalities: 0,
          hasAreas: 0,
          hasValueDimensions: 0
        }
      },
      dataQualityIssues: [] as string[],
      recommendations: [] as string[]
    };

    projects?.forEach(project => {
      // Basic info completeness
      if (project.title) qualityReport.dataCompleteness.basicInfo.title++;
      if (project.intro) qualityReport.dataCompleteness.basicInfo.intro++;
      if (project.problem) qualityReport.dataCompleteness.basicInfo.problem++;
      if (project.opportunity) qualityReport.dataCompleteness.basicInfo.opportunity++;
      if (project.responsible) qualityReport.dataCompleteness.basicInfo.responsible++;

      // Cost data completeness
      const costData = project.cost_data || {};
      if (costData.budgetDetails?.budgetAmount) qualityReport.dataCompleteness.costData.hasBudget++;
      if (costData.actualCostDetails?.costEntries?.length > 0) qualityReport.dataCompleteness.costData.hasActualCosts++;
      
      const validCostEntries = costData.actualCostDetails?.costEntries?.filter((entry: any) => 
        entry.costFixed || entry.costHours || entry.costRate
      ) || [];
      if (validCostEntries.length > 0) qualityReport.dataCompleteness.costData.hasValidCostEntries++;

      // Effects data completeness
      const effectsData = project.effects_data || {};
      const hasQuantitative = effectsData.effectDetails?.some((effect: any) => 
        effect.hasQuantitative === 'true' && effect.impactMeasurement?.measurements?.length > 0
      );
      if (hasQuantitative) qualityReport.dataCompleteness.effectsData.hasQuantitativeEffects++;

      const hasMonetary = effectsData.effectDetails?.some((effect: any) => 
        effect.impactMeasurement?.measurements?.some((measurement: any) => 
          measurement.monetaryEstimate && measurement.monetaryEstimate > 0
        )
      );
      if (hasMonetary) qualityReport.dataCompleteness.effectsData.hasMonetaryEstimates++;

      const hasQualitative = effectsData.effectDetails?.some((effect: any) => 
        effect.hasQualitative === 'true'
      );
      if (hasQualitative) qualityReport.dataCompleteness.effectsData.hasQualitativeEffects++;

      // Technical data completeness
      const technicalData = project.technical_data || {};
      if (technicalData.system_name) qualityReport.dataCompleteness.technicalData.hasSystemName++;
      if (technicalData.ai_methodology) qualityReport.dataCompleteness.technicalData.hasAIMethodology++;
      if (technicalData.deployment_environment) qualityReport.dataCompleteness.technicalData.hasDeploymentEnvironment++;
      if (technicalData.data_types?.length > 0) qualityReport.dataCompleteness.technicalData.hasDataTypes++;

      // Relationships completeness
      if (project.areas?.length > 0) qualityReport.dataCompleteness.relationships.hasAreas++;
      if (project.value_dimensions?.length > 0) qualityReport.dataCompleteness.relationships.hasValueDimensions++;

      // Identify specific issues
      if (!costData.budgetDetails?.budgetAmount) {
        qualityReport.dataQualityIssues.push(`Project "${project.title}": Missing budget information`);
      }
      if (!technicalData.ai_methodology) {
        qualityReport.dataQualityIssues.push(`Project "${project.title}": Missing AI methodology`);
      }
      if (!effectsData.effectDetails?.some((e: any) => e.hasQuantitative === 'true')) {
        qualityReport.dataQualityIssues.push(`Project "${project.title}": No quantitative effects measured`);
      }
    });

    // Calculate percentages
    const total = qualityReport.totalProjects;
    Object.keys(qualityReport.dataCompleteness).forEach(category => {
      Object.keys(qualityReport.dataCompleteness[category as keyof typeof qualityReport.dataCompleteness]).forEach(field => {
        const count = qualityReport.dataCompleteness[category as keyof typeof qualityReport.dataCompleteness][field as any];
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        qualityReport.dataCompleteness[category as keyof typeof qualityReport.dataCompleteness][field as any] = {
          count,
          percentage,
          total
        };
      });
    });

    // Generate recommendations
    if (qualityReport.dataCompleteness.costData.hasBudget.percentage < 50) {
      qualityReport.recommendations.push("Prioritize collecting budget information for projects");
    }
    if (qualityReport.dataCompleteness.effectsData.hasQuantitativeEffects.percentage < 50) {
      qualityReport.recommendations.push("Encourage projects to measure quantitative effects");
    }
    if (qualityReport.dataCompleteness.technicalData.hasAIMethodology.percentage < 50) {
      qualityReport.recommendations.push("Require AI methodology documentation for all AI projects");
    }

    return NextResponse.json(qualityReport);
    
  } catch (error) {
    console.error('Data quality analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze data quality' }, { status: 500 });
  }
} 
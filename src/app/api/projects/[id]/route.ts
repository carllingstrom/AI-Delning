import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

function serverSupabase() {
  return createServerSupabaseClient();
}

// GET /api/projects/[id] - Get single project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  try {
    const sb = serverSupabase();
    
    // Fetch project with all related data
    const { data: project, error } = await sb
      .from('projects')
      .select(`
        *,
        project_municipalities(
          municipalities(
            id,
            name,
            county
          )
        ),
        project_areas(
          areas(
            id,
            name
          )
        ),
        project_value_dimensions(
          value_dimensions(
            id,
            name
          )
        )
      `)
      .eq('id', projectId)
      .single();

    if (error || !project) {
      console.error('Project fetch error:', error);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Transform to export format
    const projectData = {
      id: project.id,
      title: project.title,
      intro: project.intro,
      problem: project.problem,
      opportunity: project.opportunity,
      responsible: project.responsible,
      phase: project.phase,
      created_at: project.created_at,
      updated_at: project.updated_at,
      // Return the nested data structures as expected by frontend
      project_municipalities: project.project_municipalities || [],
      project_areas: project.project_areas || [],
      project_value_dimensions: project.project_value_dimensions || [],
      // Also include the flat arrays for backward compatibility
      municipalities: project.project_municipalities?.map((pm: any) => ({
        name: pm.municipalities.name,
        county: pm.municipalities.county
      })) || [],
      areas: project.areas || [],
      value_dimensions: project.value_dimensions || [],
      cost_data: project.cost_data,
      effects_data: project.effects_data,
      ease_of_implementation_data: project.ease_of_implementation_data,
      technical_data: project.technical_data,
      leadership_data: project.leadership_data,
      legal_data: project.legal_data,
      overview_details: project.overview_details,
      // Add calculatedMetrics to match the list API
      calculatedMetrics: {
        budget: project.cost_data?.budgetDetails?.budgetAmount ? parseFloat(project.cost_data.budgetDetails.budgetAmount) : null,
        actualCost: project.cost_data?.actualCostDetails?.costEntries ? 
          project.cost_data.actualCostDetails.costEntries.reduce((total: number, entry: any) => {
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
          }, 0) : 0,
        roi: null, // Will be calculated below
        totalMonetaryValue: null, // Will be calculated below
        affectedGroups: project.effects_data?.affectedGroups || [],
        technologies: project.technical_data?.aiMethodology || [],
        sharingScore: null as number | null // Will be calculated below
      }
    };

    // Calculate ROI if effects data exists
    if (project.effects_data && project.effects_data.effectDetails) {
      try {
        const { calculateROI } = require('@/lib/roiCalculator');
        
        const effectEntriesRaw = project.effects_data.effectDetails || [];
        // Normalize booleans for safety
        const effectEntries = effectEntriesRaw.map((e: any) => ({
          ...e,
          hasQualitative: e.hasQualitative === true || e.hasQualitative === 'true',
          hasQuantitative: e.hasQuantitative === true || e.hasQuantitative === 'true',
        }));
        const costEntries = project.cost_data?.actualCostDetails?.costEntries || [];
        
        // Determine total investment: prefer explicit cost entries, otherwise budget fallback
        let totalInvestment = 0;
        if (Array.isArray(costEntries) && costEntries.length > 0) {
          totalInvestment = costEntries.reduce((total: number, entry: any) => {
            if (!entry) return total;
            let entryTotal = 0;
            switch (entry.costUnit) {
              case 'hours': {
                const hours = Number(entry.hoursDetails?.hours) || 0;
                const rate = Number(entry.hoursDetails?.hourlyRate) || 0;
                entryTotal = hours * rate;
                break;
              }
              case 'fixed': {
                entryTotal = Number(entry.fixedDetails?.fixedAmount) || 0;
                break;
              }
              case 'monthly': {
                const monthlyAmount = Number(entry.monthlyDetails?.monthlyAmount) || 0;
                const monthlyDuration = Number(entry.monthlyDetails?.monthlyDuration) || 1;
                entryTotal = monthlyAmount * monthlyDuration;
                break;
              }
              case 'yearly': {
                const yearlyAmount = Number(entry.yearlyDetails?.yearlyAmount) || 0;
                const yearlyDuration = Number(entry.yearlyDetails?.yearlyDuration) || 1;
                entryTotal = yearlyAmount * yearlyDuration;
                break;
              }
              default: {
                entryTotal = 0;
              }
            }
            return total + entryTotal;
          }, 0);
        } else {
          // Budget fallback (especially for idea phase)
          const budgetAmount = project.cost_data?.budgetDetails?.budgetAmount;
          if (budgetAmount !== undefined && budgetAmount !== null && budgetAmount !== '') {
            const n = typeof budgetAmount === 'string' ? parseFloat(budgetAmount) : Number(budgetAmount);
            totalInvestment = isNaN(n) ? 0 : n;
          }
        }
        
        // Only compute ROI if we have any effects
        if (effectEntries.length > 0) {
          const roiMetrics = calculateROI({ 
            effectEntries, 
            totalProjectInvestment: totalInvestment 
          });
          
          // Set calculated metrics
          projectData.calculatedMetrics.roi = roiMetrics.economicROI;
          projectData.calculatedMetrics.totalMonetaryValue = roiMetrics.totalMonetaryValue;
          // Also set actualCost if missing but we used budget fallback
          if (!projectData.calculatedMetrics.actualCost && totalInvestment > 0) {
            projectData.calculatedMetrics.actualCost = totalInvestment;
          }
        }
        
        // Calculate sharing score
        try {
          const { calculateProjectScore } = await import('@/lib/projectScore');
          const projectScore = calculateProjectScore(project);
          projectData.calculatedMetrics.sharingScore = projectScore.percentage;
        } catch (err) {
          console.error('Error calculating sharing score for project:', project.id, err);
          projectData.calculatedMetrics.sharingScore = 0;
        }
      } catch (err) {
        console.error('Error calculating ROI for project:', project.id, err);
      }
    }

    return NextResponse.json(projectData);

  } catch (error) {
    console.error('Project fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch project', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const payload = await request.json()
    
    const { 
      municipality_ids, 
      title, 
      intro,
      problem,
      opportunity,
      responsible,
      areas,
      value_dimensions, // Note: payload uses value_dimensions (not valueDimensions)
      phase,
      // Form section data
      cost_data,
      effects_data,
      ease_of_implementation_data,
      technical_data,
      leadership_data,
      legal_data,
      overview_details,
      ...rest 
    } = payload;

    // 1. Update the main project record
    const updateData: any = {
      title,
      intro,
      problem,
      opportunity,
      responsible,
      phase: phase || 'idea',
      areas: areas || [],
      value_dimensions: value_dimensions || [],
    };

    // Only update form section data if it's actually provided (not undefined/null)
    if (overview_details !== undefined) updateData.overview_details = overview_details;
    if (cost_data !== undefined) updateData.cost_data = cost_data;
    if (effects_data !== undefined) updateData.effects_data = effects_data;
    if (ease_of_implementation_data !== undefined) updateData.ease_of_implementation_data = ease_of_implementation_data;
    if (technical_data !== undefined) updateData.technical_data = technical_data;
    if (leadership_data !== undefined) updateData.leadership_data = leadership_data;
    if (legal_data !== undefined) updateData.legal_data = legal_data;

    const { data: project, error: projectError } = await serverSupabase()
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single()

    if (projectError) {
      console.error('Update project error:', projectError)
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
    }

    // 2. Update municipality relationships if provided
    if (municipality_ids && Array.isArray(municipality_ids)) {
      // First delete existing relationships
      await serverSupabase()
        .from('project_municipalities')
        .delete()
        .eq('project_id', projectId)

      // Then insert new relationships
      const municipalityRows = municipality_ids
        .filter((id: any) => id && id !== '') // Filter out empty values
        .map((id: any) => ({
          project_id: projectId,
          municipality_id: parseInt(id),
        }));

      if (municipalityRows.length > 0) {
        const { error: municipalityError } = await serverSupabase()
          .from('project_municipalities')
          .insert(municipalityRows);

        if (municipalityError) {
          console.error('Municipality relationship update error:', municipalityError);
          // Don't fail the whole request, but log the error
        }
      }
    }

    // 3. Update area relationships if provided
    if (areas && Array.isArray(areas)) {
      // Delete existing
      await serverSupabase().from('project_areas').delete().eq('project_id', projectId);
      // Insert new
      if (areas.length > 0) {
        const { data: areaData } = await serverSupabase().from('areas').select('id, name').in('name', areas);
        if (areaData) {
          const areaRows = areaData.map(area => ({
            project_id: projectId,
            area_id: area.id,
          }));
          await serverSupabase().from('project_areas').insert(areaRows);
        }
      }
    }

    // 4. Update value dimension relationships if provided
    if (value_dimensions && Array.isArray(value_dimensions)) {
      // Delete existing
      await serverSupabase().from('project_value_dimensions').delete().eq('project_id', projectId);
      // Insert new
      if (value_dimensions.length > 0) {
        const { data: valueData } = await serverSupabase().from('value_dimensions').select('id, name').in('name', value_dimensions);
        if (valueData) {
          const valueRows = valueData.map(value => ({
            project_id: projectId,
            value_dimension_id: value.id,
          }));
          await serverSupabase().from('project_value_dimensions').insert(valueRows);
        }
      }
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Update project error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    
    // First delete from project_municipalities to maintain referential integrity
    await serverSupabase()
      .from('project_municipalities')
      .delete()
      .eq('project_id', projectId)

    // Then delete the project
    const { error } = await serverSupabase()
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      console.error('Delete project error:', error)
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
} 
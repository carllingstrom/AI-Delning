import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

function serverSupabase() {
  return createServerSupabaseClient();
}

// POST /api/projects - Create a new project
export async function POST(req: NextRequest) {
  const sb = serverSupabase();
  const payload = await req.json();
  
  const { 
    municipality_ids, 
    county_codes,
    title, 
    intro,
    problem,
    opportunity,
    responsible,
    areas,
    valueDimensions,
    value_dimensions,
    phase,
    // Form section data
    cost_data,
    effects_data,
    technical_data,
    leadership_data,
    legal_data,
    overview_details,
    ...rest 
  } = payload;

  // Check that either municipality_ids or county_codes is provided
  const hasMunicipalities = municipality_ids?.length > 0 && municipality_ids[0] !== '';
  const hasCounties = county_codes?.length > 0 && county_codes[0] !== '';
  
  if ((!hasMunicipalities && !hasCounties) || !title) {
    return NextResponse.json({ error: 'title och antingen municipality_ids eller county_codes är obligatoriska' }, { status: 400 });
  }

  try {
    // 1. Insert the main project
    const { data: project, error: projectError } = await sb
      .from('projects')
      .insert([{
        title,
        intro,
        problem,
        opportunity,
        responsible,
        phase: phase || 'idea',
        areas: areas || [],
        value_dimensions: (value_dimensions || valueDimensions || []),
        overview_details: {
          ...overview_details || {},
          county_codes: hasCounties ? county_codes.filter((code: string) => code && code !== '') : [],
          location_type: hasCounties ? 'county' : 'municipality'
        },
        cost_data: cost_data || {},
        effects_data: effects_data || {},
        technical_data: technical_data || {},
        leadership_data: leadership_data || {},
        legal_data: legal_data || {},
      }])
      .select()
      .single();

    if (projectError) {
      console.error('Project insert error:', projectError);
      return NextResponse.json({ error: projectError.message }, { status: 500 });
    }

    // 2. Insert municipality relationships (only if using municipalities)
    if (hasMunicipalities) {
      const municipalityRows = municipality_ids
        .filter((id: any) => id && id !== '') // Filter out empty values
        .map((id: any) => ({
          project_id: project.id,
          municipality_id: parseInt(id),
        }));

      if (municipalityRows.length > 0) {
        const { error: municipalityError } = await sb
          .from('project_municipalities')
          .insert(municipalityRows);

        if (municipalityError) {
          console.error('Municipality relationship error:', municipalityError);
          // Don't fail the whole request, but log the error
        }
      }
    }

    // 3. Insert area relationships
    if (areas && areas.length > 0) {
      // First get area IDs from names
      const { data: areaData, error: areaFetchError } = await sb
        .from('areas')
        .select('id, name')
        .in('name', areas);

      if (!areaFetchError && areaData) {
        const areaRows = areaData.map(area => ({
          project_id: project.id,
          area_id: area.id,
        }));

        const { error: areaError } = await sb
          .from('project_areas')
          .insert(areaRows);

        if (areaError) {
          console.error('Area relationship error:', areaError);
        }
      }
    }

    // 4. Insert value dimension relationships
    const valueDimsArr = (value_dimensions || valueDimensions || []);
    if (valueDimsArr && valueDimsArr.length > 0) {
      // Ensure all value dimensions exist in the lookup table
      const { data: existingVals, error: valueFetchError } = await sb
        .from('value_dimensions')
        .select('id, name');

      if (valueFetchError) {
        console.error('Value dimension fetch error:', valueFetchError);
      }

      const existingNames = (existingVals || []).map((v: any) => v.name);
      const missingNames = valueDimsArr.filter((n: string) => !existingNames.includes(n));

      if (missingNames.length > 0) {
        // Insert missing value dimensions
        const { error: insertMissingError } = await sb
          .from('value_dimensions')
          .insert(missingNames.map((name: string) => ({ name })));
        if (insertMissingError) {
          console.error('Insert missing value dimensions error:', insertMissingError);
        }
      }

      // Fetch IDs again
      const { data: valueData } = await sb
        .from('value_dimensions')
        .select('id, name')
        .in('name', valueDimsArr);

      if (valueData && valueData.length) {
        const valueRows = valueData.map(value => ({
          project_id: project.id,
          value_dimension_id: value.id,
        }));

        const { error: valueError } = await sb
          .from('project_value_dimensions')
          .insert(valueRows);

        if (valueError) {
          console.error('Value dimension relationship error:', valueError);
        }
      }
    }

    return NextResponse.json(project, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/projects?municipality_id=123 (optional)
export async function GET(req: NextRequest) {
  const sb = serverSupabase();
  const municipality_id = req.nextUrl.searchParams.get('municipality_id');
  
  try {
    let query = sb
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
      `);


    // If municipality_id is provided, filter by it
    if (municipality_id) {
      const municipalityIdNum = Number(municipality_id);
      if (isNaN(municipalityIdNum)) {

        return NextResponse.json({ error: 'Invalid municipality_id' }, { status: 400 });
      }
      
      // Filter projects that belong to the specified municipality
      const { data: projectIds, error: projectIdsError } = await sb
        .from('project_municipalities')
        .select('project_id')
        .eq('municipality_id', municipalityIdNum);


      if (projectIdsError) {
        console.error('Project IDs fetch error:', projectIdsError);
        return NextResponse.json({ error: projectIdsError.message }, { status: 500 });
      }

      if (projectIds && projectIds.length > 0) {
        const ids = projectIds.map(p => p.project_id);
        query = query.in('id', ids);
      } else {
        // No projects found for this municipality

        return NextResponse.json([]);
      }
    }

    const { data, error } = await query;


    if (error) {
      console.error('Projects fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Debug: Log projects without municipality relationships
    if (!municipality_id) {
      const projectsWithoutMunicipality = (data || []).filter((project: any) => 
        !project.project_municipalities || project.project_municipalities.length === 0
      );
      if (projectsWithoutMunicipality.length > 0) {

      }
    }

    // Transform the data to include calculated metrics and flatten relationships
    const transformedProjects = (data || []).map((project: any) => {
      // Calculate metrics from cost_data and effects_data
      let budget = null;
      let actualCost = 0;
      let roi = null;
      let totalMonetaryValue = null;
      let affectedGroups: string[] = [];
      let technologies: string[] = [];

      // Extract budget information
      if (project.cost_data) {
        // Check for budgetDetails.budgetAmount
        if (project.cost_data.budgetDetails && project.cost_data.budgetDetails.budgetAmount) {
          budget = parseFloat(project.cost_data.budgetDetails.budgetAmount) || 0;
        }
        
        // Calculate actual cost from costEntries
        if (project.cost_data.actualCostDetails && project.cost_data.actualCostDetails.costEntries) {
          const costEntries = project.cost_data.actualCostDetails.costEntries;
          if (Array.isArray(costEntries)) {
            actualCost = costEntries.reduce((sum: number, entry: any) => {
              const rate = parseFloat(entry.costRate) || 0;
              const hours = parseFloat(entry.costHours) || 0;
              const fixed = parseFloat(entry.costFixed) || 0;
              return sum + (rate * hours) + fixed;
            }, 0);
          }
        }
        
        // Fallback: check for legacy costs array
        if (!budget && project.cost_data.costs && Array.isArray(project.cost_data.costs)) {
          budget = project.cost_data.costs.reduce((sum: number, cost: any) => {
            const amount = parseFloat(cost.amount) || 0;
            return sum + amount;
          }, 0);
          actualCost = budget; // For legacy data, assume actual cost equals budget
        }
      }

      // Extract ROI from effects_data using the comprehensive ROI calculator
      if (project.effects_data && project.effects_data.effectDetails) {
        try {
          // Use the same ROI calculator as analytics API
          const { calculateROI: newCalculateROI } = require('@/lib/roiCalculator');
          
          const effectEntries = project.effects_data.effectDetails || [];
          const costEntries = project.cost_data?.actualCostDetails?.costEntries || [];
          
          if (effectEntries.length > 0) {
            // Check if project actually has measurable effects
            const hasActualEffects = effectEntries.some((effect: any) => {
              const hasQuantitative = (effect.hasQuantitative === true || effect.hasQuantitative === 'true') && 
                                    effect.quantitativeDetails && 
                                    (effect.quantitativeDetails.financialDetails || effect.quantitativeDetails.redistributionDetails);
              
              const hasQualitative = (effect.hasQualitative === true || effect.hasQualitative === 'true') && 
                                   effect.qualitativeDetails && 
                                   effect.qualitativeDetails.factor;
              
              return hasQuantitative || hasQualitative;
            });
            
            if (hasActualEffects) {
              // Calculate total investment from cost entries ONLY
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
              
              roi = roiMetrics.economicROI; // Only use economic ROI, not combined
              totalMonetaryValue = roiMetrics.totalMonetaryValue;
              actualCost = totalInvestment; // Use the calculated total investment
            }
          }
        } catch (err) {
          console.error('Error calculating ROI for project:', project.id, err);
          roi = null;
        }
      }

      // Extract affected groups
      if (project.effects_data && project.effects_data.affectedGroups) {
        affectedGroups = Array.isArray(project.effects_data.affectedGroups) 
          ? project.effects_data.affectedGroups 
          : [];
      }

      // Extract technologies
      if (project.technical_data && project.technical_data.aiMethodology) {
        technologies = Array.isArray(project.technical_data.aiMethodology) 
          ? project.technical_data.aiMethodology 
          : [project.technical_data.aiMethodology];
      }

      return {
        ...project,
        // Flatten areas array
        areas: project.project_areas?.map((pa: any) => pa.areas?.name).filter(Boolean) || project.areas || [],
        // Flatten value dimensions array  
        value_dimensions: project.project_value_dimensions?.map((pv: any) => pv.value_dimensions?.name).filter(Boolean) || project.value_dimensions || [],
        // Add calculated metrics
        calculatedMetrics: {
          budget,
          actualCost,
          roi,
          totalMonetaryValue,
          affectedGroups,
          technologies
        },
        // Add municipality info for debugging
        municipality_info: project.project_municipalities?.map((pm: any) => pm.municipalities).filter(Boolean) || []
      };
    });


    return NextResponse.json(transformedProjects);

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/projects?id=<uuid>
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id saknas' }, { status: 400 });

  try {
    const supabase = serverSupabase();
    const { error } = await supabase.from('projects').delete().eq('id', id);
    
    if (error) {
      console.error('Project delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ deleted: true });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'edge';
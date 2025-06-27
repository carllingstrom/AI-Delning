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

// POST /api/projects - Create a new project
export async function POST(req: NextRequest) {
  const sb = serverSupabase();
  const payload = await req.json();
  
  const { 
    municipality_ids, 
    title, 
    intro,
    problem,
    opportunity,
    responsible,
    areas,
    valueDimensions,
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

  if (!municipality_ids?.length || !title) {
    return NextResponse.json({ error: 'municipality_ids & title är obligatoriska' }, { status: 400 });
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
        value_dimensions: valueDimensions || [],
        overview_details: overview_details || {},
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

    // 2. Insert municipality relationships
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
    if (valueDimensions && valueDimensions.length > 0) {
      // First get value dimension IDs from names
      const { data: valueData, error: valueFetchError } = await sb
        .from('value_dimensions')
        .select('id, name')
        .in('name', valueDimensions);

      if (!valueFetchError && valueData) {
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

    // Transform the data to include calculated metrics and flatten relationships
    const transformedProjects = (data || []).map((project: any) => {
      // Calculate metrics from cost_data and effects_data
      let budget = null;
      let actualCost = 0;
      let roi = null;
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

      // Extract ROI from effects_data
      if (project.effects_data && project.effects_data.monetaryValue) {
        const monetaryValue = parseFloat(project.effects_data.monetaryValue) || 0;
        if (budget && budget > 0) {
          roi = ((monetaryValue - budget) / budget) * 100;
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
          affectedGroups,
          technologies
        }
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
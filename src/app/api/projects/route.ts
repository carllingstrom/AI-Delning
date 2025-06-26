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

// GET /api/projects?municipality_id=123
export async function GET(req: NextRequest) {
  const sb = serverSupabase();
  const municipality_id = Number(req.nextUrl.searchParams.get('municipality_id'));
  
  if (!municipality_id) {
    return NextResponse.json({ error: 'municipality_id is required' }, { status: 400 });
  }

  try {
    const { data, error } = await sb
      .from('project_municipalities')
      .select(`
        project_id, 
        projects(
          id,
          title,
          intro,
          problem,
          opportunity,
          responsible,
          phase,
          areas,
          value_dimensions,
          created_at,
          updated_at
        )
      `)
      .eq('municipality_id', municipality_id);

    if (error) {
      console.error('Projects fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Flatten the projects out of the join table result
    const projects = (data || []).map((row: any) => row.projects);
    return NextResponse.json(projects);

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
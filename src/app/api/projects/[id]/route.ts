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
      municipalities: project.project_municipalities?.map((pm: any) => ({
        name: pm.municipalities.name,
        county: pm.municipalities.county
      })) || [],
      location_type: project.overview_details?.location_type,
      county_codes: project.overview_details?.county_codes,
      areas: project.areas || [],
      value_dimensions: project.value_dimensions || [],
      cost_data: project.cost_data,
      effects_data: project.effects_data,
      technical_data: project.technical_data,
      leadership_data: project.leadership_data,
      legal_data: project.legal_data,
      overview_details: project.overview_details
    };

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
      technical_data,
      leadership_data,
      legal_data,
      overview_details,
      ...rest 
    } = payload;

    // 1. Update the main project record
    const { data: project, error: projectError } = await serverSupabase()
      .from('projects')
      .update({
        title,
        intro,
        problem,
        opportunity,
        responsible,
        phase: phase || 'idea',
        areas: areas || [],
        value_dimensions: value_dimensions || [],
        overview_details: overview_details || {},
        cost_data: cost_data || {},
        effects_data: effects_data || {},
        technical_data: technical_data || {},
        leadership_data: leadership_data || {},
        legal_data: legal_data || {},
      })
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
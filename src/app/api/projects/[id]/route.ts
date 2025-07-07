import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

const sb = () => createServerSupabaseClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await sb()
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
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Get project error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    const { data: project, error: projectError } = await sb()
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
      .eq('id', params.id)
      .select()
      .single()

    if (projectError) {
      console.error('Update project error:', projectError)
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
    }

    // 2. Update municipality relationships if provided
    if (municipality_ids && Array.isArray(municipality_ids)) {
      // First delete existing relationships
      await sb()
        .from('project_municipalities')
        .delete()
        .eq('project_id', params.id)

      // Then insert new relationships
      const municipalityRows = municipality_ids
        .filter((id: any) => id && id !== '') // Filter out empty values
        .map((id: any) => ({
          project_id: params.id,
          municipality_id: parseInt(id),
        }));

      if (municipalityRows.length > 0) {
        const { error: municipalityError } = await sb()
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
      await sb().from('project_areas').delete().eq('project_id', params.id);
      // Insert new
      if (areas.length > 0) {
        const { data: areaData } = await sb().from('areas').select('id, name').in('name', areas);
        if (areaData) {
          const areaRows = areaData.map(area => ({
            project_id: params.id,
            area_id: area.id,
          }));
          await sb().from('project_areas').insert(areaRows);
        }
      }
    }

    // 4. Update value dimension relationships if provided
    if (value_dimensions && Array.isArray(value_dimensions)) {
      // Delete existing
      await sb().from('project_value_dimensions').delete().eq('project_id', params.id);
      // Insert new
      if (value_dimensions.length > 0) {
        const { data: valueData } = await sb().from('value_dimensions').select('id, name').in('name', value_dimensions);
        if (valueData) {
          const valueRows = valueData.map(value => ({
            project_id: params.id,
            value_dimension_id: value.id,
          }));
          await sb().from('project_value_dimensions').insert(valueRows);
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
  { params }: { params: { id: string } }
) {
  try {
    // First delete from project_municipalities to maintain referential integrity
    await sb()
      .from('project_municipalities')
      .delete()
      .eq('project_id', params.id)

    // Then delete the project
    const { error } = await sb()
      .from('projects')
      .delete()
      .eq('id', params.id)

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
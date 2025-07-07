import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

const sb = () => createServerSupabaseClient()

export async function GET(request: NextRequest) {
  try {

    
    // First get all idea projects
    const { data: projects, error: projectsError } = await sb()
      .from('projects')
      .select('*')
      .eq('phase', 'idea')
      .order('created_at', { ascending: false })



    if (projectsError) {
      console.error('Ideas API error:', projectsError)
      return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 })
    }

    // Then get municipality mappings for these projects
    const projectIds = projects?.map(p => p.id) || []
    
    if (projectIds.length === 0) {
      return NextResponse.json([])
    }

    const { data: mappings, error: mappingsError } = await sb()
      .from('project_municipalities')
      .select(`
        project_id,
        municipalities(name)
      `)
      .in('project_id', projectIds)



    if (mappingsError) {
      console.error('Ideas API mappings error:', mappingsError)
      return NextResponse.json({ error: 'Failed to fetch municipality mappings' }, { status: 500 })
    }

    // Create a map of project_id to municipality name
    const municipalityMap = new Map()
    mappings?.forEach((mapping: any) => {
      municipalityMap.set(mapping.project_id, mapping.municipalities?.name || 'Okänd kommun')
    })

    // Transform the data for the frontend
    const ideas = projects?.map(project => ({
      id: project.id,
      title: project.title,
      intro: project.intro,
      phase: project.phase,
      areas: project.areas,
      value_dimensions: project.value_dimensions,
      municipality: municipalityMap.get(project.id) || 'Okänd kommun',
      created_at: project.created_at
    })) || []


    return NextResponse.json(ideas)
  } catch (error) {
    console.error('Ideas API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export const runtime = 'edge'; 
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

const sb = () => createServerSupabaseClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await sb()
      .from('project_municipalities')
      .select('municipality_id, municipalities(id, name)')
      .eq('project_id', params.id)

    if (error) {
      console.error('Get project municipalities error:', error)
      return NextResponse.json({ error: 'Failed to fetch project municipalities' }, { status: 500 })
    }

    // Transform the data to return municipality IDs and info
    const municipalities = data?.map(item => ({
      municipality_id: item.municipality_id,
      id: item.municipalities?.id,
      name: item.municipalities?.name
    })) || []

    return NextResponse.json(municipalities)
  } catch (error) {
    console.error('Get project municipalities error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
} 
// /src/app/api/municipalities/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

/**
 * GET /api/municipalities  →  [{ id, name }]
 *  (används av vänster-dropdown & AddProjectModal)
 */
export async function GET() {
  try {
    console.log('🔍 Municipalities API called');
    
    const sb = createServerSupabaseClient();

    console.log('Fetching municipalities from Supabase...');
    const { data, error } = await sb
      .from('municipalities')
      .select('id, name')
      .order('name');

    console.log('Supabase response:', { data, error });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!Array.isArray(data)) {
      console.error('Supabase returned non-array data:', data);
      return NextResponse.json({ error: 'Supabase returned non-array data', details: data }, { status: 500 });
    }

    if (data.length === 0) {
      console.warn('No municipalities found in database');
      // Return a few test municipalities as fallback
      return NextResponse.json([
        { id: 1, name: 'Stockholm' },
        { id: 2, name: 'Göteborg' },
        { id: 3, name: 'Malmö' }
      ]);
    }
    
    console.log(`✅ Returning ${data.length} municipalities`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in municipalities API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const runtime = 'edge';

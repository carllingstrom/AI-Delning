// /src/app/api/municipalities/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * GET /api/municipalities  →  [{ id, name }]
 *  (används av vänster-dropdown & AddProjectModal)
 */
export async function GET() {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ 
        error: 'Server configuration error: Missing Supabase credentials' 
      }, { status: 500 });
    }

    const sb = createServerClient(supabaseUrl, supabaseKey, { 
      cookies: { getAll: () => [], setAll: () => {} } 
    });

    console.log('Fetching municipalities from Supabase...');
    
    const { data, error } = await sb
      .from('municipalities')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`Found ${data?.length || 0} municipalities`);
    
    // Ensure we always return an array
    const municipalities = Array.isArray(data) ? data : [];
    
    if (municipalities.length === 0) {
      console.warn('No municipalities found in database');
      // Return a few test municipalities as fallback
      return NextResponse.json([
        { id: 1, name: 'Stockholm' },
        { id: 2, name: 'Göteborg' },
        { id: 3, name: 'Malmö' }
      ]);
    }
    
    return NextResponse.json(municipalities);
    
  } catch (error) {
    console.error('Unexpected error in municipalities API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const runtime = 'edge';

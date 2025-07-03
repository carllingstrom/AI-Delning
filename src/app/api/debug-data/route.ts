import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function serverSupabase() {
  return createServerClient(
    'https://tgtgbxfegpwrehfqtwmk.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRndGdieGZlZ3B3cmVoZnF0d21rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE2OTYyMywiZXhwIjoyMDY1NzQ1NjIzfQ.aXKpOGujJz2G1p0d12DsuEyk5ylC-tsEDDkMY6GSXHk',
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}

export async function GET() {
  const sb = serverSupabase();
  
  try {
    // Check what tables exist and their data
    const results: any = {};
    
    // Check projects table
    const { data: projects, error: projectsError } = await sb
      .from('projects')
      .select('*')
      .limit(5);
    
    results.projects = {
      count: projects?.length || 0,
      sample: projects?.[0] || null,
      error: projectsError?.message
    };
    
    // Check municipalities table
    const { data: municipalities, error: municipalitiesError } = await sb
      .from('municipalities')
      .select('*')
      .limit(5);
    
    results.municipalities = {
      count: municipalities?.length || 0,
      sample: municipalities?.[0] || null,
      error: municipalitiesError?.message
    };
    
    // Check areas table
    const { data: areas, error: areasError } = await sb
      .from('areas')
      .select('*')
      .limit(5);
    
    results.areas = {
      count: areas?.length || 0,
      sample: areas?.[0] || null,
      error: areasError?.message
    };
    
    // Check value_dimensions table
    const { data: valueDimensions, error: valueDimensionsError } = await sb
      .from('value_dimensions')
      .select('*')
      .limit(5);
    
    results.valueDimensions = {
      count: valueDimensions?.length || 0,
      sample: valueDimensions?.[0] || null,
      error: valueDimensionsError?.message
    };
    
    // Check project_municipalities table
    const { data: projectMunicipalities, error: projectMunicipalitiesError } = await sb
      .from('project_municipalities')
      .select('*')
      .limit(5);
    
    results.projectMunicipalities = {
      count: projectMunicipalities?.length || 0,
      sample: projectMunicipalities?.[0] || null,
      error: projectMunicipalitiesError?.message
    };
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('Debug data error:', error);
    return NextResponse.json({ error: 'Failed to fetch debug data' }, { status: 500 });
  }
} 
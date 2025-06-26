// GET /api/counts?ai=Kultur%20och%20fritid,Miljö%20och%20hållbarhet&val=Effektivisering,Kvalitet
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const AI_CATEGORIES = [
  'Administration och personal',
  'Kultur och fritid',
  'Ledning och styrning',
  'Medborgarservice och kommunikation',
  'Miljö och hållbarhet',
  'Samhällsbyggnad och stadsbyggnad',
  'Socialtjänst och hälsa/vård och omsorg',
  'Säkerhet och krisberedskap',
  'Utbildning och skola',
  'Övrigt/oklart',
];

const VALUE_CATEGORIES = [
  'Effektivisering',
  'Kvalitet',
  'Innovation',
  'Medborgarnytta',
  'Annat',
];

function sb() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );
}

export async function GET(req: NextRequest) {
  const ai  = (req.nextUrl.searchParams.get('ai')?.split(',')  ?? []).filter(Boolean);
  const val = (req.nextUrl.searchParams.get('val')?.split(',') ?? []).filter(Boolean);

  let q = sb()
    .from('project_municipalities')
    .select('municipalities(id,name), projects!inner(id,areas,value_dimensions,phase)')
    .neq('projects.phase','idea'); // Exclude ideas - they go to the idea bank

  const { data, error } = await q;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filter based on areas and value_dimensions arrays
  const filteredData = (data || []).filter((row: any) => {
    const project = row.projects;
    
    // Filter by AI categories (areas)
    if (ai.length > 0) {
      const projectAreas = project.areas || [];
      const hasMatchingArea = ai.some(category => projectAreas.includes(category));
      if (!hasMatchingArea) return false;
    }
    
    // Filter by value categories 
    if (val.length > 0) {
      const projectValues = project.value_dimensions || [];
      const hasMatchingValue = val.some(category => projectValues.includes(category));
      if (!hasMatchingValue) return false;
    }
    
    return true;
  });

  const counts:Record<number,{id:number,name:string,project_count:number}> = {};
  filteredData.forEach((row:any)=>{
    const id=row.municipalities.id;
    if(!counts[id]) counts[id]={id,name:row.municipalities.name,project_count:0};
    counts[id].project_count++;
  });
  const list = Object.values(counts);
  return NextResponse.json(list);
}

export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { computeScaledImpact } from '@/services/impact/scale.service';

function serverSupabase() {
  return createServerSupabaseClient();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, scaling } = body || {};
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

    const sb = serverSupabase();
    const { data: project, error } = await sb
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    if (error || !project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const result = computeScaledImpact(project, scaling || {});
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}


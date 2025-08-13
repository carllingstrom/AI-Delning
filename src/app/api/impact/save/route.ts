import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

function serverSupabase() {
  return createServerSupabaseClient();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, scalingInput, result } = body || {};
    if (!projectId || !result) return NextResponse.json({ error: 'projectId och result krävs' }, { status: 400 });

    const sb = serverSupabase();
    // Fetch existing effects_data to merge
    const { data: project, error: fetchErr } = await sb
      .from('projects')
      .select('id, effects_data')
      .eq('id', projectId)
      .single();
    if (fetchErr || !project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const effects_data = project.effects_data || {};
    const now = new Date().toISOString();
    const updated = {
      ...effects_data,
      scaledImpactLatest: {
        input: scalingInput || null,
        result: result,
        savedAt: now
      }
    };

    const { error: updateErr } = await sb
      .from('projects')
      .update({ effects_data: updated })
      .eq('id', projectId);
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    return NextResponse.json({ saved: true, savedAt: now });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}

export const runtime = 'edge';


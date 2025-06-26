// /src/app/api/municipalities/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * GET /api/municipalities  →  [{ id, name }]
 *  (används av vänster-dropdown & AddProjectModal)
 */
export async function GET() {
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { data, error } = await sb
    .from('municipalities')
    .select('id, name')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export const runtime = 'edge';

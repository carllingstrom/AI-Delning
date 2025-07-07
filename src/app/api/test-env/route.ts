import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {

  
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKeyExists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    allSupabaseVars: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
  });
} 
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  console.log('Testing environment variables...');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('All env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
  
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKeyExists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    allSupabaseVars: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
  });
} 
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const envStatus = {
      NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!supabaseAnonKey,
      SUPABASE_SERVICE_ROLE_KEY: !!supabaseServiceKey,
    };

    // Test basic Supabase connection if env vars exist
    let dbStatus = 'not_tested';
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Try a simple query
        const { data, error } = await supabase
          .from('municipalities')
          .select('count(*)')
          .limit(1);
        
        dbStatus = error ? `error: ${error.message}` : 'connected';
      } catch (error) {
        dbStatus = `connection_error: ${error instanceof Error ? error.message : 'unknown'}`;
      }
    } else {
      dbStatus = 'missing_env_vars';
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      environmentVariables: envStatus,
      database: dbStatus,
      message: 'Health check successful'
    });

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Health check failed'
    }, { status: 500 });
  }
} 
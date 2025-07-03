import { createServerClient } from '@supabase/ssr';

export function createServerSupabaseClient() {
  // Try environment variables first (for production)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Environment variables check:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET');

  // If environment variables are available, use them
  if (supabaseUrl && supabaseServiceKey) {
    console.log('Using environment variables for Supabase connection');
    return createServerClient(supabaseUrl, supabaseServiceKey, {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    });
  }

  // Fallback to hardcoded values for local development
  console.log('Using hardcoded values for local development');
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
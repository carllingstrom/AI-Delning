import { NextResponse } from 'next/server';

export async function GET() {
  // Debug: Log all environment variables that contain "GROQ"
  const groqEnvVars = Object.keys(process.env).filter(key => key.includes('GROQ'));

  return NextResponse.json({
    message: 'Environment variables test',
    envVars: {
      AI_PROVIDER: process.env.AI_PROVIDER,
      hasGROQ: !!process.env.GROQ_API_KEY,
      groqKeyLength: process.env.GROQ_API_KEY?.length || 0,
      hasHUGGINGFACE: !!process.env.HUGGINGFACE_API_KEY,
      hasOPENROUTER: !!process.env.OPENROUTER_API_KEY,
      nodeEnv: process.env.NODE_ENV,
      // Debug info
      groqEnvVars,
      allEnvKeys: Object.keys(process.env).length
    }
  });
} 
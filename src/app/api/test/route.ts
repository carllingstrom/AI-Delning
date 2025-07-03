import { NextResponse } from 'next/server';

export async function GET() {
  console.log('🔍 Test API called');
  
  try {
    return NextResponse.json({ 
      message: 'Test API working',
      timestamp: new Date().toISOString(),
      status: 'success'
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({ 
      error: 'Test API failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const runtime = 'edge'; 
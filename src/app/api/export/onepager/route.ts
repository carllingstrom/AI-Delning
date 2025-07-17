import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Minimal response for debugging
  return NextResponse.json({
    success: true,
    message: 'API route is working and environment variables are not required for this test.'
  });
} 
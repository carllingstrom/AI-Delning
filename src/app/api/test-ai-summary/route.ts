import { NextResponse } from 'next/server';
import { generateAISummary } from '@/export-functions/ai-summary-generator';

export async function POST(request: Request) {
  try {
    const { intro, problem, opportunity } = await request.json();
    
    
    const summary = await generateAISummary(intro, problem, opportunity);
    
    return NextResponse.json({ 
      success: true, 
      summary,
      wordCount: summary.split(/\s+/).length,
      charCount: summary.length
    });
  } catch (error) {
    console.error('Error in test-ai-summary API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 
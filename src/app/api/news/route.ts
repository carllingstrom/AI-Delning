import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  // Use the public API endpoint for all use cases
  const res = await fetch('https://kommun.ai.se/api/usecases/data');
  const data = await res.json();
  const usecases = data.data || [];

  // Map to news articles
  const articles = usecases.map((uc: any) => {
    let url = `https://kommun.ai.se/anvandningsfall/${uc.id}`;
    return {
      title: uc.name,
      summary: uc.short_description || uc.description || '',
      image: uc.image || '',
      url,
    };
  });

  return NextResponse.json(articles);
} 
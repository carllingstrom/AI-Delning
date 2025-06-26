import { NextRequest, NextResponse } from 'next/server';

// Fallback news data in case the external API fails
const FALLBACK_NEWS = [
  {
    title: "AI-driven Chatbot för Medborgarservice",
    summary: "En interaktiv chatbot som hjälper medborgare att navigera kommunala tjänster och få svar på vanliga frågor dygnet runt.",
    image: "",
    url: "https://kommun.ai.se"
  },
  {
    title: "Automatiserad Handläggning av Bygglov",
    summary: "AI-system som snabbar upp handläggningen av enkla bygglovsärenden genom automatisk kontroll av regelverk.",
    image: "",
    url: "https://kommun.ai.se"
  },
  {
    title: "Prediktiv Analys för Infrastruktur",
    summary: "Maskininlärning för att förutsäga underhållsbehov av vägar och andra infrastruktursystem.",
    image: "",
    url: "https://kommun.ai.se"
  },
  {
    title: "Smart Resursoptimering",
    summary: "AI-baserad optimering av personalscheman och resursallokering inom kommun verksamheter.",
    image: "",
    url: "https://kommun.ai.se"
  }
];

export async function GET() {
  try {
    // Try to fetch from kommun.ai.se with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const res = await fetch('https://kommun.ai.se/api/usecases/data', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Kommunkartan-MVP/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      console.warn(`External API returned ${res.status}: ${res.statusText}`);
      return NextResponse.json(FALLBACK_NEWS);
    }
    
    const data = await res.json();
    const usecases = data.data || [];

    if (!Array.isArray(usecases) || usecases.length === 0) {
      console.warn('No usecases found in API response');
      return NextResponse.json(FALLBACK_NEWS);
    }

    // Map to news articles
    const articles = usecases.map((uc: any) => {
      let url = `https://kommun.ai.se/anvandningsfall/${uc.id}`;
      return {
        title: uc.name || 'Untitled',
        summary: uc.short_description || uc.description || 'Ingen beskrivning tillgänglig',
        image: uc.image || '',
        url,
      };
    });

    return NextResponse.json(articles);
    
  } catch (error) {
    console.warn('Failed to fetch news from kommun.ai.se:', error instanceof Error ? error.message : 'Unknown error');
    
    // Return fallback data instead of failing
    return NextResponse.json(FALLBACK_NEWS);
  }
} 
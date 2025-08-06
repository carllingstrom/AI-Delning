import Header from '@/components/Header';
import Link from 'next/link';

async function fetchNews() {
  try {
    // More robust URL construction for different environments
    let baseUrl: string;
    
    if (process.env.VERCEL_URL) {
      // On Vercel, use the provided URL
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else if (process.env.NODE_ENV === 'production') {
      // Fallback for other production environments
      baseUrl = 'https://kommunkartan-mvp.vercel.app';
    } else {
      // Development environment
      baseUrl = 'http://localhost:3000';
    }
    
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const res = await fetch(`${baseUrl}/api/news`, { 
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Kommunkartan-Internal/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      console.warn('Failed to fetch news:', res.status, res.statusText);
      return getFallbackNews();
    }
    
    const data = await res.json();
    return Array.isArray(data) ? data : getFallbackNews();
    
  } catch (error) {
    console.warn('Error fetching news:', error instanceof Error ? error.message : 'Unknown error');
    return getFallbackNews();
  }
}

function getFallbackNews() {
  return [
    {
      title: "AI-driven Chatbot för Medborgarservice",
      summary: "En interaktiv chatbot som hjälper medborgare att navigera kommunala tjänster och få svar på vanliga frågor dygnet runt.",
      image: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=400&h=200&fit=crop&auto=format",
      url: "https://kommun.ai.se"
    },
    {
      title: "Automatiserad Handläggning av Bygglov",
      summary: "AI-system som snabbar upp handläggningen av enkla bygglovsärenden genom automatisk kontroll av regelverk.",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=200&fit=crop&auto=format",
      url: "https://kommun.ai.se"
    },
    {
      title: "Prediktiv Analys för Infrastruktur",
      summary: "Maskininlärning för att förutsäga underhållsbehov av vägar och andra infrastruktursystem.",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop&auto=format",
      url: "https://kommun.ai.se"
    },
    {
      title: "Smart Resursoptimering",
      summary: "AI-baserad optimering av personalscheman och resursallokering inom kommun verksamheter.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop&auto=format",
      url: "https://kommun.ai.se"
    }
  ];
}

export default async function LandingPage() {
  const news = await fetchNews();

  return (
    <div className="min-h-screen flex flex-col bg-[#121f2b] text-[#fffefa]">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold text-[#fecb00] mb-6">Acceleration av AI-implementationer i Sverige</h1>
        <p className="max-w-2xl text-lg md:text-xl mb-8 text-gray-200">
          Upptäck kommunernas AI-initiativ, dela lärdomar och inspireras av konkreta resultat.
        </p>
        <div className="flex gap-4">
          <Link href="/map" className="px-6 py-3 rounded bg-[#fecb00] text-[#121f2b] font-semibold hover:bg-[#fecb00]">Utforska kartan</Link>
          <Link href="/projects" className="px-6 py-3 rounded border border-[#fecb00] text-[#fecb00] font-semibold hover:bg-[#224556]">Projektportal</Link>
        </div>

        {/* News Section */}
        <section className="mt-20">
          <h2 className="text-3xl font-bold mb-2 text-[#fecb00]">Senaste användningsfall</h2>
          <p className="mb-6 text-gray-300">Upptäck de senaste AI-projekten och användningsfallen från kommun.ai.se.</p>
          <div className="overflow-x-auto">
            <div className="flex gap-6 min-w-[900px]">
              {news && news.length > 0 ? news.slice(0, 4).map((item: any) => (
                <div key={item.title + item.url} className="bg-[#224556] rounded-xl shadow-lg p-0 flex flex-col justify-between border border-[#fecb00]/10 hover:border-[#fecb00]/40 transition overflow-hidden min-w-[320px] max-w-[320px] flex-shrink-0">
                  {item.image && (
                    <img src={item.image} alt={item.title} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-semibold mb-2 text-[#fffefa]">{item.title}</h3>
                    <p className="text-gray-200 mb-4 line-clamp-4">{item.summary}</p>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-block font-semibold text-[#fffefa] hover:underline transition">Läs mer</a>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-gray-400">Inga användningsfall kunde hämtas just nu.</div>
              )}
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-[#121F2B] py-6 text-sm text-center text-gray-400">
        © {new Date().getFullYear()} AI Sweden • Sidan utvecklas kontinuerligt och är inte ett officiellt verktyg från AI Sweden • Kontakta gärna carl.lingstrom@ai.se vid frågor
      </footer>
    </div>
  );
}

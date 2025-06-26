import Header from '@/components/Header';
import Link from 'next/link';

async function fetchNews() {
  const res = await fetch('http://localhost:3000/api/news', { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export default async function LandingPage() {
  const news = await fetchNews();

  return (
    <div className="min-h-screen flex flex-col bg-[#0D1B2A] text-white">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold text-[#FECB00] mb-6">Acceleration av AI-implementationer i Sverige</h1>
        <p className="max-w-2xl text-lg md:text-xl mb-8 text-gray-200">
          Upptäck kommunernas AI-initiativ, dela lärdomar och inspireras av konkreta resultat.
        </p>
        <div className="flex gap-4">
          <Link href="/map" className="px-6 py-3 rounded bg-[#FECB00] text-[#0D1B2A] font-semibold hover:bg-[#e0b400]">Utforska kartan</Link>
          <Link href="/projects" className="px-6 py-3 rounded border border-[#FECB00] text-[#FECB00] font-semibold hover:bg-[#1a2a3d]">Projektportal</Link>
        </div>

        {/* News Section */}
        <section className="mt-20">
          <h2 className="text-3xl font-bold mb-2 text-[#FFD600]">Senaste användningsfall</h2>
          <p className="mb-6 text-gray-300">Upptäck de senaste AI-projekten och användningsfallen från kommun.ai.se.</p>
          <div className="overflow-x-auto">
            <div className="flex gap-6 min-w-[900px]">
              {news && news.length > 0 ? news.slice(0, 4).map((item: any) => (
                <div key={item.title + item.url} className="bg-[#23272A] rounded-xl shadow-lg p-0 flex flex-col justify-between border border-[#FFD600]/10 hover:border-[#FFD600]/40 transition overflow-hidden min-w-[320px] max-w-[320px] flex-shrink-0">
                  {item.image && (
                    <img src={item.image} alt={item.title} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-semibold mb-2 text-white">{item.title}</h3>
                    <p className="text-gray-200 mb-4 line-clamp-4">{item.summary}</p>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-block font-semibold text-white hover:underline transition">Läs mer</a>
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

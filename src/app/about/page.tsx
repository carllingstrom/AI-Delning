import Header from '@/components/Header';
import SuccessMetrics from '@/components/about/SuccessMetrics';
import Link from 'next/link';

export default async function AboutPage() {
  // Ground success metrics in real data
  let analytics: any = null;
  try {
    const res = await fetch('/api/analytics', { cache: 'no-store' });
    if (res.ok) analytics = await res.json();
  } catch (e) {
    analytics = null;
  }
  return (
    <div className="min-h-screen bg-[#121f2b] text-[#fffefa]">
      <Header />
      
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="relative overflow-hidden mb-16">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="h-64 w-[120%] -left-10 -top-16 absolute bg-gradient-to-b from-[#1a2740] to-transparent opacity-70" />
          </div>
          <div className="relative text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-[#fecb00] tracking-tight mb-4">Projektportalen</h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed">
              En samlingsplats för AI-initiativ i offentlig sektor – med korrekt ROI, kostnader och effekter för att dela, lära och accelerera implementation.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-[#fecb00] mb-4">Vårt uppdrag</h2>
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h3 className="text-xl font-semibold text-[#fffefa] mb-2">Dela kunskap</h3>
              <p className="text-gray-300 leading-relaxed">
                Samla och dela erfarenheter med korrekt ROI, kostnad och effektdata. Undvik att uppfinna hjulet – bygg på det som fungerar.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#fffefa] mb-2">Accelerera implementation</h3>
              <p className="text-gray-300 leading-relaxed">
                Minska tid till värde med data-drivna beslut. Använd beprövade lösningar, tydliga effekter och uppföljning.
              </p>
            </div>
          </div>
        </section>

        {/* Challenges and success factors */}
        <section className="mb-20">
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-xl font-semibold text-[#fecb00] mb-3">Utmaningar</h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Spridda dataformat och varierande kvalitet</li>
                <li>• ROI-uppskattningar utan gemensam metod</li>
                <li>• Svårt att återanvända lärdomar mellan organisationer</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#fecb00] mb-3">Framgångsfaktorer</h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Enhetlig ROI-logik och sammanhållen data</li>
                <li>• Transparens: kostnader, effekter och antaganden</li>
                <li>• Delningspoäng som uppmuntrar komplett dokumentation</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#fecb00] mb-3">Effekter av delning</h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Kortare tid till värde och bättre beslut</li>
                <li>• Högre kvalitet och minskad risk</li>
                <li>• Skalbarhet – fler kan bygga vidare på det som fungerar</li>
              </ul>
            </div>
          </div>
        </section>

        {/* (Den äldre, boxiga sektionen är borttagen – se flödande sektionen längre ner) */}

        {/* Value for organisations – flowing text, no boxes */}
        <section className="mb-24">
          <h2 className="text-3xl font-bold text-[#fecb00] mb-4">Värde för organisationer</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-xl font-semibold text-[#fffefa] mb-2">💰 Kostnadsbesparingar</h3>
              <p className="text-gray-300 leading-relaxed">Lär av andras erfarenheter och undvik dyra misstag. Se konkreta ROI-exempel från liknande projekt.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#fffefa] mb-2">⏱️ Tidsbesparingar</h3>
              <p className="text-gray-300 leading-relaxed">Minska implementationstid genom att bygga vidare på beprövade lösningar och processer.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#fffefa] mb-2">🤝 Samarbete</h3>
              <p className="text-gray-300 leading-relaxed">Skapa nätverk med andra organisationer som arbetar med liknande utmaningar och lösningar.</p>
            </div>
          </div>
        </section>

        {/* Success Metrics grounded in live data */}
        <section className="mb-24">
          <h2 className="text-3xl font-bold text-[#fecb00] mb-4">Framgångsmått</h2>
          <SuccessMetrics />
        </section>

        {/* Flödande sektion: Så använder du Projektportalen */}
        <section className="mb-24">
          <h2 className="text-3xl font-bold text-[#fecb00] mb-6">Så använder du Projektportalen</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-xl font-semibold text-[#fffefa] mb-2">1. Utforska projekt</h3>
              <p className="text-gray-300 text-sm leading-relaxed">Få en bild av vad som redan är gjort. Filtrera på fas, område, teknik och ROI.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#fffefa] mb-2">2. Analysera effekter</h3>
              <p className="text-gray-300 text-sm leading-relaxed">Se investeringsnivåer, monetära effekter och återbetalningstid. Jämför värdedimensioner.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#fffefa] mb-2">3. Dela lärdomar</h3>
              <p className="text-gray-300 text-sm leading-relaxed">Dokumentera kostnader, effekter och antaganden. Hjälp fler nå värde snabbare.</p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-[#fecb00] mb-6">Kom Igång</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Börja utforska projekt eller dela ditt eget AI-initiativ för att bidra till Sveriges digitala utveckling.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/projects" 
              className="px-8 py-4 bg-[#fecb00] text-[#121f2b] font-bold rounded-lg hover:bg-[#fecb00] transition-colors"
            >
              Utforska Projekt
            </Link>
            <Link 
              href="/projects/new" 
              className="px-8 py-4 border-2 border-[#fecb00] text-[#fecb00] font-bold rounded-lg hover:bg-[#fecb00] hover:text-[#121f2b] transition-colors"
            >
              Dela Ditt Projekt
            </Link>
          </div>
        </section>

        {/* Footer Info */}
        <div className="mt-16 pt-8 border-t border-gray-600 text-center text-gray-400">
          <p className="mb-2">
            Denna plattform utvecklas kontinuerligt och är inte ett officiellt verktyg från AI Sweden.
          </p>
          <p>
            Kontakta gärna <a href="mailto:carl.lingstrom@ai.se" className="text-[#fecb00] hover:underline">carl.lingstrom@ai.se</a> vid frågor eller förslag.
          </p>
        </div>
      </main>
    </div>
  );
} 
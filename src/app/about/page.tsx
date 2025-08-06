import Header from '@/components/Header';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#121f2b] text-[#fffefa]">
      <Header />
      
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#fecb00] mb-6">
            Om Kommunkartan
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            En plattform för att dela, upptäcka och lära av AI-implementeringar i svenska kommuner
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#fecb00] mb-6">Vårt Uppdrag</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#224556] p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-[#fecb00] mb-4">Dela Kunskap</h3>
              <p className="text-gray-300">
                Samla och dela erfarenheter från AI-projekt i kommuner för att undvika att uppfinna hjulet på nytt. 
                Varje projekt bidrar till kollektiv kunskap som gynnar hela sektorn.
              </p>
            </div>
            <div className="bg-[#224556] p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-[#fecb00] mb-4">Accelerera Implementation</h3>
              <p className="text-gray-300">
                Minska tid till värde genom att bygga vidare på beprövade lösningar. 
                Få inspiration från liknande projekt och undvik vanliga fallgropar.
              </p>
            </div>
          </div>
        </section>

        {/* How to Use Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#fecb00] mb-6">Så Använder Du Plattformen</h2>
          
          <div className="space-y-8">
            <div className="bg-[#224556] p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-[#fecb00] mb-4">1. Utforska Projekt</h3>
              <p className="text-gray-300 mb-4">
                Börja med att utforska befintliga projekt för att få inspiration och förstå vad som redan har implementerats.
              </p>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-[#1a2a3d] p-4 rounded">
                  <h4 className="font-semibold text-[#fecb00] mb-2">Projektportalen</h4>
                  <p className="text-gray-400">Bläddra bland alla projekt med avancerade filter för fas, område och ROI</p>
                </div>
                <div className="bg-[#1a2a3d] p-4 rounded">
                  <h4 className="font-semibold text-[#fecb00] mb-2">Kartan</h4>
                  <p className="text-gray-400">Se projekt geografiskt och hitta vad som händer i närliggande kommuner</p>
                </div>
                <div className="bg-[#1a2a3d] p-4 rounded">
                  <h4 className="font-semibold text-[#fecb00] mb-2">Analys</h4>
                  <p className="text-gray-400">Förstå trender och insikter från hela databasen</p>
                </div>
              </div>
            </div>

            <div className="bg-[#224556] p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-[#fecb00] mb-4">2. Hitta Liknande Projekt</h3>
              <p className="text-gray-300 mb-4">
                Använd sökfunktionen för att hitta projekt som liknar dina behov. Filtrera på:
              </p>
              <ul className="text-gray-300 space-y-2 ml-4">
                <li>• <strong>Område:</strong> Samma verksamhetsområde som ditt projekt</li>
                <li>• <strong>Fas:</strong> Idé, pilot eller implementerat</li>
                <li>• <strong>ROI:</strong> Projekt med positiv avkastning</li>
                <li>• <strong>Teknologi:</strong> Specifika AI-tekniker eller plattformar</li>
                <li>• <strong>Kommunstorlek:</strong> Liknande befolkningsstorlek</li>
              </ul>
            </div>

            <div className="bg-[#224556] p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-[#fecb00] mb-4">3. Analysera ROI och Effekter</h3>
              <p className="text-gray-300 mb-4">
                Varje projekt innehåller detaljerad information om kostnader, effekter och ROI. Använd denna data för att:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#1a2a3d] p-4 rounded">
                  <h4 className="font-semibold text-[#fecb00] mb-2">Kostnadsanalys</h4>
                  <ul className="text-gray-400 text-sm space-y-1">
                    <li>• Detaljerad kostnadsfördelning</li>
                    <li>• Timkostnader och resurser</li>
                    <li>• Budget vs faktisk kostnad</li>
                  </ul>
                </div>
                <div className="bg-[#1a2a3d] p-4 rounded">
                  <h4 className="font-semibold text-[#fecb00] mb-2">Effektmätning</h4>
                  <ul className="text-gray-400 text-sm space-y-1">
                    <li>• Kvantifierbara besparingar</li>
                    <li>• Kvalitativa förbättringar</li>
                    <li>• ROI-beräkningar</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-[#224556] p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-[#fecb00] mb-4">4. Dela Ditt Projekt</h3>
              <p className="text-gray-300 mb-4">
                Bidra till kollektiv kunskap genom att dela dina egna AI-projekt. Detta hjälper andra kommuner och bygger upp plattformen.
              </p>
              <div className="bg-[#1a2a3d] p-4 rounded">
                <h4 className="font-semibold text-[#fecb00] mb-2">Vad Du Kan Dela</h4>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li>• Projektbeskrivning och mål</li>
                  <li>• Kostnadsdata och budget</li>
                  <li>• Effektmätningar och ROI</li>
                  <li>• Teknisk implementation</li>
                  <li>• Lärdomar och utmaningar</li>
                  <li>• Juridisk och organisatorisk information</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#fecb00] mb-6">Värde för Kommuner</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#224556] p-6 rounded-lg text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-[#fecb00] mb-3">Kostnadsbesparingar</h3>
              <p className="text-gray-300">
                Lär av andras erfarenheter och undvik dyra misstag. Se konkreta ROI-exempel från liknande projekt.
              </p>
            </div>
            <div className="bg-[#224556] p-6 rounded-lg text-center">
              <div className="text-4xl mb-4">⏱️</div>
              <h3 className="text-xl font-semibold text-[#fecb00] mb-3">Tidsbesparingar</h3>
              <p className="text-gray-300">
                Minska implementationstid genom att bygga vidare på beprövade lösningar och processer.
              </p>
            </div>
            <div className="bg-[#224556] p-6 rounded-lg text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold text-[#fecb00] mb-3">Samarbete</h3>
              <p className="text-gray-300">
                Skapa nätverk med andra kommuner som arbetar med liknande utmaningar och lösningar.
              </p>
            </div>
          </div>
        </section>

        {/* Success Metrics */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-[#fecb00] mb-6">Framgångsmått</h2>
          <div className="bg-[#224556] p-8 rounded-lg">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-[#fecb00] mb-2">100+</div>
                <div className="text-gray-400">Projekt delade</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#fecb00] mb-2">50+</div>
                <div className="text-gray-400">Kommuner representerade</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#fecb00] mb-2">85%</div>
                <div className="text-gray-400">Genomsnittlig ROI</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#fecb00] mb-2">12</div>
                <div className="text-gray-400">Verksamhetsområden</div>
              </div>
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
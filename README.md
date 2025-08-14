# Projektportalen

En modern plattform för att samla, analysera och dela AI-projekt mellan organisationer. Byggd med Next.js (App Router), TypeScript och Supabase. Innehåller en robust ROI-motor, datadrivna analyser och en skalad effektmodell för att extrapolera nytta och kostnad till flera organisationer.

## Funktioner

### Kärnfunktioner
- Projektportal med listning, filter och projektdetaljer (flikar: Översikt/Analys)
- Interaktiv karta med projektdetaljpanel i samma tema som portalen
- Fullständigt projektformulär med autospar och dynamiska villkor (inkl. PoV-logik)
- Export (PDF one-pagers) och delningspoäng ("sharing score")

### Analytics & Insights
- Konsistent ROI, faktisk kostnad och total monetär nytta i alla vyer och API:er
- Analysflik per projektlista med topplistor, fördelningar och små visualiseringar
- Om-sida med liveframgångsmått (serverkomponent som hämtar analytics)

### Skalad effekt (Aggregera effekt)
- Panel på projektsidan som låter administratörer simulera skalning till N organisationer
- Parametrar: N, adoptionsgrad, scalability (dämpning), replikeringskostnad (timmar/%), normalisering
- Visualiseringar: ROI vs N-graf, P10/P50/P90 (osäkerhet), tornado (känslighet), breakdown per värdedimension
- Resultat sparas och återanvänds i portföljens Impact Explorer

### Teknisk Stack
- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Karta**: Leaflet
- **Backend**: Next.js API Routes
- **Databas**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## Snabbstart

### Förutsättningar
- Node.js 18+
- npm eller yarn
- Supabase-projekt

### Installation

1. **Klona projektet**
```bash
git clone <repository-url>
cd AI-Delning
```

2. **Installera dependencies**
```bash
npm install
```

3. **Konfigurera miljövariabler**
Skapa en `.env.local` fil:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. **Kör utvecklingsservern**
```bash
npm run dev
```

5. **Öppna [http://localhost:3000](http://localhost:3000)**

## Databas Setup

### Supabase Migrationer
Projektet använder Supabase för datalagring. Se `supabase/migrations/` för schema.

### Seed Data
Använd skripten i `scripts/` för att fylla databasen:
```bash
node scripts/seedBasicData.mjs
```

## Projektstruktur

```
AI-Delning/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API endpoints
│   │   ├── analytics/      # Analytics dashboard
│   │   ├── map/            # Karta
│   │   └── projects/       # Projekthantering
│   ├── components/         # React komponenter
│   └── lib/                # Utilities
├── public/
│   └── data/               # GeoJSON data
├── scripts/                # Seed & utils
└── supabase/
    └── migrations/         # Database schema
```

## ROI- och effektmodell (centrala formler)
- ROI: `((Total nytta − Total kostnad) / Total kostnad) × 100`
- Konsistens: samma ROI-motor används i projektlista, projektdetalj, analytics och export
- Tidsmultiplikatorer: 47 arbetsveckor/år, korrekt tolkning per tidsskala
- Kostnader: aggregeras från `cost_data.actualCostDetails.costEntries`
- Effekter/nytta: aggregeras från `effects_data.effectDetails`

## Skalad effekt & Impact Explorer
### Varför?
Visa hur ett projekt kan ge nytta om det införs i fler organisationer och vad replikering kostar.

### Var görs det?
- Projektsida → fliken Analys → sektionen "Juridisk & Etisk analys" → "Skalad effektanalys"

### Parametrar
- N (antal org), adoptionsgrad (%), scalability 0.6–1.0 (dämpning), normalisering (driver + exponent)
- Replikeringskostnad:
  - Timmar × timpris (bas + marginal per org)
  - Procentuellt avdrag (linjärt/geometriskt) – kräver uttrycklig replikationsbas (baseUnitCost)
  - Fast rabatt per org

### Viktigt om replikering
- Procentmodeller använder bara den bas du anger (ingen dold default). Om ingen bas anges är extra-kostnad 0.
- Replikering påverkar kostnad; adoption/normalisering påverkar nytta.

### Sparade resultat
- Vid "Beräkna" sparas indata + resultat:
  - Klient: `localStorage` per projekt
  - Server: `/api/impact/save` sparar i `projects.effects_data.scaledImpactLatest`
- Impact Explorer (portfölj) summerar endast projekt med sparad skalad effekt

### Visualiseringar
- ROI vs N (SVG)
- P10/P50/P90-band via ±% på nytta/kostnad
- Tornado: ±10% på centrala parametrar, skala symmetriskt runt bas-ROI
- Nytta per värdedimension (skalad breakdown)

## Deployment

### Vercel Deployment
1. Pusha kod till GitHub
2. Anslut repository till Vercel
3. Konfigurera miljövariabler
4. Deploy!

### Miljövariabler för Production
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Contributing
1. Fork projektet
2. Skapa en feature branch (`git checkout -b feature/amazing-feature`)
3. Commit dina ändringar (`git commit -m 'Add amazing feature'`)
4. Push till branchen (`git push origin feature/amazing-feature`)
5. Öppna en Pull Request

## Licens
MIT

## Credits
Utvecklat för svenska organisationer för att främja AI-innovation och kunskapsdelning.

---

Status: Beta – i aktiv utveckling

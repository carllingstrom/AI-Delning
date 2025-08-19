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

### Grundläggande tankesätt
**Projektet bygger på att samla verklig data om kostnader och effekter, inte budgetar eller skattningar.**

### ROI-beräkning
- **Formel**: `((Total nytta − Total kostnad) / Total kostnad) × 100`
- **Konsistens**: samma ROI-motor används överallt (projektlista, projektdetalj, analytics, export)
- **Datakällor**: 
  - Kostnader: `cost_data.actualCostDetails.costEntries` (faktiska kostnader)
  - Effekter/nytta: `effects_data.effectDetails` (uppmätta effekter)
- **Tidsmultiplikatorer**: 47 arbetsveckor/år, korrekt tolkning per tidsskala

### Kostnadskategorier
1. **Intern arbete** (timmar × timpris)
2. **Externa konsulter** (timmar × timpris) 
3. **Teknisk infrastruktur** (drift, licenser, hårdvara)
4. **Juridisk utredning** (compliance, GDPR-analys)
5. **Utbildning** (kompetensutveckling)
6. **Övrigt** (övriga kostnader)

### Effektkategorier
1. **Tidsbesparing** (timmar → SEK via timpris)
2. **Ekonomisk omfördelning** (kostnadsbesparinga, kvantifierad)
3. **Kvalitativa effekter** (förbättrad service, nöjdhet)
4. **Finansiella effekter** (direkta intäkter/besparingar, kvantifierad)

### Var används vad?
- **Projektformulär**: Insamling av faktisk kostnad och effektdata
- **Projektdetalj**: Visa ROI och breakdown per kategori
- **Projektlista**: Visa ROI, sharing score, fastighetsstatus
- **Analytics**: Aggregerad analys över alla projekt
- **Export**: PDF med komplett kostnad/effektanalys
- **Skalad effekt**: Extrapolera till flera organisationer

## Skalad effekt & Impact Explorer

### Syfte och tankesätt
**Extrapolerera ett projekts nytta och kostnad till flera organisationer baserat på verkliga kostnader.**

### Grundläggande princip
1. **Utgångspunkt**: Vad kostar det att implementera för **EN organisation**?
2. **Skalning**: Hur påverkas kostnaden/nyttan när fler organisationer är med?
3. **Realism**: Validering och varningar för orealistiska antaganden

### Var görs det?
- **Projektsida** → **Analys-flik** → **"Juridisk & Etisk analys"** → **"Skalad effektanalys"**
- **Projektlista** → **Analys-flik** → **"Impact Explorer"** (portföljvy)

### Skalningsparametrar

#### Grundparametrar
- **Antal organisationer (N)**: Hur många som ska implementera
- **Adoptionsgrad (%)**: Andel som faktiskt går live
- **Scalability coefficient (0.6-1.0)**: Dämpning av nytta (diminishing returns)

#### Kostnadsmodeller (välj EN):

**1. Timmar per organisation** *(mest noggrann)*
- Input: Timmar för EN organisation + timpris
- Logik: Samma implementeringskostnad för alla
- Exempel: 160h × 900 SEK = 144 000 SEK per org

**2. Fast kostnad per organisation**
- Input: Direkt kostnad för EN organisation
- Logik: Samma kostnad oavsett antal
- Exempel: 150 000 SEK per organisation

**3. Skalfördelar** *(blir billigare)*
- Input: Baskostnad + rabatt% per ytterligare org + minimikostnad
- Logik: Org 1 = baskostnad, sedan rabatt för varje ny
- Exempel: 180k → 171k → 162k... (5% rabatt, min 75k)

**4. Ökad komplexitet** *(blir dyrare)*
- Input: Baskostnad + ökning% per ytterligare org
- Logik: Koordinationskostnader ökar med fler organisationer
- Exempel: 180k → 185k → 191k... (3% ökning)

#### Normalisering (valfritt)
- **Driver-typ**: Befolkning, användare, anställda, område, anpassad
- **Basvärde**: Referensorganisationens storlek
- **Målvärde**: Genomsnittlig målorganisation
- **Exponent**: Känslighet för storleksskillnader (0.5-1.5)

### Beräkningsflöde
```
1. Basproject: ROI, kostnad, nytta från faktisk data
2. Per organisation (2,3,4...N):
   - Kostnad: Enligt vald kostnadsmodell
   - Nytta: Normaliserad + skalningsdämpning
3. Totalsummering: Σ kostnader, Σ nytta
4. Skalad ROI: ((Total nytta - Total kostnad) / Total kostnad) × 100
5. Validering: Varningar för orealistiska resultat
```

### Validering och säkerhet
- **ROI-begränsning**: Max 1000% (sanity check)
- **Minimiomkostnad**: Minst 50k SEK per organisation
- **Varningssystem**: Automatiska varningar för orealistiska värden
- **Realistighetsindikator**: Grön/röd feedback på resultat

### Sparade resultat
- **Klient**: `localStorage` per projekt (input + resultat)
- **Server**: `/api/impact/save` → `projects.effects_data.scaledImpactLatest`
- **Portfölj**: Impact Explorer summerar endast projekt med sparad skaleffekt

### Visualiseringar och analys
- **ROI vs N**: Linjediagram som visar ROI-utveckling med fler organisationer
- **Osäkerhetsintervall**: P10/P50/P90 baserat på nytta±% och kostnad±%
- **Tornado-diagram**: Känslighetsanalys (±10% på parametrar)
- **Scenario-jämförelse**: Snabböversikt för 5, 10, 25, 50 organisationer
- **Nytta per värdedimension**: Breakdown av skalad nytta

## API-struktur och dataflöde

### Kärnendpoints
- **`/api/projects`**: Lista projekt med `calculatedMetrics` (ROI, totalMonetaryValue, actualCost)
- **`/api/projects/[id]`**: Hämta enskilt projekt med fullständig data
- **`/api/analytics`**: Aggregerad analys över alla projekt
- **`/api/impact/compute`**: Beräkna skalad effekt för ett projekt
- **`/api/impact/save`**: Spara skalad effekt till databas

### Datamodell (viktiga fält)

#### Projects-tabellen
```sql
- id, title, intro, phase, areas, value_dimensions
- cost_data (JSONB): { actualCostDetails: { costEntries: [...] } }
- effects_data (JSONB): { effectDetails: [...], scaledImpactLatest: {...} }
- technical_data, legal_data, leadership_data (JSONB)
```

#### ROI-beräkning i praktiken
```javascript
// Kostnader (från cost_data.actualCostDetails.costEntries)
costEntries.forEach(entry => {
  if (entry.costType === 'hours') totalCost += entry.hours * entry.rate
  if (entry.costType === 'fixed') totalCost += entry.amount
  // ... andra typer
})

// Effekter (från effects_data.effectDetails)
effectDetails.forEach(effect => {
  effect.impactMeasurement.measurements.forEach(measurement => {
    if (measurement.monetaryEstimate) totalBenefit += parseFloat(measurement.monetaryEstimate)
  })
})

// ROI
const roi = ((totalBenefit - totalCost) / totalCost) * 100
```

### Konsistens mellan vyer
**Alla komponenter använder samma beräkningslogik:**
- `src/lib/roiCalculator.ts` - Central ROI-motor
- `src/services/impact/scale.service.ts` - Skalad effekt-motor
- `src/lib/utils.ts` - Formattering och hjälpfunktioner

## Replikering och best practices

### För utvecklare som ska använda detta system

#### Kostnadsinsamling
1. **Samla faktiska kostnader**, inte budgetar
2. **Kategorisera tydligt**: intern arbete, externa konsulter, infrastruktur, juridik, utbildning
3. **Dokumentera timmar och timpris** för största transparens
4. **Inkludera alla kostnader** från projektstart till avslut

#### Effektmätning
1. **Mät verkliga effekter** efter implementation
2. **Kvantifiera tidsbesparingar** (timmar × timpris)
3. **Dokumentera kostnadsbesparingar** (specifika belopp)
4. **Kvalitativa effekter** (nöjdhet, serviceförbättring) som komplement

#### Skaleffekt-modellering
1. **Börja enkelt**: Använd "Fast kostnad per organisation" först
2. **Utveckla gradvis**: Gå till "Timmar per organisation" för noggrannhet
3. **Testa skalfördelar**: Använd endast om det finns verkliga economies of scale
4. **Validera antaganden**: Kontrollera varningar och realistighetsindikator

#### Teknisk implementation
```javascript
// Rätt sätt att använda ROI-motorn
import { computeROIMetrics } from '@/services/roi/roi.service';

const metrics = computeROIMetrics({
  effectEntries: project.effects_data?.effectDetails || [],
  costEntries: project.cost_data?.actualCostDetails?.costEntries || [],
  budgetAmount: null // Använd inte budget som fallback
});

// Skalad effekt
import { computeScaledImpact } from '@/services/impact/scale.service';

const scaledResult = computeScaledImpact(project, {
  orgs: 10,
  adoptionRatePct: 70,
  replication: {
    mode: 'cost_per_org',
    costPerOrg: 150000
  }
});
```

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

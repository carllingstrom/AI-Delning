# 🗺️ Kommunkartan MVP

En interaktiv karta för att visualisera och hantera AI-projekt inom svenska kommuner. Byggd med Next.js, TypeScript, Supabase och Leaflet.

## ✨ Funktioner

### 🎯 Kärnfunktioner
- **Interaktiv Sverige-karta** med projekt per kommun
- **Idébank** för projekt som inte är knutna till specifika kommuner
- **Projekthantering** med fullständiga formulär för skapande och redigering
- **Analytics dashboard** med ROI-beräkningar och insikter
- **Avancerad filtrering** efter områden och värdedimensioner

### 📊 Analytics & Insights
- Ekonomisk översikt med budget och kostnadsberäkningar
- ROI-analys och prestationsranking
- Teknikinsikter och implementeringsstatistik
- Effektmätning och påverkansbedömning

### 🛠️ Teknisk Stack
- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Karta**: Leaflet med force-layout algoritmer
- **Backend**: Next.js API Routes
- **Databas**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## 🚀 Snabbstart

### Förutsättningar
- Node.js 18+
- npm eller yarn
- Supabase-projekt

### Installation

1. **Klona projektet**
\`\`\`bash
git clone <repository-url>
cd kommunkartan-mvp
\`\`\`

2. **Installera dependencies**
\`\`\`bash
npm install
\`\`\`

3. **Konfigurera miljövariabler**
Skapa en \`.env.local\` fil:
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
\`\`\`

4. **Kör utvecklingsservern**
\`\`\`bash
npm run dev
\`\`\`

5. **Öppna [http://localhost:3000](http://localhost:3000)**

## 📋 Databas Setup

### Supabase Migrationer
Projektet använder Supabase för datalagring. Se \`supabase/migrations/\` för schema.

### Seed Data
Använd skripten i \`scripts/\` för att fylla databasen:
\`\`\`bash
node scripts/seedBasicData.mjs
\`\`\`

## 🏗️ Projektstruktur

\`\`\`
kommunkartan-mvp/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API endpoints
│   │   ├── analytics/      # Analytics dashboard
│   │   ├── map/           # Huvudkarta
│   │   └── projects/      # Projekthantering
│   ├── components/        # React komponenter
│   └── lib/              # Utilities
├── public/
│   └── data/             # GeoJSON data
├── scripts/              # Database seeding
└── supabase/
    └── migrations/       # Database schema
\`\`\`

## 🌟 Huvudfunktioner

### Kartfunktionalitet
- **Force-layout algoritm** för optimal placering av kommun-cirklar
- **Dynamisk storleksanpassning** baserat på antal projekt
- **Zoom och pan** med Leaflet
- **Idébank-cirkel** för projekt utan kommuntillhörighet

### Projektformulär
- **Stegvis wizard** med validering
- **Dynamiska sektioner** baserat på projekttyp
- **Kostnadsberäkningar** med automatisk summering
- **Effektmätning** med monetära uppskattningar

### Analytics
- **Finansiell analys** med ROI-beräkningar
- **Prestationsranking** av kommuner
- **Teknikinsikter** om AI-metodologier
- **Filtrerbar data** efter områden och värde

## 🚀 Deployment

### Vercel Deployment
1. Pusha kod till GitHub
2. Anslut repository till Vercel
3. Konfigurera miljövariabler
4. Deploy!

### Miljövariabler för Production
- \`NEXT_PUBLIC_SUPABASE_URL\`
- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
- \`SUPABASE_SERVICE_ROLE_KEY\`

## 🤝 Contributing

1. Fork projektet
2. Skapa en feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit dina ändringar (\`git commit -m 'Add amazing feature'\`)
4. Push till branchen (\`git push origin feature/amazing-feature\`)
5. Öppna en Pull Request

## 📄 License

Detta projekt är licensierat under MIT License.

## 🏆 Credits

Utvecklat för svenska kommuner för att främja AI-innovation och kunskapsdelning.

---

**Status**: 🚀 Beta - Redo för deployment!

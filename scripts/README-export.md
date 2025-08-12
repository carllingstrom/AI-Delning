# Project Data Export Scripts

Detta dokument förklarar hur man exporterar all projektdata från databasen.

## Scripts

### 1. `export-all-projects.mjs`
Automatisk export som använder miljövariabler från `.env` fil.

**Förutsättningar:**
- `.env` fil med Supabase credentials
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**Användning:**
```bash
node scripts/export-all-projects.mjs
```

### 2. `export-all-projects-simple.mjs`
Interaktiv export som frågar efter credentials.

**Användning:**
```bash
node scripts/export-all-projects-simple.mjs
```

Scriptet kommer att fråga efter:
- Supabase URL
- Supabase Service Role Key

## Output

Båda scripten skapar:

1. **JSON-fil** med all projektdata: `exports/all-projects-export-YYYY-MM-DD.json`
2. **Sammanfattningsrapport**: `exports/project-summary-YYYY-MM-DD.txt`

### JSON-fil innehåller:
- Alla projekt med komplett data
- Relaterade kommuner, områden och värdedimensioner
- Timestamps för export

### Sammanfattningsrapport innehåller:
- Totalt antal projekt
- Fördelning per fas (idea, project, etc.)
- De 10 senaste projekten
- Datakompletthet per sektion

## Hitta Supabase Credentials

1. Gå till [Supabase Dashboard](https://supabase.com/dashboard)
2. Välj ditt projekt
3. Gå till Settings > API
4. Kopiera:
   - **Project URL** (för `NEXT_PUBLIC_SUPABASE_URL`)
   - **service_role key** (för `SUPABASE_SERVICE_ROLE_KEY`)

## Säkerhet

- Service Role Key ger full åtkomst till databasen
- Använd endast för export, inte för produktionsappar
- Ta bort eller skydda exportfiler efter användning

## Exempel på .env fil

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
``` 
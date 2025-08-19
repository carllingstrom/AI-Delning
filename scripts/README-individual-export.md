# Individual Project Export Script

Detta script exporterar varje projekt som en separat JSON-fil, vilket gör det enkelt att hantera och använda individuell projektdata.

## Användning

```bash
node scripts/export-projects-individually.mjs
```

Scriptet kommer att fråga efter:
- Supabase URL (Project URL)
- Supabase Service Role Key

## Output

Scriptet skapar en mapp: `exports/individual-projects-YYYY-MM-DD/`

### Innehåll:

1. **En JSON-fil per projekt**: `projekt-titel.json`
   - Filnamn baserat på projektets titel (sanerat för filsystem)
   - Innehåller all projektdata inklusive relaterade kommuner och värdedimensioner

2. **_manifest.json**: Översiktsfil med:
   - Metadata om exporten
   - Lista över alla exporterade projekt med filnamn
   - Snabb referens för att hitta specifika projekt

3. **_summary.txt**: Läsbar sammanfattning med:
   - Exportstatistik
   - Fördelning per fas och organisation
   - Lista över alla exporterade filer

## JSON-fil struktur

Varje projektfil innehåller:

```json
{
  "exportMetadata": {
    "exportedAt": "2024-01-15T10:30:00.000Z",
    "projectId": "123",
    "originalTitle": "AI-baserad vägunderhållsanalys"
  },
  "project": {
    "id": "123",
    "title": "AI-baserad vägunderhållsanalys",
    "intro": "...",
    "problem": "...",
    "opportunity": "...",
    "phase": "implemented",
    "budget_amount": 2085000,
    "cost_data": { ... },
    "effects_data": { ... },
    "project_municipalities": [ ... ],
    "project_value_dimensions": [ ... ]
    // ... all other project fields
  }
}
```

## Fördelar

- **Enkel hantering**: En fil per projekt
- **Selektiv användning**: Läs bara de projekt du behöver
- **Versionshantering**: Enkelt att spåra ändringar per projekt
- **Integration**: Perfekt för scripts och andra system
- **Backup**: Individuella filer för säkerhetskopiering

## Filnamn

Projektnamn saneras för filsystem-säkerhet:
- Ogiltiga tecken (`<>:"/\|?*`) ersätts med `-`
- Mellanslag blir `-`
- Begränsas till 100 tecken
- Exempel: `AI-baserad vägunderhållsanalys.json`

## Hitta Supabase Credentials

1. Gå till [Supabase Dashboard](https://supabase.com/dashboard)
2. Välj ditt projekt
3. Settings > API
4. Kopiera:
   - **Project URL** (för Supabase URL)
   - **service_role key** (för Service Role Key)

## Säkerhet

- Service Role Key ger full åtkomst till databasen
- Använd endast för export, inte för produktionsappar
- Skydda eller ta bort exportfiler efter användning
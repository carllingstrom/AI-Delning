import { createClient } from '@supabase/supabase-js';
import centroid from '@turf/centroid';
import fs from 'fs/promises';
import 'dotenv/config';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // 1. hämta GeoJSON från storage
  const { data, error } = await supabase.storage
    .from('kommunkartan-mvp/public')
    .download('sweden_municipalities.geojson');
  if (error) throw error;

  const geoJSON = JSON.parse(await data.text());

  // 2. bygg rader
  const rows = geoJSON.features.map((f) => {
    const p = f.properties;
    const name =
      p.kom_namn || p.name || p.NAMN || p.KN_NAMN || 'Okänd';
    const [lng, lat] = centroid(f).geometry.coordinates;
    return { name, lat, lng };
  });

  // 3. upsert batch 200
  for (let i = 0; i < rows.length; i += 200) {
    const slice = rows.slice(i, i + 200);
    const { error: e } = await supabase
      .from('municipalities')
      .upsert(slice, { onConflict: 'name' });
    if (e) console.error(e);
  }

}

run().catch(console.error);

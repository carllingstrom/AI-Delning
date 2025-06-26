import { createClient } from '@supabase/supabase-js';
import centroid from '@turf/centroid';
import fs from 'fs/promises';
import 'dotenv/config';
import { config } from 'dotenv';

// Load .env.local instead of .env
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedMunicipalities() {
  console.log('🌍 Seeding municipalities...');
  
  // 1. Get GeoJSON from storage
  const { data, error } = await supabase.storage
    .from('kommunkartan-mvp/public')
    .download('sweden_municipalities.geojson');
  if (error) throw error;

  const geoJSON = JSON.parse(await data.text());

  // 2. Build rows
  const rows = geoJSON.features.map((f) => {
    const p = f.properties;
    const name = p.kom_namn || p.name || p.NAMN || p.KN_NAMN || 'Okänd';
    const [lng, lat] = centroid(f).geometry.coordinates;
    return { name, lat, lng };
  });

  // 3. Upsert in batches of 200
  for (let i = 0; i < rows.length; i += 200) {
    const slice = rows.slice(i, i + 200);
    const { error: e } = await supabase
      .from('municipalities')
      .upsert(slice, { onConflict: 'name' });
    if (e) console.error('Error upserting municipalities:', e);
  }

  console.log('✅ Municipalities seeded:', rows.length);
  return rows;
}

async function seedProjectCounts(municipalities) {
  console.log('📊 Seeding project counts...');

  // 1. Create project counts table if it doesn't exist
  const { error: createError } = await supabase.rpc('create_project_counts_table');
  if (createError) {
    console.error('Error creating project counts table:', createError);
    return;
  }

  // 2. Initialize all municipalities with 0 projects
  const projectCounts = municipalities.map(m => ({
    name: m.name,
    project_count: 0
  }));

  // 3. Set specific counts for Stockholm and Göteborg
  const stockholmIndex = projectCounts.findIndex(m => m.name === 'Stockholm');
  const goteborgIndex = projectCounts.findIndex(m => m.name === 'Göteborg');

  if (stockholmIndex !== -1) {
    projectCounts[stockholmIndex].project_count = 3;
    console.log('✅ Set Stockholm count to 3');
  } else {
    console.log('⚠️ Stockholm not found in municipalities');
  }

  if (goteborgIndex !== -1) {
    projectCounts[goteborgIndex].project_count = 1;
    console.log('✅ Set Göteborg count to 1');
  } else {
    console.log('⚠️ Göteborg not found in municipalities');
  }

  // 4. Upsert in batches of 200
  for (let i = 0; i < projectCounts.length; i += 200) {
    const slice = projectCounts.slice(i, i + 200);
    const { error: e } = await supabase
      .from('municipality_project_counts')
      .upsert(slice, { onConflict: 'name' });
    if (e) console.error('Error upserting project counts:', e);
  }

  console.log('✅ Project counts initialized for all municipalities');
}

async function run() {
  try {
    // 1. Seed municipalities first
    const municipalities = await seedMunicipalities();
    
    // 2. Seed project counts
    await seedProjectCounts(municipalities);

    console.log('🎉 All data seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

run(); 
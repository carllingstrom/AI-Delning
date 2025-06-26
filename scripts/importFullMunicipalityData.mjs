import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function importMunicipalityData() {
  try {
    console.log('🗺️  Starting municipality data import...')
    
    // Read the GeoJSON file
    const geojsonPath = path.join(process.cwd(), 'public/data/sweden_municipalities.geojson')
    const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'))
    
    console.log(`📊 Found ${geojsonData.features.length} municipalities in GeoJSON`)
    
    // First, update the municipalities table schema to include all the rich data
    console.log('🔧 Updating municipalities table schema...')
    
    const schemaUpdates = `
      -- Add columns for rich municipality data
      ALTER TABLE municipalities 
      ADD COLUMN IF NOT EXISTS kom_id TEXT,
      ADD COLUMN IF NOT EXISTS lan_code TEXT,
      ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7),
      ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7),
      ADD COLUMN IF NOT EXISTS geometry JSONB,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
      
      -- Add indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_municipalities_kom_id ON municipalities(kom_id);
      CREATE INDEX IF NOT EXISTS idx_municipalities_lan_code ON municipalities(lan_code);
      CREATE INDEX IF NOT EXISTS idx_municipalities_coordinates ON municipalities(latitude, longitude);
    `
    
    const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schemaUpdates })
    if (schemaError) {
      console.error('Schema update error:', schemaError)
      // Continue anyway - columns might already exist
    }
    
    // Process each municipality from the GeoJSON
    let importedCount = 0
    let updatedCount = 0
    
    for (const feature of geojsonData.features) {
      const properties = feature.properties
      const geometry = feature.geometry
      
      // Extract data from properties
      const municipalityData = {
        name: properties.kom_namn,
        kom_id: properties.id,
        lan_code: properties.lan_code,
        latitude: properties.geo_point_2d ? properties.geo_point_2d[0] : null,
        longitude: properties.geo_point_2d ? properties.geo_point_2d[1] : null,
        geometry: geometry,
        updated_at: new Date().toISOString()
      }
      
      // Check if municipality already exists
      const { data: existing, error: checkError } = await supabase
        .from('municipalities')
        .select('id, name')
        .eq('kom_id', municipalityData.kom_id)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error(`Error checking municipality ${municipalityData.name}:`, checkError)
        continue
      }
      
      if (existing) {
        // Update existing municipality
        const { error: updateError } = await supabase
          .from('municipalities')
          .update({
            name: municipalityData.name,
            lan_code: municipalityData.lan_code,
            latitude: municipalityData.latitude,
            longitude: municipalityData.longitude,
            geometry: municipalityData.geometry,
            updated_at: municipalityData.updated_at
          })
          .eq('id', existing.id)
        
        if (updateError) {
          console.error(`Error updating ${municipalityData.name}:`, updateError)
        } else {
          updatedCount++
          if (updatedCount % 50 === 0) {
            console.log(`✅ Updated ${updatedCount} municipalities...`)
          }
        }
      } else {
        // Insert new municipality
        const { error: insertError } = await supabase
          .from('municipalities')
          .insert(municipalityData)
        
        if (insertError) {
          console.error(`Error inserting ${municipalityData.name}:`, insertError)
        } else {
          importedCount++
          if (importedCount % 50 === 0) {
            console.log(`📍 Imported ${importedCount} municipalities...`)
          }
        }
      }
    }
    
    // Get final count
    const { count: totalCount } = await supabase
      .from('municipalities')
      .select('*', { count: 'exact', head: true })
    
    console.log('\n🎉 Municipality data import completed!')
    console.log(`📊 Summary:`)
    console.log(`   • New municipalities imported: ${importedCount}`)
    console.log(`   • Existing municipalities updated: ${updatedCount}`)
    console.log(`   • Total municipalities in database: ${totalCount}`)
    
    // Create a view for easy access to municipality display data
    console.log('\n🔧 Creating helpful views...')
    
    const viewSQL = `
      -- Drop existing view if it exists
      DROP VIEW IF EXISTS municipality_display_data;
      
      -- Create view with all display-ready municipality data
      CREATE VIEW municipality_display_data AS
      SELECT 
        id,
        name AS municipality_name,
        kom_id,
        lan_code,
        latitude,
        longitude,
        geometry,
        created_at,
        updated_at,
        -- Add county name mapping
        CASE lan_code
          WHEN '01' THEN 'Stockholm'
          WHEN '03' THEN 'Uppsala'
          WHEN '04' THEN 'Södermanland'
          WHEN '05' THEN 'Östergötland'
          WHEN '06' THEN 'Jönköping'
          WHEN '07' THEN 'Kronoberg'
          WHEN '08' THEN 'Kalmar'
          WHEN '09' THEN 'Gotland'
          WHEN '10' THEN 'Blekinge'
          WHEN '12' THEN 'Skåne'
          WHEN '13' THEN 'Halland'
          WHEN '14' THEN 'Västra Götaland'
          WHEN '17' THEN 'Värmland'
          WHEN '18' THEN 'Örebro'
          WHEN '19' THEN 'Västmanland'
          WHEN '20' THEN 'Dalarna'
          WHEN '21' THEN 'Gävleborg'
          WHEN '22' THEN 'Västernorrland'
          WHEN '23' THEN 'Jämtland'
          WHEN '24' THEN 'Västerbotten'
          WHEN '25' THEN 'Norrbotten'
          ELSE 'Unknown'
        END AS county_name
      FROM municipalities
      ORDER BY name;
      
      -- Create view for project count by municipality (for map visualization)
      DROP VIEW IF EXISTS municipality_project_counts;
      
      CREATE VIEW municipality_project_counts AS
      SELECT 
        m.id,
        m.name,
        m.kom_id,
        m.latitude,
        m.longitude,
        m.geometry,
        COUNT(pm.project_id) as project_count
      FROM municipalities m
      LEFT JOIN project_municipalities pm ON m.id = pm.municipality_id
      GROUP BY m.id, m.name, m.kom_id, m.latitude, m.longitude, m.geometry
      ORDER BY project_count DESC, m.name;
    `
    
    const { error: viewError } = await supabase.rpc('exec_sql', { sql: viewSQL })
    if (viewError) {
      console.error('View creation error:', viewError)
    } else {
      console.log('✅ Created municipality_display_data and municipality_project_counts views')
    }
    
    console.log('\n🚀 Municipality data is now ready for filtering and display!')
    console.log('💡 You can now use this data for:')
    console.log('   • Map visualization with exact coordinates')
    console.log('   • Filtering by county (län)')
    console.log('   • Geographic search and analysis')
    console.log('   • Rich municipality metadata display')
    
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  }
}

// Helper function to execute raw SQL (if needed)
async function createExecSqlFunction() {
  const { error } = await supabase.rpc('exec_sql', { 
    sql: `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;
    `
  })
  
  if (error && !error.message.includes('already exists')) {
    console.log('Note: Could not create exec_sql function. Manual schema updates may be needed.')
  }
}

// Run the import
await createExecSqlFunction()
await importMunicipalityData() 
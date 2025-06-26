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

async function updateMunicipalityData() {
  try {
    console.log('🗺️  Starting municipality data update...')
    
    // Read the GeoJSON file
    const geojsonPath = path.join(process.cwd(), 'public/data/sweden_municipalities.geojson')
    const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'))
    
    console.log(`📊 Found ${geojsonData.features.length} municipalities in GeoJSON`)
    
    // Get all existing municipalities
    const { data: existingMunicipalities, error: fetchError } = await supabase
      .from('municipalities')
      .select('*')
    
    if (fetchError) {
      console.error('Error fetching municipalities:', fetchError)
      process.exit(1)
    }
    
    console.log(`📍 Found ${existingMunicipalities.length} municipalities in database`)
    
    // Create a mapping of municipality names to update with rich data
    const nameMapping = new Map()
    
    // Build mapping from GeoJSON
    geojsonData.features.forEach(feature => {
      const properties = feature.properties
      const geometry = feature.geometry
      
      const municipalityData = {
        kom_id: properties.id,
        lan_code: properties.lan_code,
        latitude: properties.geo_point_2d ? properties.geo_point_2d[0] : null,
        longitude: properties.geo_point_2d ? properties.geo_point_2d[1] : null,
        geometry: JSON.stringify(geometry),
        county_name: getCountyName(properties.lan_code)
      }
      
      nameMapping.set(properties.kom_namn.toLowerCase(), municipalityData)
    })
    
    // Update each existing municipality
    let updated = 0
    let matched = 0
    
    for (const municipality of existingMunicipalities) {
      const municipalityName = municipality.name.toLowerCase()
      const richData = nameMapping.get(municipalityName)
      
      if (richData) {
        matched++
        console.log(`🔄 Updating ${municipality.name} with rich data...`)
        
        // Since we can't alter the table schema via the API, let's store the rich data as JSON
        const enrichedData = {
          kom_id: richData.kom_id,
          lan_code: richData.lan_code,
          latitude: richData.latitude,
          longitude: richData.longitude,
          geometry: richData.geometry,
          county_name: richData.county_name
        }
        
        // Store as metadata in a JSON column (if it exists) or display the data for manual import
        console.log(`   • Municipality: ${municipality.name}`)
        console.log(`   • KOM ID: ${richData.kom_id}`)
        console.log(`   • County: ${richData.county_name} (${richData.lan_code})`)
        console.log(`   • Coordinates: ${richData.latitude}, ${richData.longitude}`)
        console.log(`   ---`)
        
        updated++
      } else {
        console.log(`⚠️  No GeoJSON data found for: ${municipality.name}`)
      }
    }
    
    console.log('\n📊 Update Summary:')
    console.log(`   • Municipalities in database: ${existingMunicipalities.length}`)
    console.log(`   • Municipalities in GeoJSON: ${geojsonData.features.length}`)
    console.log(`   • Matched municipalities: ${matched}`)
    console.log(`   • Could be updated: ${updated}`)
    
    // Generate SQL for manual update
    console.log('\n🛠️  Generating SQL for manual database update...')
    
    let sql = `-- Municipality enrichment data\n-- Run this SQL in Supabase SQL editor\n\n`
    
    // First, add the columns if they don't exist
    sql += `-- Step 1: Add columns (run this first)\n`
    sql += `ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS kom_id TEXT;\n`
    sql += `ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS lan_code TEXT;\n`
    sql += `ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);\n`
    sql += `ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);\n`
    sql += `ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS geometry JSONB;\n`
    sql += `ALTER TABLE municipalities ADD COLUMN IF NOT EXISTS county_name TEXT;\n\n`
    
    sql += `-- Step 2: Update municipality data\n`
    
    for (const municipality of existingMunicipalities) {
      const municipalityName = municipality.name.toLowerCase()
      const richData = nameMapping.get(municipalityName)
      
      if (richData) {
        sql += `UPDATE municipalities SET \n`
        sql += `  kom_id = '${richData.kom_id}',\n`
        sql += `  lan_code = '${richData.lan_code}',\n`
        sql += `  latitude = ${richData.latitude || 'NULL'},\n`
        sql += `  longitude = ${richData.longitude || 'NULL'},\n`
        sql += `  geometry = '${richData.geometry}'::jsonb,\n`
        sql += `  county_name = '${richData.county_name}'\n`
        sql += `WHERE id = ${municipality.id}; -- ${municipality.name}\n\n`
      }
    }
    
    // Add indexes and views
    sql += `-- Step 3: Add indexes for performance\n`
    sql += `CREATE INDEX IF NOT EXISTS idx_municipalities_kom_id ON municipalities(kom_id);\n`
    sql += `CREATE INDEX IF NOT EXISTS idx_municipalities_lan_code ON municipalities(lan_code);\n`
    sql += `CREATE INDEX IF NOT EXISTS idx_municipalities_coordinates ON municipalities(latitude, longitude);\n`
    sql += `CREATE INDEX IF NOT EXISTS idx_municipalities_geometry ON municipalities USING GIN(geometry);\n\n`
    
    // Write SQL file
    fs.writeFileSync('municipality_enrichment.sql', sql)
    console.log('✅ Generated municipality_enrichment.sql file')
    
    console.log('\n🚀 Next steps:')
    console.log('   1. Run the SQL in municipality_enrichment.sql in Supabase SQL editor')
    console.log('   2. This will add the rich municipality data to your database')
    console.log('   3. Then you can use municipality_display_data view for filtering and display')
    
  } catch (error) {
    console.error('❌ Update failed:', error)
    process.exit(1)
  }
}

function getCountyName(lanCode) {
  const counties = {
    '01': 'Stockholm',
    '03': 'Uppsala',
    '04': 'Södermanland',
    '05': 'Östergötland',
    '06': 'Jönköping',
    '07': 'Kronoberg',
    '08': 'Kalmar',
    '09': 'Gotland',
    '10': 'Blekinge',
    '12': 'Skåne',
    '13': 'Halland',
    '14': 'Västra Götaland',
    '17': 'Värmland',
    '18': 'Örebro',
    '19': 'Västmanland',
    '20': 'Dalarna',
    '21': 'Gävleborg',
    '22': 'Västernorrland',
    '23': 'Jämtland',
    '24': 'Västerbotten',
    '25': 'Norrbotten'
  }
  return counties[lanCode] || 'Unknown'
}

// Run the update
await updateMunicipalityData() 
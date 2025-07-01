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

async function seedBasicData() {
  try {
    console.log('🌱 Seeding basic data for map functionality...')
    
    // 1. Populate municipalities from GeoJSON
    console.log('\n📍 Populating municipalities from GeoJSON...')
    const geojsonPath = path.join(process.cwd(), 'public/data/sweden_municipalities.geojson')
    const geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'))
    
    const municipalities = geojsonData.features.map(feature => ({
      name: feature.properties.kom_namn,
      county: feature.properties.lan_code ? `County ${feature.properties.lan_code}` : null,
      region: null // We can populate this later if needed
    })).filter(m => m.name) // Filter out any without names
    
    // Insert municipalities (ignore duplicates)
    const { data: insertedMunis, error: muniError } = await supabase
      .from('municipalities')
      .upsert(municipalities, { onConflict: 'name', ignoreDuplicates: true })
      .select()
    
    if (muniError) {
      console.error('Error inserting municipalities:', muniError)
    } else {
      console.log(`Inserted/updated ${municipalities.length} municipalities`)
    }
    
    // 2. Populate areas if they don't exist
    console.log('\nPopulating areas...')
    const areas = [
      'Administration och personal',
      'Kultur och fritid', 
      'Ledning och styrning',
      'Medborgarservice och kommunikation',
      'Miljö och hållbarhet',
      'Samhällsbyggnad och stadsbyggnad',
      'Socialtjänst och hälsa/vård och omsorg',
      'Säkerhet och krisberedskap',
      'Utbildning och skola',
      'Övrigt/oklart'
    ].map(name => ({ name }))
    
    const { error: areasError } = await supabase
      .from('areas')
      .upsert(areas, { onConflict: 'name', ignoreDuplicates: true })
    
    if (areasError) {
      console.error('Error inserting areas:', areasError)
    } else {
      console.log(`Ensured ${areas.length} areas exist`)
    }
    
    // 3. Populate value dimensions
    console.log('\n💎 Populating value dimensions...')
    const valueDimensions = [
      'Effektivisering',
      'Kvalitet',
      'Innovation', 
      'Medborgarnytta',
      'Annat'
    ].map(name => ({ name }))
    
    const { error: valueError } = await supabase
      .from('value_dimensions')
      .upsert(valueDimensions, { onConflict: 'name', ignoreDuplicates: true })
    
    if (valueError) {
      console.error('Error inserting value dimensions:', valueError)
    } else {
      console.log(`Ensured ${valueDimensions.length} value dimensions exist`)
    }
    
    // 4. Verify data
    console.log('\nVerifying seeded data...')
    
    const { data: muniCount, error: countError } = await supabase
      .from('municipalities')
      .select('id', { count: 'exact', head: true })
    
    if (!countError) {
      console.log(`Municipalities in database: ${muniCount}`)
    }
    
    // 5. Create a test project to verify functionality
    console.log('\n🧪 Creating test project...')
    
    // Get first municipality for test
    const { data: firstMuni } = await supabase
      .from('municipalities')
      .select('id, name')
      .limit(1)
      .single()
    
    if (firstMuni) {
      const testProject = {
        title: 'Test AI Project',
        intro: 'Detta är ett testprojekt för att verifiera att kartan fungerar',
        phase: 'idea',
        areas: ['Utbildning och skola'],
        value_dimensions: ['Innovation'],
        cost_data: {
          budgetDetails: {
            budgetAmount: 500000
          },
          actualCostDetails: {
            costEntries: [{
              costType: 'Intern personal (debiterbar tid)',
              costLabel: 'Projektledare',
              costHours: 100,
              costRate: 800,
              costFixed: 0
            }]
          }
        },
        effects_data: {
          effectDetails: [{
            hasQuantitative: true,
            impactMeasurement: {
              measurements: [{
                measurementName: 'Förbättrad användarupplevelse',
                affectedGroups: ['Medborgare'],
                effectChangeType: 'increase',
                monetaryEstimate: 1000000
              }]
            }
          }]
        },
        technical_data: {
          system_name: 'ChatGPT Integration',
          ai_methodology: 'Natural Language Processing',
          deployment_environment: 'Molnbaserad (t.ex. Azure, GCP)'
        }
      }
      
      const { data: project, error: projError } = await supabase
        .from('projects')
        .insert([testProject])
        .select()
        .single()
      
      if (projError) {
        console.error('Error creating test project:', projError)
      } else {
        // Link project to municipality
        const { error: linkError } = await supabase
          .from('project_municipalities')
          .insert([{
            project_id: project.id,
            municipality_id: firstMuni.id
          }])
        
        if (linkError) {
          console.error('Error linking project to municipality:', linkError)
        } else {
          console.log(`Created test project "${testProject.title}" in ${firstMuni.name}`)
        }
      }
    }
    
    console.log('\nBasic data seeding complete!')
console.log('Map should now work at /map')
console.log('Analytics should work at /analytics')
console.log('You can add new projects at /projects/new')
    
  } catch (error) {
    console.error('Error during seeding:', error)
  }
}

seedBasicData() 
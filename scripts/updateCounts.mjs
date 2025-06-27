import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateCounts() {
  try {
    console.log('🔄 Updating municipality project counts...')
    
    // Get all project-municipality relationships
    const { data: relationships, error } = await supabase
      .from('project_municipalities')
      .select(`
        municipality_id,
        projects!inner(phase)
      `)
    
    if (error) {
      console.error('Error fetching relationships:', error)
      return
    }
    
    console.log(`Found ${relationships.length} project-municipality relationships`)
    
    // Group by municipality and count by phase
    const counts = {}
    relationships.forEach(rel => {
      const munId = rel.municipality_id
      const phase = rel.projects.phase
      
      if (!counts[munId]) {
        counts[munId] = { total: 0, idea: 0, pilot: 0, implemented: 0 }
      }
      
      counts[munId].total++
      counts[munId][phase]++
    })
    
    // Update municipality_project_counts table
    for (const [municipalityId, count] of Object.entries(counts)) {
      const { error: upsertError } = await supabase
        .from('municipality_project_counts')
        .upsert({
          municipality_id: parseInt(municipalityId),
          total_projects: count.total,
          idea_projects: count.idea,
          pilot_projects: count.pilot,
          implemented_projects: count.implemented
        }, {
          onConflict: 'municipality_id'
        })
      
      if (upsertError) {
        console.error(`Error updating counts for municipality ${municipalityId}:`, upsertError)
      } else {
        console.log(`✅ Updated counts for municipality ${municipalityId}: ${count.total} projects`)
      }
    }
    
    console.log('🎉 Municipality project counts updated!')
    
  } catch (error) {
    console.error('Error updating counts:', error)
  }
}

updateCounts() 
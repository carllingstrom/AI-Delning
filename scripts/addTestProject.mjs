import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function addTestProject() {
  try {
    console.log('🧪 Adding test project in implemented phase...')
    
    // Find a municipality (Stockholm)
    const { data: stockholm, error: munError } = await supabase
      .from('municipalities')
      .select('id')
      .eq('name', 'Stockholm')
      .single()
    
    if (munError || !stockholm) {
      console.error('Could not find Stockholm municipality:', munError)
      return
    }
    
    console.log(`Found Stockholm with ID: ${stockholm.id}`)
    
    // Create implemented project
    const projectData = {
      title: 'AI-baserad trafikoptimering',
      intro: 'Ett implementerat AI-projekt för att optimera trafikflöden i Stockholm',
      phase: 'implemented',
      areas: ['Samhällsbyggnad och stadsbyggnad', 'Miljö och hållbarhet'],
      value_dimensions: ['Effektivisering', 'Medborgarnytta'],
      problem: 'Trafikstockningar och ineffektiv trafikledning',
      opportunity: 'AI kan optimera trafikflöden och minska restider',
      responsible: 'Trafikkontoret Stockholm'
    }
    
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single()
    
    if (projectError) {
      console.error('Error creating project:', projectError)
      return
    }
    
    console.log(`Created project: ${project.title}`)
    
    // Link to Stockholm municipality
    const { error: linkError } = await supabase
      .from('project_municipalities')
      .insert({
        project_id: project.id,
        municipality_id: stockholm.id
      })
    
    if (linkError) {
      console.error('Error linking project to municipality:', linkError)
      return
    }
    
    console.log(`Linked project to Stockholm municipality`)
    console.log('Test project added successfully!')
    
  } catch (error) {
    console.error('Error adding test project:', error)
  }
}

addTestProject() 
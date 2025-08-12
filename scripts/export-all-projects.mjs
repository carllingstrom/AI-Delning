import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('');
  console.error('Please create a .env file in the project root with:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
  console.error('');
  console.error('Or set the environment variables directly:');
  console.error('export NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here');
  console.error('export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
  console.error('');
  console.error('You can find these values in your Supabase project dashboard.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportAllProjects() {
  try {
    console.log('📊 Starting export of all projects...');
    
    // Fetch all projects with related data
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_municipalities(
          municipalities(id, name, county)
        ),
        project_areas(
          areas(id, name)
        ),
        project_value_dimensions(
          value_dimensions(id, name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching projects:', error);
      return;
    }

    console.log(`📈 Found ${projects.length} projects`);

    // Create export directory if it doesn't exist
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Generate timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `all-projects-export-${timestamp}.json`;
    const filepath = path.join(exportDir, filename);

    // Create detailed export object
    const exportData = {
      exportDate: new Date().toISOString(),
      totalProjects: projects.length,
      projects: projects.map(project => ({
        id: project.id,
        title: project.title,
        intro: project.intro,
        problem: project.problem,
        opportunity: project.opportunity,
        responsible: project.responsible,
        phase: project.phase,
        areas: project.areas,
        value_dimensions: project.value_dimensions,
        overview_details: project.overview_details,
        cost_data: project.cost_data,
        effects_data: project.effects_data,
        technical_data: project.technical_data,
        leadership_data: project.leadership_data,
        legal_data: project.legal_data,
        created_at: project.created_at,
        updated_at: project.updated_at,
        municipalities: project.project_municipalities?.map(pm => pm.municipalities) || [],
        areas: project.project_areas?.map(pa => pa.areas) || [],
        value_dimensions: project.project_value_dimensions?.map(pvd => pvd.value_dimensions) || []
      }))
    };

    // Write to file
    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));
    
    console.log(`✅ Export completed!`);
    console.log(`📁 File saved: ${filepath}`);
    console.log(`📊 Total projects exported: ${projects.length}`);
    
    // Create summary report
    const summaryReport = createSummaryReport(projects);
    const summaryFilename = `project-summary-${timestamp}.txt`;
    const summaryFilepath = path.join(exportDir, summaryFilename);
    fs.writeFileSync(summaryFilepath, summaryReport);
    
    console.log(`📋 Summary report saved: ${summaryFilepath}`);
    
  } catch (error) {
    console.error('❌ Export failed:', error);
  }
}

function createSummaryReport(projects) {
  let report = `PROJECT DATA EXPORT SUMMARY\n`;
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `Total Projects: ${projects.length}\n\n`;
  
  // Phase breakdown
  const phaseCount = {};
  projects.forEach(p => {
    phaseCount[p.phase] = (phaseCount[p.phase] || 0) + 1;
  });
  
  report += `PHASE BREAKDOWN:\n`;
  Object.entries(phaseCount).forEach(([phase, count]) => {
    report += `  ${phase}: ${count} projects\n`;
  });
  
  // Recent projects
  const recentProjects = projects.slice(0, 10);
  report += `\nRECENT PROJECTS (last 10):\n`;
  recentProjects.forEach(p => {
    report += `  - ${p.title} (${p.phase}) - ${p.created_at.split('T')[0]}\n`;
  });
  
  // Data completeness
  let hasCostData = 0;
  let hasEffectsData = 0;
  let hasTechnicalData = 0;
  let hasLeadershipData = 0;
  let hasLegalData = 0;
  
  projects.forEach(p => {
    if (p.cost_data) hasCostData++;
    if (p.effects_data) hasEffectsData++;
    if (p.technical_data) hasTechnicalData++;
    if (p.leadership_data) hasLeadershipData++;
    if (p.legal_data) hasLegalData++;
  });
  
  report += `\nDATA COMPLETENESS:\n`;
  report += `  Cost data: ${hasCostData}/${projects.length} (${Math.round(hasCostData/projects.length*100)}%)\n`;
  report += `  Effects data: ${hasEffectsData}/${projects.length} (${Math.round(hasEffectsData/projects.length*100)}%)\n`;
  report += `  Technical data: ${hasTechnicalData}/${projects.length} (${Math.round(hasTechnicalData/projects.length*100)}%)\n`;
  report += `  Leadership data: ${hasLeadershipData}/${projects.length} (${Math.round(hasLeadershipData/projects.length*100)}%)\n`;
  report += `  Legal data: ${hasLegalData}/${projects.length} (${Math.round(hasLegalData/projects.length*100)}%)\n`;
  
  return report;
}

// Run the export
exportAllProjects(); 
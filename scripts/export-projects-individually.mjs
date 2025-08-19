#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function getSupabaseCredentials() {
  console.log('🔑 Supabase Credentials behövs för export');
  console.log('Hitta dem på: https://supabase.com/dashboard > Settings > API\n');
  
  const supabaseUrl = await askQuestion('Supabase URL (Project URL): ');
  const supabaseKey = await askQuestion('Supabase Service Role Key: ');
  
  return { supabaseUrl: supabaseUrl.trim(), supabaseKey: supabaseKey.trim() };
}

function sanitizeFilename(str) {
  // Remove or replace characters that are invalid in filenames
  return str
    .replace(/[<>:"/\\|?*]/g, '-') // Replace invalid chars with dash
    .replace(/\s+/g, '-') // Replace spaces with dash
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes
    .substring(0, 100); // Limit length
}

async function exportProjectsIndividually() {
  try {
    // Get Supabase credentials
    const { supabaseUrl, supabaseKey } = await getSupabaseCredentials();
    rl.close();

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Både URL och Service Role Key krävs');
      process.exit(1);
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('\n📊 Hämtar alla projekt från databasen...');

    // Fetch all projects with related data
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_municipalities!inner(
          municipalities(*)
        ),
        project_value_dimensions(
          value_dimensions(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Fel vid hämtning av projekt:', error);
      process.exit(1);
    }

    if (!projects || projects.length === 0) {
      console.log('⚠️ Inga projekt hittades i databasen');
      process.exit(0);
    }

    console.log(`✅ Hittade ${projects.length} projekt`);

    // Create exports directory
    const timestamp = new Date().toISOString().split('T')[0];
    const exportDir = path.join(rootDir, 'exports', `individual-projects-${timestamp}`);
    
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    console.log(`📁 Skapar individuella filer i: ${exportDir}`);

    let successCount = 0;
    const manifest = [];

    // Export each project individually
    for (const project of projects) {
      try {
        // Create a clean filename
        const filename = sanitizeFilename(project.title || `project-${project.id}`) + '.json';
        const filepath = path.join(exportDir, filename);

        // Prepare project data with metadata
        const projectExport = {
          exportMetadata: {
            exportedAt: new Date().toISOString(),
            projectId: project.id,
            originalTitle: project.title
          },
          project: project
        };

        // Write the file
        fs.writeFileSync(filepath, JSON.stringify(projectExport, null, 2), 'utf8');
        
        manifest.push({
          id: project.id,
          title: project.title,
          filename: filename,
          phase: project.phase,
          createdAt: project.created_at,
          organization: project.project_municipalities?.[0]?.municipalities?.name || 'Okänd'
        });

        successCount++;
        console.log(`✅ ${successCount}/${projects.length} - ${filename}`);

      } catch (fileError) {
        console.error(`❌ Fel vid export av projekt ${project.id}:`, fileError.message);
      }
    }

    // Create manifest file
    const manifestPath = path.join(exportDir, '_manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify({
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        totalProjects: projects.length,
        successfulExports: successCount,
        exportDirectory: exportDir
      },
      projects: manifest
    }, null, 2), 'utf8');

    // Create summary report
    const summaryPath = path.join(exportDir, '_summary.txt');
    const summary = `
PROJEKT EXPORT SAMMANFATTNING
============================

Export datum: ${new Date().toLocaleString('sv-SE')}
Totalt antal projekt: ${projects.length}
Framgångsrika exporter: ${successCount}
Misslyckade exporter: ${projects.length - successCount}

FÖRDELNING PER FAS:
${Object.entries(
  manifest.reduce((acc, p) => {
    acc[p.phase || 'okänd'] = (acc[p.phase || 'okänd'] || 0) + 1;
    return acc;
  }, {})
).map(([phase, count]) => `- ${phase}: ${count} projekt`).join('\n')}

FÖRDELNING PER ORGANISATION:
${Object.entries(
  manifest.reduce((acc, p) => {
    acc[p.organization] = (acc[p.organization] || 0) + 1;
    return acc;
  }, {})
).map(([org, count]) => `- ${org}: ${count} projekt`).join('\n')}

SENASTE 10 PROJEKTEN:
${manifest.slice(0, 10).map((p, i) => 
  `${i + 1}. ${p.title} (${p.phase}) - ${p.filename}`
).join('\n')}

ALLA FILER:
${manifest.map(p => `- ${p.filename} (${p.title})`).join('\n')}

Manifest-fil: _manifest.json
Denna sammanfattning: _summary.txt
    `.trim();

    fs.writeFileSync(summaryPath, summary, 'utf8');

    console.log('\n🎉 Export klar!');
    console.log(`📁 Katalog: ${exportDir}`);
    console.log(`📋 Manifest: _manifest.json`);
    console.log(`📄 Sammanfattning: _summary.txt`);
    console.log(`✅ ${successCount} projekt exporterade individuellt`);

  } catch (error) {
    console.error('❌ Fel under export:', error);
    process.exit(1);
  }
}

// Run the export
exportProjectsIndividually().catch(console.error);
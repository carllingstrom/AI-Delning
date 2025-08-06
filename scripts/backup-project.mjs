import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backupProject(projectId) {
  try {
    console.log(`🔄 Creating backup for project: ${projectId}`);
    
    // Fetch current project data
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_municipalities(
          municipalities(
            id,
            name,
            county
          )
        ),
        project_areas(
          areas(
            id,
            name
          )
        ),
        project_value_dimensions(
          value_dimensions(
            id,
            name
          )
        )
      `)
      .eq('id', projectId)
      .single();

    if (error || !project) {
      console.error('Error fetching project:', error);
      return;
    }

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    
    // Ensure backup directory exists
    try {
      await fs.mkdir(backupDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    const backupFile = path.join(backupDir, `project-${projectId}-${timestamp}.json`);
    
    // Write backup to file
    await fs.writeFile(backupFile, JSON.stringify(project, null, 2));
    
    console.log(`✅ Backup created: ${backupFile}`);
    return backupFile;
    
  } catch (error) {
    console.error('Error creating backup:', error);
  }
}

// If run directly, backup a specific project
if (process.argv[2]) {
  backupProject(process.argv[2]);
} else {
  console.log('Usage: node backup-project.mjs <project-id>');
  console.log('Example: node backup-project.mjs f4cfb903-3cd7-4ee4-805c-b12099d2f0bd');
}

export { backupProject }; 
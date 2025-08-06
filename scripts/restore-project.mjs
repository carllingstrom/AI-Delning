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

async function restoreProject(projectId, backupFile) {
  try {
    console.log(`🔄 Restoring project: ${projectId} from backup: ${backupFile}`);
    
    // Read backup file
    const backupData = JSON.parse(await fs.readFile(backupFile, 'utf8'));
    
    // Extract the main project data (excluding relationships)
    const {
      project_municipalities,
      project_areas,
      project_value_dimensions,
      ...projectData
    } = backupData;
    
    // Update the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', projectId)
      .select()
      .single();

    if (projectError) {
      console.error('Error updating project:', projectError);
      return;
    }

    console.log(`✅ Project restored successfully!`);
    
    // Optionally restore relationships if they exist in backup
    if (project_municipalities && project_municipalities.length > 0) {
      console.log('🔄 Restoring municipality relationships...');
      
      // Delete existing relationships
      await supabase
        .from('project_municipalities')
        .delete()
        .eq('project_id', projectId);
      
      // Insert backup relationships
      const municipalityRows = project_municipalities.map((pm: any) => ({
        project_id: projectId,
        municipality_id: pm.municipalities.id,
      }));
      
      const { error: munError } = await supabase
        .from('project_municipalities')
        .insert(municipalityRows);
      
      if (munError) {
        console.error('Error restoring municipality relationships:', munError);
      } else {
        console.log('✅ Municipality relationships restored');
      }
    }
    
    if (project_areas && project_areas.length > 0) {
      console.log('🔄 Restoring area relationships...');
      
      // Delete existing relationships
      await supabase
        .from('project_areas')
        .delete()
        .eq('project_id', projectId);
      
      // Insert backup relationships
      const areaRows = project_areas.map((pa: any) => ({
        project_id: projectId,
        area_id: pa.areas.id,
      }));
      
      const { error: areaError } = await supabase
        .from('project_areas')
        .insert(areaRows);
      
      if (areaError) {
        console.error('Error restoring area relationships:', areaError);
      } else {
        console.log('✅ Area relationships restored');
      }
    }
    
    if (project_value_dimensions && project_value_dimensions.length > 0) {
      console.log('🔄 Restoring value dimension relationships...');
      
      // Delete existing relationships
      await supabase
        .from('project_value_dimensions')
        .delete()
        .eq('project_id', projectId);
      
      // Insert backup relationships
      const valueDimensionRows = project_value_dimensions.map((pvd: any) => ({
        project_id: projectId,
        value_dimension_id: pvd.value_dimensions.id,
      }));
      
      const { error: vdError } = await supabase
        .from('project_value_dimensions')
        .insert(valueDimensionRows);
      
      if (vdError) {
        console.error('Error restoring value dimension relationships:', vdError);
      } else {
        console.log('✅ Value dimension relationships restored');
      }
    }
    
    console.log('🎉 Project restoration completed!');
    
  } catch (error) {
    console.error('Error restoring project:', error);
  }
}

// If run directly, restore a specific project
if (process.argv[2] && process.argv[3]) {
  restoreProject(process.argv[2], process.argv[3]);
} else {
  console.log('Usage: node restore-project.mjs <project-id> <backup-file>');
  console.log('Example: node restore-project.mjs f4cfb903-3cd7-4ee4-805c-b12099d2f0bd backups/project-f4cfb903-3cd7-4ee4-805c-b12099d2f0bd-2025-01-27T12-00-00-000Z.json');
}

export { restoreProject }; 
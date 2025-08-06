import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function examineEffectsData() {
  console.log('🔍 Examining Effects Data Structure...\n');

  // Get all projects with effects data
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, title, effects_data')
    .not('effects_data', 'is', null);

  if (error) {
    console.error('Error fetching projects:', error);
    return;
  }

  console.log(`✅ Found ${projects.length} projects with effects data\n`);

  // Examine each project's effects data
  projects.forEach((project, index) => {
    console.log(`📋 Project ${index + 1}: ${project.title}`);
    console.log('=' .repeat(60));

    const effectsData = project.effects_data;
    
    console.log(`📈 Effect Details (${effectsData.effectDetails.length} effects):`);
    
    effectsData.effectDetails.forEach((effect, effectIndex) => {
      console.log(`\n  Effect ${effectIndex + 1}:`);
      console.log(`    hasQuantitative: ${effect.hasQuantitative}`);
      console.log(`    hasQualitative: ${effect.hasQualitative}`);
      
      if (effect.hasQuantitative && effect.quantitativeDetails) {
        console.log(`    📊 Quantitative Details:`);
        console.log(`      effectType: ${effect.quantitativeDetails.effectType}`);
        
        if (effect.quantitativeDetails.effectType === 'financial') {
          console.log(`      💰 Financial Details:`);
          console.log(`        measurementName: ${effect.quantitativeDetails.financialDetails?.measurementName}`);
          console.log(`        valueUnit: ${effect.quantitativeDetails.financialDetails?.valueUnit}`);
        } else if (effect.quantitativeDetails.effectType === 'redistribution') {
          console.log(`      🔄 Redistribution Details:`);
          console.log(`        resourceType: ${effect.quantitativeDetails.redistributionDetails?.resourceType}`);
          console.log(`        valueUnit: ${effect.quantitativeDetails.redistributionDetails?.valueUnit}`);
        }
      }
      
      if (effect.hasQualitative && effect.qualitativeDetails) {
        console.log(`    📝 Qualitative Details:`);
        console.log(`      factor: ${effect.qualitativeDetails.factor}`);
        console.log(`      currentRating: ${effect.qualitativeDetails.currentRating}`);
        console.log(`      targetRating: ${effect.qualitativeDetails.targetRating}`);
        console.log(`      monetaryEstimate: ${effect.qualitativeDetails.monetaryEstimate}`);
      }
    });
    
    console.log('\n');
  });

}

examineEffectsData(); 
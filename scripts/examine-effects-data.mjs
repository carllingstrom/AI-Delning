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

  try {
    // Get a project with effects data
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        effects_data
      `)
      .not('effects_data', 'is', null)
      .limit(3);

    if (error) {
      console.error('❌ Error fetching projects:', error);
      return;
    }

    console.log(`✅ Found ${projects.length} projects with effects data\n`);

    projects.forEach((project, index) => {
      console.log(`📋 Project ${index + 1}: ${project.title}`);
      console.log('=' .repeat(60));
      
      const effectsData = project.effects_data;
      console.log('📊 Raw effects_data structure:');
      console.log(JSON.stringify(effectsData, null, 2));
      
      if (effectsData?.effectDetails) {
        console.log(`\n📈 Effect Details (${effectsData.effectDetails.length} effects):`);
        effectsData.effectDetails.forEach((effect, effectIndex) => {
          console.log(`\n  Effect ${effectIndex + 1}:`);
          console.log(`    hasQuantitative: ${effect.hasQuantitative}`);
          console.log(`    hasQualitative: ${effect.hasQualitative}`);
          
          if (effect.quantitativeDetails) {
            console.log(`    📊 Quantitative Details:`);
            console.log(`      effectType: ${effect.quantitativeDetails.effectType}`);
            
            if (effect.quantitativeDetails.financialDetails) {
              console.log(`      💰 Financial Details:`);
              console.log(JSON.stringify(effect.quantitativeDetails.financialDetails, null, 6));
            }
            
            if (effect.quantitativeDetails.redistributionDetails) {
              console.log(`      🔄 Redistribution Details:`);
              console.log(JSON.stringify(effect.quantitativeDetails.redistributionDetails, null, 6));
            }
          }
          
          if (effect.qualitativeDetails) {
            console.log(`    📝 Qualitative Details:`);
            console.log(JSON.stringify(effect.qualitativeDetails, null, 6));
          }
        });
      }
      
      console.log('\n' + '=' .repeat(60) + '\n');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

examineEffectsData(); 
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { config } from 'dotenv';

// Load .env.local instead of .env
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyData() {
  console.log('Verifying data in database...\n');

  // 1. Check municipalities table
  console.log('Checking municipalities table:');
  const { data: municipalities, error: mError } = await supabase
    .from('municipalities')
    .select('*')
    .limit(5);
  
  if (mError) {
    console.error('Error fetching municipalities:', mError);
  } else {
    console.log('Sample municipalities:', municipalities);
  }

  // 2. Check project counts table
  console.log('\nChecking project counts table:');
  const { data: projectCounts, error: pError } = await supabase
    .from('municipality_project_counts')
    .select('*')
    .order('total_projects', { ascending: false })
    .limit(5);
  
  if (pError) {
    console.error('Error fetching project counts:', pError);
  } else {
    console.log('Top 5 municipalities by project count:', projectCounts);
  }

  // 3. Check specific municipalities
  console.log('\nChecking specific municipalities:');
  const { data: specificCounts, error: sError } = await supabase
    .from('municipality_project_counts')
    .select('*')
    .in('municipality_id', [1, 2]); // Using municipality IDs instead of names
  
  if (sError) {
    console.error('Error fetching specific counts:', sError);
  } else {
    console.log('Stockholm and Göteborg counts:', specificCounts);
  }

  // 4. Check total counts
  console.log('\nChecking total counts:');
  const { count: totalCount, error: cError } = await supabase
    .from('municipality_project_counts')
    .select('*', { count: 'exact', head: true });
  
  if (cError) {
    console.error('Error counting records:', cError);
  } else {
    console.log('Total number of records:', totalCount);
  }
}

async function verifyProjectData() {
  try {
    console.log('Verifying project data structure...');
    
    // Get a sample project with all data
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_municipalities(municipality_id, municipalities(name, county)),
        project_areas(area_id, areas(name)),
        project_value_dimensions(value_dimension_id, value_dimensions(name))
      `)
      .limit(5);

    if (error) {
      console.error('Error fetching projects:', error);
      return;
    }

    console.log(`\nFound ${projects.length} projects to analyze`);
    
    if (projects.length === 0) {
      console.log('No projects found. Add some projects first to see analytics.');
      return;
    }

    // Analyze one project in detail
    const sampleProject = projects[0];
    console.log(`\n🔬 Analyzing sample project: "${sampleProject.title}"`);
    console.log('   Phase:', sampleProject.phase);
    console.log('   Created:', sampleProject.created_at);
    
    // Check cost data
    const costData = sampleProject.cost_data || {};
    console.log('\nCost Data Structure:');
    if (costData.budgetDetails?.budgetAmount) {
      console.log('   Budget:', costData.budgetDetails.budgetAmount, 'SEK');
    } else {
      console.log('   No budget amount found');
    }
    
    const costEntries = costData.actualCostDetails?.costEntries || [];
    console.log('   Cost entries:', costEntries.length);
    if (costEntries.length > 0) {
      const totalCost = costEntries.reduce((total, entry) => {
        const hourCost = (entry.costHours || 0) * (entry.costRate || 0);
        const fixedCost = entry.costFixed || 0;
        return total + hourCost + fixedCost;
      }, 0);
      console.log('   Total actual cost:', totalCost, 'SEK');
    }

    // Check effects data
    const effectsData = sampleProject.effects_data || {};
    console.log('\nEffects Data Structure:');
    const effectDetails = effectsData.effectDetails || [];
    console.log('   Effect details:', effectDetails.length);
    
    let totalMonetaryValue = 0;
    let totalMeasurements = 0;
    effectDetails.forEach((effect, i) => {
      const measurements = effect.impactMeasurement?.measurements || [];
      totalMeasurements += measurements.length;
      console.log(`   Effect ${i + 1}: ${measurements.length} measurements`);
      
      measurements.forEach(measurement => {
        if (measurement.monetaryEstimate) {
          totalMonetaryValue += parseFloat(measurement.monetaryEstimate);
        }
      });
    });
    
    if (totalMonetaryValue > 0) {
      console.log('   Total monetary value:', totalMonetaryValue, 'SEK');
    }

    // Check technical data
    const techData = sampleProject.technical_data || {};
    console.log('\nTechnical Data Structure:');
    if (techData.system_name) {
      console.log('   System:', techData.system_name);
    }
    if (techData.ai_methodology) {
      console.log('   AI Method:', techData.ai_methodology);
    }
    if (techData.deployment_environment) {
      console.log('   Environment:', techData.deployment_environment);
    }
    if (techData.data_types) {
      console.log('   Data types:', techData.data_types.join(', '));
    }

    // Test analytics calculations
    console.log('\n🧮 Testing Analytics Calculations...');
    
    // Calculate ROI for this project
    const actualCost = costEntries.reduce((total, entry) => {
      const hourCost = (entry.costHours || 0) * (entry.costRate || 0);
      const fixedCost = entry.costFixed || 0;
      return total + hourCost + fixedCost;
    }, 0);
    
    if (actualCost > 0 && totalMonetaryValue > 0) {
      const roi = ((totalMonetaryValue - actualCost) / actualCost) * 100;
      console.log('   ROI calculation:', roi.toFixed(1) + '%');
    } else {
      console.log('   Cannot calculate ROI (missing cost or value data)');
    }

    // Show affected groups
    const affectedGroups = new Set();
    effectDetails.forEach(effect => {
      const measurements = effect.impactMeasurement?.measurements || [];
      measurements.forEach(measurement => {
        if (measurement.affectedGroups) {
          measurement.affectedGroups.forEach(group => affectedGroups.add(group));
        }
      });
    });
    
    if (affectedGroups.size > 0) {
      console.log('   Affected groups:', Array.from(affectedGroups).join(', '));
    }

    // Summary across all projects
    console.log('\nSummary Across All Projects:');
    const phases = projects.reduce((acc, p) => {
      acc[p.phase] = (acc[p.phase] || 0) + 1;
      return acc;
    }, {});
    console.log('   Phases:', Object.entries(phases).map(([k, v]) => `${k}: ${v}`).join(', '));

    const totalBudgets = projects.reduce((total, p) => {
      const budget = p.cost_data?.budgetDetails?.budgetAmount || 0;
      return total + budget;
    }, 0);
    console.log('   Total budgets:', totalBudgets, 'SEK');

    console.log('\nData verification complete! Analytics should work with this data.');
console.log('Visit /analytics to see the dashboard in action.');
    
  } catch (error) {
    console.error('Error during verification:', error);
  }
}

verifyData().catch(console.error);
verifyProjectData(); 
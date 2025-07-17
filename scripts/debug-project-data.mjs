#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function deepAnalyzeObject(obj, path = '') {
  const analysis = {
    type: typeof obj,
    isNull: obj === null,
    isUndefined: obj === undefined,
    isArray: Array.isArray(obj),
    isObject: obj !== null && typeof obj === 'object' && !Array.isArray(obj),
    length: Array.isArray(obj) ? obj.length : null,
    keys: obj !== null && typeof obj === 'object' ? Object.keys(obj) : null,
    hasValue: obj !== null && obj !== undefined && obj !== '',
    sampleValue: null
  };

  if (analysis.hasValue && typeof obj === 'string' && obj.length > 0) {
    analysis.sampleValue = obj.substring(0, 100) + (obj.length > 100 ? '...' : '');
  } else if (analysis.hasValue && typeof obj === 'number') {
    analysis.sampleValue = obj;
  } else if (analysis.hasValue && typeof obj === 'boolean') {
    analysis.sampleValue = obj;
  }

  return analysis;
}

function analyzeProjectData(project) {
  console.log(`\n🔍 DETAILED ANALYSIS: ${project.title}`);
  console.log('='.repeat(80));

  // Basic project info
  console.log('\n📋 BASIC INFO:');
  console.log(`  ID: ${project.id}`);
  console.log(`  Title: ${project.title || '❌ Missing'}`);
  console.log(`  Intro: ${project.intro ? `✅ (${project.intro.length} chars)` : '❌ Missing'}`);
  console.log(`  Problem: ${project.problem ? `✅ (${project.problem.length} chars)` : '❌ Missing'}`);
  console.log(`  Opportunity: ${project.opportunity ? `✅ (${project.opportunity.length} chars)` : '❌ Missing'}`);
  console.log(`  Responsible: ${project.responsible || '❌ Missing'}`);
  console.log(`  Phase: ${project.phase || '❌ Missing'}`);

  // Related data
  console.log('\n🔗 RELATED DATA:');
  const municipalities = project.project_municipalities?.map(pm => pm.municipalities?.name).filter(Boolean) || [];
  console.log(`  Municipalities: ${municipalities.length > 0 ? municipalities.join(', ') : '❌ None'}`);
  
  const areas = project.project_areas?.map(pa => pa.areas?.name).filter(Boolean) || [];
  console.log(`  Areas: ${areas.length > 0 ? areas.join(', ') : '❌ None'}`);
  
  const valueDimensions = project.project_value_dimensions?.map(pvd => pvd.value_dimensions?.name).filter(Boolean) || [];
  console.log(`  Value Dimensions: ${valueDimensions.length > 0 ? valueDimensions.join(', ') : '❌ None'}`);

  // Cost Data Analysis
  console.log('\n💰 COST DATA ANALYSIS:');
  const costData = project.cost_data;
  if (costData) {
    console.log('  ✅ Cost data object exists');
    
    // Budget details
    if (costData.budgetDetails) {
      console.log('    📊 Budget Details:');
      console.log(`      Total Budget: ${costData.budgetDetails.totalBudget || '❌ Missing'}`);
      console.log(`      Currency: ${costData.budgetDetails.currency || '❌ Missing'}`);
      console.log(`      Budget Period: ${costData.budgetDetails.budgetPeriod || '❌ Missing'}`);
    } else {
      console.log('    ❌ No budgetDetails found');
    }

    // Actual cost details
    if (costData.actualCostDetails) {
      console.log('    📊 Actual Cost Details:');
      const costEntries = costData.actualCostDetails.costEntries || [];
      console.log(`      Cost Entries: ${costEntries.length}`);
      
      costEntries.forEach((entry, index) => {
        console.log(`        Entry ${index + 1}:`);
        console.log(`          Cost Unit: ${entry.costUnit || '❌ Missing'}`);
        console.log(`          Description: ${entry.description || '❌ Missing'}`);
        
        if (entry.costUnit === 'hours' && entry.hoursDetails) {
          console.log(`          Hours: ${entry.hoursDetails.hours || '❌ Missing'}`);
          console.log(`          Hourly Rate: ${entry.hoursDetails.hourlyRate || '❌ Missing'}`);
        } else if (entry.costUnit === 'fixed' && entry.fixedDetails) {
          console.log(`          Fixed Amount: ${entry.fixedDetails.fixedAmount || '❌ Missing'}`);
        } else if (entry.costUnit === 'monthly' && entry.monthlyDetails) {
          console.log(`          Monthly Amount: ${entry.monthlyDetails.monthlyAmount || '❌ Missing'}`);
          console.log(`          Duration: ${entry.monthlyDetails.monthlyDuration || '❌ Missing'}`);
        } else if (entry.costUnit === 'yearly' && entry.yearlyDetails) {
          console.log(`          Yearly Amount: ${entry.yearlyDetails.yearlyAmount || '❌ Missing'}`);
          console.log(`          Duration: ${entry.yearlyDetails.yearlyDuration || '❌ Missing'}`);
        }
      });
    } else {
      console.log('    ❌ No actualCostDetails found');
    }
  } else {
    console.log('  ❌ No cost_data found');
  }

  // Effects Data Analysis
  console.log('\n📈 EFFECTS DATA ANALYSIS:');
  const effectsData = project.effects_data;
  if (effectsData) {
    console.log('  ✅ Effects data object exists');
    
    const effectDetails = effectsData.effectDetails || [];
    console.log(`  📊 Effect Details: ${effectDetails.length} effects`);
    
    effectDetails.forEach((effect, index) => {
      console.log(`    Effect ${index + 1}:`);
      console.log(`      Name: ${effect.effectName || '❌ Missing'}`);
      console.log(`      Description: ${effect.effectDescription || '❌ Missing'}`);
      console.log(`      Has Quantitative: ${effect.hasQuantitative || '❌ Missing'}`);
      console.log(`      Has Qualitative: ${effect.hasQualitative || '❌ Missing'}`);
      
      if (effect.hasQuantitative && effect.quantitativeDetails) {
        console.log(`      📊 Quantitative Details:`);
        
        if (effect.quantitativeDetails.financialDetails) {
          const financial = effect.quantitativeDetails.financialDetails;
          console.log(`        💰 Financial Details:`);
          console.log(`          Value: ${financial.value || '❌ Missing'}`);
          console.log(`          Currency: ${financial.currency || '❌ Missing'}`);
          console.log(`          Period: ${financial.period || '❌ Missing'}`);
          console.log(`          Type: ${financial.type || '❌ Missing'}`);
        }
        
        if (effect.quantitativeDetails.redistributionDetails) {
          const redistribution = effect.quantitativeDetails.redistributionDetails;
          console.log(`        🔄 Redistribution Details:`);
          console.log(`          Value: ${redistribution.value || '❌ Missing'}`);
          console.log(`          Currency: ${redistribution.currency || '❌ Missing'}`);
          console.log(`          Period: ${redistribution.period || '❌ Missing'}`);
          console.log(`          Type: ${redistribution.type || '❌ Missing'}`);
        }
      }
      
      if (effect.hasQualitative && effect.qualitativeDetails) {
        console.log(`      📝 Qualitative Details:`);
        console.log(`        Factor: ${effect.qualitativeDetails.factor || '❌ Missing'}`);
        console.log(`        Description: ${effect.qualitativeDetails.description || '❌ Missing'}`);
      }
    });
  } else {
    console.log('  ❌ No effects_data found');
  }

  // Technical Data Analysis
  console.log('\n⚙️ TECHNICAL DATA ANALYSIS:');
  const technicalData = project.technical_data;
  if (technicalData) {
    console.log('  ✅ Technical data object exists');
    console.log(`    Technology: ${technicalData.technology || '❌ Missing'}`);
    console.log(`    Implementation: ${technicalData.implementation || '❌ Missing'}`);
    console.log(`    Integration: ${technicalData.integration || '❌ Missing'}`);
    console.log(`    Deployment Environment: ${technicalData.deploymentEnvironment || '❌ Missing'}`);
    console.log(`    Data Sensitivity: ${technicalData.dataSensitivity || '❌ Missing'}`);
  } else {
    console.log('  ❌ No technical_data found');
  }

  // Legal Data Analysis
  console.log('\n⚖️ LEGAL DATA ANALYSIS:');
  const legalData = project.legal_data;
  if (legalData) {
    console.log('  ✅ Legal data object exists');
    console.log(`    GDPR Risk: ${legalData.gdprRisk || '❌ Missing'}`);
    console.log(`    AI Risk: ${legalData.aiRisk || '❌ Missing'}`);
    console.log(`    Procurement Type: ${legalData.procurementType || '❌ Missing'}`);
    console.log(`    Open Source: ${legalData.openSource || '❌ Missing'}`);
  } else {
    console.log('  ❌ No legal_data found');
  }

  // Leadership Data Analysis
  console.log('\n👥 LEADERSHIP DATA ANALYSIS:');
  const leadershipData = project.leadership_data;
  if (leadershipData) {
    console.log('  ✅ Leadership data object exists');
    console.log(`    Ownership: ${leadershipData.ownership || '❌ Missing'}`);
    console.log(`    Change Management: ${leadershipData.changeManagement || '❌ Missing'}`);
    console.log(`    Stakeholder Engagement: ${leadershipData.stakeholderEngagement || '❌ Missing'}`);
  } else {
    console.log('  ❌ No leadership_data found');
  }

  // Overview Details Analysis
  console.log('\n📋 OVERVIEW DETAILS ANALYSIS:');
  const overviewDetails = project.overview_details;
  if (overviewDetails) {
    console.log('  ✅ Overview details object exists');
    console.log(`    Location Type: ${overviewDetails.location_type || '❌ Missing'}`);
    console.log(`    County Codes: ${overviewDetails.county_codes?.join(', ') || '❌ Missing'}`);
    console.log(`    SDG Goals: ${overviewDetails.sdg_goals?.join(', ') || '❌ Missing'}`);
  } else {
    console.log('  ❌ No overview_details found');
  }

  console.log('\n' + '='.repeat(80));
}

async function debugProjectData() {
  console.log('🔍 Debugging Project Data Structure...\n');

  try {
    // Fetch projects with all related data
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_municipalities(municipalities(name)),
        project_areas(areas(name)),
        project_value_dimensions(value_dimensions(name))
      `)
      .limit(3);

    if (error) {
      console.error('❌ Error fetching projects:', error);
      return;
    }

    if (!projects || projects.length === 0) {
      console.log('⚠️  No projects found in database');
      return;
    }

    console.log(`✅ Found ${projects.length} projects to analyze\n`);

    // Analyze each project
    projects.forEach((project, index) => {
      analyzeProjectData(project);
    });

    console.log('\n📋 SUMMARY:');
    console.log('✅ Data structure analysis complete');
    console.log('✅ Ready to identify missing data and populate costs/effects');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

// Run the analysis
debugProjectData().then(() => {
  console.log('\n🏁 Analysis completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Analysis failed:', error);
  process.exit(1);
}); 
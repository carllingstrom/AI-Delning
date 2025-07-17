#!/usr/bin/env node

import dotenv from 'dotenv';

// Load environment variables manually to handle BOM issues
console.log('🔧 Loading environment variables...');

try {
  const fs = await import('fs');
  const path = await import('path');
  const envPath = path.resolve('.env.local');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    // Remove BOM if present and split into lines
    const cleanContent = envContent.replace(/^\uFEFF/, '');
    const lines = cleanContent.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const cleanKey = key.trim();
          const cleanValue = valueParts.join('=').trim();
          envVars[cleanKey] = cleanValue;
        }
      }
    });
    
    // Set environment variables
    Object.assign(process.env, envVars);
    console.log('✅ Manually loaded environment variables');
    console.log('  Variables loaded:', Object.keys(envVars));
  } else {
    console.log('❌ .env.local file not found');
  }
} catch (error) {
  console.log('❌ Could not manually load environment variables:', error.message);
}

const groqApiKey = process.env.GROQ_API_KEY;

console.log('🔍 Environment Check:');
console.log(`  GROQ_API_KEY: ${groqApiKey ? '✅ Set' : '❌ Missing'}`);

if (!groqApiKey) {
  console.error('\n❌ Missing GROQ_API_KEY in .env.local');
  console.error('Please ensure GROQ_API_KEY is set');
  console.error('Example .env.local format:');
  console.error('GROQ_API_KEY=your_groq_api_key');
  process.exit(1);
}

// Sample project data for testing
const sampleProjects = [
  {
    title: 'AI-driven Traffic Management',
    intro: 'Ett projekt för att förbättra trafikflödet i städer genom AI-baserad analys av realtidsdata från sensorer och kameror.',
    problem: 'Trafikstockningar kostar kommuner miljoner kronor varje år och påverkar både miljön och medborgarnas välbefinnande.',
    opportunity: 'Genom att implementera AI-lösningar kan vi optimera trafiksignaler och förutse trafikflöden för att minska köer med upp till 30%.'
  },
  {
    title: 'Smart Waste Management',
    intro: 'En intelligent lösning för att optimera sophämtning genom IoT-sensorer och maskininlärning.',
    problem: 'Ineffektiv sophämtning leder till onödiga kostnader och miljöpåverkan när tomma containrar hämtas och fulla containrar står kvar.',
    opportunity: 'Smart routing och prediktiv analys kan minska kostnaderna med 25% och förbättra servicekvaliteten för medborgarna.'
  },
  {
    title: 'Digital Health Platform',
    intro: 'En plattform för att förbättra kommunikation mellan vårdpersonal och patienter genom digitala verktyg.',
    problem: 'Bristande kommunikation mellan vårdgivare och patienter leder till sämre vårdresultat och högre kostnader.',
    opportunity: 'Digitala verktyg kan förbättra patientengagemanget och minska onödiga besök, vilket sparar både tid och resurser.'
  }
];

async function generateAISummary(intro, problem, opportunity) {
  try {
    const prompt = `
Du är en expert på att skriva korta, professionella sammanfattningar för AI-projekt. 
Kombinera följande information till en sammanfattning på exakt 150-200 ord som är:
- Professionell och faktabaserad
- Lätt att förstå för beslutsfattare
- Fokuserad på värdeskapande och resultat

INFORMATION:
Intro: ${intro || 'Ingen introduktion tillgänglig'}
Problem: ${problem || 'Inget specifikt problem beskrivet'}
Möjlighet: ${opportunity || 'Ingen möjlighet beskriven'}

Skriv sammanfattningen på svenska och se till att den har en naturlig flöde från problem till lösning till värde.
`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: 'Du är en expert på att skriva korta, professionella sammanfattningar för AI-projekt.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content?.trim();
    
    if (!summary) {
      throw new Error('No summary generated from Groq API');
    }

    return summary;

  } catch (error) {
    console.error('Error generating AI summary:', error);
    return `Fallback summary: ${intro} ${problem} ${opportunity}`.substring(0, 200) + '...';
  }
}

function prepareTextForAI(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim()
    .substring(0, 1000);
}

async function testAISummaryGeneration() {
  console.log('🤖 Testing AI Summary Generation with Groq API...\n');

  for (let i = 0; i < sampleProjects.length; i++) {
    const project = sampleProjects[i];
    console.log(`📋 Testing Project ${i + 1}: ${project.title}`);
    console.log('─'.repeat(60));

    console.log('\n📝 INPUT DATA:');
    console.log(`  Intro: ${project.intro.substring(0, 100)}...`);
    console.log(`  Problem: ${project.problem.substring(0, 100)}...`);
    console.log(`  Opportunity: ${project.opportunity.substring(0, 100)}...`);

    console.log('\n🔄 PROCESSING...');
    
    try {
      const intro = prepareTextForAI(project.intro);
      const problem = prepareTextForAI(project.problem);
      const opportunity = prepareTextForAI(project.opportunity);
      
      const summary = await generateAISummary(intro, problem, opportunity);
      
      console.log('\n✅ GENERATED SUMMARY:');
      console.log(summary);
      console.log(`\n📊 Summary length: ${summary.length} characters`);
      console.log(`📊 Word count: ${summary.split(' ').length} words`);
      
    } catch (error) {
      console.log('\n❌ FAILED TO GENERATE SUMMARY:');
      console.log(error.message);
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }

  console.log('🎯 AI Summary Generation Test Completed!');
}

// Run the test
testAISummaryGeneration().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 
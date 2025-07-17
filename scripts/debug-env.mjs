#!/usr/bin/env node

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

console.log('🔍 Debugging Environment Variables...\n');

// Method 1: Try dotenv
console.log('📋 Method 1: dotenv.config()');
try {
  const result = dotenv.config({ path: '.env.local' });
  console.log('  Result:', result);
  console.log('  Parsed:', result.parsed ? 'Yes' : 'No');
  if (result.parsed) {
    console.log('  Variables found:', Object.keys(result.parsed));
  }
} catch (error) {
  console.log('  Error:', error.message);
}

// Method 2: Manual file reading
console.log('\n📋 Method 2: Manual file reading');
try {
  const envPath = path.resolve('.env.local');
  console.log('  File path:', envPath);
  console.log('  File exists:', fs.existsSync(envPath));
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('  File size:', content.length, 'characters');
    console.log('  First 200 chars:', content.substring(0, 200));
    
    const lines = content.split('\n');
    console.log('  Number of lines:', lines.length);
    
    lines.forEach((line, index) => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          console.log(`  Line ${index + 1}: ${key.trim()} = [value present]`);
        }
      }
    });
  }
} catch (error) {
  console.log('  Error:', error.message);
}

// Method 3: Check process.env directly
console.log('\n📋 Method 3: Current process.env');
console.log('  NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
console.log('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');
console.log('  GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Set' : 'Not set');

// Method 4: Try loading with different options
console.log('\n📋 Method 4: Alternative dotenv loading');
try {
  // Try without path specification
  const result2 = dotenv.config();
  console.log('  Default config result:', result2.parsed ? 'Success' : 'Failed');
  
  // Try with debug
  const result3 = dotenv.config({ path: '.env.local', debug: true });
  console.log('  Debug config result:', result3.parsed ? 'Success' : 'Failed');
} catch (error) {
  console.log('  Error:', error.message);
}

console.log('\n🏁 Debug complete'); 
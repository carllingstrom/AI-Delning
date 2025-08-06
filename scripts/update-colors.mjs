#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const SRC_DIR = './src';
const SCRIPTS_DIR = './scripts';

// Color mapping based on user specifications
const COLOR_MAPPINGS = {
  // Background colors
  '#121f2b': '#121f2b', // Main background
  '#121f2b': '#121f2b', // Secondary background
  '#224556': '#224556', // Box/card backgrounds
  '#224556': '#224556', // Alternative box background
  
  // Yellow accents
  '#fecb00': '#fecb00', // Old yellow
  '#fecb00': '#fecb00', // AI Sweden yellow (already correct)
  
  // White text
  'text-[#fffefa]': 'text-[#fffefa]', // Replace generic white with specific white
  
  // Hover states
  '#e0b400': '#fecb00', // Yellow hover
  '#ffe066': '#fecb00', // Yellow hover alternative
  '#1a2a3d': '#224556', // Hover background
  '#2A2E31': '#224556', // Alternative hover background
};

// Patterns to find and replace
const REPLACEMENT_PATTERNS = [
  // Background colors
  { from: /bg-\[#121f2b\]/g, to: 'bg-[#121f2b]' },
  { from: /bg-\[#121f2b\]/g, to: 'bg-[#121f2b]' },
  { from: /bg-\[#224556\]/g, to: 'bg-[#224556]' },
  { from: /bg-\[#224556\]/g, to: 'bg-[#224556]' },
  
  // Text colors
  { from: /text-\[#fecb00\]/g, to: 'text-[#fecb00]' },
  { from: /text-\[#fecb00\]/g, to: 'text-[#fecb00]' },
  { from: /border-\[#fecb00\]/g, to: 'border-[#fecb00]' },
  { from: /border-\[#fecb00\]/g, to: 'border-[#fecb00]' },
  
  // Background colors in style attributes
  { from: /background:\s*'#121f2b'/g, to: "background: '#121f2b'" },
  { from: /background:\s*'#121f2b'/g, to: "background: '#121f2b'" },
  { from: /background:\s*'#224556'/g, to: "background: '#224556'" },
  { from: /background:\s*'#224556'/g, to: "background: '#224556'" },
  
  // Color values in style attributes
  { from: /color:\s*'#fecb00'/g, to: "color: '#fecb00'" },
  { from: /color:\s*'#fecb00'/g, to: "color: '#fecb00'" },
  
  // Hover states
  { from: /hover:bg-\[#e0b400\]/g, to: 'hover:bg-[#fecb00]' },
  { from: /hover:bg-\[#ffe066\]/g, to: 'hover:bg-[#fecb00]' },
  { from: /hover:bg-\[#1a2a3d\]/g, to: 'hover:bg-[#224556]' },
  { from: /hover:bg-\[#2A2E31\]/g, to: 'hover:bg-[#224556]' },
  
  // Text color replacements
  { from: /text-[#fffefa](?![-\[])/g, to: 'text-[#fffefa]' },
  
  // Accent colors
  { from: /accent-\[#fecb00\]/g, to: 'accent-[#fecb00]' },
  { from: /accent-\[#fecb00\]/g, to: 'accent-[#fecb00]' },
];

// Additional patterns for specific contexts
const ADDITIONAL_PATTERNS = [
  // Color arrays in JavaScript
  { from: /'#fecb00'/g, to: "'#fecb00'" },
  { from: /'#fecb00'/g, to: "'#fecb00'" },
  { from: /'#121f2b'/g, to: "'#121f2b'" },
  { from: /'#121f2b'/g, to: "'#121f2b'" },
  { from: /'#224556'/g, to: "'#224556'" },
  { from: /'#224556'/g, to: "'#224556'" },
  
  // Color values without quotes
  { from: /#fecb00/g, to: '#fecb00' },
  { from: /#fecb00/g, to: '#fecb00' },
  { from: /#121f2b/g, to: '#121f2b' },
  { from: /#121f2b/g, to: '#121f2b' },
  { from: /#224556/g, to: '#224556' },
  { from: /#224556/g, to: '#224556' },
];

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let changes = 0;
    
    // Apply all replacement patterns
    REPLACEMENT_PATTERNS.forEach(pattern => {
      const matches = (updatedContent.match(pattern.from) || []).length;
      if (matches > 0) {
        updatedContent = updatedContent.replace(pattern.from, pattern.to);
        changes += matches;
      }
    });
    
    // Apply additional patterns
    ADDITIONAL_PATTERNS.forEach(pattern => {
      const matches = (updatedContent.match(pattern.from) || []).length;
      if (matches > 0) {
        updatedContent = updatedContent.replace(pattern.from, pattern.to);
        changes += matches;
      }
    });
    
    if (changes > 0) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`🎨 Updated ${changes} color references in ${filePath}`);
      return changes;
    }
    return 0;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.mjs']) {
  const files = [];
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scan(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return files;
}

async function main() {
  console.log('🎨 Starting color scheme update...\n');
  console.log('📋 Color mapping:');
  console.log('  Background: #121f2b/#121f2b → #121f2b');
  console.log('  Boxes: #224556/#224556 → #224556');
  console.log('  Yellow: #fecb00 → #fecb00');
  console.log('  White: text-[#fffefa] → text-[#fffefa]');
  console.log('');
  
  let totalChanges = 0;
  
  // Process src directory
  if (fs.existsSync(SRC_DIR)) {
    const srcFiles = findFiles(SRC_DIR);
    console.log(`📁 Processing ${srcFiles.length} files in src/`);
    
    for (const file of srcFiles) {
      totalChanges += processFile(file);
    }
  }
  
  // Process scripts directory
  if (fs.existsSync(SCRIPTS_DIR)) {
    const scriptFiles = findFiles(SCRIPTS_DIR);
    console.log(`📁 Processing ${scriptFiles.length} files in scripts/`);
    
    for (const file of scriptFiles) {
      totalChanges += processFile(file);
    }
  }
  
  console.log(`\n✅ Color update complete! Updated ${totalChanges} color references total.`);
  console.log('\n🎨 New color scheme applied:');
  console.log('  • Background: #121f2b (dark blue-black)');
  console.log('  • Boxes: #224556 (blue-gray)');
  console.log('  • Yellow accents: #fecb00');
  console.log('  • White text: #fffefa');
}

main().catch(console.error); 
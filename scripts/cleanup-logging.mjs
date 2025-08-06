#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const SRC_DIR = './src';
const SCRIPTS_DIR = './scripts';

// Patterns to look for and potentially remove
const VERBOSE_PATTERNS = [
  /console\.log\(['"]DEBUG:.*['"]/g,
  /console\.log\(['"]Processing.*['"]/g,
  /console\.log\(['"]Entry.*['"]/g,
  /console\.log\(JSON\.stringify\(/g,
  /console\.log\(['"]Raw.*['"]/g,
  /console\.log\(['"]Input.*['"]/g,
  /console\.log\(['"]Prepared.*['"]/g,
  /console\.log\(['"]Calling.*['"]/g,
  /console\.log\(['"]Final.*['"]/g,
  /console\.log\(['"]Using.*['"]/g,
  /console\.log\(['"]Calculated.*['"]/g,
  /console\.log\(['"]Cost.*['"]/g,
  /console\.log\(['"]Opening.*['"]/g,
  /console\.log\(['"]Found.*['"]/g,
  /console\.log\(['"]Set.*['"]/g,
  /console\.log\(['"]Municipalities.*['"]/g,
  /console\.log\(['"]Project.*['"]/g,
  /console\.log\(['"]Created.*['"]/g,
  /console\.log\(['"]Inserted.*['"]/g,
  /console\.log\(['"]Updated.*['"]/g,
  /console\.log\(['"]Ensured.*['"]/g,
  /console\.log\(['"]Populating.*['"]/g,
  /console\.log\(['"]Verifying.*['"]/g,
  /console\.log\(['"]Basic.*['"]/g,
  /console\.log\(['"]Map.*['"]/g,
  /console\.log\(['"]Analytics.*['"]/g,
  /console\.log\(['"]You.*['"]/g,
  /console\.log\(['"]All.*['"]/g,
  /console\.log\(['"]GROQ.*['"]/g,
  /console\.log\(['"]Testing.*['"]/g,
  /console\.log\(['"]Fetching.*['"]/g,
  /console\.log\(['"]First.*['"]/g,
  /console\.log\(['"]Effect.*['"]/g,
  /console\.log\(['"]Has.*['"]/g,
  /console\.log\(['"]Value.*['"]/g,
  /console\.log\(['"]Info.*['"]/g,
  /console\.log\(['"]DynamicFormSection.*['"]/g,
  /console\.log\(['"]ROISummary.*['"]/g,
  /console\.log\(['"]Skipping.*['"]/g,
  /console\.log\(['"]No.*['"]/g,
];

// Patterns to keep (important logging)
const KEEP_PATTERNS = [
  /console\.error\(/g,
  /console\.warn\(/g,
  /console\.log\(['"]Error.*['"]/g,
  /console\.log\(['"]Warning.*['"]/g,
  /console\.log\(['"]Success.*['"]/g,
  /console\.log\(['"]✅.*['"]/g,
  /console\.log\(['"]❌.*['"]/g,
  /console\.log\(['"]🎉.*['"]/g,
  /console\.log\(['"]🌍.*['"]/g,
  /console\.log\(['"]🌱.*['"]/g,
  /console\.log\(['"]📍.*['"]/g,
  /console\.log\(['"]💎.*['"]/g,
  /console\.log\(['"]🧪.*['"]/g,
  /console\.log\(['"]🔍.*['"]/g,
  /console\.log\(['"]📋.*['"]/g,
  /console\.log\(['"]📊.*['"]/g,
  /console\.log\(['"]📈.*['"]/g,
  /console\.log\(['"]💰.*['"]/g,
  /console\.log\(['"]🔄.*['"]/g,
  /console\.log\(['"]📝.*['"]/g,
];

function shouldKeepLine(line) {
  return KEEP_PATTERNS.some(pattern => pattern.test(line));
}

function isVerboseLogging(line) {
  return VERBOSE_PATTERNS.some(pattern => pattern.test(line)) && !shouldKeepLine(line);
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const cleanedLines = lines.filter(line => !isVerboseLogging(line));
    
    if (lines.length !== cleanedLines.length) {
      const removedCount = lines.length - cleanedLines.length;
      console.log(`🧹 Cleaned ${removedCount} verbose log lines from ${filePath}`);
      fs.writeFileSync(filePath, cleanedLines.join('\n'));
      return removedCount;
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
  console.log('🧹 Starting verbose logging cleanup...\n');
  
  let totalRemoved = 0;
  
  // Process src directory
  if (fs.existsSync(SRC_DIR)) {
    const srcFiles = findFiles(SRC_DIR);
    console.log(`📁 Processing ${srcFiles.length} files in src/`);
    
    for (const file of srcFiles) {
      totalRemoved += processFile(file);
    }
  }
  
  // Process scripts directory
  if (fs.existsSync(SCRIPTS_DIR)) {
    const scriptFiles = findFiles(SCRIPTS_DIR);
    console.log(`📁 Processing ${scriptFiles.length} files in scripts/`);
    
    for (const file of scriptFiles) {
      totalRemoved += processFile(file);
    }
  }
  
  console.log(`\n✅ Cleanup complete! Removed ${totalRemoved} verbose log lines total.`);
  console.log('\n💡 Tip: You can now run your app with much cleaner terminal output.');
}

main().catch(console.error); 
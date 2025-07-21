#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function findSkippedTests() {
  const results = [];
  
  // Find fixture tests with @skip annotations
  const fixtureFiles = glob.sync('tests/fixtures/**/*.input.ts', { cwd: process.cwd() });
  
  for (const file of fixtureFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('* @skip')) {
        const reason = line.replace('* @skip', '').trim() || 'No reason provided';
        results.push({
          type: 'fixture',
          file: file,
          line: i + 1,
          reason: reason,
          context: path.basename(file, '.input.ts')
        });
      }
    }
  }
  
  // Find unit tests with it.skip() calls
  const unitTestFiles = glob.sync('tests/unit/**/*.test.ts', { cwd: process.cwd() });
  
  for (const file of unitTestFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('it.skip') || line.includes('test.skip') || line.includes('describe.skip')) {
        // Extract test name from the line
        const testNameMatch = line.match(/['"`]([^'"`]+)['"`]/);
        const testName = testNameMatch ? testNameMatch[1] : 'Unknown test';
        
        // Look for comments above the skip line for reasons
        let reason = 'No reason provided';
        if (i > 0) {
          const prevLine = lines[i - 1].trim();
          if (prevLine.startsWith('//')) {
            reason = prevLine.replace('//', '').trim();
          }
        }
        
        results.push({
          type: 'unit',
          file: file,
          line: i + 1,
          reason: reason,
          context: testName
        });
      }
    }
  }
  
  return results;
}

function displayResults(results) {
  if (results.length === 0) {
    console.log('🎉 No skipped tests found!');
    return;
  }
  
  console.log(`📋 Found ${results.length} skipped test(s):\n`);
  
  // Group by type
  const fixtureTests = results.filter(r => r.type === 'fixture');
  const unitTests = results.filter(r => r.type === 'unit');
  
  if (fixtureTests.length > 0) {
    console.log('🗂️  Fixture Tests:');
    fixtureTests.forEach(test => {
      console.log(`   ${test.context}`);
      console.log(`   📁 ${test.file}:${test.line}`);
      console.log(`   💭 ${test.reason}`);
      console.log('');
    });
  }
  
  if (unitTests.length > 0) {
    console.log('🧪 Unit Tests:');
    unitTests.forEach(test => {
      console.log(`   ${test.context}`);
      console.log(`   📁 ${test.file}:${test.line}`);
      console.log(`   💭 ${test.reason}`);
      console.log('');
    });
  }
}

// Run the script
const skippedTests = findSkippedTests();
displayResults(skippedTests);
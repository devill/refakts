#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

// Get fixture path from command line arguments
const fixturePath = process.argv[2];

if (!fixturePath) {
  console.error('Usage: npm run test:fixture:review <fixture_path>');
  console.error('Example: npm run test:fixture:review tests/fixtures/select/basic-regex/simple-variable');
  process.exit(1);
}

function reviewFixture(inputFile: string): void {
  // Normalize the fixture path to include .input.ts if not present
  const normalizedPath = inputFile.endsWith('.input.ts') 
    ? inputFile 
    : `${inputFile}.input.ts`;
  
  if (!fs.existsSync(normalizedPath)) {
    console.error(`Fixture not found: ${normalizedPath}`);
    process.exit(1);
  }
  
  const basePath = normalizedPath.replace('.input.ts', '');
  const receivedFiles = [
    `${basePath}.received.ts`,
    `${basePath}.received.out`,
    `${basePath}.received.err`
  ];
  
  console.log(`Reviewing fixture: ${path.basename(normalizedPath)}`);
  console.log('='.repeat(50));
  
  for (const receivedFile of receivedFiles) {
    if (fs.existsSync(receivedFile)) {
      const content = fs.readFileSync(receivedFile, 'utf8');
      const fileType = path.extname(receivedFile).slice(1);
      
      console.log(`\n📄 ${path.basename(receivedFile)} (${fileType}):`);
      console.log('-'.repeat(30));
      console.log(content);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('To approve these changes, run:');
  console.log(`npm run test:fixture:approve ${inputFile}`);
}

reviewFixture(fixturePath);
#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { getTestCases } from '../utils/test-case-loader';

// Get fixture path from command line arguments
const isApproveAll = process.argv.includes('--all');
const fixturePath = isApproveAll ? null : process.argv[2];

if (!isApproveAll && !fixturePath) {
  console.error('Usage: npm run test:fixture:approve <fixture_path>');
  console.error('   or: npm run test:fixture:approve:all');
  console.error('Example: npm run test:fixture:approve tests/fixtures/select/basic-regex/simple-variable');
  process.exit(1);
}

function approveFixture(inputFile: string): void {
  const basePath = inputFile.replace('.input.ts', '');
  const receivedFiles = [
    `${basePath}.received.ts`,
    `${basePath}.received.out`,
    `${basePath}.received.err`
  ];
  
  let approvedCount = 0;
  
  for (const receivedFile of receivedFiles) {
    if (fs.existsSync(receivedFile)) {
      const expectedFile = receivedFile.replace('.received.', '.expected.');
      fs.copyFileSync(receivedFile, expectedFile);
      console.log(`✅ Approved: ${path.basename(expectedFile)}`);
      approvedCount++;
    }
  }
  
  if (approvedCount === 0) {
    console.log(`⚠️  No received files found for: ${path.basename(inputFile)}`);
  }
}

function approveAllFixtures(): void {
  const fixturesDir = path.join(__dirname, '..', 'fixtures');
  const testCases = getTestCases(fixturesDir, 'input');
  
  let totalApproved = 0;
  
  for (const testCase of testCases) {
    const basePath = testCase.inputFile.replace('.input.ts', '');
    const receivedFiles = [
      `${basePath}.received.ts`,
      `${basePath}.received.out`,
      `${basePath}.received.err`
    ];
    
    for (const receivedFile of receivedFiles) {
      if (fs.existsSync(receivedFile)) {
        const expectedFile = receivedFile.replace('.received.', '.expected.');
        fs.copyFileSync(receivedFile, expectedFile);
        totalApproved++;
      }
    }
  }
  
  console.log(`✅ Approved ${totalApproved} files across ${testCases.length} test cases`);
}

function main(): void {
  if (isApproveAll) {
    approveAllFixtures();
  } else {
    // Normalize the fixture path to include .input.ts if not present
    const normalizedPath = fixturePath!.endsWith('.input.ts') 
      ? fixturePath! 
      : `${fixturePath!}.input.ts`;
    
    if (!fs.existsSync(normalizedPath)) {
      console.error(`Fixture not found: ${normalizedPath}`);
      process.exit(1);
    }
    
    approveFixture(normalizedPath);
  }
}

main();
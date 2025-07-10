#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { getTestCases } from '../utils/test-case-loader';

const isApproveAll = process.argv.includes('--all');
const fixturePath = parseFixturePathFromArgs();

function parseFixturePathFromArgs(): string | null {
  return isApproveAll ? null : process.argv[2];
}

if (!isApproveAll && !fixturePath) {
  console.error('Usage: npm run test:fixture:approve <fixture_path>');
  console.error('   or: npm run test:fixture:approve:all');
  console.error('Example: npm run test:fixture:approve tests/fixtures/select/basic-regex/simple-variable');
  process.exit(1);
}

function approveFixture(inputFile: string): void {
  const receivedFiles = createReceivedFilePaths(inputFile);
  const approvedCount = approveReceivedFiles(receivedFiles);
  
  if (approvedCount === 0) {
    console.log(`⚠️  No received files found for: ${path.basename(inputFile)}`);
  }
}

function approveAllFixtures(): void {
  const testCases = loadAllTestCases();
  const totalApproved = processAllTestCases(testCases);
  
  console.log(`✅ Approved ${totalApproved} files across ${testCases.length} test cases`);
}

function main(): void {
  if (isApproveAll) {
    approveAllFixtures();
  } else {
    const normalizedPath = normalizeFixturePath(fixturePath!);
    validateFixtureExists(normalizedPath);
    approveFixture(normalizedPath);
  }
}

function createReceivedFilePaths(inputFile: string): string[] {
  const basePath = inputFile.replace('.input.ts', '');
  return [
    `${basePath}.received.ts`,
    `${basePath}.received.out`,
    `${basePath}.received.err`
  ];
}

function approveReceivedFiles(receivedFiles: string[]): number {
  let approvedCount = 0;
  
  for (const receivedFile of receivedFiles) {
    if (fs.existsSync(receivedFile)) {
      approvedCount += approveSingleFile(receivedFile);
    }
  }
  
  return approvedCount;
}

function approveSingleFile(receivedFile: string): number {
  const expectedFile = receivedFile.replace('.received.', '.expected.');
  fs.copyFileSync(receivedFile, expectedFile);
  console.log(`✅ Approved: ${path.basename(expectedFile)}`);
  return 1;
}

function loadAllTestCases() {
  const fixturesDir = path.join(__dirname, '..', 'fixtures');
  return getTestCases(fixturesDir, 'input');
}

function processAllTestCases(testCases: any[]): number {
  let totalApproved = 0;
  
  for (const testCase of testCases) {
    const receivedFiles = createReceivedFilePaths(testCase.inputFile);
    totalApproved += approveReceivedFiles(receivedFiles);
  }
  
  return totalApproved;
}

function normalizeFixturePath(fixturePath: string): string {
  return fixturePath.endsWith('.input.ts') 
    ? fixturePath 
    : `${fixturePath}.input.ts`;
}

function validateFixtureExists(normalizedPath: string): void {
  if (!fs.existsSync(normalizedPath)) {
    console.error(`Fixture not found: ${normalizedPath}`);
    process.exit(1);
  }
}

main();
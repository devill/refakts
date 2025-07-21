#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

const fixturePath = parseFixturePathFromArgs();

function parseFixturePathFromArgs(): string {
  return process.argv[2];
}

if (!fixturePath) {
  console.error('Usage: npm run test:fixture:review <fixture_path>');
  console.error('Example: npm run test:fixture:review tests/fixtures/select/basic-regex/simple-variable');
  process.exit(1);
}

function reviewFixture(inputFile: string): void {
  const normalizedPath = normalizeFixturePath(inputFile);
  validateFixtureExists(normalizedPath);
  
  const receivedFiles = createReceivedFilePaths(normalizedPath);
  
  displayFixtureHeader(normalizedPath);
  displayReceivedFiles(receivedFiles);
  displayApprovalInstructions(inputFile);
}

function normalizeFixturePath(inputFile: string): string {
  return inputFile.endsWith('.input.ts') 
    ? inputFile 
    : `${inputFile}.input.ts`;
}

function validateFixtureExists(normalizedPath: string): void {
  if (!fs.existsSync(normalizedPath)) {
    console.error(`Fixture not found: ${normalizedPath}`);
    process.exit(1);
  }
}

function createReceivedFilePaths(normalizedPath: string): string[] {
  const basePath = normalizedPath.replace('.input.ts', '');
  return [
    `${basePath}.received.ts`,
    `${basePath}.received.out`,
    `${basePath}.received.err`
  ];
}

function displayFixtureHeader(normalizedPath: string): void {
  console.log(`Reviewing fixture: ${path.basename(normalizedPath)}`);
  console.log('='.repeat(50));
}

function displayReceivedFiles(receivedFiles: string[]): void {
  for (const receivedFile of receivedFiles) {
    if (fs.existsSync(receivedFile)) {
      displayFileContent(receivedFile);
    }
  }
}

function displayFileContent(receivedFile: string): void {
  const content = fs.readFileSync(receivedFile, 'utf8');
  const fileType = path.extname(receivedFile).slice(1);
  
  console.log(`\n📄 ${path.basename(receivedFile)} (${fileType}):`);
  console.log('-'.repeat(30));
  console.log(content);
}

function displayApprovalInstructions(inputFile: string): void {
  console.log('\n' + '='.repeat(50));
  console.log('To approve these changes, run:');
  console.log(`npm run test:fixture:approve ${inputFile}`);
}

reviewFixture(fixturePath);
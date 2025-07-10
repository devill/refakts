#!/usr/bin/env ts-node

import * as path from 'path';
import { getTestCases } from '../utils/test-case-loader';
import { FixtureValidator } from '../utils/fixture-validator';
import { CommandExecutor } from '../utils/command-executor';

// Get fixture path from command line arguments
const fixturePath = process.argv[2];

if (!fixturePath) {
  console.error('Usage: npm run test:fixture <fixture_path>');
  console.error('Example: npm run test:fixture tests/fixtures/select/basic-regex/simple-variable');
  process.exit(1);
}

// Normalize the fixture path to include .input.ts if not present
const normalizedPath = fixturePath.endsWith('.input.ts') 
  ? fixturePath 
  : `${fixturePath}.input.ts`;

// Check if the fixture exists
const fs = require('fs');
if (!fs.existsSync(normalizedPath)) {
  console.error(`Fixture not found: ${normalizedPath}`);
  process.exit(1);
}

async function runFixtureTest() {
  const commandExecutor = new CommandExecutor();
  const validator = new FixtureValidator(commandExecutor);
  
  // Load the specific test case
  const fixturesDir = path.dirname(normalizedPath);
  const testCases = getTestCases(fixturesDir, 'input');
  const testCase = testCases.find(tc => tc.inputFile === normalizedPath);
  
  if (!testCase) {
    console.error(`Test case not found for: ${normalizedPath}`);
    process.exit(1);
  }
  
  console.log(`Running fixture test: ${testCase.name}`);
  console.log(`Description: ${testCase.description}`);
  console.log(`Command: ${testCase.commands[0]}`);
  
  try {
    await validator.validate(testCase);
    console.log('✅ Test passed');
  } catch (error) {
    console.error('❌ Test failed:', (error as Error).message);
    process.exit(1);
  }
}

runFixtureTest().catch(console.error);
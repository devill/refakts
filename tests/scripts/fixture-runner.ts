#!/usr/bin/env ts-node

import * as path from 'path';
import { getTestCases } from '../utils/test-case-loader';
import { FixtureValidator } from '../utils/fixture-validator';
import { CommandExecutor } from '../utils/command-executor';

const fixturePath = parseFixturePathFromArgs();

function parseFixturePathFromArgs(): string {
  return process.argv[2];
}

if (!fixturePath) {
  console.error('Usage: npm run test:fixture <fixture_path>');
  console.error('Example: npm run test:fixture tests/fixtures/select/basic-regex/simple-variable');
  process.exit(1);
}

const normalizedPath = normalizeFixturePath(fixturePath);
validateFixtureExists(normalizedPath);

const fs = require('fs');

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

async function runFixtureTest() {
  const validator = createValidator();
  const testCase = loadTestCase();
  
  displayTestInfo(testCase);
  await executeTest(validator, testCase);
}

function createValidator(): FixtureValidator {
  const commandExecutor = new CommandExecutor();
  return new FixtureValidator(commandExecutor);
}

function loadTestCase(): any {
  const fixturesDir = path.dirname(normalizedPath);
  const testCases = getTestCases(fixturesDir, 'input');
  const testCase = testCases.find(tc => tc.inputFile === normalizedPath);
  
  if (!testCase) {
    console.error(`Test case not found for: ${normalizedPath}`);
    process.exit(1);
  }
  
  return testCase;
}

function displayTestInfo(testCase: any): void {
  console.log(`Running fixture test: ${testCase.name}`);
  console.log(`Description: ${testCase.description}`);
  console.log(`Command: ${testCase.commands[0]}`);
}

async function executeTest(validator: FixtureValidator, testCase: any): Promise<void> {
  try {
    await validator.validate(testCase);
    console.log('✅ Test passed');
  } catch (error) {
    console.error('❌ Test failed:', (error as Error).message);
    process.exit(1);
  }
}

runFixtureTest().catch(console.error);
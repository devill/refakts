#!/usr/bin/env ts-node

import * as path from 'path';
import { getTestCases } from '../utils/test-case-loader';
import { FixtureValidator } from '../utils/fixture-validator';
import { CommandExecutor } from '../utils/command-executor';
import { normalizeFixturePath, validateFixtureExists } from './shared-utilities';

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
  
  validateTestCaseExists(testCase);
  return testCase;
}

function validateTestCaseExists(testCase: any): void {
  if (!testCase) {
    console.error(`Test case not found for: ${normalizedPath}`);
    process.exit(1);
  }
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
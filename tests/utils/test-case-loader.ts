import * as path from 'path';
import { TestCase } from './types/test-case-types';
import { FileSystemScanner } from './scanners/file-system-scanner';
import { FixtureLocation } from './fixture-location';
import { InputFileScanner } from './input-file-scanner';

interface TestDirectoryConfig {
  testDir: string;
  fixturesDir: string;
  expectedExtension: string;
  scanner: FileSystemScanner;
}

interface TestCaseProcessingConfig {
  testDir: string;
  testPath: string;
  files: string[];
  expectedExtension: string;
}

export { TestCase, FixtureTestCase, TestMeta, FixtureConfig } from './types/test-case-types';
export { extractMetaFromFile } from './parsers/meta-parser';

export function getTestCases(fixturesDir: string, expectedExtension: string): TestCase[] {
  const scanner = new FileSystemScanner();
  
  if (!scanner.directoryExists(fixturesDir)) {
    return [];
  }
  
  return loadTestCasesBasedOnExtension(fixturesDir, expectedExtension, scanner);
}

function loadTestCasesBasedOnExtension(fixturesDir: string, expectedExtension: string, scanner: FileSystemScanner): TestCase[] {
  if (expectedExtension === 'input') {
    const inputScanner = new InputFileScanner();
    return inputScanner.scanRecursively(fixturesDir, scanner);
  }
  return loadTestCasesFromDirectories(fixturesDir, expectedExtension, scanner);
}

function loadTestCasesFromDirectories(fixturesDir: string, expectedExtension: string, scanner: FileSystemScanner): TestCase[] {
  const testCases: TestCase[] = [];
  const testDirs = scanner.getDirectoryNames(fixturesDir);
  for (const testDir of testDirs) {
    const config = createTestDirectoryConfig({ testDir, fixturesDir, expectedExtension, scanner });
    testCases.push(...processTestDirectory(config));
  }
  
  return testCases;
}

function createTestDirectoryConfig(params: { testDir: string; fixturesDir: string; expectedExtension: string; scanner: FileSystemScanner }): TestDirectoryConfig {
  return {
    testDir: params.testDir,
    fixturesDir: params.fixturesDir,
    expectedExtension: params.expectedExtension,
    scanner: params.scanner
  };
}

function processTestDirectory(config: TestDirectoryConfig): TestCase[] {
  const testPath = path.join(config.fixturesDir, config.testDir);
  const files = config.scanner.getTestDirectoryFiles(testPath);
  
  const processingConfig = createTestCaseProcessingConfig(config, testPath, files);
  return getSingleFileTestCases(processingConfig);
}

function createTestCaseProcessingConfig(config: TestDirectoryConfig, testPath: string, files: string[]): TestCaseProcessingConfig {
  return {
    testDir: config.testDir,
    testPath,
    files,
    expectedExtension: config.expectedExtension
  };
}

function getSingleFileTestCases(config: TestCaseProcessingConfig): TestCase[] {
  const context = { testDir: config.testDir, testPath: config.testPath, files: config.files };
  return FixtureLocation.createSingleFileTestCases(context, config.expectedExtension);
}

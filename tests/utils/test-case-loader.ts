import * as path from 'path';
import { TestCase } from './types/test-case-types';
import { FileSystemScanner } from './scanners/file-system-scanner';
import { FixtureLocation } from './fixture-location';

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

interface DirectoryProcessingContext {
  scanner: FileSystemScanner;
  inputFiles: string[];
}

export { TestCase, TestMeta } from './types/test-case-types';
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
    return loadTestCasesRecursively(fixturesDir, scanner);
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

function loadTestCasesRecursively(fixturesDir: string, scanner: FileSystemScanner): TestCase[] {
  const inputFiles = findInputFilesRecursively(fixturesDir, scanner);
  return createTestCasesFromInputFiles(inputFiles);
}

function createTestCasesFromInputFiles(inputFiles: string[]): TestCase[] {
  const testCases: TestCase[] = [];
  for (const inputFile of inputFiles) {
    const testCase = FixtureLocation.createInputTestCase(inputFile);
    if (testCase) {
      testCases.push(testCase);
    }
  }
  return testCases;
}

function findInputFilesRecursively(dir: string, scanner: FileSystemScanner): string[] {
  const context: DirectoryProcessingContext = {
    scanner,
    inputFiles: []
  };
  
  processDirectoryEntries(dir, context);
  return context.inputFiles;
}

function processDirectoryEntries(dir: string, context: DirectoryProcessingContext): void {
  const entries = context.scanner.getTestDirectoryFiles(dir);
  
  for (const entry of entries) {
    processDirectoryEntry(dir, entry, context);
  }
}

function processDirectoryEntry(dir: string, entry: string, context: DirectoryProcessingContext): void {
  const fullPath = path.join(dir, entry);
  if (context.scanner.fileExists(fullPath)) {
    handleFileOrDirectory(fullPath, entry, context);
  }
}

function handleFileOrDirectory(fullPath: string, entry: string, context: DirectoryProcessingContext): void {
  const stat = require('fs').statSync(fullPath);
  if (stat.isDirectory()) {
    context.inputFiles.push(...findInputFilesRecursively(fullPath, context.scanner));
  } else if (entry.endsWith('.input.ts')) {
    context.inputFiles.push(fullPath);
  }
}

import * as path from 'path';
import { TestCase } from './types/test-case-types';
import { FileSystemScanner } from './scanners/file-system-scanner';
import { TestCaseFactory } from './factories/test-case-factory';

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

export { TestCase, TestMeta } from './types/test-case-types';
export { extractMetaFromFile } from './parsers/meta-parser';

export function getTestCases(fixturesDir: string, expectedExtension: string): TestCase[] {
  const scanner = new FileSystemScanner();
  
  if (!scanner.directoryExists(fixturesDir)) {
    return [];
  }
  
  // Special handling for unified 'input' pattern - scan recursively for all *.input.ts files
  if (expectedExtension === 'input') {
    return loadTestCasesRecursively(fixturesDir, scanner);
  }
  
  return loadTestCasesFromDirectories(fixturesDir, expectedExtension, scanner);
}

function loadTestCasesFromDirectories(fixturesDir: string, expectedExtension: string, scanner: FileSystemScanner): TestCase[] {
  const testCases: TestCase[] = [];
  const testDirs = scanner.getDirectoryNames(fixturesDir);
  for (const testDir of testDirs) {
    const config = createTestDirectoryConfig(testDir, fixturesDir, expectedExtension, scanner);
    testCases.push(...processTestDirectory(config));
  }
  
  return testCases;
}

function createTestDirectoryConfig(testDir: string, fixturesDir: string, expectedExtension: string, scanner: FileSystemScanner): TestDirectoryConfig {
  return {
    testDir,
    fixturesDir,
    expectedExtension,
    scanner
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
  const factoryConfig = {
    testDir: config.testDir,
    testPath: config.testPath,
    expectedExtension: config.expectedExtension
  };
  
  return TestCaseFactory.createSingleFileTestCases(factoryConfig, config.files);
}

function loadTestCasesRecursively(fixturesDir: string, scanner: FileSystemScanner): TestCase[] {
  const testCases: TestCase[] = [];
  const inputFiles = findInputFilesRecursively(fixturesDir, scanner);
  
  for (const inputFile of inputFiles) {
    const testCase = TestCaseFactory.createInputTestCase(inputFile);
    if (testCase) {
      testCases.push(testCase);
    }
  }
  
  return testCases;
}

function findInputFilesRecursively(dir: string, scanner: FileSystemScanner): string[] {
  const inputFiles: string[] = [];
  const entries = scanner.getTestDirectoryFiles(dir);
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    if (scanner.fileExists(fullPath)) {
      const stat = require('fs').statSync(fullPath);
      if (stat.isDirectory()) {
        inputFiles.push(...findInputFilesRecursively(fullPath, scanner));
      } else if (entry.endsWith('.input.ts')) {
        inputFiles.push(fullPath);
      }
    }
  }
  
  return inputFiles;
}

import * as path from 'path';
import { TestCase, FixtureTestCase } from './types/test-case-types';
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

export { TestCase, FixtureTestCase, TestMeta } from './types/test-case-types';
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
  const configFiles = findConfigFilesRecursively(fixturesDir, scanner);
  
  const testCases: TestCase[] = [];
  testCases.push(...createTestCasesFromInputFiles(inputFiles));
  testCases.push(...createTestCasesFromConfigFiles(configFiles));
  
  return testCases;
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

function findConfigFilesRecursively(dir: string, scanner: FileSystemScanner): string[] {
  const context: DirectoryProcessingContext = {
    scanner,
    inputFiles: []
  };
  
  processConfigDirectoryEntries(dir, context);
  return context.inputFiles;
}

function processConfigDirectoryEntries(dir: string, context: DirectoryProcessingContext): void {
  const entries = context.scanner.getTestDirectoryFiles(dir);
  
  for (const entry of entries) {
    processConfigDirectoryEntry(dir, entry, context);
  }
}

function processConfigDirectoryEntry(dir: string, entry: string, context: DirectoryProcessingContext): void {
  const fullPath = path.join(dir, entry);
  if (context.scanner.fileExists(fullPath)) {
    handleConfigFileOrDirectory(fullPath, entry, context);
  }
}

function handleConfigFileOrDirectory(fullPath: string, entry: string, context: DirectoryProcessingContext): void {
  const stat = require('fs').statSync(fullPath);
  if (stat.isDirectory()) {
    context.inputFiles.push(...findConfigFilesRecursively(fullPath, context.scanner));
  } else if (entry === 'fixture.config.json') {
    context.inputFiles.push(fullPath);
  }
}

function createTestCasesFromConfigFiles(configFiles: string[]): TestCase[] {
  const testCases: TestCase[] = [];
  for (const configFile of configFiles) {
    const multiFileTestCases = createMultiFileTestCases(configFile);
    testCases.push(...multiFileTestCases);
  }
  return testCases;
}

function createMultiFileTestCases(configFile: string): TestCase[] {
  const testCaseConfigs = readConfigFile(configFile);
  const configDir = path.dirname(configFile);
  
  const testCases: TestCase[] = [];
  for (const config of testCaseConfigs) {
    if (config.skipReason) {
      continue;
    }
    
    const testCase = createTestCaseFromConfig(config, configDir);
    testCases.push(testCase);
  }
  
  return testCases;
}

function readConfigFile(configFile: string): any[] {
  const fs = require('fs');
  const configContent = fs.readFileSync(configFile, 'utf8');
  return JSON.parse(configContent);
}

function createTestCaseFromConfig(config: any, configDir: string): TestCase {
  const inputDir = path.join(configDir, 'input');
  return new FixtureTestCase(
    `${path.basename(configDir)}/${config.id}`,
    config.description,
    [config.command],
    inputDir,
    path.join(configDir, `${config.id}.expected.ts`),
    path.join(configDir, `${config.id}.received.ts`),
    false,
    inputDir,
    path.join(configDir, `${config.id}.expected`),
    config.id
  );
}

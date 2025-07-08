import * as path from 'path';
import { TestCase } from './types/test-case-types';
import { FileSystemScanner } from './scanners/file-system-scanner';
import { TestCaseFactory } from './factories/test-case-factory';

export { TestCase, TestMeta } from './types/test-case-types';
export { extractMetaFromFile } from './parsers/meta-parser';

export function getTestCases(fixturesDir: string, expectedExtension: string): TestCase[] {
  const scanner = new FileSystemScanner();
  
  if (!scanner.directoryExists(fixturesDir)) {
    return [];
  }
  
  return loadTestCasesFromDirectories(fixturesDir, expectedExtension, scanner);
}

function loadTestCasesFromDirectories(fixturesDir: string, expectedExtension: string, scanner: FileSystemScanner): TestCase[] {
  const testCases: TestCase[] = [];
  const testDirs = scanner.getDirectoryNames(fixturesDir);
  
  for (const testDir of testDirs) {
    testCases.push(...processTestDirectory(testDir, fixturesDir, expectedExtension, scanner));
  }
  
  return testCases;
}

function processTestDirectory(testDir: string, fixturesDir: string, expectedExtension: string, scanner: FileSystemScanner): TestCase[] {
  const testPath = path.join(fixturesDir, testDir);
  const files = scanner.getTestDirectoryFiles(testPath);
  
  return getSingleFileTestCases(testDir, testPath, files, expectedExtension);
}


function getSingleFileTestCases(testDir: string, testPath: string, files: string[], expectedExtension: string): TestCase[] {
  const config = {
    testDir,
    testPath,
    expectedExtension
  };
  return TestCaseFactory.createSingleFileTestCases(config, files);
}

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {TestCase, TestMeta} from '../types/test-case-types';
import {extractMetaFromFile} from '../parsers/meta-parser';

export class TestCaseFactory {
  static createMultiFileTestCase(testDir: string, testPath: string, subDir: string): TestCase | null {
    const subDirPath = path.join(testPath, subDir);
    const metaFile = path.join(subDirPath, 'meta.yaml');
    
    if (!this.hasMetaFile(metaFile)) {
      return null;
    }
    
    return this.createTestCaseFromMetaFile(testDir, subDir, subDirPath, metaFile);
  }

  static createSingleFileTestCases(testDir: string, testPath: string, files: string[], expectedExtension: string): TestCase[] {
    const inputFiles = this.getInputFiles(files);
    return this.buildSingleFileTestCases(testDir, testPath, inputFiles, files, expectedExtension);
  }

  private static hasMetaFile(metaFile: string): boolean {
    return fs.existsSync(metaFile);
  }

  private static createTestCaseFromMetaFile(testDir: string, subDir: string, subDirPath: string, metaFile: string): TestCase {
    const meta = this.loadMetaFromFile(metaFile);
    return this.buildMultiFileTestCase(testDir, subDir, subDirPath, meta);
  }

  private static loadMetaFromFile(metaFile: string): TestMeta {
    return yaml.load(fs.readFileSync(metaFile, 'utf8')) as TestMeta;
  }

  private static buildMultiFileTestCase(testDir: string, subDir: string, subDirPath: string, meta: TestMeta): TestCase {
    return {
      name: `${testDir}/${subDir}`,
      description: meta.description,
      commands: meta.commands,
      inputFile: subDirPath,
      expectedFile: subDirPath,
      receivedFile: subDirPath
    };
  }

  private static getInputFiles(files: string[]): string[] {
    return files.filter(file => file.endsWith('.input.ts'));
  }

  private static buildSingleFileTestCases(testDir: string, testPath: string, inputFiles: string[], files: string[], expectedExtension: string): TestCase[] {
    const testCases: TestCase[] = [];
    
    for (const inputFile of inputFiles) {
      this.addTestCaseIfValid(testCases, testDir, testPath, inputFile, files, expectedExtension);
    }
    
    return testCases;
  }

  private static addTestCaseIfValid(testCases: TestCase[], testDir: string, testPath: string, inputFile: string, files: string[], expectedExtension: string): void {
    const testCase = this.createSingleFileTestCase(testDir, testPath, inputFile, files, expectedExtension);
    if (testCase) {
      testCases.push(testCase);
    }
  }

  private static createSingleFileTestCase(testDir: string, testPath: string, inputFile: string, files: string[], expectedExtension: string): TestCase | null {
    const baseName = inputFile.replace('.input.ts', '');
    const expectedFile = `${baseName}.expected.${expectedExtension}`;
    
    if (!files.includes(expectedFile)) {
      return null;
    }
    
    return this.buildTestCase(testDir, testPath, inputFile, baseName, expectedFile, expectedExtension);
  }

  private static buildTestCase(testDir: string, testPath: string, inputFile: string, baseName: string, expectedFile: string, expectedExtension: string): TestCase {
    return {
      name: `${testDir}/${baseName}`,
      inputFile: path.join(testPath, inputFile),
      ...(this.extractMetaFromInputFile(path.join(testPath, inputFile))),
      ...(this.buildTestPaths(testPath, baseName, expectedFile, expectedExtension))
    };
  }

  private static extractMetaFromInputFile(inputPath: string): TestMeta {
    const content = fs.readFileSync(inputPath, 'utf8');
    return extractMetaFromFile(content);
  }

  private static buildTestPaths(testPath: string, baseName: string, expectedFile: string, expectedExtension: string): { expectedFile: string; receivedFile: string } {
    return {
      expectedFile: path.join(testPath, expectedFile),
      receivedFile: path.join(testPath, `${baseName}.received.${expectedExtension}`)
    };
  }
}
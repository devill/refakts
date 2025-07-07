import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {TestCase, TestMeta} from '../types/test-case-types';
import {extractMetaFromFile} from '../parsers/meta-parser';
import {TestCaseConfiguration} from '../test-case-configuration';

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
    const baseName = inputFile.replace('.input.ts', '');
    const configuration = new TestCaseConfiguration(testDir, testPath, baseName, expectedExtension);
    const testCase = this.createSingleFileTestCase(configuration, files);
    if (testCase) {
      testCases.push(testCase);
    }
  }

  private static createSingleFileTestCase(configuration: TestCaseConfiguration, files: string[]): TestCase | null {
    const inputFile = `${configuration.baseName}.input.ts`;
    const expectedFile = `${configuration.baseName}.expected.${configuration.expectedExtension}`;
    
    if (!files.includes(expectedFile)) {
      return null;
    }
    
    return this.buildTestCase(configuration, inputFile, expectedFile);
  }

  private static buildTestCase(configuration: TestCaseConfiguration, inputFile: string, expectedFile: string): TestCase {
    return {
      name: `${configuration.testDir}/${configuration.baseName}`,
      inputFile: path.join(configuration.testPath, inputFile),
      ...(this.extractMetaFromInputFile(path.join(configuration.testPath, inputFile))),
      ...(this.buildTestPaths(configuration, expectedFile))
    };
  }

  private static extractMetaFromInputFile(inputPath: string): TestMeta {
    const content = fs.readFileSync(inputPath, 'utf8');
    return extractMetaFromFile(content);
  }

  private static buildTestPaths(configuration: TestCaseConfiguration, expectedFile: string): { expectedFile: string; receivedFile: string } {
    return {
      expectedFile: path.join(configuration.testPath, expectedFile),
      receivedFile: path.join(configuration.testPath, `${configuration.baseName}.received.${configuration.expectedExtension}`)
    };
  }
}
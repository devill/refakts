import * as fs from 'fs';
import * as path from 'path';
import {TestCase, TestMeta} from '../types/test-case-types';
import {extractMetaFromFile} from '../parsers/meta-parser';
import {TestCaseBuilder} from '../builders/test-case-builder';

export class TestCaseFactory {

  static createSingleFileTestCases(testDir: string, testPath: string, files: string[], expectedExtension: string): TestCase[] {
    const inputFiles = this.getInputFiles(files);
    return this.buildSingleFileTestCases(testDir, testPath, inputFiles, files, expectedExtension);
  }





  private static getInputFiles(files: string[]): string[] {
    return files.filter(file => file.endsWith('.input.ts'));
  }

  private static buildSingleFileTestCases(testDir: string, testPath: string, inputFiles: string[], files: string[], expectedExtension: string): TestCase[] {
    const testCases: TestCase[] = [];
    
    for (const inputFile of inputFiles) {
      const testCase = this.createTestCaseFromInput(testDir, testPath, inputFile, files, expectedExtension);
      if (testCase) {
        testCases.push(testCase);
      }
    }
    
    return testCases;
  }

  private static createTestCaseFromInput(testDir: string, testPath: string, inputFile: string, files: string[], expectedExtension: string): TestCase | null {
    const baseName = inputFile.replace('.input.ts', '');
    const expectedFile = `${baseName}.expected.${expectedExtension}`;
    
    if (!files.includes(expectedFile)) {
      return null;
    }
    
    return this.buildTestCaseWithBuilder(testDir, testPath, baseName, expectedExtension);
  }

  private static buildTestCaseWithBuilder(testDir: string, testPath: string, baseName: string, expectedExtension: string): TestCase {
    const meta = this.extractMetaFromInputFile(path.join(testPath, `${baseName}.input.ts`));
    
    return this.createBuilderWithPaths(testDir, testPath, baseName, expectedExtension)
      .withMeta(meta)
      .withStandardName()
      .withStandardFiles()
      .build();
  }

  private static createBuilderWithPaths(testDir: string, testPath: string, baseName: string, expectedExtension: string): TestCaseBuilder {
    return TestCaseBuilder.create()
      .withTestDir(testDir)
      .withTestPath(testPath)
      .withBaseName(baseName)
      .withExpectedExtension(expectedExtension);
  }


  private static extractMetaFromInputFile(inputPath: string): TestMeta {
    const content = fs.readFileSync(inputPath, 'utf8');
    return extractMetaFromFile(content);
  }

}
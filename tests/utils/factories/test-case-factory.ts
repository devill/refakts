import * as fs from 'fs';
import * as path from 'path';
import {TestCase, TestMeta} from '../types/test-case-types';
import {extractMetaFromFile} from '../parsers/meta-parser';
import {TestCaseBuilder} from '../builders/test-case-builder';

interface TestCaseFactoryConfig {
  testDir: string;
  testPath: string;
  expectedExtension: string;
}

interface FileProcessingContext {
  files: string[];
  inputFiles: string[];
  config: TestCaseFactoryConfig;
}

export class TestCaseFactory {

  static createSingleFileTestCases(config: TestCaseFactoryConfig, files: string[]): TestCase[] {
    const inputFiles = this.getInputFiles(files);
    const context: FileProcessingContext = {
      files,
      inputFiles,
      config
    };
    return this.buildSingleFileTestCases(context);
  }

  static createInputTestCase(inputFile: string): TestCase | null {
    const meta = this.extractMetaFromInputFile(inputFile);
    if (!meta.commands || meta.commands.length === 0) {
      return null;
    }
    
    const baseName = path.basename(inputFile, '.input.ts');
    const testDir = path.dirname(inputFile);
    const testPath = path.dirname(inputFile);
    
    return TestCaseBuilder.create()
      .withTestDir(path.basename(testDir))
      .withTestPath(testPath)
      .withBaseName(baseName)
      .withExpectedExtension('input')
      .withMeta(meta)
      .withInputFile(inputFile)
      .build();
  }





  private static getInputFiles(files: string[]): string[] {
    return files.filter(file => file.endsWith('.input.ts'));
  }

  private static buildSingleFileTestCases(context: FileProcessingContext): TestCase[] {
    const testCases: TestCase[] = [];
    
    this.processInputFiles(context, testCases);
    return testCases;
  }

  private static processInputFiles(context: FileProcessingContext, testCases: TestCase[]): void {
    for (const inputFile of context.inputFiles) {
      const testCase = this.createTestCaseFromInput(context, inputFile);
      if (testCase) {
        testCases.push(testCase);
      }
    }
  }

  private static createTestCaseFromInput(context: FileProcessingContext, inputFile: string): TestCase | null {
    const baseName = inputFile.replace('.input.ts', '');
    const expectedFile = `${baseName}.expected.${context.config.expectedExtension}`;
    
    if (!context.files.includes(expectedFile)) {
      return null;
    }
    
    return this.buildTestCaseWithBuilder(context.config, baseName);
  }

  private static buildTestCaseWithBuilder(config: TestCaseFactoryConfig, baseName: string): TestCase {
    const meta = this.extractMetaFromInputFile(path.join(config.testPath, `${baseName}.input.ts`));
    
    return this.createBuilderWithPaths(config, baseName)
      .withMeta(meta)
      .withStandardName()
      .withStandardFiles()
      .build();
  }

  private static createBuilderWithPaths(config: TestCaseFactoryConfig, baseName: string): TestCaseBuilder {
    return TestCaseBuilder.create()
      .withTestDir(config.testDir)
      .withTestPath(config.testPath)
      .withBaseName(baseName)
      .withExpectedExtension(config.expectedExtension);
  }


  private static extractMetaFromInputFile(inputPath: string): TestMeta {
    const content = fs.readFileSync(inputPath, 'utf8');
    return extractMetaFromFile(content);
  }

}
import * as fs from 'fs';
import * as path from 'path';
import {TestCase, TestMeta} from '../types/test-case-types';
import {extractMetaFromFile} from '../parsers/meta-parser';

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
    
    return this.createFromInputFile(inputFile, meta);
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
    
    return this.createWithConfig(config, baseName, meta);
  }



  private static extractMetaFromInputFile(inputPath: string): TestMeta {
    const content = fs.readFileSync(inputPath, 'utf8');
    return extractMetaFromFile(content);
  }

  private static createFromInputFile(inputFile: string, meta: TestMeta): TestCase {
    const name = path.relative(process.cwd(), inputFile).replace('.input.ts', '');
    
    return {
      name,
      description: meta.description,
      commands: meta.commands,
      inputFile,
      expectedFile: inputFile.replace('.input.ts', '.expected.ts'),
      receivedFile: inputFile.replace('.input.ts', '.received.ts'),
      skip: meta.skip
    };
  }

  private static createWithConfig(config: TestCaseFactoryConfig, baseName: string, meta: TestMeta): TestCase {
    const files = this.createTestFilePaths(config, baseName);
    
    return {
      name: `${config.testDir}/${baseName}`,
      description: meta.description,
      commands: meta.commands,
      ...files,
      skip: meta.skip
    };
  }

  private static createTestFilePaths(config: TestCaseFactoryConfig, baseName: string) {
    return {
      inputFile: path.join(config.testPath, `${baseName}.input.ts`),
      expectedFile: path.join(config.testPath, `${baseName}.expected.${config.expectedExtension}`),
      receivedFile: path.join(config.testPath, `${baseName}.received.${config.expectedExtension}`)
    };
  }

}
import * as fs from 'fs';
import * as path from 'path';
import {TestCase, TestMeta} from '../types/test-case-types';
import {extractMetaFromFile} from '../parsers/meta-parser';
import {FixtureLocation} from '../fixture-location';

interface FileProcessingContext {
  files: string[];
  inputFiles: string[];
  location: FixtureLocation;
  expectedExtension: string; // Keep for legacy compatibility
}

export class TestCaseFactory {

  static createSingleFileTestCases(testDir: string, testPath: string, expectedExtension: string, files: string[]): TestCase[] {
    return this.buildSingleFileTestCases({
      files,
      inputFiles: this.getInputFiles(files),
      location: new FixtureLocation(testDir, testPath, ''), // Placeholder location
      expectedExtension
    });
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
    const location = FixtureLocation.fromInputFile(inputFile);
    const expectedFile = location.getExpectedFile(context.expectedExtension);
    
    if (!context.files.includes(expectedFile)) {
      return null;
    }
    
    return this.createFromFixtureLocation(location);
  }

  private static createFromFixtureLocation(location: FixtureLocation): TestCase {
    const meta = this.extractMetaFromInputFile(location.getInputFile());
    
    return {
      name: location.getTestName(),
      inputFile: location.getInputFile(),
      expectedFile: location.getExpectedFile('ts'), // Default to .ts for legacy
      receivedFile: location.getReceivedFile('ts'),
      ...meta
    };
  }



  private static extractMetaFromInputFile(inputPath: string): TestMeta {
    const content = fs.readFileSync(inputPath, 'utf8');
    return extractMetaFromFile(content);
  }

  private static createFromInputFile(inputFile: string, meta: TestMeta): TestCase {
    const location = FixtureLocation.fromInputFile(inputFile);
    
    return {
      name: path.relative(process.cwd(), inputFile).replace('.input.ts', ''),
      inputFile: location.getInputFile(),
      expectedFile: location.getExpectedFile('ts'),
      receivedFile: location.getReceivedFile('ts'),
      ...meta
    };
  }


}
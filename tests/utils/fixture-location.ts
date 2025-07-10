import * as path from 'path';
import * as fs from 'fs';
import { TestCase, TestMeta } from './types/test-case-types';
import { extractMetaFromFile } from './parsers/meta-parser';

interface TestDirectoryContext {
  testDir: string;
  testPath: string;
  files: string[];
}

export class FixtureLocation {
  constructor(
    private testDir: string,
    private testPath: string,
    private baseName: string
  ) {
    void testDir; void testPath; void baseName;
  }

  getTestName(): string {
    return `${this.testDir}/${this.baseName}`;
  }

  getInputFile(): string {
    return path.join(this.testPath, `${this.baseName}.input.ts`);
  }

  getExpectedFile(extension = 'ts'): string {
    return path.join(this.testPath, `${this.baseName}.expected.${extension}`);
  }

  getReceivedFile(extension = 'ts'): string {
    return path.join(this.testPath, `${this.baseName}.received.${extension}`);
  }

  getAllExpectedFiles(): { ts?: string; out?: string; err?: string; yaml?: string } {
    return {
      ts: this.getExpectedFile('ts'),
      out: this.getExpectedFile('out'),
      err: this.getExpectedFile('err'),
      yaml: this.getExpectedFile('yaml')
    };
  }

  getAllReceivedFiles(): { ts: string; out: string; err: string; yaml: string } {
    return {
      ts: this.getReceivedFile('ts'),
      out: this.getReceivedFile('out'),
      err: this.getReceivedFile('err'),
      yaml: this.getReceivedFile('yaml')
    };
  }

  static fromInputFile(inputFile: string): FixtureLocation {
    const testPath = path.dirname(inputFile);
    const baseName = path.basename(inputFile, '.input.ts');
    const testDir = path.basename(testPath);
    
    return new FixtureLocation(testDir, testPath, baseName);
  }

  createTestCase(): TestCase {
    return {
      name: this.getTestName(),
      inputFile: this.getInputFile(),
      expectedFile: this.getExpectedFile('ts'),
      receivedFile: this.getReceivedFile('ts'),
      ...this.extractMeta()
    };
  }

  createTestCaseIfExpectedExists(expectedExtension: string, availableFiles: string[]): TestCase | null {
    const expectedFile = this.getExpectedFile(expectedExtension);
    return availableFiles.includes(expectedFile) ? this.createTestCase() : null;
  }

  static createTestCaseFromInputFile(inputFile: string): TestCase {
    const testPath = path.dirname(inputFile);
    const baseName = path.basename(inputFile, '.input.ts');
    const testDir = path.basename(testPath);
    
    const location = new FixtureLocation(testDir, testPath, baseName);
    const testCase = location.createTestCase();
    testCase.name = path.relative(process.cwd(), inputFile).replace('.input.ts', '');
    return testCase;
  }

  static createInputTestCase(inputFile: string): TestCase | null {
    const content = fs.readFileSync(inputFile, 'utf8');
    const meta = extractMetaFromFile(content);
    if (!meta.commands || meta.commands.length === 0) {
      return null;
    }
    
    return FixtureLocation.createTestCaseFromInputFile(inputFile);
  }

  private extractMeta(): TestMeta {
    const content = fs.readFileSync(this.getInputFile(), 'utf8');
    return extractMetaFromFile(content);
  }

  static createSingleFileTestCases(context: TestDirectoryContext, expectedExtension: string): TestCase[] {
    const inputFiles = context.files.filter(file => file.endsWith('.input.ts'));
    return this.processInputFiles(inputFiles, context.files, expectedExtension);
  }

  private static processInputFiles(inputFiles: string[], files: string[], expectedExtension: string): TestCase[] {
    return inputFiles
      .map(inputFile => this.createTestCaseIfValid(inputFile, files, expectedExtension))
      .filter((testCase): testCase is TestCase => testCase !== null);
  }

  private static createTestCaseIfValid(inputFile: string, files: string[], expectedExtension: string): TestCase | null {
    const { testPath, baseName } = this.parseInputFile(inputFile);
    const expectedFile = path.join(testPath, `${baseName}.expected.${expectedExtension}`);
    
    return files.includes(expectedFile) ? this.createTestCaseFromParts(testPath, baseName) : null;
  }

  private static parseInputFile(inputFile: string) {
    return {
      testPath: path.dirname(inputFile),
      baseName: path.basename(inputFile, '.input.ts')
    };
  }

  private static createTestCaseFromParts(testPath: string, baseName: string): TestCase {
    const testDir = path.basename(testPath);
    const location = new FixtureLocation(testDir, testPath, baseName);
    return location.createTestCase();
  }
}
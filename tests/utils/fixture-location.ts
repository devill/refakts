import * as path from 'path';
import * as fs from 'fs';
import { TestCase, TestMeta } from './types/test-case-types';
import { extractMetaFromFile } from './parsers/meta-parser';

export class FixtureLocation {
  constructor(
    private testDir: string,
    private testPath: string,
    private baseName: string
  ) {}

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
    const meta = this.extractMeta();
    
    return {
      name: this.getTestName(),
      inputFile: this.getInputFile(),
      expectedFile: this.getExpectedFile('ts'),
      receivedFile: this.getReceivedFile('ts'),
      ...meta
    };
  }

  static createTestCaseFromInputFile(inputFile: string): TestCase {
    const location = FixtureLocation.fromInputFile(inputFile);
    
    return {
      name: path.relative(process.cwd(), inputFile).replace('.input.ts', ''),
      inputFile: location.getInputFile(),
      expectedFile: location.getExpectedFile('ts'),
      receivedFile: location.getReceivedFile('ts'),
      ...location.extractMeta()
    };
  }

  private extractMeta(): TestMeta {
    const content = fs.readFileSync(this.getInputFile(), 'utf8');
    return extractMetaFromFile(content);
  }

  static createSingleFileTestCases(testDir: string, testPath: string, expectedExtension: string, files: string[]): TestCase[] {
    const inputFiles = files.filter(file => file.endsWith('.input.ts'));
    return this.processInputFiles(inputFiles, files, expectedExtension);
  }

  private static processInputFiles(inputFiles: string[], files: string[], expectedExtension: string): TestCase[] {
    const testCases: TestCase[] = [];
    
    for (const inputFile of inputFiles) {
      const testCase = this.createTestCaseIfValid(inputFile, files, expectedExtension);
      if (testCase) {
        testCases.push(testCase);
      }
    }
    
    return testCases;
  }

  private static createTestCaseIfValid(inputFile: string, files: string[], expectedExtension: string): TestCase | null {
    const location = FixtureLocation.fromInputFile(inputFile);
    const expectedFile = location.getExpectedFile(expectedExtension);
    
    return files.includes(expectedFile) ? location.createTestCase() : null;
  }
}
import * as path from 'path';
import { TestCase, TestMeta } from '../types/test-case-types';

export class TestCaseBuilder {
  private testCase: Partial<TestCase> = {};
  private testDir = '';
  private testPath = '';
  private baseName = '';
  private expectedExtension = 'ts';

  withTestDir(testDir: string): TestCaseBuilder {
    this.testDir = testDir;
    return this;
  }

  withTestPath(testPath: string): TestCaseBuilder {
    this.testPath = testPath;
    return this;
  }

  withBaseName(baseName: string): TestCaseBuilder {
    this.baseName = baseName;
    return this;
  }

  withExpectedExtension(extension: string): TestCaseBuilder {
    this.expectedExtension = extension;
    return this;
  }

  withMeta(meta: TestMeta): TestCaseBuilder {
    this.testCase.description = meta.description;
    this.testCase.commands = meta.commands;
    if (meta.skip !== undefined) {
      this.testCase.skip = meta.skip;
    }
    return this;
  }


  withStandardFiles(): TestCaseBuilder {
    this.validateFilePathRequirements();
    this.assignStandardFilePaths();
    return this;
  }

  private validateFilePathRequirements(): void {
    if (!this.testPath || !this.baseName) {
      throw new Error('testPath and baseName must be set before calling withStandardFiles()');
    }
  }

  private assignStandardFilePaths(): void {
    this.testCase.inputFile = path.join(this.testPath, `${this.baseName}.input.ts`);
    this.testCase.expectedFile = path.join(this.testPath, `${this.baseName}.expected.${this.expectedExtension}`);
    this.testCase.receivedFile = path.join(this.testPath, `${this.baseName}.received.${this.expectedExtension}`);
  }

  withStandardName(): TestCaseBuilder {
    if (!this.testDir || !this.baseName) {
      throw new Error('testDir and baseName must be set before calling withStandardName()');
    }

    this.testCase.name = `${this.testDir}/${this.baseName}`;
    return this;
  }

  build(): TestCase {
    this.validateRequiredFields();
    return this.testCase as TestCase;
  }

  private validateRequiredFields(): void {
    this.validateField(this.testCase.name, 'Test case name is required');
    this.validateField(this.testCase.description, 'Test case description is required');
    this.validateCommands();
    this.validateField(this.testCase.inputFile, 'Test case inputFile is required');
    this.validateField(this.testCase.expectedFile, 'Test case expectedFile is required');
    this.validateField(this.testCase.receivedFile, 'Test case receivedFile is required');
  }

  private validateField(field: string | undefined, message: string): void {
    if (!field) {
      throw new Error(message);
    }
  }

  private validateCommands(): void {
    if (!this.testCase.commands || this.testCase.commands.length === 0) {
      throw new Error('Test case commands are required');
    }
  }

  static create(): TestCaseBuilder {
    return new TestCaseBuilder();
  }
}
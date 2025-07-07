import * as path from 'path';
import { TestCase, TestMeta } from '../types/test-case-types';

/**
 * Builder class for creating TestCase objects using the builder pattern.
 * Provides a fluent interface for constructing test cases with various parameters.
 */
export class TestCaseBuilder {
  private testCase: Partial<TestCase> = {};
  private testDir = '';
  private testPath = '';
  private baseName = '';
  private expectedExtension = 'ts';

  /**
   * Sets the test name.
   */
  withName(name: string): TestCaseBuilder {
    this.testCase.name = name;
    return this;
  }

  /**
   * Sets the test description.
   */
  withDescription(description: string): TestCaseBuilder {
    this.testCase.description = description;
    return this;
  }

  /**
   * Sets the commands array.
   */
  withCommands(commands: string[]): TestCaseBuilder {
    this.testCase.commands = commands;
    return this;
  }

  /**
   * Sets a single command (converts to array internally).
   */
  withCommand(command: string): TestCaseBuilder {
    this.testCase.commands = [command];
    return this;
  }

  /**
   * Sets the input file path.
   */
  withInputFile(inputFile: string): TestCaseBuilder {
    this.testCase.inputFile = inputFile;
    return this;
  }

  /**
   * Sets the expected file path.
   */
  withExpectedFile(expectedFile: string): TestCaseBuilder {
    this.testCase.expectedFile = expectedFile;
    return this;
  }

  /**
   * Sets the received file path.
   */
  withReceivedFile(receivedFile: string): TestCaseBuilder {
    this.testCase.receivedFile = receivedFile;
    return this;
  }

  /**
   * Sets whether the test should be skipped.
   */
  withSkip(skip = true): TestCaseBuilder {
    this.testCase.skip = skip;
    return this;
  }

  /**
   * Sets the test directory for path construction.
   */
  withTestDir(testDir: string): TestCaseBuilder {
    this.testDir = testDir;
    return this;
  }

  /**
   * Sets the test path for path construction.
   */
  withTestPath(testPath: string): TestCaseBuilder {
    this.testPath = testPath;
    return this;
  }

  /**
   * Sets the base name for file construction.
   */
  withBaseName(baseName: string): TestCaseBuilder {
    this.baseName = baseName;
    return this;
  }

  /**
   * Sets the expected file extension.
   */
  withExpectedExtension(extension: string): TestCaseBuilder {
    this.expectedExtension = extension;
    return this;
  }

  /**
   * Sets test metadata (description, commands, skip).
   */
  withMeta(meta: TestMeta): TestCaseBuilder {
    this.testCase.description = meta.description;
    this.testCase.commands = meta.commands;
    if (meta.skip !== undefined) {
      this.testCase.skip = meta.skip;
    }
    return this;
  }

  /**
   * Builds standard file paths using the configured base name and paths.
   * This method automatically constructs inputFile, expectedFile, and receivedFile
   * based on the testPath, baseName, and expectedExtension.
   */
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

  /**
   * Builds standard name using testDir and baseName.
   */
  withStandardName(): TestCaseBuilder {
    if (!this.testDir || !this.baseName) {
      throw new Error('testDir and baseName must be set before calling withStandardName()');
    }

    this.testCase.name = `${this.testDir}/${this.baseName}`;
    return this;
  }


  /**
   * Builds the final TestCase object.
   */
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

  /**
   * Creates a new builder instance for chaining.
   */
  static create(): TestCaseBuilder {
    return new TestCaseBuilder();
  }
}
/* eslint-disable no-unused-vars */
import * as fs from 'fs';
import * as path from 'path';

export interface FixtureTestCaseConfig {
  name: string;
  description: string;
  commands: string[];
  inputFile: string;
  expectedFile: string;
  receivedFile: string;
  skip?: boolean | string;
  projectDirectory?: string;
  expectedDirectory?: string;
  testCaseId?: string;
}

export class FixtureTestCase {
  constructor(
    public name: string,
    public description: string,
    public commands: string[],
    public inputFile: string,
    public expectedFile: string,
    public receivedFile: string,
    public skip?: boolean | string,
    public projectDirectory?: string,
    public expectedDirectory?: string,
    public testCaseId?: string
  ) {}

  static create(config: FixtureTestCaseConfig): FixtureTestCase {
    const { name, description, commands, inputFile, expectedFile, receivedFile, skip, projectDirectory, expectedDirectory, testCaseId } = config;
    return new FixtureTestCase(name, description, commands, inputFile, expectedFile, receivedFile, skip, projectDirectory, expectedDirectory, testCaseId);
  }

  isMultiFile(): boolean {
    return !!this.projectDirectory;
  }

  isSingleFile(): boolean {
    return !this.isMultiFile();
  }

  getWorkingDirectory(): string {
    return this.projectDirectory || process.cwd();
  }

  writeReceivedFiles(outputs: any): { outFile: string; errFile: string } {
    const receivedFiles = this.createExpectedFilePaths();
    
    fs.writeFileSync(receivedFiles.outFile, outputs.stdout || '');
    fs.writeFileSync(receivedFiles.errFile, outputs.stderr || '');
    
    return receivedFiles;
  }

  createExpectedFilePaths(): { outFile: string; errFile: string } {
    return {
      outFile: path.join(path.dirname(this.inputFile), `${this.testCaseId}.received.out`),
      errFile: path.join(path.dirname(this.inputFile), `${this.testCaseId}.received.err`)
    };
  }
}
export interface TestCase {
  name: string;
  description: string;
  commands: string[];
  inputFile: string;
  expectedFile: string;
  receivedFile: string;
  skip?: boolean | string;
}

export interface TestMeta {
  description: string;
  commands: string[];
  skip?: boolean | string;
}
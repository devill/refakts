import * as fs from 'fs';
import * as path from 'path';
import { CommandExecutor } from './command-executor';
import { FixtureTestCase } from './test-case-loader';
import { FileOperations } from './file-operations';

export class MultiFileValidator {
  private commandExecutor: CommandExecutor;
  private fileOperations: FileOperations;
  
  constructor(commandExecutor: CommandExecutor) {
    this.commandExecutor = commandExecutor;
    this.fileOperations = new FileOperations();
  }

  async validate(testCase: FixtureTestCase): Promise<void> {
    const receivedDir = this.getMultiFileReceivedPath(testCase.inputFile);
    this.setupMultiFileProject(testCase.inputFile, receivedDir);
    
    const outputs = await this.executeMultiFileCommand(testCase, receivedDir);
    const receivedFiles = testCase.writeReceivedFiles(outputs);
    
    this.validateAndCleanupMultiFile(testCase, receivedFiles);
  }

  private setupMultiFileProject(inputDir: string, receivedDir: string): void {
    this.fileOperations.copyDirectory(inputDir, receivedDir);
  }

  private async executeMultiFileCommand(testCase: FixtureTestCase, receivedDir: string): Promise<{
    stdout: string; stderr: string; success: boolean;
  }> {
    const command = this.prepareMultiFileCommand(testCase.commands[0], receivedDir);
    return this.runCommand(command, receivedDir);
  }

  private prepareMultiFileCommand(command: string, receivedDir: string): string {
    const cleanCommand = this.removeRefaktsPrefix(command);
    return cleanCommand.replace(/input\//g, path.basename(receivedDir) + '/');
  }

  private validateAndCleanupMultiFile(testCase: FixtureTestCase, receivedFiles: any): void {
    try {
      this.compareWithExpectedMultiFile(testCase, receivedFiles);
      this.cleanupMultiFileReceivedFiles(testCase, receivedFiles, true);
    } catch (error) {
      this.cleanupMultiFileReceivedFiles(testCase, receivedFiles, false);
      throw error;
    }
  }

  private compareWithExpectedMultiFile(testCase: FixtureTestCase, receivedFiles: any): void {
    const expectedFiles = this.createExpectedFilePaths(testCase);
    
    this.compareIfExpected(expectedFiles.outFile, receivedFiles.outFile);
    this.compareIfExpected(expectedFiles.errFile, receivedFiles.errFile);
    
    if (testCase.expectedDirectory && fs.existsSync(testCase.expectedDirectory)) {
      this.compareDirectories(testCase.expectedDirectory, this.getMultiFileReceivedPath(testCase.inputFile));
    }
  }

  private createExpectedFilePaths(testCase: FixtureTestCase) {
    return {
      outFile: path.join(path.dirname(testCase.inputFile), `${testCase.testCaseId}.expected.out`),
      errFile: path.join(path.dirname(testCase.inputFile), `${testCase.testCaseId}.expected.err`)
    };
  }

  private compareIfExpected(expectedFile: string, receivedFile: string): void {
    if (fs.existsSync(expectedFile)) {
      this.validateReceivedFileExists(expectedFile, receivedFile);
      this.compareFileContents(expectedFile, receivedFile);
    }
  }

  private validateReceivedFileExists(expectedFile: string, receivedFile: string): void {
    if (!fs.existsSync(receivedFile)) {
      throw new Error(`Expected file ${expectedFile} exists but received file ${receivedFile} was not generated`);
    }
  }

  private compareFileContents(expectedFile: string, receivedFile: string): void {
    const { normalizedExpected, normalizedReceived } = this.readAndNormalizeFiles(expectedFile, receivedFile);
    
    if (normalizedReceived !== normalizedExpected) {
      throw this.createMismatchError(receivedFile, normalizedExpected, normalizedReceived);
    }
  }

  private readAndNormalizeFiles(expectedFile: string, receivedFile: string) {
    const expected = fs.readFileSync(expectedFile, 'utf8').trim();
    const received = fs.readFileSync(receivedFile, 'utf8').trim();
    
    return {
      normalizedExpected: this.normalizePaths(expected),
      normalizedReceived: this.normalizePaths(received)
    };
  }

  private createMismatchError(receivedFile: string, expected: string, received: string): Error {
    return new Error(`Content mismatch in ${receivedFile}.
Expected:
${expected}
Received:
${received}`);
  }

  private normalizePaths(content: string): string {
    const projectRoot = process.cwd();
    return content.replace(new RegExp(projectRoot.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'g'), '.');
  }

  private compareDirectories(expectedDir: string, receivedDir: string): void {
    if (!fs.existsSync(receivedDir)) {
      throw new Error(`Expected directory ${expectedDir} exists but received directory ${receivedDir} was not generated`);
    }
    
    return;
  }

  private cleanupMultiFileReceivedFiles(testCase: FixtureTestCase, receivedFiles: any, testPassed: boolean): void {
    const receivedDir = this.getMultiFileReceivedPath(testCase.inputFile);
    if (fs.existsSync(receivedDir)) {
      if (testPassed) {
        fs.rmSync(receivedDir, { recursive: true, force: true });
      }
    }
    
    Object.values(receivedFiles).forEach((file: any) => {
      if (fs.existsSync(file)) {
        this.cleanupSingleFile(file, testPassed);
      }
    });
  }

  private cleanupSingleFile(file: string, testPassed: boolean): void {
    if (testPassed) {
      fs.unlinkSync(file);
    } else {
      this.cleanupFailedTestFile(file);
    }
  }

  private cleanupFailedTestFile(file: string): void {
    const expectedFile = file.replace('.received.', '.expected.');
    if (!fs.existsSync(expectedFile)) {
      fs.unlinkSync(file);
    }
  }

  private getMultiFileReceivedPath(inputDir: string): string {
    const parentDir = path.dirname(inputDir);
    const baseName = path.basename(inputDir);
    return path.join(parentDir, `${baseName}.received`);
  }

  private removeRefaktsPrefix(command: string): string {
    return command.replace(/^refakts\s+/, '').trim();
  }

  private async runCommand(command: string, cwd: string = process.cwd()): Promise<{ stdout: string; stderr: string; success: boolean }> {
    try {
      const output = await this.commandExecutor.executeCommand(command, cwd);
      return { stdout: typeof output === 'string' ? output : '', stderr: '', success: true };
    } catch (error) {
      return { stdout: '', stderr: (error as Error).message, success: false };
    }
  }
}
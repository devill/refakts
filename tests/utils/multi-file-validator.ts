import * as fs from 'fs';
import * as path from 'path';
import { CommandExecutor } from './command-executor';
import { FixtureTestCase } from './test-case-loader';
import { FileOperations } from './file-operations';
import { TestUtilities } from './test-utilities';

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
    this.compareOutputFiles(testCase, receivedFiles);
    this.compareProjectDirectory(testCase);
  }

  private compareOutputFiles(testCase: FixtureTestCase, receivedFiles: any): void {
    const expectedFiles = testCase.createExpectedFilePaths();
    const expectedOutFile = expectedFiles.outFile.replace('.received.', '.expected.');
    const expectedErrFile = expectedFiles.errFile.replace('.received.', '.expected.');
    
    this.compareIfExpected(expectedOutFile, receivedFiles.outFile);
    this.compareIfExpected(expectedErrFile, receivedFiles.errFile);
  }

  private compareProjectDirectory(testCase: FixtureTestCase): void {
    if (testCase.expectedDirectory && fs.existsSync(testCase.expectedDirectory)) {
      this.compareDirectories(testCase.expectedDirectory, this.getMultiFileReceivedPath(testCase.inputFile));
    }
  }

  private compareIfExpected(expectedFile: string, receivedFile: string): void {
    TestUtilities.compareIfExpected(expectedFile, receivedFile);
  }

  private compareDirectories(expectedDir: string, receivedDir: string): void {
    if (!fs.existsSync(receivedDir)) {
      throw new Error(`Expected directory ${expectedDir} exists but received directory ${receivedDir} was not generated`);
    }
    
    return;
  }

  private cleanupMultiFileReceivedFiles(testCase: FixtureTestCase, receivedFiles: any, testPassed: boolean): void {
    this.cleanupReceivedDirectory(testCase, testPassed);
    this.cleanupReceivedOutputFiles(receivedFiles, testPassed);
  }

  private cleanupReceivedDirectory(testCase: FixtureTestCase, testPassed: boolean): void {
    const receivedDir = this.getMultiFileReceivedPath(testCase.inputFile);
    if (fs.existsSync(receivedDir) && testPassed) {
      fs.rmSync(receivedDir, { recursive: true, force: true });
    }
  }

  private cleanupReceivedOutputFiles(receivedFiles: any, testPassed: boolean): void {
    Object.values(receivedFiles).forEach((file: any) => {
      if (fs.existsSync(file)) {
        TestUtilities.cleanupSingleFile(file, testPassed);
      }
    });
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
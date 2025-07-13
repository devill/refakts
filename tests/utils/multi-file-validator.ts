import * as fs from 'fs';
import * as path from 'path';
import {CommandExecutor} from './command-executor';
import {FixtureTestCase} from './test-case-loader';
import {FileOperations} from './file-operations';
import {CommandRunner} from './command-runner';
import {TestUtilities} from './test-utilities';

export class MultiFileValidator {
  private commandExecutor: CommandExecutor;
  private fileOperations: FileOperations;
  private commandRunner: CommandRunner;
  
  constructor(commandExecutor: CommandExecutor) {
    this.commandExecutor = commandExecutor;
    this.fileOperations = new FileOperations();
    this.commandRunner = new CommandRunner(this.commandExecutor);
  }

  async validate(testCase: FixtureTestCase): Promise<void> {
    const receivedDir = this.getMultiFileReceivedPath(testCase.inputFile, testCase.testCaseId);
    await this.setupMultiFileProject(testCase.inputFile, receivedDir);
    
    const outputs = await this.executeMultiFileCommand(testCase, receivedDir);
    const receivedFiles = testCase.writeReceivedFiles(outputs);
    
    this.validateAndCleanupMultiFile(testCase, receivedFiles);
  }

  private async setupMultiFileProject(inputDir: string, receivedDir: string): Promise<void> {
    await this.fileOperations.copyDirectory(inputDir, receivedDir);
  }

  private async executeMultiFileCommand(testCase: FixtureTestCase, receivedDir: string): Promise<{
    stdout: string; stderr: string; success: boolean;
  }> {
    const command = this.prepareMultiFileCommand(testCase.commands[0]);
    const workingDir = receivedDir;
    return this.commandRunner.runCommand(command, workingDir);
  }

  private prepareMultiFileCommand(command: string): string {
    const cleanCommand = this.removeRefaktsPrefix(command);
    return cleanCommand.replace(/input\//g, '');
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
    
    this.validateHasExpectedFiles(testCase, expectedOutFile, expectedErrFile);
    
    this.compareIfExpected(expectedOutFile, receivedFiles.outFile);
    this.compareIfExpected(expectedErrFile, receivedFiles.errFile);
  }

  private validateHasExpectedFiles(testCase: FixtureTestCase, expectedOutFile: string, expectedErrFile: string): void {
    if (testCase.skip) {
      return;
    }

    if (MultiFileValidator.hasExpectation(expectedOutFile, expectedErrFile, testCase)) {
      throw new Error(`Test ${testCase.testCaseId} has no expected files (.expected.out, .expected.err, or .expected/ directory)`);
    }
  }

  private static hasExpectation(expectedOutFile: string, expectedErrFile: string, testCase: FixtureTestCase) {
    return !fs.existsSync(expectedOutFile) && !fs.existsSync(expectedErrFile) && !MultiFileValidator.hasExpectedDirectory(testCase);
  }

  private static hasExpectedDirectory(testCase: FixtureTestCase) {
    return testCase.expectedDirectory && fs.existsSync(testCase.expectedDirectory);
  }

  private compareProjectDirectory(testCase: FixtureTestCase): void {
    if (testCase.expectedDirectory && fs.existsSync(testCase.expectedDirectory)) {
      this.compareDirectories(testCase.expectedDirectory, this.getMultiFileReceivedPath(testCase.inputFile, testCase.testCaseId));
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
    const receivedDir = this.getMultiFileReceivedPath(testCase.inputFile, testCase.testCaseId);
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

  private getMultiFileReceivedPath(inputDir: string, testCaseId?: string): string {
    const parentDir = path.dirname(inputDir);
    const prefix = testCaseId ? `${testCaseId}.` : '';
    return path.join(parentDir, `${prefix}received`);
  }

  private removeRefaktsPrefix(command: string): string {
    return command.replace(/^refakts\s+/, '').trim();
  }
}
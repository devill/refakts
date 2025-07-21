import * as fs from 'fs';
import * as path from 'path';
import {CommandExecutor} from './command-executor';
import {TestCase} from './test-case-loader';
import {TestUtilities} from './test-utilities';
import {CommandRunner} from './command-runner';
import {TestValidator} from './test-validator';
import { FileCleanupMixin } from './file-cleanup-mixin';

export class SingleFileValidator implements TestValidator {
  private commandExecutor: CommandExecutor;
  private commandRunner: CommandRunner;
  
  constructor(commandExecutor: CommandExecutor) {
    this.commandExecutor = commandExecutor;
    this.commandRunner = new CommandRunner(commandExecutor);
  }

  async validate(testCase: TestCase): Promise<void> {
    const receivedTsFile = this.getReceivedPath(testCase.inputFile, '.ts');
    this.setupTestFile(testCase.inputFile, receivedTsFile);
    
    const outputs = await this.executeCommand(testCase, receivedTsFile);
    const receivedFiles = this.writeReceivedFiles(testCase.inputFile, outputs);
    
    this.validateAndCleanup(testCase, receivedFiles);
  }

  private validateAndCleanup(testCase: TestCase, receivedFiles: any): void {
    try {
      this.compareWithExpected(testCase, receivedFiles);
      this.cleanupReceivedFiles(receivedFiles, true);
    } catch (error) {
      this.cleanupReceivedFiles(receivedFiles, false);
      throw error;
    }
  }

  private setupTestFile(inputFile: string, receivedFile: string): void {
    fs.copyFileSync(inputFile, receivedFile);
  }

  private async executeCommand(testCase: TestCase, receivedFile: string): Promise<{
    stdout: string; stderr: string; fileContent: string; success: boolean;
  }> {
    const command = this.prepareCommand(testCase.commands[0], receivedFile);
    const executionResult = await this.runCommand(command, process.cwd());
    return { ...executionResult, fileContent: this.readFileContent(receivedFile) };
  }

  private prepareCommand(command: string, receivedFile: string): string {
    const cleanCommand = this.removeRefaktsPrefix(command);
    return this.replaceInputFileReference(cleanCommand, receivedFile);
  }

  private writeReceivedFiles(inputFile: string, outputs: any): {
    tsFile: string;
    outFile: string;
    errFile: string;
  } {
    const receivedFiles = this.createReceivedFilePaths(inputFile);
    this.writeAllReceivedFiles(receivedFiles, outputs);
    return receivedFiles;
  }

  private compareWithExpected(testCase: TestCase, receivedFiles: any): void {
    const expectedFiles = this.createExpectedFilePaths(testCase.inputFile);
    
    this.validateHasExpectedFiles(testCase, expectedFiles);
    
    this.compareIfExpected(expectedFiles.tsFile, receivedFiles.tsFile);
    this.compareIfExpected(expectedFiles.outFile, receivedFiles.outFile);
    this.compareIfExpected(expectedFiles.errFile, receivedFiles.errFile);
  }

  private validateHasExpectedFiles(testCase: TestCase, expectedFiles: any): void {
    if (testCase.skip) {
      return;
    }

    if (!SingleFileValidator.hasAnyExpectedFile(expectedFiles)) {
      throw new Error(`Test ${path.basename(testCase.inputFile)} has no expected files (.expected.ts, .expected.out, or .expected.err)`);
    }
  }

  private static hasAnyExpectedFile(expectedFiles: any) {
    return Object.values(expectedFiles).some((file: any) =>
        fs.existsSync(file)
    );
  }

  private createExpectedFilePaths(inputFile: string) {
    return {
      tsFile: this.getExpectedPath(inputFile, '.ts'),
      outFile: this.getExpectedPath(inputFile, '.out'),
      errFile: this.getExpectedPath(inputFile, '.err')
    };
  }

  private compareIfExpected(expectedFile: string, receivedFile: string): void {
    TestUtilities.compareIfExpected(expectedFile, receivedFile);
  }

  private cleanupReceivedFiles(receivedFiles: any, testPassed: boolean): void {
    FileCleanupMixin.cleanupReceivedFiles(receivedFiles, testPassed);
  }

  private getReceivedPath(inputFile: string, extension: string): string {
    return inputFile.replace('.input.ts', `.received${extension}`);
  }

  private getExpectedPath(inputFile: string, extension: string): string {
    return inputFile.replace('.input.ts', `.expected${extension}`);
  }

  private removeRefaktsPrefix(command: string): string {
    return command.replace(/^refakts\s+/, '').trim();
  }

  private replaceInputFileReference(command: string, receivedFile: string): string {
    const inputFileName = path.basename(receivedFile).replace('.received.ts', '.input.ts');
    return command.replace(inputFileName, receivedFile);
  }

  private writeOutputIfPresent(filePath: string, output: string): void {
    TestUtilities.writeOutputIfPresent(filePath, output);
  }

  private readFileContent(filePath: string): string {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read received file ${filePath}. Ensure file was properly set up. Original error: ${error}`);
    }
  }

  private createReceivedFilePaths(inputFile: string): { tsFile: string; outFile: string; errFile: string } {
    return {
      tsFile: this.getReceivedPath(inputFile, '.ts'),
      outFile: this.getReceivedPath(inputFile, '.out'), 
      errFile: this.getReceivedPath(inputFile, '.err')
    };
  }

  private writeAllReceivedFiles(receivedFiles: any, outputs: any): void {
    fs.writeFileSync(receivedFiles.tsFile, outputs.fileContent);
    this.writeOutputIfPresent(receivedFiles.outFile, outputs.stdout);
    this.writeOutputIfPresent(receivedFiles.errFile, outputs.stderr);
  }

  private async runCommand(command: string, cwd: string = process.cwd()): Promise<{ stdout: string; stderr: string; success: boolean }> {
    return this.commandRunner.runCommand(command, cwd);
  }
}
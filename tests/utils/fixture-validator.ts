import * as fs from 'fs';
import * as path from 'path';
import { CommandExecutor } from './command-executor';
import { TestCase } from './test-case-loader';

export class FixtureValidator {
  private commandExecutor: CommandExecutor;
  
  constructor(commandExecutor: CommandExecutor) {
    this.commandExecutor = commandExecutor;
  }

  async validate(testCase: TestCase): Promise<void> {
    const receivedTsFile = this.getReceivedPath(testCase.inputFile, '.ts');
    this.setupTestFile(testCase.inputFile, receivedTsFile);
    
    const outputs = await this.executeCommand(testCase, receivedTsFile);
    const receivedFiles = this.writeReceivedFiles(testCase.inputFile, outputs);
    
    this.validateAndCleanup(testCase.inputFile, receivedFiles);
  }

  private validateAndCleanup(inputFile: string, receivedFiles: any): void {
    try {
      this.compareWithExpected(inputFile, receivedFiles);
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
    const executionResult = await this.runCommand(command);
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

  private compareWithExpected(inputFile: string, receivedFiles: any): void {
    const expectedFiles = this.createExpectedFilePaths(inputFile);
    
    this.compareIfExpected(expectedFiles.tsFile, receivedFiles.tsFile);
    this.compareIfExpected(expectedFiles.outFile, receivedFiles.outFile);
    this.compareIfExpected(expectedFiles.errFile, receivedFiles.errFile);
  }

  private createExpectedFilePaths(inputFile: string) {
    return {
      tsFile: this.getExpectedPath(inputFile, '.ts'),
      outFile: this.getExpectedPath(inputFile, '.out'),
      errFile: this.getExpectedPath(inputFile, '.err')
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
    return new Error(`Content mismatch in ${receivedFile}.\nExpected:\n${expected}\nReceived:\n${received}`);
  }

  private normalizePaths(content: string): string {
    const projectRoot = process.cwd();
    return content.replace(new RegExp(projectRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '.');
  }

  private cleanupReceivedFiles(receivedFiles: any, testPassed: boolean): void {
    Object.values(receivedFiles).forEach((file: any) => {
      if (fs.existsSync(file)) {
        this.cleanupSingleFile(file, testPassed);
      }
    });
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
    if (output.trim()) {
      fs.writeFileSync(filePath, output.trim());
    }
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

  private async runCommand(command: string): Promise<{ stdout: string; stderr: string; success: boolean }> {
    try {
      const output = await this.commandExecutor.executeCommand(command);
      return { stdout: typeof output === 'string' ? output : '', stderr: '', success: true };
    } catch (error) {
      return { stdout: '', stderr: (error as Error).message, success: false };
    }
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
}
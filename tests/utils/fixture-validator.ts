import * as fs from 'fs';
import * as path from 'path';
import { CommandExecutor } from './command-executor';
import { TestCase, FixtureTestCase } from './test-case-loader';

export class FixtureValidator {
  private commandExecutor: CommandExecutor;
  
  constructor(commandExecutor: CommandExecutor) {
    this.commandExecutor = commandExecutor;
  }

  async validate(testCase: TestCase): Promise<void> {
    if (testCase instanceof FixtureTestCase && testCase.isMultiFile()) {
      await this.validateMultiFileTestCase(testCase);
    } else {
      await this.validateSingleFileTestCase(testCase);
    }
  }

  private async validateSingleFileTestCase(testCase: TestCase): Promise<void> {
    const receivedTsFile = this.getReceivedPath(testCase.inputFile, '.ts');
    this.setupTestFile(testCase.inputFile, receivedTsFile);
    
    const outputs = await this.executeCommand(testCase, receivedTsFile);
    const receivedFiles = this.writeReceivedFiles(testCase.inputFile, outputs);
    
    this.validateAndCleanup(testCase.inputFile, receivedFiles);
  }

  private async validateMultiFileTestCase(testCase: FixtureTestCase): Promise<void> {
    const receivedDir = this.getReceivedPath(testCase.inputFile, `.received`);
    this.setupMultiFileProject(testCase.inputFile, receivedDir);
    
    const outputs = await this.executeMultiFileCommand(testCase, receivedDir);
    const receivedFiles = this.writeMultiFileReceivedFiles(testCase, outputs);
    
    this.validateAndCleanupMultiFile(testCase, receivedFiles);
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

  private setupMultiFileProject(inputDir: string, receivedDir: string): void {
    this.copyDirectoryRecursively(inputDir, receivedDir);
  }

  private copyDirectoryRecursively(src: string, dest: string): void {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      
      if (fs.statSync(srcPath).isDirectory()) {
        this.copyDirectoryRecursively(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
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

  private writeMultiFileReceivedFiles(testCase: FixtureTestCase, outputs: any): {
    outFile: string;
    errFile: string;
  } {
    const receivedFiles = {
      outFile: path.join(path.dirname(testCase.inputFile), `${testCase.testCaseId}.received.out`),
      errFile: path.join(path.dirname(testCase.inputFile), `${testCase.testCaseId}.received.err`)
    };
    
    fs.writeFileSync(receivedFiles.outFile, outputs.stdout || '');
    fs.writeFileSync(receivedFiles.errFile, outputs.stderr || '');
    
    return receivedFiles;
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
    const expectedFiles = {
      outFile: path.join(path.dirname(testCase.inputFile), `${testCase.testCaseId}.expected.out`),
      errFile: path.join(path.dirname(testCase.inputFile), `${testCase.testCaseId}.expected.err`)
    };
    
    this.compareIfExpected(expectedFiles.outFile, receivedFiles.outFile);
    this.compareIfExpected(expectedFiles.errFile, receivedFiles.errFile);
    
    if (testCase.expectedDirectory && fs.existsSync(testCase.expectedDirectory)) {
      this.compareDirectories(testCase.expectedDirectory, this.getReceivedPath(testCase.inputFile, `.received`));
    }
  }

  private compareDirectories(expectedDir: string, receivedDir: string): void {
    if (!fs.existsSync(receivedDir)) {
      throw new Error(`Expected directory ${expectedDir} exists but received directory ${receivedDir} was not generated`);
    }
    
    const expectedFiles = this.getFilesRecursively(expectedDir);
    for (const file of expectedFiles) {
      const relativePath = path.relative(expectedDir, file);
      const receivedFile = path.join(receivedDir, relativePath);
      this.compareFileContents(file, receivedFile);
    }
  }

  private getFilesRecursively(dir: string): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      if (fs.statSync(fullPath).isDirectory()) {
        files.push(...this.getFilesRecursively(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  private cleanupMultiFileReceivedFiles(testCase: FixtureTestCase, receivedFiles: any, testPassed: boolean): void {
    const receivedDir = this.getReceivedPath(testCase.inputFile, `.received`);
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

  private async runCommand(command: string, cwd: string = process.cwd()): Promise<{ stdout: string; stderr: string; success: boolean }> {
    try {
      const output = await this.commandExecutor.executeCommand(command, cwd);
      return { stdout: typeof output === 'string' ? output : '', stderr: '', success: true };
    } catch (error) {
      return { stdout: '', stderr: (error as Error).message, success: false };
    }
  }
}
import * as fs from 'fs';
import * as path from 'path';
import { CommandExecutor } from './command-executor';
import { TestCase } from './test-case-loader';

export class TestCaseValidator {
  private readonly commandExecutor: CommandExecutor;
  
  constructor(commandExecutor: CommandExecutor) {
    this.commandExecutor = commandExecutor;
  }

  async validateTextOutput(testCase: TestCase): Promise<void> {
    for (const command of testCase.commands) {
      await this.executeAndValidateTextCommand(testCase, command);
    }
    
    this.cleanupReceivedFile(testCase.receivedFile);
  }

  private async executeAndValidateTextCommand(testCase: TestCase, command: string): Promise<void> {
    const updatedCommand = this.updateCommandPath(command, testCase.inputFile);
    
    try {
      const output = await this.commandExecutor.executeCommand(updatedCommand);
      this.validateSuccessTextOutput(testCase, output);
    } catch (error) {
      this.validateErrorTextOutput(testCase, error);
    }
  }

  private updateCommandPath(command: string, inputFile: string): string {
    const inputFileName = path.basename(inputFile);
    return command.replace(inputFileName, inputFile);
  }

  private validateSuccessTextOutput(testCase: TestCase, output: string | void): void {
    const textContent = this.extractTextContent(output);
    this.writeAndCompareOutput(testCase, textContent);
  }

  private validateErrorTextOutput(testCase: TestCase, error: unknown): void {
    const errorMessage = (error as Error).message;
    this.writeAndCompareOutput(testCase, errorMessage);
  }

  private writeAndCompareOutput(testCase: TestCase, content: string): void {
    fs.writeFileSync(testCase.receivedFile, content);
    
    const expected = fs.readFileSync(testCase.expectedFile, 'utf8').trim();
    const received = fs.readFileSync(testCase.receivedFile, 'utf8').trim();
    
    expect(received).toBe(expected);
  }

  async validateYamlOutput(testCase: TestCase): Promise<void> {
    for (const command of testCase.commands) {
      await this.executeAndValidateYamlCommand(testCase, command);
    }
    
    this.cleanupReceivedFile(testCase.receivedFile);
  }

  private async executeAndValidateYamlCommand(testCase: TestCase, command: string): Promise<void> {
    const updatedCommand = this.updateCommandPath(command, testCase.inputFile);
    
    try {
      const output = await this.commandExecutor.executeCommand(updatedCommand);
      this.validateYamlCommandOutput(testCase, output);
    } catch (error) {
      throw new Error(`Command failed: ${updatedCommand}\n${error}`);
    }
  }

  private validateYamlCommandOutput(testCase: TestCase, output: string | void): void {
    const yamlContent = this.extractYamlContent(output);
    fs.writeFileSync(testCase.receivedFile, yamlContent);
    
    const expected = fs.readFileSync(testCase.expectedFile, 'utf8').trim();
    const received = fs.readFileSync(testCase.receivedFile, 'utf8').trim();
    
    expect(received).toEqual(expected);
  }

  private extractYamlContent(output: string | void): string {
    if (typeof output === 'string') {
      return this.commandExecutor.isUsingCli() ? output.trim() : output;
    }
    return '';
  }

  private extractTextContent(output: string | void): string {
    if (typeof output === 'string') {
      return this.commandExecutor.isUsingCli() ? output.trim() : output.trim();
    }
    return '';
  }

  async validateRefactoringOutput(testCase: TestCase): Promise<void> {
    const isErrorCase = testCase.expectedFile.endsWith('.txt');
    
    if (isErrorCase) {
      await this.validateErrorCase(testCase);
    } else {
      await this.validateSuccessCase(testCase);
    }
  }

  private async validateErrorCase(testCase: TestCase): Promise<void> {
    for (const command of testCase.commands) {
      await this.executeAndValidateErrorCommand(testCase, command);
    }
    
    this.cleanupReceivedFile(testCase.receivedFile);
  }

  private async executeAndValidateErrorCommand(testCase: TestCase, command: string): Promise<void> {
    const updatedCommand = this.prepareErrorCommand(command, testCase.inputFile);
    
    try {
      await this.commandExecutor.executeCommand(updatedCommand);
      throw new Error(`Expected command to fail but it succeeded: ${updatedCommand}`);
    } catch (error) {
      this.handleExpectedError(testCase, error);
    }
  }

  private prepareErrorCommand(command: string, inputFile: string): string {
    const cleanCommand = command.replace('refakts', '').trim();
    const inputFileName = path.basename(inputFile);
    return cleanCommand.replace(inputFileName, inputFile);
  }

  private handleExpectedError(testCase: TestCase, error: unknown): void {
    const errorMessage = this.extractCoreErrorMessage((error as Error).message);
    this.writeAndCompareOutput(testCase, errorMessage);
  }

  private async validateSuccessCase(testCase: TestCase): Promise<void> {
    await this.setupTestFiles(testCase);
    await this.executeRefactoringCommands(testCase);
    await this.validateRefactoringResults(testCase);
    this.cleanupRefactoringFiles(testCase.receivedFile);
  }

  private async setupTestFiles(testCase: TestCase): Promise<void> {
    if (fs.statSync(testCase.inputFile).isDirectory()) {
      await this.copyDirectory(testCase.inputFile, testCase.receivedFile);
    } else {
      fs.copyFileSync(testCase.inputFile, testCase.receivedFile);
    }
  }

  private async executeRefactoringCommands(testCase: TestCase): Promise<void> {
    for (const command of testCase.commands) {
      await this.executeRefactoringCommand(testCase, command);
    }
  }

  private async executeRefactoringCommand(testCase: TestCase, command: string): Promise<void> {
    const updatedCommand = this.prepareRefactoringCommand(testCase, command);
    
    try {
      await this.commandExecutor.executeCommand(updatedCommand);
    } catch (error) {
      throw new Error(`Command failed: ${updatedCommand}\n${error}`);
    }
  }

  private prepareRefactoringCommand(testCase: TestCase, command: string): string {
    let updatedCommand = command.replace('refakts', '').trim();
    
    if (fs.statSync(testCase.inputFile).isFile()) {
      const inputFileName = path.basename(testCase.inputFile);
      updatedCommand = updatedCommand.replace(inputFileName, testCase.receivedFile);
    }
    
    return updatedCommand;
  }

  private async validateRefactoringResults(testCase: TestCase): Promise<void> {
    if (fs.statSync(testCase.expectedFile).isDirectory()) {
      await this.compareDirectories(testCase.expectedFile, testCase.receivedFile);
    } else {
      const expected = fs.readFileSync(testCase.expectedFile, 'utf8');
      const received = fs.readFileSync(testCase.receivedFile, 'utf8');
      expect(received).toBe(expected);
    }
  }

  private async copyDirectory(src: string, dest: string): Promise<void> {
    this.ensureDestinationExists(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      await this.copyEntry(src, dest, entry);
    }
  }

  private ensureDestinationExists(dest: string): void {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
  }

  private async copyEntry(src: string, dest: string, entry: fs.Dirent): Promise<void> {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await this.copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  private async compareDirectories(expectedDir: string, receivedDir: string): Promise<void> {
    const expectedFiles = this.getAllFiles(expectedDir);
    const receivedFiles = this.getAllFiles(receivedDir);
    
    this.validateDirectoryStructure(expectedFiles, receivedFiles);
    this.compareFileContents(expectedDir, receivedDir, expectedFiles);
  }

  private validateDirectoryStructure(expectedFiles: string[], receivedFiles: string[]): void {
    expect(receivedFiles.sort()).toEqual(expectedFiles.sort());
  }

  private compareFileContents(expectedDir: string, receivedDir: string, files: string[]): void {
    for (const file of files) {
      const expectedPath = path.join(expectedDir, file);
      const receivedPath = path.join(receivedDir, file);
      
      if (fs.statSync(expectedPath).isFile()) {
        this.compareFileContent(expectedPath, receivedPath);
      }
    }
  }

  private compareFileContent(expectedPath: string, receivedPath: string): void {
    const expected = fs.readFileSync(expectedPath, 'utf8');
    const received = fs.readFileSync(receivedPath, 'utf8');
    expect(received).toBe(expected);
  }

  private getAllFiles(dir: string, prefix = ''): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      this.collectFileEntry(dir, prefix, entry, files);
    }
    
    return files;
  }

  private collectFileEntry(dir: string, prefix: string, entry: fs.Dirent, files: string[]): void {
    const relativePath = prefix ? path.join(prefix, entry.name) : entry.name;
    
    if (entry.isDirectory()) {
      files.push(...this.getAllFiles(path.join(dir, entry.name), relativePath));
    } else {
      files.push(relativePath);
    }
  }

  private cleanupReceivedFile(receivedFile: string): void {
    if (fs.existsSync(receivedFile)) {
      fs.unlinkSync(receivedFile);
    }
  }

  private extractCoreErrorMessage(errorMessage: string): string {
    if (errorMessage.startsWith('Command execution failed:')) {
      return this.extractFromFailedCommand(errorMessage);
    }
    
    return this.ensureErrorPrefix(errorMessage);
  }

  private extractFromFailedCommand(errorMessage: string): string {
    const lines = errorMessage.split('\n');
    if (lines.length > 1) {
      const coreMessage = lines.slice(1).join('\n');
      return this.ensureErrorPrefix(coreMessage);
    }
    return this.ensureErrorPrefix(errorMessage);
  }

  private ensureErrorPrefix(message: string): string {
    return message.startsWith('Error: ') ? message : `Error: ${message}`;
  }

  private cleanupRefactoringFiles(receivedFile: string): void {
    if (fs.statSync(receivedFile).isDirectory()) {
      fs.rmSync(receivedFile, { recursive: true, force: true });
    } else {
      fs.unlinkSync(receivedFile);
    }
  }
}
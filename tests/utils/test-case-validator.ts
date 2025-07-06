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
      let updatedCommand = command;
      const inputFileName = path.basename(testCase.inputFile);
      updatedCommand = updatedCommand.replace(inputFileName, testCase.inputFile);
      
      try {
        const output = await this.commandExecutor.executeCommand(updatedCommand);
        const textContent = this.extractTextContent(output);
        
        fs.writeFileSync(testCase.receivedFile, textContent);
        
        const expected = fs.readFileSync(testCase.expectedFile, 'utf8').trim();
        const received = fs.readFileSync(testCase.receivedFile, 'utf8').trim();
        
        expect(received).toBe(expected);
      } catch (error) {
        const errorMessage = (error as Error).message;
        fs.writeFileSync(testCase.receivedFile, errorMessage);
        
        const expected = fs.readFileSync(testCase.expectedFile, 'utf8').trim();
        const received = fs.readFileSync(testCase.receivedFile, 'utf8').trim();
        
        expect(received).toBe(expected);
      }
    }
    
    this.cleanupReceivedFile(testCase.receivedFile);
  }

  async validateYamlOutput(testCase: TestCase): Promise<void> {
    for (const command of testCase.commands) {
      let updatedCommand = command;
      const inputFileName = path.basename(testCase.inputFile);
      updatedCommand = updatedCommand.replace(inputFileName, testCase.inputFile);
      
      try {
        const output = await this.commandExecutor.executeCommand(updatedCommand);
        let yamlContent: string;
        
        if (typeof output === 'string') {
          yamlContent = this.commandExecutor.isUsingCli() ? output.trim() : output;
        } else {
          yamlContent = '';
        }
        
        fs.writeFileSync(testCase.receivedFile, yamlContent);
        
        const expected = fs.readFileSync(testCase.expectedFile, 'utf8').trim();
        const received = fs.readFileSync(testCase.receivedFile, 'utf8').trim();
        
        expect(received).toEqual(expected);
      } catch (error) {
        throw new Error(`Command failed: ${updatedCommand}\n${error}`);
      }
    }
    
    this.cleanupReceivedFile(testCase.receivedFile);
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
      let updatedCommand = command.replace('refakts', '').trim();
      const inputFileName = path.basename(testCase.inputFile);
      updatedCommand = updatedCommand.replace(inputFileName, testCase.inputFile);
      
      try {
        await this.commandExecutor.executeCommand(updatedCommand);
        throw new Error(`Expected command to fail but it succeeded: ${updatedCommand}`);
      } catch (error) {
        const errorMessage = this.extractCoreErrorMessage((error as Error).message);
        fs.writeFileSync(testCase.receivedFile, errorMessage);
        
        const expected = fs.readFileSync(testCase.expectedFile, 'utf8').trim();
        const received = fs.readFileSync(testCase.receivedFile, 'utf8').trim();
        
        expect(received).toBe(expected);
      }
    }
    
    this.cleanupReceivedFile(testCase.receivedFile);
  }

  private async validateSuccessCase(testCase: TestCase): Promise<void> {
    if (fs.statSync(testCase.inputFile).isDirectory()) {
      await this.copyDirectory(testCase.inputFile, testCase.receivedFile);
    } else {
      fs.copyFileSync(testCase.inputFile, testCase.receivedFile);
    }
    
    for (const command of testCase.commands) {
      let updatedCommand = command.replace('refakts', '').trim();
      
      if (fs.statSync(testCase.inputFile).isFile()) {
        const inputFileName = path.basename(testCase.inputFile);
        updatedCommand = updatedCommand.replace(inputFileName, testCase.receivedFile);
      }
      
      try {
        await this.commandExecutor.executeCommand(updatedCommand);
      } catch (error) {
        throw new Error(`Command failed: ${updatedCommand}\n${error}`);
      }
    }
    
    if (fs.statSync(testCase.expectedFile).isDirectory()) {
      await this.compareDirectories(testCase.expectedFile, testCase.receivedFile);
    } else {
      const expected = fs.readFileSync(testCase.expectedFile, 'utf8');
      const received = fs.readFileSync(testCase.receivedFile, 'utf8');
      expect(received).toBe(expected);
    }
    
    this.cleanupRefactoringFiles(testCase.receivedFile);
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
    // Remove command execution wrapper if present
    if (errorMessage.startsWith('Command execution failed:')) {
      const lines = errorMessage.split('\n');
      if (lines.length > 1) {
        const coreMessage = lines.slice(1).join('\n');
        // Ensure "Error: " prefix for consistency with expected outputs
        return coreMessage.startsWith('Error: ') ? coreMessage : `Error: ${coreMessage}`;
      }
    }
    
    // Ensure "Error: " prefix for consistency with expected outputs
    return errorMessage.startsWith('Error: ') ? errorMessage : `Error: ${errorMessage}`;
  }

  private cleanupRefactoringFiles(receivedFile: string): void {
    if (fs.statSync(receivedFile).isDirectory()) {
      fs.rmSync(receivedFile, { recursive: true, force: true });
    } else {
      fs.unlinkSync(receivedFile);
    }
  }
}
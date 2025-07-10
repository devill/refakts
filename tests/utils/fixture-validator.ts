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
    // Set up test file
    const receivedTsFile = this.getReceivedPath(testCase.inputFile, '.ts');
    this.setupTestFile(testCase.inputFile, receivedTsFile);
    
    // Execute command and capture all outputs
    const outputs = await this.executeCommand(testCase, receivedTsFile);
    
    // Write all received files
    const receivedFiles = this.writeReceivedFiles(testCase.inputFile, outputs);
    
    // Compare with expected files (only if they exist)
    this.compareWithExpected(testCase.inputFile, receivedFiles);
    
    // Clean up received files based on test result
    this.cleanupReceivedFiles(receivedFiles);
  }

  private setupTestFile(inputFile: string, receivedFile: string): void {
    if (fs.statSync(inputFile).isDirectory()) {
      this.copyDirectory(inputFile, receivedFile);
    } else {
      fs.copyFileSync(inputFile, receivedFile);
    }
  }

  private async executeCommand(testCase: TestCase, receivedFile: string): Promise<{
    stdout: string;
    stderr: string;
    fileContent: string;
    success: boolean;
  }> {
    const command = this.prepareCommand(testCase.commands[0], receivedFile);
    
    let stdout = '';
    let stderr = '';
    let success = false;
    
    try {
      const output = await this.commandExecutor.executeCommand(command);
      stdout = typeof output === 'string' ? output : '';
      success = true;
    } catch (error) {
      stderr = (error as Error).message;
      success = false;
    }
    
    const fileContent = fs.readFileSync(receivedFile, 'utf8');
    
    return { stdout, stderr, fileContent, success };
  }

  private prepareCommand(command: string, receivedFile: string): string {
    // Remove 'refakts' prefix if present
    const cleanCommand = command.replace(/^refakts\s+/, '').trim();
    
    // Replace input file reference with received file
    const inputFileName = path.basename(receivedFile).replace('.received.ts', '.input.ts');
    return cleanCommand.replace(inputFileName, receivedFile);
  }

  private writeReceivedFiles(inputFile: string, outputs: any): {
    tsFile: string;
    outFile: string;
    errFile: string;
  } {
    const receivedFiles = {
      tsFile: this.getReceivedPath(inputFile, '.ts'),
      outFile: this.getReceivedPath(inputFile, '.out'), 
      errFile: this.getReceivedPath(inputFile, '.err')
    };
    
    // Write file content (always written since file was modified)
    fs.writeFileSync(receivedFiles.tsFile, outputs.fileContent);
    
    if (outputs.stdout.trim()) {
      fs.writeFileSync(receivedFiles.outFile, outputs.stdout.trim());
    }
    
    if (outputs.stderr.trim()) {
      fs.writeFileSync(receivedFiles.errFile, outputs.stderr.trim());
    }
    
    return receivedFiles;
  }

  private compareWithExpected(inputFile: string, receivedFiles: any): void {
    const expectedFiles = {
      tsFile: this.getExpectedPath(inputFile, '.ts'),
      outFile: this.getExpectedPath(inputFile, '.out'),
      errFile: this.getExpectedPath(inputFile, '.err')
    };
    
    // Compare each file type if expected file exists
    this.compareIfExpected(expectedFiles.tsFile, receivedFiles.tsFile);
    this.compareIfExpected(expectedFiles.outFile, receivedFiles.outFile);
    this.compareIfExpected(expectedFiles.errFile, receivedFiles.errFile);
  }

  private compareIfExpected(expectedFile: string, receivedFile: string): void {
    if (fs.existsSync(expectedFile)) {
      if (!fs.existsSync(receivedFile)) {
        throw new Error(`Expected file ${expectedFile} exists but received file ${receivedFile} was not generated`);
      }
      
      const expected = fs.readFileSync(expectedFile, 'utf8').trim();
      const received = fs.readFileSync(receivedFile, 'utf8').trim();
      
      if (received !== expected) {
        throw new Error(`Content mismatch in ${receivedFile}.\nExpected:\n${expected}\nReceived:\n${received}`);
      }
    }
  }

  private cleanupReceivedFiles(receivedFiles: any): void {
    // Keep received files that had corresponding expected files for debugging
    // Remove received files that don't have expected counterparts
    Object.values(receivedFiles).forEach((file: any) => {
      if (fs.existsSync(file)) {
        const expectedFile = file.replace('.received.', '.expected.');
        if (!fs.existsSync(expectedFile)) {
          fs.unlinkSync(file);
        }
      }
    });
  }

  private getReceivedPath(inputFile: string, extension: string): string {
    return inputFile.replace('.input.ts', `.received${extension}`);
  }

  private getExpectedPath(inputFile: string, extension: string): string {
    return inputFile.replace('.input.ts', `.expected${extension}`);
  }

  private copyDirectory(src: string, dest: string): void {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}
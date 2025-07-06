import * as fs from 'fs';
import * as path from 'path';
import { TestCase } from './test-case-loader';

export class FileOperations {
  async copyDirectory(src: string, dest: string): Promise<void> {
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

  async compareDirectories(expectedDir: string, receivedDir: string): Promise<void> {
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

  writeAndCompareOutput(testCase: TestCase, content: string): void {
    this.writeReceivedFile(testCase.receivedFile, content);
    this.compareOutputFiles(testCase.expectedFile, testCase.receivedFile);
  }

  writeAndCompareYamlOutput(testCase: TestCase, content: string): void {
    this.writeReceivedFile(testCase.receivedFile, content);
    this.compareYamlFiles(testCase.expectedFile, testCase.receivedFile);
  }

  private writeReceivedFile(receivedFile: string, content: string): void {
    fs.writeFileSync(receivedFile, content);
  }

  private compareOutputFiles(expectedFile: string, receivedFile: string): void {
    const expected = fs.readFileSync(expectedFile, 'utf8').trim();
    const received = fs.readFileSync(receivedFile, 'utf8').trim();
    expect(received).toBe(expected);
  }

  private compareYamlFiles(expectedFile: string, receivedFile: string): void {
    const expected = fs.readFileSync(expectedFile, 'utf8').trim();
    const received = fs.readFileSync(receivedFile, 'utf8').trim();
    expect(received).toEqual(expected);
  }

  setupTestFiles(testCase: TestCase): void {
    if (fs.statSync(testCase.inputFile).isDirectory()) {
      this.copyDirectory(testCase.inputFile, testCase.receivedFile);
    } else {
      fs.copyFileSync(testCase.inputFile, testCase.receivedFile);
    }
  }

  validateResults(testCase: TestCase): void {
    if (fs.statSync(testCase.expectedFile).isDirectory()) {
      this.compareDirectories(testCase.expectedFile, testCase.receivedFile);
    } else {
      this.compareFileContent(testCase.expectedFile, testCase.receivedFile);
    }
  }

  cleanupReceivedFile(receivedFile: string): void {
    if (fs.existsSync(receivedFile)) {
      fs.unlinkSync(receivedFile);
    }
  }

  cleanupRefactoringFiles(receivedFile: string): void {
    if (fs.statSync(receivedFile).isDirectory()) {
      fs.rmSync(receivedFile, { recursive: true, force: true });
    } else {
      fs.unlinkSync(receivedFile);
    }
  }
}
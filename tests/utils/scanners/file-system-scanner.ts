import * as fs from 'fs';
import * as path from 'path';

export class FileSystemScanner {
  getDirectoryNames(fixturesDir: string): string[] {
    return fs.readdirSync(fixturesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  }

  getTestDirectoryFiles(testPath: string): string[] {
    return fs.readdirSync(testPath);
  }

  getSubDirectories(testPath: string, files: string[]): string[] {
    return files.filter(file => 
      fs.statSync(path.join(testPath, file)).isDirectory()
    );
  }

  getInputFiles(files: string[]): string[] {
    return files.filter(file => file.endsWith('.input.ts'));
  }

  directoryExists(dirPath: string): boolean {
    return fs.existsSync(dirPath);
  }

  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }
}
import * as path from 'path';
import { Project } from 'ts-morph';

export class FileSystemHelper {
  constructor(private _project: Project) {}

  loadProjectFiles(filePath: string): void {
    const projectDir = this.findProjectRoot(filePath);
    this.loadAllFilesInDirectory(projectDir);
  }

  findProjectRoot(filePath: string): string {
    const startDir = path.dirname(path.resolve(filePath));
    const foundRoot = this.searchForTsConfig(startDir);
    return foundRoot || startDir;
  }

  private searchForTsConfig(startDir: string): string | null {
    const cwd = process.cwd();
    return this.traverseDirectoryTree(startDir, cwd);
  }

  private traverseDirectoryTree(startDir: string, cwd: string): string | null {
    let currentDir = startDir;
    while (this.shouldContinueSearch(currentDir, cwd)) {
      if (this.hasTsConfig(currentDir)) return currentDir;
      currentDir = path.dirname(currentDir);
    }
    return null;
  }

  private shouldContinueSearch(currentDir: string, cwd: string): boolean {
    return currentDir !== path.dirname(currentDir) && 
           (currentDir === cwd || currentDir.startsWith(cwd));
  }

  private hasTsConfig(dir: string): boolean {
    const tsConfigPath = path.join(dir, 'tsconfig.json');
    return require('fs').existsSync(tsConfigPath);
  }

  loadAllFilesInDirectory(dir: string): void {
    if (!this.directoryExists(dir)) {
      return;
    }
    
    const entries = require('fs').readdirSync(dir);
    this.processDirectoryEntries(dir, entries);
  }

  private directoryExists(dir: string): boolean {
    return require('fs').existsSync(dir);
  }

  private processDirectoryEntries(dir: string, entries: string[]): void {
    for (const entry of entries) {
      const fullPath = require('path').join(dir, entry);
      this.processEntry(fullPath, entry);
    }
  }

  private processEntry(fullPath: string, entry: string): void {
    const stat = require('fs').statSync(fullPath);
    
    if (this.shouldProcessDirectory(stat, entry)) {
      this.loadAllFilesInDirectory(fullPath);
    } else if (this.shouldLoadFile(entry)) {
      this.tryLoadSourceFile(fullPath);
    }
  }

  private shouldProcessDirectory(stat: { isDirectory: () => boolean }, entry: string): boolean {
    return stat.isDirectory() && entry !== 'node_modules' && entry !== 'dist';
  }

  private shouldLoadFile(entry: string): boolean {
    return entry.endsWith('.ts') && !entry.endsWith('.d.ts');
  }

  private tryLoadSourceFile(fullPath: string): void {
    try {
      this._project.addSourceFileAtPath(fullPath);
    } catch {
      return;
    }
  }
}
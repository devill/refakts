import * as path from 'path';
import { Project, getCompilerOptionsFromTsConfig } from 'ts-morph';
import { minimatch } from 'minimatch';

export class FileSystemHelper {
  private _projectRoot: string | null = null;
  private _excludePatterns: string[] = [];

  constructor(private _project: Project) {}

  loadProjectFiles(filePath: string): void {
    const projectDir = this.findProjectRoot(filePath);
    this._projectRoot = projectDir;
    this.loadTsConfigExcludePatterns(projectDir);
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

  private loadTsConfigExcludePatterns(projectDir: string): void {
    const tsConfigPath = path.join(projectDir, 'tsconfig.json');
    if (!this.tsConfigExists(tsConfigPath)) {
      this.setDefaultExcludePatterns();
      return;
    }

    const excludePatterns = this.extractExcludePatternsFromTsConfig(tsConfigPath);
    if (excludePatterns === null) {
      this.setDefaultExcludePatterns();
      return;
    }

    // If tsconfig.json has explicit exclude patterns, use them as-is
    // TypeScript's default behavior (excluding node_modules) will be handled
    // by ensuring node_modules is included if not explicitly listed
    this._excludePatterns = this.applyTypeScriptDefaults(excludePatterns);
  }

  private tsConfigExists(tsConfigPath: string): boolean {
    return require('fs').existsSync(tsConfigPath);
  }

  private extractExcludePatternsFromTsConfig(tsConfigPath: string): string[] | null {
    try {
      const result = getCompilerOptionsFromTsConfig(tsConfigPath);
      if (result.errors && result.errors.length > 0) {
        return null;
      }

      const rawConfig = JSON.parse(require('fs').readFileSync(tsConfigPath, 'utf8'));
      return rawConfig.exclude || [];
    } catch {
      return null;
    }
  }

  private applyTypeScriptDefaults(explicitExcludes: string[]): string[] {
    // TypeScript automatically excludes node_modules by default
    // If not explicitly mentioned in tsconfig, we should respect that default
    const hasNodeModulesExplicit = explicitExcludes.some(pattern => 
      pattern === 'node_modules' || pattern.includes('node_modules')
    );
    
    if (hasNodeModulesExplicit) {
      // Use explicit patterns as-is since node_modules is explicitly configured
      return explicitExcludes;
    } else {
      // Apply TypeScript's default by adding node_modules
      return ['node_modules', ...explicitExcludes];
    }
  }

  private setDefaultExcludePatterns(): void {
    // When no tsconfig.json exists, provide sensible defaults
    // that include TypeScript's implicit defaults plus common build artifacts
    this._excludePatterns = ['node_modules', 'dist', 'build', 'coverage'];
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
    return stat.isDirectory() && this.isDirectoryIncluded(entry);
  }

  private isDirectoryIncluded(entry: string): boolean {
    return !this.isExcludedByPattern(entry);
  }

  private isExcludedByPattern(entry: string): boolean {
    return this._excludePatterns.some(pattern => 
      this.matchesExcludePattern(entry, pattern)
    );
  }

  private matchesExcludePattern(directoryName: string, pattern: string): boolean {
    return this.isExactMatch(directoryName, pattern) ||
           this.isGlobMatch(directoryName, pattern) ||
           this.isBaseNameMatch(directoryName, pattern);
  }

  private isExactMatch(directoryName: string, pattern: string): boolean {
    return pattern === directoryName;
  }

  private isGlobMatch(directoryName: string, pattern: string): boolean {
    return (pattern.includes('*') || pattern.includes('?')) &&
           minimatch(directoryName, pattern);
  }

  private isBaseNameMatch(directoryName: string, pattern: string): boolean {
    return directoryName === path.basename(pattern);
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
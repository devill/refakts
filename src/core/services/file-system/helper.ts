import * as path from 'path';
import { Project, getCompilerOptionsFromTsConfig } from 'ts-morph';
import { minimatch } from 'minimatch';

import {existsSync, readFileSync, statSync} from "fs";

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
    return existsSync(tsConfigPath);
  }

  private loadTsConfigExcludePatterns(projectDir: string): void {
    const tsConfigPath = this.buildTsConfigPath(projectDir);
    this.processExcludePatterns(tsConfigPath);
  }

  private buildTsConfigPath(projectDir: string): string {
    return path.join(projectDir, 'tsconfig.json');
  }

  private processExcludePatterns(tsConfigPath: string): void {
    const patterns = this.getExcludePatternsFromTsConfig(tsConfigPath);
    this._excludePatterns = patterns || this.getDefaultExcludePatterns();
  }

  private getExcludePatternsFromTsConfig(tsConfigPath: string): string[] | null {
    if (!this.tsConfigExists(tsConfigPath)) {
      return null;
    }

    const excludePatterns = this.extractExcludePatternsFromTsConfig(tsConfigPath);
    return excludePatterns ? this.applyTypeScriptDefaults(excludePatterns) : null;
  }

  private getDefaultExcludePatterns(): string[] {
    return ['node_modules', 'dist', 'build', 'coverage'];
  }

  private tsConfigExists(tsConfigPath: string): boolean {
    return require('fs').existsSync(tsConfigPath);
  }

  private extractExcludePatternsFromTsConfig(tsConfigPath: string): string[] | null {
    if (!this.isTsConfigValid(tsConfigPath)) {
      return null;
    }

    return this.readExcludePatternsFromFile(tsConfigPath);
  }

  private isTsConfigValid(tsConfigPath: string): boolean {
    try {
      const result = getCompilerOptionsFromTsConfig(tsConfigPath);
      return !(result.errors && result.errors.length > 0);
    } catch {
      return false;
    }
  }

  private readExcludePatternsFromFile(tsConfigPath: string): string[] | null {
    try {
      const rawConfig = JSON.parse(readFileSync(tsConfigPath, 'utf8'));
      return rawConfig.exclude || [];
    } catch {
      return null;
    }
  }

  private applyTypeScriptDefaults(explicitExcludes: string[]): string[] {
    if (this.hasNodeModulesPattern(explicitExcludes)) {
      return explicitExcludes;
    }
    return ['node_modules', ...explicitExcludes];
  }

  private hasNodeModulesPattern(patterns: string[]): boolean {
    return patterns.some(pattern => 
      pattern === 'node_modules' || pattern.includes('node_modules')
    );
  }

  private setDefaultExcludePatterns(): void {
    this._excludePatterns = this.getDefaultExcludePatterns();
  }

  loadAllFilesInDirectory(dir: string): void {
    if (!this.directoryExists(dir)) {
      return;
    }
    
    const entries = require('fs').readdirSync(dir);
    this.processDirectoryEntries(dir, entries);
  }

  private directoryExists(dir: string): boolean {
    return existsSync(dir);
  }

  private processDirectoryEntries(dir: string, entries: string[]): void {
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      this.processEntry(fullPath, entry);
    }
  }

  private processEntry(fullPath: string, entry: string): void {
    const stat = statSync(fullPath);
    
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
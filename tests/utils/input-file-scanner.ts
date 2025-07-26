import * as path from 'path';
import { TestCase } from './test-case-loader';
import { FileSystemScanner } from './scanners/file-system-scanner';
import { FixtureLocation } from './fixture-location';
import { MultiFileTestCaseFactory } from './multi-file-test-case-factory';

import {statSync} from "fs";

interface DirectoryProcessingContext {
  scanner: FileSystemScanner;
  inputFiles: string[];
}

export class InputFileScanner {
  private multiFileFactory: MultiFileTestCaseFactory;

  constructor() {
    this.multiFileFactory = new MultiFileTestCaseFactory();
  }

  scanRecursively(fixturesDir: string, scanner: FileSystemScanner): TestCase[] {
    const inputFiles = this.findInputFilesRecursively(fixturesDir, scanner);
    const configFiles = this.findConfigFilesRecursively(fixturesDir, scanner);
    
    const testCases: TestCase[] = [];
    testCases.push(...this.createTestCasesFromInputFiles(inputFiles));
    testCases.push(...this.createTestCasesFromConfigFiles(configFiles));
    
    return testCases;
  }

  private createTestCasesFromInputFiles(inputFiles: string[]): TestCase[] {
    const testCases: TestCase[] = [];
    for (const inputFile of inputFiles) {
      const testCase = FixtureLocation.createInputTestCase(inputFile);
      if (testCase) {
        testCases.push(testCase);
      }
    }
    return testCases;
  }

  private findInputFilesRecursively(dir: string, scanner: FileSystemScanner): string[] {
    const context: DirectoryProcessingContext = {
      scanner,
      inputFiles: []
    };
    
    this.processDirectoryEntries(dir, context);
    return context.inputFiles;
  }

  private processDirectoryEntries(dir: string, context: DirectoryProcessingContext): void {
    const entries = context.scanner.getTestDirectoryFiles(dir);
    
    for (const entry of entries) {
      this.processDirectoryEntry(dir, entry, context);
    }
  }

  private processDirectoryEntry(dir: string, entry: string, context: DirectoryProcessingContext): void {
    const fullPath = path.join(dir, entry);
    if (context.scanner.fileExists(fullPath)) {
      this.handleFileOrDirectory(fullPath, entry, context);
    }
  }

  private handleFileOrDirectory(fullPath: string, entry: string, context: DirectoryProcessingContext): void {
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      context.inputFiles.push(...this.findInputFilesRecursively(fullPath, context.scanner));
    } else if (entry.endsWith('.input.ts')) {
      context.inputFiles.push(fullPath);
    }
  }

  private findConfigFilesRecursively(dir: string, scanner: FileSystemScanner): string[] {
    const context: DirectoryProcessingContext = {
      scanner,
      inputFiles: []
    };
    
    this.processConfigDirectoryEntries(dir, context);
    return context.inputFiles;
  }

  private processConfigDirectoryEntries(dir: string, context: DirectoryProcessingContext): void {
    const entries = context.scanner.getTestDirectoryFiles(dir);
    
    for (const entry of entries) {
      this.processConfigDirectoryEntry(dir, entry, context);
    }
  }

  private processConfigDirectoryEntry(dir: string, entry: string, context: DirectoryProcessingContext): void {
    const fullPath = path.join(dir, entry);
    if (context.scanner.fileExists(fullPath)) {
      this.handleConfigFileOrDirectory(fullPath, entry, context);
    }
  }

  private handleConfigFileOrDirectory(fullPath: string, entry: string, context: DirectoryProcessingContext): void {
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      context.inputFiles.push(...this.findConfigFilesRecursively(fullPath, context.scanner));
    } else if (entry === 'fixture.config.json') {
      context.inputFiles.push(fullPath);
    }
  }

  private createTestCasesFromConfigFiles(configFiles: string[]): TestCase[] {
    const testCases: TestCase[] = [];
    for (const configFile of configFiles) {
      const multiFileTestCases = this.multiFileFactory.createFromConfigFile(configFile);
      testCases.push(...multiFileTestCases);
    }
    return testCases;
  }
}
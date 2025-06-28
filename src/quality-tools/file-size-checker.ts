import { Project } from "ts-morph";
import * as path from "path";

interface FileSizeIssue {
  file: string;
  lines: number;
  severity: 'warn' | 'critical';
}

export function checkFileSizes(srcDir: string): FileSizeIssue[] {
  const project = createTsMorphProject(srcDir);
  const issues: FileSizeIssue[] = [];
  
  for (const sourceFile of project.getSourceFiles()) {
    processSourceFileForSizes(sourceFile, issues);
  }
  
  return issues;
}

export function checkFunctionSizes(srcDir: string): Array<{file: string; function: string; lines: number; severity: 'warn' | 'critical'}> {
  const project = createTsMorphProject(srcDir);
  const issues: Array<{file: string; function: string; lines: number; severity: 'warn' | 'critical'}> = [];
  
  for (const sourceFile of project.getSourceFiles()) {
    processSourceFileForFunctions(sourceFile, issues);
  }
  
  return issues;
}

function createTsMorphProject(srcDir: string) {
  const project = new Project();
  project.addSourceFilesAtPaths(`${srcDir}/**/*.ts`);
  return project;
}

function processSourceFileForSizes(sourceFile: any, issues: FileSizeIssue[]): void {
  const filePath = path.relative(process.cwd(), sourceFile.getFilePath());
  
  if (shouldSkipFile(filePath)) {
    return;
  }
  
  addFileSizeIssueIfNeeded(sourceFile, filePath, issues);
}

function addFileSizeIssueIfNeeded(sourceFile: any, filePath: string, issues: FileSizeIssue[]): void {
  const lineCount = sourceFile.getEndLineNumber();
  const issue = createFileSizeIssue(filePath, lineCount);
  
  if (issue) {
    issues.push(issue);
  }
}

function processSourceFileForFunctions(sourceFile: any, issues: any[]): void {
  const filePath = path.relative(process.cwd(), sourceFile.getFilePath());
  
  if (shouldSkipFile(filePath)) {
    return;
  }
  
  collectFunctionIssues(sourceFile, filePath, issues);
}

function shouldSkipFile(filePath: string): boolean {
  return filePath.includes('.test.') || filePath.includes('.spec.') || filePath.endsWith('.d.ts');
}

function createFileSizeIssue(filePath: string, lineCount: number): FileSizeIssue | null {
  if (lineCount > 300) {
    return { file: filePath, lines: lineCount, severity: 'critical' };
  } else if (lineCount > 200) {
    return { file: filePath, lines: lineCount, severity: 'warn' };
  }
  return null;
}

function collectFunctionIssues(sourceFile: any, filePath: string, issues: any[]): void {
  const allFunctions = getAllFunctions(sourceFile);
  processFunctionSizes(allFunctions, filePath, issues);
}

function getAllFunctions(sourceFile: any): any[] {
  const functions = sourceFile.getFunctions();
  const methods = sourceFile.getClasses().flatMap((c: any) => c.getMethods());
  return [...functions, ...methods];
}

function processFunctionSizes(functions: any[], filePath: string, issues: any[]): void {
  functions.forEach(func => {
    const issue = createFunctionSizeIssue(filePath, func);
    if (issue) {
      issues.push(issue);
    }
  });
}

function createFunctionSizeIssue(filePath: string, func: any): any | null {
  const lineCount = func.getEndLineNumber() - func.getStartLineNumber() + 1;
  const functionName = func.getName() || 'anonymous';
  
  return determineFunctionSizeIssue(filePath, functionName, lineCount);
}

function determineFunctionSizeIssue(filePath: string, functionName: string, lineCount: number): any | null {
  if (lineCount > 12) {
    return { file: filePath, function: functionName, lines: lineCount, severity: 'critical' };
  } else if (lineCount > 10) {
    return { file: filePath, function: functionName, lines: lineCount, severity: 'warn' };
  }
  return null;
}
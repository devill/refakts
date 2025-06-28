import { Project } from "ts-morph";
import * as path from "path";

interface FileSizeIssue {
  file: string;
  lines: number;
  severity: 'warn' | 'critical';
}

export function checkFileSizes(srcDir: string): FileSizeIssue[] {
  const project = new Project();
  project.addSourceFilesAtPaths(`${srcDir}/**/*.ts`);
  
  const issues: FileSizeIssue[] = [];
  
  for (const sourceFile of project.getSourceFiles()) {
    const filePath = path.relative(process.cwd(), sourceFile.getFilePath());
    
    if (shouldSkipFile(filePath)) {
      continue;
    }
    
    const lineCount = sourceFile.getEndLineNumber();
    const issue = createFileSizeIssue(filePath, lineCount);
    
    if (issue) {
      issues.push(issue);
    }
  }
  
  return issues;
}

export function checkFunctionSizes(srcDir: string): Array<{file: string; function: string; lines: number; severity: 'warn' | 'critical'}> {
  const project = new Project();
  project.addSourceFilesAtPaths(`${srcDir}/**/*.ts`);
  
  const issues: Array<{file: string; function: string; lines: number; severity: 'warn' | 'critical'}> = [];
  
  for (const sourceFile of project.getSourceFiles()) {
    const filePath = path.relative(process.cwd(), sourceFile.getFilePath());
    
    if (shouldSkipFile(filePath)) {
      continue;
    }
    
    collectFunctionIssues(sourceFile, filePath, issues);
  }
  
  return issues;
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
  const functions = sourceFile.getFunctions();
  const methods = sourceFile.getClasses().flatMap((c: any) => c.getMethods());
  
  [...functions, ...methods].forEach(func => {
    const issue = createFunctionSizeIssue(filePath, func);
    if (issue) {
      issues.push(issue);
    }
  });
}

function createFunctionSizeIssue(filePath: string, func: any): any | null {
  const lineCount = func.getEndLineNumber() - func.getStartLineNumber() + 1;
  const functionName = func.getName() || 'anonymous';
  
  if (lineCount > 10) {
    return { file: filePath, function: functionName, lines: lineCount, severity: 'critical' };
  } else if (lineCount > 5) {
    return { file: filePath, function: functionName, lines: lineCount, severity: 'warn' };
  }
  return null;
}
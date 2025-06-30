import { QualityCheck, QualityIssue } from '../quality-tools/quality-check-interface';
import { Project } from 'ts-morph';
import * as path from 'path';

export const functionSizeCheck: QualityCheck = {
  name: 'functionSize',
  check: (sourceDir: string): QualityIssue[] => {
    const project = new Project();
    project.addSourceFilesAtPaths(`${sourceDir}/**/*.ts`);
    
    return project.getSourceFiles()
      .flatMap(createFunctionSizeIssues)
      .filter(Boolean) as QualityIssue[];
  }
};

const createFunctionSizeIssues = (sourceFile: any): QualityIssue[] => {
  const filePath = path.relative(process.cwd(), sourceFile.getFilePath());
  
  if (shouldSkipFile(filePath)) return [];
  
  const functions = sourceFile.getFunctions();
  const methods = sourceFile.getClasses().flatMap((c: any) => c.getMethods());
  
  return [...functions, ...methods]
    .map(func => createFunctionSizeIssue(filePath, func))
    .filter(Boolean) as QualityIssue[];
};

const createFunctionSizeIssue = (filePath: string, func: any): QualityIssue | null => {
  const lineCount = func.getEndLineNumber() - func.getStartLineNumber() + 1;
  const functionName = func.getName() || 'anonymous';
  const severity = lineCount > 12 ? 'critical' : lineCount > 10 ? 'warn' : null;
  
  return severity ? {
    type: 'functionSize',
    severity,
    message: `Function '${functionName}' in ${filePath} has ${lineCount} lines`,
    file: filePath
  } : null;
};

const shouldSkipFile = (filePath: string): boolean =>
  filePath.includes('.test.') || filePath.includes('.spec.') || filePath.endsWith('.d.ts');
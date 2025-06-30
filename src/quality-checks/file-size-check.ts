import { QualityCheck, QualityIssue, QualityGroup } from '../quality-tools/quality-check-interface';
import { Project } from 'ts-morph';
import * as path from 'path';

export const fileSizeCheck: QualityCheck = {
  name: 'fileSize',
  check: (sourceDir: string): QualityIssue[] => {
    const project = new Project();
    project.addSourceFilesAtPaths(`${sourceDir}/**/*.ts`);
    
    return project.getSourceFiles()
      .map(createFileSizeIssue)
      .filter(Boolean) as QualityIssue[];
  },
  getGroupDefinition: (groupKey: string) => {
    if (groupKey === 'criticalFiles') return {
      title: 'CRITICAL: OVERSIZED FILES',
      description: 'Files over 300 lines are extremely difficult to maintain.',
      actionGuidance: 'CRITICAL: Split these files into smaller, focused modules immediately.'
    };
    if (groupKey === 'largeFiles') return {
      title: 'LARGE FILES',
      description: 'Large files are harder to understand and maintain.',
      actionGuidance: 'Break these files into smaller, focused modules with single responsibilities.'
    };
    return undefined;
  }
};

const createFileSizeIssue = (sourceFile: any): QualityIssue | null => {
  const filePath = path.relative(process.cwd(), sourceFile.getFilePath());
  
  if (shouldSkipFile(filePath)) return null;
  
  const lineCount = sourceFile.getEndLineNumber();
  const severity = lineCount > 300 ? 'critical' : lineCount > 200 ? 'warn' : null;
  
  return severity ? {
    type: 'fileSize',
    severity,
    message: `${filePath} has ${lineCount} lines`,
    file: filePath
  } : null;
};

const shouldSkipFile = (filePath: string): boolean =>
  filePath.includes('.test.') || filePath.includes('.spec.') || filePath.endsWith('.d.ts');
import { QualityCheck, QualityIssue } from '../quality-check-interface';
import { Project, SourceFile } from 'ts-morph';
import * as path from 'path';

export const fileSizeCheck: QualityCheck = {
  name: 'fileSize',
  check: (files: string[]): QualityIssue[] => {
    const project = new Project();
    project.addSourceFilesAtPaths(files);
    
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
      description: 'Large files are harder to understand and maintain. They may also point to architectural issues.',
      actionGuidance: 'Analyze the file to suggest an improved design that break these files into smaller, focused modules with single responsibilities. Suggest the change to the user.'
    };
    return undefined;
  }
};

const createFileSizeIssue = (sourceFile: SourceFile): QualityIssue | null => {
  const filePath = path.relative(process.cwd(), sourceFile.getFilePath());
  
  if (shouldSkipFile(filePath)) return null;
  
  const lineCount = sourceFile.getEndLineNumber();
  const severity = lineCount > 200 ? 'critical' : null;
  
  return severity ? {
    type: 'fileSize',
    severity,
    message: `${filePath} has ${lineCount} lines`,
    file: filePath
  } : null;
};

const shouldSkipFile = (filePath: string): boolean =>
   filePath.endsWith('.d.ts');
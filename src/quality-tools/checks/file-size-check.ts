import {QualityCheck, QualityIssue} from '../../dev/quality/quality-check-interface';
import {Project, SourceFile} from 'ts-morph';
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
      description: 'Files over 200 lines are extremely difficult to maintain.',
      actionGuidance: 'CRITICAL: Split these files into smaller, focused modules immediately.'
    };
    return undefined;
  }
};

const createFileSizeIssue = (sourceFile: SourceFile): QualityIssue | null => {
  const filePath = normalizePath(sourceFile.getFilePath());
  if (shouldSkipFile(filePath)) return null;
  return formatFileSizeIssue(filePath, sourceFile.getEndLineNumber());
}

const formatFileSizeIssue = (filePath: string, lineCount: number): QualityIssue | null => {
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


function normalizePath(fp: string & { _standardizedFilePathBrand: undefined }) {
  return path.relative(process.cwd(), fp);
}

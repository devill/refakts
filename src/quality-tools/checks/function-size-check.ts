import { QualityCheck, QualityIssue } from '../quality-check-interface';
import { Project, SourceFile, FunctionDeclaration, MethodDeclaration, ClassDeclaration } from 'ts-morph';
import * as path from 'path';

export const functionSizeCheck: QualityCheck = {
  name: 'functionSize',
  check: (files: string[]): QualityIssue[] => {
    const project = new Project();
    project.addSourceFilesAtPaths(files);
    
    return project.getSourceFiles()
      .flatMap(createFunctionSizeIssues)
      .filter(Boolean) as QualityIssue[];
  },
  getGroupDefinition: (groupKey: string) => {
    if (groupKey === 'criticalFunctions') return {
      title: 'CRITICAL: OVERSIZED FUNCTIONS',
      description: 'Functions over 10 lines violate single responsibility principle.',
      actionGuidance: 'CRITICAL: Analyze responsibilities first - what distinct concerns does this function handle? Consider: (1) Are these separate responsibilities that belong in different methods? (2) Should this become a class with multiple methods? (3) Can you group cohesive data into objects to reduce local variables? Avoid mechanical extraction - find true responsibility boundaries. If the code has many misplaced responsibilities you may need to first inline methods to see the whole picture and find a better way of redistributing functionality. Think of this when reducing line count seems particularly hard. Taking a step backwards may open up new, better possibilities.'
    };
    if (groupKey === 'largeFunctions') return {
      title: 'LARGE FUNCTIONS',
      description: 'Functions approaching size limits should be refactored.',
      actionGuidance: 'Analyze what this function is trying to accomplish. Look for responsibility boundaries, not just line count. Consider grouping related data into objects and passing those around rather than having many local variables. If the code has many misplaced responsibilities you may need to first inline methods to see the whole picture and find a better way of redistributing functionality. Think of this when reducing line count seems particularly hard. Taking a step backwards may open up new, better possibilities.'
    };
    return undefined;
  }
};

const createFunctionSizeIssues = (sourceFile: SourceFile): QualityIssue[] => {
  const filePath = path.relative(process.cwd(), sourceFile.getFilePath());
  
  if (shouldSkipFile(filePath)) return [];
  
  const functions = sourceFile.getFunctions();
  const methods = sourceFile.getClasses().flatMap((c: ClassDeclaration) => c.getMethods());
  
  return [...functions, ...methods]
    .map(func => createFunctionSizeIssue(filePath, func))
    .filter(Boolean) as QualityIssue[];
};

const createFunctionSizeIssue = (filePath: string, func: FunctionDeclaration | MethodDeclaration): QualityIssue | null => {
  const lineCount = func.getEndLineNumber() - func.getStartLineNumber() + 1;
  const functionName = func.getName() || 'anonymous';
  const severity = lineCount > 12 ? 'critical' : null;
  
  return severity ? {
    type: 'functionSize',
    severity,
    message: `Function '${functionName}' has ${lineCount} lines`,
    file: filePath,
    line: func.getStartLineNumber()
  } : null;
};

const shouldSkipFile = (filePath: string): boolean =>
  filePath.endsWith('.d.ts') || filePath.includes('/fixtures/');
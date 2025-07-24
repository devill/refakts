import {QualityCheck, QualityIssue} from '../../dev/quality/quality-check-interface';
import {
  ArrowFunction,
  ClassDeclaration,
  Expression,
  FunctionDeclaration,
  MethodDeclaration,
  Project,
  SourceFile
} from 'ts-morph';
import * as path from 'path';
import * as ts from 'typescript';

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
      description: 'Functions over 12 lines violate single responsibility principle.',
      actionGuidance: 'CRITICAL: Analyze responsibilities first - what distinct concerns does this function handle? Consider: (1) Are these separate responsibilities that belong in different methods? (2) Should this become a class with multiple methods? (3) Can you group cohesive data into objects to reduce local variables? Avoid mechanical extraction - find true responsibility boundaries. If the code has many misplaced responsibilities you may need to first inline methods to see the whole picture and find a better way of redistributing functionality. Think of this when reducing line count seems particularly hard. Taking a step backwards may open up new, better possibilities.'
    };
    return undefined;
  }
};

const extractFunctionElements = (sourceFile: SourceFile): { functions: FunctionDeclaration[], methods: MethodDeclaration[], arrowFunctions: ArrowFunction[] } => {
  const functions = sourceFile.getFunctions();
  const methods = sourceFile.getClasses().flatMap((c: ClassDeclaration) => c.getMethods());
  const arrowFunctions = sourceFile.getDescendantsOfKind(ts.SyntaxKind.ArrowFunction);
  
  return { functions, methods, arrowFunctions };
};

const createFunctionSizeIssues = (sourceFile: SourceFile): QualityIssue[] => {
  const filePath = path.relative(process.cwd(), sourceFile.getFilePath());
  if (shouldSkipFile(filePath)) return [];
  
  const { functions, methods, arrowFunctions } = extractFunctionElements(sourceFile);
  return [
    ...functions.map(func => createFunctionSizeIssue(filePath, func)),
    ...methods.map(func => createFunctionSizeIssue(filePath, func)),
    ...arrowFunctions.map(func => createArrowFunctionSizeIssue(filePath, func))
  ].filter(Boolean) as QualityIssue[];
};

function getLineCount(func: FunctionDeclaration | MethodDeclaration | ArrowFunction) {
  return func.getEndLineNumber() - func.getStartLineNumber() + 1;
}

function getFunctionName(func: FunctionDeclaration | MethodDeclaration) {
  return func.getName() || 'anonymous';
}

function getSeverity(func: FunctionDeclaration | MethodDeclaration) {
  return getLineCount(func) > 12 ? 'critical' : null;
}

const createFunctionSizeIssue = (filePath: string, func: FunctionDeclaration | MethodDeclaration): QualityIssue | null => {
  const severity = getSeverity(func);
  return severity ? {
    type: 'functionSize',
    severity: severity,
    message: `Function '${(getFunctionName(func))}' has ${(getLineCount(func))} lines`,
    file: filePath,
    line: func.getStartLineNumber()
  } : null;
};

const createArrowFunctionSizeIssue = (filePath: string, func: ArrowFunction): QualityIssue | null => {
  if (isJestDescribeBlock(func)) return null;

  const severity = getLineCount(func) > 12 ? 'critical' : null;
  return severity ? {
    type: 'functionSize',
    severity,
    message: `Anonymous arrow function has ${(getLineCount(func))} lines`,
    file: filePath,
    line: func.getStartLineNumber()
  } : null;
};

const isJestFunction = (identifier: string): boolean => {
  return identifier === 'describe' || identifier === 'it' || identifier === 'test';
};

const getIdentifierFromExpression = (expression: Expression): string | null => {
  if (expression.getKind() === ts.SyntaxKind.Identifier) {
    const identifier = expression.asKindOrThrow(ts.SyntaxKind.Identifier);
    return identifier.getText();
  }
  return null;
};

const isJestDescribeBlock = (func: ArrowFunction): boolean => {
  const parent = func.getParent();
  if (!parent || parent.getKind() !== ts.SyntaxKind.CallExpression) return false;
  
  const callExpr = parent.asKindOrThrow(ts.SyntaxKind.CallExpression);
  const expression = callExpr.getExpression();
  const identifierText = getIdentifierFromExpression(expression);
  
  return identifierText ? isJestFunction(identifierText) : false;
};

const shouldSkipFile = (filePath: string): boolean =>
  filePath.endsWith('.d.ts') || filePath.includes('/fixtures/');
import { QualityCheck, QualityIssue } from '../quality-check-interface';
import { SyntaxKind, SourceFile, Node, CallExpression, ImportDeclaration } from 'ts-morph';
import { ProjectFactory } from '../../../core/ast/project-factory';
import * as path from 'path';

export const requireStatementsCheck: QualityCheck = {
  name: 'requireStatements',
  check: (files: string[]): QualityIssue[] => {
    const factory = new ProjectFactory();
    const project = factory.createDefault();
    project.addSourceFilesAtPaths(files);
    
    return project.getSourceFiles().flatMap(checkFileForRequireStatements);
  },
  getGroupDefinition: (groupKey: string) => groupKey === 'requireStatements' ? {
    title: 'REQUIRE() STATEMENTS DETECTED',
    description: 'CommonJS require() statements should be replaced with ES6 import statements.',
    actionGuidance: 'Replace require() with import statements and ensure all imports are at the top of the file.'
  } : undefined
};

const checkFileForRequireStatements = (sourceFile: SourceFile): QualityIssue[] => {
  const filePath = path.relative(process.cwd(), sourceFile.getFilePath());
  
  if (shouldSkipFile(filePath)) return [];
  
  const requireIssues = findRequireStatements(sourceFile, filePath);
  const importPlacementIssues = findMisplacedImports(sourceFile, filePath);
  
  return [...requireIssues, ...importPlacementIssues];
};

const findRequireStatements = (sourceFile: SourceFile, filePath: string): QualityIssue[] => {
  return sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter(isRequireCall)
    .map(requireCall => createRequireIssue(filePath, requireCall));
};

const findMisplacedImports = (sourceFile: SourceFile, filePath: string): QualityIssue[] => {
  const issues: QualityIssue[] = [];
  const importDeclarations = sourceFile.getImportDeclarations();
  
  for (const importDecl of importDeclarations) {
    if (isImportInsideFunction(importDecl)) {
      issues.push(createImportPlacementIssue(filePath, importDecl));
    }
  }
  
  return issues;
};

const isRequireCall = (node: CallExpression): boolean => {
  const expression = node.getExpression();
  return expression.getKind() === SyntaxKind.Identifier && 
         expression.getText() === 'require';
};

const isFunctionLikeSyntaxKind = (kind: SyntaxKind): boolean => {
  return kind === SyntaxKind.FunctionDeclaration || 
         kind === SyntaxKind.MethodDeclaration || 
         kind === SyntaxKind.ArrowFunction ||
         kind === SyntaxKind.FunctionExpression;
};

const isImportInsideFunction = (importDecl: ImportDeclaration): boolean => {
  let parent: Node | undefined = importDecl.getParent();
  
  while (parent) {
    if (isFunctionLikeSyntaxKind(parent.getKind())) {
      return true;
    }
    parent = parent.getParent();
  }
  
  return false;
};

const createRequireIssue = (filePath: string, requireCall: CallExpression): QualityIssue => ({
  type: 'requireStatements',
  message: `require() statement: ${truncateText(requireCall.getText())}`,
  file: filePath,
  line: requireCall.getStartLineNumber()
});

const createImportPlacementIssue = (filePath: string, importDecl: ImportDeclaration): QualityIssue => ({
  type: 'requireStatements',
  message: `import statement inside function: ${truncateText(importDecl.getText())}`,
  file: filePath,
  line: importDecl.getStartLineNumber()
});

const truncateText = (text: string): string =>
  text.length > 60 ? text.substring(0, 60) + '...' : text;

const shouldSkipFile = (filePath: string): boolean =>
  filePath.endsWith('.d.ts') || 
  filePath.includes('/fixtures/') ||
  filePath.includes('/node_modules/');
import { QualityCheck, QualityIssue } from '../quality-check-interface';
import { ProjectFactory } from '../../../core/ast/project-factory';
import { VariableDeclaration, SourceFile, SyntaxKind, Node, Project } from 'ts-morph';
import * as path from 'path';

export const singleUseVariableCheck: QualityCheck = {
  name: 'singleUseVariable',
  check: (files: string[]): QualityIssue[] => {
    return createProjectAndAnalyzeFiles(files);
  },
  getGroupDefinition: (groupKey: string) => groupKey === 'singleUseVariable' ? {
    title: 'SINGLE USE VARIABLES',
    description: 'Variables that are declared and used exactly once often reduce code clarity.',
    actionGuidance: 'Consider inlining these variables to simplify the code flow.'
  } : undefined
};

const createProjectAndAnalyzeFiles = (files: string[]): QualityIssue[] => {
  const project = createProjectWithFiles(files);
  return collectIssuesFromAllFiles(project);
};

const createProjectWithFiles = (files: string[]): Project => {
  const factory = new ProjectFactory();
  const project = factory.createDefault();
  project.addSourceFilesAtPaths(files);
  return project;
};

const collectIssuesFromAllFiles = (project: Project): QualityIssue[] => {
  const issues: QualityIssue[] = [];
  
  project.getSourceFiles().forEach((sourceFile: SourceFile) => {
    issues.push(...analyzeSourceFileForSingleUseVariables(sourceFile));
  });
  
  return issues;
};

const analyzeSourceFileForSingleUseVariables = (sourceFile: SourceFile): QualityIssue[] => {
  const filePath = path.relative(process.cwd(), sourceFile.getFilePath());
  
  if (shouldSkipFile(filePath)) return [];
  
  const singleUseVariables = findSingleUseVariables(sourceFile);
  return convertVariablesToIssues(singleUseVariables, filePath);
};

const convertVariablesToIssues = (variables: VariableDeclaration[], filePath: string): QualityIssue[] => {
  return variables.map(variable => ({
    type: 'singleUseVariable',
    severity: 'warning' as const,
    message: `Variable '${variable.getName()}' is declared and used only once - consider inlining`,
    file: filePath,
    line: variable.getStartLineNumber()
  }));
};

const shouldSkipFile = (filePath: string): boolean =>
  filePath.endsWith('.d.ts') || filePath.includes('/fixtures/');

const findSingleUseVariables = (sourceFile: SourceFile): VariableDeclaration[] => {
  return sourceFile.getVariableDeclarations()
    .filter(varDecl => hasInitializerAndIsSimple(varDecl))
    .filter(varDecl => isUsedExactlyOnce(sourceFile, varDecl));
};

const hasInitializerAndIsSimple = (varDecl: VariableDeclaration): boolean => {
  return varDecl.hasInitializer() && isSimpleVariable(varDecl);
};

const isUsedExactlyOnce = (sourceFile: SourceFile, varDecl: VariableDeclaration): boolean => {
  const variableName = varDecl.getName();
  const usageCount = countVariableUsages(sourceFile, variableName, varDecl);
  return usageCount === 1;
};

const isSimpleVariable = (varDecl: VariableDeclaration): boolean => {
  return varDecl.getNameNode().getKind() === SyntaxKind.Identifier;
};

const countVariableUsages = (sourceFile: SourceFile, variableName: string, declaration: VariableDeclaration): number => {
  const scope = findVariableScope(declaration);
  return countIdentifierUsagesInScope(scope, variableName, declaration);
};

const countIdentifierUsagesInScope = (scope: Node, variableName: string, declaration: VariableDeclaration): number => {
  let count = 0;
  
  scope.getDescendantsOfKind(SyntaxKind.Identifier).forEach(identifier => {
    if (isVariableUsage(identifier, variableName, declaration)) {
      count++;
    }
  });
  
  return count;
};

const isVariableUsage = (identifier: Node, variableName: string, declaration: VariableDeclaration): boolean => {
  return identifier.getText() === variableName && identifier !== declaration.getNameNode();
};

const findVariableScope = (declaration: VariableDeclaration): Node => {
  let current: Node | undefined = declaration;
  
  while (current) {
    if (isScopeNode(current)) {
      return current;
    }
    current = current.getParent();
  }
  
  return declaration.getSourceFile();
};

const isScopeNode = (node: Node): boolean => {
  const kind = node.getKind();
  return kind === SyntaxKind.FunctionDeclaration ||
         kind === SyntaxKind.MethodDeclaration ||
         kind === SyntaxKind.ArrowFunction ||
         kind === SyntaxKind.FunctionExpression ||
         kind === SyntaxKind.Block ||
         kind === SyntaxKind.SourceFile;
};
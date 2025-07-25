import { Project } from 'ts-morph';
import * as ts from 'typescript';
import { NodeContext } from '../../../src/core/services/core-node-context';

export function setupProject() {
  return new Project();
}

export function expectContainingDeclarationIsVariable(project: Project, fileName: string, code: string) {
  const { variable } = createTestFileWithVariable(project, fileName, code);
  const context = NodeContext.create(variable, variable.getSourceFile());
  
  const containingDeclaration = context.getContainingDeclaration();
  
  expect(containingDeclaration?.getKind()).toBe(ts.SyntaxKind.VariableDeclaration);
}

export function createTestFileWithVariable(project: Project, fileName: string, code: string) {
  const sourceFile = project.createSourceFile(fileName, code);
  const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
  return { sourceFile, variable };
}
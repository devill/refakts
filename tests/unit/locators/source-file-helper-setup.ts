import { Project } from 'ts-morph';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { SourceFileHelper } from '../../../src/core/services/source-file-helper';

export function setupProject() {
  return new Project();
}

export function findTargetVariableInFixture(project: Project, fixtureFile: string, fileName: string) {
  const fixtureContent = fs.readFileSync(path.join(__dirname, 'test-data', fixtureFile), 'utf8');
  const sourceFile = project.createSourceFile(fileName, fixtureContent);
  
  const result = findTargetVariableInSource(sourceFile);
  
  expect(result).toBeDefined();
  expect(result?.getText()).toContain('target');
  return result;
}

function findTargetVariableInSource(sourceFile: any) {
  return SourceFileHelper.findDescendant(sourceFile, (node) => 
    node.getKind() === ts.SyntaxKind.VariableDeclaration &&
    node.getText().includes('target')
  );
}

export function createTestFileWithNodes(project: Project, fileName: string, code: string) {
  return project.createSourceFile(fileName, code);
}
import {VariableResultBuilder} from '../../../src/core/locators/variable-result-builder';
import {Project} from 'ts-morph';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

export function setupProject() {
  return new Project();
}

export function setupBuilder() {
  return new VariableResultBuilder();
}

export function loadFixture(project: Project, fixtureFile: string) {
  const fixtureContent = fs.readFileSync(path.join(__dirname, 'test-data', fixtureFile), 'utf8');
  return project.createSourceFile(fixtureFile, fixtureContent);
}

export function extractVariableFromSourceFile(sourceFile: any, varName: string) {
  const declaration = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
  const identifiers = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier);
  const usages = identifiers.filter((id: any) => id.getText() === varName).slice(1);
  return { declaration, usages };
}

export function expectUsageTypes(result: any) {
  const usageTypes = result.usages.map((usage: any) => usage.usageType);
  expect(usageTypes).toContain('read');
  expect(usageTypes).toContain('write');
  expect(usageTypes).toContain('update');
}
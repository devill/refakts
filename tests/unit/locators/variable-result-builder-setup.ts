import { VariableResultBuilder } from '../../../src/locators/variable-result-builder';
import { Project } from 'ts-morph';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

export function setupProject() {
  return new Project();
}

export function setupBuilder() {
  return new VariableResultBuilder();
}

export function loadFixtureAndExtractVariable(project: Project, fixtureFile: string, fileName: string, varName: string) {
  const fixtureContent = fs.readFileSync(path.join(__dirname, 'test-data', fixtureFile), 'utf8');
  const sourceFile = project.createSourceFile(fileName, fixtureContent);
  return extractVariableFromSourceFile(sourceFile, varName);
}

interface VariableExtractionParams {
  project: Project;
  fixtureFile: string;
  fileName: string;
  varName: string;
}

export function loadFixtureAndExtractVariableWithParams(params: VariableExtractionParams) {
  const { project, fixtureFile, fileName, varName } = params;
  return loadFixtureAndExtractVariable(project, fixtureFile, fileName, varName);
}

function extractVariableFromSourceFile(sourceFile: any, varName: string) {
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
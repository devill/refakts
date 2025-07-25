import { NodeContext } from '../../../src/core/services/core-node-context';
import * as ts from 'typescript';
import { verify } from 'approvals';
import * as fs from 'fs';
import * as path from 'path';
import { setupProject } from './node-context-setup';

function processUpdateContextTestCase(sourceFile: any, code: string): string {
  const usageIdentifier = findUsageIdentifierForCode(sourceFile, code);
  
  if (usageIdentifier) {
    const context = NodeContext.create(usageIdentifier, sourceFile);
    const isUpdate = context.isUpdateContext();
    return `${code}: ${isUpdate}`;
  }
  return '';
}

function findUsageIdentifierForCode(sourceFile: any, code: string) {
  const identifiers = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier);
  return identifiers.find((id: any) => 
    id.getText() === 'x' && 
    id.getParent().getText().includes(code.split(' ')[0])
  );
}

function processContextTypeTestCase(identifier: any, index: number): string {
  if (identifier.getText() === 'x') {
    const context = NodeContext.create(identifier, identifier.getSourceFile());
    const contextType = determineContextType(context);
    return `x at position ${index}: ${contextType}`;
  }
  return '';
}

function determineContextType(context: NodeContext): string {
  if (context.isAssignmentContext()) return 'write';
  if (context.isUpdateContext()) return 'update';
  return 'read';
}

describe('NodeContext - Contexts', () => {
  let project: ReturnType<typeof setupProject>;

  beforeEach(() => {
    project = setupProject();
  });

  describe('assignment and update context detection', () => {
    it('detects assignment contexts', () => {
      const fixtureContent = fs.readFileSync(path.join(__dirname, 'test-data/assignment-context.fixture.ts'), 'utf8');
      const sourceFile = project.createSourceFile('test12.ts', fixtureContent);
      const assignment = sourceFile.getDescendantsOfKind(ts.SyntaxKind.BinaryExpression)[0];
      const leftSide = assignment.getLeft();
      const context = NodeContext.create(leftSide, sourceFile);
      
      expect(context.isAssignmentContext()).toBe(true);
    });

    it('detects update contexts', () => {
      const fixtureContent = fs.readFileSync(path.join(__dirname, 'test-data/update-contexts.fixture.ts'), 'utf8');
      const sourceFile = project.createSourceFile('test-update.ts', fixtureContent);
      
      const testCases = ['x++', '++x', 'x += 5', 'x -= 3'];
      
      const results = testCases.map(code => 
        processUpdateContextTestCase(sourceFile, code)
      ).filter(Boolean);
      
      verify(__dirname, 'update-contexts', results.join('\n'), { reporters: ['donothing'] });
    });

    it('distinguishes between read and write contexts', () => {
      const fixtureContent = fs.readFileSync(path.join(__dirname, '../locators/test-data/variable-usage-mixed.fixture.ts'), 'utf8');
      const sourceFile = project.createSourceFile('test13.ts', fixtureContent);
      
      const identifiers = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier);
      const results = identifiers.map((identifier, index) => 
        processContextTypeTestCase(identifier, index)
      ).filter(Boolean);
      
      verify(__dirname, 'context-types', results.join('\n'), { reporters: ['donothing'] });
    });
  });
});
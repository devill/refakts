import { NodeContext } from '../../../src/core/node-context';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { setupProject } from './node-context-setup';

function expectContextMethodsNotToThrow(context: NodeContext) {
  expect(() => context.getScope()).not.toThrow();
  expect(() => context.getContainingDeclaration()).not.toThrow();
}

describe('NodeContext - Edge Cases', () => {
  let project: ReturnType<typeof setupProject>;

  beforeEach(() => {
    project = setupProject();
  });

  describe('edge cases and error handling', () => {
    it('handles malformed syntax gracefully', () => {
      const fixtureContent = fs.readFileSync(path.join(__dirname, 'test-data/malformed-syntax.fixture.ts'), 'utf8');
      const sourceFile = project.createSourceFile('malformed.ts', fixtureContent);
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const context = NodeContext.create(variable, sourceFile);
      
      expectContextMethodsNotToThrow(context);
      expect(() => context.isIdentifier()).not.toThrow();
    });

    it('handles empty files', () => {
      const sourceFile = project.createSourceFile('empty.ts', '');
      const context = NodeContext.create(sourceFile, sourceFile);
      
      expect(() => context.getScope()).not.toThrow();
      expect(context.isIdentifier()).toBe(false);
    });

    it('handles complex nested structures', () => {
      const fixtureContent = fs.readFileSync(path.join(__dirname, 'test-data/complex-nested.fixture.ts'), 'utf8');
      const sourceFile = project.createSourceFile('complex.ts', fixtureContent);
      
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const context = NodeContext.create(variable, sourceFile);
      
      expectContextMethodsNotToThrow(context);
      
      const scope = context.getScope();
      const containingDecl = context.getContainingDeclaration();
      
      expect(scope).toBeDefined();
      expect(containingDecl).toBeDefined();
    });
  });
});
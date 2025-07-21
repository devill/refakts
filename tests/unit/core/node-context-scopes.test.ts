import { NodeContext } from '../../../src/core/node-context';
import * as ts from 'typescript';
import { verify } from 'approvals';
import { setupProject } from './node-context-setup';

describe('NodeContext - Scopes', () => {
  let project: ReturnType<typeof setupProject>;

  beforeEach(() => {
    project = setupProject();
  });

  describe('getScope', () => {
    it('gets scope using NodeScopeAnalyzer', () => {
      const sourceFile = project.createSourceFile('test7.ts', `
        function fn() {
          let variable = 5;
        }
      `);
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const context = NodeContext.create(variable, sourceFile);
      
      const scope = context.getScope();
      
      expect(scope.getKind()).toBe(ts.SyntaxKind.Block);
    });

    it('handles different scope types', () => {
      const testCases = [
        { code: 'let x = 5;', expectedScope: 'SourceFile' },
        { code: 'function fn() { let x = 5; }', expectedScope: 'Block' },
        { code: 'if (true) { let x = 5; }', expectedScope: 'Block' },
        { code: 'const arrow = () => { let x = 5; };', expectedScope: 'Block' }
      ];
      
      const results = testCases.map((testCase, index) => {
        const sourceFile = project.createSourceFile(`test-scope-${index}.ts`, testCase.code);
        const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration).pop();
        if (variable) {
          const context = NodeContext.create(variable, sourceFile);
          const scope = context.getScope();
          const actualScope = ts.SyntaxKind[scope.getKind()];
          return `${testCase.code}: ${actualScope === testCase.expectedScope ? 'PASS' : `FAIL (got ${actualScope})`}`;
        }
        return '';
      }).filter(Boolean);
      
      verify(__dirname, 'scope-types', results.join('\n'), { reporters: ['donothing'] });
    });
  });
});
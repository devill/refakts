import { NodeContext } from '../../../src/core/services/core-node-context';
import { ShadowingAnalysisRequestFactory } from '../../../src/core/shadowing-analysis-request-factory';
import * as ts from 'typescript';
import { verify } from 'approvals';
import { setupProject } from './node-context-setup';

function processVariableMatchTestCase(project: any, testCase: any, index: number): string {
  const sourceFile = project.createSourceFile(`test-match-${index}.ts`, testCase.code);
  const identifiers = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier);
  const targetIdentifier = identifiers.find((id: any) => id.getText() === testCase.varName);
  
  if (targetIdentifier) {
    return evaluateVariableMatch(targetIdentifier, testCase);
  } else {
    return `${testCase.code} - ${testCase.varName}: IDENTIFIER_NOT_FOUND`;
  }
}

function evaluateVariableMatch(targetIdentifier: any, testCase: any): string {
  const context = NodeContext.create(targetIdentifier, targetIdentifier.getSourceFile());
  const matches = context.matchesVariableName(testCase.varName);
  return `${testCase.code} - ${testCase.varName}: ${matches === testCase.expected ? 'PASS' : 'FAIL'}`;
}

describe('NodeContext - Variables', () => {
  let project: ReturnType<typeof setupProject>;

  beforeEach(() => {
    project = setupProject();
  });

  describe('createShadowingAnalysisRequest', () => {
    it('creates shadowing analysis request from usage and declaration', () => {
      const sourceFile = project.createSourceFile('test3.ts', `
        let x = 5;
        function fn() {
          let x = 10;
          console.log(x);
        }
      `);
      
      const declarations = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration);
      const outerDeclaration = declarations[0];
      const innerDeclaration = declarations[1];
      
      const request = ShadowingAnalysisRequestFactory.create(
        innerDeclaration, 
        outerDeclaration, 
        'x'
      );
      
      expect(request).toBeDefined();
      expect(request.variableName).toBe('x');
      expect(request.usage.node).toBe(innerDeclaration);
      expect(request.declaration.node).toBe(outerDeclaration);
    });

    it('handles cross-file shadowing analysis', () => {
      const sourceFile1 = project.createSourceFile('file1.ts', 'export let globalVar = 5;');
      const sourceFile2 = project.createSourceFile('file2.ts', 'let globalVar = 10;');
      
      const declaration1 = sourceFile1.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const declaration2 = sourceFile2.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      
      const request = ShadowingAnalysisRequestFactory.create(
        declaration2, 
        declaration1, 
        'globalVar'
      );
      
      expect(request.usage.sourceFile).toBe(sourceFile2);
      expect(request.declaration.sourceFile).toBe(sourceFile1);
    });
  });

  describe('matchesVariableName', () => {
    it('matches variable names correctly', () => {
      const sourceFile = project.createSourceFile('test9.ts', 'let testVar = 5;');
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const context = NodeContext.create(variable, sourceFile);
      
      expect(context.matchesVariableName('testVar')).toBe(true);
      expect(context.matchesVariableName('otherVar')).toBe(false);
    });

    it('handles complex declaration patterns', () => {
      const testCases = [
        { code: 'let simpleVar = 5;', varName: 'simpleVar', expected: true },
        { code: 'let simpleVar = 5;', varName: 'wrongName', expected: false },
        { code: 'function myFunction() {}', varName: 'myFunction', expected: true },
        { code: 'const [a, b] = array;', varName: 'a', expected: true }
      ];
      
      const results = testCases.map((testCase, index) => 
        processVariableMatchTestCase(project, testCase, index)
      );
      
      verify(__dirname, 'variable-name-matching', results.join('\n'), { reporters: ['donothing'] });
    });
  });
});
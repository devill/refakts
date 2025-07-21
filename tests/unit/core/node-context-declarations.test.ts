import { NodeContext } from '../../../src/core/node-context';
import * as ts from 'typescript';
import { verify } from 'approvals';
import { setupProject, expectContainingDeclarationIsVariable } from './node-context-setup';

function processDeclarationTestCase(project: any, testCase: any, index: number): string {
  const sourceFile = project.createSourceFile(`test-decl-${index}.ts`, testCase.code);
  const targetNode = findTargetNodeByType(sourceFile, testCase.nodeType);
  
  if (targetNode) {
    const context = NodeContext.create(targetNode, sourceFile);
    const isMatching = context.isMatchingDeclaration(testCase.varName);
    return `${testCase.nodeType} - ${testCase.varName}: ${isMatching}`;
  }
  return '';
}

function findTargetNodeByType(sourceFile: any, nodeType: string): any {
  if (nodeType === 'VariableDeclaration') {
    return sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
  } else if (nodeType === 'Parameter') {
    return sourceFile.getDescendantsOfKind(ts.SyntaxKind.Parameter)[0];
  } else if (nodeType === 'FunctionDeclaration') {
    return sourceFile.getDescendantsOfKind(ts.SyntaxKind.FunctionDeclaration)[0];
  }
  return null;
}

describe('NodeContext - Declarations', () => {
  let project: ReturnType<typeof setupProject>;

  beforeEach(() => {
    project = setupProject();
  });

  describe('getContainingDeclaration', () => {
    it('finds containing function declaration', () => {
      const sourceFile = project.createSourceFile('test4.ts', `
        function outerFn() {
          let variable = 5;
        }
      `);
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const context = NodeContext.create(variable, sourceFile);
      
      const containingDeclaration = context.getContainingDeclaration();
      
      expect(containingDeclaration?.getKind()).toBe(ts.SyntaxKind.VariableDeclaration);
    });

    it('finds containing class declaration', () => {
      expectContainingDeclarationIsVariable(project, 'test5.ts', `
        class MyClass {
          method() {
            let variable = 5;
          }
        }
      `);
    });

    it('returns the declaration itself for top-level variables', () => {
      expectContainingDeclarationIsVariable(project, 'test6.ts', 'let topLevel = 5;');
    });
  });

  describe('declaration type checks', () => {
    it('identifies variable declarations', () => {
      const sourceFile = project.createSourceFile('test10.ts', 'let myVar = 5;');
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const context = NodeContext.create(variable, sourceFile);
      
      expect(context.isVariableDeclaration('myVar')).toBe(true);
      expect(context.isVariableDeclaration('wrongName')).toBe(false);
    });

    it('identifies parameter declarations', () => {
      const sourceFile = project.createSourceFile('test11.ts', 'function fn(param: string) {}');
      const parameter = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Parameter)[0];
      const context = NodeContext.create(parameter, sourceFile);
      
      expect(context.isParameterDeclaration('param')).toBe(true);
      expect(context.isParameterDeclaration('wrongName')).toBe(false);
    });

    it('identifies matching declarations', () => {
      const testCases = [
        { code: 'let variable = 5;', nodeType: 'VariableDeclaration', varName: 'variable' },
        { code: 'function fn(param: string) {}', nodeType: 'Parameter', varName: 'param' },
        { code: 'function namedFn() {}', nodeType: 'FunctionDeclaration', varName: 'namedFn' }
      ];
      
      const results = testCases.map((testCase, index) => 
        processDeclarationTestCase(project, testCase, index)
      ).filter(Boolean);
      
      verify(__dirname, 'matching-declarations', results.join('\n'), { reporters: ['donothing'] });
    });
  });
});
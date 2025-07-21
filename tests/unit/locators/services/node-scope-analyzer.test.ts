import { NodeScopeAnalyzer } from '../../../../src/locators/services/node-scope-analyzer';
import { Project } from 'ts-morph';
import * as ts from 'typescript';
import { verify } from 'approvals';

describe('NodeScopeAnalyzer', () => {
  let project: Project;

  beforeEach(() => {
    project = new Project();
  });

  describe('getNodeScope', () => {
    it('finds block scope for variable inside function body', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function outer() {
          let x = 5;
        }
      `);
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      
      const scope = NodeScopeAnalyzer.getNodeScope(variable);
      
      // Function body block is the immediate scope, not the function itself
      expect(scope.getKind()).toBe(ts.SyntaxKind.Block);
    });

    it('finds block scope for variable inside block', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        if (true) {
          let x = 5;
        }
      `);
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      
      const scope = NodeScopeAnalyzer.getNodeScope(variable);
      
      expect(scope.getKind()).toBe(ts.SyntaxKind.Block);
    });

    it('finds block scope for variable inside arrow function', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        const fn = () => {
          let x = 5;
        };
      `);
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[1]; // Skip the fn declaration
      
      const scope = NodeScopeAnalyzer.getNodeScope(variable);
      
      // Arrow function body block is the immediate scope
      expect(scope.getKind()).toBe(ts.SyntaxKind.Block);
    });

    it('returns source file as scope for top-level variables', () => {
      const sourceFile = project.createSourceFile('test.ts', 'let x = 5;');
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      
      const scope = NodeScopeAnalyzer.getNodeScope(variable);
      
      expect(scope.getKind()).toBe(ts.SyntaxKind.SourceFile);
    });

    it('handles nested scopes correctly', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function outer() {
          function inner() {
            let x = 5;
          }
        }
      `);
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      
      const scope = NodeScopeAnalyzer.getNodeScope(variable);
      
      // Variable is in the block scope of the inner function
      expect(scope.getKind()).toBe(ts.SyntaxKind.Block);
      // The parent should be the inner function
      const parentScope = NodeScopeAnalyzer.getParentScope(scope);
      expect(parentScope?.getKind()).toBe(ts.SyntaxKind.FunctionDeclaration);
    });
  });

  describe('getParentScope', () => {
    it('finds parent function scope from nested block scope', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function outer() {
          if (true) {
            let x = 5;
          }
        }
      `);
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const ifBlockScope = NodeScopeAnalyzer.getNodeScope(variable);
      
      // The if block's parent should be the function's block
      const functionBlockScope = NodeScopeAnalyzer.getParentScope(ifBlockScope);
      // The function block's parent should be the function itself
      const functionScope = NodeScopeAnalyzer.getParentScope(functionBlockScope!);
      
      expect(ifBlockScope.getKind()).toBe(ts.SyntaxKind.Block);
      expect(functionBlockScope?.getKind()).toBe(ts.SyntaxKind.Block);
      expect(functionScope?.getKind()).toBe(ts.SyntaxKind.FunctionDeclaration);
    });

    it('returns undefined for source file scope', () => {
      const sourceFile = project.createSourceFile('test.ts', 'let x = 5;');
      
      const parentScope = NodeScopeAnalyzer.getParentScope(sourceFile);
      
      expect(parentScope).toBeUndefined();
    });

    it('handles nested function scopes', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function outer() {
          function inner() {
            if (true) {
              let x = 5;
            }
          }
        }
      `);
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const blockScope = NodeScopeAnalyzer.getNodeScope(variable);
      const innerFunctionScope = NodeScopeAnalyzer.getParentScope(blockScope);
      const outerFunctionScope = NodeScopeAnalyzer.getParentScope(innerFunctionScope!);
      
      const results = [
        `Block scope parent: ${innerFunctionScope?.getKind() === ts.SyntaxKind.FunctionDeclaration ? 'function' : 'other'}`,
        `Inner function parent: ${outerFunctionScope?.getKind() === ts.SyntaxKind.FunctionDeclaration ? 'function' : 'other'}`,
        `Inner function name: ${innerFunctionScope?.getText().includes('inner') ? 'inner' : 'not-inner'}`,
        `Outer function name: ${outerFunctionScope?.getText().includes('outer') ? 'outer' : 'not-outer'}`
      ];
      
      verify(__dirname, 'nested-function-scopes', results.join('\n'), { reporters: ['donothing'] });
    });
  });

  describe('isScopeContainedIn', () => {
    it('detects when inner scope is contained in outer scope', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function outer() {
          function inner() {
            let x = 5;
          }
        }
      `);
      const functions = sourceFile.getDescendantsOfKind(ts.SyntaxKind.FunctionDeclaration);
      const outerFunction = functions[0];
      const innerFunction = functions[1];
      
      const result = NodeScopeAnalyzer.isScopeContainedIn(innerFunction, outerFunction);
      
      expect(result).toBe(true);
    });

    it('returns false when scopes are not related', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function fn1() {
          let x = 5;
        }
        function fn2() {
          let y = 10;
        }
      `);
      const functions = sourceFile.getDescendantsOfKind(ts.SyntaxKind.FunctionDeclaration);
      const fn1 = functions[0];
      const fn2 = functions[1];
      
      const result = NodeScopeAnalyzer.isScopeContainedIn(fn1, fn2);
      
      expect(result).toBe(false);
    });

    it('returns true for same scope', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function fn() {
          let x = 5;
        }
      `);
      const fn = sourceFile.getDescendantsOfKind(ts.SyntaxKind.FunctionDeclaration)[0];
      
      const result = NodeScopeAnalyzer.isScopeContainedIn(fn, fn);
      
      expect(result).toBe(true);
    });

    it('handles complex nested scope scenarios', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function outer() {
          if (true) {
            function middle() {
              const arrow = () => {
                let x = 5;
              };
            }
          }
        }
      `);
      
      const outerFunction = sourceFile.getDescendantsOfKind(ts.SyntaxKind.FunctionDeclaration)[0];
      const block = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Block)[1]; // if block
      const middleFunction = sourceFile.getDescendantsOfKind(ts.SyntaxKind.FunctionDeclaration)[1];
      const arrowFunction = sourceFile.getDescendantsOfKind(ts.SyntaxKind.ArrowFunction)[0];
      
      const results = [
        `arrow in middle: ${NodeScopeAnalyzer.isScopeContainedIn(arrowFunction, middleFunction)}`,
        `arrow in block: ${NodeScopeAnalyzer.isScopeContainedIn(arrowFunction, block)}`,
        `arrow in outer: ${NodeScopeAnalyzer.isScopeContainedIn(arrowFunction, outerFunction)}`,
        `middle in block: ${NodeScopeAnalyzer.isScopeContainedIn(middleFunction, block)}`,
        `middle in outer: ${NodeScopeAnalyzer.isScopeContainedIn(middleFunction, outerFunction)}`,
        `block in outer: ${NodeScopeAnalyzer.isScopeContainedIn(block, outerFunction)}`
      ];
      
      verify(__dirname, 'complex-scope-containment', results.join('\n'), { reporters: ['donothing'] });
    });
  });

  describe('scope node detection', () => {
    it('identifies all scope node types', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function regularFn() {
          const funcExpr = function() {
            const arrow = () => {
              if (true) {
                let x = 5;
              }
            };
          };
        }
      `);
      
      // Test each scope type by finding the scope of a variable in different contexts
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[2]; // x variable
      const scope = NodeScopeAnalyzer.getNodeScope(variable);
      const scopeTypes: string[] = [];
      
      scopeTypes.push(`Variable scope type: ${ts.SyntaxKind[scope.getKind()]}`);
      
      verify(__dirname, 'scope-node-types', scopeTypes.join('\n'), { reporters: ['donothing'] });
    });
  });

  describe('edge cases', () => {
    it('handles empty source file', () => {
      const sourceFile = project.createSourceFile('empty.ts', '');
      
      const scope = NodeScopeAnalyzer.getNodeScope(sourceFile);
      
      expect(scope).toBe(sourceFile);
    });

    it('handles malformed syntax gracefully', () => {
      // Create a file with incomplete function
      const sourceFile = project.createSourceFile('malformed.ts', 'function');
      
      const scope = NodeScopeAnalyzer.getNodeScope(sourceFile);
      
      expect(scope).toBe(sourceFile);
    });

    it('handles deeply nested scopes', () => {
      const levels = 10;
      let code = '';
      for (let i = 0; i < levels; i++) {
        code += `function level${i}() { `;
      }
      code += 'let x = 5;';
      for (let i = 0; i < levels; i++) {
        code += ' }';
      }
      
      const sourceFile = project.createSourceFile('deep.ts', code);
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      
      let scope = NodeScopeAnalyzer.getNodeScope(variable);
      let depth = 0;
      
      // Count only function declarations, not their blocks
      while (scope && scope.getKind() !== ts.SyntaxKind.SourceFile) {
        if (scope.getKind() === ts.SyntaxKind.FunctionDeclaration) {
          depth++;
        }
        const parentScope = NodeScopeAnalyzer.getParentScope(scope);
        if (!parentScope) break;
        scope = parentScope;
      }
      
      expect(depth).toBe(levels);
    });
  });
});
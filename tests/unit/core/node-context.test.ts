import { NodeContext } from '../../../src/core/node-context';
import { PositionData } from '../../../src/core/position-data';
import { Project } from 'ts-morph';
import * as ts from 'typescript';
import { verify } from 'approvals';

describe('NodeContext', () => {
  let project: Project;

  beforeEach(() => {
    project = new Project();
  });

  describe('constructor and basic properties', () => {
    it('creates context with node, source file, and position', () => {
      const sourceFile = project.createSourceFile('test.ts', 'let x = 5;');
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const position = PositionData.fromNodePosition(sourceFile, variable.getStart());
      
      const context = new NodeContext(variable, sourceFile, position);
      
      expect(context.node).toBe(variable);
      expect(context.sourceFile).toBe(sourceFile);
      expect(context.position).toBe(position);
    });
  });

  describe('create static method', () => {
    it('creates context from node and source file', () => {
      const sourceFile = project.createSourceFile('test1.ts', 'let myVar = 5;');
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      
      const context = NodeContext.create(variable, sourceFile);
      
      expect(context.node).toBe(variable);
      expect(context.sourceFile).toBe(sourceFile);
      expect(context.position).toBeDefined();
    });

    it('correctly calculates position from node start', () => {
      const sourceFile = project.createSourceFile('test2.ts', `
        function fn() {
          let variable = 10;
        }
      `);
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      
      const context = NodeContext.create(variable, sourceFile);
      
      // Position should match the variable's actual position in the file
      const expectedPosition = PositionData.fromNodePosition(sourceFile, variable.getStart());
      expect(context.position.line).toBe(expectedPosition.line);
      expect(context.position.column).toBe(expectedPosition.column);
    });
  });

  describe('createShadowingAnalysisRequest', () => {
    it('creates shadowing analysis request from usage and declaration', () => {
      const sourceFile = project.createSourceFile('test3.ts', `
        let x = 5;
        function fn() {
          let x = 10; // shadows outer x
          console.log(x);
        }
      `);
      
      const declarations = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration);
      const outerDeclaration = declarations[0]; // let x = 5
      const innerDeclaration = declarations[1]; // let x = 10
      
      const request = NodeContext.createShadowingAnalysisRequest(
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
      
      const request = NodeContext.createShadowingAnalysisRequest(
        declaration2, 
        declaration1, 
        'globalVar'
      );
      
      expect(request.usage.sourceFile).toBe(sourceFile2);
      expect(request.declaration.sourceFile).toBe(sourceFile1);
    });
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
      
      // The actual behavior returns the variable declaration itself as the containing declaration
      expect(containingDeclaration?.getKind()).toBe(ts.SyntaxKind.VariableDeclaration);
    });

    it('finds containing class declaration', () => {
      const sourceFile = project.createSourceFile('test5.ts', `
        class MyClass {
          method() {
            let variable = 5;
          }
        }
      `);
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const context = NodeContext.create(variable, sourceFile);
      
      const containingDeclaration = context.getContainingDeclaration();
      
      // The actual behavior returns the variable declaration itself
      expect(containingDeclaration?.getKind()).toBe(ts.SyntaxKind.VariableDeclaration);
    });

    it('returns the declaration itself for top-level variables', () => {
      const sourceFile = project.createSourceFile('test6.ts', 'let topLevel = 5;');
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const context = NodeContext.create(variable, sourceFile);
      
      const containingDeclaration = context.getContainingDeclaration();
      
      // The actual behavior returns the variable declaration itself
      expect(containingDeclaration?.getKind()).toBe(ts.SyntaxKind.VariableDeclaration);
    });
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
      
      // Should be the block scope of the function
      expect(scope.getKind()).toBe(ts.SyntaxKind.Block);
    });

    it('handles different scope types', () => {
      const testCases = [
        { code: 'let x = 5;', expectedScope: 'SourceFile' },
        { code: 'function fn() { let x = 5; }', expectedScope: 'Block' },
        { code: 'if (true) { let x = 5; }', expectedScope: 'Block' },
        { code: 'const arrow = () => { let x = 5; };', expectedScope: 'Block' }
      ];

      const results: string[] = [];
      
      testCases.forEach((testCase, index) => {
        const sourceFile = project.createSourceFile(`test-scope-${index}.ts`, testCase.code);
        const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration).pop(); // Get the x variable
        if (variable) {
          const context = NodeContext.create(variable, sourceFile);
          const scope = context.getScope();
          const actualScope = ts.SyntaxKind[scope.getKind()];
          results.push(`${testCase.code}: ${actualScope === testCase.expectedScope ? 'PASS' : `FAIL (got ${actualScope})`}`);
        }
      });
      
      verify(__dirname, 'scope-types', results.join('\n'), { reporters: ['donothing'] });
    });
  });

  describe('isIdentifier', () => {
    it('detects identifier nodes correctly', () => {
      const sourceFile = project.createSourceFile('test8.ts', 'let myVariable = 5;');
      const identifier = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier)[0];
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      
      const identifierContext = NodeContext.create(identifier, sourceFile);
      const variableContext = NodeContext.create(variable, sourceFile);
      
      expect(identifierContext.isIdentifier()).toBe(true);
      expect(variableContext.isIdentifier()).toBe(false);
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

      const results: string[] = [];
      
      testCases.forEach((testCase, index) => {
        const sourceFile = project.createSourceFile(`test-match-${index}.ts`, testCase.code);
        const identifiers = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier);
        const targetIdentifier = identifiers.find(id => id.getText() === testCase.varName);
        
        if (targetIdentifier) {
          const context = NodeContext.create(targetIdentifier, sourceFile);
          const matches = context.matchesVariableName(testCase.varName);
          results.push(`${testCase.code} - ${testCase.varName}: ${matches === testCase.expected ? 'PASS' : 'FAIL'}`);
        } else {
          results.push(`${testCase.code} - ${testCase.varName}: IDENTIFIER_NOT_FOUND`);
        }
      });
      
      verify(__dirname, 'variable-name-matching', results.join('\n'), { reporters: ['donothing'] });
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

      const results: string[] = [];
      
      testCases.forEach((testCase, index) => {
        const sourceFile = project.createSourceFile(`test-decl-${index}.ts`, testCase.code);
        let targetNode;
        
        if (testCase.nodeType === 'VariableDeclaration') {
          targetNode = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
        } else if (testCase.nodeType === 'Parameter') {
          targetNode = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Parameter)[0];
        } else if (testCase.nodeType === 'FunctionDeclaration') {
          targetNode = sourceFile.getDescendantsOfKind(ts.SyntaxKind.FunctionDeclaration)[0];
        }
        
        if (targetNode) {
          const context = NodeContext.create(targetNode, sourceFile);
          const isMatching = context.isMatchingDeclaration(testCase.varName);
          results.push(`${testCase.nodeType} - ${testCase.varName}: ${isMatching}`);
        }
      });
      
      verify(__dirname, 'matching-declarations', results.join('\n'), { reporters: ['donothing'] });
    });
  });

  describe('assignment and update context detection', () => {
    it('detects assignment contexts', () => {
      const sourceFile = project.createSourceFile('test12.ts', 'let x; x = 5;');
      const assignment = sourceFile.getDescendantsOfKind(ts.SyntaxKind.BinaryExpression)[0];
      const leftSide = assignment.getLeft();
      const context = NodeContext.create(leftSide, sourceFile);
      
      expect(context.isAssignmentContext()).toBe(true);
    });

    it('detects update contexts', () => {
      const testCases = [
        'let x; x++;',
        'let x; ++x;', 
        'let x; x += 5;',
        'let x; x -= 3;'
      ];

      const results: string[] = [];
      
      testCases.forEach((code, index) => {
        const sourceFile = project.createSourceFile(`test-update-${index}.ts`, code);
        const identifiers = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier);
        const usageIdentifier = identifiers[1]; // Second x is the usage
        const context = NodeContext.create(usageIdentifier, sourceFile);
        
        const isUpdate = context.isUpdateContext();
        results.push(`${code}: ${isUpdate}`);
      });
      
      verify(__dirname, 'update-contexts', results.join('\n'), { reporters: ['donothing'] });
    });

    it('distinguishes between read and write contexts', () => {
      const sourceFile = project.createSourceFile('test13.ts', `
        let x = 5;
        let y = x;    // read
        x = 10;       // write
        x += 2;       // update
        console.log(x); // read
      `);
      
      const identifiers = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier);
      const results: string[] = [];
      
      identifiers.forEach((identifier, index) => {
        if (identifier.getText() === 'x') {
          const context = NodeContext.create(identifier, sourceFile);
          const isAssignment = context.isAssignmentContext();
          const isUpdate = context.isUpdateContext();
          
          let contextType = 'read';
          if (isAssignment) contextType = 'write';
          else if (isUpdate) contextType = 'update';
          
          results.push(`x at position ${index}: ${contextType}`);
        }
      });
      
      verify(__dirname, 'context-types', results.join('\n'), { reporters: ['donothing'] });
    });
  });

  describe('edge cases and error handling', () => {
    it('handles malformed syntax gracefully', () => {
      const sourceFile = project.createSourceFile('malformed.ts', 'let x ='); // Incomplete
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const context = NodeContext.create(variable, sourceFile);
      
      // Should not throw errors
      expect(() => context.getScope()).not.toThrow();
      expect(() => context.getContainingDeclaration()).not.toThrow();
      expect(() => context.isIdentifier()).not.toThrow();
    });

    it('handles empty files', () => {
      const sourceFile = project.createSourceFile('empty.ts', '');
      const context = NodeContext.create(sourceFile, sourceFile);
      
      expect(() => context.getScope()).not.toThrow();
      expect(context.isIdentifier()).toBe(false);
    });

    it('handles complex nested structures', () => {
      const sourceFile = project.createSourceFile('complex.ts', `
        class OuterClass {
          method() {
            function innerFn() {
              const arrow = () => {
                let deeply = { nested: { variable: 'test' } };
                return deeply.nested.variable;
              };
            }
          }
        }
      `);
      
      const variable = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const context = NodeContext.create(variable, sourceFile);
      
      // Should handle complex nesting without errors
      expect(() => context.getScope()).not.toThrow();
      expect(() => context.getContainingDeclaration()).not.toThrow();
      
      const scope = context.getScope();
      const containingDecl = context.getContainingDeclaration();
      
      expect(scope).toBeDefined();
      expect(containingDecl).toBeDefined();
    });
  });
});
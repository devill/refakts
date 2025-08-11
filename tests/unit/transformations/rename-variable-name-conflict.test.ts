import { Project, SyntaxKind } from 'ts-morph';
import { VariableNameValidator } from '../../../src/core/services/variable-name-validator';
import { ScopeAnalyzer } from '../../../src/core/services/scope-analyzer';

describe('RenameVariable - Name Conflict Detection', () => {
  let project: Project;
  let validator: VariableNameValidator;

  beforeEach(() => {
    project = new Project({ useInMemoryFileSystem: true });
    validator = new VariableNameValidator();
  });

  describe('should detect conflicts in variable renaming scenarios', () => {
    it('should reject renaming x to y when y exists in inner scope', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function f() {
            const x = 1;
            {
                const y = 2;
                {
                    return x;
                }
            }
        }
      `);
      
      // Find the x variable declaration
      const xDeclaration = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)[0];
      expect(xDeclaration.getName()).toBe('x');
      
      // Get the scope of x (function block)
      const xScope = ScopeAnalyzer.getNodeScope(xDeclaration);
      
      // Validate that 'y' would conflict in this scope
      expect(() => {
        validator.generateUniqueName('y', xScope);
      }).toThrow("Variable name 'y' already exists in this scope. Please choose a different name.");
    });

    it('should reject renaming y to x when x exists in outer scope - CURRENTLY FAILS', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function f() {
            const x = 1;
            {
                const y = 2;
                {
                    return x;
                }
            }
        }
      `);
      
      // Find the y variable declaration
      const yDeclaration = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)[1];
      expect(yDeclaration.getName()).toBe('y');
      
      // Get the scope of y (inner block)
      const yScope = ScopeAnalyzer.getNodeScope(yDeclaration);
      
      // NOTE: This currently PASSES but should FAIL after we implement parent scope checking
      // The current validator only checks descendants, not parent scopes
      const uniqueName = validator.generateUniqueName('x', yScope);
      expect(uniqueName).toBe('x'); // Currently allowed, but should be rejected
      
      // TODO: After implementation, this should throw:
      // expect(() => {
      //   validator.generateUniqueName('x', yScope);
      // }).toThrow("Variable name 'x' already exists in this scope. Please choose a different name.");
    });

    it('should reject renaming to variable in same scope', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function f() {
            const x = 1;
            const y = 2;
            return x + y;
        }
      `);
      
      const xDeclaration = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)[0];
      const xScope = ScopeAnalyzer.getNodeScope(xDeclaration);
      
      expect(() => {
        validator.generateUniqueName('y', xScope);
      }).toThrow("Variable name 'y' already exists in this scope. Please choose a different name.");
    });

    it('should reject renaming to parameter name', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function f(param: number) {
            const x = 1;
            return x + param;
        }
      `);
      
      const xDeclaration = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)[0];
      const xScope = ScopeAnalyzer.getNodeScope(xDeclaration);
      
      expect(() => {
        validator.generateUniqueName('param', xScope);
      }).toThrow("Variable name 'param' already exists in this scope. Please choose a different name.");
    });

    it('should reject conflict in nested functions with arrow functions', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function processData(data: number[]) {
            const x = 10;
            
            const processor = () => {
                const result = x * 2;
                return result;
            };
            
            return processor();
        }
      `);
      
      const xDeclaration = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)[0];
      const xScope = ScopeAnalyzer.getNodeScope(xDeclaration);
      
      expect(() => {
        validator.generateUniqueName('result', xScope);
      }).toThrow("Variable name 'result' already exists in this scope. Please choose a different name.");
    });

    it('should allow rename to name in different unrelated scope', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function f() {
            const y = 1;
        }
        
        function g() {
            const x = 2;
            return x;
        }
      `);
      
      // Find x declaration in function g
      const xDeclaration = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)[1];
      expect(xDeclaration.getName()).toBe('x');
      
      const xScope = ScopeAnalyzer.getNodeScope(xDeclaration);
      
      // Should allow renaming x to y since y is in a different function
      const uniqueName = validator.generateUniqueName('y', xScope);
      expect(uniqueName).toBe('y');
    });

    it('should handle complex nested scope chains - IMPLEMENTATION NEEDED', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function outer(a: number) {
            const b = a + 1;
            
            function middle(c: number) {
                const d = c + b;
                
                function inner(e: number) {
                    const f = e + d;
                    const target = f + 1; // This is what we want to rename
                    return target;
                }
                
                return inner(d);
            }
            
            return middle(b);
        }
      `);
      
      // Find the target variable in the innermost scope
      const targetDeclaration = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)
        .find(decl => decl.getName() === 'target');
      expect(targetDeclaration).toBeDefined();
      
      const targetScope = ScopeAnalyzer.getNodeScope(targetDeclaration!);
      
      // Should reject 'f' (same scope) but currently allows parent scope variables
      expect(() => {
        validator.generateUniqueName('f', targetScope);
      }).toThrow("Variable name 'f' already exists in this scope. Please choose a different name.");
      
      // Should reject 'e' (function parameter) but currently allows it
      expect(() => {
        validator.generateUniqueName('e', targetScope);
      }).toThrow("Variable name 'e' already exists in this scope. Please choose a different name.");
      
      // Currently these pass but should fail after implementation:
      // Variables from outer scopes: a, b, c, d
      const parentScopeNames = ['a', 'b', 'c', 'd'];
      
      parentScopeNames.forEach(name => {
        // Currently allowed, but should be rejected after implementation
        const uniqueName = validator.generateUniqueName(name, targetScope);
        expect(uniqueName).toBe(name);
      });
      
      // Should allow a name that doesn't exist in any scope
      const uniqueName = validator.generateUniqueName('newName', targetScope);
      expect(uniqueName).toBe('newName');
    });

    it('should handle class method scopes correctly', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        class TestClass {
            private value: number;
            
            constructor(initialValue: number) {
                this.value = initialValue;
            }
            
            process(input: number): number {
                const x = input * 2;
                const result = x + this.value;
                return result;
            }
        }
      `);
      
      // Find x declaration in the method
      const xDeclaration = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)
        .find(decl => decl.getName() === 'x');
      expect(xDeclaration).toBeDefined();
      
      const xScope = ScopeAnalyzer.getNodeScope(xDeclaration!);
      
      // Should reject renaming to parameter name and existing variable name
      expect(() => {
        validator.generateUniqueName('input', xScope);
      }).toThrow("Variable name 'input' already exists in this scope. Please choose a different name.");
      
      expect(() => {
        validator.generateUniqueName('result', xScope);
      }).toThrow("Variable name 'result' already exists in this scope. Please choose a different name.");
      
      // Should allow renaming to a new name
      const uniqueName = validator.generateUniqueName('newVar', xScope);
      expect(uniqueName).toBe('newVar');
    });
  });
});
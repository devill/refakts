import { Project, SyntaxKind } from 'ts-morph';
import { VariableNameValidator } from '../../../src/core/services/variable-name-validator';
import { ScopeAnalyzer } from '../../../src/core/services/scope-analyzer';

describe('RenameVariable - Name Conflict Detection - FAILING TESTS', () => {
  let project: Project;
  let validator: VariableNameValidator;

  beforeEach(() => {
    project = new Project({ useInMemoryFileSystem: true });
    validator = new VariableNameValidator();
  });

  describe('should detect parent scope conflicts - THESE TESTS SHOULD FAIL', () => {
    it('should reject renaming y to x when x exists in parent scope', () => {
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
      
      // This SHOULD fail but currently passes - x from parent scope should be detected
      expect(() => {
        validator.generateUniqueName('x', yScope);
      }).toThrow("Variable name 'x' already exists in this scope. Please choose a different name.");
    });

    it('should reject renaming when conflicting with variables in ancestor scopes', () => {
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
      
      // All of these SHOULD fail but currently pass - parent scope variables should be detected
      const parentScopeNames = ['a', 'b', 'c', 'd'];
      
      parentScopeNames.forEach(name => {
        expect(() => {
          validator.generateUniqueName(name, targetScope);
        }).toThrow(`Variable name '${name}' already exists in this scope. Please choose a different name.`);
      });
    });

    it('should reject renaming to variables accessible through scope chain', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function processData(data: number[]) {
            const multiplier = 10;
            
            const processor = (item: number) => {
                const localVar = item * multiplier;
                return localVar;
            };
            
            return processor;
        }
      `);
      
      const localVarDeclaration = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)
        .find(decl => decl.getName() === 'localVar');
      expect(localVarDeclaration).toBeDefined();
      
      const localVarScope = ScopeAnalyzer.getNodeScope(localVarDeclaration!);
      
      // This SHOULD fail - 'multiplier' and 'data' are accessible from parent scopes
      expect(() => {
        validator.generateUniqueName('multiplier', localVarScope);
      }).toThrow("Variable name 'multiplier' already exists in this scope. Please choose a different name.");
      
      expect(() => {
        validator.generateUniqueName('data', localVarScope);
      }).toThrow("Variable name 'data' already exists in this scope. Please choose a different name.");
    });
  });
});
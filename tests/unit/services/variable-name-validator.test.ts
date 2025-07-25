import { Project, SyntaxKind } from 'ts-morph';
import { VariableNameValidator } from '../../../src/core/services/variable-name-validator';
import * as fixtures from './validator-scenarios';

describe('VariableNameValidator', () => {
  let validator: VariableNameValidator;
  let project: Project;

  beforeEach(() => {
    validator = new VariableNameValidator();
    project = new Project({ useInMemoryFileSystem: true });
  });

  describe('generateUniqueName', () => {
    it('should return base name when no conflict exists', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.simpleFunction);
      const functionBlock = sourceFile.getDescendantsOfKind(SyntaxKind.Block)[0];
      
      const uniqueName = validator.generateUniqueName('newVar', functionBlock);
      
      expect(uniqueName).toBe('newVar');
    });

    it('should throw error when variable name already exists', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.simpleFunction);
      const functionBlock = sourceFile.getDescendantsOfKind(SyntaxKind.Block)[0];
      
      expect(() => {
        validator.generateUniqueName('result', functionBlock);
      }).toThrow("Variable name 'result' already exists in this scope. Please choose a different name.");
    });

    it('should throw error when parameter name conflicts', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.functionWithParameters);
      const functionBlock = sourceFile.getDescendantsOfKind(SyntaxKind.Block)[0];
      
      expect(() => {
        validator.generateUniqueName('data', functionBlock);
      }).toThrow("Variable name 'data' already exists in this scope. Please choose a different name.");
      
      expect(() => {
        validator.generateUniqueName('options', functionBlock);
      }).toThrow("Variable name 'options' already exists in this scope. Please choose a different name.");
    });

    it('should detect conflicts in nested scopes', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.nestedScopes);
      const outerBlock = sourceFile.getDescendantsOfKind(SyntaxKind.Block)[0]; // Outer function block
      
      // Variables from inner scope should conflict when checking outer scope because they're descendants
      expect(() => {
        validator.generateUniqueName('innerVar', outerBlock);
      }).toThrow("Variable name 'innerVar' already exists in this scope. Please choose a different name.");
    });

    it('should detect conflicts in class method scope', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.classScope);
      const methodBlock = sourceFile.getDescendantsOfKind(SyntaxKind.Block)[1]; // Calculate method block
      
      expect(() => {
        validator.generateUniqueName('input', methodBlock);
      }).toThrow("Variable name 'input' already exists in this scope. Please choose a different name.");
      
      expect(() => {
        validator.generateUniqueName('result', methodBlock);
      }).toThrow("Variable name 'result' already exists in this scope. Please choose a different name.");
    });

    it('should allow names that do not conflict in empty scope', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.emptyScope);
      const functionBlock = sourceFile.getDescendantsOfKind(SyntaxKind.Block)[0];
      
      const uniqueName1 = validator.generateUniqueName('anyName', functionBlock);
      const uniqueName2 = validator.generateUniqueName('anotherName', functionBlock);
      
      expect(uniqueName1).toBe('anyName');
      expect(uniqueName2).toBe('anotherName');
    });
  });

  describe('getExistingVariableNames', () => {
    it('should collect all variable names in simple function', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.simpleFunction);
      const functionBlock = sourceFile.getDescendantsOfKind(SyntaxKind.Block)[0];
      
      const existingNames = validator.getExistingVariableNames(functionBlock);
      
      expect(existingNames).toEqual(new Set(['input', 'result', 'output']));
    });

    it('should collect parameter names and variable names', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.functionWithParameters);
      const functionBlock = sourceFile.getDescendantsOfKind(SyntaxKind.Block)[0];
      
      const existingNames = validator.getExistingVariableNames(functionBlock);
      
      expect(existingNames).toEqual(new Set(['data', 'options', 'callback', 'processed', 'config', 'item']));
    });

    it('should collect names from nested scopes', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.nestedScopes);
      const outerBlock = sourceFile.getDescendantsOfKind(SyntaxKind.Block)[0];
      
      const existingNames = validator.getExistingVariableNames(outerBlock);
      
      // Should include variables and parameters from all nested scopes
      expect(existingNames).toEqual(new Set([
        'param1', 'outerVar', 'param2', 'innerVar', 'anotherVar'
      ]));
    });

    it('should handle destructuring parameters', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.destructuringParameters);
      const functionBlock = sourceFile.getDescendantsOfKind(SyntaxKind.Block)[0];
      
      const existingNames = validator.getExistingVariableNames(functionBlock);
      
      // Should include destructured parameter names and local variables
      expect(existingNames).toEqual(new Set([
        'url', 'method', 'options', 'normalizedUrl', 'upperMethod'
      ]));
    });

    it('should collect names from arrow functions', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.arrowFunctions);
      const outerBlock = sourceFile.getDescendantsOfKind(SyntaxKind.Block)[0];
      
      const existingNames = validator.getExistingVariableNames(outerBlock);
      
      // Should include variables from nested arrow functions
      expect(existingNames).toEqual(new Set([
        'items', 'filtered', 'transformed', 'item', 'converted'
      ]));
    });

    it('should return empty set for scope with no variables', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.emptyScope);
      const functionBlock = sourceFile.getDescendantsOfKind(SyntaxKind.Block)[0];
      
      const existingNames = validator.getExistingVariableNames(functionBlock);
      
      expect(existingNames).toEqual(new Set());
    });

    it('should collect module-level variables', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.moduleLevel);
      
      const existingNames = validator.getExistingVariableNames(sourceFile);
      
      expect(existingNames).toEqual(new Set(['globalVar', 'anotherGlobal', 'mutableGlobal']));
    });
  });

  describe('edge cases and error conditions', () => {
    it('should handle class constructor parameters', () => {
      const sourceFile = project.createSourceFile('test.ts', fixtures.classScope);
      const constructorBlock = sourceFile.getDescendantsOfKind(SyntaxKind.Block)[0];
      
      const existingNames = validator.getExistingVariableNames(constructorBlock);
      
      expect(existingNames).toEqual(new Set(['initialValue']));
    });

    it('should handle function expressions', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        const fn = function(param: string) {
          const local = param.toUpperCase();
          return local;
        };
      `);
      const functionBlock = sourceFile.getDescendantsOfKind(SyntaxKind.Block)[0];
      
      const existingNames = validator.getExistingVariableNames(functionBlock);
      
      expect(existingNames).toEqual(new Set(['param', 'local']));
    });

    it('should handle complex nested structures', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function complex(a: number) {
          const b = a + 1;
          
          if (b > 0) {
            const c = b * 2;
            
            for (let i = 0; i < c; i++) {
              const d = i + c;
              console.log(d);
            }
          }
          
          const e = b - 1;
          return e;
        }
      `);
      const functionBlock = sourceFile.getDescendantsOfKind(SyntaxKind.Block)[0];
      
      const existingNames = validator.getExistingVariableNames(functionBlock);
      
      expect(existingNames).toEqual(new Set(['a', 'b', 'c', 'i', 'd', 'e']));
    });

    it('should handle variable naming edge cases', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function test() {
          const _private = 1;
          const $jquery = 2;
          const var123 = 3;
          const αβγ = 4; // Unicode identifiers
        }
      `);
      const functionBlock = sourceFile.getDescendantsOfKind(SyntaxKind.Block)[0];
      
      const existingNames = validator.getExistingVariableNames(functionBlock);
      
      expect(existingNames).toEqual(new Set(['_private', '$jquery', 'var123', 'αβγ']));
    });

    it('should throw error for case-sensitive conflicts', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function test() {
          const myVar = 1;
          const MYVAR = 2;
        }
      `);
      const functionBlock = sourceFile.getDescendantsOfKind(SyntaxKind.Block)[0];
      
      // Should detect both myVar and MYVAR as separate names
      expect(() => {
        validator.generateUniqueName('myVar', functionBlock);
      }).toThrow("Variable name 'myVar' already exists in this scope. Please choose a different name.");
      
      expect(() => {
        validator.generateUniqueName('MYVAR', functionBlock);
      }).toThrow("Variable name 'MYVAR' already exists in this scope. Please choose a different name.");
      
      // But myvar (different case) should be allowed
      const uniqueName = validator.generateUniqueName('myvar', functionBlock);
      expect(uniqueName).toBe('myvar');
    });
  });
});
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
      expect(validator.generateUniqueName('newVar', 
        project.createSourceFile('test.ts', fixtures.simpleFunction)
               .getDescendantsOfKind(SyntaxKind.Block)[0]
      )).toBe('newVar');
    });

    it('should throw error when variable name already exists', () => {
      expect(() => {
        validator.generateUniqueName('result', 
          project.createSourceFile('test.ts', fixtures.simpleFunction)
                 .getDescendantsOfKind(SyntaxKind.Block)[0]
        );
      }).toThrow("Variable name 'result' already exists in this scope. Please choose a different name.");
    });

    it('should throw error when parameter name conflicts', () => {
      expect(() => {
        validator.generateUniqueName('data', project.createSourceFile('test1.ts', fixtures.functionWithParameters)
                                               .getDescendantsOfKind(SyntaxKind.Block)[0]);
      }).toThrow("Variable name 'data' already exists in this scope. Please choose a different name.");
      
      expect(() => {
        validator.generateUniqueName('options', project.createSourceFile('test2.ts', fixtures.functionWithParameters)
                                               .getDescendantsOfKind(SyntaxKind.Block)[0]);
      }).toThrow("Variable name 'options' already exists in this scope. Please choose a different name.");
    });

    it('should detect conflicts in nested scopes', () => {
      expect(() => {
        validator.generateUniqueName('innerVar', 
          project.createSourceFile('test.ts', fixtures.nestedScopes)
                 .getDescendantsOfKind(SyntaxKind.Block)[0]
        );
      }).toThrow("Variable name 'innerVar' already exists in this scope. Please choose a different name.");
    });

    it('should detect conflicts in class method scope', () => {
      expect(() => {
        validator.generateUniqueName('input', project.createSourceFile('test3.ts', fixtures.classScope)
                                             .getDescendantsOfKind(SyntaxKind.Block)[1]);
      }).toThrow("Variable name 'input' already exists in this scope. Please choose a different name.");
      
      expect(() => {
        validator.generateUniqueName('result', project.createSourceFile('test4.ts', fixtures.classScope)
                                             .getDescendantsOfKind(SyntaxKind.Block)[1]);
      }).toThrow("Variable name 'result' already exists in this scope. Please choose a different name.");
    });

    it('should allow names that do not conflict in empty scope', () => {
      expect(validator.generateUniqueName('anyName', project.createSourceFile('test5.ts', fixtures.emptyScope)
                                             .getDescendantsOfKind(SyntaxKind.Block)[0])).toBe('anyName');
      expect(validator.generateUniqueName('anotherName', project.createSourceFile('test6.ts', fixtures.emptyScope)
                                             .getDescendantsOfKind(SyntaxKind.Block)[0])).toBe('anotherName');
    });
  });

  describe('getExistingVariableNames', () => {
    it('should collect all variable names in simple function', () => {
      expect(validator.getExistingVariableNames(project.createSourceFile('test.ts', fixtures.simpleFunction).getDescendantsOfKind(SyntaxKind.Block)[0])).toEqual(new Set(['input', 'result', 'output']));
    });

    it('should collect parameter names and variable names', () => {
      expect(validator.getExistingVariableNames(project.createSourceFile('test.ts', fixtures.functionWithParameters).getDescendantsOfKind(SyntaxKind.Block)[0])).toEqual(new Set(['data', 'options', 'callback', 'processed', 'config', 'item']));
    });

    it('should collect names from nested scopes', () => {
      expect(validator.getExistingVariableNames(project.createSourceFile('test.ts', fixtures.nestedScopes).getDescendantsOfKind(SyntaxKind.Block)[0])).toEqual(new Set([
        'param1', 'outerVar', 'param2', 'innerVar', 'anotherVar'
      ]));
    });

    it('should handle destructuring parameters', () => {
      expect(validator.getExistingVariableNames(project.createSourceFile('test.ts', fixtures.destructuringParameters).getDescendantsOfKind(SyntaxKind.Block)[0])).toEqual(new Set([
        'url', 'method', 'options', 'normalizedUrl', 'upperMethod'
      ]));
    });

    it('should collect names from arrow functions', () => {
      expect(validator.getExistingVariableNames(project.createSourceFile('test.ts', fixtures.arrowFunctions).getDescendantsOfKind(SyntaxKind.Block)[0])).toEqual(new Set([
        'items', 'filtered', 'transformed', 'item', 'converted', 'processor'
      ]));
    });

    it('should return empty set for scope with no variables', () => {
      expect(validator.getExistingVariableNames(project.createSourceFile('test.ts', fixtures.emptyScope).getDescendantsOfKind(SyntaxKind.Block)[0])).toEqual(new Set());
    });

    it('should collect module-level variables', () => {
      expect(validator.getExistingVariableNames(project.createSourceFile('test.ts', fixtures.moduleLevel))).toEqual(new Set(['globalVar', 'anotherGlobal', 'mutableGlobal']));
    });
  });

  describe('edge cases and error conditions', () => {
    it('should handle class constructor parameters', () => {
      expect(validator.getExistingVariableNames(project.createSourceFile('test.ts', fixtures.classScope).getDescendantsOfKind(SyntaxKind.Block)[0])).toEqual(new Set(['initialValue']));
    });

    it('should handle function expressions', () => {
      expect(validator.getExistingVariableNames(project.createSourceFile('test.ts', `
        const fn = function(param: string) {
          const local = param.toUpperCase();
          return local;
        };
      `).getDescendantsOfKind(SyntaxKind.Block)[0])).toEqual(new Set(['param', 'local', 'fn']));
    });

    it('should handle complex nested structures', () => {
      expect(validator.getExistingVariableNames(project.createSourceFile('test.ts', `
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
      `).getDescendantsOfKind(SyntaxKind.Block)[0])).toEqual(new Set(['a', 'b', 'c', 'i', 'd', 'e']));
    });

    it('should handle variable naming edge cases', () => {
      expect(validator.getExistingVariableNames(project.createSourceFile('test.ts', `
        function test() {
          const _private = 1;
          const $jquery = 2;
          const var123 = 3;
          const αβγ = 4;
        }
      `).getDescendantsOfKind(SyntaxKind.Block)[0])).toEqual(new Set(['_private', '$jquery', 'var123', 'αβγ']));
    });

    it('should throw error for case-sensitive conflicts', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function test() {
          const myVar = 1;
          const MYVAR = 2;
        }
      `);
      expect(() => {
        validator.generateUniqueName('myVar', sourceFile.getDescendantsOfKind(SyntaxKind.Block)[0]);
      }).toThrow("Variable name 'myVar' already exists in this scope. Please choose a different name.");
      
      expect(() => {
        validator.generateUniqueName('MYVAR', sourceFile.getDescendantsOfKind(SyntaxKind.Block)[0]);
      }).toThrow("Variable name 'MYVAR' already exists in this scope. Please choose a different name.");
      expect(validator.generateUniqueName('myvar', sourceFile.getDescendantsOfKind(SyntaxKind.Block)[0])).toBe('myvar');
    });
  });
});
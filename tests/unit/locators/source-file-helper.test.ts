import { SourceFileHelper } from '../../../src/locators/source-file-helper';
import { Project } from 'ts-morph';
import * as ts from 'typescript';
import { verify } from 'approvals';

describe('SourceFileHelper', () => {
  let project: Project;

  beforeEach(() => {
    project = new Project();
  });

  describe('findDescendant', () => {
    it('finds first matching descendant', () => {
      const sourceFile = project.createSourceFile('test.ts', `
        function fn() {
          let variable = 5;
          let another = 10;
        }
      `);
      
      const result = SourceFileHelper.findDescendant(sourceFile, (node) => 
        node.getKind() === ts.SyntaxKind.VariableDeclaration
      );
      
      expect(result).toBeDefined();
      expect(result?.getKind()).toBe(ts.SyntaxKind.VariableDeclaration);
      expect(result?.getText()).toContain('variable');
    });

    it('returns undefined when no match found', () => {
      const sourceFile = project.createSourceFile('test2.ts', `
        function fn() {
          console.log('hello');
        }
      `);
      
      const result = SourceFileHelper.findDescendant(sourceFile, (node) => 
        node.getKind() === ts.SyntaxKind.ClassDeclaration
      );
      
      expect(result).toBeUndefined();
    });

    it('stops at first match', () => {
      const sourceFile = project.createSourceFile('test3.ts', `
        let first = 1;
        let second = 2;
        let third = 3;
      `);
      
      const result = SourceFileHelper.findDescendant(sourceFile, (node) => 
        node.getKind() === ts.SyntaxKind.VariableDeclaration
      );
      
      expect(result?.getText()).toContain('first');
    });

    it('handles complex predicates', () => {
      const sourceFile = project.createSourceFile('test4.ts', `
        let x = 5;
        let targetVariable = 10;
        let y = 15;
      `);
      
      const result = SourceFileHelper.findDescendant(sourceFile, (node) => 
        node.getKind() === ts.SyntaxKind.VariableDeclaration &&
        node.getText().includes('targetVariable')
      );
      
      expect(result).toBeDefined();
      expect(result?.getText()).toContain('targetVariable');
    });

    it('handles various node types and patterns', () => {
      const sourceFile = project.createSourceFile('test5.ts', `
        class MyClass {
          private field = 5;
          
          method() {
            const arrow = () => {
              let local = 'test';
              return local;
            };
          }
        }
        
        function globalFn() {
          return 42;
        }
      `);
      
      const testCases = [
        { 
          description: 'ClassDeclaration', 
          predicate: (node: any) => node.getKind() === ts.SyntaxKind.ClassDeclaration,
          expectedText: 'MyClass'
        },
        {
          description: 'PropertyDeclaration',
          predicate: (node: any) => node.getKind() === ts.SyntaxKind.PropertyDeclaration,
          expectedText: 'field'
        },
        {
          description: 'ArrowFunction',
          predicate: (node: any) => node.getKind() === ts.SyntaxKind.ArrowFunction,
          expectedText: '=>'
        },
        {
          description: 'StringLiteral',
          predicate: (node: any) => node.getKind() === ts.SyntaxKind.StringLiteral,
          expectedText: 'test'
        }
      ];

      const results: string[] = [];
      
      testCases.forEach(testCase => {
        const result = SourceFileHelper.findDescendant(sourceFile, testCase.predicate);
        const found = result ? 'FOUND' : 'NOT_FOUND';
        const hasExpectedText = result?.getText().includes(testCase.expectedText) ? 'CORRECT' : 'INCORRECT';
        results.push(`${testCase.description}: ${found} - ${hasExpectedText}`);
      });
      
      verify(__dirname, 'complex-predicates', results.join('\n'), { reporters: ['donothing'] });
    });

    it('handles nested structures correctly', () => {
      const sourceFile = project.createSourceFile('test6.ts', `
        function outer() {
          function inner() {
            function deepest() {
              let target = 'found';
            }
          }
        }
      `);
      
      const result = SourceFileHelper.findDescendant(sourceFile, (node) => 
        node.getKind() === ts.SyntaxKind.VariableDeclaration &&
        node.getText().includes('target')
      );
      
      expect(result).toBeDefined();
      expect(result?.getText()).toContain('target');
    });

    it('handles empty source files', () => {
      const sourceFile = project.createSourceFile('empty.ts', '');
      
      const result = SourceFileHelper.findDescendant(sourceFile, (node) => 
        node.getKind() === ts.SyntaxKind.VariableDeclaration
      );
      
      expect(result).toBeUndefined();
    });

    it('handles malformed syntax gracefully', () => {
      const sourceFile = project.createSourceFile('malformed.ts', 'let x ='); // Incomplete
      
      // Should not throw errors even with malformed syntax
      expect(() => {
        SourceFileHelper.findDescendant(sourceFile, (node) => 
          node.getKind() === ts.SyntaxKind.VariableDeclaration
        );
      }).not.toThrow();
    });

    it('performance with large files', () => {
      // Create a file with many nodes
      let code = '';
      for (let i = 0; i < 100; i++) {
        code += `let var${i} = ${i};\n`;
      }
      code += 'let targetVar = 999;'; // Target at the end
      
      const sourceFile = project.createSourceFile('large.ts', code);
      
      const startTime = Date.now();
      const result = SourceFileHelper.findDescendant(sourceFile, (node) => 
        node.getKind() === ts.SyntaxKind.VariableDeclaration &&
        node.getText().includes('targetVar')
      );
      const endTime = Date.now();
      
      expect(result).toBeDefined();
      expect(result?.getText()).toContain('targetVar');
      // Should complete reasonably quickly (under 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('handles early return in predicate', () => {
      const sourceFile = project.createSourceFile('test7.ts', `
        let first = 1;
        let second = 2;
        let third = 3;
      `);
      
      let callCount = 0;
      const result = SourceFileHelper.findDescendant(sourceFile, (node) => {
        callCount++;
        return node.getKind() === ts.SyntaxKind.VariableDeclaration;
      });
      
      expect(result).toBeDefined();
      // Should have stopped early, not visited all nodes
      expect(callCount).toBeLessThan(50); // Arbitrary reasonable upper bound
    });

    it('handles different predicate patterns', () => {
      const sourceFile = project.createSourceFile('test8.ts', `
        function fn() {
          let variable = 5;
        }
      `);
      
      const testResults: string[] = [];
      
      // Test with explicit true/false
      const result1 = SourceFileHelper.findDescendant(sourceFile, (node) => {
        if (node.getKind() === ts.SyntaxKind.VariableDeclaration) {
          return true;
        }
        return false;
      });
      testResults.push(`Explicit boolean: ${result1 ? 'FOUND' : 'NOT_FOUND'}`);
      
      // Test with boolean conversion
      const result2 = SourceFileHelper.findDescendant(sourceFile, (node) => {
        return node.getKind() === ts.SyntaxKind.VariableDeclaration;
      });
      testResults.push(`Direct comparison: ${result2 ? 'FOUND' : 'NOT_FOUND'}`);
      
      // Test with complex condition
      const result3 = SourceFileHelper.findDescendant(sourceFile, (node) => {
        return node.getKind() === ts.SyntaxKind.VariableDeclaration && 
               node.getText().includes('variable');
      });
      testResults.push(`Complex condition: ${result3 ? 'FOUND' : 'NOT_FOUND'}`);
      
      verify(__dirname, 'predicate-patterns', testResults.join('\n'), { reporters: ['donothing'] });
    });
  });

  describe('edge cases and error handling', () => {
    it('handles predicate that throws errors', () => {
      const sourceFile = project.createSourceFile('test9.ts', 'let x = 5;');
      
      expect(() => {
        SourceFileHelper.findDescendant(sourceFile, (_node) => {
          throw new Error('Predicate error');
        });
      }).toThrow('Predicate error');
    });

    it('handles extremely deep nesting', () => {
      let code = '';
      const depth = 50;
      
      // Create deeply nested structure
      for (let i = 0; i < depth; i++) {
        code += `function level${i}() { `;
      }
      code += 'let deepVar = "deep";';
      for (let i = 0; i < depth; i++) {
        code += ' }';
      }
      
      const sourceFile = project.createSourceFile('deep.ts', code);
      
      const result = SourceFileHelper.findDescendant(sourceFile, (node) => 
        node.getKind() === ts.SyntaxKind.VariableDeclaration
      );
      
      expect(result).toBeDefined();
      expect(result?.getText()).toContain('deepVar');
    });

    it('handles Unicode and special characters', () => {
      const sourceFile = project.createSourceFile('unicode.ts', `
        let αβγ = 'greek';
        let 中文 = 'chinese';
        let emoji = '🚀';
        let target = 'found';
      `);
      
      const result = SourceFileHelper.findDescendant(sourceFile, (node) => 
        node.getKind() === ts.SyntaxKind.VariableDeclaration &&
        node.getText().includes('target')
      );
      
      expect(result).toBeDefined();
      expect(result?.getText()).toContain('target');
    });
  });
});
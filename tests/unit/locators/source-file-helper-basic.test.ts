import { SourceFileHelper } from '../../../src/core/services/source-file-helper';
import * as ts from 'typescript';
import { verify } from 'approvals';
import * as fs from 'fs';
import * as path from 'path';
import { setupProject, findTargetVariableInFixture } from './source-file-helper-setup';

describe('SourceFileHelper - Basic Operations', () => {
  let project: ReturnType<typeof setupProject>;

  beforeEach(() => {
    project = setupProject();
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
      const fixtureContent = fs.readFileSync(path.join(__dirname, 'test-data/class-with-method.fixture.ts'), 'utf8');
      const sourceFile = project.createSourceFile('test5.ts', fixtureContent);
      
      const testCases = [
        { description: 'ClassDeclaration', syntaxKind: ts.SyntaxKind.ClassDeclaration, expectedText: 'MyClass' },
        { description: 'PropertyDeclaration', syntaxKind: ts.SyntaxKind.PropertyDeclaration, expectedText: 'field' },
        { description: 'ArrowFunction', syntaxKind: ts.SyntaxKind.ArrowFunction, expectedText: '=>' },
        { description: 'StringLiteral', syntaxKind: ts.SyntaxKind.StringLiteral, expectedText: 'test' }
      ];

      const results = testCases.map(testCase => {
        const result = SourceFileHelper.findDescendant(sourceFile, (node: any) => node.getKind() === testCase.syntaxKind);
        const found = result ? 'FOUND' : 'NOT_FOUND';
        const hasExpectedText = result?.getText().includes(testCase.expectedText) ? 'CORRECT' : 'INCORRECT';
        return `${testCase.description}: ${found} - ${hasExpectedText}`;
      });
      
      verify(__dirname, 'complex-predicates', results.join('\n'), { reporters: ['donothing'] });
    });

    it('handles nested structures correctly', () => {
      findTargetVariableInFixture(project, 'nested-functions.fixture.ts', 'test6.ts');
    });
  });
});
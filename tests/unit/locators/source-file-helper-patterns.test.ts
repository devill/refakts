import { SourceFileHelper } from '../../../src/locators/source-file-helper';
import * as ts from 'typescript';
import { verify } from 'approvals';
import { setupProject } from './source-file-helper-setup';

describe('SourceFileHelper - Patterns', () => {
  let project: ReturnType<typeof setupProject>;

  beforeEach(() => {
    project = setupProject();
  });

  describe('different predicate patterns', () => {
    it('handles different predicate patterns', () => {
      const sourceFile = project.createSourceFile('test8.ts', `
        function fn() {
          let variable = 5;
        }
      `);
      
      const testResults: string[] = [];
      
      const result1 = SourceFileHelper.findDescendant(sourceFile, (node) => {
        if (node.getKind() === ts.SyntaxKind.VariableDeclaration) {
          return true;
        }
        return false;
      });
      testResults.push(`Explicit boolean: ${result1 ? 'FOUND' : 'NOT_FOUND'}`);
      
      const result2 = SourceFileHelper.findDescendant(sourceFile, (node) => {
        return node.getKind() === ts.SyntaxKind.VariableDeclaration;
      });
      testResults.push(`Direct comparison: ${result2 ? 'FOUND' : 'NOT_FOUND'}`);
      
      const result3 = SourceFileHelper.findDescendant(sourceFile, (node) => {
        return node.getKind() === ts.SyntaxKind.VariableDeclaration && 
               node.getText().includes('variable');
      });
      testResults.push(`Complex condition: ${result3 ? 'FOUND' : 'NOT_FOUND'}`);
      
      verify(__dirname, 'predicate-patterns', testResults.join('\n'), { reporters: ['donothing'] });
    });
  });
});
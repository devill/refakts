import { SourceFileHelper } from '../../../src/locators/source-file-helper';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { setupProject, findTargetVariableInFixture } from './source-file-helper-setup';

describe('SourceFileHelper - Edge Cases', () => {
  let project: ReturnType<typeof setupProject>;

  beforeEach(() => {
    project = setupProject();
  });

  describe('edge cases and error handling', () => {
    it('handles empty source files', () => {
      const sourceFile = project.createSourceFile('empty.ts', '');
      
      const result = SourceFileHelper.findDescendant(sourceFile, (node) => 
        node.getKind() === ts.SyntaxKind.VariableDeclaration
      );
      
      expect(result).toBeUndefined();
    });

    it('handles malformed syntax gracefully', () => {
      const fixtureContent = fs.readFileSync(path.join(__dirname, 'test-data/malformed-syntax.fixture.ts'), 'utf8');
      const sourceFile = project.createSourceFile('malformed.ts', fixtureContent);
      
      expect(() => {
        SourceFileHelper.findDescendant(sourceFile, (node) => 
          node.getKind() === ts.SyntaxKind.VariableDeclaration
        );
      }).not.toThrow();
    });

    it('performance with large files', () => {
      const fixtureContent = fs.readFileSync(path.join(__dirname, 'test-data/large-file.fixture.ts'), 'utf8');
      const sourceFile = project.createSourceFile('large.ts', fixtureContent);
      
      const startTime = Date.now();
      const result = SourceFileHelper.findDescendant(sourceFile, (node) => 
        node.getKind() === ts.SyntaxKind.VariableDeclaration &&
        node.getText().includes('targetVar')
      );
      const endTime = Date.now();
      
      expect(result).toBeDefined();
      expect(result?.getText()).toContain('targetVar');
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
      expect(callCount).toBeLessThan(50);
    });

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
      findTargetVariableInFixture(project, 'unicode-variables.fixture.ts', 'unicode.ts');
    });
  });
});
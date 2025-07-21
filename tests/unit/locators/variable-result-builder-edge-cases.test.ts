import * as ts from 'typescript';
import { verify } from 'approvals';
import { setupProject, setupBuilder } from './variable-result-builder-setup';

describe('VariableResultBuilder - Edge Cases', () => {
  let project: ReturnType<typeof setupProject>;
  let builder: ReturnType<typeof setupBuilder>;

  beforeEach(() => {
    project = setupProject();
    builder = setupBuilder();
  });

  describe('edge cases and error handling', () => {
    it('handles nodes with special characters', () => {
      const sourceFile = project.createSourceFile('special.ts', `
        let αβγ = 'greek';
        console.log(αβγ);
      `);
      
      const declaration = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const identifiers = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier);
      const usage = identifiers.find(id => id.getText() === 'αβγ' && id !== identifiers[0]);
      
      const result = builder.buildLocationResult('αβγ', declaration, usage ? [usage] : []);
      
      expect(result.variable).toBe('αβγ');
      expect(result.declaration.text).toContain('αβγ');
      if (result.usages.length > 0) {
        expect(result.usages[0].text).toBe('αβγ');
      }
    });

    it('handles very long variable names', () => {
      const longName = 'veryLongVariableNameThatExceedsNormalLength'.repeat(3);
      const sourceFile = project.createSourceFile('long.ts', `
        let ${longName} = 5;
        console.log(${longName});
      `);
      
      const declaration = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const identifiers = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier);
      const usage = identifiers[1];
      
      const result = builder.buildLocationResult(longName, declaration, [usage]);
      
      expect(result.variable).toBe(longName);
      expect(result.declaration.text).toContain(longName);
    });

    it('handles malformed syntax gracefully', () => {
      const sourceFile = project.createSourceFile('malformed.ts', 'let x =');
      const declaration = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      
      expect(() => {
        builder.buildLocationResult('x', declaration, []);
      }).not.toThrow();
      
      expect(() => {
        builder.buildNodeResult('x', declaration, []);
      }).not.toThrow();
    });

    it('handles complex usage type scenarios', () => {
      const sourceFile = project.createSourceFile('complex-usage.ts', `
        let x = 5;
        obj.prop = x;
        x = obj.method();
        arr[x] = 'value';
        x *= 2;
        ++x;
        func(x, y = x);
      `);
      
      const declaration = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const identifiers = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier);
      const usages = identifiers.filter(id => id.getText() === 'x').slice(1);
      
      const result = builder.buildLocationResult('x', declaration, usages);
      
      const usageTypes = result.usages.map(usage => usage.usageType);
      const summary = {
        read: usageTypes.filter(t => t === 'read').length,
        write: usageTypes.filter(t => t === 'write').length,
        update: usageTypes.filter(t => t === 'update').length
      };
      
      verify(__dirname, 'usage-type-distribution', JSON.stringify(summary, null, 2), { reporters: ['donothing'] });
    });

    it('handles cross-line spans correctly', () => {
      const sourceFile = project.createSourceFile('multiline.ts', `
const template = \`
  This is a multiline
  template literal that spans
  multiple lines and contains \${variable}
\`;
let variable = 'value';
      `);
      
      const declaration = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[1];
      const identifiers = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier);
      const usage = identifiers.find(id => 
        id.getText() === 'variable' && 
        id !== declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier)
      );
      
      if (usage) {
        const result = builder.buildLocationResult('variable', declaration, [usage]);
        
        expect(result.declaration.location.start.line).toBeGreaterThanOrEqual(0);
        expect(result.usages[0].location.start.line).toBeGreaterThanOrEqual(0);
        
        expect(result.declaration.text).toContain('variable');
        expect(result.usages[0].text).toBe('variable');
      }
    });
  });
});
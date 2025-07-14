import * as ts from 'typescript';
import { setupProject, setupBuilder, loadFixtureAndExtractVariable } from './variable-result-builder-setup';

describe('VariableResultBuilder - Formatting', () => {
  let project: ReturnType<typeof setupProject>;
  let builder: ReturnType<typeof setupBuilder>;

  beforeEach(() => {
    project = setupProject();
    builder = setupBuilder();
  });

  describe('formatAsLocationStrings', () => {
    it('formats declaration and usages as location strings', () => {
      const { declaration, usages } = loadFixtureAndExtractVariable(project, 'simple-variable.fixture.ts', 'test8.ts', 'myVar');
      
      const result = builder.buildLocationResult('myVar', declaration, usages);
      const formatted = result.formatAsLocationStrings();
      
      expect(formatted).toHaveLength(3);
      expect(formatted.every(str => str.includes('test8.ts'))).toBe(true);
      expect(formatted.some(str => str.includes('myVar'))).toBe(true);
    });

    it('handles empty usages', () => {
      const sourceFile = project.createSourceFile('test9.ts', 'let variable = 5;');
      const declaration = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      
      const result = builder.buildLocationResult('variable', declaration, []);
      const formatted = result.formatAsLocationStrings();
      
      expect(formatted).toHaveLength(1);
      expect(formatted[0]).toContain('variable = 5');
    });
  });

  describe('location range creation', () => {
    it('creates accurate location ranges', () => {
      const sourceFile = project.createSourceFile('location-test.ts', `
function example() {
  let variable = 'test';
  return variable;
}
      `);
      
      const declaration = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const identifier = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier)[2];
      
      const result = builder.buildLocationResult('variable', declaration, [identifier]);
      
      const declarationLoc = result.declaration.location;
      const usageLoc = result.usages[0].location;
      
      expect(declarationLoc.start.line).toBe(3);
      expect(usageLoc.start.line).toBe(4);
      
      expect(declarationLoc.file).toContain('location-test.ts');
      expect(usageLoc.file).toContain('location-test.ts');
    });

    it('handles various node types and positions', () => {
      const sourceFile = project.createSourceFile('complex.ts', `
const obj = {
  prop: 'value',
  method() {
    let localVar = this.prop;
    return localVar + '!';
  }
};
      `);
      
      const declaration = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const identifiers = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier);
      const usage = identifiers.find(id => 
        id.getText() === 'localVar' && 
        id.getStart() !== declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier)?.getStart()
      );
      
      const result = builder.buildLocationResult('localVar', declaration, usage ? [usage] : []);
      
      expect(result.declaration.location.start.line).toBeGreaterThan(0);
      if (result.usages.length > 0) {
        expect(result.usages[0].location.start.line).toBeGreaterThan(result.declaration.location.start.line);
      }
    });
  });
});
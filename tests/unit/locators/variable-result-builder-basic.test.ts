import * as ts from 'typescript';
import { setupProject, setupBuilder, loadFixtureAndExtractVariable, expectUsageTypes } from './variable-result-builder-setup';

describe('VariableResultBuilder - Basic Operations', () => {
  let project: ReturnType<typeof setupProject>;
  let builder: ReturnType<typeof setupBuilder>;

  beforeEach(() => {
    project = setupProject();
    builder = setupBuilder();
  });

  describe('buildLocationResult', () => {
    it('builds result with declaration and usages', () => {
      const { declaration, usages } = loadFixtureAndExtractVariable(project, 'simple-variable.fixture.ts', 'test.ts', 'myVar');
      
      const result = builder.buildLocationResult('myVar', declaration, usages);
      
      expect(result.variable).toBe('myVar');
      expect(result.declaration).toBeDefined();
      expect(result.declaration.kind).toBe('declaration');
      expect(result.usages).toHaveLength(2);
      expect(result.usages.every(usage => usage.kind === 'usage')).toBe(true);
    });

    it('handles variables with no usages', () => {
      const sourceFile = project.createSourceFile('test2.ts', 'let unusedVar = 5;');
      const declaration = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      
      const result = builder.buildLocationResult('unusedVar', declaration, []);
      
      expect(result.variable).toBe('unusedVar');
      expect(result.declaration).toBeDefined();
      expect(result.usages).toHaveLength(0);
    });

    it('correctly assigns usage types', () => {
      const { declaration, usages } = loadFixtureAndExtractVariable(project, 'variable-usage-mixed.fixture.ts', 'test2.ts', 'x');
      
      const result = builder.buildLocationResult('x', declaration, usages);
      
      expectUsageTypes(result);
    });

    it('includes proper location information', () => {
      const sourceFile = project.createSourceFile('test4.ts', `
        let variable = 5;
        console.log(variable);
      `);
      
      const declaration = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const identifiers = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier);
      const usage = identifiers[1];
      
      const result = builder.buildLocationResult('variable', declaration, [usage]);
      
      expect(result.declaration.location).toBeDefined();
      expect(result.declaration.location.toString()).toContain('test4.ts');
      expect(result.usages[0].location).toBeDefined();
      expect(result.usages[0].location.toString()).toContain('test4.ts');
    });
  });
});
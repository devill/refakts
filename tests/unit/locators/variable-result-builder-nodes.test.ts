import * as ts from 'typescript';
import { setupProject, setupBuilder, expectUsageTypes, loadFixture, extractVariableFromSourceFile } from './variable-result-builder-setup';

describe('VariableResultBuilder - Node Results', () => {
  let project: ReturnType<typeof setupProject>;
  let builder: ReturnType<typeof setupBuilder>;

  beforeEach(() => {
    project = setupProject();
    builder = setupBuilder();
  });

  describe('buildNodeResult', () => {
    it('builds result with nodes and usage types', () => {
      const { declaration, usages } = extractVariableFromSourceFile(loadFixture(project, 'simple-variable.fixture.ts'), 'myVar');
      
      const result = builder.buildNodeResult('myVar', declaration, usages);
      
      expect(result.variable).toBe('myVar');
      expect(result.declaration).toBe(declaration);
      expect(result.usages).toHaveLength(2);
      expect(result.usages.every(usage => usage.node)).toBe(true);
      expect(result.usages.every(usage => usage.usageType)).toBe(true);
    });

    it('determines correct usage types', () => {
      const { declaration, usages } = extractVariableFromSourceFile(loadFixture(project, 'variable-usage-mixed.fixture.ts'), 'x');
      
      const result = builder.buildNodeResult('x', declaration, usages);
      
      expectUsageTypes(result);
    });

    it('preserves original nodes', () => {
      const sourceFile = project.createSourceFile('test7.ts', `
        let variable = 5;
        console.log(variable);
      `);
      
      const declaration = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const identifiers = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier);
      const usage = identifiers[1];
      
      const result = builder.buildNodeResult('variable', declaration, [usage]);
      
      expect(result.declaration).toBe(declaration);
      expect(result.usages[0].node).toBe(usage);
    });
  });
});
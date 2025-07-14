import { VariableResultBuilder } from '../../../src/locators/variable-result-builder';
import { Project } from 'ts-morph';
import * as ts from 'typescript';
import { verify } from 'approvals';
import * as fs from 'fs';
import * as path from 'path';

describe('VariableResultBuilder', () => {
  let project: Project;
  let builder: VariableResultBuilder;

  beforeEach(() => {
    project = new Project();
    builder = new VariableResultBuilder();
  });

  function loadFixtureAndExtractVariable(fixtureFile: string, fileName: string, varName: string) {
    const fixtureContent = fs.readFileSync(path.join(__dirname, 'test-data', fixtureFile), 'utf8');
    const sourceFile = project.createSourceFile(fileName, fixtureContent);
    const declaration = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
    const identifiers = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier);
    const usages = identifiers.filter(id => id.getText() === varName).slice(1);
    return { declaration, usages };
  }


  function expectUsageTypes(result: any) {
    const usageTypes = result.usages.map((usage: any) => usage.usageType);
    expect(usageTypes).toContain('read');
    expect(usageTypes).toContain('write');
    expect(usageTypes).toContain('update');
  }

  describe('buildLocationResult', () => {
    it('builds result with declaration and usages', () => {
      const { declaration, usages } = loadFixtureAndExtractVariable('simple-variable.fixture.ts', 'test.ts', 'myVar');
      
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
      const { declaration, usages } = loadFixtureAndExtractVariable('variable-usage-mixed.fixture.ts', 'test2.ts', 'x');
      
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
      const usage = identifiers[1]; // The usage in console.log
      
      const result = builder.buildLocationResult('variable', declaration, [usage]);
      
      expect(result.declaration.location).toBeDefined();
      expect(result.declaration.location.toString()).toContain('test4.ts');
      expect(result.usages[0].location).toBeDefined();
      expect(result.usages[0].location.toString()).toContain('test4.ts');
    });
  });

  describe('buildNodeResult', () => {
    it('builds result with nodes and usage types', () => {
      const { declaration, usages } = loadFixtureAndExtractVariable('simple-variable.fixture.ts', 'test5.ts', 'myVar');
      
      const result = builder.buildNodeResult('myVar', declaration, usages);
      
      expect(result.variable).toBe('myVar');
      expect(result.declaration).toBe(declaration);
      expect(result.usages).toHaveLength(2);
      expect(result.usages.every(usage => usage.node)).toBe(true);
      expect(result.usages.every(usage => usage.usageType)).toBe(true);
    });

    it('determines correct usage types', () => {
      const { declaration, usages } = loadFixtureAndExtractVariable('variable-usage-mixed.fixture.ts', 'test6.ts', 'x');
      
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

  describe('formatAsLocationStrings', () => {
    it('formats declaration and usages as location strings', () => {
      const { declaration, usages } = loadFixtureAndExtractVariable('simple-variable.fixture.ts', 'test8.ts', 'myVar');
      
      const result = builder.buildLocationResult('myVar', declaration, usages);
      const formatted = result.formatAsLocationStrings();
      
      expect(formatted).toHaveLength(3); // 1 declaration + 2 usages
      expect(formatted.every(str => str.includes('test8.ts'))).toBe(true);
      expect(formatted.some(str => str.includes('myVar'))).toBe(true); // At least some contain myVar
    });

    it('handles empty usages', () => {
      const sourceFile = project.createSourceFile('test9.ts', 'let variable = 5;');
      const declaration = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      
      const result = builder.buildLocationResult('variable', declaration, []);
      const formatted = result.formatAsLocationStrings();
      
      expect(formatted).toHaveLength(1); // Only declaration
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
      const identifier = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier)[2]; // return variable
      
      const result = builder.buildLocationResult('variable', declaration, [identifier]);
      
      const declarationLoc = result.declaration.location;
      const usageLoc = result.usages[0].location;
      
      // Declaration should be on line 3 (1-indexed)
      expect(declarationLoc.start.line).toBe(3);
      // Usage should be on line 4 (1-indexed)  
      expect(usageLoc.start.line).toBe(4);
      
      // Both should reference the same file
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
      
      // Should have proper locations for both declaration and usage
      expect(result.declaration.location.start.line).toBeGreaterThan(0);
      if (result.usages.length > 0) {
        expect(result.usages[0].location.start.line).toBeGreaterThan(result.declaration.location.start.line);
      }
    });
  });

  describe('edge cases and error handling', () => {
    it('handles nodes with special characters', () => {
      const sourceFile = project.createSourceFile('special.ts', `
        let αβγ = 'greek';
        console.log(αβγ);
      `);
      
      const declaration = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      const identifiers = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier);
      const usage = identifiers.find(id => id.getText() === 'αβγ' && id !== identifiers[0]); // Find the usage, not declaration
      
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
      const sourceFile = project.createSourceFile('malformed.ts', 'let x ='); // Incomplete
      const declaration = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[0];
      
      // Should not throw errors
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
        obj.prop = x;           // read
        x = obj.method();       // write
        arr[x] = 'value';       // read (x is used as index)
        x *= 2;                 // update
        ++x;                    // update
        func(x, y = x);         // read (multiple times)
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
      
      const declaration = sourceFile.getDescendantsOfKind(ts.SyntaxKind.VariableDeclaration)[1]; // variable declaration
      const identifiers = sourceFile.getDescendantsOfKind(ts.SyntaxKind.Identifier);
      const usage = identifiers.find(id => 
        id.getText() === 'variable' && 
        id !== declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier)
      );
      
      if (usage) {
        const result = builder.buildLocationResult('variable', declaration, [usage]);
        
        // Both locations should be valid
        expect(result.declaration.location.start.line).toBeGreaterThanOrEqual(0);
        expect(result.usages[0].location.start.line).toBeGreaterThanOrEqual(0);
        
        // Text should be preserved correctly
        expect(result.declaration.text).toContain('variable');
        expect(result.usages[0].text).toBe('variable');
      }
    });
  });
});
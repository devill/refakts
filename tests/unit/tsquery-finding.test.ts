import { Project } from 'ts-morph';
import { tsquery } from '@phenomnomnominal/tsquery';

describe('TSQuery Node Finding', () => {
  let project: Project;

  beforeEach(() => {
    project = new Project();
  });

  it('should find identifier by name', () => {
    const code = `
      function calculateArea(width: number, height: number): number {
        const area = width * height;
        return area;
      }
    `;
    
    const sourceFile = project.createSourceFile('test.ts', code);
    const ast = sourceFile.compilerNode;
    
    const matches = tsquery(ast, 'Identifier[name="area"]');
    
    expect(matches).toHaveLength(2); // declaration and usage
    expect(matches[0].getText()).toBe('area');
    expect(matches[1].getText()).toBe('area');
  });

  it('should convert tsquery result to ts-morph node', () => {
    const code = `
      function calculateArea(width: number, height: number): number {
        const area = width * height;
        return area;
      }
    `;
    
    const sourceFile = project.createSourceFile('test.ts', code);
    const ast = sourceFile.compilerNode;
    
    const matches = tsquery(ast, 'Identifier[name="area"]');
    const tsNode = matches[1]; // the usage
    
    // Convert to ts-morph node
    const morphNode = sourceFile.getDescendantAtPos(tsNode.getStart());
    
    expect(morphNode).toBeDefined();
    expect(morphNode!.getText()).toBe('area');
    expect(morphNode!.getKindName()).toBe('Identifier');
  });
});
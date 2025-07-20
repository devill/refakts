import { ClassMethodFinder } from '../../../src/services/class-method-finder';
import { Project } from 'ts-morph';

describe('ClassMethodFinder', () => {
  let finder: ClassMethodFinder;
  let project: Project;

  beforeEach(() => {
    finder = new ClassMethodFinder();
    project = new Project({ useInMemoryFileSystem: true });
  });

  it('should return empty array for empty class', () => {
    const sourceFile = project.createSourceFile('test.ts', `
      class Empty {
      }
    `);

    const classDeclaration = sourceFile.getClassOrThrow('Empty');
    const result = finder.findMethods(classDeclaration);

    expect(result).toEqual([]);
  });

  it('should find one method', () => {
    const sourceFile = project.createSourceFile('test.ts', `
      class Simple {
        getValue() {}
      }
    `);

    const classDeclaration = sourceFile.getClassOrThrow('Simple');
    const result = finder.findMethods(classDeclaration);

    expect(result).toHaveLength(1);
    expect(result[0].getName()).toBe('getValue');
  });

  it('should find constructor and methods', () => {
    const sourceFile = project.createSourceFile('test.ts', `
      class WithConstructor {
        constructor() {}
        
        getValue() {}
      }
    `);

    const classDeclaration = sourceFile.getClassOrThrow('WithConstructor');
    const result = finder.findMethods(classDeclaration);

    expect(result).toHaveLength(2);
    
    const constructorMethod = result.find(m => m.getName() === 'constructor');
    expect(constructorMethod).toBeDefined();
    
    const valueMethod = result.find(m => m.getName() === 'getValue');
    expect(valueMethod).toBeDefined();
  });
});
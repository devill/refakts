import { MethodDependencyAnalyzer } from '../../../src/services/method-dependency-analyzer';
import { Project } from 'ts-morph';

describe('MethodDependencyAnalyzer', () => {
  let analyzer: MethodDependencyAnalyzer;
  let project: Project;

  beforeEach(() => {
    analyzer = new MethodDependencyAnalyzer();
    project = new Project({ useInMemoryFileSystem: true });
  });

  it('should return empty array for empty class', () => {
    const sourceFile = project.createSourceFile('test.ts', `
      class Empty {
      }
    `);

    const classDeclaration = sourceFile.getClassOrThrow('Empty');
    const result = analyzer.analyzeClassMethods(classDeclaration);

    expect(result).toEqual([]);
  });

  it('should return one method with no dependencies', () => {
    const sourceFile = project.createSourceFile('test.ts', `
      class Simple {
        getValue() {}
      }
    `);

    const classDeclaration = sourceFile.getClassOrThrow('Simple');
    const result = analyzer.analyzeClassMethods(classDeclaration);

    expect(result).toHaveLength(1);
    expect(result[0].method.getName()).toBe('getValue');
    expect(result[0].dependencies).toEqual([]);
  });
});
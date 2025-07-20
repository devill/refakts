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
});
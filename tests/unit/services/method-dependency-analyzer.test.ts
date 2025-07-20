import { MethodDependencyAnalyzer } from '../../../src/services/method-dependency-analyzer';
import { ClassMethodFinder, MethodInfo } from '../../../src/services/class-method-finder';
import { Project } from 'ts-morph';

describe('MethodDependencyAnalyzer', () => {
  let analyzer: MethodDependencyAnalyzer;
  let finder: ClassMethodFinder;
  let project: Project;

  beforeEach(() => {
    analyzer = new MethodDependencyAnalyzer();
    finder = new ClassMethodFinder();
    project = new Project({ useInMemoryFileSystem: true });
  });

  it('should return empty array for no methods', () => {
    const methods: MethodInfo[] = [];
    const result = analyzer.analyzeDependencies(methods);

    expect(result).toEqual([]);
  });

  it('should return one method with no dependencies', () => {
    const sourceFile = project.createSourceFile('test.ts', `
      class Simple {
        getValue() {}
      }
    `);

    const classDeclaration = sourceFile.getClassOrThrow('Simple');
    const methods = finder.findMethods(classDeclaration);
    const result = analyzer.analyzeDependencies(methods);

    expect(result).toHaveLength(1);
    expect(result[0].method.getName()).toBe('getValue');
    expect(result[0].dependencies).toEqual([]);
  });
});
import { MethodDependencyAnalyzer } from '../../../src/services/method-dependency-analyzer';
import { ClassMethodFinder, MethodInfo } from '../../../src/services/class-method-finder';
import { Project } from 'ts-morph';

describe('MethodDependencyAnalyzer', () => {
  let analyzer: MethodDependencyAnalyzer;
  let project: Project;

  beforeEach(() => {
    analyzer = new MethodDependencyAnalyzer();
    project = new Project({ useInMemoryFileSystem: true });
  });

  function createMethodsFromClass(classCode: string): MethodInfo[] {
    const sourceFile = project.createSourceFile('test.ts', classCode);
    const classDeclaration = sourceFile.getClasses()[0];
    const finder = new ClassMethodFinder();
    return finder.findMethods(classDeclaration);
  }

  it('should return empty array for no methods', () => {
    const methods: MethodInfo[] = [];
    const result = analyzer.analyzeDependencies(methods);

    expect(result).toEqual([]);
  });

  it('should return method with no dependencies', () => {
    const methods = createMethodsFromClass(`
      class Simple {
        getValue() { return 42; }
      }
    `);

    const result = analyzer.analyzeDependencies(methods);

    expect(result).toHaveLength(1);
    expect(result[0].dependencies).toEqual([]);
  });

  it('should detect method dependency', () => {
    const methods = createMethodsFromClass(`
      class Calculator {
        calculate() { return this.add(1, 2); }
        add(a, b) { return a + b; }
      }
    `);

    const result = analyzer.analyzeDependencies(methods);

    const calculateResult = result.find(r => r.method.getName() === 'calculate')!;
    expect(calculateResult.dependencies).toHaveLength(1);
    expect(calculateResult.dependencies[0].getName()).toBe('add');
    
    const addResult = result.find(r => r.method.getName() === 'add')!;
    expect(addResult.dependencies).toHaveLength(0);
  });

  it('should detect multiple dependencies', () => {
    const methods = createMethodsFromClass(`
      class Calculator {
        calculate() { 
          return this.add(this.multiply(2, 3), 1); 
        }
        add(a, b) { return a + b; }
        multiply(a, b) { return a * b; }
      }
    `);

    const result = analyzer.analyzeDependencies(methods);

    const calculateResult = result.find(r => r.method.getName() === 'calculate')!;
    expect(calculateResult.dependencies).toHaveLength(2);
    expect(calculateResult.dependencies.map(d => d.getName()).sort()).toEqual(['add', 'multiply']);
  });
});
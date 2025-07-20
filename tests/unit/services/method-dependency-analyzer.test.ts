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

  it('should detect recursive method calls', () => {
    const methods = createMethodsFromClass(`
      class MathProcessor {
        fibonacci(n) {
          if (n <= 1) return n;
          return this.fibonacci(n - 1) + this.fibonacci(n - 2);
        }
      }
    `);

    const result = analyzer.analyzeDependencies(methods);

    const fibResult = result.find(r => r.method.getName() === 'fibonacci')!;
    expect(fibResult.dependencies).toHaveLength(1);
    expect(fibResult.dependencies[0].getName()).toBe('fibonacci');
  });

  it('should detect mutually recursive methods', () => {
    const methods = createMethodsFromClass(`
      class Checker {
        isEven(n) {
          if (n === 0) return true;
          return this.isOdd(n - 1);
        }
        
        isOdd(n) {
          if (n === 0) return false;
          return this.isEven(n - 1);
        }
      }
    `);

    const result = analyzer.analyzeDependencies(methods);

    const evenResult = result.find(r => r.method.getName() === 'isEven')!;
    expect(evenResult.dependencies).toHaveLength(1);
    expect(evenResult.dependencies[0].getName()).toBe('isOdd');

    const oddResult = result.find(r => r.method.getName() === 'isOdd')!;
    expect(oddResult.dependencies).toHaveLength(1);
    expect(oddResult.dependencies[0].getName()).toBe('isEven');
  });
});
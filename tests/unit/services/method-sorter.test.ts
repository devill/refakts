import { MethodSorter } from '../../../src/services/method-sorter';
import { MethodWithDependencies } from '../../../src/services/method-dependency-analyzer';
import { ClassMethodFinder } from '../../../src/services/class-method-finder';
import { Project } from 'ts-morph';

describe('MethodSorter', () => {
  let sorter: MethodSorter;

  beforeEach(() => {
    sorter = new MethodSorter();
  });

  function createMethodWithDeps(name: string, dependencies: string[] = []): MethodWithDependencies {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile('test.ts', `
      class Test {
        ${name}() {}
        ${dependencies.map(dep => `${dep}() {}`).join('\n')}
      }
    `);
    const classDeclaration = sourceFile.getClasses()[0];
    const finder = new ClassMethodFinder();
    const methods = finder.findMethods(classDeclaration);
    
    const method = methods.find(m => m.getName() === name)!;
    const deps = dependencies.map(depName => methods.find(m => m.getName() === depName)!);
    
    return { method, dependencies: deps };
  }

  it('should return empty array for no methods', () => {
    const methods: MethodWithDependencies[] = [];
    const result = sorter.sortByStepDownRule(methods);

    expect(result).toEqual([]);
  });

  it('should sort methods by step down rule', () => {
    const calculate = createMethodWithDeps('calculate', ['add']);
    const add = createMethodWithDeps('add', []);
    
    const methods = [calculate, add];
    const result = sorter.sortByStepDownRule(methods);

    expect(result).toHaveLength(2);
    expect(result[0].getName()).toBe('calculate');
    expect(result[1].getName()).toBe('add');
  });

  it('should handle recursive methods', () => {
    const fibonacci = createMethodWithDeps('fibonacci', ['fibonacci']);
    
    const methods = [fibonacci];
    const result = sorter.sortByStepDownRule(methods);

    expect(result).toHaveLength(1);
    expect(result[0].getName()).toBe('fibonacci');
  });
});
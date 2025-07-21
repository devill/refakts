import { MethodSorter, BasicMethodInfo, BasicMethodWithDependencies } from '../../../src/services/method-sorter';

describe('MethodSorter', () => {
  function createMockMethod(name: string): BasicMethodInfo {
    return { getName: () => name };
  }

  function createMethodWithDeps(name: string, dependencyNames: string[] = []): BasicMethodWithDependencies {
    const method = createMockMethod(name);
    const dependencies = dependencyNames.map(depName => createMockMethod(depName));
    return { method, dependencies };
  }

  it('should return empty array for no methods', () => {
    const methods: BasicMethodWithDependencies[] = [];
    const result = MethodSorter.sortByStepDownRule(methods);

    expect(result).toEqual([]);
  });

  it('should sort methods by step down rule', () => {
    const calculate = createMethodWithDeps('calculate', ['add']);
    const add = createMethodWithDeps('add', []);
    
    const methods = [calculate, add];
    const result = MethodSorter.sortByStepDownRule(methods);

    expect(result.map(m => m.getName())).toEqual(['calculate', 'add']);
  });

  it('should not loop infinitely with recursive methods', () => {
    const fibonacci = createMethodWithDeps('fibonacci', ['fibonacci']);
    
    const result = MethodSorter.sortByStepDownRule([fibonacci]);

    expect(result.map(m => m.getName())).toEqual(['fibonacci']);
  });

  it('should place constructor before regular methods', () => {
    const getValue = createMethodWithDeps('getValue', []);
    const constructor = createMethodWithDeps('constructor', []);
    
    const result = MethodSorter.sortByStepDownRule([getValue, constructor]);

    expect(result.map(m => m.getName())).toEqual(['constructor', 'getValue']);
  });

  it('should sort by dependency chain across visibility levels', () => {
    const process = createMethodWithDeps('process', ['validate']);
    const validate = createMethodWithDeps('validate', ['check']);
    const check = createMethodWithDeps('check', []);
    
    const result = MethodSorter.sortByStepDownRule([process, validate, check]);

    expect(result.map(m => m.getName())).toEqual(['process', 'validate', 'check']);
  });
});
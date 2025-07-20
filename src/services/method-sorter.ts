import { MethodWithDependencies } from './method-dependency-analyzer';
import { MethodInfo } from './class-method-finder';

interface SortingContext {
  allMethods: MethodWithDependencies[];
  visited: Set<string>;
  sorted: MethodInfo[];
}

export class MethodSorter {
  sortByStepDownRule(methodsWithDeps: MethodWithDependencies[]): MethodInfo[] {
    const context = this.createSortingContext(methodsWithDeps);
    this.performTopologicalSort(methodsWithDeps, context);
    return this.finalizeOrder(context.sorted);
  }

  private createSortingContext(allMethods: MethodWithDependencies[]): SortingContext {
    return {
      allMethods,
      visited: new Set<string>(),
      sorted: []
    };
  }

  private performTopologicalSort(methods: MethodWithDependencies[], context: SortingContext): void {
    for (const method of methods) {
      this.visitMethod(method, context);
    }
  }

  private finalizeOrder(sorted: MethodInfo[]): MethodInfo[] {
    const reversed = sorted.reverse();
    return this.moveConstructorToFront(reversed);
  }

  private moveConstructorToFront(methods: MethodInfo[]): MethodInfo[] {
    const constructorIndex = methods.findIndex(m => m.getName() === 'constructor');
    if (constructorIndex > 0) {
      const constructor = methods.splice(constructorIndex, 1)[0];
      methods.unshift(constructor);
    }
    return methods;
  }

  private visitMethod(current: MethodWithDependencies, context: SortingContext): void {
    const methodName = current.method.getName();
    
    if (context.visited.has(methodName)) return;
    
    context.visited.add(methodName);
    this.visitDependencies(current, context);
    context.sorted.push(current.method);
  }

  private visitDependencies(current: MethodWithDependencies, context: SortingContext): void {
    for (const dependency of current.dependencies) {
      const depMethod = context.allMethods.find(m => m.method.getName() === dependency.getName());
      if (depMethod) {
        this.visitMethod(depMethod, context);
      }
    }
  }
}
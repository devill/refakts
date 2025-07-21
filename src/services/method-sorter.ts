
export interface BasicMethodInfo {
  getName(): string;
}

export interface BasicMethodWithDependencies<T extends BasicMethodInfo = BasicMethodInfo> {
  method: T;
  dependencies: T[];
}

interface SortingContext<T extends BasicMethodInfo = BasicMethodInfo> {
  allMethods: BasicMethodWithDependencies<T>[];
  visited: Set<string>;
  sorted: T[];
}

export class MethodSorter {
  sortByStepDownRule<T extends BasicMethodInfo>(methodsWithDeps: BasicMethodWithDependencies<T>[]): T[] {
    const context = this.createSortingContext(methodsWithDeps);
    this.performTopologicalSort(methodsWithDeps, context);
    return this.finalizeOrder(context.sorted);
  }

  private createSortingContext<T extends BasicMethodInfo>(allMethods: BasicMethodWithDependencies<T>[]): SortingContext<T> {
    return {
      allMethods,
      visited: new Set<string>(),
      sorted: []
    };
  }

  private performTopologicalSort<T extends BasicMethodInfo>(methods: BasicMethodWithDependencies<T>[], context: SortingContext<T>): void {
    for (const method of methods) {
      this.visitMethod(method, context);
    }
  }

  private finalizeOrder<T extends BasicMethodInfo>(sorted: T[]): T[] {
    const reversed = sorted.reverse();
    return this.moveConstructorToFront(reversed);
  }

  private moveConstructorToFront<T extends BasicMethodInfo>(methods: T[]): T[] {
    const constructorIndex = methods.findIndex(m => m.getName() === 'constructor');
    if (constructorIndex > 0) {
      const constructor = methods.splice(constructorIndex, 1)[0];
      methods.unshift(constructor);
    }
    return methods;
  }

  private visitMethod<T extends BasicMethodInfo>(current: BasicMethodWithDependencies<T>, context: SortingContext<T>): void {
    const methodName = current.method.getName();
    
    if (context.visited.has(methodName)) return;
    
    context.visited.add(methodName);
    this.visitDependencies(current, context);
    context.sorted.push(current.method);
  }

  private visitDependencies<T extends BasicMethodInfo>(current: BasicMethodWithDependencies<T>, context: SortingContext<T>): void {
    for (const dependency of current.dependencies) {
      const depMethod = context.allMethods.find(m => m.method.getName() === dependency.getName());
      if (depMethod) {
        this.visitMethod(depMethod, context);
      }
    }
  }
}
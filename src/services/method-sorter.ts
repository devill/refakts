
export interface BasicMethodInfo {
  getName(): string;
}

export interface BasicMethodWithDependencies<T extends BasicMethodInfo = BasicMethodInfo> {
  method: T;
  dependencies: T[];
}

interface SortingContext<T extends BasicMethodInfo> {
  allMethods: BasicMethodWithDependencies<T>[];
  visited: Set<string>;
  sorted: T[];
}

export class MethodSorter<T extends BasicMethodInfo> {
  private context: SortingContext<T>;

  private constructor(methodsWithDeps: BasicMethodWithDependencies<T>[]) {
    this.context = this.createSortingContext(methodsWithDeps);
  }

  static sortByStepDownRule<T extends BasicMethodInfo>(
    methodsWithDeps: BasicMethodWithDependencies<T>[]
  ): T[] {
    const instance = new MethodSorter(methodsWithDeps);
    return instance.getResult();
  }

  private getResult(): T[] {
    this.performTopologicalSort();
    return this.finalizeOrder(this.context.sorted);
  }

  private createSortingContext(allMethods: BasicMethodWithDependencies<T>[]): SortingContext<T> {
    return {
      allMethods,
      visited: new Set<string>(),
      sorted: []
    };
  }

  private performTopologicalSort(): void {
    for (const method of this.context.allMethods) {
      this.visitMethod(method);
    }
  }

  private finalizeOrder(sorted: T[]): T[] {
    const reversed = sorted.reverse();
    return this.moveConstructorToFront(reversed);
  }

  private moveConstructorToFront(methods: T[]): T[] {
    const constructorIndex = methods.findIndex(m => m.getName() === 'constructor');
    if (constructorIndex > 0) {
      const constructor = methods.splice(constructorIndex, 1)[0];
      methods.unshift(constructor);
    }
    return methods;
  }

  private visitMethod(current: BasicMethodWithDependencies<T>): void {
    const methodName = current.method.getName();
    
    if (this.context.visited.has(methodName)) return;
    
    this.context.visited.add(methodName);
    this.visitDependencies(current);
    this.context.sorted.push(current.method);
  }

  private visitDependencies(current: BasicMethodWithDependencies<T>): void {
    for (const dependency of current.dependencies) {
      const depMethod = this.context.allMethods.find(m => m.method.getName() === dependency.getName());
      if (depMethod) {
        this.visitMethod(depMethod);
      }
    }
  }
}
import { MethodWithDependencies } from './method-dependency-analyzer';
import { MethodInfo } from './class-method-finder';

export class MethodSorter {
  sortByStepDownRule(methodsWithDeps: MethodWithDependencies[]): MethodInfo[] {
    const sorted: MethodInfo[] = [];
    const visited = new Set<string>();
    
    for (const methodWithDeps of methodsWithDeps) {
      this.visitMethod(methodWithDeps, methodsWithDeps, visited, sorted);
    }
    
    return sorted.reverse();
  }

  private visitMethod(
    current: MethodWithDependencies,
    allMethods: MethodWithDependencies[],
    visited: Set<string>,
    sorted: MethodInfo[]
  ): void {
    const methodName = current.method.getName();
    
    if (visited.has(methodName)) return;
    
    visited.add(methodName);
    
    for (const dependency of current.dependencies) {
      const depMethod = allMethods.find(m => m.method.getName() === dependency.getName());
      if (depMethod) {
        this.visitMethod(depMethod, allMethods, visited, sorted);
      }
    }
    
    sorted.push(current.method);
  }
}
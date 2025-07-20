import { MethodWithDependencies } from './method-dependency-analyzer';
import { MethodInfo } from './class-method-finder';

export class MethodSorter {
  sortByStepDownRule(methodsWithDeps: MethodWithDependencies[]): MethodInfo[] {
    const sorted: MethodInfo[] = [];
    const visited = new Set<string>();
    
    for (const methodWithDeps of methodsWithDeps) {
      this.visitMethod(methodWithDeps, methodsWithDeps, visited, sorted);
    }
    
    const reversed = sorted.reverse();
    
    // Move constructor to the front
    const constructorIndex = reversed.findIndex(m => m.getName() === 'constructor');
    if (constructorIndex > 0) {
      const constructor = reversed.splice(constructorIndex, 1)[0];
      reversed.unshift(constructor);
    }
    
    return reversed;
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
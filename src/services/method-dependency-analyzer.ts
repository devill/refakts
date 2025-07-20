import { MethodInfo } from './class-method-finder';

export interface MethodWithDependencies {
  method: MethodInfo;
  dependencies: MethodInfo[];
}

export class MethodDependencyAnalyzer {
  analyzeDependencies(methods: MethodInfo[]): MethodWithDependencies[] {
    return methods.map(method => ({
      method,
      dependencies: []
    }));
  }
}
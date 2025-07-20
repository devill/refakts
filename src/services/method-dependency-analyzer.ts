import { ClassDeclaration, MethodDeclaration, ConstructorDeclaration } from 'ts-morph';

export interface MethodWithDependencies {
  method: MethodDeclaration | ConstructorDeclaration;
  dependencies: (MethodDeclaration | ConstructorDeclaration)[];
}

export class MethodDependencyAnalyzer {
  analyzeClassMethods(_classDeclaration: ClassDeclaration): MethodWithDependencies[] {
    return [];
  }
}
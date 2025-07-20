import { ClassDeclaration, MethodDeclaration, ConstructorDeclaration, SyntaxKind } from 'ts-morph';

export class MethodInfo {
  constructor(
    private readonly node: MethodDeclaration | ConstructorDeclaration
  ) {}

  getName(): string {
    if (this.node.getKind() === SyntaxKind.Constructor) {
      return 'constructor';
    }
    return (this.node as MethodDeclaration).getName();
  }

  getNode(): MethodDeclaration | ConstructorDeclaration {
    return this.node;
  }
}

export interface MethodWithDependencies {
  method: MethodInfo;
  dependencies: MethodInfo[];
}

export class MethodDependencyAnalyzer {
  analyzeClassMethods(classDeclaration: ClassDeclaration): MethodWithDependencies[] {
    const methods = classDeclaration.getMethods();
    
    return methods.map(method => ({
      method: new MethodInfo(method),
      dependencies: []
    }));
  }
}
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

export class ClassMethodFinder {
  findMethods(classDeclaration: ClassDeclaration): MethodInfo[] {
    const methods = classDeclaration.getMethods();
    const constructors = classDeclaration.getConstructors();
    
    const allMethods: (MethodDeclaration | ConstructorDeclaration)[] = [
      ...constructors,
      ...methods
    ];
    
    return allMethods.map(method => new MethodInfo(method));
  }
}
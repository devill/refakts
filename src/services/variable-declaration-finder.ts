import { Node, VariableDeclaration, SyntaxKind, SourceFile } from 'ts-morph';

export class VariableDeclarationFinder {
  findVariableDeclaration(sourceFile: SourceFile, variableName: string, contextNode?: Node): VariableDeclaration {
    const declaration = contextNode 
      ? this.findClosestDeclaration(contextNode, variableName)
      : this.searchForDeclaration(sourceFile, variableName);
    if (!declaration) {
      throw new Error(`Variable declaration for '${variableName}' not found`);
    }
    return declaration;
  }

  private searchForDeclaration(sourceFile: SourceFile, variableName: string): VariableDeclaration | undefined {
    const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
    
    for (const decl of variableDeclarations) {
      if (this.matchesVariableName(decl, variableName)) {
        return decl;
      }
    }
    return undefined;
  }

  private findClosestDeclaration(contextNode: Node, variableName: string): VariableDeclaration | undefined {
    const allDeclarations = contextNode.getSourceFile().getDescendantsOfKind(SyntaxKind.VariableDeclaration);
    const matchingDeclarations = allDeclarations.filter(decl => this.matchesVariableName(decl, variableName));
    
    if (matchingDeclarations.length === 1) {
      return matchingDeclarations[0];
    }
    
    return this.findDeclarationInSameScope(contextNode, matchingDeclarations);
  }

  private findDeclarationInSameScope(contextNode: Node, declarations: VariableDeclaration[]): VariableDeclaration | undefined {
    const contextMethod = this.findContainingMethod(contextNode);
    const sameScopeDeclaration = this.findDeclarationInMethod(declarations, contextMethod);
    
    return sameScopeDeclaration || declarations[0];
  }

  private findDeclarationInMethod(declarations: VariableDeclaration[], targetMethod: Node | undefined): VariableDeclaration | undefined {
    for (const decl of declarations) {
      const declMethod = this.findContainingMethod(decl);
      if (declMethod === targetMethod) {
        return decl;
      }
    }
    return undefined;
  }

  private findContainingMethod(node: Node): Node | undefined {
    let current: Node | undefined = node;
    while (current) {
      if (Node.isMethodDeclaration(current) || Node.isFunctionDeclaration(current)) {
        return current;
      }
      current = current.getParent();
    }
    return undefined;
  }

  private matchesVariableName(declaration: VariableDeclaration, variableName: string): boolean {
    if (declaration.getName() === variableName) {
      return true;
    }
    
    return this.matchesDestructuredVariable(declaration, variableName);
  }

  private matchesDestructuredVariable(declaration: VariableDeclaration, variableName: string): boolean {
    const nameNode = declaration.getNameNode();
    if (!Node.isObjectBindingPattern(nameNode)) {
      return false;
    }
    
    return this.hasMatchingElement(nameNode, variableName);
  }

  private hasMatchingElement(nameNode: Node, variableName: string): boolean {
    const bindingPattern = nameNode.asKindOrThrow(SyntaxKind.ObjectBindingPattern);
    for (const element of bindingPattern.getElements()) {
      if (element.getName() === variableName) {
        return true;
      }
    }
    return false;
  }
}
import { Node, VariableDeclaration, SyntaxKind } from 'ts-morph';

export class VariableDeclarationFinder {
  findVariableDeclaration(sourceFile: any, variableName: string): VariableDeclaration {
    const declaration = this.searchForDeclaration(sourceFile, variableName);
    if (!declaration) {
      throw new Error(`Variable declaration for '${variableName}' not found`);
    }
    return declaration;
  }

  private searchForDeclaration(sourceFile: any, variableName: string): VariableDeclaration | undefined {
    const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
    
    for (const decl of variableDeclarations) {
      if (this.matchesVariableName(decl, variableName)) {
        return decl;
      }
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
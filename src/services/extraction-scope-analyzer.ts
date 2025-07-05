import { Node, FunctionDeclaration, FunctionExpression } from 'ts-morph';

export class ExtractionScopeAnalyzer {
  findExtractionScope(node: Node): Node {
    const scope = this.searchForValidScope(node);
    return scope || node.getSourceFile();
  }

  findContainingStatement(node: Node): Node | undefined {
    let current: Node | undefined = node;
    while (current) {
      if (this.isContainingStatement(current)) {
        return current;
      }
      current = current.getParent();
    }
    return undefined;
  }

  isValidExtractionScope(parent: Node | undefined): parent is Node {
    return parent !== undefined && (Node.isBlock(parent) || Node.isSourceFile(parent));
  }

  findScopeName(node: Node): string {
    const scopeName = this.searchParentScopes(node.getParent());
    return scopeName || 'unknown scope';
  }

  private searchForValidScope(node: Node): Node | undefined {
    let current: Node | undefined = node;
    while (current) {
      const validScope = this.checkCurrentNodeForValidScope(current);
      if (validScope) return validScope;
      current = current.getParent();
    }
    return undefined;
  }

  private checkCurrentNodeForValidScope(current: Node): Node | undefined {
    const parent = current.getParent();
    return this.isValidExtractionScope(parent) ? parent : undefined;
  }

  private isContainingStatement(current: Node): boolean {
    const parent = current.getParent();
    return this.isValidExtractionScope(parent);
  }

  private searchParentScopes(current: Node | undefined): string | null {
    while (current) {
      const scopeName = this.getScopeNameForNode(current);
      if (scopeName) {
        return scopeName;
      }
      current = current.getParent();
    }
    return null;
  }

  private getScopeNameForNode(node: Node): string | null {
    if (Node.isFunctionDeclaration(node) || Node.isFunctionExpression(node)) {
      return this.getFunctionScopeName(node);
    }
    if (Node.isMethodDeclaration(node)) {
      return `method ${node.getName()}`;
    }
    return this.getOtherScopeNames(node);
  }

  private getFunctionScopeName(node: FunctionDeclaration | FunctionExpression): string {
    const name = node.getName() || null;
    return `function ${name || '<anonymous>'}`;
  }

  private getOtherScopeNames(node: Node): string | null {
    if (Node.isArrowFunction(node)) {
      return 'arrow function';
    }
    return this.getSpecialScopeNames(node);
  }

  private getSpecialScopeNames(node: Node): string | null {
    if (Node.isConstructorDeclaration(node)) {
      return 'constructor';
    }
    if (Node.isSourceFile(node)) {
      return 'file scope';
    }
    return null;
  }
}
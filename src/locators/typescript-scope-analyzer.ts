import * as ts from 'typescript';
import { Node } from 'ts-morph';

export class TypeScriptScopeAnalyzer {
  getScope(node: Node): Node {
    let current = node.getParent();
    while (current) {
      if (this.isScopeNode(current)) {
        return current;
      }
      current = current.getParent();
    }
    return node.getSourceFile();
  }

  isScopeNode(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.FunctionDeclaration ||
           node.getKind() === ts.SyntaxKind.FunctionExpression ||
           node.getKind() === ts.SyntaxKind.ArrowFunction ||
           node.getKind() === ts.SyntaxKind.Block ||
           node.getKind() === ts.SyntaxKind.SourceFile;
  }

  isScopeContainedIn(innerScope: Node, outerScope: Node): boolean {
    let current: Node | undefined = innerScope;
    while (current) {
      if (current === outerScope) {
        return true;
      }
      current = current.getParent();
    }
    return false;
  }

  getParentScope(scope: Node): Node | undefined {
    let current = scope.getParent();
    while (current) {
      if (this.isScopeNode(current)) {
        return current;
      }
      current = current.getParent();
    }
    return undefined;
  }
}
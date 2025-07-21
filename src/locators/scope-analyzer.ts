import * as ts from 'typescript';
import { Node } from 'ts-morph';
import { NodeContext } from './node-context';

export class ScopeAnalyzer {
  static isScopeNode(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.FunctionDeclaration ||
           node.getKind() === ts.SyntaxKind.FunctionExpression ||
           node.getKind() === ts.SyntaxKind.ArrowFunction ||
           node.getKind() === ts.SyntaxKind.Block ||
           node.getKind() === ts.SyntaxKind.SourceFile;
  }

  static getNodeScope(node: Node): Node {
    return this.findNodeScope(node);
  }

  static getParentScope(scope: Node): Node | undefined {
    return this.findParentScope(scope);
  }

  private static findNodeScope(node: Node): Node {
    let current = node.getParent();
    while (current) {
      if (this.isScopeNode(current)) {
        return current;
      }
      current = current.getParent();
    }
    return node.getSourceFile();
  }

  private static findParentScope(scope: Node): Node | undefined {
    let current = scope.getParent();
    while (current) {
      if (this.isScopeNode(current)) {
        return current;
      }
      current = current.getParent();
    }
    return undefined;
  }

  static isScopeContainedIn(innerScope: Node, outerScope: Node): boolean {
    const innerContext = new NodeContext(innerScope);
    const outerContext = new NodeContext(outerScope);
    return innerContext.isScopeContainedIn(outerContext);
  }
}
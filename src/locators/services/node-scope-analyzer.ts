import { Node } from 'ts-morph';
import { NodeTypeClassifier } from '../node-type-classifier';

export class NodeScopeAnalyzer {
  static getNodeScope(node: Node): Node {
    let current = node.getParent();
    while (current) {
      if (NodeTypeClassifier.isScopeNode(current)) {
        return current;
      }
      current = current.getParent();
    }
    return node.getSourceFile();
  }

  static getParentScope(scope: Node): Node | undefined {
    let current = scope.getParent();
    while (current) {
      if (NodeTypeClassifier.isScopeNode(current)) {
        return current;
      }
      current = current.getParent();
    }
    return undefined;
  }

  static isScopeContainedIn(innerScope: Node, outerScope: Node): boolean {
    let current: Node | undefined = innerScope;
    while (current) {
      if (current === outerScope) {
        return true;
      }
      current = current.getParent();
    }
    return false;
  }
}
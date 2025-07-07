import { Node } from 'ts-morph';
import { NodeTypeChecker } from './node-type-checker';

/**
 * Static utility methods for analyzing TypeScript node scopes.
 */
export class NodeScopeHelper {
  
  /**
   * Gets the scope containing a node
   */
  static getNodeScope(node: Node): Node {
    let current = node.getParent();
    while (current) {
      if (NodeTypeChecker.isScopeNode(current)) {
        return current;
      }
      current = current.getParent();
    }
    return node.getSourceFile();
  }

  /**
   * Gets the parent scope of a given scope
   */
  static getParentScope(scope: Node): Node | undefined {
    let current = scope.getParent();
    while (current) {
      if (NodeTypeChecker.isScopeNode(current)) {
        return current;
      }
      current = current.getParent();
    }
    return undefined;
  }

  /**
   * Checks if one scope is contained within another
   */
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
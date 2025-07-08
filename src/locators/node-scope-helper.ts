import { Node } from 'ts-morph';
import { NodeContext } from './NodeContext';

export class NodeScopeHelper {
  

  static getNodeScope(node: Node): Node {
    const nodeContext = new NodeContext(node);
    return nodeContext.getScope().getWrappedNode();
  }


  static getParentScope(scope: Node): Node | undefined {
    const nodeContext = new NodeContext(scope);
    const parentScope = nodeContext.getParentScope();
    return parentScope?.getWrappedNode();
  }

  private static isScopeNode(node: Node): boolean {
    const nodeContext = new NodeContext(node);
    return nodeContext.isScopeNode();
  }


  static isScopeContainedIn(innerScope: Node, outerScope: Node): boolean {
    const innerContext = new NodeContext(innerScope);
    const outerContext = new NodeContext(outerScope);
    return innerContext.isScopeContainedIn(outerContext);
  }
}
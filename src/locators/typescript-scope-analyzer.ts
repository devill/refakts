import { Node } from 'ts-morph';
import { NodeContext } from './NodeContext';

export class TypeScriptScopeAnalyzer {
  getScope(node: Node): Node {
    const nodeContext = new NodeContext(node);
    return nodeContext.getScope().getWrappedNode();
  }

  isScopeNode(node: Node): boolean {
    const nodeContext = new NodeContext(node);
    return nodeContext.isScopeNode();
  }

  isScopeContainedIn(innerScope: Node, outerScope: Node): boolean {
    const innerContext = new NodeContext(innerScope);
    const outerContext = new NodeContext(outerScope);
    return innerContext.isScopeContainedIn(outerContext);
  }

  getParentScope(scope: Node): Node | undefined {
    const nodeContext = new NodeContext(scope);
    const parentScope = nodeContext.getParentScope();
    return parentScope?.getWrappedNode();
  }
}
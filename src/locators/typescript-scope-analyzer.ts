import { Node } from 'ts-morph';
import { NodeAnalyzer } from './node-analyzer';

export class TypeScriptScopeAnalyzer {
  getScope(node: Node): Node {
    return NodeAnalyzer.getNodeScope(node);
  }

  isScopeNode(node: Node): boolean {
    return NodeAnalyzer.isScopeNode(node);
  }

  isScopeContainedIn(innerScope: Node, outerScope: Node): boolean {
    return NodeAnalyzer.isScopeContainedIn(innerScope, outerScope);
  }

  getParentScope(scope: Node): Node | undefined {
    return NodeAnalyzer.getParentScope(scope);
  }
}
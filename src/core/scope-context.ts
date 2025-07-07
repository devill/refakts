import { Node } from 'ts-morph';

export class ScopeContext {
  readonly usageScope: Node;
  readonly declarationScope: Node;
  readonly targetNode: Node;

  constructor(
    usageScope: Node,
    declarationScope: Node,
    targetNode: Node
  ) {
    this.usageScope = usageScope;
    this.declarationScope = declarationScope;
    this.targetNode = targetNode;
  }
}
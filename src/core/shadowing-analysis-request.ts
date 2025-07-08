import { Node } from 'ts-morph';
import { NodeContext } from './node-context';

export class ShadowingAnalysisRequest {
  readonly usage: NodeContext;
  readonly declaration: NodeContext;
  readonly variableName: string;

  constructor(usage: NodeContext, declaration: NodeContext, variableName: string) {
    this.usage = usage;
    this.declaration = declaration;
    this.variableName = variableName;
  }

  static create(usage: Node, declaration: Node, variableName: string): ShadowingAnalysisRequest {
    const usageContext = NodeContext.create(usage, usage.getSourceFile());
    const declarationContext = NodeContext.create(declaration, declaration.getSourceFile());
    return new ShadowingAnalysisRequest(usageContext, declarationContext, variableName);
  }

  getUsageScope(): Node {
    return this.usage.getScope();
  }

  getDeclarationScope(): Node {
    return this.declaration.getScope();
  }

  isSameScope(): boolean {
    return this.getUsageScope() === this.getDeclarationScope();
  }

  getTargetNode(): Node {
    return this.declaration.node;
  }

  matchesVariableName(node: Node): boolean {
    const context = NodeContext.create(node, node.getSourceFile());
    return context.matchesVariableName(this.variableName);
  }
}
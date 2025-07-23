import { Node } from 'ts-morph';
import { NodeContext } from '../node-context';
import { NodeDeclarationMatcher } from '../../locators/services/node-declaration-matcher';
import { ShadowingAnalysisRequestFactory } from '../shadowing-analysis-request-factory';
import { NodeContext as LocatorNodeContext } from '../../locators/node-context';
import { ScopeContext } from '../scope-context';


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
    return ShadowingAnalysisRequestFactory.create(usage, declaration, variableName);
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
    return NodeDeclarationMatcher.hasMatchingIdentifier(node, this.variableName);
  }

  validateScopeContainment(): boolean {
    const declarationScope = this.getDeclarationScope();
    const usageScope = this.getUsageScope();
    return LocatorNodeContext.isScopeContainedIn(usageScope, declarationScope);
  }

  getScopeContext() {
    return new ScopeContext(this.getUsageScope(), this.getDeclarationScope(), this.getTargetNode());
  }

  isShadowedByDeclaration(): boolean {
    if (this.isSameScope()) {
      return false;
    }
    
    const scopeContext = this.getScopeContext();
    return this.findShadowingInScopeChain(scopeContext);
  }

  private findShadowingInScopeChain(scopeContext: { usageScope: Node; declarationScope: Node; targetNode: Node }): boolean {
    let current: Node | undefined = scopeContext.usageScope;
    while (current && current !== scopeContext.declarationScope) {
      if (this.hasShadowingDeclaration(current, scopeContext.targetNode)) return true;
      current = LocatorNodeContext.getParentScope(current);
    }
    return false;
  }

  private hasShadowingDeclaration(scope: Node, originalDeclaration: Node): boolean {
    const scopeContext = new ScopeContext(scope, scope, originalDeclaration);
    let hasShadowing = false;
    scope.forEachDescendant((child: Node) => {
      if (this.checkChildForShadowing(scopeContext, child)) hasShadowing = true;
    });
    return hasShadowing;
  }

  private checkChildForShadowing(scopeContext: { usageScope: Node; targetNode: Node }, child: Node): boolean {
    const childContext = new LocatorNodeContext(child);
    return childContext.isShadowingDeclaration(this.variableName, scopeContext.targetNode, scopeContext.usageScope);
  }
}
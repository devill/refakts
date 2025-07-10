import { Node } from 'ts-morph';
import { NodeContext } from './node-context';
import { NodeDeclarationMatcher } from '../locators/services/node-declaration-matcher';

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
    return new ShadowingAnalysisRequest(
      NodeContext.create(usage, usage.getSourceFile()),
      NodeContext.create(declaration, declaration.getSourceFile()),
      variableName
    );
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
    const { NodeContext: LocatorNodeContext } = require('../locators/NodeContext');
    return LocatorNodeContext.isScopeContainedIn(usageScope, declarationScope);
  }

  getScopeContext() {
    const { ScopeContext } = require('./scope-context');
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
    const { NodeContext: LocatorNodeContext } = require('../locators/NodeContext');
    let current: Node | undefined = scopeContext.usageScope;
    while (current && current !== scopeContext.declarationScope) {
      if (this.hasShadowingDeclaration(current, scopeContext.targetNode)) return true;
      current = LocatorNodeContext.getParentScope(current);
    }
    return false;
  }

  private hasShadowingDeclaration(scope: Node, originalDeclaration: Node): boolean {
    const { ScopeContext } = require('./scope-context');
    const scopeContext = new ScopeContext(scope, scope, originalDeclaration);
    let hasShadowing = false;
    scope.forEachDescendant((child: Node) => {
      if (this.checkChildForShadowing(scopeContext, child)) hasShadowing = true;
    });
    return hasShadowing;
  }

  private checkChildForShadowing(scopeContext: { usageScope: Node; targetNode: Node }, child: Node): boolean {
    const { NodeContext: LocatorNodeContext } = require('../locators/NodeContext');
    const childContext = new LocatorNodeContext(child);
    return childContext.isShadowingDeclaration(this.variableName, scopeContext.targetNode, scopeContext.usageScope);
  }
}
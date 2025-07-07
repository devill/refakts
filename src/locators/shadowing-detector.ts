import { Node } from 'ts-morph';
import { TypeScriptScopeAnalyzer } from './typescript-scope-analyzer';
import { ScopeContext } from '../core/scope-context';
import { NodeAnalyzer } from './node-analyzer';

export class ShadowingDetector {
  private scopeAnalyzer = new TypeScriptScopeAnalyzer();

  isUsageInScope(usage: Node, declaration: Node): boolean {
    const declarationScope = this.scopeAnalyzer.getScope(declaration);
    const usageScope = this.scopeAnalyzer.getScope(usage);
    
    if (!this.scopeAnalyzer.isScopeContainedIn(usageScope, declarationScope)) {
      return false;
    }
    
    return !this.isShadowedByDeclaration(usage, declaration);
  }

  private isShadowedByDeclaration(usage: Node, declaration: Node): boolean {
    const variableName = NodeAnalyzer.getVariableName(declaration);
    if (!variableName) return false;
    
    const scopes = this.getScopes(usage, declaration);
    return this.checkForShadowing(scopes, variableName, declaration);
  }

  private checkForShadowing(scopes: {usage: Node, declaration: Node}, variableName: string, declaration: Node): boolean {
    if (scopes.usage === scopes.declaration) {
      return false;
    }
    
    const scopeContext = new ScopeContext(scopes.usage, scopes.declaration, declaration);
    return this.findShadowingInScopeChain(scopeContext, variableName);
  }

  private getScopes(usage: Node, declaration: Node) {
    return {
      usage: this.scopeAnalyzer.getScope(usage),
      declaration: this.scopeAnalyzer.getScope(declaration)
    };
  }

  private findShadowingInScopeChain(scopeContext: ScopeContext, variableName: string): boolean {
    let current: Node | undefined = scopeContext.usageScope;
    while (current && current !== scopeContext.declarationScope) {
      if (this.hasShadowingDeclaration(current, variableName, scopeContext.targetNode)) {
        return true;
      }
      current = this.scopeAnalyzer.getParentScope(current);
    }
    return false;
  }

  private hasShadowingDeclaration(scope: Node, variableName: string, originalDeclaration: Node): boolean {
    let hasShadowing = false;
    scope.forEachDescendant((child: Node) => {
      const scopeContext = new ScopeContext(scope, scope, originalDeclaration);
      if (this.isShadowingDeclaration(scopeContext, child, variableName)) {
        hasShadowing = true;
      }
    });
    return hasShadowing;
  }

  private isShadowingDeclaration(scopeContext: ScopeContext, child: Node, variableName: string): boolean {
    return NodeAnalyzer.isAnyDeclaration(child) && 
           NodeAnalyzer.hasMatchingIdentifier(child, variableName) &&
           child !== scopeContext.targetNode &&
           this.scopeAnalyzer.getScope(child) === scopeContext.usageScope;
  }

}
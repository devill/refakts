import * as ts from 'typescript';
import { Node } from 'ts-morph';
import { ScopeAnalyzer } from './scope-analyzer';

export class ShadowingDetector {
  private scopeAnalyzer = new ScopeAnalyzer();

  isUsageInScope(usage: Node, declaration: Node): boolean {
    const declarationScope = this.scopeAnalyzer.getScope(declaration);
    const usageScope = this.scopeAnalyzer.getScope(usage);
    
    if (!this.scopeAnalyzer.isScopeContainedIn(usageScope, declarationScope)) {
      return false;
    }
    
    return !this.isShadowedByDeclaration(usage, declaration);
  }

  private isShadowedByDeclaration(usage: Node, declaration: Node): boolean {
    const variableName = this.getVariableName(declaration);
    if (!variableName) return false;
    
    const scopes = this.getScopes(usage, declaration);
    return this.checkForShadowing(scopes, variableName, declaration);
  }

  private checkForShadowing(scopes: {usage: Node, declaration: Node}, variableName: string, declaration: Node): boolean {
    if (scopes.usage === scopes.declaration) {
      return false;
    }
    
    return this.findShadowingInScopeChain(scopes.usage, scopes.declaration, variableName, declaration);
  }

  private getScopes(usage: Node, declaration: Node) {
    return {
      usage: this.scopeAnalyzer.getScope(usage),
      declaration: this.scopeAnalyzer.getScope(declaration)
    };
  }

  private findShadowingInScopeChain(usageScope: Node, declarationScope: Node, variableName: string, declaration: Node): boolean {
    let current: Node | undefined = usageScope;
    while (current && current !== declarationScope) {
      if (this.hasShadowingDeclaration(current, variableName, declaration)) {
        return true;
      }
      current = this.scopeAnalyzer.getParentScope(current);
    }
    return false;
  }

  private hasShadowingDeclaration(scope: Node, variableName: string, originalDeclaration: Node): boolean {
    let hasShadowing = false;
    scope.forEachDescendant((child: Node) => {
      if (this.isShadowingDeclaration(child, variableName, originalDeclaration, scope)) {
        hasShadowing = true;
      }
    });
    return hasShadowing;
  }

  private isShadowingDeclaration(child: Node, variableName: string, originalDeclaration: Node, scope: Node): boolean {
    return this.isAnyDeclaration(child) && 
           this.hasMatchingIdentifier(child, variableName) &&
           child !== originalDeclaration &&
           this.scopeAnalyzer.getScope(child) === scope;
  }

  private getVariableName(declaration: Node): string | undefined {
    const identifier = declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    return identifier?.getText();
  }

  private isAnyDeclaration(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.VariableDeclaration ||
           node.getKind() === ts.SyntaxKind.Parameter;
  }

  private hasMatchingIdentifier(node: Node, variableName: string): boolean {
    const identifier = node.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
    return identifier?.getText() === variableName;
  }
}
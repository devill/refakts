import * as ts from 'typescript';
import { Node } from 'ts-morph';
import { TypeScriptScopeAnalyzer } from './typescript-scope-analyzer';
import { ScopeContext } from '../core/scope-context';
import { NodeAnalyzer } from './node-analyzer';
import { ShadowingAnalysisRequest } from '../core/shadowing-analysis-request';
import { NodeContext } from '../core/node-context';

export class ShadowingDetector {
  private scopeAnalyzer = new TypeScriptScopeAnalyzer();

  isUsageInScope(usage: Node, declaration: Node): boolean {
    const variableName = NodeAnalyzer.getVariableName(declaration);
    if (!variableName) return false;
    
    const request = ShadowingAnalysisRequest.create(usage, declaration, variableName);
    return this.validateScopeContainment(request) && !this.isShadowedByDeclaration(request);
  }

  private validateScopeContainment(request: ShadowingAnalysisRequest): boolean {
    const declarationScope = request.getDeclarationScope();
    const usageScope = request.getUsageScope();
    return this.scopeAnalyzer.isScopeContainedIn(usageScope, declarationScope);
  }

  private isShadowedByDeclaration(request: ShadowingAnalysisRequest): boolean {
    if (request.isSameScope()) {
      return false;
    }
    
    const scopeContext = new ScopeContext(request.getUsageScope(), request.getDeclarationScope(), request.getTargetNode());
    return this.findShadowingInScopeChain(scopeContext, request.variableName);
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
    const scopeContext = new ScopeContext(scope, scope, originalDeclaration);
    scope.forEachDescendant((child: Node) => {
      if (this.checkChildForShadowing(scopeContext, child, variableName)) {
        hasShadowing = true;
      }
    });
    return hasShadowing;
  }

  private checkChildForShadowing(scopeContext: ScopeContext, child: Node, variableName: string): boolean {
    const childContext = NodeContext.create(child, child.getSourceFile());
    return this.isShadowingDeclaration(scopeContext, childContext, variableName);
  }

  private isShadowingDeclaration(scopeContext: ScopeContext, childContext: NodeContext, variableName: string): boolean {
    return this.isAnyDeclaration(childContext.node) && 
           childContext.matchesVariableName(variableName) &&
           childContext.node !== scopeContext.targetNode &&
           this.scopeAnalyzer.getScope(childContext.node) === scopeContext.usageScope;
  }

  private isAnyDeclaration(node: Node): boolean {
    return node.getKind() === ts.SyntaxKind.VariableDeclaration ||
           node.getKind() === ts.SyntaxKind.Parameter;
  }

}
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
    
    const declarationScope = request.getDeclarationScope();
    const usageScope = request.getUsageScope();
    
    if (!this.scopeAnalyzer.isScopeContainedIn(usageScope, declarationScope)) {
      return false;
    }
    
    return !this.isShadowedByDeclaration(request);
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
    scope.forEachDescendant((child: Node) => {
      const childContext = NodeContext.create(child, child.getSourceFile());
      const scopeContext = new ScopeContext(scope, scope, originalDeclaration);
      if (this.isShadowingDeclaration(scopeContext, childContext, variableName)) {
        hasShadowing = true;
      }
    });
    return hasShadowing;
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
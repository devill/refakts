import { Node, Expression } from 'ts-morph';
import { ExtractionScopeAnalyzer } from '../../services/extraction-scope-analyzer';

export class ExpressionMatcher {
  private scopeAnalyzer: ExtractionScopeAnalyzer;
  
  constructor(scopeAnalyzer: ExtractionScopeAnalyzer) {
    this.scopeAnalyzer = scopeAnalyzer;
  }

  findAllMatchingExpressions(targetNode: Node): Expression[] {
    const expressionText = targetNode.getText();
    const sourceFile = targetNode.getSourceFile();
    return this.findMatchingExpressions(sourceFile, expressionText);
  }

  groupExpressionsByScope(expressions: Expression[]): Map<Node, Expression[]> {
    const groupedExpressions = new Map<Node, Expression[]>();
    
    for (const expression of expressions) {
      this.addExpressionToScope(groupedExpressions, expression);
    }
    
    return groupedExpressions;
  }

  private addExpressionToScope(groupedExpressions: Map<Node, Expression[]>, expression: Expression): void {
    const scope = this.scopeAnalyzer.findExtractionScope(expression);
    if (!groupedExpressions.has(scope)) {
      groupedExpressions.set(scope, []);
    }
    const expressionsForScope = groupedExpressions.get(scope);
    if (expressionsForScope) {
      expressionsForScope.push(expression);
    }
  }

  private findMatchingExpressions(scope: Node, expressionText: string): Expression[] {
    const expressions: Expression[] = [];
    
    scope.forEachDescendant((node) => {
      this.addMatchingExpression(node, expressionText, expressions);
    });
    
    return expressions;
  }

  private addMatchingExpression(node: Node, expressionText: string, expressions: Expression[]): void {
    if (Node.isExpression(node) && node.getText() === expressionText) {
      expressions.push(node);
    }
  }
}
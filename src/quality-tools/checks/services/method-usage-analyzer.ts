import { MethodDeclaration, PropertyAccessExpression, CallExpression, SyntaxKind, Node } from 'ts-morph';
import { ImportSymbolExtractor } from './import-symbol-extractor';

export interface UsageAnalysis {
  externalUsage: Map<string, number>;
  ownUsage: number;
}

interface UsageResult {
  isOwnUsage: boolean;
  externalClass?: string;
}

export class MethodUsageAnalyzer {
  static analyzeUsagePatterns(method: MethodDeclaration, importedSymbols: Set<string>): UsageAnalysis {
    const externalUsage = new Map<string, number>();
    let ownUsage = 0;
    
    method.forEachDescendant(node => {
      ownUsage += this.analyzeNodeUsage(node, importedSymbols, externalUsage);
    });
    
    return { externalUsage, ownUsage };
  }

  private static analyzeNodeUsage(node: Node, importedSymbols: Set<string>, externalUsage: Map<string, number>): number {
    const propertyUsage = this.analyzePropertyAccess(node, importedSymbols);
    const callUsage = this.analyzeCallExpression(node, importedSymbols);

    const ownCount = this.updateOwnUsage(propertyUsage) + this.updateOwnUsage(callUsage);
    
    this.updateExternalUsage(propertyUsage, externalUsage);
    this.updateExternalUsage(callUsage, externalUsage);

    return ownCount;
  }

  private static updateOwnUsage(usage: UsageResult): number {
    return usage.isOwnUsage ? 1 : 0;
  }

  private static updateExternalUsage(usage: UsageResult, externalUsage: Map<string, number>): void {
    if (usage.externalClass) {
      const count = externalUsage.get(usage.externalClass) || 0;
      externalUsage.set(usage.externalClass, count + 1);
    }
  }

  private static analyzePropertyAccess(node: Node, importedSymbols: Set<string>): UsageResult {
    if (node.getKind() !== SyntaxKind.PropertyAccessExpression) {
      return { isOwnUsage: false };
    }
    
    const propAccess = node as PropertyAccessExpression;
    const expression = propAccess.getExpression();
    
    return this.analyzeExpression(expression, importedSymbols);
  }

  private static analyzeCallExpression(node: Node, importedSymbols: Set<string>): UsageResult {
    if (node.getKind() !== SyntaxKind.CallExpression) {
      return { isOwnUsage: false };
    }
    
    const callExpr = node as CallExpression;
    const expression = callExpr.getExpression();
    
    return this.analyzeCallExpressionNode(expression, importedSymbols);
  }

  private static analyzeExpression(expression: Node, importedSymbols: Set<string>): UsageResult {
    if (expression.getKind() === SyntaxKind.ThisKeyword) {
      return { isOwnUsage: true };
    }
    
    return this.analyzeExternalClassReference(expression, importedSymbols);
  }

  private static analyzeCallExpressionNode(expression: Node, importedSymbols: Set<string>): UsageResult {
    if (expression.getKind() !== SyntaxKind.PropertyAccessExpression) {
      return { isOwnUsage: false };
    }
    
    const propAccess = expression as PropertyAccessExpression;
    const objectExpr = propAccess.getExpression();
    
    return this.analyzeExpression(objectExpr, importedSymbols);
  }

  private static analyzeExternalClassReference(expression: Node, importedSymbols: Set<string>): UsageResult {
    const expressionText = expression.getText();
    if (ImportSymbolExtractor.isInternalClassReference(expressionText, importedSymbols)) {
      return { isOwnUsage: false, externalClass: expressionText };
    }
    
    return { isOwnUsage: false };
  }
}
import { MethodDeclaration, PropertyAccessExpression, CallExpression, SyntaxKind, Node } from 'ts-morph';
import { ImportSymbolExtractor } from './import-symbol-extractor';
import { UsageAnalysisRequest } from '../../../core/usage-analysis-request';

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
    const request = new UsageAnalysisRequest(method, importedSymbols);
    
    method.forEachDescendant(node => {
      this.analyzeNodeUsage(node, request);
    });
    
    return { 
      externalUsage: request.getExternalUsage(), 
      ownUsage: request.getOwnUsage() 
    };
  }

  private static analyzeNodeUsage(node: Node, request: UsageAnalysisRequest): void {
    const usageResults = this.getNodeUsageResults(node, request.importedSymbols);
    this.processUsageResults(usageResults, request);
  }

  private static getNodeUsageResults(node: Node, importedSymbols: Set<string>): UsageResult[] {
    const propertyUsage = this.analyzePropertyAccess(node, importedSymbols);
    const callUsage = this.analyzeCallExpression(node, importedSymbols);
    return [propertyUsage, callUsage];
  }

  private static processUsageResults(usageResults: UsageResult[], request: UsageAnalysisRequest): void {
    usageResults.forEach(usage => {
      if (usage.isOwnUsage) {
        request.addOwnUsage();
      } else if (usage.externalClass) {
        request.addExternalUsage(usage.externalClass);
      }
    });
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
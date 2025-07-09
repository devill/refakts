import { MethodDeclaration, PropertyAccessExpression, CallExpression, SyntaxKind, Node, Symbol } from 'ts-morph';
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
    
    return this.buildUsageAnalysis(request);
  }

  private static buildUsageAnalysis(request: UsageAnalysisRequest): UsageAnalysis {
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
    // Get the type of the expression
    const type = expression.getType();
    if (!type) {
      return { isOwnUsage: false };
    }

    // Get the symbol from the type
    const symbol = type.getSymbol();
    if (!symbol) {
      return { isOwnUsage: false };
    }

    // Check if it's an external library type
    if (this.isExternalLibraryType(symbol)) {
      return { isOwnUsage: false }; // External library, not feature envy
    }

    // Check if it's a built-in TypeScript/Node.js type
    if (this.isBuiltInType(symbol)) {
      return { isOwnUsage: false };
    }

    // Check if it's imported from external modules
    const symbolName = symbol.getName();
    if (importedSymbols.has(symbolName)) {
      return { isOwnUsage: false };
    }

    // It's an internal class - this is feature envy!
    return { isOwnUsage: false, externalClass: symbolName };
  }

  private static isExternalLibraryType(symbol: Symbol): boolean {
    const declarations = symbol.getDeclarations();
    if (!declarations || declarations.length === 0) {
      return false;
    }

    const sourceFile = declarations[0].getSourceFile();
    const filePath = sourceFile.getFilePath();
    
    // Check if it comes from external libraries
    return filePath.includes('node_modules') || 
           filePath.includes('@types') ||
           filePath.includes('lib.d.ts') ||
           filePath.includes('lib.es') ||
           this.isTypeScriptLibFile(filePath);
  }

  private static isBuiltInType(symbol: Symbol): boolean {
    const declarations = symbol.getDeclarations();
    if (!declarations || declarations.length === 0) {
      return false;
    }

    const sourceFile = declarations[0].getSourceFile();
    const filePath = sourceFile.getFilePath();
    
    // TypeScript built-in types
    return filePath.includes('lib.d.ts') ||
           filePath.includes('lib.es') ||
           filePath.includes('typescript/lib') ||
           this.isTypeScriptLibFile(filePath);
  }

  private static isTypeScriptLibFile(filePath: string): boolean {
    const libFilePattern = /lib\.(es\d+|dom|node|esnext)/;
    return libFilePattern.test(filePath);
  }
}
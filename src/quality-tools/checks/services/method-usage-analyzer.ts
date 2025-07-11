import { MethodDeclaration, PropertyAccessExpression, CallExpression, SyntaxKind, Node, Symbol, ClassDeclaration } from 'ts-morph';
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

  private static getMethodClassName(method: MethodDeclaration): string | undefined {
    const classDeclaration = method.getParent();
    if (classDeclaration && classDeclaration.getKind() === SyntaxKind.ClassDeclaration) {
      return (classDeclaration as ClassDeclaration).getName();
    }
    return undefined;
  }

  private static buildUsageAnalysis(request: UsageAnalysisRequest): UsageAnalysis {
    return request.buildUsageAnalysis();
  }

  private static analyzeNodeUsage(node: Node, request: UsageAnalysisRequest): void {
    const usageResults = this.getNodeUsageResults(node, request.importedSymbols, request.method);
    this.processUsageResults(usageResults, request);
  }

  private static getNodeUsageResults(node: Node, importedSymbols: Set<string>, method: MethodDeclaration): UsageResult[] {
    const propertyUsage = this.analyzePropertyAccess(node, importedSymbols, method);
    const callUsage = this.analyzeCallExpression(node, importedSymbols, method);
    return [propertyUsage, callUsage];
  }

  private static processUsageResults(usageResults: UsageResult[], request: UsageAnalysisRequest): void {
    request.processUsageResults(usageResults);
  }

  private static analyzePropertyAccess(node: Node, importedSymbols: Set<string>, method: MethodDeclaration): UsageResult {
    if (node.getKind() !== SyntaxKind.PropertyAccessExpression) {
      return { isOwnUsage: false };
    }
    
    const propAccess = node as PropertyAccessExpression;
    const expression = propAccess.getExpression();
    
    return this.analyzeExpression(expression, importedSymbols, method);
  }

  private static analyzeCallExpression(node: Node, importedSymbols: Set<string>, method: MethodDeclaration): UsageResult {
    if (node.getKind() !== SyntaxKind.CallExpression) {
      return { isOwnUsage: false };
    }
    
    const callExpr = node as CallExpression;
    const expression = callExpr.getExpression();
    
    return this.analyzeCallExpressionNode(expression, importedSymbols, method);
  }

  private static analyzeExpression(expression: Node, importedSymbols: Set<string>, method: MethodDeclaration): UsageResult {
    if (expression.getKind() === SyntaxKind.ThisKeyword) {
      return { isOwnUsage: true };
    }
    
    return this.analyzeExternalClassReference(expression, importedSymbols, method);
  }

  private static analyzeCallExpressionNode(expression: Node, importedSymbols: Set<string>, method: MethodDeclaration): UsageResult {
    if (expression.getKind() !== SyntaxKind.PropertyAccessExpression) {
      return { isOwnUsage: false };
    }
    
    const propAccess = expression as PropertyAccessExpression;
    const objectExpr = propAccess.getExpression();
    
    return this.analyzeExpression(objectExpr, importedSymbols, method);
  }

  private static analyzeExternalClassReference(expression: Node, importedSymbols: Set<string>, method: MethodDeclaration): UsageResult {
    const symbol = this.extractSymbolFromExpression(expression);
    if (!symbol) {
      return this.createNonOwnUsageResult();
    }
    if (this.isSystemType(symbol)) {
      return this.createNonOwnUsageResult();
    }
    return this.processSymbolName(symbol, importedSymbols, method);
  }

  private static createNonOwnUsageResult(): UsageResult {
    return { isOwnUsage: false };
  }

  private static extractSymbolFromExpression(expression: Node): Symbol | undefined {
    const type = expression.getType();
    return type?.getSymbol();
  }

  private static isSystemType(symbol: Symbol): boolean {
    return this.isExternalLibraryType(symbol) || this.isBuiltInType(symbol);
  }

  private static processSymbolName(symbol: Symbol, importedSymbols: Set<string>, method: MethodDeclaration): UsageResult {
    const symbolName = symbol.getName();
    if (importedSymbols.has(symbolName)) {
      return { isOwnUsage: false };
    }
    
    return this.checkForSameClassReference(symbolName, method);
  }

  private static checkForSameClassReference(symbolName: string, method: MethodDeclaration): UsageResult {
    const methodClassName = this.getMethodClassName(method);
    if (methodClassName && symbolName === methodClassName) {
      return { isOwnUsage: true };
    }
    
    return { isOwnUsage: false, externalClass: symbolName };
  }

  private static isExternalLibraryType(symbol: Symbol): boolean {
    const filePath = this.getSymbolFilePath(symbol);
    if (!filePath) {
      return false;
    }
    
    return this.matchesExternalLibraryPatterns(filePath);
  }

  private static getSymbolFilePath(symbol: Symbol): string | undefined {
    const declarations = symbol.getDeclarations();
    if (!declarations || declarations.length === 0) {
      return undefined;
    }
    return declarations[0].getSourceFile().getFilePath();
  }

  private static matchesExternalLibraryPatterns(filePath: string): boolean {
    return filePath.includes('node_modules') || 
           filePath.includes('@types') ||
           filePath.includes('lib.d.ts') ||
           filePath.includes('lib.es') ||
           this.isTypeScriptLibFile(filePath);
  }

  private static isBuiltInType(symbol: Symbol): boolean {
    const filePath = this.getSymbolFilePath(symbol);
    if (!filePath) {
      return false;
    }
    
    return this.matchesBuiltInTypePatterns(filePath);
  }

  private static matchesBuiltInTypePatterns(filePath: string): boolean {
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
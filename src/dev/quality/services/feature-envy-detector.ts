import { MethodDeclaration, ClassDeclaration, SyntaxKind } from 'ts-morph';
import { MethodUsageAnalyzer, UsageAnalysis } from '../checks/method-usage-analyzer';

export interface FeatureEnvyResult {
  enviedClass: string;
  count: number;
  ownUsage: number;
}

export class FeatureEnvyDetector {
  static analyzeMethodForFeatureEnvy(method: MethodDeclaration, importedSymbols: Set<string>): FeatureEnvyResult | null {
    const ownClassName = this.getOwnClassName(method);
    if (!ownClassName) return null;
    
    const usageAnalysis = MethodUsageAnalyzer.analyzeUsagePatterns(method, importedSymbols);
    return this.findFeatureEnvyViolation(usageAnalysis);
  }

  private static getOwnClassName(method: MethodDeclaration): string | null {
    const parent = method.getParent();
    if (!parent || parent.getKind() !== SyntaxKind.ClassDeclaration) return null;
    return (parent as ClassDeclaration).getName() || null;
  }

  private static findFeatureEnvyViolation(analysis: UsageAnalysis): FeatureEnvyResult | null {
    for (const [className, count] of analysis.externalUsage.entries()) {
      if (this.isFeatureEnvyViolation(count, analysis.ownUsage)) {
        return this.createFeatureEnvyResult(className, count, analysis.ownUsage);
      }
    }
    return null;
  }

  private static isFeatureEnvyViolation(externalCount: number, ownUsage: number): boolean {
    return externalCount >= 5 && externalCount > ownUsage * 1.5;
  }

  private static createFeatureEnvyResult(className: string, count: number, ownUsage: number): FeatureEnvyResult {
    return {
      enviedClass: className,
      count: count,
      ownUsage: ownUsage
    };
  }
}
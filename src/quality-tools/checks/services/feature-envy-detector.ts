import { MethodDeclaration, ClassDeclaration, SyntaxKind } from 'ts-morph';
import { MethodUsageAnalyzer, UsageAnalysis } from './method-usage-analyzer';

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
      if (count >= 3 && count > analysis.ownUsage * 1.5) {
        return {
          enviedClass: className,
          count: count,
          ownUsage: analysis.ownUsage
        };
      }
    }
    return null;
  }
}
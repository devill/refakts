import { loadQualityChecks } from './quality/plugin-loader';

interface QualityCheck {
  name: string;
  getGroupDefinition?: (_key: string) => { title: string; description: string } | undefined;
}

export class QualityChecksExtractor {
  extractQualityChecksContent(): string {
    const qualityChecks = loadQualityChecks();
    const descriptions = new Set<string>();
    
    for (const check of qualityChecks) {
      this.addCheckDescriptions(check, descriptions);
    }
    
    return this.formatDescriptions(descriptions);
  }

  private addCheckDescriptions(check: QualityCheck, descriptions: Set<string>): void {
    const groupKeys = this.getValidGroupKeys(check);
    for (const groupKey of groupKeys) {
      const groupDef = check.getGroupDefinition?.(groupKey);
      if (groupDef) {
        descriptions.add(`- **${groupDef.title}** (${groupDef.description})`);
      }
    }
  }

  private formatDescriptions(descriptions: Set<string>): string {
    return descriptions.size > 0 
      ? Array.from(descriptions).join('\n')
      : '- No quality checks configured';
  }

  private getValidGroupKeys(check: QualityCheck): string[] {
    const possibleKeys = this.buildPossibleKeys(check);
    return possibleKeys.filter(key => this.isValidKey(check, key));
  }

  private buildPossibleKeys(check: QualityCheck): string[] {
    return [
      check.name,
      `${check.name}Functions`,
      `critical${check.name.charAt(0).toUpperCase() + check.name.slice(1)}`,
      `large${check.name.charAt(0).toUpperCase() + check.name.slice(1)}`,
    ];
  }

  private isValidKey(check: QualityCheck, key: string): boolean {
    try {
      return Boolean(check.getGroupDefinition?.(key));
    } catch {
      return false;
    }
  }
}
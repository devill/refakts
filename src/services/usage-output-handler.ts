import { UsageLocation, LocationRange } from '../core/location-range';
import { SelectResult } from '../types/selection-types';
import { SelectOutputHandler } from './selection/output-handler';

export class UsageOutputHandler {
  private selectOutputHandler = new SelectOutputHandler();

  outputUsages(usages: UsageLocation[], baseDir: string, targetLocation: LocationRange): void {
    if (usages.length === 0) {
      this.outputNoSymbolMessage();
      return;
    }
    
    this.outputUsageResults(usages, baseDir, targetLocation);
  }

  private outputNoSymbolMessage(): void {
    process.stdout.write('Symbol not found at specified location\n');
  }

  private outputUsageResults(usages: UsageLocation[], baseDir: string, targetLocation: LocationRange): void {
    const sortedUsages = this.sortUsages(usages, targetLocation);
    const { declaration, otherUsages } = this.separateDeclarationFromUsages(sortedUsages, targetLocation);
    
    this.outputDeclaration(declaration, baseDir);
    this.outputUsagesSection(otherUsages, baseDir, declaration);
  }

  private separateDeclarationFromUsages(sortedUsages: UsageLocation[], targetLocation: LocationRange) {
    const declaration = sortedUsages.find(usage => this.isTargetLocation(usage, targetLocation));
    const otherUsages = sortedUsages.filter(usage => !this.isTargetLocation(usage, targetLocation));
    return { declaration, otherUsages };
  }

  private outputDeclaration(declaration: UsageLocation | undefined, baseDir: string): void {
    if (declaration) {
      process.stdout.write('Declaration:\n');
      const declarationResults = [this.convertToSelectResult(declaration, baseDir)];
      this.selectOutputHandler.outputResults(declarationResults);
    }
  }

  private outputUsagesSection(otherUsages: UsageLocation[], baseDir: string, declaration: UsageLocation | undefined): void {
    if (otherUsages.length === 0 || !declaration) {
      return;
    }
    
    this.outputUsagesByType(otherUsages, baseDir);
  }

  private outputUsagesByType(otherUsages: UsageLocation[], baseDir: string): void {
    const { writeUsages, readUsages } = this.separateUsagesByType(otherUsages);
    
    if (writeUsages.length > 0) {
      this.outputReadWriteSeparatedUsages(writeUsages, readUsages, baseDir);
    } else {
      this.outputSimpleUsages(otherUsages, baseDir);
    }
  }

  private outputReadWriteSeparatedUsages(writeUsages: UsageLocation[], readUsages: UsageLocation[], baseDir: string): void {
    process.stdout.write('\nWrite Usages:\n');
    const writeResults = writeUsages.map(usage => this.convertToSelectResult(usage, baseDir));
    this.selectOutputHandler.outputResults(writeResults);
    
    if (readUsages.length > 0) {
      process.stdout.write('\nRead Usages:\n');
      const readResults = readUsages.map(usage => this.convertToSelectResult(usage, baseDir));
      this.selectOutputHandler.outputResults(readResults);
    }
  }

  private outputSimpleUsages(usages: UsageLocation[], baseDir: string): void {
    process.stdout.write('\n');
    process.stdout.write('Usages:\n');
    const usageResults = usages.map(usage => this.convertToSelectResult(usage, baseDir));
    this.selectOutputHandler.outputResults(usageResults);
  }

  private separateUsagesByType(usages: UsageLocation[]): { writeUsages: UsageLocation[], readUsages: UsageLocation[] } {
    const writeUsages = usages.filter(usage => usage.usageType === 'write');
    const readUsages = usages.filter(usage => usage.usageType === 'read');
    return { writeUsages, readUsages };
  }

  private convertToSelectResult(usage: UsageLocation, baseDir: string): SelectResult {
    return {
      location: usage.location.formatLocation(baseDir),
      content: usage.text
    };
  }

  private sortUsages(usages: UsageLocation[], targetLocation: LocationRange): UsageLocation[] {
    return usages.sort((a, b) => this.compareUsageLocations(a, b, targetLocation));
  }

  private compareUsageLocations(a: UsageLocation, b: UsageLocation, targetLocation: LocationRange): number {
    const definitionComparison = this.compareByDefinitionPriority(a, b, targetLocation);
    if (definitionComparison !== 0) return definitionComparison;
    
    return this.compareByLocation(a, b);
  }

  private compareByDefinitionPriority(a: UsageLocation, b: UsageLocation, targetLocation: LocationRange): number {
    const aIsDefinition = this.isTargetLocation(a, targetLocation);
    const bIsDefinition = this.isTargetLocation(b, targetLocation);
    
    if (aIsDefinition && !bIsDefinition) return -1;
    if (!aIsDefinition && bIsDefinition) return 1;
    return 0;
  }

  private compareByLocation(a: UsageLocation, b: UsageLocation): number {
    return a.location.compareToLocation(b.location);
  }

  private isTargetLocation(usage: UsageLocation, targetLocation: LocationRange): boolean {
    return usage.location.matchesTarget(targetLocation.file, targetLocation.start.line);
  }
}
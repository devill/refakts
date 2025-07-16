import { UsageLocation, LocationRange } from '../core/location-range';
import { SelectResult } from '../types/selection-types';
import { SelectOutputHandler } from './selection/output-handler';
import { CommandOptions } from '../command';

interface OutputContext {
  baseDir: string;
  targetLocation: LocationRange;
  options?: CommandOptions;
}

export class UsageOutputHandler {
  private selectOutputHandler = new SelectOutputHandler();

  outputUsages(usages: UsageLocation[], baseDir: string, targetLocation: LocationRange, options?: CommandOptions): void {
    if (usages.length === 0) {
      this.outputNoSymbolMessage();
      return;
    }
    
    const context: OutputContext = { baseDir, targetLocation, options };
    this.outputUsageResults(usages, context);
  }

  private outputNoSymbolMessage(): void {
    process.stdout.write('Symbol not found at specified location\n');
  }

  private outputUsageResults(usages: UsageLocation[], context: OutputContext): void {
    const sortedUsages = this.sortUsages(usages, context.targetLocation);
    const { declaration, otherUsages } = this.separateDeclarationFromUsages(sortedUsages, context.targetLocation);
    
    this.outputDeclaration(declaration, context);
    this.outputUsagesSection(otherUsages, declaration, context);
  }

  private separateDeclarationFromUsages(sortedUsages: UsageLocation[], targetLocation: LocationRange) {
    const declaration = sortedUsages.find(usage => this.isTargetLocation(usage, targetLocation));
    const otherUsages = sortedUsages.filter(usage => !this.isTargetLocation(usage, targetLocation));
    return { declaration, otherUsages };
  }

  private outputDeclaration(declaration: UsageLocation | undefined, context: OutputContext): void {
    if (declaration) {
      process.stdout.write('Declaration:\n');
      const declarationResults = [this.convertToSelectResult(declaration, context.baseDir, context.options)];
      this.selectOutputHandler.outputResults(declarationResults);
    }
  }

  private outputUsagesSection(otherUsages: UsageLocation[], declaration: UsageLocation | undefined, context: OutputContext): void {
    if (otherUsages.length === 0 || !declaration) {
      return;
    }
    
    this.outputUsagesByType(otherUsages, context);
  }

  private outputUsagesByType(otherUsages: UsageLocation[], context: OutputContext): void {
    const { writeUsages, readUsages } = this.separateUsagesByType(otherUsages);
    
    if (writeUsages.length > 0) {
      this.outputReadWriteSeparatedUsages(writeUsages, readUsages, context);
    } else {
      this.outputSimpleUsages(otherUsages, context);
    }
  }

  private outputReadWriteSeparatedUsages(writeUsages: UsageLocation[], readUsages: UsageLocation[], context: OutputContext): void {
    process.stdout.write('\nWrite Usages:\n');
    const writeResults = writeUsages.map(usage => this.convertToSelectResult(usage, context.baseDir, context.options));
    this.selectOutputHandler.outputResults(writeResults);
    
    if (readUsages.length > 0) {
      process.stdout.write('\nRead Usages:\n');
      const readResults = readUsages.map(usage => this.convertToSelectResult(usage, context.baseDir, context.options));
      this.selectOutputHandler.outputResults(readResults);
    }
  }

  private outputSimpleUsages(usages: UsageLocation[], context: OutputContext): void {
    process.stdout.write('\n');
    process.stdout.write('Usages:\n');
    const usageResults = usages.map(usage => this.convertToSelectResult(usage, context.baseDir, context.options));
    this.selectOutputHandler.outputResults(usageResults);
  }

  private separateUsagesByType(usages: UsageLocation[]): { writeUsages: UsageLocation[], readUsages: UsageLocation[] } {
    const writeUsages = usages.filter(usage => usage.usageType === 'write');
    const readUsages = usages.filter(usage => usage.usageType === 'read');
    return { writeUsages, readUsages };
  }

  private convertToSelectResult(usage: UsageLocation, baseDir: string, options?: CommandOptions): SelectResult {
    const result: SelectResult = {
      location: usage.location.formatLocation(baseDir),
      content: usage.text
    };
    
    this.applyFormattingOptions(result, usage, baseDir, options);
    return result;
  }

  private applyFormattingOptions(result: SelectResult, usage: UsageLocation, baseDir: string, options?: CommandOptions): void {
    const context = { result, usage, baseDir, options };
    this.applyFormattingFromContext(context);
  }

  private applyFormattingFromContext(context: { result: SelectResult; usage: UsageLocation; baseDir: string; options?: CommandOptions }): void {
    if (context.options?.['include-line'] || context.options?.includeLine) {
      this.applyIncludeLineFormatting(context.result, context.usage, context.baseDir);
    } else if (context.options?.['preview-line'] || context.options?.previewLine) {
      context.result.context = this.extractContextFromLocation(context.usage);
    }
  }

  private applyIncludeLineFormatting(result: SelectResult, usage: UsageLocation, baseDir: string): void {
    const fullLine = this.extractContextFromLocation(usage);
    result.location = this.formatLineLocation(usage.location, baseDir);
    result.content = fullLine;
  }

  private extractContextFromLocation(usage: UsageLocation): string {
    try {
      const fs = require('fs');
      const sourceContent = fs.readFileSync(usage.location.file, 'utf8');
      const lines = sourceContent.split('\n');
      const targetLine = lines[usage.location.start.line - 1];
      return targetLine || '';
    } catch {
      return '';
    }
  }

  private formatLineLocation(location: LocationRange, baseDir: string): string {
    const path = require('path');
    const relativePath = path.relative(baseDir, location.file);
    return `[${relativePath} ${location.start.line}:-${location.start.line}:]`;
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
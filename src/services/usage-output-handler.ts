import { UsageLocation, LocationRange } from '../core/location-range';
import { SelectResult } from '../types/selection-types';
import { SelectOutputHandler } from './selection/output-handler';
import { CommandOptions, CommandOptionsWrapper } from '../command';
import { UsageCollection } from '../core/usage-collection';

interface OutputContext {
  baseDir: string;
  options: CommandOptionsWrapper;
}

interface UsageOutputParams {
  usages: UsageLocation[];
  baseDir: string;
  targetLocation: LocationRange;
  options?: CommandOptions;
}

export class UsageOutputHandler {
  private selectOutputHandler = new SelectOutputHandler();

  outputUsages(params: UsageOutputParams): void {
    const collection = new UsageCollection(params.usages, params.targetLocation);
    if (collection.isEmpty) {
      this.outputNoSymbolMessage();
      return;
    }
    
    const context = this.createOutputContext(params.baseDir, params.options);
    this.outputUsageResults(collection, context);
  }

  private createOutputContext(baseDir: string, options?: CommandOptions): OutputContext {
    return { 
      baseDir, 
      options: new CommandOptionsWrapper(options || {}) 
    };
  }

  private outputNoSymbolMessage(): void {
    process.stdout.write('Symbol not found at specified location\n');
  }

  private outputUsageResults(collection: UsageCollection, context: OutputContext): void {
    this.outputDeclaration(collection.declaration, context);
    this.outputUsagesSection(collection.otherUsages, collection.declaration, context);
  }

  private outputDeclaration(declaration: UsageLocation | undefined, context: OutputContext): void {
    if (declaration) {
      process.stdout.write('Declaration:\n');
      const declarationResults = [this.convertToSelectResult(declaration, context)];
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
    const writeUsages = otherUsages.filter(usage => usage.usageType === 'write');
    const readUsages = otherUsages.filter(usage => usage.usageType === 'read');
    
    if (writeUsages.length > 0) {
      this.outputReadWriteSeparatedUsages(writeUsages, readUsages, context);
    } else {
      this.outputSimpleUsages(otherUsages, context);
    }
  }

  private outputReadWriteSeparatedUsages(writeUsages: UsageLocation[], readUsages: UsageLocation[], context: OutputContext): void {
    process.stdout.write('\nWrite Usages:\n');
    const writeResults = writeUsages.map(usage => this.convertToSelectResult(usage, context));
    this.selectOutputHandler.outputResults(writeResults);
    
    if (readUsages.length > 0) {
      process.stdout.write('\nRead Usages:\n');
      const readResults = readUsages.map(usage => this.convertToSelectResult(usage, context));
      this.selectOutputHandler.outputResults(readResults);
    }
  }

  private outputSimpleUsages(usages: UsageLocation[], context: OutputContext): void {
    process.stdout.write('\n');
    process.stdout.write('Usages:\n');
    const usageResults = usages.map(usage => this.convertToSelectResult(usage, context));
    this.selectOutputHandler.outputResults(usageResults);
  }

  private convertToSelectResult(usage: UsageLocation, context: OutputContext): SelectResult {
    const result = this.createBasicSelectResult(usage, context);
    this.applyFormattingToResult(result, usage, context);
    return result;
  }

  private createBasicSelectResult(usage: UsageLocation, context: OutputContext): SelectResult {
    return {
      location: usage.location.formatLocation(context.baseDir),
      content: usage.text
    };
  }

  private applyFormattingToResult(result: SelectResult, usage: UsageLocation, context: OutputContext): void {
    if (context.options.shouldIncludeLine()) {
      this.applyIncludeLineFormatting(result, usage, context.baseDir);
    } else if (context.options.shouldPreviewLine()) {
      result.context = this.extractContextFromLocation(usage);
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

}
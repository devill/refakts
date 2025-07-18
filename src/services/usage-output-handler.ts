import { UsageLocation, LocationRange } from '../core/location-range';
import { SelectResult } from '../types/selection-types';
import { SelectOutputHandler } from './selection/output-handler';
import { CommandOptions, CommandOptionsWrapper } from '../command';
import { UsageCollection } from '../core/usage-collection';
import { ConsoleOutput } from '../interfaces/ConsoleOutput';

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
  private selectOutputHandler: SelectOutputHandler;

  constructor(private consoleOutput: ConsoleOutput) {
    this.selectOutputHandler = new SelectOutputHandler(consoleOutput);
  }

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
    this.consoleOutput.write('Symbol not found at specified location\n');
  }

  private outputUsageResults(collection: UsageCollection, context: OutputContext): void {
    this.outputDeclaration(collection.declaration, context);
    this.outputUsagesSection(collection.otherUsages, collection.declaration, context);
  }

  private outputDeclaration(declaration: UsageLocation | undefined, context: OutputContext): void {
    if (declaration) {
      this.consoleOutput.write('Declaration:\n');
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
    this.consoleOutput.write('\nWrite Usages:\n');
    const writeResults = writeUsages.map(usage => this.convertToSelectResult(usage, context));
    this.selectOutputHandler.outputResults(writeResults);
    
    if (readUsages.length > 0) {
      this.consoleOutput.write('\nRead Usages:\n');
      const readResults = readUsages.map(usage => this.convertToSelectResult(usage, context));
      this.selectOutputHandler.outputResults(readResults);
    }
  }

  private outputSimpleUsages(usages: UsageLocation[], context: OutputContext): void {
    this.consoleOutput.write('\n');
    this.consoleOutput.write('Usages:\n');
    const usageResults = usages.map(usage => this.convertToSelectResult(usage, context));
    this.selectOutputHandler.outputResults(usageResults);
  }

  private convertToSelectResult(usage: UsageLocation, context: OutputContext): SelectResult {
    return this.applyFormattingToResult(usage, context);
  }

  private createBasicSelectResult(usage: UsageLocation, context: OutputContext): SelectResult {
    return new SelectResult(
      usage.location.formatLocation(context.baseDir),
      usage.text
    );
  }

  private applyFormattingToResult(usage: UsageLocation, context: OutputContext): SelectResult {
    if (context.options.shouldIncludeLine()) {
      return this.createIncludeLineResult(usage, context.baseDir);
    } else if (context.options.shouldPreviewLine()) {
      return this.createPreviewLineResult(usage, context);
    }
    return this.createBasicSelectResult(usage, context);
  }

  private createPreviewLineResult(usage: UsageLocation, context: OutputContext): SelectResult {
    const contextStr = this.extractContextFromLocation(usage);
    return new SelectResult(
      usage.location.formatLocation(context.baseDir),
      usage.text,
      contextStr
    );
  }

  private createIncludeLineResult(usage: UsageLocation, baseDir: string): SelectResult {
    const fullLine = this.extractContextFromLocation(usage);
    const location = this.formatLineLocation(usage.location, baseDir);
    return new SelectResult(location, fullLine);
  }

  private extractContextFromLocation(usage: UsageLocation): string {
    try {
      const targetLine = this.readTargetLine(usage);
      return targetLine ? this.addSymbolsToContext(targetLine, usage) : '';
    } catch {
      return '';
    }
  }

  private readTargetLine(usage: UsageLocation): string | undefined {
    const fs = require('fs');
    const sourceContent = fs.readFileSync(usage.location.file, 'utf8');
    const lines = sourceContent.split('\n');
    return lines[usage.location.start.line - 1];
  }

  private addSymbolsToContext(line: string, usage: UsageLocation): string {
    const startCol = usage.location.start.column - 1;
    const endCol = usage.location.end.column - 1;
    
    const before = line.substring(0, startCol);
    const matched = line.substring(startCol, endCol);
    const after = line.substring(endCol);
    
    return `${before}≫${matched}≪${after}`;
  }

  private formatLineLocation(location: LocationRange, baseDir: string): string {
    const path = require('path');
    const relativePath = path.relative(baseDir, location.file);
    return `[${relativePath} ${location.start.line}:-${location.start.line}:]`;
  }

}
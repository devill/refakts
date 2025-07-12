import { RefactoringCommand, CommandOptions } from '../command';
import { LocationParser, LocationRange } from '../core/location-parser';
import { ASTService } from '../services/ast-service';
import { CrossFileReferenceFinder } from '../services/cross-file-reference-finder';
import { UsageLocation } from '../core/location-types';
import * as path from 'path';

export class FindUsagesCommand implements RefactoringCommand {
  readonly name = 'find-usages';
  readonly description = 'Find all usages of a symbol across files';
  readonly complete = false;
  
  private astService = new ASTService();
  
  async execute(targetLocation: string, options: CommandOptions): Promise<void> {
    const finalOptions = this.processTarget(targetLocation, options);
    this.validateOptions(finalOptions);
    
    try {
      await this.executeFinUsagesOperation(finalOptions);
    } catch (error) {
      this.handleExecutionError(error);
    }
  }

  private async executeFinUsagesOperation(options: CommandOptions): Promise<void> {
    const location = options.location as LocationRange;
    
    const sourceFile = this.astService.loadSourceFile(location.file);
    const project = this.astService.getProject();
    const finder = new CrossFileReferenceFinder(project);
    
    const result = await finder.findAllReferences(location, sourceFile);
    this.outputResults(result.usages, process.cwd(), location);
  }

  private getProjectDirectory(filePath: string): string {
    const absolutePath = path.resolve(filePath);
    return path.dirname(absolutePath);
  }

  private outputResults(usages: UsageLocation[], baseDir: string, targetLocation: LocationRange): void {
    for (const usage of this.sortUsages(usages, targetLocation)) {
      const formattedLocation = this.formatUsageLocation(usage, baseDir);
      // eslint-disable-next-line no-console
      console.log(`${formattedLocation} ${usage.text}`);
    }
  }

  private formatUsageLocation(usage: UsageLocation, baseDir: string): string {
    return usage.location.formatLocation(baseDir);
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
    return usage.location.matchesTarget(targetLocation.file, targetLocation.startLine);
  }

  private handleExecutionError(error: unknown): void {
    if (error instanceof Error) {
      process.stderr.write(`Error: ${error.message}\n`);
    } else {
      process.stderr.write(`Error: ${error}\n`);
    }
    process.exit(1);
  }

  private processTarget(target: string, options: CommandOptions): CommandOptions {
    return LocationParser.processTarget(target, options) as CommandOptions;
  }
  
  validateOptions(options: CommandOptions): void {
    if (!options.location) {
      throw new Error('Location format must be specified');
    }
  }
  
  getHelpText(): string {
    return '\nExamples:\n  refakts find-usages "[src/file.ts 10:5-10:10]"\n  refakts find-usages "[src/file.ts 3:15-3:20]"';
  }
}
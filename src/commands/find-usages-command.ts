import { RefactoringCommand, CommandOptions } from '../command';
import { LocationParser, LocationRange } from '../core/location-parser';
import { ASTService } from '../services/ast-service';
import { CrossFileReferenceFinder, UsageLocation } from '../services/cross-file-reference-finder';
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
      let relativePath = path.relative(baseDir, usage.filePath);
      
      if (relativePath.includes('input.received/')) {
        relativePath = relativePath.replace(/.*input\.received\//, 'input/');
      }
      
      const location = `[${relativePath} ${usage.line}:${usage.column}-${usage.endLine}:${usage.endColumn}]`;
      // eslint-disable-next-line no-console
      console.log(`${location} ${usage.text}`);
    }
  }

  private sortUsages(usages: UsageLocation[], targetLocation: LocationRange): UsageLocation[] {
    return usages.sort((a, b) => {
      const aIsDefinition = this.isTargetLocation(a, targetLocation);
      const bIsDefinition = this.isTargetLocation(b, targetLocation);
      
      if (aIsDefinition && !bIsDefinition) return -1;
      if (!aIsDefinition && bIsDefinition) return 1;
      
      if (a.filePath !== b.filePath) {
        return a.filePath.localeCompare(b.filePath);
      }
      return a.line - b.line;
    });
  }

  private isTargetLocation(usage: UsageLocation, targetLocation: LocationRange): boolean {
    const normalizedUsagePath = path.resolve(usage.filePath);
    const normalizedTargetPath = path.resolve(targetLocation.file);
    return normalizedUsagePath === normalizedTargetPath && usage.line === targetLocation.startLine;
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
    if (LocationParser.isLocationFormat(target)) {
      const location = LocationParser.parseLocation(target);
      return { ...options, location };
    }
    
    return { ...options, target };
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
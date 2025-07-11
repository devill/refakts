import { RefactoringCommand, CommandOptions } from '../command';
import { LocationParser, LocationRange } from '../core/location-parser';
import { ASTService } from '../services/ast-service';
import { CrossFileReferenceFinder, UsageLocation } from '../services/cross-file-reference-finder';
import { SymbolResolver } from '../locators/symbol-resolver';
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
    
    // For now, use a simple approach like variable-locator
    // Create a new project and try to load all related files
    const project = new (require('ts-morph').Project)();
    const finder = new CrossFileReferenceFinder(project);
    
    const result = await finder.findAllReferences(location);
    this.outputResults(result.usages, path.dirname(location.file));
  }

  private getProjectDirectory(filePath: string): string {
    const absolutePath = path.resolve(filePath);
    return path.dirname(absolutePath);
  }

  private outputResults(usages: UsageLocation[], projectDir: string): void {
    for (const usage of usages) {
      const relativePath = path.relative(projectDir, usage.filePath);
      const formattedPath = relativePath.startsWith('..') ? usage.filePath : relativePath;
      
      const location = `[${formattedPath} ${usage.line}:${usage.column}-${usage.endLine}:${usage.endColumn}]`;
      // eslint-disable-next-line no-console
      console.log(`${location} ${usage.text}`);
    }
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
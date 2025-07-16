import {CommandOptions, RefactoringCommand} from '../command';
import {LocationParser, LocationRange, UsageLocation} from '../core/location-range';
import {ASTService} from '../services/ast-service';
import {CrossFileReferenceFinder} from '../services/cross-file-reference-finder';
import {ProjectScopeService} from '../services/project-scope-service';
import {UsageOutputHandler} from '../services/usage-output-handler';
import {SourceFile} from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

export class FindUsagesCommand implements RefactoringCommand {
  readonly name = 'find-usages';
  readonly description = 'Find all usages of a symbol across files';
  readonly complete = true;
  private astService = new ASTService();
  private projectScopeService = new ProjectScopeService(this.astService.getProject());
  private outputHandler = new UsageOutputHandler();
  
  async execute(targetLocation: string, options: CommandOptions): Promise<void> {
    const finalOptions = this.processTarget(targetLocation, options);
    this.validateOptions(finalOptions);
    
    await this.executeFinUsagesOperation(finalOptions);
  }

  private async executeFinUsagesOperation(options: CommandOptions): Promise<void> {
    const location = LocationRange.from(options.location as LocationRange);
    const sourceFile = this.validateSourceFile(location);
    const usages = await this.findReferences(location, sourceFile);
    this.outputHandler.outputUsages(usages, process.cwd(), location);
  }

  private validateSourceFile(location: LocationRange): SourceFile {
    const sourceFile = this.astService.loadSourceFile(location.file);
    this.checkForCompilationErrors(sourceFile, location.file);
    location.validateLocationBounds(sourceFile);
    return sourceFile;
  }

  private checkForCompilationErrors(sourceFile: SourceFile, fileName: string): void {
    const diagnostics = sourceFile.getPreEmitDiagnostics();
    if (diagnostics.length > 0) {
      throw new Error(`TypeScript compilation error in ${fileName}`);
    }
  }

  private async findReferences(location: LocationRange, sourceFile: SourceFile) {
    const finder = this.createReferenceFinder(location);
    try {
      const result = await finder.findAllReferences(location, sourceFile);
      return result.usages;
    } catch (error) {
      return this.handleFindReferencesError(error);
    }
  }

  private createReferenceFinder(location: LocationRange) {
    const project = this.astService.getProject();
    const finder = new CrossFileReferenceFinder(project);
    const scopeDirectory = this.projectScopeService.determineScopeDirectory(location.file);
    return { findAllReferences: (loc: LocationRange, sf: SourceFile) => finder.findAllReferences(loc, sf, scopeDirectory) };
  }

  private handleFindReferencesError(error: unknown): UsageLocation[] {
    if (error instanceof Error && error.message.includes('No symbol found at location')) {
      return [];
    }
    throw error;
  }


  private processTarget(target: string, options: CommandOptions): CommandOptions {
    return LocationParser.processTarget(target, options) as CommandOptions;
  }
  
  validateOptions(options: CommandOptions): void {
    if (!options.location) {
      throw new Error('Location format must be specified');
    }

    LocationRange.from(options.location as LocationRange).validateRange();
  }

  getHelpText(): string {
    try {
      const helpFilePath = path.join(__dirname, 'find-usages.help.txt');
      return '\n' + fs.readFileSync(helpFilePath, 'utf8');
    } catch {
      return '\nHelp file not found';
    }
  }
}
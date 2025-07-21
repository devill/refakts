import {LocationRange, UsageLocation} from '../core/location-range';
import {ASTService} from './ast-service';
import {CrossFileReferenceFinder} from './cross-file-reference-finder';
import {ProjectScopeService} from './project-scope-service';
import {SourceFile} from 'ts-morph';

export class UsageFinderService {
  private astService = new ASTService();
  private projectScopeService = new ProjectScopeService(this.astService.getProject());

  async findUsages(location: LocationRange): Promise<UsageLocation[]> {
    const sourceFile = this.validateSourceFile(location);
    return await this.findReferences(location, sourceFile);
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

  private async findReferences(location: LocationRange, sourceFile: SourceFile): Promise<UsageLocation[]> {
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
}
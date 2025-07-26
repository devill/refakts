import {LocationRange, UsageLocation} from '../ast/location-range';
import {ASTService} from '../ast/ast-service';
import {CrossFileReferenceFinder} from './cross-file-reference-finder';
import {ProjectScopeService} from './project-scope-service';
import {PositionConverter} from './position-converter';
import {SourceFile, Node} from 'ts-morph';

export class UsageFinderService {
  private astService?: ASTService;
  private projectScopeService?: ProjectScopeService;

  async findUsages(location: LocationRange): Promise<UsageLocation[]> {
    this.astService = ASTService.createForFile(location.file);
    this.projectScopeService = new ProjectScopeService(this.astService.getProject());
    const sourceFile = this.validateSourceFile(location);
    return await this.findReferences(location, sourceFile);
  }

  private validateSourceFile(location: LocationRange): SourceFile {
    if (!this.astService) {
      throw new Error('ASTService not initialized');
    }
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
    try {
      const targetNode = this.extractNodeFromLocation(sourceFile, location);
      const scopeDirectory = this.projectScopeService?.determineScopeDirectory(location.file);
      
      if (!this.astService) {
        throw new Error('ASTService not initialized');
      }
      const finder = new CrossFileReferenceFinder(this.astService.getProject());
      const nodes = finder.findAllReferences(targetNode, scopeDirectory);
      
      return nodes.map(node => PositionConverter.createUsageLocation(node.getSourceFile(), node));
    } catch (error) {
      return this.handleFindReferencesError(error);
    }
  }

  private extractNodeFromLocation(sourceFile: SourceFile, location: LocationRange): Node {
    const startPos = PositionConverter.getStartPosition(sourceFile, location);
    const node = sourceFile.getDescendantAtPos(startPos);
    if (!node) {
      throw new Error(`No symbol found at location ${location.start.line}:${location.start.column}`);
    }
    const symbol = node.getSymbol();
    if (!symbol) {
      throw new Error(`No symbol found at location ${location.start.line}:${location.start.column}`);
    }
    return node;
  }

  private handleFindReferencesError(error: unknown): UsageLocation[] {
    if (error instanceof Error && error.message.includes('No symbol found at location')) {
      return [];
    }
    throw error;
  }
}
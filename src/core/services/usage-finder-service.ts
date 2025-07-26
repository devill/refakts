import {LocationRange, UsageLocation} from '../ast/location-range';
import {ASTService} from '../ast/ast-service';
import {CrossFileReferenceFinder} from './reference-finding/cross-file-reference-finder';
import {ProjectScopeService} from './project-scope-service';
import {PositionConverter} from './position-converter';
import {Node, SourceFile} from 'ts-morph';

export class UsageFinderService {
  private location: LocationRange
  private astService: ASTService;
  private projectScopeService: ProjectScopeService;

  constructor(location: LocationRange) {
    this.location = location;
    this.astService = ASTService.createForFile(location.file);
    this.projectScopeService = new ProjectScopeService(this.astService.getProject());
  }
  
  static async find(location: LocationRange): Promise<UsageLocation[]> {
    return (new UsageFinderService(location)).findUsages();
  }

  async findUsages(): Promise<UsageLocation[]> {
    return await this.findReferences(this.location, this.validateSourceFile(this.location));
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
    try {
      return new CrossFileReferenceFinder(this.astService.getProject())
          .findAllReferences(
              this.extractNodeFromLocation(sourceFile, location),
              this.projectScopeService?.determineScopeDirectory(location.file)
          ).map(node => PositionConverter.createUsageLocation(node.getSourceFile(), node));
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
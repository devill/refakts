import {Node, Project, SourceFile, SyntaxKind} from 'ts-morph';
import {LocationRange} from '../core/location-parser';
import {FileSystemHelper} from './file-system-helper';
import {PositionConverter} from './position-converter';
import {UsageLocation} from '../core/location-types';


export interface FindUsagesResult {
  symbol: string;
  definition: UsageLocation | null;
  usages: UsageLocation[];
}

export class CrossFileReferenceFinder {
  private fileSystemHelper: FileSystemHelper;

  constructor(private _project: Project) {
    this.fileSystemHelper = new FileSystemHelper(_project);
  }

  async findAllReferences(location: LocationRange, sourceFile?: SourceFile): Promise<FindUsagesResult> {
    this.fileSystemHelper.loadProjectFiles(location.file);
    const symbol = this.extractSymbolFromLocation(this.resolveSourceFile(location.file, sourceFile), location);
    const usages = this.findUsagesInProject(symbol);
    const definition = usages.length > 0 ? usages[0] : null;
    return { symbol, definition, usages };
  }

  private resolveSourceFile(filePath: string, sourceFile?: SourceFile): SourceFile {
    return sourceFile || this.getOrLoadSourceFile(filePath);
  }

  private getOrLoadSourceFile(filePath: string): SourceFile {
    const existingFile = this._project.getSourceFile(filePath);
    if (existingFile) {
      return existingFile;
    }
    return this.loadSourceFileAtPath(filePath);
  }

  private loadSourceFileAtPath(filePath: string): SourceFile {
    try {
      return this._project.addSourceFileAtPath(filePath);
    } catch {
      throw new Error(`File not found: ${filePath}`);
    }
  }

  private extractSymbolFromLocation(sourceFile: SourceFile, location: LocationRange): string {
    const node = this.findNodeAtLocation(sourceFile, location);
    if (!node) {
      throw new Error(`No symbol found at location ${location.startLine}:${location.startColumn}`);
    }
    return this.getSymbolFromNode(node);
  }


  private findNodeAtLocation(sourceFile: SourceFile, location: LocationRange): Node | null {
    const startPos = PositionConverter.getStartPosition(sourceFile, location);
    return sourceFile.getDescendantAtPos(startPos) || null;
  }

  private getSymbolFromNode(node: Node): string {
    if (node.getKind() === SyntaxKind.Identifier) {
      return node.getText();
    }
    
    const firstIdentifier = node.getChildrenOfKind(SyntaxKind.Identifier)[0];
    return firstIdentifier ? firstIdentifier.getText() : node.getText();
  }

  private findUsagesInProject(symbolName: string): UsageLocation[] {
    const usages: UsageLocation[] = [];
    
    for (const sourceFile of this._project.getSourceFiles()) {
      const fileUsages = this.findUsagesInFile(sourceFile, symbolName);
      usages.push(...fileUsages);
    }
    
    return usages;
  }

  private findUsagesInFile(sourceFile: SourceFile, symbolName: string): UsageLocation[] {
    return sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
      .filter(identifier => identifier.getText() === symbolName)
      .map(identifier => PositionConverter.createUsageLocation(sourceFile, identifier));
  }

}
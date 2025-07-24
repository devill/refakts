import {Node, Project, SourceFile, SyntaxKind} from 'ts-morph';
import {LocationRange, UsageLocation} from '../ast/location-range';
import {FileSystemHelper} from '../../services/file-system-helper';
import {PositionConverter} from '../../services/position-converter';


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

  async findAllReferences(location: LocationRange, sourceFile?: SourceFile, scopeDirectory?: string): Promise<FindUsagesResult> {
    this.fileSystemHelper.loadProjectFiles(location.file);
    const symbol = this.extractSymbolFromLocation(this.resolveSourceFile(location.file, sourceFile), location);
    const usages = this.findUsagesInProject(symbol, scopeDirectory);
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
      throw new Error(`No symbol found at location ${location.start.line}:${location.start.column}`);
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

  private findUsagesInProject(symbolName: string, scopeDirectory?: string): UsageLocation[] {
    const usages: UsageLocation[] = [];
    
    for (const sourceFile of this.getFilteredSourceFiles(scopeDirectory)) {
      const fileUsages = this.findUsagesInFile(sourceFile, symbolName);
      usages.push(...fileUsages);
    }
    
    return usages;
  }

  private getFilteredSourceFiles(scopeDirectory?: string): SourceFile[] {
    const allFiles = this._project.getSourceFiles();
    return scopeDirectory ? this.filterFilesByScope(allFiles, scopeDirectory) : allFiles;
  }

  private filterFilesByScope(files: SourceFile[], scopeDirectory: string): SourceFile[] {
    const normalizedScope = require('path').resolve(scopeDirectory);
    return files.filter(file => this.isFileInScope(file, normalizedScope));
  }

  private isFileInScope(sourceFile: SourceFile, normalizedScope: string): boolean {
    return sourceFile.getFilePath().startsWith(normalizedScope);
  }

  private findUsagesInFile(sourceFile: SourceFile, symbolName: string): UsageLocation[] {
    return sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
      .filter(identifier => identifier.getText() === symbolName)
      .map(identifier => PositionConverter.createUsageLocation(sourceFile, identifier));
  }

}
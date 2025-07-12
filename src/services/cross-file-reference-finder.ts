import {Node, Project, SourceFile, SyntaxKind} from 'ts-morph';
import {LocationRange} from '../core/location-parser';
import * as path from 'path';

export interface UsageLocation {
  filePath: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  text: string;
}

export interface FindUsagesResult {
  symbol: string;
  definition: UsageLocation | null;
  usages: UsageLocation[];
}

export class CrossFileReferenceFinder {
  constructor(private _project: Project) {}

  async findAllReferences(location: LocationRange, sourceFile?: SourceFile): Promise<FindUsagesResult> {
    const projectDir = this.findProjectRoot(location.file);
    this.loadAllFilesInDirectory(projectDir);
    
    if (!sourceFile) {
      sourceFile = this._project.getSourceFile(location.file);
      if (!sourceFile) {
        try {
          sourceFile = this._project.addSourceFileAtPath(location.file);
        } catch {
          throw new Error(`File not found: ${location.file}`);
        }
      }
    }

    const node = this.findNodeAtLocation(sourceFile, location);
    if (!node) {
      throw new Error(`No symbol found at location ${location.startLine}:${location.startColumn}`);
    }

    const symbol = this.getSymbolFromNode(node);
    const usages = this.findUsagesInProject(symbol);
    
    return {
      symbol,
      definition: usages.length > 0 ? usages[0] : null,
      usages
    };
  }

  private loadAllFilesInDirectory(dir: string): void {
    const fs = require('fs');
    const path = require('path');
    
    if (!fs.existsSync(dir)) {
      return;
    }
    
    const entries = fs.readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && entry !== 'node_modules' && entry !== 'dist') {
        this.loadAllFilesInDirectory(fullPath);
      } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
        try {
          this._project.addSourceFileAtPath(fullPath);
        } catch {
          continue;
        }
      }
    }
  }

  private findNodeAtLocation(sourceFile: SourceFile, location: LocationRange): Node | null {
    const startPos = sourceFile.compilerNode.getPositionOfLineAndCharacter(
      location.startLine - 1,
      location.startColumn - 1
    );
    
    return sourceFile.getDescendantAtPos(startPos) || null;
  }

  private getSymbolFromNode(node: Node): string {
    if (node.getKind() === SyntaxKind.Identifier) {
      return node.getText();
    }
    
    const identifiers = node.getChildrenOfKind(SyntaxKind.Identifier);
    if (identifiers.length > 0) {
      return identifiers[0].getText();
    }
    
    return node.getText();
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
    const usages: UsageLocation[] = [];
    
    sourceFile.getDescendantsOfKind(SyntaxKind.Identifier).forEach((identifier) => {
      if (identifier.getText() === symbolName) {
        const start = sourceFile.getLineAndColumnAtPos(identifier.getStart());
        const end = sourceFile.getLineAndColumnAtPos(identifier.getEnd());
        
        usages.push({
          filePath: sourceFile.getFilePath(),
          line: start.line,
          column: start.column,
          endLine: end.line,
          endColumn: end.column,
          text: identifier.getText()
        });
      }
    });
    
    return usages;
  }

  private findProjectRoot(filePath: string): string {
    let currentDir = path.dirname(path.resolve(filePath));
    let foundRoot = null;

    const cwd = process.cwd();
    
    while (currentDir !== path.dirname(currentDir) && (currentDir === cwd || currentDir.startsWith(cwd))) {
      const tsConfigPath = path.join(currentDir, 'tsconfig.json');
      if (require('fs').existsSync(tsConfigPath)) {
        foundRoot = currentDir;
        break;
      }
      currentDir = path.dirname(currentDir);
    }
    
    return foundRoot || path.dirname(path.resolve(filePath));
  }
}
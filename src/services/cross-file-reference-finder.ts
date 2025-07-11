import { Project, Node, SyntaxKind } from 'ts-morph';
import { LocationRange } from '../core/location-parser';
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
  constructor(private project: Project) {}

  async findAllReferences(location: LocationRange): Promise<FindUsagesResult> {
    // Load all TypeScript files in the directory and subdirectories
    const projectDir = path.dirname(location.file);
    this.loadAllFilesInDirectory(projectDir);
    
    // First try to get the source file, if not found, add it to the project
    let sourceFile = this.project.getSourceFile(location.file);
    if (!sourceFile) {
      try {
        sourceFile = this.project.addSourceFileAtPath(location.file);
      } catch (error) {
        throw new Error(`File not found: ${location.file}`);
      }
    }

    const node = this.findNodeAtLocation(sourceFile, location);
    if (!node) {
      throw new Error(`No symbol found at location ${location.startLine}:${location.startColumn}`);
    }

    const symbol = this.getSymbolFromNode(node);
    
    // Use a simple approach for now: find all identifiers with the same name
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
      
      if (stat.isDirectory()) {
        this.loadAllFilesInDirectory(fullPath);
      } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
        try {
          this.project.addSourceFileAtPath(fullPath);
        } catch (error) {
          // Ignore files that can't be loaded
        }
      }
    }
  }

  private findNodeAtLocation(sourceFile: any, location: LocationRange): Node | null {
    const startPos = sourceFile.compilerNode.getPositionOfLineAndCharacter(
      location.startLine - 1,
      location.startColumn - 1
    );
    
    return sourceFile.getDescendantAtPos(startPos);
  }

  private getSymbolFromNode(node: Node): string {
    // Extract symbol name from different node types
    if (node.getKind() === SyntaxKind.Identifier) {
      return node.getText();
    }
    
    // For other node types, try to find the identifier
    const identifiers = node.getChildrenOfKind(SyntaxKind.Identifier);
    if (identifiers.length > 0) {
      return identifiers[0].getText();
    }
    
    return node.getText();
  }

  private findUsagesInProject(symbolName: string): UsageLocation[] {
    const usages: UsageLocation[] = [];
    
    for (const sourceFile of this.project.getSourceFiles()) {
      const fileUsages = this.findUsagesInFile(sourceFile, symbolName);
      usages.push(...fileUsages);
    }
    
    return usages;
  }

  private findUsagesInFile(sourceFile: any, symbolName: string): UsageLocation[] {
    const usages: UsageLocation[] = [];
    
    sourceFile.getDescendantsOfKind(SyntaxKind.Identifier).forEach((identifier: any) => {
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
}